/**
 * Generates the procedural assets and Phase 1 placeholders into public/assets.
 *
 * - shared/mist-{1,2,3}.webp: FINAL assets (DECISIONS D-08). Tileable fractal-noise mist bands.
 * - shared/template/*: PLACEHOLDERS for the _Template demo scene, logged in docs/ASSETS.md.
 *
 * Deterministic: same seed, same pixels. Run with `npm run assets:placeholders`.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const OUT = path.resolve('public/assets')
const C = {
  ink: [11, 18, 32],
  thames: [28, 53, 80],
  dusk: [62, 92, 122],
  stone: [232, 226, 214],
  lamp: [232, 182, 90],
}

function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Value noise that wraps every `period` cells in x, so octaves stay seamlessly tileable. */
function periodicNoise(seed) {
  const r = rng(seed)
  const table = Array.from({ length: 4096 }, r)
  const lattice = (ix, iy, period) =>
    table[((((ix % period) + period) % period) * 61 + ((iy * 131) & 4095)) & 4095]
  const smooth = (t) => t * t * (3 - 2 * t)
  return (x, y, period) => {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = smooth(x - ix)
    const fy = smooth(y - iy)
    const a = lattice(ix, iy, period)
    const b = lattice(ix + 1, iy, period)
    const c = lattice(ix, iy + 1, period)
    const d = lattice(ix + 1, iy + 1, period)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
  }
}

function fbm(noise, u, v, baseCells, octaves) {
  let sum = 0
  let amp = 0.5
  let norm = 0
  for (let o = 0; o < octaves; o++) {
    const cells = baseCells * 2 ** o
    sum += amp * noise(u * cells, v * cells, cells)
    norm += amp
    amp *= 0.5
  }
  return sum / norm
}

const mix = (a, b, t) => a + (b - a) * t
const clamp01 = (t) => Math.min(1, Math.max(0, t))

async function mist(file, seed, { width = 1920, height = 320, density = 0.55 } = {}) {
  const noise = periodicNoise(seed)
  const buf = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y++) {
    const v = y / height
    // Band profile: soft top, fuller middle, soft bottom.
    const band = Math.sin(Math.PI * v) ** 1.6
    for (let x = 0; x < width; x++) {
      const u = x / width
      const n = fbm(noise, u, v * (height / width) * 6, 6, 5)
      const a = clamp01((n - 0.38) * 2.2) * band * density
      const i = (y * width + x) * 4
      buf[i] = C.stone[0]
      buf[i + 1] = C.stone[1]
      buf[i + 2] = C.stone[2]
      buf[i + 3] = Math.round(a * 255)
    }
  }
  await sharp(buf, { raw: { width, height, channels: 4 } })
    .blur(4)
    .webp({ quality: 70, alphaQuality: 80 })
    .toFile(path.join(OUT, file))
}

async function sky(file, { width = 3840, height = 2160 } = {}) {
  const noise = periodicNoise(7)
  const grain = rng(11)
  const buf = Buffer.alloc(width * height * 3)
  for (let y = 0; y < height; y++) {
    const v = y / height
    for (let x = 0; x < width; x++) {
      const u = x / width
      // Ink at the zenith → Thames → dusk at the horizon.
      const t1 = clamp01(v / 0.6)
      const t2 = clamp01((v - 0.6) / 0.4)
      let rgb = C.ink.map((c, k) => mix(mix(c, C.thames[k], t1), C.dusk[k], t2))
      // Low warm glow from the west (left), matching the site-wide light direction.
      const dx = (u - 0.08) / 0.7
      const dy = (v - 1.05) / 0.45
      const glow = Math.exp(-(dx * dx + dy * dy)) * 0.42
      rgb = rgb.map((c, k) => mix(c, C.lamp[k], glow))
      // Soft high cloud.
      const cloud = clamp01((fbm(noise, u, v * 0.56, 3, 5) - 0.5) * 2.5) * (1 - v) * 0.12
      rgb = rgb.map((c, k) => mix(c, C.stone[k], cloud))
      const g = (grain() - 0.5) * 5
      const i = (y * width + x) * 3
      buf[i] = Math.round(rgb[0] + g)
      buf[i + 1] = Math.round(rgb[1] + g)
      buf[i + 2] = Math.round(rgb[2] + g)
    }
  }
  await sharp(buf, { raw: { width, height, channels: 3 } })
    .avif({ quality: 70, effort: 6 })
    .toFile(path.join(OUT, file))
}

