/**
 * Test Mockup Styles API
 *
 * Test if we can fetch mockup styles from Printful for a sample product
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { prisma } from '../src/lib/prisma';

async function main() {
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
      console.log('No products found in database');
      return;
    }

    console.log(`Testing with product: ${product.name} (Printful ID: ${product.printfulId})`);

    // Fetch mockup styles from Printful
    const response = await fetch(
      `https://api.printful.com/v2/catalog-products/${product.printfulId}/mockup-styles`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PRINTFUL_API_KEY}`,
        },
      }
    );

    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return;
    }

    const data = await response.json();
    const styles = data.data || [];

    console.log(`Found ${styles.length} mockup styles`);

    if (styles.length > 0) {
      const firstStyle = styles[0];
      console.log('\nFirst style:');
      console.log(`  ID: ${firstStyle.id}`);
      console.log(`  Category: ${firstStyle.category_name}`);
      console.log(`  View: ${firstStyle.view_name}`);
      console.log(`  Placements (${firstStyle.placements?.length || 0}):`, firstStyle.placements || []);
    } else {
      console.log('No mockup styles available for this product');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();