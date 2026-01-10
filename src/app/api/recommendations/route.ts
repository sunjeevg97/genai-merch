/**
 * Product Recommendations API Route
 *
 * Returns recommended products based on event type and details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendedProducts } from '@/lib/recommendations/products';
import type { EventType, EventDetails } from '@/lib/store/design-wizard';

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

    // Manual validation instead of Zod to avoid compilation issues
    if (!body.eventType || typeof body.eventType !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: 'eventType is required and must be a string',
        },
        { status: 400 }
      );
    }

    const validEventTypes = ['charity', 'sports', 'company', 'family', 'school', 'other'];
    if (!validEventTypes.includes(body.eventType)) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: `eventType must be one of: ${validEventTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const eventType = body.eventType;
    const eventDetails = body.eventDetails || {};
    const limit = body.limit || 8;

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
