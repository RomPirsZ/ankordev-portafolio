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
- [x] T09c Migrar a Cloudflare Workers Free (plan §1, §8): adaptador, `wrangler.jsonc`, `public/_headers`, tests; desplegar con Workers Builds, actualizar URL (`security.txt`, `SECURITY.md`, Turnstile) y desconectar Vercel — *en línea en https://ankordev-portafolio.ankordev.workers.dev; hostname añadido a Turnstile y proyecto de Vercel borrado (2026-11-06; `vercel.app` responde 404)*

**Hecho cuando:** sitio en línea, CI en verde, T06 pasa.

## Fase 2 — Contenido (objetivo: 3 nov)

- [x] T10 Sistema i18n (`es.json`, `en.json`, `utils.ts`) + test unitario
- [x] T11 Content Collection `projects` con los 4 proyectos (placeholders)
- [x] T11b Identidad de marca (spec §6): paleta «Terminal cálida» y logo «Cursor», elegidos el 2026-11-06 entre los bocetos de `samples/`; favicon con el monograma; contraste AA en píxeles y `DESIGN.md` al día — *también se regeneraron las portadas provisionales con la paleta nueva*
- [x] T12 Secciones del inicio: Hero, Proyectos (lista y cuadrícula sin animación), Servicios, Proceso, Sobre mí, Contacto (solo maquetado) — *hecha 2026-11-07: CTA «Hablemos» y «Disponible para proyectos» en el hero; Proceso con la línea ligada al scroll (spec §7); Sobre mí con foto real; Contacto con WhatsApp y email (el formulario es T25). Nombre, WhatsApp y email salen de las variables de build `PUBLIC_OWNER_*` (fuera de git, plan §7); las redes y el stack, de `src/lib/site.ts`. Vacíos no se muestran. Lenis ya no gestiona los enlaces a secciones (devolvía la página atrás en la última)*
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
- [x] T24 `api/contact.ts` + tests de integración (todos los códigos del plan) — *hecha 2026-11-08: lógica en `contact-handler.ts` y guardado en `leads.ts`; contrato en el plan §7 (JSON y POST nativo con 303). 25 tests de integración + 6 unitarios de `leads` + e2e de la ruta en workerd. Logs del Worker activados (`observability`)*
- [x] T25 `ContactForm` con Turnstile, honeypot, estados y fallback sin JS; página `gracias` — *hecha 2026-11-08: sin JS no se ofrece (Turnstile lo necesita) y remite a WhatsApp/email; Turnstile se carga al primer foco; validación en el navegador idéntica a la del servidor (test de coherencia); `/gracias/` y `/en/thanks/` con `noindex`. Verificado con el Turnstile real (clave de prueba): sin errores de CSP y sin peticiones a Cloudflare hasta tocar el formulario*
- [x] T26 Test e2e 6; envío real verificado en `leads` — *hecha 2026-11-08: e2e 6 (`contact-form.spec.ts`, 14 casos × móvil/escritorio) con API y Turnstile simulados; envío real en local (Supabase y Resend reales, Turnstile de prueba) y en producción desde la web publicada, recibido en el email. Configuración de producción documentada en el plan §7*

**Hecho cuando:** todos los tests del contacto pasan y un envío real aparece en la tabla.

### Correcciones de la auditoría de seguridad (run-1, 2026-11-10)

Auditoría de solo código fuente con la skill security-audit: 0 hallazgos confirmados, 6 pistas por validar y notas de endurecimiento. Informe fuera del repo (`~/security-audit-skill/sdd-portafolio/run-1/`).

- [x] T26b Patrón del email lineal y corte por longitud antes de evaluarlo — *el patrón anterior tardaba un tiempo cuadrático con un dominio lleno de puntos; `abort` en el límite de longitud; `leads.sql` con el `alter` para la tabla ya creada (lo aplica el dueño en Supabase)*
- [x] T26c Logs sin coste para el atacante: sin log del honeypot ni de Turnstile fallido, `invocation_logs: false` — *un test vigila `wrangler.jsonc`; el plan §7 explica qué se registra y por qué*
- [ ] T26d Cabeceras de seguridad también en las respuestas que genera el Worker (`src/middleware.ts`)
- [ ] T26e Tope compartido de envíos y de avisos por email — *pendiente de decisión: el binding Rate Limiting solo admite periodos de 10 o 60 s*

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
