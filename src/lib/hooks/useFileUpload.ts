/**
 * useFileUpload Hook
 *
 * Custom React hook for uploading files to the design studio API.
 *
 * Features:
 * - Upload progress tracking (0-100%)
 * - Error handling with retry logic
 * - Loading state management
 * - Automatic retry on failure (1 attempt)
 * - Type-safe API responses
 *
 * Usage:
 * ```tsx
 * const { uploadFile, uploading, progress, error, reset } = useFileUpload();
 *
 * const handleUpload = async (file: File) => {
 *   const result = await uploadFile(file);
 *   if (result.success) {
 *     console.log('Uploaded to:', result.data.publicUrl);
 *   }
 * };
 * ```
 */

'use client';

import { useState, useCallback } from 'react';

// Types
export interface UploadResultData {
  filePath: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
}

export interface UploadResult {
  success: boolean;
  data?: UploadResultData;
  error?: string;
}

export interface UseFileUploadReturn {
  uploadFile: (file: File) => Promise<UploadResult>;
  uploading: boolean;
  progress: number;
  error: string | null;
  reset: () => void;
}

/**
 * Upload a file to the API with progress tracking and retry logic
 */
export function useFileUpload(): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  /**
   * Upload file with progress tracking and retry logic
   */
  const uploadFile = useCallback(
    async (file: File, retryCount = 0): Promise<UploadResult> => {
      // Reset state
      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Simulate initial progress
        setProgress(10);

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        // Set timeout (30 seconds)
        xhr.timeout = 30000;

        // Create promise to handle upload
        const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
          // Track upload progress
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              // Progress from 10% to 90% during upload
              const percentComplete = Math.round(
                10 + (event.loaded / event.total) * 80
              );
              setProgress(percentComplete);
            }
          });

          // Handle completion
          xhr.addEventListener('load', () => {
            setProgress(95);

            if (xhr.status === 200) {
              try {
                const result: UploadResult = JSON.parse(xhr.responseText);
                setProgress(100);
                resolve(result);
              } catch (err) {
                reject(new Error('Failed to parse response'));
              }
            } else {
              try {
                const errorResult = JSON.parse(xhr.responseText);
                reject(new Error(errorResult.error || 'Upload failed'));
              } catch {
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            }
          });

          // Handle timeout
          xhr.addEventListener('timeout', () => {
            reject(
              new Error(
                'Upload timed out. The file may be too large or the connection is slow. Please try again.'
              )
            );
          });

          // Handle errors
          xhr.addEventListener('error', () => {
            reject(new Error('Network error occurred'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
          });

          // Open and send request
          xhr.open('POST', '/api/designs/upload');
          xhr.send(formData);
        });

        // Wait for upload to complete
        const result = await uploadPromise;

        // Success
        setUploading(false);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred';

        // Retry once on failure
        if (retryCount === 0) {
          console.log('[useFileUpload] Upload failed, retrying...', errorMessage);
          setProgress(0);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
          return uploadFile(file, retryCount + 1);
        }

        // Failed after retry
        console.error('[useFileUpload] Upload failed after retry:', errorMessage);
        setError(errorMessage);
        setUploading(false);
        setProgress(0);

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    []
  );

  return {
    uploadFile,
    uploading,
    progress,
    error,
    reset,
  };
}
