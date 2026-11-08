// Sustituto local del script de Turnstile para los e2e: no dependen de la red de Cloudflare
// y cada token es predecible. Se sirve en la URL real, así la CSP se comprueba igual.
import type { Page } from '@playwright/test';

export const STUB_TOKEN = 'token-de-prueba';

interface Options {
  /** Turnstile responde con error en vez de dar un token. */
  fail?: boolean;
}

export async function stubTurnstile(page: Page, { fail = false }: Options = {}) {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js*', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `(() => {
        let renders = 0;
        const widgets = {};
        const issue = (id) => setTimeout(() => {
          const options = widgets[id];
          if (!options) return;
          if (${fail}) options['error-callback']?.();
          else options.callback('${STUB_TOKEN}');
        }, 30);
        window.turnstile = {
          render(element, options) {
            const id = 'w' + ++renders;
            widgets[id] = options;
            window.__turnstile = { renders, options: { sitekey: options.sitekey, language: options.language, theme: options.theme } };
            issue(id);
            return id;
          },
          reset(id) { issue(id); },
          remove(id) { delete widgets[id]; },
        };
      })();`,
    }),
  );
}
