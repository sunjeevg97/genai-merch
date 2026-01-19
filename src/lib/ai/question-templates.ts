/**
 * Question Templates
 *
 * Fixed question templates for the interactive design flow.
 * Each event type has 3 predefined questions with smart input methods:
 * - Color pickers for color selection
 * - Multi-select tiles for style preferences
 * - Yes/no chips for binary choices
 *
 * These questions gather design preferences before AI generation.
 * AI may generate 0-2 additional follow-up questions for a total of 3-5 questions.
 */

import type { EventType } from '@/lib/store/design-wizard';

/**
 * Question Option
 *
 * A single selectable option for a question.
 * Used in multi-select, single-select, and style questions.
 */
export interface QuestionOption {
  /** Unique value for this option */
  value: string;

  /** Display label shown to user */
  label: string;

  /** Optional description explaining the option */
  description?: string;

  /** Lucide icon name to display with the option */
  icon?: string;

  /** Hex color code (for color-type questions) */
  color?: string;
}

/**
 * Design Question Type
 *
 * Determines which UI component to render for the question.
 */
export type QuestionType =
  | 'color'        // Color picker with predefined palettes
  | 'style'        // Single-select style tiles with icons
  | 'multi-select' // Multi-select tiles (checkboxes)
  | 'yes-no'       // Binary yes/no choice
  | 'text';        // Free-form text input (rarely used)

/**
 * Design Question
 *
 * Complete question definition including type, text, and options.
 */
export interface DesignQuestion {
  /** Unique identifier for this question */
  id: string;

  /** Question type (determines UI component) */
  type: QuestionType;

  /** Question text displayed to user */
  question: string;

  /** Available options for selection */
  options?: QuestionOption[];

  /** Whether this question must be answered */
  required: boolean;

  /** Which event types this question applies to */
  eventTypes: EventType[];

  /** Maximum number of selections (for multi-select) */
  maxSelections?: number;

  /** Placeholder text (for text-type questions) */
  placeholder?: string;
}

// =============================================================================
// Charity Event Questions
// =============================================================================

const CHARITY_QUESTIONS: DesignQuestion[] = [
  {
    id: 'charity-color-palette',
    type: 'style',
    question: 'What color mood best represents your cause?',
    required: true,
    eventTypes: ['charity'],
    options: [
      {
        value: 'warm',
        label: 'Warm & Compassionate',
        description: 'Reds, oranges, and warm tones that evoke empathy',
        icon: 'Heart',
      },
      {
        value: 'calm',
        label: 'Calm & Hopeful',
        description: 'Blues and greens that inspire peace and hope',
        icon: 'Flower2',
      },
      {
        value: 'bold',
        label: 'Bold & Urgent',
        description: 'High-contrast colors that demand attention',
        icon: 'Zap',
      },
      {
        value: 'natural',
        label: 'Natural & Earthy',
        description: 'Earth tones that connect to nature and wellness',
        icon: 'Leaf',
      },
      {
        value: 'custom',
        label: 'Let me choose specific colors',
        description: 'I have specific brand colors in mind',
        icon: 'Palette',
      },
    ],
  },
  {
    id: 'charity-imagery',
    type: 'multi-select',
    question: 'What imagery resonates with your cause?',
    required: true,
    eventTypes: ['charity'],
    maxSelections: 3,
    options: [
      {
        value: 'hearts',
        label: 'Hearts',
        description: 'Love, care, and compassion',
        icon: 'Heart',
      },
      {
        value: 'hands',
        label: 'Hands',
        description: 'Helping, support, and community',
        icon: 'Hand',
      },
      {
        value: 'community',
        label: 'People/Community',
        description: 'Together, unity, and collaboration',
        icon: 'Users',
      },
      {
        value: 'nature',
        label: 'Nature',
        description: 'Environment, growth, and life',
        icon: 'Sprout',
      },
      {
        value: 'abstract',
        label: 'Abstract Shapes',
        description: 'Modern, symbolic, and artistic',
        icon: 'Shapes',
      },
    ],
  },
  {
    id: 'charity-tone',
    type: 'multi-select',
    question: 'What emotional tone should the design convey?',
    required: true,
    eventTypes: ['charity'],
    maxSelections: 2,
    options: [
      {
        value: 'compassionate',
        label: 'Compassionate',
        description: 'Caring and empathetic',
        icon: 'HeartHandshake',
      },
      {
        value: 'urgent',
        label: 'Urgent',
        description: 'Calls to action and immediate need',
        icon: 'AlertCircle',
      },
      {
        value: 'hopeful',
        label: 'Hopeful',
        description: 'Optimistic and inspiring',
        icon: 'Sun',
      },
      {
        value: 'professional',
        label: 'Professional',
        description: 'Trustworthy and established',
        icon: 'Briefcase',
      },
    ],
  },
];

