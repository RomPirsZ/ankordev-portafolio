import { test, expect } from '@playwright/test';

test('el inicio responde y tiene un h1', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
});

test('las fuentes self-hosted cargan', async ({ page }) => {
  await page.goto('/');
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('1rem "Space Grotesk Variable"');
  });
  expect(loaded).toBe(true);
  await expect(page.locator('h1')).toHaveCSS('font-family', /Space Grotesk Variable/);
});