function skylineSvg(width = 3840, height = 1100) {
  const r = rng(23)
  const parts = []
  let x = -20
  while (x < width) {
    const w = 70 + r() * 190
    // Taller cluster right of centre, like the City seen from the south bank.
    const centre = Math.exp(-(((x - width * 0.62) / (width * 0.22)) ** 2))
    const h = 160 + r() * 260 + centre * r() * 520
    const top = height - h
    const shade = 12 + Math.round(r() * 8)
    parts.push(
      `<rect x="${x.toFixed(1)}" y="${top.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="rgb(${shade},${shade + 8},${shade + 22})"/>`,
    )
    if (r() < 0.12) {
      const sx = x + w / 2
      parts.push(
        `<polygon points="${sx - 10},${top} ${sx + 10},${top} ${sx},${top - 60 - r() * 80}" fill="rgb(${shade},${shade + 8},${shade + 22})"/>`,
      )
    }
    for (let wy = top + 22; wy < height - 30; wy += 26) {
      for (let wx = x + 12; wx < x + w - 14; wx += 18) {
        if (r() < 0.3) {
          const a = (0.35 + r() * 0.65).toFixed(2)
          parts.push(
            `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="7" height="10" fill="rgb(232,182,90)" fill-opacity="${a}"/>`,
          )
        }
      }
    }
    x += w + r() * 12
  }
  // A dome on the left of the cluster.
  parts.push(`<rect x="1180" y="${height - 420}" width="300" height="420" fill="rgb(14,22,36)"/>`)
  parts.push(`<ellipse cx="1330" cy="${height - 420}" rx="120" ry="130" fill="rgb(14,22,36)"/>`)
  parts.push(`<rect x="1318" y="${height - 610}" width="24" height="70" fill="rgb(14,22,36)"/>`)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgb(62,92,122)" stop-opacity="0"/>
      <stop offset="1" stop-color="rgb(62,92,122)" stop-opacity="0.35"/></linearGradient></defs>
    ${parts.join('')}
    <rect width="${width}" height="${height}" fill="url(#haze)"/></svg>`
}

function foregroundSvg(width = 2400, height = 1600) {
  const iron = 'rgb(7,11,19)'
  const balusters = []
  for (let x = 20; x < width; x += 64) {
    balusters.push(`<rect x="${x}" y="1180" width="9" height="${height - 1180}" fill="${iron}"/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="rgb(255,214,140)" stop-opacity="0.85"/>
        <stop offset="0.25" stop-color="rgb(232,182,90)" stop-opacity="0.35"/>
        <stop offset="1" stop-color="rgb(232,182,90)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="380" cy="390" r="360" fill="url(#glow)"/>
    <rect x="0" y="1160" width="${width}" height="16" fill="${iron}"/>
    <rect x="0" y="1520" width="${width}" height="12" fill="${iron}"/>
    ${balusters.join('')}
    <rect x="358" y="440" width="44" height="${height - 440}" fill="${iron}"/>
    <rect x="336" y="1500" width="88" height="${height - 1500}" fill="${iron}"/>
    <polygon points="318,440 442,440 420,330 340,330" fill="${iron}"/>
    <rect x="348" y="342" width="64" height="88" fill="rgb(255,206,128)"/>
    <polygon points="330,330 430,330 380,280" fill="${iron}"/>
    <rect x="374" y="250" width="12" height="34" fill="${iron}"/>
  </svg>`
}

function featureSvg(seed, width = 1600, height = 2000) {
  const r = rng(seed)
  const lampX = 300 + r() * 1000
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgb(11,18,32)"/>
        <stop offset="0.7" stop-color="rgb(28,53,80)"/>
        <stop offset="1" stop-color="rgb(62,92,122)"/>
      </linearGradient>
      <radialGradient id="lamp" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="rgb(255,214,140)" stop-opacity="0.9"/>
        <stop offset="1" stop-color="rgb(232,182,90)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="rgb(38,30,26)"/>
    <rect x="260" y="220" width="1080" height="1180" fill="url(#dusk)"/>
    <rect x="260" y="790" width="1080" height="14" fill="rgb(24,19,16)"/>
    <rect x="792" y="220" width="16" height="1180" fill="rgb(24,19,16)"/>
    <rect x="0" y="1560" width="${width}" height="440" fill="rgb(58,44,34)"/>
    <circle cx="${lampX}" cy="1360" r="520" fill="url(#lamp)"/>
  </svg>`
}

async function svgToPng(svg, file) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, file))
}

await mkdir(path.join(OUT, 'shared/template'), { recursive: true })
await Promise.all([
  mist('shared/mist-1.webp', 101),
  mist('shared/mist-2.webp', 202, { density: 0.45 }),
  mist('shared/mist-3.webp', 303, { density: 0.35 }),
  sky('shared/template/sky.avif'),
  svgToPng(skylineSvg(), 'shared/template/midground.png'),
  svgToPng(foregroundSvg(), 'shared/template/foreground.png'),
  svgToPng(featureSvg(5), 'shared/template/feature.png'),
  svgToPng(featureSvg(9), 'shared/template/feature-2.png'),
])
console.log('assets written to', OUT)
