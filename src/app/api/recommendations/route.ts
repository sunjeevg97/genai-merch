/**
 * Product Recommendations API Route
 *
 * Returns recommended products based on event type and details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedProducts } from '@/lib/recommendations/products';
import { z } from 'zod';
import type { EventType, EventDetails } from '@/lib/store/design-wizard';

/**
 * Request Schema
 */
const recommendationsRequestSchema = z.object({
  eventType: z.enum(['charity', 'sports', 'company', 'family', 'school', 'other']),
  eventDetails: z.record(z.any()).optional(),
  limit: z.number().min(1).max(20).optional(),
});

/**
 * POST /api/recommendations
 *
 * Get product recommendations based on event context.
 *
 * @param request - Request containing event type and details
 * @returns Array of recommended product IDs
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = recommendationsRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { eventType, eventDetails = {}, limit = 8 } = validation.data;

    // Get recommendations
    const productIds = await getRecommendedProducts(
      eventType as EventType,
      eventDetails as EventDetails,
      limit
    );

    // Log recommendation request
    console.log('[Recommendations] Generated', {
      eventType,
      hasDetails: Object.keys(eventDetails).length > 0,
      count: productIds.length,
    });

    return NextResponse.json({
      productIds,
      count: productIds.length,
    });
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
