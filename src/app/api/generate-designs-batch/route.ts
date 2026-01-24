/**
 * Batch Design Generation API
 *
 * Generates 3 designs simultaneously using Google Gemini Pro Image.
 * Supports two variety modes:
 * - 'variations': Same concept with different emphasis
 * - 'different-concepts': Distinct visual approaches
 *
 * POST /api/generate-designs-batch
 * Body: {
 *   answers: QuestionAnswer[],
 *   eventType: EventType,
 *   eventDetails: EventDetails,
 *   brandAssets?: BrandAssets,
 *   varietyLevel: 'variations' | 'different-concepts',
 *   count: number (default: 3)
 * }
 *
 * Response: {
 *   success: true,
 *   designs: [
 *     { id, imageUrl, prompt, metadata },
 *     { id, imageUrl, prompt, metadata },
 *     { id, imageUrl, prompt, metadata }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildImageGenerationPromptFromAnswers } from '@/lib/ai/prompts';
import { getGoogleAI, DEFAULT_IMAGE_MODEL } from '@/lib/google-ai/client';
import type {
  EventType,
  EventDetails,
  BrandAssets,
  QuestionAnswer,
} from '@/lib/store/design-wizard';

// Validation schema
const requestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      question: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      answeredAt: z.string().transform((val) => new Date(val)),
    })
  ),
  eventType: z.enum(['charity', 'sports', 'company', 'family', 'school', 'other']),
  eventDetails: z.record(z.string(), z.any()),
  brandAssets: z
    .object({
      logos: z.array(z.string()),
      colors: z.array(z.string()),
      fonts: z.array(z.string()),
      voice: z.string(),
    })
    .optional(),
  varietyLevel: z.enum(['variations', 'different-concepts']),
  count: z.number().min(1).max(5).optional().default(3),
});

// Rate limiting (in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10; // 10 batch requests per hour (= 30 designs)

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    // New window
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

/**
 * Build Variety-Specific Prompts
 *
 * Creates 3 distinct prompts based on variety level.
 */
function buildVarietyPrompts(
  basePrompt: string,
  varietyLevel: 'variations' | 'different-concepts'
): string[] {
  if (varietyLevel === 'variations') {
    // Same concept, different emphasis
    return [
      basePrompt, // Base version
      basePrompt +
        ' Variation: Emphasize color contrast and adjust element scales for visual balance.',
      basePrompt +
        ' Variation: Shift composition layout and modify detail levels for a fresh perspective.',
    ];
  } else {
    // Different visual approaches
    return [
      basePrompt +
        ' Approach 1: Bold graphic elements with high contrast and modern geometric shapes.',
      basePrompt +
        ' Approach 2: Detailed illustration style with rich textures and organic forms.',
      basePrompt +
        ' Approach 3: Minimalist modern design with clean lines and strategic negative space.',
    ];
  }
}

/**
 * Get most common error type from failed designs
 */
function getMostCommonErrorType(failedDesigns: any[]): string {
  const errorTypes = failedDesigns.map(d => d.errorType);
  const typeCounts = errorTypes.reduce((acc: any, type: string) => {
    const count = errorTypes.filter(t => t === type).length;
    return count > (acc.count || 0) ? { type, count } : acc;
  }, { type: 'UNKNOWN_ERROR', count: 0 });
  return typeCounts.type;
}

/**
 * Get user-friendly error message based on error type
 */
