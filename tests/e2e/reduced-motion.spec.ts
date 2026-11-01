// Plan §9, e2e 7: con movimiento reducido no hay animaciones (constitución II).
import { test, expect, type Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

/** Animaciones CSS, transiciones y Web Animations (incluidas las de View Transitions). */
const runningAnimations = (page: Page) => page.evaluate(() => document.getAnimations().length);

const nothingMoves = async (page: Page) => {
  expect(await runningAnimations(page)).toBe(0);
  await expect(page.locator('html')).not.toHaveClass(/\b(motion|motion-ready|lenis)\b/);
  await expect(page.locator('.lab-cursor, .project-float')).toHaveCount(0);
  expect(await page.locator('h1 *').count()).toBe(0);
};

test('en todo el recorrido nada se anima y GSAP ni se descarga', async ({ page, isMobile }) => {
  const animationChunks: string[] = [];
  page.on('request', (request) => {
    if (/\/_astro\/animations\.[^/]+\.js$/.test(request.url())) animationChunks.push(request.url());
  });

  // Inicio: hover sobre proyectos y cambio de vista
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await nothingMoves(page);
  const row = page.locator('.project-link').first();
  await row.scrollIntoViewIfNeeded();
  if (!isMobile) await row.hover();
  await page.getByRole('button', { name: 'Cuadrícula' }).click();
  await page.getByRole('button', { name: 'Lista' }).click();
  await nothingMoves(page);
  await expect(page.locator('#proyectos [data-scramble]')).toHaveText('[ 01 / Proyectos ]');

  // Caso de estudio, por transición de página
  await row.click();
  await expect(page).toHaveURL(/\/proyectos\/001-restaurante\/$/);
  expect(await runningAnimations(page)).toBe(0);
  await nothingMoves(page);

  // 404: el botón principal no es magnético
  await page.goto('/no-existe/');
  const button = page.locator('[data-magnetic]');
  if (!isMobile) {
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width - 4, box.y + box.height - 4, { steps: 4 });
  }
  expect(await button.evaluate((element) => getComputedStyle(element).transform)).toBe('none');
  await nothingMoves(page);

  expect(animationChunks).toEqual([]);
});
