import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase is not fully configured. Data routes will fail until env is complete.");
}

export const supabaseAdmin = createClient(
  env.SUPABASE_URL ?? "https://example.supabase.co",
  env.SUPABASE_SERVICE_ROLE_KEY ?? "missing-service-role-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
