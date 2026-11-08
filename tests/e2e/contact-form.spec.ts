// Plan §9, e2e 6: el formulario de contacto con la API y Turnstile simulados (T26).
// La API real tiene sus tests de integración; aquí se prueba lo que ve y hace el visitante.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page, type Request } from '@playwright/test';
import { HONEYPOT_FIELD, TURNSTILE_FIELD } from '../../src/lib/contact-fields';
import { STUB_TOKEN, stubTurnstile } from './turnstile-stub';

const VALID = { name: 'Ana Pérez', email: 'ana@example.com', message: 'Necesito una web para mi café en Caracas.' };

/** Valor de un campo en un cuerpo multipart. */
function field(request: Request, name: string) {
  const body = request.postDataBuffer()?.toString('utf8') ?? '';
  return body.match(new RegExp(`name="${name}"\\r\\n\\r\\n([^\\r]*)`))?.[1];
}

/** Simula /api/contact y guarda cada petición que recibe. */
async function mockApi(page: Page, reply: { status?: number; json?: unknown } | 'abort' = { json: { ok: true } }) {
  const requests: Request[] = [];
  await page.route('**/api/contact', async (route) => {
    requests.push(route.request());
    if (reply === 'abort') return route.abort('internetdisconnected');
    return route.fulfill({ status: reply.status ?? 200, json: reply.json });
  });
  return requests;
}

async function fill(page: Page, values: Partial<typeof VALID>, labels = { name: 'Nombre', email: 'Email', message: 'Mensaje' }) {
  for (const [key, value] of Object.entries(values)) await page.getByLabel(labels[key as keyof typeof labels], { exact: true }).fill(value);
}

const form = (page: Page) => page.getByRole('form', { name: 'Formulario de contacto' });
const submit = (page: Page) => page.getByRole('button', { name: 'Enviar mensaje' });

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

test('un envío válido llega a la API con los datos y el token, y lleva a gracias', async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto('/');
  await fill(page, VALID);
  await page.getByLabel('Tipo de proyecto (opcional)').selectOption('negocio');
  await page.getByLabel('Presupuesto aproximado (opcional)').fill('500–800 USD');
  await submit(page).click();

  await expect(page).toHaveURL(/\/gracias\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Mensaje enviado' })).toBeVisible();

  expect(requests).toHaveLength(1);
  const [request] = requests;
  expect(request!.method()).toBe('POST');
  expect(request!.headers()['accept']).toBe('application/json');
  expect(request!.headers()['content-type']).toMatch(/^multipart\/form-data/);
  expect(field(request!, 'name')).toBe('Ana Pérez');
  expect(field(request!, 'email')).toBe('ana@example.com');
  expect(field(request!, 'project_type')).toBe('negocio');
  expect(field(request!, 'budget')).toBe('500–800 USD');
  expect(field(request!, 'lang')).toBe('es');
  expect(field(request!, TURNSTILE_FIELD)).toBe(STUB_TOKEN);
  expect(field(request!, HONEYPOT_FIELD)).toBe('');
});

test('en inglés: Turnstile en su idioma y gracias en /en/thanks/', async ({ page }) => {
  await mockApi(page);
  await page.goto('/en/');
  await fill(page, VALID, { name: 'Name', email: 'Email', message: 'Message' });
  await expect.poll(() => page.evaluate(() => (window as { __turnstile?: { options: { language: string } } }).__turnstile?.options.language)).toBe('en');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page).toHaveURL(/\/en\/thanks\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Message sent' })).toBeVisible();
});

test('Turnstile no se descarga hasta que se usa el formulario', async ({ page }) => {
  const loads: string[] = [];
  page.on('request', (request) => request.url().startsWith('https://challenges.cloudflare.com/') && loads.push(request.url()));
  await page.goto('/');
  await page.locator('#contacto').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  expect(loads).toHaveLength(0);

  await page.getByLabel('Nombre', { exact: true }).focus();
  await expect.poll(() => loads.length).toBe(1);
});

test('el honeypot no se puede enfocar ni lo ve un lector de pantalla', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'No rellenar este campo' })).toHaveCount(0);
  await expect(page.locator(`input[name="${HONEYPOT_FIELD}"]`)).toHaveAttribute('tabindex', '-1');
});

