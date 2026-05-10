/**
 * Variant Selector Component
 *
 * Combines size, color, and technique selection in an inline layout.
 * Technique selector only shown when product supports multiple techniques.
 */

'use client';

import { useEffect, useMemo } from 'react';
import type { ProductVariant } from '@prisma/client';
import { SizeSelector, type SizeOption } from './size-selector';
import { ColorSelector, type ColorOption } from './color-selector';
import { TechniqueSelector, type TechniqueOption } from './technique-selector';
import { sortSizes, formatSizeLabel } from '@/lib/utils/size-ordering';
import { parseSizeFromVariant, parseColorFromVariant } from '@/lib/utils/variant-parsing';
import type { PrintTechnique } from '@/lib/printful/technique-mapping';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onVariantChange: (variant: ProductVariant | null) => void;
  // Optional technique props - only used for products with multiple techniques
  techniques?: TechniqueOption[];
  selectedTechnique?: PrintTechnique | null;
  onTechniqueChange?: (technique: PrintTechnique) => void;
}

/**
 * Extract unique sizes from variants and sort from smallest to largest
 */
function extractSizes(variants: ProductVariant[]): SizeOption[] {
  const sizeMap = new Map<string, SizeOption>();

  variants.forEach((variant) => {
    // Parse size from variant name if needed
    const size = parseSizeFromVariant(variant.name, variant.size);

    if (size) {
      const existing = sizeMap.get(size);
      sizeMap.set(size, {
        value: size,
        label: formatSizeLabel(size),
        available: existing?.available || variant.inStock,
      });
    }
  });

  return sortSizes(Array.from(sizeMap.values()));
}

/**
 * Extract unique colors from variants
 */
function extractColors(
  variants: ProductVariant[],
  selectedSize: string | null
): ColorOption[] {
  const colorMap = new Map<string, ColorOption>();

  // Filter variants by selected size if applicable
  const filteredVariants = selectedSize
    ? variants.filter((v) => {
        const size = parseSizeFromVariant(v.name, v.size);
        return size === selectedSize;
      })
    : variants;

  filteredVariants.forEach((variant) => {
    // Parse color from variant name if needed
    const color = parseColorFromVariant(variant.name, variant.color);

    if (color) {
      const existing = colorMap.get(color);
      colorMap.set(color, {
        value: color,
        label: color,
        available: existing?.available || variant.inStock,
      });
    }
  });

  return Array.from(colorMap.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function VariantSelector({
  variants,
  selectedSize,
  selectedColor,
  onSizeChange,
  onColorChange,
  onVariantChange,
  techniques,
  selectedTechnique,
  onTechniqueChange,
}: VariantSelectorProps) {
  // Extract available sizes and colors
  const sizes = useMemo(() => extractSizes(variants), [variants]);
  const colors = useMemo(
    () => extractColors(variants, selectedSize),
    [variants, selectedSize]
  );

  // Find matching variant when size and color are selected
  useEffect(() => {
    if (selectedSize && selectedColor) {
      const matchingVariant = variants.find((v) => {
        const size = parseSizeFromVariant(v.name, v.size);
        const color = parseColorFromVariant(v.name, v.color);
        return size === selectedSize && color === selectedColor;
      });
      onVariantChange(matchingVariant || null);
    } else if (selectedSize && !selectedColor) {
      // If only size is selected, find any variant with that size
      const matchingVariant = variants.find((v) => {
        const size = parseSizeFromVariant(v.name, v.size);
        return size === selectedSize;
      });
      onVariantChange(matchingVariant || null);
    } else if (!selectedSize && selectedColor) {
      // If only color is selected, find any variant with that color
      const matchingVariant = variants.find((v) => {
        const color = parseColorFromVariant(v.name, v.color);
        return color === selectedColor;
      });
      onVariantChange(matchingVariant || null);
    } else {
      onVariantChange(null);
    }
  }, [selectedSize, selectedColor, variants, onVariantChange]);

  // Auto-select first available size if none selected
  useEffect(() => {
    if (!selectedSize && sizes.length > 0) {
      const firstAvailable = sizes.find((s) => s.available);
      if (firstAvailable) {
        onSizeChange(firstAvailable.value);
      }
    }
  }, [selectedSize, sizes, onSizeChange]);

  // Auto-select first available color if none selected (after size is selected)
  useEffect(() => {
    if (selectedSize && !selectedColor && colors.length > 0) {
      const firstAvailable = colors.find((c) => c.available);
      if (firstAvailable) {
        onColorChange(firstAvailable.value);
      }
    }
  }, [selectedSize, selectedColor, colors, onColorChange]);

  return (
    <div className="space-y-4">
      {/* Inline layout: Size | Color | Technique */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
        {/* Size Section - takes available space */}
        {sizes.length > 0 && (
          <div className="flex-1 min-w-0">
            <SizeSelector
              sizes={sizes}
              selectedSize={selectedSize}
              onSizeChange={onSizeChange}
            />
          </div>
        )}

        {/* Color Section - shrinks to fit content */}
        {colors.length > 0 && (
          <div className="shrink-0">
            <ColorSelector
              colors={colors}
              selectedColor={selectedColor}
              onColorChange={onColorChange}
            />
          </div>
        )}

        {/* Technique Section - only shown when multiple techniques available */}
        {techniques && techniques.length > 1 && selectedTechnique && onTechniqueChange && (
          <div className="shrink-0">
            <TechniqueSelector
              techniques={techniques}
              selectedTechnique={selectedTechnique}
              onTechniqueChange={onTechniqueChange}
            />
          </div>
        )}
      </div>

      {/* Variant Not Found Warning */}
      {selectedSize && selectedColor && !variants.find((v) => {
        const size = parseSizeFromVariant(v.name, v.size);
        const color = parseColorFromVariant(v.name, v.color);
        return size === selectedSize && color === selectedColor;
      }) && (
        <p className="text-sm text-destructive">
          This combination is not available. Please select a different size or color.
        </p>
      )}
    </div>
  );
}
