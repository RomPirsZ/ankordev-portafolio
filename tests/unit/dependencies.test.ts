import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8')) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };

describe('dependencias de Cloudflare (plan §1, T09c)', () => {
  it('wrangler es la versión exacta que fija @cloudflare/vite-plugin: un solo wrangler en el árbol', () => {
    const own = readJson('package.json').devDependencies?.['wrangler'];
    const pinned = readJson('node_modules/@cloudflare/vite-plugin/package.json').dependencies?.['wrangler'];
    expect(pinned, 'el plugin dejó de fijar wrangler: revisar plan §1').toMatch(/^\d+\.\d+\.\d+$/);
    expect(own, `alinea wrangler con @cloudflare/vite-plugin: npm install --save-exact -D wrangler@${pinned}`).toBe(pinned);
  });
});