test('los errores se ven en el navegador antes de enviar, sin gastar el token', async ({ page }) => {
  const requests = await mockApi(page);
  await page.goto('/');
  await fill(page, { email: 'sin-arroba', message: 'corto' });
  await submit(page).click();

  const name = page.getByLabel('Nombre', { exact: true });
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(name).toHaveAccessibleDescription('Este campo es obligatorio.');
  await expect(page.getByLabel('Email', { exact: true })).toHaveAccessibleDescription('El email no es válido: tiene que ser algo como nombre@dominio.com.');
  await expect(page.getByLabel('Mensaje', { exact: true })).toHaveAccessibleDescription('Mínimo 10 caracteres.');
  await expect(form(page).getByRole('alert')).toHaveText('Hay campos por corregir.');
  expect(requests).toHaveLength(0);

  // Al corregir un campo, su error desaparece
  await name.fill('Ana');
  await expect(name).not.toHaveAttribute('aria-invalid');
  await expect(name).toHaveAccessibleDescription('');
});

test('los errores de campo del servidor se muestran en su campo', async ({ page }) => {
  await mockApi(page, { status: 400, json: { ok: false, error: 'invalid', fields: { email: 'invalid' } } });
  await page.goto('/');
  await fill(page, VALID);
  await submit(page).click();

  const email = page.getByLabel('Email', { exact: true });
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(email).toBeFocused();
  await expect(page).toHaveURL(/\/$/);
});

for (const [reply, text] of [
  [{ status: 403, json: { ok: false, error: 'verification' } }, 'No se pudo completar la verificación anti-spam. Al enviar de nuevo se repite.'],
  [{ status: 429, json: { ok: false, error: 'rate_limit' } }, 'Demasiados envíos seguidos. Se podrá enviar otro en unos minutos.'],
  [{ status: 500, json: { ok: false, error: 'server' } }, 'El mensaje no se pudo enviar por un fallo del servidor. Se puede volver a intentar o escribir por WhatsApp o email.'],
  [{ status: 502, json: undefined }, 'El mensaje no se pudo enviar por un fallo del servidor. Se puede volver a intentar o escribir por WhatsApp o email.'],
  ['abort', 'No hay conexión con el servidor. Se puede volver a intentar en un momento.'],
] as const) {
  test(`un fallo (${reply === 'abort' ? 'sin red' : reply.status}) se explica y se puede volver a enviar`, async ({ page }) => {
    const requests = await mockApi(page, reply);
    await page.goto('/');
    await fill(page, VALID);
    await submit(page).click();

    await expect(form(page).getByRole('alert')).toHaveText(text);
    await expect(submit(page)).toHaveAttribute('aria-disabled', 'false');
    await expect(page).toHaveURL(/\/$/);

    // Cada intento lleva un token nuevo: el anterior ya se gastó
    await submit(page).click();
    await expect.poll(() => requests.length).toBe(2);
  });
}

test('si Turnstile falla, se avisa y no se envía nada', async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await stubTurnstile(page, { fail: true });
  const requests = await mockApi(page);
  await page.goto('/');
  await fill(page, VALID);
  await submit(page).click();

  await expect(form(page).getByRole('alert')).toHaveText('No se pudo completar la verificación anti-spam. Al enviar de nuevo se repite.');
  expect(requests).toHaveLength(0);
});

test('mientras envía: estado visible, botón desactivado y un solo envío aunque se pulse dos veces', async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  const requests: Request[] = [];
  await page.route('**/api/contact', async (route) => {
    requests.push(route.request());
    await held;
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto('/');
  await fill(page, VALID);
  await submit(page).click();

  await expect(form(page).getByRole('status')).toHaveText('Enviando…');
  await expect(submit(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(form(page)).toHaveAttribute('aria-busy', 'true');
  // force: Playwright no pulsa un botón con aria-disabled, pero una persona sí puede
  await submit(page).click({ force: true });

  release();
  await expect(page).toHaveURL(/\/gracias\/$/);
  expect(requests).toHaveLength(1);
});

test('con errores visibles, el formulario sigue sin violaciones serias de axe', async ({ page }) => {
  await page.goto('/');
  await submit(page).click();
  await expect(form(page).getByRole('alert')).not.toBeEmpty();

  const { violations } = await new AxeBuilder({ page })
    .include('#contacto')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
    .analyze();
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
