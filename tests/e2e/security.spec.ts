import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const headers = Object.fromEntries(vercel.headers[0]!.headers.map((h) => [h.key, h.value]));
const csp = headers['Content-Security-Policy']!;

test('vercel.json define las cabeceras del plan', () => {
  for (const key of [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy',
    'X-Frame-Options',
  ]) {
    expect(headers[key], key).toBeTruthy();
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

test('con la CSP aplicada no hay violaciones', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text())) violations.push(msg.text());
  });
  // El preview de Astro no lee vercel.json, así que se inyecta la cabecera
  await page.route('**/*', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': csp } });
  });
  await page.goto('/');
  await page.locator('[data-theme-value="naranja"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'naranja');
  expect(violations).toEqual([]);
});
