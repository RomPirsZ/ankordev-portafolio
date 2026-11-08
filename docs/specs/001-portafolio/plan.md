# Plan técnico 001 — Portafolio [A]nkordev v1

> Cómo se construye lo definido en `spec.md`. Debe cumplir `docs/constitution.md`.

---

## 1. Chequeo de constitución

| Principio | Cómo se cumple |
|---|---|
| I. Contenido primero | Astro genera HTML estático; animaciones con JS solo como capa. Contactar no depende de JS: WhatsApp y email son enlaces. El formulario sí lo necesita (Turnstile), así que sin JS no se ofrece y remite a ellos (T25) |
| II. Movimiento con propósito | GSAP sobre `transform`/`opacity`; `filter: blur()` solo en la entrada de titulares y textos cortos (≤ 0,6 s, ≤ 8 px; constitución 1.1.0); fondo ambiental WebGL solo en escritorio con puntero fino, pausado con la pestaña oculta y con contraste AA verificado (constitución 1.2.0); todo se desactiva con `prefers-reduced-motion` |
| III. Accesibilidad | HTML semántico, contraste verificado por tema, axe en CI |
| IV. Rendimiento | Salida estática, fuentes self-hosted, `astro:assets` para imágenes, GSAP solo donde se usa, Lighthouse CI. El fondo WebGL no se descarga en móvil: allí el fondo es CSS estático (0 KB de JS) |
| V. Seguridad | Formulario vía función de servidor, Zod, Turnstile, RLS + `check`, cabeceras HTTP (§8), secretos en Cloudflare, cadena de suministro protegida (`.npmrc`, Actions por SHA) |
| VI. Testing | Vitest (unit + integración), Playwright (e2e + axe), CI bloqueante |
| VII. Simplicidad | Sin framework de UI salvo la isla del fondo (ver excepción); rate limit en memoria; sin CMS |
| VIII. Spec antes que código | Este plan + `tasks.md`; efectos WebGL quedan para ODD en v1.1, salvo el fondo (§6.1) |
| IX. Bilingüe | Textos en `src/i18n/es.json` y `en.json`; rutas `/` y `/en/` |
| X. Privacidad | Solo 5 campos en el formulario, aviso de uso, sin trackers (si algún día hay analítica, sin cookies y decidida aparte). El fondo no hace peticiones a terceros (ni descarga mapas de iluminación) |

**Cambio 2026-10-30:** el plan original fijaba Astro 5, pero esa rama tiene vulnerabilidades críticas sin parche (corregidas en `astro >7.3.1`) y `npm audit --audit-level=high` falla. Se migra a Astro 7.4.4 + `@astrojs/vercel` 11. Dependencias transitivas de `@astrojs/vercel` corregidas con `overrides` en `package.json`: `path-to-regexp` 6.3.0 y `zod` 4.6.7 (mismo major), y `glob` 14.0.3 → `minimatch` 11.0.3 dentro de `@vercel/nft` (salto de major: `nft` pide `^13`, sin parche en esa rama). Verificado que el rastreo de `nft` y el empaquetado de funciones salen idénticos con `glob` 13 y 14. `npm audit` queda en 0. Cada override se elimina cuando el paquete que lo trae publique la versión corregida.

**Cambio 2026-11-01:** TypeScript 5.9.3 → **6.0.3** (la más reciente que admite `@astrojs/check` 0.9.12, cuyo peer es `^5 || ^6`; TypeScript 7 queda bloqueado en Dependabot hasta que lo admita). Node **26** (LTS más reciente y la predeterminada en Vercel) en CI, `engines` de `package.json` y `@types/node` 26, para que local, CI y Vercel usen la misma versión.

