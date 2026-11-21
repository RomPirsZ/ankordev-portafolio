---
title: 'Navaja del Puerto: reservas de barbería'
number: '003'
type: app
year: 2026
status: publicado
origin: propio
stack: [Astro, React, TypeScript, Tailwind CSS, Anime.js, Cloudflare Workers, Vitest, Playwright]
cover: ../../../assets/projects/003-reservas/cover.webp
coverAlt: Inicio de Navaja del Puerto sobre fondo carbón, con el titular «Corte moderno, navaja de siempre» y el botón rojo «Reservar turno», el retrato de un barbero delante de la palabra «NAVAJA» fundida en un resplandor rojo, una navaja abierta al fondo y, abajo, tres servicios y el estado del local
gallery:
  - src: ../../../assets/projects/003-reservas/servicios.webp
    alt: La lista de Servicios con «Afeitado con navaja» señalado, la fila en carbón con «Reservar →» en rojo y, al lado, la foto del afeitado
  - src: ../../../assets/projects/003-reservas/reserva.webp
    alt: La reserva en el paso de la hora, con las horas libres a la izquierda y, a la derecha, la etiqueta del disco con Corte y barba, Leo y el martes 24 de noviembre
  - src: ../../../assets/projects/003-reservas/comprobante.webp
    alt: Turno confirmado con su código, el resumen, los botones para añadirlo al calendario o copiarlo y la etiqueta del disco sellada con el mismo código
  - src: ../../../assets/projects/003-reservas/ritual.webp
    alt: Primera pantalla del ritual del afeitado, con la palabra «TOALLA» sobre una cinta carbón y unas manos que sostienen una toalla caliente con vapor
liveUrl: https://navaja-del-puerto.ankordev.workers.dev
repoUrl: https://github.com/RomPirsZ/navaja-del-puerto
summary: La app de reservas de una barbería ficticia en Puerto Cabello. Se elige servicio, barbero, día y hora, y una ficha roja se va rellenando hasta sellar el turno. Concepto propio, sin backend.
lang: es
---

## Problema

En muchas barberías de barrio el turno se pide por WhatsApp o esperando en el local. El cliente escribe y espera respuesta, y el barbero contesta entre corte y corte.

Quería mostrar cómo sería reservar desde el teléfono en menos de un minuto: elegir el servicio y con quién, ver solo las horas que de verdad quedan libres y salir con un comprobante.

## Solución

Navaja del Puerto es una barbería ficticia de Puerto Cabello, en carbón, hueso y rojo de barbería. Los precios, el horario y los barberos son de ejemplo, y el pie de la página lo dice. Tiene cuatro piezas:

**El hero.** Ocupa todo el ancho en cualquier pantalla: el titular y el botón de reserva arriba, un barbero delante de la palabra «NAVAJA», que se funde en un resplandor rojo, y abajo tres servicios y si el local está abierto.

**Servicios.** Una lista con la duración y el precio de cada uno. En pantallas anchas, al señalar uno su foto entra en el panel de al lado; al pulsarlo, la reserva se abre con ese servicio ya elegido.

**La reserva.** Servicio, barbero o «el primero libre», día, hora y nombre. Mientras se elige, una ficha roja con forma de etiqueta de disco se va rellenando, y al confirmar gira un cuarto de vuelta y queda sellada con el código del turno. Desde el comprobante se añade al calendario, se comparte y, en «Tus turnos», se cancela.

**El horario en vivo.** Con la hora de Puerto Cabello, la página dice si está abierto y hasta cuándo, o cuándo abre.

Es una demostración: no hay servidor, el turno se guarda solo en ese navegador y la página lo dice. Las fotos las generé con IA y el pie lo indica.

## Decisiones técnicas

**Astro con una sola isla de React.** Solo la reserva usa React, y se carga al acercarse a la vista. El resto es HTML estático: sin JavaScript se leen los servicios, los barberos y el horario, y la reserva explica por qué no funciona.

**Una API simulada con la forma de una real.** Vuelve a validar todo antes de confirmar y relee lo guardado, así que detecta un turno reservado en otra pestaña. Si la hora se ocupó, ofrece las tres libres más cercanas. Conectar un backend de verdad solo cambiaría ese módulo.

**Las reglas, con tests escritos antes.** La hora de Puerto Cabello sale de `Intl` con la zona por su nombre, sin librerías de fechas. Los huecos respetan el almuerzo, el cierre, los días de cada barbero y los servicios de 60 minutos, que necesitan dos huecos seguidos. La agenda simulada es determinista: el mismo día da siempre las mismas horas ocupadas.

**Un flujo que se usa con teclado y lector de pantalla.** Cada elección es un botón, para que las flechas no hagan avanzar el paso por accidente. El foco va al título de cada paso nuevo, una región en vivo anuncia las horas libres y la confirmación, y los errores aparecen junto a su campo.

**Movimiento donde aporta.** Anime.js hace entrar «NAVAJA» letra a letra, conservando una copia legible para lectores de pantalla. Los barridos y la etiqueta que se sella son CSS. Con movimiento reducido no se mueve nada, y la CSP solo admite el propio sitio.

## Resultado

En línea en Cloudflare Workers, con un despliegue en cada cambio y la CI con tests y auditoría de dependencias.

Lighthouse móvil sobre la URL publicada: 97–99 de rendimiento y 100 en accesibilidad, buenas prácticas y SEO.

119 tests unitarios y 80 de extremo a extremo en móvil y escritorio, con axe en cada paso de la reserva.
