/**
 * AI Chat API Route
 *
 * POST /api/chat
 *
 * Handles conversational AI for design guidance using GPT-4.
 * Streams responses back to the client using Vercel AI SDK.
 */

import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { buildChatSystemPrompt, type DesignContext } from '@/lib/ai/prompts';
import { getUser } from '@/lib/supabase/server';
import type { EventType } from '@/lib/store/design-wizard';

// Initialize OpenAI provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Rate Limiting
 *
 * Simple in-memory rate limiter (100 requests/hour per user)
 * TODO: Replace with Redis-based rate limiting in production
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 100; // requests per hour
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
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
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

type ChatRequest = z.infer<typeof chatRequestSchema>;

/**
 * POST /api/chat
 *
 * Stream AI chat responses for design guidance
 */
export async function POST(request: NextRequest) {
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
          message: 'Too many requests. Please try again later.',
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
    const body: ChatRequest = await request.json();
    const validation = chatRequestSchema.safeParse(body);

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

    const { messages, eventType, products, brandAssets } = validation.data;

    // 4. Validate messages
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 5. Build context for prompt
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

    // 6. Build system prompt using our templates
    const systemPrompt = buildChatSystemPrompt(context);

    // 7. Log request for debugging
    console.log('[Chat API] Request:', {
      userId: user.id,
      messageCount: messages.length,
      eventType,
      productsCount: products?.length || 0,
      hasBrandAssets: !!brandAssets,
    });

    // 8. Stream text with OpenAI using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-4o'), // Using GPT-4 Omni model
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    // 9. Return streaming response
    return result.toTextStreamResponse({
      headers: {
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      },
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);

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

    // Handle API errors (check for status property)
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message?: string };
      return new Response(
        JSON.stringify({
          error: 'API error',
          message: apiError.message || 'An API error occurred',
        }),
        {
          status: apiError.status || 500,
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