**Cambio 2026-11-06 (T09c): de Vercel a Cloudflare Workers.** Vercel Hobby no admite uso comercial, y anunciar servicios lo es. Workers Free sí lo admite: el acuerdo de Cloudflare (12-sep-2025) y las condiciones de Developer Platform (28-sep-2026) no lo limitan, revisados el 2026-11-06. Límites del plan gratuito: 100 000 peticiones al día a código de servidor, 10 ms de CPU por petición (la espera de red no cuenta) y archivos estáticos gratis e ilimitados.
- **Adaptador:** `@astrojs/cloudflare` 14.4.3 + `wrangler` 4.154.0 (dev), la versión exacta que fija `@cloudflare/vite-plugin`, así hay un solo wrangler en el árbol. Dependabot no propone wrangler: se alinea a mano al actualizar el adaptador, y `tests/unit/dependencies.test.ts` falla si las versiones se separan. Salen `@astrojs/vercel` y sus 3 `overrides`, y `npm audit` sigue en 0. Los scripts de instalación de `workerd` y `esbuild` no hacen falta con `ignore-scripts`: el binario llega como dependencia opcional por plataforma.
- **`astro.config.mjs`:** `imageService: 'compile'` (sharp en el build, como antes, sin el servicio de pago Cloudflare Images; las 21 imágenes salen idénticas) y `session: false` (sin KV de sesiones, que el sitio no usa). Las páginas se prerenderizan en workerd.
- **`wrangler.jsonc`:** nombre, `compatibility_date` fija y `assets.not_found_handling: "404-page"`. Sin ella, una ruta inexistente daría un 404 vacío. Desde T24 hay Worker por `/api/contact`: lo estático lo sigue sirviendo Cloudflare sin invocarlo, y solo llegan al Worker la API y las rutas inexistentes (Astro las responde con el `404.html` de los assets, con sus cabeceras). `observability` guarda sus logs 3 días (Workers Logs).
- **Cabeceras:** pasan de `vercel.json` a `public/_headers` (§8).
- **Node 26** en `.node-version`: lo leen Workers Builds (su versión por defecto es la 24) y la CI.
- **Vitest** usa su propia config (`vitest/config`): `getViteConfig` de Astro cargaba el adaptador, que intentaba levantar el Worker dentro de Vitest.
- **`astro preview`** corre ahora en workerd y aplica `_headers` igual que producción. Los e2e ya no inyectan las cabeceras: comprueban las que el servidor envía de verdad, y todo el e2e corre bajo la CSP real.
- **Despliegue:** Workers Builds conectado al repositorio, con build `npm run build` y deploy `npx wrangler deploy`. Las ramas que no son `main` suben versiones con URL de preview. Producción: **https://ankordev-portafolio.ankordev.workers.dev** (subdominio de cuenta `ankordev`). `workers_dev` y `preview_urls` quedan fijados en `wrangler.jsonc`. Verificado el 2026-11-06: cabeceras de `_headers` en páginas, assets y 404, y caché inmutable en `/_astro/*`.

**Excepción justificada (VII):** el fondo usa la librería oficial **ShaderGradient** (React + three.js + React Three Fiber, ~300 KB gzip) para reproducir el aspecto y los presets de shadergradient.co, decisión del cliente. Queda aislada en una sola isla de React que solo se descarga en escritorio con puntero fino y sin reduced-motion; el resto del sitio sigue sin framework de UI.

**Excepción justificada:** el rate limit en memoria se reinicia entre instancias (isolates) del Worker. Se acepta en v1 porque Turnstile es la defensa principal y el tráfico esperado es bajo.

## 2. Stack

