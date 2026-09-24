import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server contexts only (the daily cron job).
// This bypasses Row Level Security, so it must never be exposed to the browser
// and must never be imported from client components.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
