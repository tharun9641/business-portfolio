/**
 * Offline 2× super-resolution with Swin2SR (Apache-2.0 upstream; ONNX export by Xenova), tiled so
 * memory stays bounded. Dev-only (DECISIONS D-17).
 */
import {
  AutoProcessor,
  RawImage,
  Swin2SRForImageSuperResolution,
  env,
} from '@huggingface/transformers'
import path from 'node:path'
import sharp from 'sharp'

env.cacheDir = path.resolve('.cache/models')
const MODEL = 'Xenova/swin2SR-classical-sr-x2-64'
const TILE = 256
const OVERLAP = 24
let loaded

async function load() {
  loaded ??= Promise.all([
    Swin2SRForImageSuperResolution.from_pretrained(MODEL, { dtype: 'fp32' }),
    AutoProcessor.from_pretrained(MODEL),
  ])
  return loaded
}

async function upscaleTile(rgb, w, h) {
  const [model, processor] = await load()
  const inputs = await processor(new RawImage(rgb, w, h, 3))
  const { reconstruction } = await model(inputs)
  const out = await RawImage.fromTensor(
    reconstruction.squeeze().clamp_(0, 1).mul_(255).round_().to('uint8'),
  )
  // The processor pads to a multiple of the window size; crop back to exactly 2×.
  return (await out.crop([0, 0, w * 2 - 1, h * 2 - 1])).data
}

/** Upscales an image file 2× and writes it to `out` (format from extension). */
export async function upscale2x(file, out) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = info
  const acc = new Float32Array(W * 2 * H * 2 * 3)
  const wsum = new Float32Array(W * 2 * H * 2)
  const step = TILE - OVERLAP * 2
  for (let ty = 0; ty < H; ty += step) {
    for (let tx = 0; tx < W; tx += step) {
      const x0 = Math.max(0, Math.min(tx - OVERLAP, W - TILE))
      const y0 = Math.max(0, Math.min(ty - OVERLAP, H - TILE))
      const tw = Math.min(TILE, W)
      const th = Math.min(TILE, H)
      const tile = new Uint8ClampedArray(tw * th * 3)
      for (let y = 0; y < th; y++) {
        tile.set(data.subarray(((y0 + y) * W + x0) * 3, ((y0 + y) * W + x0 + tw) * 3), y * tw * 3)
      }
      const up = await upscaleTile(tile, tw, th)
      // Feathered weights hide tile seams.
      for (let y = 0; y < th * 2; y++) {
        const wy = Math.min(1, (Math.min(y, th * 2 - 1 - y) + 1) / (OVERLAP * 2))
        for (let x = 0; x < tw * 2; x++) {
          const wx = Math.min(1, (Math.min(x, tw * 2 - 1 - x) + 1) / (OVERLAP * 2))
          const k = wx * wy
          const d = (y0 * 2 + y) * W * 2 + x0 * 2 + x
          const s = (y * tw * 2 + x) * 3
          acc[d * 3] += up[s] * k
          acc[d * 3 + 1] += up[s + 1] * k
          acc[d * 3 + 2] += up[s + 2] * k
          wsum[d] += k
        }
      }
    }
  }
  const buf = Buffer.alloc(acc.length)
  for (let i = 0; i < wsum.length; i++) {
    for (let c = 0; c < 3; c++) buf[i * 3 + c] = Math.round(acc[i * 3 + c] / wsum[i])
  }
  await sharp(buf, { raw: { width: W * 2, height: H * 2, channels: 3 } }).toFile(out)
}
