import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@gopher/shared-types";

/**
 * For use in Server Components, Route Handlers, and Server Actions.
 * next/headers' cookies() is async as of Next.js 15+, so this factory
 * is async too — call it with `await createClient()`.
 *
 * The try/catch around setAll matches Supabase's own Next.js SSR guide:
 * a Server Component can't write cookies (only Middleware and Route
 * Handlers can), so this silently no-ops there. Session refresh still
 * works correctly because middleware.ts refreshes the session on every
 * request before Server Components ever run.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — expected, see comment above.
          }
        },
      },
    }
  );
}
