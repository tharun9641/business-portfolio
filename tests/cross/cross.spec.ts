import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT = path.resolve('docs/qa/phase-5/cross')
const WIDTHS = [
  { w: 375, h: 812 },
  { w: 768, h: 1024 },
  { w: 1280, h: 800 },
  { w: 1920, h: 1080 },
]

async function scrollTo(page: Page, y: number) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(y))
  await page.waitForTimeout(2200)
}

for (const { w, h } of WIDTHS) {
  test(`home page renders and animates, ${w}px`, async ({ page, browserName }) => {
    await mkdir(OUT, { recursive: true })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await page.waitForTimeout(3500)
    await expect(page.locator('h1')).toBeVisible()
    const shot = (name: string) =>
      page.screenshot({
        path: path.join(OUT, `${browserName}-${w}-${name}.jpg`),
        type: 'jpeg',
        quality: 70,
      })
    await shot('1-hero')

    // Mid-pin: the bascules must have lifted.
    const pin = (w < h ? 1.4 : 2) * h
    await scrollTo(page, pin * 0.6)
    const angle = await page.$eval('[data-hero-layer="bascule-left"]', (el) => {
      const m = new DOMMatrix(getComputedStyle(el).transform)
      return Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI)
    })
    expect(angle).toBeLessThan(-40)
    await shot('2-opening')

    // London Eye: the third stop is boarded.
    const eye = await page.evaluate(() => {
      const sp = document.getElementById('process')!.parentElement!
      return { top: sp.getBoundingClientRect().top + scrollY, h: sp.offsetHeight }
    })
    const n = await page.locator('#process [role=tab]').count()
    await scrollTo(page, eye.top + (2 / (n - 1)) * (eye.h - h))
    await page.waitForTimeout(600)
    const selected = await page.$$eval('#process [role=tab]', (t) =>
      t.findIndex((x) => x.getAttribute('aria-selected') === 'true'),
    )
    expect(selected).toBe(2)
    await shot('3-eye')

    await page.locator('#contact').scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)
    await shot('4-contact')
    expect(errors).toEqual([])
  })
}

test('contact form validates and sends', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/#contact')
  await page.waitForTimeout(2500)
  const form = page.locator('#contact form')
  await form.getByRole('button', { name: 'Send enquiry' }).click()
  await expect(form.getByText('Please tell us your name.')).toBeVisible()
  await expect(form.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true')
  await form.getByLabel('Your name').fill('Ada Lovelace')
  await form.getByLabel('Email').fill('ada@example.com')
  await form.getByLabel('About your project').fill('A garden room and a new kitchen, please.')
  await form.getByRole('button', { name: 'Send enquiry' }).click()
  await expect(page.getByRole('status')).toContainText('Thank you')
})
