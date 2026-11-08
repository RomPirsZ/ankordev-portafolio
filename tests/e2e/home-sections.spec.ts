// Secciones del inicio (spec §5, T12): Servicios, Proceso, Sobre mí, Contacto y el CTA del hero.
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { test, expect, type Page } from '@playwright/test';
import { STACK, contactChannels, ownerFromEnv } from '../../src/lib/site';

// Los datos del dueño que vio el build. Al compilar, el adaptador de Cloudflare
// vuelca `.env` sobre el entorno, así que `.env` manda. En CI y en Workers Builds
// no existe y se usa el entorno (en CI, vacío: no se muestra nada).
function readDotEnv(): Record<string, string | undefined> {
  try {
    return parseEnv(readFileSync('.env', 'utf8'));
  } catch {
    return {};
  }
}
const OWNER = ownerFromEnv({ ...process.env, ...readDotEnv() });

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
    await expect(page.locator(`[id="${id}"] [data-scramble]`).first()).toContainText(`[ ${number} /`);
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

test('el botón «Hablemos» del hero lleva a Contacto y se ve la disponibilidad', async ({ page }) => {
  for (const [home, cta, available, id] of [
    ['/', 'Hablemos', 'Disponible para proyectos', 'contacto'],
    ['/en/', "Let's talk", 'Available for projects', 'contact'],
  ] as const) {
    await page.goto(home);
    const hero = page.locator('section[aria-labelledby="hero-title"]');
    await expect(hero.getByText(available)).toBeVisible();
    const button = hero.getByRole('link', { name: cta });
    await expect(button).toHaveAttribute('href', `${home}#${id}`);
    await button.click();
    await expect(page.getByRole('heading', { level: 2, name: home === '/' ? 'Contacto' : 'Contact' })).toBeInViewport();
  }
});

test('Sobre mí tiene foto con texto alternativo y el stack', async ({ page }) => {
  await page.goto('/');
  const about = page.locator('#sobre-mi');
  await expect(about.getByRole('img')).toHaveAttribute('alt', /^Retrato de/);
  if (OWNER.name) {
    expect(await about.getByRole('img').getAttribute('alt')).toContain(OWNER.name);
    await expect(about.locator('.about-intro')).toContainText(OWNER.name);
  }
  await expect(about.locator('.about-list').first().locator('li')).toHaveText(STACK);
});

test('Contacto enlaza solo los canales configurados', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('#contacto a[data-channel]');
  const channels = contactChannels(OWNER);
  await expect(links).toHaveCount(channels.length);
  for (const [i, channel] of channels.entries()) await expect(links.nth(i)).toHaveAttribute('href', channel.href);
});

test('cada enlace del menú deja su sección en pantalla, también la última', async ({ page }) => {
  await page.goto('/');
  for (const link of await page.locator('nav a[href^="/#"]').all()) {
    const id = (await link.getAttribute('href'))?.split('#')[1];
    await link.click();
    await expect(page.locator(`[id="${id}-title"]`)).toBeInViewport();
  }
});
