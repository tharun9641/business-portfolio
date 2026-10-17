/**
 * Builds the Tower Bridge hero layers from the PM photo (docs/ASSETS.md → Hero).
 *
 *   node scripts/hero/build.mjs
 *
 * Inputs : incoming-assets/hero/tower-bridge.jpg
 *          assets-src/generated/hero/kontext-nodeck-crop.jpg  (what lies behind the bascules)
 * Caches : assets-src/work/hero/{depth,mask-bridge}.png  (ML passes; delete to recompute)
 * Outputs: public/assets/hero/*  +  assets-src/work/hero/preview-*.jpg
 */
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { BASCULES, BRIDGE_CROP, CANVAS, DEPTH, LAMPS, PIERS_CROP, REGIONS } from './geometry.mjs'
import {
  addLight,
  blend,
  blueness,
  gradeRamp,
  percentiles,
  RAMPS,
  verticalExposure,
} from './grade.mjs'
import {
  guidedFilter,
  invert,
  levels,
  luminance,
  multiply,
  polygonMask,
  pushPullFill,
  readGray,
  readRGB,
  subtract,
  union,
  writeImage,
  writeMask,
} from './lib.mjs'

const SRC = 'incoming-assets/hero/tower-bridge.jpg'
/** Rows below this are where pier posts stand in open water. */
const PIERS_SPLIT_Y = 1770
const WORK = 'assets-src/work/hero'
const GENERATED = 'assets-src/generated/hero'
const OUT = 'public/assets/hero'
const { w: W, h: H } = CANVAS
const N = W * H

const log = (...a) => console.log(`[hero ${(performance.now() / 1000).toFixed(1)}s]`, ...a)

await mkdir(WORK, { recursive: true })
await mkdir(OUT, { recursive: true })

// --- ML passes (cached) ---------------------------------------------------------------------------

async function ensureDepth() {
  const file = path.join(WORK, 'depth.png')
  if (!existsSync(file)) {
    const { pipeline, env } = await import('@huggingface/transformers')
    env.cacheDir = path.resolve('.cache/models')
    const depth = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', {
      dtype: 'fp32',
    })
    const out = await depth(SRC)
    await out.depth.save(file)
  }
  return readGray(file, CANVAS)
}

/** BiRefNet salient-object mask for one crop, placed on the full canvas (cached). */
async function ensureBirefMask(name, c) {
  const file = path.join(WORK, `mask-${name}.png`)
  if (!existsSync(file)) {
    const { AutoModel, AutoProcessor, RawImage, env } = await import('@huggingface/transformers')
    env.cacheDir = path.resolve('.cache/models')
    const id = 'onnx-community/BiRefNet_lite-ONNX'
    const model = await AutoModel.from_pretrained(id, { dtype: 'fp32' })
    const processor = await AutoProcessor.from_pretrained(id)
    const image = await (
      await RawImage.read(SRC)
    ).crop([c.left, c.top, c.left + c.width - 1, c.top + c.height - 1])
    const { pixel_values } = await processor(image)
    const { output_image } = await model({ input_image: pixel_values })
    const mask = await RawImage.fromTensor(output_image[0].sigmoid().mul(255).to('uint8')).resize(
      c.width,
      c.height,
    )
    const full = Buffer.alloc(N)
    for (let y = 0; y < c.height; y++) {
      full.set(mask.data.subarray(y * c.width, (y + 1) * c.width), (c.top + y) * W + c.left)
    }
    await sharp(full, { raw: { width: W, height: H, channels: 1 } })
      .png()
      .toFile(file)
  }
  return readGray(file, CANVAS)
}

// --- Masks ----------------------------------------------------------------------------------------

log('reading source')
const { rgb: src } = await readRGB(SRC)
const guide = luminance(src, W, H)
const depth = await ensureDepth()
log('depth ready')
const bridgeRaw = await ensureBirefMask('bridge-raw', BRIDGE_CROP)
const piersRaw = await ensureBirefMask('piers-raw', PIERS_CROP)
log('bridge mask ready')

const threshold = (m, t) => m.map((v) => (v * 255 >= t ? 1 : 0))
const refine = (m, r = 6, eps = 2e-4) => levels(guidedFilter(guide, m, W, H, r, eps), 0.15, 0.85)

const above = (y0) => Float32Array.from({ length: N }, (_, i) => (Math.floor(i / W) < y0 ? 1 : 0))
const notSky = refine(union(threshold(depth, DEPTH.sky), invert(above(REGIONS.horizonY + 60))), 4)
const sky = invert(notSky)
log('sky mask')

const [deckL, deckR, belfastPoly, piersPoly, embankPoly] = await Promise.all([
  polygonMask([BASCULES.left.polygon], W, H),
  polygonMask([BASCULES.right.polygon], W, H),
  polygonMask([REGIONS.belfast], W, H),
  polygonMask([REGIONS.piers], W, H),
  polygonMask([REGIONS.embankment], W, H),
])
const deck = union(deckL, deckR)

