import { test, expect } from '@playwright/test';

test('el inicio responde y tiene un h1', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
});
