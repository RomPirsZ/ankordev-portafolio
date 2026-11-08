// /api/contact sobre el build real, en workerd (T24). Los casos completos están en
// tests/integration/contact.test.ts; aquí se comprueba que la ruta está conectada al Worker.
// Solo casos que se resuelven antes de la red: ninguno llega a Supabase ni a Resend.
import { test, expect } from '@playwright/test';
import { HONEYPOT_FIELD, MAX_BODY_BYTES } from '../../src/lib/contact-fields';

const VALID = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  message: 'Necesito una web para mi café en Caracas.',
  lang: 'es',
};

// La API no depende del dispositivo: basta con escritorio
test.skip(({ isMobile }) => isMobile, 'la API no depende del dispositivo');

test('responde desde el Worker, sin caché y con sus cabeceras de seguridad', async ({ request }) => {
  const response = await request.get('/api/contact');
  expect(response.status()).toBe(405);
  expect(response.headers()['allow']).toBe('POST');
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['content-security-policy']).toBe("default-src 'none'; frame-ancestors 'none'");
  expect(await response.json()).toEqual({ ok: false, error: 'method' });
});

test('sin token de Turnstile no acepta el envío', async ({ request }) => {
  const response = await request.post('/api/contact', { data: VALID, headers: { Accept: 'application/json' } });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ ok: false, error: 'verification' });
});

test('rechaza un cuerpo de más de 10 KB', async ({ request }) => {
  const response = await request.post('/api/contact', {
    data: { ...VALID, message: 'a'.repeat(MAX_BODY_BYTES) },
    headers: { Accept: 'application/json' },
  });
  expect(response.status()).toBe(413);
});

test('un POST nativo con el honeypot relleno redirige a gracias sin guardar', async ({ request, baseURL }) => {
  const response = await request.post('/api/contact', {
    form: { ...VALID, [HONEYPOT_FIELD]: 'x' },
    headers: { Accept: 'text/html', Origin: baseURL! },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  expect(response.headers()['location']).toBe('/gracias/');
});

test('Astro rechaza un formulario enviado desde otro sitio', async ({ request }) => {
  const response = await request.post('/api/contact', {
    form: VALID,
    headers: { Accept: 'text/html', Origin: 'https://otro-sitio.example' },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(403);
});
