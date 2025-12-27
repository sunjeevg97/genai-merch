/**
 * Server-Side Supabase Storage Helper Functions
 *
 * Utilities for uploading and managing design files from API routes
 * Uses the service role client for server-side operations
 */

import { createServiceClient } from './server';

// Constants
const DESIGNS_BUCKET = 'designs';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload AI-generated design to Supabase Storage (Server-Side)
 *
 * Downloads an image from a URL (like DALL-E) and uploads it to Supabase Storage
 * for permanent persistence. Used in API routes.
 *
 * @param imageUrl - URL of the image to download and upload
 * @param userId - User ID for folder organization
 * @param designId - Design ID for naming (timestamp or unique ID)
 * @returns Upload result with permanent Supabase URL or error message
 *
 * @example
 * ```typescript
 * // In an API route
 * const dalleUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/...';
 * const result = await uploadGeneratedDesign(dalleUrl, 'user-123', '1234567890');
 *
 * if (result.success) {
 *   console.log('Permanent URL:', result.url);
 * } else {
 *   console.error('Upload failed:', result.error);
 * }
 * ```
 */
export async function uploadGeneratedDesign(
  imageUrl: string,
  userId: string,
  designId: string
): Promise<UploadResult> {
  try {
    console.log('[Storage Server] Downloading image from URL:', imageUrl.substring(0, 100) + '...');

    // Step 1: Download the image from the URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    // Step 2: Convert to buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[Storage Server] Downloaded image:', {
      size: `${(buffer.length / 1024).toFixed(2)} KB`,
      contentType: response.headers.get('content-type'),
    });

    // Step 3: Determine file extension from content type
    const contentType = response.headers.get('content-type') || 'image/png';
    let extension = '.png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) {
      extension = '.jpg';
    }

    // Step 4: Generate file path
    const filePath = `${userId}/generated/${designId}${extension}`;

    console.log('[Storage Server] Uploading to Supabase Storage:', filePath);

    // Step 5: Get Supabase service client (bypasses RLS)
    const supabase = createServiceClient();

    // Step 6: Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(DESIGNS_BUCKET)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '31536000', // 1 year (permanent)
        upsert: false, // Don't overwrite
      });

    if (error) {
      console.error('[Storage Server] Supabase upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Step 7: Get public URL
    const { data: urlData } = supabase.storage
      .from(DESIGNS_BUCKET)
      .getPublicUrl(filePath);

    console.log('[Storage Server] Upload successful:', {
      path: filePath,
      url: urlData.publicUrl.substring(0, 100) + '...',
    });

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('[Storage Server] Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Delete AI-generated design from Supabase Storage (Server-Side)
 *
 * @param filePath - Path to file in storage (e.g., "user-123/generated/1234567890.png")
 * @returns Success status or error message
 *
 * @example
 * ```typescript
 * const result = await deleteGeneratedDesign('user-123/generated/1234567890.png');
 * if (result.success) {
 *   console.log('Design deleted');
 * }
 * ```
 */
export async function deleteGeneratedDesign(filePath: string): Promise<UploadResult> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase.storage
      .from(DESIGNS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('[Storage Server] Delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('[Storage Server] Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
