/**
 * Design Generation Step (Step 2 of wizard)
 *
 * Streamlined state machine:
 * 1. Style preset selection (gate before generation)
 * 2. Variety mode toggle (same-preset vs mix-presets) + generate confirmation
 * 3. Batch design generation (4 designs)
 * 4. Design results gallery
 * 5. Optional feedback and iteration
 *
 * Both AI follow-up questions and the fixed-question questionnaire were
 * removed and their files deleted: preset choice + event details from
 * Step 1 supply enough design signal on their own.
 */

'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { DesignResults } from '@/components/design/design-results';
import { DesignFeedbackComponent } from '@/components/design/design-feedback';
import { GeneratingDesignsLoader } from '@/components/design/loading/generating-designs-loader';
import { ErrorAlert } from '@/components/design/error-alert';
import { WizardCompletionStep } from '@/components/design/steps/wizard-completion-step';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getPreset } from '@/lib/ai/style-presets';

/**
 * Flow States
 *
 * State machine for the question flow progression.
 */
type FlowState =
  | 'variety-selection' // Choosing variety mode + final generate (preset picked upstream in BriefComposerStep)
  | 'generating' // Generating 4 designs
  | 'results' // Showing 4 designs
  | 'feedback' // Collecting feedback
  | 'regenerating' // Regenerating with feedback
  | 'completion'; // Wizard complete, show CTAs

/**
 * Generated Design Interface
 *
 * Phase 3: presetId + seed live in metadata as emitted by the batch route.
 * variantMode is the canonical variety field; varietyLevel kept as legacy.
 */
interface GeneratedDesign {
  id: string;
  imageUrl: string;
  prompt: string;
  revisedPrompt?: string;
  metadata?: {
    index: number;
    varietyMode?: 'same-preset' | 'mix-presets';
    varietyLevel?: 'variations' | 'different-concepts';
    eventType: string;
    presetId?: string;
    seed?: string;
    generatedAt: string;
  };
}

