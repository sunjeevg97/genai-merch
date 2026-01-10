/**
 * AI Prompt Templates
 *
 * Functions for building optimized prompts for:
 * - GPT-4 (chat assistance and design guidance)
 * - DALL-E 3 (image generation for merchandise designs)
 */

import type { EventType, EventDetails, BrandAssets } from '@/lib/store/design-wizard';

/**
 * Design Context
 *
 * All context needed to build AI prompts
 */
export interface DesignContext {
  eventType: EventType | null;
  eventDetails?: EventDetails;
  products: string[];
  brandAssets?: {
    colors: string[];
    fonts: string[];
    voice: string;
    logos: string[];
  };
}

/**
 * Event Type Descriptions
 *
 * Human-readable descriptions for each event type
 */
const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  charity: 'charity event, fundraiser, or non-profit organization',
  sports: 'sports team, tournament, league, or athletic event',
  company: 'corporate event, company branding, team building, or business conference',
  family: 'family reunion, gathering, celebration, or family event',
  school: 'school event, university, graduation, or educational institution',
  other: 'special event or custom occasion',
};

/**
 * Product Type Descriptions
 *
 * Descriptions for how designs should appear on each product
 */
const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  tshirt: 'centered on the front of a t-shirt',
  sweatshirt: 'centered on the front of a sweatshirt',
  hoodie: 'centered on the front of a hoodie',
  mug: 'wrapping around a coffee mug',
  pen: 'along the barrel of a pen',
  sticker: 'as a die-cut sticker',
  tote: 'centered on a tote bag',
  hat: 'on the front panel of a baseball cap',
};

/**
 * Build Chat System Prompt
 *
 * Creates a system prompt for GPT-4 to act as a design assistant.
 * The assistant helps users describe their design vision through
 * conversational guidance and creative suggestions.
 *
 * @param context - Design context including event type, products, and brand assets
 * @returns System prompt string for GPT-4
 *
 * @example
 * ```typescript
 * const prompt = buildChatSystemPrompt({
 *   eventType: 'charity',
 *   products: ['tshirt', 'mug'],
 *   brandAssets: {
 *     colors: ['#FF5733', '#3498DB'],
 *     fonts: ['Roboto'],
 *     voice: 'Warm and inspiring',
 *     logos: []
 *   }
 * });
 * ```
 */
export function buildChatSystemPrompt(context: DesignContext): string {
  const { eventType, eventDetails, products, brandAssets } = context;

  // Build context sections
  const sections: string[] = [];

  // Base role
  sections.push(
    'You are an expert design assistant helping users create custom merchandise designs. ' +
    'Your role is to guide users through describing their design vision by asking thoughtful questions, ' +
    'offering creative suggestions, and helping them refine their ideas.'
  );

  // Event context with details
  if (eventType) {
    const eventDesc = EVENT_TYPE_DESCRIPTIONS[eventType];
    let contextStr = `\n\nCONTEXT: The user is creating designs for a ${eventDesc}`;

    // Add specific details for richer context
    if (eventDetails) {
      const details: string[] = [];

      if (eventDetails.name) {
        details.push(`called "${eventDetails.name}"`);
      }

      // Add event-specific context
      if (eventType === 'charity' && eventDetails.cause) {
        details.push(`supporting ${eventDetails.cause}`);
      } else if (eventType === 'sports' && eventDetails.sport) {
        details.push(`for ${eventDetails.sport}`);
        if (eventDetails.ageGroup) details.push(`at ${eventDetails.ageGroup} level`);
      } else if (eventType === 'company' && eventDetails.industry) {
        details.push(`in ${eventDetails.industry}`);
      } else if (eventType === 'family' && eventDetails.familyName) {
        details.push(`for the ${eventDetails.familyName} family`);
      } else if (eventType === 'school' && eventDetails.gradeLevel) {
        details.push(`for ${eventDetails.gradeLevel}`);
      }

      if (details.length > 0) {
        contextStr += ' ' + details.join(', ');
      }

      if (eventDetails.description) {
        contextStr += `. Additional context: ${eventDetails.description}`;
      }
    }

    contextStr += '. Keep this context in mind when suggesting design ideas and asking questions.';
    sections.push(contextStr);
  }

  // Product context
  if (products.length > 0) {
    const productList = products.map(p => {
      const desc = PRODUCT_DESCRIPTIONS[p] || p;
      return desc;
    }).join(', ');

    sections.push(
      `\n\nPRODUCTS: The designs will be applied to: ${productList}. ` +
      'Consider how the design will look on these specific products when making suggestions.'
    );
  }

  // Brand assets context
  if (brandAssets) {
    if (brandAssets.colors.length > 0) {
      sections.push(
        `\n\nBRAND COLORS: The user has provided brand colors: ${brandAssets.colors.join(', ')}. ` +
        'Incorporate these colors into your design suggestions when appropriate.'
      );
    }

    if (brandAssets.voice) {
      sections.push(
        `\n\nBRAND VOICE: The brand voice is "${brandAssets.voice}". ` +
        'Keep this tone in mind when suggesting design concepts and messaging.'
      );
    }

    if (brandAssets.fonts.length > 0) {
      sections.push(
        `\n\nBRAND FONTS: Preferred fonts include: ${brandAssets.fonts.join(', ')}.`
      );
    }
  }

  // Guidelines
  sections.push(
    '\n\nGUIDELINES:\n' +
    '- Ask clarifying questions to understand the user\'s vision\n' +
    '- Suggest specific design elements (colors, imagery, text, style)\n' +
    '- Consider the target audience and purpose\n' +
    '- Recommend design styles that work well for merchandise printing\n' +
    '- Be creative and enthusiastic, but also practical\n' +
    '- Keep responses concise and actionable\n' +
    '- When the user describes their vision, help them refine it into a clear design brief'
  );

  // Important note
  sections.push(
    '\n\nIMPORTANT: You are NOT generating the actual design - you are helping the user describe ' +
    'what they want so that DALL-E 3 can generate it. Focus on gathering details about style, ' +
    'colors, imagery, text, and overall aesthetic.'
  );

  return sections.join('');
}

