import { test, expect } from '@playwright/test';

const HERO = 'Diseño y desarrollo webs que se sienten vivas';

test('el titular entra letra a letra sin perder su nombre accesible', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByRole('heading', { level: 1, name: HERO });
  await expect(hero).toBeVisible();
  // SplitText partió el texto en piezas ocultas a lectores de pantalla
  expect(await page.locator('h1 [aria-hidden="true"]').count()).toBeGreaterThan(HERO.replace(/\s/g, '').length - 1);
  // Al terminar, todas las letras quedan visibles y sin blur
  await expect
    .poll(() =>
      page.$$eval('h1 [aria-hidden="true"]', (pieces) =>
        pieces.every((piece) => getComputedStyle(piece).opacity === '1' && getComputedStyle(piece).filter === 'none'),
      ),
    )
    .toBe(true);
});

test('el título de sección se revela al llegar a él', async ({ page }) => {
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 2, name: 'Proyectos' });
  await heading.scrollIntoViewIfNeeded();
  await expect(heading).toBeVisible();
  await expect.poll(() => heading.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
});

test('las etiquetas de laboratorio terminan con su texto real', async ({ page }) => {
  await page.goto('/');
  const label = page.locator('#proyectos [data-scramble]');
  await label.scrollIntoViewIfNeeded();
  await expect(label).toHaveText('[ 01 / Proyectos ]', { timeout: 5000 });
});

test('si las animaciones no cargan, el contenido se muestra igual', async ({ page }) => {
  await page.route(/\/_astro\/animations\.[^/]+\.js$/, (route) => route.abort());
  await page.goto('/');
  const hero = page.getByRole('heading', { level: 1, name: HERO });
  await expect.poll(() => hero.evaluate((element) => getComputedStyle(element).opacity), { timeout: 5000 }).toBe('1');
});

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('el titular se muestra entero desde el principio, sin dividir', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('h1');
    await expect(hero).toHaveText(HERO);
    expect(await hero.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
    expect(await hero.locator('*').count()).toBe(0);
    await expect(page.locator('html')).not.toHaveClass(/\bmotion\b/);
  });
});
