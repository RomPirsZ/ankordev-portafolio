import { test, expect, type Locator } from '@playwright/test';

const translation = (locator: Locator) =>
  locator.evaluate((element) => {
    const { m41, m42 } = new DOMMatrix(getComputedStyle(element).transform);
    return { x: Math.round(m41), y: Math.round(m42) };
  });

test.describe('con puntero fino (escritorio)', () => {
  test.skip(({ isMobile }) => isMobile, 'Los efectos de puntero son solo de escritorio');

  test('el botón principal es magnético y vuelve a su sitio al salir', async ({ page }) => {
    await page.goto('/no-existe/');
    const button = page.locator('[data-magnetic]');
    await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);

    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4, { steps: 5 });
    await expect.poll(() => translation(button).then(({ x, y }) => x > 0 && y > 0)).toBe(true);

    await page.mouse.move(5, 5, { steps: 5 });
    await expect.poll(() => translation(button)).toEqual({ x: 0, y: 0 });
  });

  test('el cursor de laboratorio acompaña al puntero y es decorativo', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
    const cursor = page.locator('.lab-cursor');
    await expect(cursor).toHaveAttribute('aria-hidden', 'true');

    await page.mouse.move(400, 300, { steps: 4 });
    await expect.poll(() => cursor.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
    await expect.poll(() => translation(cursor)).toEqual({ x: 400, y: 300 });
    // El cursor del sistema sigue visible
    expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).not.toBe('none');
  });
});

test('en táctil no hay cursor ni magnetismo', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Comprobación para puntero grueso');
  await page.goto('/no-existe/');
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
  await expect(page.locator('.lab-cursor')).toHaveCount(0);
});

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('no hay cursor de laboratorio', async ({ page }) => {
    await page.goto('/');
    await page.mouse.move(400, 300);
    await expect(page.locator('.lab-cursor')).toHaveCount(0);
  });
});
