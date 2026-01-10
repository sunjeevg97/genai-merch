/**
 * DALL-E 3 Design Generation API Route
 *
 * POST /api/generate-design
 *
 * Generates custom merchandise designs using a three-step AI process:
 * 1. GPT-4 refines the user's prompt for optimal DALL-E 3 generation
 * 2. DALL-E 3 generates the actual design image
 * 3. Image is uploaded to Supabase Storage for permanent persistence
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { buildImageGenerationPrompt, type DesignContext } from '@/lib/ai/prompts';
import { getUser } from '@/lib/supabase/server';
import { uploadGeneratedDesign } from '@/lib/supabase/storage-server';
import type { EventType } from '@/lib/store/design-wizard';

/**
 * Get OpenAI client (lazy initialization to avoid build-time errors)
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

/**
 * Rate Limiting
 *
 * Simple in-memory rate limiter (10 generations per hour per user)
 * TODO: Replace with Redis-based rate limiting in production
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 10; // generations per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  // No entry or window expired - create new entry
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  // Check if limit exceeded
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

/**
 * Request Validation Schema
 */
const generateDesignRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt is too long'),
  eventType: z
    .enum(['charity', 'fundraiser', 'company', 'sports', 'school', 'personal'])
    .nullable()
    .optional(),
  products: z.array(z.string()).optional().default([]),
  brandAssets: z
    .object({
      colors: z.array(z.string()).optional().default([]),
      fonts: z.array(z.string()).optional().default([]),
      voice: z.string().optional().default(''),
      logos: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

type GenerateDesignRequest = z.infer<typeof generateDesignRequestSchema>;

/**
 * POST /api/generate-design
 *
 * Generate a custom design using GPT-4 + DALL-E 3
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user
    const user = await getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Maximum 10 design generations per hour. Please try again later.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 3. Parse and validate request body
    const body: GenerateDesignRequest = await request.json();
    const validation = generateDesignRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request',
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { prompt, eventType, products, brandAssets } = validation.data;

    // 4. Build context for prompt generation
    const context: DesignContext = {
      eventType: (eventType as EventType) || null,
      products: products || [],
      brandAssets: brandAssets
        ? {
            colors: brandAssets.colors || [],
            fonts: brandAssets.fonts || [],
            voice: brandAssets.voice || '',
            logos: brandAssets.logos || [],
          }
        : undefined,
    };

    // 5. Log generation request
    console.log('[Generate Design] Request:', {
      userId: user.id,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      eventType,
      productsCount: products?.length || 0,
      hasBrandAssets: !!brandAssets,
    });

    // STEP 1: Use GPT-4 to refine the prompt for DALL-E 3
    console.log('[Generate Design] Step 1: Refining prompt with GPT-4...');

    const optimizedPrompt = buildImageGenerationPrompt(prompt, context);

    // Get OpenAI client
    const openai = getOpenAIClient();

    const gpt4Response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at creating prompts for DALL-E 3 to generate merchandise designs. ' +
            'Take the user\'s design description and context, then create a concise, detailed prompt ' +
            'that will generate a print-ready merchandise design. Focus on visual elements, style, and composition. ' +
            'Keep it under 400 characters. Do not include any explanation, only return the optimized prompt.',
        },
        {
          role: 'user',
          content: optimizedPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const refinedPrompt = gpt4Response.choices[0]?.message?.content?.trim();

    if (!refinedPrompt) {
      throw new Error('Failed to generate refined prompt');
    }

    console.log('[Generate Design] Refined prompt:', refinedPrompt);

    // STEP 2: Generate image with DALL-E 3
    console.log('[Generate Design] Step 2: Generating image with DALL-E 3...');

    const dalleResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: refinedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard', // Use 'hd' for premium tier
      response_format: 'url',
    });

    const imageData = dalleResponse.data?.[0];
    const dalleImageUrl = imageData?.url;
    const revisedPrompt = imageData?.revised_prompt;

    if (!dalleImageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }

    console.log('[Generate Design] DALL-E image generated:', dalleImageUrl.substring(0, 100) + '...');

    // STEP 3: Upload image to Supabase Storage for permanent persistence
    // DALL-E URLs expire after a few hours, so we need to save them
    console.log('[Generate Design] Step 3: Uploading to Supabase Storage...');

    const designId = Date.now().toString();
    const uploadResult = await uploadGeneratedDesign(dalleImageUrl, user.id, designId);

    if (!uploadResult.success) {
      console.error('[Generate Design] Failed to upload to Supabase:', uploadResult.error);
      // Fall back to DALL-E URL if upload fails (non-critical error)
      console.warn('[Generate Design] Falling back to temporary DALL-E URL');
    }

    // Use permanent Supabase URL if available, otherwise fall back to DALL-E URL
    const finalImageUrl = uploadResult.success ? uploadResult.url! : dalleImageUrl;

    // STEP 4: Save design to database
    let savedDesign = null;
    if (uploadResult.success) {
      try {
        console.log('[Generate Design] Step 4: Saving to database...');

        const { prisma } = await import('@/lib/prisma');

        // Ensure user exists in database
        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          },
        });

        savedDesign = await prisma.design.create({
          data: {
            userId: user.id,
            name: `AI Design - ${new Date().toLocaleDateString()}`,
            imageUrl: finalImageUrl,
            metadata: {
              prompt: prompt,
              refinedPrompt: refinedPrompt,
              revisedPrompt: revisedPrompt,
              eventType: eventType || null,
              products: products || [],
              generatedAt: new Date().toISOString(),
            },
            aiPrompt: prompt,
          },
        });

        console.log('[Generate Design] Design saved to database:', savedDesign.id);
      } catch (dbError) {
        console.error('[Generate Design] Failed to save to database:', dbError);
        // Non-critical error, continue with response
      }
    }

    // 6. Log successful generation
    const duration = Date.now() - startTime;
    console.log('[Generate Design] Success:', {
      userId: user.id,
      imageUrl: finalImageUrl,
      isPermanent: uploadResult.success,
      storagePath: uploadResult.path,
      designId: savedDesign?.id || null,
      duration: `${duration}ms`,
      remaining: rateLimit.remaining,
    });

    // 7. Return the generated design with permanent URL
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: savedDesign?.id || designId,
          imageUrl: finalImageUrl,
          revisedPrompt,
          originalPrompt: prompt,
          refinedPrompt,
          saved: !!savedDesign,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Generate Design] Error:', error);

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      // Content policy violation
      if (error.status === 400 && error.message.includes('content_policy')) {
        return new Response(
          JSON.stringify({
            error: 'Content policy violation',
            message:
              'Your prompt was flagged by our content policy. Please try a different description.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Rate limit from OpenAI
      if (error.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'OpenAI rate limit',
            message: 'Too many requests to OpenAI. Please try again in a few moments.',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Quota exceeded
      if (error.message.includes('quota')) {
        return new Response(
          JSON.stringify({
            error: 'Quota exceeded',
            message: 'OpenAI API quota exceeded. Please contact support.',
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generic OpenAI error
      return new Response(
        JSON.stringify({
          error: 'OpenAI API error',
          message: error.message,
        }),
        {
          status: error.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          details: error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
