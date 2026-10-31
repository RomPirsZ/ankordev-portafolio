export const CARACAS_TZ = 'America/Caracas';

export function formatCaracasTime(date: Date, lang: 'es' | 'en'): string {
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-VE' : 'en-US', {
    timeZone: CARACAS_TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}
