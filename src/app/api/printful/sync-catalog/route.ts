/**
 * Printful Catalog Sync API Route
 *
 * Syncs products from Printful API into our database.
 * Called by cron job to keep product catalog up-to-date.
 *
 * Endpoint: GET /api/printful/sync-catalog
 * Authorization: CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { printful } from '@/lib/printful/client';
import { prisma } from '@/lib/prisma';
import {
  shouldIncludeProduct,
  calculateRetailPrice,
  mapProductCategory,
  parsePriceToCents,
  formatCentsToDollars,
} from '@/lib/printful/products';
import {
  parseSizeFromVariant,
  parseColorFromVariant,
} from '@/lib/utils/variant-parsing';
import type {
  PrintfulProduct,
  PrintfulProductVariant,
} from '@/lib/printful/types';

/**
 * Sync statistics
 */
interface SyncStats {
  products_synced: number;
  variants_synced: number;
  products_skipped: number;
  mockup_incompatible_products: number; // Products that don't support mockup generation
  errors: Array<{
    product_id?: number;
    variant_id?: number;
    error: string;
  }>;
  duration_ms: number;
}

/**
 * Validate if a string is a valid image URL
 */
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Check if a product supports mockup generation
 *
 * Products that don't support mockups should be excluded from the catalog
 * to prevent errors when users try to generate previews.
 *
 * NOTE: We don't filter by placement here because we want to check if the product
 * has ANY mockup styles at all, regardless of placement.
 */
