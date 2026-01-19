/**
 * Yes/No Question Component
 *
 * Binary choice question with two large clickable cards.
 * Features:
 * - Two equal-width cards side-by-side
 * - Bold typography for clear choices
 * - Primary color fill when selected
 * - Instant selection (auto-advances on click)
 * - Lucide icons for visual clarity
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, X, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { QuestionOption } from '@/lib/ai/question-templates';
import * as LucideIcons from 'lucide-react';

interface YesNoQuestionProps {
  /** Available options (should be exactly 2) */
  options: QuestionOption[];

  /** Current selected value */
  value?: string;

  /** Callback when option is selected */
  onChange: (value: string) => void;

  /** Whether to auto-submit on selection */
  autoSubmit?: boolean;
}

export function YesNoQuestion({
  options,
  value,
  onChange,
  autoSubmit = false,
}: YesNoQuestionProps) {
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-focus first option on mount
  useEffect(() => {
    cardRefs.current[0]?.focus();
  }, []);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange(optionValue);

    // Auto-submit after short delay if enabled
    if (autoSubmit) {
      setTimeout(() => {
        // Parent will handle submission
      }, 300);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect(options[index].value);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = index === 0 ? options.length - 1 : index - 1;
        setFocusedIndex(prevIndex);
        cardRefs.current[prevIndex]?.focus();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = index === options.length - 1 ? 0 : index + 1;
        setFocusedIndex(nextIndex);
        cardRefs.current[nextIndex]?.focus();
        break;
    }
  };

  // Get icon component from Lucide
  const getIcon = (iconName?: string): LucideIcon | null => {
    if (!iconName) return null;
    return (LucideIcons as any)[iconName] || null;
  };

  // Ensure we have exactly 2 options
  if (options.length !== 2) {
    console.warn('YesNoQuestion requires exactly 2 options');
    return null;
  }

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
      role="radiogroup"
      aria-label="Yes or No question options"
    >
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        const Icon = getIcon(option.icon);
        const isYes = option.value.toLowerCase() === 'yes';

        return (
          <motion.div
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`
                cursor-pointer transition-all duration-200 outline-none
                ${isSelected
                  ? 'ring-2 ring-primary bg-primary text-primary-foreground shadow-lg'
                  : 'hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                }
              `}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={0}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.label}: ${option.description || ''}`}
            >
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  {Icon && (
                    <div
                      className={`
                        w-16 h-16 rounded-full flex items-center justify-center
                        ${isSelected
                          ? 'bg-primary-foreground/20'
                          : isYes
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive'
                        }
                      `}
                    >
                      <Icon className="w-8 h-8" />
                    </div>
                  )}

                  {/* Label */}
                  <h3 className="text-2xl font-bold">
                    {option.label}
                  </h3>

                  {/* Description */}
                  {option.description && (
                    <p
                      className={`
                        text-sm
                        ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}
                      `}
                    >
                      {option.description}
                    </p>
                  )}

                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-8 h-8 rounded-full bg-primary-foreground flex items-center justify-center"
                    >
                      <Check className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
