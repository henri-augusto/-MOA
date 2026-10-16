"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireArranger } from "@/lib/arranger/session";
import {
  FILE_NAMES,
  reviewRequirementErrors,
  validateWorkDraft,
  type FileSlot,
  type WorkDraft,
  type WorkErrors,
  type WorkIntent,
} from "@/lib/arranger/work-form";
import { ARRANGEMENTS_BUCKET } from "@/lib/supabase/env";

export type ActionFailure = { ok: false; error?: string; fieldErrors?: WorkErrors };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveWorkDetails(
  workId: string | null,
  draft: WorkDraft,
): Promise<{ ok: true; id: string } | ActionFailure> {
  const { supabase, userId } = await requireArranger();
  const { errors, values } = validateWorkDraft(draft);
  if (!values) return { ok: false, fieldErrors: errors };

  if (workId) {
    if (!UUID_PATTERN.test(workId)) return { ok: false, error: "Obra não encontrada." };

    const { data, error } = await supabase
      .from("works")
      .update(values)
      .eq("id", workId)
      .eq("arranger_id", userId)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: "Não foi possível salvar. Obras publicadas só mudam com a curadoria." };
    }
    return { ok: true, id: data.id as string };
  }

  const { data, error } = await supabase
    .from("works")
    .insert({ ...values, arranger_id: userId, status: "rascunho" })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Não foi possível cadastrar a obra. Tente novamente." };
  return { ok: true, id: data.id as string };
}

export async function attachWorkFiles(
  workId: string,
  uploaded: FileSlot[],
  intent: WorkIntent,
): Promise<{ ok: true } | ActionFailure> {
  const { supabase, userId } = await requireArranger();
  if (!UUID_PATTERN.test(workId)) return { ok: false, error: "Obra não encontrada." };

  const { data: work } = await supabase
    .from("works")
    .select("score_path, parts_path, audio_path, status")
    .eq("id", workId)
    .eq("arranger_id", userId)
    .maybeSingle();

  if (!work) return { ok: false, error: "Obra não encontrada." };
  if (work.status === "publicado") return { ok: false, error: "Obras publicadas só mudam com a curadoria." };

  const folder = `${userId}/${workId}`;
  const paths = {
    score_path: uploaded.includes("score") ? `${folder}/${FILE_NAMES.score}` : (work.score_path as string | null),
    parts_path: uploaded.includes("parts") ? `${folder}/${FILE_NAMES.parts}` : (work.parts_path as string | null),
    audio_path: uploaded.includes("audio") ? `${folder}/${FILE_NAMES.audio}` : (work.audio_path as string | null),
  };

  if (intent === "revisao") {
    const missing = reviewRequirementErrors(Boolean(paths.score_path), Boolean(paths.parts_path));
    if (Object.keys(missing).length > 0) {
      await supabase.from("works").update(paths).eq("id", workId);
      return { ok: false, fieldErrors: missing, error: "A obra foi salva como rascunho; faltam arquivos para a revisão." };
    }
  }

  const { error } = await supabase
    .from("works")
    .update({ ...paths, status: intent === "revisao" ? "em_revisao" : "rascunho" })
    .eq("id", workId);

  if (error) return { ok: false, error: "Os arquivos subiram, mas não foi possível registrar a obra. Tente novamente." };

  revalidatePath("/arranjador", "layout");
  return { ok: true };
}

export async function deleteWork(workId: string): Promise<ActionFailure> {
  const { supabase, userId } = await requireArranger();
  if (!UUID_PATTERN.test(workId)) return { ok: false, error: "Obra não encontrada." };

  const { data: work } = await supabase
    .from("works")
    .select("status")
    .eq("id", workId)
    .eq("arranger_id", userId)
    .maybeSingle();

  if (!work) return { ok: false, error: "Obra não encontrada." };
  if (work.status !== "rascunho") {
    return { ok: false, error: "Só rascunhos podem ser excluídos. Volte a obra para rascunho antes." };
  }

  const folder = `${userId}/${workId}`;
  const { data: files } = await supabase.storage.from(ARRANGEMENTS_BUCKET).list(folder);
  if (files && files.length > 0) {
    await supabase.storage.from(ARRANGEMENTS_BUCKET).remove(files.map((file) => `${folder}/${file.name}`));
  }

  const { error } = await supabase.from("works").delete().eq("id", workId).eq("arranger_id", userId);
  if (error) return { ok: false, error: "Não foi possível excluir a obra. Tente novamente." };

  revalidatePath("/arranjador", "layout");
  redirect("/arranjador/obras");
}
