---
name: "[A]nkordev"
description: Portafolio de laboratorio creativo — diseño y desarrollo web hecho en Venezuela.
colors:
  carbon: "#2B2D31"
  carbon-surface: "#3A3D43"
  ceniza: "#B7B6B4"
  naranja: "#F2711C"
  naranja-surface: "#E0631A"
  petroleo: "#1F6F8B"
  petroleo-surface: "#195C73"
  militar: "#5B6B3A"
  militar-surface: "#4C5A30"
  hueso: "#F3F1EC"
  tinta: "#1E1F22"
typography:
  display:
    fontFamily: "Space Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 1.6rem + 5.1vw, 6.25rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.8rem + 2vw, 3.75rem)"
    fontWeight: 700
  title:
    fontFamily: "Space Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.24rem + 0.6vw, 1.75rem)"
    fontWeight: 700
  body:
    fontFamily: "Space Grotesk Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.96rem + 0.19vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono Variable, ui-monospace, monospace"
    fontSize: "clamp(0.75rem, 0.72rem + 0.12vw, 0.8125rem)"
    fontWeight: 400
    letterSpacing: "0.05em"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  gutter-mobile: "16px"
  gutter: "24px"
  grid-cell: "64px"
  container: "80rem"
components:
  skip-link:
    backgroundColor: "{colors.naranja}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  nav-link:
    textColor: "{colors.hueso}"
    typography: "{typography.label}"
    padding: "4px 0"
  theme-swatch:
    rounded: "{rounded.full}"
    size: "24px"
  footer-clock:
    textColor: "{colors.hueso}"
    typography: "{typography.label}"
---

# Design System: [A]nkordev

## Overview

**Creative North Star: "El Cuaderno de Laboratorio"**

El sitio es la libreta de un experimento en curso. La retícula fina de fondo es el papel cuadriculado; la numeración (`01`, `001`), las etiquetas mono en mayúsculas (`EXP-001`, `[ 01 / SERVICIOS ]`) y las coordenadas decorativas son las anotaciones al margen; cada proyecto es un registro con su número. Encima de ese papel, el contenido se escribe en grande: titulares en Space Grotesk que ocupan la pantalla con seguridad. El rigor está en el sistema, no en el adorno: cada marca tiene un sitio, un número y una razón.

La densidad es baja y ordenada: mucho fondo, líneas de 1 px, tipografía grande y pocas piezas sólidas. El color de cada tema llena el fondo entero; no se reparte en manchas. El movimiento, comprometido en la spec (letras escalonadas en el hero, revelado de títulos, scramble breve en etiquetas, botones magnéticos, línea de progreso del proceso), solo existe para guiar la lectura o confirmar una acción, y desaparece por completo con `prefers-reduced-motion`.

Lo que el sitio rechaza: la plantilla SaaS genérica (gradientes morados, tarjetas con sombra suave, iconos de stock, «hero + 3 features»), el ruido de efectos (animación porque sí, glitch constante), lo corporativo frío (fotos de stock de oficina, azul de agencia) y el cliché cyberpunk (verde Matrix, glow neón, terminal falsa).

**Key Characteristics:**
- Cuatro temas de color que cambian el fondo completo; el visitante elige y el sitio lo recuerda.
- Retícula de 64 px como papel de fondo, siempre decorativa.
- Display enorme y apretado en Space Grotesk; anotaciones en JetBrains Mono, mayúsculas y espaciadas.
- Esquinas rectas en todo; el círculo solo para muestras de color e indicadores.
- Plano en reposo; la sombra solo aparece como respuesta a un estado.
- Mezcla sólido + fino: el CTA principal es un bloque sólido y táctil, todo lo demás es línea fina y texto.

## Colors

Cuatro ambientes completos construidos con dos tintas fijas (Hueso y Tinta) y un acento Naranja que funciona como señal, no como decoración general.

### Primary
- **Naranja** (`naranja`): el acento de marca. En Carbón, Petróleo y Militar es el relleno del CTA principal, el enlace de salto y los marcadores de estado; en el tema Naranja es el fondo completo. Solo es texto en Carbón (vía `--accent-ink`), donde cumple AA.
- **Naranja superficie** (`naranja-surface`): la superficie del tema Naranja (paneles, tarjetas).

### Neutral
- **Carbón** (`carbon`): fondo del tema por defecto.
- **Carbón superficie** (`carbon-surface`): superficies elevadas por tono en Carbón.
- **Petróleo** / **Petróleo superficie** (`petroleo`, `petroleo-surface`): fondo y superficie del tema Petróleo.
- **Militar** / **Militar superficie** (`militar`, `militar-surface`): fondo y superficie del tema Militar.
- **Hueso** (`hueso`): texto principal en Carbón, Petróleo y Militar; texto sobre relleno de acento en el tema Naranja.
- **Tinta** (`tinta`): texto principal en el tema Naranja; texto sobre relleno Naranja en el resto de temas.
- **Ceniza** (`ceniza`): texto secundario (`--muted`) solo en Carbón. En los demás temas `--muted` es igual a `--fg`.
- **Línea** (derivada: `--fg` al 18 % sobre transparente): retícula y divisores. Es decorativa; nunca sirve como borde de un control.

