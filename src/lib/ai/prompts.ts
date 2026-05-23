/**
 * AI Prompt Templates
 *
 * Two distinct concerns live here:
 *
 *   1. Chat assistance prompts (buildChatSystemPrompt, buildRefinementPrompt,
 *      getStarterPrompts) — conversational guidance via GPT-4. Untouched by
 *      the style-preset overhaul.
 *
 *   2. Image-gen prompts (assembleImageGenPrompt + the two legacy wrappers
 *      buildImageGenerationPrompt and buildImageGenerationPromptFromAnswers)
 *      — produce the prompt passed to Gemini Imagen. As of the preset
 *      overhaul, these are deterministic template assemblers that anchor
 *      output to a chosen StylePreset rather than smoothing toward the
 *      "platonic merch average."
 *
 * The hardcoded "clean vector / no gradients / simple shapes for screen
 * printing" language that previously produced generic output has been
 * removed. Lineage anchoring lives in the StylePreset.promptFragment field.
 */

import type {
  EventType,
  EventDetails,
  BrandAssets,
  QuestionAnswer,
} from "@/lib/store/design-wizard";
import {
  getPreset,
  getPresetDefaultsForEventType,
  UNIVERSAL_NEGATIVES,
  type StylePreset,
} from "@/lib/ai/style-presets";

/**
 * Design Context
 *
 * All context needed to build AI prompts.
 */
export interface DesignContext {
  eventType: EventType | null;
  eventDetails?: EventDetails;
  products: string[];
  brandAssets?: BrandAssets;
}

/**
 * Event Type Descriptions
 *
 * Human-readable descriptions for each event type. Used by the chat system
 * prompt and by subject construction in buildImageGenerationPromptFromAnswers.
 */
const EVENT_TYPE_DESCRIPTIONS: Record<EventType, string> = {
  charity: "charity event, fundraiser, or non-profit organization",
  sports: "sports team, tournament, league, or athletic event",
  company:
    "corporate event, company branding, team building, or business conference",
  family: "family reunion, gathering, celebration, or family event",
  school: "school event, university, graduation, or educational institution",
  other: "special event or custom occasion",
};

/**
 * Product Type Descriptions
 *
 * Descriptions for how designs should appear on each product. Used by the
 * chat system prompt only — image-gen prompts intentionally leave product
 * placement to the assembler's COMPOSITION section, which is product-agnostic
 * (designs are generated as standalone artwork, not laid out on a product).
 */
const PRODUCT_DESCRIPTIONS: Record<string, string> = {
  tshirt: "centered on the front of a t-shirt",
  sweatshirt: "centered on the front of a sweatshirt",
  hoodie: "centered on the front of a hoodie",
  mug: "wrapping around a coffee mug",
  pen: "along the barrel of a pen",
  sticker: "as a die-cut sticker",
  tote: "centered on a tote bag",
  hat: "on the front panel of a baseball cap",
};

// ============================================================================
// Chat / Refinement / Starter prompts (unchanged by the preset overhaul)
// ============================================================================

/**
 * Build Chat System Prompt
 *
 * Creates a system prompt for GPT-4 to act as a design assistant.
 */
