import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const OUT = path.resolve('docs/qa', process.env.PHASE ?? 'phase-5')

for (const vp of [
  { name: '375', width: 375, height: 812 },
  { name: '1440', width: 1440, height: 900 },
]) {
  test(`axe: home page has no WCAG A/AA violations, ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    // Let entrances finish so nothing is mid-fade when scanned.
    await page.waitForTimeout(4000)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    await mkdir(OUT, { recursive: true })
    await writeFile(
      path.join(OUT, `axe-${vp.name}.json`),
      JSON.stringify(
        {
          violations: results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.map((n) => n.target),
          })),
          incomplete: results.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
          passes: results.passes.length,
        },
        null,
        2,
      ),
    )
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    ).toEqual([])
  })
}

test('keyboard: skip link, visible focus ring, CTA reachable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Tab') // logo
  await page.keyboard.press('Tab') // CTA
  const cta = page.getByRole('link', { name: /Book a consultation/ })
  await expect(cta).toBeFocused()
  const outline = await cta.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe('none')
})

/** WCAG relative luminance of an sRGB colour (0..255 channels). */
function luminance([r, g, b]: number[]) {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/**
 * Text over imagery: hide the text, sample what's behind its box, and check contrast against the
 * 95th-percentile brightest background pixel (worst realistic case).
 */
test('contrast of text over imagery meets WCAG AA', async ({ page }) => {
  const sharp = (await import('sharp')).default
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?tier=high')
  await page.waitForTimeout(4000)
  const targets = [
    { at: 0, selector: '#top h1' },
    { at: 0, selector: '#top [data-hero-copy] p' },
    { at: 'process', selector: '#process h2' },
    { at: 'process', selector: '#process [data-eye-panel][data-active] [data-eye-body]' },
    { at: 'process', selector: '#process [data-eye-panel][data-active] h3' },
    { at: 'contact', selector: '#contact h2' },
    { at: 'contact', selector: '#contact h2 + div p' },
  ]
  const report: string[] = []
  for (const t of targets) {
    if (t.at !== 0) {
      await page.evaluate((id) => {
        const el = document.getElementById(id as string)!
        const spacer = el.parentElement!.classList.contains('pin-spacer') ? el.parentElement! : el
        window.scrollTo(0, spacer.getBoundingClientRect().top + scrollY)
      }, t.at)
      await page.waitForTimeout(2500)
    }
    const el = page.locator(t.selector).first()
    // Tight box around the glyphs, not the element (a block's box can extend past its text).
    const box = await el.evaluate((e) => {
      const r = document.createRange()
      r.selectNodeContents(e)
      const b = r.getBoundingClientRect()
      return { x: b.x, y: b.y, width: b.width, height: b.height }
    })
    if (!box.width) throw new Error(`no box for ${t.selector}`)
    const { color, size } = await el.evaluate((e) => {
      const cs = getComputedStyle(e)
      return { color: cs.color, size: parseFloat(cs.fontSize) }
    })
    await el.evaluate((e) => ((e as HTMLElement).style.opacity = '0'))
    const shot = await page.screenshot({ clip: box })
    await el.evaluate((e) => ((e as HTMLElement).style.opacity = ''))
    const { data, info } = await sharp(shot)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const lums: number[] = []
    for (let i = 0; i < data.length; i += info.channels)
      lums.push(luminance([data[i], data[i + 1], data[i + 2]]))
    lums.sort((a, b) => a - b)
    const bg = lums[Math.floor(lums.length * 0.95)]
    const fg = luminance(
      color
        .match(/\d+(\.\d+)?/g)!
        .slice(0, 3)
        .map(Number),
    )
    const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
    const needed = size >= 24 ? 3 : 4.5
    report.push(`${t.selector}: ${ratio.toFixed(2)} (needs ${needed})`)
    expect(ratio, t.selector).toBeGreaterThanOrEqual(needed)
  }
  await writeFile(path.join(OUT, 'contrast-over-imagery.txt'), report.join('\n') + '\n')
})
