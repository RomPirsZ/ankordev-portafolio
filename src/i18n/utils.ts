import es from './es.json';
import en from './en.json';

export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'es';

/** Las claves salen de es.json; si en.json no tiene alguna, `astro check` falla. */
export type Key = keyof typeof es;
export type Vars = Record<string, string | number>;

const dictionaries: Record<Lang, Record<Key, string>> = { es, en };

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function alternateLang(lang: Lang): Lang {
  return lang === 'es' ? 'en' : 'es';
}

/** Sustituye `{nombre}` por su valor; las variables que no se pasan quedan intactas. */
export function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function useTranslations(lang: Lang) {
  return (key: Key, vars?: Vars): string => interpolate(dictionaries[lang][key], vars);
}

/** El español vive en la raíz; los demás idiomas, bajo su prefijo (`/en/…`). */
export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  return isLang(first) && first !== DEFAULT_LANG ? first : DEFAULT_LANG;
}

// Rutas con nombre: el segmento cambia según el idioma (spec §4).
const ROUTES = {
  home: { es: '/', en: '/en/' },
  thanks: { es: '/gracias/', en: '/en/thanks/' },
  project: { es: '/proyectos/{slug}/', en: '/en/projects/{slug}/' },
} as const satisfies Record<string, Record<Lang, string>>;

export type Route = keyof typeof ROUTES;

export function localizePath(route: Route, lang: Lang, params?: Vars): string {
  const path = interpolate(ROUTES[route][lang], params);
  const missing = path.match(/\{(\w+)\}/);
  if (missing) throw new Error(`Falta el parámetro "${missing[1]}" para la ruta "${route}"`);
  return path;
}

// Secciones del inicio (spec §5): su id también se traduce.
const SECTIONS = {
  projects: { es: 'proyectos', en: 'projects' },
  services: { es: 'servicios', en: 'services' },
  process: { es: 'proceso', en: 'process' },
  about: { es: 'sobre-mi', en: 'about' },
  contact: { es: 'contacto', en: 'contact' },
} as const satisfies Record<string, Record<Lang, string>>;

export type Section = keyof typeof SECTIONS;

export function sectionId(section: Section, lang: Lang): string {
  return SECTIONS[section][lang];
}

export function sectionHref(section: Section, lang: Lang): string {
  return `${localizePath('home', lang)}#${sectionId(section, lang)}`;
}

// Número de cada sección en el cuaderno (`[ 02 / SERVICIOS ]`). El menú usa el mismo,
// así que el número del enlace coincide con la etiqueta a la que lleva.
const SECTION_NUMBERS = {
  projects: '01',
  services: '02',
  process: '03',
  about: '04',
  contact: '05',
} as const satisfies Record<Section, string>;

export function sectionNumber(section: Section): string {
  return SECTION_NUMBERS[section];
}
