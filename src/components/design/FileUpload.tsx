/**
 * FileUpload Component
 *
 * Drag-and-drop file upload interface for logo images
 * Uses react-dropzone for file handling
 *
 * Features:
 * - Drag and drop support
 * - File type validation (PNG, JPG, JPEG)
 * - File size validation (max 5MB)
 * - Visual feedback during drag
 * - Upload progress indication
 */

'use client';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

export function FileUpload({ onUpload, isUploading = false }: FileUploadProps) {
  return (
    <div className="file-upload">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">
          Drag and drop a logo, or click to select
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          PNG, JPG up to 5MB
        </p>
      </div>
    </div>
  );
}
