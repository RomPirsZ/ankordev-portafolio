// Efectos de puntero (spec §7, T17). Solo con puntero fino y hover (escritorio):
// animations.ts los registra en un gsap.matchMedia, que los revierte si cambia.
// Solo se anima transform y opacity.
import { gsap } from 'gsap';

/** Cuánto sigue un botón magnético al puntero (fracción de la distancia al centro). */
const MAGNET_STRENGTH = 0.3;
const INTERACTIVE = 'a[href], button, [role="button"], input, select, textarea, label';

/** Botones principales [data-magnetic]: se desplazan hacia el puntero y vuelven al salir. */
function magneticButtons(root: ParentNode): () => void {
  const cleanups = [...root.querySelectorAll<HTMLElement>('[data-magnetic]')].map((element) => {
    const xTo = gsap.quickTo(element, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(element, 'y', { duration: 0.5, ease: 'power3.out' });
    // El centro se mide al entrar, antes de moverlo, para que no persiga su propio desplazamiento
    let center = { x: 0, y: 0 };

    const onEnter = () => {
      const rect = element.getBoundingClientRect();
      center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const onMove = (event: PointerEvent) => {
      xTo((event.clientX - center.x) * MAGNET_STRENGTH);
      yTo((event.clientY - center.y) * MAGNET_STRENGTH);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    element.addEventListener('pointerenter', onEnter);
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerleave', onLeave);
    return () => {
      element.removeEventListener('pointerenter', onEnter);
      element.removeEventListener('pointermove', onMove);
      element.removeEventListener('pointerleave', onLeave);
    };
  });
  return () => cleanups.forEach((cleanup) => cleanup());
}

/**
 * Cursor de laboratorio: un anillo que acompaña al cursor del sistema (no lo
 * sustituye, por accesibilidad) y crece sobre lo interactivo. Es decorativo.
 */
function labCursor(): () => void {
  const cursor = document.createElement('div');
  cursor.className = 'lab-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.append(cursor);

  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  let overInteractive = false;

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    xTo(event.clientX);
    yTo(event.clientY);
    const interactive = event.target instanceof Element && event.target.closest(INTERACTIVE) !== null;
    if (interactive !== overInteractive || !cursor.dataset['visible']) {
      overInteractive = interactive;
      cursor.dataset['visible'] = 'true';
      gsap.to(cursor, { scale: interactive ? 1 : 0.35, opacity: 1, duration: 0.3, ease: 'power3.out' });
    }
  };
  const onLeaveWindow = () => {
    delete cursor.dataset['visible'];
    gsap.to(cursor, { opacity: 0, duration: 0.2 });
  };

  gsap.set(cursor, { scale: 0.35, opacity: 0 });
  window.addEventListener('pointermove', onMove);
  document.documentElement.addEventListener('pointerleave', onLeaveWindow);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeaveWindow);
    cursor.remove();
  };
}

export const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** Devuelve la limpieza de listeners; gsap.matchMedia revierte las animaciones. */
export function pointerEffects(root: ParentNode): () => void {
  const cleanMagnetic = magneticButtons(root);
  const cleanCursor = labCursor();
  return () => {
    cleanMagnetic();
    cleanCursor();
  };
}
