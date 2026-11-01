# Plan técnico 001 — Portafolio [A]nkordev v1

> Cómo se construye lo definido en `spec.md`. Debe cumplir `docs/constitution.md`.

---

## 1. Chequeo de constitución

| Principio | Cómo se cumple |
|---|---|
| I. Contenido primero | Astro genera HTML estático; animaciones con JS solo como capa; formulario funciona con POST nativo |
| II. Movimiento con propósito | GSAP sobre `transform`/`opacity`; `filter: blur()` solo en la entrada de titulares y textos cortos (≤ 0,6 s, ≤ 8 px; constitución 1.1.0); todo se desactiva con `prefers-reduced-motion` |
| III. Accesibilidad | HTML semántico, contraste verificado por tema, axe en CI |
| IV. Rendimiento | Salida estática, fuentes self-hosted, `astro:assets` para imágenes, GSAP solo donde se usa, Lighthouse CI |
| V. Seguridad | Formulario vía función de servidor, Zod, Turnstile, RLS + `check`, cabeceras HTTP, secretos en Vercel |
| VI. Testing | Vitest (unit + integración), Playwright (e2e + axe), CI bloqueante |
| VII. Simplicidad | Sin framework de UI (solo Astro); rate limit en memoria; sin CMS |
| VIII. Spec antes que código | Este plan + `tasks.md`; efectos WebGL quedan para ODD en v1.1 |
| IX. Bilingüe | Textos en `src/i18n/es.json` y `en.json`; rutas `/` y `/en/` |
| X. Privacidad | Solo 5 campos en el formulario, aviso de uso, sin trackers (Vercel Analytics opcional) |

**Cambio 2026-10-30:** el plan original fijaba Astro 5, pero esa rama tiene vulnerabilidades críticas sin parche (corregidas en `astro >7.3.1`) y `npm audit --audit-level=high` falla. Se migra a Astro 7.4.4 + `@astrojs/vercel` 11. Dependencias transitivas de `@astrojs/vercel` corregidas con `overrides` en `package.json`: `path-to-regexp` 6.3.0 y `zod` 4.6.7 (mismo major), y `glob` 14.0.3 → `minimatch` 11.0.3 dentro de `@vercel/nft` (salto de major: `nft` pide `^13`, sin parche en esa rama). Verificado que el rastreo de `nft` y el empaquetado de funciones salen idénticos con `glob` 13 y 14. `npm audit` queda en 0. Cada override se elimina cuando el paquete que lo trae publique la versión corregida.

**Cambio 2026-11-01:** TypeScript 5.9.3 → **6.0.3** (la más reciente que admite `@astrojs/check` 0.9.12, cuyo peer es `^5 || ^6`; TypeScript 7 queda bloqueado en Dependabot hasta que lo admita). Node **26** (LTS más reciente y la predeterminada en Vercel) en CI, `engines` de `package.json` y `@types/node` 26, para que local, CI y Vercel usen la misma versión.

**Excepción justificada:** el rate limit en memoria se reinicia entre instancias de la función. Se acepta en v1 porque Turnstile es la defensa principal y el tráfico esperado es bajo.

## 2. Stack

- **Astro 7** + `@astrojs/vercel` (todo prerenderizado salvo `/api/contact`, con `export const prerender = false`)
- **Tailwind CSS 4**
- **GSAP** (core, ScrollTrigger, SplitText) + **Lenis**
- **Supabase** (solo tabla `leads`)
- **Zod** (`astro/zod`), **Cloudflare Turnstile**
- Fuentes `@fontsource`: Space Grotesk, Monaspace Krypton
- Testing: **Vitest**, **Playwright**, **@axe-core/playwright**, **Lighthouse CI**
- Calidad: TypeScript estricto, `astro check`, GitHub Actions, Dependabot

## 3. Estructura

```
docs/
  constitution.md
  specs/001-portafolio/  spec.md, plan.md, tasks.md
src/
  components/      Nav, Footer, ThemeSwitcher, ProjectList, ProjectGrid, ContactForm, ...
  content/projects/  001-restaurante.md, 002-tienda.md, ...
  content.config.ts
  i18n/            es.json, en.json, utils.ts
  layouts/         BaseLayout.astro
  lib/             animations.ts, clock.ts, contact-schema.ts, rate-limit.ts, supabase.ts, turnstile.ts
  pages/           index.astro, gracias.astro, 404.astro, proyectos/[slug].astro, en/...
    api/contact.ts
  styles/global.css
tests/
  unit/  integration/  e2e/
.github/workflows/ci.yml
.github/dependabot.yml
.env.example
vercel.json
CLAUDE.md          → instrucciones para el agente (apunta a docs/)
```

## 4. Temas

Variables CSS en `global.css` por `[data-theme="carbon|naranja"]` con `--bg`, `--surface`, `--fg`, `--accent`, `--on-accent`, `--muted`, `--line`. Tailwind 4 las expone con `@theme`.

