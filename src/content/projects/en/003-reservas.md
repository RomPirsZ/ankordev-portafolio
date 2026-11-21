---
title: 'Navaja del Puerto: barbershop booking'
number: '003'
type: app
year: 2026
status: publicado
origin: propio
stack: [Astro, React, TypeScript, Tailwind CSS, Anime.js, Cloudflare Workers, Vitest, Playwright]
cover: ../../../assets/projects/003-reservas/cover.webp
coverAlt: Navaja del Puerto home page on a charcoal ground, with the headline «Corte moderno, navaja de siempre» and the red «Reservar turno» button, a barber's portrait in front of the word «NAVAJA» fading into a red glow, an open razor in the background and, at the foot, three services and whether the shop is open
gallery:
  - src: ../../../assets/projects/003-reservas/servicios.webp
    alt: The Services list with «Afeitado con navaja» pointed at, the row turned charcoal with «Reservar →» in red and, beside it, the shave photo
  - src: ../../../assets/projects/003-reservas/reserva.webp
    alt: The booking at the time step, with the free times on the left and, on the right, the record label filled in with Corte y barba, Leo and Tuesday 24 November
  - src: ../../../assets/projects/003-reservas/comprobante.webp
    alt: Booking confirmed with its code, the summary, the buttons to add it to a calendar or copy it, and the record label sealed with the same code
  - src: ../../../assets/projects/003-reservas/ritual.webp
    alt: First screen of the shaving ritual, with the word «TOALLA» on a charcoal strip and hands holding a steaming hot towel
liveUrl: https://navaja-del-puerto.ankordev.workers.dev
repoUrl: https://github.com/RomPirsZ/navaja-del-puerto
summary: The booking app of a fictional barbershop in Puerto Cabello, Venezuela. You pick the service, the barber, the day and the time, and a red ticket fills in until the booking is sealed. A self-initiated concept with no backend.
lang: en
---

## Problem

At many neighbourhood barbershops you book by WhatsApp or by waiting your turn in the shop. The customer writes and waits for a reply, and the barber answers between cuts.

I wanted to show what booking from a phone in under a minute could look like: pick the service and the barber, see only the times that are really free, and leave with a receipt.

## Solution

Navaja del Puerto is a fictional barbershop in Puerto Cabello, in charcoal, bone and barber red. Prices, opening hours and barbers are samples, and the page footer says so. It has four pieces:

**The hero.** It spans the full width on any screen: the headline and the booking button at the top, a barber in front of the word «NAVAJA», which fades into a red glow, and at the foot three services and whether the shop is open.

**Services.** A list with each one's length and price. On wide screens, pointing at one brings its photo into the panel beside it; selecting it opens the booking with that service already chosen.

**The booking.** Service, barber or «first one free», day, time and name. As you choose, a red ticket shaped like a record label fills in, and when you confirm it turns a quarter of a turn and is sealed with the booking code. From the receipt you can add it to your calendar, share it and, under «Tus turnos», cancel it.

**Live opening hours.** Using Puerto Cabello's local time, the page says whether it is open and until when, or when it opens.

It is a demo: there is no server, the booking is stored only in that browser, and the page says so. I generated the photos with AI, and the footer says that too.

## Technical decisions

**Astro with a single React island.** Only the booking uses React, and it loads as it nears the screen. The rest is static HTML: without JavaScript you can still read the services, the barbers and the opening hours, and the booking explains why it doesn't run.

**A simulated API shaped like a real one.** It validates everything again before confirming and re-reads what is stored, so it catches a booking made in another tab. If the time was taken, it offers the three nearest free ones. Plugging in a real backend would only change that module.

**The rules, with tests written first.** Puerto Cabello's time comes from `Intl` with the zone named by its IANA id, with no date library. The slots respect lunch, closing time, each barber's days and the 60-minute services that need two slots in a row. The simulated agenda is deterministic: the same day always shows the same taken times.

**A flow that works with a keyboard and a screen reader.** Every choice is a button, so arrow keys never move the step on by accident. Focus goes to the heading of each new step, a live region announces the free times and the confirmation, and errors sit next to their field.

**Motion where it helps.** Anime.js brings «NAVAJA» in letter by letter while keeping a readable copy for screen readers. The wipes and the sealed label are CSS. With reduced motion nothing moves, and the CSP only allows the site itself.

## Result

Live on Cloudflare Workers, deployed on every change, with CI running tests and a dependency audit.

Mobile Lighthouse on the published URL: 97–99 for performance and 100 for accessibility, best practices and SEO.

119 unit tests and 80 end-to-end tests on mobile and desktop, with axe at every booking step.
