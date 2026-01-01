/**
 * Color Selector Component
 *
 * Displays color options as clickable swatches with names.
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorHexCode, isLightColor } from '@/lib/utils/color-mapping';

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
          const hexCode = color.hexCode || getColorHexCode(color.label);
          const isLight = isLightColor(hexCode);

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
              title={color.label}
            >
              {/* Color Swatch */}
              <div
                className={cn(
                  'relative h-10 w-10 rounded-full border-2 transition-all',
                  isSelected
                    ? 'border-primary ring-2 ring-primary ring-offset-2 scale-110'
                    : 'border-gray-300 group-hover:border-gray-400 group-hover:scale-105',
                  !color.available && 'opacity-50'
                )}
                style={{ backgroundColor: hexCode }}
              >
                {/* Checkmark for selected color */}
                {isSelected && (
                  <div
                    className={cn(
                      'absolute inset-0 flex items-center justify-center',
                      isLight ? 'text-gray-900' : 'text-white'
                    )}
                  >
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </div>
                )}
              </div>

              {/* Color Name */}
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors max-w-[50px] truncate',
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
