/**
 * Color Selector Component
 *
 * Displays color options as compact dots with hover tooltips.
 */

'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorHexCode, isLightColor } from '@/lib/utils/color-mapping';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Color
      </label>

      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const isSelected = selectedColor === color.value;
          const hexCode = color.hexCode || getColorHexCode(color.label);
          const isLight = isLightColor(hexCode);

          return (
            <Tooltip key={color.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={!color.available}
                  onClick={() => onColorChange(color.value)}
                  className={cn(
                    'relative h-6 w-6 rounded-full transition-all',
                    'ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                      : 'ring-border hover:ring-primary/50 hover:scale-110',
                    !color.available && 'opacity-40 cursor-not-allowed hover:scale-100 hover:ring-border'
                  )}
                  style={{ backgroundColor: hexCode }}
                  aria-label={color.label}
                >
                  {/* Checkmark for selected color */}
                  {isSelected && (
                    <span
                      className={cn(
                        'absolute inset-0 flex items-center justify-center',
                        isLight ? 'text-foreground' : 'text-white'
                      )}
                    >
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}

                  {/* Strikethrough for unavailable */}
                  {!color.available && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="h-px w-full rotate-45 bg-destructive/80" />
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={8}>
                <span className={cn(!color.available && 'line-through')}>
                  {color.label}
                </span>
                {!color.available && (
                  <span className="ml-1 text-muted-foreground">(Out of stock)</span>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {selectedColor && !colors.find((c) => c.value === selectedColor)?.available && (
        <p className="text-sm text-destructive">This color is currently out of stock</p>
      )}
    </div>
  );
}
