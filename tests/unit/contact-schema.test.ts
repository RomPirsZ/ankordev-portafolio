import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTACT_FIELDS,
  CONTACT_LIMITS,
  CONTACT_PROJECT_TYPES,
  EMAIL_PATTERN,
  parseContact,
} from '../../src/lib/contact-schema';
import { LANGS } from '../../src/i18n/utils';

const valid = {
  name: 'Ana Pérez',
  email: 'ana@example.com',
  project_type: 'negocio',
  budget: '500–800 USD',
  message: 'Necesito una web para mi café en Caracas.',
  lang: 'es',
};

/** Errores de un envío que debe fallar. */
function errorsOf(input: Record<string, unknown> | FormData) {
  const result = parseContact(input);
  if (result.success) throw new Error('Se esperaba un envío inválido');
  return result.errors;
}

const chars = (char: string, count: number) => char.repeat(count);

describe('parseContact', () => {
  it('acepta un envío completo y devuelve justo las columnas de la tabla', () => {
    expect(parseContact(valid)).toEqual({ success: true, data: valid });
  });

  it('acepta FormData, como llega de un formulario sin JavaScript', () => {
    const form = new FormData();
    for (const [key, value] of Object.entries(valid)) form.append(key, value);
    expect(parseContact(form)).toEqual({ success: true, data: valid });
  });

  it('los opcionales vacíos quedan sin valor y el idioma es español por defecto', () => {
    const result = parseContact({ name: 'Ana', email: 'ana@example.com', message: 'Hola, quiero una web.', project_type: '', budget: '  ' });
    expect(result).toEqual({ success: true, data: { name: 'Ana', email: 'ana@example.com', message: 'Hola, quiero una web.', lang: 'es' } });
  });

  it('recorta los espacios de los extremos', () => {
    const result = parseContact({ ...valid, name: '  Ana  ', email: ' ana@example.com ' });
    expect(result.success && result.data).toMatchObject({ name: 'Ana', email: 'ana@example.com' });
  });

  it('descarta los campos que no son columnas (honeypot, token de Turnstile)', () => {
    const result = parseContact({ ...valid, website: 'http://spam', 'cf-turnstile-response': 'token', id: 'x', created_at: '2020-01-01' });
    expect(result.success && Object.keys(result.data).sort()).toEqual([...CONTACT_FIELDS].sort());
  });

  it('los obligatorios que faltan o vienen vacíos dan «required»', () => {
    expect(errorsOf({})).toEqual({ name: 'required', email: 'required', message: 'required' });
    expect(errorsOf({ ...valid, name: '   ', message: '' })).toEqual({ name: 'required', message: 'required' });
  });

  it('un valor que no es texto da «invalid»', () => {
    expect(errorsOf({ ...valid, name: 42, budget: ['a'] })).toEqual({ name: 'invalid', budget: 'invalid' });
  });

  describe('límites (en caracteres, como char_length de Postgres)', () => {
    it('nombre: de 2 a 80', () => {
      expect(errorsOf({ ...valid, name: 'A' })).toEqual({ name: 'too_short' });
      expect(parseContact({ ...valid, name: 'Al' }).success).toBe(true);
      expect(parseContact({ ...valid, name: chars('a', 80) }).success).toBe(true);
      expect(errorsOf({ ...valid, name: chars('a', 81) })).toEqual({ name: 'too_long' });
    });

    it('un emoji cuenta como 1 carácter, no como 2', () => {
      // En JavaScript '😀'.length es 2; para Postgres es 1 carácter y violaría el check
      expect(errorsOf({ ...valid, name: '😀' })).toEqual({ name: 'too_short' });
      expect(parseContact({ ...valid, name: chars('😀', 80) }).success).toBe(true);
      expect(parseContact({ ...valid, message: chars('😀', 2000) }).success).toBe(true);
      expect(errorsOf({ ...valid, message: chars('😀', 2001) })).toEqual({ message: 'too_long' });
    });

    it('mensaje: de 10 a 2000', () => {
      expect(errorsOf({ ...valid, message: chars('a', 9) })).toEqual({ message: 'too_short' });
      expect(parseContact({ ...valid, message: chars('a', 10) }).success).toBe(true);
      expect(parseContact({ ...valid, message: chars('a', 2000) }).success).toBe(true);
      expect(errorsOf({ ...valid, message: chars('a', 2001) })).toEqual({ message: 'too_long' });
    });

    it('presupuesto: hasta 40', () => {
      expect(parseContact({ ...valid, budget: chars('a', 40) }).success).toBe(true);
      expect(errorsOf({ ...valid, budget: chars('a', 41) })).toEqual({ budget: 'too_long' });
    });

    it('email: hasta 254', () => {
      const at254 = `${chars('a', 254 - '@example.com'.length)}@example.com`;
      expect(parseContact({ ...valid, email: at254 }).success).toBe(true);
      expect(errorsOf({ ...valid, email: `a${at254}` })).toEqual({ email: 'too_long' });
    });
  });

  it('el email necesita usuario, @ y un dominio con punto, sin espacios', () => {
    for (const email of ['ana', 'ana@', '@example.com', 'ana@example', 'ana perez@example.com', 'ana@@example.com']) {
      expect(errorsOf({ ...valid, email }), email).toEqual({ email: 'invalid' });
    }
    expect(parseContact({ ...valid, email: 'Ana.Perez+web@Example.COM' }).success).toBe(true);
  });

  it('el tipo de proyecto y el idioma solo admiten sus valores', () => {
    expect(errorsOf({ ...valid, project_type: 'casino', lang: 'fr' })).toEqual({ project_type: 'invalid', lang: 'invalid' });
    for (const type of CONTACT_PROJECT_TYPES) expect(parseContact({ ...valid, project_type: type }).success).toBe(true);
    expect(parseContact({ ...valid, lang: 'en' }).success).toBe(true);
  });

  it('rechaza el carácter nulo, que Postgres no admite en un texto', () => {
    expect(errorsOf({ ...valid, message: 'Hola\u0000, quiero una web.' })).toEqual({ message: 'invalid' });
  });
});

