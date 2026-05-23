import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env.local', override: true });

async function getDetailedStats() {
  console.log('=== MOCKUP PRE-GENERATION ANALYSIS ===\n');

  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  try {
    // Basic counts
    const productCount = await prisma.product.count({ where: { active: true } });
    const variantCount = await prisma.productVariant.count();

    console.log('📦 PRODUCT COUNTS');
    console.log('  Active products:', productCount);
    console.log('  Total variants:', variantCount);

    // By category
    const byCategory = await prisma.product.groupBy({
      by: ['category'],
      where: { active: true },
      _count: true,
    });
    console.log('\n📂 BY CATEGORY');
    byCategory.forEach(c => console.log('  ' + c.category + ':', c._count));

    // By product type (for placement estimation)
    const byType = await prisma.product.groupBy({
      by: ['productType'],
      where: { active: true },
      _count: true,
      orderBy: { _count: { productType: 'desc' } },
    });
    console.log('\n🏷️ BY PRODUCT TYPE (for placement estimation)');
    byType.slice(0, 15).forEach(t => console.log('  ' + t.productType + ':', t._count));
    if (byType.length > 15) console.log('  ... and ' + (byType.length - 15) + ' more types');

    // Calculate mockup estimates
    let mockupsNeeded = 0;
    const placementEstimates: Record<string, number> = {
      'tshirt': 2, 't-shirt': 2, 'hoodie': 2, 'sweatshirt': 2, 'longsleeve': 2, 'tank': 2,
      'hat': 1, 'cap': 1, 'beanie': 1,
      'mug': 1, 'tumbler': 1,
      'bag': 1, 'tote': 1,
      'sticker': 1, 'magnet': 1,
      'default': 2,
    };

    console.log('\n📊 MOCKUP GENERATION ESTIMATES');
    for (const t of byType) {
      const type = (t.productType || '').toLowerCase();
      let placements = placementEstimates['default'];
      for (const [key, val] of Object.entries(placementEstimates)) {
        if (type.includes(key)) {
          placements = val;
          break;
        }
      }
      mockupsNeeded += t._count * placements;
    }

    console.log('  Total mockups needed (1 style/placement):', mockupsNeeded);
    console.log('  At 5 concurrent (rate limited): ~' + Math.ceil(mockupsNeeded / 45) + ' minutes');
    console.log('  At 10 concurrent: ~' + Math.ceil(mockupsNeeded / 90) + ' minutes');

    // Variants per product (for understanding complexity)
    const variantsPerProduct = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        _count: { select: { variants: true } },
      },
      orderBy: { variants: { _count: 'desc' } },
      take: 5,
    });
    console.log('\n🔢 MOST VARIANTS (complexity indicator)');
    variantsPerProduct.forEach(p =>
      console.log('  ' + p.name.substring(0, 40) + '...: ' + p._count.variants + ' variants')
    );

  } catch (e: any) {
    console.log('❌ ERROR:', e.message);
  }

  await prisma.$disconnect();
}

getDetailedStats().catch(console.error);
