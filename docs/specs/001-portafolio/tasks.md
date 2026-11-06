# Tareas 001 — Portafolio [A]nkordev v1

> Una tarea a la vez. Marca `[x]` al terminar y haz commit. `[P]` = puede hacerse en paralelo con la anterior.
> Si hay retrasos: se recortan la versión EN (F6) y el proyecto 003 (F5). Tests y seguridad no se recortan.
> **Orden acordado 2026-11-02:** hasta pasar a Vercel Pro no se despliega nada comercial (servicios, precios, CTA ni formulario). Se adelantan las tareas que no lo son: T14 → T21–T23 → Fase 5. Esperan a Pro: el resto de T12 y T24–T26.
> **Cambio 2026-11-06:** el hosting pasa a Cloudflare Workers Free (T09c), que admite uso comercial, y se descarta Vercel Pro. Lo que esperaba a Pro queda libre cuando producción esté en Cloudflare **y** el proyecto de Vercel desconectado: mientras siga conectado, cada push a `main` también despliega en Vercel Hobby.

## Fase 1 — Base (objetivo: 2 nov)

- [x] T01 Crear proyecto Astro 7 (ver plan §1) con TypeScript estricto, Tailwind 4 y `@astrojs/vercel`
- [x] T02 Configurar Vitest y Playwright; script `npm test`
- [x] T03 `global.css` con tokens de los 4 temas + script anti-parpadeo en `<head>`
- [x] T04 Fuentes con `@fontsource` y escala tipográfica fluida
- [x] T05 `BaseLayout`, `Nav`, `Footer` (con reloj de Caracas) y `ThemeSwitcher`
- [x] T06 Test e2e: el tema cambia y persiste al recargar
- [x] T07 [P] `vercel.json` con cabeceras, `.env.example`, `.gitignore`
- [x] T08 [P] `ci.yml` y `dependabot.yml`
- [x] T09 Conectar repo a Vercel y verificar despliegue (https://ankordev-portafolio.vercel.app)
- [x] T09b Hardening (plan §8): cabeceras ampliadas, `security.txt` + `SECURITY.md`, `.npmrc` de cadena de suministro, Actions por SHA y ajustes de seguridad de GitHub
- [ ] T09c Migrar a Cloudflare Workers Free (plan §1, §8): adaptador, `wrangler.jsonc`, `public/_headers`, tests; desplegar con Workers Builds, actualizar URL (`security.txt`, `SECURITY.md`, Turnstile) y desconectar Vercel — *código hecho y probado en local; falta desplegar*

**Hecho cuando:** sitio en línea, CI en verde, T06 pasa.

## Fase 2 — Contenido (objetivo: 3 nov)

- [x] T10 Sistema i18n (`es.json`, `en.json`, `utils.ts`) + test unitario
- [x] T11 Content Collection `projects` con los 4 proyectos (placeholders)
- [ ] T12 Secciones del inicio: Hero, Proyectos (lista y cuadrícula sin animación), Servicios, Proceso, Sobre mí, Contacto (solo maquetado) — *en curso: hero (sin CTA ni disponibilidad) y Proyectos hechos; Servicios, Proceso, Sobre mí, Contacto y el CTA esperan a T09c (producción en Cloudflare); al construirlos, el menú recupera sus enlaces (`BUILT_SECTIONS` en `Nav.astro`)*
- [x] T13 Página `proyectos/[slug]` y `404`
- [x] T14 Tests e2e 1, 4, 8, 9 + axe en los 2 temas — *1 y 4 ya estaban en `smoke.spec.ts` y `projects.spec.ts`; nuevos `no-js.spec.ts` (8), `keyboard.spec.ts` (9) y `a11y.spec.ts` (axe)*

**Hecho cuando:** navegable y legible sin JS; axe sin violaciones serias.

## Fase 3 — Movimiento (objetivo: 3–4 nov)

- [x] T15 `animations.ts` con guardia de reduced-motion; Lenis + ScrollTrigger
- [x] T16 SplitText en hero y títulos; scramble en etiquetas
- [x] T17 Botones magnéticos y cursor (solo puntero fino)
- [x] T18 Toggle lista/cuadrícula + imagen flotante
- [x] T19 View Transitions con reinicio de animaciones
- [x] T20 Tests e2e 3 y 7
- [x] T20b Fondo de gradiente (plan §6.1): animado con ShaderGradient en escritorio, estático en móvil y con reduced-motion; contraste AA medido en píxeles + tests
- [x] T20c Temas Oscuro/Claro con interruptor (plan §4): fondo azul noche y blanco + naranja, luz 3d sin HDR y grano CSS (plan §6.1); contraste AA medido también en móvil

**Hecho cuando:** fluido en un teléfono real; reduced-motion lo desactiva todo.

## Fase 4 — Contacto (objetivo: 4 nov)

- [x] T21 Crear tabla `leads` en Supabase (SQL del plan) y verificar RLS — *`supabase/leads.sql`; `anon` solo inserta las columnas del formulario; verificado con la API (inserción, `check`, sin lectura/edición/borrado) y Security Advisor sin avisos*
- [x] T21b Keep-alive de Supabase: `supabase/keepalive.sql` (`ping()`) + workflow programado `keepalive.yml` (plan §7) — *lunes y jueves; si Supabase no responde, falla y GitHub avisa por email*
- [x] T22 `contact-schema.ts` + tests unitarios (escribir tests primero) — *cuenta caracteres como Postgres; un test vigila que coincida con `supabase/leads.sql`*
- [x] T23 `rate-limit.ts` + `turnstile.ts` + tests unitarios — *ventana deslizante con memoria acotada; Turnstile falla cerrado (red, timeout o respuesta inválida = no verificado)*
- [x] T23b `notify.ts`: aviso por email de cada contacto con Resend + tests unitarios (plan §7) — *responder le escribe a quien envió el contacto; verificado con un envío real (entregado, reply-to correcto)*
- [ ] T24 `api/contact.ts` + tests de integración (todos los códigos del plan)
- [ ] T25 `ContactForm` con Turnstile, honeypot, estados y fallback sin JS; página `gracias`
- [ ] T26 Test e2e 6; envío real verificado en `leads`

**Hecho cuando:** todos los tests del contacto pasan y un envío real aparece en la tabla.

## Fase 5 — Proyectos (objetivo: 5–9 nov)

- [x] T27 Proyecto 001 restaurante — *repo propio en `../restaurante/` (café ficticio «Molienda», Mérida), con su spec, plan y tareas en `docs/specs/001-sitio/`; M00–M10 hechas (revisión final de impeccable aprobada, `DESIGN.md`, Lighthouse móvil 99–100/100/100/100); sin despliegue hasta nuevo aviso; el caso de estudio va en T30*
- [ ] T28 Proyecto 002 tienda (`docs/specs/003-tienda/`)
- [ ] T29 Proyecto 003 reservas, versión mínima (`docs/specs/004-reservas/`)
- [ ] T30 Casos de estudio con capturas y enlaces reales

## Fase 6 — Pulido (objetivo: 10 nov)

- [ ] T31 Traducción EN completa + test e2e 5
- [ ] T32 SEO: metadatos, OG, sitemap, robots, JSON-LD
- [ ] T33 Lighthouse CI con umbrales de la constitución
- [ ] T34 Checklist manual de seguridad y móvil (ver plan §9)

## Fase 7 — Lanzamiento (11 nov)

- [ ] T35 Revisión final, publicar y anunciar
