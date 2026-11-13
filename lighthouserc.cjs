// Lighthouse CI (T33, constitución IV): móvil, sobre el build servido por `astro preview`
// (workerd, con las cabeceras de public/_headers), mediana de 5 pasadas por página (el TBT varía mucho entre pasadas).
// Usa el Chromium de Playwright: el mismo en local y en la CI.
const { chromium } = require('playwright');

const PORT = 4331;
const PAGES = ['/', '/en/', '/proyectos/001-restaurante/'];

module.exports = {
  ci: {
    collect: {
      startServerCommand: `npx astro preview --ignore-lock --port ${PORT}`,
      startServerReadyPattern: String(PORT),
      url: PAGES.map((path) => `http://localhost:${PORT}${path}`),
      numberOfRuns: 5,
      chromePath: chromium.executablePath(),
      // Sin preset: Lighthouse emula por defecto un móvil de gama media con red 4G lenta
      settings: { chromeFlags: '--headless=new --no-sandbox' },
    },
    assert: {
      aggregationMethod: 'median-run',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
      },
    },
    // Informes solo en disco (y como artefacto en la CI): nada se publica fuera
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
