/**
 * Design Chat Interface
 *
 * AI-powered chat interface for design guidance and generation.
 * Users can chat with GPT-4 to refine their ideas, then generate
 * designs with DALL-E 3.
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Wand2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Image from 'next/image';
import type { EventType, BrandAssets } from '@/lib/store/design-wizard';
import { createAppError, getErrorMessage, isRetryableError, ErrorType, type AppError } from '@/lib/utils/errors';
import { logError } from '@/lib/utils/errors';

/**
 * Component Props
 */
interface DesignChatProps {
  eventType: EventType | null;
  products?: string[];
  brandAssets?: BrandAssets;
  onDesignGenerated?: (imageUrl: string, prompt: string) => void;
}

/**
 * Generated Design Data
 */
interface GeneratedDesign {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: Date;
}

/**
 * Chat Message
 */
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Design Chat Component
 *
 * @example
 * ```tsx
 * <DesignChat
 *   eventType="sports"
 *   products={['tshirt', 'hoodie']}
 *   brandAssets={{
 *     colors: ['#FF0000', '#000000'],
 *     fonts: [],
 *     voice: 'Bold and energetic',
 *     logos: [],
 *   }}
 *   onDesignGenerated={(url) => console.log('Design generated:', url)}
 * />
 * ```
 */
