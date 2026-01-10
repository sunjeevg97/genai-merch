/**
 * Check Technique Data
 *
 * Verifies that technique and placement data exists in database
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const techniqueCount = await prisma.productTechnique.count();
    const placementCount = await prisma.productTechniquePlacement.count();

    console.log(`ProductTechnique records: ${techniqueCount}`);
    console.log(`ProductTechniquePlacement records: ${placementCount}`);

    if (techniqueCount > 0) {
      const sample = await prisma.productTechnique.findFirst({
        include: {
          placements: true,
          product: {
            select: { name: true, id: true }
          }
        }
      });

      if (sample) {
        console.log('\nSample technique:');
        console.log(`Product: ${sample.product.name} (${sample.product.id})`);
        console.log(`Technique: ${sample.technique} (${sample.label})`);
        console.log(`Description: ${sample.description}`);
        console.log(`Is Default: ${sample.isDefault}`);
        console.log(`Placements: ${sample.placements.length}`);
        console.log(`Sample placements:`, sample.placements.slice(0, 3).map(p => `${p.placement} (${p.label})`));
      }
    } else {
      console.log('\nNo technique data found in database.');
      console.log('The sync may have failed or no products have mockup styles available.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();