export function buildChatSystemPrompt(context: DesignContext): string {
  const { eventType, eventDetails, products, brandAssets } = context;
  const sections: string[] = [];

  sections.push(
    "You are an expert design assistant helping users create custom merchandise designs. " +
      "Your role is to guide users through describing their design vision by asking thoughtful questions, " +
      "offering creative suggestions, and helping them refine their ideas."
  );

  if (eventType) {
    const eventDesc = EVENT_TYPE_DESCRIPTIONS[eventType];
    let contextStr = `\n\nCONTEXT: The user is creating designs for a ${eventDesc}`;

    if (eventDetails) {
      const details: string[] = [];
      if (eventDetails.name) details.push(`called "${eventDetails.name}"`);
      if (eventType === "charity" && eventDetails.cause) {
        details.push(`supporting ${eventDetails.cause}`);
      } else if (eventType === "sports" && eventDetails.sport) {
        details.push(`for ${eventDetails.sport}`);
        if (eventDetails.ageGroup)
          details.push(`at ${eventDetails.ageGroup} level`);
      } else if (eventType === "company" && eventDetails.industry) {
        details.push(`in ${eventDetails.industry}`);
      } else if (eventType === "family" && eventDetails.familyName) {
        details.push(`for the ${eventDetails.familyName} family`);
      } else if (eventType === "school" && eventDetails.gradeLevel) {
        details.push(`for ${eventDetails.gradeLevel}`);
      }
      if (details.length > 0) contextStr += " " + details.join(", ");
      if (eventDetails.description) {
        contextStr += `. Additional context: ${eventDetails.description}`;
      }
    }

    contextStr +=
      ". Keep this context in mind when suggesting design ideas and asking questions.";
    sections.push(contextStr);
  }

  if (products.length > 0) {
    const productList = products
      .map((p) => PRODUCT_DESCRIPTIONS[p] || p)
      .join(", ");
    sections.push(
      `\n\nPRODUCTS: The designs will be applied to: ${productList}. ` +
        "Consider how the design will look on these specific products when making suggestions."
    );
  }

  if (brandAssets?.colors && brandAssets.colors.length > 0) {
    sections.push(
      `\n\nBRAND COLORS: The user has provided brand colors: ${brandAssets.colors.join(
        ", "
      )}. ` +
        "Incorporate these colors into your design suggestions when appropriate."
    );
  }

  sections.push(
    "\n\nGUIDELINES:\n" +
      "- Ask clarifying questions to understand the user's vision\n" +
      "- Suggest specific design elements (colors, imagery, text, style)\n" +
      "- Consider the target audience and purpose\n" +
      "- Be creative and enthusiastic, but also practical\n" +
      "- Keep responses concise and actionable\n" +
      "- When the user describes their vision, help them refine it into a clear design brief"
  );

  sections.push(
    "\n\nIMPORTANT: You are NOT generating the actual design - you are helping the user describe " +
      "what they want so that the image model can generate it. Focus on gathering details about subject, " +
      "imagery, text, and overall aesthetic."
  );

  return sections.join("");
}

/**
 * Get Starter Prompts
 *
 * Returns contextual starter prompts based on event type.
 */
export function getStarterPrompts(eventType: EventType | null): string[] {
  if (!eventType) {
    return [
      "Create a modern, minimalist logo design",
      "Design something bold and eye-catching",
      "Make a fun and playful design",
    ];
  }

  const prompts: Record<EventType, string[]> = {
    charity: [
      "Create a heart-centered design for our charity event",
      "Design a compassionate logo that inspires giving",
      "Make an uplifting design that represents hope and community",
    ],
    sports: [
      "Create a bold, athletic team logo with a mascot",
      "Design a dynamic sports emblem with movement",
      "Make an energetic mascot design that shows team spirit",
    ],
    company: [
      "Create a professional corporate logo",
      "Design a modern tech company emblem",
      "Make a sophisticated business design with clean lines",
    ],
    family: [
      "Create a fun design for our family reunion",
      "Design a memorable family crest or emblem",
      "Make a celebratory design with our family name",
    ],
    school: [
      "Create a classic school crest design",
      "Design a modern university logo",
      "Make a spirited design for our class reunion",
    ],
    other: [
      "Create a modern, minimalist logo design",
      "Design something bold and eye-catching",
      "Make a fun and playful design",
    ],
  };

  return prompts[eventType];
}

// ============================================================================
// Image generation: deterministic template assembler
// ============================================================================

/**
 * Input to the canonical image-gen prompt assembler.
 *
 * Callers compute `subject` (the user's described visual idea) and resolve
 * a `presetId` before invoking this. The assembler is intentionally simple
 * and stateless — every decision is made by the inputs, no LLM smoothing,
 * no fuzzy heuristics.
 */
export interface AssembleImageGenInput {
  /**
   * Natural-language description of WHAT to draw. Should describe the
   * subject only — no style language, no technical constraints, no
   * negatives. The assembler injects all of that based on presetId.
   */
  subject: string;
  /**
   * StylePreset.id from src/lib/ai/style-presets.ts. The chosen preset
   * supplies the STYLE: line, the PALETTE: guidance, and specific
   * negatives. Unknown ids safely fall back to the wildcard preset.
   */
  presetId: string;
  /**
   * User-supplied brand colors. The PALETTE: line's behavior depends on
   * how these interact with the preset's paletteStrategy — see
   * composePaletteGuidance().
   */
  brandColors?: string[];
}

