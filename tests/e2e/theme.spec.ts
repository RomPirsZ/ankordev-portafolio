import { test, expect } from '@playwright/test';

test('el tema cambia y persiste al recargar', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'carbon');

  const petroleo = page.locator('[data-theme-value="petroleo"]');
  await petroleo.click();
  await expect(html).toHaveAttribute('data-theme', 'petroleo');
  await expect(petroleo).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(31, 111, 139)');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'petroleo');
  await expect(petroleo).toHaveAttribute('aria-pressed', 'true');
});

test('el selector de tema funciona con teclado', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-theme-value="militar"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'militar');
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('el selector de tema queda oculto y el contenido se lee', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.theme-switcher')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();
  });
});
