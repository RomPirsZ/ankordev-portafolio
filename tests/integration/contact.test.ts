// Handler de /api/contact con Supabase, Turnstile y Resend simulados (plan §9):
// 200, 400, 403, 405, 413, 429, 500 y honeypot, en JSON y como POST nativo (HTML), y el tope
// de avisos por email (T26f).
import { describe, expect, it, vi } from 'vitest';
import { HONEYPOT_FIELD, MAX_BODY_BYTES, TURNSTILE_FIELD } from '../../src/lib/contact-fields';
import { handleContact, type ContactLog } from '../../src/lib/contact-handler';
import { RECENT_LEADS_RPC } from '../../src/lib/leads';
import { NOTIFY_CAP_24H, RESEND_API_URL } from '../../src/lib/notify';
import { createRateLimiter } from '../../src/lib/rate-limit';
import { SITEVERIFY_URL } from '../../src/lib/turnstile';

const ENDPOINT = 'https://ankordev.example/api/contact';
const SUPABASE_URL = 'https://proyecto.supabase.co';
const LEADS_URL = `${SUPABASE_URL}/rest/v1/leads`;
const RECENT_URL = `${SUPABASE_URL}/rest/v1/rpc/${RECENT_LEADS_RPC}`;
const ENV = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY: 'sb_publishable_prueba',
  TURNSTILE_SECRET_KEY: 'secreto-de-prueba',
  RESEND_API_KEY: 're_prueba',
  CONTACT_NOTIFY_TO: 'yo@example.com',
};

const VALID = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  project_type: 'negocio',
  budget: '500–800 USD',
  message: 'Necesito una web para mi café en Caracas.',
  lang: 'es',
  [TURNSTILE_FIELD]: 'token-de-prueba',
};

interface Services {
  turnstile?: unknown;
  supabase?: number | Error;
  /** Contactos de las últimas 24 h que devuelve el contador, o el estado HTTP de su fallo. */
  recent?: number | { status: number };
  resend?: number;
}

/** fetch simulado que responde como cada servicio; cualquier otra URL hace fallar el test. */
function services({ turnstile = { success: true }, supabase = 201, recent = 1, resend = 200 }: Services = {}) {
  return vi.fn<typeof globalThis.fetch>(async (input) => {
    const url = String(input);
    if (url === SITEVERIFY_URL) return Response.json(turnstile);
    if (url === RECENT_URL) return typeof recent === 'number' ? Response.json(recent) : new Response('{"code":"PGRST202"}', recent);
    if (url.startsWith(SUPABASE_URL)) {
      if (supabase instanceof Error) throw supabase;
      return new Response(null, { status: supabase });
    }
    if (url === RESEND_API_URL) return new Response('{"id":"1"}', { status: resend });
    throw new Error(`fetch inesperado: ${url}`);
  });
}

const callsTo = (fetch: ReturnType<typeof services>, prefix: string) => fetch.mock.calls.filter(([url]) => String(url).startsWith(prefix));

function setup(options: Services & { env?: Record<string, unknown> } = {}) {
  const fetch = services(options);
  const log = vi.fn<ContactLog>();
  const limiter = createRateLimiter();
  const send = (request: Request) => handleContact(request, { env: options.env ?? ENV, limiter, fetch, log });
  return { fetch, log, send };
}

const IP = '203.0.113.7';

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'CF-Connecting-IP': IP, ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/** Como lo envía un navegador sin JS: urlencoded y pidiendo HTML. */
function formRequest(fields: Record<string, string>, headers: Record<string, string> = {}) {
  return new Request(ENDPOINT, {
    method: 'POST',
    headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'CF-Connecting-IP': IP, ...headers },
    body: new URLSearchParams(fields),
  });
}

