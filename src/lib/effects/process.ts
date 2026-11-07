// Línea de progreso del proceso (spec §7): se dibuja ligada al scroll. Se crea dentro
// del gsap.context de animations.ts, que la revierte. Anima --progress en el
// contenedor; cada tramo lo convierte en su scaleY (móvil) o scaleX (escritorio).
import { gsap } from 'gsap';

export function processEffects(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('[data-process]').forEach((process) => {
    gsap.fromTo(
      process,
      { '--progress': 0 },
      {
        '--progress': 1,
        ease: 'none',
        // clamp(): si la página no da para tanto scroll, la línea termina al llegar al final
        scrollTrigger: { trigger: process, start: 'top 80%', end: 'clamp(bottom 55%)', scrub: true },
      },
    );
  });
}