/**
 * Build Image Generation Prompt
 *
 * Creates an optimized prompt for DALL-E 3 to generate merchandise designs.
 * Incorporates user's description with context about event type, products,
 * and brand guidelines to produce print-ready designs.
 *
 * @param userPrompt - The user's description of what they want
 * @param context - Design context including event type, products, and brand assets
 * @returns Optimized DALL-E 3 prompt string
 *
 * @example
 * ```typescript
 * const prompt = buildImageGenerationPrompt(
 *   'A bold lion mascot with our team name',
 *   {
 *     eventType: 'sports',
 *     products: ['tshirt'],
 *     brandAssets: {
 *       colors: ['#FF0000', '#000000'],
 *       fonts: [],
 *       voice: 'Bold and energetic',
 *       logos: []
 *     }
 *   }
 * );
 * ```
 */
export function buildImageGenerationPrompt(
  userPrompt: string,
  context: DesignContext
): string {
  const { eventType, eventDetails, products, brandAssets } = context;

  const sections: string[] = [];

  // Start with user's vision
  sections.push(userPrompt);

  // Add style specifications for merchandise
  sections.push(
    'Design style: Clean, vector-style illustration suitable for merchandise printing. ' +
    'High contrast, bold lines, limited color palette.'
  );

  // Event type and details context
  if (eventType) {
    const eventDesc = EVENT_TYPE_DESCRIPTIONS[eventType];
    let contextStr = `Context: This design is for a ${eventDesc}`;

    // Add specific event details to provide richer context
    if (eventDetails) {
      const details: string[] = [];

      if (eventDetails.name) {
        details.push(`named "${eventDetails.name}"`);
      }

      // Event-specific details
      switch (eventType) {
        case 'charity':
          if (eventDetails.cause) details.push(`focused on ${eventDetails.cause}`);
          if (eventDetails.eventType) details.push(`for a ${eventDetails.eventType}`);
          break;
        case 'sports':
          if (eventDetails.sport) details.push(`for ${eventDetails.sport}`);
          if (eventDetails.ageGroup) details.push(`${eventDetails.ageGroup} level`);
          if (eventDetails.teamLevel) details.push(`${eventDetails.teamLevel} team`);
          break;
        case 'company':
          if (eventDetails.industry) details.push(`in the ${eventDetails.industry} industry`);
          if (eventDetails.companyEventType) details.push(`for a ${eventDetails.companyEventType}`);
          break;
        case 'family':
          if (eventDetails.familyName) details.push(`for the ${eventDetails.familyName} family`);
          if (eventDetails.year) details.push(`in ${eventDetails.year}`);
          if (eventDetails.theme) details.push(`with a ${eventDetails.theme} theme`);
          break;
        case 'school':
          if (eventDetails.gradeLevel) details.push(`for ${eventDetails.gradeLevel}`);
          if (eventDetails.schoolEventType) details.push(`${eventDetails.schoolEventType}`);
          break;
      }

      if (eventDetails.targetAudience) {
        details.push(`targeting ${eventDetails.targetAudience}`);
      }

      if (eventDetails.tone) {
        details.push(`with a ${eventDetails.tone} tone`);
      }

      if (details.length > 0) {
        contextStr += ' ' + details.join(', ');
      }
    }

    sections.push(contextStr + '.');
  }

  // Product placement guidance
  if (products.length > 0) {
    const primaryProduct = PRODUCT_DESCRIPTIONS[products[0]] || products[0];
    sections.push(
      `The design will be printed ${primaryProduct}. ` +
      'Consider the placement and scale accordingly.'
    );
  }

  // Brand colors
  if (brandAssets?.colors && brandAssets.colors.length > 0) {
    sections.push(
      `Color palette: Use these brand colors: ${brandAssets.colors.join(', ')}.`
    );
  }

  // Brand voice influences design aesthetic
  if (brandAssets?.voice) {
    const voiceLower = brandAssets.voice.toLowerCase();
    sections.push(
      `Design aesthetic: The overall feel should be ${voiceLower}.`
    );
  }

  // Technical specifications for printing
  sections.push(
    'Technical requirements: ' +
    'Simple shapes that work well for screen printing or DTG (direct-to-garment) printing. ' +
    'Avoid photorealistic details, gradients, or overly complex patterns. ' +
    'White background or transparent background. ' +
    'Design should be centered and sized appropriately for apparel.'
  );

  // Output format
  sections.push(
    'Output: A single, focused design ready to be placed on merchandise. ' +
    'No mockups, no product images, just the design itself.'
  );

  return sections.join(' ');
}

