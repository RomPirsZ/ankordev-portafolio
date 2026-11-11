// Lo que comparten /api/contact, el formulario (T25) y sus tests. Sin dependencias: los e2e
// de Playwright no pueden importar módulos que arrastren los JSON de i18n, y el navegador
// no debe descargar Zod para validar el formulario.

/** Cuerpo máximo del envío: con los límites del esquema, uno real ocupa unos pocos KB. */
export const MAX_BODY_BYTES = 10 * 1024;
/** Campo que el widget de Turnstile añade al formulario. */
export const TURNSTILE_FIELD = 'cf-turnstile-response';
/** Campo trampa, oculto para las personas: si llega con algo, lo rellenó un bot. */
export const HONEYPOT_FIELD = 'website';

/** En caracteres, como `char_length` de Postgres (un emoji es 1, no 2 como en `.length`). */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  budget: { max: 40 },
  message: { min: 10, max: 2000 },
} as const;

/**
 * El mismo patrón que el check de `email` en supabase/leads.sql (allí con `~*`). Las partes
 * del dominio no admiten puntos y van separadas por uno: así no hay dos cuantificadores que
 * compitan por el mismo texto y la comprobación es lineal (con `[^@\s]+\.[^@\s]+` un dominio
 * lleno de puntos tardaba un tiempo cuadrático; auditoría de seguridad 2026-11-10).
 */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$/i;

/** Códigos estables: el endpoint los devuelve y el formulario los traduce en src/i18n. */
export type ContactErrorCode = 'required' | 'too_short' | 'too_long' | 'invalid';

/** Campos de texto libre; el tipo de proyecto y el idioma salen de listas cerradas. */
export const CONTACT_TEXT_FIELDS = ['name', 'email', 'budget', 'message'] as const;
export type ContactTextField = (typeof CONTACT_TEXT_FIELDS)[number];

const REQUIRED: readonly ContactTextField[] = ['name', 'email', 'message'];
const chars = (text: string) => [...text].length;

/**
 * Valida en el navegador con las mismas reglas y en el mismo orden que contact-schema.ts
 * (un test lo comprueba): devuelve el primer error de cada campo.
 */
export function validateContactText(values: Partial<Record<ContactTextField, string>>): Partial<Record<ContactTextField, ContactErrorCode>> {
  const errors: Partial<Record<ContactTextField, ContactErrorCode>> = {};
  for (const field of CONTACT_TEXT_FIELDS) {
    const value = (values[field] ?? '').trim();
    if (value === '') {
      if (REQUIRED.includes(field)) errors[field] = 'required';
      continue;
    }
    const limits: { min?: number; max: number } = CONTACT_LIMITS[field];
    const length = chars(value);
    if (value.includes('\u0000')) errors[field] = 'invalid';
    else if (limits.min !== undefined && length < limits.min) errors[field] = 'too_short';
    else if (length > limits.max) errors[field] = 'too_long';
    else if (field === 'email' && !EMAIL_PATTERN.test(value)) errors[field] = 'invalid';
  }
  return errors;
}
