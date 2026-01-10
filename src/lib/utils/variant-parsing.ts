/**
 * Variant Name Parsing Utilities
 *
 * Parses Printful variant names to extract size and color.
 * Printful format: "Size / Color" or variations
 */

/**
 * Parse size from variant name
 * Handles formats like:
 * - "S / Black"
 * - "Medium / Heather Navy"
 * - "11oz"
 * - "UNISEX CLASSIC TEE | S | BLACK | BELLA+CANVAS..."
 */
export function parseSizeFromVariant(variantName: string, sizeField: string | null): string | null {
  // If we have a clean size field that doesn't look like a full name, use it
  if (sizeField && !sizeField.includes('|') && !sizeField.includes('UNISEX') && !sizeField.includes('CLASSIC')) {
    // Check if it's the standard "Size / Color" format
    if (sizeField.includes('/')) {
      const parts = sizeField.split('/');
      return parts[0]?.trim() || null;
    }
    return sizeField.trim();
  }

  // Parse from full variant name
  const name = variantName.trim();

  // Handle pipe-separated format: "UNISEX CLASSIC TEE | S | BLACK | ..."
  if (name.includes('|')) {
    const parts = name.split('|').map(p => p.trim());
    // Size is typically the second part (index 1)
    if (parts.length >= 2 && parts[1]) {
      const potentialSize = parts[1];
      // Check if it looks like a size (not a product type)
      if (isValidSize(potentialSize)) {
        return potentialSize;
      }
    }
  }

  // Handle slash format: "S / Black" or "Medium / Heather Navy"
  if (name.includes('/')) {
    const parts = name.split('/').map(p => p.trim());
    if (parts.length >= 1 && isValidSize(parts[0])) {
      return parts[0];
    }
  }

  // Handle single oz sizes: "11oz", "15oz"
  if (/^\d+\s*oz$/i.test(name)) {
    return name.toUpperCase();
  }

  return null;
}

/**
 * Parse color from variant name
 */
export function parseColorFromVariant(variantName: string, colorField: string | null): string | null {
  // If we have a clean color field that doesn't look like a full name, use it
  if (colorField && !colorField.includes('|') && !colorField.includes('UNISEX') && !colorField.includes('CLASSIC')) {
    // Check if it's the standard "Size / Color" format
    if (colorField.includes('/')) {
      const parts = colorField.split('/');
      return parts[1]?.trim() || null;
    }
    return colorField.trim();
  }

  // Parse from full variant name
  const name = variantName.trim();

  // Handle pipe-separated format: "UNISEX CLASSIC TEE | S | BLACK | ..."
  if (name.includes('|')) {
    const parts = name.split('|').map(p => p.trim());
    // Color is typically the third part (index 2)
    if (parts.length >= 3 && parts[2]) {
      const potentialColor = parts[2];
      // Check if it looks like a color (not a brand or code)
      if (isValidColor(potentialColor)) {
        return potentialColor;
      }
    }
  }

  // Handle slash format: "S / Black" or "Medium / Heather Navy"
  if (name.includes('/')) {
    const parts = name.split('/').map(p => p.trim());
    if (parts.length >= 2) {
      return parts[1]; // Second part is color
    }
  }

  // Handle color-only variants (some products)
  if (!name.includes('/') && !name.includes('|') && isValidColor(name)) {
    return name;
  }

  return null;
}

/**
 * Check if a string looks like a valid size
 */
function isValidSize(str: string): boolean {
  const normalized = str.toUpperCase().trim();

  // Standard sizes
  const standardSizes = [
    'XXS', 'XS', 'S', 'SM', 'SMALL',
    'M', 'MD', 'MED', 'MEDIUM',
    'L', 'LG', 'LARGE',
    'XL', '1XL', 'XXL', '2XL', 'XXXL', '3XL',
    '4XL', '5XL', '6XL',
    'ONE SIZE', 'ONE-SIZE', 'OS'
  ];

  if (standardSizes.includes(normalized)) {
    return true;
  }

  // Numeric sizes: 2, 4, 6, 8, etc.
  if (/^\d+$/.test(normalized) && parseInt(normalized) >= 2 && parseInt(normalized) <= 50) {
    return true;
  }

  // Oz sizes: 11oz, 15oz, etc.
  if (/^\d+\s*OZ$/i.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Check if a string looks like a valid color name
 */
function isValidColor(str: string): boolean {
  const normalized = str.toUpperCase().trim();

  // Exclude obvious non-colors
  const nonColors = [
    'UNISEX', 'CLASSIC', 'TEE', 'SHIRT', 'HOODIE', 'MUG',
    'BELLA', 'CANVAS', 'GILDAN', 'AMERICAN', 'APPAREL',
    'PREMIUM', 'SOFT', 'COTTON', 'BLEND'
  ];

  if (nonColors.some(nc => normalized.includes(nc))) {
    return false;
  }

  // Exclude SKU-like patterns (numbers with letters)
  if (/^\d{4,}/.test(normalized)) {
    return false;
  }

  // If it's short and doesn't contain obvious non-color words, it's probably a color
  return str.length > 0 && str.length < 50;
}
