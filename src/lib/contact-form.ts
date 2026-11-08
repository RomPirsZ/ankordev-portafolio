// Formulario de contacto en el navegador (T25, plan §7). Sin JS el formulario no se ofrece:
// Turnstile lo necesita, y WhatsApp y email siguen ahí (constitución I). Con JS valida con las
// mismas reglas que el servidor, pide el token de Turnstile, envía con fetch y lleva a gracias.
import { navigate } from 'astro:transitions/client';
import { CONTACT_LIMITS, CONTACT_TEXT_FIELDS, TURNSTILE_FIELD, validateContactText, type ContactErrorCode } from './contact-fields';
import type { ContactApiError, ContactApiResponse } from './contact-handler';
import { mountTurnstile, type TurnstileWidget } from './turnstile-widget';

type Alert = Exclude<ContactApiError, 'method'> | 'network';

/** Textos ya traducidos que el componente pasa en `data-messages` (src/i18n). */
export interface ContactFormMessages {
  field: Record<ContactErrorCode | 'email', string>;
  alert: Record<Alert, string>;
  status: Record<'verifying' | 'sending', string>;
}

const ERROR_FIELDS = ['name', 'email', 'project_type', 'budget', 'message'] as const;
type ErrorField = (typeof ERROR_FIELDS)[number];

export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form || form.dataset['ready']) return;
  form.dataset['ready'] = 'true';

  const wrap = form.closest<HTMLElement>('[data-contact-form-wrap]');
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]')!;
  const alert = form.querySelector<HTMLElement>('[data-form-alert]')!;
  const container = form.querySelector<HTMLElement>('[data-turnstile]')!;
  const messages = JSON.parse(form.dataset['messages'] ?? '{}') as ContactFormMessages;
  const { sitekey = '', lang = 'es', thanks = '/' } = form.dataset;

  // Con JS el formulario funciona: se muestra y se retira el aviso para quien no tiene JS
  if (wrap) wrap.hidden = false;
  const noJs = wrap?.parentElement?.querySelector<HTMLElement>('[data-contact-no-js]');
  if (noJs) noJs.hidden = true;

  let widget: TurnstileWidget | null = null;
  let busy = false;

  const turnstile = () =>
    (widget ??= mountTurnstile(container, {
      sitekey,
      lang,
      theme: document.documentElement.dataset['theme'] === 'claro' ? 'light' : 'dark',
    }));

  // Turnstile se prepara en cuanto la persona empieza a escribir: al enviar, el token ya está
  form.addEventListener('focusin', () => void turnstile(), { once: true });
  document.addEventListener(
    'astro:before-swap',
    () => {
      widget?.remove();
      widget = null;
    },
    { once: true },
  );

  // Al corregir un campo, su error desaparece
  form.addEventListener('input', (event) => {
    const field = (event.target as HTMLInputElement).name as ErrorField;
    if (ERROR_FIELDS.includes(field)) clearFieldError(field);
  });

  function fieldElement(field: ErrorField) {
    return form!.elements.namedItem(field) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
  }

  function fieldMessage(field: ErrorField, code: ContactErrorCode) {
    if (field === 'email' && code === 'invalid') return messages.field.email;
    const limits: { min?: number; max?: number } = field in CONTACT_LIMITS ? CONTACT_LIMITS[field as keyof typeof CONTACT_LIMITS] : {};
    return messages.field[code].replace('{min}', String(limits.min ?? '')).replace('{max}', String(limits.max ?? ''));
  }

  function showFieldError(field: ErrorField, code: ContactErrorCode) {
    const slot = form!.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    if (!slot) return;
    slot.textContent = fieldMessage(field, code);
    slot.hidden = false;
    fieldElement(field)?.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field: ErrorField) {
    const slot = form!.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
    if (slot) {
      slot.hidden = true;
      slot.textContent = '';
    }
    fieldElement(field)?.removeAttribute('aria-invalid');
  }

  function showErrors(errors: Partial<Record<ErrorField, ContactErrorCode>>) {
    const fields = ERROR_FIELDS.filter((field) => errors[field]);
    for (const field of fields) showFieldError(field, errors[field]!);
    if (fields[0]) fieldElement(fields[0])?.focus();
  }

  // El aviso (role="alert") está siempre en el DOM y se oculta vacío: así se anuncia al cambiar
  function showAlert(kind: Alert) {
    alert.textContent = messages.alert[kind];
  }

  function setBusy(state: 'verifying' | 'sending' | null) {
    busy = state !== null;
    form!.setAttribute('aria-busy', String(busy));
    submit.setAttribute('aria-disabled', String(busy));
    status.textContent = state ? messages.status[state] : '';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;

    for (const field of ERROR_FIELDS) clearFieldError(field);
    alert.textContent = '';

    const data = new FormData(form);
    const values = Object.fromEntries(CONTACT_TEXT_FIELDS.map((field) => [field, String(data.get(field) ?? '')]));
    const errors = validateContactText(values);
    if (Object.keys(errors).length > 0) {
      showErrors(errors);
      showAlert('invalid');
      return;
    }

    setBusy('verifying');
    const current = turnstile();
    let token: string;
    try {
      token = await current.token();
    } catch {
      // Se vuelve a montar en el siguiente intento (también si falló la descarga del script)
      current.remove();
      widget = null;
      setBusy(null);
      showAlert('verification');
      return;
    }

    setBusy('sending');
    data.set(TURNSTILE_FIELD, token);
    let result: ContactApiResponse | null = null;
    try {
      const response = await fetch(form.action, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      result = (await response.json().catch(() => null)) as ContactApiResponse | null;
    } catch {
      current.reset();
      setBusy(null);
      showAlert('network');
      return;
    }
    // El token ya se gastó en el servidor, salga como salga
    current.reset();

    if (result?.ok) {
      await navigate(thanks);
      return;
    }

    setBusy(null);
    if (result?.error === 'invalid' && result.fields) {
      showErrors(result.fields);
      showAlert('invalid');
    } else if (result && result.error !== 'method') {
      showAlert(result.error);
    } else {
      showAlert('server');
    }
  });
}
