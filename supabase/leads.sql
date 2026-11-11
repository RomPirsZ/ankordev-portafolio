-- Tabla de contactos del formulario (plan §7). Se ejecuta una vez en el SQL Editor de Supabase.
-- Es la fuente única del esquema: tests/unit/contact-schema.test.ts comprueba que la
-- validación del servidor (src/lib/contact-schema.ts) acepta lo mismo que estos check.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$'),
  project_type text check (project_type in ('landing', 'negocio', 'iglesia', 'tienda', 'app', 'otro')),
  budget text check (char_length(budget) <= 40),
  message text not null check (char_length(message) between 10 and 2000),
  lang text not null default 'es' check (lang in ('es', 'en'))
);

-- Mínimo privilegio (constitución V): desde la API pública solo se puede insertar.
-- Nadie lee, edita ni borra contactos desde fuera; se consultan en el panel de Supabase.
alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;
-- Solo las columnas del formulario: id y created_at los pone siempre la base de datos
grant insert (name, email, project_type, budget, message, lang) on table public.leads to anon;

-- El Security Advisor avisa de este «with check (true)» (lint 0024): es intencional,
-- cualquiera puede enviar el formulario. La validación vive en los check de arriba y en
-- /api/contact (Turnstile, Zod, límite de envíos), y la clave nunca llega al navegador.
create policy "anon solo inserta" on public.leads for insert to anon with check (true);
comment on policy "anon solo inserta" on public.leads is
  'Intencional: formulario público de contacto. Validan los check de la tabla y /api/contact (Turnstile, Zod, límite de envíos). anon no puede leer, editar ni borrar.';

-- Cambio 2026-11-10 (auditoría de seguridad): patrón del email sin backtracking cuadrático.
-- En una tabla ya creada se aplica una vez así (el nombre lo pone Postgres al crearla):
--   alter table public.leads
--     drop constraint leads_email_check,
--     add constraint leads_email_check
--       check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s.]+(?:\.[^@\s.]+)+$');
