import { test, expect } from '@playwright/test';
import { SOCIALS } from '../../src/lib/site';

test('el inicio responde y tiene un h1', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
});

test('el inicio existe en ambos idiomas y se enlazan entre sí', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.locator('a[hreflang="en"]').click();

  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle(/Web design and development/);
  await expect(page.locator('nav a[href="/en/#projects"]')).toBeVisible();

  await page.locator('a[hreflang="es"]').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('cada enlace del menú lleva a una sección que existe', async ({ page }) => {
  for (const home of ['/', '/en/']) {
    await page.goto(home);
    const hrefs = await page.locator('header nav a').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const [path, id] = href.split('#');
      expect(path, href).toBe(home);
      await expect(page.locator(`[id="${id}"]`), href).toHaveCount(1);
    }
  }
});

test('las fuentes self-hosted cargan', async ({ page }) => {
  await page.goto('/');
  // fonts.check() da true también si la fuente no está declarada: se mira el estado real de cada FontFace
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    const isLoaded = (family: string) =>
      [...document.fonts].some((face) => face.family.replace(/["']/g, '') === family && face.status === 'loaded');
    return { display: isLoaded('Space Grotesk Variable'), mono: isLoaded('Monaspace Krypton') };
  });
  expect(loaded).toEqual({ display: true, mono: true });
  await expect(page.locator('h1')).toHaveCSS('font-family', /Space Grotesk Variable/);
  await expect(page.locator('header nav a').first()).toHaveCSS('font-family', /Monaspace Krypton/);
});

// Redes del pie: glifo de cada red + su nombre; el glifo es decorativo
test('el pie enlaza cada red con su icono y su nombre', async ({ page }) => {
  const socials = SOCIALS.filter((social) => social.url);
  for (const home of ['/', '/en/']) {
    await page.goto(home);
    const links = page.getByRole('contentinfo').getByRole('navigation').getByRole('link');
    await expect(links).toHaveCount(socials.length);
    for (const [i, social] of socials.entries()) {
      const link = links.nth(i);
      await expect(link).toHaveAccessibleName(social.name);
      await expect(link).toHaveAttribute('href', social.url);
      await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
      // Área táctil mínima de WCAG 2.2 (2.5.8)
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(24);
    }
  }
});

// Logotipo «Cursor» (T11b): dibujado en SVG decorativo; el nombre lo da el texto del enlace
test('la marca del menú es el logotipo y se anuncia como «[A]nkordev — Inicio»', async ({ page }) => {
  for (const [home, name] of [
    ['/', '[A]nkordev — Inicio'],
    ['/en/', '[A]nkordev — Home'],
  ] as const) {
    await page.goto(home);
    const brand = page.getByRole('banner').getByRole('link', { name, exact: true });
    await expect(brand).toHaveAttribute('href', home);
    const logo = brand.locator('svg');
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute('aria-hidden', 'true');
    // Legible en el menú: 22 px de alto como mínimo
    expect((await logo.boundingBox())!.height).toBeGreaterThanOrEqual(22);
  }
});

test('el favicon es el monograma del logotipo', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toBe('/favicon.svg');
  const response = await request.get(href!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/svg+xml');
});
