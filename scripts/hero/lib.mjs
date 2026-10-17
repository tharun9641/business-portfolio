/**
 * Image maths for the offline asset pipeline: masks, guided-filter edge refinement, push-pull hole
 * filling and Lab colour transfer. Plain typed arrays, no dependencies beyond sharp for I/O.
 */
import sharp from 'sharp'

/** @returns {Promise<{ rgb: Float32Array, w: number, h: number }>} rgb in 0..1, interleaved */
export async function readRGB(file, size) {
  let img = sharp(file).removeAlpha()
  if (size) img = img.resize(size.w, size.h, { fit: 'fill' })
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
  const rgb = new Float32Array(data.length)
  for (let i = 0; i < data.length; i++) rgb[i] = data[i] / 255
  return { rgb, w: info.width, h: info.height }
}

/** @returns {Promise<Float32Array>} single channel 0..1 */
export async function readGray(file, size) {
  let img = sharp(file).greyscale()
  if (size) img = img.resize(size.w, size.h, { fit: 'fill' })
  const { data } = await img.raw().toBuffer({ resolveWithObject: true })
  return Float32Array.from(data, (v) => v / 255)
}

export function luminance(rgb, w, h) {
  const out = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    out[i] = 0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2]
  }
  return out
}

/** Anti-aliased polygon mask (0..1). Points in canvas px. */
export async function polygonMask(polys, w, h) {
  const paths = polys
    .map((pts) => `<polygon points="${pts.map(([x, y]) => `${x},${y}`).join(' ')}" fill="#fff"/>`)
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/>${paths}</svg>`
  return readGray(Buffer.from(svg), { w, h })
}

/** O(n) box mean of radius r using a summed-area table. */
export function boxMean(src, w, h, r) {
  const sat = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let row = 0
    for (let x = 0; x < w; x++) {
      row += src[y * w + x]
      sat[(y + 1) * (w + 1) + x + 1] = sat[y * (w + 1) + x + 1] + row
    }
  }
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r)
    const y1 = Math.min(h, y + r + 1)
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r)
      const x1 = Math.min(w, x + r + 1)
      const s =
        sat[y1 * (w + 1) + x1] -
        sat[y0 * (w + 1) + x1] -
        sat[y1 * (w + 1) + x0] +
        sat[y0 * (w + 1) + x0]
      out[y * w + x] = s / ((x1 - x0) * (y1 - y0))
    }
  }
  return out
}

/**
 * Guided filter (He et al.): snaps a soft mask `p` to the edges of guide image `I`.
 * Small eps keeps edges crisp; r sets how far a mask edge may move.
 */
export function guidedFilter(I, p, w, h, r = 8, eps = 1e-4) {
  const n = w * h
  const Ip = new Float32Array(n)
  const II = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    Ip[i] = I[i] * p[i]
    II[i] = I[i] * I[i]
  }
  const mI = boxMean(I, w, h, r)
  const mp = boxMean(p, w, h, r)
  const mIp = boxMean(Ip, w, h, r)
  const mII = boxMean(II, w, h, r)
  const a = new Float32Array(n)
  const b = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const cov = mIp[i] - mI[i] * mp[i]
    const varI = mII[i] - mI[i] * mI[i]
    a[i] = cov / (varI + eps)
    b[i] = mp[i] - a[i] * mI[i]
  }
  const ma = boxMean(a, w, h, r)
  const mb = boxMean(b, w, h, r)
  const q = new Float32Array(n)
  for (let i = 0; i < n; i++) q[i] = clamp01(ma[i] * I[i] + mb[i])
  return q
}

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Hardens a refined mask: values below lo → 0, above hi → 1, smooth between. */
export function levels(m, lo = 0.1, hi = 0.9) {
  return m.map((v) => {
    const t = clamp01((v - lo) / (hi - lo))
    return t * t * (3 - 2 * t)
  })
}

export function multiply(...masks) {
  const out = Float32Array.from(masks[0])
  for (const m of masks.slice(1)) for (let i = 0; i < out.length; i++) out[i] *= m[i]
  return out
}

export function invert(m) {
  return m.map((v) => 1 - v)
}

/** Union by max. */
export function union(...masks) {
  const out = Float32Array.from(masks[0])
  for (const m of masks.slice(1))
    for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i], m[i])
  return out
}

/** Subtract b from a. */
export function subtract(a, b) {
  return a.map((v, i) => v * (1 - b[i]))
}

/**
 * Push-pull hole filling: pixels with weight 0 are filled from a pyramid of weighted averages of the
 * known pixels, giving smooth, colour-continuous plates behind cut-out objects.
 */
export function pushPullFill(rgb, weight, w, h) {
  const levelsArr = [{ rgb: premultiply(rgb, weight), wt: Float32Array.from(weight), w, h }]
  while (levelsArr.at(-1).w > 1 || levelsArr.at(-1).h > 1) {
    const prev = levelsArr.at(-1)
    const nw = Math.ceil(prev.w / 2)
    const nh = Math.ceil(prev.h / 2)
    const nrgb = new Float32Array(nw * nh * 3)
    const nwt = new Float32Array(nw * nh)
    for (let y = 0; y < prev.h; y++) {
      for (let x = 0; x < prev.w; x++) {
        const s = y * prev.w + x
        const d = (y >> 1) * nw + (x >> 1)
        nwt[d] += prev.wt[s]
        nrgb[d * 3] += prev.rgb[s * 3]
        nrgb[d * 3 + 1] += prev.rgb[s * 3 + 1]
        nrgb[d * 3 + 2] += prev.rgb[s * 3 + 2]
      }
    }
    // Normalise weights to 0..1 again so coarse levels act as confidence.
    for (let i = 0; i < nw * nh; i++) {
      if (nwt[i] > 0) {
        const k = Math.min(1, nwt[i]) / nwt[i]
        nrgb[i * 3] *= k
        nrgb[i * 3 + 1] *= k
        nrgb[i * 3 + 2] *= k
        nwt[i] = Math.min(1, nwt[i])
      }
    }
    levelsArr.push({ rgb: nrgb, wt: nwt, w: nw, h: nh })
  }
  // Pull: fill each level's missing weight from the (already filled) coarser level, premultiplied.
  for (let l = levelsArr.length - 2; l >= 0; l--) {
    const fine = levelsArr[l]
    const coarse = levelsArr[l + 1]
    for (let y = 0; y < fine.h; y++) {
      for (let x = 0; x < fine.w; x++) {
        const i = y * fine.w + x
        const a = fine.wt[i]
        if (a >= 1) continue
        const cx = Math.min(coarse.w - 1, Math.max(0, (x + 0.5) / 2 - 0.5))
        const cy = Math.min(coarse.h - 1, Math.max(0, (y + 0.5) / 2 - 0.5))
        const c = bilinear3(coarse.rgb, coarse.w, coarse.h, cx, cy)
        const ca = bilinear1(coarse.wt, coarse.w, coarse.h, cx, cy)
        const k = 1 - a
        fine.rgb[i * 3] += c[0] * k
        fine.rgb[i * 3 + 1] += c[1] * k
        fine.rgb[i * 3 + 2] += c[2] * k
        fine.wt[i] = a + ca * k
      }
    }
  }
  const base = levelsArr[0]
  const out = new Float32Array(w * h * 3)
  for (let i = 0; i < w * h; i++) {
    const a = base.wt[i] || 1
    out[i * 3] = base.rgb[i * 3] / a
    out[i * 3 + 1] = base.rgb[i * 3 + 1] / a
    out[i * 3 + 2] = base.rgb[i * 3 + 2] / a
  }
  return out
}

function premultiply(rgb, wt) {
  const out = new Float32Array(rgb.length)
  for (let i = 0; i < wt.length; i++) {
    out[i * 3] = rgb[i * 3] * wt[i]
    out[i * 3 + 1] = rgb[i * 3 + 1] * wt[i]
    out[i * 3 + 2] = rgb[i * 3 + 2] * wt[i]
  }
  return out
}

function bilinear1(a, w, h, x, y) {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(w - 1, x0 + 1)
  const y1 = Math.min(h - 1, y0 + 1)
  const fx = Math.max(0, x - x0)
  const fy = Math.max(0, y - y0)
  return (
    a[y0 * w + x0] * (1 - fx) * (1 - fy) +
    a[y0 * w + x1] * fx * (1 - fy) +
    a[y1 * w + x0] * (1 - fx) * fy +
    a[y1 * w + x1] * fx * fy
  )
}

function bilinear3(a, w, h, x, y) {
  const x0 = Math.max(0, Math.floor(x))
  const y0 = Math.max(0, Math.floor(y))
  const x1 = Math.min(w - 1, x0 + 1)
  const y1 = Math.min(h - 1, y0 + 1)
  const fx = Math.max(0, x - x0)
  const fy = Math.max(0, y - y0)
  const out = [0, 0, 0]
  for (let c = 0; c < 3; c++) {
    out[c] =
      a[(y0 * w + x0) * 3 + c] * (1 - fx) * (1 - fy) +
      a[(y0 * w + x1) * 3 + c] * fx * (1 - fy) +
      a[(y1 * w + x0) * 3 + c] * (1 - fx) * fy +
      a[(y1 * w + x1) * 3 + c] * fx * fy
  }
  return out
}

// --- Lab colour transfer (Reinhard) ---------------------------------------------------------------

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055)

function rgbToLab(r, g, b) {
  r = srgbToLinear(r)
  g = srgbToLinear(g)
  b = srgbToLinear(b)
  let x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047
  let y = 0.2126 * r + 0.7152 * g + 0.0722 * b
  let z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  x = f(x)
  y = f(y)
  z = f(z)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

function labToRgb(L, a, bb) {
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - bb / 200
  const finv = (t) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787)
  const x = finv(fx) * 0.95047
  const y = finv(fy)
  const z = finv(fz) * 1.08883
  const r = 3.2406 * x - 1.5372 * y - 0.4986 * z
  const g = -0.9689 * x + 1.8758 * y + 0.0415 * z
  const b = 0.0557 * x - 0.204 * y + 1.057 * z
  return [
    clamp01(linearToSrgb(clamp01(r))),
    clamp01(linearToSrgb(clamp01(g))),
    clamp01(linearToSrgb(clamp01(b))),
  ]
}

function labStats(rgb, mask, n) {
  const sum = [0, 0, 0]
  const sq = [0, 0, 0]
  let wsum = 0
  for (let i = 0; i < n; i++) {
    const m = mask[i]
    if (m < 0.5) continue
    const lab = rgbToLab(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2])
    for (let c = 0; c < 3; c++) {
      sum[c] += lab[c]
      sq[c] += lab[c] * lab[c]
    }
    wsum++
  }
  const mean = sum.map((s) => s / wsum)
  const std = sq.map((s, c) => Math.sqrt(Math.max(1e-6, s / wsum - mean[c] * mean[c])))
  return { mean, std }
}

/**
 * Transfers the colour statistics of `ref` (inside refMask) onto `src` (inside srcMask).
 * `strength` blends with the original; `lumaScale` lets the reference contrast through partially.
 */
export function colourTransfer(
  src,
  srcMask,
  ref,
  refMask,
  n,
  refN,
  { strength = 1, lumaScale = 1 } = {},
) {
  const s = labStats(src, srcMask, n)
  const r = labStats(ref, refMask, refN)
  const out = Float32Array.from(src)
  for (let i = 0; i < n; i++) {
    const m = srcMask[i] * strength
    if (m <= 0) continue
    const lab = rgbToLab(src[i * 3], src[i * 3 + 1], src[i * 3 + 2])
    const t = lab.map((v, c) => {
      const k = (r.std[c] / s.std[c]) * (c === 0 ? lumaScale : 1) + (c === 0 ? 1 - lumaScale : 0)
      return (v - s.mean[c]) * k + r.mean[c]
    })
    const rgb = labToRgb(t[0], t[1], t[2])
    for (let c = 0; c < 3; c++) out[i * 3 + c] = src[i * 3 + c] * (1 - m) + rgb[c] * m
  }
  return out
}

/** Writes RGB(+alpha) float buffers to an image file; format from the extension. */
export async function writeImage(file, rgb, w, h, alpha, opts = {}) {
  const ch = alpha ? 4 : 3
  const buf = Buffer.alloc(w * h * ch)
  for (let i = 0; i < w * h; i++) {
    buf[i * ch] = Math.round(clamp01(rgb[i * 3]) * 255)
    buf[i * ch + 1] = Math.round(clamp01(rgb[i * 3 + 1]) * 255)
    buf[i * ch + 2] = Math.round(clamp01(rgb[i * 3 + 2]) * 255)
    if (alpha) buf[i * ch + 3] = Math.round(clamp01(alpha[i]) * 255)
  }
  let img = sharp(buf, { raw: { width: w, height: h, channels: ch } })
  if (file.endsWith('.avif')) img = img.avif({ quality: opts.quality ?? 72, effort: 6 })
  else if (file.endsWith('.webp'))
    img = img.webp({ quality: opts.quality ?? 90, alphaQuality: 95, effort: 6 })
  else if (file.endsWith('.jpg')) img = img.jpeg({ quality: opts.quality ?? 88, mozjpeg: true })
  else img = img.png({ compressionLevel: 9 })
  await img.toFile(file)
}

export async function writeMask(file, m, w, h) {
  const buf = Buffer.from(m.map((v) => Math.round(clamp01(v) * 255)))
  await sharp(buf, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toFile(file)
}
