// Datos de configuración del sitio (no son textos de interfaz). Los datos
// personales los completa el dueño del sitio: lo que quede vacío no se muestra.

/** Nombre de pila para «Sobre mí» y el texto alternativo de la foto. */
export const OWNER_NAME = '';

/** Canales de contacto públicos (spec §5.7). */
export const CONTACT = {
  /** Con código de país, tal como se quiere mostrar: '+58 412 123 4567'. */
  whatsapp: '',
  email: '',
};

/** Las redes sin URL no se muestran. */
export const SOCIALS: { name: string; url: string }[] = [
  { name: 'GitHub', url: '' },
  { name: 'LinkedIn', url: '' },
  { name: 'Instagram', url: '' },
];

/** Herramientas de trabajo para «Sobre mí». Vercel, si un cliente lo prefiere a Cloudflare. */
export const STACK = ['Astro', 'TypeScript', 'Tailwind CSS', 'GSAP', 'Supabase', 'Cloudflare', 'Vercel'];

export type ContactChannel = { kind: 'whatsapp' | 'email'; label: string; href: string };

/** Enlace de WhatsApp (wa.me) con solo los dígitos del número. */
export function whatsappHref(number: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}`;
}

/** Los canales con dato, en el orden en que se muestran. */
export function contactChannels(contact: { whatsapp: string; email: string } = CONTACT): ContactChannel[] {
  const channels: ContactChannel[] = [];
  const whatsapp = contact.whatsapp.trim();
  const email = contact.email.trim();
  if (whatsapp) channels.push({ kind: 'whatsapp', label: whatsapp, href: whatsappHref(whatsapp) });
  if (email) channels.push({ kind: 'email', label: email, href: `mailto:${email}` });
  return channels;
}
