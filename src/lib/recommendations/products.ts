/**
 * Product Recommendation Engine
 *
 * Recommends Printful products based on event type and details.
 * Uses audience demographics and event context to suggest 5-10 relevant products.
 */

import { prisma } from '@/lib/prisma';
import type { EventType, EventDetails } from '@/lib/store/design-wizard';

/**
 * Product Type Priority Map
 *
 * Defines which product types are most relevant for each event type.
 * Order matters - first items are prioritized.
 */
const PRODUCT_TYPE_PRIORITIES: Record<EventType, string[]> = {
  charity: [
    't-shirt',           // Most popular charity merch
    'sweatshirt',        // Comfort items people love
    'hoodie',
    'tote-bag',          // Eco-friendly, practical
    'mug',               // Affordable donation items
    'tank-top',
    'long-sleeve-shirt',
  ],
  sports: [
    't-shirt',           // Team uniforms
    'tank-top',          // Athletic wear
    'sweatshirt',        // Warm-ups
    'hoodie',
    'hat',               // Team spirit gear
    'cap',
    'polo',              // Coach apparel
  ],
  company: [
    'polo',              // Professional branded wear
    't-shirt',           // Casual employee apparel
    'sweatshirt',
    'hoodie',
    'tote-bag',          // Conference swag
    'mug',               // Office items
    'hat',
    'cap',
  ],
  family: [
    't-shirt',           // Matching family shirts
    'sweatshirt',        // All-age comfort
    'hoodie',
    'tank-top',          // Summer reunions
    'long-sleeve-shirt',
    'hat',
    'mug',               // Keepsakes
  ],
  school: [
    't-shirt',           // Spirit wear
    'hoodie',            // Campus essentials
    'sweatshirt',
    'tank-top',          // Athletic events
    'long-sleeve-shirt',
    'hat',
    'tote-bag',          // Book bags
  ],
  other: [
    't-shirt',           // Universal appeal
    'hoodie',
    'sweatshirt',
    'hat',
    'mug',
    'tote-bag',
  ],
};

/**
 * Category Priority Map
 *
 * Defines which product categories are most relevant for each event type.
 */
const CATEGORY_PRIORITIES: Record<EventType, string[]> = {
  charity: ['apparel', 'accessories', 'home-living'],
  sports: ['apparel', 'accessories'],
  company: ['apparel', 'accessories', 'home-living'],
  family: ['apparel', 'accessories', 'home-living'],
  school: ['apparel', 'accessories'],
  other: ['apparel', 'accessories', 'home-living'],
};

/**
 * Age Group to Product Type Filter
 *
 * Filters products based on age group (for sports teams).
 */
function filterByAgeGroup(productTypes: string[], ageGroup?: string): string[] {
  if (!ageGroup) return productTypes;

  switch (ageGroup) {
    case 'youth':
      // Youth prefer comfortable, casual items
      return productTypes.filter((type) =>
        ['t-shirt', 'sweatshirt', 'hoodie', 'tank-top', 'hat', 'cap'].includes(type)
      );
    case 'adult':
      // Adults appreciate variety
      return productTypes;
    case 'senior':
      // Seniors prefer comfort and classic styles
      return productTypes.filter((type) =>
        ['t-shirt', 'polo', 'sweatshirt', 'long-sleeve-shirt', 'hat', 'mug'].includes(type)
      );
    default:
      return productTypes;
  }
}

/**
 * Industry to Product Type Filter
 *
 * Filters products based on company industry.
 */
function filterByIndustry(productTypes: string[], industry?: string): string[] {
  if (!industry) return productTypes;

  const industryLower = industry.toLowerCase();

  // Tech companies often prefer casual branded gear
  if (industryLower.includes('tech') || industryLower.includes('software')) {
    return ['t-shirt', 'hoodie', 'sweatshirt', 'tote-bag', 'mug', ...productTypes];
  }

  // Professional industries prefer polished items
  if (
    industryLower.includes('finance') ||
    industryLower.includes('legal') ||
    industryLower.includes('consulting')
  ) {
    return ['polo', 't-shirt', 'mug', 'tote-bag', ...productTypes];
  }

  // Healthcare prefers practical, comfortable items
  if (industryLower.includes('health') || industryLower.includes('medical')) {
    return ['polo', 't-shirt', 'sweatshirt', 'mug', ...productTypes];
  }

  return productTypes;
}

/**
 * Get Recommended Products
 *
 * Main recommendation function. Returns 5-10 product IDs based on event type and details.
 *
 * @param eventType - The type of event
 * @param eventDetails - Additional event context
 * @param limit - Maximum number of products to return (default: 10)
 * @returns Array of recommended product IDs
 */
