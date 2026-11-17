---
title: 'Molienda: specialty coffee shop'
number: '001'
type: negocio
year: 2026
status: publicado
origin: propio
stack: [Astro, TypeScript, Tailwind CSS, GSAP, Lenis, Cloudflare Workers, Vitest, Playwright]
cover: ../../../assets/projects/001-restaurante/cover.webp
coverAlt: Molienda's home page at night, with the headline «La finca queda aquí arriba», the illustrated house with its windows lit, the «Abierto» plaque on the door and a chalkboard with three coffees and their prices
gallery:
  - src: ../../../assets/projects/001-restaurante/cerrado.webp
    alt: The same façade with the café closed, the windows dark and the door plaque reading «Cerrado, mañana, 7 a. m.»
  - src: ../../../assets/projects/001-restaurante/panel.webp
    alt: The sections panel open on the right, with five colour blocks from light to dark, from Carta to Visítanos
  - src: ../../../assets/projects/001-restaurante/carta.webp
    alt: The menu in three columns, coffee, bakery and brunch, with a photo, the price in dollars and the farm each coffee comes from
  - src: ../../../assets/projects/001-restaurante/para-llevar.webp
    alt: The takeaway section with the product list and its quantity buttons, and the ticket with four products and a 12-dollar total
liveUrl: https://molienda-cafe.ankordev.workers.dev
repoUrl: https://github.com/RomPirsZ/molienda-cafe
summary: The website of a fictional specialty coffee shop in Mérida, Venezuela. The illustrated façade shows live whether it is open, the menu carries prices and origins, and the takeaway order is built on screen. A self-initiated concept.
lang: en
---

## Problem

Many neighbourhood cafés post their menu as a photo on social media. It is hard to read on a phone, it doesn't say whether the place is open, and to find out a price you have to send a message and wait.

I wanted to answer what someone about to go needs: what they serve, what it costs, whether it is open now and where it is. And I wanted those answers to take seconds on a phone, on a limited data plan.

## Solution

Molienda is a fictional café in Mérida that works with beans from Andean farms. Prices, farms and opening hours are samples, and the notice says so up front. The page has four pieces:

**The façade tells the truth.** The first screen is the house at night, drawn for this café. Using Mérida's local time, the windows light up or go dark, and the door plaque says «Abierto» or, when closed, when it opens. In front stands a sidewalk chalkboard with three coffees and their prices.

**Sections panel.** A button slides in five colour blocks from the right, light to dark, leading to the menu, the single-origin coffees, the takeaway order, the opening hours and the area.

**The full menu**, with a photo, the price and each coffee's farm, region and altitude.

**Takeaway.** You pick products and build a ticket on screen to show at the counter. It is a demo: nothing is sent and no data is stored.

Without JavaScript everything still reads: the menu, the full opening hours and the footer navigation.

## Technical decisions

**Static Astro on Cloudflare Workers.** There is no server and there are no secrets. The CSP only allows the site itself, and a test checks the hash of the one inline script.

**The illustration is code.** It is a hand-built SVG, inlined so it doesn't delay the first paint, coloured with the design system's tokens. The lights change colour with the opening state, and the plaque and the chalkboard are HTML text: they can be read, translated and they scale with the drawing.

**The panel follows your thumb.** It is a `<dialog>` with scroll snapping: the browser handles the gesture and the backdrop darkens with the scroll position. It closes with Esc, with its button or by tapping outside, and focus returns to the button.

**The ticket adds up.** Pure functions with tests written first: sums in cents, a per-product limit, and a total announced to screen readers. On phones, a sticky bar shows the total while you choose.

**Motion that doesn't block.** The windows light up on load and the menu and photos come in as you scroll. Each animation is set up in its own task so loading isn't held back. With reduced motion, nothing moves.

## Result

Live on Cloudflare Workers, deployed on every change, with CI running tests, Lighthouse and a dependency audit.

Mobile Lighthouse, median of 5 runs: 98 for performance and 100 for accessibility, best practices and SEO.

92 unit tests and 80 end-to-end tests on mobile and desktop, with axe.
