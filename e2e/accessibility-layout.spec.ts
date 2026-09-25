import { expect, test } from '@playwright/test'

test('keeps the primary action visible at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Devam et' })).toBeVisible()
  expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true)
})

test('supports 200 percent zoom without horizontal clipping', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => { document.documentElement.style.zoom = '2' })
  expect(await page.locator('body').evaluate((body) => body.scrollWidth <= window.innerWidth)).toBe(true)
})

test('completes the flow with keyboard controls', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await page.getByLabel('Değerlendirilecek tutar').focus()
  await page.keyboard.type('5000')
  await page.getByRole('button', { name: 'Devam et' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('radio', { name: 'Haftalık' }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Devam et' }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('radio', { name: 'Dengeli' }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Piyasaları tara' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Phanfora Skoru/).first()).toBeVisible()
})

test.use({ reducedMotion: 'reduce' })
test('removes nonessential transform motion', async ({ page }) => {
  await page.goto('/')
  const duration = await page.locator('[data-step-panel]').evaluate((node) => getComputedStyle(node).transitionDuration)
  expect(duration).toMatch(/0\.01ms|0s/)
})
