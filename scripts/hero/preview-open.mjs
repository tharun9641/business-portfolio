/**
 * Renders the hero with both bascules raised (default 80°) to check leaf cuts, pivots and the
 * fill behind the deck. Output: assets-src/work/hero/preview-open.jpg
 *   node scripts/hero/preview-open.mjs [angle]
 */
import sharp from 'sharp'
import { BASCULES, CANVAS } from './geometry.mjs'

const angle = Number(process.argv[2] ?? 80)
const dir = 'public/assets/hero'

/** Rotates a full-canvas layer about a pivot by padding so the pivot is the image centre. */
async function rotated(file, [px, py], deg) {
  const half = Math.ceil(Math.hypot(CANVAS.w, CANVAS.h))
  const padded = await sharp(`${dir}/${file}`)
    .extend({
      top: half - py,
      bottom: half - (CANVAS.h - py),
      left: half - px,
      right: half - (CANVAS.w - px),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  const turned = await sharp(padded)
    .rotate(deg, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const meta = await sharp(turned).metadata()
  // Crop back so the pivot returns to its canvas position.
  return sharp(turned)
    .extract({
      left: Math.round(meta.width / 2 - px),
      top: Math.round(meta.height / 2 - py),
      width: CANVAS.w,
      height: CANVAS.h,
    })
    .png()
    .toBuffer()
}

const [left, right] = await Promise.all([
  rotated('bascule-left.webp', BASCULES.left.pivot, -angle),
  rotated('bascule-right.webp', BASCULES.right.pivot, angle),
])
const order = [
  'skyline.webp',
  'towers.webp',
  left,
  right,
  'water.webp',
  'belfast.webp',
  'piers.webp',
  'embankment.webp',
]
await sharp(`${dir}/sky.avif`)
  .composite(order.map((l) => ({ input: typeof l === 'string' ? `${dir}/${l}` : l })))
  .jpeg({ quality: 88 })
  .toFile('assets-src/work/hero/preview-open.jpg')
console.log('preview-open.jpg at', angle, 'deg')
