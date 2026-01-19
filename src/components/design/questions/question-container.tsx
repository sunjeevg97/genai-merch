/**
 * Question Container Component
 *
 * Orchestrates the interactive question flow with:
 * - Full-screen centered layout optimized for focus
 * - Framer Motion slide transitions between questions
 * - Progress indicator at top
 * - Question-specific content in center
 * - Navigation buttons at bottom
 * - Auto-focus for keyboard accessibility
 */

'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuestionProgress } from './question-progress';
import type { DesignQuestion } from '@/lib/ai/question-templates';

interface QuestionContainerProps {
  /** Current question to display */
  question: DesignQuestion;

  /** Current question index (0-based) */
  currentIndex: number;

  /** Total number of questions in flow */
  totalQuestions: number;

  /** Callback when user answers the question */
  onAnswer: (answer: string | string[]) => void;

  /** Callback to go back to previous question */
  onBack?: () => void;

  /** Current answer (for pre-filling) */
  currentAnswer?: string | string[];

  /** Whether answer is required to continue */
  disableContinue?: boolean;

  /** Question-specific component to render */
  children?: React.ReactNode;
}

export function QuestionContainer({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
  onBack,
  currentAnswer,
  disableContinue = true,
  children,
}: QuestionContainerProps) {
  // Auto-focus container on mount for accessibility
  useEffect(() => {
    const container = document.getElementById('question-container');
    if (container) {
      container.focus();
    }
  }, [question.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key = go back
      if (e.key === 'Escape' && onBack) {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);

  // Determine question type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'color':
        return 'bg-accent/10 text-accent';
      case 'style':
        return 'bg-primary/10 text-primary';
      case 'multi-select':
        return 'bg-success/10 text-success';
      case 'yes-no':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div
      id="question-container"
      className="min-h-screen bg-gradient-to-b from-background to-muted/50"
      tabIndex={-1}
    >
      {/* Progress Bar at Top */}
      <QuestionProgress
        currentIndex={currentIndex}
        totalQuestions={totalQuestions}
      />

      {/* Question Content */}
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* Question Header */}
            <div className="space-y-3">
              {/* Question Number Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  Question {currentIndex + 1}
                </Badge>
                <Badge className={getTypeBadgeColor(question.type)}>
                  {question.type.replace('-', ' ')}
                </Badge>
                {question.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>

              {/* Question Title */}
              <h2 className="text-3xl font-bold tracking-tight leading-tight">
                {question.question}
              </h2>
            </div>

            {/* Question Content Card */}
            <Card className="border-2">
              <CardHeader className="pb-4">
                <CardDescription>
                  {question.type === 'multi-select' && question.maxSelections && (
                    <span className="text-sm text-muted-foreground">
                      Select up to {question.maxSelections} option{question.maxSelections > 1 ? 's' : ''}
                    </span>
                  )}
                  {question.type === 'color' && question.maxSelections && (
                    <span className="text-sm text-muted-foreground">
                      Choose up to {question.maxSelections} color{question.maxSelections > 1 ? 's' : ''}
                    </span>
                  )}
                  {question.type === 'yes-no' && (
                    <span className="text-sm text-muted-foreground">
                      Select one option to continue
                    </span>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Render question-specific component passed as children */}
                {children || (
                  <div className="min-h-[200px] flex items-center justify-center">
                    <p className="text-muted-foreground">
                      Question component for type: {question.type}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6">
              {/* Back Button */}
              {onBack ? (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onBack}
                  className="group"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {/* Continue Button */}
              <Button
                size="lg"
                onClick={() => currentAnswer && onAnswer(currentAnswer)}
                disabled={disableContinue || !currentAnswer}
                className="group min-w-[140px]"
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            {/* Helper Text */}
            {question.required && (
              <p className="text-center text-sm text-muted-foreground">
                * This question is required to continue
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
