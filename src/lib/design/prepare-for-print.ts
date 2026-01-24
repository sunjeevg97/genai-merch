/**
 * Print Preparation Utilities
 *
 * Converts AI-generated designs (Gemini Imagen 3) into print-ready files.
 * Based on Printful's guidelines: https://www.printful.com/blog/everything-you-need-to-know-to-prepare-the-perfect-printfile
 *
 * Pipeline:
 * 1. Upscale design with Replicate Real-ESRGAN (1024x1024 → 4096x4096)
 * 2. Validate dimensions, DPI, file size, format
 * 3. Optimize for print (sRGB, 300 DPI metadata, compression, thumbnail)
 * 4. Upload to Supabase Storage and update database
 */

import sharp from 'sharp';
import Replicate from 'replicate';

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  width: number;
  height: number;
  format: string;
  size: number; // in bytes
  effectiveDPI?: number;
  warnings: string[];
  errors: string[];
}

/**
 * Optimized design result
 */
export interface OptimizedResult {
  buffer: Buffer;
  width: number;
  height: number;
  size: number; // in bytes
  thumbnailBuffer: Buffer;
  metadata: {
    dpi: number;
    colorSpace: string;
    format: string;
    compressionLevel: number;
  };
}

/**
 * Complete preparation result
 */
export interface PreparedDesignResult {
  success: boolean;
  printReadyUrl?: string;
  thumbnailUrl?: string;
  metadata?: {
    originalDimensions: { width: number; height: number };
    finalDimensions: { width: number; height: number };
    upscaled: boolean;
    dpi: number;
    fileSize: number;
    format: string;
  };
  error?: string;
}

// Constants
const MIN_DESIGN_DIMENSION = 2048; // Minimum 2048x2048 for print
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const TARGET_DPI = 300;
const THUMBNAIL_SIZE = 400;

/**
 * Initialize Replicate client (lazy initialization)
 */
function getReplicateClient() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('REPLICATE_API_TOKEN is not configured');
  }
  return new Replicate({ auth: token });
}

/**
 * Function 1: Upscale Design
 *
 * Uses Replicate's Real-ESRGAN model to upscale images 4x.
 * Input: 1024x1024 → Output: 4096x4096
 *
 * @param designUrl - URL or data URL of the design to upscale
 * @returns Promise<string> - Data URL of upscaled image
 */
