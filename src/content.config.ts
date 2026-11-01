import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectSchema } from './lib/project-schema';

// Un archivo por proyecto e idioma: src/content/projects/{es,en}/<número>-<nombre>.md
const projects = defineCollection({
  loader: glob({ pattern: '{es,en}/*.md', base: './src/content/projects' }),
  schema: ({ image }) => projectSchema(image),
});

export const collections = { projects };
