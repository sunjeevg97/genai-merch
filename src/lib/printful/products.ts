/**
 * Printful Product Utilities
 *
 * Helper functions for processing Printful products and calculating pricing.
 */

import type { PrintfulProduct } from './types';

/**
 * Supported product categories
 */
export const SUPPORTED_CATEGORIES = ['apparel', 'accessories', 'home-living'] as const;

/**
 * Supported product types (Printful type field values)
 */
export const SUPPORTED_PRODUCT_TYPES = [
  't-shirt',
  'sweatshirt',
  'hoodie',
  'mug',
  'sticker',
  'tote-bag',
  'hat',
  'polo',
  'tank-top',
  'long-sleeve',
] as const;

/**
 * Product types to exclude from our catalog
 */
export const EXCLUDED_PRODUCT_TYPES = [
  'baby',
  'poster',
  'phone-case',
  'canvas',
  'pillow',
  'blanket',
  'towel',
  'leggings',
  'yoga',
] as const;

/**
 * Pricing Configuration
 */
export const PRICING_CONFIG = {
  MARKUP_MULTIPLIER: 2.0, // 2x base price
  ROUND_TO_CENTS: 99, // Round to .99
} as const;

/**
 * Calculate retail price from Printful base price
 *
 * Strategy:
 * 1. Multiply base price by markup (2x)
 * 2. Round to nearest dollar
 * 3. Subtract 1 cent to get .99 ending
 *
 * @param basePriceCents - Printful base price in cents
 * @returns Retail price in cents
 *
 * @example
 * calculateRetailPrice(1150); // $11.50 → $22.99 = 2299 cents
 * calculateRetailPrice(2495); // $24.95 → $48.99 = 4899 cents
 */
export function calculateRetailPrice(basePriceCents: number): number {
  // Apply markup
  const markedUpPrice = basePriceCents * PRICING_CONFIG.MARKUP_MULTIPLIER;

  // Round to nearest dollar (in cents)
  const roundedToDollar = Math.round(markedUpPrice / 100) * 100;

  // Subtract 1 cent to get .99 ending
  const retailPrice = roundedToDollar - 1;

  return retailPrice;
}

/**
 * Parse size and color from Printful variant name
 *
 * Printful variant names are typically formatted as:
 * - "Medium / Black"
 * - "S / White"
 * - "One Size / Natural"
 * - "11oz / White"
 *
 * @param variantName - Printful variant name string
 * @returns Object with size and color
 *
 * @example
 * parseVariantAttributes("Medium / Black");
 * // { size: "Medium", color: "Black" }
 *
 * parseVariantAttributes("S / White");
 * // { size: "S", color: "White" }
 *
 * parseVariantAttributes("11oz");
 * // { size: "11oz", color: null }
 */
export function parseVariantAttributes(variantName: string): {
  size: string | null;
  color: string | null;
} {
  // Split by " / " delimiter
  const parts = variantName.split(' / ').map((part) => part.trim());

  if (parts.length >= 2) {
    // Standard format: "Size / Color"
    return {
      size: parts[0],
      color: parts[1],
    };
  } else if (parts.length === 1) {
    // Single attribute (usually size for items like mugs)
    // Try to determine if it's a size or color
    const value = parts[0];

    // Common size patterns
    const sizePatterns = /^(XXS|XS|S|M|L|XL|XXL|XXXL|\d+oz|One Size)$/i;

    if (sizePatterns.test(value)) {
      return { size: value, color: null };
    } else {
      // Assume it's a color if not a size pattern
      return { size: null, color: value };
    }
  }

  // Fallback: no attributes parsed
  return { size: null, color: null };
}

/**
 * Determine if product should be included in our catalog
 *
 * Filters based on:
 * - Category (apparel, accessories, home-living)
 * - Product type (t-shirts, hoodies, mugs, etc.)
 * - Exclusions (baby clothes, posters, phone cases)
 * - Active status (not discontinued)
 *
 * @param product - Printful product object
 * @returns True if product should be synced
 *
 * @example
 * shouldIncludeProduct(tshirtProduct); // true
 * shouldIncludeProduct(babyProduct); // false
 * shouldIncludeProduct(posterProduct); // false
 */
export function shouldIncludeProduct(product: PrintfulProduct): boolean {
  // Check if product is discontinued
  if (product.is_discontinued) {
    return false;
  }

  // Normalize product type for comparison
  const productType = product.type.toLowerCase();
  const productTitle = product.title.toLowerCase();

  // Check for excluded types in product type or title
  for (const excluded of EXCLUDED_PRODUCT_TYPES) {
    if (
      productType.includes(excluded) ||
      productTitle.includes(excluded)
    ) {
      return false;
    }
  }

  // Check if product type is in our supported list
  for (const supported of SUPPORTED_PRODUCT_TYPES) {
    if (
      productType.includes(supported) ||
      productTitle.includes(supported)
    ) {
      return true;
    }
  }

  // Check for additional keywords that indicate apparel/accessories
  const includedKeywords = [
    'shirt',
    'sweat',
    'hoodie',
    'polo',
    'tank',
    'sleeve',
    'mug',
    'cup',
    'sticker',
    'decal',
    'tote',
    'bag',
    'hat',
    'cap',
    'beanie',
  ];

  for (const keyword of includedKeywords) {
    if (productTitle.includes(keyword) || productType.includes(keyword)) {
      return true;
    }
  }

  // Default: exclude
  return false;
}

/**
 * Map Printful product type to our internal category
 *
 * @param product - Printful product
 * @returns Category string (apparel, accessories, home-living)
 */
export function mapProductCategory(product: PrintfulProduct): string {
  const type = product.type.toLowerCase();
  const title = product.title.toLowerCase();

  // Apparel
  const apparelKeywords = [
    'shirt',
    'sweat',
    'hoodie',
    'polo',
    'tank',
    'sleeve',
    'jacket',
  ];
  for (const keyword of apparelKeywords) {
    if (type.includes(keyword) || title.includes(keyword)) {
      return 'apparel';
    }
  }

  // Accessories
  const accessoryKeywords = ['hat', 'cap', 'beanie', 'bag', 'tote', 'sticker'];
  for (const keyword of accessoryKeywords) {
    if (type.includes(keyword) || title.includes(keyword)) {
      return 'accessories';
    }
  }

  // Home & Living
  const homeKeywords = ['mug', 'cup', 'bottle'];
  for (const keyword of homeKeywords) {
    if (type.includes(keyword) || title.includes(keyword)) {
      return 'home-living';
    }
  }

  // Default to apparel
  return 'apparel';
}

/**
 * Convert Printful price string to cents
 *
 * @param priceString - Price as string (e.g., "11.50", "24.95")
 * @returns Price in cents
 *
 * @example
 * parsePriceToCents("11.50"); // 1150
 * parsePriceToCents("24.95"); // 2495
 */
export function parsePriceToCents(priceString: string): number {
  const price = parseFloat(priceString);
  return Math.round(price * 100);
}

/**
 * Format cents to dollar string
 *
 * @param cents - Price in cents
 * @returns Formatted price string
 *
 * @example
 * formatCentsToDollars(2299); // "$22.99"
 * formatCentsToDollars(4899); // "$48.99"
 */
export function formatCentsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
