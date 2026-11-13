// SEO (T32, plan §10): metadatos, vista previa al compartir, sitemap, robots y JSON-LD.
import { test, expect, type Page } from '@playwright/test';
import { SITE_URL } from '../../src/lib/site';

const head = (page: Page, selector: string, attribute = 'content') => page.locator(`head ${selector}`).getAttribute(attribute);

for (const { path, other, lang, image } of [
  { path: '/', other: '/en/', lang: 'es', image: '/og/og-es.png' },
  { path: '/en/', other: '/', lang: 'en', image: '/og/og-en.png' },
]) {
  test(`${path}: description, canonical, hreflang y vista previa`, async ({ page, request }) => {
    await page.goto(path);
    const description = await head(page, 'meta[name="description"]');
    expect(description?.length).toBeGreaterThanOrEqual(120);

    expect(await head(page, 'link[rel="canonical"]', 'href')).toBe(`${SITE_URL}${path}`);
    expect(await head(page, `link[hreflang="${lang}"]`, 'href')).toBe(`${SITE_URL}${path}`);
    expect(await head(page, `link[hreflang="${lang === 'es' ? 'en' : 'es'}"]`, 'href')).toBe(`${SITE_URL}${other}`);
    expect(await head(page, 'link[hreflang="x-default"]', 'href')).toBe(`${SITE_URL}/`);

    expect(await head(page, 'meta[property="og:title"]')).toBe(await page.title());
    expect(await head(page, 'meta[property="og:description"]')).toBe(description);
    expect(await head(page, 'meta[property="og:url"]')).toBe(`${SITE_URL}${path}`);
    expect(await head(page, 'meta[property="og:image"]')).toBe(`${SITE_URL}${image}`);
    expect(await head(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');

    // La imagen existe, es PNG de 1200×630 y pesa lo bastante poco para WhatsApp
    const png = await request.get(image);
    expect(png.status()).toBe(200);
    const bytes = await png.body();
    expect(bytes.length).toBeLessThan(300_000);
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 630]);
  });

  test(`${path}: JSON-LD con el sitio, el servicio y su autor`, async ({ page }) => {
    await page.goto(path);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}');
    const types = (data['@graph'] as { '@type': string }[]).map((node) => node['@type']);
    expect(types).toEqual(expect.arrayContaining(['WebSite', 'ProfessionalService']));
    // Nada inventado (PRODUCT.md): sin valoraciones ni precios
    expect(JSON.stringify(data)).not.toMatch(/aggregateRating|review|priceRange/i);
  });
}

test('un caso de estudio tiene su canonical y la alterna del otro idioma', async ({ page }) => {
  await page.goto('/proyectos/001-restaurante/');
  expect(await head(page, 'link[rel="canonical"]', 'href')).toBe(`${SITE_URL}/proyectos/001-restaurante/`);
  expect(await head(page, 'link[hreflang="en"]', 'href')).toBe(`${SITE_URL}/en/projects/001-restaurante/`);
  expect(await head(page, 'meta[property="og:type"]')).toBe('article');
});

test('gracias queda fuera de los buscadores y sin canonical', async ({ page }) => {
  await page.goto('/gracias/');
  expect(await head(page, 'meta[name="robots"]')).toBe('noindex');
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
});

test('sitemap con todas las páginas indexables y sin gracias ni 404', async ({ request }) => {
  const index = await request.get('/sitemap-index.xml');
  expect(index.status()).toBe(200);
  expect(await index.text()).toContain(`${SITE_URL}/sitemap-0.xml`);

  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!.replace(SITE_URL, ''));
  expect(urls).toEqual(expect.arrayContaining(['/', '/en/', '/proyectos/001-restaurante/', '/en/projects/001-restaurante/']));
  expect(urls.some((url) => /gracias|thanks|404/.test(url))).toBe(false);
  // Cada caso enlaza su versión en el otro idioma
  expect(sitemap).toContain(`hreflang="en" href="${SITE_URL}/en/projects/001-restaurante/"`);
});

test('robots.txt deja rastrear el sitio, no la API, y apunta al sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /api/');
  expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap-index.xml`);
});
