/**
 * Supabase Browser Client
 *
 * This file provides the browser client for Client Components only.
 * For Server Components, use imports from '@/lib/supabase/server'
 */

import { createBrowserClient as createClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Create a Supabase client for Client Components
 *
 * Usage:
 * ```tsx
 * 'use client'
 * import { createBrowserClient } from '@/lib/supabase/client'
 *
 * const supabase = createBrowserClient()
 * const { data } = await supabase.from('table').select()
 * ```
 */
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
