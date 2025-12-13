/**
 * FileUpload Component
 *
 * Professional drag-and-drop file upload interface for logo images
 * Uses react-dropzone for file handling with comprehensive validation
 *
 * Features:
 * - Drag and drop support with visual feedback
 * - Click to browse files
 * - File preview with thumbnail
 * - File size and name display
 * - Change file functionality
 * - Client-side validation (type, size)
 * - Server-side upload to Supabase Storage
 * - Upload progress tracking
 * - Toast notifications for success/errors
 * - Fully accessible with keyboard navigation
 */

'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Upload, X, FileImage, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFileUpload, type UploadResultData } from '@/lib/hooks/useFileUpload';

// Types
interface FileUploadProps {
  onFileUploaded?: (data: UploadResultData) => void;
  acceptedFormats?: string[];
  maxSize?: number; // in bytes
}

// Constants
const DEFAULT_ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg'];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Format file size to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * FileUpload Component
 *
 * @param onFileUploaded - Callback when file is successfully uploaded to storage
 * @param acceptedFormats - Array of accepted MIME types (default: PNG, JPG)
 * @param maxSize - Maximum file size in bytes (default: 5MB)
 *
 * @example
 * ```tsx
 * <FileUpload
 *   onFileUploaded={(data) => console.log('Uploaded:', data.publicUrl)}
 *   acceptedFormats={['image/png', 'image/jpeg']}
 *   maxSize={5 * 1024 * 1024}
 * />
 * ```
 */
export function FileUpload({
  onFileUploaded,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  maxSize = DEFAULT_MAX_SIZE,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload hook
  const { uploadFile, uploading, progress } = useFileUpload();

  /**
   * Validate file before accepting
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!acceptedFormats.includes(file.type)) {
        const allowedTypes = acceptedFormats
          .map((type) => type.split('/')[1].toUpperCase())
          .join(', ');
        return {
          valid: false,
          error: `Invalid file type. Please upload ${allowedTypes} files only.`,
        };
      }

      // Check file size
      if (file.size > maxSize) {
        return {
          valid: false,
          error: `File too large. Maximum size is ${formatFileSize(maxSize)}.`,
        };
      }

      return { valid: true };
    },
    [acceptedFormats, maxSize]
  );

  /**
   * Handle file drop/selection
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Clear previous error
      setError(null);

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        let errorMessage = 'File upload failed';

        if (rejection.errors[0]?.code === 'file-too-large') {
          errorMessage = `File too large. Maximum size is ${formatFileSize(maxSize)}.`;
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          const allowedTypes = acceptedFormats
            .map((type) => type.split('/')[1].toUpperCase())
            .join(', ');
          errorMessage = `Invalid file type. Please upload ${allowedTypes} files only.`;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // Additional validation
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.error!);
          toast.error(validation.error!);
          return;
        }

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Set selected file
        setSelectedFile(file);

        // Upload file to server
        toast.loading('Uploading file...', { id: 'upload-toast' });

        const result = await uploadFile(file);

        if (result.success && result.data) {
          // Success
          setUploadedData(result.data);
          toast.success('File uploaded successfully!', { id: 'upload-toast' });

          // Notify parent component
          if (onFileUploaded) {
            onFileUploaded(result.data);
          }
        } else {
          // Error
          setError(result.error || 'Upload failed');
          toast.error(result.error || 'Upload failed', { id: 'upload-toast' });
        }
      }
    },
    [uploadFile, onFileUploaded, validateFile, acceptedFormats, maxSize]
  );

  /**
   * Clear selected file
   */
  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedData(null);
    setError(null);
  }, []);

  /**
   * Setup dropzone
   */
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      const extension = format.split('/')[1];
      acc[format] = [`.${extension}`];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize,
    multiple: false,
    maxFiles: 1,
    noClick: !!selectedFile || uploading, // Disable click when file is selected or uploading
    noKeyboard: !!selectedFile || uploading,
    disabled: uploading, // Disable dropzone during upload
  });

  // Render: File selected state
  if (selectedFile && previewUrl) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Preview Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {uploading ? 'Uploading...' : uploadedData ? 'Uploaded' : 'Selected File'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="h-8 w-8 p-0"
              aria-label="Remove file"
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* File Preview */}
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
              <img
                src={previewUrl}
                alt="File preview"
                className="h-full w-full object-cover"
              />
              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <FileImage className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={selectedFile.name}>
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile.type.split('/')[1].toUpperCase()}
                  </p>
                  {/* Upload status */}
                  {uploadedData && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Upload complete
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {progress}% uploaded
              </p>
            </div>
          )}

          {/* Change File Button */}
          {!uploading && (
            <Button
              variant="outline"
              onClick={open}
              className="w-full"
            >
              Change File
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // Render: Drop zone
  return (
    <Card
      {...getRootProps()}
      className={`
        relative cursor-pointer transition-all duration-200
        ${isDragActive && !isDragReject ? 'border-primary bg-primary/5 border-solid' : ''}
        ${isDragReject ? 'border-destructive bg-destructive/5 border-solid' : ''}
        ${!isDragActive && !error ? 'border-dashed hover:border-primary/50 hover:bg-muted/50' : ''}
        ${error ? 'border-destructive bg-destructive/5' : ''}
      `}
    >
      <input {...getInputProps()} aria-label="Upload file" />

      <div className="p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          {error ? (
            <AlertCircle className="h-8 w-8 text-destructive" />
          ) : (
            <Upload
              className={`h-8 w-8 transition-colors ${
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          {error ? (
            <>
              <p className="text-sm font-medium text-destructive">Upload Failed</p>
              <p className="text-xs text-destructive/80">{error}</p>
            </>
          ) : isDragActive ? (
            <p className="text-sm font-medium text-primary">
              {isDragReject ? 'File type not accepted' : 'Drop file here'}
            </p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Drag and drop a logo, or{' '}
                <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">
                PNG or JPG up to {formatFileSize(maxSize)}
              </p>
            </>
          )}
        </div>

        {/* Browse Button (visible when not dragging) */}
        {!isDragActive && !error && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            Browse Files
          </Button>
        )}

        {/* Try Again Button (visible on error) */}
        {error && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              setError(null);
              open();
            }}
          >
            Try Again
          </Button>
        )}
      </div>

      {/* Accessibility hint */}
      <div className="sr-only">
        Press Enter or Space to browse files, or drag and drop a file
      </div>
    </Card>
  );
}
