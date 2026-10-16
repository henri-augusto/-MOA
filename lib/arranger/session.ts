import "server-only";

import { io } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireArranger() {
  // getClaims() compares the JWT expiry with Date.now(). Partial prefetching
  // only allows that read after the render leaves the prefetch stages.
  await io();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/arranjador/entrar");
  }

  return { supabase, userId };
}
