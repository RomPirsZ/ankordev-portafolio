import { describe, expect, it } from 'vitest';
import es from '../../src/i18n/es.json';
import en from '../../src/i18n/en.json';
import {
  DEFAULT_LANG,
  alternateLang,
  getLangFromUrl,
  interpolate,
  isLang,
  localizePath,
  sectionHref,
  sectionId,
  sectionNumber,
  useTranslations,
} from '../../src/i18n/utils';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('diccionarios', () => {
  it('es y en tienen las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('no hay textos vacíos', () => {
    for (const value of [...Object.values(es), ...Object.values(en)]) expect(value.trim()).not.toBe('');
  });

  it('cada clave usa las mismas variables en ambos idiomas', () => {
    for (const key of Object.keys(es) as (keyof typeof es)[]) {
      expect(placeholders(en[key]), key).toEqual(placeholders(es[key]));
    }
  });
});

describe('useTranslations', () => {
  it('devuelve el texto del idioma pedido', () => {
    expect(useTranslations('es')('nav.about')).toBe('Sobre mí');
    expect(useTranslations('en')('nav.about')).toBe('About');
  });

  it('sustituye variables', () => {
    expect(useTranslations('es')('footer.copyright', { year: 2026 })).toBe('© 2026');
  });
});

describe('interpolate', () => {
  it('sustituye las variables conocidas y deja intactas las demás', () => {
    expect(interpolate('Hola {name}, {otra}', { name: 'Ana' })).toBe('Hola Ana, {otra}');
  });

  it('sin variables devuelve el texto tal cual', () => {
    expect(interpolate('Sin {nada}')).toBe('Sin {nada}');
  });
});

describe('idioma desde la URL', () => {
  it.each([
    ['https://x.dev/', 'es'],
    ['https://x.dev/proyectos/001-restaurante/', 'es'],
    ['https://x.dev/en', 'en'],
    ['https://x.dev/en/', 'en'],
    ['https://x.dev/en/projects/001-restaurante/', 'en'],
    ['https://x.dev/english/', 'es'],
  ])('%s → %s', (url, lang) => {
    expect(getLangFromUrl(new URL(url))).toBe(lang);
  });

  it('isLang solo acepta los idiomas del sitio', () => {
    expect(isLang('es')).toBe(true);
    expect(isLang('en')).toBe(true);
    expect(isLang('fr')).toBe(false);
    expect(isLang(undefined)).toBe(false);
  });

  it('el idioma por defecto es español y el alterno es el otro', () => {
    expect(DEFAULT_LANG).toBe('es');
    expect(alternateLang('es')).toBe('en');
    expect(alternateLang('en')).toBe('es');
  });
});

describe('rutas', () => {
  it('cada idioma tiene sus segmentos', () => {
    expect(localizePath('home', 'es')).toBe('/');
    expect(localizePath('home', 'en')).toBe('/en/');
    expect(localizePath('thanks', 'es')).toBe('/gracias/');
    expect(localizePath('thanks', 'en')).toBe('/en/thanks/');
    expect(localizePath('project', 'es', { slug: '001-restaurante' })).toBe('/proyectos/001-restaurante/');
    expect(localizePath('project', 'en', { slug: '001-restaurante' })).toBe('/en/projects/001-restaurante/');
  });

  it('falla si falta un parámetro de la ruta', () => {
    expect(() => localizePath('project', 'es')).toThrow(/slug/);
  });

  it('las secciones del inicio tienen id y enlace por idioma', () => {
    expect(sectionId('about', 'es')).toBe('sobre-mi');
    expect(sectionId('about', 'en')).toBe('about');
    expect(sectionHref('projects', 'es')).toBe('/#proyectos');
    expect(sectionHref('projects', 'en')).toBe('/en/#projects');
  });

  it('cada sección tiene su número del cuaderno, en el orden de la spec §5', () => {
    const order = ['projects', 'services', 'process', 'about', 'contact'] as const;
    expect(order.map(sectionNumber)).toEqual(['01', '02', '03', '04', '05']);
  });
});

// T32: la meta description se corta en los resultados de búsqueda pasados ~160 caracteres
describe('SEO', () => {
  it('la descripción del sitio mide entre 120 y 160 caracteres en los dos idiomas', () => {
    for (const dictionary of [es, en]) {
      expect(dictionary['site.description'].length).toBeGreaterThanOrEqual(120);
      expect(dictionary['site.description'].length).toBeLessThanOrEqual(160);
    }
  });
});
