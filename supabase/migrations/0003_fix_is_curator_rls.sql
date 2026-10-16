-- Corrige recursão de RLS: is_curator() lia profiles sob as mesmas políticas
-- que chamam is_curator(), o que travava cada consulta autenticada.
-- Cole no SQL Editor depois da 0002.

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
