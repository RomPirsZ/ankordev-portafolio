// Cabeceras de seguridad de lo que responde el código del Worker. public/_headers solo llega
// a lo estático (plan §8): /api/contact las usa con `no-store`, y src/middleware.ts las pone
// en el resto (/_image, /_server-islands). Sin dependencias: los e2e las importan.

export const SERVER_SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

/**
 * Devuelve la respuesta con las cabeceras que le falten; las que ya trae no se tocan. Es una
 * copia: las respuestas de `fetch` (y de `env.ASSETS`) tienen las cabeceras inmutables.
 */
export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SERVER_SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
