/**
 * Design Validation Utilities
 *
 * Functions for validating design files for print quality
 *
 * Features:
 * - DPI validation (minimum 150 DPI)
 * - Dimension validation (minimum 300x300px)
 * - File size validation (max 5MB)
 * - File type validation (PNG, JPG, JPEG)
 * - Color space detection
 */

export interface ValidationResult {
  isValid: boolean;
  dpi?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  format?: string;
  colorSpace?: string;
  warnings: string[];
  errors: string[];
}

export interface FileValidationRules {
  minDPI?: number;
  minWidth?: number;
  minHeight?: number;
  maxFileSize?: number; // in bytes
  allowedFormats?: string[];
}

const DEFAULT_RULES: FileValidationRules = {
  minDPI: 150,
  minWidth: 300,
  minHeight: 300,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['image/png', 'image/jpeg', 'image/jpg'],
};

/**
 * Validate file before upload (client-side)
 */
export function validateFileBeforeUpload(
  file: File,
  rules: FileValidationRules = DEFAULT_RULES
): Pick<ValidationResult, 'isValid' | 'errors' | 'warnings'> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (rules.allowedFormats && !rules.allowedFormats.includes(file.type)) {
    errors.push(
      `Invalid file type. Allowed: ${rules.allowedFormats.join(', ')}`
    );
  }

  // Check file size
  if (rules.maxFileSize && file.size > rules.maxFileSize) {
    errors.push(
      `File too large. Maximum size: ${(rules.maxFileSize / 1024 / 1024).toFixed(0)}MB`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate image metadata (server-side with Sharp)
 * This is a placeholder - actual implementation will use Sharp
 */
export async function validateImageMetadata(
  buffer: Buffer,
  rules: FileValidationRules = DEFAULT_RULES
): Promise<ValidationResult> {
  // Implementation with Sharp will go here
  return {
    isValid: true,
    warnings: [],
    errors: [],
  };
}

/**
 * Check if image meets minimum DPI requirements
 */
export function checkDPI(dpi: number, minDPI: number = 150): {
  isValid: boolean;
  message?: string;
} {
  if (dpi < minDPI) {
    return {
      isValid: false,
      message: `DPI too low (${dpi}). Minimum ${minDPI} DPI recommended for print quality.`,
    };
  }

  if (dpi < 300) {
    return {
      isValid: true,
      message: `DPI acceptable (${dpi}), but 300 DPI is ideal for best print quality.`,
    };
  }

  return { isValid: true };
}

/**
 * Check if image dimensions meet minimum requirements
 */
export function checkDimensions(
  width: number,
  height: number,
  minWidth: number = 300,
  minHeight: number = 300
): {
  isValid: boolean;
  message?: string;
} {
  if (width < minWidth || height < minHeight) {
    return {
      isValid: false,
      message: `Image too small (${width}x${height}px). Minimum ${minWidth}x${minHeight}px required.`,
    };
  }

  return { isValid: true };
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
