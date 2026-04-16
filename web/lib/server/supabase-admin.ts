import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Supabase server env is incomplete for generated app routes.");
}

export const supabaseAdmin = createClient(supabaseUrl ?? "https://example.supabase.co", supabaseServiceRoleKey ?? "missing", {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
