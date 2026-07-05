import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@gopher/shared-types";

/**
 * Minimal storage interface auth persistence needs. Each app supplies its
 * own implementation:
 *   - apps/mobile -> wraps expo-secure-store
 *   - apps/admin  -> wraps cookies (via a Next.js-compatible adapter)
 */
export interface AuthStorageAdapter {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}

export interface CreateGopherClientOptions {
  supabaseUrl: string;
  supabaseAnonKey: string;
  storage: AuthStorageAdapter;
}

export type GopherClient = SupabaseClient<Database>;

export function createGopherClient(options: CreateGopherClientOptions): GopherClient {
  const { supabaseUrl, supabaseAnonKey, storage } = options;

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

// Shared query functions (getOpenErrands, etc.) will be added here as
// features are built — intentionally left minimal until then.
