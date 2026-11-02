-- Keep-alive (plan §7): Supabase Free pausa el proyecto tras una semana con poca actividad,
-- y con pocos contactos podría estar pausado justo cuando llega uno. El workflow
-- .github/workflows/keepalive.yml llama a esta función dos veces por semana.
-- Se ejecuta una vez en el SQL Editor de Supabase.

-- No lee ningún dato. security invoker y search_path fijo: el Security Advisor no avisa.
create or replace function public.ping() returns integer
  language sql stable security invoker set search_path = ''
  as $$ select 1 $$;

revoke execute on function public.ping() from public, authenticated;
grant execute on function public.ping() to anon;
