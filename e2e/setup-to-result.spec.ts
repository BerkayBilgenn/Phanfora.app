import { expect, test } from '@playwright/test'

test('completes setup and explains the primary result', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Değerlendirilecek tutar').fill('5000')
  await page.getByRole('button', { name: 'Devam et' }).click()
  await page.getByRole('radio', { name: 'Haftalık' }).check()
  await page.getByRole('button', { name: 'Devam et' }).click()
  await page.getByRole('radio', { name: 'Dengeli' }).check()
  await page.getByRole('button', { name: 'Piyasaları tara' }).click()

  await expect(page.getByRole('heading', { name: /öne çıkan fırsat/i })).toBeVisible()
  await expect(page.getByText(/Phanfora Skoru/).first()).toBeVisible()
  await page.getByText('Skor nasıl hesaplandı?').first().click()
  await expect(page.getByText('Trend').first()).toBeVisible()
  await expect(page.getByText('Demo verisi').first()).toBeVisible()
})

test('switches to English and keeps the locale for the session', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'English' }).click()
  await expect(page.getByRole('heading', { name: 'Scan markets on your terms' })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Amount to evaluate')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByLabel('Amount to evaluate').fill('2500')
  await page.getByRole('button', { name: 'Türkçe' }).click()
  await expect(page.getByLabel('Değerlendirilecek tutar')).toHaveValue('2500')
  await page.getByRole('button', { name: 'English' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: 'Weekly' }).check()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: 'Balanced' }).check()
  await page.getByRole('button', { name: 'Scan markets' }).click()

  await expect(page.getByText('Central-bank communication can change direction quickly.')).toBeVisible()
  await page.getByRole('button', { name: 'Edit choices' }).click()
  await expect(page.getByLabel('Amount to evaluate')).toHaveValue('2500')
})
