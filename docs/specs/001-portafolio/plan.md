# Plan técnico 001 — Portafolio [A]nkordev v1

> Cómo se construye lo definido en `spec.md`. Debe cumplir `docs/constitution.md`.

---

## 1. Chequeo de constitución

| Principio | Cómo se cumple |
|---|---|
| I. Contenido primero | Astro genera HTML estático; animaciones con JS solo como capa; formulario funciona con POST nativo |
| II. Movimiento con propósito | GSAP sobre `transform`/`opacity`; `filter: blur()` solo en la entrada de titulares y textos cortos (≤ 0,6 s, ≤ 8 px; constitución 1.1.0); fondo ambiental WebGL solo en escritorio con puntero fino, pausado con la pestaña oculta y con contraste AA verificado (constitución 1.2.0); todo se desactiva con `prefers-reduced-motion` |
| III. Accesibilidad | HTML semántico, contraste verificado por tema, axe en CI |
| IV. Rendimiento | Salida estática, fuentes self-hosted, `astro:assets` para imágenes, GSAP solo donde se usa, Lighthouse CI. El fondo WebGL no se descarga en móvil: allí el fondo es CSS estático (0 KB de JS) |
| V. Seguridad | Formulario vía función de servidor, Zod, Turnstile, RLS + `check`, cabeceras HTTP (§8), secretos en Vercel, cadena de suministro protegida (`.npmrc`, Actions por SHA) |
| VI. Testing | Vitest (unit + integración), Playwright (e2e + axe), CI bloqueante |
| VII. Simplicidad | Sin framework de UI salvo la isla del fondo (ver excepción); rate limit en memoria; sin CMS |
| VIII. Spec antes que código | Este plan + `tasks.md`; efectos WebGL quedan para ODD en v1.1, salvo el fondo (§6.1) |
| IX. Bilingüe | Textos en `src/i18n/es.json` y `en.json`; rutas `/` y `/en/` |
| X. Privacidad | Solo 5 campos en el formulario, aviso de uso, sin trackers (Vercel Analytics opcional). El fondo no hace peticiones a terceros (ni descarga mapas de iluminación) |

**Cambio 2026-10-30:** el plan original fijaba Astro 5, pero esa rama tiene vulnerabilidades críticas sin parche (corregidas en `astro >7.3.1`) y `npm audit --audit-level=high` falla. Se migra a Astro 7.4.4 + `@astrojs/vercel` 11. Dependencias transitivas de `@astrojs/vercel` corregidas con `overrides` en `package.json`: `path-to-regexp` 6.3.0 y `zod` 4.6.7 (mismo major), y `glob` 14.0.3 → `minimatch` 11.0.3 dentro de `@vercel/nft` (salto de major: `nft` pide `^13`, sin parche en esa rama). Verificado que el rastreo de `nft` y el empaquetado de funciones salen idénticos con `glob` 13 y 14. `npm audit` queda en 0. Cada override se elimina cuando el paquete que lo trae publique la versión corregida.

**Cambio 2026-11-01:** TypeScript 5.9.3 → **6.0.3** (la más reciente que admite `@astrojs/check` 0.9.12, cuyo peer es `^5 || ^6`; TypeScript 7 queda bloqueado en Dependabot hasta que lo admita). Node **26** (LTS más reciente y la predeterminada en Vercel) en CI, `engines` de `package.json` y `@types/node` 26, para que local, CI y Vercel usen la misma versión.

**Excepción justificada (VII):** el fondo usa la librería oficial **ShaderGradient** (React + three.js + React Three Fiber, ~300 KB gzip) para reproducir el aspecto y los presets de shadergradient.co, decisión del cliente. Queda aislada en una sola isla de React que solo se descarga en escritorio con puntero fino y sin reduced-motion; el resto del sitio sigue sin framework de UI.

**Excepción justificada:** el rate limit en memoria se reinicia entre instancias de la función. Se acepta en v1 porque Turnstile es la defensa principal y el tráfico esperado es bajo.

## 2. Stack

- **Astro 7** + `@astrojs/vercel` (todo prerenderizado salvo `/api/contact`, con `export const prerender = false`)
- **Tailwind CSS 4**
- **GSAP** (core, ScrollTrigger, SplitText, ScrambleText) + **Lenis**
- Fondo (solo escritorio): **@shadergradient/react** + **three** + **@react-three/fiber** + **React 19** vía **@astrojs/react** (§6.1)
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

