// Datos de configuración del sitio (no son textos de interfaz). Lo que quede
// vacío no se muestra.

/**
 * Datos públicos del dueño (spec §5.6 y §5.7). No van en git: salen de variables
 * de build, en `.env` en local y en Workers Builds en producción (plan §7).
 */
export type Owner = { name: string; whatsapp: string; email: string };

/** Lee los datos del dueño de un entorno; una variable ausente queda vacía. */
export function ownerFromEnv(env: Record<string, unknown>): Owner {
  const read = (key: string) => {
    const value = env[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  return {
    name: read('PUBLIC_OWNER_NAME'),
    /** Con código de país, tal como se quiere mostrar: '+58 412 123 4567'. */
    whatsapp: read('PUBLIC_OWNER_WHATSAPP'),
    email: read('PUBLIC_OWNER_EMAIL'),
  };
}

/** Las redes sin URL no se muestran. */
export const SOCIALS: { name: string; url: string }[] = [
  { name: 'GitHub', url: 'https://github.com/RomPirsZ' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/c-alimartinez/' },
  { name: 'Instagram', url: 'https://www.instagram.com/alimrtzcl/' },
];

/** Herramientas de trabajo para «Sobre mí». Vercel, si un cliente lo prefiere a Cloudflare. */
export const STACK = ['Astro', 'React', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Supabase', 'Cloudflare', 'Vercel'];

export type ContactChannel = { kind: 'whatsapp' | 'email'; label: string; href: string };

/** Enlace de WhatsApp (wa.me) con solo los dígitos del número. */
export function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}`;
}

/** Los canales con dato, en el orden en que se muestran. */
export function contactChannels(contact: Pick<Owner, 'whatsapp' | 'email'>): ContactChannel[] {
  const channels: ContactChannel[] = [];
  const whatsapp = contact.whatsapp.trim();
  const email = contact.email.trim();
  if (whatsapp) channels.push({ kind: 'whatsapp', label: whatsapp, href: whatsappHref(whatsapp) });
  if (email) channels.push({ kind: 'email', label: email, href: `mailto:${email}` });
  return channels;
}
