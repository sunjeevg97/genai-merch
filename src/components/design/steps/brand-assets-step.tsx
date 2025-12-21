/**
 * Brand Assets Step
 *
 * Third step in the AI-first design wizard (OPTIONAL).
 * Users can upload brand assets (logos, colors, fonts, voice) to inform AI design generation.
 * This step can be skipped entirely.
 */

'use client';

import { useState, useCallback } from 'react';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus, Palette } from 'lucide-react';
import Image from 'next/image';

/**
 * Brand Assets Step Component
 *
 * Allows users to upload brand materials to maintain consistency in AI-generated designs.
 * All fields are optional - users can skip this step entirely.
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
    addColor,
    removeColor,
    setFonts,
    setVoice,
    completeBrandAssets,
    nextStep,
    previousStep,
  } = useDesignWizard();

  // Local state for form inputs
  const [colorInput, setColorInput] = useState('');
  const [fontsInput, setFontsInput] = useState(brandAssets.fonts.join(', '));
  const [voiceInput, setVoiceInput] = useState(brandAssets.voice);
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Handle logo file drop
   * TODO: Implement Supabase Storage upload
   * For now, creates local object URLs
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      try {
        for (const file of acceptedFiles) {
          // TODO: Upload to Supabase Storage
          // const { data, error } = await supabase.storage
          //   .from('brand-assets')
          //   .upload(`logos/${userId}/${file.name}`, file);

          // For now, create a local object URL for preview
          const objectUrl = URL.createObjectURL(file);
          addLogo(objectUrl);
        }
      } catch (error) {
        console.error('Error uploading logo:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [addLogo]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
    },
    maxFiles: 5,
  });

  /**
   * Handle adding a brand color
   */
  const handleAddColor = () => {
    if (colorInput && /^#[0-9A-Fa-f]{6}$/.test(colorInput)) {
      addColor(colorInput);
      setColorInput('');
    }
  };

  /**
   * Handle Continue button
   * Saves fonts and voice, marks step as complete
   */
  const handleContinue = () => {
    // Parse fonts from comma-separated input
    const fonts = fontsInput
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);
    setFonts(fonts);
    setVoice(voiceInput);

    // Check if user provided any assets
    const hasAssets =
      brandAssets.logos.length > 0 ||
      brandAssets.colors.length > 0 ||
      fonts.length > 0 ||
      voiceInput.trim().length > 0;

    completeBrandAssets(hasAssets);
    nextStep();
  };

  /**
   * Handle Skip button
   * Advances without saving, marks as not having assets
   */
  const handleSkip = () => {
    completeBrandAssets(false);
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
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Brand Logos
            </CardTitle>
            <CardDescription>
              Upload your logo files (PNG, JPG, or SVG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8
                text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
                ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary'}
              `}
            >
              <input {...getInputProps()} disabled={isUploading} />
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              {isDragActive ? (
                <p className="text-sm text-muted-foreground">Drop your logo files here...</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {isUploading ? 'Uploading...' : 'Drag & drop logo files here'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse (PNG, JPG, SVG - max 5 files)
                  </p>
                </div>
              )}
            </div>

            {/* Logo Previews */}
            {brandAssets.logos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {brandAssets.logos.map((logoUrl, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-muted rounded-lg overflow-hidden group"
                  >
                    <Image
                      src={logoUrl}
                      alt={`Logo ${index + 1}`}
                      fill
                      className="object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => removeLogo(logoUrl)}
                      className="
                        absolute top-2 right-2
                        bg-destructive text-destructive-foreground
                        rounded-full p-1
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                      "
                      aria-label="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Brand Colors
            </CardTitle>
            <CardDescription>
              Add your brand colors in hex format (e.g., #FF5733)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Color Input */}
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="#FF5733"
                value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColor();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddColor}
                variant="outline"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Color Swatches */}
            {brandAssets.colors.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {brandAssets.colors.map((color, index) => (
                  <div
                    key={index}
                    className="group relative"
                  >
                    <div
                      className="h-12 w-12 rounded-lg border-2 border-border shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      className="
                        absolute -top-2 -right-2
                        bg-destructive text-destructive-foreground
                        rounded-full p-1
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-200
                        shadow-md
                      "
                      aria-label={`Remove ${color}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-xs text-center mt-1 text-muted-foreground">
                      {color}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Brand Fonts */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Fonts</CardTitle>
            <CardDescription>
              Enter font names separated by commas (e.g., Roboto, Open Sans)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Roboto, Open Sans, Montserrat"
              value={fontsInput}
              onChange={(e) => setFontsInput(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Brand Voice */}
        <Card>
          <CardHeader>
            <CardTitle>Brand Voice & Tone</CardTitle>
            <CardDescription>
              Describe your brand personality to guide AI text generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g., Professional and authoritative, Fun and playful, Innovative and tech-forward..."
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Helper Text */}
      <div className="text-center text-sm text-muted-foreground">
        <p>These assets help AI generate designs that match your brand identity</p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={previousStep}
          type="button"
        >
          Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            type="button"
          >
            Skip this step
          </Button>
          <Button
            onClick={handleContinue}
            type="button"
          >
            Continue to AI Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
