/**
 * Loading State Utilities
 *
 * Centralized loading state types and helper functions
 */

/**
 * Loading State Types
 */
export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

/**
 * Async Operation State
 */
export interface AsyncState<T = unknown> {
  state: LoadingState;
  data?: T;
  error?: Error | string;
  progress?: number; // 0-100 for upload progress
}

/**
 * Create initial async state
 */
export function createAsyncState<T = unknown>(): AsyncState<T> {
  return {
    state: LoadingState.IDLE,
  };
}

/**
 * Create loading async state
 */
export function createLoadingState<T = unknown>(progress?: number): AsyncState<T> {
  return {
    state: LoadingState.LOADING,
    progress,
  };
}

/**
 * Create success async state
 */
export function createSuccessState<T>(data: T): AsyncState<T> {
  return {
    state: LoadingState.SUCCESS,
    data,
  };
}

/**
 * Create error async state
 */
export function createErrorState<T = unknown>(error: Error | string): AsyncState<T> {
  return {
    state: LoadingState.ERROR,
    error,
  };
}

/**
 * Type guards for loading states
 */
export function isIdle<T>(state: AsyncState<T>): boolean {
  return state.state === LoadingState.IDLE;
}

export function isLoading<T>(state: AsyncState<T>): boolean {
  return state.state === LoadingState.LOADING;
}

export function isSuccess<T>(state: AsyncState<T>): boolean {
  return state.state === LoadingState.SUCCESS;
}

export function isError<T>(state: AsyncState<T>): boolean {
  return state.state === LoadingState.ERROR;
}

/**
 * Async operation wrapper with loading states
 */
export async function withLoadingState<T>(
  operation: () => Promise<T>,
  onStateChange?: (state: AsyncState<T>) => void
): Promise<AsyncState<T>> {
  // Set loading state
  const loadingState = createLoadingState<T>();
  onStateChange?.(loadingState);

  try {
    // Execute operation
    const data = await operation();

    // Set success state
    const successState = createSuccessState(data);
    onStateChange?.(successState);

    return successState;
  } catch (error) {
    // Set error state
    const errorState = createErrorState<T>(
      error instanceof Error ? error : String(error)
    );
    onStateChange?.(errorState);

    return errorState;
  }
}

/**
 * Debounce function for loading states
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Retry helper for failed operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  // This should never be reached, but TypeScript doesn't know that
  throw lastError;
}

/**
 * Progress calculator for uploads
 */
export function calculateProgress(loaded: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((loaded / total) * 100);
}

/**
 * Format loading message based on state
 */
export function getLoadingMessage(state: LoadingState, customMessages?: {
  loading?: string;
  success?: string;
  error?: string;
}): string {
  switch (state) {
    case LoadingState.IDLE:
      return '';
    case LoadingState.LOADING:
      return customMessages?.loading || 'Loading...';
    case LoadingState.SUCCESS:
      return customMessages?.success || 'Success!';
    case LoadingState.ERROR:
      return customMessages?.error || 'An error occurred';
    default:
      return '';
  }
}

/**
 * Check if any operations are loading
 */
export function isAnyLoading(...states: AsyncState<any>[]): boolean {
  return states.some((state) => isLoading(state));
}

/**
 * Check if all operations are successful
 */
export function areAllSuccessful(...states: AsyncState<any>[]): boolean {
  return states.every((state) => isSuccess(state));
}

/**
 * Get first error from multiple states
 */
export function getFirstError(...states: AsyncState<any>[]): Error | string | undefined {
  const errorState = states.find((state) => isError(state));
  return errorState?.error;
}
