// Gradiente animado con ShaderGradient (plan §6.1). Sigue al tema activo y se
// detiene con la pestaña oculta. Luz «3d»: no descarga ningún recurso externo.
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { useEffect, useState } from 'react';
import { GRADIENT_BRIGHTNESS, GRADIENT_COLORS, GRADIENT_SHAPE } from '../lib/gradient';
import { DEFAULT_THEME, isTheme, type Theme } from '../lib/themes';

function currentTheme(): Theme {
  const theme = document.documentElement.dataset['theme'];
  return isTheme(theme) ? theme : DEFAULT_THEME;
}

export default function ShaderBackground() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(currentTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <ShaderGradientCanvas
      pixelDensity={1}
      pointerEvents="none"
      lazyLoad={false}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ShaderGradient
        control="props"
        {...GRADIENT_SHAPE}
        {...GRADIENT_COLORS[theme]}
        brightness={GRADIENT_BRIGHTNESS[theme]}
        animate={visible ? 'on' : 'off'}
      />
    </ShaderGradientCanvas>
  );
}
