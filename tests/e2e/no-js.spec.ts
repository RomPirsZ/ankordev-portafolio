// Plan §9, e2e 8 (constitución I): sin JavaScript todo se lee y se navega.
import { test, expect, type Page } from '@playwright/test';

test.use({ javaScriptEnabled: false });

/** Nada queda oculto a la espera de las animaciones: titulares, secciones y etiquetas. */
async function expectContentShown(page: Page) {
  await expect(page.locator('h1')).toBeVisible();
  const animated = page.locator('[data-split], [data-reveal], [data-scramble]');
  expect(await animated.count()).toBeGreaterThan(0);
  for (const element of await animated.all()) {
    await expect(element).toHaveCSS('opacity', '1');
    await expect(element).not.toBeEmpty();
  }
}

test('se recorre el inicio, un caso de estudio y el otro idioma', async ({ page }) => {
  await page.goto('/');
  await expectContentShown(page);

  await page.locator('#proyectos .project-link').first().click();
  await expect(page).toHaveURL(/\/proyectos\/001-restaurante\/$/);
  await expectContentShown(page);
  await expect(page.getByRole('heading', { level: 2, name: 'Problema' })).toBeVisible();

  await page.locator('a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/projects\/001-restaurante\/$/);
  await expectContentShown(page);

  await page.getByRole('link', { name: 'Back to projects' }).click();
  await expect(page).toHaveURL(/\/en\/#projects$/);
  await expectContentShown(page);
  await expect(page.locator('#projects .project-title').first()).toBeVisible();
});

test('la 404 se lee sin JavaScript', async ({ page }) => {
  await page.goto('/esto-no-existe/');
  await expectContentShown(page);
  await page.getByRole('link', { name: 'Ir al inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
});
