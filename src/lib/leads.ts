import { CONTACT_FIELDS, type Contact } from './contact-schema';

// Guarda un contacto en la tabla `leads` de Supabase (plan §7) con su API REST, sin SDK.
// Usa la clave publishable (rol anon), que solo puede insertar las columnas del formulario:
// sin `select` no puede devolver la fila, de ahí `return=minimal`.

export interface SaveResult {
  success: boolean;
  /** Para los logs. */
  error?: string;
}

interface Options {
  /** URL del proyecto (https://<ref>.supabase.co). */
  url: string;
  /** Clave publishable o anon heredada; nunca la secreta ni service_role. */
  key: string;
  /** Inyectable para los tests. */
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

const isTimeout = (error: unknown) => error instanceof Error && error.name === 'TimeoutError';

export async function saveLead(lead: Contact, { url, key, fetch = globalThis.fetch, timeoutMs = 5000 }: Options): Promise<SaveResult> {
  if (!url || !key) return { success: false, error: 'missing-config' };

  // Solo las columnas del formulario; lo que no se envió va como null
  const row = Object.fromEntries(CONTACT_FIELDS.map((field) => [field, lead[field] ?? null]));

  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/leads`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    return { success: false, error: isTimeout(error) ? 'timeout' : 'network-error' };
  }

  return response.ok ? { success: true } : { success: false, error: `http-${response.status}` };
}