Variables CSS en `global.css` por `[data-theme="oscuro|claro"]` con `--bg`, `--surface`, `--fg`, `--accent`, `--on-accent`, `--muted`, `--line`, más `--grad-1/2/3` y `--grain-opacity` para el fondo (§6.1). Tailwind 4 las expone con `@theme`.

**Contraste:** el acento puede ir como texto solo sobre `--bg` (naranja sobre el fondo oscuro 4.65:1; sobre `--surface` no llega a AA). En el claro, `--muted` y `--accent` son tinta: también van sobre el naranja del gradiente, donde el gris y un relleno naranja se perderían. `--on-accent` es el texto sobre un relleno de acento. `--line` es decorativo. `tests/unit/themes.test.ts` verifica los ratios.

**Cambio 2026-11-01:** se retiran los temas Petróleo y Militar a petición del cliente; con dos temas, `--accent-ink` era idéntico a `--accent` en ambos y se elimina.

**Cambio 2026-11-01 (T20c):** a petición del cliente, Carbón y Naranja pasan a ser `oscuro` (por defecto) y `claro`, y las muestras de color se sustituyen por un interruptor claro/oscuro: dos botones con icono de sol y luna, nombre accesible y `aria-pressed`, con el mismo lenguaje que el control de vista (borde de 1 px, activo invertido). Quien tuviera guardado un tema antiguo vuelve al oscuro (`isTheme` lo descarta).

Un script inline mínimo en `<head>` aplica el tema guardado antes del primer pintado (evita parpadeo); acceso a `localStorage` dentro de try/catch.

**Oscurecimiento ajeno (2026-11-01):** el sitio ya tiene tema oscuro, así que se excluye de quien oscurece páginas por su cuenta. `<meta name="darkreader-lock">` desactiva Dark Reader: sin ella, al recargar en claro aplicaba su tema (fondo gris, gradiente borrado) y seguía activo al volver al oscuro, con solo la retícula visible. El claro declara `color-scheme: only light`, la exclusión documentada del oscurecimiento automático de Chromium (flag *force-dark* en Brave y Chrome); en pruebas con ese flag funciona cuando el sistema prefiere oscuro, el caso habitual de quien lo activa.

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

### 6.1 Fondo de gradiente (constitución II 1.2.0)

- **Base para todos:** capa fija `.gradient-bg` (`z-index: -1`) con un gradiente estático en CSS en los colores del tema activo; la retícula y el contenido van encima. Es lo que ven móvil, reduced-motion, navegadores sin WebGL y visitantes sin JS. Va en una capa propia y no en el fondo de `<html>` porque el navegador no aplica mezclas al fondo del elemento raíz. Mide `100lvh` (el viewport con la barra del navegador oculta) en lugar de `inset: 0`: en móvil, al ocultarse la barra al hacer scroll, una capa de alto visible no crecía hasta acabar el gesto, dejaba una franja abajo y el gradiente se recolocaba de golpe.
- **Grano:** ruido SVG (`feTurbulence`) en un `::after` de la misma capa, en mezcla `soft-light`, encima del gradiente estático y del animado. Es el mismo en móvil y escritorio. El grano propio de ShaderGradient se descartó: alteraba el color y dejaba motas negras puras. En el oscuro va al 75 % (`--grain-opacity`): `soft-light` aclara la media de los tonos oscuros y al 100 % el texto secundario no llegaba a AA.
- **Escritorio:** isla React `GradientBackground` con `client:media="(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)"`: su JS solo se descarga si se cumple la condición. Renderiza `ShaderGradientCanvas` fijo detrás del contenido (`z-index: -1`), con `transition:persist` para no reiniciarse al navegar.
- **Iluminación:** `lightType="3d"`, con brillo por tema (`GRADIENT_BRIGHTNESS`). La luz de entorno (`env` con HDR) se descartó porque tiñe la paleta: `city` llevaba el oscuro al marrón y `lobby` amarilleaba el blanco. Con luz 3d el shader respeta los colores, que son los mismos del gradiente estático, y no se descarga ningún mapa de iluminación (~3 MB menos). Presupuesto en escritorio: ~350 KB gzip de JS (React, three, ShaderGradient). Ninguna petición a terceros.
- **Comportamiento:** `src/lib/gradient.ts` define colores (`GRADIENT_COLORS`, iguales a `--grad-1/2/3`), brillo y forma (`GRADIENT_SHAPE`); el fondo cambia de colores con el tema, se pausa con la pestaña oculta, se desmonta si el visitante activa reduced-motion, y un error de WebGL deja el gradiente estático. Los oscuros son azules saturados: los grises neutros salían marrones al iluminarse.
- **Contraste:** los colores se eligen para que el texto cumpla AA sobre cualquier punto del fondo, grano incluido: en el oscuro, luminancia ≤ 0,063 (`--muted` a 4,5:1); en el claro, ≥ 0,236 (tinta a 4,5:1). Un e2e mide los píxeles reales del canvas en escritorio y del fondo estático en móvil, en ambos temas, tras un desenfoque leve que promedia el grano como lo hace el ojo.
- **CSP:** las islas añaden dos scripts y un estilo en línea de Astro; sus hashes van en `vercel.json` (`style-src` incluido) y un e2e verifica cada script y estilo en línea.
- **three.js 0.186.1:** ShaderGradient 2.4.x usa el chunk `cube_uv_reflection_fragment`, que three quitó en 0.187.0. Dependabot no propone three ≥ 0.187 hasta que ShaderGradient lo soporte.
- **Tests:** el proyecto `desktop` de Playwright corre sin WebGL (prueba el fondo estático y no satura la CPU); `desktop-webgl` usa SwiftShader, el mismo renderizador en local y en CI, para medir el contraste en píxeles de forma reproducible.

