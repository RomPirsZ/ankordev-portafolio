// Paquetes de servicios (spec §5.4), en el orden en que se muestran. Sus textos y
// precios viven en src/i18n/ (`services.<id>.*`): la tarifa local en es.json y la
// internacional en en.json.
export const PACKAGES = ['landing', 'negocio', 'app'] as const;

export type Package = (typeof PACKAGES)[number];
