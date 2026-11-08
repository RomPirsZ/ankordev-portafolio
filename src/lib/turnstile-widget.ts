// Widget de Cloudflare Turnstile en el navegador (plan §7). El script de Cloudflare solo
// se descarga cuando el visitante empieza a usar el formulario: una visita normal no hace
// ninguna petición a terceros (constitución X) ni carga JS que no necesita (IV).

export const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface TurnstileApi {
  render(container: HTMLElement, options: Record<string, unknown>): string | undefined;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let script: Promise<TurnstileApi> | null = null;

/** Carga el script una sola vez por visita, también entre View Transitions. */
function loadTurnstile(): Promise<TurnstileApi> {
  script ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const element = document.createElement('script');
    element.src = TURNSTILE_SCRIPT;
    element.async = true;
    element.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile-missing')));
    element.onerror = () => reject(new Error('turnstile-load'));
    document.head.append(element);
  }).catch((error: unknown) => {
    // Un fallo de red no deja la carga rota para siempre: el siguiente intento la repite
    script = null;
    throw error;
  });
  return script;
}

export interface TurnstileWidget {
  /** El token vigente, o espera al siguiente; falla si Turnstile da error o no llega a tiempo. */
  token(timeoutMs?: number): Promise<string>;
  /** Cada token vale para un solo envío: tras usarlo se pide otro. */
  reset(): void;
  remove(): void;
}

interface Options {
  sitekey: string;
  lang: string;
  theme: 'light' | 'dark';
}

export function mountTurnstile(container: HTMLElement, { sitekey, lang, theme }: Options): TurnstileWidget {
  let current: string | null = null;
  let failed: Error | null = null;
  let waiters: { resolve: (token: string) => void; reject: (error: Error) => void }[] = [];
  let widgetId: string | undefined;

  const settle = () => {
    const pending = waiters;
    waiters = [];
    for (const waiter of pending) {
      if (current) waiter.resolve(current);
      else if (failed) waiter.reject(failed);
    }
  };

  const api = loadTurnstile().then((turnstile) => {
    widgetId = turnstile.render(container, {
      sitekey,
      language: lang,
      theme,
      // Invisible salvo que Cloudflare necesite que la persona pulse algo
      appearance: 'interaction-only',
      size: 'flexible',
      // El token se añade al envío a mano; sin campo oculto duplicado en el formulario
      'response-field': false,
      callback: (token: string) => {
        current = token;
        failed = null;
        settle();
      },
      'expired-callback': () => {
        current = null;
      },
      'error-callback': () => {
        current = null;
        failed = new Error('turnstile-error');
        settle();
        return true;
      },
    });
    return turnstile;
  });

  api.catch((error: unknown) => {
    failed = error instanceof Error ? error : new Error('turnstile-load');
    settle();
  });

  return {
    token(timeoutMs = 60_000) {
      if (current) return Promise.resolve(current);
      if (failed) return Promise.reject(failed);
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => {
          waiters = waiters.filter((waiter) => waiter.resolve !== done);
          reject(new Error('turnstile-timeout'));
        }, timeoutMs);
        const done = (token: string) => {
          clearTimeout(timer);
          resolve(token);
        };
        waiters.push({
          resolve: done,
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
      });
    },
    reset() {
      current = null;
      failed = null;
      void api.then((turnstile) => widgetId && turnstile.reset(widgetId)).catch(() => {});
    },
    remove() {
      void api.then((turnstile) => widgetId && turnstile.remove(widgetId)).catch(() => {});
    },
  };
}