**Cambio 2026-11-01:** se añade el fondo de gradiente (spec §6) a petición del cliente, con la enmienda 1.2.0 de la constitución.

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

`Content-Security-Policy` (self + `challenges.cloudflare.com`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (todos los permisos de hardware, pago y seguimiento desactivados), `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `X-Permitted-Cross-Domain-Policies: none`.

**Hardening 2026-11-01 (T09b):**
- **CSP:** sin `unsafe-*`; `base-uri 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`. No se activa Trusted Types: el router de Astro (View Transitions) usa `DOMParser` y lo rompería, y el sitio no inserta HTML no confiable (ni `innerHTML` ni `set:html`).
- **Permissions-Policy:** solo nombres que Chromium y Brave reconocen (uno desconocido genera un aviso en consola): fuera `web-share` (no existe en Chromium para Linux), `browsing-topics` y `otp-credentials` (Brave no los tiene; sin scripts de terceros no protegían nada). No se tocan los permisos de *private state tokens*, que podría usar Turnstile.
- **COOP y CORP `same-origin`:** aíslan la ventana y los recursos del sitio de otros orígenes. Sin COEP: rompería el iframe de Turnstile. Cuando T32 añada la imagen OG, su ruta lleva `Cross-Origin-Resource-Policy: cross-origin` para que las vistas previas la carguen.
- **`/.well-known/security.txt` (RFC 9116) y `SECURITY.md`:** los reportes van al *private vulnerability reporting* de GitHub. `Expires` dura menos de un año: un e2e falla al caducar y hay que renovarlo. Con dominio propio, cambiar `Canonical`.
- **Cadena de suministro (`.npmrc`):** `ignore-scripts=true` (ninguna dependencia ejecuta código al instalarse; hoy ninguna lo necesita en Linux), `min-release-age=7` (solo versiones con 7 días publicadas; parche urgente con `--min-release-age=0`) y dependencias solo desde el registro (`allow-git/remote/file/directory=none`). Dependabot espera lo mismo (`cooldown: 7`), salvo en actualizaciones de seguridad.
- **CI:** Actions fijadas por SHA de commit (Dependabot las actualiza), `persist-credentials: false` y permisos de solo lectura.
- **GitHub:** alertas y actualizaciones de seguridad de Dependabot, escaneo de secretos con *push protection*, reporte privado de vulnerabilidades, regla «Proteger main» (sin borrado ni force push) y wiki desactivada.
- Los e2e de `security.spec.ts` aplican todas las cabeceras de `vercel.json` a una visita normal y fallan con cualquier error o aviso de `Permissions-Policy`; también vigilan `.npmrc`, el `security.txt` y el fijado por SHA.

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
