import { defineConfig } from 'vitest/config';

// Config propia, sin getViteConfig de Astro: esa carga el adaptador de Cloudflare, que
// intenta levantar el Worker dentro de Vitest y falla. Los tests unitarios no usan nada
// del pipeline de Astro (solo `astro/zod` e imports de tipos).
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    passWithNoTests: true,
  },
});
