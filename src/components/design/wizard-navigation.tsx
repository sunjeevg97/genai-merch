/**
 * Wizard Navigation Component
 *
 * Provides consistent navigation controls across all wizard steps:
 * - Back button (hidden on first step)
 * - Forward/Continue button (customizable label)
 * - Restart button (with confirmation dialog)
 *
 * Features:
 * - Smooth animations on mount
 * - Automatic scroll to top on navigation
 * - Accessible keyboard navigation
 * - Mobile responsive layout
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { motion } from 'framer-motion';

interface WizardNavigationProps {
  /** Custom handler for next button (overrides default) */
  onNext?: () => void;
  /** Custom handler for back button (overrides default) */
  onBack?: () => void;
  /** Label for next button */
  nextLabel?: string;
  /** Disable next button */
  nextDisabled?: boolean;
  /** Hide back button */
  hideBack?: boolean;
  /** Hide next button */
  hideNext?: boolean;
  /** Show restart button */
  showRestart?: boolean;
}

export function WizardNavigation({
  onNext,
  onBack,
  nextLabel = 'Continue',
  nextDisabled = false,
  hideBack = false,
  hideNext = false,
  showRestart = true,
}: WizardNavigationProps) {
  const { currentStep, previousStep, nextStep, resetWizard } = useDesignWizard();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      previousStep();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);

  const handleRestart = () => {
    resetWizard();
    setIsRestartDialogOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isFirstStep = currentStep === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t mt-8"
    >
      {/* Left: Back Button */}
      <div className="w-full sm:w-auto">
        {!hideBack && !isFirstStep && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Center: Restart Button */}
      <div className="order-last sm:order-none">
        {showRestart && (
          <Dialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Start Over</span>
                <span className="sm:hidden">Restart</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Restart Design Wizard?</DialogTitle>
                <DialogDescription>
                  This will clear all your selections and start fresh. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRestartDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRestart}
                >
                  Restart
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Right: Next Button */}
      <div className="w-full sm:w-auto">
        {!hideNext && (
          <Button
            onClick={handleNext}
            disabled={nextDisabled}
            className="gap-2 w-full sm:w-auto"
          >
            {nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}
