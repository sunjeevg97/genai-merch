/**
 * Design Preview Component
 *
 * Shows preview of custom design with option to change/remove.
 * Integrates with the design wizard for the return-to-product flow.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { X, Sparkles, Wand2, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDesignWizard } from '@/lib/store/design-wizard';

export interface DesignData {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
}

interface DesignPreviewProps {
  design: DesignData | null;
  onDesignChange?: (design: DesignData) => void;
  onRemove?: () => void;
  productId?: string; // Product ID for return-to-product flow
}

export function DesignPreview({ design, onDesignChange, onRemove, productId }: DesignPreviewProps) {
  const router = useRouter();
  const { finalDesignUrl, setReturnToProductId } = useDesignWizard();

  // Check if we have a design from the wizard store that we should use
  useEffect(() => {
    if (finalDesignUrl && !design && onDesignChange) {
      // Auto-apply design from wizard store
      onDesignChange({
        id: 'wizard-design',
        imageUrl: finalDesignUrl,
        thumbnailUrl: finalDesignUrl,
      });
    }
  }, [finalDesignUrl, design, onDesignChange]);

  /**
   * Handle "Create with AI" button click
   * Sets the returnToProductId so user comes back to this product after wizard
   */
  const handleCreateWithAI = () => {
    if (productId) {
      setReturnToProductId(productId);
    }
    router.push('/design/create');
  };

  if (!design) {
    // Show prominent "Create with AI" CTA when no design
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Make it yours! 🎨</label>

        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-colors">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/30">
              <Wand2 className="h-8 w-8 text-primary" />
            </div>

            <h3 className="mb-2 text-lg font-semibold text-foreground">Create with AI</h3>
            <p className="mb-4 max-w-xs text-sm text-muted-foreground">
              Describe your idea and let our AI work its magic. Takes just a minute!
            </p>

            <Button onClick={handleCreateWithAI} size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Start Designing
            </Button>

            <p className="mt-4 text-xs text-muted-foreground">
              Or add to cart without a design — your call!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show design preview when design exists
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">Looking good! ✓</label>
        <Badge variant="secondary" className="gap-1 bg-text-success/10 text-text-success border-0">
          <Check className="h-3 w-3" />
          Design Applied
        </Badge>
      </div>

      <Card className="border-text-success/20 bg-text-success/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Design Thumbnail */}
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 border-white bg-white shadow-md">
              <Image
                src={design.thumbnailUrl || design.imageUrl}
                alt="Custom design"
                fill
                sizes="96px"
                className="object-contain p-1"
                unoptimized={design.imageUrl.startsWith('data:')}
              />
            </div>

            {/* Design Info */}
            <div className="flex flex-1 flex-col justify-between min-h-[96px]">
              <div>
                <p className="font-semibold text-foreground">Your Custom Design</p>
                <p className="text-sm text-muted-foreground">
                  Created just now
                </p>
              </div>

              {/* Actions */}
              <div className="mt-2 flex items-center gap-3">
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Create different design link */}
          <div className="mt-4 pt-3 border-t border-text-success/20">
            <button
              onClick={handleCreateWithAI}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Palette className="h-4 w-4" />
              Want something different? Create a new design
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
