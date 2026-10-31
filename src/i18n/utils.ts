import es from './es.json';
import en from './en.json';

export const LANGS = ['es', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export type Key = keyof typeof es;

const dictionaries: Record<Lang, Record<Key, string>> = { es, en };

export function useTranslations(lang: Lang) {
  return (key: Key): string => dictionaries[lang][key];
}
