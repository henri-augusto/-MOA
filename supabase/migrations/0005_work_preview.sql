-- Prévia pública: página 1 da grade (imagem) e vídeo opcional do YouTube.
-- Cole no SQL Editor do projeto Supabase depois da 0004.

-- Obras: caminhos e vídeo ----------------------------------------------------

alter table public.works
  add column if not exists preview_path text,
  add column if not exists preview_video_id text
    check (
      preview_video_id is null
      or preview_video_id ~ '^[A-Za-z0-9_-]{11}$'
    );

-- Bucket privado: aceita JPEG da prévia gerada no envio ----------------------

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/ogg',
  'audio/flac',
  'image/jpeg'
]
where id = 'arrangements';

-- Bucket público: só a página 1, nome {obra_id}.jpg --------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'previews',
  'previews',
  true,
  2097152,
  array['image/jpeg']
)
on conflict (id) do nothing;

create or replace function public.curator_can_write_preview(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.is_curator()
    and object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
    and exists (
      select 1
      from public.works w
      where w.id::text = left(object_name, 36)
        and w.status = 'em_revisao'
        and w.preview_path is not null
    );
$$;

drop policy if exists "Curador publica prévia da grade" on storage.objects;
create policy "Curador publica prévia da grade"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'previews' and public.curator_can_write_preview(name));

drop policy if exists "Curador atualiza prévia da grade" on storage.objects;
create policy "Curador atualiza prévia da grade"
  on storage.objects for update to authenticated
  using (bucket_id = 'previews' and public.curator_can_write_preview(name))
  with check (bucket_id = 'previews' and public.curator_can_write_preview(name));

-- Acervo: devolve vídeo e se há imagem pública -------------------------------

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
    exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'previews'
        and o.name = w.id::text || '.jpg'
    ) as has_preview
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
    exists (
      select 1
      from storage.objects o
      where o.bucket_id = 'previews'
        and o.name = w.id::text || '.jpg'
    ) as has_preview
  from public.works w
  join public.profiles p on p.id = w.arranger_id
  where w.id = p_id
    and w.status = 'publicado';
$$;

revoke all on function public.published_catalog() from public;
revoke all on function public.published_work(uuid) from public;
grant execute on function public.published_catalog() to anon, authenticated;
grant execute on function public.published_work(uuid) to anon, authenticated;
