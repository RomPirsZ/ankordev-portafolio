import type { Lang } from '../i18n/utils';

interface ProjectLike {
  id: string;
  data: { number: string; lang: Lang; draft: boolean };
}

/** `es/001-restaurante` → `001-restaurante`: el mismo slug en ambos idiomas. */
export function projectSlug(id: string): string {
  return id.slice(id.lastIndexOf('/') + 1);
}

/** Proyectos visibles en un idioma, ordenados por número. */
export function selectProjects<T extends ProjectLike>(entries: T[], lang: Lang): T[] {
  return entries
    .filter((entry) => entry.data.lang === lang && !entry.data.draft)
    .sort((a, b) => a.data.number.localeCompare(b.data.number));
}
