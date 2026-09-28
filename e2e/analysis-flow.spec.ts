import { expect, test } from '@playwright/test';

test('cockpit uses provider response and can save an analysis', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Piyasa Kontrol Merkezi' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Global crypto · BTC' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'BTC mum ve hacim grafiği' })).toBeVisible();
  await page.getByRole('button', { name: '1H' }).click();
  await expect(page.getByRole('button', { name: '1H' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /Göstergeler/ }).click();
  await expect(page.getByRole('button', { name: /Göstergeler/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Yeni Analiz' }).click();
  await expect(page.getByRole('heading', { name: 'Analiz ayarları' })).toBeVisible();
  await page.getByLabel('Değerlendirilecek tutar').fill('25.000');
  await page.getByRole('button', { name: 'Canlı piyasaları analiz et' }).click();
  await expect(page.locator('.analysis-dialog')).not.toBeVisible();
  await page.getByRole('link', { name: 'Analizler' }).first().click();
  await expect(page.getByRole('heading', { name: 'Analizler', exact: true })).toBeVisible();
  await expect(page.locator('.workspace-analysis-record .workspace-row').first()).toContainText('Phanfora deterministic fixture');
});

test('watchlist and portfolio persist user entries across navigation', async ({ page }) => {
  await page.goto('/watchlist');
  await expect(page.getByRole('heading', { name: 'Takip Listesi' })).toBeVisible();
  await page.getByRole('button', { name: 'Takibe ekle' }).click();
  await expect(page.getByRole('button', { name: 'Kaldır' })).toBeVisible();
  await page.goto('/portfolio');
  await page.getByLabel('Miktar').fill('2');
  await page.getByLabel('Birim alış fiyatı (USD)').fill('100');
  await page.getByRole('button', { name: 'Pozisyon ekle' }).click();
  await expect(page.getByText('2 adet · Birim maliyet')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sil' })).toBeVisible();
});

test('mobile navigation reaches the remaining sections', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile navigation only');
  await page.goto('/');
  await page.getByRole('button', { name: 'Diğer sayfalar' }).click();
  await page.getByRole('navigation', { name: 'Diğer sayfalar' }).getByRole('link', { name: 'Raporlar' }).click();
  await expect(page.getByRole('heading', { name: 'Raporlar', exact: true })).toBeVisible();
});

test('settings, alerts, reports, radar and markets operate on provider data', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Varsayılan aralık').selectOption('monthly');
  await page.getByLabel('Risk profili').selectOption('high');
  await page.goto('/analyses');
  await expect(page.getByRole('radio', { name: /Aylık/ })).toBeChecked();
  await expect(page.getByRole('radio', { name: /Yüksek/ })).toBeChecked();

  await page.goto('/alerts');
  await page.getByLabel('Eşik fiyatı (USD)').fill('1');
  await page.getByRole('button', { name: 'Alarm oluştur' }).click();
  await expect(page.getByText('Eşik şu anda karşılandı')).toBeVisible();

  await page.goto('/reports');
  await expect(page.getByRole('heading', { name: 'Raporlar', exact: true })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tüm kayıtları JSON indir' }).click();
  expect((await download).suggestedFilename()).toBe('phanfora-kayitlar.json');

  await page.goto('/radar');
  await expect(page.getByText('Tarama kapsamı')).toBeVisible();
  await page.goto('/explore');
  await page.getByRole('textbox', { name: 'Varlık ara' }).fill('AAPL');
  await expect(page.getByText('Apple Inc.')).toBeVisible();
});
