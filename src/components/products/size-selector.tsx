/**
 * Size Selector Component
 *
 * Displays size options as tabs (smallest to largest).
 */

'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

      <Tabs value={selectedSize || undefined} onValueChange={onSizeChange}>
        <TabsList className="grid w-full h-9" style={{ gridTemplateColumns: `repeat(${sizes.length}, minmax(0, 1fr))` }}>
          {sizes.map((size) => (
            <TabsTrigger
              key={size.value}
              value={size.value}
              disabled={!size.available}
              className={cn(
                'h-8 px-2 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                !size.available && 'opacity-50 cursor-not-allowed line-through'
              )}
            >
              {size.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selectedSize && !sizes.find((s) => s.value === selectedSize)?.available && (
        <p className="text-sm text-red-600">This size is currently out of stock</p>
      )}
    </div>
  );
}
