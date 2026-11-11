import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { Contact } from '../../src/lib/contact-schema';
import { countRecentLeads, RECENT_LEADS_RPC, saveLead } from '../../src/lib/leads';

const lead: Contact = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  project_type: 'negocio',
  budget: '500–800 USD',
  message: 'Necesito una web para mi café en Caracas.',
  lang: 'es',
};

const created = () => vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 201 }));
const options = (fetch: typeof globalThis.fetch) => ({ url: 'https://proyecto.supabase.co', key: 'sb_publishable_prueba', fetch });

describe('saveLead', () => {
  it('inserta en leads por POST con la clave en apikey y sin pedir la fila de vuelta', async () => {
    const fetch = created();
    expect(await saveLead(lead, options(fetch))).toEqual({ success: true });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://proyecto.supabase.co/rest/v1/leads');
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(init?.headers);
    expect(headers.get('apikey')).toBe('sb_publishable_prueba');
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('prefer')).toBe('return=minimal');
    // La clave publishable no es un JWT: va solo en apikey
    expect(headers.has('authorization')).toBe(false);
  });

  it('envía solo las 6 columnas del formulario; lo que falta va como null', async () => {
    const fetch = created();
    await saveLead({ name: 'Ana', email: 'ana@example.com', message: 'Hola, quiero una web.', lang: 'en' }, options(fetch));
    expect(JSON.parse(fetch.mock.calls[0]![1]!.body as string)).toEqual({
      name: 'Ana',
      email: 'ana@example.com',
      project_type: null,
      budget: null,
      message: 'Hola, quiero una web.',
      lang: 'en',
    });
  });

  it('acepta la URL del proyecto con barra final', async () => {
    const fetch = created();
    await saveLead(lead, { ...options(fetch), url: 'https://proyecto.supabase.co/' });
    expect(fetch.mock.calls[0]![0]).toBe('https://proyecto.supabase.co/rest/v1/leads');
  });

  it('una respuesta de error de Supabase no se da por guardada', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{"code":"23514"}', { status: 400 }));
    expect(await saveLead(lead, options(fetch))).toEqual({ success: false, error: 'http-400' });
  });

  it('distingue un fallo de red de un timeout', async () => {
    const network = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('fetch failed'));
    expect(await saveLead(lead, options(network))).toEqual({ success: false, error: 'network-error' });

    const slow = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new DOMException('timeout', 'TimeoutError'));
    expect(await saveLead(lead, options(slow))).toEqual({ success: false, error: 'timeout' });
  });

  it('sin URL o sin clave no llama a nadie', async () => {
    const fetch = created();
    expect(await saveLead(lead, { ...options(fetch), url: '' })).toEqual({ success: false, error: 'missing-config' });
    expect(await saveLead(lead, { ...options(fetch), key: '' })).toEqual({ success: false, error: 'missing-config' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

// Tope de avisos por email (T26f): la función de supabase/leads.sql que cuenta los contactos
describe('countRecentLeads', () => {
  const answers = (body: string, status = 200) => vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(body, { status }));

  it('llama por POST a la función con la clave en apikey y devuelve el número', async () => {
    const fetch = answers('7');
    expect(await countRecentLeads(options(fetch))).toEqual({ count: 7 });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(`https://proyecto.supabase.co/rest/v1/rpc/${RECENT_LEADS_RPC}`);
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{}');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(init?.headers);
    expect(headers.get('apikey')).toBe('sb_publishable_prueba');
    expect(headers.has('authorization')).toBe(false);
  });

  it('si la función no existe todavía, un error que se puede registrar', async () => {
    const fetch = answers('{"code":"PGRST202"}', 404);
    expect(await countRecentLeads(options(fetch))).toEqual({ error: 'http-404' });
  });

  it('una respuesta que no es un entero no cuenta como número', async () => {
    for (const body of ['"7"', '7.5', '-1', '{"count":7}', 'no es json']) {
      expect(await countRecentLeads(options(answers(body))), body).toEqual({ error: 'invalid-response' });
    }
  });

  it('distingue un fallo de red de un timeout, y sin configuración no llama a nadie', async () => {
    const network = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('fetch failed'));
    expect(await countRecentLeads(options(network))).toEqual({ error: 'network-error' });

    const slow = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new DOMException('timeout', 'TimeoutError'));
    expect(await countRecentLeads(options(slow))).toEqual({ error: 'timeout' });

    const fetch = answers('1');
    expect(await countRecentLeads({ ...options(fetch), key: '' })).toEqual({ error: 'missing-config' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('supabase/leads.sql define la función que se llama: últimas 24 h, security definer y solo para anon', () => {
    const sql = readFileSync('supabase/leads.sql', 'utf8');
    expect(sql).toContain(`create or replace function public.${RECENT_LEADS_RPC}()`);
    expect(sql).toContain("interval '24 hours'");
    expect(sql).toMatch(/security definer\s+set search_path = ''/);
    expect(sql).toContain(`revoke execute on function public.${RECENT_LEADS_RPC}() from public, authenticated;`);
    expect(sql).toContain(`grant execute on function public.${RECENT_LEADS_RPC}() to anon;`);
  });
});