// =============================================================================
// Sports Event Questions
// =============================================================================

const SPORTS_QUESTIONS: DesignQuestion[] = [
  {
    id: 'sports-mascot',
    type: 'yes-no',
    question: 'Should the design include a mascot or animal?',
    required: true,
    eventTypes: ['sports'],
    options: [
      {
        value: 'yes',
        label: 'Yes',
        description: 'Include a mascot or animal character',
        icon: 'Check',
      },
      {
        value: 'no',
        label: 'No',
        description: 'Focus on typography and abstract elements',
        icon: 'X',
      },
    ],
  },
  {
    id: 'sports-style',
    type: 'multi-select',
    question: 'What design style appeals to your team?',
    required: true,
    eventTypes: ['sports'],
    maxSelections: 3,
    options: [
      {
        value: 'fierce',
        label: 'Fierce & Aggressive',
        description: 'Bold, intimidating, powerful',
        icon: 'Flame',
      },
      {
        value: 'dynamic',
        label: 'Dynamic & Energetic',
        description: 'Movement, speed, action',
        icon: 'Zap',
      },
      {
        value: 'strong',
        label: 'Strong & Solid',
        description: 'Strength, stability, confidence',
        icon: 'Shield',
      },
      {
        value: 'classic',
        label: 'Classic & Traditional',
        description: 'Timeless, heritage, established',
        icon: 'Crown',
      },
      {
        value: 'modern',
        label: 'Modern & Sleek',
        description: 'Contemporary, minimalist, fresh',
        icon: 'Sparkles',
      },
    ],
  },
  {
    id: 'sports-colors',
    type: 'color',
    question: 'What are your team colors?',
    required: true,
    eventTypes: ['sports'],
    maxSelections: 3,
    options: [
      { value: '#FF0000', label: 'Red', color: '#FF0000' },
      { value: '#0000FF', label: 'Blue', color: '#0000FF' },
      { value: '#000000', label: 'Black', color: '#000000' },
      { value: '#FFFFFF', label: 'White', color: '#FFFFFF' },
      { value: '#FFD700', label: 'Gold', color: '#FFD700' },
      { value: '#00FF00', label: 'Green', color: '#00FF00' },
      { value: '#FFA500', label: 'Orange', color: '#FFA500' },
      { value: '#800080', label: 'Purple', color: '#800080' },
      { value: 'custom', label: 'Custom Colors', icon: 'Palette' },
    ],
  },
];

// =============================================================================
// Company Event Questions
// =============================================================================

const COMPANY_QUESTIONS: DesignQuestion[] = [
  {
    id: 'company-professionalism',
    type: 'style',
    question: 'What level of professionalism should the design reflect?',
    required: true,
    eventTypes: ['company'],
    options: [
      {
        value: 'formal',
        label: 'Formal & Corporate',
        description: 'Traditional, serious, authoritative',
        icon: 'Briefcase',
      },
      {
        value: 'business-casual',
        label: 'Business Casual',
        description: 'Professional yet approachable',
        icon: 'UserCheck',
      },
      {
        value: 'creative',
        label: 'Creative & Innovative',
        description: 'Modern, bold, forward-thinking',
        icon: 'Lightbulb',
      },
    ],
  },
  {
    id: 'company-colors',
    type: 'color',
    question: 'What color scheme represents your brand?',
    required: true,
    eventTypes: ['company'],
    maxSelections: 3,
    options: [
      { value: '#0066CC', label: 'Corporate Blue', color: '#0066CC' },
      { value: '#333333', label: 'Professional Gray', color: '#333333' },
      { value: '#00A651', label: 'Growth Green', color: '#00A651' },
      { value: '#FF6B6B', label: 'Vibrant Red', color: '#FF6B6B' },
      { value: '#9B59B6', label: 'Creative Purple', color: '#9B59B6' },
      { value: '#000000', label: 'Monochrome', color: '#000000' },
      { value: 'custom', label: 'Brand Colors', icon: 'Palette' },
    ],
  },
  {
    id: 'company-imagery',
    type: 'multi-select',
    question: 'What visual elements should be included?',
    required: true,
    eventTypes: ['company'],
    maxSelections: 2,
    options: [
      {
        value: 'abstract',
        label: 'Abstract Shapes',
        description: 'Geometric, modern, symbolic',
        icon: 'Shapes',
      },
      {
        value: 'literal',
        label: 'Literal/Industry',
        description: 'Directly related to your business',
        icon: 'Building2',
      },
      {
        value: 'minimal',
        label: 'Minimal/Typography',
        description: 'Focus on clean text and logo',
        icon: 'Type',
      },
    ],
  },
];

