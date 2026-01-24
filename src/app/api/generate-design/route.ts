/**
 * Google Gemini Imagen 3 Design Generation API Route
 *
 * POST /api/generate-design
 *
 * Generates custom merchandise designs using a three-step AI process:
 * 1. GPT-4 refines the user's prompt for optimal Gemini image generation
 * 2. Google Gemini Imagen 3 generates the actual design image
 * 3. Image is uploaded to Supabase Storage for permanent persistence
 */

import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { getGoogleAI, DEFAULT_IMAGE_MODEL } from '@/lib/google-ai/client';
import { z } from 'zod';
import { buildImageGenerationPrompt, type DesignContext } from '@/lib/ai/prompts';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseUser } from '@/lib/clerk/server';
import { uploadGeneratedDesign } from '@/lib/supabase/storage-server';
import type { EventType } from '@/lib/store/design-wizard';

/**
 * Get OpenAI client for GPT-4 prompt refinement
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
    // 1. Authenticate user with Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Supabase user for database operations
    const user = await getSupabaseUser(clerkUserId);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found in database' }),
        {
          status: 404,
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

    // STEP 1: Use GPT-4 to refine the prompt for Gemini Imagen 3
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
            'You are an expert at creating prompts for Google Gemini Imagen 3 to generate merchandise designs. ' +
            'Follow these best practices for Gemini prompts:\n' +
            '1. Be specific and descriptive about visual elements, colors, and style\n' +
            '2. Include composition details (centered, symmetrical, layout)\n' +
            '3. Specify mood and artistic style (modern, minimalist, bold, etc.)\n' +
            '4. Keep prompts focused and clear, avoid contradictory instructions\n' +
            '5. For merchandise, emphasize clean designs with simple backgrounds\n' +
            'Create a concise prompt under 400 characters. Only return the optimized prompt, no explanation.',
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

    // STEP 2: Generate image with Google Gemini (using official SDK)
    console.log('[Generate Design] Step 2: Generating image with Gemini Pro...');

    const googleAI = getGoogleAI();

    const response = await googleAI.models.generateContent({
      model: DEFAULT_IMAGE_MODEL,
      contents: refinedPrompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: "1:1", // Square for merchandise
        }
      }
    });

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
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    console.log('[Generate Design] Image received:', imageBuffer.length, 'bytes');

    const revisedPrompt = refinedPrompt; // Gemini doesn't provide revised prompts like DALL-E

    // STEP 3: Upload image to Supabase Storage for permanent persistence
    console.log('[Generate Design] Step 3: Uploading to Supabase Storage...');

    const designId = Date.now().toString();

    // Upload the image buffer directly to Supabase
    // Note: We need to modify the upload function to accept buffer instead of URL
    // For now, convert buffer to data URL for compatibility
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    const uploadResult = await uploadGeneratedDesign(dataUrl, user.id, designId);

    if (!uploadResult.success) {
      console.error('[Generate Design] Failed to upload to Supabase:', uploadResult.error);
      throw new Error('Failed to save generated image: ' + uploadResult.error);
    }

    // Use permanent Supabase URL
    const finalImageUrl = uploadResult.url!;

    // STEP 4: Save design to database
    let savedDesign = null;
    if (uploadResult.success) {
      try {
        console.log('[Generate Design] Step 4: Saving to database...');

        const { prisma } = await import('@/lib/prisma');

        // User should already exist from Clerk webhook
        // Create design record
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
              model: DEFAULT_IMAGE_MODEL,
              mimeType: mimeType,
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

    // Handle API errors (OpenAI for GPT-4, Google for Imagen)
    if (error instanceof OpenAI.APIError) {
      // OpenAI GPT-4 errors (for prompt refinement)
      return new Response(
        JSON.stringify({
          error: 'Prompt refinement error',
          message: error.message,
        }),
        {
          status: error.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle Google Imagen API errors
    if (error instanceof Error && error.message.includes('Imagen API error')) {
      // Content safety filter
      if (error.message.includes('safety') || error.message.includes('blocked')) {
        return new Response(
          JSON.stringify({
            error: 'Content safety violation',
            message:
              'Your prompt was blocked by safety filters. Please try a different description.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Rate limit from Google
      if (error.message.includes('429') || error.message.includes('quota')) {
        return new Response(
          JSON.stringify({
            error: 'Google API rate limit',
            message: 'Too many requests to Google AI. Please try again in a few moments.',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generic Google API error
      return new Response(
        JSON.stringify({
          error: 'Image generation error',
          message: error.message,
        }),
        {
          status: 500,
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
