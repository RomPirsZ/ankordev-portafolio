# Instrucciones para el agente

Este proyecto usa **SDD (Spec-Driven Development)**. Antes de escribir código:

1. Lee `docs/constitution.md`. Sus principios tienen prioridad sobre todo lo demás.
2. Lee la spec activa: `docs/specs/001-portafolio/spec.md` (qué y por qué).
3. Lee su plan técnico: `docs/specs/001-portafolio/plan.md` (cómo).
4. Trabaja según `docs/specs/001-portafolio/tasks.md`:
   - Una tarea a la vez, en orden.
   - Escribe o actualiza los tests junto con la funcionalidad.
   - Al terminar: ejecuta `npm test`, marca la tarea `[x]`, haz commit convencional (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
   - Al terminar cada **fase**, detente y espera revisión.
5. No agregues dependencias fuera del plan sin preguntar.
6. Si la spec o el plan son ambiguos o contradicen la constitución, pregunta antes de seguir.

Idioma del código y comentarios: español solo donde aporte claridad. Textos de interfaz siempre en `src/i18n/`.

## Contexto de producto y diseño

- `PRODUCT.md`: quién usa el sitio, posicionamiento, marca, voz y evidencia disponible. Nunca se inventan clientes, testimonios ni cifras.
- `DESIGN.md` (+ `.impeccable/design.json`): sistema visual «El Cuaderno de Laboratorio». Toda UI nueva lo sigue: roles de color (nunca un hex de tema en un componente), reglas con nombre, esquinas rectas, plano en reposo, los 4 temas verificados.
- Orden de autoridad: **constitución → spec/plan → DESIGN.md / PRODUCT.md → guía de cualquier skill**. Si un skill recomienda algo que contradice a los de arriba, gana el de arriba.
- Si cambias el sistema visual implementado, actualiza `DESIGN.md` (`/impeccable document`) en la misma tarea.

## Herramientas de diseño instaladas

Cada una tiene un papel. No uses dos para el mismo trabajo.

| Tarea | Herramienta |
|---|---|
| Construir o reformar UI, crítica, auditoría, pulido, modo live, mantener `DESIGN.md` | **impeccable** (`/impeccable <comando>`) — la principal |
| Accesibilidad WCAG 2.2, formularios, textos de interfaz, i18n, UX móvil | **ux-designer** |
| Revisión visual con capturas a varios anchos (inspector en navegador real) | **design-taste-frontend** (taste-skill) — solo su revisión, no su estilo |
| Ajustar duraciones, curvas y escalonados de animaciones existentes | **transitions-polish** (`transitions review` / `transitions polish`) |
| Imágenes estáticas: OG para redes, portadas provisionales, ilustraciones | **canvas-design**, siempre con paleta y tipografía de `DESIGN.md` |
| Prototipos o demos sueltos en claude.ai | **web-artifacts-builder** — nunca dentro de este repo |
| Dirección estética en casos que impeccable no cubra | **frontend-design** — secundaria: antes de usarla, di qué no cubre impeccable y por qué |

### Choques conocidos

- **taste-skill** desaconseja etiquetas mono, líneas finas y retícula: aquí son parte de la spec §6 y de `DESIGN.md`. Mandan ellos.
- **Scripts por CDN** (GSAP/Lenis en las escenas de taste-skill): no se copian. GSAP y Lenis van por npm según el plan, y la CSP solo permite `self`.
- **Fotos de stock** (taste-skill descarga de Unsplash/Picsum): solo como ambientación, nunca presentadas como trabajo o clientes reales.
- **Blur animado** (transitions-polish lo propone): la constitución II solo permite animar `transform` y `opacity`. **Preguntar** antes de integrarlo o descartarlo; integrarlo exige enmendar la constitución.
- **Tokens de movimiento** (`_root.css` de transitions-polish): preguntar antes de copiarlos a `global.css`.
- **web-artifacts-builder** instala React, shadcn y `pnpm`: nunca en este proyecto.
- Carpetas de trabajo de skills (`.taste-skill/`): fuera de git.

## Instalaciones

Nunca instales un skill, plugin, paquete npm ni herramienta global sin preguntar primero, aunque un skill lo pida en sus pasos (ej. `init-artifact.sh`, `npm install -g`, editores con Next.js). Al proponer una instalación: revisa el repositorio, sus scripts y el análisis de seguridad, y di si choca con este proyecto.
