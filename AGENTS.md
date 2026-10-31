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
