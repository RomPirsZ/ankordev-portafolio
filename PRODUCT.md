# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Dueños de negocios locales en Venezuela** (español): llegan casi siempre desde un teléfono de gama media con datos móviles limitados. Quieren saber rápido qué se hace, cuánto cuesta y ver ejemplos, para decidir si escriben.
- **Clientes internacionales** (inglés): evalúan el nivel técnico. Leen casos de estudio buscando decisiones técnicas, no solo capturas.
- **Visitantes con movimiento reducido activado**: deben poder leer y contactar todo sin animaciones.

La tarea central de todos es la misma: entender la oferta y contactar (formulario o WhatsApp) en pocos pasos.

## Product Purpose

Portafolio de marca personal de un desarrollador y diseñador web independiente en Venezuela. Muestra proyectos con casos de estudio, explica servicios y paquetes con precio y plazo, y convierte visitas en contactos.

**Éxito:** primer cliente pagado antes del 2026-11-30. Lanzamiento previsto el 2026-11-11.

## Positioning

Lo creativo y lo técnico pesan lo mismo: el sitio es un **laboratorio creativo** en la superficie (movimiento, temas de color, carácter experimental) y riguroso por dentro (Spec-Driven Development, tests, WCAG 2.2 AA, Lighthouse móvil ≥ 90, seguridad por defecto). El propio sitio es la prueba de ambas cosas a la vez; ninguna de las dos se sacrifica por la otra.

## Operating Context

- Visitas mayormente desde el móvil, a menudo con conexiones lentas; también escritorio (los clientes internacionales).
- Contacto por formulario (nombre, email, tipo de proyecto, presupuesto aproximado, mensaje), WhatsApp y email.
- El enlace se comparte a menudo por WhatsApp y redes, así que la vista previa (imagen y descripción) importa.
- Proceso de trabajo con clientes: Descubrir → Especificar → Construir → Lanzar.

## Capabilities and Constraints

- Fuente de verdad del alcance: `docs/constitution.md` (prioritaria), `docs/specs/001-portafolio/spec.md`, `plan.md` y `tasks.md`.
- Stack fijado: Astro 7 + Tailwind 4, salida estática salvo `/api/contact`, en Cloudflare Workers. Ninguna dependencia nueva sin preguntar.
- Bilingüe: español por defecto, inglés completo y enlazado (`/` y `/en/`). Todo texto de interfaz va en `src/i18n/`.
- Contenido legible y usable sin JavaScript; el movimiento es una capa progresiva que solo anima `transform`/`opacity` y respeta `prefers-reduced-motion`.
- Paquetes de servicios definidos (Landing, Sitio para negocio, Tienda / App web) con alcance, plazos y precios «desde» en la spec §5 (USD; tarifa local en ES, internacional en EN). Decididos el 2026-11-01; no se cambian ni se añaden servicios u ofertas sin confirmación.
- Fuera de alcance en v1: WebGL, sonido de interfaz, sección `/lab`, blog y dominio propio.

## Brand Commitments

- **Nombre:** «[A]nkordev», con corchetes. Así se escribe en el título y los textos. Sustituye al marcador `{{MARCA}}` / la propuesta «Ankor» de la spec.
- **Logotipo e identidad de color** (elegidos el 2026-11-06): logotipo «Cursor» (`[Λ]NKORDEV_`, estilo esports con guiños de código) y paleta «Terminal cálida». Los registran la spec §6 y DESIGN.md.
- **Voz:** neutra, sin tratar al visitante de tú ni de usted. La primera persona del autor sí se usa («Diseño y desarrollo…», «Sobre mí»). Directa y sin jerga corporativa.
- Reloj con la hora de Caracas en el footer (el sello «Hecho en Venezuela» se quitó el 2026-11-06).
- Los 2 temas (Oscuro y Claro, con interruptor), la tipografía (Space Grotesk / Monaspace Krypton) y los elementos de laboratorio están fijados en la spec §6 y ya implementados; los registra DESIGN.md, no este archivo.

## Evidence on Hand

- **No hay todavía trabajo de clientes entregado ni publicado.**
- Proyectos 001 (restaurante/café), 002 (tienda online) y 003 (app de reservas para barbería) son proyectos propios por construir, no encargos de clientes.
- Proyecto 004 **LEGO LBN**: sitio para una iglesia, encargo real que se entregará, todavía en curso.
- No existen testimonios, logos de clientes, métricas de resultados ni prensa. **No se fabrican.** Los casos de estudio se cuentan como lo que son (Problema → Solución → Decisiones técnicas → Resultado).
- Redes (GitHub, LinkedIn, Instagram) sin URL todavía en `src/lib/site.ts`; foto/ilustración de «Sobre mí» pendiente.

## Product Principles

1. **El sitio es la prueba.** Cada afirmación sobre la calidad (accesibilidad, rendimiento, motion cuidado) la tiene que cumplir el propio portafolio.
2. **Honestidad sobre la evidencia.** Proyectos propios y en curso se presentan como tales; nada de clientes, cifras o testimonios inventados.
3. **Del vistazo al contacto en pocos pasos.** Qué se hace, cuánto cuesta y cómo escribir tiene que entenderse rápido en un teléfono.
4. **Laboratorio encima, contenido debajo.** La experimentación nunca bloquea leer, navegar o contactar.
5. **Dos públicos, una marca.** El negocio local y el cliente internacional reciben la misma calidad en su idioma.

## Accessibility & Inclusion

WCAG 2.2 AA obligatorio: contraste AA en los 2 temas, navegación completa por teclado, foco visible, HTML semántico, texto alternativo, formularios etiquetados, cero violaciones serias o críticas de axe. Sin animaciones con `prefers-reduced-motion`. Lighthouse móvil ≥ 95 en accesibilidad.
