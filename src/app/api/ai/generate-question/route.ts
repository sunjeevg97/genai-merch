/**
 * AI Follow-Up Question Generation API
 *
 * Generates 1-2 contextual follow-up questions using GPT-4o-mini
 * based on event type, event details, fixed answers, and brand assets.
 *
 * POST /api/ai/generate-question
 * Body: { eventType, eventDetails, fixedAnswers, brandAssets? }
 * Response: { questions: DesignQuestion[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateFollowUpQuestions } from '@/lib/ai/question-generator';
import type { EventType, EventDetails, BrandAssets } from '@/lib/store/design-wizard';
import type { QuestionAnswer } from '@/lib/store/design-wizard';

// Validation schema
const requestSchema = z.object({
  eventType: z.enum(['charity', 'sports', 'company', 'family', 'school', 'other']),
  eventDetails: z.record(z.string(), z.any()),
  fixedAnswers: z.array(
    z.object({
      questionId: z.string(),
      question: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      answeredAt: z.string().transform((val) => new Date(val)),
    })
  ),
  brandAssets: z
    .object({
      logos: z.array(z.string()),
      colors: z.array(z.string()),
      fonts: z.array(z.string()),
      voice: z.string(),
    })
    .optional(),
});

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

    const { eventType, eventDetails, fixedAnswers, brandAssets } = validation.data;

    console.log('[AI Question API] Generating follow-up questions:', {
      eventType,
      eventDetailsKeys: Object.keys(eventDetails),
      fixedAnswersCount: fixedAnswers.length,
      hasBrandAssets: !!brandAssets,
    });

    // Generate follow-up questions
    const questions = await generateFollowUpQuestions(
      eventType as EventType,
      eventDetails as EventDetails,
      fixedAnswers as QuestionAnswer[],
      brandAssets as BrandAssets | undefined
    );

    console.log('[AI Question API] Generated questions:', {
      count: questions.length,
      questionIds: questions.map((q) => q.id),
    });

    // Return questions
    return NextResponse.json({
      questions,
    });
  } catch (error) {
    console.error('[AI Question API] Error generating questions:', error);

    // Return error response
    return NextResponse.json(
      {
        error: 'Failed to generate questions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
