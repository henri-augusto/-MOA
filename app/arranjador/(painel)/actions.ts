"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FORMATIONS } from "@/lib/arranger/catalog";
import { requireArranger } from "@/lib/arranger/session";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/arranjador/entrar");
}

type ProfileField = "fullName" | "artistName" | "city" | "bio" | "formations";

export type ProfileState = {
  error?: string;
  saved?: boolean;
  fieldErrors?: Partial<Record<ProfileField, string>>;
};

const BIO_LIMIT = 600;

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const { supabase, userId } = await requireArranger();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const artistName = String(formData.get("artistName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const formations = formData
    .getAll("formations")
    .map(String)
    .filter((value): value is (typeof FORMATIONS)[number] => (FORMATIONS as readonly string[]).includes(value));

  const fieldErrors: ProfileState["fieldErrors"] = {};
  if (fullName.length < 2) fieldErrors.fullName = "Informe seu nome.";
  if (artistName.length > 120) fieldErrors.artistName = "Use até 120 caracteres.";
  if (city.length > 120) fieldErrors.city = "Use até 120 caracteres.";
  if (bio.length > BIO_LIMIT) fieldErrors.bio = `Use até ${BIO_LIMIT} caracteres.`;
  if (formations.length === 0) fieldErrors.formations = "Escolha ao menos uma formação.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      artist_name: artistName || null,
      city: city || null,
      bio: bio || null,
      formations,
    })
    .eq("id", userId);

  if (error) return { error: "Não foi possível salvar o perfil. Tente novamente." };

  revalidatePath("/arranjador", "layout");
  return { saved: true };
}
