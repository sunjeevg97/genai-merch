import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local first
config({ path: '.env.local' });
config({ path: '.env' });

// Use direct URL for scripts (bypasses pooler issues)
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
});

async function checkMappings() {
  // Check stickers (should be digital)
  const stickers = await prisma.productTechnique.findMany({
    where: {
      product: { name: { contains: 'Sticker', mode: 'insensitive' } }
    },
    include: { product: { select: { name: true } } }
  });
  console.log('\n=== STICKERS (should be digital) ===');
  stickers.forEach(s => console.log(`  ${s.product.name}: ${s.technique} (default: ${s.isDefault})`));

  // Check mugs (should be digital)
  const mugs = await prisma.productTechnique.findMany({
    where: {
      product: { name: { contains: 'Mug', mode: 'insensitive' } }
    },
    include: { product: { select: { name: true } } }
  });
  console.log('\n=== MUGS (should be digital) ===');
  mugs.forEach(m => console.log(`  ${m.product.name}: ${m.technique} (default: ${m.isDefault})`));

  // Check hats (should be dtfilm/embroidery)
  const hats = await prisma.productTechnique.findMany({
    where: {
      product: { name: { contains: 'Hat', mode: 'insensitive' } }
    },
    include: { product: { select: { name: true } } }
  });
  console.log('\n=== HATS (should be dtfilm/embroidery) ===');
  hats.forEach(h => console.log(`  ${h.product.name}: ${h.technique} (default: ${h.isDefault})`));

  // Check t-shirts (should be dtg)
  const tshirts = await prisma.productTechnique.findMany({
    where: {
      product: { name: { contains: 'T-Shirt', mode: 'insensitive' } }
    },
    include: { product: { select: { name: true } } },
    take: 10
  });
  console.log('\n=== T-SHIRTS (should be dtg) ===');
  tshirts.forEach(t => console.log(`  ${t.product.name}: ${t.technique} (default: ${t.isDefault})`));

  // Summary stats
  const stats = await prisma.productTechnique.groupBy({
    by: ['technique'],
    _count: true
  });
  console.log('\n=== TECHNIQUE DISTRIBUTION ===');
  stats.forEach(s => console.log(`  ${s.technique}: ${s._count} products`));

  await prisma.$disconnect();
}

checkMappings().catch(console.error);
