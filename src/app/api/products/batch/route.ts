/**
 * Batch Products API Route
 *
 * Fetches multiple products by ID with their variants.
 * Used by the product showcase step to load recommended products efficiently.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Request Schema
 */
const batchRequestSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product ID is required').max(20, 'Maximum 20 products allowed'),
});

/**
 * POST /api/products/batch
 *
 * Fetch multiple products with their variants.
 *
 * @param request - Request containing array of product IDs
 * @returns Array of products with variants
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = batchRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { productIds } = validation.data;

    // Fetch products with variants
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
      },
      include: {
        variants: {
          where: {
            inStock: true,
          },
          select: {
            id: true,
            name: true,
            size: true,
            color: true,
            price: true,
            inStock: true,
            imageUrl: true,
          },
          orderBy: [
            { size: 'asc' },
            { color: 'asc' },
          ],
        },
      },
      orderBy: {
        basePrice: 'asc', // Sort by price
      },
    });

    // Filter out products with no available variants
    const productsWithVariants = products.filter((product) => product.variants.length > 0);

    // Log fetch
    console.log('[Batch Products] Fetched', {
      requested: productIds.length,
      found: products.length,
      withVariants: productsWithVariants.length,
    });

    return NextResponse.json({
      products: productsWithVariants,
    });
  } catch (error) {
    console.error('[Batch Products] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
