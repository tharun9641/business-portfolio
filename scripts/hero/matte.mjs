/**
 * Offline foreground matting with BiRefNet (MIT) via transformers.js. Dev-only (DECISIONS D-09).
 * The model is downloaded once from Hugging Face into .cache/models.
 */
import { AutoModel, AutoProcessor, RawImage, env } from '@huggingface/transformers'
import path from 'node:path'
import sharp from 'sharp'

env.cacheDir = path.resolve('.cache/models')
env.allowLocalModels = false

const MODEL = process.env.MATTE_MODEL ?? 'onnx-community/BiRefNet_lite-ONNX'
let loaded

async function load() {
  loaded ??= Promise.all([
    AutoModel.from_pretrained(MODEL, { dtype: 'fp32' }),
    AutoProcessor.from_pretrained(MODEL),
  ])
  return loaded
}

/**
 * Returns a single-channel alpha mask (Buffer, width×height) for the salient subject of an RGB image.
 * @param {Buffer} rgb raw RGB pixels
 */
export async function matte(rgb, width, height) {
  const [model, processor] = await load()
  const image = new RawImage(new Uint8ClampedArray(rgb), width, height, 3)
  const { pixel_values } = await processor(image)
  const { output_image } = await model({ input_image: pixel_values })
  const mask = await RawImage.fromTensor(output_image[0].sigmoid().mul(255).to('uint8')).resize(
    width,
    height,
  )
  return Buffer.from(mask.data)
}

/** Mattes a region of an image file; returns { alpha, width, height }. */
export async function matteRegion(file, region) {
  const { data, info } = await sharp(file)
    .extract(region)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    alpha: await matte(data, info.width, info.height),
    width: info.width,
    height: info.height,
  }
}
