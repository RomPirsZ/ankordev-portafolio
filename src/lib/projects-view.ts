// Control de vista Lista/Cuadrícula de Proyectos (T18). Es funcionalidad, no
// animación: funciona también con reduced-motion. Recuerda la elección.

export const VIEWS = ['list', 'grid'] as const;
export type View = (typeof VIEWS)[number];
export const VIEW_STORAGE_KEY = 'projects-view';

export function parseView(value: unknown): View | undefined {
  return VIEWS.find((view) => view === value);
}

function readSavedView(): View | undefined {
  try {
    return parseView(localStorage.getItem(VIEW_STORAGE_KEY));
  } catch {
    return undefined;
  }
}

function saveView(view: View) {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch {
    // Sin almacenamiento la vista simplemente no se recuerda
  }
}

export function initProjectsView() {
  document.querySelectorAll<HTMLElement>('[data-view-controls]').forEach((controls) => {
    if (controls.dataset['ready']) return;
    const projects = document.getElementById(
      controls.querySelector('[aria-controls]')?.getAttribute('aria-controls') ?? '',
    );
    if (!projects) return;

    const buttons = [...controls.querySelectorAll<HTMLButtonElement>('[data-view-value]')];
    const apply = (view: View) => {
      projects.dataset['view'] = view;
      buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset['viewValue'] === view)));
      projects.dispatchEvent(new CustomEvent('projects:view', { detail: view, bubbles: true }));
    };

    const saved = readSavedView();
    if (saved) apply(saved);
    controls.addEventListener('click', (event) => {
      const view = parseView((event.target as Element).closest<HTMLElement>('[data-view-value]')?.dataset['viewValue']);
      if (!view) return;
      apply(view);
      saveView(view);
    });
    controls.dataset['ready'] = 'true';
    controls.hidden = false;
  });
}
