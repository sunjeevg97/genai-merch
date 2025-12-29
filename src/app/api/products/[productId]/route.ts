/**
 * Get Product by ID API Route
 *
 * Fetches a single product with all variants.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    // Validate product ID
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product
    const product = await getProductById(productId);

    // Return 404 if product not found
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Return product data
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('[Product API] Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
