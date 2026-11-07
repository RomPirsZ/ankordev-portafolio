// Los paquetes y sus precios están decididos (spec §5.4, PRODUCT.md): no se cambian
// sin confirmación. Si este test falla, la spec y los textos dejaron de coincidir.
import { describe, expect, it } from 'vitest';
import { useTranslations, type Lang } from '../../src/i18n/utils';
import { PACKAGES } from '../../src/lib/services';

const SPEC: Record<Lang, Record<(typeof PACKAGES)[number], string>> = {
  es: { landing: '$300', negocio: '$750', app: '$1.500' },
  en: { landing: '$500', negocio: '$1,300', app: '$2,600' },
};

describe('paquetes de servicios', () => {
  it('son los 3 de la spec, en orden', () => {
    expect(PACKAGES).toEqual(['landing', 'negocio', 'app']);
  });

  it.each(['es', 'en'] as const)('los precios «desde» en %s son los de la spec', (lang) => {
    const t = useTranslations(lang);
    for (const id of PACKAGES) expect(t(`services.${id}.price`), id).toBe(SPEC[lang][id]);
  });

  it('el alcance y el plazo coinciden con la spec', () => {
    const t = useTranslations('es');
    expect(PACKAGES.map((id) => `${t(`services.${id}.scope`)} · ${t(`services.${id}.time`)}`)).toEqual([
      '1 página · 5–7 días',
      'Hasta 5 páginas · 2–3 semanas',
      'A medida · 3–6 semanas',
    ]);
  });
});
