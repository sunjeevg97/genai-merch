/**
 * Printful Mockup Pressure Test API Route
 *
 * Tests mockup generation for all product types to verify
 * technique mappings work correctly with the Printful API.
 *
 * Usage: POST /api/printful/pressure-test
 * Headers: x-cron-secret: your_cron_secret
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMockup, type MockupPlacement } from '@/lib/printful/mockups';
import {
  getProductTypeFromName,
  getDefaultTechniqueForProduct,
  PRODUCT_TECHNIQUE_MAPPING,
  type PrintTechnique,
} from '@/lib/printful/technique-mapping';

// Test design image - Uploaded to Supabase storage (publicly accessible)
// Created by scripts/upload-test-image.ts
const TEST_DESIGN_URL =
  'https://ocdgfjsjiwkcgeiduntv.supabase.co/storage/v1/object/public/designs/test-assets/pressure-test-design.png';

interface TestResult {
  productId: string;
  productName: string;
  productType: string | null;
  detectedType: string | null;
  technique: string;
  placement: string;
  variantId: string;
  printfulVariantId: number;
  success: boolean;
  mockupUrl?: string;
  error?: string;
  duration_ms: number;
}

interface PressureTestResponse {
  success: boolean;
  summary: {
    total_products_tested: number;
    successful: number;
    failed: number;
    by_technique: Record<string, { tested: number; passed: number; failed: number }>;
    by_product_type: Record<string, { tested: number; passed: number; failed: number }>;
  };
  results: TestResult[];
  errors: Array<{ productName: string; error: string }>;
  duration_ms: number;
}

// Product types that require special options (stitch_color, etc.)
// These are excluded from standard mockup testing
const EXCLUDED_PRODUCT_TYPES = ['CUT-SEW', 'DECOR'];

// Product name patterns to exclude (all-over-print, etc.)
const EXCLUDED_NAME_PATTERNS = [
  'all-over print',
  'aop',
  'sublimation',
];

/**
 * Get sample products for each technique type
 */
