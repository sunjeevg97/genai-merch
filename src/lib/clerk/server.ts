/**
 * Clerk Server Helpers
 *
 * Server-side authentication helpers for Clerk integration
 * Use these instead of Supabase auth helpers
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

/**
 * Get current Clerk user ID
 * Returns null if not authenticated
 *
 * @example
 * const userId = await getClerkUserId();
 * if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

/**
 * Require authentication and return Clerk user ID
 * Redirects to signin if not authenticated
 *
 * @param redirectTo - Optional path to redirect back to after signin
 * @example
 * const userId = await requireClerkAuth('/design/create');
 */
export async function requireClerkAuth(redirectTo?: string): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    const redirectUrl = redirectTo ? `/signin?redirect=${redirectTo}` : '/signin';
    redirect(redirectUrl);
  }

  return userId;
}

/**
 * Get Supabase User record from Clerk user ID
 * Useful for database operations that need the Supabase user record
 *
 * @param clerkUserId - Clerk user ID
 * @returns Supabase User record or null if not found
 * @example
 * const user = await getSupabaseUser(clerkUserId);
 * if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
 * await prisma.design.create({ data: { userId: user.id, ... } });
 */
export async function getSupabaseUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  return user;
}

/**
 * Get current Supabase user from Clerk session
 * Combines getClerkUserId() and getSupabaseUser()
 *
 * @returns Supabase User record or null if not authenticated or not found
 * @example
 * const user = await getCurrentUser();
 * if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function getCurrentUser() {
  const clerkUserId = await getClerkUserId();

  if (!clerkUserId) {
    return null;
  }

  return await getSupabaseUser(clerkUserId);
}

/**
 * Require authentication and return Supabase user
 * Redirects to signin if not authenticated
 * Throws error if user not found in database (webhook hasn't synced yet)
 *
 * @param redirectTo - Optional path to redirect back to after signin
 * @example
 * const user = await requireUser('/design/create');
 * await prisma.design.create({ data: { userId: user.id, ... } });
 */
export async function requireUser(redirectTo?: string) {
  const clerkUserId = await requireClerkAuth(redirectTo);

  const user = await getSupabaseUser(clerkUserId);

  if (!user) {
    // User exists in Clerk but not synced to Supabase yet
    // This should rarely happen - only if webhook is delayed
    throw new Error('User not found in database. Please try again in a moment.');
  }

  return user;
}
