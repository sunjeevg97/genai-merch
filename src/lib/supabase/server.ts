/**
 * Supabase Server Functions
 *
 * Server-only Supabase clients for database and storage operations
 * Authentication is handled by Clerk - see @/lib/clerk/server
 * DO NOT import this file in Client Components
 */

import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Create a Supabase client for Server Components
 *
 * Usage:
 * ```tsx
 * import { createServerClient } from '@/lib/supabase/server'
 *
 * const supabase = await createServerClient()
 * const { data } = await supabase.from('table').select()
 * ```
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSsrServerClient<Database>(
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with service role privileges
 *
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS)
 * Only use for admin operations on the server side
 *
 * Usage:
 * ```tsx
 * import { createServiceClient } from '@/lib/supabase/server'
 *
 * const supabase = createServiceClient()
 * // Admin operations that bypass RLS
 * const { data } = await supabase.from('table').select()
 * ```
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
