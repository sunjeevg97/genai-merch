/**
 * Design Wizard Container
 *
 * Main wizard component that orchestrates the 5-step design flow.
 * Handles step navigation, progress indication, and transitions.
 */

'use client';

import { useDesignWizard, WizardStep } from '@/lib/store/design-wizard';
import { EventTypeStep } from '@/components/design/steps/event-type-step';
import { ProductStep } from '@/components/design/steps/product-step';
import { BrandAssetsStep } from '@/components/design/steps/brand-assets-step';
import { ChatStep } from '@/components/design/steps/chat-step';
import { CanvasStep } from '@/components/design/steps/canvas-step';
import { Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  { step: WizardStep.Products, label: 'Products', shortLabel: 'Products' },
  { step: WizardStep.BrandAssets, label: 'Brand Assets', shortLabel: 'Assets' },
  { step: WizardStep.AiChat, label: 'AI Design', shortLabel: 'Chat' },
  { step: WizardStep.Canvas, label: 'Canvas', shortLabel: 'Canvas' },
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
  const { currentStep } = useDesignWizard();

  /**
   * Render current step component
   */
  const renderStep = () => {
    switch (currentStep) {
      case WizardStep.EventType:
        return <EventTypeStep />;
      case WizardStep.Products:
        return <ProductStep />;
      case WizardStep.BrandAssets:
        return <BrandAssetsStep />;
      case WizardStep.AiChat:
        return <ChatStep />;
      case WizardStep.Canvas:
        return <CanvasStep />;
      default:
        return <EventTypeStep />;
    }
  };

  /**
   * Get step status
   */
  const getStepStatus = (step: WizardStep): 'completed' | 'current' | 'upcoming' => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress Indicator */}
      <div className="border-b bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="space-y-3">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold">Design Wizard</h1>
              <p className="text-sm text-muted-foreground">
                Create custom designs with AI assistance
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="space-y-3">
              {/* Step Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {STEPS.map((stepConfig, index) => {
                    const status = getStepStatus(stepConfig.step);
                    const isCompleted = status === 'completed';
                    const isCurrent = status === 'current';

                    return (
                      <div
                        key={stepConfig.step}
                        className="flex items-center gap-2"
                      >
                        {/* Step Badge */}
                        <div
                          className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-full
                            transition-all duration-200
                            ${
                              isCompleted
                                ? 'bg-primary text-primary-foreground'
                                : isCurrent
                                ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                : 'bg-muted text-muted-foreground'
                            }
                          `}
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Circle
                                className={`h-4 w-4 ${isCurrent ? 'fill-current' : ''}`}
                              />
                            )}
                          </div>

                          {/* Label */}
                          <span className="text-xs font-medium whitespace-nowrap">
                            <span className="hidden sm:inline">
                              {stepConfig.label}
                            </span>
                            <span className="sm:hidden">
                              {stepConfig.shortLabel}
                            </span>
                          </span>
                        </div>

                        {/* Connector Line */}
                        {index < STEPS.length - 1 && (
                          <div
                            className={`
                              hidden md:block w-8 h-0.5 transition-colors duration-200
                              ${
                                isCompleted
                                  ? 'bg-primary'
                                  : 'bg-border'
                              }
                            `}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Step Counter */}
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  Step {currentStep} of {STEPS.length}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Transitions */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
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
  );
}
