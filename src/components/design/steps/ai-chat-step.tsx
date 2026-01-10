/**
 * AI Chat Step
 *
 * Fourth step in the AI-first design wizard.
 * Users chat with AI to describe their design needs, generate designs with DALL-E 3,
 * iterate on feedback, and select a final design to apply to the canvas.
 */

'use client';

import { useState } from 'react';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Loader2, Heart, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

/**
 * Chat Message Type
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

/**
 * AI Chat Step Component
 *
 * Interactive chat interface for AI-powered design generation.
 * Uses DALL-E 3 to generate custom designs based on user prompts.
 *
 * @example
 * ```tsx
 * <AiChatStep />
 * ```
 */
export function AiChatStep() {
  const {
    eventType,
    brandAssets,
    generatedDesigns,
    selectedDesignId,
    addGeneratedDesign,
    selectDesign,
    toggleFavorite,
    setFinalDesign,
    nextStep,
    previousStep,
  } = useDesignWizard();

  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');

  /**
   * Build context for AI from wizard state
   */
  const buildContext = (): string => {
    const context: string[] = [];

    if (eventType) {
      context.push(`Event type: ${eventType}`);
    }

    if (brandAssets.colors.length > 0) {
      context.push(`Brand colors: ${brandAssets.colors.join(', ')}`);
    }

    if (brandAssets.fonts.length > 0) {
      context.push(`Brand fonts: ${brandAssets.fonts.join(', ')}`);
    }

    if (brandAssets.voice) {
      context.push(`Brand voice: ${brandAssets.voice}`);
    }

    return context.join('\n');
  };

  /**
   * Generate design with DALL-E 3
   */
  const handleGenerateDesign = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);

    try {
      // Build full prompt with context
      const context = buildContext();
      const fullPrompt = context
        ? `${prompt}\n\nContext:\n${context}`
        : prompt;

      // Call DALL-E 3 API route
      const response = await fetch('/api/design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          eventType,
          brandAssets,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate design');
      }

      const data = await response.json();

      // Add generated design to store
      addGeneratedDesign({
        id: crypto.randomUUID(),
        imageUrl: data.imageUrl,
        prompt: prompt,
        createdAt: new Date(),
        isFavorite: false,
      });

      // Clear prompt
      setPrompt('');
    } catch (error) {
      console.error('Error generating design:', error);
      // TODO: Show error toast
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle applying selected design to canvas
   */
  const handleApplyToCanvas = () => {
    const selectedDesign = generatedDesigns.find(
      (d) => d.id === selectedDesignId
    );

    if (selectedDesign) {
      setFinalDesign(selectedDesign.imageUrl);
      nextStep();
    }
  };

  /**
   * Get starter prompts based on event type
   */
  const getStarterPrompts = (): string[] => {
    const base = [
      'Create a modern, minimalist logo',
      'Design something bold and eye-catching',
      'Make it fun and playful',
    ];

    switch (eventType) {
      case 'charity':
        return [
          'Create a heart-centered design for our charity event',
          'Design a compassionate logo that inspires giving',
          'Make an uplifting design that represents hope',
        ];
      case 'sports':
        return [
          'Create a bold, athletic team logo',
          'Design a dynamic sports emblem',
          'Make an energetic mascot design',
        ];
      case 'company':
        return [
          'Create a professional corporate logo',
          'Design a modern tech company emblem',
          'Make a sophisticated business design',
        ];
      default:
        return base;
    }
  };

  const starterPrompts = getStarterPrompts();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Design with AI</h2>
        <p className="text-lg text-muted-foreground">
          Describe your vision and let AI create custom designs for you
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Chat Interface */}
        <div className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Design Assistant
              </CardTitle>
              <CardDescription>
                Describe your design needs in detail
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Context Info */}
              {buildContext() && (
                <div className="px-4 py-3 bg-muted/50 border-b">
                  <p className="text-xs text-muted-foreground">
                    AI will use your event type, products, and brand assets to
                    generate on-brand designs
                  </p>
                </div>
              )}

              {/* Starter Prompts */}
              {generatedDesigns.length === 0 && (
                <div className="px-4 py-6 space-y-3">
                  <p className="text-sm font-medium">Try these prompts:</p>
                  <div className="space-y-2">
                    {starterPrompts.map((starterPrompt, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(starterPrompt)}
                        className="
                          w-full text-left px-3 py-2
                          text-sm rounded-lg
                          bg-muted hover:bg-muted/70
                          transition-colors duration-200
                        "
                      >
                        {starterPrompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Designs History */}
              {generatedDesigns.length > 0 && (
                <ScrollArea className="flex-1 px-4 py-4">
                  <div className="space-y-4">
                    {generatedDesigns.map((design) => (
                      <div key={design.id} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium">You</span>
                          </div>
                          <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                            <p className="text-sm">{design.prompt}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 ml-10">
                          <div className="bg-secondary text-secondary-foreground rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={design.imageUrl}
                                alt={design.prompt}
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <Separator />

              {/* Input Area */}
              <div className="p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGenerateDesign();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the design you want..."
                    disabled={isGenerating}
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!prompt.trim() || isGenerating}
                    size="icon"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Design Gallery */}
        <div className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Generated Designs ({generatedDesigns.length})
              </CardTitle>
              <CardDescription>
                Select your favorite design to apply to canvas
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-4">
              {generatedDesigns.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No designs yet. Start chatting to generate designs!
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="grid grid-cols-2 gap-4">
                    {generatedDesigns.map((design) => (
                      <div
                        key={design.id}
                        className={`
                          relative group cursor-pointer
                          rounded-lg overflow-hidden
                          border-2 transition-all duration-200
                          ${
                            selectedDesignId === design.id
                              ? 'border-primary ring-2 ring-primary'
                              : 'border-border hover:border-primary'
                          }
                        `}
                        onClick={() => selectDesign(design.id)}
                      >
                        <div className="aspect-square relative bg-muted">
                          <Image
                            src={design.imageUrl}
                            alt={design.prompt}
                            fill
                            className="object-contain p-2"
                          />
                        </div>

                        {/* Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(design.id);
                            }}
                            className={`
                              rounded-full p-1.5
                              ${
                                design.isFavorite
                                  ? 'bg-destructive text-destructive-foreground'
                                  : 'bg-background/80 text-foreground'
                              }
                            `}
                          >
                            <Heart
                              className={`h-4 w-4 ${design.isFavorite ? 'fill-current' : ''}`}
                            />
                          </button>
                        </div>

                        {/* Selection Indicator */}
                        {selectedDesignId === design.id && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={previousStep} type="button">
          Back
        </Button>

        <Button
          onClick={handleApplyToCanvas}
          disabled={!selectedDesignId}
          type="button"
        >
          Apply to Canvas
        </Button>
      </div>
    </div>
  );
}
