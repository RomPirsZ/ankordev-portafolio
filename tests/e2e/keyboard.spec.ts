// Plan §9, e2e 9 (constitución III): todo se usa solo con teclado, con el foco visible.
import { test, expect, type Page } from '@playwright/test';
import { stubTurnstile } from './turnstile-stub';

test.skip(({ isMobile }) => isMobile, 'El teclado se prueba en escritorio');

/** Descripción corta del elemento con el foco (o null si no hay ninguno). */
function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
    return `${el.tagName.toLowerCase()} ${el.getAttribute('href') ?? ''} ${text}`.trim();
  });
}

/** Pulsa Tab hasta que el foco llegue a `selector`. */
async function tabTo(page: Page, selector: string) {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return;
  }
  throw new Error(`El Tab no llega a ${selector}`);
}

for (const path of ['/', '/proyectos/001-restaurante/']) {
  test(`${path}: el Tab recorre todo lo interactivo en orden, con foco visible y sin trampas`, async ({ page }) => {
    // Al enfocar el formulario se carga Turnstile: el sustituto local evita la red
    await stubTurnstile(page);
    await page.goto(path);
    // Lo interactivo que se ve, en orden del documento (ningún tabindex positivo lo altera).
    // El honeypot del formulario es inert: fuera del foco a propósito
    const expected = await page.$$eval('a[href], button, input:not([type="hidden"]), select, textarea', (elements) =>
      elements
        .filter((el) => el.checkVisibility() && !el.closest('[inert]'))
        .map((el) => {
          const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
          return `${el.tagName.toLowerCase()} ${el.getAttribute('href') ?? ''} ${text}`.trim();
        }),
    );
    expect(expected.length).toBeGreaterThan(5);

    const reached: string[] = [];
    for (const _ of expected) {
      await page.keyboard.press('Tab');
      reached.push((await focused(page)) ?? '(nada)');
      const outline = await page.evaluate(() => {
        const style = getComputedStyle(document.activeElement!);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(outline.style, `foco visible en ${reached.at(-1)}`).not.toBe('none');
      expect(outline.width, `foco visible en ${reached.at(-1)}`).toBeGreaterThanOrEqual(2);
    }
    expect(reached).toEqual(expected);

    // Tras el último elemento, el foco sale de la página: no hay trampas
    await page.keyboard.press('Tab');
    expect(await focused(page)).toBeNull();
  });
}

test('con Enter se abre un caso de estudio, el foco vuelve arriba y se regresa a la lista', async ({ page }) => {
  await page.goto('/');
  await tabTo(page, '.project-link');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/proyectos\/001-restaurante\/$/);
  await expect(page.locator('h1')).toHaveText('Restaurante / café local');

  // En la página nueva, el primer Tab lleva a «Saltar al contenido», como en una carga normal
  await page.keyboard.press('Tab');
  await expect(page.locator('a[href="#contenido"]')).toBeFocused();

  await tabTo(page, 'a[href="/#proyectos"]:not(nav a)');
  await expect(page.locator(':focus')).toHaveText('Volver a proyectos');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/#proyectos$/);
  await expect(page.locator('#proyectos .project-link')).toHaveCount(3);
});

test('el control de vista responde a Espacio y Enter', async ({ page }) => {
  await page.goto('/');
  const projects = page.locator('[data-projects]');
  await tabTo(page, '[data-view-value="grid"]');
  await page.keyboard.press('Space');
  await expect(projects).toHaveAttribute('data-view', 'grid');
  await expect(page.locator('[data-view-value="grid"]')).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('[data-view-value="list"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(projects).toHaveAttribute('data-view', 'list');
});
