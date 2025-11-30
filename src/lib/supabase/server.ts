/**
 * Supabase Server Functions
 *
 * Server-only Supabase clients and helper functions
 * DO NOT import this file in Client Components
 */

import { createServerClient as createSsrServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";
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

/**
 * Get the currently authenticated user
 *
 * @returns User object or null if not authenticated
 *
 * Usage:
 * ```tsx
 * import { getUser } from '@/lib/supabase/server'
 *
 * const user = await getUser()
 * if (!user) {
 *   redirect('/signin')
 * }
 * ```
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 *
 * @returns Session object or null if not authenticated
 *
 * Usage:
 * ```tsx
 * import { getSession } from '@/lib/supabase/server'
 *
 * const session = await getSession()
 * if (!session) {
 *   redirect('/signin')
 * }
 * ```
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Sign out the current user
 *
 * Usage:
 * ```tsx
 * import { signOut } from '@/lib/supabase/server'
 *
 * await signOut()
 * ```
 */
export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
}

/**
 * Require authentication - redirect to signin if not authenticated
 *
 * @param redirectTo - Optional path to redirect after signin
 * @returns User object
 *
 * Usage:
 * ```tsx
 * import { requireAuth } from '@/lib/supabase/server'
 *
 * export default async function ProtectedPage() {
 *   const user = await requireAuth()
 *   // User is guaranteed to be authenticated here
 * }
 * ```
 */
export async function requireAuth(redirectTo?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    const redirectPath = redirectTo ? `/signin?redirect=${redirectTo}` : "/signin";
    redirect(redirectPath);
  }
  return user;
}
