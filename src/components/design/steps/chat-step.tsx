/**
 * Chat Step Component
 *
 * Fourth step in the AI-first design wizard.
 * Combines the AI chat interface with a generated designs gallery.
 * Split-screen layout (50/50 desktop, stacked mobile).
 */

'use client';

import { useState } from 'react';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { DesignChat } from '@/components/design/design-chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

/**
 * Chat Step Component
 *
 * @example
 * ```tsx
 * <ChatStep />
 * ```
 */
export function ChatStep() {
  const {
    eventType,
    selectedProducts,
    brandAssets,
    generatedDesigns,
    selectedDesignId,
    addGeneratedDesign,
    selectDesign,
    setFinalDesign,
    nextStep,
    previousStep,
  } = useDesignWizard();

  // Local state for collapsible prompts
  const [openPrompts, setOpenPrompts] = useState<Record<string, boolean>>({});

  /**
   * Toggle prompt visibility for a design
   */
  const togglePrompt = (designId: string) => {
    setOpenPrompts((prev) => ({
      ...prev,
      [designId]: !prev[designId],
    }));
  };

  /**
   * Handle design generation from chat
   */
  const handleDesignGenerated = (imageUrl: string) => {
    // Find the last message from the chat to get the prompt
    // This will be handled by the parent component
    // For now, we'll just show a success message
    toast.success('Design added to gallery!');
  };

  /**
   * Handle "Use This Design" button click
   */
  const handleUseDesign = (designId: string) => {
    const design = generatedDesigns.find((d) => d.id === designId);
    if (!design) {
      console.log('[Chat Step] Design not found:', designId);
      return;
    }

    console.log('[Chat Step] Selecting design:', {
      designId,
      imageUrl: design.imageUrl,
    });

    // Select the design in the store
    selectDesign(designId);

    // Set as final design
    setFinalDesign(design.imageUrl);

    console.log('[Chat Step] Called setFinalDesign with URL:', design.imageUrl);

    toast.success('Design selected! Ready to continue to canvas.');
  };

  /**
   * Handle Continue to Canvas button
   */
  const handleContinue = () => {
    if (!selectedDesignId) {
      toast.error('Please select a design first');
      return;
    }

    nextStep();
  };

  /**
   * Get selected design
   */
  const selectedDesign = generatedDesigns.find((d) => d.id === selectedDesignId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Design with AI</h2>
        <p className="text-lg text-muted-foreground">
          Chat with our AI to refine your ideas, then generate custom designs
        </p>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Chat Interface */}
        <div className="order-2 lg:order-1 h-[600px]">
          <DesignChat
            eventType={eventType}
            products={selectedProducts}
            brandAssets={brandAssets}
            onDesignGenerated={(imageUrl, prompt) => {
              // Add the generated design to the store
              const newDesign = {
                id: Date.now().toString(),
                imageUrl,
                prompt,
                createdAt: new Date(),
              };
              addGeneratedDesign(newDesign);
              handleDesignGenerated(imageUrl);
            }}
          />
        </div>

        {/* Right: Generated Designs Gallery */}
        <div className="order-1 lg:order-2 h-[600px]">
          <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="border-b flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generated Designs
              </CardTitle>
              <CardDescription>
                {generatedDesigns.length === 0
                  ? 'Your generated designs will appear here'
                  : `${generatedDesigns.length} design${generatedDesigns.length === 1 ? '' : 's'} generated`}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-y-auto p-4">
              {/* Empty State */}
              {generatedDesigns.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-md">
                    <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">No designs yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Start chatting with our AI to refine your ideas, then click
                        "Generate Design" to create custom merchandise designs.
                      </p>
                    </div>

                    {/* Example Prompts */}
                    <div className="space-y-2 pt-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Try asking:
                      </p>
                      <div className="space-y-1 text-sm text-left">
                        <p className="text-muted-foreground">
                          • "Create a bold logo with a mascot"
                        </p>
                        <p className="text-muted-foreground">
                          • "Design something fun and colorful"
                        </p>
                        <p className="text-muted-foreground">
                          • "Make a modern, minimalist design"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Designs Grid */}
              {generatedDesigns.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {generatedDesigns.map((design) => {
                    const isSelected = design.id === selectedDesignId;

                    return (
                      <div
                        key={design.id}
                        onClick={() => handleUseDesign(design.id)}
                        className="relative cursor-pointer group"
                      >
                        {/* Image Thumbnail */}
                        <div
                          className={`relative aspect-square w-full bg-muted rounded-lg overflow-hidden transition-all ${
                            isSelected
                              ? 'ring-4 ring-primary shadow-lg'
                              : 'hover:ring-2 hover:ring-primary/50'
                          }`}
                        >
                          <Image
                            src={design.imageUrl}
                            alt={design.prompt}
                            fill
                            className="object-contain"
                          />

                          {/* Check indicator */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="text-xs text-muted-foreground text-center mt-2">
                          {formatDistanceToNow(new Date(design.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Design Preview (Mobile Only) */}
      {selectedDesign && (
        <div className="lg:hidden">
          <Card className="bg-primary/5 border-primary">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="h-4 w-4" />
                Selected Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-square w-full max-w-xs mx-auto bg-white rounded-lg overflow-hidden">
                <Image
                  src={selectedDesign.imageUrl}
                  alt={selectedDesign.prompt}
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={previousStep} type="button">
          Back to Brand Assets
        </Button>

        <Button
          onClick={handleContinue}
          type="button"
          disabled={!selectedDesignId}
        >
          Continue to Canvas
        </Button>
      </div>

      {/* Helper Text */}
      {!selectedDesignId && generatedDesigns.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          <p>Select a design to continue to the canvas editor</p>
        </div>
      )}
    </div>
  );
}
