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
  await page.goto('/dev/template')
  await expect(page.locator('html')).toHaveClass(/lenis/)

  // Bring the second scene to mid-viewport, then compare depths.
  await page.evaluate(() => document.getElementById('studio')?.scrollIntoView({ block: 'center' }))
  await settle(page, 2000)
  const before = await layerOffsets(page, 'studio')
  await page.mouse.wheel(0, 400)
  await settle(page, 2000)
  const after = await layerOffsets(page, 'studio')

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
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('.pin-spacer')).toHaveCount(0)
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
  // Focus lands on the first menu entry, whichever section is registered first.
  await expect(dialog.getByRole('link').first()).toBeFocused()
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
    // Software-GPU captures fail on very tall pages, so very tall pages are clipped.
    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.screenshot({
      path: path.join(OUT, `contact-sheet-${vp.name}.png`),
      fullPage: true,
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(docHeight, 8000) },
    })
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

for (const vp of VIEWPORTS) {
  test(`hero opening sequence, ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
    await settle(page, 3500) // arrival fade and heading reveal
    const pin = await page.evaluate(() => (innerHeight > innerWidth ? 1.4 : 2) * innerHeight)
    const angle = () =>
      page.$eval('[data-hero-layer="bascule-left"]', (el) => {
        const m = new DOMMatrix(getComputedStyle(el).transform)
        return Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI)
      })
    expect(await angle()).toBe(0)
    for (const f of [0, 0.15, 0.3, 0.5, 0.7, 0.9]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(pin * f))
      await settle(page)
      await page.screenshot({
        path: path.join(OUT, `hero-${vp.name}-${String(f * 100).padStart(3, '0')}.png`),
      })
    }
    // By 70% of the pin both leaves are fully raised.
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(pin * 0.7))
    await settle(page)
    expect(await angle()).toBe(-80)
  })
}

async function eyeStop(page: Page, i: number) {
  const { top, h } = await page.evaluate(() => {
    const spacer = document.getElementById('process')!.parentElement!
    return { top: spacer.getBoundingClientRect().top + scrollY, h: spacer.offsetHeight }
  })
  const n = await page.locator('#process [role=tab]').count()
  const y = top + (i / (n - 1)) * (h - page.viewportSize()!.height)
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(y))
  await settle(page, 2600)
}

const selectedTab = (page: Page) =>
  page.$$eval('#process [role=tab]', (tabs) =>
    tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'),
  )

for (const vp of VIEWPORTS) {
  test(`London Eye stops, ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/?tier=high')
    await settle(page, 3000)
    const n = await page.locator('#process [role=tab]').count()
    expect(n).toBeGreaterThanOrEqual(4)
    const rotations: number[] = []
    for (let i = 0; i < n; i++) {
      await eyeStop(page, i)
      rotations.push(
        Number(await page.locator('#process .eye-wheel').getAttribute('data-rotation')),
      )
      expect(await selectedTab(page)).toBe(i)
      const heading = page.locator('#process [data-eye-panel][data-active] h3')
      await expect(heading).toBeVisible()
      const label = await page.locator('#process [role=tab]').nth(i).getAttribute('aria-label')
      expect(label?.endsWith(` ${await heading.textContent()}`)).toBe(true)
      await page.screenshot({ path: path.join(OUT, `eye-${vp.name}-${i}.png`) })
    }
    // The wheel turns one way, one cabin per stop, with the 3D wheel live.
    await expect(page.locator('#process canvas')).toHaveCount(1)
    for (let i = 1; i < n; i++) expect(rotations[i]).toBeLessThan(rotations[i - 1] - 0.15)
  })
}

test('London Eye: tabs work from the keyboard and by click', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?tier=high')
  await settle(page, 3000)
  await eyeStop(page, 0)
  await page.locator('#process [role=tab]').first().focus()
  await page.keyboard.press('ArrowDown')
  await settle(page, 2600)
  expect(await selectedTab(page)).toBe(1)
  await expect(page.locator('#process [role=tab]').nth(1)).toBeFocused()
  await page.locator('#process [role=tab]').nth(3).click()
  await settle(page, 2600)
  expect(await selectedTab(page)).toBe(3)
  // Every subsection stays in the accessibility tree, in order.
  await expect(page.locator('#process [role=tabpanel] h3')).toHaveCount(5)
})

