import { test, expect } from '@playwright/test';

test('el tema cambia y persiste al recargar', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'carbon');

  await expect(page.locator('[data-theme-value]')).toHaveCount(2);
  const naranja = page.locator('[data-theme-value="naranja"]');
  await naranja.click();
  await expect(html).toHaveAttribute('data-theme', 'naranja');
  await expect(naranja).toHaveAttribute('aria-pressed', 'true');
  // El fondo lo pinta <html> (el <body> es transparente para dejar ver el gradiente)
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(242, 113, 28)');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'naranja');
  await expect(naranja).toHaveAttribute('aria-pressed', 'true');
});

test('el selector de tema funciona con teclado', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-theme-value="naranja"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'naranja');
});

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('el selector de tema queda oculto y el contenido se lee', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.theme-switcher')).toBeHidden();
    await expect(page.locator('h1')).toBeVisible();
  });
});
