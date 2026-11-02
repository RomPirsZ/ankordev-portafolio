// Seguridad (constitución V, plan §8).
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const headers = Object.fromEntries(vercel.headers[0]!.headers.map((h) => [h.key, h.value]));
const csp = headers['Content-Security-Policy']!;

/** El preview de Astro no lee vercel.json: se inyectan todas sus cabeceras. */
async function applyVercelHeaders(page: Page) {
  const injected = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
  await page.route('**/*', async (route) => {
    try {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), ...injected } });
    } catch {
      // Petición cancelada al navegar (p. ej. una precarga): ya no hay a quién responder
    }
  });
}

test('vercel.json define las cabeceras del plan', () => {
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
  expect(vercel.headers[0]!.source).toBe('/(.*)');
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
    expect(csp, 'actualiza el hash en vercel.json').toContain(`'sha256-${hash}'`);
  }
});

test('la CSP permite cada estilo inline del build', async ({ page }) => {
  await page.goto('/');
  const inline = await page.$$eval('style', (styles) => styles.map((s) => s.textContent ?? ''));
  for (const code of inline) {
    const hash = createHash('sha256').update(code).digest('base64');
    expect(csp, 'actualiza el hash de style-src en vercel.json').toContain(`'sha256-${hash}'`);
  }
});

// Cubre CSP, COOP y CORP (errores) y Permissions-Policy (Chrome avisa con un warning
// de cada permiso que no reconoce) a lo largo de una visita normal
test('con todas las cabeceras de vercel.json no hay errores', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || /Permissions-Policy/i.test(msg.text())) errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await applyVercelHeaders(page);
  await page.goto('/');
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
  expect(field('Canonical')).toBe('https://ankordev-portafolio.vercel.app/.well-known/security.txt');
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