### Roles por tema

Los componentes nunca usan un color de tema directamente: usan los roles (`--bg`, `--surface`, `--fg`, `--muted`, `--accent`, `--accent-ink`, `--on-accent`, `--line`), que `src/styles/global.css` resuelve por `[data-theme]` y Tailwind expone como `bg-bg`, `text-fg`, etc.

| Rol | Carbón | Naranja | Petróleo | Militar |
|---|---|---|---|---|
| `--bg` | Carbón | Naranja | Petróleo | Militar |
| `--surface` | Carbón superficie | Naranja superficie | Petróleo superficie | Militar superficie |
| `--fg` | Hueso | Tinta | Hueso | Hueso |
| `--muted` | Ceniza | Tinta | Hueso | Hueso |
| `--accent` | Naranja | Tinta | Naranja | Naranja |
| `--accent-ink` | Naranja | Tinta | Hueso | Hueso |
| `--on-accent` | Tinta | Hueso | Tinta | Tinta |

### Named Rules

**The Señal Rule.** El Naranja es una señal: marca la acción principal, el estado activo o el punto de atención. Si en una pantalla hay más de un par de rellenos naranjas compitiendo, uno sobra.

**The Accent-Ink Rule.** Texto con color de acento siempre va con `--accent-ink`, y solo sobre `--bg`. El Naranja como texto no llega a AA sobre Petróleo (1.93:1) ni Militar (1.98:1); `tests/unit/themes.test.ts` vigila los ratios.

**The Four-Theme Rule.** Toda pieza nueva se verifica en los cuatro temas antes de darse por terminada. Un componente que solo se ve bien en Carbón está roto.

## Typography

