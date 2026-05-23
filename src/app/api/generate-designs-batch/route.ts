/**
 * Batch Design Generation API
 *
 * Generates 4 designs in parallel using Google Gemini. Variety strategy is
 * mode-aware:
 *
 *   same-preset  → 1 presetId × 4 seeds. All 4 generations use the same
 *                  STYLE/PALETTE prompt; Gemini's inherent stochasticity
 *                  produces 4 distinct images. Seeds are tracking tokens.
 *
 *   mix-presets  → 4 presetIds × 1 seed each. Each generation uses a
 *                  different preset (3 event-type defaults + wildcard if
 *                  the event type only maps to 3). Variety comes from
 *                  cross-style comparison rather than within-style variance.
 *
 * Backward compatibility: callers may send `varietyMode` (preferred) or the
 * legacy `varietyLevel` ('variations' | 'different-concepts'). Internally we
 * normalize to varietyMode.
 *
 * POST /api/generate-designs-batch
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildImageGenerationPromptFromAnswers } from "@/lib/ai/prompts";
import { getGoogleAI, DEFAULT_IMAGE_MODEL } from "@/lib/google-ai/client";
import { randomUUID } from "node:crypto";
import {
  getPresetDefaultsForEventType,
  WILDCARD_PRESET_ID,
} from "@/lib/ai/style-presets";
import type {
  EventType,
  EventDetails,
  BrandAssets,
  QuestionAnswer,
} from "@/lib/store/design-wizard";

const requestSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      question: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      answeredAt: z.string().transform((val) => new Date(val)),
    })
  ),
  eventType: z.enum([
    "charity",
    "sports",
    "company",
    "family",
    "school",
    "other",
  ]),
  eventDetails: z.record(z.string(), z.any()),
  brandAssets: z
    .object({
      colors: z.array(z.string()),
    })
    .optional(),
  selectedProducts: z.array(z.string()).optional().default([]),
  // varietyMode is the canonical field as of Phase 3. varietyLevel is the
  // legacy field, still accepted for backward compatibility; varietyMode
  // wins when both are present.
  varietyMode: z.enum(["same-preset", "mix-presets"]).optional(),
  varietyLevel: z.enum(["variations", "different-concepts"]).optional(),
  count: z.number().min(1).max(4).optional().default(4),
  presetId: z.string().optional(),
});

// Rate limiting (in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || userLimit.resetAt < now) {
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  userLimit.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

/**
 * Resolves the canonical varietyMode from the request body.
 * Maps legacy varietyLevel to the new enum if varietyMode is absent.
 */
function resolveVarietyMode(input: {
  varietyMode?: "same-preset" | "mix-presets";
  varietyLevel?: "variations" | "different-concepts";
}): "same-preset" | "mix-presets" {
  if (input.varietyMode) return input.varietyMode;
  if (input.varietyLevel === "different-concepts") return "mix-presets";
  return "same-preset"; // default
}

/**
 * Builds the list of (presetId, seed) pairs for the requested mode.
 *
 *   same-preset → one preset, N distinct seeds
 *   mix-presets → N distinct presets from the event-type defaults,
 *                 each with its own seed. Wildcard fills the 4th slot
 *                 if the event type only maps to 3 defaults.
 */
function buildGenerationPlan(input: {
  mode: "same-preset" | "mix-presets";
  eventType: EventType;
  presetId: string | undefined;
  count: number;
}): Array<{ presetId: string; seed: string }> {
  const { mode, eventType, presetId, count } = input;

  if (mode === "same-preset") {
    const resolvedPreset =
      presetId ?? getPresetDefaultsForEventType(eventType)[0];
    return Array.from({ length: count }, () => ({
      presetId: resolvedPreset,
      seed: randomUUID(),
    }));
  }

  // mix-presets: assemble a list of distinct presetIds from the event-type
  // defaults, padding with the wildcard if we don't have enough.
  const eventDefaults = getPresetDefaultsForEventType(eventType);
  const presetPool: string[] = [...eventDefaults];
  while (presetPool.length < count) {
    if (!presetPool.includes(WILDCARD_PRESET_ID)) {
      presetPool.push(WILDCARD_PRESET_ID);
    } else {
      // The wildcard is already in the list (rare — only when wildcard is
      // ALSO a default for this event type). Pad with the first default
      // repeated; the user-visible variety is still high.
      presetPool.push(eventDefaults[0]);
    }
  }

  return presetPool.slice(0, count).map((id) => ({
    presetId: id,
    seed: randomUUID(),
  }));
}

