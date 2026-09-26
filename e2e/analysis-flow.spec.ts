import { expect, test } from '@playwright/test';

test('completes the Phanfora analysis journey with transparent data metadata', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('Değerlendirilecek tutar').fill('25.000');
  await page.getByRole('radio', { name: /Haftalık/ }).check();
  await page.getByRole('radio', { name: /Dengeli/ }).check();
  await page.getByRole('button', { name: 'Canlı piyasaları analiz et' }).click();

  await expect(page.getByRole('heading', { name: /Bitcoin/ })).toBeVisible();
  await expect(page.getByText('Demo veri').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Ana risk' })).toContainText(/.+/);

  await page.getByText('Skor nasıl hesaplandı?').click();
  await expect(page.getByTestId('dimension-row')).toHaveCount(5);
  await expect(page.getByText('phanfora-v1')).toBeVisible();
});
