/**
 * Brand Assets Step
 *
 * Third step in the AI-first design wizard (OPTIONAL).
 * Users can upload brand assets to inform AI design generation.
 * This step can be skipped entirely.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus, Loader2, AlertCircle, RefreshCw, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { uploadDesignFile } from '@/lib/supabase/storage';
import { useAuth } from '@clerk/nextjs';
import { createAppError, getErrorMessage, isRetryableError, ErrorType, type AppError } from '@/lib/utils/errors';
import { logError } from '@/lib/utils/errors';

/**
 * Uploaded Logo Interface
 */
interface UploadedLogo {
  id: string;
  url: string;
  filename: string;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: AppError;
  file?: File; // Save file for retry
}

/**
 * Brand Assets Step Component
 *
 * @example
 * ```tsx
 * <BrandAssetsStep />
 * ```
 */
export function BrandAssetsStep() {
  const {
    brandAssets,
    addLogo,
    removeLogo,
    setVoice,
    nextStep,
    previousStep,
  } = useDesignWizard();

  // Clerk authentication
  const { userId } = useAuth();

  // Local state
  const [uploadedLogos, setUploadedLogos] = useState<UploadedLogo[]>([]);
  const [colors, setColors] = useState<string[]>(brandAssets.colors);
  const [voice, setVoiceInput] = useState(brandAssets.voice);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<AppError | null>(null);

  // Character counter
  const maxVoiceChars = 500;
  const remainingChars = maxVoiceChars - voice.length;

  /**
   * Initialize uploaded logos from Zustand store
   */
  useEffect(() => {
    if (brandAssets.logos.length > 0) {
      setUploadedLogos(
        brandAssets.logos.map((url, index) => ({
          id: `${index}`,
          url,
          filename: url.split('/').pop() || `logo-${index}`,
        }))
      );
    }
  }, []);

  /**
   * Handle logo file drop
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rejected) => {
          const error = rejected.errors[0];
          if (error.code === 'file-too-large') {
            toast.error(`${rejected.file.name} is too large. Max size is 5MB.`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${rejected.file.name} is not a valid file type. Use PNG, JPG, or SVG.`);
          } else {
            toast.error(`${rejected.file.name} was rejected.`);
          }
        });
      }

      // Check if we're at the limit
      if (uploadedLogos.length + acceptedFiles.length > 5) {
        toast.error('Maximum 5 logos allowed');
        return;
      }

      if (!userId) {
        toast.error('Please sign in to upload files');
        return;
      }

      setIsUploading(true);
      setUploadError(null); // Clear previous errors

      // Upload each file
      for (const file of acceptedFiles) {
        const tempId = `temp-${Date.now()}-${Math.random()}`;

        // Add placeholder with progress
        setUploadedLogos((prev) => [
          ...prev,
          {
            id: tempId,
            url: URL.createObjectURL(file),
            filename: file.name,
            isUploading: true,
            uploadProgress: 0,
            file, // Save for retry
          },
        ]);

        try {
          // Simulate progress updates
          const progressInterval = setInterval(() => {
            setUploadedLogos((prev) =>
              prev.map((logo) =>
                logo.id === tempId && logo.uploadProgress! < 90
                  ? { ...logo, uploadProgress: logo.uploadProgress! + 10 }
                  : logo
              )
            );
          }, 200);

          const result = await uploadDesignFile(file, userId);

          clearInterval(progressInterval);

          if (result.success && result.url) {
            // Update with actual URL and 100% progress
            setUploadedLogos((prev) =>
              prev.map((logo) =>
                logo.id === tempId
                  ? { ...logo, url: result.url!, isUploading: false, uploadProgress: 100, error: undefined }
                  : logo
              )
            );
            addLogo(result.url);
            toast.success(`${file.name} uploaded successfully`);
          } else {
            // Mark as failed but keep in list for retry
            const error = createAppError(
              new Error(result.error || 'Upload failed'),
              ErrorType.UPLOAD_ERROR
            );
            setUploadedLogos((prev) =>
              prev.map((logo) =>
                logo.id === tempId
                  ? { ...logo, isUploading: false, error }
                  : logo
              )
            );
            logError(error, 'BrandAssetsStep - uploadFile');
            toast.error(result.error || `Failed to upload ${file.name}`);
          }
        } catch (error) {
          console.error('[BrandAssetsStep] Upload error:', error);
          logError(error, 'BrandAssetsStep - uploadFile');

          const appError = createAppError(error, ErrorType.UPLOAD_ERROR);
          setUploadedLogos((prev) =>
            prev.map((logo) =>
              logo.id === tempId
                ? { ...logo, isUploading: false, error: appError }
                : logo
            )
          );
          toast.error(`Error uploading ${file.name}`);
        }
      }

      setIsUploading(false);
    },
    [uploadedLogos, userId, addLogo]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5,
    disabled: isUploading || uploadedLogos.length >= 5,
  });

  /**
   * Retry failed upload
   */
  const handleRetryUpload = async (logoId: string) => {
    const logo = uploadedLogos.find((l) => l.id === logoId);
    if (!logo || !logo.file || !userId) return;

    // Reset error and set uploading state
    setUploadedLogos((prev) =>
      prev.map((l) =>
        l.id === logoId
          ? { ...l, isUploading: true, uploadProgress: 0, error: undefined }
          : l
      )
    );

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadedLogos((prev) =>
          prev.map((l) =>
            l.id === logoId && l.uploadProgress! < 90
              ? { ...l, uploadProgress: l.uploadProgress! + 10 }
              : l
          )
        );
      }, 200);

      const result = await uploadDesignFile(logo.file, userId);

      clearInterval(progressInterval);

      if (result.success && result.url) {
        // Update with actual URL
        setUploadedLogos((prev) =>
          prev.map((l) =>
            l.id === logoId
              ? { ...l, url: result.url!, isUploading: false, uploadProgress: 100, error: undefined }
              : l
          )
        );
        addLogo(result.url);
        toast.success(`${logo.filename} uploaded successfully`);
      } else {
        // Mark as failed
        const error = createAppError(
          new Error(result.error || 'Upload failed'),
          ErrorType.UPLOAD_ERROR
        );
        setUploadedLogos((prev) =>
          prev.map((l) =>
            l.id === logoId
              ? { ...l, isUploading: false, error }
              : l
          )
        );
        toast.error(result.error || `Failed to upload ${logo.filename}`);
      }
    } catch (error) {
      logError(error, 'BrandAssetsStep - retryUpload');
      const appError = createAppError(error, ErrorType.UPLOAD_ERROR);
      setUploadedLogos((prev) =>
        prev.map((l) =>
          l.id === logoId
            ? { ...l, isUploading: false, error: appError }
            : l
        )
      );
      toast.error(`Error uploading ${logo.filename}`);
    }
  };

  /**
   * Remove uploaded logo
   */
  const handleRemoveLogo = (logoId: string) => {
    const logo = uploadedLogos.find((l) => l.id === logoId);
    if (logo) {
      setUploadedLogos((prev) => prev.filter((l) => l.id !== logoId));
      if (!logo.error) {
        // Only remove from store if upload was successful
        removeLogo(logo.url);
      }
      toast.success('Logo removed');
    }
  };

  /**
   * Add color
   */
  const handleAddColor = () => {
    if (colors.length >= 6) {
      toast.error('Maximum 6 colors allowed');
      return;
    }
    setColors([...colors, '#000000']);
  };

  /**
   * Update color at index
   */
  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...colors];
    newColors[index] = newColor;
    setColors(newColors);
  };

  /**
   * Remove color at index
   */
  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  /**
   * Handle Skip button
   */
  const handleSkip = () => {
    nextStep();
  };

  /**
   * Handle Continue button
   */
  const handleContinue = () => {
    // Save voice to store
    setVoice(voice);

    nextStep();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Brand Assets (Optional)</h2>
        <p className="text-lg text-muted-foreground">
          Upload your brand materials to help AI generate on-brand designs
        </p>
      </div>

      <div className="space-y-6">
        {/* Logo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Brand Logos ({uploadedLogos.length}/5)
            </CardTitle>
            <CardDescription>
              Upload your logo files (PNG, JPG, or SVG, max 5MB each)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dropzone */}
            {uploadedLogos.length < 5 && (
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8
                  text-center cursor-pointer
                  transition-all duration-200
                  ${isDragActive ? 'border-primary bg-primary/5 scale-105' : 'border-border'}
                  ${isUploading || uploadedLogos.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-sm text-primary font-medium">Drop your logo files here...</p>
                ) : isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm font-medium">Uploading...</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Drag & drop logo files here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse (PNG, JPG, SVG - max 5MB, up to 5 files)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Logo Previews */}
            {uploadedLogos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedLogos.map((logo) => (
                  <div key={logo.id} className="space-y-2">
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
                      {logo.isUploading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {logo.uploadProgress ?? 0}%
                          </p>
                        </div>
                      ) : logo.error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 gap-2 p-4">
                          <AlertCircle className="h-8 w-8 text-destructive" />
                          <p className="text-xs text-destructive text-center">
                            Upload failed
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryUpload(logo.id)}
                            className="mt-1"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Image
                            src={logo.url}
                            alt={logo.filename}
                            fill
                            className="object-contain p-2"
                          />
                          {logo.uploadProgress === 100 && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveLogo(logo.id)}
                            className="
                              absolute top-2 right-2
                              bg-destructive text-destructive-foreground
                              rounded-full p-1
                              opacity-0 group-hover:opacity-100
                              transition-opacity duration-200
                              hover:scale-110
                            "
                            aria-label="Remove logo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Progress bar during upload */}
                    {logo.isUploading && (
                      <Progress value={logo.uploadProgress ?? 0} className="h-1" />
                    )}

                    {/* Filename */}
                    <p className="text-xs text-muted-foreground truncate">
                      {logo.filename}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Colors ({colors.length}/6)</CardTitle>
            <CardDescription>
              Add your brand colors to maintain consistency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Pickers */}
            {colors.length > 0 && (
              <div className="space-y-3">
                {colors.map((color, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="relative">
                      <Input
                        type="color"
                        value={color}
                        onChange={(e) => handleColorChange(index, e.target.value)}
                        className="h-12 w-20 cursor-pointer"
                      />
                    </div>
                    <Input
                      type="text"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      placeholder="#000000"
                      className="flex-1 font-mono"
                      maxLength={7}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveColor(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Color Button */}
            {colors.length < 6 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAddColor}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {colors.length === 0 ? 'Add Brand Color' : 'Add Another Color'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Brand Voice Section */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Voice & Tone</CardTitle>
            <CardDescription>
              Describe your brand personality to guide AI text generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                placeholder="e.g., Fun and playful, Professional and modern, Bold and energetic..."
                value={voice}
                onChange={(e) => setVoiceInput(e.target.value.slice(0, maxVoiceChars))}
                rows={4}
                maxLength={maxVoiceChars}
              />
              <div className="flex justify-end">
                <span
                  className={`text-xs ${
                    remainingChars < 50
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {remainingChars} characters remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Helper Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>These assets help AI generate designs that match your brand identity</p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={previousStep} type="button">
          Back
        </Button>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={handleSkip} type="button">
            Skip this step
          </Button>
          <Button onClick={handleContinue} type="button">
            Continue to AI Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
