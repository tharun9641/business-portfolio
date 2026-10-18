/**
 * Builds the Open Graph image and app icons from the hero still and the site name.
 *   node scripts/make-brand-images.mjs
 * Outputs (picked up by Next's metadata file conventions):
 *   src/app/opengraph-image.jpg (1200×630), src/app/icon.svg, src/app/apple-icon.png (180×180)
 * Placeholder monogram until a real logo exists (docs/CONTENT_NEEDED.md).
 */
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const NAME = 'Halden & Vale'
const TAGLINE = 'Architecture and interiors for London homes'
const MONOGRAM = 'H&amp;V'
const esc = (s) => s.replace(/&/g, '&amp;')

const W = 1200
const H = 630
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b1220" stop-opacity="0.85"/>
    <stop offset="0.45" stop-color="#0b1220" stop-opacity="0.1"/>
    <stop offset="1" stop-color="#0b1220" stop-opacity="0.55"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="${W / 2}" y="118" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="76" fill="#e8e2d6">${esc(NAME)}</text>
  <text x="${W / 2}" y="168" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="26" letter-spacing="1" fill="#e8e2d6" fill-opacity="0.82">${esc(TAGLINE)}</text>
</svg>`

await sharp('public/assets/hero/still.avif')
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: Buffer.from(overlay) }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('src/app/opengraph-image.jpg')
await writeFile('src/app/opengraph-image.alt.txt', `${NAME}: Tower Bridge at blue hour, floodlit in gold.`)

const icon = (size, radius) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${radius}" fill="#0b1220"/>
  <text x="32" y="41" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="25" fill="#e8b65a">${MONOGRAM}</text>
</svg>`
await writeFile('src/app/icon.svg', icon(64, 12))
await sharp(Buffer.from(icon(180, 0))).png().toFile('src/app/apple-icon.png')
console.log('brand images written')
