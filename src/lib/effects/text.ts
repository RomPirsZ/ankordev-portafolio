// Movimiento de texto (spec §7, T16). Se crea dentro del gsap.context de
// animations.ts, que lo revierte todo junto (SplitText incluido).
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Constitución II (1.1.0): blur solo en la entrada de titulares y textos cortos,
// con duración ≤ 0,6 s y radio ≤ 8 px.
const DURATION = 0.6;
const BLUR_TITLE = 'blur(6px)';
const EASE = 'expo.out';
const SCRAMBLE_CHARS = '0123456789[]/-·°ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** El respaldo CSS ya lo mostró (el módulo llegó tarde): no se vuelve a ocultar. */
const alreadyShown = (element: HTMLElement) => getComputedStyle(element).opacity !== '0';

/** Titular principal (hero, caso de estudio, 404): letras escalonadas desde abajo. */
export function splitTitles(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-split]').forEach((element) => {
    if (alreadyShown(element)) return;
    SplitText.create(element, {
      type: 'words,chars',
      mask: 'chars',
      aria: 'auto',
      // Sin esto, SplitText cambia los espacios de no separación por espacios normales y
      // el titular se corta donde no debe («Desarrollo a / la medida»). Astro ya entrega
      // los titulares en una línea, sin saltos ni sangrías que reducir.
      reduceWhiteSpace: false,
      onSplit: (self) =>
        gsap.from(self.chars, {
          yPercent: 110,
          opacity: 0,
          filter: BLUR_TITLE,
          duration: DURATION,
          ease: EASE,
          stagger: 0.018,
          clearProps: 'filter',
        }),
    });
  });
}

/** Etiquetas de laboratorio y títulos de sección: "scramble" breve al aparecer. Su texto es aria-hidden. */
export function scrambleLabels(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-scramble]').forEach((element) => {
    gsap.to(element, {
      duration: 0.8,
      ease: 'none',
      scrambleText: { text: element.textContent ?? '', chars: SCRAMBLE_CHARS, revealDelay: 0.25, speed: 0.5 },
      scrollTrigger: { trigger: element, start: 'top 92%', once: true },
    });
  });
}

