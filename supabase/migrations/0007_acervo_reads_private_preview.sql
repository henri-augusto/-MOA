-- O acervo lê a mesma prévia que o estúdio já guarda (preview.jpg privado).
-- Cole no SQL Editor depois da 0006.

create or replace function public.published_preview_path(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select w.preview_path
  from public.works w
  where w.id = p_id
    and w.status = 'publicado'
    and w.preview_path is not null
    and w.preview_path ~ '/preview\.jpg$';
$$;

revoke all on function public.published_preview_path(uuid) from public;
grant execute on function public.published_preview_path(uuid) to anon, authenticated;

create or replace function public.published_preview_readable(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.works w
    where w.status = 'publicado'
      and w.preview_path = object_name
      and object_name ~ '/preview\.jpg$'
  );
$$;

revoke all on function public.published_preview_readable(text) from public;
grant execute on function public.published_preview_readable(text) to anon, authenticated;

drop policy if exists "Público lê a prévia publicada" on storage.objects;
create policy "Público lê a prévia publicada"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'arrangements' and public.published_preview_readable(name));

-- A ficha passa a considerar a prévia que já existe na obra, não uma segunda cópia.
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
  arranger_name text,
  preview_video_id text,
  has_preview boolean
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
    coalesce(nullif(trim(p.artist_name), ''), nullif(trim(p.full_name), ''), 'Arranjador') as arranger_name,
    w.preview_video_id,
    (w.preview_path is not null and w.preview_path ~ '/preview\.jpg$') as has_preview
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
  arranger_name text,
  preview_video_id text,
  has_preview boolean
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
    coalesce(nullif(trim(p.artist_name), ''), nullif(trim(p.full_name), ''), 'Arranjador') as arranger_name,
    w.preview_video_id,
    (w.preview_path is not null and w.preview_path ~ '/preview\.jpg$') as has_preview
  from public.works w
  join public.profiles p on p.id = w.arranger_id
  where w.id = p_id
    and w.status = 'publicado';
$$;