- **Astro 7** + `@astrojs/cloudflare` en **Cloudflare Workers** (todo prerenderizado salvo `/api/contact`, con `export const prerender = false`)
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
supabase/leads.sql   → esquema de la tabla de contactos (§7)
.github/workflows/ci.yml
.github/dependabot.yml
.env.example
wrangler.jsonc     → Cloudflare Workers (§1, T09c)
public/_headers    → cabeceras de seguridad (§8)
.node-version      → Node 26 para CI y Workers Builds
CLAUDE.md          → instrucciones para el agente (apunta a docs/)
```

## 4. Temas

Variables CSS en `global.css` por `[data-theme="oscuro|claro"]` con `--bg`, `--surface`, `--fg`, `--accent`, `--on-accent`, `--muted`, `--code`, `--line`, más `--grad-1/2/3` y `--grain-opacity` para el fondo (§6.1). Tailwind 4 las expone con `@theme`.

**Contraste:** `--fg`, `--muted` y `--code` son texto y cumplen AA sobre `--bg`, `--surface` y cada color del gradiente. `--accent` (coral) es relleno, no texto: sobre el coral claro del fondo no llega a AA. `--on-accent` es el texto sobre un relleno de acento. `--line` es decorativo. `tests/unit/themes.test.ts` y `gradient.test.ts` verifican los ratios.

**Cambio 2026-11-06 (T11b):** paleta de marca «Terminal cálida» (spec §6) en lugar de la provisional. Nuevo rol `--code` (turquesa) para las etiquetas de laboratorio y el «_» del logotipo. En el claro, `--muted` y `--accent` dejan de ser tinta: el coral claro del fondo deja sitio a un gris cálido y a un relleno coral hondo. Ese mismo día, a petición del cliente, el gradiente oscuro pasa a solo carbón y turquesa (la luz 3d volvía brasa los carbones cálidos y la extrapolación del shader sacaba un granate) y el del claro sube a un coral visible; para que el texto siga en AA, `--muted` y `--code` se aclaran en el oscuro y se ahondan en el claro.

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
- **Comportamiento:** `src/lib/gradient.ts` define colores (`GRADIENT_COLORS`, iguales a `--grad-1/2/3`), brillo y forma (`GRADIENT_SHAPE`); el fondo cambia de colores con el tema, se pausa con la pestaña oculta, se desmonta si el visitante activa reduced-motion, y un error de WebGL deja el gradiente estático. El oscuro es solo carbón y turquesa: el shader mezcla `color3` (centro) con la base por distancia y extrapola lejos del centro, así que el centro es carbón neutro y el turquesa va en `color2` (con el turquesa en el centro salía su opuesto, un granate).
- **Contraste:** los colores se eligen para que todo el texto (`--fg`, `--muted`, `--code`) cumpla AA sobre cualquier punto del fondo, grano incluido. `tests/e2e/contrast.ts` saca los umbrales de esos colores: hoy, en el oscuro, luminancia ≤ 0,068 (`--muted` a 4,5:1); en el claro, ≥ 0,482 (`--muted` a 4,5:1). Un e2e mide los píxeles reales del canvas en escritorio y del fondo estático en móvil, en ambos temas, tras un desenfoque leve que promedia el grano como lo hace el ojo.
- **CSP:** las islas añaden dos scripts y un estilo en línea de Astro; sus hashes van en `public/_headers` (`style-src` incluido) y un e2e verifica cada script y estilo en línea.
- **three.js 0.186.1:** ShaderGradient 2.4.x usa el chunk `cube_uv_reflection_fragment`, que three quitó en 0.187.0. Dependabot no propone three ≥ 0.187 hasta que ShaderGradient lo soporte.
- **Tests:** el proyecto `desktop` de Playwright corre sin WebGL (prueba el fondo estático y no satura la CPU); `desktop-webgl` usa SwiftShader, el mismo renderizador en local y en CI, para medir el contraste en píxeles de forma reproducible.

**Cambio 2026-11-01:** se añade el fondo de gradiente (spec §6) a petición del cliente, con la enmienda 1.2.0 de la constitución.

## 7. Contacto

Flujo: navegador → `POST /api/contact` → Turnstile → Zod → rate limit → Supabase → aviso por email.

**Aviso por email (T23b, cambio 2026-11-02).**
- `src/lib/notify.ts` envía cada contacto guardado al email del dueño, con Resend: una petición `fetch`, sin SDK.
- El `reply_to` es el email de quien escribió, así que al responder se le escribe directamente.
- El email va en texto plano, sin HTML, y el asunto en una sola línea: lo que escribe el visitante no puede inyectar nada.
- Es *best effort*: si Resend falla, el contacto ya está en la tabla, el visitante recibe igualmente el 200 y el fallo va a los logs.
- Sin dominio propio verificado, Resend envía desde `onboarding@resend.dev` y solo entrega en el email de la cuenta, que es justo el destinatario. Con dominio propio basta cambiar `from`.
- Plan gratuito: 100 emails al día, 3000 al mes.
- El aviso de privacidad (T25) dirá que el mensaje se guarda en Supabase y se reenvía por email con Resend (constitución X).

Tabla `leads` en `supabase/leads.sql`, la fuente única del esquema: columnas con `check` de longitud y formato, RLS y la política «anon solo inserta». Un test unitario comprueba que `contact-schema.ts` acepta lo mismo que esos `check`.

**Cambio 2026-11-02 (T21):**
- **Grants explícitos.** Desde el 30 de mayo de 2026, Supabase ya no expone a su API las tablas nuevas de `public` sin un `GRANT`. Por eso el SQL revoca todo a `anon` y `authenticated` y da a `anon` solo `insert`, y solo de las 6 columnas del formulario: `id` y `created_at` los pone siempre la base de datos, así que nadie puede fechar un contacto a su gusto. Desde la API pública nadie lee, edita ni borra contactos, ni aunque falle una política.
- **Security Advisor: sin avisos.** La política de inserción es `with check (true)` a propósito, porque el formulario es público, y está documentada en un `comment on policy`. El lint 0024 la marcaba hasta que el `insert` se limitó a las columnas del formulario. La opción *Enable automatic RLS* del proyecto crea `public.rls_auto_enable()` (`security definer`), que la API podía ejecutar (lints 0028 y 0029). Se le quitó `execute` a `public`, `anon` y `authenticated`, y la activación automática de RLS sigue funcionando al crear tablas.
- **Consecuencias para el endpoint.** Inserta con `Prefer: return=minimal`, porque sin `select` no puede devolver la fila. Usa la clave *publishable* (rol `anon`), nunca la secreta ni `service_role`.
- **`created_at` pasa a `not null`.**
- **Región: East US (North Virginia).** Se eligió junto a `iad1`, la región de las funciones de Vercel. En Workers el código corre en el centro de datos más cercano al visitante y la consulta viaja a Virginia; con un contacto de vez en cuando, no compensa moverla.

**Keep-alive (T21b).** Supabase Free pausa el proyecto tras una semana con poca actividad, y con pocos contactos podría estar pausado justo cuando llega uno.
- `.github/workflows/keepalive.yml` llama los lunes y jueves a `public.ping()`, definida en `supabase/keepalive.sql`: un `select 1` sin acceso a datos, con `security invoker`, que solo puede ejecutar `anon`.
- El workflow no usa Actions de terceros y no tiene permisos sobre el repositorio. Usa la URL y la clave publishable como *secrets* de GitHub.
- Si Supabase no responde, el workflow falla y GitHub avisa por email.
- Límite: GitHub desactiva los workflows programados de un repositorio público tras 60 días sin actividad, y avisa antes. Se reactiva con un push o desde Actions.

Respuestas del endpoint: `200` éxito (o honeypot lleno, sin guardar) · `400` validación · `403` Turnstile fallido · `405` método · `413` cuerpo > 10 KB · `429` límite (5 / 10 min por IP) · `500` genérico. Con `Accept: text/html` redirige a `/gracias` o vuelve con error; con JSON responde JSON.

**Contrato del endpoint (T24, 2026-11-08).**
- **Código:** la lógica está en `src/lib/contact-handler.ts`, que recibe el entorno, el límite de envíos y `fetch` como dependencias. `src/pages/api/contact.ts` solo lo conecta con el Worker y lee los secretos con `import { env } from 'cloudflare:workers'` (tipos mínimos en `src/env.d.ts`, sin `@cloudflare/workers-types`). El guardado está en `src/lib/leads.ts`.
- **Orden:** método → tamaño → lectura del cuerpo → honeypot → Turnstile → Zod → límite de envíos → Supabase → aviso. Los envíos inválidos no gastan cupo del límite. Un token de Turnstile se gasta al verificarlo, así que el formulario debe renovarlo tras cualquier respuesta.
- **Entrada:** `application/x-www-form-urlencoded`, `multipart/form-data` o un objeto JSON. Además de las 6 columnas llegan `cf-turnstile-response` (lo añade el widget) y el honeypot `website`; los nombres están en `src/lib/contact-fields.ts`. La IP sale de `CF-Connecting-IP`, que pone Cloudflare.
- **JSON:** `{ ok: true }` o `{ ok: false, error, fields? }`, con `error` ∈ `invalid` · `verification` · `method` · `too_large` · `rate_limit` · `server`. `fields` lleva el código de cada campo inválido (`required`, `too_short`, `too_long`, `invalid`). El 429 añade `Retry-After` y el 405, `Allow: POST`.
- **POST nativo (`Accept: text/html`):** siempre `303`. Si sale bien (o el honeypot está lleno), a `/gracias/` o `/en/thanks/`. Si hay error, a `/#contacto-error` o `/en/#contact-error`: un aviso genérico junto al formulario que T25 muestra con `:target`, sin JS.
- **Configuración:** sin el secreto de Turnstile o sin los datos de Supabase, `500` y un log de error, no `403`. Si el aviso por email falla, responde igual con éxito y lo deja en los logs.
- **Cabeceras propias:** `Cache-Control: no-store`, CSP `default-src 'none'`, `nosniff`, `X-Frame-Options`, HSTS, `Referrer-Policy` y CORP.
- **Origen:** Astro (`security.checkOrigin`, activo por defecto) rechaza con `403` un formulario enviado desde otro sitio.
- **Logs:** JSON con el evento y códigos, nunca datos del visitante ni su IP.
- **Tamaño:** urlencoded infla cada byte no ASCII (`ñ` ocupa 6). Un mensaje real de 2000 caracteres cabe de sobra, pero T25 usará `enctype="multipart/form-data"`, que envía el texto tal cual.

