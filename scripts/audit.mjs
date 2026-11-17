// Auditoría de dependencias para la CI: falla con cualquier aviso high o critical de
// `npm audit`, salvo las excepciones de abajo. Cada excepción lleva motivo y caducidad:
// al caducar vuelve a fallar, y si el aviso ya no aparece, avisa para quitarla.
// Sin dependencias: solo Node y npm.
import { execFileSync } from 'node:child_process';

const EXCEPCIONES = [
  {
    id: 'GHSA-fc5q-39xc-vjpf',
    paquete: 'picomatch',
    motivo:
      'ReDoS con patrones de glob maliciosos. Sin versión corregida publicada (2026-11-17). Solo se usa al compilar, con patrones propios: un visitante no puede pasarle un patrón.',
    caduca: '2026-12-01',
  },
];

let salida;
try {
  salida = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
} catch (error) {
  // npm audit sale con código distinto de 0 cuando encuentra avisos: el JSON llega igual
  salida = error.stdout;
}
const informe = JSON.parse(salida);

const graves = new Map();
for (const vulnerabilidad of Object.values(informe.vulnerabilities ?? {})) {
  for (const via of vulnerabilidad.via) {
    if (typeof via !== 'object' || !['high', 'critical'].includes(via.severity)) continue;
    const id = via.url?.split('/').pop() ?? String(via.source);
    graves.set(id, `${id} (${via.severity}) en ${via.name} ${via.range}: ${via.title}`);
  }
}

const hoy = new Date().toISOString().slice(0, 10);
let falla = false;
for (const excepcion of EXCEPCIONES) {
  if (!graves.has(excepcion.id)) {
    console.log(`Aviso: ${excepcion.id} (${excepcion.paquete}) ya no aparece. Quita la excepción de scripts/audit.mjs.`);
  } else if (hoy > excepcion.caduca) {
    console.error(`La excepción de ${excepcion.id} caducó el ${excepcion.caduca}: actualiza ${excepcion.paquete} o revisa la excepción.`);
    falla = true;
  } else {
    console.log(`Excepción vigente hasta el ${excepcion.caduca}: ${graves.get(excepcion.id)}`);
    graves.delete(excepcion.id);
  }
}
for (const [id, texto] of graves) {
  if (EXCEPCIONES.some((e) => e.id === id)) continue;
  console.error(`Vulnerabilidad: ${texto}`);
  falla = true;
}
if (falla) process.exit(1);
console.log('npm audit: sin avisos high ni critical fuera de las excepciones.');
