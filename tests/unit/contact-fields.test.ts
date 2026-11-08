import { describe, expect, it } from 'vitest';
import { CONTACT_TEXT_FIELDS, validateContactText, type ContactTextField } from '../../src/lib/contact-fields';
import { parseContact } from '../../src/lib/contact-schema';

const VALID = { name: 'Ana Pérez', email: 'ana@example.com', budget: '500 USD', message: 'Necesito una web para mi café.' };

describe('validateContactText (navegador)', () => {
  it('un envío correcto no tiene errores; presupuesto vacío está permitido', () => {
    expect(validateContactText(VALID)).toEqual({});
    expect(validateContactText({ ...VALID, budget: '' })).toEqual({});
  });

  it('marca cada campo con el primer error, como el servidor', () => {
    expect(validateContactText({ name: ' ', email: 'sin-arroba', budget: 'b'.repeat(41), message: 'corto' })).toEqual({
      name: 'required',
      email: 'invalid',
      budget: 'too_long',
      message: 'too_short',
    });
  });

  it('cuenta caracteres como Postgres: un emoji es uno', () => {
    expect(validateContactText({ ...VALID, name: '😀'.repeat(80) })).toEqual({});
    expect(validateContactText({ ...VALID, name: '😀'.repeat(81) })).toEqual({ name: 'too_long' });
  });
});

// Si estas dos validaciones se separan, el formulario dejaría pasar envíos que el servidor
// rechaza (y gastaría el token de Turnstile) o bloquearía envíos válidos.
describe('coherencia con contact-schema.ts', () => {
  const cases: Partial<Record<ContactTextField, string>>[] = [
    VALID,
    {},
    { name: 'A', email: 'a@b', message: 'x'.repeat(9) },
    { name: 'An', email: 'a@b.c', message: 'x'.repeat(10) },
    { name: '  Ana  ', email: '  ana@example.com  ', message: `  ${'x'.repeat(10)}  ` },
    { name: 'n'.repeat(81), email: `${'e'.repeat(250)}@b.co`, budget: 'b'.repeat(40), message: 'm'.repeat(2001) },
    { name: 'Ana\u0000', email: 'ana@example.com', message: 'Hola, quiero una web.' },
    { name: '😀😀', email: 'ana @example.com', budget: '\u0000', message: '😀'.repeat(2000) },
    { name: 'Ana', email: 'ana@@example.com', message: 'Hola, quiero una web.' },
  ];

  it.each(cases.map((values, i) => [i, values] as const))('caso %i', (_, values) => {
    const server = parseContact({ ...values, lang: 'es' });
    const serverErrors = server.success ? {} : server.errors;
    const textOnly = Object.fromEntries(CONTACT_TEXT_FIELDS.flatMap((field) => (serverErrors[field] ? [[field, serverErrors[field]]] : [])));
    expect(validateContactText(values)).toEqual(textOnly);
  });
});
