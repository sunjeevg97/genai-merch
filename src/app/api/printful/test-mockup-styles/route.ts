/**
 * Test Mockup Styles API
 *
 * GET /api/printful/test-mockup-styles
 *
 * Tests if we can fetch mockup styles from Printful for a sample product
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get a sample product
    const product = await prisma.product.findFirst({
      where: { active: true },
      select: {
        id: true,
        printfulId: true,
        name: true,
        productType: true,
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'No products found in database' },
        { status: 404 }
      );
    }

    console.log(`[Test] Testing with product: ${product.name} (Printful ID: ${product.printfulId})`);

    // Fetch mockup styles from Printful
    const response = await fetch(
      `https://api.printful.com/v2/catalog-products/${product.printfulId}/mockup-styles`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
        },
      }
    );

    console.log(`[Test] API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Test] API Error:', errorText);
      return NextResponse.json(
        {
          error: 'Printful API error',
          status: response.status,
          details: errorText
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const styles = data.data || [];

    console.log(`[Test] Found ${styles.length} mockup styles`);

    let sampleStyle = null;
    if (styles.length > 0) {
      const firstStyle = styles[0];
      sampleStyle = {
        id: firstStyle.id,
        category: firstStyle.category_name,
        view: firstStyle.view_name,
        placements: firstStyle.placements || [],
        placementCount: firstStyle.placements?.length || 0
      };
      console.log('[Test] First style:', sampleStyle);
    }

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          printfulId: product.printfulId,
          name: product.name,
          productType: product.productType
        },
        stylesFound: styles.length,
        sampleStyle
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}