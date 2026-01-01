/**
 * Size Ordering Utilities
 *
 * Provides standardized size ordering for apparel products.
 */

/**
 * Standard apparel size order (smallest to largest)
 */
const STANDARD_SIZE_ORDER = [
  // Extra small variants
  'XXS',
  'XS',

  // Small variants
  'S',
  'SM',
  'SMALL',

  // Medium variants
  'M',
  'MD',
  'MED',
  'MEDIUM',

  // Large variants
  'L',
  'LG',
  'LARGE',

  // Extra large variants
  'XL',
  '1XL',
  'XXL',
  '2XL',
  'XXXL',
  '3XL',
  'XXXXL',
  '4XL',
  '5XL',
  '6XL',

  // Numeric sizes (common for mugs, shoes, etc.)
  '2',
  '4',
  '6',
  '8',
  '10',
  '11',
  '12',
  '14',
  '15',
  '16',
  '18',
  '20',

  // Oz sizes (for mugs, bottles)
  '11OZ',
  '11 OZ',
  '15OZ',
  '15 OZ',
  '20OZ',
  '20 OZ',

  // One size
  'ONE SIZE',
  'ONE-SIZE',
  'OS',
];

/**
 * Sort sizes from smallest to largest
 */
export function sortSizes<T extends { value: string }>(sizes: T[]): T[] {
  return [...sizes].sort((a, b) => {
    const aNormalized = a.value.toUpperCase().trim();
    const bNormalized = b.value.toUpperCase().trim();

    const aIndex = STANDARD_SIZE_ORDER.indexOf(aNormalized);
    const bIndex = STANDARD_SIZE_ORDER.indexOf(bNormalized);

    // Both sizes are in standard order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // Only a is in standard order (prioritize it)
    if (aIndex !== -1) {
      return -1;
    }

    // Only b is in standard order (prioritize it)
    if (bIndex !== -1) {
      return 1;
    }

    // Neither in standard order - alphabetical fallback
    return aNormalized.localeCompare(bNormalized);
  });
}

/**
 * Format size label for display
 */
export function formatSizeLabel(size: string): string {
  const normalized = size.toUpperCase().trim();

  // Handle common variations
  if (normalized === 'SM' || normalized === 'SMALL') return 'S';
  if (normalized === 'MD' || normalized === 'MED' || normalized === 'MEDIUM') return 'M';
  if (normalized === 'LG' || normalized === 'LARGE') return 'L';
  if (normalized === 'ONE-SIZE' || normalized === 'OS') return 'One Size';

  // Return as-is for standard sizes
  return size.toUpperCase();
}
