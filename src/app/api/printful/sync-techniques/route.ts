/**
 * Printful Techniques & Placements Sync API Route
 *
 * Queries Printful Mockup Generator API for each product to discover:
 * - Available printing techniques (DTG, DTFilm, Embroidery, Digital)
 * - Available placements for each technique
 * - Stores this data in database for fast lookups
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Technique mapping from Printful placement names to our normalized technique names
 */
function detectTechniqueFromPlacement(placement: string): {
  technique: 'dtg' | 'dtfilm' | 'embroidery' | 'digital';
  label: string;
  description: string;
} | null {
  const p = placement.toLowerCase();

  // Embroidery placements
  if (p.includes('embroidery')) {
    return {
      technique: 'embroidery',
      label: 'Embroidery',
      description: 'Classic stitched design, premium look',
    };
  }

  // DTFilm placements
  if (p.includes('_dtf') || p.includes('dtfilm')) {
    return {
      technique: 'dtfilm',
      label: 'DTF Print',
      description: 'Full-color print, more detail',
    };
  }

  // Digital (sublimation) - typically for mugs, all-over prints
  if (p === 'default' || p === 'front_center' || p === 'center') {
    // These are ambiguous - could be DTG or Digital
    // We'll determine based on product type context
    return null; // Will be handled specially
  }

  // DTG (standard placements)
  if (['front', 'back', 'left', 'right', 'sleeve_left', 'sleeve_right', 'front_large', 'back_large'].includes(p)) {
    return {
      technique: 'dtg',
      label: 'Direct-to-Garment',
      description: 'High-quality, detailed print',
    };
  }

  return null;
}

/**
 * Determine technique based on product type for ambiguous placements
 */
function getTechniqueForProduct(
  productName: string,
  placement: string
): {
  technique: 'dtg' | 'dtfilm' | 'embroidery' | 'digital';
  label: string;
  description: string;
} {
  const name = productName.toLowerCase();

  // Mugs, cups -> digital (sublimation)
  if (name.includes('mug') || name.includes('cup')) {
    return {
      technique: 'digital',
      label: 'Digital Print',
      description: 'Vibrant, permanent print',
    };
  }

  // Stickers -> digital
  if (name.includes('sticker')) {
    return {
      technique: 'digital',
      label: 'Full Color Print',
      description: 'High-quality digital print',
    };
  }

  // Hats/caps with standard placements -> DTFilm
  if ((name.includes('hat') || name.includes('cap') || name.includes('beanie')) &&
      ['front', 'back', 'default', 'center', 'front_center'].includes(placement.toLowerCase())) {
    return {
      technique: 'dtfilm',
      label: 'DTF Print',
      description: 'Full-color print, more detail',
    };
  }

  // Default to DTG for apparel
  return {
    technique: 'dtg',
    label: 'Direct-to-Garment',
    description: 'High-quality, detailed print',
  };
}

/**
 * Get friendly label for placement
 */
