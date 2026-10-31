// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Estático por defecto; solo /api/contact opta por servidor (prerender = false)
  output: 'static',
  adapter: vercel(),
  // Scripts y estilos siempre como archivos: así la CSP solo necesita el hash
  // del script anti-parpadeo
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
