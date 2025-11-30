/**
 * API types
 *
 * This file contains TypeScript types for API requests and responses
 */

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  details?: unknown;
}

// Standard API error response
export interface ApiError {
  error: string;
  details?: unknown;
}

export type {};
