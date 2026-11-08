import { describe, expect, it } from 'vitest';
import { contactChannels, ownerFromEnv, whatsappHref } from '../../src/lib/site';

describe('canales de contacto', () => {
  it('el enlace de WhatsApp lleva solo los dígitos, con el código de país', () => {
    expect(whatsappHref('+58 (412) 123-4567')).toBe('https://wa.me/584121234567');
  });

  it('muestra los canales con dato, WhatsApp primero', () => {
    expect(contactChannels({ whatsapp: ' +58 412 123 4567 ', email: 'hola@ejemplo.dev' })).toEqual([
      { kind: 'whatsapp', label: '+58 412 123 4567', href: 'https://wa.me/584121234567' },
      { kind: 'email', label: 'hola@ejemplo.dev', href: 'mailto:hola@ejemplo.dev' },
    ]);
  });

  it('un canal vacío no se muestra', () => {
    expect(contactChannels({ whatsapp: '', email: 'hola@ejemplo.dev' }).map((c) => c.kind)).toEqual(['email']);
    expect(contactChannels({ whatsapp: '  ', email: '' })).toEqual([]);
  });
});

describe('datos del dueño', () => {
  it('salen de las variables PUBLIC_OWNER_*, sin espacios sobrantes', () => {
    const env = { PUBLIC_OWNER_NAME: ' Ana ', PUBLIC_OWNER_WHATSAPP: '+58 412 123 4567', PUBLIC_OWNER_EMAIL: 'hola@ejemplo.dev' };
    expect(ownerFromEnv(env)).toEqual({ name: 'Ana', whatsapp: '+58 412 123 4567', email: 'hola@ejemplo.dev' });
  });

  it('una variable ausente o que no es texto queda vacía', () => {
    expect(ownerFromEnv({ PUBLIC_OWNER_NAME: true })).toEqual({ name: '', whatsapp: '', email: '' });
  });
});
