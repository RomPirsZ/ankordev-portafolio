// Tipos mínimos del runtime de Workers que usa /api/contact. Se declaran aquí en vez de
// instalar @cloudflare/workers-types, que solo haría falta para esta línea (constitución VII).
declare module 'cloudflare:workers' {
  /** Variables y secretos del Worker (panel de Cloudflare o `wrangler secret put`). */
  export const env: Record<string, unknown>;
}