export function DesignChat({
  eventType,
  products,
  brandAssets,
  onDesignGenerated,
}: DesignChatProps) {
  // Chat state - manage messages manually
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<AppError | null>(null);

  // Design generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<AppError | null>(null);
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([]);
  const [lastPrompt, setLastPrompt] = useState<string>('');

  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, generatedDesigns]);

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[DesignChat] Submit triggered, input:', input);

    if (!input.trim() || isLoading || isGenerating) {
      console.log('[DesignChat] Submit blocked:', { hasInput: !!input.trim(), isLoading, isGenerating });
      return;
    }

    const userMessage = input.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };

    console.log('[DesignChat] Sending message:', userMsg);

    setInput(''); // Clear input immediately
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setChatError(null); // Clear previous errors

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          eventType,
          products,
          brandAssets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to send message';

        if (response.status === 429) {
          throw createAppError(new Error(errorMessage), ErrorType.RATE_LIMIT_ERROR);
        }
        throw new Error(errorMessage);
      }

      console.log('[DesignChat] Response received, status:', response.status);

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let assistantMsgAdded = false;

      if (reader) {
        console.log('[DesignChat] Starting to read stream...');
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[DesignChat] Stream complete');
            break;
          }

          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          console.log('[DesignChat] Received chunk:', chunk.substring(0, 100));

          // Just append the plain text chunk
          assistantMessage += chunk;

          // Update assistant message in real-time
          if (assistantMessage) {
            setMessages((prev) => {
              if (assistantMsgAdded) {
                // Update existing assistant message
                return [
                  ...prev.slice(0, -1),
                  {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: assistantMessage,
                  },
                ];
              } else {
                // Add new assistant message
                assistantMsgAdded = true;
                return [
                  ...prev,
                  {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: assistantMessage,
                  },
                ];
              }
            });
          }
        }
        console.log('[DesignChat] Final assistant message:', assistantMessage.substring(0, 100));
      }
    } catch (error) {
      console.error('[DesignChat] Error:', error);
      logError(error, 'DesignChat - handleSubmit');

      const appError = createAppError(error, ErrorType.API_ERROR);
      setChatError(appError);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Retry chat after error
   */
  const retryChatMessage = () => {
    setChatError(null);
    // Re-submit the last user message
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  /**
   * Generate design using DALL-E 3
   */
  const handleGenerateDesign = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('[DesignChat] Generate Design clicked');
    console.log('[DesignChat] State check:', {
      isLoading,
      isGenerating,
      messagesCount: messages.length,
      inputLength: input.length,
      inputValue: input.substring(0, 50),
    });

    // Guard against already generating
    if (isGenerating || isLoading) {
      console.log('[DesignChat] Already processing, ignoring click');
      return;
    }

    // Get the last user message as the prompt
    const lastUserMessage = messages.filter((m: ChatMessage) => m.role === 'user').pop();
    const messageContent = typeof lastUserMessage?.content === 'string'
      ? lastUserMessage.content
      : '';
    const prompt = messageContent || input.trim() || '';

    console.log('[DesignChat] Using prompt:', prompt);

    if (!prompt) {
      toast.error('Please describe your design first');
      return;
    }

    console.log('[DesignChat] Starting design generation with prompt:', prompt);
    setIsGenerating(true);
    setGenerationError(null); // Clear previous errors
    setLastPrompt(prompt); // Save for retry

    try {
      const response = await fetch('/api/generate-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          eventType,
          products,
          brandAssets,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || 'Failed to generate design';

        // Handle specific error types
        if (response.status === 429) {
          throw createAppError(new Error(errorMessage), ErrorType.RATE_LIMIT_ERROR);
        } else if (response.status === 400 && errorMessage.toLowerCase().includes('content policy')) {
          throw createAppError(new Error(errorMessage), ErrorType.AI_CONTENT_POLICY_ERROR);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const { imageUrl } = result.data;

      // Add to generated designs
      const newDesign: GeneratedDesign = {
        id: Date.now().toString(),
        imageUrl,
        prompt,
        timestamp: new Date(),
      };

      setGeneratedDesigns((prev) => [...prev, newDesign]);

      // Call callback
      if (onDesignGenerated) {
        onDesignGenerated(imageUrl, prompt);
      }

      toast.success('Design generated successfully!');
    } catch (error) {
      console.error('[Generate Design] Error:', error);
      logError(error, 'DesignChat - handleGenerateDesign');

      const appError = createAppError(error, ErrorType.AI_GENERATION_ERROR);
      setGenerationError(appError);
      toast.error(getErrorMessage(error));
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Retry design generation after error
   */
  const retryGeneration = () => {
    setGenerationError(null);
    if (lastPrompt) {
      // Trigger generation with the last prompt
      handleGenerateDesign();
    }
  };

  /**
   * Clear conversation
   */
  const handleClearConversation = () => {
    setMessages([]);
    setGeneratedDesigns([]);
    toast.success('Conversation cleared');
  };

  return (
    <Card className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-muted/50 flex-shrink-0">
        <div>
          <h3 className="font-semibold text-lg">Design Assistant</h3>
          <p className="text-sm text-muted-foreground">
            Chat with AI to refine your design ideas
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearConversation}
          disabled={messages.length === 0 && generatedDesigns.length === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      {/* Messages Area */}
      <div ref={scrollAreaRef} className="flex-1 min-h-0 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && generatedDesigns.length === 0 && (
            <div className="text-center py-8">
              <p className="text-lg mb-4 font-semibold text-foreground">Start a conversation!</p>
              <p className="text-sm mb-6 text-muted-foreground">
                Describe your design vision and I'll help you refine it.
              </p>

              {/* Example Prompts */}
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide mb-3 text-muted-foreground">
                  Try asking:
                </p>
                <div className="space-y-2 max-w-md mx-auto">
                  <button
                    onClick={() => setInput('Create a bold logo with a mascot that represents our team spirit')}
                    className="w-full text-left px-4 py-2 text-sm text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    disabled={isLoading || isGenerating}
                    type="button"
                  >
                    "Create a bold logo with a mascot"
                  </button>
                  <button
                    onClick={() => setInput('Design something fun and colorful for a youth sports event')}
                    className="w-full text-left px-4 py-2 text-sm text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    disabled={isLoading || isGenerating}
                    type="button"
                  >
                    "Design something fun and colorful"
                  </button>
                  <button
                    onClick={() => setInput('Make a modern, minimalist design with clean lines')}
                    className="w-full text-left px-4 py-2 text-sm text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                    disabled={isLoading || isGenerating}
                    type="button"
                  >
                    "Make a modern, minimalist design"
                  </button>
                </div>
              </div>
            </div>
          )}

          {messages.map((message: ChatMessage, index: number) => (
            <div
              key={message.id || index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {typeof message.content === 'string'
                    ? message.content
                    : JSON.stringify(message.content)}
                </p>
              </div>
            </div>
          ))}

          {/* Loading indicator with skeleton */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          )}

          {/* Chat Error Display */}
          {chatError && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Chat Error</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{chatError.message}</p>
                {isRetryableError(chatError) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryChatMessage}
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Generated Designs */}
          {generatedDesigns.map((design) => (
            <div key={design.id} className="flex justify-center">
              <div className="bg-muted rounded-lg p-4 max-w-sm w-full">
                <p className="text-sm text-muted-foreground mb-2">
                  Generated Design
                </p>
                <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-white rounded-md overflow-hidden">
                  <Image
                    src={design.imageUrl}
                    alt={design.prompt}
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {design.prompt}
                </p>
              </div>
            </div>
          ))}

          {/* Design generation loading with skeleton */}
          {isGenerating && (
            <div className="flex justify-center">
              <div className="bg-muted rounded-lg p-4 max-w-md w-full">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Generating your design...
                  </p>
                </div>
                <div className="aspect-square w-full bg-muted-foreground/10 rounded-md flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">This may take 15-20 seconds</p>
                </div>
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          )}

          {/* Generation Error Display */}
          {generationError && !isGenerating && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Design Generation Failed</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{generationError.message}</p>
                {generationError.details && (
                  <p className="text-xs opacity-75">{generationError.details}</p>
                )}
                {isRetryableError(generationError) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryGeneration}
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Retry Generation
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-background flex-shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your design ideas... (Press Enter to send, Shift+Enter for new line)"
            className="min-h-[80px] resize-none"
            disabled={isLoading || isGenerating}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || isGenerating || !input.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={(e) => {
                console.log('[DesignChat] Button clicked - event fired');
                handleGenerateDesign(e);
              }}
              disabled={isLoading || isGenerating || (messages.length === 0 && !input.trim())}
              variant="secondary"
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate Design
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Chat with AI to refine your ideas, then click "Generate Design" to create the actual
            image
          </p>
        </form>
      </div>
    </Card>
  );
}
