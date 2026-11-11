import { DEFAULT_LANG, isLang, localizePath, sectionId, type Lang } from '../i18n/utils';
import { HONEYPOT_FIELD, MAX_BODY_BYTES, TURNSTILE_FIELD } from './contact-fields';
import { parseContact, type ContactErrorCode, type ContactField } from './contact-schema';
import { countRecentLeads, saveLead } from './leads';
import { NOTIFY_CAP_24H, notifyNewLead } from './notify';
import { rateLimitKey, type RateLimitResult } from './rate-limit';
import { SERVER_SECURITY_HEADERS } from './server-headers';
import { verifyTurnstile } from './turnstile';

// POST /api/contact (plan §7): Turnstile → Zod → límite de envíos → Supabase → tope de avisos →
// aviso por email.
// Recibe el entorno, el límite, fetch y los logs como dependencias, para probarse sin red ni
// Worker; src/pages/api/contact.ts solo lo conecta con el runtime.

/** Códigos estables: el formulario (T25) los traduce en src/i18n. */
export type ContactApiError = 'invalid' | 'verification' | 'method' | 'too_large' | 'rate_limit' | 'server';

export type ContactApiResponse =
  | { ok: true }
  | { ok: false; error: ContactApiError; fields?: Partial<Record<ContactField, ContactErrorCode>> };

const STATUS: Record<ContactApiError, number> = {
  invalid: 400,
  verification: 403,
  method: 405,
  too_large: 413,
  rate_limit: 429,
  server: 500,
};

/** Códigos de Turnstile que indican un fallo de configuración, no un visitante sospechoso. */
const TURNSTILE_CONFIG_ERRORS = ['missing-input-secret', 'invalid-input-secret'];

// public/_headers no llega a las respuestas de código de servidor (plan §8): se ponen aquí
const API_HEADERS = { 'Cache-Control': 'no-store', ...SERVER_SECURITY_HEADERS };

export type ContactLog = (level: 'warn' | 'error', event: string, detail?: Record<string, unknown>) => void;

export interface ContactDeps {
  /** Variables y secretos del Worker: SUPABASE_URL, SUPABASE_ANON_KEY, TURNSTILE_SECRET_KEY, RESEND_API_KEY, CONTACT_NOTIFY_TO. */
  env: Record<string, unknown>;
  limiter: { check(key: string): RateLimitResult };
  fetch?: typeof globalThis.fetch;
  /**
   * Solo códigos de error, nunca datos del visitante (constitución V y X). Solo se registra
   * lo que pide intervención (configuración, Supabase, Resend, el contador de avisos) y los
   * topes (límite de envíos y de avisos), que exigen un token de Turnstile válido.
   */
  log?: ContactLog;
}

const writeLog: ContactLog = (level, event, detail) => console[level](JSON.stringify({ event: `contact.${event}`, ...detail }));

