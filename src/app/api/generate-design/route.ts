/**
 * Google Gemini Image Design Generation API Route
 *
 * POST /api/generate-design
 *
 * Single-design generation flow. As of the style-preset overhaul, this route
 * generates designs in a single step:
 *
 *   1. Assemble a deterministic, preset-anchored prompt (no LLM refinement).
 *   2. Send to Google Gemini for image generation.
 *   3. Upload result to Supabase Storage; create Design DB record.
 *
 * The previous GPT-4o-mini refinement step was removed because it smoothed
 * carefully-tuned preset language toward statistical averages — exactly the
 * "generic merch aesthetic" the overhaul targets.
 */

import { NextRequest } from "next/server";
import { getGoogleAI, DEFAULT_IMAGE_MODEL } from "@/lib/google-ai/client";
import { z } from "zod";
import {
  buildImageGenerationPrompt,
  type DesignContext,
} from "@/lib/ai/prompts";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseUser } from "@/lib/clerk/server";
import { uploadGeneratedDesign } from "@/lib/supabase/storage-server";
import type { EventType } from "@/lib/store/design-wizard";

/**
 * Rate Limiting
 *
 * Simple in-memory rate limiter (10 generations per hour per user).
 * TODO: Replace with Redis-based rate limiting in production.
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

/**
 * Request Validation Schema
 *
 * The eventType enum carries legacy values ("fundraiser", "personal") for
 * backward compatibility with older clients. The assembler handles unknown
 * eventType values by falling through to the wildcard preset, so these are
 * safe to keep listed.
 */
const generateDesignRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(1000, "Prompt is too long"),
  presetId: z.string().optional(),
  eventType: z
    .enum(["charity", "fundraiser", "company", "sports", "school", "personal"])
    .nullable()
    .optional(),
  products: z.array(z.string()).optional().default([]),
  brandAssets: z
    .object({
      colors: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

type GenerateDesignRequest = z.infer<typeof generateDesignRequestSchema>;

/**
 * POST /api/generate-design
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate user with Clerk
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const user = await getSupabaseUser(clerkUserId);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found in database" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message:
            "Maximum 10 design generations per hour. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // 3. Parse and validate
    const body: GenerateDesignRequest = await request.json();
    const validation = generateDesignRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { prompt, presetId, eventType, products, brandAssets } =
      validation.data;

    // 4. Build context
    const context: DesignContext = {
      eventType: (eventType as EventType) || null,
      products: products || [],
      brandAssets: brandAssets
        ? { colors: brandAssets.colors || [] }
        : undefined,
    };

    console.log("[Generate Design] Request:", {
      userId: user.id,
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
      presetId: presetId ?? "(default)",
      eventType,
      productsCount: products?.length || 0,
      hasBrandAssets: !!brandAssets,
    });

    // STEP 1: Assemble the preset-anchored prompt (no LLM refinement)
    const assembledPrompt = buildImageGenerationPrompt(
      prompt,
      context,
      presetId
    );
    console.log(
      "[Generate Design] Assembled prompt:",
      assembledPrompt.substring(0, 200) + "..."
    );

    // STEP 2: Generate image with Google Gemini
    const googleAI = getGoogleAI();

    const response = await googleAI.models.generateContent({
      model: DEFAULT_IMAGE_MODEL,
      contents: assembledPrompt,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    if (!response.candidates?.[0]?.content?.parts?.[0]) {
      throw new Error("No image generated in response");
    }

    const imagePart = response.candidates[0].content.parts[0];
    if (!imagePart.inlineData || !imagePart.inlineData.data) {
      throw new Error("No image data in response");
    }

    const imageBase64 = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || "image/png";
    const imageBuffer = Buffer.from(imageBase64, "base64");

    console.log(
      "[Generate Design] Image received:",
      imageBuffer.length,
      "bytes"
    );

    // STEP 3: Upload to Supabase Storage
    const designId = Date.now().toString();
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    const uploadResult = await uploadGeneratedDesign(
      dataUrl,
      user.id,
      designId
    );

    if (!uploadResult.success) {
      console.error(
        "[Generate Design] Failed to upload to Supabase:",
        uploadResult.error
      );
      throw new Error(
        "Failed to save generated image: " + uploadResult.error
      );
    }

    const finalImageUrl = uploadResult.url!;

    // STEP 4: Save Design row.
    // presetId + seed are top-level columns as of Phase 3. The single-design
    // route doesn't generate variants, so variantGroupId/variantIndex stay
    // null — those are populated only by the batch route's save path.
    let savedDesign = null;
    try {
      const { prisma } = await import("@/lib/prisma");

      savedDesign = await prisma.design.create({
        data: {
          userId: user.id,
          name: `AI Design - ${new Date().toLocaleDateString()}`,
          imageUrl: finalImageUrl,
          metadata: {
            prompt: prompt,
            assembledPrompt: assembledPrompt,
            eventType: eventType || null,
            products: products || [],
            generatedAt: new Date().toISOString(),
            model: DEFAULT_IMAGE_MODEL,
            mimeType: mimeType,
          },
          aiPrompt: prompt,
          presetId: presetId ?? null,
        },
      });

      console.log(
        "[Generate Design] Design saved to database:",
        savedDesign.id
      );
    } catch (dbError) {
      console.error(
        "[Generate Design] Failed to save to database:",
        dbError
      );
      // Non-critical; image is still in storage and returned to the client.
    }

    const duration = Date.now() - startTime;
    console.log("[Generate Design] Success:", {
      userId: user.id,
      imageUrl: finalImageUrl,
      isPermanent: uploadResult.success,
      storagePath: uploadResult.path,
      designId: savedDesign?.id || null,
      duration: `${duration}ms`,
      remaining: rateLimit.remaining,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: savedDesign?.id || designId,
          imageUrl: finalImageUrl,
          // Compat fields: clients still expect these keys, but with the
          // refinement step removed, all three are now the same string.
          originalPrompt: prompt,
          refinedPrompt: assembledPrompt,
          revisedPrompt: assembledPrompt,
          presetId: presetId ?? null,
          saved: !!savedDesign,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
        },
      }
    );
  } catch (error) {
    console.error("[Generate Design] Error:", error);

    // Google Imagen API errors
    if (error instanceof Error && error.message.includes("Imagen API error")) {
      if (
        error.message.includes("safety") ||
        error.message.includes("blocked")
      ) {
        return new Response(
          JSON.stringify({
            error: "Content safety violation",
            message:
              "Your prompt was blocked by safety filters. Please try a different description.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error.message.includes("429") || error.message.includes("quota")) {
        return new Response(
          JSON.stringify({
            error: "Google API rate limit",
            message:
              "Too many requests to Google AI. Please try again in a few moments.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: "Image generation error",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Zod validation
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