/**
 * Build Refinement Prompt
 *
 * Creates a prompt for refining an existing design based on user feedback.
 * References the previous design and incorporates specific changes requested.
 *
 * @param originalPrompt - The original design prompt
 * @param feedback - User's feedback or requested changes
 * @param context - Design context
 * @returns Refined DALL-E 3 prompt
 *
 * @example
 * ```typescript
 * const prompt = buildRefinementPrompt(
 *   'A bold lion mascot',
 *   'Make the lion more fierce and add flames in the background',
 *   context
 * );
 * ```
 */
export function buildRefinementPrompt(
  originalPrompt: string,
  feedback: string,
  context: DesignContext
): string {
  const sections: string[] = [];

  sections.push(
    `Based on this design: "${originalPrompt}"`
  );

  sections.push(
    `Make these changes: ${feedback}`
  );

  // Add all the standard requirements
  const standardPrompt = buildImageGenerationPrompt(originalPrompt, context);
  const technicalParts = standardPrompt.split('Technical requirements:')[1];

  if (technicalParts) {
    sections.push('Technical requirements:' + technicalParts);
  }

  return sections.join(' ');
}

/**
 * Get Starter Prompts
 *
 * Returns contextual starter prompts based on event type.
 * These help users get started if they're not sure what to create.
 *
 * @param eventType - The type of event
 * @returns Array of starter prompt suggestions
 *
 * @example
 * ```typescript
 * const starters = getStarterPrompts('sports');
 * // Returns: ['Create a bold, athletic team logo', ...]
 * ```
 */
export function getStarterPrompts(eventType: EventType | null): string[] {
  if (!eventType) {
    return [
      'Create a modern, minimalist logo design',
      'Design something bold and eye-catching',
      'Make a fun and playful design',
    ];
  }

  const prompts: Record<EventType, string[]> = {
    charity: [
      'Create a heart-centered design for our charity event',
      'Design a compassionate logo that inspires giving',
      'Make an uplifting design that represents hope and community',
    ],
    sports: [
      'Create a bold, athletic team logo with a mascot',
      'Design a dynamic sports emblem with movement',
      'Make an energetic mascot design that shows team spirit',
    ],
    company: [
      'Create a professional corporate logo',
      'Design a modern tech company emblem',
      'Make a sophisticated business design with clean lines',
    ],
    family: [
      'Create a fun design for our family reunion',
      'Design a memorable family crest or emblem',
      'Make a celebratory design with our family name',
    ],
    school: [
      'Create a classic school crest design',
      'Design a modern university logo',
      'Make a spirited design for our class reunion',
    ],
    other: [
      'Create a modern, minimalist logo design',
      'Design something bold and eye-catching',
      'Make a fun and playful design',
    ],
  };

  return prompts[eventType];
}