/**
 * Assembles a deterministic image-gen prompt from a subject + preset.
 *
 * Output structure (each section on its own line):
 *
 *   SUBJECT: <what to draw>
 *   STYLE: <preset.promptFragment>
 *   COMPOSITION: <fixed apparel-friendly composition rule>
 *   PALETTE: <derived from preset + brandColors>
 *   AVOID: <UNIVERSAL_NEGATIVES + preset.specificNegatives>
 *
 * The COMPOSITION line is the only constraint that's always-on regardless of
 * preset — every preset still needs to produce a centered, isolated piece
 * of apparel artwork on a clean background. Print-method-specific rules
 * ("no gradients," "screen-print-only") are NOT global; they belong inside
 * preset fragments when a specific preset requires them.
 */
export function assembleImageGenPrompt(input: AssembleImageGenInput): string {
  const preset = getPreset(input.presetId);
  const sections: string[] = [];

  sections.push(`SUBJECT: ${input.subject.trim()}`);
  sections.push(`STYLE: ${preset.promptFragment}`);

  sections.push(
    "COMPOSITION: Single centered subject, sized for apparel placement, " +
      "isolated on pure white background, no shadows, no surrounding scene."
  );

  sections.push(
    `PALETTE: ${composePaletteGuidance(preset, input.brandColors)}`
  );

  const allNegatives = [UNIVERSAL_NEGATIVES, preset.specificNegatives]
    .filter((s) => s && s.trim().length > 0)
    .join(", ");
  sections.push(`AVOID: ${allNegatives}.`);

  return sections.join("\n\n");
}

/**
 * Composes the body of the PALETTE: line in the assembled prompt.
 *
 * Per the user's spec, three cases:
 *
 *   1. preset.paletteStrategy === "fixed" — the preset's palette is
 *      non-negotiable (e.g., Sailor Jerry tattoo flash). Use
 *      preset.paletteHints as the palette rule. If brand colors are
 *      present, demote them to small accent placement only.
 *
 *   2. brandColors present AND strategy !== "fixed" — user brand colors
 *      lead. Integrate the listed brandColors naturally; don't force
 *      every color into the image. paletteHints (if present) is
 *      supplementary context, not a hard constraint.
 *
 *   3. Neither (no brand colors, non-fixed preset) — preset.paletteHints
 *      drives. Fall back to a neutral apparel-friendly instruction if
 *      paletteHints is empty.
 *
 * Return the BODY text only — the assembler prefixes "PALETTE: ".
 */
function composePaletteGuidance(
  preset: StylePreset,
  brandColors: string[] | undefined
): string {
  const hasBrandColors = !!(brandColors && brandColors.length > 0);
  const hints =
    preset.paletteHints ??
    "limited apparel-friendly palette appropriate to the chosen style";

  // Branch 1: preset palette is locked. Brand colors (if any) get demoted to
  // small accent placement only — never primary fills, never outlines.
  if (preset.paletteStrategy === "fixed") {
    if (hasBrandColors) {
      return (
        `${hints}. These are the only permitted major hues. ` +
        `Brand colors (${brandColors!.join(", ")}) may appear ONLY as ` +
        `small accent placement — never as primary fills, outlines, or ` +
        `dominant shapes.`
      );
    }
    return `${hints}. Use no other hues.`;
  }

  // Branch 2: brand colors lead. The model will otherwise try to use every
  // color in the array, which produces busy compositions — the "do not
  // force" clause is doing real work here.
  if (hasBrandColors) {
    const supplementary = preset.paletteHints
      ? ` Style cue for mood (not a hard rule): ${preset.paletteHints}.`
      : "";
    return (
      `Lead with the user's brand palette: ${brandColors!.join(", ")}. ` +
      `Use these as the primary hues, but do not force every color into ` +
      `the composition — restrained selection beats inclusivity.${supplementary}`
    );
  }

  // Branch 3: preset suggests, nothing forces. paletteHints already reads as
  // an imperative statement in every defined preset, so we pass it through.
  return `${hints}.`;
}

// ============================================================================
// Legacy image-gen wrappers (route through assembleImageGenPrompt)
// ============================================================================

