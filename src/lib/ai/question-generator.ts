/**
 * AI Question Generator
 *
 * Generates dynamic follow-up questions using GPT-5-mini based on:
 * - Event type and details
 * - Answers to fixed questions
 * - Brand assets (if provided)
 *
 * Generates 0-2 specific, contextual questions to fill gaps in design preferences.
 * Returns empty array if existing answers are comprehensive.
 */

import OpenAI from 'openai';
import type { EventType, EventDetails, BrandAssets, QuestionAnswer } from '@/lib/store/design-wizard';
import type { DesignQuestion, QuestionType } from '@/lib/ai/question-templates';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Question Generation Response Schema
 *
 * Expected JSON structure from GPT-5-mini.
 */
interface QuestionGenerationResponse {
  questions: Array<{
    id: string;
    type: QuestionType;
    question: string;
    options: Array<{
      value: string;
      label: string;
      description?: string;
    }>;
    maxSelections?: number;
  }>;
}

/**
 * Generate Follow-Up Questions
 *
 * Uses GPT-5-mini to generate 0-2 contextual follow-up questions
 * that fill gaps in the fixed question set. Returns empty array if
 * existing answers are comprehensive.
 *
 * @param eventType - The selected event type
 * @param eventDetails - Event-specific details from user
 * @param fixedAnswers - Answers to fixed questions
 * @param brandAssets - Optional brand assets
 * @returns Array of 0-2 AI-generated questions
 *
 * @example
 * ```typescript
 * const followUps = await generateFollowUpQuestions(
 *   'sports',
 *   { name: 'Tigers FC', sport: 'soccer' },
 *   [
 *     { questionId: 'sports-mascot', answer: 'yes' },
 *     { questionId: 'sports-style', answer: ['fierce', 'dynamic'] }
 *   ]
 * );
 * // May return 0, 1, or 2 questions
 * ```
 */
export async function generateFollowUpQuestions(
  eventType: EventType,
  eventDetails: EventDetails,
  fixedAnswers: QuestionAnswer[],
  brandAssets?: BrandAssets
): Promise<DesignQuestion[]> {
  try {
    // Build context for GPT-5-mini
    const systemPrompt = buildQuestionGenerationPrompt();
    const userPrompt = buildUserContext(eventType, eventDetails, fixedAnswers, brandAssets);

    console.log('[Question Generator] Generating follow-up questions...');
    console.log('[Question Generator] Event type:', eventType);
    console.log('[Question Generator] Fixed answers count:', fixedAnswers.length);

    // Call GPT-5-mini
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, // Moderate creativity
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // Force JSON response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn('[Question Generator] No response from OpenAI');
      return [];
    }

    // Parse JSON response
    const parsed: QuestionGenerationResponse = JSON.parse(content);

    // Convert to DesignQuestion format
    const questions: DesignQuestion[] = parsed.questions.map((q) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      required: false, // Follow-ups are optional
      eventTypes: [eventType], // Specific to current event
      maxSelections: q.maxSelections,
    }));

    console.log('[Question Generator] Generated', questions.length, 'follow-up questions');

    return questions;
  } catch (error) {
    console.error('[Question Generator] Error generating questions:', error);
    // Fail gracefully - return empty array
    return [];
  }
}

/**
 * Build System Prompt
 *
 * Defines the AI's role and output format.
 */
function buildQuestionGenerationPrompt(): string {
  return `You are a design expert helping users create custom merchandise designs.

Your task is to generate 0-2 specific clarifying questions about visual design elements that will help create a perfect design.

IMPORTANT GUIDELINES:
- Generate follow-up questions ONLY if there are critical gaps in the existing answers
- If the existing answers are comprehensive, return an empty questions array
- Focus on design style nuances NOT covered by the user's existing answers
- Ask about specific imagery opportunities related to their event
- Inquire about layout/composition preferences
- Consider target audience visual preferences
- Keep questions concise and actionable (max 15 words)
- Provide 3-5 clear option choices per question
- Each option should have a value, label, and brief description

QUESTION TYPES:
- "multi-select": User can select multiple options (use maxSelections: 2 or 3)
- "yes-no": Binary choice (provide exactly 2 options)
- "style": Single selection from visual options

OUTPUT FORMAT:
Return a JSON object with this EXACT structure:
{
  "questions": [
    {
      "id": "follow-up-1",
      "type": "multi-select" | "yes-no" | "style",
      "question": "Question text?",
      "options": [
        {
          "value": "unique-value",
          "label": "Display Label",
          "description": "Brief explanation of this choice"
        }
      ],
      "maxSelections": 2  // Optional, only for multi-select
    }
  ]
}

CONSTRAINTS:
- Generate 0-2 questions (can return empty array if existing answers are comprehensive)
- Each question must have 2-5 options
- Keep all text concise and user-friendly
- Avoid technical jargon
- Total questions (fixed + AI) should not exceed 5`;
}

/**
 * Build User Context
 *
 * Compiles event details and answers into a context string.
 */
function buildUserContext(
  eventType: EventType,
  eventDetails: EventDetails,
  fixedAnswers: QuestionAnswer[],
  brandAssets?: BrandAssets
): string {
  const sections: string[] = [];

  // Event type
  sections.push(`EVENT TYPE: ${eventType}`);

  // Event details (formatted)
  if (Object.keys(eventDetails).length > 0) {
    sections.push('\nEVENT DETAILS:');
    Object.entries(eventDetails).forEach(([key, value]) => {
      if (value) {
        sections.push(`- ${key}: ${value}`);
      }
    });
  }

  // Fixed answers (formatted)
  if (fixedAnswers.length > 0) {
    sections.push('\nUSER\'S DESIGN PREFERENCES:');
    fixedAnswers.forEach((answer) => {
      const answerText = Array.isArray(answer.answer)
        ? answer.answer.join(', ')
        : answer.answer;
      sections.push(`- ${answer.question}: ${answerText}`);
    });
  }

  // Brand assets (if provided)
  if (brandAssets) {
    sections.push('\nBRAND ASSETS:');
    if (brandAssets.colors.length > 0) {
      sections.push(`- Brand colors: ${brandAssets.colors.join(', ')}`);
    }
    if (brandAssets.voice) {
      sections.push(`- Brand voice: ${brandAssets.voice}`);
    }
    if (brandAssets.fonts.length > 0) {
      sections.push(`- Brand fonts: ${brandAssets.fonts.join(', ')}`);
    }
  }

  sections.push('\nGENERATE 0-2 FOLLOW-UP QUESTIONS:');
  sections.push('Based on the above context, what important design details are still missing?');
  sections.push('Focus on aspects that will significantly impact the final design.');
  sections.push('If the existing answers are comprehensive, return an empty array.');

  return sections.join('\n');
}
