/**
 * Grades the location photos (incoming-assets/locations/*.jpg, Pexels) to the site's blue hour and
 * writes 1200×900 AVIFs to public/assets/locations/.
 *
 *   node scripts/locations/build.mjs
 *
 * Daylight photos get a strong grade (sky to Thames blue, stone warm); night photos a light one,
 * so all eight cards read as the same evening.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { blend, gradeRamp, verticalExposure } from '../hero/grade.mjs'
import { guidedFilter, levels, luminance, readGray, readRGB, writeImage } from '../hero/lib.mjs'

const IN = 'incoming-assets/locations'
const OUT = 'public/assets/locations'
const W = 1200
const H = 900

/** Night photos: a light unifying grade (ink shadows, Thames mids, warm lamplit highlights). */
const RAMP = [
  [0, '#05080f'],
  [0.3, '#10213a'],
  [0.58, '#2c4d72'],
  [0.8, '#a8865a'],
  [1, '#f1dfba'],
]
/** Daylight photos are relit: the sky becomes blue hour, stone becomes floodlit. */
const RAMP_SKY = [
  [0, '#060c1a'],
  [0.35, '#0f2342'],
  [0.7, '#24497a'],
  [1, '#6f8fb8'],
]
const RAMP_STONE = [
  [0, '#05070b'],
  [0.4, '#1b2130'],
  [0.7, '#6e5134'],
  [0.9, '#c79a5c'],
  [1, '#f3dcaa'],
]

/** strength: 0 = untouched … 1 = full grade. focus: crop centre as a fraction of width/height. */
const PHOTOS = [
  { slug: 'tower-of-london', relight: true, focus: [0.45, 0.55] },
  { slug: 'the-shard', strength: 0.3, focus: [0.4, 0.5] },
  { slug: 'st-pauls', strength: 0.3, focus: [0.5, 0.45] },
  { slug: 'covent-garden', relight: true, focus: [0.5, 0.5] },
  { slug: 'westminster-abbey', relight: true, focus: [0.5, 0.5] },
  { slug: 'trafalgar-square', strength: 0.3, focus: [0.45, 0.55] },
  { slug: 'buckingham-palace', relight: true, focus: [0.55, 0.5] },
]

await mkdir(OUT, { recursive: true })
await mkdir('assets-src/work/locations', { recursive: true })

for (const p of PHOTOS) {
  const src = path.join(IN, `${p.slug}.jpg`)
  const meta = await sharp(src).rotate().metadata()
  // 4:3 crop around the focus point, then resize to the card size.
  const scale = Math.min(meta.width / W, meta.height / H)
  const cw = Math.round(W * scale)
  const ch = Math.round(H * scale)
  const left = Math.max(0, Math.min(meta.width - cw, Math.round(meta.width * p.focus[0] - cw / 2)))
  const top = Math.max(0, Math.min(meta.height - ch, Math.round(meta.height * p.focus[1] - ch / 2)))
  const tmp = path.join('assets-src/work/locations', `${p.slug}-crop.png`)
  await sharp(src)
    .rotate()
    .extract({ left, top, width: cw, height: ch })
    .resize(W, H)
    .png()
    .toFile(tmp)

  const { rgb } = await readRGB(tmp)
  const n = W * H
  let out
  if (p.relight) {
    // Sky from a monocular depth map (sky reads as exactly 0), snapped to edges with a guided filter.
    const depthFile = path.join('assets-src/work/locations', `${p.slug}-depth.png`)
    if (!existsSync(depthFile)) {
      const { pipeline, env } = await import('@huggingface/transformers')
      env.cacheDir = path.resolve('.cache/models')
      const depth = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
        dtype: 'fp32',
      })
      await (await depth(tmp)).depth.save(depthFile)
    }
    const depth = await readGray(depthFile, { w: W, h: H })
    const raw = depth.map((v) => (v * 255 < 1 ? 1 : 0))
    const sky = levels(guidedFilter(luminance(rgb, W, H), raw, W, H, 6, 2e-4), 0.15, 0.85)
    const skyRGB = gradeRamp(rgb, sky, n, RAMP_SKY, { keepChroma: 0.05, gamma: 1.1 })
    verticalExposure(skyRGB, W, H, 0.6, 1.05, 0, Math.round(H * 0.7))
    const ground = sky.map((v) => 1 - v)
    const stone = gradeRamp(rgb, ground, n, RAMP_STONE, { keepChroma: 0.12, gamma: 1.05 })
    out = blend(stone, skyRGB, sky, n)
  } else {
    const graded = gradeRamp(rgb, new Float32Array(n).fill(1), n, RAMP, { keepChroma: 0.3 })
    out = blend(rgb, graded, new Float32Array(n).fill(p.strength), n)
  }
  await writeImage(path.join(OUT, `${p.slug}.avif`), out, W, H, null, { quality: 62 })
  console.log('wrote', p.slug)
}
