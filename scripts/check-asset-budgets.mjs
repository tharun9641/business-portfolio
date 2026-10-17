/**
 * Checks every image in public/assets against the brief's weight budgets (§10): what next/image
 * serves at 1x on a 1920px screen, encoded as AVIF at the default quality (75).
 * Hero layers ≤ 350 KB, everything else ≤ 250 KB. Exits 1 on any failure.
 *
 * Also writes src/content/dev/assetManifest.json for the /dev/assets contact sheet.
 *
 *   node scripts/check-asset-budgets.mjs
 */
import { readdir, stat, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = 'public/assets'
const SERVE_WIDTH = 1920
const BUDGET_KB = { hero: 350, default: 250 }
const IMAGE = /\.(avif|webp|png|jpe?g)$/i

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (IMAGE.test(entry.name)) out.push(p)
  }
  return out
}

const files = (await walk(ROOT)).sort()
const rows = []
let failed = 0
for (const file of files) {
  const meta = await sharp(file).metadata()
  const width = Math.min(meta.width, SERVE_WIDTH)
  const served = await sharp(file).resize({ width }).avif({ quality: 75 }).toBuffer()
  const rel = path.relative('public', file)
  const group = rel.split(path.sep)[1]
  const budget = BUDGET_KB[group] ?? BUDGET_KB.default
  const kb = Math.round(served.length / 1024)
  const ok = kb <= budget
  if (!ok) failed++
  rows.push({
    src: `/${rel.split(path.sep).join('/')}`,
    group,
    width: meta.width,
    height: meta.height,
    alpha: Boolean(meta.hasAlpha),
    sourceKB: Math.round((await stat(file)).size / 1024),
    servedKB: kb,
    budgetKB: budget,
    ok,
  })
  console.log(`${ok ? '✔' : '✖'} ${rel.padEnd(42)} ${String(kb).padStart(4)} KB / ${budget} KB`)
}

await mkdir('src/content/dev', { recursive: true })
await writeFile('src/content/dev/assetManifest.json', JSON.stringify(rows, null, 2) + '\n')
console.log(failed ? `\n${failed} over budget` : '\nall within budget')
process.exit(failed ? 1 : 0)