**Formulario (T25, 2026-11-08).**
- **Sin JS no se ofrece.** Turnstile necesita JS y el endpoint falla cerrado sin token, así que un formulario sin JS siempre fallaría. Nace oculto y, en su lugar, un aviso remite a WhatsApp y email; el script lo muestra y retira el aviso (el patrón del interruptor de tema). No se usa `<noscript>`: el Chromium de Playwright sin JS no lo muestra y no se podría probar. El POST nativo y su 303 se mantienen como red de seguridad.
- **Turnstile al primer foco** en el formulario (`src/lib/turnstile-widget.ts`): una visita normal no hace ninguna petición a Cloudflare (constitución X) ni carga su script (IV). Modo `interaction-only` (invisible salvo que haga falta pulsar algo), `response-field: false` (el token se añade al envío) y `reset` tras cada respuesta, porque el token vale una vez.
- **Validación en el navegador** con `validateContactText` (`src/lib/contact-fields.ts`, sin Zod): las mismas reglas y el mismo orden que el servidor, comprobados caso a caso por un test. Así un envío inválido no gasta el token.
- **Envío** con `fetch` (multipart, `Accept: application/json`) y, si sale bien, `navigate()` a `/gracias/` o `/en/thanks/` (`noindex`). Los errores de campo se pintan con sus códigos y los generales en un `role="alert"`.
- **Site key:** `PUBLIC_TURNSTILE_SITE_KEY` al compilar. En CI, la de prueba de Cloudflare en el paso de build; en producción, la real como variable de build de Workers Builds. Sin ella el widget no puede verificar y el formulario muestra el aviso de verificación.
- **e2e:** `tests/e2e/turnstile-stub.ts` sirve un sustituto local en la URL real del script: los tests no dependen de la red de Cloudflare y la CSP se comprueba igual.