**Contraste:** el acento puede ir como texto solo sobre `--bg` (Naranja sobre Carbón 4.65:1; sobre `--surface` no llega a AA). `--on-accent` es el texto sobre un relleno de acento. `--line` es decorativo. `tests/unit/themes.test.ts` verifica los ratios.

**Cambio 2026-11-01:** se retiran los temas Petróleo y Militar a petición del cliente; con dos temas, `--accent-ink` era idéntico a `--accent` en ambos y se elimina.

Un script inline mínimo en `<head>` aplica el tema guardado antes del primer pintado (evita parpadeo); acceso a `localStorage` dentro de try/catch.

## 5. Contenido de proyectos

Content Collection `projects` (`src/content.config.ts`, esquema en `src/lib/project-schema.ts`). Un archivo por proyecto e idioma en `src/content/projects/{es,en}/<número>-<nombre>.md`; el slug es el nombre del archivo, igual en ambos idiomas. Portadas en `src/assets/projects/<slug>/`.

```ts
{
  title: string; number: string /* 3 dígitos */; type: 'landing'|'negocio'|'iglesia'|'tienda'|'app';
  year: number; status: 'publicado'|'en-progreso'|'por-construir';
  origin: 'propio'|'cliente'; stack: string[];
  cover: image(); coverAlt: string; gallery: { src: image(); alt: string }[];
  liveUrl?: url; repoUrl?: url; summary: string; lang: 'es'|'en'; draft: boolean /* false */;
}
```

**Cambio 2026-11-01 (T11):** `status` admite `por-construir` (estado de 001–003 en la spec §8). `origin` distingue proyectos propios de encargos reales (PRODUCT.md: no se inventan clientes). `coverAlt` y el `alt` de cada imagen de galería cumplen la constitución III. `draft: true` oculta un proyecto de listados y páginas: el 004 queda como borrador con título genérico hasta que el cliente autorice mostrarlo. Hasta T30 las portadas son provisionales, generadas con ImageMagick en el estilo de `DESIGN.md`.

## 6. Animaciones

`src/lib/animations.ts` exporta `initAnimations()`, llamado en `astro:page-load`, y `destroyAnimations()` en `astro:before-swap`. Si `matchMedia('(prefers-reduced-motion: reduce)')` coincide, retorna sin hacer nada. Lenis se sincroniza con ScrollTrigger vía `gsap.ticker`. Cursor y magnetismo solo con `(hover: hover) and (pointer: fine)`.

## 7. Contacto

Flujo: navegador → `POST /api/contact` → Turnstile → Zod → rate limit → Supabase.

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  project_type text check (project_type in ('landing','negocio','iglesia','tienda','app','otro')),
  budget text check (char_length(budget) <= 40),
  message text not null check (char_length(message) between 10 and 2000),
  lang text not null default 'es' check (lang in ('es','en'))
);
alter table leads enable row level security;
create policy "anon solo inserta" on leads for insert to anon with check (true);
```

Respuestas del endpoint: `200` éxito (o honeypot lleno, sin guardar) · `400` validación · `403` Turnstile fallido · `405` método · `413` cuerpo > 10 KB · `429` límite (5 / 10 min por IP) · `500` genérico. Con `Accept: text/html` redirige a `/gracias` o vuelve con error; con JSON responde JSON.

Variables (en Vercel, nunca `PUBLIC_` salvo la site key): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`.

## 8. Cabeceras (`vercel.json`)

`Content-Security-Policy` (self + `challenges.cloudflare.com`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `X-Frame-Options: DENY`.

## 9. Estrategia de testing

| Nivel | Qué |
|---|---|
| Estático | `astro check`, TS estricto |
| Unitario | `contact-schema`, `i18n/utils`, `clock`, `rate-limit` |
| Integración | Handler de `/api/contact` con Supabase y Turnstile simulados: 200, 400, 403, 405, 413, 429, honeypot |
| E2E | 1) inicio carga · 2) tema persiste · 3) lista/cuadrícula · 4) caso de estudio y volver · 5) ES↔EN · 6) formulario (API simulada) · 7) reduced motion · 8) sin JS · 9) solo teclado |
| Accesibilidad | axe en inicio y caso de estudio × 2 temas |
| Rendimiento | Lighthouse CI sobre el preview de Vercel |

CI (`ci.yml`): `npm ci` → `astro check` → `vitest run` → `astro build` → `playwright test` → `npm audit --audit-level=high`.

**Checklist manual antes de lanzar:** Android real con datos móviles, envío real a `leads`, securityheaders.com nota A, Security Advisor de Supabase sin alertas, vista previa en WhatsApp.

## 10. SEO

`<title>` y description por página e idioma, `hreflang`, Open Graph 1200×630, `@astrojs/sitemap`, `robots.txt`, JSON-LD `Person` + `ProfessionalService`, favicon.
