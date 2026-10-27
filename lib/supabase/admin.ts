import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

function supabaseServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Supabase não configurado: defina SUPABASE_SERVICE_ROLE_KEY em .env.local.");
  }
  return key;
}

export function createAdminClient() {
  const { url } = supabaseEnv();
  return createClient(url, supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
