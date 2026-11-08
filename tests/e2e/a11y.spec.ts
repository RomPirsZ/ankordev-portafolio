// Accesibilidad (constitución III, plan §9): cero violaciones serias o críticas de axe
// en cada tipo de página y en los dos temas. axe no puede calcular el contraste sobre
// el gradiente del fondo (lo deja como «incompleto»): eso lo mide gradient.spec.ts en
// píxeles reales, en ambos temas y en móvil y escritorio.
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';
import { THEMES, THEME_STORAGE_KEY } from '../../src/lib/themes';

const PAGES = [
  { name: 'inicio', path: '/' },
  { name: 'inicio EN', path: '/en/' },
  { name: 'caso de estudio', path: '/proyectos/001-restaurante/' },
  { name: '404', path: '/esto-no-existe/' },
  { name: 'gracias', path: '/gracias/' },
];

for (const theme of THEMES) {
  for (const { name, path } of PAGES) {
    test(`${name}, tema ${theme}: sin violaciones serias de axe`, async ({ page }) => {
      await page.addInitScript(([key, value]) => localStorage.setItem(key!, value!), [THEME_STORAGE_KEY, theme]);
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();
      const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
}
