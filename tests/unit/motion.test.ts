import { describe, expect, it, vi } from 'vitest';
import { createMotionController, type ReducedMotionQuery } from '../../src/lib/motion';

/** Sustituto de matchMedia('(prefers-reduced-motion: reduce)') que permite cambiar la preferencia. */
function fakeQuery(reduce: boolean) {
  let listener: ((event: { matches: boolean }) => void) | undefined;
  const query: ReducedMotionQuery = {
    matches: reduce,
    addEventListener: (_type, callback) => (listener = callback),
  };
  return {
    query,
    change(next: boolean) {
      query.matches = next;
      listener?.({ matches: next });
    },
  };
}

function fakeModule() {
  const module = { initAnimations: vi.fn(), destroyAnimations: vi.fn() };
  const load = vi.fn(async () => module);
  return { module, load };
}

describe('controlador de movimiento', () => {
  it('con reduced-motion no descarga ni inicia nada', async () => {
    const { query } = fakeQuery(true);
    const { load } = fakeModule();
    await createMotionController(query, load).start();
    expect(load).not.toHaveBeenCalled();
  });

  it('sin reduced-motion carga el módulo una vez e inicia', async () => {
    const { query } = fakeQuery(false);
    const { module, load } = fakeModule();
    const controller = createMotionController(query, load);
    await controller.start();
    await controller.start();
    expect(load).toHaveBeenCalledTimes(1);
    expect(module.initAnimations).toHaveBeenCalledTimes(1);
  });

  it('si el usuario activa reduced-motion, se detiene; si lo desactiva, vuelve', async () => {
    const media = fakeQuery(false);
    const { module, load } = fakeModule();
    await createMotionController(media.query, load).start();

    media.change(true);
    expect(module.destroyAnimations).toHaveBeenCalledTimes(1);

    media.change(false);
    await vi.waitFor(() => expect(module.initAnimations).toHaveBeenCalledTimes(2));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('si se detiene mientras carga, no llega a iniciar', async () => {
    const { query } = fakeQuery(false);
    const { module, load } = fakeModule();
    const controller = createMotionController(query, load);
    const starting = controller.start();
    controller.stop();
    await starting;
    expect(module.initAnimations).not.toHaveBeenCalled();
  });

  it('detener sin haber iniciado no hace nada', () => {
    const { query } = fakeQuery(false);
    const { module, load } = fakeModule();
    createMotionController(query, load).stop();
    expect(module.destroyAnimations).not.toHaveBeenCalled();
  });
});
