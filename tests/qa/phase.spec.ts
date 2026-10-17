import { expect, test, type Page } from '@playwright/test'
import { mkdir, rename } from 'node:fs/promises'
import path from 'node:path'

/** Phase evidence lands in docs/qa/<phase>/. Set PHASE=phase-2 etc. for later phases. */
const OUT = path.resolve('docs/qa', process.env.PHASE ?? 'phase-1')
const VIEWPORTS = [
  { name: '375', width: 375, height: 812 },
  { name: '1440', width: 1440, height: 900 },
]
const STOPS = [0, 0.15, 0.3, 0.45, 0.6, 0.8, 1]

test.beforeAll(async () => {
  await mkdir(OUT, { recursive: true })
})

async function settle(page: Page, ms = 1600) {
  // Lenis lerp plus scrub: 1 need a moment to land on the final frame.
  await page.waitForTimeout(ms)
}

async function scrollToFraction(page: Page, f: number) {
  await page.evaluate((fraction) => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    window.scrollTo(0, Math.round(max * fraction))
  }, f)
  await settle(page)
}

async function layerOffsets(page: Page, sceneId: string) {
  return page.$$eval(`#${sceneId} [data-layer]`, (layers) =>
    layers.map((l) => ({
      depth: Number((l as HTMLElement).dataset.depth),
      y: new DOMMatrix(getComputedStyle(l).transform).m42,
    })),
  )
}

for (const vp of VIEWPORTS) {
  test(`screenshots at key scroll positions, ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await settle(page)
    for (const f of STOPS) {
      await scrollToFraction(page, f)
      await page.screenshot({
        path: path.join(OUT, `${vp.name}-${String(f * 100).padStart(3, '0')}.png`),
      })
    }
  })
}

test('layers separate by depth while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/lenis/)

  // Bring the second scene to mid-viewport, then compare depths.
  await page.evaluate(() =>
    document.getElementById('approach')?.scrollIntoView({ block: 'center' }),
  )
  await settle(page, 2000)
  const before = await layerOffsets(page, 'approach')
  await page.mouse.wheel(0, 400)
  await settle(page, 2000)
  const after = await layerOffsets(page, 'approach')

  const travel = after.map((l, i) => ({ depth: l.depth, dy: Math.abs(l.y - before[i].y) }))
  expect(travel).toHaveLength(4)
  for (let i = 1; i < travel.length; i++) {
    // Nearer layers must travel further than farther ones.
    expect(travel[i].dy).toBeGreaterThan(travel[i - 1].dy)
  }
  expect(travel[3].dy).toBeGreaterThan(20)
})

test('reduced motion: no smooth scroll, no parallax, content visible', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  await page.goto('/')
  await settle(page)

  await expect(page.locator('html')).not.toHaveClass(/lenis/)
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.4))
  await settle(page)

  const transforms = await page.$$eval('[data-layer]', (ls) =>
    ls.map((l) => getComputedStyle(l).transform),
  )
  expect(transforms.every((t) => t === 'none')).toBe(true)

  const mist = await page.$$eval('[data-mist]', (ms) =>
    ms.map((m) => getComputedStyle(m).animationName),
  )
  expect(mist.every((a) => a === 'none')).toBe(true)

  for (const heading of await page.locator('h2').all()) {
    await expect(heading).toBeVisible()
    expect(await heading.evaluate((h) => h.querySelectorAll('[class*="line"]').length)).toBe(0)
  }
  await page.screenshot({ path: path.join(OUT, 'reduced-motion-1440.png'), fullPage: true })
  await context.close()
})

test('menu: opens, traps focus, closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Menu' })
  await toggle.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('link', { name: 'Studio' })).toBeFocused()
  await page.waitForTimeout(700)
  await page.screenshot({ path: path.join(OUT, 'menu-375.png') })
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(toggle).toBeFocused()
})

for (const vp of VIEWPORTS) {
  test(`scroll-through recording, ${vp.name}px`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      recordVideo: { dir: OUT, size: { width: vp.width, height: vp.height } },
    })
    const page = await context.newPage()
    await page.goto('/')
    await settle(page, 1200)
    const steps = 60
    for (let i = 0; i < steps; i++) {
      await page.mouse.move(vp.width * (0.3 + 0.4 * (i / steps)), vp.height * 0.5)
      await page.mouse.wheel(0, 90)
      await page.waitForTimeout(110)
    }
    await settle(page, 1200)
    const video = page.video()
    await context.close()
    if (video) await rename(await video.path(), path.join(OUT, `scroll-${vp.name}.webm`))
  })
}

for (const vp of VIEWPORTS) {
  test(`asset contact sheet, ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/dev/assets')
    // Walk the page so every lazy image loads, then wait until all have decoded.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForFunction(() =>
      [...document.images].every((img) => img.complete && img.naturalWidth > 0),
    )
    await page.screenshot({ path: path.join(OUT, `contact-sheet-${vp.name}.png`), fullPage: true })
    // Raise the bascules in the live layer stack and capture just the preview.
    await page.getByLabel(/Bascule angle/).fill('80')
    const stack = page.locator('section', {
      has: page.getByRole('heading', { name: 'Hero layer stack' }),
    })
    await stack.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await stack.screenshot({ path: path.join(OUT, `hero-stack-open-${vp.name}.png`) })
  })
}
