---
title: 'Molienda: café de especialidad'
number: '001'
type: negocio
year: 2026
status: publicado
origin: propio
stack: [Astro, TypeScript, Tailwind CSS, GSAP, Lenis, Cloudflare Workers, Vitest, Playwright]
cover: ../../../assets/projects/001-restaurante/cover.webp
coverAlt: Inicio de Molienda de noche, con el titular «La finca queda aquí arriba», la casona ilustrada con las ventanas encendidas, la placa «Abierto» en el portón y una pizarra con tres cafés y su precio
gallery:
  - src: ../../../assets/projects/001-restaurante/cerrado.webp
    alt: La misma fachada con el café cerrado, las ventanas apagadas y la placa del portón que dice «Cerrado, mañana, 7 a. m.»
  - src: ../../../assets/projects/001-restaurante/panel.webp
    alt: Panel de secciones abierto a la derecha, con cinco bloques de color de claro a oscuro, de Carta a Visítanos
  - src: ../../../assets/projects/001-restaurante/carta.webp
    alt: Carta en tres columnas, café, panadería y brunch, con foto, precio en dólares y la finca de origen de cada café
  - src: ../../../assets/projects/001-restaurante/para-llevar.webp
    alt: Sección Para llevar con la lista de productos y sus botones de cantidad, y el ticket con cuatro productos y un total de 12 dólares
liveUrl: https://molienda-cafe.ankordev.workers.dev
repoUrl: https://github.com/RomPirsZ/molienda-cafe
summary: La web de un café de especialidad ficticio en Mérida. La fachada ilustrada dice en vivo si está abierto, la carta lleva precios y procedencia, y el pedido para llevar se arma en pantalla. Concepto propio.
lang: es
---

## Problema

Muchos cafés de barrio publican la carta como una foto en redes. En el móvil no se lee bien, no dice si el local está abierto y para saber un precio hay que escribir y esperar.

Quería resolver lo que busca quien va a ir: qué sirven, cuánto cuesta, si está abierto ahora y dónde queda. Y quería que se resolviera en segundos desde el teléfono, con datos móviles limitados.

## Solución

Molienda es un café ficticio de Mérida que trabaja con grano de fincas andinas. Los precios, las fincas y el horario son de ejemplo, y el aviso está a la vista. La página tiene cuatro piezas:

**La fachada dice la verdad.** El primer viewport es la casona de noche, dibujada para este café. Con la hora de Mérida, las ventanas se encienden o se apagan, y la placa del portón dice «Abierto» o, si está cerrado, cuándo abre. Delante, una pizarra de acera con tres cafés y su precio.

**Panel de secciones.** Un botón despliega desde la derecha cinco bloques de color, de claro a oscuro, que llevan a la carta, los cafés de origen, el pedido para llevar, el horario y la zona.

**Carta completa**, con foto, precio y la finca, región y altitud de cada café.

**Para llevar.** Se eligen productos y se arma un ticket en pantalla para enseñarlo en la barra. Es una demostración: no se envía nada ni se guardan datos.

Sin JavaScript se lee todo: la carta, el horario completo y la navegación del pie.

## Decisiones técnicas

**Astro estático en Cloudflare Workers.** No hay servidor ni secretos. La CSP solo admite el propio sitio, y un test comprueba el hash del único script en línea.

**La ilustración es código.** Es un SVG propio, en línea para no retrasar la primera pintura, pintado con los colores del sistema. Las luces cambian de color según el estado de apertura, y la placa y la pizarra son texto HTML: se leen, se traducen y escalan con el dibujo.

**El panel se arrastra con el dedo.** Es un `<dialog>` con scroll-snap: el gesto lo resuelve el navegador y el fondo se oscurece ligado al desplazamiento. Se cierra con Esc, con el botón o tocando fuera, y el foco vuelve al botón.

**El ticket no se equivoca.** Funciones puras con tests escritos antes: suma en céntimos, tope por producto, y un total que se anuncia a los lectores de pantalla. En el móvil, una barra fija muestra el total mientras se elige.

**Movimiento que no bloquea.** Las ventanas se encienden al cargar y la carta y las fotos entran al bajar. Cada animación se prepara en su propia tarea para no frenar la carga. Con movimiento reducido no se mueve nada.

## Resultado

En línea en Cloudflare Workers, con un despliegue en cada cambio y la CI con tests, Lighthouse y auditoría de dependencias.

Lighthouse móvil, mediana de 5 pasadas: 98 de rendimiento y 100 en accesibilidad, buenas prácticas y SEO.

92 tests unitarios y 80 de extremo a extremo en móvil y escritorio, con axe.
