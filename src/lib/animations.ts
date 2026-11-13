// Animaciones del sitio (plan §6). Solo se carga sin reduced-motion; ver motion.ts.
// Se anima transform y opacity; blur solo en entradas de titulares (constitución II).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { scrambleLabels, splitTitles } from './effects/text';
import { FINE_POINTER, pointerEffects } from './effects/pointer';
import { projectEffects } from './effects/projects';
import { processEffects } from './effects/process';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

let lenis: Lenis | undefined;
let context: gsap.Context | undefined;
let pointerMedia: gsap.MatchMedia | undefined;

// Lenis avanza con el reloj de GSAP para que ScrollTrigger y el scroll suave vayan sincronizados
const tick = (time: number) => lenis?.raf(time * 1000);

// Cada arranque tiene su número: si la página cambia (View Transitions) mientras quedan
// pasos pendientes, esos pasos ya no se ejecutan
let generation = 0;

/** Cede el hilo principal entre pasos: el arranque no es una sola tarea larga (TBT, T33). */
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (scheduler?.yield) void scheduler.yield().then(resolve);
    else setTimeout(resolve, 0);
  });

export function initAnimations() {
  if (lenis) return;
  const run = ++generation;

  // Scroll suave con la rueda; en táctil se mantiene el scroll nativo. Los enlaces a
  // secciones (#contacto…) los resuelve solo el ClientRouter de Astro: con `anchors`,
  // Lenis medía el destino después del salto del router y, en la última sección (que
  // no llega arriba del todo), devolvía la página hacia atrás.
  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Todos los efectos viven en un contexto para revertirlos juntos. Primero el titular,
  // que es lo que se ve al cargar; lo demás está fuera de pantalla y espera su turno.
  context = gsap.context(() => splitTitles(document));
  // Las entradas ya tienen su estado inicial: el CSS deja de ocultarlas
  document.documentElement.classList.add('motion-ready');

  const steps = [
    () => context?.add(() => scrambleLabels(document)),
    () => context?.add(() => processEffects(document)),
    () => {
      // Cursor, botones magnéticos e imagen flotante solo con puntero fino; se revierten solos si deja de haberlo
      pointerMedia = gsap.matchMedia();
      pointerMedia.add(FINE_POINTER, () => {
        const cleanups = [pointerEffects(document), projectEffects(document)];
        return () => cleanups.forEach((cleanup) => cleanup());
      });
      // Las líneas y posiciones dependen de las fuentes
      void document.fonts.ready.then(() => ScrollTrigger.refresh());
    },
  ];
  void (async () => {
    for (const step of steps) {
      await yieldToMain();
      if (run !== generation) return;
      step();
    }
  })();
}

export function destroyAnimations() {
  generation++;
  context?.revert();
  context = undefined;
  pointerMedia?.revert();
  pointerMedia = undefined;
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  gsap.ticker.remove(tick);
  gsap.ticker.lagSmoothing(500, 33);
  lenis?.destroy();
  lenis = undefined;
}
