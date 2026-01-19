/**
 * Design Preview Component
 *
 * Shows preview of custom design with option to change/remove.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Upload, Sparkles, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { DesignGalleryModal } from './design-gallery-modal';
import { FileUploadModal } from './file-upload-modal';

export interface DesignData {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
}

interface DesignPreviewProps {
  design: DesignData | null;
  onDesignChange?: (design: DesignData) => void;
  onRemove?: () => void;
}

export function DesignPreview({ design, onDesignChange, onRemove }: DesignPreviewProps) {
  const [showGallery, setShowGallery] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  function handleSelectDesign(selectedDesign: DesignData) {
    if (onDesignChange) {
      onDesignChange(selectedDesign);
    }
  }

  function handleUploadComplete(uploadedDesign: DesignData) {
    if (onDesignChange) {
      onDesignChange(uploadedDesign);
    }
  }

  if (!design) {
    // Show "Add Design" options when no design
    return (
      <>
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-900">Custom Design (Optional)</label>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Sparkles className="h-8 w-8 text-gray-400" />
              </div>

              <h3 className="mb-2 font-semibold text-gray-900">Add Custom Design</h3>
              <p className="mb-4 text-sm text-gray-600">
                Make this product unique with a custom design
              </p>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="default" size="sm">
                  <Link href="/design/create">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create with AI
                  </Link>
                </Button>

                <Button variant="outline" size="sm" onClick={() => setShowGallery(true)}>
                  <Images className="mr-2 h-4 w-4" />
                  Browse Designs
                </Button>

                <Button variant="outline" size="sm" onClick={() => setShowUpload(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Design
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        <DesignGalleryModal
          open={showGallery}
          onOpenChange={setShowGallery}
          onSelectDesign={handleSelectDesign}
        />

        <FileUploadModal
          open={showUpload}
          onOpenChange={setShowUpload}
          onUploadComplete={handleUploadComplete}
        />
      </>
    );
  }

  // Show design preview when design exists
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-900">Custom Design</label>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Design Thumbnail */}
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
              <Image
                src={design.thumbnailUrl || design.imageUrl}
                alt="Custom design"
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            {/* Design Info */}
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="font-semibold text-gray-900">Custom Design Applied</p>
                <p className="text-sm text-gray-600">
                  Your design will be printed on this product
                </p>
              </div>

              {/* Actions */}
              <div className="mt-2 flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/design?designId=${design.id}`}>Edit Design</Link>
                </Button>

                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
