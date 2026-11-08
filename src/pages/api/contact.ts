// Endpoint del formulario de contacto (plan §7). La única ruta que no se prerenderiza:
// la lógica vive en src/lib/contact-handler.ts, aquí solo se conecta con el Worker.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { handleContact } from '../../lib/contact-handler';
import { createRateLimiter } from '../../lib/rate-limit';

export const prerender = false;

// Uno por instancia del Worker: se reinicia entre ellas (excepción aceptada en el plan §1)
const limiter = createRateLimiter();

// ALL y no POST: así un GET recibe el 405 del handler, con su cabecera Allow
export const ALL: APIRoute = ({ request }) => handleContact(request, { env, limiter });
