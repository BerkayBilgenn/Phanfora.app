import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/explore',
  '/radar',
  '/analyses',
  '/history',
  '/watchlist',
  '/portfolio',
  '/alerts',
  '/reports',
  '/settings',
];

test('pages stay within the viewport from narrow phones to desktop', async ({ page }) => {
  test.setTimeout(180_000);
  const failures: string[] = [];

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    for (const route of routes) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({
        viewport: window.innerWidth,
        content: document.documentElement.scrollWidth,
      }));
      if (size.content > size.viewport + 1) {
        failures.push(`${route} at ${width}px: ${size.content}px wide`);
      }
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});

test('comparison and asset details fit inside phone cards', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.goto('/');
  await expect(page.locator('.ph-compare-row').first()).toBeVisible();
  await expect(page.locator('.ph-asset-row').first()).toBeVisible();

  for (const selector of ['.ph-compare-table', '.ph-assets-scroll']) {
    const dimensions = await page.locator(selector).evaluate((element) => ({
      content: element.scrollWidth,
      visible: element.clientWidth,
    }));
    expect(dimensions.content, selector).toBeLessThanOrEqual(dimensions.visible + 1);
  }
});

test('data sections do not need sideways scrolling at layout transitions', async ({ page }) => {
  for (const width of [601, 700, 701, 800, 801, 900, 980, 1024]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    await expect(page.locator('.ph-asset-row').first()).toBeVisible();
    for (const selector of ['.ph-compare-table', '.ph-assets-scroll']) {
      const dimensions = await page.locator(selector).evaluate((element) => ({
        content: element.scrollWidth,
        visible: element.clientWidth,
      }));
      expect(dimensions.content, `${selector} at ${width}px`).toBeLessThanOrEqual(dimensions.visible + 1);
    }
  }
});

test('analysis amount field remains usable on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto('/analyses');
  const amount = page.getByLabel('Değerlendirilecek tutar');
  await expect(amount).toBeVisible();
  const box = await amount.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(180);
});

test('ticker prices are not clipped on a small desktop', async ({ page }) => {
  for (const width of [900, 1024, 1180, 1321, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    await expect(page.locator('.ph-ticker-info b').first()).toBeVisible();
    const clipped = await page.locator('.ph-ticker-info b').evaluateAll((elements) =>
      elements.some((element) => element.scrollWidth > element.clientWidth + 1),
    );
    expect(clipped, `${width}px`).toBe(false);
  }
});

test('desktop sidebar keeps the profile link reachable on a short screen', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 700 });
  await page.goto('/');
  const profile = page.locator('.ph-sidebar .ph-profile');
  await profile.scrollIntoViewIfNeeded();
  const box = await profile.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(700);
});
