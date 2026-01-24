export type ErrorType =
  | 'CONFIGURATION_ERROR'   // Missing/invalid API keys
  | 'AUTH_ERROR'            // API authentication failed
  | 'RATE_LIMIT'            // Too many requests
  | 'CONTENT_POLICY'        // Content safety violation
  | 'TIMEOUT'               // Request timeout
  | 'NETWORK_ERROR'         // Network issue
  | 'API_ERROR'             // Generic API error
  | 'UNKNOWN_ERROR'         // Unexpected
  | 'PARTIAL_SUCCESS';      // Some succeeded

export interface GenerationError {
  message: string;
  errorType: ErrorType;
  canRetry: boolean;
  errors?: Array<{
    index: number;
    errorType: ErrorType;
    message: string;
  }>;
}
