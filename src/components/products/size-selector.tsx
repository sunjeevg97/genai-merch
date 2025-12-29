/**
 * Size Selector Component
 *
 * Displays size options as selectable buttons.
 */

'use client';

import { Button } from '@/components/ui/button';
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
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-900">Size</label>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <Button
            key={size.value}
            variant={selectedSize === size.value ? 'default' : 'outline'}
            size="sm"
            disabled={!size.available}
            onClick={() => onSizeChange(size.value)}
            className={cn(
              'min-w-[60px]',
              !size.available && 'opacity-50 cursor-not-allowed line-through'
            )}
          >
            {size.label}
          </Button>
        ))}
      </div>

      {selectedSize && !sizes.find((s) => s.value === selectedSize)?.available && (
        <p className="text-sm text-red-600">This size is currently out of stock</p>
      )}
    </div>
  );
}
