// Umbrales de luminancia del fondo para que todo el texto cumpla AA (4,5:1) sobre él,
// sacados de los colores de texto de global.css (--fg, --muted, --code). Así el e2e del
// gradiente sigue a la paleta sin números escritos a mano.
import { readFileSync } from 'node:fs';
import type { Theme } from '../../src/lib/themes';

const css = readFileSync('src/styles/global.css', 'utf8');

function token(theme: Theme, name: string): string {
  const block = css.match(new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  const value = block.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
  if (!value) throw new Error(`global.css no define --${name} en el tema ${theme}`);
  return value;
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const TEXT_ROLES = ['fg', 'muted', 'code'];
const textLuminances = (theme: Theme) => TEXT_ROLES.map((role) => luminance(token(theme, role)));

/** Oscuro (texto claro): el fondo no puede pasar de esta luminancia en ningún punto. */
export const DARK_MAX_BACKGROUND = Math.min(...textLuminances('oscuro').map((l) => (l + 0.05) / 4.5 - 0.05));

/** Claro (texto oscuro): el fondo no puede bajar de esta luminancia en ningún punto. */
export const LIGHT_MIN_BACKGROUND = Math.max(...textLuminances('claro').map((l) => 4.5 * (l + 0.05) - 0.05));
