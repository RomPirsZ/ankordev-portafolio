import { test, expect } from '@playwright/test';

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
    const hrefs = await page.locator('nav a').evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
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
  await expect(page.locator('nav a').first()).toHaveCSS('font-family', /Monaspace Krypton/);
});
