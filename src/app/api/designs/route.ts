/**
 * GET /api/designs
 *
 * Fetch user's saved designs with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseUser } from '@/lib/clerk/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user with Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Supabase user for database operations
    const user = await getSupabaseUser(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || undefined;

    // 3. Build where clause
    const where: any = {
      userId: user.id,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { aiPrompt: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 4. Fetch designs from database
    const [designs, totalCount] = await Promise.all([
      prisma.design.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          imageUrl: true,
          vectorUrl: true,
          metadata: true,
          aiPrompt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.design.count({ where }),
    ]);

    // 5. Return designs with pagination info
    return NextResponse.json({
      success: true,
      data: {
        designs,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + designs.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('[Designs API] Error fetching designs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    );
  }
}
