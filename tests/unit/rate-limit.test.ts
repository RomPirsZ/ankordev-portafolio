import { describe, expect, it } from 'vitest';
import { createRateLimiter } from '../../src/lib/rate-limit';

const MINUTE = 60_000;

/** Reloj manual: los tests avanzan el tiempo a mano. */
function clock(start = 1_000_000) {
  let time = start;
  return { now: () => time, advance: (ms: number) => (time += ms) };
}

describe('createRateLimiter', () => {
  it('por defecto admite 5 envíos en 10 minutos y rechaza el 6.º (plan §7)', () => {
    const { now } = clock();
    const limiter = createRateLimiter({ now });
    for (let i = 0; i < 5; i++) expect(limiter.check('1.2.3.4').allowed).toBe(true);
    expect(limiter.check('1.2.3.4')).toEqual({ allowed: false, retryAfter: 600 });
  });

  it('la ventana es deslizante: cada envío caduca a los 10 minutos de hacerse', () => {
    const { now, advance } = clock();
    const limiter = createRateLimiter({ now });
    limiter.check('ip'); // t = 0
    advance(4 * MINUTE);
    for (let i = 0; i < 4; i++) limiter.check('ip'); // t = 4 min
    expect(limiter.check('ip').allowed).toBe(false);

    advance(6 * MINUTE); // t = 10 min: caduca el primero, quedan 4
    expect(limiter.check('ip').allowed).toBe(true);
    expect(limiter.check('ip').allowed).toBe(false);
  });

  it('Retry-After son los segundos hasta que caduque el envío más antiguo, redondeados hacia arriba', () => {
    const { now, advance } = clock();
    const limiter = createRateLimiter({ now, limit: 1 });
    limiter.check('ip');
    advance(9 * MINUTE + 59_500);
    expect(limiter.check('ip')).toEqual({ allowed: false, retryAfter: 1 });
  });

  it('cada IP tiene su propio límite', () => {
    const { now } = clock();
    const limiter = createRateLimiter({ now, limit: 1 });
    expect(limiter.check('a').allowed).toBe(true);
    expect(limiter.check('b').allowed).toBe(true);
    expect(limiter.check('a').allowed).toBe(false);
  });

  it('los intentos rechazados no alargan el bloqueo', () => {
    const { now, advance } = clock();
    const limiter = createRateLimiter({ now, limit: 1 });
    limiter.check('ip');
    for (let i = 0; i < 9; i++) {
      advance(MINUTE);
      expect(limiter.check('ip').allowed).toBe(false);
    }
    advance(MINUTE);
    expect(limiter.check('ip').allowed).toBe(true);
  });

  describe('memoria acotada', () => {
    it('al superar maxKeys descarta las IPs cuyos envíos ya caducaron', () => {
      const { now, advance } = clock();
      const limiter = createRateLimiter({ now, maxKeys: 2 });
      limiter.check('a');
      limiter.check('b');
      advance(10 * MINUTE);
      limiter.check('c');
      expect(limiter.size).toBe(1);
    });

    it('si todas siguen activas, descarta la más antigua', () => {
      const { now } = clock();
      const limiter = createRateLimiter({ now, maxKeys: 2 });
      for (const ip of ['a', 'b', 'c']) limiter.check(ip);
      expect(limiter.size).toBe(2);
      // «a» se olvidó: vuelve a empezar con su límite completo
      expect(limiter.check('a').allowed).toBe(true);
    });
  });
});