function getUserMessage(errorType: string): string {
  const messages: Record<string, string> = {
    RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
    AUTH_ERROR: 'Authentication error. Please contact support.',
    CONTENT_POLICY: 'Your design request may violate content guidelines. Please try a different description.',
    TIMEOUT: 'Request timed out. Please try again.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    CONFIGURATION_ERROR: 'Service not configured. Please contact support.',
  };
  return messages[errorType] || 'Failed to generate designs. Please try again.';
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { answers, eventType, eventDetails, brandAssets, varietyLevel, count } =
      validation.data;

    // Environment validation - check API key before attempting generation
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleApiKey) {
      console.error('[Batch Generation] GOOGLE_AI_API_KEY not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Service not configured',
          message: 'AI design generation is not available. Please contact support.',
          errorType: 'CONFIGURATION_ERROR',
          canRetry: false,
        },
        { status: 500 }
      );
    }

    console.log('[Batch Generation] Environment validated');

    // TODO: Get authenticated user ID (placeholder for now)
    const userId = 'anonymous';

    // Check rate limit
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Maximum 10 batch generations per hour. Please try again later.',
        },
        { status: 429 }
      );
    }

    console.log('[Batch Generation] Request:', {
      userId,
      eventType,
      answersCount: answers.length,
      varietyLevel,
      count,
      remaining: rateLimit.remaining,
    });

    // Build base prompt from answers
    const basePrompt = buildImageGenerationPromptFromAnswers(
      {
        eventType: eventType as EventType,
        eventDetails: eventDetails as EventDetails,
        products: [], // Will be filled from wizard state
        brandAssets: brandAssets as BrandAssets | undefined,
      },
      answers as QuestionAnswer[],
      varietyLevel
    );

    console.log('[Batch Generation] Base prompt:', basePrompt.substring(0, 200) + '...');

    // Build variety-specific prompts
    const prompts = buildVarietyPrompts(basePrompt, varietyLevel);

    console.log('[Batch Generation] Generating', count, 'designs in parallel...');

    // Generate all designs in parallel
    const startTime = Date.now();
    const generationPromises = prompts.slice(0, count).map(async (prompt, index) => {
      try {
        console.log(`[Batch Generation] Design ${index + 1}/${count}...`);

        // Get Google AI client
        const googleAI = getGoogleAI();

        // Generate with SDK (with timeout handling)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await googleAI.models.generateContent({
          model: DEFAULT_IMAGE_MODEL,
          contents: prompt,
          config: {
            responseModalities: ['IMAGE'],
            imageConfig: {
              aspectRatio: "1:1",
            }
          }
        });

        clearTimeout(timeoutId);

        // Extract image from response
        if (!response.candidates?.[0]?.content?.parts?.[0]) {
          throw new Error('No image generated in response');
        }

        const imagePart = response.candidates[0].content.parts[0];
        if (!imagePart.inlineData || !imagePart.inlineData.data) {
          throw new Error('No image data in response');
        }

        const imageBase64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType || 'image/png';
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        console.log(`[Batch Generation] Design ${index + 1} complete`);

        return {
          id: `design-${Date.now()}-${index}`,
          imageUrl,
          prompt,
          mimeType,
          success: true,
          metadata: {
            index: index + 1,
            varietyLevel,
            eventType,
            generatedAt: new Date().toISOString(),
            model: DEFAULT_IMAGE_MODEL,
          },
        };
      } catch (error) {
        // Extract error type from message
        const errorMessage = error instanceof Error ? error.message : 'Unknown';
        let errorType = 'UNKNOWN_ERROR';
        if (errorMessage.includes('RATE_LIMIT')) errorType = 'RATE_LIMIT';
        else if (errorMessage.includes('AUTH_ERROR')) errorType = 'AUTH_ERROR';
        else if (errorMessage.includes('CONTENT_POLICY')) errorType = 'CONTENT_POLICY';
        else if (errorMessage.includes('timeout')) errorType = 'TIMEOUT';

        console.error(`[Batch Generation] Design ${index + 1} error:`, {
          errorType,
          message: errorMessage,
        });

        // Return error design
        return {
          id: `design-error-${index}`,
          imageUrl: '',
          prompt,
          success: false,
          error: errorMessage,
          errorType,
          metadata: {
            index: index + 1,
            varietyLevel,
            eventType,
            generatedAt: new Date().toISOString(),
            failed: true,
          },
        };
      }
    });

    // Wait for all generations to complete
    const designs = await Promise.all(generationPromises);
    const duration = Date.now() - startTime;

    // Separate successful and failed designs
    const successfulDesigns = designs.filter((d) => d.success && d.imageUrl);
    const failedDesigns = designs.filter((d) => !d.success);

    console.log('[Batch Generation] Complete:', {
      total: designs.length,
      successful: successfulDesigns.length,
      failed: failedDesigns.length,
      duration: `${duration}ms`,
      errors: failedDesigns.map(d => ({ index: d.metadata.index, type: d.errorType })),
    });

    // CASE 1: All succeeded (200 OK)
    if (failedDesigns.length === 0) {
      return NextResponse.json(
        {
          success: true,
          designs: successfulDesigns,
          metadata: {
            total: designs.length,
            successful: successfulDesigns.length,
            failed: 0,
            duration,
            varietyLevel,
            remaining: rateLimit.remaining,
          },
        },
        {
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // CASE 2: Partial success (207 Multi-Status)
    if (successfulDesigns.length > 0) {
      return NextResponse.json(
        {
          success: 'partial',
          designs: successfulDesigns,
          errors: failedDesigns.map(d => ({
            index: d.metadata.index,
            errorType: d.errorType,
            message: d.error,
          })),
          metadata: {
            total: designs.length,
            successful: successfulDesigns.length,
            failed: failedDesigns.length,
            duration,
            varietyLevel,
            remaining: rateLimit.remaining,
          },
        },
        {
          status: 207,
          headers: {
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // CASE 3: Total failure (500)
    const primaryErrorType = getMostCommonErrorType(failedDesigns);
    const userMessage = getUserMessage(primaryErrorType);
    const canRetry = primaryErrorType !== 'AUTH_ERROR' && primaryErrorType !== 'CONFIGURATION_ERROR';

    return NextResponse.json(
      {
        success: false,
        error: 'All design generations failed',
        message: userMessage,
        errorType: primaryErrorType,
        canRetry,
        errors: failedDesigns.map(d => ({
          index: d.metadata.index,
          errorType: d.errorType,
          message: d.error,
        })),
        metadata: {
          total: designs.length,
          successful: 0,
          failed: failedDesigns.length,
          duration,
          varietyLevel,
          remaining: rateLimit.remaining,
        },
      },
      {
        status: 500,
        headers: {
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    console.error('[Batch Generation] Server error:', error);

    return NextResponse.json(
      {
        error: 'Batch generation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
