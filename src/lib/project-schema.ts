import { z } from 'astro/zod';
import { LANGS } from '../i18n/utils';

export const PROJECT_TYPES = ['landing', 'negocio', 'iglesia', 'tienda', 'app'] as const;
export const PROJECT_STATUSES = ['publicado', 'en-progreso', 'por-construir'] as const;
/** Distingue un proyecto propio de un encargo real (PRODUCT.md: no se inventan clientes). */
export const PROJECT_ORIGINS = ['propio', 'cliente'] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectOrigin = (typeof PROJECT_ORIGINS)[number];

/**
 * Esquema de un proyecto (plan §5). Recibe el helper `image()` de Astro para
 * poder probarlo en Vitest con un sustituto.
 */
export function projectSchema<Image extends z.ZodType>(image: () => Image) {
  return z.object({
    title: z.string().min(1),
    number: z.string().regex(/^\d{3}$/),
    type: z.enum(PROJECT_TYPES),
    year: z.number().int(),
    status: z.enum(PROJECT_STATUSES),
    origin: z.enum(PROJECT_ORIGINS),
    stack: z.array(z.string().min(1)),
    cover: image(),
    coverAlt: z.string().min(1),
    gallery: z.array(z.object({ src: image(), alt: z.string().min(1) })),
    liveUrl: z.url().optional(),
    repoUrl: z.url().optional(),
    summary: z.string().min(1),
    lang: z.enum(LANGS),
    /** Un borrador no se lista ni genera página. */
    draft: z.boolean().default(false),
  });
}
