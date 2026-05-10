/**
 * Size Selector Component
 *
 * Displays size options as compact pill buttons (smallest to largest).
 */

'use client';

import { cn } from '@/lib/utils';

export interface SizeOption {
  value: string;
  label: string;
  available: boolean;
}

interface SizeSelectorProps {
  sizes: SizeOption[];
  selectedSize: string | null;
  onSizeChange: (size: string) => void;
}

export function SizeSelector({ sizes, selectedSize, onSizeChange }: SizeSelectorProps) {
  if (sizes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Size
      </label>

      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => {
          const isSelected = selectedSize === size.value;

          return (
            <button
              key={size.value}
              type="button"
              disabled={!size.available}
              onClick={() => onSizeChange(size.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                'border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent text-foreground border-border hover:border-primary/50 hover:bg-muted',
                !size.available && 'opacity-40 line-through cursor-not-allowed hover:bg-transparent hover:border-border'
              )}
            >
              {size.label}
            </button>
          );
        })}
      </div>

      {selectedSize && !sizes.find((s) => s.value === selectedSize)?.available && (
        <p className="text-sm text-destructive">This size is currently out of stock</p>
      )}
    </div>
  );
}