// =============================================================================
// Family Event Questions
// =============================================================================

const FAMILY_QUESTIONS: DesignQuestion[] = [
  {
    id: 'family-formality',
    type: 'style',
    question: 'What is the formality level of your event?',
    required: true,
    eventTypes: ['family'],
    options: [
      {
        value: 'casual',
        label: 'Casual & Relaxed',
        description: 'Fun, informal, laid-back',
        icon: 'Smile',
      },
      {
        value: 'semi-formal',
        label: 'Semi-Formal',
        description: 'Polished yet approachable',
        icon: 'Heart',
      },
      {
        value: 'formal',
        label: 'Formal & Elegant',
        description: 'Traditional, sophisticated, classic',
        icon: 'Crown',
      },
    ],
  },
  {
    id: 'family-color-mood',
    type: 'color',
    question: 'What color mood fits your event?',
    required: true,
    eventTypes: ['family'],
    maxSelections: 3,
    options: [
      { value: '#FF6B6B', label: 'Festive Red', color: '#FF6B6B' },
      { value: '#4ECDC4', label: 'Nostalgic Teal', color: '#4ECDC4' },
      { value: '#95E1D3', label: 'Modern Mint', color: '#95E1D3' },
      { value: '#F38181', label: 'Playful Coral', color: '#F38181' },
      { value: '#AA96DA', label: 'Gentle Purple', color: '#AA96DA' },
      { value: '#FCBAD3', label: 'Cheerful Pink', color: '#FCBAD3' },
      { value: 'custom', label: 'Custom Colors', icon: 'Palette' },
    ],
  },
  {
    id: 'family-text-elements',
    type: 'multi-select',
    question: 'What text should be included in the design?',
    required: true,
    eventTypes: ['family'],
    maxSelections: 3,
    options: [
      {
        value: 'names',
        label: 'Family Name',
        description: 'Include the family surname',
        icon: 'Users',
      },
      {
        value: 'dates',
        label: 'Year/Date',
        description: 'Event year or specific date',
        icon: 'Calendar',
      },
      {
        value: 'location',
        label: 'Location',
        description: 'City, state, or venue',
        icon: 'MapPin',
      },
      {
        value: 'motto',
        label: 'Family Motto',
        description: 'Slogan or saying',
        icon: 'Quote',
      },
    ],
  },
];

// =============================================================================
// School Event Questions
// =============================================================================

const SCHOOL_QUESTIONS: DesignQuestion[] = [
  {
    id: 'school-spirit',
    type: 'style',
    question: 'What level of school spirit should the design show?',
    required: true,
    eventTypes: ['school'],
    options: [
      {
        value: 'pride',
        label: 'High School Pride',
        description: 'Bold, energetic, rally the school',
        icon: 'Flag',
      },
      {
        value: 'academic',
        label: 'Academic Focus',
        description: 'Scholarly, sophisticated, intellectual',
        icon: 'GraduationCap',
      },
      {
        value: 'casual',
        label: 'Casual & Everyday',
        description: 'Subtle, wearable, understated',
        icon: 'Shirt',
      },
    ],
  },
  {
    id: 'school-age',
    type: 'style',
    question: 'What age group is this for?',
    required: true,
    eventTypes: ['school'],
    options: [
      {
        value: 'elementary',
        label: 'Elementary',
        description: 'Playful, colorful, fun',
        icon: 'Baby',
      },
      {
        value: 'middle',
        label: 'Middle School',
        description: 'Energetic, cool, approachable',
        icon: 'Users',
      },
      {
        value: 'high',
        label: 'High School',
        description: 'Bold, confident, spirited',
        icon: 'Flame',
      },
      {
        value: 'college',
        label: 'College/University',
        description: 'Sophisticated, proud, established',
        icon: 'GraduationCap',
      },
    ],
  },
  {
    id: 'school-colors',
    type: 'color',
    question: 'What are your school colors?',
    required: true,
    eventTypes: ['school'],
    maxSelections: 3,
    options: [
      { value: '#003366', label: 'Navy Blue', color: '#003366' },
      { value: '#CC0000', label: 'Cardinal Red', color: '#CC0000' },
      { value: '#FFD700', label: 'Gold', color: '#FFD700' },
      { value: '#006633', label: 'Forest Green', color: '#006633' },
      { value: '#4B0082', label: 'Royal Purple', color: '#4B0082' },
      { value: '#000000', label: 'Black', color: '#000000' },
      { value: '#FFFFFF', label: 'White', color: '#FFFFFF' },
      { value: 'custom', label: 'Custom School Colors', icon: 'Palette' },
    ],
  },
];

