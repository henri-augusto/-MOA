-- Caminhos de arquivo só podem apontar para a pasta desta obra.
-- Cole no SQL Editor depois da 0009.
-- Os nomes batem com FILE_NAMES e PREVIEW_FILE_NAME em lib/arranger/work-form.ts.
-- Se o ALTER falhar, alguma obra tem score_path, parts_path, audio_path ou preview_path
-- fora desse padrão; corrija a linha antes de rodar de novo.

alter table public.works
  drop constraint if exists works_score_path_check;

alter table public.works
  add constraint works_score_path_check
  check (
    score_path is null
    or score_path = arranger_id::text || '/' || id::text || '/grade.pdf'
  );

alter table public.works
  drop constraint if exists works_parts_path_check;

alter table public.works
  add constraint works_parts_path_check
  check (
    parts_path is null
    or parts_path = arranger_id::text || '/' || id::text || '/partes.pdf'
  );

alter table public.works
  drop constraint if exists works_audio_path_check;

alter table public.works
  add constraint works_audio_path_check
  check (
    audio_path is null
    or audio_path = arranger_id::text || '/' || id::text || '/audio-referencia'
  );

alter table public.works
  drop constraint if exists works_preview_path_check;

alter table public.works
  add constraint works_preview_path_check
  check (
    preview_path is null
    or preview_path = arranger_id::text || '/' || id::text || '/preview.jpg'
  );