Variables (secretos del Worker con `npx wrangler secret put` o desde el panel; nunca `PUBLIC_` salvo la site key, que va como variable de build de Workers Builds porque se usa al compilar): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, `RESEND_API_KEY` y `CONTACT_NOTIFY_TO`.

**Datos públicos del dueño (cambio 2026-11-07).** `PUBLIC_OWNER_NAME`, `PUBLIC_OWNER_WHATSAPP` y `PUBLIC_OWNER_EMAIL` alimentan «Sobre mí» y Contacto. No son secretos, porque la página los muestra, pero no van en git: así el repositorio puede seguir siendo público sin dejar el teléfono y el email en su historial. Van en `.env` en local y como variables de build de Workers Builds en producción. Se sustituyen al compilar y solo acaban en el HTML, no en el JavaScript del cliente. `src/lib/site.ts` los interpreta con `ownerFromEnv` y `src/lib/owner.ts` es el único que lee `import.meta.env`. Vacíos no se muestran, y así queda el build de CI.

**Claves de Turnstile por entorno.**
- **Producción (Cloudflare):** las claves reales de un mismo widget (recreado el 2026-11-08: se habían mezclado las claves de dos widgets). Su hostname es `ankordev-portafolio.ankordev.workers.dev` (el de Vercel se quitó al borrar ese proyecto, el 2026-11-06).
- **Local y CI:** las claves oficiales de prueba de Cloudflare, que siempre pasan: *site key* `1x00000000000000000000AA` y *secret* `1x0000000000000000000000000000000AA`. Así ninguna clave real está en el disco ni en GitHub, y los e2e no necesitan secretos.