async function getSampleProducts() {
  // Get products with their techniques and placements
  const products = await prisma.product.findMany({
    where: {
      active: true,
      // Exclude product types that require special options
      NOT: {
        productType: {
          in: EXCLUDED_PRODUCT_TYPES,
        },
      },
    },
    select: {
      id: true,
      printfulId: true,
      name: true,
      productType: true,
      techniques: {
        where: { isDefault: true },
        select: {
          technique: true,
          placements: {
            take: 1,
            select: {
              placement: true,
            },
          },
        },
        take: 1,
      },
      variants: {
        where: { inStock: true },
        select: {
          id: true,
          printfulVariantId: true,
          name: true,
        },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  });

  // Filter to products with at least one variant and technique
  // Also exclude products with names matching excluded patterns
  return products.filter(
    (p) =>
      p.variants.length > 0 &&
      p.techniques.length > 0 &&
      p.techniques[0].placements.length > 0 &&
      p.variants[0].printfulVariantId &&
      !EXCLUDED_NAME_PATTERNS.some((pattern) =>
        p.name.toLowerCase().includes(pattern)
      )
  );
}

/**
 * POST /api/printful/pressure-test
 *
 * Run pressure test on mockup generation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('=== Starting Mockup Pressure Test ===\n');

    // Verify authorization
    const cronSecret = request.headers.get('x-cron-secret');
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const techniqueFilter = searchParams.get('technique');
    const productTypeFilter = searchParams.get('productType');

    const limit = limitParam ? parseInt(limitParam, 10) : 20; // Default to 20 products

    // Get sample products
    let products = await getSampleProducts();

    // Apply filters
    if (techniqueFilter) {
      products = products.filter(
        (p) => p.techniques[0]?.technique === techniqueFilter
      );
    }

    if (productTypeFilter) {
      products = products.filter(
        (p) => getProductTypeFromName(p.name) === productTypeFilter
      );
    }

    // Limit the number of products to test
    products = products.slice(0, limit);

    console.log(`[Pressure Test] Testing ${products.length} products\n`);

    const results: TestResult[] = [];
    const errors: Array<{ productName: string; error: string }> = [];

    // Track stats by technique and product type
    const byTechnique: Record<
      string,
      { tested: number; passed: number; failed: number }
    > = {};
    const byProductType: Record<
      string,
      { tested: number; passed: number; failed: number }
    > = {};

    // Test each product
    for (const product of products) {
      const testStartTime = Date.now();
      const variant = product.variants[0];
      const techniqueData = product.techniques[0];
      const placement = techniqueData.placements[0].placement;
      const technique = techniqueData.technique;
      const detectedType = getProductTypeFromName(product.name);

      // Initialize stats
      if (!byTechnique[technique]) {
        byTechnique[technique] = { tested: 0, passed: 0, failed: 0 };
      }
      byTechnique[technique].tested++;

      const productTypeKey = detectedType || 'unknown';
      if (!byProductType[productTypeKey]) {
        byProductType[productTypeKey] = { tested: 0, passed: 0, failed: 0 };
      }
      byProductType[productTypeKey].tested++;

      console.log(
        `[Pressure Test] Testing: ${product.name} (${technique}, ${placement})`
      );

      try {
        const result = await generateMockup(
          product.printfulId,
          variant.printfulVariantId!,
          TEST_DESIGN_URL,
          product.name,
          placement as MockupPlacement,
          undefined, // position
          undefined, // styleId
          technique as PrintTechnique
        );

        const duration = Date.now() - testStartTime;

        results.push({
          productId: product.id,
          productName: product.name,
          productType: product.productType,
          detectedType,
          technique,
          placement,
          variantId: variant.id,
          printfulVariantId: variant.printfulVariantId!,
          success: true,
          mockupUrl: result.mockupUrl,
          duration_ms: duration,
        });

        byTechnique[technique].passed++;
        byProductType[productTypeKey].passed++;

        console.log(`[Pressure Test] ✓ SUCCESS (${duration}ms)`);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        const duration = Date.now() - testStartTime;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';

        results.push({
          productId: product.id,
          productName: product.name,
          productType: product.productType,
          detectedType,
          technique,
          placement,
          variantId: variant.id,
          printfulVariantId: variant.printfulVariantId!,
          success: false,
          error: errorMessage,
          duration_ms: duration,
        });

        errors.push({
          productName: product.name,
          error: errorMessage,
        });

        byTechnique[technique].failed++;
        byProductType[productTypeKey].failed++;

        console.log(`[Pressure Test] ✗ FAILED: ${errorMessage} (${duration}ms)`);
      }
    }

    const totalDuration = Date.now() - startTime;

    // Build summary
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    const response: PressureTestResponse = {
      success: failed === 0,
      summary: {
        total_products_tested: results.length,
        successful,
        failed,
        by_technique: byTechnique,
        by_product_type: byProductType,
      },
      results,
      errors,
      duration_ms: totalDuration,
    };

    console.log('\n=== Pressure Test Complete ===');
    console.log(`Total: ${results.length}, Passed: ${successful}, Failed: ${failed}`);
    console.log(`Duration: ${totalDuration}ms\n`);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Pressure Test] Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/printful/pressure-test
 *
 * Get info about the pressure test endpoint
 */
export async function GET() {
  // Get counts by technique
  const techniqueCounts = await prisma.productTechnique.groupBy({
    by: ['technique'],
    _count: true,
  });

  // Get total products with techniques
  const totalProducts = await prisma.product.count({
    where: {
      active: true,
      techniques: {
        some: {},
      },
    },
  });

  return NextResponse.json({
    endpoint: 'POST /api/printful/pressure-test',
    description: 'Run pressure test on mockup generation for all product types',
    authentication: 'Requires x-cron-secret header',
    query_params: {
      limit: 'Number of products to test (default: 20)',
      technique: 'Filter by technique (dtg, dtfilm, embroidery, digital)',
      productType: 'Filter by detected product type (sticker, mug, hat, t-shirt, etc.)',
    },
    available_products: totalProducts,
    products_by_technique: techniqueCounts.map((t) => ({
      technique: t.technique,
      count: t._count,
    })),
    product_types_supported: Object.keys(PRODUCT_TECHNIQUE_MAPPING),
  });
}
