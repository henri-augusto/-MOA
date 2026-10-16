import "server-only";

import { io } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

async function sessionUserId() {
  // getClaims() compares the JWT expiry with Date.now(). Partial prefetching
  // only allows that read after the render leaves the prefetch stages.
  await io();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims?.sub as string | undefined };
}

export const requireArranger = cache(async () => {
  const { supabase, userId } = await sessionUserId();

  if (!userId) {
    redirect("/arranjador/entrar");
  }

  return { supabase, userId };
});

export const requireCurator = cache(async () => {
  const { supabase, userId } = await sessionUserId();

  if (!userId) {
    redirect("/curadoria/entrar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_curator")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.is_curator) {
    redirect("/curadoria/acesso-negado");
  }

  return { supabase, userId };
});

export const getCuratorFlag = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("is_curator").eq("id", userId).maybeSingle();
  if (error) return false;
  return Boolean(data?.is_curator);
});
