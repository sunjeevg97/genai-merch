/**
 * Mockup Controls Component
 *
 * Provides controls for adjusting design position and size on mockup.
 */

'use client';

import { useState, useEffect } from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { MockupPosition } from '@/lib/printful/mockups';
import { cn } from '@/lib/utils';

interface MockupControlsProps {
  onPositionChange: (position: MockupPosition) => void;
  disabled?: boolean;
}

// Default print area dimensions (typical for t-shirts)
const DEFAULT_PRINT_AREA = {
  width: 1800,
  height: 2400,
};

// Storage key for persisting settings
const STORAGE_KEY = 'mockup-controls-settings';

export function MockupControls({ onPositionChange, disabled = false }: MockupControlsProps) {
  // Design size (percentage of print area)
  const [sizePercent, setSizePercent] = useState(70);

  // Position (using named positions instead of percentages)
  const [horizontal, setHorizontal] = useState<'left' | 'center' | 'right'>('center');
  const [vertical, setVertical] = useState<'top' | 'middle' | 'bottom'>('top');

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.sizePercent) setSizePercent(settings.sizePercent);
        if (settings.horizontal) setHorizontal(settings.horizontal);
        if (settings.vertical) setVertical(settings.vertical);
      } catch (error) {
        console.error('Failed to load saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = {
      sizePercent,
      horizontal,
      vertical,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [sizePercent, horizontal, vertical]);

  /**
   * Convert named position to percentage
   */
  const getPercentage = (
    position: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
  ): number => {
    switch (position) {
      case 'left':
      case 'top':
        return 20;
      case 'center':
      case 'middle':
        return 50;
      case 'right':
      case 'bottom':
        return 80;
    }
  };

  /**
   * Calculate absolute position from settings
   */
  const calculatePosition = (): MockupPosition => {
    const areaWidth = DEFAULT_PRINT_AREA.width;
    const areaHeight = DEFAULT_PRINT_AREA.height;

    // Calculate design dimensions
    const designSize = Math.round((sizePercent / 100) * areaWidth);
    const width = designSize;
    const height = designSize; // Square for now

    // Get percentages from named positions
    const horizontalPercent = getPercentage(horizontal);
    const verticalPercent = getPercentage(vertical);

    // Calculate position (centered at percentage point)
    let left = Math.round((horizontalPercent / 100) * areaWidth - width / 2);
    let top = Math.round((verticalPercent / 100) * areaHeight - height / 2);

    // Constrain to print area bounds
    left = Math.max(0, Math.min(left, areaWidth - width));
    top = Math.max(0, Math.min(top, areaHeight - height));

    return {
      area_width: areaWidth,
      area_height: areaHeight,
      width,
      height,
      top,
      left,
    };
  };

  /**
   * Reset to defaults
   */
  const handleReset = () => {
    setSizePercent(70);
    setHorizontal('center');
    setVertical('top');
  };

  /**
   * Apply position changes
   */
  const handleApply = () => {
    const position = calculatePosition();
    onPositionChange(position);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sliders className="h-5 w-5" />
          Mockup Controls
        </CardTitle>
        <CardDescription>
          Adjust the size and position of your design on the product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Size Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="size-slider">Design Size</Label>
            <span className="text-sm font-medium text-gray-700">{sizePercent}%</span>
          </div>
          <Slider
            id="size-slider"
            value={[sizePercent]}
            onValueChange={([value]) => setSizePercent(value)}
            min={30}
            max={100}
            step={5}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Smaller sizes work better for pocket designs
          </p>
        </div>

        {/* Horizontal Position */}
        <div className="space-y-3">
          <Label>Horizontal Position</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={horizontal === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHorizontal('left')}
              disabled={disabled}
              className={cn(
                'w-full',
                horizontal === 'left' && 'bg-primary text-primary-foreground'
              )}
            >
              Left
            </Button>
            <Button
              type="button"
              variant={horizontal === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHorizontal('center')}
              disabled={disabled}
              className={cn(
                'w-full',
                horizontal === 'center' && 'bg-primary text-primary-foreground'
              )}
            >
              Center
            </Button>
            <Button
              type="button"
              variant={horizontal === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHorizontal('right')}
              disabled={disabled}
              className={cn(
                'w-full',
                horizontal === 'right' && 'bg-primary text-primary-foreground'
              )}
            >
              Right
            </Button>
          </div>
        </div>

        {/* Vertical Position */}
        <div className="space-y-3">
          <Label>Vertical Position</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={vertical === 'top' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVertical('top')}
              disabled={disabled}
              className={cn(
                'w-full',
                vertical === 'top' && 'bg-primary text-primary-foreground'
              )}
            >
              Top
            </Button>
            <Button
              type="button"
              variant={vertical === 'middle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVertical('middle')}
              disabled={disabled}
              className={cn(
                'w-full',
                vertical === 'middle' && 'bg-primary text-primary-foreground'
              )}
            >
              Middle
            </Button>
            <Button
              type="button"
              variant={vertical === 'bottom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVertical('bottom')}
              disabled={disabled}
              className={cn(
                'w-full',
                vertical === 'bottom' && 'bg-primary text-primary-foreground'
              )}
            >
              Bottom
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleApply}
            disabled={disabled}
            className="flex-1"
          >
            Apply Changes
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={disabled}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-gray-500">
          Click &quot;Apply Changes&quot; to regenerate the mockup with new settings
        </p>
      </CardContent>
    </Card>
  );
}
