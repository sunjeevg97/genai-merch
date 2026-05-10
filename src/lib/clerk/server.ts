/**
 * Clerk Server Helpers
 *
 * Server-side authentication helpers for Clerk integration
 * Use these instead of Supabase auth helpers
 */

import { auth, clerkClient } from '@clerk/nextjs/server';
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
 * Auto-creates user if they exist in Clerk but not in database (webhook fallback)
 *
 * @param clerkUserId - Clerk user ID
 * @returns Supabase User record or null if not found in Clerk
 * @example
 * const user = await getSupabaseUser(clerkUserId);
 * if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
 * await prisma.design.create({ data: { userId: user.id, ... } });
 */
export async function getSupabaseUser(clerkUserId: string) {
  // First, try to find user in database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });

  // If user doesn't exist, auto-create from Clerk data (webhook fallback)
  if (!user) {
    console.log(`[Clerk] User ${clerkUserId} not found in database, fetching from Clerk...`);

    try {
      // Fetch user details from Clerk
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(clerkUserId);

      // Extract email (primary email address)
      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

      if (!email) {
        console.error('[Clerk] No email found for user:', clerkUserId);
        throw new Error('No email address found on Clerk account');
      }

      // Extract name
      const name = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`.trim()
        : clerkUser.firstName || clerkUser.lastName || null;

      // Create or update user in database
      // Use upsert to handle case where email exists with different clerkId
      console.log(`[Clerk] Creating/updating user in database: ${email}`);
      user = await prisma.user.upsert({
        where: { email },
        update: {
          clerkId: clerkUserId, // Update to new Clerk ID
          name: name || undefined, // Only update name if provided
        },
        create: {
          clerkId: clerkUserId,
          email,
          name,
        },
      });

      console.log(`[Clerk] User synced successfully: ${user.id} (clerkId updated: ${user.clerkId === clerkUserId})`);
    } catch (error) {
      console.error('[Clerk] Failed to auto-create user:', error);
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`User sync failed: ${error.message}`);
      }
      throw new Error('User sync failed: Unknown error');
    }
  }

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
 * Auto-creates user if they exist in Clerk but not in database
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
    // This should rarely happen - only if Clerk API fails
    throw new Error('Unable to sync user account. Please try again or contact support.');
  }

  return user;
}
