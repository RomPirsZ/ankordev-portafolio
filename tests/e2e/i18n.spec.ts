// E2E 5 (plan §8, T31): ES ↔ EN. Cada página existe en los dos idiomas, el selector lleva a
// su equivalente y ninguna página en inglés deja ver textos que solo existen en español.
import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';

const dictionary = (lang: string) => JSON.parse(readFileSync(`src/i18n/${lang}.json`, 'utf8')) as Record<string, string>;
const es = dictionary('es');
const en = dictionary('en');

const PAIRS = [
  { es: '/', en: '/en/' },
  { es: '/proyectos/001-restaurante/', en: '/en/projects/001-restaurante/' },
  { es: '/proyectos/002-tienda/', en: '/en/projects/002-tienda/' },
  { es: '/proyectos/003-reservas/', en: '/en/projects/003-reservas/' },
  { es: '/gracias/', en: '/en/thanks/' },
];

for (const pair of PAIRS) {
  test(`${pair.es} ↔ ${pair.en}: el selector lleva a la misma página en el otro idioma`, async ({ page }) => {
    await page.goto(pair.es);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await page.locator('header a[hreflang="en"]').click();
    await expect(page).toHaveURL(new RegExp(`${pair.en.replace(/\//g, '\\/')}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.locator('header a[hreflang="es"]').click();
    await expect(page).toHaveURL(new RegExp(`${pair.es.replace(/\//g, '\\/')}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
}

// Textos que solo existen en español: distintos de su traducción y que no forman parte de
// ningún texto inglés (así «Landing» no cuenta, porque «Landing page» lo contiene)
const englishValues = Object.values(en);
const SPANISH_ONLY = Object.entries(es)
  .filter(([key, value]) => value !== en[key] && value.length >= 4)
  .filter(([, value]) => !englishValues.some((english) => english.includes(value)))
  .map(([, value]) => value.replace(/\{\w+\}/g, '').replace(/\u00a0/g, ' ').trim())
  .filter((value) => value.length >= 4);

/** Texto visible y textos accesibles (alt, aria-label, title, placeholder) de la página. */
async function readableText(page: Page) {
  return page.evaluate(() => {
    const attributes = [...document.querySelectorAll('[alt], [aria-label], [title], [placeholder]')].flatMap((element) =>
      ['alt', 'aria-label', 'title', 'placeholder'].map((name) => element.getAttribute(name) ?? ''),
    );
    return `${document.body.innerText} ${attributes.join(' ')} ${document.title}`.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ');
  });
}

for (const { en: path } of PAIRS) {
  test(`${path}: ningún texto de la interfaz queda en español`, async ({ page }) => {
    await page.goto(path);
    const text = await readableText(page);
    expect(SPANISH_ONLY.filter((value) => text.includes(value))).toEqual([]);
  });
}

test('cada idioma muestra su tarifa (spec §5.4)', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.package-amount')).toHaveText(['$300', '$750', '$1.500']);
  await page.goto('/en/');
  await expect(page.locator('.package-amount')).toHaveText(['$500', '$1,300', '$2,600']);
});

test('el código de las páginas no lleva comentarios de desarrollo', async ({ request }) => {
  for (const path of ['/', '/en/', '/en/projects/001-restaurante/']) {
    expect(await (await request.get(path)).text(), path).not.toContain('<!--');
  }
});
