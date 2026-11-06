// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Estático por defecto; solo /api/contact opta por servidor (prerender = false)
  output: 'static',
  // Cloudflare Workers (plan §1, T09c). `compile`: sharp optimiza las imágenes en el
  // build y en producción se sirven tal cual, sin el servicio de pago Cloudflare Images.
  adapter: cloudflare({ imageService: 'compile' }),
  // El sitio no usa sesiones: sin esto, el adaptador crea un KV para guardarlas
  session: false,
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