describe('200: envío válido', () => {
  it('guarda el contacto, avisa por email y responde { ok: true }', async () => {
    const { fetch, send } = setup();
    const response = await send(jsonRequest(VALID));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await response.json()).toEqual({ ok: true });

    // Turnstile recibe el token y la IP del visitante
    const [, verifyInit] = callsTo(fetch, SITEVERIFY_URL)[0]!;
    const verifyBody = verifyInit!.body as URLSearchParams;
    expect(verifyBody.get('response')).toBe('token-de-prueba');
    expect(verifyBody.get('remoteip')).toBe(IP);

    // A Supabase solo llegan las columnas del formulario: ni el token ni el honeypot
    const [, saveInit] = callsTo(fetch, LEADS_URL)[0]!;
    expect(JSON.parse(saveInit!.body as string)).toEqual({
      name: 'Ana Pérez',
      email: 'ana@example.com',
      project_type: 'negocio',
      budget: '500–800 USD',
      message: 'Necesito una web para mi café en Caracas.',
      lang: 'es',
    });

    const [, notifyInit] = callsTo(fetch, RESEND_API_URL)[0]!;
    expect(JSON.parse(notifyInit!.body as string)).toMatchObject({ to: ['yo@example.com'], reply_to: 'ana@example.com' });
  });

  it('el orden es Turnstile → Supabase (guardar y contar) → Resend', async () => {
    const { fetch, send } = setup();
    await send(jsonRequest(VALID));
    expect(fetch.mock.calls.map(([url]) => String(url).split('?')[0])).toEqual([SITEVERIFY_URL, LEADS_URL, RECENT_URL, RESEND_API_URL]);
  });

  it('un POST nativo del formulario redirige con 303 a la página de gracias de su idioma', async () => {
    const { send } = setup();
    const es = await send(formRequest(VALID));
    expect(es.status).toBe(303);
    expect(es.headers.get('location')).toBe('/gracias/');

    const en = await send(formRequest({ ...VALID, lang: 'en' }));
    expect(en.headers.get('location')).toBe('/en/thanks/');
  });

  it('también acepta multipart/form-data', async () => {
    const { fetch, send } = setup();
    const form = new FormData();
    for (const [key, value] of Object.entries(VALID)) form.set(key, value);
    const response = await send(new Request(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json', 'CF-Connecting-IP': IP }, body: form }));

    expect(response.status).toBe(200);
    expect(callsTo(fetch, LEADS_URL)).toHaveLength(1);
  });

  it('si el aviso por email falla, el contacto ya está guardado: responde 200 y lo deja en los logs', async () => {
    const { log, send } = setup({ resend: 500 });
    const response = await send(jsonRequest(VALID));

    expect(response.status).toBe(200);
    expect(log).toHaveBeenCalledWith('error', 'notify-failed', { error: 'http-500' });
  });

  it('las respuestas llevan sus cabeceras de seguridad y no se guardan en caché', async () => {
    const { send } = setup();
    for (const response of [await send(jsonRequest(VALID)), await send(formRequest(VALID))]) {
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('content-security-policy')).toBe("default-src 'none'; frame-ancestors 'none'");
      expect(response.headers.get('x-frame-options')).toBe('DENY');
      expect(response.headers.get('strict-transport-security')).toContain('max-age=');
    }
  });
});

describe('400: datos inválidos', () => {
  it('devuelve el código de error de cada campo y no guarda nada', async () => {
    const { fetch, send } = setup();
    const response = await send(jsonRequest({ ...VALID, name: '', email: 'sin-arroba', message: 'corto' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: 'invalid',
      fields: { name: 'required', email: 'invalid', message: 'too_short' },
    });
    expect(callsTo(fetch, LEADS_URL)).toHaveLength(0);
    expect(callsTo(fetch, RESEND_API_URL)).toHaveLength(0);
  });

  it('un POST nativo vuelve al aviso de error del formulario, en su idioma', async () => {
    const { send } = setup();
    const es = await send(formRequest({ ...VALID, message: 'corto' }));
    expect(es.status).toBe(303);
    expect(es.headers.get('location')).toBe('/#contacto-error');

    const en = await send(formRequest({ ...VALID, message: 'corto', lang: 'en' }));
    expect(en.headers.get('location')).toBe('/en/#contact-error');
  });

  it('rechaza cuerpos que no son un formulario ni un objeto JSON', async () => {
    const { send } = setup();
    const cases = [
      jsonRequest('{"name": "Ana"'),
      jsonRequest([VALID]),
      jsonRequest('null'),
      new Request(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain', Accept: 'application/json' }, body: 'hola' }),
      new Request(ENDPOINT, { method: 'POST', headers: { Accept: 'application/json' } }),
    ];
    for (const request of cases) {
      const response = await send(request);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ ok: false, error: 'invalid' });
    }
  });
});

