"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurator } from "@/lib/arranger/session";
import { ARRANGEMENTS_BUCKET, PREVIEWS_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOTE_MIN = 8;
const NOTE_MAX = 500;

export type ReviewActionResult = { ok: false; error: string } | void;

export async function signOutCurator() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/curadoria/entrar");
}

export async function approveWork(workId: string): Promise<ReviewActionResult> {
  if (!UUID_PATTERN.test(workId)) return { ok: false, error: "Obra não encontrada." };

  const { supabase } = await requireCurator();

  const { data: work } = await supabase
    .from("works")
    .select("preview_path, status")
    .eq("id", workId)
    .eq("status", "em_revisao")
    .maybeSingle();

  if (!work) return { ok: false, error: "Esta obra já saiu da fila de revisão." };

  if (work.preview_path) {
    const copied = await copyPublicPreview(supabase, workId, work.preview_path);
    if (!copied.ok) return copied;
  }

  const { error } = await supabase.rpc("review_work", {
    p_work_id: workId,
    p_decision: "aprovar",
    p_note: null,
  });

  if (error) {
    return { ok: false, error: mapReviewError(error.message) };
  }

  revalidatePath("/curadoria", "layout");
  revalidatePath("/arranjador", "layout");
  revalidatePath("/acervo", "layout");
  redirect("/curadoria?feita=aprovada");
}

export async function returnWork(workId: string, note: string): Promise<ReviewActionResult> {
  if (!UUID_PATTERN.test(workId)) return { ok: false, error: "Obra não encontrada." };

  const trimmed = note.trim();
  if (trimmed.length < NOTE_MIN) {
    return { ok: false, error: `Escreva um recado com ao menos ${NOTE_MIN} caracteres.` };
  }
  if (trimmed.length > NOTE_MAX) {
    return { ok: false, error: `Use até ${NOTE_MAX} caracteres no recado.` };
  }

  const { supabase } = await requireCurator();
  const { error } = await supabase.rpc("review_work", {
    p_work_id: workId,
    p_decision: "devolver",
    p_note: trimmed,
  });

  if (error) {
    return { ok: false, error: mapReviewError(error.message) };
  }

  revalidatePath("/curadoria", "layout");
  revalidatePath("/arranjador", "layout");
  redirect("/curadoria?feita=devolvida");
}

async function copyPublicPreview(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workId: string,
  previewPath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: blob, error: downloadError } = await supabase.storage.from(ARRANGEMENTS_BUCKET).download(previewPath);
  if (downloadError || !blob) {
    return { ok: false, error: "Não foi possível ler a prévia da grade. Peça ao arranjador para reenviar o PDF." };
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(PREVIEWS_BUCKET).upload(`${workId}.jpg`, bytes, {
    contentType: "image/jpeg",
    cacheControl: "86400",
    upsert: false,
  });

  if (uploadError && !alreadyStored(uploadError)) {
    return { ok: false, error: "Não foi possível publicar a prévia da primeira página. Tente aprovar de novo." };
  }

  return { ok: true };
}

function alreadyStored(error: { message: string; status?: number; statusCode?: string | number }) {
  const status = String(error.statusCode ?? error.status ?? "");
  return status === "409" || /already exists|duplicate/i.test(error.message);
}

function mapReviewError(message: string) {
  if (message.includes("já não está em revisão") || message.includes("não encontrada")) {
    return "Esta obra já saiu da fila de revisão.";
  }
  if (message.includes("recado")) {
    return "Escreva um recado com entre 8 e 500 caracteres.";
  }
  if (message.includes("curadoria")) {
    return "Esta conta não pode revisar obras.";
  }
  return "Não foi possível registrar a decisão. Tente novamente.";
}
