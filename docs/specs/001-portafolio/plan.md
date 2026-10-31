# Plan técnico 001 — Portafolio {{MARCA}} v1

> Cómo se construye lo definido en `spec.md`. Debe cumplir `docs/constitution.md`.

---

## 1. Chequeo de constitución

| Principio | Cómo se cumple |
|---|---|
| I. Contenido primero | Astro genera HTML estático; animaciones con JS solo como capa; formulario funciona con POST nativo |
| II. Movimiento con propósito | GSAP sobre `transform`/`opacity`; todo se desactiva con `prefers-reduced-motion` |
| III. Accesibilidad | HTML semántico, contraste verificado por tema, axe en CI |
| IV. Rendimiento | Salida estática, fuentes self-hosted, `astro:assets` para imágenes, GSAP solo donde se usa, Lighthouse CI |
| V. Seguridad | Formulario vía función de servidor, Zod, Turnstile, RLS + `check`, cabeceras HTTP, secretos en Vercel |
| VI. Testing | Vitest (unit + integración), Playwright (e2e + axe), CI bloqueante |
| VII. Simplicidad | Sin framework de UI (solo Astro); rate limit en memoria; sin CMS |
| VIII. Spec antes que código | Este plan + `tasks.md`; efectos WebGL quedan para ODD en v1.1 |
| IX. Bilingüe | Textos en `src/i18n/es.json` y `en.json`; rutas `/` y `/en/` |
| X. Privacidad | Solo 5 campos en el formulario, aviso de uso, sin trackers (Vercel Analytics opcional) |

**Excepción justificada:** el rate limit en memoria se reinicia entre instancias de la función. Se acepta en v1 porque Turnstile es la defensa principal y el tráfico esperado es bajo.

## 2. Stack

- **Astro 5** + `@astrojs/vercel` (todo prerenderizado salvo `/api/contact`, con `export const prerender = false`)
- **Tailwind CSS 4**
- **GSAP** (core, ScrollTrigger, SplitText) + **Lenis**
- **Supabase** (solo tabla `leads`)
- **Zod** (`astro/zod`), **Cloudflare Turnstile**
- Fuentes `@fontsource`: Space Grotesk, JetBrains Mono
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

Variables CSS en `global.css` por `[data-theme="carbon|naranja|petroleo|militar"]` con `--bg`, `--surface`, `--fg`, `--accent`, `--accent-ink`, `--on-accent`, `--muted`, `--line`. Tailwind 4 las expone con `@theme`.

**Contraste (decisión 2026-10-30):** el acento `#F2711C` no alcanza AA como texto sobre Petróleo (1.93:1) ni Militar (1.98:1). Se mantiene la paleta de la spec y el acento se usa solo como relleno o decoración. Tokens extra: `--accent-ink` (texto con color de acento, solo sobre `--bg`; en Petróleo y Militar = `--fg`) y `--on-accent` (texto sobre relleno de acento). `--line` es decorativo. `tests/unit/themes.test.ts` verifica los ratios.

Un script inline mínimo en `<head>` aplica el tema guardado antes del primer pintado (evita parpadeo); acceso a `localStorage` dentro de try/catch.

## 5. Contenido de proyectos

Content Collection `projects` (`src/content.config.ts`):

```ts
{
  title: string; number: string; type: 'landing'|'negocio'|'iglesia'|'tienda'|'app';
  year: number; status: 'publicado'|'en-progreso'; stack: string[];
  cover: image(); gallery: image()[]; liveUrl?: string; repoUrl?: string;
  summary: string; lang: 'es'|'en';
}
```

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
| Accesibilidad | axe en inicio y caso de estudio × 4 temas |
| Rendimiento | Lighthouse CI sobre el preview de Vercel |

CI (`ci.yml`): `npm ci` → `astro check` → `vitest run` → `astro build` → `playwright test` → `npm audit --audit-level=high`.

**Checklist manual antes de lanzar:** Android real con datos móviles, envío real a `leads`, securityheaders.com nota A, Security Advisor de Supabase sin alertas, vista previa en WhatsApp.

## 10. SEO

`<title>` y description por página e idioma, `hreflang`, Open Graph 1200×630, `@astrojs/sitemap`, `robots.txt`, JSON-LD `Person` + `ProfessionalService`, favicon.
