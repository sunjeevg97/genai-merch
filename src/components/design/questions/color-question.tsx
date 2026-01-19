/**
 * Color Question Component
 *
 * Color selection with predefined palettes and custom picker.
 * Features:
 * - Grid of predefined color swatches (large circular)
 * - Custom color picker button (opens dialog)
 * - Multi-select support (up to maxSelections colors)
 * - Large color swatches (60px) for easy clicking
 * - Checkmark overlay when selected
 * - Hex color display on hover
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Palette, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { QuestionOption } from '@/lib/ai/question-templates';

interface ColorQuestionProps {
  /** Available color options */
  options: QuestionOption[];

  /** Currently selected colors */
  value?: string[];

  /** Callback when colors change */
  onChange: (colors: string[]) => void;

  /** Maximum number of colors allowed */
  maxSelections?: number;
}

export function ColorQuestion({
  options,
  value = [],
  onChange,
  maxSelections = 3,
}: ColorQuestionProps) {
  const [selectedColors, setSelectedColors] = useState<string[]>(value);
  const [customColor, setCustomColor] = useState('#000000');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const swatchRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-focus first color swatch on mount
  useEffect(() => {
    swatchRefs.current[0]?.focus();
  }, []);

  const handleToggleColor = (color: string) => {
    let newColors: string[];

    if (selectedColors.includes(color)) {
      // Deselect
      newColors = selectedColors.filter(c => c !== color);
    } else {
      // Select (if under limit)
      if (selectedColors.length >= maxSelections) {
        // At limit - replace last selection
        newColors = [...selectedColors.slice(0, -1), color];
      } else {
        newColors = [...selectedColors, color];
      }
    }

    setSelectedColors(newColors);
    onChange(newColors);
  };

  const handleAddCustomColor = () => {
    if (!selectedColors.includes(customColor)) {
      let newColors: string[];

      if (selectedColors.length >= maxSelections) {
        // Replace last color
        newColors = [...selectedColors.slice(0, -1), customColor];
      } else {
        newColors = [...selectedColors, customColor];
      }

      setSelectedColors(newColors);
      onChange(newColors);
      setIsDialogOpen(false);
    }
  };

  // Keyboard navigation for color swatches
  const handleKeyDown = (e: React.KeyboardEvent, index: number, color: string) => {
    const cols = 4; // Typically 4-5 color swatches per row

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleToggleColor(color);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index === 0 ? colorOptions.length - 1 : index - 1;
        setFocusedIndex(prevIndex);
        swatchRefs.current[prevIndex]?.focus();
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = index === colorOptions.length - 1 ? 0 : index + 1;
        setFocusedIndex(nextIndex);
        swatchRefs.current[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const upIndex = index - cols;
        const targetUp = upIndex >= 0 ? upIndex : index;
        setFocusedIndex(targetUp);
        swatchRefs.current[targetUp]?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        const downIndex = index + cols;
        const targetDown = downIndex < colorOptions.length ? downIndex : index;
        setFocusedIndex(targetDown);
        swatchRefs.current[targetDown]?.focus();
        break;
    }
  };

  // Separate custom option from color swatches
  const colorOptions = options.filter(opt => opt.color);
  const customOption = options.find(opt => opt.value === 'custom');
  const atLimit = selectedColors.length >= maxSelections;

  // Check if a color is light or dark for contrast
  const isLightColor = (hex: string): boolean => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155;
  };

  return (
    <div className="space-y-6">
      {/* Selection Counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Select up to {maxSelections} color{maxSelections > 1 ? 's' : ''}
        </p>
        <Badge variant={atLimit ? 'default' : 'secondary'}>
          {selectedColors.length} / {maxSelections} selected
        </Badge>
      </div>

      {/* Selected Colors Preview */}
      {selectedColors.length > 0 && (
        <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium text-foreground/80 w-full mb-2">Your Color Palette:</p>
          {selectedColors.map((color) => (
            <motion.div
              key={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="group relative"
            >
              <div
                className="w-16 h-16 rounded-lg shadow-md ring-2 ring-white"
                style={{ backgroundColor: color }}
              >
                {/* Remove button on hover */}
                <button
                  onClick={() => handleToggleColor(color)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-center mt-1 text-muted-foreground font-mono">
                {color.toUpperCase()}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Predefined Color Swatches */}
      <div
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3"
        role="group"
        aria-label="Color palette options"
      >
        {colorOptions.map((option, index) => {
          const isSelected = selectedColors.includes(option.color!);
          const isLight = isLightColor(option.color!);

          return (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div
                ref={(el) => {
                  swatchRefs.current[index] = el;
                }}
                className={`
                  relative cursor-pointer rounded-full transition-all duration-200 outline-none
                  ${isSelected
                    ? 'ring-4 ring-primary ring-offset-2 shadow-lg'
                    : 'hover:ring-2 hover:ring-border hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  }
                `}
                onClick={() => handleToggleColor(option.color!)}
                onKeyDown={(e) => handleKeyDown(e, index, option.color!)}
                tabIndex={0}
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${option.label} (${option.color})`}
                title={option.label}
              >
                {/* Color Swatch */}
                <div
                  className="w-16 h-16 rounded-full"
                  style={{ backgroundColor: option.color }}
                />

                {/* Checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`
                      absolute inset-0 flex items-center justify-center
                      ${isLight ? 'text-gray-800' : 'text-white'}
                    `}
                  >
                    <Check className="w-8 h-8 drop-shadow-md" strokeWidth={3} />
                  </motion.div>
                )}
              </div>

              {/* Color Name */}
              <p className="text-xs text-center mt-1 text-muted-foreground font-medium">
                {option.label}
              </p>
            </motion.div>
          );
        })}

        {/* Custom Color Picker Button */}
        {customOption && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: colorOptions.length * 0.03 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all h-full">
                  <CardContent className="p-0 h-full">
                    <div className="flex flex-col items-center justify-center h-full min-h-[80px] gap-1">
                      <Palette className="w-8 h-8 text-primary" />
                      <p className="text-xs font-medium text-center px-2">
                        {customOption.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Custom Color</DialogTitle>
                <DialogDescription>
                  Pick a custom color using the color picker or enter a hex code.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Color Picker Input */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="color-picker">Color</Label>
                    <Input
                      id="color-picker"
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                  </div>

                  {/* Color Preview */}
                  <div>
                    <Label>Preview</Label>
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-border"
                      style={{ backgroundColor: customColor }}
                    />
                  </div>
                </div>

                {/* Hex Input */}
                <div>
                  <Label htmlFor="hex-input">Hex Code</Label>
                  <Input
                    id="hex-input"
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>

                {/* Add Button */}
                <Button
                  onClick={handleAddCustomColor}
                  className="w-full"
                  disabled={selectedColors.includes(customColor)}
                >
                  {selectedColors.includes(customColor) ? 'Already Selected' : 'Add Color'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Helper Text */}
      {atLimit && (
        <p className="text-sm text-amber-600 text-center">
          Maximum colors reached. Remove a color to add a different one.
        </p>
      )}
    </div>
  );
}
