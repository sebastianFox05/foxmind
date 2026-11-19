-- FoxMind · esquema de Supabase
-- Una sola tabla de documentos por persona: cada registro (tarea, carrera, sesion de gym, libro, reto...)
-- es una fila con su coleccion y sus datos en JSON. Asi la app puede crecer sin migraciones por cada campo nuevo.
-- Las tablas llevan el prefijo flow_ para poder convivir en el mismo proyecto que FoxTrips.

create table if not exists public.flow_entries (
  id          uuid primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  collection  text not null check (collection in (
                'tasks', 'habits', 'challenges', 'workouts', 'routines', 'runs', 'records',
                'books', 'readingLogs', 'focusSessions', 'journal', 'notes', 'meals', 'settings')),
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists flow_entries_user_collection_idx on public.flow_entries (user_id, collection);

-- updated_at automatico
create or replace function public.flow_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists flow_entries_touch on public.flow_entries;
create trigger flow_entries_touch before update on public.flow_entries
  for each row execute function public.flow_touch_updated_at();

-- Seguridad: cada persona solo ve y cambia sus propias filas
alter table public.flow_entries enable row level security;

drop policy if exists "flow: leer lo propio" on public.flow_entries;
create policy "flow: leer lo propio" on public.flow_entries
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "flow: crear lo propio" on public.flow_entries;
create policy "flow: crear lo propio" on public.flow_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "flow: editar lo propio" on public.flow_entries;
create policy "flow: editar lo propio" on public.flow_entries
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "flow: borrar lo propio" on public.flow_entries;
create policy "flow: borrar lo propio" on public.flow_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.flow_entries from anon;
