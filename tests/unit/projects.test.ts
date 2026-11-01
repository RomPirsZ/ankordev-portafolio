import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { projectSchema } from '../../src/lib/project-schema';
import { projectSlug, selectProjects } from '../../src/lib/projects';

// En los tests la imagen es solo una ruta; en Astro, `image()` la valida y optimiza.
const schema = projectSchema(() => z.string());

const valid = {
  title: 'Restaurante / café local',
  number: '001',
  type: 'negocio',
  year: 2026,
  status: 'por-construir',
  origin: 'propio',
  stack: [],
  cover: './cover.webp',
  coverAlt: 'Portada provisional del proyecto 001',
  gallery: [],
  summary: 'Proyecto propio.',
  lang: 'es',
};

describe('esquema de proyectos', () => {
  it('acepta una entrada válida y la deja pública por defecto', () => {
    expect(schema.parse(valid).draft).toBe(false);
  });

  it.each([
    ['número sin tres dígitos', { number: '1' }],
    ['estado desconocido', { status: 'terminado' }],
    ['origen desconocido', { origin: 'amigo' }],
    ['tipo desconocido', { type: 'blog' }],
    ['idioma desconocido', { lang: 'fr' }],
    ['portada sin texto alternativo', { coverAlt: '' }],
    ['imagen de galería sin texto alternativo', { gallery: [{ src: './a.webp', alt: '' }] }],
    ['enlace que no es URL', { liveUrl: 'mi-sitio' }],
  ])('rechaza: %s', (_, change) => {
    expect(schema.safeParse({ ...valid, ...change }).success).toBe(false);
  });

  it('exige el origen: un proyecto propio no puede pasar por encargo', () => {
    const { origin: _origin, ...withoutOrigin } = valid;
    expect(schema.safeParse(withoutOrigin).success).toBe(false);
  });
});

describe('selección de proyectos', () => {
  const entry = (id: string, number: string, lang: 'es' | 'en', draft = false) => ({ id, data: { number, lang, draft } });
  const entries = [
    entry('es/003-reservas', '003', 'es'),
    entry('en/001-restaurante', '001', 'en'),
    entry('es/004-iglesia', '004', 'es', true),
    entry('es/001-restaurante', '001', 'es'),
  ];

  it('filtra por idioma, oculta borradores y ordena por número', () => {
    expect(selectProjects(entries, 'es').map((e) => e.id)).toEqual(['es/001-restaurante', 'es/003-reservas']);
    expect(selectProjects(entries, 'en').map((e) => e.id)).toEqual(['en/001-restaurante']);
  });

  it('el slug es el nombre del archivo, igual en ambos idiomas', () => {
    expect(projectSlug('es/001-restaurante')).toBe('001-restaurante');
    expect(projectSlug('en/001-restaurante')).toBe('001-restaurante');
  });
});

describe('archivos de contenido', () => {
  const base = resolve('src/content/projects');
  const files = (lang: string) => readdirSync(join(base, lang)).filter((f) => f.endsWith('.md')).sort();
  const field = (text: string, name: string) => text.match(new RegExp(`^${name}:\\s*['"]?([^'"\\n]+)`, 'm'))?.[1];

  it('hay cuatro proyectos y cada uno existe en español e inglés', () => {
    expect(files('es')).toHaveLength(4);
    expect(files('en')).toEqual(files('es'));
  });

  it.each(['es', 'en'])('en %s, el idioma y la portada de cada archivo son correctos', (lang) => {
    for (const file of files(lang)) {
      const text = readFileSync(join(base, lang, file), 'utf8');
      expect(field(text, 'lang'), file).toBe(lang);
      expect(field(text, 'number'), file).toBe(file.slice(0, 3));
      const cover = field(text, 'cover');
      expect(cover && existsSync(resolve(dirname(join(base, lang, file)), cover)), `${file}: ${cover}`).toBe(true);
    }
  });
});
