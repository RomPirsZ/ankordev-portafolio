---
title: 'Don Pascal: tienda online'
number: '002'
type: tienda
year: 2026
status: publicado
origin: propio
stack: [Astro, TypeScript, Tailwind CSS, Cloudflare Workers, Supabase, Claude (Anthropic), Turnstile, Vitest, Playwright]
cover: ../../../assets/projects/002-tienda/cover.webp
coverAlt: Inicio de Don Pascal sobre fondo verde, con el titular «Repostería y víveres al mayor y al detal», el buscador y la ilustración del tendero con los brazos cruzados
gallery:
  - src: ../../../assets/projects/002-tienda/catalogo.webp
    alt: Catálogo filtrado por repostería, con el buscador, las categorías y tarjetas de producto con el precio en dólares y en bolívares
  - src: ../../../assets/projects/002-tienda/ficha.webp
    alt: Ficha de la harina de trigo leudante con su precio, el aviso de precio al mayor desde 10 unidades y el botón para añadirla al carrito
  - src: ../../../assets/projects/002-tienda/carrito.webp
    alt: Carrito abierto con cuatro productos, sus cantidades, el total en dólares y bolívares y el botón para copiar el pedido
  - src: ../../../assets/projects/002-tienda/chat.webp
    alt: Chat «Pregúntale a Don Pascal» abierto, con el aviso de que responde una IA, el saludo y tres preguntas de ejemplo
liveUrl: https://don-pascal.ankordev.workers.dev
repoUrl: https://github.com/RomPirsZ/don-pascal-tienda
summary: Catálogo con precios en dólares y bolívares, un carrito que termina en un pedido por WhatsApp y un asistente con IA que solo responde con datos de la tienda. Concepto propio para un mercado ficticio de Guanare.
lang: es
---

## Problema

En Guanare muchos comercios venden por WhatsApp. El cliente pregunta si hay un producto, cuánto cuesta en dólares y en bolívares y cómo pedir, y alguien de la tienda contesta lo mismo a cada uno. Los precios cambian con la tasa, y una cifra mal copiada termina en un reclamo.

Quería resolver ese recorrido completo para un comercio que vende al mayor y al detal, sin quitarle el WhatsApp, que es donde ya compran sus clientes.

## Solución

Don Pascal es un mercado y repostería ficticio: los precios son de ejemplo y el aviso está a la vista. La tienda tiene tres partes:

**Catálogo para el móvil**, con buscador, filtros por categoría y cada precio en $ y en Bs, calculado con la tasa guardada en la base de datos.

**Carrito** que arma el pedido con cantidades, subtotales, total y tasa, y lo envía por WhatsApp con un toque. El precio al mayor se aplica solo al llegar al mínimo.

**«Pregúntale a Don Pascal»**, un asistente con IA que busca productos, suma una lista y explica cómo pedir. Solo puede dar precios que acaba de consultar en la base de datos.

Sin JavaScript se sigue viendo el catálogo completo, se busca y se pide por WhatsApp.

## Decisiones técnicas

**Astro sobre Cloudflare Workers.** Las páginas con precios se generan en cada petición para mostrar siempre el vigente. Supabase guarda el catálogo con RLS: el rol público solo lee.

**El asistente no inventa cifras.** Usa Claude con cuatro herramientas de solo lectura. Antes de enviar una respuesta, el servidor comprueba que cada cifra con moneda, cada porcentaje y cada decimal salió de esas herramientas en la misma petición y con la misma moneda. Si alguno no salió de ahí, la respuesta se cambia por un aviso que remite a WhatsApp, también cuando el historial viene manipulado o el mensaje intenta dar órdenes al asistente.

**Gasto con límites.** Turnstile, 5 preguntas por minuto y por IP, un tope diario de respuestas y, al activar la API, un tope mensual en la consola de Anthropic.

**Movimiento con propósito.** El tendero llega al cargar, las secciones aparecen al bajar y el carrito y el chat se deslizan. Con movimiento reducido no se mueve nada, y el texto principal se ve desde el primer momento para no retrasar la carga.

## Resultado

En línea en Cloudflare Workers, con un despliegue en cada cambio.

Lighthouse móvil: 100, 96 y 99 de rendimiento en el inicio, el catálogo y la ficha, y 100 en accesibilidad, buenas prácticas y SEO.

283 tests unitarios y de integración, y 95 de extremo a extremo en móvil y escritorio, con axe.

Pendiente: en la demo el asistente todavía no responde (falta activar la API) y remite a WhatsApp. La batería de preguntas trampa contra la API real ya está escrita. El canal de WhatsApp quedó para una segunda fase.
