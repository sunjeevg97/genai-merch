/**
 * Design Results Gallery Component
 *
 * Displays 4 generated design variants in a 2x2 grid across all breakpoints.
 * Features:
 * - 2x2 grid (compact on mobile, larger cells on desktop)
 * - Click to select/preview (blue ring indicator)
 * - Framer Motion stagger reveal
 * - "Regenerate All" button to retry
 * - "Continue with Selected" button (disabled until selection)
 * - Large preview modal on click
 *
 * Variant metadata: in same-preset mode each tile shares a presetId
 * (badge shows "Variant N"); in mix-presets mode each tile has its own
 * presetId (badge shows the preset name).
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  RefreshCw,
  ArrowRight,
  X,
  ZoomIn,
  Download,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STYLE_PRESETS } from '@/lib/ai/style-presets';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GeneratedDesign {
  id: string;
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  metadata?: {
    index: number;
    // varietyMode is the canonical field (Phase 3); varietyLevel kept for
    // backward compat with anything still emitting the old shape.
    varietyMode?: 'same-preset' | 'mix-presets';
    varietyLevel?: 'variations' | 'different-concepts';
    eventType: string;
    presetId?: string;
    seed?: string;
    generatedAt: string;
  };
}

interface DesignResultsProps {
  /** Array of generated designs (4 in Phase 3, was 3 previously) */
  designs: GeneratedDesign[];

  /** Callback when user selects a design */
  onSelect: (designId: string) => void;

  /** Callback when user clicks "Regenerate All" */
  onRegenerateAll: () => void;

  /** Callback when user clicks "Continue" with selected design */
  onContinue: () => void;

  /** Currently selected design ID */
  selectedDesignId?: string | null;

  /** Whether regeneration is in progress */
  loading?: boolean;
}

export function DesignResults({
  designs,
  onSelect,
  onRegenerateAll,
  onContinue,
  selectedDesignId = null,
  loading = false,
}: DesignResultsProps) {
  const [previewDesign, setPreviewDesign] = useState<GeneratedDesign | null>(null);

  const handleDownload = async (design: GeneratedDesign) => {
    try {
      const response = await fetch(design.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `design-${design.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download design:', error);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-primary mr-2" />
          <h1 className="text-3xl font-bold">Your Designs Are Ready!</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Select your favorite design to continue, or regenerate for new options
        </p>
      </motion.div>

      {/* Design Grid — 2x2 across all breakpoints */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8 max-w-3xl mx-auto">
        {designs.map((design, index) => {
          const isSelected = selectedDesignId === design.id;

          return (
            <motion.div
              key={design.id}
              custom={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.2,
                duration: 0.5,
                type: 'spring',
                stiffness: 100,
              }}
            >
              <Card
                className={`
                  cursor-pointer transition-all duration-200 overflow-hidden group
                  ${
                    isSelected
                      ? 'ring-4 ring-primary shadow-2xl'
                      : 'hover:shadow-xl hover:scale-105'
                  }
                `}
                onClick={() => onSelect(design.id)}
              >
                <CardContent className="p-0 relative">
                  {/* Design Image */}
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={design.imageUrl}
                      alt={`Design ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Selection Indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg"
                      >
                        <Check className="w-6 h-6 text-primary-foreground" />
                      </motion.div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        {/* Preview Button */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewDesign(design);
                              }}
                            >
                              <ZoomIn className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Design Preview</DialogTitle>
                              <DialogDescription>
                                Design {design.metadata?.index} of {designs.length}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                              <Image
                                src={design.imageUrl}
                                alt="Design preview"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(design)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Download Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(design);
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Design Info */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-semibold text-sm sm:text-base">
                        {/* Mix-presets mode → show preset name. Same-preset
                            mode → show "Variant N" (all share a preset). */}
                        {(() => {
                          const md = design.metadata;
                          const isMix = md?.varietyMode === 'mix-presets';
                          const presetName = md?.presetId
                            ? STYLE_PRESETS[md.presetId]?.name
                            : undefined;
                          if (isMix && presetName) return presetName;
                          return `Variant ${md?.index ?? index + 1}`;
                        })()}
                      </h3>
                      {design.metadata?.varietyMode && (
                        <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                          {design.metadata.varietyMode === 'mix-presets'
                            ? 'Mixed'
                            : 'Same style'}
                        </Badge>
                      )}
                    </div>
                    {isSelected && (
                      <p className="text-xs sm:text-sm text-primary font-medium">✓ Selected</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
      >
        {/* Regenerate All Button */}
        <Button variant="outline" size="lg" onClick={onRegenerateAll} disabled={loading}>
          <RefreshCw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          Regenerate All
        </Button>

        {/* Continue Button */}
        <Button
          size="lg"
          onClick={onContinue}
          disabled={!selectedDesignId || loading}
          className="min-w-[200px]"
        >
          Continue with Selected
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {selectedDesignId
            ? 'Click "Continue" to move forward with your selected design'
            : 'Click on a design to select it, or regenerate for new options'}
        </p>
      </motion.div>
    </div>
  );
}