export function ChatStep() {
  const {
    eventType,
    eventDetails,
    brandAssets,
    designVarietyLevel,
    designFeedback,
    selectedPresetId,
    varietyMode,
    setDesignVarietyLevel,
    setDesignFeedback,
    setVarietyMode,
    addGeneratedDesign,
    selectDesign,
    setFinalDesign,
    setSavedDesignId,
    setPrintReadyUrl,
    setPreparationStatus,
    setPreparationError,
    previousStep,
  } = useDesignWizard();

  // Preset is now chosen upstream in BriefComposerStep, so we land directly
  // on the variety/generate confirmation. "Change style" routes back to step 1.
  const [flowState, setFlowState] = useState<FlowState>('variety-selection');
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  // Error state management
  const [generationError, setGenerationError] = useState<{
    message: string;
    errorType: string;
    canRetry: boolean;
    errors?: Array<{ index: number; errorType: string; message: string }>;
  } | null>(null);
  const [partialSuccess, setPartialSuccess] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  /**
   * Handle variety level selection and start generation
   */
  const handleVarietySelected = async (level: 'variations' | 'different-concepts') => {
    setDesignVarietyLevel(level);
    setFlowState('generating');
    setGenerationError(null);
    setPartialSuccess(false);

    try {
      const response = await fetch('/api/generate-designs-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: [], // Questionnaire removed; subject comes from event details + preset
          eventType,
          eventDetails,
          brandAssets,
          varietyMode,
          // Keep varietyLevel for the legacy server-side mapping path:
          varietyLevel: level,
          count: 4,
          presetId: selectedPresetId ?? undefined,
        }),
      });

      const data = await response.json();

      // CASE 1: Full success (200)
      if (response.status === 200 && data.success === true) {
        setGeneratedDesigns(data.designs);
        setFlowState('results');
        setRetryAttempts(0);
        toast.success(`${data.designs.length} designs generated!`);
        return;
      }

      // CASE 2: Partial success (207)
      if (response.status === 207 && data.success === 'partial') {
        setGeneratedDesigns(data.designs);
        setPartialSuccess(true);
        setFlowState('results');
        toast.warning(`Generated ${data.designs.length} of 4 designs`, {
          description: 'Click "Retry Failed" to generate missing designs',
        });
        setGenerationError({
          message: `Generated ${data.designs.length} of 4. Click retry for remaining.`,
          errorType: 'PARTIAL_SUCCESS',
          canRetry: true,
          errors: data.errors,
        });
        return;
      }

      // CASE 3: Total failure (500)
      if (response.status === 500) {
        setGenerationError({
          message: data.message || 'Failed to generate designs',
          errorType: data.errorType || 'UNKNOWN_ERROR',
          canRetry: data.canRetry !== false,
          errors: data.errors,
        });
        setFlowState('variety-selection');
        toast.error('Design generation failed', {
          description: data.message,
          duration: 8000,
        });
        return;
      }

      throw new Error(`Unexpected response: ${response.status}`);
    } catch (error) {
      setGenerationError({
        message: error instanceof Error ? error.message : 'Unexpected error',
        errorType: 'NETWORK_ERROR',
        canRetry: true,
      });
      setFlowState('variety-selection');
      toast.error('Failed to generate designs');
    }
  };

  /**
   * Handle retry for failed generations
   */
  const handleRetry = async () => {
    if (retryAttempts >= 3) {
      toast.error('Maximum retry attempts reached');
      return;
    }
    setRetryAttempts((prev) => prev + 1);
    if (designVarietyLevel) {
      await handleVarietySelected(designVarietyLevel);
    }
  };

  /**
   * Save design to database and trigger background preparation.
   *
   * Phase 3: also persists the unselected sibling variants as separate
   * Design rows sharing a variantGroupId. The selected design remains the
   * canonical artifact returned to the client and used by cart/print-prep.
   */
  const saveAndPrepareDesign = async (
    design: GeneratedDesign,
    siblings: GeneratedDesign[]
  ) => {
    setPreparationStatus('saving');

    // Convert 1-based metadata.index emitted by the batch route to the
    // 0-based variantIndex stored on Design rows.
    const indexToVariantIndex = (idx?: number) =>
      idx !== undefined ? idx - 1 : undefined;

    try {
      const saveResponse = await fetch('/api/designs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `AI Design - ${new Date().toLocaleDateString()}`,
          imageUrl: design.imageUrl,
          aiPrompt: design.prompt,
          metadata: {
            generatedAt: new Date().toISOString(),
            eventType,
            eventDetails,
            brandAssets,
            varietyMode,
            varietyLevel: designVarietyLevel,
          },
          presetId: design.metadata?.presetId,
          seed: design.metadata?.seed,
          variantIndex: indexToVariantIndex(design.metadata?.index),
          siblings: siblings.map((s) => ({
            imageUrl: s.imageUrl,
            presetId: s.metadata?.presetId,
            seed: s.metadata?.seed,
            variantIndex: indexToVariantIndex(s.metadata?.index),
            metadata: {
              generatedAt: s.metadata?.generatedAt,
              eventType: s.metadata?.eventType,
              varietyMode: s.metadata?.varietyMode,
            },
          })),
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to save design';
        console.error('[Chat Step] Save API error:', errorData);
        throw new Error(errorMessage);
      }

      const { data: savedDesign } = await saveResponse.json();
      setSavedDesignId(savedDesign.id);

      // Update finalDesignUrl with HTTP URL from database
      // (API converts data URLs to HTTP URLs via Supabase Storage)
      if (savedDesign.imageUrl && savedDesign.imageUrl.startsWith('http')) {
        setFinalDesign(savedDesign.imageUrl);
        console.log('[Chat Step] Updated finalDesignUrl to HTTP URL:', savedDesign.imageUrl.substring(0, 80) + '...');
      }

      console.log('[Chat Step] Design saved:', savedDesign.id);
    } catch (error) {
      console.error('[Chat Step] Save failed:', error);
      setPreparationStatus('failed');
      setPreparationError(error instanceof Error ? error.message : 'Save failed');
      toast.error('Failed to save design. Please try again.');
      throw error; // Block progression
    }

    // Phase 2: Prepare for print (NON-BLOCKING - nice-to-have)
    setPreparationStatus('preparing');
    toast.info('Preparing design for print...', {
      duration: 5000,
      description: 'This may take up to 20 seconds',
    });

    // Don't await - let it run in background
    prepareDesignInBackground();
  };

  /**
   * Prepare design for print in background (non-blocking)
   */
  const prepareDesignInBackground = async () => {
    // Get the saved design ID from the store
    const state = useDesignWizard.getState();
    const { savedDesignId } = state;

    if (!savedDesignId) {
      console.error('[Chat Step] No saved design ID for preparation');
      return;
    }

    try {
      const prepareResponse = await fetch('/api/design/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designId: savedDesignId }),
      });

      if (!prepareResponse.ok) {
        const errorData = await prepareResponse.json();
        throw new Error(errorData.message || 'Preparation failed');
      }

      const { printReadyUrl, metadata } = await prepareResponse.json();

      setPrintReadyUrl(printReadyUrl);
      setPreparationStatus('completed');

      console.log('[Chat Step] Design prepared:', {
        designId: savedDesignId,
        printReadyUrl,
        metadata,
      });

      toast.success('Design ready for print!', {
        description: 'Optimized for professional printing',
      });
    } catch (error) {
      console.error('[Chat Step] Preparation failed:', error);

      setPreparationStatus('failed');
      setPreparationError(error instanceof Error ? error.message : 'Preparation failed');

      // Non-critical error - user can still checkout
      toast.error('Preparation failed', {
        description: "Don't worry - you can retry before checkout",
        duration: 8000,
      });
    }
  };

  /**
   * Handle design selection
   */
  const handleDesignSelect = (designId: string) => {
    setSelectedDesignId(designId);
  };

  /**
   * Handle "Continue" from results
   */
  const handleContinueFromResults = async () => {
    if (!selectedDesignId) {
      toast.error("Please select a design first");
      return;
    }

    const selectedDesign = generatedDesigns.find((d) => d.id === selectedDesignId);
    if (!selectedDesign) {
      toast.error("Selected design not found");
      return;
    }

    // Siblings: the other 3 (or fewer, after partial-success cases) variants.
    // They get persisted alongside the selected design for analytics — the
    // selected one remains the canonical artifact returned to cart/print-prep.
    const siblings = generatedDesigns.filter((d) => d.id !== selectedDesignId);

    // Save to wizard store (existing logic)
    addGeneratedDesign({
      id: selectedDesign.id,
      imageUrl: selectedDesign.imageUrl,
      prompt: selectedDesign.prompt,
      createdAt: new Date(),
      isFavorite: true,
    });

    selectDesign(selectedDesign.id);
    setFinalDesign(selectedDesign.imageUrl);

    // Save selected design + siblings; prepare-for-print runs in background.
    try {
      await saveAndPrepareDesign(selectedDesign, siblings);
    } catch (error) {
      // Error already handled in saveAndPrepareDesign
      // Block progression if save failed
      return;
    }

    // Show completion screen with CTAs
    setFlowState('completion');
  };

  /**
   * Handle "Regenerate All" from results
   */
  const handleRegenerateAll = () => {
    if (!designVarietyLevel) return;
    handleVarietySelected(designVarietyLevel);
  };

  /**
   * Handle feedback submission
   */
  const handleFeedbackSubmit = async (feedback: NonNullable<typeof designFeedback>) => {
    setDesignFeedback(feedback);
    setFlowState('regenerating');

    // TODO: Build iteration prompt with feedback
    // For now, just regenerate with same variety level
    try {
      const response = await fetch('/api/generate-designs-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: [], // Questionnaire removed; subject comes from event details + preset
          eventType,
          eventDetails,
          brandAssets,
          varietyMode,
          varietyLevel: designVarietyLevel,
          count: 4,
          feedback, // Include feedback in request
          presetId: selectedPresetId ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate designs');
      }

      const data = await response.json();
      const designs = data.designs || [];

      setGeneratedDesigns(designs);
      setFlowState('results');
      toast.success('Designs regenerated with your feedback!');
    } catch (error) {
      console.error('[Chat Step] Error regenerating designs:', error);
      toast.error('Failed to regenerate designs');
      setFlowState('feedback');
    }
  };

  /**
   * Handle "Continue" from feedback (skip iteration)
   */
  const handleSkipFeedback = () => {
    setFlowState('results');
  };

  // Render appropriate UI based on flow state
  return (
    <AnimatePresence mode="wait">
      {flowState === 'variety-selection' && (
        <motion.div
          key="variety-selection"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-2xl mx-auto"
        >
          {generationError && (
            <div className="mb-6">
              <ErrorAlert
                title={
                  generationError.errorType === 'CONFIGURATION_ERROR'
                    ? 'Service Configuration Error'
                    : generationError.errorType === 'RATE_LIMIT'
                    ? 'Rate Limit Exceeded'
                    : generationError.errorType === 'CONTENT_POLICY'
                    ? 'Content Policy Violation'
                    : 'Design Generation Failed'
                }
                message={generationError.message}
                errorType={generationError.errorType}
                canRetry={generationError.canRetry}
                onRetry={generationError.canRetry ? handleRetry : undefined}
                technicalDetails={
                  generationError.errors
                    ? JSON.stringify(generationError.errors, null, 2)
                    : undefined
                }
              />
            </div>
          )}

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Ready to Generate
              </CardTitle>
              <CardDescription>
                We&apos;ll create 4 designs based on your preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Locked-in style chip + "Change" affordance.
                  Preset selection happens earlier in the flow, but users may
                  realize at the last moment they want a different lineage. */}
              {selectedPresetId && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50">
                  <div className="space-y-0.5">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Style
                    </p>
                    <p className="text-sm font-medium">
                      {getPreset(selectedPresetId).name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => previousStep()}
                  >
                    Change
                  </Button>
                </div>
              )}

              {/* Variety Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  {/*
                    TODO(human): the label + helper copy below is the user-facing
                    explanation of "Same preset vs Mix presets" and matters for
                    whether non-technical users understand the toggle. Rewrite
                    the two label strings and both helper-text variants in
                    whatever phrasing you'd actually ship.
                  */}
                  <Label htmlFor="variety-mode-toggle" className="text-sm font-medium">
                    Mix in other styles
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {varietyMode === 'mix-presets'
                      ? 'Each design will use a different style preset (1 each from 4 styles).'
                      : 'All designs will use your selected preset (4 variations of the same style).'}
                  </p>
                </div>
                <Switch
                  id="variety-mode-toggle"
                  checked={varietyMode === 'mix-presets'}
                  onCheckedChange={(checked) =>
                    setVarietyMode(checked ? 'mix-presets' : 'same-preset')
                  }
                />
              </div>

              {/* Generate Button — back-navigation to preset lives on the
                  Style chip's "Change" affordance, so there's no separate
                  Back button here. */}
              <Button
                onClick={() =>
                  handleVarietySelected(
                    varietyMode === 'mix-presets' ? 'different-concepts' : 'variations'
                  )
                }
                disabled={!selectedPresetId}
                className="w-full"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Designs
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {flowState === 'generating' && <GeneratingDesignsLoader count={4} estimatedTime={20} />}

      {flowState === 'results' && (
        <>
          {partialSuccess && generationError && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Partial Success</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Generated {generatedDesigns.length} of 4 designs.</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Failed
                </Button>
              </AlertDescription>
            </Alert>
          )}
          <DesignResults
            designs={generatedDesigns}
            onSelect={handleDesignSelect}
            onRegenerateAll={handleRegenerateAll}
            onContinue={handleContinueFromResults}
            selectedDesignId={selectedDesignId}
            loading={false}
          />
        </>
      )}

      {flowState === 'feedback' && (
        <DesignFeedbackComponent
          designs={generatedDesigns}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleSkipFeedback}
          loading={false}
        />
      )}

      {flowState === 'regenerating' && <GeneratingDesignsLoader count={4} estimatedTime={20} />}

      {flowState === 'completion' && <WizardCompletionStep />}
    </AnimatePresence>
  );
}
