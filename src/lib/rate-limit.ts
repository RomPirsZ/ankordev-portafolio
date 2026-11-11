// Límite de envíos del formulario por IP (plan §7): 5 cada 10 minutos, ventana deslizante.
// Vive en memoria de la función, así que se reinicia entre instancias: excepción aceptada
// en el plan §1, porque la defensa principal contra el spam es Turnstile.

export interface RateLimitResult {
  allowed: boolean;
  /** Segundos hasta poder volver a enviar (para la cabecera Retry-After); 0 si se permite. */
  retryAfter: number;
}

interface Options {
  limit?: number;
  windowMs?: number;
  /** Reloj inyectable para los tests. */
  now?: () => number;
  /** Máximo de IPs recordadas: acota la memoria aunque lleguen miles de IPs distintas. */
  maxKeys?: number;
}

/**
 * Clave del límite para una IP. Un cliente IPv6 suele tener un /64 entero (miles de millones
 * de direcciones), así que se cuenta por ese prefijo y no por la dirección exacta
 * (auditoría 2026-11-10). Una IPv4, también escrita como IPv6 (`::ffff:a.b.c.d`), va tal cual.
 */
export function rateLimitKey(ip: string): string {
  if (!ip) return 'unknown';
  if (!ip.includes(':')) return ip;
  const mappedIPv4 = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mappedIPv4) return mappedIPv4[1]!;

  const [head = '', tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...left, ...Array<string>(8 - left.length - right.length).fill('0'), ...right] : left;
  if (groups.length !== 8 || !groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return ip;
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

export function createRateLimiter({ limit = 5, windowMs = 10 * 60_000, now = Date.now, maxKeys = 10_000 }: Options = {}) {
  /** Momentos de los envíos aceptados de cada IP, del más antiguo al más reciente. */
  const hits = new Map<string, number[]>();

  function forgetIfFull(time: number) {
    if (hits.size <= maxKeys) return;
    for (const [key, times] of hits) {
      if (times.at(-1)! <= time - windowMs) hits.delete(key);
    }
    // Si todas siguen activas, se olvida la más antigua (Map conserva el orden de inserción)
    for (const key of hits.keys()) {
      if (hits.size <= maxKeys) break;
      hits.delete(key);
    }
  }

  return {
    check(key: string): RateLimitResult {
      const time = now();
      const recent = (hits.get(key) ?? []).filter((at) => at > time - windowMs);
      // Un intento rechazado no se apunta: no alarga el bloqueo
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, retryAfter: Math.ceil((recent[0]! + windowMs - time) / 1000) };
      }
      recent.push(time);
      hits.set(key, recent);
      forgetIfFull(time);
      return { allowed: true, retryAfter: 0 };
    },
    /** IPs recordadas ahora mismo. */
    get size() {
      return hits.size;
    },
  };
}
