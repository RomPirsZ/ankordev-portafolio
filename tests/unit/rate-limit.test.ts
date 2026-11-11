import { describe, expect, it } from 'vitest';
import { createRateLimiter, rateLimitKey } from '../../src/lib/rate-limit';

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

// Auditoría 2026-11-10: un cliente IPv6 suele tener un /64 entero (miles de millones de
// direcciones), así que contar cada dirección exacta no lo limitaba
describe('rateLimitKey', () => {
  it('una IPv4 cuenta tal cual', () => {
    expect(rateLimitKey('203.0.113.7')).toBe('203.0.113.7');
  });

  it('una IPv6 cuenta por su prefijo /64, se escriba como se escriba', () => {
    const key = '2001:db8:85a3:8d3::/64';
    for (const ip of ['2001:db8:85a3:8d3:1319:8a2e:370:7348', '2001:0DB8:85a3:08d3::1', '2001:db8:85a3:8d3:ffff:ffff:ffff:ffff']) {
      expect(rateLimitKey(ip), ip).toBe(key);
    }
    expect(rateLimitKey('2001:db8:85a3:8d4::1')).not.toBe(key);
    expect(rateLimitKey('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(rateLimitKey('::1')).toBe('0:0:0:0::/64');
  });

  it('una IPv4 escrita como IPv6 cuenta como la IPv4', () => {
    expect(rateLimitKey('::ffff:203.0.113.7')).toBe('203.0.113.7');
  });

  it('sin IP o con una que no se entiende, una clave fija o la cadena tal cual', () => {
    expect(rateLimitKey('')).toBe('unknown');
    expect(rateLimitKey('no:es:una:ip:valida:de:mas:de:ocho:grupos')).toBe('no:es:una:ip:valida:de:mas:de:ocho:grupos');
  });
});
