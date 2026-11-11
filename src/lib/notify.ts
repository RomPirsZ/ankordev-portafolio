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
 * no puede agotar la cuota y dejar sin aviso a los clientes reales.
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

export async function notifyNewLead(
  lead: Contact,
  { apiKey, to, from = DEFAULT_FROM, fetch = globalThis.fetch, timeoutMs = 5000 }: Options,
): Promise<NotifyResult> {
  if (!apiKey || !to) return { success: false, error: 'missing-config' };

  let response: Response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      // Texto plano, sin HTML: lo que escribió el visitante no puede inyectar nada
      body: JSON.stringify({ from, to: [to], reply_to: lead.email, subject: subjectFor(lead), text: textFor(lead) }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    return { success: false, error: isTimeout(error) ? 'timeout' : 'network-error' };
  }

  return response.ok ? { success: true } : { success: false, error: `http-${response.status}` };
}
