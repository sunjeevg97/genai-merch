/**
 * POST /api/designs/save
 *
 * Save design to database
 *
 * Request:
 * - {
 *     name: string,
 *     imageUrl: string,       // Can be data URL or HTTP URL
 *     vectorUrl?: string,
 *     metadata?: object,
 *     aiPrompt?: string
 *   }
 *
 * Response:
 * - { id: string, ...design }
 *
 * Note: If imageUrl is a data URL (e.g., from Gemini Imagen 3),
 * it will be automatically uploaded to Supabase Storage and
 * converted to an HTTP URL for database storage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseUser } from '@/lib/clerk/server';
import { prisma } from '@/lib/prisma';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * Request validation schema
 * Note: imageUrl can be a data URL or HTTP URL
 */
const saveDesignSchema = z.object({
  name: z.string().min(1, 'Design name is required').max(255),
  imageUrl: z.string().min(1, 'Image URL is required'),
  vectorUrl: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  aiPrompt: z.string().optional().nullable(),
});

/**
 * Upload a data URL to Supabase Storage
 * Returns an HTTP URL for the uploaded file
 */
async function uploadDataUrlToStorage(
  dataUrl: string,
  userId: string,
  designId: string
): Promise<string> {
  console.log('[Design Save] Uploading data URL to Supabase Storage...');

  // Parse the data URL
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');

  // Determine file extension
  let extension = '.png';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    extension = '.jpg';
  }

  // Generate file path
  const filePath = `${userId}/generated/${designId}${extension}`;

  console.log('[Design Save] Uploading to path:', filePath, {
    mimeType,
    size: `${(buffer.length / 1024).toFixed(2)} KB`,
  });

  // Upload to Supabase Storage
  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from('designs')
    .upload(filePath, buffer, {
      contentType: mimeType,
      cacheControl: '31536000', // 1 year
      upsert: true, // Allow re-upload for same design
    });

  if (error) {
    console.error('[Design Save] Storage upload error:', error);
    throw new Error(`Failed to upload design: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('designs')
    .getPublicUrl(filePath);

  console.log('[Design Save] Upload successful:', urlData.publicUrl);

  return urlData.publicUrl;
}

export async function POST(request: NextRequest) {
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

    // 3. Generate a temporary design ID for storage path
    const tempDesignId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // 4. Handle data URL - upload to Supabase Storage to get HTTP URL
    let finalImageUrl = imageUrl;
    if (imageUrl.startsWith('data:')) {
      console.log('[Design Save] Detected data URL, uploading to storage...');
      finalImageUrl = await uploadDataUrlToStorage(imageUrl, user.id, tempDesignId);
    }

    console.log('[Design Save] Creating design with data:', {
      userId: user.id,
      name,
      imageUrl: finalImageUrl.substring(0, 100) + '...',
      vectorUrl,
      metadata,
      aiPrompt,
    });

    // 5. Create design record in database with HTTP URL
    const design = await prisma.design.create({
      data: {
        userId: user.id,
        name,
        imageUrl: finalImageUrl,
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
