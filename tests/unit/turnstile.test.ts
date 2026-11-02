import { describe, expect, it, vi } from 'vitest';
import { MAX_TOKEN_LENGTH, SITEVERIFY_URL, verifyTurnstile } from '../../src/lib/turnstile';

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const options = (fetch: typeof globalThis.fetch) => ({ secret: 'secreto', remoteip: '1.2.3.4', fetch });

describe('verifyTurnstile', () => {
  it('envía el secreto, el token y la IP a siteverify por POST', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json({ success: true }));
    await verifyTurnstile('token-del-widget', options(fetch));

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe(SITEVERIFY_URL);
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const body = init?.body as URLSearchParams;
    expect(Object.fromEntries(body)).toEqual({ secret: 'secreto', response: 'token-del-widget', remoteip: '1.2.3.4' });
  });

  it('sin IP conocida no la envía', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json({ success: true }));
    await verifyTurnstile('token', { secret: 'secreto', fetch });
    expect((fetch.mock.calls[0]![1]?.body as URLSearchParams).has('remoteip')).toBe(false);
  });

  it('da por bueno solo un success: true', async () => {
    const ok = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json({ success: true, 'error-codes': [] }));
    expect(await verifyTurnstile('token', options(ok))).toEqual({ success: true, errorCodes: [] });

    const rejected = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json({ success: false, 'error-codes': ['timeout-or-duplicate'] }));
    expect(await verifyTurnstile('token', options(rejected))).toEqual({ success: false, errorCodes: ['timeout-or-duplicate'] });

    const truthy = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json({ success: 'true' }));
    expect((await verifyTurnstile('token', options(truthy))).success).toBe(false);
  });

  describe('sin token válido no llega a llamar a Cloudflare', () => {
    for (const [name, token, code] of [
      ['vacío', '', 'missing-input-response'],
      ['ausente', undefined, 'missing-input-response'],
      ['que no es texto', 42, 'missing-input-response'],
      ['más largo que el máximo', 'a'.repeat(MAX_TOKEN_LENGTH + 1), 'invalid-input-response'],
    ] as const) {
      it(name, async () => {
        const fetch = vi.fn<typeof globalThis.fetch>();
        expect(await verifyTurnstile(token, options(fetch))).toEqual({ success: false, errorCodes: [code] });
        expect(fetch).not.toHaveBeenCalled();
      });
    }

    it('sin clave secreta configurada', async () => {
      const fetch = vi.fn<typeof globalThis.fetch>();
      expect(await verifyTurnstile('token', { secret: '', fetch })).toEqual({ success: false, errorCodes: ['missing-input-secret'] });
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('falla cerrado: si Cloudflare no responde bien, el envío no se verifica', () => {
    it('error de red', async () => {
      const fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('fetch failed'));
      expect(await verifyTurnstile('token', options(fetch))).toEqual({ success: false, errorCodes: ['network-error'] });
    });

    it('sin respuesta antes del tiempo máximo', async () => {
      // Responde solo cuando se aborta la petición, como un servidor colgado
      const fetch = vi.fn<typeof globalThis.fetch>(
        (_url, init) => new Promise((_resolve, reject) => init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason))),
      );
      expect(await verifyTurnstile('token', { ...options(fetch), timeoutMs: 20 })).toEqual({ success: false, errorCodes: ['timeout'] });
    });

    it('respuesta que no es JSON (p. ej. una página de error)', async () => {
      const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('<html>502</html>', { status: 502 }));
      expect(await verifyTurnstile('token', options(fetch))).toEqual({ success: false, errorCodes: ['invalid-response'] });
    });
  });
});