describe('403: Turnstile', () => {
  it('sin token no se llama a nadie', async () => {
    const { fetch, send } = setup();
    const withoutToken: Record<string, string> = { ...VALID };
    delete withoutToken[TURNSTILE_FIELD];
    const response = await send(jsonRequest(withoutToken));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: 'verification' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('un token que Cloudflare no valida no guarda nada ni escribe en los logs', async () => {
    const { fetch, log, send } = setup({ turnstile: { success: false, 'error-codes': ['timeout-or-duplicate'] } });
    const response = await send(jsonRequest(VALID));

    expect(response.status).toBe(403);
    expect(callsTo(fetch, LEADS_URL)).toHaveLength(0);
    // Inventar un token no cuesta nada: si dejara un log, gastaría el cupo de Workers Logs
    expect(log).not.toHaveBeenCalled();
  });

  it('se verifica antes de validar: un envío inválido sin token también es 403', async () => {
    const { send } = setup();
    const response = await send(jsonRequest({ name: '' }));
    expect(response.status).toBe(403);
  });
});

describe('405: método', () => {
  it('solo admite POST', async () => {
    const { fetch, send } = setup();
    for (const method of ['GET', 'PUT', 'DELETE', 'OPTIONS']) {
      const response = await send(new Request(ENDPOINT, { method }));
      expect(response.status).toBe(405);
      expect(response.headers.get('allow')).toBe('POST');
      expect(await response.json()).toEqual({ ok: false, error: 'method' });
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('413: cuerpo demasiado grande', () => {
  const big = { ...VALID, message: 'a'.repeat(MAX_BODY_BYTES) };

  it('lo rechaza por su Content-Length sin leerlo', async () => {
    const { fetch, send } = setup();
    const response = await send(jsonRequest(big));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ ok: false, error: 'too_large' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('también sin Content-Length: corta al pasar del límite', async () => {
    const { send } = setup();
    const bytes = new TextEncoder().encode(JSON.stringify(big));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < bytes.length; i += 1024) controller.enqueue(bytes.slice(i, i + 1024));
        controller.close();
      },
    });
    const request = new Request(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: stream,
      duplex: 'half',
    } as RequestInit);
    expect(request.headers.has('content-length')).toBe(false);
    expect((await send(request)).status).toBe(413);
  });

  it('un texto real en el máximo de cada campo cabe, aun urlencoded (que infla las tildes)', async () => {
    const { send } = setup();
    const fill = (text: string, length: number) => text.repeat(Math.ceil(length / text.length)).slice(0, length);
    const longest = {
      ...VALID,
      name: fill('María José Hernández ', 80),
      budget: fill('Entre 800 y 1.500 USD ', 40),
      message: fill('Necesito una página web para mi café en Mérida, con menú y reservas. ', 2000),
    };
    expect((await send(formRequest(longest))).status).toBe(303);
  });
});

describe('429: límite de envíos', () => {
  it('a partir del sexto envío en 10 minutos desde la misma IP, con Retry-After', async () => {
    const { fetch, send } = setup();
    for (let i = 0; i < 5; i++) expect((await send(jsonRequest(VALID))).status).toBe(200);

    const blocked = await send(jsonRequest(VALID));
    expect(blocked.status).toBe(429);
    expect(await blocked.json()).toEqual({ ok: false, error: 'rate_limit' });
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(callsTo(fetch, LEADS_URL)).toHaveLength(5);

    // Otra IP no se ve afectada
    expect((await send(jsonRequest(VALID, { 'CF-Connecting-IP': '198.51.100.20' }))).status).toBe(200);
  });

  it('en IPv6 cuenta el prefijo /64: cambiar de dirección dentro de él no da más envíos', async () => {
    const { send } = setup();
    for (let i = 1; i <= 5; i++) {
      expect((await send(jsonRequest(VALID, { 'CF-Connecting-IP': `2001:db8:1:2::${i}` }))).status).toBe(200);
    }
    expect((await send(jsonRequest(VALID, { 'CF-Connecting-IP': '2001:db8:1:2::99' }))).status).toBe(429);
    expect((await send(jsonRequest(VALID, { 'CF-Connecting-IP': '2001:db8:1:3::1' }))).status).toBe(200);
  });

  it('los envíos inválidos no gastan el cupo', async () => {
    const { send } = setup();
    for (let i = 0; i < 10; i++) expect((await send(jsonRequest({ ...VALID, email: 'mal' }))).status).toBe(400);
    expect((await send(jsonRequest(VALID))).status).toBe(200);
  });
});

describe('500: fallo del servidor', () => {
  it('si Supabase falla, error genérico, sin aviso por email y con el detalle en los logs', async () => {
    for (const supabase of [500, new TypeError('fetch failed')]) {
      const { fetch, log, send } = setup({ supabase });
      const response = await send(jsonRequest(VALID));

      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ ok: false, error: 'server' });
      expect(callsTo(fetch, RESEND_API_URL)).toHaveLength(0);
      expect(log).toHaveBeenCalledWith('error', 'save-failed', { error: supabase instanceof Error ? 'network-error' : 'http-500' });
    }
  });

  it('sin la configuración de Supabase no se intenta guardar', async () => {
    const { fetch, log, send } = setup({ env: { ...ENV, SUPABASE_URL: undefined } });
    expect((await send(jsonRequest(VALID))).status).toBe(500);
    expect(callsTo(fetch, LEADS_URL)).toHaveLength(0);
    expect(log).toHaveBeenCalledWith('error', 'save-failed', { error: 'missing-config' });
  });

  it('sin el secreto de Turnstile es un fallo de configuración, no del visitante', async () => {
    const { fetch, log, send } = setup({ env: { ...ENV, TURNSTILE_SECRET_KEY: '' } });
    expect((await send(jsonRequest(VALID))).status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('error', 'turnstile-misconfigured', { codes: ['missing-input-secret'] });
  });

  it('un POST nativo vuelve al aviso de error', async () => {
    const { send } = setup({ supabase: 503 });
    const response = await send(formRequest(VALID));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/#contacto-error');
  });
});

describe('honeypot', () => {
  it('si un bot rellena el campo trampa, parece un éxito pero no se verifica, guarda ni avisa', async () => {
    const { fetch, log, send } = setup();
    const json = await send(jsonRequest({ ...VALID, [HONEYPOT_FIELD]: 'https://spam.example' }));
    expect(json.status).toBe(200);
    expect(await json.json()).toEqual({ ok: true });

    const form = await send(formRequest({ ...VALID, [HONEYPOT_FIELD]: 'x' }));
    expect(form.status).toBe(303);
    expect(form.headers.get('location')).toBe('/gracias/');

    expect(fetch).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
  });

  it('vacío o con espacios no cuenta como relleno', async () => {
    const { send } = setup();
    expect((await send(jsonRequest({ ...VALID, [HONEYPOT_FIELD]: '  ' }))).status).toBe(200);
  });
});

// Auditoría 2026-11-10: sin tope, quien consiguiera tokens de Turnstile válidos podía agotar
// la cuota diaria de Resend y dejar sin aviso a los clientes reales
describe('tope de avisos por email (T26f)', () => {
  it(`hasta ${NOTIFY_CAP_24H} contactos en 24 horas, cada uno avisa`, async () => {
    const { fetch, log, send } = setup({ recent: NOTIFY_CAP_24H });
    expect((await send(jsonRequest(VALID))).status).toBe(200);
    expect(callsTo(fetch, RESEND_API_URL)).toHaveLength(1);
    expect(log).not.toHaveBeenCalled();
  });

  it('pasado el tope, el contacto se guarda y el visitante ve éxito, pero no se envía email', async () => {
    const { fetch, log, send } = setup({ recent: NOTIFY_CAP_24H + 1 });
    const json = await send(jsonRequest(VALID));
    expect(json.status).toBe(200);
    expect(await json.json()).toEqual({ ok: true });

    const form = await send(formRequest(VALID));
    expect(form.status).toBe(303);
    expect(form.headers.get('location')).toBe('/gracias/');

    expect(callsTo(fetch, LEADS_URL)).toHaveLength(2);
    expect(callsTo(fetch, RESEND_API_URL)).toHaveLength(0);
    expect(log).toHaveBeenCalledWith('warn', 'notify-capped', { recent: NOTIFY_CAP_24H + 1 });
  });

  it('si no se puede contar (por ejemplo, falta la función en Supabase), avisa igual y lo registra', async () => {
    const { fetch, log, send } = setup({ recent: { status: 404 } });
    expect((await send(jsonRequest(VALID))).status).toBe(200);
    expect(callsTo(fetch, RESEND_API_URL)).toHaveLength(1);
    expect(log).toHaveBeenCalledWith('warn', 'count-failed', { error: 'http-404' });
  });

  it('si no se guardó, ni cuenta ni avisa', async () => {
    const { fetch, send } = setup({ supabase: 500 });
    expect((await send(jsonRequest(VALID))).status).toBe(500);
    expect(callsTo(fetch, RECENT_URL)).toHaveLength(0);
    expect(callsTo(fetch, RESEND_API_URL)).toHaveLength(0);
  });
});

describe('logs', () => {
  it('nunca llevan datos del visitante', async () => {
    const { log, send } = setup({ supabase: 500, turnstile: { success: true } });
    await send(jsonRequest(VALID));
    await send(jsonRequest({ ...VALID, [HONEYPOT_FIELD]: 'x' }));
    const written = JSON.stringify(log.mock.calls);
    for (const value of ['Ana', 'ana@example.com', 'café', IP]) expect(written).not.toContain(value);
  });

  // Auditoría 2026-11-10: lo que no cuesta nada (honeypot, sin token, token inventado) no deja
  // log, así no se puede agotar el cupo diario de Workers Logs que guarda los fallos reales
  it('lo que no le cuesta nada a quien ataca no deja log', async () => {
    const { log, send } = setup({ turnstile: { success: false, 'error-codes': ['invalid-input-response'] } });
    const withoutToken: Record<string, string> = { ...VALID };
    delete withoutToken[TURNSTILE_FIELD];
    await send(jsonRequest({ ...VALID, [HONEYPOT_FIELD]: 'x' }));
    await send(jsonRequest(withoutToken));
    await send(jsonRequest(VALID));
    expect(log).not.toHaveBeenCalled();
  });
});
