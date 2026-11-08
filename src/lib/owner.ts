// Datos del dueño tal como los vio el build. Solo lo importan componentes: fuera de
// Vite `import.meta.env` no existe, y los tests leen el mismo entorno con ownerFromEnv.
import { ownerFromEnv } from './site';

export const OWNER = ownerFromEnv(import.meta.env);
