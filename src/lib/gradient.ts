// Fondo de gradiente (plan §6.1, constitución II 1.2.0). Lo comparten el
// gradiente estático de global.css (--grad-1/2/3, mismo orden) y el animado.
import type { Theme } from './themes';

export interface GradientColors {
  color1: string;
  color2: string;
  color3: string;
}

/**
 * Colores visibles por tema: la paleta que se ve. Los usa el gradiente
 * estático de global.css (--grad-1/2/3) y el texto (--fg) cumple AA sobre cada uno.
 */
export const GRADIENT_COLORS: Record<Theme, GradientColors> = {
  carbon: { color1: '#2B2D31', color2: '#1E1F22', color3: '#5A2A10' },
  naranja: { color1: '#F2711C', color2: '#FF9A55', color3: '#F68A3E' },
};

/**
 * Colores de entrada del shader. La iluminación de entorno cambia cuánta luz
 * devuelve el material (el HDR «city» deja ~40 %; «lobby» casi todo), así que
 * cada tema recibe los colores que, ya iluminados, se parecen a su paleta.
 * El contraste real lo mide el e2e del fondo sobre los píxeles del canvas
 * (Carbón: luminancia ≤ 0,063 para el texto secundario; Naranja: ≥ 0,236).
 */
export const SHADER_COLORS: Record<Theme, GradientColors> = {
  carbon: { color1: '#5A5D66', color2: '#46484F', color3: '#8A4A28' },
  naranja: { color1: '#F67D2C', color2: '#FF9F5C', color3: '#F99248' },
};

export type EnvPreset = 'city' | 'dawn' | 'lobby';

export interface GradientLight {
  lightType: 'env' | '3d';
  envPreset: EnvPreset;
  /** Solo afecta a la luz «3d». */
  brightness: number;
}

/**
 * Iluminación por tema, con HDR de Poly Haven (CC0) alojados en public/hdr/.
 * ShaderGradient descarga siempre los tres presets: el que no usa ningún tema
 * («dawn») es un HDR mínimo válido de 127 bytes para no descargar 1,5 MB de más.
 */
export const GRADIENT_LIGHT: Record<Theme, GradientLight> = {
  carbon: { lightType: 'env', envPreset: 'city', brightness: 1 },
  naranja: { lightType: 'env', envPreset: 'lobby', brightness: 1 },
};
export const ENV_BASE_PATH = '/hdr/';
export const ENV_PRESETS: readonly EnvPreset[] = ['city', 'dawn', 'lobby'];

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
  grain: 'off',
} as const;
