/**
 * All Products API Route
 *
 * Fetches all active products with their variants.
 * Used by the product showcase step in the design wizard.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/products/all
 *
 * Fetch all active products with their variants.
 *
 * @returns Array of products with variants
 */
export async function GET() {
  try {
    // Fetch all active products with variants
    const products = await prisma.product.findMany({
      where: {
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
            printfulVariantId: true,
          },
          orderBy: [
            { size: 'asc' },
            { color: 'asc' },
          ],
        },
      },
      orderBy: {
        category: 'asc',
      },
    });

    // Filter out products with no available variants
    const productsWithVariants = products.filter((product) => product.variants.length > 0);

    // Log fetch
    console.log('[Products All] Fetched', {
      total: products.length,
      withVariants: productsWithVariants.length,
      categories: {
        apparel: productsWithVariants.filter((p) => p.category === 'apparel').length,
        accessories: productsWithVariants.filter((p) => p.category === 'accessories').length,
        'home-living': productsWithVariants.filter((p) => p.category === 'home-living').length,
      },
    });

    return NextResponse.json({
      products: productsWithVariants,
      count: productsWithVariants.length,
    });
  } catch (error) {
    console.error('[Products All] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
