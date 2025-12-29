/**
 * Variant Selector Component
 *
 * Combines size and color selection to choose product variant.
 */

'use client';

import { useEffect, useMemo } from 'react';
import type { ProductVariant } from '@prisma/client';
import { SizeSelector, type SizeOption } from './size-selector';
import { ColorSelector, type ColorOption } from './color-selector';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onVariantChange: (variant: ProductVariant | null) => void;
}

/**
 * Extract unique sizes from variants
 */
function extractSizes(variants: ProductVariant[]): SizeOption[] {
  const sizeMap = new Map<string, SizeOption>();

  variants.forEach((variant) => {
    if (variant.size) {
      const existing = sizeMap.get(variant.size);
      sizeMap.set(variant.size, {
        value: variant.size,
        label: variant.size,
        available: existing?.available || variant.inStock,
      });
    }
  });

  return Array.from(sizeMap.values()).sort((a, b) => {
    // Sort by size order: XS, S, M, L, XL, XXL, etc.
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const aIndex = sizeOrder.indexOf(a.value);
    const bIndex = sizeOrder.indexOf(b.value);

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    return a.value.localeCompare(b.value);
  });
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
    ? variants.filter((v) => v.size === selectedSize)
    : variants;

  filteredVariants.forEach((variant) => {
    if (variant.color) {
      const existing = colorMap.get(variant.color);
      colorMap.set(variant.color, {
        value: variant.color,
        label: variant.color,
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
      const matchingVariant = variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      );
      onVariantChange(matchingVariant || null);
    } else if (selectedSize && !selectedColor) {
      // If only size is selected, find any variant with that size
      const matchingVariant = variants.find((v) => v.size === selectedSize);
      onVariantChange(matchingVariant || null);
    } else if (!selectedSize && selectedColor) {
      // If only color is selected, find any variant with that color
      const matchingVariant = variants.find((v) => v.color === selectedColor);
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
    <div className="space-y-6">
      {/* Size Selector */}
      {sizes.length > 0 && (
        <SizeSelector
          sizes={sizes}
          selectedSize={selectedSize}
          onSizeChange={onSizeChange}
        />
      )}

      {/* Color Selector */}
      {colors.length > 0 && (
        <ColorSelector
          colors={colors}
          selectedColor={selectedColor}
          onColorChange={onColorChange}
        />
      )}

      {/* Variant Not Found Warning */}
      {selectedSize && selectedColor && !variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      ) && (
        <p className="text-sm text-red-600">
          This combination is not available. Please select a different size or color.
        </p>
      )}
    </div>
  );
}
