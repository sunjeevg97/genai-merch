/**
 * POST /api/designs/save
 *
 * Save design to database
 *
 * Request:
 * - {
 *     name: string,
 *     imageUrl: string,
 *     vectorUrl?: string,
 *     metadata?: object,
 *     aiPrompt?: string
 *   }
 *
 * Response:
 * - { id: string, ...design }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * Request validation schema
 */
const saveDesignSchema = z.object({
  name: z.string().min(1, 'Design name is required').max(255),
  imageUrl: z.string().url('Image URL must be a valid URL'),
  vectorUrl: z.string().url().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  aiPrompt: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validation = saveDesignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, imageUrl, vectorUrl, metadata, aiPrompt } = validation.data;

    console.log('[Design Save] Creating design with data:', {
      userId: user.id,
      name,
      imageUrl,
      vectorUrl,
      metadata,
      aiPrompt,
    });

    // 3. Ensure user exists in database (create if doesn't exist)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      },
    });

    // 4. Create design record in database
    const design = await prisma.design.create({
      data: {
        userId: user.id,
        name,
        imageUrl,
        vectorUrl: vectorUrl || null,
        metadata: (metadata || {}) as any,
        aiPrompt: aiPrompt || null,
      },
    });

    console.log('[Design Save] Design saved successfully:', {
      id: design.id,
      userId: user.id,
      name: design.name,
    });

    // 4. Return created design
    return NextResponse.json({
      success: true,
      data: design,
    });
  } catch (error) {
    console.error('[Design Save] Error:', error);

    // Log detailed error information
    if (error instanceof Error) {
      console.error('[Design Save] Error message:', error.message);
      console.error('[Design Save] Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to save design',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
