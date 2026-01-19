/**
 * Multi-Select Question Component
 *
 * Multi-select tiles with checkboxes for selecting multiple options.
 * Features:
 * - Grid of selectable tiles with icons
 * - Multiple selections allowed (up to maxSelections)
 * - Checkbox indicators on selected tiles
 * - Hover animations
 * - Selection counter showing current/max selections
 * - Responsive grid layout
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckSquare, Square, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuestionOption } from '@/lib/ai/question-templates';
import * as LucideIcons from 'lucide-react';

interface MultiSelectQuestionProps {
  /** Available options */
  options: QuestionOption[];

  /** Currently selected values */
  value?: string[];

  /** Callback when selections change */
  onChange: (values: string[]) => void;

  /** Maximum number of selections allowed */
  maxSelections?: number;
}

export function MultiSelectQuestion({
  options,
  value = [],
  onChange,
  maxSelections,
}: MultiSelectQuestionProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(value);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-focus first option on mount
  useEffect(() => {
    cardRefs.current[0]?.focus();
  }, []);

  const handleToggle = (optionValue: string) => {
    let newValues: string[];

    if (selectedValues.includes(optionValue)) {
      // Deselect
      newValues = selectedValues.filter(v => v !== optionValue);
    } else {
      // Select (if under limit)
      if (maxSelections && selectedValues.length >= maxSelections) {
        // At limit - replace first selection with new one
        newValues = [...selectedValues.slice(1), optionValue];
      } else {
        newValues = [...selectedValues, optionValue];
      }
    }

    setSelectedValues(newValues);
    onChange(newValues);
  };

  // Get icon component from Lucide
  const getIcon = (iconName?: string): LucideIcon | null => {
    if (!iconName) return null;
    return (LucideIcons as any)[iconName] || null;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const cols = 2; // md:grid-cols-2 (mobile: 1 col, tablet/desktop: 2 cols)

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleToggle(options[index].value);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const prevIndex = index === 0 ? options.length - 1 : index - 1;
        setFocusedIndex(prevIndex);
        cardRefs.current[prevIndex]?.focus();
        break;
      case 'ArrowRight':
        e.preventDefault();
        const nextIndex = index === options.length - 1 ? 0 : index + 1;
        setFocusedIndex(nextIndex);
        cardRefs.current[nextIndex]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const upIndex = index - cols;
        const targetUp = upIndex >= 0 ? upIndex : index;
        setFocusedIndex(targetUp);
        cardRefs.current[targetUp]?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        const downIndex = index + cols;
        const targetDown = downIndex < options.length ? downIndex : index;
        setFocusedIndex(targetDown);
        cardRefs.current[targetDown]?.focus();
        break;
    }
  };

  const atLimit = maxSelections && selectedValues.length >= maxSelections;

  return (
    <div className="space-y-4">
      {/* Selection Counter */}
      {maxSelections && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Select up to {maxSelections} option{maxSelections > 1 ? 's' : ''}
          </p>
          <Badge variant={atLimit ? 'default' : 'secondary'}>
            {selectedValues.length} / {maxSelections} selected
          </Badge>
        </div>
      )}

      {/* Options Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        role="group"
        aria-label="Multi-select question options"
      >
        {options.map((option, index) => {
          const isSelected = selectedValues.includes(option.value);
          const Icon = getIcon(option.icon);
          const isDisabled = !isSelected && atLimit;

          return (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={!isDisabled ? { scale: 1.03 } : undefined}
              whileTap={!isDisabled ? { scale: 0.97 } : undefined}
            >
              <Card
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className={`
                  relative cursor-pointer transition-all duration-200 h-full outline-none
                  ${isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md'
                    : isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-primary hover:shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                  }
                `}
                onClick={() => !isDisabled && handleToggle(option.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                tabIndex={isDisabled ? -1 : 0}
                role="checkbox"
                aria-checked={isSelected}
                {...(isDisabled && { 'aria-disabled': true })}
                aria-label={`${option.label}: ${option.description || ''}`}
              >
                {/* Checkbox Indicator */}
                <div className="absolute top-3 right-3">
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <CheckSquare className="w-5 h-5 text-primary" />
                    </motion.div>
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <CardHeader className="text-center pb-2">
                  {/* Icon */}
                  {Icon && (
                    <div className="flex justify-center mb-2">
                      <div
                        className={`
                          w-12 h-12 rounded-full flex items-center justify-center
                          transition-colors duration-200
                          ${isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                          }
                        `}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  )}

                  {/* Label */}
                  <CardTitle className="text-base">
                    {option.label}
                  </CardTitle>
                </CardHeader>

                <CardContent className="text-center pt-0 pb-4">
                  {/* Description */}
                  {option.description && (
                    <CardDescription className="text-xs leading-relaxed">
                      {option.description}
                    </CardDescription>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Helper Text */}
      {atLimit && (
        <p className="text-sm text-amber-600 text-center">
          Maximum selections reached. Deselect an option to choose a different one.
        </p>
      )}
    </div>
  );
}
