import { test, expect, type Page } from '@playwright/test';

/** Registra las peticiones al módulo de animaciones (GSAP + Lenis). */
function trackAnimationsChunk(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/_astro\/animations\.[^/]+\.js$/.test(request.url())) requests.push(request.url());
  });
  return requests;
}

test('sin preferencia de movimiento, el scroll suave arranca', async ({ page }) => {
  const requests = trackAnimationsChunk(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  expect(requests).toHaveLength(1);
});

test('con el scroll suave activo, «Saltar al contenido» mueve el foco al contenido', async ({ page, isMobile }) => {
  test.skip(isMobile, 'El enlace de salto es para teclado');
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  await page.keyboard.press('Tab');
  await expect(page.locator('a[href="#contenido"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#contenido')).toBeFocused();
});

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no se descarga GSAP ni Lenis y no hay scroll suave', async ({ page }) => {
    const requests = trackAnimationsChunk(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
    expect(requests).toEqual([]);
  });

  test('si la preferencia cambia a «sin reducir», el movimiento se activa', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('html')).toHaveClass(/\blenis\b/);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('html')).not.toHaveClass(/\blenis\b/);
  });
});