export async function getRecommendedProducts(
  eventType: EventType,
  eventDetails: EventDetails = {},
  limit: number = 10
): Promise<string[]> {
  // Get priority product types for this event
  let productTypes = PRODUCT_TYPE_PRIORITIES[eventType] || PRODUCT_TYPE_PRIORITIES.other;

  // Apply age group filter for sports teams
  if (eventType === 'sports' && eventDetails.ageGroup) {
    productTypes = filterByAgeGroup(productTypes, eventDetails.ageGroup);
  }

  // Apply industry filter for companies
  if (eventType === 'company' && eventDetails.industry) {
    productTypes = filterByIndustry(productTypes, eventDetails.industry);
  }

  // Get categories in priority order
  const categories = CATEGORY_PRIORITIES[eventType] || CATEGORY_PRIORITIES.other;

  // Fetch products from database
  const products = await prisma.product.findMany({
    where: {
      active: true,
      OR: [
        // Match by product type (highest priority)
        { productType: { in: productTypes } },
        // Match by category (lower priority)
        { category: { in: categories } },
      ],
    },
    select: {
      id: true,
      productType: true,
      category: true,
      basePrice: true,
    },
    take: limit * 3, // Fetch more than needed for better sorting
  });

  // Score and sort products
  const scoredProducts = products.map((product) => {
    let score = 0;

    // Product type match score (0-100)
    const typeIndex = productTypes.indexOf(product.productType);
    if (typeIndex !== -1) {
      score += 100 - typeIndex * 5; // Earlier in list = higher score
    }

    // Category match score (0-30)
    const categoryIndex = categories.indexOf(product.category);
    if (categoryIndex !== -1) {
      score += 30 - categoryIndex * 10;
    }

    // Price favorability (0-20)
    // Prefer mid-range prices (not too cheap, not too expensive)
    const price = product.basePrice;
    if (price >= 1500 && price <= 3500) {
      // $15-$35 sweet spot
      score += 20;
    } else if (price >= 1000 && price <= 5000) {
      // $10-$50 acceptable
      score += 10;
    }

    return { ...product, score };
  });

  // Sort by score (descending) and return IDs
  const recommendedIds = scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p) => p.id);

  return recommendedIds;
}

/**
 * Get Product Recommendations by Category
 *
 * Returns recommended products grouped by category.
 * Useful for displaying recommendations in sections.
 *
 * @param eventType - The type of event
 * @param eventDetails - Additional event context
 * @returns Object with products grouped by category
 */
export async function getRecommendedProductsByCategory(
  eventType: EventType,
  eventDetails: EventDetails = {}
): Promise<Record<string, string[]>> {
  const productIds = await getRecommendedProducts(eventType, eventDetails, 10);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, category: true },
  });

  const grouped: Record<string, string[]> = {
    apparel: [],
    accessories: [],
    'home-living': [],
  };

  products.forEach((product) => {
    if (grouped[product.category]) {
      grouped[product.category].push(product.id);
    }
  });

  return grouped;
}

/**
 * Get Audience-Appropriate Product Types
 *
 * Returns product types that match the target audience.
 * Used for additional filtering in UI.
 *
 * @param targetAudience - Description of who will use the products
 * @returns Array of recommended product types
 */
export function getProductTypesForAudience(targetAudience?: string): string[] {
  if (!targetAudience) {
    return PRODUCT_TYPE_PRIORITIES.other;
  }

  const audienceLower = targetAudience.toLowerCase();

  // Kids/Youth
  if (audienceLower.includes('kid') || audienceLower.includes('youth') || audienceLower.includes('child')) {
    return ['t-shirt', 'sweatshirt', 'hoodie', 'tank-top', 'hat', 'cap'];
  }

  // Adults
  if (audienceLower.includes('adult') || audienceLower.includes('professional')) {
    return ['t-shirt', 'polo', 'sweatshirt', 'hoodie', 'long-sleeve-shirt', 'hat', 'mug', 'tote-bag'];
  }

  // Seniors
  if (audienceLower.includes('senior') || audienceLower.includes('elderly')) {
    return ['t-shirt', 'polo', 'sweatshirt', 'long-sleeve-shirt', 'mug'];
  }

  // All ages
  if (audienceLower.includes('all') || audienceLower.includes('family') || audienceLower.includes('everyone')) {
    return ['t-shirt', 'sweatshirt', 'hoodie', 'hat', 'mug'];
  }

  return PRODUCT_TYPE_PRIORITIES.other;
}
