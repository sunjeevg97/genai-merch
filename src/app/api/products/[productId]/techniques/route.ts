/**
 * Product Techniques API Route
 *
 * GET /api/products/[productId]/techniques
 *
 * Returns available printing techniques and placements for a specific product
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;

    // Fetch product with techniques and placements
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        techniques: {
          include: {
            placements: {
              orderBy: { placement: 'asc' },
            },
          },
          orderBy: [
            { isDefault: 'desc' }, // Default technique first
            { technique: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Transform to API response format
    const techniques = product.techniques.map((tech) => ({
      value: tech.technique,
      label: tech.label,
      description: tech.description,
      isDefault: tech.isDefault,
      placements: tech.placements.map((p) => ({
        value: p.placement,
        label: p.label,
      })),
    }));

    return NextResponse.json(
      {
        productId: product.id,
        printfulId: product.printfulId,
        productName: product.name,
        techniques,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Product Techniques API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch techniques',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}