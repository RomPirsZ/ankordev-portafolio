// Cabeceras de seguridad de public/_headers (plan §8): la regla `/*`, la única del archivo.
// El preview del adaptador de Cloudflare las sirve igual que producción.
import { readFileSync } from 'node:fs';

export interface HeaderRule {
  path: string;
  headers: Record<string, string>;
}

/** Lee el formato de Cloudflare: una ruta y debajo, sangradas, sus cabeceras `Nombre: valor`. */
export function parseHeadersFile(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      rules.push({ path: line.trim(), headers: {} });
      continue;
    }
    const separator = line.indexOf(':');
    const rule = rules.at(-1);
    if (!rule || separator === -1) throw new Error(`Línea de _headers sin ruta o sin «:»: ${line}`);
    rule.headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return rules;
}

export const HEADER_RULES = parseHeadersFile(readFileSync('public/_headers', 'utf8'));
export const SECURITY_HEADERS = HEADER_RULES.find((rule) => rule.path === '/*')?.headers ?? {};
export const CSP = SECURITY_HEADERS['Content-Security-Policy'] ?? '';