export async function handleContact(request: Request, { env, limiter, fetch = globalThis.fetch, log = writeLog }: ContactDeps): Promise<Response> {
  if (request.method !== 'POST') {
    await request.body?.cancel();
    return json({ ok: false, error: 'method' }, { Allow: 'POST' });
  }

  const setting = (key: string) => {
    const value = env[key];
    return typeof value === 'string' ? value : '';
  };
  // Un POST nativo del formulario (sin JS) pide HTML y recibe una redirección; fetch pide JSON
  const html = (request.headers.get('accept') ?? '').includes('text/html');
  // Cloudflare la pone en cada petición y sustituye la que mande el cliente
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  let lang: Lang = DEFAULT_LANG;
  const reply = (result: ContactApiResponse, headers?: Record<string, string>) =>
    html ? redirect(result.ok ? localizePath('thanks', lang) : errorAnchor(lang)) : json(result, headers);

  const bytes = await readLimited(request, MAX_BODY_BYTES);
  if (!bytes) return reply({ ok: false, error: 'too_large' });

  const raw = await parseBody(bytes, request.headers.get('content-type') ?? '');
  if (!raw) return reply({ ok: false, error: 'invalid' });
  if (isLang(raw['lang'])) lang = raw['lang'];

  // Al bot se le responde como si hubiera funcionado, sin guardar ni avisar. Sin log: el
  // honeypot y un token ausente o rechazado no le cuestan nada a quien ataca, y cada log
  // gastaría del cupo diario de Workers Logs, donde están los fallos que sí importan.
  if (isFilled(raw[HONEYPOT_FIELD])) return reply({ ok: true });

  const human = await verifyTurnstile(raw[TURNSTILE_FIELD], { secret: setting('TURNSTILE_SECRET_KEY'), remoteip: ip || undefined, fetch });
  if (!human.success) {
    if (human.errorCodes.some((code) => TURNSTILE_CONFIG_ERRORS.includes(code))) {
      log('error', 'turnstile-misconfigured', { codes: human.errorCodes });
      return reply({ ok: false, error: 'server' });
    }
    return reply({ ok: false, error: 'verification' });
  }

  const parsed = parseContact(raw);
  if (!parsed.success) return reply({ ok: false, error: 'invalid', fields: parsed.errors });
  lang = parsed.data.lang;

  const limit = limiter.check(rateLimitKey(ip));
  if (!limit.allowed) {
    log('warn', 'rate-limited', { retryAfter: limit.retryAfter });
    return reply({ ok: false, error: 'rate_limit' }, { 'Retry-After': String(limit.retryAfter) });
  }

  const saved = await saveLead(parsed.data, { url: setting('SUPABASE_URL'), key: setting('SUPABASE_ANON_KEY'), fetch });
  if (!saved.success) {
    log('error', 'save-failed', { error: saved.error });
    return reply({ ok: false, error: 'server' });
  }

  // Tope de avisos (T26f): pasado NOTIFY_CAP_24H en 24 horas, el contacto queda guardado sin
  // email. Si no se puede contar, se avisa igual: un fallo del contador no quita avisos.
  const recent = await countRecentLeads({ url: setting('SUPABASE_URL'), key: setting('SUPABASE_ANON_KEY'), fetch });
  if ('error' in recent) log('warn', 'count-failed', { error: recent.error });
  else if (recent.count > NOTIFY_CAP_24H) {
    log('warn', 'notify-capped', { recent: recent.count });
    return reply({ ok: true });
  }

  // Best effort: el contacto ya está guardado, así que un fallo aquí solo va a los logs
  const notified = await notifyNewLead(parsed.data, { apiKey: setting('RESEND_API_KEY'), to: setting('CONTACT_NOTIFY_TO'), fetch });
  if (!notified.success) log('error', 'notify-failed', { error: notified.error });

  return reply({ ok: true });
}

function json(result: ContactApiResponse, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : STATUS[result.error],
    headers: { ...API_HEADERS, 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

/** 303: el navegador sigue la redirección con un GET, así recargar no reenvía el formulario. */
function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { ...API_HEADERS, Location: location } });
}

/** Ancla del aviso de error junto al formulario (T25), que se muestra con `:target` sin JS. */
export function errorAnchor(lang: Lang): string {
  return `${localizePath('home', lang)}#${sectionId('contact', lang)}-error`;
}

/** El cuerpo, o null si pasa de `max` bytes (se corta al pasarse, sin leer el resto). */
async function readLimited(request: Request, max: number): Promise<Uint8Array<ArrayBuffer> | null> {
  if (Number(request.headers.get('content-length')) > max) {
    await request.body?.cancel();
    return null;
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** Formulario (urlencoded o multipart) u objeto JSON; null si no se puede leer. */
async function parseBody(bytes: Uint8Array<ArrayBuffer>, contentType: string): Promise<Record<string, unknown> | null> {
  const type = contentType.split(';')[0]!.trim().toLowerCase();
  try {
    if (type === 'application/x-www-form-urlencoded') return Object.fromEntries(new URLSearchParams(new TextDecoder().decode(bytes)));
    if (type === 'multipart/form-data') return Object.fromEntries(await new Response(bytes, { headers: { 'Content-Type': contentType } }).formData());
    if (type === 'application/json') {
      const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
      return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
    }
  } catch {
    return null;
  }
  return null;
}

function isFilled(value: unknown): boolean {
  return typeof value === 'string' ? value.trim() !== '' : value !== undefined && value !== null;
}
