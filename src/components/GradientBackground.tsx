// Isla del fondo animado (plan §6.1). Astro solo la descarga en escritorio con
// puntero fino y sin reduced-motion (client:media en BaseLayout). Aun así
// decide en el cliente: sin WebGL, con un error o si el visitante activa
// reduced-motion después, no monta nada y queda el gradiente estático del CSS.
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';

// three.js y ShaderGradient van en un chunk aparte que solo se pide si se monta
const ShaderBackground = lazy(() => import('./ShaderBackground'));

class StaticOnError extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

function supportsWebGL(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

export default function GradientBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(!reduced.matches && supportsWebGL());
    update();
    reduced.addEventListener('change', update);
    return () => reduced.removeEventListener('change', update);
  }, []);

  if (!enabled) return null;
  return (
    <StaticOnError>
      <Suspense fallback={null}>
        <ShaderBackground />
      </Suspense>
    </StaticOnError>
  );
}
