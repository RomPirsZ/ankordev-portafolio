// Movimiento de texto (spec §7, T16). Se crea dentro del gsap.context de
// animations.ts, que lo revierte todo junto (SplitText incluido).
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Constitución II (1.1.0): blur solo en la entrada de titulares y textos cortos,
// con duración ≤ 0,6 s y radio ≤ 8 px.
const DURATION = 0.6;
const BLUR_TITLE = 'blur(6px)';
const BLUR_LINE = 'blur(4px)';
const EASE = 'expo.out';
const SCRAMBLE_CHARS = '0123456789[]/-·°ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** El respaldo CSS ya lo mostró (el módulo llegó tarde): no se vuelve a ocultar. */
const alreadyShown = (element: HTMLElement) => getComputedStyle(element).opacity !== '0';

/** Titular principal (hero, caso de estudio, 404): letras escalonadas desde abajo. */
function splitTitles(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-split]').forEach((element) => {
    if (alreadyShown(element)) return;
    SplitText.create(element, {
      type: 'words,chars',
      mask: 'chars',
      aria: 'auto',
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

/** Títulos de sección: se revelan por líneas al entrar en pantalla. */
function revealHeadings(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
    SplitText.create(element, {
      type: 'lines',
      mask: 'lines',
      aria: 'auto',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 100,
          opacity: 0,
          filter: BLUR_LINE,
          duration: DURATION,
          ease: EASE,
          stagger: 0.08,
          clearProps: 'filter',
          scrollTrigger: { trigger: element, start: 'top 85%', once: true },
        }),
    });
  });
}

/** Etiquetas de laboratorio: "scramble" breve al aparecer. Son aria-hidden. */
function scrambleLabels(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-scramble]').forEach((element) => {
    gsap.to(element, {
      duration: 0.8,
      ease: 'none',
      scrambleText: { text: element.textContent ?? '', chars: SCRAMBLE_CHARS, revealDelay: 0.25, speed: 0.5 },
      scrollTrigger: { trigger: element, start: 'top 92%', once: true },
    });
  });
}

export function textEffects(root: ParentNode) {
  splitTitles(root);
  revealHeadings(root);
  scrambleLabels(root);
}
