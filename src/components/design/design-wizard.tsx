/**
 * Design Wizard Container
 *
 * Main wizard component that orchestrates the streamlined 5-step design flow:
 * 1. Event Type Selection
 * 2. Event Details
 * 3. AI Chat Interface (with optional brand assets)
 * 4. Product Selection
 * 5. Checkout
 *
 * Handles step navigation, progress indication, and transitions.
 * Supports direct navigation via query parameter (?step=X).
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useDesignWizard, WizardStep } from '@/lib/store/design-wizard';
import { EventTypeStep } from '@/components/design/steps/event-type-step';
import { EventDetailsStep } from '@/components/design/steps/event-details-step';
import { ChatStep } from '@/components/design/steps/chat-step-new';
import { ProductShowcaseStep } from '@/components/design/steps/product-showcase-step';
import { CheckoutStep } from '@/components/design/steps/checkout-step';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
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

/**
 * Step Configuration
 */
interface StepConfig {
  step: WizardStep;
  label: string;
  shortLabel: string;
}

const STEPS: StepConfig[] = [
  { step: WizardStep.EventType, label: 'Event Type', shortLabel: 'Event' },
  { step: WizardStep.EventDetails, label: 'Event Details', shortLabel: 'Details' },
  { step: WizardStep.AiChat, label: 'AI Design', shortLabel: 'Design' },
  { step: WizardStep.Products, label: 'Choose Products', shortLabel: 'Products' },
  { step: WizardStep.Checkout, label: 'Checkout', shortLabel: 'Checkout' },
];

/**
 * Design Wizard Component
 *
 * @example
 * ```tsx
 * <DesignWizard />
 * ```
 */
export function DesignWizard() {
  const { currentStep, previousStep, nextStep, resetWizard, goToStep } = useDesignWizard();
  const searchParams = useSearchParams();
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);

  /**
   * Handle direct navigation via query parameter
   * Allows navigating to specific steps via ?step=X
   */
  useEffect(() => {
    console.log('[Design Wizard] useEffect triggered, searchParams:', searchParams.toString());
    const stepParam = searchParams.get('step');
    console.log('[Design Wizard] Step parameter from URL:', stepParam);

    if (stepParam) {
      const stepNumber = parseInt(stepParam, 10);
      console.log('[Design Wizard] Parsed step number:', stepNumber);

      // Validate step number is between 1 and 5
      if (stepNumber >= 1 && stepNumber <= 5) {
        console.log('[Design Wizard] Navigating to step:', stepNumber);
        goToStep(stepNumber as WizardStep);
        console.log('[Design Wizard] goToStep called successfully');
      } else {
        console.log('[Design Wizard] Invalid step number (must be 1-5):', stepNumber);
      }
    } else {
      console.log('[Design Wizard] No step parameter in URL, staying on current step:', currentStep);
    }
  }, [searchParams, goToStep]);

  /**
   * Render current step component
   */
  const renderStep = () => {
    switch (currentStep) {
      case WizardStep.EventType:
        return <EventTypeStep />;
      case WizardStep.EventDetails:
        return <EventDetailsStep />;
      case WizardStep.AiChat:
        return <ChatStep />;
      case WizardStep.Products:
        return <ProductShowcaseStep />;
      case WizardStep.Checkout:
        return <CheckoutStep />;
      default:
        return <EventTypeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content with Transitions */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Screen reader announcement */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Step {currentStep} of {STEPS.length}: {STEPS.find(s => s.step === currentStep)?.label}
        </div>

        {/* Unified Sticky Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3 max-w-7xl">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Back Button */}
              <div className="shrink-0">
                {currentStep > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      previousStep();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                )}
              </div>

              {/* Center: Visual Progress Dots */}
              <div className="flex-1 flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center gap-2">
                    <button
                      onClick={() => step < currentStep && goToStep(step as WizardStep)}
                      disabled={step > currentStep}
                      className={`
                        relative flex items-center justify-center
                        w-8 h-8 rounded-full text-xs font-medium
                        transition-all duration-200
                        ${step < currentStep
                          ? 'bg-primary text-primary-foreground cursor-pointer hover:scale-110'
                          : step === currentStep
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }
                      `}
                    >
                      {step < currentStep ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span>{step}</span>
                      )}
                    </button>
                    {step < 5 && (
                      <div className={`
                        hidden sm:block w-8 h-0.5
                        ${step < currentStep ? 'bg-primary' : 'bg-muted'}
                      `} />
                    )}
                  </div>
                ))}
              </div>

              {/* Right: Restart Icon Button */}
              <div className="shrink-0">
                {currentStep < 5 && (
                  <Dialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                        <RotateCcw className="h-4 w-4" />
                        <span className="sr-only">Restart</span>
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
                          onClick={() => {
                            resetWizard();
                            setIsRestartDialogOpen(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Restart
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area with Spacing */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
