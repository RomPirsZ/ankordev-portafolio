---
name: "[A]nkordev"
description: Portafolio de laboratorio creativo — diseño y desarrollo web.
colors:
  carbon: "#1C1A18"
  carbon-surface: "#292624"
  hueso: "#F3EEE6"
  ceniza: "#BEB8AF"
  coral: "#FF5B37"
  turquesa: "#3FD0BE"
  papel: "#F5F0E8"
  papel-surface: "#EAE2D6"
  tierra: "#4F4943"
  coral-hondo: "#B3381C"
  turquesa-honda: "#07524C"
  grafito: "#141616"
  musgo: "#123A36"
  humo: "#1A1C1C"
  coral-claro: "#FFAD93"
  blanco: "#FFFFFF"
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
    fontFamily: "Monaspace Krypton, ui-monospace, monospace"
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
  brand-logo:
    textColor: "{colors.hueso}"
    height: "22px"
  lab-label:
    textColor: "{colors.turquesa}"
    typography: "{typography.label}"
  skip-link:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.carbon}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  nav-link:
    textColor: "{colors.hueso}"
    typography: "{typography.label}"
    padding: "4px 0"
  theme-toggle:
    textColor: "{colors.hueso}"
    rounded: "{rounded.none}"
    size: "32px"
  footer-clock:
    textColor: "{colors.hueso}"
    typography: "{typography.label}"
---

# Design System: [A]nkordev

## Overview

**Creative North Star: "El Cuaderno de Laboratorio"**

El sitio es la libreta de un experimento en curso. La retícula fina de fondo es el papel cuadriculado; la numeración (`01`, `001`) y las etiquetas mono en mayúsculas (`EXP-001`, `[ 01 / SERVICIOS ]`) son las anotaciones al margen; cada proyecto es un registro con su número. Encima de ese papel, el contenido se escribe en grande: titulares en Space Grotesk que ocupan la pantalla con seguridad. El rigor está en el sistema, no en el adorno: cada marca tiene un sitio, un número y una razón.

La densidad es baja y ordenada: mucho fondo, líneas de 1 px, tipografía grande y pocas piezas sólidas. El color de cada tema llena el fondo entero; no se reparte en manchas. El movimiento, comprometido en la spec (letras escalonadas en el hero, revelado de títulos, scramble breve en etiquetas, botones magnéticos, línea de progreso del proceso), solo existe para guiar la lectura o confirmar una acción, y desaparece por completo con `prefers-reduced-motion`.

Lo que el sitio rechaza: la plantilla SaaS genérica (gradientes morados, tarjetas con sombra suave, iconos de stock, «hero + 3 features»), el ruido de efectos (animación porque sí, glitch constante), lo corporativo frío (fotos de stock de oficina, azul de agencia) y el cliché cyberpunk (verde Matrix, glow neón, terminal falsa).

**Key Characteristics:**
- Dos temas, Oscuro y Claro, que cambian el fondo completo; el visitante elige con un interruptor y el sitio lo recuerda.
- Paleta «Terminal cálida» (2026-11-06): carbón cálido y hueso, un coral que marca la acción y un turquesa reservado a lo que se escribe como código.
- Fondo de gradiente con grano fino: solo carbón y un brillo turquesa en el oscuro; blanco, coral claro y papel en el claro. Animado en escritorio (WebGL), estático en móvil y con reduced-motion. Es la única animación ambiental.
- Logotipo «Cursor»: `[Λ]NKORDEV_`, la A sin travesaño y un cursor de bloque en su lugar.
- Retícula de 64 px como papel de fondo, siempre decorativa.
- Display enorme y apretado en Space Grotesk; anotaciones en Monaspace Krypton, mayúsculas y espaciadas.
- Esquinas rectas en todo; el círculo solo para indicadores de estado.
- Plano en reposo; la sombra solo aparece como respuesta a un estado.
- Mezcla sólido + fino: el CTA principal es un bloque sólido y táctil, todo lo demás es línea fina y texto.

