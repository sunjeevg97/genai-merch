/**
 * Error Handling Utilities
 *
 * Centralized error types, messages, and logging for the application
 */

/**
 * Error Types
 */
export enum ErrorType {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // API errors
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNAUTHORIZED_ERROR = 'UNAUTHORIZED_ERROR',

  // AI errors
  AI_GENERATION_ERROR = 'AI_GENERATION_ERROR',
  AI_CONTENT_POLICY_ERROR = 'AI_CONTENT_POLICY_ERROR',

  // Upload errors
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  FILE_TOO_LARGE_ERROR = 'FILE_TOO_LARGE_ERROR',
  INVALID_FILE_TYPE_ERROR = 'INVALID_FILE_TYPE_ERROR',

  // Canvas errors
  CANVAS_INIT_ERROR = 'CANVAS_INIT_ERROR',
  IMAGE_LOAD_ERROR = 'IMAGE_LOAD_ERROR',

  // Generic errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

/**
 * Application Error Interface
 */
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  retryable?: boolean;
  timestamp: Date;
}

/**
 * Error Messages
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: 'Network connection failed. Please check your internet connection.',
  [ErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ErrorType.API_ERROR]: 'Server error occurred. Please try again.',
  [ErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait a moment and try again.',
  [ErrorType.UNAUTHORIZED_ERROR]: 'You are not authorized to perform this action.',
  [ErrorType.AI_GENERATION_ERROR]: 'Failed to generate design. Please try again.',
  [ErrorType.AI_CONTENT_POLICY_ERROR]: 'Your prompt was flagged by our content policy. Please try a different description.',
  [ErrorType.UPLOAD_ERROR]: 'Failed to upload file. Please try again.',
  [ErrorType.FILE_TOO_LARGE_ERROR]: 'File is too large. Maximum size is 5MB.',
  [ErrorType.INVALID_FILE_TYPE_ERROR]: 'Invalid file type. Only PNG, JPG, and SVG files are allowed.',
  [ErrorType.CANVAS_INIT_ERROR]: 'Failed to initialize canvas. Please refresh the page.',
  [ErrorType.IMAGE_LOAD_ERROR]: 'Failed to load image. Please try again.',
  [ErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
  [ErrorType.VALIDATION_ERROR]: 'Invalid input. Please check your data and try again.',
};

/**
 * Create an AppError from an Error object
 */
export function createAppError(
  error: unknown,
  defaultType: ErrorType = ErrorType.UNKNOWN_ERROR
): AppError {
  // If it's already an AppError, return it
  if (isAppError(error)) {
    return error;
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: ERROR_MESSAGES[ErrorType.NETWORK_ERROR],
        details: error.message,
        retryable: true,
        timestamp: new Date(),
      };
    }

    // Timeout errors
    if (errorMessage.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        message: ERROR_MESSAGES[ErrorType.TIMEOUT_ERROR],
        details: error.message,
        retryable: true,
        timestamp: new Date(),
      };
    }

    // Rate limit errors
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return {
        type: ErrorType.RATE_LIMIT_ERROR,
        message: ERROR_MESSAGES[ErrorType.RATE_LIMIT_ERROR],
        details: error.message,
        retryable: true,
        timestamp: new Date(),
      };
    }

    // Content policy errors
    if (errorMessage.includes('content policy') || errorMessage.includes('flagged')) {
      return {
        type: ErrorType.AI_CONTENT_POLICY_ERROR,
        message: ERROR_MESSAGES[ErrorType.AI_CONTENT_POLICY_ERROR],
        details: error.message,
        retryable: false,
        timestamp: new Date(),
      };
    }

    // File upload errors
    if (errorMessage.includes('file too large') || errorMessage.includes('size')) {
      return {
        type: ErrorType.FILE_TOO_LARGE_ERROR,
        message: ERROR_MESSAGES[ErrorType.FILE_TOO_LARGE_ERROR],
        details: error.message,
        retryable: false,
        timestamp: new Date(),
      };
    }

    if (errorMessage.includes('invalid file type') || errorMessage.includes('file type')) {
      return {
        type: ErrorType.INVALID_FILE_TYPE_ERROR,
        message: ERROR_MESSAGES[ErrorType.INVALID_FILE_TYPE_ERROR],
        details: error.message,
        retryable: false,
        timestamp: new Date(),
      };
    }

    // Default to provided type
    return {
      type: defaultType,
      message: ERROR_MESSAGES[defaultType],
      details: error.message,
      retryable: true,
      timestamp: new Date(),
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: defaultType,
      message: ERROR_MESSAGES[defaultType],
      details: error,
      retryable: true,
      timestamp: new Date(),
    };
  }

  // Unknown error type
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR],
    details: String(error),
    retryable: true,
    timestamp: new Date(),
  };
}

/**
 * Type guard for AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

/**
 * Get error message for display
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
}

/**
 * Log error to console with context
 */
export function logError(
  error: AppError | Error | unknown,
  context?: string
): void {
  const timestamp = new Date().toISOString();
  const contextPrefix = context ? `[${context}]` : '';

  console.error(`${timestamp} ${contextPrefix} Error:`, error);

  // In production, you could send to error tracking service (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error);
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.retryable ?? true;
  }

  // By default, assume errors are retryable
  return true;
}

/**
 * Format error for user display
 */
export function formatErrorForDisplay(error: unknown, includeDetails = false): {
  title: string;
  description: string;
  retryable: boolean;
} {
  const appError = isAppError(error) ? error : createAppError(error);

  return {
    title: 'Error',
    description: includeDetails && appError.details
      ? `${appError.message}\n\nDetails: ${appError.details}`
      : appError.message,
    retryable: appError.retryable ?? true,
  };
}
