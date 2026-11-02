import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

/** Marca la ventana: si sigue ahí después de navegar, no hubo recarga completa. */
const markWindow = (page: Page) => page.evaluate(() => ((window as unknown as { __sameWindow: boolean }).__sameWindow = true));
const sameWindow = (page: Page) => page.evaluate(() => (window as unknown as { __sameWindow?: boolean }).__sameWindow === true);

test('navegar a un caso de estudio no recarga la página y conserva el tema', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-theme-value="claro"]').click();
  await markWindow(page);

  await page.locator('.project-link').first().click();
  await expect(page).toHaveURL(/\/proyectos\/001-restaurante\/$/);
  expect(await sameWindow(page)).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');

  // El selector de la página nueva sigue funcionando
  await expect(page.locator('[data-theme-value="claro"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-theme-value="oscuro"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'oscuro');
});

test('tras navegar, las animaciones se reinician en la página nueva', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
  await page.locator('.project-link').nth(2).click();

  await expect(page.getByRole('heading', { level: 1, name: 'App de reservas para barbería' })).toBeVisible();
  await expect(page.locator('h1 [aria-hidden="true"]').first()).toBeAttached();
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  await expect
    .poll(() => page.$$eval('h1 [aria-hidden="true"]', (pieces) => pieces.every((piece) => getComputedStyle(piece).opacity === '1')))
    .toBe(true);
});

test('el reloj sigue en marcha después de navegar', async ({ page }) => {
  await page.goto('/');
  await page.locator('.project-link').first().click();
  await expect(page).toHaveURL(/\/proyectos\//);
  const clock = page.locator('[data-clock]');
  const first = await clock.textContent();
  await expect.poll(() => clock.textContent(), { timeout: 3000 }).not.toBe(first);
});

test('al volver al inicio, el control de vista funciona y el historial también', async ({ page }) => {
  await page.goto('/');
  await page.locator('.project-link').first().click();
  await expect(page).toHaveURL(/\/proyectos\//);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Cuadrícula' }).click();
  await expect(page.locator('[data-projects]')).toHaveAttribute('data-view', 'grid');
});

test('cambiar de idioma también es una transición, con lang actualizado', async ({ page }) => {
  await page.goto('/proyectos/002-tienda/');
  await markWindow(page);
  await page.locator('a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/projects\/002-tienda\/$/);
  expect(await sameWindow(page)).toBe(true);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('con puntero fino, tras navegar hay un solo cursor de laboratorio', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Solo con puntero fino');
  await page.goto('/');
  await page.locator('.project-link').first().click();
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
  await page.mouse.move(300, 300, { steps: 3 });
  await expect(page.locator('.lab-cursor')).toHaveCount(1);
});

test('navegar con la CSP aplicada no produce violaciones', async ({ page }) => {
  const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: { headers: { key: string; value: string }[] }[] };
  const csp = vercel.headers[0]!.headers.find((h) => h.key === 'Content-Security-Policy')!.value;
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text())) violations.push(msg.text());
  });
  await page.route('**/*', async (route) => {
    try {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
    } catch {
      // Petición cancelada al navegar o aún en curso al acabar el test (p. ej. una precarga):
      // ya no hay a quién responder. Sin esto, Playwright lo cuenta como error fuera de los tests.
    }
  });

  await page.goto('/');
  await page.locator('.project-link').first().click();
  await expect(page).toHaveURL(/\/proyectos\//);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  expect(violations).toEqual([]);
});

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('la navegación funciona sin animaciones ni clase motion', async ({ page }) => {
    await page.goto('/');
    await page.locator('.project-link').first().click();
    await expect(page.locator('h1')).toHaveText('Restaurante / café local');
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
    expect(await page.locator('h1 *').count()).toBe(0);
  });
});
