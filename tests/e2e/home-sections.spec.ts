// Secciones del inicio (spec §5, T12): Servicios y Proceso.
import { test, expect, type Page } from '@playwright/test';

const PACKAGES = {
  '/': [
    ['Landing', '$300'],
    ['Sitio para negocio', '$750'],
    ['Tienda / App web', '$1.500'],
  ],
  '/en/': [
    ['Landing page', '$500'],
    ['Business website', '$1,300'],
    ['Store / Web app', '$2,600'],
  ],
} as const;

test('Servicios muestra los 3 paquetes con la tarifa de cada idioma', async ({ page }) => {
  for (const [home, packages] of Object.entries(PACKAGES)) {
    await page.goto(home);
    const rows = page.locator(`[id="${home === '/' ? 'servicios' : 'services'}"] .package`);
    await expect(rows).toHaveCount(3);
    for (const [i, [name, price]] of packages.entries()) {
      await expect(rows.nth(i).getByRole('heading', { level: 3 })).toHaveText(name);
      await expect(rows.nth(i).locator('.package-amount')).toHaveText(price);
    }
  }
});

test('el número de cada enlace del menú es el de la etiqueta de su sección', async ({ page }) => {
  await page.goto('/');
  for (const link of await page.locator('nav a[href^="/#"]').all()) {
    const number = await link.locator('span[aria-hidden="true"]').textContent();
    const id = (await link.getAttribute('href'))?.split('#')[1];
    await expect(page.locator(`[id="${id}"] [data-scramble]`)).toContainText(`[ ${number} /`);
  }
});

test('Proceso tiene los 4 pasos en orden', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#proceso ol > li h3')).toHaveText(['Descubrir', 'Especificar', 'Construir', 'Lanzar']);
});

const progress = (page: Page) =>
  page.locator('[data-process]').evaluate((element) => parseFloat(getComputedStyle(element).getPropertyValue('--progress')));

test('la línea del proceso se dibuja al hacer scroll (spec §7)', async ({ page }) => {
  await page.goto('/');
  // Lejos de la sección, la línea está sin dibujar
  await expect.poll(() => progress(page)).toBe(0);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect.poll(() => progress(page)).toBe(1);
});

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('la línea del proceso se ve entera desde el principio', async ({ page }) => {
    await page.goto('/');
    expect(await progress(page)).toBe(1);
  });
});
