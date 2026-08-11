import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gopher/shared-types";

/**
 * Service-role client — bypasses RLS entirely and can call the Auth
 * Admin API (updateUserById, etc). ONLY ever import this inside a
 * Server Action or Route Handler, never in a Client Component, never
 * in a file that could end up in the browser bundle. SUPABASE_SERVICE_ROLE_KEY
 * is not prefixed NEXT_PUBLIC_, so Next.js already refuses to bundle
 * it client-side — this factory is the deliberate, narrow place that
 * key is actually used.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
