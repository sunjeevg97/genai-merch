/**
 * Product Database Queries
 *
 * Server-side functions for fetching products from the database.
 */

import { prisma } from '@/lib/prisma';
import type { Product, ProductVariant } from '@prisma/client';

/**
 * Product with variants type
 */
export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

/**
 * Sort options
 */
export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

/**
 * Product query filters
 */
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  search?: string;
}

/**
 * Get all products with variants
 *
 * @param filters - Optional filters (category, price range, sort)
 * @returns Array of products with their variants
 */
export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductWithVariants[]> {
  const { category, minPrice, maxPrice, sort = 'featured', search } = filters;

  // Build where clause
  const where: any = {
    active: true,
  };

  if (category && category !== 'all') {
    where.category = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.basePrice = {};
    if (minPrice !== undefined) {
      where.basePrice.gte = minPrice;
    }
    if (maxPrice !== undefined) {
      where.basePrice.lte = maxPrice;
    }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { productType: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Build order by clause
  let orderBy: any = {};
  switch (sort) {
    case 'price-asc':
      orderBy = { basePrice: 'asc' };
      break;
    case 'price-desc':
      orderBy = { basePrice: 'desc' };
      break;
    case 'newest':
      orderBy = { createdAt: 'desc' };
      break;
    case 'featured':
    default:
      // Featured: sort by category, then by price
      orderBy = [{ category: 'asc' }, { basePrice: 'asc' }];
      break;
  }

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      variants: {
        take: 5, // Only fetch first 5 variants for performance
        orderBy: { price: 'asc' },
      },
    },
  });

  return products;
}

/**
 * Get product by ID with all variants
 *
 * @param productId - Product ID
 * @returns Product with all variants or null
 */
export async function getProductById(
  productId: string
): Promise<ProductWithVariants | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: {
        orderBy: [{ size: 'asc' }, { color: 'asc' }],
      },
    },
  });

  return product;
}

/**
 * Get product count by category
 *
 * @returns Object with category counts
 */
export async function getProductCounts(): Promise<{
  all: number;
  apparel: number;
  accessories: number;
  'home-living': number;
}> {
  const [all, apparel, accessories, homeLiving] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { active: true, category: 'apparel' } }),
    prisma.product.count({ where: { active: true, category: 'accessories' } }),
    prisma.product.count({ where: { active: true, category: 'home-living' } }),
  ]);

  return {
    all,
    apparel,
    accessories,
    'home-living': homeLiving,
  };
}

/**
 * Get price range for filtering
 *
 * @returns Min and max prices in cents
 */
export async function getPriceRange(): Promise<{ min: number; max: number }> {
  const result = await prisma.product.aggregate({
    where: { active: true },
    _min: { basePrice: true },
    _max: { basePrice: true },
  });

  return {
    min: result._min.basePrice || 0,
    max: result._max.basePrice || 10000,
  };
}