**Configuración en producción (T26, 2026-11-08).** Lo que costó dejarla bien, para no repetirlo:
- **Dos tarjetas «Variables y secretos».** La de **Compilaciones** solo existe durante el build: ahí van las variables públicas `PUBLIC_TURNSTILE_SITE_KEY` y `PUBLIC_OWNER_*`. Los cinco secretos del endpoint (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `CONTACT_NOTIFY_TO`) van en la del **Worker** (Configuración → Variables y secretos, fuera de Compilaciones), siempre de tipo Secreto: los de tipo «Variable» de esa tarjeta se borran en cada `wrangler deploy`.
- **La site key es de build:** cambiarla exige un build nuevo. Un secreto del Worker, en cambio, se aplica al guardarlo.
- **Las dos claves, del mismo widget**, y el widget con el hostname `ankordev-portafolio.ankordev.workers.dev`. Nunca las de prueba en producción: con el secreto de prueba cualquier token pasa.
- **Cómo comprobarlo sin escribir nada:** un POST con un token inventado debe dar `403` (`verification`). Un `500` (`server`) indica que el Worker no ve un secreto válido (`contact.turnstile-misconfigured` en los logs).
- **Verificado:** un envío real desde la web publicada llegó a `leads` y al email (el aviso solo se manda después de guardar).

## 8. Cabeceras (`public/_headers`)