## Colors

Paleta «Terminal cálida», elegida el 2026-11-06 por su perfil (inventor creativo) y por la primera impresión que busca (confianza y seriedad). Dos ambientes completos, uno de noche y uno de día, con dos tintas fijas (Hueso y Carbón), un acento Coral que marca la acción y un Turquesa que solo aparece donde algo se escribe como código. La base sobria da la confianza; el carácter vive en dos detalles de color.

### Primary
- **Coral** (`coral`, oscuro) y **Coral hondo** (`coral-hondo`, claro): el acento de marca. Es relleno: CTA principal, enlace de salto y el cursor del logotipo. Texto sobre él: Carbón en el oscuro (5,6:1) y Papel en el claro (5,3:1).

### Secondary
- **Turquesa** (`turquesa`, oscuro) y **Turquesa honda** (`turquesa-honda`, claro): el color de lo que se escribe como código. Solo las etiquetas de laboratorio (`[ 01 / PROYECTOS ]`, `EXP-001`, `ERR-404`) y el «_» del logotipo (rol `--code`). En el claro es más honda para quedar en 5:1 sobre el coral claro del fondo.

### Neutral
- **Carbón** (`carbon`): `--bg` del oscuro, texto principal del claro y texto sobre relleno Coral en el oscuro. Un negro cálido, nunca gris azulado.
- **Carbón superficie** (`carbon-surface`): superficies elevadas por tono en el oscuro.
- **Hueso** (`hueso`): texto principal en el oscuro.
- **Papel** (`papel`): `--bg` del claro y texto sobre relleno Coral hondo.
- **Papel superficie** (`papel-surface`): superficies elevadas por tono en el claro.
- **Ceniza** (`ceniza`): texto secundario (`--muted`) en el oscuro.
- **Tierra** (`tierra`): texto secundario en el claro, un gris cálido derivado del carbón.
- **Línea** (derivada: `--fg` al 18 % sobre transparente): retícula y divisores. Es decorativa; nunca sirve como borde de un control.

### Fondo
- **Grafito** (`grafito`), **Musgo** (`musgo`) y **Humo** (`humo`): el gradiente del oscuro. Solo carbón y turquesa: nada cálido, porque con la luz «3d» del fondo animado los carbones cálidos se volvían brasa. El turquesa (Musgo) va en `color2` y el carbón neutro (Humo) en el centro (`color3`): el shader extrapola lejos del centro y, con el turquesa en el centro, aparecía su opuesto, un granate en las esquinas.
- **Blanco** (`blanco`), **Coral claro** (`coral-claro`) y **Papel**: el gradiente del claro. El coral se ve sin apagar el texto.

Cada tema tiene un fondo de gradiente (`src/lib/gradient.ts`, `--grad-1/2/3`) en una capa fija detrás de todo (`.gradient-bg`). En escritorio, ShaderGradient lo anima en WebGL con luz «3d», que respeta los colores (la luz de entorno los teñía). En móvil, con reduced-motion o sin WebGL, es un gradiente CSS estático con los mismos colores. Encima, en los dos casos, un grano fino de ruido SVG en mezcla `soft-light` (al 75 % en el oscuro, al 100 % en el claro), al estilo de shadergradient.co. La retícula va encima del fondo y el contenido encima de todo.

**The Ambient-Exception Rule.** El fondo es la única animación que no guía la lectura (constitución II 1.2.0). Nada más se mueve «porque sí», y todo el texto (`--fg`, `--muted`, `--code`) cumple AA sobre cualquier punto del fondo, grano incluido. El e2e lo mide en píxeles, en escritorio y en móvil, con umbrales que `tests/e2e/contrast.ts` calcula de los colores de texto: hoy, oscuro ≤ 0,068 de luminancia y claro ≥ 0,482.