/**
 * Resolves an explicit presetId or falls back to the event-type default.
 *
 * Called by the two legacy wrappers when the caller didn't supply a presetId.
 * Phase 2 will plumb selectedPresetId through every call site, after which
 * the fallback only fires for genuinely unmapped event types.
 */
function resolvePresetId(
  explicit: string | undefined,
  eventType: EventType | null
): string {
  if (explicit) return explicit;
  return getPresetDefaultsForEventType(eventType)[0];
}

/**
 * Build Image Generation Prompt
 *
 * Wraps assembleImageGenPrompt for the single-design /api/generate-design
 * route. The user's free-text prompt becomes the SUBJECT; the presetId is
 * explicit or falls back to the event-type default.
 *
 * Note: this function previously injected hardcoded "vector-style / no
 * gradients / simple shapes for screen printing" language that drove the
 * generic merch aesthetic. That language is gone — style now comes
 * exclusively from the chosen preset.
 */
export function buildImageGenerationPrompt(
  userPrompt: string,
  context: DesignContext,
  presetId?: string
): string {
  const presetIdToUse = resolvePresetId(presetId, context.eventType);
  return assembleImageGenPrompt({
    subject: userPrompt,
    presetId: presetIdToUse,
    brandColors: context.brandAssets?.colors,
  });
}

/**
 * Build Refinement Prompt
 *
 * Creates a prompt for refining an existing design based on user feedback.
 * Routed through assembleImageGenPrompt so the refinement output respects
 * the same preset lineage as the original.
 */
export function buildRefinementPrompt(
  originalPrompt: string,
  feedback: string,
  context: DesignContext,
  presetId?: string
): string {
  const subject = `${originalPrompt}. Refine with these changes: ${feedback}`;
  const presetIdToUse = resolvePresetId(presetId, context.eventType);
  return assembleImageGenPrompt({
    subject,
    presetId: presetIdToUse,
    brandColors: context.brandAssets?.colors,
  });
}

/**
 * Build Image Generation Prompt from Question Answers
 *
 * Wraps assembleImageGenPrompt for the batch /api/generate-designs-batch
 * route. Converts the questionnaire answer set into a natural-language
 * subject string, then hands off to the assembler.
 *
 * varietyLevel is accepted for signature compatibility with the existing
 * batch route, but is intentionally NOT consumed here — variety is the
 * batch route's responsibility (different seeds or different presets per
 * slot). The previous in-function variety modulation has been removed
 * because it double-counted with the route's own buildVarietyPrompts call.
 */
export function buildImageGenerationPromptFromAnswers(
  context: DesignContext,
  answers: QuestionAnswer[],
  _varietyLevel: "variations" | "different-concepts",
  presetId?: string
): string {
  const subject = subjectFromAnswers(context, answers);
  const presetIdToUse = resolvePresetId(presetId, context.eventType);
  return assembleImageGenPrompt({
    subject,
    presetId: presetIdToUse,
    brandColors: context.brandAssets?.colors,
  });
}

/**
 * Distills a QuestionAnswer[] set into a natural-language SUBJECT string.
 *
 * No style language, no palette decisions, no technical constraints — those
 * are the assembler's job. This helper only describes the *subject of the
 * artwork*: what to draw, what mood, who it's for. Color answers are
 * included here only as user-stated subject preferences; the assembler's
 * PALETTE: section reconciles them with the preset's palette strategy
 * separately via brandColors.
 */
