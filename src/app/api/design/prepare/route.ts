/**
 * Design Preparation API Route
 *
 * POST /api/design/prepare
 *
 * Prepares AI-generated designs for print-on-demand production.
 * Runs complete pipeline: validation, upscaling, optimization, and storage upload.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prepareDesignForPrint } from '@/lib/design/prepare-for-print';

/**
 * Request validation schema
 */
const prepareRequestSchema = z.object({
  designId: z.string().min(1, 'Design ID is required'),
});

/**
 * POST /api/design/prepare
 *
 * Prepare a design for print production
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request
    const body = await request.json();
    const validation = prepareRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { designId } = validation.data;

    console.log('[Design Prepare API] Request:', {
      userId: clerkUserId,
      designId,
    });

    // 3. Verify design ownership
    const { prisma } = await import('@/lib/prisma');
    const { getSupabaseUser } = await import('@/lib/clerk/server');

    const user = await getSupabaseUser(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { userId: true, name: true },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    if (design.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Design belongs to another user' },
        { status: 403 }
      );
    }

    console.log('[Design Prepare API] Design verified:', design.name);

    // 4. Run preparation pipeline
    console.log('[Design Prepare API] Starting preparation pipeline...');
    const result = await prepareDesignForPrint(designId);

    if (!result.success) {
      console.error('[Design Prepare API] Preparation failed:', result.error);
      return NextResponse.json(
        {
          error: 'Preparation failed',
          message: result.error,
        },
        { status: 500 }
      );
    }

    // 5. Log success
    const duration = Date.now() - startTime;
    console.log('[Design Prepare API] Success:', {
      designId,
      duration: `${duration}ms`,
      upscaled: result.metadata?.upscaled,
      finalDimensions: result.metadata?.finalDimensions,
    });

    // 6. Return result
    return NextResponse.json({
      success: true,
      printReadyUrl: result.printReadyUrl,
      thumbnailUrl: result.thumbnailUrl,
      metadata: result.metadata,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Design Prepare API] Error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      // Replicate API errors
      if (error.message.includes('Replicate')) {
        return NextResponse.json(
          {
            error: 'Upscaling service error',
            message: 'Failed to upscale design. Please try again later.',
          },
          { status: 503 }
        );
      }

      // Supabase storage errors
      if (error.message.includes('Storage') || error.message.includes('upload')) {
        return NextResponse.json(
          {
            error: 'Storage error',
            message: 'Failed to save print-ready design. Please try again later.',
          },
          { status: 503 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          error: 'Preparation failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/design/prepare?designId={id}
 *
 * Check preparation status for a design
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get designId from query params
    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('designId');

    if (!designId) {
      return NextResponse.json(
        { error: 'designId query parameter is required' },
        { status: 400 }
      );
    }

    // 3. Fetch design
    const { prisma } = await import('@/lib/prisma');
    const { getSupabaseUser } = await import('@/lib/clerk/server');

    const user = await getSupabaseUser(clerkUserId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: {
        userId: true,
        printReadyUrl: true,
        printReadyMetadata: true,
        preparedAt: true,
      },
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    if (design.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // 4. Return status
    return NextResponse.json({
      prepared: !!design.printReadyUrl,
      printReadyUrl: design.printReadyUrl,
      metadata: design.printReadyMetadata,
      preparedAt: design.preparedAt,
    });
  } catch (error) {
    console.error('[Design Prepare API] GET Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