function getMostCommonErrorType(failedDesigns: any[]): string {
  const errorTypes = failedDesigns.map((d) => d.errorType);
  const typeCounts = errorTypes.reduce(
    (acc: any, type: string) => {
      const count = errorTypes.filter((t) => t === type).length;
      return count > (acc.count || 0) ? { type, count } : acc;
    },
    { type: "UNKNOWN_ERROR", count: 0 }
  );
  return typeCounts.type;
}

function getUserMessage(errorType: string): string {
  const messages: Record<string, string> = {
    RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
    AUTH_ERROR: "Authentication error. Please contact support.",
    CONTENT_POLICY:
      "Your design request may violate content guidelines. Please try a different description.",
    TIMEOUT: "Request timed out. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
    CONFIGURATION_ERROR: "Service not configured. Please contact support.",
  };
  return messages[errorType] || "Failed to generate designs. Please try again.";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      answers,
      eventType,
      eventDetails,
      brandAssets,
      selectedProducts,
      varietyMode,
      varietyLevel,
      count,
      presetId,
    } = validation.data;

    const googleApiKey = process.env.GOOGLE_AI_API_KEY;
    if (!googleApiKey) {
      console.error("[Batch Generation] GOOGLE_AI_API_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Service not configured",
          message:
            "AI design generation is not available. Please contact support.",
          errorType: "CONFIGURATION_ERROR",
          canRetry: false,
        },
        { status: 500 }
      );
    }

    const effectiveMode = resolveVarietyMode({ varietyMode, varietyLevel });

    // TODO: Get authenticated user ID (placeholder for now)
    const userId = "anonymous";

    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "Maximum 10 batch generations per hour. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Build the (presetId, seed) plan that drives parallel generation.
    const plan = buildGenerationPlan({
      mode: effectiveMode,
      eventType: eventType as EventType,
      presetId,
      count,
    });

    console.log("[Batch Generation] Request:", {
      userId,
      eventType,
      effectiveMode,
      explicitPresetId: presetId ?? "(default by event type)",
      answersCount: answers.length,
      selectedProducts: selectedProducts.length,
      count,
      plan: plan.map((p) => p.presetId),
      remaining: rateLimit.remaining,
    });

    console.log(
      "[Batch Generation] Generating",
      count,
      "designs in parallel..."
    );

    const startTime = Date.now();
    const generationPromises = plan.map(async (entry, index) => {
      const { presetId: slotPresetId, seed } = entry;
      try {
        console.log(
          `[Batch Generation] Design ${index + 1}/${count} (preset: ${slotPresetId})...`
        );

        // Build prompt per-slot — in mix-presets mode each call has its own
        // STYLE/PALETTE because presetId differs; in same-preset mode all 4
        // calls receive the same prompt and variety comes from Gemini's
        // stochasticity across parallel runs.
        const prompt = buildImageGenerationPromptFromAnswers(
          {
            eventType: eventType as EventType,
            eventDetails: eventDetails as EventDetails,
            products: selectedProducts,
            brandAssets: brandAssets as BrandAssets | undefined,
          },
          answers as QuestionAnswer[],
          // Legacy varietyLevel param is ignored inside the function; pass
          // the canonical mapping anyway for log-trace continuity.
          effectiveMode === "mix-presets"
            ? "different-concepts"
            : "variations",
          slotPresetId
        );

        const googleAI = getGoogleAI();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await googleAI.models.generateContent({
          model: DEFAULT_IMAGE_MODEL,
          contents: prompt,
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: {
              aspectRatio: "1:1",
            },
          },
        });

        clearTimeout(timeoutId);

        if (!response.candidates?.[0]?.content?.parts?.[0]) {
          throw new Error("No image generated in response");
        }

        const imagePart = response.candidates[0].content.parts[0];
        if (!imagePart.inlineData || !imagePart.inlineData.data) {
          throw new Error("No image data in response");
        }

        const imageBase64 = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType || "image/png";
        const imageUrl = `data:${mimeType};base64,${imageBase64}`;

        console.log(`[Batch Generation] Design ${index + 1} complete`);

        return {
          id: `design-${Date.now()}-${index}`,
          imageUrl,
          prompt,
          mimeType,
          success: true,
          metadata: {
            index: index + 1,
            varietyMode: effectiveMode,
            eventType,
            presetId: slotPresetId,
            seed,
            generatedAt: new Date().toISOString(),
            model: DEFAULT_IMAGE_MODEL,
          },
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown";
        let errorType = "UNKNOWN_ERROR";
        if (errorMessage.includes("RATE_LIMIT")) errorType = "RATE_LIMIT";
        else if (errorMessage.includes("AUTH_ERROR")) errorType = "AUTH_ERROR";
        else if (errorMessage.includes("CONTENT_POLICY"))
          errorType = "CONTENT_POLICY";
        else if (errorMessage.includes("timeout")) errorType = "TIMEOUT";

        console.error(`[Batch Generation] Design ${index + 1} error:`, {
          errorType,
          message: errorMessage,
          presetId: slotPresetId,
        });

        return {
          id: `design-error-${index}`,
          imageUrl: "",
          prompt: "",
          success: false,
          error: errorMessage,
          errorType,
          metadata: {
            index: index + 1,
            varietyMode: effectiveMode,
            eventType,
            presetId: slotPresetId,
            seed,
            generatedAt: new Date().toISOString(),
            failed: true,
          },
        };
      }
    });

    const designs = await Promise.all(generationPromises);
    const duration = Date.now() - startTime;

    const successfulDesigns = designs.filter((d) => d.success && d.imageUrl);
    const failedDesigns = designs.filter((d) => !d.success);

    console.log("[Batch Generation] Complete:", {
      total: designs.length,
      successful: successfulDesigns.length,
      failed: failedDesigns.length,
      duration: `${duration}ms`,
      errors: failedDesigns.map((d) => ({
        index: d.metadata.index,
        type: d.errorType,
      })),
    });

    // CASE 1: All succeeded (200 OK)
    if (failedDesigns.length === 0) {
      return NextResponse.json(
        {
          success: true,
          designs: successfulDesigns,
          metadata: {
            total: designs.length,
            successful: successfulDesigns.length,
            failed: 0,
            duration,
            varietyMode: effectiveMode,
            plan: plan.map((p) => ({
              presetId: p.presetId,
              seed: p.seed,
            })),
            remaining: rateLimit.remaining,
          },
        },
        {
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    // CASE 2: Partial success (207 Multi-Status)
    if (successfulDesigns.length > 0) {
      return NextResponse.json(
        {
          success: "partial",
          designs: successfulDesigns,
          errors: failedDesigns.map((d) => ({
            index: d.metadata.index,
            errorType: d.errorType,
            message: d.error,
          })),
          metadata: {
            total: designs.length,
            successful: successfulDesigns.length,
            failed: failedDesigns.length,
            duration,
            varietyMode: effectiveMode,
            plan: plan.map((p) => ({
              presetId: p.presetId,
              seed: p.seed,
            })),
            remaining: rateLimit.remaining,
          },
        },
        {
          status: 207,
          headers: {
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        }
      );
    }

    // CASE 3: Total failure (500)
    const primaryErrorType = getMostCommonErrorType(failedDesigns);
    const userMessage = getUserMessage(primaryErrorType);
    const canRetry =
      primaryErrorType !== "AUTH_ERROR" &&
      primaryErrorType !== "CONFIGURATION_ERROR";

    return NextResponse.json(
      {
        success: false,
        error: "All design generations failed",
        message: userMessage,
        errorType: primaryErrorType,
        canRetry,
        errors: failedDesigns.map((d) => ({
          index: d.metadata.index,
          errorType: d.errorType,
          message: d.error,
        })),
        metadata: {
          total: designs.length,
          successful: 0,
          failed: failedDesigns.length,
          duration,
          varietyMode: effectiveMode,
          plan: plan.map((p) => ({ presetId: p.presetId, seed: p.seed })),
          remaining: rateLimit.remaining,
        },
      },
      {
        status: 500,
        headers: {
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    console.error("[Batch Generation] Server error:", error);

    return NextResponse.json(
      {
        error: "Batch generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
