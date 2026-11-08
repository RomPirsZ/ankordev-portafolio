// Página de gracias tras el formulario (spec §3, T25): en los dos idiomas, enlazadas
// entre sí y fuera de los buscadores.
import { test, expect } from '@playwright/test';

for (const [path, title, home, other] of [
  ['/gracias/', 'Mensaje enviado', 'Volver al inicio', '/en/thanks/'],
  ['/en/thanks/', 'Message sent', 'Back to home', '/gracias/'],
] as const) {
  test(`${path}: titular, noindex, vuelta al inicio y el otro idioma`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator(`a[hreflang]`)).toHaveAttribute('href', other);
    await expect(page.getByRole('link', { name: home })).toHaveAttribute('href', path === '/gracias/' ? '/' : '/en/');
  });
}

test('el inicio no lleva noindex', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});
