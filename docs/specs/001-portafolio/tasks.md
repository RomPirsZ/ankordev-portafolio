# Tareas 001 — Portafolio [A]nkordev v1

> Una tarea a la vez. Marca `[x]` al terminar y haz commit. `[P]` = puede hacerse en paralelo con la anterior.
> Si hay retrasos: se recortan la versión EN (F6) y el proyecto 003 (F5). Tests y seguridad no se recortan.

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

**Hecho cuando:** sitio en línea, CI en verde, T06 pasa.

## Fase 2 — Contenido (objetivo: 3 nov)

- [x] T10 Sistema i18n (`es.json`, `en.json`, `utils.ts`) + test unitario
- [x] T11 Content Collection `projects` con los 4 proyectos (placeholders)
- [ ] T12 Secciones del inicio: Hero, Proyectos (lista y cuadrícula sin animación), Servicios, Proceso, Sobre mí, Contacto (solo maquetado) — *en curso: hero (sin CTA ni disponibilidad) y Proyectos hechos; Servicios, Proceso, Sobre mí, Contacto y el CTA esperan a Vercel Pro*
- [x] T13 Página `proyectos/[slug]` y `404`
- [ ] T14 Tests e2e 1, 4, 8, 9 + axe en los 2 temas

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

- [ ] T21 Crear tabla `leads` en Supabase (SQL del plan) y verificar RLS
- [ ] T22 `contact-schema.ts` + tests unitarios (escribir tests primero)
- [ ] T23 `rate-limit.ts` + `turnstile.ts` + tests unitarios
- [ ] T24 `api/contact.ts` + tests de integración (todos los códigos del plan)
- [ ] T25 `ContactForm` con Turnstile, honeypot, estados y fallback sin JS; página `gracias`
- [ ] T26 Test e2e 6; envío real verificado en `leads`

**Hecho cuando:** todos los tests del contacto pasan y un envío real aparece en la tabla.

## Fase 5 — Proyectos (objetivo: 5–9 nov)

- [ ] T27 Proyecto 001 restaurante (spec propia en `docs/specs/002-restaurante/`)
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
