// Animaciones del sitio (plan §6). Solo se carga sin reduced-motion; ver motion.ts.
// Se anima solo transform y opacity (constitución II).
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | undefined;

// Lenis avanza con el reloj de GSAP para que ScrollTrigger y el scroll suave vayan sincronizados
const tick = (time: number) => lenis?.raf(time * 1000);

export function initAnimations() {
  if (lenis) return;

  // Scroll suave también en los enlaces a secciones (#proyectos…); en táctil se mantiene el scroll nativo
  lenis = new Lenis({ anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
}

export function destroyAnimations() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  gsap.ticker.remove(tick);
  gsap.ticker.lagSmoothing(500, 33);
  lenis?.destroy();
  lenis = undefined;
}
