# Constitución de desarrollo — [A]nkordev

> Principios no negociables para **todos** mis proyectos web (portafolio y clientes).
> Tiene prioridad sobre cualquier spec, plan o tarea. Si algo los contradice, se detiene el trabajo y se pregunta.
> Versión 1.3.0 · Ratificada: 2026-10-30 · Última enmienda: 2026-11-03

---

## I. Contenido primero

El contenido es legible y usable sin JavaScript. Animaciones e interactividad son una capa progresiva encima, nunca un requisito para leer o contactar.

## II. Movimiento con propósito

Toda animación guía la lectura o da feedback. Se animan propiedades que el navegador resuelve sin recalcular el diseño: `transform` y `opacity`, y también `clip-path`, `mask`, filtros (`filter`, `backdrop-filter`, blur incluido) y color, fondo, borde y `box-shadow`. No se animan propiedades que obligan a recalcular el diseño (`width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`…). Los efectos caros, como filtros y máscaras sobre imágenes o bloques grandes y sobre todo si van ligados al scroll, se usan solo donde aportan y deben mantenerse fluidos en un teléfono de gama media (principio IV); el texto conserva el contraste AA también durante la animación. Hay un único fondo ambiental animado (gradiente WebGL), que solo se carga en escritorio con puntero fino, nunca en móvil (allí el fondo es estático), se detiene con la pestaña oculta y mantiene el contraste AA del texto en todo momento. Se respeta siempre `prefers-reduced-motion`: con él no hay animaciones, el fondo es estático y no se descarga.

## III. Accesibilidad (WCAG 2.2 AA)

Contraste AA, navegación completa por teclado, foco visible, HTML semántico, textos alternativos y etiquetas en formularios. Cero violaciones serias o críticas de axe.

## IV. Rendimiento para conexiones reales

Se diseña para teléfonos de gama media con datos móviles limitados. Lighthouse móvil ≥ 90 en rendimiento y ≥ 95 en accesibilidad, buenas prácticas y SEO. Imágenes optimizadas y cargadas de forma diferida; JavaScript solo donde se necesita.

## V. Seguridad por defecto

- Ningún secreto en el repositorio ni en el cliente; solo variables de entorno. Nunca usar claves con privilegios de administrador (ej. `service_role`) en código de cliente.
- Toda entrada del usuario se valida en el servidor, aunque también se valide en el cliente.
- Bases de datos con políticas de mínimo privilegio (RLS en Supabase).
- Cabeceras de seguridad HTTP configuradas en cada despliegue.
- Errores genéricos hacia el usuario; detalles solo en logs.

## VI. Testing obligatorio

- Toda lógica (validaciones, utilidades, endpoints) tiene tests unitarios o de integración.
- Los flujos críticos (navegación, formularios, pagos, autenticación) tienen tests end-to-end.
- Se escribe el test antes o junto con la funcionalidad, no "después".
- CI en verde es condición para fusionar a `main`.

## VII. Simplicidad

Código mínimo y legible. Pocas dependencias, versiones fijadas y auditadas. No se agrega una librería si la plataforma o unas pocas líneas lo resuelven. Nada de abstracciones "por si acaso".

## VIII. Spec antes que código

- Funcionalidad con alcance definido → **SDD**: spec → plan → tareas → implementación.
- Exploración visual o creativa → **ODD**: iteración libre, pero el resultado que se conserve debe cumplir esta constitución y quedar documentado.
- Una tarea a la vez; commit al cerrar cada tarea con mensajes convencionales (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).

## IX. Bilingüe y localizable

Textos en archivos de traducción, nunca incrustados en componentes. Español por defecto; inglés cuando el proyecto lo requiera.

## X. Privacidad

Se recolectan solo los datos necesarios, se informa su uso y no se agregan trackers de terceros sin consentimiento del cliente.

---

## Gobierno

- Cambiar esta constitución requiere actualizar la versión (MAJOR si se elimina o redefine un principio, MINOR si se agrega, PATCH si se aclara) y anotar el motivo.
- Cada `plan.md` incluye un "Chequeo de constitución" que confirma el cumplimiento de cada principio o justifica la excepción.

### Historial

- **1.0.1** (2026-11-01, PATCH): se reemplaza el marcador `{{MARCA}}` del título por el nombre decidido, «[A]nkordev». Sin cambios en los principios.
- **1.1.0** (2026-11-01, MINOR): el principio II admite `filter: blur()` en entradas breves de titulares y textos cortos (≤ 0,6 s, ≤ 8 px, sin scroll continuo ni elementos grandes). Motivo: entrada de letras del hero y los títulos (spec §7).
- **1.2.0** (2026-11-01, MINOR): el principio II admite un único fondo ambiental animado (gradiente WebGL) solo en escritorio con puntero fino; estático en móvil y con reduced-motion; contraste AA del texto garantizado. Motivo: identidad visual del sitio, decisión del cliente.
- **1.3.0** (2026-11-03, MINOR): el principio II admite animar `clip-path`, `mask`, filtros (incluido el blur en imágenes, en bloques y ligado al scroll), color, fondo, borde y `box-shadow`, además de `transform` y `opacity`. Sustituye los límites de blur de la 1.1.0. Se mantienen el veto a las propiedades que recalculan el diseño, el respeto a reduced-motion y el fondo WebGL único. Motivo: más libertad para animar los proyectos, decisión del cliente.
