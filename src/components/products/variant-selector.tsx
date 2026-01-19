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
import { sortSizes, formatSizeLabel } from '@/lib/utils/size-ordering';
import { parseSizeFromVariant, parseColorFromVariant } from '@/lib/utils/variant-parsing';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedSize: string | null;
  selectedColor: string | null;
  onSizeChange: (size: string) => void;
  onColorChange: (color: string) => void;
  onVariantChange: (variant: ProductVariant | null) => void;
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