**The Ground-Stays-Ground Rule.** Los colores del gradiente son fondo y no salen de ahí: ni relleno, ni texto. El brillo turquesa del oscuro es atmósfera, no un acento. Un azul saturado de agencia en un botón o un enlace sigue prohibido.

### Roles por tema

Los componentes nunca usan un color de tema directamente: usan los roles (`--bg`, `--surface`, `--fg`, `--muted`, `--accent`, `--on-accent`, `--code`, `--line`), que `src/styles/global.css` resuelve por `[data-theme]` y Tailwind expone como `bg-bg`, `text-fg`, `text-code`, `fill-accent`, etc.

| Rol | Oscuro | Claro |
|---|---|---|
| `--bg` | Carbón | Papel |
| `--surface` | Carbón superficie | Papel superficie |
| `--fg` | Hueso | Carbón |
| `--muted` | Ceniza | Tierra |
| `--accent` | Coral | Coral hondo |
| `--on-accent` | Carbón | Papel |
| `--code` | Turquesa | Turquesa honda |

### Named Rules

**The Señal Rule.** El coral es una señal: marca la acción principal, el estado activo o el punto de atención. Si en una pantalla hay más de un par de rellenos de coral compitiendo, uno sobra.

**The Fill-Not-Text Rule.** El coral es relleno, no texto: sobre el coral claro del fondo no llega a AA (3,3:1). `tests/unit/themes.test.ts` vigila los ratios de todos los roles.

**The Code-Only Rule.** El turquesa marca solo lo que se escribe como código: etiquetas de laboratorio y el «_» del logotipo. Ni enlaces, ni botones, ni fondos, ni brillo. Es turquesa, no verde Matrix: el cliché de terminal sigue prohibido.

**The Two-Theme Rule.** Toda pieza nueva se verifica en los dos temas antes de darse por terminada. Un componente que solo se ve bien en el oscuro está roto.

## Typography

