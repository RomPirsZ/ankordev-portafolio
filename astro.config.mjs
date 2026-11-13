// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { LANGS, localizePath } from './src/i18n/utils.ts';
import { SITE_URL } from './src/lib/site.ts';

// Páginas que no deben ir al sitemap: llevan noindex (gracias) o no son contenido (404)
const NOT_IN_SITEMAP = ['/gracias/', '/en/thanks/', '/404/', '/404'];

export default defineConfig({
  // URL absoluta para canonical, hreflang, Open Graph y sitemap (T32)
  site: SITE_URL,
  // Estático por defecto; solo /api/contact opta por servidor (prerender = false)
  output: 'static',
  // Cloudflare Workers (plan §1, T09c). `compile`: sharp optimiza las imágenes en el
  // build y en producción se sirven tal cual, sin el servicio de pago Cloudflare Images.
  adapter: cloudflare({ imageService: 'compile' }),
  // El sitio no usa sesiones: sin esto, el adaptador crea un KV para guardarlas
  session: false,
  integrations: [
    // React solo para la isla del fondo de gradiente (plan §6.1)
    react(),
    // Sitemap con alternas es/en (plan §10)
    sitemap({
      i18n: { defaultLocale: 'es', locales: { es: 'es', en: 'en' } },
      filter: (page) => !NOT_IN_SITEMAP.some((path) => new URL(page).pathname === path),
      // El i18n de la integración solo empareja rutas iguales salvo el prefijo; los casos
      // cambian de segmento (/proyectos/ ↔ /en/projects/), así que se emparejan aquí
      serialize(item) {
        const slug = new URL(item.url).pathname.match(/^\/(?:proyectos|en\/projects)\/([^/]+)\/$/)?.[1];
        if (slug) {
          item.links = LANGS.map((lang) => ({ lang, url: new URL(localizePath('project', lang, { slug }), SITE_URL).href }));
        }
        return item;
      },
    }),
  ],
  // Scripts y estilos siempre como archivos: así la CSP solo necesita el hash
  // del script anti-parpadeo
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    build: { assetsInlineLimit: 0 },
  },
});
