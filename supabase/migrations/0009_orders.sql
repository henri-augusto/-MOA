-- Pedidos do acervo, conta Stripe do arranjador e reembolsos nas métricas.
-- Cole no SQL Editor depois da 0008.

alter table public.profiles
  add column if not exists stripe_account_id text,
  add column if not exists payouts_ready boolean not null default false;

create unique index if not exists profiles_stripe_account_id_uidx
  on public.profiles (stripe_account_id)
  where stripe_account_id is not null;

create type public.order_status as enum ('pending', 'paid', 'refunded', 'failed');

create table public.orders (
  id bigint generated always as identity primary key,
  work_id uuid not null references public.works (id) on delete restrict,
  arranger_id uuid not null references public.profiles (id) on delete restrict,
  buyer_name text not null check (char_length(buyer_name) between 1 and 160),
  buyer_email text not null check (char_length(buyer_email) between 3 and 254),
  ensemble text not null check (char_length(ensemble) between 1 and 200),
  gross_cents integer not null check (gross_cents >= 0),
  platform_fee_cents integer not null check (platform_fee_cents >= 0),
  arranger_share_cents integer not null check (arranger_share_cents >= 0),
  stripe_payment_intent_id text unique,
  status public.order_status not null default 'pending',
  access_token_hash text not null unique,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint orders_fee_sum_check check (platform_fee_cents + arranger_share_cents = gross_cents)
);

create index orders_work_id_created_at_idx on public.orders (work_id, created_at desc);
create index orders_arranger_id_created_at_idx on public.orders (arranger_id, created_at desc);
create index orders_status_created_at_idx on public.orders (status, created_at desc);

alter table public.orders enable row level security;

-- Sem políticas de select/insert/update para anon/authenticated:
-- só a service role (checkout e webhook) lê e grava pedidos.

alter table public.sales
  add column if not exists order_id bigint unique references public.orders (id) on delete restrict,
  add column if not exists refunded_at timestamptz;

create or replace function public.arranger_work_metrics(p_days integer default 30)
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
      and refunded_at is null
    group by work_id
  ) s on s.work_id = w.id
  where w.arranger_id = (select auth.uid())
  order by coalesce(s.share_cents, 0) desc, coalesce(a.page_views, 0) desc, w.created_at desc;
$$;

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
  has_audio boolean,
  can_purchase boolean
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
    (w.audio_path is not null and btrim(w.audio_path) <> '') as has_audio,
    (p.payouts_ready and p.stripe_account_id is not null) as can_purchase
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
  has_audio boolean,
  can_purchase boolean
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
    (w.audio_path is not null and btrim(w.audio_path) <> '') as has_audio,
    (p.payouts_ready and p.stripe_account_id is not null) as can_purchase
  from public.works w
  join public.profiles p on p.id = w.arranger_id
  where w.id = p_id
    and w.status = 'publicado';
$$;

revoke all on function public.published_catalog() from public;
revoke all on function public.published_work(uuid) from public;
grant execute on function public.published_catalog() to anon, authenticated;
grant execute on function public.published_work(uuid) to anon, authenticated;
