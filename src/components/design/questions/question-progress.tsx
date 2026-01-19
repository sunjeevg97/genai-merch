/**
 * Question Progress Component
 *
 * Displays progress through the interactive question flow with:
 * - Animated progress bar showing percentage complete
 * - Step indicator dots (filled for completed, outline for upcoming)
 * - Current step highlighting
 * - Sticky positioning at top of viewport
 */

'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface QuestionProgressProps {
  /** Current question index (0-based) */
  currentIndex: number;

  /** Total number of questions */
  totalQuestions: number;

  /** Whether to show step numbers (default: true) */
  showStepNumbers?: boolean;
}

export function QuestionProgress({
  currentIndex,
  totalQuestions,
  showStepNumbers = true,
}: QuestionProgressProps) {
  // Calculate progress percentage
  const progress = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container max-w-3xl mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-4">
          <motion.div
            className="absolute inset-y-0 left-0 bg-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Step Indicators */}
        {showStepNumbers && (
          <div className="flex items-center justify-between">
            {Array.from({ length: totalQuestions }).map((_, index) => {
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isUpcoming = index > currentIndex;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1"
                >
                  {/* Step Dot */}
                  <motion.div
                    className={`
                      relative flex items-center justify-center
                      w-8 h-8 rounded-full
                      transition-colors duration-200
                      ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                      ${isCurrent ? 'bg-primary/20 ring-2 ring-primary text-primary' : ''}
                      ${isUpcoming ? 'bg-muted text-muted-foreground border-2 border-border' : ''}
                    `}
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </motion.div>

                  {/* Step Label (on larger screens) */}
                  <span
                    className={`
                      hidden sm:block text-xs font-medium
                      ${isCurrent ? 'text-primary' : 'text-muted-foreground'}
                    `}
                  >
                    Step {index + 1}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Text */}
        <div className="flex items-center justify-between mt-3 text-sm">
          <span className="text-muted-foreground">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="font-medium text-primary">
            {Math.round(progress)}% Complete
          </span>
        </div>
      </div>
    </div>
  );
}
