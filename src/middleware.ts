import { defineMiddleware } from 'astro:middleware';
import { withSecurityHeaders } from './lib/server-headers';

// public/_headers solo llega a lo estático (plan §8). Lo que genera el código del Worker
// (/_image, /_server-islands, /api/contact) recibe aquí la base que le falte (auditoría de
// seguridad 2026-11-10). Las páginas prerenderizadas no se tocan: sus cabeceras son las de
// _headers. El 403 de `checkOrigin` no pasa por aquí: Astro lo responde antes.
export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  return context.isPrerendered ? response : withSecurityHeaders(response);
});
