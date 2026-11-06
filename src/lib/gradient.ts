// Fondo de gradiente (plan §6.1, constitución II 1.2.0). Lo comparten el
// gradiente estático de global.css (--grad-1/2/3, mismo orden) y el animado.
import type { Theme } from './themes';

export interface GradientColors {
  color1: string;
  color2: string;
  color3: string;
}

/**
 * Colores del gradiente por tema. Con luz «3d» el shader los respeta, así que
 * son los mismos en el fondo animado y en el estático.
 * Paleta «Terminal cálida» (T11b):
 * - oscuro: solo carbón y verde azulado. El shader mezcla color3 (centro) con la base
 *   (color2 → color1) por distancia al centro y, lejos, extrapola: se aleja de color3.
 *   Con el verde azulado en color3 salía su opuesto, un granate en las esquinas; por
 *   eso el centro es carbón neutro y el verde azulado va en color2, que al extrapolar
 *   solo se intensifica.
 * - claro: blanco, coral y papel.
 * El contraste real lo mide el e2e del fondo sobre los píxeles, grano incluido, con
 * umbrales sacados de los colores de texto de global.css. El grano en soft-light
 * aclara la media de los oscuros: por eso el oscuro lleva grano al 75 %.
 */
export const GRADIENT_COLORS: Record<Theme, GradientColors> = {
  oscuro: { color1: '#141616', color2: '#123A36', color3: '#1A1C1C' },
  claro: { color1: '#FFFFFF', color2: '#FFAD93', color3: '#F5F0E8' },
};

/**
 * Brillo de la luz «3d» por tema. La luz de entorno (HDR) se descartó porque
 * tiñe la paleta: «city» llevaba el oscuro al marrón y «lobby» amarilleaba el blanco.
 */
export const GRADIENT_BRIGHTNESS: Record<Theme, number> = {
  oscuro: 1,
  claro: 1.2,
};

/** Forma y movimiento, comunes a los dos temas (base: preset «mandarin»). */
export const GRADIENT_SHAPE = {
  type: 'waterPlane',
  uSpeed: 0.15,
  uStrength: 2.4,
  uDensity: 1.4,
  uFrequency: 5.5,
  uAmplitude: 0,
  positionX: 0,
  positionY: -1.4,
  positionZ: 0,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 225,
  cAzimuthAngle: 180,
  cPolarAngle: 95,
  cDistance: 2.6,
  cameraZoom: 1,
  reflection: 0,
  lightType: '3d',
  // El grano del shader altera el color y deja motas negras puras: el grano va
  // en CSS (soft-light) encima del canvas, el mismo del fondo estático
  grain: 'off',
} as const;
