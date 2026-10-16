-- Curadoria: marca no perfil, recado na obra, leitura da fila e decisão de revisão.
-- Cole no SQL Editor do projeto Supabase depois da 0001.

-- Perfis: curador -------------------------------------------------------------

alter table public.profiles
  add column if not exists is_curator boolean not null default false;

create function public.guard_profile_is_curator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if tg_op = 'UPDATE' and new.is_curator is distinct from old.is_curator then
    raise exception 'Somente a curadoria altera a marca de curador.';
  end if;

  if tg_op = 'INSERT' and new.is_curator then
    raise exception 'Somente a curadoria altera a marca de curador.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_is_curator on public.profiles;
create trigger profiles_guard_is_curator
  before insert or update on public.profiles
  for each row execute function public.guard_profile_is_curator();

-- security definer: evita recursão de RLS (políticas de curador chamam is_curator,
-- que por sua vez lê profiles).
create or replace function public.is_curator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_curator from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_curator() from public;
grant execute on function public.is_curator() to authenticated;

create policy "Curador lê perfil de quem enviou obra em revisão"
  on public.profiles for select to authenticated
  using (
    public.is_curator()
    and exists (
      select 1
      from public.works w
      where w.arranger_id = profiles.id
        and w.status = 'em_revisao'
    )
  );

-- Obras: recado e leitura da fila --------------------------------------------

alter table public.works
  add column if not exists review_note text
  check (review_note is null or char_length(review_note) <= 500);

create policy "Curador lê obras em revisão"
  on public.works for select to authenticated
  using (public.is_curator() and status = 'em_revisao');

-- Storage: curador lê arquivos de obras em revisão ---------------------------

create or replace function public.curator_can_read_object(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.is_curator()
    and exists (
      select 1
      from public.works w
      where w.id::text = (storage.foldername(object_name))[2]
        and w.status = 'em_revisao'
    );
$$;

create policy "Curador lê arquivos de obras em revisão"
  on storage.objects for select to authenticated
  using (bucket_id = 'arrangements' and public.curator_can_read_object(name));

-- Decisão de revisão ---------------------------------------------------------

create or replace function public.review_work(
  p_work_id uuid,
  p_decision text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_updated integer;
begin
  if v_uid is null then
    raise exception 'É preciso estar autenticado.';
  end if;

  if not coalesce(
    (select p.is_curator from public.profiles p where p.id = v_uid),
    false
  ) then
    raise exception 'Somente a curadoria revisa obras.';
  end if;

  if p_decision = 'aprovar' then
    update public.works
    set status = 'publicado', review_note = null
    where id = p_work_id
      and status = 'em_revisao';
    get diagnostics v_updated = row_count;
  elsif p_decision = 'devolver' then
    if v_note is null or char_length(v_note) < 8 or char_length(v_note) > 500 then
      raise exception 'O recado da devolução precisa ter entre 8 e 500 caracteres.';
    end if;

    update public.works
    set status = 'rascunho', review_note = v_note
    where id = p_work_id
      and status = 'em_revisao';
    get diagnostics v_updated = row_count;
  else
    raise exception 'Decisão inválida.';
  end if;

  if v_updated = 0 then
    raise exception 'Obra não encontrada ou já não está em revisão.';
  end if;
end;
$$;

revoke all on function public.review_work(uuid, text, text) from public;
grant execute on function public.review_work(uuid, text, text) to authenticated;

-- Exemplo (rode à mão depois da migração):
-- update public.profiles
-- set is_curator = true
-- where id = (select id from auth.users where email = 'curador@exemplo.com');
