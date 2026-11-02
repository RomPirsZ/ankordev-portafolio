// Verificación en el servidor del token de Cloudflare Turnstile (plan §7).
// Falla cerrado: si no se puede confirmar con Cloudflare, el envío no se da por humano.

export const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
/** Longitud máxima de un token según Cloudflare: uno más largo ni se envía. */
export const MAX_TOKEN_LENGTH = 2048;

export interface TurnstileResult {
  success: boolean;
  /** Para los logs, nunca para el visitante (constitución V: errores genéricos). */
  errorCodes: string[];
}

interface Options {
  secret: string;
  /** IP del visitante, si se conoce. */
  remoteip?: string | undefined;
  /** Inyectable para los tests. */
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

const fail = (code: string): TurnstileResult => ({ success: false, errorCodes: [code] });
const isTimeout = (error: unknown) => error instanceof Error && error.name === 'TimeoutError';

export async function verifyTurnstile(token: unknown, { secret, remoteip, fetch = globalThis.fetch, timeoutMs = 5000 }: Options): Promise<TurnstileResult> {
  if (typeof token !== 'string' || token === '') return fail('missing-input-response');
  if (token.length > MAX_TOKEN_LENGTH) return fail('invalid-input-response');
  if (!secret) return fail('missing-input-secret');

  const body = new URLSearchParams({ secret, response: token });
  if (remoteip) body.set('remoteip', remoteip);

  let response: Response;
  try {
    response = await fetch(SITEVERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    return fail(isTimeout(error) ? 'timeout' : 'network-error');
  }

  let data: { success?: unknown; 'error-codes'?: unknown };
  try {
    data = await response.json();
  } catch (error) {
    return fail(isTimeout(error) ? 'timeout' : 'invalid-response');
  }

  const codes = data['error-codes'];
  return {
    success: data.success === true,
    errorCodes: Array.isArray(codes) ? codes.filter((code): code is string => typeof code === 'string') : [],
  };
}
