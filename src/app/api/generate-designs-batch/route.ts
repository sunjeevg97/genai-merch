/**
 * Batch Design Generation API
 *
 * Generates 3 designs simultaneously using DALL-E 3.
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
import OpenAI from 'openai';
import { buildImageGenerationPromptFromAnswers } from '@/lib/ai/prompts';
import type {
  EventType,
  EventDetails,
  BrandAssets,
  QuestionAnswer,
} from '@/lib/store/design-wizard';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
        console.log(`[Batch Generation] Generating design ${index + 1}...`);

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        });

        if (!response.data || response.data.length === 0) {
          throw new Error('No image data in response');
        }

        const imageUrl = response.data[0]?.url;
        const revisedPrompt = response.data[0]?.revised_prompt;

        if (!imageUrl) {
          throw new Error('No image URL in response');
        }

        console.log(`[Batch Generation] Design ${index + 1} complete`);

        return {
          id: `design-${Date.now()}-${index}`,
          imageUrl,
          prompt,
          revisedPrompt,
          metadata: {
            index: index + 1,
            varietyLevel,
            eventType,
            generatedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error(`[Batch Generation] Error generating design ${index + 1}:`, error);

        // Return error design
        return {
          id: `design-error-${index}`,
          imageUrl: '',
          prompt,
          error: error instanceof Error ? error.message : 'Unknown error',
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

    // Filter out failed designs
    const successfulDesigns = designs.filter((d) => d.imageUrl && !d.error);
    const failedCount = designs.length - successfulDesigns.length;

    console.log('[Batch Generation] Batch complete:', {
      total: designs.length,
      successful: successfulDesigns.length,
      failed: failedCount,
      duration: `${duration}ms`,
    });

    // Return results
    return NextResponse.json(
      {
        success: true,
        designs: successfulDesigns,
        metadata: {
          total: designs.length,
          successful: successfulDesigns.length,
          failed: failedCount,
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
