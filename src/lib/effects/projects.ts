// Imagen flotante de Proyectos (spec §5.3, T18): en la vista lista, la portada
// del proyecto bajo el puntero lo sigue. Solo con puntero fino (lo registra
// animations.ts en el gsap.matchMedia) y solo transform y opacity.
import { gsap } from 'gsap';

/** Distancia entre el puntero y la imagen, y margen mínimo con el borde de la ventana. */
const OFFSET = 32;
const EDGE = 16;

function floatingCover(projects: HTMLElement): () => void {
  const links = [...projects.querySelectorAll<HTMLAnchorElement>('.project-link')];

  // Una imagen por proyecto, copiada de su portada (oculta en la vista lista)
  const float = document.createElement('div');
  float.className = 'project-float';
  float.setAttribute('aria-hidden', 'true');
  const images = links.map((link) => {
    const source = link.querySelector<HTMLImageElement>('.project-cover');
    const image = document.createElement('img');
    image.alt = '';
    image.decoding = 'async';
    if (source) {
      image.sizes = '22rem';
      image.srcset = source.srcset;
      image.src = source.src;
    }
    float.append(image);
    return image;
  });
  document.body.append(float);
  gsap.set(float, { opacity: 0, scale: 0.85 });

  const xTo = gsap.quickTo(float, 'x', { duration: 0.6, ease: 'power3.out' });
  const yTo = gsap.quickTo(float, 'y', { duration: 0.6, ease: 'power3.out' });
  let active = -1;

  const position = (event: PointerEvent) => ({
    x: Math.min(event.clientX + OFFSET, window.innerWidth - float.offsetWidth - EDGE),
    y: Math.min(Math.max(event.clientY - float.offsetHeight / 2, EDGE), window.innerHeight - float.offsetHeight - EDGE),
  });

  const hide = () => {
    active = -1;
    gsap.to(float, { opacity: 0, scale: 0.85, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
  };

  const onMove = (event: PointerEvent) => {
    if (projects.dataset['view'] !== 'list' || event.pointerType !== 'mouse') return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('.project-link');
    const index = link ? links.indexOf(link) : -1;
    const { x, y } = position(event);

    if (index === -1) {
      if (active !== -1) hide();
      return;
    }
    if (active === -1) {
      // Aparece donde está el puntero, sin cruzar la pantalla desde la última posición
      gsap.set(float, { x, y });
      gsap.to(float, { opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out', overwrite: 'auto' });
    }
    if (index !== active) {
      images.forEach((image, i) => gsap.set(image, { opacity: i === index ? 1 : 0 }));
      active = index;
    }
    xTo(x);
    yTo(y);
  };

  projects.addEventListener('pointermove', onMove);
  projects.addEventListener('pointerleave', hide);
  projects.addEventListener('projects:view', hide);
  return () => {
    projects.removeEventListener('pointermove', onMove);
    projects.removeEventListener('pointerleave', hide);
    projects.removeEventListener('projects:view', hide);
    float.remove();
  };
}

export function projectEffects(root: ParentNode): () => void {
  const cleanups = [...root.querySelectorAll<HTMLElement>('[data-projects]')].map(floatingCover);
  return () => cleanups.forEach((cleanup) => cleanup());
}