function getPlacementLabel(placement: string): string {
  const placementMap: Record<string, string> = {
    'front': 'Front',
    'back': 'Back',
    'left': 'Left Side',
    'right': 'Right Side',
    'sleeve_left': 'Left Sleeve',
    'sleeve_right': 'Right Sleeve',
    'front_large': 'Front (Large)',
    'back_large': 'Back (Large)',
    'default': 'Standard',
    'center': 'Center',
    'front_center': 'Front Center',
    'label_inside': 'Inside Label',
    'label_outside': 'Outside Label',
    'embroidery_front': 'Embroidered Front',
    'embroidery_back': 'Embroidered Back',
    'embroidery_front_large': 'Embroidered Front (Large)',
    'embroidery_chest_left': 'Left Chest (Embroidered)',
    'embroidery_chest_right': 'Right Chest (Embroidered)',
    'embroidery_left': 'Left Side (Embroidered)',
    'embroidery_right': 'Right Side (Embroidered)',
    'front_dtf_hat': 'Front (DTF Print)',
    'back_dtf_hat': 'Back (DTF Print)',
    'front_dtf': 'Front (DTF Print)',
    'back_dtf': 'Back (DTF Print)',
    'front_large_dtf': 'Front Large (DTF Print)',
    'back_large_dtf': 'Back Large (DTF Print)',
    'short_sleeve_left_dtf': 'Left Sleeve (DTF)',
    'short_sleeve_right_dtf': 'Right Sleeve (DTF)',
    'label_inside_dtf': 'Inside Label (DTF)',
  };

  return placementMap[placement] || placement.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * POST /api/printful/sync-techniques
 *
 * Sync techniques and placements for all products from Printful
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('=== Starting Printful Techniques Sync ===\n');

    // Verify authorization (use CRON_SECRET or require admin auth)
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-cron-secret');

    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      if (!authHeader || authHeader !== `Bearer ${process.env.PRINTFUL_API_KEY}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Get all active products from database with their variants
    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        printfulId: true,
        name: true,
        productType: true,
        variants: {
          select: {
            printfulVariantId: true,
          },
          take: 1, // Only need one variant to discover placements (all variants have same placements)
        },
      },
    });

    console.log(`[Sync] Found ${products.length} active products in database\n`);

    let productsProcessed = 0;
    let techniquesCreated = 0;
    let placementsCreated = 0;
    const errors: Array<{ productId: number; error: string }> = [];

    // Process each product
    for (const product of products) {
      try {
        console.log(`[Sync] Processing product: ${product.name} (Printful ID: ${product.printfulId})`);

        // Skip products with no variants
        if (product.variants.length === 0) {
          console.log(`[Sync] No variants found for ${product.name}, skipping`);
          continue;
        }

        // Fetch variant details from Printful v2 API to get placement_dimensions
        const variantId = product.variants[0].printfulVariantId;
        const response = await fetch(
          `https://api.printful.com/v2/catalog-variants/${variantId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Printful API error: ${response.status}`);
        }

        const data = await response.json();
        const placementDimensions = data.data?.placement_dimensions || [];

        if (placementDimensions.length === 0) {
          console.log(`[Sync] No placement dimensions found for ${product.name}, skipping`);
          continue;
        }

        // Collect all unique placements from placement_dimensions
        const allPlacements = new Set<string>();
        for (const dim of placementDimensions) {
          if (dim.placement) {
            allPlacements.add(dim.placement);
          }
        }

        console.log(`[Sync] Found ${allPlacements.size} unique placements:`, Array.from(allPlacements));

        // Group placements by technique
        const techniqueGroups = new Map<string, Set<string>>();

        for (const placement of allPlacements) {
          let techniqueInfo = detectTechniqueFromPlacement(placement);

          // If ambiguous, use product type to determine
          if (!techniqueInfo) {
            techniqueInfo = getTechniqueForProduct(product.name, placement);
          }

          if (!techniqueGroups.has(techniqueInfo.technique)) {
            techniqueGroups.set(techniqueInfo.technique, new Set());
          }
          techniqueGroups.get(techniqueInfo.technique)!.add(placement);
        }

        console.log(`[Sync] Detected ${techniqueGroups.size} techniques:`, Array.from(techniqueGroups.keys()));

        // Create/update techniques and placements in database
        for (const [technique, placements] of techniqueGroups.entries()) {
          const techniqueInfo = technique === 'dtg'
            ? { technique: 'dtg' as const, label: 'Direct-to-Garment', description: 'High-quality, detailed print' }
            : technique === 'dtfilm'
            ? { technique: 'dtfilm' as const, label: 'DTF Print', description: 'Full-color print, more detail' }
            : technique === 'embroidery'
            ? { technique: 'embroidery' as const, label: 'Embroidery', description: 'Classic stitched design, premium look' }
            : { technique: 'digital' as const, label: 'Digital Print', description: 'Vibrant, permanent print' };

          // Determine if this should be the default technique for this product
          const isDefault = technique === getTechniqueForProduct(product.name, 'front').technique;

          // Upsert technique
          const productTechnique = await prisma.productTechnique.upsert({
            where: {
              productId_technique: {
                productId: product.id,
                technique: techniqueInfo.technique,
              },
            },
            create: {
              productId: product.id,
              technique: techniqueInfo.technique,
              label: techniqueInfo.label,
              description: techniqueInfo.description,
              isDefault,
            },
            update: {
              label: techniqueInfo.label,
              description: techniqueInfo.description,
              isDefault,
            },
          });

          techniquesCreated++;

          // Create placements for this technique
          for (const placement of placements) {
            await prisma.productTechniquePlacement.upsert({
              where: {
                productTechniqueId_placement: {
                  productTechniqueId: productTechnique.id,
                  placement,
                },
              },
              create: {
                productTechniqueId: productTechnique.id,
                placement,
                label: getPlacementLabel(placement),
              },
              update: {
                label: getPlacementLabel(placement),
              },
            });

            placementsCreated++;
          }

          console.log(`[Sync]   ✓ ${techniqueInfo.technique}: ${placements.size} placements`);
        }

        productsProcessed++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`[Sync] Error processing product ${product.printfulId}:`, error);
        errors.push({
          productId: product.printfulId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const duration = Date.now() - startTime;

    console.log('\n=== Sync Complete ===');
    console.log(`Products processed: ${productsProcessed}`);
    console.log(`Techniques created/updated: ${techniquesCreated}`);
    console.log(`Placements created/updated: ${placementsCreated}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Duration: ${duration}ms\n`);

    return NextResponse.json(
      {
        success: true,
        products_processed: productsProcessed,
        techniques_created: techniquesCreated,
        placements_created: placementsCreated,
        errors,
        duration_ms: duration,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Sync] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}