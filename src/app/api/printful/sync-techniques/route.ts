/**
 * Printful Techniques & Placements Sync API Route
 *
 * Queries Printful Mockup Generator API for each product to discover:
 * - Available printing techniques (DTG, DTFilm, Embroidery, Digital)
 * - Available placements for each technique
 * - Stores this data in database for fast lookups
 *
 * Uses the authoritative technique-mapping module to ensure correct
 * technique assignment based on product type, not just placement name.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  inferTechniqueFromProductAndPlacement,
  getDefaultTechniqueForProduct,
  extractTechniqueFromPlacement,
  getProductTypeFromName,
  type TechniqueInfo,
} from '@/lib/printful/technique-mapping';

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

        // Log product type detection for debugging
        const detectedProductType = getProductTypeFromName(product.name);
        console.log(
          `[Sync] Product type for "${product.name}": ${detectedProductType || 'unknown (will default to DTG)'}`
        );

        // Group placements by technique using the authoritative mapping
        // This uses product-type-first logic to avoid the DTG bug for stickers/mugs
        const techniqueGroups = new Map<string, Set<string>>();

        for (const placement of allPlacements) {
          // Use the authoritative inference function that checks product type FIRST
          const techniqueInfo = inferTechniqueFromProductAndPlacement(
            product.name,
            placement
          );

          if (!techniqueGroups.has(techniqueInfo.technique)) {
            techniqueGroups.set(techniqueInfo.technique, new Set());
          }
          techniqueGroups.get(techniqueInfo.technique)!.add(placement);
        }

        console.log(
          `[Sync] Detected ${techniqueGroups.size} techniques:`,
          Array.from(techniqueGroups.keys())
        );

        // Get the default technique for this product
        const defaultTechniqueInfo = getDefaultTechniqueForProduct(product.name);

        // Create/update techniques and placements in database
        for (const [technique, placements] of techniqueGroups.entries()) {
          // Get the full technique info
          const techniqueInfo = inferTechniqueFromProductAndPlacement(
            product.name,
            Array.from(placements)[0] // Use first placement to get info
          );

          // Check if this is the default technique for this product
          const isDefault = technique === defaultTechniqueInfo.technique;

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