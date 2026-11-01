// Plan §9, e2e 3: vista Lista/Cuadrícula (control, accesibilidad, memoria) e imagen flotante.
import { test, expect, type Page } from '@playwright/test';

const projects = (page: Page) => page.locator('[data-projects]');
const listButton = (page: Page) => page.getByRole('button', { name: 'Lista' });
const gridButton = (page: Page) => page.getByRole('button', { name: 'Cuadrícula' });

test('la vista cambia entre lista y cuadrícula, y se recuerda', async ({ page }) => {
  await page.goto('/');
  await expect(listButton(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(projects(page)).toHaveAttribute('data-view', 'list');
  await expect(page.locator('.project-cover').first()).toBeHidden();

  await gridButton(page).click();
  await expect(projects(page)).toHaveAttribute('data-view', 'grid');
  await expect(gridButton(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(listButton(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.project-cover').first()).toBeVisible();

  await page.reload();
  await expect(projects(page)).toHaveAttribute('data-view', 'grid');
  await expect(gridButton(page)).toHaveAttribute('aria-pressed', 'true');

  await listButton(page).click();
  await expect(projects(page)).toHaveAttribute('data-view', 'list');
});

test('sin JavaScript no aparece el control de vista', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-view-controls]')).toBeHidden();
  await context.close();
});

test.describe('con reduced-motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('el control de vista funciona igual', async ({ page }) => {
    await page.goto('/');
    await gridButton(page).click();
    await expect(projects(page)).toHaveAttribute('data-view', 'grid');
  });
});

test.describe('imagen flotante (puntero fino)', () => {
  test.skip(({ isMobile }) => isMobile, 'Solo con puntero fino');

  const floatOpacity = (page: Page) => page.locator('.project-float').evaluate((element) => getComputedStyle(element).opacity);
  const visibleImage = (page: Page) =>
    page.locator('.project-float img').evaluateAll((images) => images.findIndex((image) => getComputedStyle(image).opacity === '1'));

  test('en la lista, la portada del proyecto sigue al puntero y se va al salir', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
    await expect(page.locator('.project-float')).toHaveAttribute('aria-hidden', 'true');

    const row = page.locator('.project-link').nth(1);
    await row.scrollIntoViewIfNeeded();
    const box = (await row.boundingBox())!;
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 4 });
    await expect.poll(() => floatOpacity(page)).toBe('1');
    expect(await visibleImage(page)).toBe(1);

    await page.mouse.move(box.x + 120, box.y - 400, { steps: 6 });
    await expect.poll(() => floatOpacity(page)).toBe('0');
  });

  test('en la cuadrícula no aparece', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
    await gridButton(page).click();
    const card = page.locator('.project-link').first();
    await card.scrollIntoViewIfNeeded();
    const box = (await card.boundingBox())!;
    await page.mouse.move(box.x + 30, box.y + 30);
    await page.mouse.move(box.x + 80, box.y + 60, { steps: 4 });
    await page.waitForTimeout(500);
    expect(await floatOpacity(page)).toBe('0');
  });
});

test('en táctil no hay imagen flotante', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Comprobación para puntero grueso');
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\bmotion-ready\b/);
  await expect(page.locator('.project-float')).toHaveCount(0);
});
