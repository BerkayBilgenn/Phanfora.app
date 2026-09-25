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
  const amount = page.getByLabel('Değerlendirilecek tutar')
  for (let press = 0; press < 10 && !(await amount.evaluate((element) => element === document.activeElement)); press += 1) {
    await page.keyboard.press('Tab')
  }
  await expect(amount).toBeFocused()
  await page.keyboard.type('5000')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('group', { name: 'Ne kadar bekleyebilirsin?' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('group', { name: 'Ne kadar risk kabul edersin?' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Öne çıkan fırsat' })).toBeFocused()
  await expect(page.getByText(/Phanfora Skoru/).first()).toBeVisible()
})

test.use({ reducedMotion: 'reduce' })
test('removes nonessential transform motion', async ({ page }) => {
  await page.goto('/')
  const duration = await page.locator('[data-step-panel]').evaluate((node) => getComputedStyle(node).transitionDuration)
  expect(duration).toMatch(/0\.01ms|0s/)
})