const bridge = subtract(multiply(refine(levels(bridgeRaw, 0.3, 0.7), 4), notSky), deck)
const embankment = multiply(embankPoly, notSky)
// Above the deck line the polygon alone decides (masts read as 'far' in depth); below it, depth
// separates the hull and moorings from the far bank.
const belfastDepth = union(above(1560), refine(threshold(depth, DEPTH.belfastLow), 8))
const belfast = subtract(multiply(belfastPoly, notSky, belfastDepth), bridge)
// Above the gangways, depth separates structure from the far bank. Below them, depth cannot tell
// posts from open water, so BiRefNet decides (it isolates posts and pier buildings, not water).
const piersDepth = multiply(piersPoly, notSky, refine(threshold(depth, DEPTH.piers), 6))
const piersLow = levels(piersRaw, 0.35, 0.65)
const piersMask = piersDepth.map((v, i) =>
  Math.floor(i / W) < PIERS_SPLIT_Y ? v : v * piersLow[i],
)
const piers = subtract(subtract(piersMask, union(bridge, deck)), union(belfast, embankment))
const nearer = union(bridge, deck, belfast, piers, embankment)
const skyline = multiply(subtract(notSky, nearer), above(REGIONS.horizonY + 40))
log('layer masks')

for (const [name, m] of Object.entries({
  sky,
  bridge,
  deck,
  belfast,
  piers,
  embankment,
  skyline,
})) {
  await writeMask(path.join(WORK, `mask-${name}.png`), m, W, H)
}

// --- Plates (fill what parallax will reveal) ------------------------------------------------------

const skyPlate = pushPullFill(
  src,
  sky.map((v) => (v > 0.98 ? 1 : 0)),
  W,
  H,
)
log('sky plate filled')

// Water: everything at or below the horizon that no nearer layer claims.
const waterKnown = Float32Array.from({ length: N }, (_, i) =>
  Math.floor(i / W) >= REGIONS.horizonY && nearer[i] < 0.02 && skyline[i] < 0.02 ? 1 : 0,
)
const waterPlate = pushPullFill(src, waterKnown, W, H)
const waterAlpha = Float32Array.from({ length: N }, (_, i) => {
  const y = Math.floor(i / W)
  return Math.min(1, Math.max(0, (y - (REGIONS.horizonY - 30)) / 30))
})
log('water plate filled')

// Skyline: the photo, plus what lies behind the deck (from the deck-removed Kontext crop).
const behindDeck = await (async () => {
  const crop = { left: 1500, top: 1250, width: 1300, height: 650 }
  const patch = await sharp(path.join(GENERATED, 'kontext-nodeck-crop.jpg'))
    .resize(crop.width, crop.height, { fit: 'fill' })
    .toBuffer()
  const full = await sharp(SRC)
    .composite([{ input: patch, left: crop.left, top: crop.top }])
    .toBuffer()
  return (await readRGB(full)).rgb
})()
const deckFill = refine(deck, 3) // soft edge so the patch blends into the far bank
const skylineRGB = Float32Array.from(src)
for (let i = 0; i < N; i++) {
  const k = deckFill[i]
  if (k > 0)
    for (let c = 0; c < 3; c++)
      skylineRGB[i * 3 + c] = src[i * 3 + c] * (1 - k) + behindDeck[i * 3 + c] * k
}
// Behind the nearer layers, continue the far bank down to the river so that, when Belfast, the
// piers and the embankment drift apart, they uncover dark far-bank fill rather than empty sky.
const FAR_TOP = 1480
const farBand = Float32Array.from({ length: N }, (_, i) => {
  const y = Math.floor(i / W)
  return y < FAR_TOP || y > REGIONS.horizonY + 40 ? 0 : Math.min(1, (y - FAR_TOP) / 40)
})
const behindNearer = subtract(multiply(farBand, nearer), bridge)
const farFill = pushPullFill(
  skylineRGB,
  union(skyline, deck).map((v) => (v > 0.9 ? 1 : 0)),
  W,
  H,
)
for (let i = 0; i < N; i++) {
  const k = behindNearer[i] * (1 - skyline[i])
  if (k > 0)
    for (let c = 0; c < 3; c++)
      skylineRGB[i * 3 + c] = skylineRGB[i * 3 + c] * (1 - k) + farFill[i * 3 + c] * k
}
const skylineAlpha = union(skyline, deckFill, behindNearer)
// The river layer sits above the skyline to hide its lower edge, so it must not cover what the
// skyline and bridge own (the far bank under the bridge, and the gap behind the bascules).
const waterLayerAlpha = subtract(waterAlpha, union(skylineAlpha, bridge))

