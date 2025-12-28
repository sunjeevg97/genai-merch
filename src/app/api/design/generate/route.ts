/**
 * DALL-E 3 Design Generation API Route
 *
 * POST /api/design/generate
 *
 * Generates custom designs using OpenAI's DALL-E 3 model.
 * Takes a user prompt and context (event type, brand assets) to create on-brand designs.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
 * Generate a design using DALL-E 3
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

    // Enhance prompt with brand context
    let enhancedPrompt = prompt;

    // Add brand colors if provided
    if (brandAssets?.colors && brandAssets.colors.length > 0) {
      enhancedPrompt += `\nUse these brand colors: ${brandAssets.colors.join(', ')}`;
    }

    // Add brand voice if provided
    if (brandAssets?.voice) {
      enhancedPrompt += `\nBrand style: ${brandAssets.voice}`;
    }

    // Add design constraints for merchandise
    enhancedPrompt += `\nCreate a design suitable for custom apparel/merchandise. The design should be clear, bold, and work well on clothing. Use a transparent or simple background.`;

    console.log('Generating design with prompt:', enhancedPrompt);

    // Get OpenAI client
    const openai = getOpenAIClient();

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const imageData = response.data?.[0];
    const imageUrl = imageData?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }

    // TODO: Upload image to Supabase Storage for persistence
    // DALL-E URLs expire after a few hours, so we should store them
    // const { data, error } = await supabase.storage
    //   .from('generated-designs')
    //   .upload(`designs/${userId}/${Date.now()}.png`, imageBuffer);

    return NextResponse.json({
      imageUrl,
      prompt,
      revisedPrompt: imageData?.revised_prompt,
    });
  } catch (error) {
    console.error('Error generating design:', error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        {
          error: 'Failed to generate design',
          message: error.message,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
