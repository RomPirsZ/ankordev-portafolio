// Gradiente animado con ShaderGradient (plan §6.1). Sigue al tema activo y se
// detiene con la pestaña oculta. La iluminación usa el HDR de public/hdr/:
// ninguna petición a terceros (constitución X).
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { useEffect, useState } from 'react';
import { ENV_BASE_PATH, GRADIENT_LIGHT, GRADIENT_SHAPE, SHADER_COLORS } from '../lib/gradient';
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
      envBasePath={ENV_BASE_PATH}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ShaderGradient
        control="props"
        {...GRADIENT_SHAPE}
        {...SHADER_COLORS[theme]}
        {...GRADIENT_LIGHT[theme]}
        animate={visible ? 'on' : 'off'}
      />
    </ShaderGradientCanvas>
  );
}
