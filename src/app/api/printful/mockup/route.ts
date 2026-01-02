/**
 * Printful Mockup Generation API Route
 *
 * Generate product mockups with custom designs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateMockup,
  generateMockupCacheKey,
  type MockupPlacement,
} from '@/lib/printful/mockups';
import { prisma } from '@/lib/prisma';

/**
 * In-memory cache for mockup URLs
 * In production, use Redis or database
 */
const mockupCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * Cache TTL: 7 days in milliseconds
 */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Request validation schema
 */
const mockupRequestSchema = z.object({
  productVariantId: z.string().min(1, 'Product variant ID is required'),
  designImageUrl: z.string().url('Design image URL must be a valid URL'),
  placement: z
    .enum([
      'front',
      'back',
      'left',
      'right',
      'sleeve_left',
      'sleeve_right',
      'label_inside',
      'label_outside',
      'front_dtf',
      'front_large_dtf',
      'back_dtf',
      'back_large_dtf',
      'short_sleeve_left_dtf',
      'short_sleeve_right_dtf',
      'label_inside_dtf',
      'embroidery_front',
      'embroidery_front_large',
      'embroidery_back',
      'embroidery_left',
      'embroidery_right',
      'front_dtf_hat',
      'back_dtf_hat',
      'default',
    ])
    .optional()
    .default('front'),
  position: z.object({
    area_width: z.number().positive().optional(),
    area_height: z.number().positive().optional(),
    width: z.number().positive(),
    height: z.number().positive(),
    top: z.number().min(0),
    left: z.number().min(0),
  }).optional(),
  styleId: z.number().positive().optional(),
  technique: z.enum(['dtg', 'dtfilm', 'embroidery', 'digital']).optional(),
});

/**
 * Clean expired cache entries
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, value] of mockupCache.entries()) {
    if (value.expiresAt < now) {
      mockupCache.delete(key);
    }
  }
}

/**
 * POST /api/printful/mockup
 *
 * Generate mockup for product variant with custom design.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = mockupRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { productVariantId, designImageUrl, placement, position, styleId, technique } = validation.data;

    // Clean expired cache entries
    cleanExpiredCache();

    // Generate cache key (include technique for unique caching)
    const cacheKey = generateMockupCacheKey(
      productVariantId,
      designImageUrl,
      placement as MockupPlacement,
      position,
      styleId,
      technique
    );

    // Check cache first
    const cached = mockupCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log('[Mockup API] Cache hit:', cacheKey);
      return NextResponse.json(
        {
          success: true,
          mockupUrl: cached.url,
          cached: true,
        },
        { status: 200 }
      );
    }

    // Fetch product variant to get Printful variant ID and product ID
    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      select: {
        id: true,
        printfulVariantId: true,
        product: {
          select: {
            printfulId: true,
            name: true,
            productType: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      );
    }

    if (!variant.printfulVariantId) {
      console.error('[Mockup API] Missing printfulVariantId:', {
        variantId: productVariantId,
        variantName: variant.id,
      });
      return NextResponse.json(
        {
          error: 'Product variant not synced with Printful',
          message:
            'This product variant does not have a Printful variant ID. Please sync your product catalog from Printful first by visiting /api/printful/sync-catalog',
        },
        { status: 400 }
      );
    }

    if (!variant.product.printfulId) {
      console.error('[Mockup API] Missing printfulId:', {
        variantId: productVariantId,
      });
      return NextResponse.json(
        {
          error: 'Product not synced with Printful',
          message: 'This product does not have a Printful product ID.',
        },
        { status: 400 }
      );
    }

    console.log('[Mockup API] Generating mockup:', {
      variantId: productVariantId,
      printfulProductId: variant.product.printfulId,
      printfulVariantId: variant.printfulVariantId,
      productName: variant.product.name,
      productType: variant.product.productType,
      placement,
      position,
    });

    // Generate mockup (pass product name for placement detection)
    const result = await generateMockup(
      variant.product.printfulId,
      variant.printfulVariantId,
      designImageUrl,
      variant.product.name,
      placement as MockupPlacement,
      position,
      styleId,
      technique
    );

    // Store in cache
    mockupCache.set(cacheKey, {
      url: result.mockupUrl,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    console.log('[Mockup API] Mockup generated and cached:', result.mockupUrl);

    // Return mockup URL
    return NextResponse.json(
      {
        success: true,
        mockupUrl: result.mockupUrl,
        variantId: result.variantId,
        placement: result.placement,
        cached: false,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Mockup API] Error:', error);

    if (error instanceof Error) {
      // Return error message
      return NextResponse.json(
        {
          error: 'Mockup generation failed',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Mockup generation failed with unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/printful/mockup?productVariantId=X&designImageUrl=Y&placement=front
 *
 * Alternative GET endpoint for generating mockups.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productVariantId = searchParams.get('productVariantId');
    const designImageUrl = searchParams.get('designImageUrl');
    const placement = searchParams.get('placement') || 'front';

    // Validate query params
    const validation = mockupRequestSchema.safeParse({
      productVariantId,
      designImageUrl,
      placement,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    // Forward to POST handler logic
    return POST(
      new NextRequest(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(validation.data),
      })
    );
  } catch (error) {
    console.error('[Mockup API GET] Error:', error);
    return NextResponse.json(
      { error: 'Mockup generation failed' },
      { status: 500 }
    );
  }
}
