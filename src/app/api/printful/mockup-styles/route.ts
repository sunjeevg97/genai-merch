/**
 * Printful Mockup Styles API Route
 *
 * Fetch available mockup styles for a product from Printful.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { printful } from '@/lib/printful/client';

/**
 * Request validation schema
 */
const mockupStylesRequestSchema = z.object({
  printfulProductId: z.string().min(1, 'Printful product ID is required'),
  placement: z.string().optional(),
});

/**
 * GET /api/printful/mockup-styles?printfulProductId=71&placement=front
 *
 * Fetch available mockup styles for a Printful product, optionally filtered by placement.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const printfulProductId = searchParams.get('printfulProductId');
    const placement = searchParams.get('placement');

    // Validate query params
    const validation = mockupStylesRequestSchema.safeParse({
      printfulProductId,
      placement: placement || undefined,
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

    const productId = parseInt(validation.data.printfulProductId);

    if (isNaN(productId)) {
      return NextResponse.json(
        {
          error: 'Invalid product ID',
          message: 'Product ID must be a valid number',
        },
        { status: 400 }
      );
    }

    console.log('[Mockup Styles API] Fetching styles for product:', productId, 'placement:', placement || 'all');

    // Fetch mockup styles from Printful, optionally filtered by placement
    const styles = await printful.getMockupStyles(productId, placement || undefined);

    console.log('[Mockup Styles API] Found', styles.length, 'mockup styles', placement ? `for placement: ${placement}` : '');

    // Return mockup styles
    return NextResponse.json(
      {
        success: true,
        styles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Mockup Styles API] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Failed to fetch mockup styles',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch mockup styles with unknown error' },
      { status: 500 }
    );
  }
}