function subjectFromAnswers(
  context: DesignContext,
  answers: QuestionAnswer[]
): string {
  const { eventType, eventDetails } = context;
  const parts: string[] = [];

  // Group answers by category.
  const styleAnswers = answers.filter(
    (a) =>
      a.questionId.includes("style") ||
      a.questionId.includes("tone") ||
      a.questionId.includes("aesthetic")
  );
  const imageryAnswers = answers.filter(
    (a) =>
      a.questionId.includes("imagery") ||
      a.questionId.includes("mascot") ||
      a.questionId.includes("representation")
  );
  const textAnswers = answers.filter(
    (a) =>
      a.questionId.includes("text") ||
      a.questionId.includes("prominence") ||
      a.questionId.includes("focus")
  );
  const colorAnswers = answers.filter((a) => a.questionId.includes("color"));

  // Style descriptors as adjectives describing the subject's feel.
  if (styleAnswers.length > 0) {
    const styleWords: string[] = [];
    for (const a of styleAnswers) {
      if (Array.isArray(a.answer)) styleWords.push(...a.answer);
      else styleWords.push(a.answer);
    }
    if (styleWords.length > 0) {
      parts.push(`A ${styleWords.join(", ")} design.`);
    }
  }

  // Imagery — what's in the picture.
  if (imageryAnswers.length > 0) {
    const imageryParts: string[] = [];
    for (const a of imageryAnswers) {
      if (a.questionId.includes("mascot") && a.answer === "yes") {
        imageryParts.push("Includes a mascot or character element");
      } else if (Array.isArray(a.answer)) {
        imageryParts.push(`Imagery: ${a.answer.join(", ")}`);
      } else if (typeof a.answer === "string") {
        imageryParts.push(`Imagery: ${a.answer}`);
      }
    }
    if (imageryParts.length > 0) {
      parts.push(imageryParts.join(". ") + ".");
    }
  }

  // Text / typography intent.
  if (textAnswers.length > 0) {
    const textParts: string[] = [];
    for (const a of textAnswers) {
      if (a.questionId.includes("prominence")) {
        textParts.push(`Text prominence: ${a.answer}`);
      } else if (Array.isArray(a.answer)) {
        textParts.push(`Include text elements: ${a.answer.join(", ")}`);
      }
    }
    if (textParts.length > 0) {
      parts.push(textParts.join(". ") + ".");
    }
  }

  // User-stated color preferences as subject context (the PALETTE: section
  // owns the actual palette rule — this is just describing what the user said).
  if (colorAnswers.length > 0) {
    const colors: string[] = [];
    for (const a of colorAnswers) {
      if (Array.isArray(a.answer)) colors.push(...a.answer);
      else if (typeof a.answer === "string") colors.push(a.answer);
    }
    if (colors.length > 0) {
      parts.push(`Color cues mentioned by the user: ${colors.join(", ")}.`);
    }
  }

  // Event-type framing.
  if (eventType) {
    const eventDesc = EVENT_TYPE_DESCRIPTIONS[eventType];
    let contextStr = `For a ${eventDesc}`;
    if (eventDetails) {
      const details: string[] = [];
      if (eventDetails.name) details.push(`named "${eventDetails.name}"`);

      switch (eventType) {
        case "charity":
          if (eventDetails.cause)
            details.push(`supporting ${eventDetails.cause}`);
          if (eventDetails.eventType)
            details.push(`for a ${eventDetails.eventType}`);
          break;
        case "sports":
          if (eventDetails.sport) details.push(`for ${eventDetails.sport}`);
          if (eventDetails.ageGroup)
            details.push(`${eventDetails.ageGroup} age group`);
          if (eventDetails.teamLevel)
            details.push(`${eventDetails.teamLevel} level`);
          break;
        case "company":
          if (eventDetails.industry)
            details.push(`${eventDetails.industry} industry`);
          if (eventDetails.companyEventType)
            details.push(`for a ${eventDetails.companyEventType}`);
          break;
        case "family":
          if (eventDetails.familyName)
            details.push(`${eventDetails.familyName} family`);
          if (eventDetails.year) details.push(`year ${eventDetails.year}`);
          if (eventDetails.location)
            details.push(`location: ${eventDetails.location}`);
          if (eventDetails.theme) details.push(`theme: ${eventDetails.theme}`);
          break;
        case "school":
          if (eventDetails.gradeLevel)
            details.push(`${eventDetails.gradeLevel}`);
          if (eventDetails.schoolEventType)
            details.push(`${eventDetails.schoolEventType}`);
          if (eventDetails.year) details.push(`class of ${eventDetails.year}`);
          break;
        case "other":
          break;
      }

      if (eventDetails.targetAudience) {
        details.push(`audience: ${eventDetails.targetAudience}`);
      }
      if (eventDetails.description) {
        details.push(`additional context: ${eventDetails.description}`);
      }

      if (details.length > 0) {
        contextStr += " (" + details.join(", ") + ")";
      }
    }
    parts.push(contextStr + ".");
  }

  // Fallback if the questionnaire produced nothing usable.
  if (parts.length === 0) {
    parts.push("A custom design for the user's event.");
  }

  return parts.join(" ");
}
