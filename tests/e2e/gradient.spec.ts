// Fondo de gradiente (plan §6.1, constitución II 1.2.0).
import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';
import { SECURITY_HEADERS } from './headers';

const linear = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/**
 * Luminancia mínima y máxima del fondo real (canvas y grano incluidos) en varios
 * fotogramas. Se mide con un desenfoque de 1,2 px: el grano varía píxel a píxel y lo
 * que el texto tiene detrás a la escala de su trazo (≥ 2 px) es la media local.
 */
async function backgroundLuminance(page: Page, frames = 4) {
  // Hoja construida por CSSOM: la CSP real (sin estilos inline) bloquearía un <style>
  await page.evaluate(() => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('body > :not(.gradient-bg) { visibility: hidden !important } body { background-image: none !important }');
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  });
  let min = 1;
  let max = 0;
  for (let frame = 0; frame < frames; frame++) {
    if (frame) await page.waitForTimeout(1200);
    const { data, info } = await sharp(await page.screenshot()).blur(1.2).raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += info.channels * 5) {
      const l = 0.2126 * linear(data[i]!) + 0.7152 * linear(data[i + 1]!) + 0.0722 * linear(data[i + 2]!);
      min = Math.min(min, l);
      max = Math.max(max, l);
    }
  }
  return { min, max };
}

const gradientRequest = (url: string) => /\/_astro\/(GradientBackground|ShaderBackground)\./.test(url);

test.describe('escritorio con movimiento', () => {
  test.skip(({ isMobile }) => isMobile, 'El fondo animado es solo de escritorio');
  test.setTimeout(60_000);

  test('el fondo animado aparece y solo pide recursos del propio sitio', async ({ page, baseURL }) => {
    const requests: string[] = [];
    const errors: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.locator('.gradient-bg canvas')).toBeAttached({ timeout: 20_000 });
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
    // Luz «3d»: ningún HDR ni otro recurso externo
    expect(requests.filter((url) => url.includes('.hdr'))).toEqual([]);

    expect(requests.filter((url) => !url.startsWith(baseURL!))).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('con las cabeceras de _headers no hay errores (isla y WebGL)', async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') violations.push(msg.text());
    });
    page.on('pageerror', (error) => violations.push(error.message));
    // El preview aplica todas las cabeceras (CSP, COOP, CORP, Permissions-Policy…)
    const response = await page.goto('/');
    const received = response!.headers();
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) expect(received[key.toLowerCase()], key).toBe(value);
    await expect(page.locator('.gradient-bg canvas')).toBeAttached({ timeout: 20_000 });
    await page.waitForTimeout(3000);
    expect(violations).toEqual([]);
  });

  test('Oscuro: el texto secundario mantiene AA sobre cualquier punto del fondo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.gradient-bg canvas')).toBeAttached({ timeout: 20_000 });
    await page.waitForTimeout(2500);
    // Ceniza (#B7B6B4) necesita luminancia de fondo ≤ 0,063 para 4,5:1
    expect((await backgroundLuminance(page)).max).toBeLessThanOrEqual(0.063);
  });

  test('Claro: la tinta mantiene AA sobre cualquier punto del fondo', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'claro'));
    await page.goto('/');
    await expect(page.locator('.gradient-bg canvas')).toBeAttached({ timeout: 20_000 });
    await page.waitForTimeout(2500);
    // Tinta (#1E1F22) necesita luminancia de fondo ≥ 0,236 para 4,5:1
    expect((await backgroundLuminance(page)).min).toBeGreaterThanOrEqual(0.236);
  });

  test('el fondo sigue al tema y persiste al navegar, sin reiniciarse', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('.gradient-bg canvas');
    await expect(canvas).toBeAttached({ timeout: 20_000 });
    await canvas.evaluate((element) => (element.dataset['persisted'] = 'yes'));

    await page.locator('[data-theme-value="claro"]').click();
    await page.locator('.project-link').first().click();
    await expect(page).toHaveURL(/\/proyectos\//);
    await expect(page.locator('.gradient-bg canvas')).toHaveAttribute('data-persisted', 'yes');
    await page.waitForTimeout(2500);
    expect((await backgroundLuminance(page, 2)).min).toBeGreaterThanOrEqual(0.236);
  });
});

test.describe('fondo estático con grano (móvil)', () => {
  test.skip(({ isMobile }) => !isMobile, 'Comprobación para móvil');

  test('oscuro: el texto secundario mantiene AA', async ({ page }) => {
    await page.goto('/');
    expect((await backgroundLuminance(page, 1)).max).toBeLessThanOrEqual(0.063);
  });

  test('claro: la tinta mantiene AA', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'claro'));
    await page.goto('/');
    expect((await backgroundLuminance(page, 1)).min).toBeGreaterThanOrEqual(0.236);
  });
});

test('en móvil el fondo es estático y no descarga nada del gradiente', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Comprobación para móvil');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.gradient-bg canvas')).toHaveCount(0);
  expect(requests.filter(gradientRequest)).toEqual([]);
  expect(await page.locator('.gradient-bg').evaluate((element) => getComputedStyle(element).backgroundImage)).toContain('radial-gradient');
});

// La barra del navegador móvil no se puede emular: se comprueba la regla. Con
// inset: 0, al ocultarse la barra quedaba una franja sin fondo hasta acabar el scroll.
test('en móvil el fondo mide el viewport grande y no salta al ocultarse la barra', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Comprobación para móvil');
  await page.goto('/');
  const height = await page.evaluate(() => {
    const find = (rules: CSSRuleList): string | undefined => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSStyleRule && rule.selectorText === '.gradient-bg') return rule.style.height;
        if ('cssRules' in rule) {
          const found = find((rule as CSSGroupingRule).cssRules);
          if (found) return found;
        }
      }
      return undefined;
    };
    for (const sheet of Array.from(document.styleSheets)) {
      const found = find(sheet.cssRules);
      if (found) return found;
    }
    return undefined;
  });
  expect(height).toBe('100lvh');
  const box = await page.locator('.gradient-bg').boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(page.viewportSize()!.height);
});

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('el fondo es estático y no descarga nada del gradiente', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.gradient-bg canvas')).toHaveCount(0);
    expect(requests.filter(gradientRequest)).toEqual([]);
  });
});
