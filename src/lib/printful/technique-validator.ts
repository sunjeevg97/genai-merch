/**
 * Technique Validator
 *
 * Validation layer to prevent invalid technique-product combinations
 * from reaching the Printful API. This catches misconfigurations and
 * provides helpful suggestions for auto-correction.
 */

import {
  PrintTechnique,
  getProductTypeFromName,
  PRODUCT_TECHNIQUE_MAPPING,
  TECHNIQUE_INFO,
} from './technique-mapping';

export interface ValidationResult {
  valid: boolean;
  suggestedTechnique?: PrintTechnique;
  reason?: string;
  productType?: string;
}

/**
 * Validate that a technique is valid for a given product.
 *
 * @param productName - The full product name
 * @param technique - The technique to validate
 * @returns ValidationResult with validity status and suggestions
 *
 * @example
 * validateTechniqueForProduct('Kiss-Cut Stickers', 'dtg');
 * // { valid: false, suggestedTechnique: 'digital', reason: '...' }
 *
 * validateTechniqueForProduct('Unisex T-Shirt', 'dtg');
 * // { valid: true }
 */
export function validateTechniqueForProduct(
  productName: string,
  technique: string
): ValidationResult {
  const productType = getProductTypeFromName(productName);

  // If we can't determine product type, allow the technique (best effort)
  if (!productType) {
    console.warn(
      `[Technique Validator] Unknown product type for "${productName}", allowing technique "${technique}"`
    );
    return {
      valid: true,
      reason: `Unknown product type - technique "${technique}" allowed by default`,
    };
  }

  const config = PRODUCT_TECHNIQUE_MAPPING[productType];

  if (!config) {
    // Product type recognized but not in mapping - this shouldn't happen
    console.error(
      `[Technique Validator] Product type "${productType}" has no technique mapping`
    );
    return {
      valid: true,
      productType,
      reason: `Product type "${productType}" has no technique mapping - allowing`,
    };
  }

  // Check if the requested technique is in the allowed list
  if (!config.techniques.includes(technique as PrintTechnique)) {
    return {
      valid: false,
      suggestedTechnique: config.default,
      productType,
      reason: `Technique "${technique}" is not valid for ${productType}. Valid techniques: ${config.techniques.join(', ')}`,
    };
  }

  return {
    valid: true,
    productType,
  };
}

/**
 * Auto-correct an invalid technique for a product.
 *
 * If the technique is invalid, returns the default technique for the product.
 * If valid, returns the original technique.
 *
 * @param productName - The full product name
 * @param technique - The technique to validate and possibly correct
 * @returns The corrected technique (or original if valid)
 */
export function autoCorrectTechnique(
  productName: string,
  technique: string
): PrintTechnique {
  const validation = validateTechniqueForProduct(productName, technique);

  if (!validation.valid && validation.suggestedTechnique) {
    console.warn(
      `[Technique Validator] Auto-correcting technique for "${productName}": ` +
        `"${technique}" → "${validation.suggestedTechnique}". ` +
        `Reason: ${validation.reason}`
    );
    return validation.suggestedTechnique;
  }

  return technique as PrintTechnique;
}

/**
 * Validate a technique-placement combination for a product.
 *
 * Some placements are only valid for specific techniques (e.g., embroidery_front
 * is only valid with embroidery technique).
 *
 * @param productName - The full product name
 * @param technique - The technique
 * @param placement - The placement
 * @returns ValidationResult with validity status
 */
export function validateTechniquePlacement(
  productName: string,
  technique: string,
  placement: string
): ValidationResult {
  // First validate the technique itself
  const techniqueValidation = validateTechniqueForProduct(productName, technique);
  if (!techniqueValidation.valid) {
    return techniqueValidation;
  }

  const p = placement.toLowerCase();

  // Check for technique-placement mismatches
  // Embroidery placements require embroidery technique
  if (p.includes('embroidery') && technique !== 'embroidery') {
    return {
      valid: false,
      suggestedTechnique: 'embroidery',
      reason: `Placement "${placement}" requires embroidery technique, but "${technique}" was specified`,
    };
  }

  // DTF placements require dtfilm technique
  if ((p.includes('_dtf') || p.includes('dtf_')) && technique !== 'dtfilm') {
    return {
      valid: false,
      suggestedTechnique: 'dtfilm',
      reason: `Placement "${placement}" requires dtfilm technique, but "${technique}" was specified`,
    };
  }

  return { valid: true };
}

/**
 * Get a human-readable description of valid techniques for a product.
 *
 * @param productName - The product name
 * @returns A formatted string describing valid techniques
 */
export function getValidTechniquesDescription(productName: string): string {
  const productType = getProductTypeFromName(productName);

  if (!productType) {
    return 'Unknown product type - DTG (Direct-to-Garment) assumed';
  }

  const config = PRODUCT_TECHNIQUE_MAPPING[productType];
  if (!config) {
    return `${productType} - DTG (Direct-to-Garment) assumed`;
  }

  const techniqueDescriptions = config.techniques.map((t) => {
    const info = TECHNIQUE_INFO[t];
    const isDefault = t === config.default ? ' (default)' : '';
    return `${info.label}${isDefault}`;
  });

  return `${productType}: ${techniqueDescriptions.join(', ')}`;
}

/**
 * Batch validate techniques for multiple products.
 *
 * Useful for auditing database or cart items.
 *
 * @param items - Array of { productName, technique } objects
 * @returns Array of validation results with product info
 */
export function batchValidateTechniques(
  items: Array<{ productName: string; technique: string }>
): Array<ValidationResult & { productName: string; technique: string }> {
  return items.map((item) => ({
    ...validateTechniqueForProduct(item.productName, item.technique),
    productName: item.productName,
    technique: item.technique,
  }));
}

/**
 * Generate a validation report for a list of products.
 *
 * @param items - Array of { productName, technique } objects
 * @returns Report object with summary statistics and details
 */
export function generateValidationReport(
  items: Array<{ productName: string; technique: string }>
): {
  total: number;
  valid: number;
  invalid: number;
  details: Array<{
    productName: string;
    technique: string;
    valid: boolean;
    suggestedTechnique?: string;
    reason?: string;
  }>;
} {
  const results = batchValidateTechniques(items);

  return {
    total: results.length,
    valid: results.filter((r) => r.valid).length,
    invalid: results.filter((r) => !r.valid).length,
    details: results.map((r) => ({
      productName: r.productName,
      technique: r.technique,
      valid: r.valid,
      suggestedTechnique: r.suggestedTechnique,
      reason: r.reason,
    })),
  };
}
