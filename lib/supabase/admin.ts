import "server-only";

import { createClient } from "@supabase/supabase-js";
import { supabaseEnv, supabaseServiceRoleKey } from "./env";

export function createAdminClient() {
  const { url } = supabaseEnv();
  return createClient(url, supabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
