/**
 * Style Question Component
 *
 * Single-select style tiles with icons and descriptions.
 * Features:
 * - Grid of visual tiles with Lucide icons
 * - Single selection mode (radio button behavior)
 * - Hover scale animations (1.05)
 * - Checkmark overlay when selected
 * - 2-column mobile, 3-column desktop
 * - Large clickable cards for easy interaction
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { QuestionOption } from '@/lib/ai/question-templates';
import * as LucideIcons from 'lucide-react';

interface StyleQuestionProps {
  /** Available style options */
  options: QuestionOption[];

  /** Current selected value */
  value?: string;

  /** Callback when option is selected */
  onChange: (value: string) => void;
}

export function StyleQuestion({
  options,
  value,
  onChange,
}: StyleQuestionProps) {
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
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const cols = 3; // lg:grid-cols-3
    const rows = Math.ceil(options.length / cols);

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect(options[index].value);
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

  // Get icon component from Lucide
  const getIcon = (iconName?: string): LucideIcon | null => {
    if (!iconName) return null;
    return (LucideIcons as any)[iconName] || null;
  };

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      role="radiogroup"
      aria-label="Style options"
    >
      {options.map((option, index) => {
        const isSelected = selectedValue === option.value;
        const Icon = getIcon(option.icon);

        return (
          <motion.div
            key={option.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`
                relative cursor-pointer transition-all duration-200 h-full outline-none
                ${isSelected
                  ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-lg'
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
              {/* Selection Checkmark Badge */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10"
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}

              <CardHeader className="text-center pb-3">
                {/* Icon */}
                {Icon && (
                  <div className="flex justify-center mb-2">
                    <div
                      className={`
                        w-14 h-14 rounded-full flex items-center justify-center
                        transition-colors duration-200
                        ${isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>
                )}

                {/* Label */}
                <CardTitle className="text-lg">
                  {option.label}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center pt-0">
                {/* Description */}
                {option.description && (
                  <CardDescription className="text-sm leading-relaxed">
                    {option.description}
                  </CardDescription>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
