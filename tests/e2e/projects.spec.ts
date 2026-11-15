import { test, expect } from '@playwright/test';

test('el inicio lista los proyectos publicables en orden, sin el borrador', async ({ page }) => {
  await page.goto('/');
  const titles = page.locator('#proyectos .project-title');
  await expect(titles).toHaveText(['Restaurante / café local', 'Don Pascal: tienda online', 'App de reservas para barbería']);
  await expect(page.locator('#proyectos')).not.toContainText('iglesia');
});

test('sin JavaScript la sección de proyectos se lee en vista lista', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-projects]')).toHaveAttribute('data-view', 'list');
  await expect(page.locator('#proyectos .project-title').first()).toBeVisible();
  await expect(page.locator('#proyectos .project-cover').first()).toBeHidden();
  await context.close();
});

test('cada fila abre su caso de estudio y se puede volver', async ({ page }) => {
  await page.goto('/');
  await page.locator('#proyectos .project-link').nth(1).click();

  await expect(page).toHaveURL(/\/proyectos\/002-tienda\/$/);
  await expect(page.locator('h1')).toHaveText('Don Pascal: tienda online');
  await expect(page.getByRole('heading', { level: 2, name: 'Problema' })).toBeVisible();
  await expect(page.locator('main img').first()).toHaveAttribute('alt', /^Inicio de Don Pascal/);
  // Caso publicado (T28): enlaces reales al sitio y al repositorio
  await expect(page.locator('main a[href="https://don-pascal.ankordev.workers.dev"]')).toBeVisible();
  await expect(page.locator('main a[href="https://github.com/RomPirsZ/don-pascal-tienda"]')).toBeVisible();

  await page.getByRole('link', { name: 'Volver a proyectos' }).click();
  await expect(page).toHaveURL(/\/#proyectos$/);
});

test('el caso de estudio enlaza con su versión en el otro idioma', async ({ page }) => {
  await page.goto('/proyectos/003-reservas/');
  await page.locator('a[hreflang="en"]').click();
  await expect(page).toHaveURL(/\/en\/projects\/003-reservas\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText('Barbershop booking app');
});

test('un proyecto en borrador no tiene página', async ({ page }) => {
  const response = await page.goto('/proyectos/004-iglesia/');
  expect(response?.status()).toBe(404);
});

test('la 404 responde 404 y ofrece volver en ambos idiomas', async ({ page }) => {
  const response = await page.goto('/esto-no-existe/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Esta página no existe');
  await expect(page.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/');
  await expect(page.locator('[lang="en"] a')).toHaveAttribute('href', '/en/');
});
