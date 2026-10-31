import { describe, expect, it } from 'vitest';
import es from '../../src/i18n/es.json';
import en from '../../src/i18n/en.json';
import { useTranslations } from '../../src/i18n/utils';

describe('i18n', () => {
  it('es y en tienen las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('no hay textos vacíos', () => {
    for (const value of [...Object.values(es), ...Object.values(en)]) expect(value.trim()).not.toBe('');
  });

  it('useTranslations devuelve el texto del idioma pedido', () => {
    expect(useTranslations('es')('nav.about')).toBe('Sobre mí');
    expect(useTranslations('en')('nav.about')).toBe('About');
  });
});
