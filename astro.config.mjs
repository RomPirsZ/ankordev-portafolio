// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Estático por defecto; solo /api/contact opta por servidor (prerender = false)
  output: 'static',
  adapter: vercel(),
  // React solo para la isla del fondo de gradiente (plan §6.1)
  integrations: [react()],
  // Scripts y estilos siempre como archivos: así la CSP solo necesita el hash
  // del script anti-parpadeo
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
