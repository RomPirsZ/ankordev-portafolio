import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { THEMES, isTheme } from '../../src/lib/themes';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

function tokens(theme: string): Record<string, string> {
  const block = css.match(new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('temas', () => {
  it('hay exactamente dos temas: oscuro (por defecto) y claro', () => {
    expect(THEMES).toEqual(['oscuro', 'claro']);
  });

  it.each(THEMES)('%s define todos los tokens', (theme) => {
    expect(Object.keys(tokens(theme)).sort()).toEqual(
      ['accent', 'bg', 'code', 'fg', 'grad-1', 'grad-2', 'grad-3', 'muted', 'on-accent', 'surface'].sort(),
    );
  });

  it.each(THEMES)('%s cumple contraste AA de texto', (theme) => {
    const t = tokens(theme);
    // --code (etiquetas de laboratorio) es texto como los otros dos
    for (const text of ['fg', 'muted', 'code']) {
      expect(contrast(t[text]!, t['bg']!), text).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t[text]!, t['surface']!), text).toBeGreaterThanOrEqual(4.5);
    }
    // El acento puede ir como texto, pero solo sobre --bg
    expect(contrast(t['accent']!, t['bg']!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t['on-accent']!, t['accent']!)).toBeGreaterThanOrEqual(4.5);
  });

  it('isTheme acepta solo temas conocidos', () => {
    expect(isTheme('claro')).toBe(true);
    expect(isTheme('naranja')).toBe(false);
    expect(isTheme('petroleo')).toBe(false);
    expect(isTheme('rosa')).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});
