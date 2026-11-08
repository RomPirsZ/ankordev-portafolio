// Tipos mínimos del runtime de Workers que usa /api/contact. Se declaran aquí en vez de
// instalar @cloudflare/workers-types, que solo haría falta para esta línea (constitución VII).
/** Variables públicas de build (`.env` en local, Workers Builds en producción). */
interface ImportMetaEnv {
  /** Site key de Turnstile: la de prueba en local y CI, la real solo en Workers Builds. */
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

declare module 'cloudflare:workers' {
  /** Variables y secretos del Worker (panel de Cloudflare o `wrangler secret put`). */
  export const env: Record<string, unknown>;
}