test('London Eye: low tier uses the SVG wheel, no WebGL canvas', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?tier=low')
  await settle(page, 3000)
  await eyeStop(page, 1)
  await expect(page.locator('#process canvas')).toHaveCount(0)
  await expect(page.locator('#process .eye-wheel svg')).toHaveCount(1)
})

test('London Eye: reduced motion shows every stop as a list', async ({ browser }) => {
  const context = await browser.newContext({
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  await page.goto('/')
  await settle(page)
  const opacities = await page.$$eval('[data-eye-panel]', (ps) =>
    ps.map((p) => getComputedStyle(p).opacity),
  )
  expect(opacities.every((o) => o === '1')).toBe(true)
  await expect(page.locator('#process canvas')).toHaveCount(0)
  await page.locator('#process').screenshot({ path: path.join(OUT, 'eye-reduced-motion-1440.png') })
  await context.close()
})

test('Locations: a name jumps the stage to that landmark; photo and card follow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await settle(page, 2500)
  // The section is several screens tall while pinned; start at its heading, before the stage.
  await page.locator('#locations-heading').scrollIntoViewIfNeeded()
  await settle(page, 2500)
  await expect(page.locator('#locations .loc-name')).toHaveCount(8)
  const card = page.locator('#locations [aria-live="polite"]')
  await expect(card.getByRole('heading', { level: 3 })).toHaveText('Tower of London')
  await page.getByRole('button', { name: 'Westminster', exact: true }).click()
  await expect(card.getByRole('heading', { level: 3 })).toHaveText('Westminster')
  await expect(page.getByRole('button', { name: 'Westminster', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(card.getByRole('link', { name: /Open in Maps/ })).toHaveAttribute(
    'href',
    /google\.com\/maps\/search\/\?api=1&query=Palace%20of%20Westminster/,
  )
  const photo = page.locator('#locations [data-loc-slide][data-active] img')
  await expect(photo).toHaveAttribute('alt', /Palace of Westminster/)
  await expect(photo).toHaveJSProperty('complete', true)
  await page.locator('#locations').screenshot({ path: path.join(OUT, 'locations-1440.png') })
})

test('London Eye: wheel holds still within a stop and turns only on a new stop', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?tier=high')
  await settle(page, 3000)
  await eyeStop(page, 1)
  const rot = () => page.locator('#process .eye-wheel').getAttribute('data-rotation')
  const atStop = await rot()
  // Nudge less than half a stop: the wheel must not move.
  await page.mouse.move(700, 450)
  await page.mouse.wheel(0, 120)
  await page.waitForTimeout(250)
  expect(await rot()).toBe(atStop)
  await eyeStop(page, 2)
  expect(Number(await rot())).toBeLessThan(Number(atStop) - 0.15)
})

test('London Eye: panel and text arrive in sync with the wheel', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?tier=high')
  await settle(page, 3000)
  await eyeStop(page, 1)
  const body = page.locator('#process [data-eye-panel]').nth(2).locator('[data-eye-body]')
  const target = await page.evaluate(() => {
    const sp = document.getElementById('process')!.parentElement!
    return sp.getBoundingClientRect().top + scrollY + (sp.offsetHeight - innerHeight) / 2
  })
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(target))
  // Early in the ride the wheel is turning and the new stop's text has not appeared yet.
  await page.waitForTimeout(500)
  expect(Number(await body.evaluate((e) => getComputedStyle(e).opacity))).toBeLessThan(0.1)
  // Once the capsule has arrived, the panel has landed and its text is fully visible.
  await page.waitForTimeout(3200)
  expect(Number(await body.evaluate((e) => getComputedStyle(e).opacity))).toBe(1)
  expect(
    await page
      .locator('#process [data-eye-panel]')
      .nth(2)
      .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42),
  ).toBe(0)
})
