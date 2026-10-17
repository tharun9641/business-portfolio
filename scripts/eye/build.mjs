/**
 * Builds the London Eye background layers and subsection images (docs/ASSETS.md → London Eye).
 *
 *   node scripts/eye/build.mjs
 *
 * Inputs : assets-src/generated/eye/master.jpg  (flux.1.1-pro master; upscaled 2× with Swin2SR into
 *                                                 assets-src/work/eye/master-2x.png on first run)
 *          assets-src/generated/eye/sub-0N.jpg  (flux.1.1-pro subsection images)
 * Outputs: public/assets/eye/{sky.avif, far-bank.webp, water.avif, sub-0N.avif}
 */
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {
  boxMean,
  guidedFilter,
  invert,
  levels,
  luminance,
  pushPullFill,
  readGray,
  readRGB,
  writeImage,
} from '../hero/lib.mjs'

const WORK = 'assets-src/work/eye'
const GENERATED = 'assets-src/generated/eye'
const OUT = 'public/assets/eye'
const MASTER = path.join(WORK, 'master-2x.png')
const log = (...a) => console.log(`[eye ${(performance.now() / 1000).toFixed(1)}s]`, ...a)

await mkdir(OUT, { recursive: true })
await mkdir(WORK, { recursive: true })
if (!existsSync(MASTER)) {
  const { upscale2x } = await import('../lib/upscale.mjs')
  await upscale2x(path.join(GENERATED, 'master.jpg'), MASTER)
}

const { rgb, w: W, h: H } = await readRGB(MASTER)
const N = W * H

// Depth (cached). Sky reads as exactly 0.
const depthFile = path.join(WORK, 'depth.png')
if (!existsSync(depthFile)) {
  const { pipeline, env } = await import('@huggingface/transformers')
  env.cacheDir = path.resolve('.cache/models')
  const depth = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
    dtype: 'fp32',
  })
  await (await depth(MASTER)).depth.save(depthFile)
}
const depth = await readGray(depthFile, { w: W, h: H })
log('depth ready')

// Warm the clock faces: the generator lit them green; the real ones glow warm white-gold.
const CLOCK = { x0: 2360, x1: 2560, y0: 500, y1: 640 }
for (let y = CLOCK.y0; y < CLOCK.y1; y++) {
  for (let x = CLOCK.x0; x < CLOCK.x1; x++) {
    const i = y * W + x
    const [r, g, b] = [rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]
    if (g > r * 1.02 && g > b * 1.3 && g > 0.2) {
      rgb[i * 3] = g
      rgb[i * 3 + 1] = g * 0.84
      rgb[i * 3 + 2] = Math.min(b, g * 0.55)
    }
  }
}

const guide = luminance(rgb, W, H)
/** First row of open water, below Westminster Bridge's deck (≈77% of the frame). */
const WATERLINE = Math.round(H * 0.77)
const rowOf = (i) => Math.floor(i / W)

const notSkyRaw = depth.map((v, i) => (v * 255 >= 1 || rowOf(i) >= WATERLINE ? 1 : 0))
const farBank = levels(guidedFilter(guide, notSkyRaw, W, H, 4, 2e-4), 0.15, 0.85)
const sky = invert(farBank)

// Erode before filling so soft edges and window lights never bleed into the plate as ghosts.
const skyKnown = boxMean(sky, W, H, 14).map((v) => (v > 0.999 ? 1 : 0))
const skyPlate = pushPullFill(rgb, skyKnown, W, H)
await writeImage(path.join(OUT, 'sky.avif'), skyPlate, W, H, null, { quality: 70 })
log('sky')

// Far bank: buildings, bridge and the strip of river under the arches; transparent above.
const farBankAlpha = farBank.map((v, i) => (rowOf(i) < WATERLINE + 40 ? v : 1))
await writeImage(path.join(OUT, 'far-bank.webp'), rgb, W, H, farBankAlpha)
log('far bank')

// Water: opaque from just above the waterline down, feathered so it hides the far bank's foot.
const waterAlpha = Float32Array.from({ length: N }, (_, i) =>
  Math.min(1, Math.max(0, (rowOf(i) - (WATERLINE - 24)) / 48)),
)
await writeImage(path.join(OUT, 'water.webp'), rgb, W, H, waterAlpha)
log('water')

for (let n = 1; n <= 5; n++) {
  const src = path.join(GENERATED, `sub-0${n}.jpg`)
  if (existsSync(src))
    await sharp(src)
      .avif({ quality: 62, effort: 6 })
      .toFile(path.join(OUT, `sub-0${n}.avif`))
}
log('subsection images')

// Placeholders (docs/ASSETS.md): generated once pollen is topped up.
if (!existsSync(path.join(GENERATED, 'sub-05.jpg'))) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1152" height="1440">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1220"/><stop offset="0.7" stop-color="#1c3550"/><stop offset="1" stop-color="#3e5c7a"/>
    </linearGradient><radialGradient id="l" cx="0.3" cy="0.75" r="0.5">
      <stop offset="0" stop-color="#e8b65a" stop-opacity="0.55"/><stop offset="1" stop-color="#e8b65a" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="1152" height="1440" fill="url(#g)"/><rect width="1152" height="1440" fill="url(#l)"/></svg>`
  await sharp(Buffer.from(svg))
    .flatten()
    .avif({ quality: 60 })
    .toFile(path.join(OUT, 'sub-05.avif'))
}
if (!existsSync(path.join(OUT, 'foreground.webp'))) {
  await sharp('public/assets/shared/template/foreground.png')
    .webp({ quality: 90 })
    .toFile(path.join(OUT, 'foreground.webp'))
}
log('done')
