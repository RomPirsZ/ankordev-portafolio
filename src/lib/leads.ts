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

/** Función de supabase/leads.sql: cuántos contactos se guardaron en las últimas 24 horas. */
export const RECENT_LEADS_RPC = 'leads_count_24h';

export type CountResult = { count: number } | { error: string };

/**
 * Cuenta los contactos de las últimas 24 horas (incluido el que se acaba de guardar) para el
 * tope de avisos por email (T26f). anon no puede leer `leads`: la función solo devuelve el
 * número. Espera menos que el guardado, porque solo decide si se avisa.
 */
export async function countRecentLeads({ url, key, fetch = globalThis.fetch, timeoutMs = 3000 }: Options): Promise<CountResult> {
  if (!url || !key) return { error: 'missing-config' };

  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/rpc/${RECENT_LEADS_RPC}`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    return { error: isTimeout(error) ? 'timeout' : 'network-error' };
  }
  if (!response.ok) return { error: `http-${response.status}` };

  // PostgREST devuelve el número suelto, sin envoltorio
  const count: unknown = await response.json().catch(() => null);
  return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? { count } : { error: 'invalid-response' };
}
