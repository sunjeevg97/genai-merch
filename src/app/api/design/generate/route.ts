/**
 * Google Gemini Design Generation API Route (Simplified)
 *
 * POST /api/design/generate
 *
 * Generates custom designs using Google's Gemini Pro Image model.
 * Takes a user prompt and context (event type, brand assets) to create on-brand designs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAI, DEFAULT_IMAGE_MODEL } from '@/lib/google-ai/client';

/**
 * Request body interface
 */
interface GenerateDesignRequest {
  prompt: string;
  eventType?: string;
  brandAssets?: {
    colors?: string[];
    fonts?: string[];
    voice?: string;
  };
}

/**
 * POST /api/design/generate
 *
 * Generate a design using Google Gemini Imagen 3
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateDesignRequest = await request.json();
    const { prompt, eventType, brandAssets } = body;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate API key
    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleApiKey) {
      throw new Error('GOOGLE_AI_API_KEY is not configured');
    }

    // Enhance prompt with brand context
    let enhancedPrompt = prompt;
    if (brandAssets?.colors && brandAssets.colors.length > 0) {
      enhancedPrompt += `. Color palette: ${brandAssets.colors.join(', ')}`;
    }
    if (brandAssets?.voice) {
      enhancedPrompt += `. Style: ${brandAssets.voice}`;
    }
    enhancedPrompt += `. Create a clear, bold design suitable for custom apparel and merchandise. Use clean composition with simple background. Centered layout, high contrast, professional quality.`;

    console.log('[Design Generate] Generating with prompt:', enhancedPrompt.substring(0, 200) + '...');

    // Generate with Google AI SDK
    const googleAI = getGoogleAI();

    const response = await googleAI.models.generateContent({
      model: DEFAULT_IMAGE_MODEL,
      contents: enhancedPrompt,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: "1:1",
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
    const imageUrl = `data:${mimeType};base64,${imageBase64}`;

    console.log('[Design Generate] Image generated successfully');

    // TODO: Upload image to Supabase Storage for persistence
    // Currently returning data URL which will expire when the session ends
    // For production, implement upload to Supabase Storage similar to /api/generate-design route

    return NextResponse.json({
      imageUrl,
      prompt,
      model: DEFAULT_IMAGE_MODEL,
      mimeType,
    });
  } catch (error) {
    console.error('[Design Generate] Error:', error);

    // Handle Google Gemini API errors
    if (error instanceof Error && error.message.includes('Gemini API error')) {
      // Content safety filter
      if (error.message.includes('safety') || error.message.includes('blocked')) {
        return NextResponse.json(
          {
            error: 'Content safety violation',
            message:
              'Your prompt was blocked by safety filters. Please try a different description.',
          },
          { status: 400 }
        );
      }

      // Rate limit
      if (error.message.includes('429') || error.message.includes('quota')) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again in a few moments.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: 'Image generation failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
