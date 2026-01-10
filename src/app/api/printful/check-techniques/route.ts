/**
 * Check Techniques API
 *
 * GET /api/printful/check-techniques
 *
 * Returns statistics about synced techniques and placements
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const techniqueCount = await prisma.productTechnique.count();
    const placementCount = await prisma.productTechniquePlacement.count();

    let sample = null;
    if (techniqueCount > 0) {
      const sampleData = await prisma.productTechnique.findFirst({
        include: {
          placements: true,
          product: {
            select: { name: true, id: true }
          }
        }
      });

      if (sampleData) {
        sample = {
          productId: sampleData.product.id,
          productName: sampleData.product.name,
          technique: sampleData.technique,
          label: sampleData.label,
          description: sampleData.description,
          isDefault: sampleData.isDefault,
          placementCount: sampleData.placements.length,
          samplePlacements: sampleData.placements.slice(0, 5).map(p => ({
            value: p.placement,
            label: p.label
          }))
        };
      }
    }

    return NextResponse.json(
      {
        success: true,
        techniqueCount,
        placementCount,
        sample
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Check Techniques API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}