// =============================================================================
// Other Event Questions
// =============================================================================

const OTHER_QUESTIONS: DesignQuestion[] = [
  {
    id: 'other-style',
    type: 'style',
    question: 'What overall style do you prefer?',
    required: true,
    eventTypes: ['other'],
    options: [
      {
        value: 'minimalist',
        label: 'Minimalist & Modern',
        description: 'Clean, simple, contemporary',
        icon: 'Minus',
      },
      {
        value: 'bold',
        label: 'Bold & Eye-Catching',
        description: 'High contrast, attention-grabbing',
        icon: 'Zap',
      },
      {
        value: 'playful',
        label: 'Fun & Playful',
        description: 'Whimsical, colorful, energetic',
        icon: 'Smile',
      },
      {
        value: 'elegant',
        label: 'Elegant & Sophisticated',
        description: 'Refined, polished, classic',
        icon: 'Crown',
      },
    ],
  },
  {
    id: 'other-colors',
    type: 'color',
    question: 'What colors should we use?',
    required: true,
    eventTypes: ['other'],
    maxSelections: 3,
    options: [
      { value: '#FF6B6B', label: 'Vibrant Red', color: '#FF6B6B' },
      { value: '#4ECDC4', label: 'Teal', color: '#4ECDC4' },
      { value: '#45B7D1', label: 'Sky Blue', color: '#45B7D1' },
      { value: '#96CEB4', label: 'Sage Green', color: '#96CEB4' },
      { value: '#FFEAA7', label: 'Sunny Yellow', color: '#FFEAA7' },
      { value: '#DDA15E', label: 'Warm Brown', color: '#DDA15E' },
      { value: '#000000', label: 'Black', color: '#000000' },
      { value: 'custom', label: 'Custom Colors', icon: 'Palette' },
    ],
  },
  {
    id: 'other-imagery',
    type: 'multi-select',
    question: 'What type of imagery should be included?',
    required: true,
    eventTypes: ['other'],
    maxSelections: 2,
    options: [
      {
        value: 'abstract',
        label: 'Abstract Shapes',
        description: 'Geometric, modern, symbolic',
        icon: 'Shapes',
      },
      {
        value: 'nature',
        label: 'Nature Elements',
        description: 'Plants, animals, landscapes',
        icon: 'Leaf',
      },
      {
        value: 'symbols',
        label: 'Symbols/Icons',
        description: 'Meaningful symbols and icons',
        icon: 'Star',
      },
      {
        value: 'typography',
        label: 'Typography Only',
        description: 'Focus on text and letters',
        icon: 'Type',
      },
    ],
  },
];

// =============================================================================
// Question Template Map
// =============================================================================

/**
 * Question Templates by Event Type
 *
 * Maps each event type to its fixed question set.
 * Questions are shown in sequence during the interactive flow.
 */
export const QUESTION_TEMPLATES: Record<EventType, DesignQuestion[]> = {
  charity: CHARITY_QUESTIONS,
  sports: SPORTS_QUESTIONS,
  company: COMPANY_QUESTIONS,
  family: FAMILY_QUESTIONS,
  school: SCHOOL_QUESTIONS,
  other: OTHER_QUESTIONS,
};

/**
 * Get Fixed Questions for Event Type
 *
 * Returns the array of fixed questions for a specific event type.
 *
 * @param eventType - The event type
 * @returns Array of design questions
 *
 * @example
 * ```typescript
 * const questions = getFixedQuestions('sports');
 * console.log(questions.length); // 5
 * ```
 */
export function getFixedQuestions(eventType: EventType): DesignQuestion[] {
  return QUESTION_TEMPLATES[eventType] || [];
}

/**
 * Get Total Question Count
 *
 * Returns the number of fixed questions for an event type.
 * Does not include AI-generated follow-ups.
 *
 * @param eventType - The event type
 * @returns Number of fixed questions
 */
export function getFixedQuestionCount(eventType: EventType): number {
  return getFixedQuestions(eventType).length;
}
