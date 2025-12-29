/**
 * Color Selector Component
 *
 * Displays color options as swatches with names.
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColorOption {
  value: string;
  label: string;
  hexCode?: string; // Optional hex code for color swatch
  available: boolean;
}

interface ColorSelectorProps {
  colors: ColorOption[];
  selectedColor: string | null;
  onColorChange: (color: string) => void;
}

/**
 * Get background color for swatch
 */
function getSwatchColor(colorName: string, hexCode?: string): string {
  if (hexCode) {
    return hexCode;
  }

  // Common color mappings
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    gray: '#9CA3AF',
    grey: '#9CA3AF',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    orange: '#F97316',
    purple: '#A855F7',
    pink: '#EC4899',
    navy: '#1E3A8A',
    brown: '#92400E',
    beige: '#D4C5B9',
    cream: '#FFFDD0',
  };

  const normalizedName = colorName.toLowerCase();
  return colorMap[normalizedName] || '#6B7280'; // Default gray
}

export function ColorSelector({
  colors,
  selectedColor,
  onColorChange,
}: ColorSelectorProps) {
  if (colors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-900">Color</label>

      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isSelected = selectedColor === color.value;
          const swatchBg = getSwatchColor(color.label, color.hexCode);
          const isLightColor =
            swatchBg === '#FFFFFF' ||
            swatchBg.toLowerCase() === '#ffffff' ||
            swatchBg.toLowerCase().includes('cream') ||
            swatchBg.toLowerCase().includes('beige');

          return (
            <button
              key={color.value}
              type="button"
              disabled={!color.available}
              onClick={() => onColorChange(color.value)}
              className={cn(
                'group flex flex-col items-center gap-2 transition-all',
                !color.available && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Color Swatch */}
              <div
                className={cn(
                  'relative h-10 w-10 rounded-full border-2 transition-all',
                  isSelected
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-gray-300 group-hover:border-gray-400',
                  !color.available && 'line-through'
                )}
                style={{ backgroundColor: swatchBg }}
              >
                {/* Checkmark for selected color */}
                {isSelected && (
                  <div
                    className={cn(
                      'absolute inset-0 flex items-center justify-center',
                      isLightColor ? 'text-gray-900' : 'text-white'
                    )}
                  >
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Color Name */}
              <span
                className={cn(
                  'text-xs font-medium transition-colors',
                  isSelected ? 'text-primary' : 'text-gray-700',
                  !color.available && 'line-through'
                )}
              >
                {color.label}
              </span>
            </button>
          );
        })}
      </div>

      {selectedColor && !colors.find((c) => c.value === selectedColor)?.available && (
        <p className="text-sm text-red-600">This color is currently out of stock</p>
      )}
    </div>
  );
}
