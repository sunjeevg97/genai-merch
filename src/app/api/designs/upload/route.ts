/**
 * POST /api/designs/upload
 *
 * Upload logo file to Supabase Storage
 *
 * This endpoint handles file uploads for the design studio.
 * It validates files server-side, authenticates users, and stores files in Supabase Storage.
 *
 * Request:
 * - Method: POST
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'file' field
 *
 * Response (Success - 200):
 * {
 *   success: true,
 *   data: {
 *     filePath: string,    // Storage path (e.g., "user-123/logos/1234567890-abc123-logo.png")
 *     publicUrl: string,   // Public URL to access the file
 *     fileName: string,    // Original filename
 *     fileSize: number     // File size in bytes
 *   }
 * }
 *
 * Response (Error - 400/401/500):
 * {
 *   success: false,
 *   error: string
 * }
 *
 * Error Messages:
 * - "Not authenticated" (401)
 * - "No file provided" (400)
 * - "Invalid file type. Only PNG and JPG files are allowed" (400)
 * - "File too large. Maximum size is 5MB" (400)
 * - "Upload failed: {reason}" (500)
 *
 * Security:
 * - User authentication required
 * - File type validation (PNG, JPG only)
 * - File size validation (max 5MB)
 * - Filename sanitization
 * - User-scoped storage paths
 *
 * Rate Limiting:
 * - Recommended: 10 uploads per minute per user
 * - Implementation: Use middleware or Upstash Rate Limit
 * - See CLAUDE.md for setup instructions
 *
 * Testing:
 * ```bash
 * # Get auth token from browser dev tools (Application > Cookies > sb-*-auth-token)
 * curl -X POST http://localhost:3000/api/designs/upload \
 *   -H "Cookie: sb-{project-id}-auth-token={token}" \
 *   -F "file=@/path/to/logo.png"
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { uploadDesignFile } from '@/lib/supabase/storage';

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

/**
 * Validate file type
 */
function validateFileType(file: File): boolean {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }

  // Check file extension as backup
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Validate file size
 */
function validateFileSize(file: File): boolean {
  return file.size > 0 && file.size <= MAX_FILE_SIZE;
}

/**
 * Format file size for error messages
 */
function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * POST handler for file uploads
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const user = await getUser();

    if (!user) {
      console.log('[Upload] Authentication failed - No user session');
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log(`[Upload] Request from user: ${user.id}`);

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.log(`[Upload] No file provided - user: ${user.id}`);
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // 3. Validate file type
    if (!validateFileType(file)) {
      console.log(`[Upload] Invalid file type: ${file.type} - user: ${user.id}, file: ${file.name}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Only PNG and JPG files are allowed.',
        },
        { status: 400 }
      );
    }

    // 4. Validate file size
    if (!validateFileSize(file)) {
      console.log(
        `[Upload] File too large: ${formatFileSize(file.size)} - user: ${user.id}, file: ${file.name}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`,
        },
        { status: 400 }
      );
    }

    // 5. Upload to Supabase Storage
    console.log(
      `[Upload] Starting upload - user: ${user.id}, file: ${file.name}, size: ${formatFileSize(file.size)}`
    );

    const uploadResult = await uploadDesignFile(file, user.id);

    if (!uploadResult.success) {
      console.error(
        `[Upload] Upload failed - user: ${user.id}, file: ${file.name}, error: ${uploadResult.error}`
      );
      return NextResponse.json(
        {
          success: false,
          error: `Upload failed: ${uploadResult.error}`,
        },
        { status: 500 }
      );
    }

    // 6. Success response
    const duration = Date.now() - startTime;
    console.log(
      `[Upload] Success - user: ${user.id}, file: ${file.name}, path: ${uploadResult.path}, duration: ${duration}ms`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          filePath: uploadResult.path!,
          publicUrl: uploadResult.url!,
          fileName: file.name,
          fileSize: file.size,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Catch-all error handler
    console.error('[Upload] Unexpected error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        error: `Upload failed: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
