import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENV_PRESETS, GRADIENT_COLORS, GRADIENT_LIGHT } from '../../src/lib/gradient';
import { THEMES } from '../../src/lib/themes';

const css = readFileSync(new URL('../../src/styles/global.css', import.meta.url), 'utf8');

function themeBlock(theme: string): string {
  return css.match(new RegExp(`\\[data-theme='${theme}'\\]\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

function token(theme: string, name: string): string | undefined {
  return themeBlock(theme).match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1]?.toLowerCase();
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('fondo de gradiente', () => {
  it.each(THEMES)('%s tiene tres colores y el texto cumple AA sobre cada uno', (theme) => {
    const colors = Object.values(GRADIENT_COLORS[theme]);
    expect(colors).toHaveLength(3);
    const fg = token(theme, 'fg')!;
    for (const color of colors) expect(contrast(fg, color), `${theme} ${color}`).toBeGreaterThanOrEqual(4.5);
  });

  it.each(THEMES)('%s: el gradiente estático del CSS usa los mismos colores que el animado', (theme) => {
    const { color1, color2, color3 } = GRADIENT_COLORS[theme];
    expect([token(theme, 'grad-1'), token(theme, 'grad-2'), token(theme, 'grad-3')]).toEqual(
      [color1, color2, color3].map((c) => c.toLowerCase()),
    );
  });

  it('los tres HDR existen en el sitio y los que usan los temas son reales', () => {
    const hdr = (preset: string) => readFileSync(new URL(`../../public/hdr/${preset}.hdr`, import.meta.url));
    // ShaderGradient descarga siempre los tres: deben existir y ser Radiance válidos
    for (const preset of ENV_PRESETS) expect(hdr(preset).subarray(0, 10).toString(), preset).toBe('#?RADIANCE');
    for (const theme of THEMES) {
      const { lightType, envPreset } = GRADIENT_LIGHT[theme];
      if (lightType === 'env') expect(hdr(envPreset).length, `${theme}: ${envPreset}`).toBeGreaterThan(500_000);
    }
  });
});
