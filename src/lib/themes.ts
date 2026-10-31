export const THEMES = ['carbon', 'naranja', 'petroleo', 'militar'] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = 'carbon';
export const THEME_STORAGE_KEY = 'theme';

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}
