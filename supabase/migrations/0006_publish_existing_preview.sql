-- Obra já publicada: o arranjador pode enviar a página 1 para o bucket público.
-- A cópia na aprovação continua com a política da 0005 (obra em revisão).
-- Cole no SQL Editor do projeto Supabase depois da 0005.

create or replace function public.arranger_can_publish_preview(object_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select object_name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
    and exists (
      select 1
      from public.works w
      where w.id::text = left(object_name, 36)
        and w.arranger_id = (select auth.uid())
        and w.status = 'publicado'
        and (w.score_path is not null or w.preview_path is not null)
    );
$$;

revoke all on function public.arranger_can_publish_preview(text) from public;
grant execute on function public.arranger_can_publish_preview(text) to authenticated;

drop policy if exists "Arranjador publica a prévia da própria obra" on storage.objects;
create policy "Arranjador publica a prévia da própria obra"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'previews' and public.arranger_can_publish_preview(name));