// --- Grade to blue hour (route A: palette ramps per layer + light passes) -------------------------

const ones = new Float32Array(N).fill(1)

// Sky: cloud structure from the photo, colour from the ramp; darker zenith, dusk glow low and west.
const skyGraded = gradeRamp(skyPlate, ones, N, RAMPS.sky, {
  keepChroma: 0.05,
  gamma: 1.15,
  range: percentiles(src, sky, N),
})
verticalExposure(skyGraded, W, H, 0.62, 1.05, 0, REGIONS.horizonY)
addLight(skyGraded, W, H, -200, REGIONS.horizonY + 150, 1100, '#e8b65a', 0.28)
addLight(skyGraded, W, H, 2150, REGIONS.horizonY, 1100, '#c98a4a', 0.12)
// Below the skyline the sky plate is never meant to be seen; fade it to night so any reveal reads
// as dark far bank instead of pale extrapolated sky.
{
  const ink = [11 / 255, 18 / 255, 32 / 255]
  for (let y = 1420; y < H; y++) {
    const k = Math.min(1, (y - 1420) / 160)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3
      for (let c = 0; c < 3; c++) skyGraded[i + c] = skyGraded[i + c] * (1 - k) + ink[c] * k
    }
  }
}
log('graded sky')

const skylineGraded = gradeRamp(skylineRGB, skylineAlpha, N, RAMPS.skyline, {
  keepChroma: 0.05,
  gamma: 1.3,
})

// Bridge: floodlit stone goes warm gold; the painted blue steel stays blue, dimmer.
const bridgeAll = union(bridge, deck)
const stone = gradeRamp(src, bridgeAll, N, RAMPS.stoneLit, { gamma: 0.9, keepChroma: 0.05 })
const steel = gradeRamp(src, bridgeAll, N, RAMPS.steelBlue, { keepChroma: 0.15 })
const bridgeGraded = blend(stone, steel, blueness(src, N), N)
verticalExposure(bridgeGraded, W, H, 0.78, 1.0, 760, 1650) // floodlights sit low on the towers

const belfastGraded = gradeRamp(src, belfast, N, RAMPS.hull, { keepChroma: 0.06 })
const piersGraded = gradeRamp(src, piers, N, RAMPS.hull, { keepChroma: 0.06, gamma: 1.1 })

const embankGraded = gradeRamp(src, embankment, N, RAMPS.embankment, { keepChroma: 0.1 })
for (const [x, y] of LAMPS) {
  addLight(embankGraded, W, H, x, y, 170, '#e8b65a', 0.22, embankment) // spill on stone and leaves
  addLight(embankGraded, W, H, x, y, 26, '#fff1d0', 1, embankment) // the globe itself
}

const waterGraded = gradeRamp(waterPlate, waterAlpha, N, RAMPS.water, {
  keepChroma: 0.04,
  range: percentiles(src, waterKnown, N),
})
verticalExposure(waterGraded, W, H, 1.0, 0.7, REGIONS.horizonY, H)
log('graded layers')

// --- Write layers ---------------------------------------------------------------------------------

const layers = [
  ['sky.avif', skyGraded, null],
  ['skyline.webp', skylineGraded, skylineAlpha],
  ['towers.webp', bridgeGraded, bridge],
  ['bascule-left.webp', bridgeGraded, deckL],
  ['bascule-right.webp', bridgeGraded, deckR],
  ['water.webp', waterGraded, waterLayerAlpha],
  ['belfast.webp', belfastGraded, belfast],
  ['piers.webp', piersGraded, piers],
  ['embankment.webp', embankGraded, embankment],
]
for (const [file, rgb, alpha] of layers) {
  await writeImage(path.join(OUT, file), rgb, W, H, alpha)
  log('wrote', file)
}

// Composite still: reduced-motion frame, LCP candidate and review image.
let comp = Float32Array.from(skyGraded)
const over = (rgb, a) => {
  for (let i = 0; i < N; i++) {
    const k = a[i]
    if (k > 0)
      for (let c = 0; c < 3; c++) comp[i * 3 + c] = comp[i * 3 + c] * (1 - k) + rgb[i * 3 + c] * k
  }
}
over(skylineGraded, skylineAlpha)
over(bridgeGraded, union(bridge, deck))
over(waterGraded, waterLayerAlpha)
over(belfastGraded, belfast)
over(piersGraded, piers)
over(embankGraded, embankment)
await writeImage(path.join(OUT, 'still.avif'), comp, W, H, null, { quality: 70 })
await writeImage(path.join(WORK, 'preview-composite.jpg'), comp, W, H)

await mkdir('src/content/generated', { recursive: true })
await writeFile(
  'src/content/generated/heroGeometry.json',
  JSON.stringify({ canvas: CANVAS, bascules: BASCULES, lamps: LAMPS }, null, 2) + '\n',
)
log('done')
