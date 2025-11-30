/**
 * Supabase Server Helper Functions
 *
 * Convenience functions for common server-side Supabase operations
 */

import { createServerClient } from "./client";
import { redirect } from "next/navigation";
import type { User, Session } from "@supabase/supabase-js";

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