export async function upscaleDesign(designUrl: string): Promise<string> {
  console.log('[Upscale] Starting upscaling with Real-ESRGAN...');

  const replicate = getReplicateClient();

  try {
    // Run Real-ESRGAN model
    const output = await replicate.run(
      'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
      {
        input: {
          image: designUrl,
          scale: 4, // 4x upscaling
          face_enhance: false, // Not needed for merchandise designs
        },
      }
    );

    // Output is a URL to the upscaled image
    // Cast through unknown first - Replicate's run() returns loosely-typed data
    const upscaledUrl = output as unknown as string;

    if (!upscaledUrl) {
      throw new Error('No output from Real-ESRGAN');
    }

    console.log('[Upscale] Successfully upscaled image');

    // Fetch the upscaled image and convert to data URL
    const response = await fetch(upscaledUrl);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:image/png;base64,${base64}`;

    return dataUrl;
  } catch (error) {
    console.error('[Upscale] Error:', error);
    throw new Error(
      `Failed to upscale design: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Function 2: Validate Design File
 *
 * Checks if design meets print requirements.
 * Returns validation result with warnings and errors.
 *
 * @param buffer - Image buffer to validate
 * @returns Promise<ValidationResult>
 */
export async function validateDesignFile(buffer: Buffer): Promise<ValidationResult> {
  console.log('[Validate] Validating design file...');

  const result: ValidationResult = {
    valid: true,
    width: 0,
    height: 0,
    format: '',
    size: buffer.length,
    warnings: [],
    errors: [],
  };

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();

    result.width = metadata.width || 0;
    result.height = metadata.height || 0;
    result.format = metadata.format || 'unknown';

    // Calculate effective DPI (assuming 8.5" x 11" print size for reference)
    // DPI = pixels / inches
    const assumedPrintWidth = 8.5; // inches
    result.effectiveDPI = Math.round(result.width / assumedPrintWidth);

    console.log('[Validate] Dimensions:', result.width, 'x', result.height);
    console.log('[Validate] Format:', result.format);
    console.log('[Validate] Size:', (result.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('[Validate] Effective DPI:', result.effectiveDPI);

    // Validation checks

    // Check dimensions
    if (result.width < MIN_DESIGN_DIMENSION || result.height < MIN_DESIGN_DIMENSION) {
      result.errors.push(
        `Image dimensions too small. Minimum ${MIN_DESIGN_DIMENSION}x${MIN_DESIGN_DIMENSION}px required. Got ${result.width}x${result.height}px.`
      );
      result.valid = false;
    }

    // Check file size
    if (result.size > MAX_FILE_SIZE) {
      result.errors.push(
        `File size too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed. Got ${(
          result.size /
          1024 /
          1024
        ).toFixed(2)}MB.`
      );
      result.valid = false;
    }

    // Check format
    const validFormats = ['png', 'jpeg', 'jpg'];
    if (!validFormats.includes(result.format.toLowerCase())) {
      result.errors.push(
        `Invalid format. Must be PNG or JPG. Got ${result.format.toUpperCase()}.`
      );
      result.valid = false;
    }

    // Warnings (non-fatal)

    // DPI warning
    if (result.effectiveDPI && result.effectiveDPI < 200) {
      result.warnings.push(
        `Low effective DPI (${result.effectiveDPI}). Recommended 300+ for best print quality. Consider upscaling.`
      );
    }

    // Color space warning
    if (metadata.space && metadata.space !== 'srgb') {
      result.warnings.push(
        `Color space is ${metadata.space}. Will be converted to sRGB for print compatibility.`
      );
    }

    console.log(
      '[Validate] Result:',
      result.valid ? 'VALID' : 'INVALID',
      `(${result.errors.length} errors, ${result.warnings.length} warnings)`
    );

    return result;
  } catch (error) {
    console.error('[Validate] Error:', error);
    result.valid = false;
    result.errors.push(
      `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return result;
  }
}

/**
 * Function 3: Optimize for Print
 *
 * Prepares design for print-on-demand services.
 * - Converts to sRGB color space
 * - Sets 300 DPI metadata
 * - Applies optimal compression
 * - Generates thumbnail
 *
 * @param buffer - Image buffer to optimize
 * @returns Promise<OptimizedResult>
 */
export async function optimizeForPrint(buffer: Buffer): Promise<OptimizedResult> {
  console.log('[Optimize] Optimizing for print...');

  try {
    // Get original dimensions
    const metadata = await sharp(buffer).metadata();
    let targetWidth = metadata.width || 4096;
    let targetHeight = metadata.height || 4096;

    // Check if image has alpha channel (transparency)
    const hasAlpha = metadata.hasAlpha || false;
    console.log('[Optimize] Has alpha channel:', hasAlpha);

    // Main image optimization with maximum compression
    // Flatten to white background if image has transparency to avoid checkered patterns in mockups
    let sharpInstance = sharp(buffer).toColorspace('srgb');

    if (hasAlpha) {
      // Flatten transparency to white background
      // This prevents checkered patterns in mockups while preserving design appearance
      console.log('[Optimize] Flattening transparency to white background');
      sharpInstance = sharpInstance.flatten({ background: { r: 255, g: 255, b: 255 } });
    }

    let optimized = await sharpInstance
      .withMetadata({
        density: TARGET_DPI, // Set 300 DPI metadata
      })
      .png({
        compressionLevel: 9, // Maximum compression
        effort: 10, // Maximum CPU effort for better compression
      })
      .toBuffer({ resolveWithObject: true });

    console.log('[Optimize] Initial optimized size:', (optimized.data.length / 1024 / 1024).toFixed(2), 'MB');

    // If still too large, resize down while keeping above minimum print dimensions
    let resizeAttempts = 0;
    while (optimized.data.length > MAX_FILE_SIZE && resizeAttempts < 3) {
      resizeAttempts++;
      const scaleFactor = 0.85; // Reduce by 15% each iteration
      targetWidth = Math.floor(targetWidth * scaleFactor);
      targetHeight = Math.floor(targetHeight * scaleFactor);

      // Don't go below minimum print dimensions
      if (targetWidth < MIN_DESIGN_DIMENSION || targetHeight < MIN_DESIGN_DIMENSION) {
        console.log('[Optimize] Cannot resize further without going below minimum dimensions');
        break;
      }

      console.log(`[Optimize] Resizing to ${targetWidth}x${targetHeight} (attempt ${resizeAttempts})`);

      let resizeInstance = sharp(buffer)
        .resize(targetWidth, targetHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toColorspace('srgb');

      if (hasAlpha) {
        resizeInstance = resizeInstance.flatten({ background: { r: 255, g: 255, b: 255 } });
      }

      optimized = await resizeInstance
        .withMetadata({
          density: TARGET_DPI,
        })
        .png({
          compressionLevel: 9,
          effort: 10,
        })
        .toBuffer({ resolveWithObject: true });

      console.log('[Optimize] New size:', (optimized.data.length / 1024 / 1024).toFixed(2), 'MB');
    }

    // Generate thumbnail (400x400)
    const thumbnail = await sharp(buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toColorspace('srgb')
      .png({ compressionLevel: 9 })
      .toBuffer();

    const result: OptimizedResult = {
      buffer: optimized.data,
      width: optimized.info.width,
      height: optimized.info.height,
      size: optimized.data.length,
      thumbnailBuffer: thumbnail,
      metadata: {
        dpi: TARGET_DPI,
        colorSpace: 'sRGB',
        format: optimized.info.format,
        compressionLevel: 9,
      },
    };

    console.log('[Optimize] Final dimensions:', result.width, 'x', result.height);
    console.log('[Optimize] Final size:', (result.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('[Optimize] Thumbnail size:', (thumbnail.length / 1024).toFixed(2), 'KB');

    return result;
  } catch (error) {
    console.error('[Optimize] Error:', error);
    throw new Error(
      `Failed to optimize for print: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Function 4: Prepare Design for Print (Complete Pipeline)
 *
 * Runs the complete preparation pipeline:
 * 1. Fetch design from database
 * 2. Validate design file
 * 3. Upscale if needed (< 2048x2048)
 * 4. Optimize for print
 * 5. Upload to Supabase Storage
 * 6. Update database with print-ready URLs
 *
 * @param designId - Database ID of the design to prepare
 * @returns Promise<PreparedDesignResult>
 */
export async function prepareDesignForPrint(designId: string): Promise<PreparedDesignResult> {
  console.log('[Prepare] Starting print preparation for design:', designId);

  try {
    // Step 1: Fetch design from database
    const { prisma } = await import('@/lib/prisma');
    const design = await prisma.design.findUnique({
      where: { id: designId },
    });

    if (!design) {
      throw new Error('Design not found');
    }

    if (!design.imageUrl) {
      throw new Error('Design has no image URL');
    }

    console.log('[Prepare] Design found:', design.name);

    // Step 2: Fetch image
    let imageBuffer: Buffer;

    if (design.imageUrl.startsWith('data:')) {
      // Data URL - extract base64
      const base64Data = design.imageUrl.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Regular URL - fetch
      const response = await fetch(design.imageUrl);
      imageBuffer = Buffer.from(await response.arrayBuffer());
    }

    console.log('[Prepare] Image fetched:', (imageBuffer.length / 1024 / 1024).toFixed(2), 'MB');

    // Step 3: Preliminary dimension check - upscale BEFORE validation if needed
    let processedBuffer = imageBuffer;
    let wasUpscaled = false;
    let originalDimensions = { width: 0, height: 0 };

    // Get initial dimensions to decide if upscaling is needed
    const initialMetadata = await sharp(imageBuffer).metadata();
    originalDimensions = {
      width: initialMetadata.width || 0,
      height: initialMetadata.height || 0,
    };

    console.log('[Prepare] Initial dimensions:', originalDimensions.width, 'x', originalDimensions.height);

    // Upscale if dimensions are below minimum
    if (originalDimensions.width < MIN_DESIGN_DIMENSION || originalDimensions.height < MIN_DESIGN_DIMENSION) {
      console.log('[Prepare] Image too small, upscaling with Real-ESRGAN...');

      // Determine MIME type from metadata
      const mimeType = initialMetadata.format === 'png' ? 'image/png' : 'image/jpeg';

      // Convert buffer to data URL for Replicate
      const base64 = imageBuffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      // Upscale 4x (1024 → 4096)
      const upscaledDataUrl = await upscaleDesign(dataUrl);

      // Convert back to buffer
      const upscaledBase64 = upscaledDataUrl.split(',')[1];
      processedBuffer = Buffer.from(upscaledBase64, 'base64');
      wasUpscaled = true;

      console.log('[Prepare] Upscaling complete');
    }

    // Step 4: Optimize for print FIRST (handles compression and resizing)
    // This reduces file size before validation
    const optimized = await optimizeForPrint(processedBuffer);

    // Step 5: Validate the OPTIMIZED image
    const validation = await validateDesignFile(optimized.buffer);

    // Log warnings
    if (validation.warnings.length > 0) {
      console.log('[Prepare] Warnings:', validation.warnings);
    }

    // Check for errors
    if (!validation.valid) {
      console.error('[Prepare] Validation failed:', validation.errors);
      return {
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Step 6: Upload to Supabase Storage
    const { uploadPrintReadyDesign } = await import('@/lib/supabase/storage-server');

    const uploadResult = await uploadPrintReadyDesign(
      optimized.buffer,
      optimized.thumbnailBuffer,
      design.userId,
      designId
    );

    if (!uploadResult.success) {
      throw new Error('Failed to upload print-ready design: ' + uploadResult.error);
    }

    console.log('[Prepare] Uploaded to Supabase:', uploadResult.printReadyUrl);

    // Step 7: Update database
    await prisma.design.update({
      where: { id: designId },
      data: {
        printReadyUrl: uploadResult.printReadyUrl,
        printReadyMetadata: {
          originalDimensions, // Use pre-upscaled dimensions
          finalDimensions: { width: optimized.width, height: optimized.height },
          upscaled: wasUpscaled,
          dpi: optimized.metadata.dpi,
          fileSize: optimized.size,
          format: optimized.metadata.format,
          colorSpace: optimized.metadata.colorSpace,
          thumbnailUrl: uploadResult.thumbnailUrl,
          preparedAt: new Date().toISOString(),
        },
        preparedAt: new Date(),
      },
    });

    console.log('[Prepare] Database updated');

    return {
      success: true,
      printReadyUrl: uploadResult.printReadyUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      metadata: {
        originalDimensions, // Use pre-upscaled dimensions
        finalDimensions: { width: optimized.width, height: optimized.height },
        upscaled: wasUpscaled,
        dpi: optimized.metadata.dpi,
        fileSize: optimized.size,
        format: optimized.metadata.format,
      },
    };
  } catch (error) {
    console.error('[Prepare] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