async function checkMockupCompatibility(productId: number): Promise<boolean> {
  try {
    // Don't filter by placement - we want to know if ANY mockup styles exist
    const styles = await printful.getMockupStyles(productId, undefined);

    // Product is mockup-compatible if it has at least one mockup style
    const isCompatible = styles && styles.length > 0;

    if (!isCompatible) {
      console.log(`[Mockup Check] Product ${productId} has no mockup styles available`);
    } else {
      console.log(`[Mockup Check] Product ${productId} has ${styles.length} mockup style(s)`);
    }

    return isCompatible;
  } catch (error) {
    // If we get a 404 or any other error, the product doesn't support mockups
    console.log(`[Mockup Check] Product ${productId} mockup API error:`,
      error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Sync a single product with its variants
 */
async function syncProduct(
  product: PrintfulProduct
): Promise<{ variants: number; errors: string[]; mockupIncompatible?: boolean }> {
  const errors: string[] = [];
  let variantCount = 0;

  try {
    console.log(`[Sync] Processing product: ${product.title} (ID: ${product.id})`);

    // Check mockup compatibility - mark products as inactive if they don't support mockups
    const isMockupCompatible = await checkMockupCompatibility(product.id);
    if (!isMockupCompatible) {
      console.log(`[Sync] Product ${product.id} does not support mockups - marking as inactive`);

      // Mark product as inactive in database (preserves data for existing orders)
      await prisma.product.upsert({
        where: { printfulId: product.id },
        update: {
          active: false, // Hide from catalog
          updatedAt: new Date(),
        },
        create: {
          printfulId: product.id,
          name: product.title,
          description: product.description || null,
          category: mapProductCategory(product),
          productType: product.type,
          basePrice: 0,
          currency: 'USD',
          imageUrl: '',
          mockupUrl: product.image || '',
          active: false, // Inactive on creation
        },
      });

      return { variants: 0, errors: [], mockupIncompatible: true };
    }

    console.log(`[Sync] Product ${product.id} is mockup-compatible, continuing sync...`);

    // Determine category
    const category = mapProductCategory(product);

    // Get product image (use first file's image or fallback to product.image)
    // Validate it's a real URL, not metadata like "Print file"
    const rawProductImage =
      product.files?.find((f) => f.type === 'default')?.preview_url ||
      product.image ||
      '';
    const productImage = isValidImageUrl(rawProductImage) ? rawProductImage : '';

    // Upsert product
    const dbProduct = await prisma.product.upsert({
      where: { printfulId: product.id },
      update: {
        name: product.title,
        description: product.description || null,
        category,
        productType: product.type,
        imageUrl: productImage,
        mockupUrl: product.image,
        active: !product.is_discontinued,
        metadata: {
          brand: product.brand,
          model: product.model,
          techniques: product.techniques,
          files: product.files,
          options: product.options,
          avg_fulfillment_time: product.avg_fulfillment_time,
          origin_country: product.origin_country,
        },
        updatedAt: new Date(),
      },
      create: {
        printfulId: product.id,
        name: product.title,
        description: product.description || null,
        category,
        productType: product.type,
        basePrice: 0, // Will be updated with variant prices
        currency: 'USD',
        imageUrl: productImage,
        mockupUrl: product.image,
        active: !product.is_discontinued,
        metadata: {
          brand: product.brand,
          model: product.model,
          techniques: product.techniques,
          files: product.files,
          options: product.options,
          avg_fulfillment_time: product.avg_fulfillment_time,
          origin_country: product.origin_country,
        },
      },
    });

    console.log(`[Sync] Product upserted: ${dbProduct.id}`);

    // Fetch variants for this product
    let variants: PrintfulProductVariant[] = [];
    try {
      variants = await printful.getProductVariants(product.id);
      console.log(`[Sync] Found ${variants.length} variants for product ${product.id}`);
    } catch (error) {
      const errorMsg = `Failed to fetch variants: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[Sync] ${errorMsg}`);
      errors.push(errorMsg);
      return { variants: 0, errors };
    }

    // Track lowest price for basePrice
    let lowestPrice = Infinity;

    // Sync each variant
    for (const variant of variants) {
      try {
        // Parse variant attributes using improved parsing that handles pipe-separated format
        const size = parseSizeFromVariant(variant.name, variant.size || null);
        const color = parseColorFromVariant(variant.name, variant.color || null);

        // Parse base price from Printful
        const basePriceCents = parsePriceToCents(variant.price);

        // Calculate retail price with markup
        const retailPriceCents = calculateRetailPrice(basePriceCents);

        // Track lowest price
        if (basePriceCents < lowestPrice) {
          lowestPrice = basePriceCents;
        }

        // Validate variant image URL
        const variantImageUrl = isValidImageUrl(variant.image) ? variant.image : '';

        // Upsert variant
        await prisma.productVariant.upsert({
          where: { printfulVariantId: variant.id },
          update: {
            name: variant.name,
            size: size,
            color: color,
            price: retailPriceCents,
            inStock: variant.in_stock,
            imageUrl: variantImageUrl,
            metadata: {
              color_code: variant.color_code,
              color_code2: variant.color_code2,
              availability_regions: variant.availability_regions,
              availability_status: variant.availability_status,
              material: variant.material,
              base_price: basePriceCents,
              base_price_formatted: formatCentsToDollars(basePriceCents),
              retail_price_formatted: formatCentsToDollars(retailPriceCents),
            },
            updatedAt: new Date(),
          },
          create: {
            printfulVariantId: variant.id,
            productId: dbProduct.id,
            name: variant.name,
            size: size,
            color: color,
            price: retailPriceCents,
            inStock: variant.in_stock,
            imageUrl: variantImageUrl,
            metadata: {
              color_code: variant.color_code,
              color_code2: variant.color_code2,
              availability_regions: variant.availability_regions,
              availability_status: variant.availability_status,
              material: variant.material,
              base_price: basePriceCents,
              base_price_formatted: formatCentsToDollars(basePriceCents),
              retail_price_formatted: formatCentsToDollars(retailPriceCents),
            },
          },
        });

        variantCount++;
      } catch (error) {
        const errorMsg = `Failed to sync variant ${variant.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[Sync] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Update product basePrice to lowest variant price
    if (lowestPrice !== Infinity) {
      const lowestRetailPrice = calculateRetailPrice(lowestPrice);
      await prisma.product.update({
        where: { id: dbProduct.id },
        data: { basePrice: lowestRetailPrice },
      });
    }

    console.log(
      `[Sync] Product ${product.id} complete: ${variantCount} variants synced`
    );

    return { variants: variantCount, errors };
  } catch (error) {
    const errorMsg = `Failed to sync product ${product.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(`[Sync] ${errorMsg}`);
    errors.push(errorMsg);
    return { variants: variantCount, errors };
  }
}

/**
 * GET /api/printful/sync-catalog
 *
 * Sync Printful product catalog
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  console.log('\n=== Starting Printful Catalog Sync ===\n');

  // Verify authorization
  const cronSecret = request.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error('[Sync] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  if (cronSecret !== expectedSecret) {
    console.error('[Sync] Unauthorized request - invalid CRON_SECRET');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const stats: SyncStats = {
    products_synced: 0,
    variants_synced: 0,
    products_skipped: 0,
    mockup_incompatible_products: 0,
    errors: [],
    duration_ms: 0,
  };

  try {
    // Fetch all products from Printful
    console.log('[Sync] Fetching products from Printful...');
    const allProducts = await printful.getProducts();
    console.log(`[Sync] Fetched ${allProducts.length} products from Printful`);

    // Filter to products we want to sell
    const filteredProducts = allProducts.filter(shouldIncludeProduct);
    console.log(
      `[Sync] Filtered to ${filteredProducts.length} supported products`
    );
    stats.products_skipped = allProducts.length - filteredProducts.length;

    // Sync each product
    for (const product of filteredProducts) {
      try {
        const result = await syncProduct(product);

        // Skip products that don't support mockups
        if (result.mockupIncompatible) {
          stats.mockup_incompatible_products++;
          console.log(`[Sync] Product ${product.id} skipped - no mockup support`);
          continue;
        }

        stats.products_synced++;
        stats.variants_synced += result.variants;

        // Add errors to stats
        if (result.errors.length > 0) {
          result.errors.forEach((error) => {
            stats.errors.push({
              product_id: product.id,
              error,
            });
          });
        }
      } catch (error) {
        console.error(
          `[Sync] Error syncing product ${product.id}:`,
          error
        );
        stats.errors.push({
          product_id: product.id,
          error:
            error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue with next product
      }
    }

    stats.duration_ms = Date.now() - startTime;

    console.log('\n=== Sync Complete ===');
    console.log(`Products synced: ${stats.products_synced}`);
    console.log(`Variants synced: ${stats.variants_synced}`);
    console.log(`Products skipped (category/type filters): ${stats.products_skipped}`);
    console.log(`Products excluded (no mockup support): ${stats.mockup_incompatible_products}`);
    console.log(`Errors: ${stats.errors.length}`);
    console.log(`Duration: ${stats.duration_ms}ms\n`);

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Sync] Fatal error:', error);

    return NextResponse.json(
      {
        ...stats,
        duration_ms: duration,
        errors: [
          ...stats.errors,
          {
            error:
              error instanceof Error
                ? error.message
                : 'Unknown fatal error',
          },
        ],
      },
      { status: 500 }
    );
  }
}
