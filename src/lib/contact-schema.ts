import { z } from 'astro/zod';
import { LANGS } from '../i18n/utils';
import { PROJECT_TYPES } from './project-schema';

// Validación del formulario de contacto en el servidor (plan §7, constitución V).
// Acepta lo mismo que los check de supabase/leads.sql: un test lo comprueba.

/** Columnas de `leads` que rellena el formulario (las demás las pone la base de datos). */
export const CONTACT_FIELDS = ['name', 'email', 'project_type', 'budget', 'message', 'lang'] as const;
export const CONTACT_PROJECT_TYPES = [...PROJECT_TYPES, 'otro'] as const;

/** En caracteres, como `char_length` de Postgres (un emoji es 1, no 2 como en `.length`). */
export const CONTACT_LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 254 },
  budget: { max: 40 },
  message: { min: 10, max: 2000 },
} as const;

/** El mismo patrón que el check de `email` (allí con `~*`: sin distinguir mayúsculas). */
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

export type ContactField = (typeof CONTACT_FIELDS)[number];
/** Códigos estables: el endpoint los devuelve y el formulario los traduce en src/i18n. */
export type ContactErrorCode = 'required' | 'too_short' | 'too_long' | 'invalid';

const chars = (text: string) => [...text].length;

/** Del formulario llegan textos vacíos: vacío o solo espacios cuenta como no enviado. */
const blankToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

function text({ min, max }: { min?: number; max: number }) {
  return z
    .string({ error: (issue) => (issue.input === undefined ? 'required' : 'invalid') })
    .trim()
    // Postgres no admite el carácter nulo en un text: fallaría al insertar
    .refine((value) => !value.includes('\u0000'), { error: 'invalid' })
    .refine((value) => min === undefined || chars(value) >= min, { error: 'too_short' })
    .refine((value) => chars(value) <= max, { error: 'too_long' });
}

const required = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(blankToUndefined, schema.optional());

export const contactSchema = z.object({
  name: required(text(CONTACT_LIMITS.name)),
  email: required(text(CONTACT_LIMITS.email).refine((value) => EMAIL_PATTERN.test(value), { error: 'invalid' })),
  project_type: optional(z.enum(CONTACT_PROJECT_TYPES, { error: 'invalid' })),
  budget: optional(text(CONTACT_LIMITS.budget)),
  message: required(text(CONTACT_LIMITS.message)),
  lang: z.preprocess(blankToUndefined, z.enum(LANGS, { error: 'invalid' }).default('es')),
});

export type Contact = z.infer<typeof contactSchema>;

export type ContactResult =
  | { success: true; data: Contact }
  | { success: false; errors: Partial<Record<ContactField, ContactErrorCode>> };

const CODES: readonly string[] = ['required', 'too_short', 'too_long', 'invalid'] satisfies ContactErrorCode[];

/** Valida un envío (FormData de un POST nativo u objeto JSON); devuelve el primer error de cada campo. */
export function parseContact(input: FormData | Record<string, unknown>): ContactResult {
  const raw = input instanceof FormData ? Object.fromEntries(input) : input;
  const result = contactSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };

  const errors: Partial<Record<ContactField, ContactErrorCode>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0] as ContactField;
    errors[field] ??= CODES.includes(issue.message) ? (issue.message as ContactErrorCode) : 'invalid';
  }
  return { success: false, errors };
}
