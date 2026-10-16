-- Eventos de exemplo para conferir o painel de métricas. Opcional; não rode em produção.
-- 1. Cadastre-se pelo app e crie ao menos uma obra.
-- 2. Troque o e-mail abaixo pelo da sua conta de teste e execute no SQL Editor.

with arranger as (
  select id from auth.users where email = 'voce@exemplo.com'
),
arranger_works as (
  select w.id from public.works w join arranger a on a.id = w.arranger_id
)
insert into public.work_accesses (work_id, kind, occurred_at)
select
  w.id,
  (array['pagina', 'pagina', 'pagina', 'pagina', 'audio', 'audio', 'partitura'])[1 + floor(random() * 7)::int]::public.access_kind,
  now() - random() * interval '30 days'
from arranger_works w
cross join generate_series(1, 140);

-- Repasse de exemplo em 70% do valor bruto, só para preencher a tabela.
with arranger as (
  select id from auth.users where email = 'voce@exemplo.com'
),
arranger_works as (
  select w.id, w.price_cents from public.works w join arranger a on a.id = w.arranger_id
)
insert into public.sales (work_id, gross_cents, arranger_share_cents, sold_at)
select
  w.id,
  w.price_cents,
  round(w.price_cents * 0.7)::int,
  now() - random() * interval '30 days'
from arranger_works w
cross join generate_series(1, 1 + floor(random() * 6)::int);
