import type { Contact } from './contact-schema';

// Aviso por email de cada contacto nuevo, con Resend (plan §7). Es «best effort»: el
// contacto ya está guardado en Supabase, así que un fallo aquí no se muestra al visitante,
// solo va a los logs. El email es para el dueño del sitio, no un texto de la interfaz.

export const RESEND_API_URL = 'https://api.resend.com/emails';
/** Remitente de pruebas de Resend: sin dominio propio verificado, solo entrega en el email de la cuenta. */
export const DEFAULT_FROM = 'Portafolio [A]nkordev <onboarding@resend.dev>';

/**
 * Avisos como máximo en 24 horas (T26f). Resend gratis admite 100 emails al día y 3 000 al
 * mes: 80 deja margen para pruebas, y 80 × 31 días = 2 480 tampoco llega al tope mensual.
 * Pasado el tope, el contacto se guarda igual pero sin email: así un bot con tokens válidos
 * no puede agotar la cuota. El primer contacto que pasa el tope manda en su lugar un aviso
 * de «tope alcanzado» (T26g), para que el dueño sepa que hay contactos sin email.
 */
export const NOTIFY_CAP_24H = 80;

const SUBJECT_MAX = 120;

export interface NotifyResult {
  success: boolean;
  /** Para los logs. */
  error?: string;
}

interface Options {
  apiKey: string;
  /** Email del dueño del sitio. */
  to: string;
  from?: string;
  /** Inyectable para los tests. */
  fetch?: typeof globalThis.fetch;
  timeoutMs?: number;
}

const isTimeout = (error: unknown) => error instanceof Error && error.name === 'TimeoutError';

/** Una sola línea (nada se cuela en el asunto) y como mucho SUBJECT_MAX caracteres. */
function subjectFor(lead: Contact) {
  const line = `Nuevo contacto: ${lead.name} (${lead.project_type ?? 'sin tipo'})`.replace(/\s+/g, ' ').trim();
  const chars = [...line];
  return chars.length <= SUBJECT_MAX ? line : `${chars.slice(0, SUBJECT_MAX - 1).join('')}…`;
}

function textFor(lead: Contact) {
  return [
    `Nombre: ${lead.name}`,
    `Email: ${lead.email}`,
    `Tipo de proyecto: ${lead.project_type ?? '—'}`,
    `Presupuesto: ${lead.budget ?? '—'}`,
    `Idioma: ${lead.lang}`,
    '',
    lead.message,
    '',
    '—',
    'Formulario de contacto del portafolio. Responde a este email para escribir a quien lo envió.',
  ].join('\n');
}

export const CAP_ALERT_SUBJECT = 'Tope de avisos alcanzado: revisa la tabla leads';

/**
 * Aviso único al pasar el tope (T26g). Sin datos del visitante: quien llena el tope suele ser
 * un bot, así que ni su texto ni su email llegan aquí.
 */
function capAlertText() {
  return [
    `Llegaron más de ${NOTIFY_CAP_24H} contactos en 24 horas.`,
    '',
    'Desde ahora se siguen guardando en Supabase, pero sin email, hasta que el recuento de las',
    'últimas 24 horas vuelva a bajar del tope. Revisa la tabla leads: si hay un contacto real',
    'entre ellos, no te va a llegar aviso de él.',
    '',
    'En Workers Logs, cada contacto sin aviso queda como contact.notify-capped.',
  ].join('\n');
}

export function notifyNewLead(lead: Contact, options: Options): Promise<NotifyResult> {
  // Texto plano, sin HTML: lo que escribió el visitante no puede inyectar nada
  return send({ reply_to: lead.email, subject: subjectFor(lead), text: textFor(lead) }, options);
}

export function notifyCapReached(options: Options): Promise<NotifyResult> {
  return send({ subject: CAP_ALERT_SUBJECT, text: capAlertText() }, options);
}

async function send(
  message: { subject: string; text: string; reply_to?: string },
  { apiKey, to, from = DEFAULT_FROM, fetch = globalThis.fetch, timeoutMs = 5000 }: Options,
): Promise<NotifyResult> {
  if (!apiKey || !to) return { success: false, error: 'missing-config' };

  let response: Response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], ...message }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    return { success: false, error: isTimeout(error) ? 'timeout' : 'network-error' };
  }

  return response.ok ? { success: true } : { success: false, error: `http-${response.status}` };
}
