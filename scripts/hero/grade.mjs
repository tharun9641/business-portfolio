/**
 * Art-directed blue-hour grade (DECISIONS D-20, route A). Each layer maps its own luminance through
 * a palette ramp built from the design tokens, so structure and texture come from the photo and
 * colour comes from the brand palette. Lights are added as separate passes.
 */
import { clamp01 } from './lib.mjs'

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

/** Palette ramps, dark → light. Stops: [t, '#rrggbb']. */
export const RAMPS = {
  sky: [
    [0, '#050a18'],
    [0.3, '#0c1d3a'],
    [0.6, '#173562'],
    [0.85, '#2c5384'],
    [1, '#6f8fb8'],
  ],
  skyline: [
    [0, '#05080f'],
    [0.5, '#121e30'],
    [1, '#3a4f68'],
  ],
  stoneLit: [
    [0, '#0d0a08'],
    [0.3, '#3a2614'],
    [0.62, '#9a6630'],
    [0.85, '#e0a85a'],
    [1, '#f6dca6'],
  ],
  steelBlue: [
    [0, '#05090f'],
    [0.6, '#173049'],
    [1, '#4f7d9c'],
  ],
  hull: [
    [0, '#03060b'],
    [0.6, '#111c2b'],
    [1, '#3a4a5e'],
  ],
  embankment: [
    [0, '#050608'],
    [0.5, '#1d1a1a'],
    [0.8, '#4a3a2c'],
    [1, '#8a6a48'],
  ],
  water: [
    [0, '#03060c'],
    [0.5, '#0d1a2b'],
    [0.85, '#1f3a56'],
    [1, '#3e5c7a'],
  ],
}

function ramp(stops, t) {
  const s = stops.map(([p, c]) => [p, hex(c)])
  if (t <= s[0][0]) return s[0][1]
  for (let i = 1; i < s.length; i++) {
    if (t <= s[i][0]) {
      const [p0, c0] = s[i - 1]
      const [p1, c1] = s[i]
      const k = (t - p0) / (p1 - p0)
      return c0.map((v, j) => v + (c1[j] - v) * k)
    }
  }
  return s.at(-1)[1]
}

const lum = (rgb, i) => 0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2]

/** Luminance percentiles inside a mask, for normalising each layer's tonal range. */
export function percentiles(rgb, mask, n, lo = 0.02, hi = 0.98) {
  const hist = new Uint32Array(1024)
  let total = 0
  for (let i = 0; i < n; i++) {
    if (mask[i] < 0.5) continue
    hist[Math.min(1023, Math.floor(lum(rgb, i) * 1023))]++
    total++
  }
  const find = (q) => {
    let acc = 0
    for (let b = 0; b < 1024; b++) {
      acc += hist[b]
      if (acc >= q * total) return b / 1023
    }
    return 1
  }
  return [find(lo), find(hi)]
}

/**
 * Maps luminance through a ramp. `keepChroma` blends back a little of the source hue so the image
 * does not read as a duotone. `gamma` < 1 lifts mid-tones.
 */
export function gradeRamp(rgb, mask, n, stops, { keepChroma = 0.12, gamma = 1, range } = {}) {
  const [lo, hi] = range ?? percentiles(rgb, mask, n)
  const table = Array.from({ length: 256 }, (_, k) => ramp(stops, k / 255))
  const out = new Float32Array(rgb.length)
  for (let i = 0; i < n; i++) {
    if (mask[i] <= 0) continue
    const L = lum(rgb, i)
    const t = clamp01((L - lo) / Math.max(1e-3, hi - lo)) ** gamma
    const c = table[Math.round(t * 255)]
    for (let k = 0; k < 3; k++) {
      const chroma = rgb[i * 3 + k] - L
      out[i * 3 + k] = clamp01(c[k] + chroma * keepChroma)
    }
  }
  return out
}

/** Vertical exposure ramp: multiplies rows by a factor interpolated from top to bottom. */
export function verticalExposure(rgb, w, h, top, bottom, fromY = 0, toY = h) {
  for (let y = 0; y < h; y++) {
    const k = top + (bottom - top) * clamp01((y - fromY) / (toY - fromY))
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3
      rgb[i] *= k
      rgb[i + 1] *= k
      rgb[i + 2] *= k
    }
  }
  return rgb
}

/** Adds a soft coloured light (screen blend) centred at (cx, cy). */
export function addLight(rgb, w, h, cx, cy, radius, colour, strength, mask) {
  const c = hex(colour)
  const x0 = Math.max(0, Math.floor(cx - radius * 3))
  const x1 = Math.min(w, Math.ceil(cx + radius * 3))
  const y0 = Math.max(0, Math.floor(cy - radius * 3))
  const y1 = Math.min(h, Math.ceil(cy + radius * 3))
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = y * w + x
      const m = mask ? mask[i] : 1
      if (m <= 0) continue
      const d2 = ((x - cx) ** 2 + (y - cy) ** 2) / (radius * radius)
      const a = strength * Math.exp(-d2) * m
      for (let k = 0; k < 3; k++) {
        const v = rgb[i * 3 + k]
        rgb[i * 3 + k] = 1 - (1 - v) * (1 - c[k] * a)
      }
    }
  }
  return rgb
}

/** Blends two graded buffers by a per-pixel weight (0 → a, 1 → b). */
export function blend(a, b, weight, n) {
  const out = Float32Array.from(a)
  for (let i = 0; i < n; i++) {
    const k = weight[i]
    if (k > 0)
      for (let c = 0; c < 3; c++) out[i * 3 + c] = a[i * 3 + c] * (1 - k) + b[i * 3 + c] * k
  }
  return out
}

/** 0..1 weight for painted blue steel (blue clearly above red), to keep it blue under warm light. */
export function blueness(rgb, n) {
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) out[i] = clamp01((rgb[i * 3 + 2] - rgb[i * 3] - 0.04) * 6)
  return out
}
