import { describe, expect, it } from 'vitest';
import { formatCaracasTime } from '../../src/lib/clock';

describe('formatCaracasTime', () => {
  it('convierte UTC a la hora de Caracas (UTC−4)', () => {
    expect(formatCaracasTime(new Date('2026-11-11T16:05:09Z'), 'es')).toBe('12:05:09');
  });

  it('usa formato de 24 horas también en inglés', () => {
    expect(formatCaracasTime(new Date('2026-11-12T02:30:00Z'), 'en')).toBe('22:30:00');
  });
});
