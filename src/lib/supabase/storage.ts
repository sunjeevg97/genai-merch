/**
 * Supabase Storage Helper Functions
 *
 * Utilities for uploading and managing design files in Supabase Storage
 */

import { createBrowserClient } from './client';

// Constants
const DESIGNS_BUCKET = 'designs';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

// Types
export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate file size
 *
 * @param file - File to validate
 * @returns True if file is <= 5MB, false otherwise
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'logo.png');
 * if (validateFileSize(file)) {
 *   console.log('File size is valid');
 * } else {
 *   console.log('File too large');
 * }
 * ```
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Validate file type
 *
 * @param file - File to validate
 * @returns True if file is PNG or JPG, false otherwise
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'logo.png', { type: 'image/png' });
 * if (validateFileType(file)) {
 *   console.log('File type is valid');
 * } else {
 *   console.log('Invalid file type');
 * }
 * ```
 */
export function validateFileType(file: File): boolean {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return false;
  }

  // Also check file extension as a backup
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'logo.png');
 * const validation = validateFile(file);
 * if (validation.isValid) {
 *   // Proceed with upload
 * } else {
 *   console.error(validation.error);
 * }
 * ```
 */
export function validateFile(file: File): ValidationResult {
  // Check file size
  if (!validateFileSize(file)) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    };
  }

  // Check file type
  if (!validateFileType(file)) {
    return {
      isValid: false,
      error: `Invalid file type. Only PNG and JPG files are allowed.`,
    };
  }

  return { isValid: true };
}

/**
 * Generate unique filename for storage
 *
 * @param userId - User ID for folder organization
 * @param originalFilename - Original file name
 * @returns Unique file path in format: {userId}/logos/{timestamp}-{random}-{filename}
 */
function generateUniqueFilename(userId: string, originalFilename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
  const sanitizedName = originalFilename
    .substring(0, originalFilename.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .substring(0, 50); // Limit filename length

  return `${userId}/logos/${timestamp}-${random}-${sanitizedName}${extension}`;
}

/**
 * Upload design file to Supabase Storage
 *
 * Uploads a design file (logo, image) to the Supabase Storage bucket.
 * Automatically validates file size and type before upload.
 *
 * @param file - File to upload
 * @param userId - User ID for folder organization
 * @returns Upload result with public URL or error message
 *
 * @throws Error if file validation fails or upload fails
 *
 * @example
 * ```typescript
 * const file = new File(['content'], 'logo.png', { type: 'image/png' });
 * const result = await uploadDesignFile(file, 'user-123');
 *
 * if (result.success) {
 *   console.log('File uploaded:', result.url);
 *   console.log('Storage path:', result.path);
 * } else {
 *   console.error('Upload failed:', result.error);
 * }
 * ```
 */
export async function uploadDesignFile(
  file: File,
  userId: string
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique filename
    const filePath = generateUniqueFilename(userId, file.name);

    // Get Supabase client
    const supabase = createBrowserClient();

    // Upload file
    const { data, error } = await supabase.storage
      .from(DESIGNS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(DESIGNS_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Delete design file from Supabase Storage
 *
 * @param filePath - Path to file in storage (e.g., "user-123/logos/1234567890-abc123-logo.png")
 * @returns Delete result with success status or error message
 *
 * @example
 * ```typescript
 * const result = await deleteDesignFile('user-123/logos/1234567890-abc123-logo.png');
 *
 * if (result.success) {
 *   console.log('File deleted successfully');
 * } else {
 *   console.error('Delete failed:', result.error);
 * }
 * ```
 */
export async function deleteDesignFile(filePath: string): Promise<DeleteResult> {
  try {
    // Get Supabase client
    const supabase = createBrowserClient();

    // Delete file
    const { error } = await supabase.storage
      .from(DESIGNS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Get public URL for a stored file
 *
 * @param filePath - Path to file in storage (e.g., "user-123/logos/1234567890-abc123-logo.png")
 * @returns Public URL for the file or null if error
 *
 * @example
 * ```typescript
 * const url = getPublicUrl('user-123/logos/1234567890-abc123-logo.png');
 * if (url) {
 *   console.log('Public URL:', url);
 * } else {
 *   console.error('Failed to get URL');
 * }
 * ```
 */
export function getPublicUrl(filePath: string): string | null {
  try {
    // Get Supabase client
    const supabase = createBrowserClient();

    // Get public URL
    const { data } = supabase.storage
      .from(DESIGNS_BUCKET)
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Get public URL error:', error);
    return null;
  }
}

/**
 * Upload design export (final rendered design)
 *
 * Uploads the final exported design image (canvas output).
 * Uses a different path structure for exports vs. source logos.
 *
 * @param file - Exported design file
 * @param userId - User ID for folder organization
 * @param designId - Design ID for naming
 * @returns Upload result with public URL or error message
 *
 * @example
 * ```typescript
 * const exportBlob = await canvas.toBlob();
 * const file = new File([exportBlob], 'design.png', { type: 'image/png' });
 * const result = await uploadDesignExport(file, 'user-123', 'design-456');
 * ```
 */
export async function uploadDesignExport(
  file: File,
  userId: string,
  designId: string
): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate export filename
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    const filePath = `${userId}/exports/${designId}${extension}`;

    // Get Supabase client
    const supabase = createBrowserClient();

    // Upload file (allow upsert for exports)
    const { data, error } = await supabase.storage
      .from(DESIGNS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting exports
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(DESIGNS_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
