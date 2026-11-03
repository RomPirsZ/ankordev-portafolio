import { describe, expect, it, vi } from 'vitest';
import type { Contact } from '../../src/lib/contact-schema';
import { DEFAULT_FROM, RESEND_API_URL, notifyNewLead } from '../../src/lib/notify';

const lead: Contact = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  project_type: 'negocio',
  budget: '500–800 USD',
  message: 'Necesito una web para mi café en Caracas.',
  lang: 'es',
};

const options = (fetch: typeof globalThis.fetch) => ({ apiKey: 're_prueba', to: 'yo@example.com', fetch });
const ok = () => vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{"id":"1"}', { status: 200 }));

/** Cuerpo JSON de la única llamada a Resend. */
function sent(fetch: ReturnType<typeof ok>) {
  const [, init] = fetch.mock.calls[0]!;
  return JSON.parse(init!.body as string) as { from: string; to: string[]; reply_to: string; subject: string; text: string };
}

describe('notifyNewLead', () => {
  it('envía el contacto a Resend por POST con la clave y responder-a al cliente', async () => {
    const fetch = ok();
    expect(await notifyNewLead(lead, options(fetch))).toEqual({ success: true });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(RESEND_API_URL);
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer re_prueba');
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json');
    expect(sent(fetch)).toMatchObject({ from: DEFAULT_FROM, to: ['yo@example.com'], reply_to: 'ana@example.com' });
  });

  it('el asunto lleva el nombre y el tipo; el texto, todos los campos', async () => {
    const fetch = ok();
    await notifyNewLead(lead, options(fetch));
    const { subject, text } = sent(fetch);
    expect(subject).toBe('Nuevo contacto: Ana Pérez (negocio)');
    for (const value of [lead.name, lead.email, 'negocio', lead.budget!, lead.message, 'es']) expect(text).toContain(value);
  });

  it('sin tipo ni presupuesto lo indica en lugar de dejar huecos', async () => {
    const fetch = ok();
    const { project_type: _type, budget: _budget, ...minimal } = lead;
    await notifyNewLead(minimal, options(fetch));
    const { subject, text } = sent(fetch);
    expect(subject).toBe('Nuevo contacto: Ana Pérez (sin tipo)');
    expect(text).not.toContain('undefined');
  });

  it('el asunto es una sola línea y se recorta (nada se cuela en él)', async () => {
    const fetch = ok();
    await notifyNewLead({ ...lead, name: 'Ana\r\nBcc: otro@example.com\n' + 'x'.repeat(200) }, options(fetch));
    const { subject } = sent(fetch);
    expect(subject).not.toMatch(/[\r\n]/);
    expect([...subject].length).toBeLessThanOrEqual(120);
    expect(subject.endsWith('…')).toBe(true);
  });

  it('acepta otro remitente (cuando haya dominio propio verificado)', async () => {
    const fetch = ok();
    await notifyNewLead(lead, { ...options(fetch), from: 'Contacto <hola@midominio.com>' });
    expect(sent(fetch).from).toBe('Contacto <hola@midominio.com>');
  });

  it('sin clave o sin destinatario no llama a Resend', async () => {
    for (const config of [{ apiKey: '', to: 'yo@example.com' }, { apiKey: 're_prueba', to: '' }]) {
      const fetch = ok();
      expect(await notifyNewLead(lead, { ...config, fetch })).toEqual({ success: false, error: 'missing-config' });
      expect(fetch).not.toHaveBeenCalled();
    }
  });

  describe('nunca lanza: devuelve el fallo para los logs', () => {
    it('Resend rechaza la petición', async () => {
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('{"message":"invalid"}', { status: 403 }));
      expect(await notifyNewLead(lead, options(fetch))).toEqual({ success: false, error: 'http-403' });
    });

    it('error de red', async () => {
      const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('fetch failed'));
      expect(await notifyNewLead(lead, options(fetch))).toEqual({ success: false, error: 'network-error' });
    });

    it('sin respuesta antes del tiempo máximo', async () => {
      const fetch = vi.fn<typeof globalThis.fetch>(
        (_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason))),
      );
      expect(await notifyNewLead(lead, { ...options(fetch), timeoutMs: 20 })).toEqual({ success: false, error: 'timeout' });
    });
  });
});
