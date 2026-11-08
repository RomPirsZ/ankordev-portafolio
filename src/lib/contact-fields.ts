// Lo que comparten /api/contact, el formulario (T25) y sus tests. Sin dependencias: los e2e
// de Playwright no pueden importar módulos que arrastren los JSON de i18n.

/** Cuerpo máximo del envío: con los límites del esquema, uno real ocupa unos pocos KB. */
export const MAX_BODY_BYTES = 10 * 1024;
/** Campo que el widget de Turnstile añade al formulario. */
export const TURNSTILE_FIELD = 'cf-turnstile-response';
/** Campo trampa, oculto para las personas: si llega con algo, lo rellenó un bot. */
export const HONEYPOT_FIELD = 'website';
