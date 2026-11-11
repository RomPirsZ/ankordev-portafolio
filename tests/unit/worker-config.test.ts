import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// wrangler.jsonc admite comentarios; en este archivo todos ocupan su propia línea
const config = JSON.parse(
  readFileSync('wrangler.jsonc', 'utf8')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n'),
);

describe('wrangler.jsonc', () => {
  // Auditoría 2026-11-10: los logs de invocación guardan la URL, las cabeceras y la IP de cada
  // petición (plan §7 promete que los logs nunca llevan la IP) y gastan el cupo diario de eventos
  it('guarda los logs del Worker sin los de invocación', () => {
    expect(config.observability).toEqual({ enabled: true, logs: { invocation_logs: false } });
  });
});
