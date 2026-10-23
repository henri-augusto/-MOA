-- O acervo só promete áudio de referência quando a obra tem arquivo.
-- Cole no SQL Editor depois da 0007.

drop function if exists public.published_catalog();
drop function if exists public.published_work(uuid);

create function public.published_catalog()
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
  has_preview boolean,
  has_audio boolean
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
    (w.preview_path is not null and w.preview_path ~ '/preview\.jpg$') as has_preview,
    (w.audio_path is not null and btrim(w.audio_path) <> '') as has_audio
  from public.works w
  join public.profiles p on p.id = w.arranger_id
  where w.status = 'publicado'
  order by w.updated_at desc;
$$;

create function public.published_work(p_id uuid)
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
  has_preview boolean,
  has_audio boolean
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
    (w.preview_path is not null and w.preview_path ~ '/preview\.jpg$') as has_preview,
    (w.audio_path is not null and btrim(w.audio_path) <> '') as has_audio
  from public.works w
  join public.profiles p on p.id = w.arranger_id
  where w.id = p_id
    and w.status = 'publicado';
$$;

revoke all on function public.published_catalog() from public;
revoke all on function public.published_work(uuid) from public;
grant execute on function public.published_catalog() to anon, authenticated;
grant execute on function public.published_work(uuid) to anon, authenticated;