**Display Font:** Space Grotesk Variable (con `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Space Grotesk Variable (misma familia)
**Label/Mono Font:** JetBrains Mono Variable (con `ui-monospace, monospace`)

**Character:** Una grotesca geométrica con rarezas (la «a», la «G») que en tamaño display se siente construida a mano, y una mono de programador para las anotaciones del cuaderno. La grotesca habla; la mono numera, etiqueta y mide.

### Hierarchy
- **Display** (700, `clamp(2.75rem → 6.25rem)`, interlineado 0.95, tracking −0.03em): titular del hero y nombres de proyecto en la vista lista. Una por pantalla.
- **Headline** (700, `clamp(2.25rem → 3.75rem)`): títulos de sección.
- **Title** (700, `clamp(1.375rem → 1.75rem)`): títulos de tarjeta, paquete o paso del proceso.
- **Body** (400, `clamp(1rem → 1.125rem)`, interlineado 1.5): texto corrido, con un ancho máximo de 65–75 caracteres.
- **Label** (mono 400, `clamp(0.75rem → 0.8125rem)`, tracking 0.05em, MAYÚSCULAS): navegación, numeración, etiquetas `EXP-001`, reloj, metadatos.

La escala es fluida entre 360 px y 1440 px de ancho; los pasos intermedios (`text-sm`, `text-lg`, `text-2xl`) existen en `global.css` para casos puntuales.

### Named Rules

**The Annotation Rule.** Todo lo que numera, etiqueta, mide o fecha va en mono mayúscula. Todo lo que cuenta algo va en Space Grotesk. Nunca al revés: un párrafo en mono o un número de sección en grotesca rompe el cuaderno.

**The Tabular Rule.** Números que cambian (reloj, contadores, precios en tabla) usan `tabular-nums` para no bailar.

## Layout

El contenido vive en un contenedor centrado de 80rem (`max-w-7xl`) con márgenes laterales de 16 px en móvil y 24 px desde 640 px. El fondo de todo el `body` lleva la retícula de laboratorio (celdas de 64 px, líneas de 1 px en el color Línea, alineada arriba y al centro). Nav y footer se separan del contenido con una línea de 1 px, no con bloques de color.

La navegación pasa de una sola fila en escritorio (marca · enlaces · selector de tema e idioma) a dos filas en móvil, con los enlaces debajo y a todo el ancho. El footer pasa de una columna a tres desde 640 px (reloj · redes · crédito alineado a la derecha). Se diseña primero para el teléfono: es el dispositivo de la mayoría de las visitas.

**The Paper Rule.** La retícula es el papel, no el contenido: nunca lleva información, nunca compite en contraste con el texto y nunca se usa para alinear a la fuerza piezas que no la necesitan.

## Elevation & Depth

Sistema plano. En reposo, la profundidad se construye por tono (`--bg` → `--surface`) y por líneas de 1 px, nunca con sombra. La sombra existe solo como respuesta a un estado: un objeto que el visitante está moviendo o que se separa del papel por interacción (por ejemplo, la imagen que sigue al cursor en la vista lista de proyectos). Todavía no hay un valor de sombra implementado; el primero que se construya debe ser uno solo, sobrio, y quedar registrado aquí.

**The Flat-At-Rest Rule.** Ninguna superficie tiene sombra en reposo. Si una tarjeta necesita sombra para separarse del fondo, le falta contraste de tono, no sombra.

## Shapes

Esquinas rectas (0 px) en botones, tarjetas, campos, imágenes y contenedores. El círculo (`9999px`) queda reservado para muestras de color del selector de tema y puntos o indicadores de estado (por ejemplo, la etiqueta de disponibilidad). Los bordes son de 1 px en el color Línea para divisores; un control interactivo que necesite borde usa `--fg`, porque Línea no cumple contraste de componente.

**The Square Rule.** Si tiene esquina, la esquina es recta. El único círculo legítimo es el que representa un color o un estado.

## Components

Filosofía: **sólido + fino**. El CTA principal es un bloque sólido y táctil (relleno de acento, peso visual, magnético en escritorio); todo lo demás es fino y técnico: texto mono, líneas de 1 px, estados claros.

### Buttons
Todavía no hay botones implementados. Se aplican estas reglas al construirlos:
- **Shape:** esquina recta (0 px).
- **Primary (CTA, ej. «Hablemos»):** relleno `--accent`, texto `--on-accent`, peso de etiqueta o title según el contexto. Es el único bloque sólido de su pantalla. En escritorio con puntero fino es magnético (spec §7); sin JS o con movimiento reducido es un botón normal.
- **Secundario / fantasma:** sin relleno, texto `--fg` en mono mayúscula, subrayado o borde de 1 px en `--fg` al interactuar.
- **Hover / Focus:** el foco usa el contorno global (2 px `--fg`, separación 3 px). El hover nunca es la única señal de que algo es interactivo.

### Navigation
- **Estilo:** marca en Space Grotesk 700 (`text-lg`, tracking apretado) a la izquierda; enlaces en mono mayúscula con su número en `--muted` (`01 Proyectos`, `02 Servicios`…).
- **Estados:** hover con subrayado; foco con el contorno global. El cambio de idioma es una etiqueta mono (`EN` / `ES`) con nombre accesible completo.
- **Móvil:** los enlaces bajan a una segunda fila a todo el ancho y se reparten con `flex-wrap`.

### Theme Swatches (componente firma)
- **Forma:** círculos de 24 px con borde de 2 px en `--fg`, pintados con el fondo real de cada tema (Carbón, Naranja, Petróleo, Militar).
- **Estado activo:** `aria-pressed="true"` más un contorno exterior de 2 px en `--fg` con separación de 2 px.
- **Sin JS:** el grupo nace oculto (`hidden`) y el script lo muestra; no se ofrece un control que no puede funcionar.

### Skip Link
- Relleno `--accent`, texto `--on-accent`, esquina recta, fijo arriba a la izquierda cuando recibe foco. Es la única pieza sólida del chrome.

### Footer Clock (componente firma)
- Etiqueta mono «Hora en Caracas» en `--muted` y hora en tamaño `text-base` con `tabular-nums` y sufijo `UTC−4`. Sin JS muestra la hora del build; con JS se actualiza cada segundo.

## Do's and Don'ts

### Do:
- **Do** usar siempre los roles (`--bg`, `--fg`, `--accent`, `--accent-ink`, `--on-accent`…) y nunca un hex de tema directamente en un componente (la excepción son las muestras del selector de tema).
- **Do** verificar cada pieza nueva en los cuatro temas y con `prefers-reduced-motion: reduce`.
- **Do** poner numeración, etiquetas, fechas y metadatos en JetBrains Mono mayúscula con tracking 0.05em.
- **Do** mantener las esquinas rectas (0 px) y reservar el círculo para colores e indicadores.
- **Do** separar zonas con línea de 1 px o cambio de tono `--bg` → `--surface`.
- **Do** animar solo `transform` y `opacity`, y solo para guiar la lectura o confirmar una acción.

### Don't:
- **Don't** construir con la estética de plantilla SaaS: gradientes morados, tarjetas con sombra suave, iconos de stock, «hero + 3 features».
- **Don't** añadir ruido de efectos: animación porque sí, glitch constante, cosas que se mueven sin guiar la lectura.
- **Don't** caer en lo corporativo frío: fotos de stock de oficina, azul de agencia, tono de agencia grande.
- **Don't** usar el cliché cyberpunk: verde Matrix, glow neón, terminal falsa.
- **Don't** usar el Naranja como texto sobre Petróleo o Militar; para eso existe `--accent-ink`.
- **Don't** poner sombra a una superficie en reposo.
- **Don't** usar el color Línea como borde de un control interactivo.