// Lo que acepta la validación tiene que caber en la tabla: si no, el envío fallaría
// en Supabase con un error 500 en lugar de mostrar un error claro.
describe('coherencia con supabase/leads.sql', () => {
  const sql = readFileSync('supabase/leads.sql', 'utf8');
  const list = (text: string) => [...text.matchAll(/'([^']+)'/g)].map((m) => m[1]);

  it('los tipos de proyecto y los idiomas son los mismos', () => {
    expect(list(sql.match(/project_type in \(([^)]+)\)/)![1]!)).toEqual([...CONTACT_PROJECT_TYPES]);
    expect(list(sql.match(/lang in \(([^)]+)\)/)![1]!)).toEqual([...LANGS]);
  });

  it('los límites de longitud son los mismos', () => {
    const between = (column: string) => sql.match(new RegExp(`char_length\\(${column}\\) between (\\d+) and (\\d+)`))!.slice(1).map(Number);
    const atMost = (column: string) => Number(sql.match(new RegExp(`char_length\\(${column}\\) <= (\\d+)`))![1]);
    expect(between('name')).toEqual([CONTACT_LIMITS.name.min, CONTACT_LIMITS.name.max]);
    expect(between('message')).toEqual([CONTACT_LIMITS.message.min, CONTACT_LIMITS.message.max]);
    expect(atMost('email')).toBe(CONTACT_LIMITS.email.max);
    expect(atMost('budget')).toBe(CONTACT_LIMITS.budget.max);
  });

  it('el formato del email es el mismo (allí sin distinguir mayúsculas)', () => {
    expect(sql).toContain(`email ~* '${EMAIL_PATTERN.source}'`);
    expect(EMAIL_PATTERN.flags).toContain('i');
  });

  it('anon puede insertar justo las columnas que devuelve la validación', () => {
    const granted = sql.match(/grant insert \(([^)]+)\) on table public\.leads to anon/)![1]!.split(',').map((c) => c.trim());
    expect(granted).toEqual([...CONTACT_FIELDS]);
  });
});