`Content-Security-Policy` (self + `challenges.cloudflare.com`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (todos los permisos de hardware, pago y seguimiento desactivados), `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `X-Permitted-Cross-Domain-Policies: none`.

**Desde T09c (2026-11-06):** las define `public/_headers` en una sola regla `/*`. Cloudflare las aplica a todo lo estático, 404 incluido, y el adaptador añade `Cache-Control: immutable` a `/_astro/*`. **No llegan a las respuestas que genera código de servidor**, así que `/api/contact` (T24) pone las suyas.

**Hardening 2026-11-01 (T09b):**
- **CSP:** sin `unsafe-*`; `base-uri 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`. No se activa Trusted Types: el router de Astro (View Transitions) usa `DOMParser` y lo rompería, y el sitio no inserta HTML no confiable (ni `innerHTML` ni `set:html`).
- **Permissions-Policy:** solo nombres que Chromium y Brave reconocen (uno desconocido genera un aviso en consola): fuera `web-share` (no existe en Chromium para Linux), `browsing-topics` y `otp-credentials` (Brave no los tiene; sin scripts de terceros no protegían nada). No se tocan los permisos de *private state tokens*, que podría usar Turnstile.
- **COOP y CORP `same-origin`:** aíslan la ventana y los recursos del sitio de otros orígenes. Sin COEP: rompería el iframe de Turnstile. Cuando T32 añada la imagen OG, su ruta lleva `Cross-Origin-Resource-Policy: cross-origin` para que las vistas previas la carguen.
- **`/.well-known/security.txt` (RFC 9116) y `SECURITY.md`:** los reportes van al *private vulnerability reporting* de GitHub. `Expires` dura menos de un año: un e2e falla al caducar y hay que renovarlo. Con dominio propio, cambiar `Canonical`.
- **Cadena de suministro (`.npmrc`):** `ignore-scripts=true` (ninguna dependencia ejecuta código al instalarse; hoy ninguna lo necesita en Linux), `min-release-age=7` (solo versiones con 7 días publicadas; parche urgente con `--min-release-age=0`) y dependencias solo desde el registro (`allow-git/remote/file/directory=none`). Dependabot espera lo mismo (`cooldown: 7`), salvo en actualizaciones de seguridad.
- **CI:** Actions fijadas por SHA de commit (Dependabot las actualiza), `persist-credentials: false` y permisos de solo lectura.
- **GitHub:** alertas y actualizaciones de seguridad de Dependabot, escaneo de secretos con *push protection*, reporte privado de vulnerabilidades, regla «Proteger main» (sin borrado ni force push) y wiki desactivada.
- Los e2e de `security.spec.ts` comprueban que el servidor envía cada cabecera de `public/_headers` en páginas, assets, `security.txt` y el 404. También fallan con cualquier error o aviso de `Permissions-Policy` en una visita normal; también vigilan `.npmrc`, el `security.txt` y el fijado por SHA.

## 9. Estrategia de testing

| Nivel | Qué |
|---|---|
| Estático | `astro check`, TS estricto |
| Unitario | `contact-schema` (con su coherencia con `supabase/leads.sql`), `i18n/utils`, `clock`, `rate-limit`, `turnstile`, `notify`, `leads` |
| Integración | Handler de `/api/contact` con Supabase, Turnstile y Resend simulados: 200, 400, 403, 405, 413, 429, 500, honeypot, en JSON y como POST nativo (`tests/integration/contact.test.ts`). Un e2e (`contact-api.spec.ts`) comprueba la ruta en workerd con casos que no llegan a la red |
| E2E | 1) inicio carga · 2) tema persiste · 3) lista/cuadrícula · 4) caso de estudio y volver · 5) ES↔EN · 6) formulario (API simulada) · 7) reduced motion · 8) sin JS · 9) solo teclado |
| Accesibilidad | axe (WCAG 2.2 AA + buenas prácticas) en inicio ES/EN, caso de estudio y 404 × 2 temas × móvil/escritorio; falla con cualquier violación seria o crítica. axe no calcula el contraste sobre el gradiente (lo deja incompleto): lo mide `gradient.spec.ts` en píxeles |
| Rendimiento | Lighthouse CI sobre la URL de preview de Workers Builds |

CI (`ci.yml`): `npm ci` → `astro check` → `vitest run` → `astro build` → `playwright test` → `npm audit --audit-level=high`.

**Checklist manual antes de lanzar:** Android real con datos móviles, envío real a `leads`, securityheaders.com nota A, Security Advisor de Supabase sin alertas, vista previa en WhatsApp.

## 10. SEO

`<title>` y description por página e idioma, `hreflang`, Open Graph 1200×630, `@astrojs/sitemap`, `robots.txt`, JSON-LD `Person` + `ProfessionalService`, favicon.
