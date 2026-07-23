// Supabase client for use in SERVER COMPONENTS, SERVER ACTIONS, and ROUTE
// HANDLERS. Reads/writes the user's auth cookies so RLS policies apply
// automatically — you never manually check "is this the right user" here,
// Postgres does it for you via the policies in supabase/migrations.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

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
            // Called from a Server Component that can't set cookies — safe to
            // ignore because middleware.ts refreshes the session on every request.
          }
        },
      },
    }
  );
}

// A second client using the SERVICE ROLE key. This BYPASSES RLS entirely.
// Only ever import this inside server-only files (route handlers / server
// actions) for tightly-scoped admin tasks (e.g. generating a signed download
// URL after you've already checked permissions yourself). Never expose the
// service role key to the browser.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
