/**
 * Design Wizard - Main Page
 *
 * AI-first design wizard with 5 steps:
 * 1. Event Type Selection
 * 2. Product Selection
 * 3. Brand Assets Upload (Optional)
 * 4. AI Chat Interface
 * 5. Canvas Editor (Final Tweaks)
 */

'use client';

import { useDesignWizard, WizardStep } from '@/lib/store/design-wizard';
import { EventTypeStep } from '@/components/design/steps/event-type-step';
import { ProductStep } from '@/components/design/steps/product-step';
import { BrandAssetsStep } from '@/components/design/steps/brand-assets-step';
import { AiChatStep } from '@/components/design/steps/ai-chat-step';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

/**
 * Design Wizard Page Component
 *
 * Orchestrates the 5-step AI-first design wizard flow
 */
export default function CreateDesignPage() {
  const { currentStep } = useDesignWizard();

  /**
   * Get step label for progress indicator
   */
  const getStepLabel = (step: WizardStep): string => {
    switch (step) {
      case WizardStep.EventType:
        return 'Event Type';
      case WizardStep.Products:
        return 'Products';
      case WizardStep.BrandAssets:
        return 'Brand Assets';
      case WizardStep.AiChat:
        return 'AI Design';
      case WizardStep.Canvas:
        return 'Canvas';
      default:
        return 'Step';
    }
  };

  /**
   * Calculate progress percentage
   */
  const progressPercentage = ((currentStep - 1) / 4) * 100;

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
        return <AiChatStep />;
      case WizardStep.Canvas:
        return <div className="text-center text-muted-foreground">Canvas Step (Coming soon)</div>;
      default:
        return <EventTypeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Design Wizard</h1>
              <p className="text-sm text-muted-foreground">
                Create custom designs with AI assistance
              </p>
            </div>

            {/* Progress Indicator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <Badge
                      key={step}
                      variant={currentStep >= step ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {step}. {getStepLabel(step as WizardStep)}
                    </Badge>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Step {currentStep} of 5
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {renderStep()}
      </div>
    </div>
  );
}
