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
 * - oscuro: azules noche. Los grises neutros salían marrones al iluminarse.
 * - claro: blanco, naranja y hueso.
 * El contraste real lo mide el e2e del fondo sobre los píxeles, grano incluido
 * (oscuro: luminancia ≤ 0,063 para el texto secundario; claro: ≥ 0,236). El grano
 * en soft-light aclara la media de los oscuros: por eso el oscuro lleva grano al 75 %.
 */
export const GRADIENT_COLORS: Record<Theme, GradientColors> = {
  oscuro: { color1: '#202A45', color2: '#141B31', color3: '#1A3253' },
  claro: { color1: '#FFFFFF', color2: '#F2711C', color3: '#F3F1EC' },
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
