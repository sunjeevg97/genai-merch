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
    },
    maxSize: 5 * 1024 * 1024, // 5MB (match API limit)
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
      console.log('[Upload Modal] Starting upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        designName: designName.trim(),
      });

      const formData = new FormData();
      formData.append('file', file);

      setUploadProgress(10);

      const uploadResponse = await fetch('/api/designs/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        console.error('[Upload Modal] Upload failed:', error);
        throw new Error(error.error || 'Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      console.log('[Upload Modal] Upload successful:', uploadResult);
      setUploadProgress(70);

      // Step 2: Save design to database (70-100%)
      const savePayload = {
        name: designName.trim(),
        imageUrl: uploadResult.data.publicUrl,
        metadata: {
          fileName: uploadResult.data.fileName,
          fileSize: uploadResult.data.fileSize,
          filePath: uploadResult.data.filePath,
        },
      };

      console.log('[Upload Modal] Saving to database:', savePayload);

      const saveResponse = await fetch('/api/designs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      });

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json();
        console.error('[Upload Modal] Save failed - Status:', saveResponse.status);
        console.error('[Upload Modal] Save error details:', JSON.stringify(saveError, null, 2));
        throw new Error(saveError.error || saveError.message || 'Failed to save design');
      }

      const saveResult = await saveResponse.json();
      console.log('[Upload Modal] Save successful:', saveResult);
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
            Upload your own design file (PNG or JPG, max 5MB)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Dropzone */}
          {!file && uploadStatus === 'idle' && (
            <div
              {...getRootProps()}
              className={`
                cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
                ${isDragReject ? 'border-destructive bg-destructive/10' : ''}
                hover:border-primary hover:bg-primary/5
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>

                {isDragActive ? (
                  <p className="text-sm text-foreground">Drop your design file here...</p>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-semibold text-foreground">
                      Drag and drop your design file
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      or click to browse files
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports PNG, JPG (max 5MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* File Preview */}
          {file && uploadStatus === 'idle' && (
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
              <p className="text-xs text-muted-foreground">{uploadProgress}% complete</p>
            </div>
          )}

          {/* Success State */}
          {uploadStatus === 'success' && (
            <div className="flex items-center gap-3 rounded-lg bg-text-success/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-text-success" />
              <p className="text-sm font-medium text-text-success">
                Design uploaded successfully!
              </p>
            </div>
          )}

          {/* Error State */}
          {uploadStatus === 'error' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-text-error/10 p-4">
                <AlertCircle className="h-5 w-5 text-text-error" />
                <p className="text-sm font-medium text-text-error">
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
