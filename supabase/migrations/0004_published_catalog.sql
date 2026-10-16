-- Acervo público: só obras publicadas, sem arquivos, recado da curadoria ou marca de curador.
-- Cole no SQL Editor do projeto Supabase depois da 0003.

create or replace function public.published_catalog()
returns table (
  id uuid,
  title text,
  composer text,
  formation text,
  level smallint,
  duration_seconds integer,
  parts_count integer,
  price_cents integer,
  description text,
  arranger_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id,
    w.title,
    w.composer,
    w.formation,
    w.level,
    w.duration_seconds,
    w.parts_count,
    w.price_cents,
    w.description,
    coalesce(nullif(trim(p.artist_name), ''), nullif(trim(p.full_name), ''), 'Arranjador') as arranger_name
  from public.works w
  join public.profiles p on p.id = w.arranger_id
  where w.status = 'publicado'
  order by w.updated_at desc;
$$;

create or replace function public.published_work(p_id uuid)
returns table (
  id uuid,
  title text,
  composer text,
  formation text,
  level smallint,
  duration_seconds integer,
  parts_count integer,
  price_cents integer,
  description text,
  arranger_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    w.id,
    w.title,
    w.composer,
    w.formation,
    w.level,
    w.duration_seconds,
    w.parts_count,
    w.price_cents,
    w.description,
    coalesce(nullif(trim(p.artist_name), ''), nullif(trim(p.full_name), ''), 'Arranjador') as arranger_name
  from public.works w
  join public.profiles p on p.id = w.arranger_id
  where w.id = p_id
    and w.status = 'publicado';
$$;

revoke all on function public.published_catalog() from public;
revoke all on function public.published_work(uuid) from public;
grant execute on function public.published_catalog() to anon, authenticated;
grant execute on function public.published_work(uuid) to anon, authenticated;
