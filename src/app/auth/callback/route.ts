/**
 * Auth Callback Route Handler
 *
 * Handles the OAuth callback from Supabase after email confirmation
 * or OAuth provider authentication.
 *
 * Flow:
 * 1. User clicks confirmation link in email
 * 2. Supabase redirects to this route with code
 * 3. Exchange code for session
 * 4. Redirect to dashboard or intended destination
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If no code or error occurred, redirect to signin with error
  return NextResponse.redirect(
    new URL('/signin?error=Could not authenticate user', requestUrl.origin)
  );
}
