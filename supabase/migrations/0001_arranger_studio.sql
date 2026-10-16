-- Área do arranjador: perfis, obras, acessos, vendas e armazenamento dos arquivos.
-- Cole no SQL Editor do projeto Supabase e execute uma vez.

create type public.work_status as enum ('rascunho', 'em_revisao', 'publicado');
create type public.access_kind as enum ('pagina', 'audio', 'partitura');

-- Perfis ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  artist_name text,
  city text,
  bio text check (char_length(bio) <= 600),
  formations text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Arranjador lê o próprio perfil"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Arranjador atualiza o próprio perfil"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Obras ----------------------------------------------------------------------

create table public.works (
  id uuid primary key default gen_random_uuid(),
  arranger_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  composer text not null check (char_length(composer) between 1 and 160),
  formation text not null,
  level smallint not null check (level between 1 and 5),
  duration_seconds integer not null check (duration_seconds > 0),
  parts_count integer not null check (parts_count >= 1),
  price_cents integer not null check (price_cents >= 0),
  description text check (char_length(description) <= 1200),
  status public.work_status not null default 'rascunho',
  score_path text,
  parts_path text,
  audio_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index works_arranger_id_idx on public.works (arranger_id);

alter table public.works enable row level security;

create policy "Arranjador lê as próprias obras"
  on public.works for select to authenticated
  using ((select auth.uid()) = arranger_id);

create policy "Arranjador cadastra obras em seu nome"
  on public.works for insert to authenticated
  with check ((select auth.uid()) = arranger_id);

create policy "Arranjador edita as próprias obras"
  on public.works for update to authenticated
  using ((select auth.uid()) = arranger_id)
  with check ((select auth.uid()) = arranger_id);

create policy "Arranjador remove os próprios rascunhos"
  on public.works for delete to authenticated
  using ((select auth.uid()) = arranger_id and status = 'rascunho');

-- Só a curadoria (service role ou SQL Editor) publica ou retira uma obra do acervo.
create function public.guard_work_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'INSERT' and new.status = 'publicado' then
    raise exception 'Somente a curadoria publica obras.';
  end if;

  if tg_op = 'UPDATE' and old.status = 'publicado' then
    raise exception 'Obras publicadas só são alteradas pela curadoria.';
  end if;

  if tg_op = 'UPDATE' and new.status = 'publicado' then
    raise exception 'Somente a curadoria publica obras.';
  end if;

  return new;
end;
$$;

create trigger works_guard_status
  before insert or update on public.works
  for each row execute function public.guard_work_status();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger works_touch_updated_at
  before update on public.works
  for each row execute function public.touch_updated_at();

-- Acessos e vendas -----------------------------------------------------------
-- Sem políticas de insert: apenas o acervo e o checkout (service role) gravam eventos.

create table public.work_accesses (
  id bigint generated always as identity primary key,
  work_id uuid not null references public.works (id) on delete cascade,
  kind public.access_kind not null,
  occurred_at timestamptz not null default now()
);

create index work_accesses_work_id_occurred_at_idx on public.work_accesses (work_id, occurred_at);

alter table public.work_accesses enable row level security;

create policy "Arranjador vê acessos às próprias obras"
  on public.work_accesses for select to authenticated
  using (exists (
    select 1 from public.works w
    where w.id = work_id and w.arranger_id = (select auth.uid())
  ));

create table public.sales (
  id bigint generated always as identity primary key,
  work_id uuid not null references public.works (id) on delete restrict,
  gross_cents integer not null check (gross_cents >= 0),
  arranger_share_cents integer not null check (arranger_share_cents >= 0),
  sold_at timestamptz not null default now()
);

create index sales_work_id_sold_at_idx on public.sales (work_id, sold_at);

alter table public.sales enable row level security;

create policy "Arranjador vê vendas das próprias obras"
  on public.sales for select to authenticated
  using (exists (
    select 1 from public.works w
    where w.id = work_id and w.arranger_id = (select auth.uid())
  ));

-- Métricas -------------------------------------------------------------------
-- security invoker: as políticas acima continuam valendo dentro das funções.

create function public.arranger_daily_accesses(p_days integer default 30)
returns table (day date, pagina bigint, audio bigint, partitura bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with days as (
    select generate_series(
      (now() at time zone 'America/Sao_Paulo')::date - (p_days - 1),
      (now() at time zone 'America/Sao_Paulo')::date,
      interval '1 day'
    )::date as day
  ),
  events as (
    select (a.occurred_at at time zone 'America/Sao_Paulo')::date as day, a.kind
    from public.work_accesses a
    join public.works w on w.id = a.work_id
    where w.arranger_id = (select auth.uid())
      and a.occurred_at >= now() - make_interval(days => p_days + 1)
  )
  select
    d.day,
    count(e.kind) filter (where e.kind = 'pagina'),
    count(e.kind) filter (where e.kind = 'audio'),
    count(e.kind) filter (where e.kind = 'partitura')
  from days d
  left join events e on e.day = d.day
  group by d.day
  order by d.day;
$$;

create function public.arranger_work_metrics(p_days integer default 30)
returns table (
  work_id uuid,
  title text,
  status public.work_status,
  page_views bigint,
  audio_plays bigint,
  score_previews bigint,
  sales_count bigint,
  gross_cents bigint,
  share_cents bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    w.id,
    w.title,
    w.status,
    coalesce(a.page_views, 0),
    coalesce(a.audio_plays, 0),
    coalesce(a.score_previews, 0),
    coalesce(s.sales_count, 0),
    coalesce(s.gross_cents, 0),
    coalesce(s.share_cents, 0)
  from public.works w
  left join (
    select
      work_id,
      count(*) filter (where kind = 'pagina') as page_views,
      count(*) filter (where kind = 'audio') as audio_plays,
      count(*) filter (where kind = 'partitura') as score_previews
    from public.work_accesses
    where occurred_at >= now() - make_interval(days => p_days)
    group by work_id
  ) a on a.work_id = w.id
  left join (
    select
      work_id,
      count(*) as sales_count,
      sum(gross_cents) as gross_cents,
      sum(arranger_share_cents) as share_cents
    from public.sales
    where sold_at >= now() - make_interval(days => p_days)
    group by work_id
  ) s on s.work_id = w.id
  where w.arranger_id = (select auth.uid())
  order by coalesce(s.share_cents, 0) desc, coalesce(a.page_views, 0) desc, w.created_at desc;
$$;

-- Arquivos -------------------------------------------------------------------
-- Bucket privado em {arranjador}/{obra}/arquivo. Cada arranjador só enxerga a própria pasta
-- e não troca arquivos de obras já publicadas.

create function public.arranger_can_write_object(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select (storage.foldername(object_name))[1] = (select auth.uid())::text
    and not exists (
      select 1 from public.works w
      where w.id::text = (storage.foldername(object_name))[2]
        and w.status = 'publicado'
    );
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'arrangements',
  'arrangements',
  false,
  52428800,
  array[
    'application/pdf',
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'audio/flac'
  ]
)
on conflict (id) do nothing;

create policy "Arranjador lê os próprios arquivos"
  on storage.objects for select to authenticated
  using (bucket_id = 'arrangements' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Arranjador envia arquivos para a própria pasta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'arrangements' and public.arranger_can_write_object(name));

create policy "Arranjador substitui os próprios arquivos"
  on storage.objects for update to authenticated
  using (bucket_id = 'arrangements' and public.arranger_can_write_object(name))
  with check (bucket_id = 'arrangements' and public.arranger_can_write_object(name));

create policy "Arranjador remove os próprios arquivos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'arrangements' and public.arranger_can_write_object(name));
