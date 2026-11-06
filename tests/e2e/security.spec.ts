// Seguridad (constitución V, plan §8).
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test, expect, type APIResponse } from '@playwright/test';
import { CSP as csp, HEADER_RULES, SECURITY_HEADERS as headers } from './headers';

/** Cada cabecera de _headers llega con su valor exacto. */
function expectSecurityHeaders(response: APIResponse | null, what: string) {
  expect(response, what).not.toBeNull();
  const received = response!.headers();
  for (const [key, value] of Object.entries(headers)) expect(received[key.toLowerCase()], `${what}: ${key}`).toBe(value);
}

test('_headers define las cabeceras del plan para todo el sitio', () => {
  for (const key of [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'X-Frame-Options',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
    'X-Permitted-Cross-Domain-Policies',
  ]) {
    expect(headers[key], key).toBeTruthy();
  }
  expect(HEADER_RULES.map((rule) => rule.path)).toEqual(['/*']);
});

// El preview del adaptador corre en workerd y aplica _headers como producción
test('el servidor envía las cabeceras en páginas, assets y el 404', async ({ request }) => {
  for (const path of ['/', '/en/', '/proyectos/001-restaurante/', '/.well-known/security.txt']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expectSecurityHeaders(response, path);
  }
  const asset = (await (await request.get('/')).text()).match(/\/_astro\/[^"]+\.css/)![0];
  const assetResponse = await request.get(asset);
  expectSecurityHeaders(assetResponse, asset);
  // Assets con hash en el nombre: caché de un año (lo añade el adaptador)
  expect(assetResponse.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
});

test('una ruta que no existe responde la página 404 con estado 404 y las cabeceras', async ({ request }) => {
  const response = await request.get('/no-existe');
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain('<html');
  expectSecurityHeaders(response, '/no-existe');
});

test('la CSP no abre puertas: sin unsafe-*, sin plugins, sin <base> y sin iframes ajenos', () => {
  expect(csp).not.toMatch(/'unsafe-(inline|eval|hashes)'|'strict-dynamic'|\*/);
  for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "frame-ancestors 'none'"]) {
    expect(csp).toContain(directive);
  }
});

test('la CSP permite cada script inline del build', async ({ page }) => {
  await page.goto('/');
  const inline = await page.$$eval('script:not([src])', (scripts) => scripts.map((s) => s.textContent ?? ''));
  expect(inline.length).toBeGreaterThan(0);
  for (const code of inline) {
    const hash = createHash('sha256').update(code).digest('base64');
    expect(csp, 'actualiza el hash en public/_headers').toContain(`'sha256-${hash}'`);
  }
});

test('la CSP permite cada estilo inline del build', async ({ page }) => {
  await page.goto('/');
  const inline = await page.$$eval('style', (styles) => styles.map((s) => s.textContent ?? ''));
  for (const code of inline) {
    const hash = createHash('sha256').update(code).digest('base64');
    expect(csp, 'actualiza el hash de style-src en public/_headers').toContain(`'sha256-${hash}'`);
  }
});

// Cubre CSP, COOP y CORP (errores) y Permissions-Policy (Chrome avisa con un warning
// de cada permiso que no reconoce) a lo largo de una visita normal
test('con todas las cabeceras de _headers no hay errores', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || /Permissions-Policy/i.test(msg.text())) errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  const response = await page.goto('/');
  // Sin cabeceras, el test pasaría sin probar nada
  expect(response!.headers()['content-security-policy']).toBe(csp);
  await page.locator('[data-theme-value="claro"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'claro');
  await page.locator('.project-link').first().click();
  await expect(page).toHaveURL(/\/proyectos\//);
  await page.goto('/en/');
  expect(errors).toEqual([]);
});

test('security.txt indica cómo reportar vulnerabilidades y sigue vigente (RFC 9116)', async ({ request }) => {
  const response = await request.get('/.well-known/security.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  const field = (name: string) => text.match(new RegExp(`^${name}: (.+)$`, 'm'))?.[1];
  expect(field('Contact')).toMatch(/^https:\/\//);
  expect(field('Canonical')).toBe('https://ankordev-portafolio.ankordev.workers.dev/.well-known/security.txt');
  // Caducado deja de ser válido: renovar Expires (≤ 1 año) si este test falla
  expect(new Date(field('Expires')!).getTime()).toBeGreaterThan(Date.now());
});

test('npm no ejecuta scripts de instalación ni instala desde fuera del registro', () => {
  const npmrc = readFileSync('.npmrc', 'utf8');
  for (const line of ['ignore-scripts=true', 'allow-git=none', 'allow-remote=none', 'allow-file=none', 'allow-directory=none']) {
    expect(npmrc).toMatch(new RegExp(`^${line}$`, 'm'));
  }
  expect(npmrc).toMatch(/^min-release-age=\d+$/m);
});

test('las Actions de la CI están fijadas por SHA de commit', () => {
  // Un workflow sin Actions de terceros (p. ej. keepalive.yml, solo curl) es válido
  let total = 0;
  for (const file of readdirSync('.github/workflows')) {
    const uses = [...readFileSync(`.github/workflows/${file}`, 'utf8').matchAll(/uses:\s*(\S+)/g)].map((m) => m[1]!);
    total += uses.length;
    for (const action of uses) expect(action, file).toMatch(/@[0-9a-f]{40}$/);
  }
  expect(total).toBeGreaterThan(0);
});
