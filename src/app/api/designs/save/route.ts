/**
 * POST /api/designs/save
 *
 * Save the user-selected design from the wizard. As of Phase 3, this
 * endpoint can also persist the 3 unselected sibling variants from the
 * same generation batch — siblings share a variantGroupId with the
 * selected design for analytics ("which compositions did users reject
 * within a chosen style?").
 *
 * Request shape:
 * - name: string
 * - imageUrl: string (data URL or HTTP URL)
 * - vectorUrl?: string
 * - metadata?: object
 * - aiPrompt?: string
 * - presetId?: string             (StylePreset id)
 * - seed?: string                 (Generation seed)
 * - variantIndex?: number         (0-3; the selected design's position)
 * - siblings?: Array<{
 *     imageUrl, presetId?, seed?, variantIndex?, metadata?
 *   }>
 *
 * Response: the canonical (selected) Design row. Cart and print-prep
 * continue to operate on this single Design.id; siblings are write-only
 * from this endpoint's perspective.
 *
 * Data URLs are auto-uploaded to Supabase Storage and stored as HTTP URLs.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseUser } from "@/lib/clerk/server";
import { prisma } from "@/lib/prisma";
import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

const siblingSchema = z.object({
  imageUrl: z.string().min(1),
  presetId: z.string().optional(),
  seed: z.string().optional(),
  variantIndex: z.number().int().min(0).optional(),
  name: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const saveDesignSchema = z.object({
  name: z.string().min(1, "Design name is required").max(255),
  imageUrl: z.string().min(1, "Image URL is required"),
  vectorUrl: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  aiPrompt: z.string().optional().nullable(),
  presetId: z.string().optional(),
  seed: z.string().optional(),
  variantIndex: z.number().int().min(0).optional(),
  siblings: z.array(siblingSchema).optional(),
});

/**
 * Upload a data URL to Supabase Storage and return its public HTTP URL.
 *
 * The Storage path includes the userId + a unique slug so that multiple
 * generations don't collide. Sibling uploads pass distinct slugs so the
 * 4 variants land at 4 different paths.
 */
async function uploadDataUrlToStorage(
  dataUrl: string,
  userId: string,
  slug: string
): Promise<string> {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid data URL format");
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");

  let extension = ".png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    extension = ".jpg";
  }

  const filePath = `${userId}/generated/${slug}${extension}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from("designs")
    .upload(filePath, buffer, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    console.error("[Design Save] Storage upload error:", error);
    throw new Error(`Failed to upload design: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("designs")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Resolve the final HTTP URL for an image input. If already HTTP, returns
 * unchanged. If a data URL, uploads to storage and returns the public URL.
 */
async function resolveImageUrl(
  imageUrl: string,
  userId: string,
  slug: string
): Promise<string> {
  if (imageUrl.startsWith("data:")) {
    return uploadDataUrlToStorage(imageUrl, userId, slug);
  }
  return imageUrl;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      user = await getSupabaseUser(clerkUserId);
    } catch (syncError) {
      console.error("[Design Save] User sync error:", syncError);
      return NextResponse.json(
        {
          error: "User sync failed",
          message:
            syncError instanceof Error
              ? syncError.message
              : "Unable to sync user account",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
          message:
            "Unable to find or create user account. Please try signing out and back in.",
        },
        { status: 404 }
      );
    }

    // 2. Validate body
    const body = await request.json();
    const validation = saveDesignSchema.safeParse(body);

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
      name,
      imageUrl,
      vectorUrl,
      metadata,
      aiPrompt,
      presetId,
      seed,
      variantIndex,
      siblings,
    } = validation.data;

    // 3. Decide whether this is a variant-group save or a singleton save.
    // A variant group exists iff there's at least one sibling OR an
    // explicit variantIndex on the selected design.
    const hasVariantGroup =
      (siblings && siblings.length > 0) || variantIndex !== undefined;
    const variantGroupId = hasVariantGroup ? randomUUID() : null;

    // 4. Upload the selected design's image (if it's a data URL).
    const selectedSlug = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const finalSelectedImageUrl = await resolveImageUrl(
      imageUrl,
      user.id,
      selectedSlug
    );

    console.log("[Design Save] Creating design:", {
      userId: user.id,
      name,
      presetId: presetId ?? null,
      variantGroupId,
      selectedVariantIndex: variantIndex ?? null,
      siblingCount: siblings?.length ?? 0,
    });

    // 5. Create the selected design row first so we have its id to return.
    const selectedDesign = await prisma.design.create({
      data: {
        userId: user.id,
        name,
        imageUrl: finalSelectedImageUrl,
        vectorUrl: vectorUrl || null,
        metadata: (metadata || {}) as any,
        aiPrompt: aiPrompt || null,
        presetId: presetId ?? null,
        seed: seed ?? null,
        variantGroupId,
        variantIndex: variantIndex ?? null,
      },
    });

    // 6. If siblings were provided, upload + persist them. We do these in
    //    parallel since they're independent. Failures on individual siblings
    //    are logged but don't fail the request — the selected design is
    //    already saved and that's the user-critical artifact.
    let siblingCount = 0;
    if (siblings && siblings.length > 0 && variantGroupId) {
      const siblingResults = await Promise.allSettled(
        siblings.map(async (sibling, idx) => {
          const slug = `${selectedSlug}-sib-${idx}`;
          const finalSiblingUrl = await resolveImageUrl(
            sibling.imageUrl,
            user.id,
            slug
          );
          return prisma.design.create({
            data: {
              userId: user.id,
              name: sibling.name ?? `${name} (variant ${idx + 1})`,
              imageUrl: finalSiblingUrl,
              metadata: (sibling.metadata ?? {}) as any,
              aiPrompt: aiPrompt || null,
              presetId: sibling.presetId ?? null,
              seed: sibling.seed ?? null,
              variantGroupId,
              variantIndex: sibling.variantIndex ?? null,
            },
          });
        })
      );

      for (const result of siblingResults) {
        if (result.status === "fulfilled") {
          siblingCount += 1;
        } else {
          // Log the failure but don't propagate — selected design is saved.
          console.error("[Design Save] Sibling persist failed:", result.reason);
        }
      }
    }

    console.log("[Design Save] Saved:", {
      selectedId: selectedDesign.id,
      variantGroupId,
      siblingsPersisted: siblingCount,
    });

    // 7. Return the selected design as the canonical artifact.
    return NextResponse.json({
      success: true,
      data: {
        ...selectedDesign,
        // Convenience for clients that want to know how many siblings
        // actually landed (rare case: some uploads fail).
        siblingsPersisted: siblingCount,
      },
    });
  } catch (error) {
    console.error("[Design Save] Error:", error);

    if (error instanceof Error) {
      console.error("[Design Save] Error message:", error.message);
      console.error("[Design Save] Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to save design",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
