/**
 * File Upload Modal
 *
 * Upload custom design files (PNG, JPG, SVG)
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import type { DesignData } from './design-preview';

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (design: DesignData) => void;
}

export function FileUploadModal({
  open,
  onOpenChange,
  onUploadComplete,
}: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [designName, setDesignName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle'
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);

      // Auto-generate design name from filename
      const nameWithoutExt = uploadedFile.name.replace(/\.[^/.]+$/, '');
      setDesignName(nameWithoutExt);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    maxFiles: 1,
  });

  async function handleUpload() {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    if (!designName.trim()) {
      toast.error('Please enter a design name');
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Upload file to storage (0-70%)
      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(10);

      const uploadResponse = await fetch('/api/designs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      setUploadProgress(70);

      // Step 2: Save design to database (70-100%)
      const saveResponse = await fetch('/api/designs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designName.trim(),
          imageUrl: uploadResult.data.publicUrl,
          metadata: {
            fileName: uploadResult.data.fileName,
            fileSize: uploadResult.data.fileSize,
            filePath: uploadResult.data.filePath,
          },
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save design');
      }

      const saveResult = await saveResponse.json();
      setUploadProgress(100);
      setUploadStatus('success');

      // Notify parent and close modal
      onUploadComplete({
        id: saveResult.data.id,
        imageUrl: saveResult.data.imageUrl,
        thumbnailUrl: saveResult.data.imageUrl,
      });

      toast.success('Design uploaded successfully', {
        description: `"${designName}" is ready to use`,
      });

      // Reset and close after short delay
      setTimeout(() => {
        handleReset();
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setDesignName('');
    setUploadProgress(0);
    setUploadStatus('idle');
  }

  function handleClose() {
    if (!uploading) {
      handleReset();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Custom Design</DialogTitle>
          <DialogDescription>
            Upload your own design file (PNG, JPG, or SVG)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Dropzone */}
          {!file && uploadStatus === 'idle' && (
            <div
              {...getRootProps()}
              className={`
                cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
                ${isDragReject ? 'border-red-500 bg-red-50' : ''}
                hover:border-primary hover:bg-primary/5
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Upload className="h-8 w-8 text-gray-400" />
                </div>

                {isDragActive ? (
                  <p className="text-sm text-gray-700">Drop your design file here...</p>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-semibold text-gray-900">
                      Drag and drop your design file
                    </p>
                    <p className="mb-4 text-xs text-gray-600">
                      or click to browse files
                    </p>
                    <p className="text-xs text-gray-500">
                      Supports PNG, JPG, SVG (max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* File Preview */}
          {file && uploadStatus === 'idle' && (
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Design Name Input */}
          {file && uploadStatus === 'idle' && (
            <div className="space-y-2">
              <Label htmlFor="designName">Design Name</Label>
              <Input
                id="designName"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder="Enter a name for this design"
                disabled={uploading}
              />
            </div>
          )}

          {/* Upload Progress */}
          {uploadStatus === 'uploading' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  Uploading {file?.name}...
                </p>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-600">{uploadProgress}% complete</p>
            </div>
          )}

          {/* Success State */}
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">
                Design uploaded successfully!
              </p>
            </div>
          )}

          {/* Error State */}
          {uploadStatus === 'error' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium text-red-900">
                  Upload failed. Please try again.
                </p>
              </div>
              <Button variant="outline" onClick={handleReset} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {uploadStatus === 'idle' && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="ghost" onClick={handleClose} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !designName.trim() || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Design
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
