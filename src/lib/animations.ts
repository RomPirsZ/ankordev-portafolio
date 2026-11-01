// Animaciones del sitio (plan §6). Solo se carga sin reduced-motion; ver motion.ts.
// Se anima transform y opacity; blur solo en entradas de titulares (constitución II).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { textEffects } from './effects/text';
import { FINE_POINTER, pointerEffects } from './effects/pointer';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

let lenis: Lenis | undefined;
let context: gsap.Context | undefined;
let pointerMedia: gsap.MatchMedia | undefined;

// Lenis avanza con el reloj de GSAP para que ScrollTrigger y el scroll suave vayan sincronizados
const tick = (time: number) => lenis?.raf(time * 1000);

export function initAnimations() {
  if (lenis) return;

  // Scroll suave también en los enlaces a secciones (#proyectos…); en táctil se mantiene el scroll nativo
  lenis = new Lenis({ anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  // Todos los efectos viven en un contexto para revertirlos juntos
  context = gsap.context(() => textEffects(document));
  // Cursor y botones magnéticos solo con puntero fino; se revierten solos si deja de haberlo
  pointerMedia = gsap.matchMedia();
  pointerMedia.add(FINE_POINTER, () => pointerEffects(document));
  // Las entradas ya tienen su estado inicial: el CSS deja de ocultarlas
  document.documentElement.classList.add('motion-ready');
  // Las líneas y posiciones dependen de las fuentes
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export function destroyAnimations() {
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
