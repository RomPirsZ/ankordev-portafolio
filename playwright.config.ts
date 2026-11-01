import { defineConfig, devices } from '@playwright/test';

// Puerto propio: el 4321 es el de `astro dev`, y con reuseExistingServer los
// tests acabarían probando el servidor de desarrollo en lugar del build.
const PORT = 4329;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // Escritorio sin WebGL: prueba el fondo estático (el respaldo real) y evita que
    // cada test renderice el gradiente y sature la CPU
    {
      name: 'desktop',
      testIgnore: /gradient\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--disable-webgl', '--disable-webgl2'] } },
    },
    // El fondo animado, con WebGL por software (SwiftShader): mismo renderizador en
    // local y en CI (sin GPU), así la medición de contraste es reproducible
    {
      name: 'desktop-webgl',
      testMatch: /gradient\.spec\.ts/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] },
      },
    },
  ],
  // Se prueba el build real, no el servidor de desarrollo. En CI el build es un paso previo.
  webServer: {
    command: `${process.env['CI'] ? '' : 'npm run build && '}npx astro preview --ignore-lock --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
