// Punto de entrada del movimiento (constitución II). No importa GSAP: con
// reduced-motion activado el módulo de animaciones ni siquiera se descarga.

export interface ReducedMotionQuery {
  matches: boolean;
  addEventListener(type: 'change', callback: (event: { matches: boolean }) => void): void;
}

export interface AnimationsModule {
  initAnimations(): void;
  destroyAnimations(): void;
}

export function createMotionController(reduced: ReducedMotionQuery, load: () => Promise<AnimationsModule>) {
  let module: AnimationsModule | undefined;
  let running = false;

  async function start() {
    if (reduced.matches || running) return;
    running = true;
    module ??= await load();
    // Pudo detenerse, o cambiar la preferencia, mientras se descargaba
    if (running && !reduced.matches) module.initAnimations();
  }

  function stop() {
    if (!running) return;
    running = false;
    module?.destroyAnimations();
  }

  reduced.addEventListener('change', (event) => (event.matches ? stop() : void start()));
  return { start, stop };
}

/** Se llama una vez desde BaseLayout. Los eventos astro:* llegan con las View Transitions (T19). */
export function startMotion() {
  const controller = createMotionController(window.matchMedia('(prefers-reduced-motion: reduce)'), () =>
    import('./animations'),
  );
  void controller.start();
  document.addEventListener('astro:before-swap', controller.stop);
  document.addEventListener('astro:page-load', () => void controller.start());
}
