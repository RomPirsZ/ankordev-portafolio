---
title: 'Don Pascal: online store'
number: '002'
type: tienda
year: 2026
status: publicado
origin: propio
stack: [Astro, TypeScript, Tailwind CSS, Cloudflare Workers, Supabase, Claude (Anthropic), Turnstile, Vitest, Playwright]
cover: ../../../assets/projects/002-tienda/cover.webp
coverAlt: Don Pascal home page on a green background, with the headline «Repostería y víveres al mayor y al detal», the search bar and the illustrated shopkeeper with his arms crossed
gallery:
  - src: ../../../assets/projects/002-tienda/catalogo.webp
    alt: Catalogue filtered by baking supplies, with the search bar, the categories and product cards priced in dollars and bolívars
  - src: ../../../assets/projects/002-tienda/ficha.webp
    alt: Product page for self-raising flour with its price, the wholesale price from 10 units and the add-to-cart button
  - src: ../../../assets/projects/002-tienda/carrito.webp
    alt: Open cart with four products, their quantities, the total in dollars and bolívars and the button to copy the order
  - src: ../../../assets/projects/002-tienda/chat.webp
    alt: The «Pregúntale a Don Pascal» chat open, with the notice that an AI answers, the greeting and three sample questions
liveUrl: https://don-pascal.ankordev.workers.dev
repoUrl: https://github.com/RomPirsZ/don-pascal-tienda
summary: A catalogue priced in dollars and bolívars, a cart that ends in a WhatsApp order and an AI assistant that only answers with the store's own data. A self-initiated concept for a fictional market in Guanare, Venezuela.
lang: en
---

## Problem

In Guanare, many shops sell over WhatsApp. Customers ask whether a product is in stock, what it costs in dollars and in bolívars and how to order, and someone at the shop answers the same questions one by one. Prices move with the exchange rate, and one badly copied figure turns into a complaint.

I wanted to solve that whole journey for a shop that sells wholesale and retail, without taking WhatsApp away, since that is where its customers already buy.

## Solution

Don Pascal is a fictional market and bakery-supply shop: the prices are samples and the notice says so up front. The store has three parts:

**A mobile-first catalogue**, with search, category filters and every price in $ and Bs, calculated with the rate stored in the database.

**A cart** that builds the order with quantities, subtotals, total and rate, and sends it over WhatsApp with one tap. The wholesale price applies only once the minimum is reached.

**«Pregúntale a Don Pascal»**, an AI assistant that finds products, totals a list and explains how to order. It can only quote prices it has just looked up in the database.

Without JavaScript, the full catalogue still loads, search works and every product can be ordered over WhatsApp.

## Technical decisions

**Astro on Cloudflare Workers.** Pages with prices are rendered on each request so they always show the current one. Supabase stores the catalogue behind RLS: the public role can only read.

**The assistant does not make up figures.** It uses Claude with four read-only tools. Before a reply goes out, the server checks that every figure with a currency, every percentage and every decimal came from those tools in the same request and in the same currency. If one did not, the reply is replaced with a notice that points to WhatsApp, including when the history has been tampered with or a message tries to give the assistant orders.

**Spending has limits.** Turnstile, 5 questions per minute per IP, a daily cap on replies and, once the API is switched on, a monthly cap in the Anthropic console.

**Motion with a purpose.** The shopkeeper arrives on load, sections appear on scroll and the cart and chat slide in. With reduced motion nothing moves, and the main text shows from the first frame so loading is not delayed.

## Result

Live on Cloudflare Workers, deployed on every change.

Mobile Lighthouse: 100, 96 and 99 for performance on the home page, catalogue and product page, and 100 for accessibility, best practices and SEO.

283 unit and integration tests, and 95 end-to-end tests on mobile and desktop, including axe.

Still open: in the demo the assistant does not answer yet (the API is not switched on) and points to WhatsApp instead. The battery of trick questions against the real API is already written. The WhatsApp channel is planned for a second phase.