**Display Font:** Space Grotesk Variable (con `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Space Grotesk Variable (misma familia)
**Label/Mono Font:** Monaspace Krypton, solo peso 400 (con `ui-monospace, monospace`)

**Character:** Una grotesca geométrica con rarezas (la «a», la «G») que en tamaño display se siente construida a mano, y Monaspace Krypton, una mono mecánica de trazo técnico, para las anotaciones del cuaderno. La grotesca habla; la mono numera, etiqueta y mide. Si alguna anotación necesita otro peso de Krypton, se importa solo ese peso (cada uno pesa ~43 KB).

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

La navegación pasa de una sola fila en escritorio (marca · enlaces · interruptor de tema e idioma) a dos filas en móvil, con los enlaces debajo y a todo el ancho. El footer pasa de una columna a tres desde 640 px (reloj · redes · crédito alineado a la derecha). Se diseña primero para el teléfono: es el dispositivo de la mayoría de las visitas.

**The Paper Rule.** La retícula es el papel, no el contenido: nunca lleva información, nunca compite en contraste con el texto y nunca se usa para alinear a la fuerza piezas que no la necesitan.

Las páginas usan una retícula de dos columnas desde 768 px (`.margin-grid`): una **columna de margen** de 11rem para anotaciones (etiquetas de sección, `EXP-001`, ficha del proyecto, «Volver») y la columna de contenido. Las secciones del inicio se separan con una línea de 1 px arriba y 64–96 px de aire vertical. En móvil la columna de margen desaparece y cada anotación cae **debajo** de su título.

**The Margin Rule.** Una etiqueta de laboratorio va al margen, a la altura de su título, nunca encima como antetítulo. Si no hay margen (móvil), va debajo.

## Elevation & Depth

Sistema plano. En reposo, la profundidad se construye por tono (`--bg` → `--surface`) y por líneas de 1 px, nunca con sombra. La sombra existe solo como respuesta a un estado: un objeto que el visitante está moviendo o que se separa del papel por interacción (por ejemplo, la imagen que sigue al cursor en la vista lista de proyectos). El sistema tiene una única sombra y no se crean otras.

### Shadow Vocabulary
- **Objeto en estado** (`box-shadow: 0 1.25rem 2.5rem -0.75rem rgb(0 0 0 / 0.45)`): solo para lo que el puntero levanta del papel. Hoy, la imagen flotante de Proyectos (`.project-float`). Separa la portada del fondo aunque compartan color (la portada 001 sobre el tema oscuro).

**The Flat-At-Rest Rule.** Ninguna superficie tiene sombra en reposo. Si una tarjeta necesita sombra para separarse del fondo, le falta contraste de tono, no sombra.

## Shapes

Esquinas rectas (0 px) en botones, tarjetas, campos, imágenes y contenedores. El círculo (`9999px`) queda reservado para puntos o indicadores de estado (por ejemplo, la etiqueta de disponibilidad). Los bordes son de 1 px en el color Línea para divisores; un control interactivo que necesite borde usa `--fg`, porque Línea no cumple contraste de componente.

**The Square Rule.** Si tiene esquina, la esquina es recta. El único círculo legítimo es el que representa un estado.

## Components

Filosofía: **sólido + fino**. El CTA principal es un bloque sólido y táctil (relleno de acento, peso visual, magnético en escritorio); todo lo demás es fino y técnico: texto mono, líneas de 1 px, estados claros.

### Buttons
- **Shape:** esquina recta (0 px).
- **Primary (`[data-magnetic]`: el CTA «Hablemos» del hero e «Ir al inicio» de la 404):** relleno `--accent`, texto `--on-accent` en Space Grotesk 700 `text-lg`, 24×16 px de relleno y una flecha SVG. Es el único bloque sólido de su pantalla. Con puntero fino es magnético: sigue al puntero el 30 % de la distancia a su centro y vuelve al salir; sin JS o con movimiento reducido es un botón normal.
- **Secundario / fantasma:** sin relleno, texto `--fg` en mono mayúscula, subrayado o borde de 1 px en `--fg` al interactuar.
- **Hover / Focus:** el foco usa el contorno global (2 px `--fg`, separación 3 px). El hover nunca es la única señal de que algo es interactivo.

### Logotipo «Cursor» (componente firma)
- **Forma:** `[Λ]NKORDEV_` en versales construidas a mano sobre una retícula (`src/components/Logo.astro`), sin fuente: los corchetes de la marca, la A sin travesaño con un **cursor de bloque** en su lugar y un **«_»** al final, como una línea de terminal esperando la siguiente orden. Esquinas a 45° en los contornos de O, R y D, como el resto del sistema anguloso.
- **Color por rol:** letras en `currentColor` (`--fg`), cursor en `--accent` y «_» en `--code`, así cambia solo con el tema.
- **Tamaño:** 22 px de alto en el menú (`1.375rem`); el ancho sale del `viewBox`. No baja de ese alto.
- **Accesibilidad:** el SVG es decorativo (`aria-hidden`); el nombre lo da el texto oculto del enlace («[A]nkordev — Inicio»). El nombre de la marca se sigue escribiendo «[A]nkordev» en títulos y textos.
- **Favicon** (`public/favicon.svg`): el monograma `[Λ]` con su cursor sobre un cuadrado Carbón, esquinas rectas. Lleva los colores del oscuro escritos directamente: un favicon no lee las variables CSS de la página.

### Navigation
- **Estilo:** logotipo a la izquierda (enlace al inicio, con 38 px de área táctil); enlaces en mono mayúscula con su número en `--muted` (`01 Proyectos`, `02 Servicios`…). El número es el de la etiqueta de su sección (`sectionNumber`): como Proceso no va en el menú, salta del 02 al 04.
- **Estados:** hover con subrayado; foco con el contorno global. El cambio de idioma es una etiqueta mono (`EN` / `ES`) con nombre accesible completo.
- **Móvil:** los enlaces bajan a una segunda fila a todo el ancho y se reparten con `flex-wrap`.

### Theme Toggle
- **Forma:** interruptor claro/oscuro con el lenguaje del control de vista: dos botones cuadrados de 32 px (sol a la izquierda, luna a la derecha) con iconos SVG de 16 px y trazo de 1,5 px, dentro de un borde de 1 px en `--fg` y separados por una línea de 1 px en `--fg`.
- **Estado activo:** invertido (`--fg` de fondo, `--bg` de icono) y `aria-pressed="true"`. Cada botón tiene nombre accesible («Claro», «Oscuro») y `title`; el grupo se llama «Tema».
- **Sin JS:** el grupo nace oculto (`hidden`) y el script lo muestra; no se ofrece un control que no puede funcionar.

### Skip Link
- Relleno `--accent`, texto `--on-accent`, esquina recta, fijo arriba a la izquierda cuando recibe foco. Es la única pieza sólida del chrome.

### Footer Clock (componente firma)
- Etiqueta mono «Hora en Caracas» en `--muted` y hora en tamaño `text-base` con `tabular-nums` y sufijo `UTC−4`. Sin JS muestra la hora del build; con JS se actualiza cada segundo.

### Project Rows (componente firma)
- **Lista (por defecto, y la única sin JS):** filas a todo el ancho separadas por líneas de 1 px; número `001` en la columna de margen, título en Space Grotesk 700 `text-3xl` (`text-2xl` en móvil), metadatos mono debajo (tipo · origen · estado), año y flecha SVG a la derecha. Toda la fila es el enlace; hover y foco subrayan el título (2 px). No descarga portadas.
- **Cuadrícula:** el mismo HTML con `data-view="grid"`: tarjetas sin sombra, portada 16:10 arriba con una línea de 1 px en `--line` (la separa del fondo cuando comparten color), número, título `text-xl` y metadatos.
- **Imagen flotante:** en la lista, con puntero fino y movimiento, la portada del proyecto bajo el puntero lo sigue a su derecha (22rem, 16:10) con la única sombra del sistema. Decorativa (`aria-hidden`).

### Availability Label
- Junto al CTA del hero: un punto de 8 px en `--accent` (el círculo de estado, The Square Rule) y «Disponible para proyectos» en mono mayúscula `--fg`. Estático: no late ni parpadea.

### Package Rows (Servicios)
- El lenguaje de las filas de proyecto, sin enlace: alcance y plazo apilados en la columna de margen (mono, la primera línea en la línea base del nombre), nombre en Space Grotesk 700 `text-3xl` (`text-2xl` en móvil), descripción en `--muted` y «Desde» + precio a la derecha, en `text-3xl` con `tabular-nums`. En móvil todo se apila y el alcance y el plazo van en una línea bajo el nombre. Nota de precios en mono debajo.

### Process Line
- Cuatro pasos (en columna en móvil, cuatro columnas desde 64rem) unidos por una línea de 1 px: riel en `--line`, avance en `--fg` y una marca cuadrada de 9 px en `--fg` por paso. La línea va de la primera marca a la última. Con movimiento, el avance se dibuja ligado al scroll (`--progress` → `scaleY`/`scaleX` de cada tramo); sin JS o con reduced-motion se ve entera. Número del paso en mono `--muted`, nombre `text-xl` 700 y texto en `--muted`.

### Portrait (Sobre mí)
- Foto cuadrada de 20rem como máximo, esquinas rectas y contorno de 1 px en `--line`, con la etiqueta `FIG-01` debajo. A la derecha del texto desde 64rem; encima en móvil. La frase de entrada va en `text-2xl` 500; stack y redes, en mono mayúscula separados por «/» en `--muted`.

### Contact Rows
- Filas a todo el ancho, como las de proyecto: etiqueta mono (`WhatsApp`, `Email`) a la izquierda, dato en Space Grotesk 700 `text-2xl` (`text-xl` en móvil) y flecha. Toda la fila es el enlace; hover y foco subrayan el dato. Un canal sin dato en `src/lib/site.ts` no se muestra.

### Lab Labels
- Etiquetas de laboratorio (`src/components/LabLabel.astro`): `[ 01 / PROYECTOS ]`, `EXP-001`, `ERR-404`, `FIG-01`. Mono mayúscula en `--code`, en la columna de margen a la altura de su título. Decorativas (`aria-hidden`): su información ya está en el título cercano. Hacen un scramble breve al aparecer. Son el único texto en turquesa; los demás metadatos (números de fila, año, ficha) van en `--muted`.

### Portadas provisionales
- Mientras no hay capturas reales (T30), cada proyecto lleva una portada 1600×1000 con el lenguaje del cuaderno: retícula de 64 px, etiqueta `EXP-00X`, punto de estado y el número en Monaspace Krypton 800. Alternan Carbón con punto Coral (impares) y Coral con Carbón (pares). Si cambia la paleta, se regeneran con ella.

### View Controls
- Dos botones mono en mayúscula dentro de un borde de 1 px en `--fg`, con icono SVG de 14 px; el activo va invertido (`--fg` de fondo, `--bg` de texto) y lleva `aria-pressed`. Ocultos sin JS. Van al final de la fila del título de la sección, o debajo de su etiqueta en móvil.

### Lab Cursor
- Anillo de 44 px con borde de 1 px en `--fg` que acompaña al cursor del sistema (no lo oculta), reducido al 35 % en reposo y a tamaño completo sobre lo interactivo. Solo con puntero fino y movimiento; decorativo.

### Movimiento
Un solo momento de autor por página: la entrada del titular (`[data-split]`), letras desde abajo con máscara y de `blur(6px)` a nítido en 0,6 s, `expo.out`. Los títulos de sección (`[data-reveal]`) se revelan por líneas al entrar en pantalla, más sobrios (`blur(4px)`). Las etiquetas (`[data-scramble]`) hacen un scramble breve. El scroll es suave en escritorio y nativo en táctil; los enlaces a secciones saltan sin animación (los resuelve el ClientRouter, no Lenis). Las páginas cambian con View Transitions. La línea del proceso se dibuja con el scroll. Con reduced-motion no se descarga GSAP ni hay ninguna animación, ni siquiera el fundido entre páginas.

## Do's and Don'ts

### Do:
- **Do** usar siempre los roles (`--bg`, `--fg`, `--accent`, `--on-accent`…) y nunca un hex de tema directamente en un componente.
- **Do** verificar cada pieza nueva en los dos temas y con `prefers-reduced-motion: reduce`.
- **Do** poner numeración, etiquetas, fechas y metadatos en Monaspace Krypton mayúscula con tracking 0.05em.
- **Do** mantener las esquinas rectas (0 px) y reservar el círculo para indicadores de estado.
- **Do** separar zonas con línea de 1 px o cambio de tono `--bg` → `--surface`.
- **Do** animar solo `transform` y `opacity`, y solo para guiar la lectura o confirmar una acción.

### Don't:
- **Don't** construir con la estética de plantilla SaaS: gradientes morados, tarjetas con sombra suave, iconos de stock, «hero + 3 features».
- **Don't** añadir ruido de efectos: animación porque sí, glitch constante, cosas que se mueven sin guiar la lectura. El fondo de gradiente es la única excepción ambiental.
- **Don't** caer en lo corporativo frío: fotos de stock de oficina, azul de agencia, tono de agencia grande.
- **Don't** usar el cliché cyberpunk: verde Matrix, glow neón, terminal falsa. El cursor y el «_» del logotipo son la única referencia a la terminal, y el turquesa no brilla.
- **Don't** usar el coral como texto ni el turquesa fuera de las etiquetas de laboratorio y el logotipo.
- **Don't** poner sombra a una superficie en reposo.
- **Don't** usar el color Línea como borde de un control interactivo.
