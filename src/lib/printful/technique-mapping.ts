/**
 * Product Technique Mapping
 *
 * Authoritative source of truth for which printing techniques are valid for each product type.
 * This fixes the bug where products like stickers were incorrectly assigned DTG technique.
 *
 * Printful-specific techniques:
 * - dtg: Direct-to-Garment (standard apparel)
 * - dtfilm: DTF/Direct-to-Film (hats, caps)
 * - embroidery: Embroidered designs (hats, polos)
 * - digital: Generic digital printing (stickers, magnets, decals)
 * - sublimation: Sublimation printing (mugs, cups, drinkware)
 * - knitting: Knitted products (knitwear, sweaters)
 * - uv: UV printing (certain bags, phone cases)
 */

export type PrintTechnique =
  | 'dtg'
  | 'dtfilm'
  | 'embroidery'
  | 'digital'
  | 'sublimation'
  | 'knitting'
  | 'uv';

export interface TechniqueConfig {
  default: PrintTechnique;
  techniques: readonly PrintTechnique[];
}

export interface TechniqueInfo {
  technique: PrintTechnique;
  label: string;
  description: string;
}

/**
 * Authoritative mapping of product types to their valid printing techniques.
 *
 * Product Categories:
 * - digital: Stickers, magnets, decals (digital/UV printing)
 * - sublimation: Mugs, cups, drinkware (sublimation printing)
 * - dtg: Standard apparel (Direct-to-Garment printing)
 * - dtfilm: Hats and caps (DTF/Direct-to-Film printing)
 * - embroidery: Embroidered items (typically hats, polos)
 * - knitting: Knitwear (knitted designs)
 * - uv: UV-printed items (some bags, phone cases)
 *
 * IMPORTANT: These technique names MUST match Printful's API expectations.
 * Printful will reject requests with invalid techniques.
 */
export const PRODUCT_TECHNIQUE_MAPPING: Record<string, TechniqueConfig> = {
  // Stickers & Print Items -> digital only
  sticker: { default: 'digital', techniques: ['digital'] },
  magnet: { default: 'digital', techniques: ['digital'] },
  decal: { default: 'digital', techniques: ['digital'] },
  'kiss-cut': { default: 'digital', techniques: ['digital'] },
  'die-cut': { default: 'digital', techniques: ['digital'] },

  // Drinkware -> sublimation (NOT digital!)
  // Printful requires 'sublimation' technique for mugs/cups
  mug: { default: 'sublimation', techniques: ['sublimation'] },
  cup: { default: 'sublimation', techniques: ['sublimation'] },
  tumbler: { default: 'sublimation', techniques: ['sublimation'] },
  bottle: { default: 'sublimation', techniques: ['sublimation'] },

  // Headwear -> dtfilm primary, embroidery optional
  hat: { default: 'dtfilm', techniques: ['dtfilm', 'embroidery'] },
  cap: { default: 'dtfilm', techniques: ['dtfilm', 'embroidery'] },
  beanie: { default: 'embroidery', techniques: ['embroidery', 'dtfilm'] },
  snapback: { default: 'dtfilm', techniques: ['dtfilm', 'embroidery'] },
  trucker: { default: 'dtfilm', techniques: ['dtfilm', 'embroidery'] },
  visor: { default: 'dtfilm', techniques: ['dtfilm', 'embroidery'] },

  // Apparel -> dtg
  't-shirt': { default: 'dtg', techniques: ['dtg'] },
  tee: { default: 'dtg', techniques: ['dtg'] },
  hoodie: { default: 'dtg', techniques: ['dtg'] },
  sweatshirt: { default: 'dtg', techniques: ['dtg'] },
  polo: { default: 'dtg', techniques: ['dtg', 'embroidery'] },
  'tank-top': { default: 'dtg', techniques: ['dtg'] },
  tank: { default: 'dtg', techniques: ['dtg'] },
  'long-sleeve': { default: 'dtg', techniques: ['dtg'] },
  longsleeve: { default: 'dtg', techniques: ['dtg'] },
  jersey: { default: 'dtg', techniques: ['dtg'] },
  jacket: { default: 'dtg', techniques: ['dtg', 'embroidery'] },

  // Knitwear -> knitting (NOT dtg!)
  // Printful requires 'knitting' technique for knitted products
  knitwear: { default: 'knitting', techniques: ['knitting'] },
  sweater: { default: 'knitting', techniques: ['knitting'] },
  'crew-neck': { default: 'knitting', techniques: ['knitting'] },

  // Bags -> dtg for most, uv for some specialty bags
  'tote-bag': { default: 'dtg', techniques: ['dtg'] },
  tote: { default: 'dtg', techniques: ['dtg'] },
  bag: { default: 'dtg', techniques: ['dtg'] },
  backpack: { default: 'dtg', techniques: ['dtg'] },
  'crossbody': { default: 'uv', techniques: ['uv'] },
  'fanny-pack': { default: 'uv', techniques: ['uv'] },
} as const;

/**
 * Technique labels and descriptions for UI display
 */
export const TECHNIQUE_INFO: Record<PrintTechnique, Omit<TechniqueInfo, 'technique'>> = {
  dtg: {
    label: 'Direct-to-Garment',
    description: 'High-quality, detailed print directly on fabric',
  },
  dtfilm: {
    label: 'DTF Print',
    description: 'Full-color print with vibrant colors, more detail',
  },
  embroidery: {
    label: 'Embroidery',
    description: 'Classic stitched design with premium look',
  },
  digital: {
    label: 'Digital Print',
    description: 'Vibrant, permanent full-color print',
  },
  sublimation: {
    label: 'Sublimation',
    description: 'Durable, fade-resistant print infused into the material',
  },
  knitting: {
    label: 'Knitted',
    description: 'Design woven directly into the fabric',
  },
  uv: {
    label: 'UV Print',
    description: 'High-resolution UV-cured print with sharp details',
  },
};

/**
 * Keywords to match product names to types (in priority order - most specific first)
 */
const PRODUCT_TYPE_KEYWORDS: Array<{ keywords: string[]; type: string }> = [
  // Stickers (most specific first)
  { keywords: ['kiss-cut sticker', 'kiss cut sticker'], type: 'kiss-cut' },
  { keywords: ['die-cut sticker', 'die cut sticker'], type: 'die-cut' },
  { keywords: ['sticker'], type: 'sticker' },
  { keywords: ['magnet'], type: 'magnet' },
  { keywords: ['decal'], type: 'decal' },

  // Drinkware
  { keywords: ['tumbler'], type: 'tumbler' },
  { keywords: ['mug', 'coffee mug'], type: 'mug' },
  { keywords: ['cup'], type: 'cup' },
  { keywords: ['bottle', 'water bottle'], type: 'bottle' },

  // Headwear (most specific first)
  { keywords: ['snapback'], type: 'snapback' },
  { keywords: ['trucker hat', 'trucker cap'], type: 'trucker' },
  { keywords: ['dad hat', 'dad cap'], type: 'hat' },
  { keywords: ['beanie'], type: 'beanie' },
  { keywords: ['visor'], type: 'visor' },
  { keywords: ['hat'], type: 'hat' },
  { keywords: ['cap'], type: 'cap' },

  // Apparel (most specific first - MUST come before knitwear crew-neck)
  { keywords: ['hoodie', 'hooded sweatshirt'], type: 'hoodie' },
  { keywords: ['sweatshirt', 'crewneck sweatshirt'], type: 'sweatshirt' },

  // Knitwear (after sweatshirt to avoid false positives on "crew neck sweatshirt")
  { keywords: ['knitwear', 'knitted'], type: 'knitwear' },
  { keywords: ['sweater', 'crew neck sweater', 'knit sweater'], type: 'sweater' },
  { keywords: ['knit crew neck', 'knitted crew neck'], type: 'crew-neck' },
  { keywords: ['long sleeve', 'long-sleeve', 'longsleeve'], type: 'long-sleeve' },
  { keywords: ['tank top', 'tank-top', 'tanktop', 'racerback'], type: 'tank-top' },
  { keywords: ['polo'], type: 'polo' },
  { keywords: ['jersey'], type: 'jersey' },
  { keywords: ['jacket'], type: 'jacket' },
  { keywords: ['t-shirt', 'tee', 'tshirt'], type: 't-shirt' },

  // Bags (UV bags first, then standard bags)
  { keywords: ['crossbody', 'cross-body', 'cross body'], type: 'crossbody' },
  { keywords: ['fanny pack', 'fanny-pack', 'belt bag', 'waist bag'], type: 'fanny-pack' },
  { keywords: ['tote bag', 'tote-bag', 'tote'], type: 'tote-bag' },
  { keywords: ['backpack'], type: 'backpack' },
  { keywords: ['bag'], type: 'bag' },
];

/**
 * Get product type from product name using keyword matching.
 *
 * Uses priority-ordered keyword matching to find the most specific match.
 * For example, "Kiss-Cut Stickers" matches 'kiss-cut' before 'sticker'.
 *
 * @param productName - The product name to analyze
 * @returns The normalized product type, or null if unknown
 */
export function getProductTypeFromName(productName: string): string | null {
  const name = productName.toLowerCase();

  for (const { keywords, type } of PRODUCT_TYPE_KEYWORDS) {
    for (const keyword of keywords) {
      if (name.includes(keyword)) {
        return type;
      }
    }
  }

  return null;
}

/**
 * Get the valid technique configuration for a product type.
 *
 * @param productType - The normalized product type
 * @returns TechniqueConfig with default and available techniques, or null if unknown
 */
export function getTechniqueConfigForProductType(
  productType: string
): TechniqueConfig | null {
  return PRODUCT_TECHNIQUE_MAPPING[productType] || null;
}

/**
 * Check if a technique is embedded in the placement name.
 *
 * Some placements explicitly indicate their technique:
 * - embroidery_front → embroidery
 * - front_dtf_hat → dtfilm
 *
 * @param placement - The placement name
 * @returns The technique if explicit, or null if ambiguous
 */
export function extractTechniqueFromPlacement(
  placement: string
): PrintTechnique | null {
  const p = placement.toLowerCase();

  // Embroidery placements
  if (p.includes('embroidery')) {
    return 'embroidery';
  }

  // DTF/DTFilm placements
  if (p.includes('_dtf') || p.includes('dtfilm') || p.includes('dtf_')) {
    return 'dtfilm';
  }

  // All other placements are ambiguous (front, back, default, etc.)
  return null;
}

/**
 * Infer the correct technique for a product and placement combination.
 *
 * This is the main entry point for technique detection. It follows this logic:
 * 1. If technique is explicit in placement name (embroidery_front), use that
 * 2. Otherwise, use product-type based mapping
 * 3. Fall back to DTG only for unknown apparel-like products
 *
 * @param productName - The full product name
 * @param placement - The placement name
 * @returns TechniqueInfo with technique, label, and description
 */
export function inferTechniqueFromProductAndPlacement(
  productName: string,
  placement: string
): TechniqueInfo {
  // Step 1: Check if technique is explicit in placement
  const explicitTechnique = extractTechniqueFromPlacement(placement);
  if (explicitTechnique) {
    return {
      technique: explicitTechnique,
      ...TECHNIQUE_INFO[explicitTechnique],
    };
  }

  // Step 2: Get product type and use mapping
  const productType = getProductTypeFromName(productName);
  if (productType) {
    const config = PRODUCT_TECHNIQUE_MAPPING[productType];
    if (config) {
      return {
        technique: config.default,
        ...TECHNIQUE_INFO[config.default],
      };
    }
  }

  // Step 3: Fallback for unknown products
  // Log a warning so we can add new product types
  console.warn(
    `[Technique Mapping] Unknown product type for "${productName}", defaulting to DTG`
  );

  return {
    technique: 'dtg',
    ...TECHNIQUE_INFO['dtg'],
  };
}

/**
 * Get all valid techniques for a product.
 *
 * @param productName - The product name
 * @returns Array of valid techniques with their info
 */
export function getValidTechniquesForProduct(
  productName: string
): TechniqueInfo[] {
  const productType = getProductTypeFromName(productName);

  if (productType) {
    const config = PRODUCT_TECHNIQUE_MAPPING[productType];
    if (config) {
      return config.techniques.map((technique) => ({
        technique,
        ...TECHNIQUE_INFO[technique],
      }));
    }
  }

  // Default to DTG for unknown products
  return [{ technique: 'dtg', ...TECHNIQUE_INFO['dtg'] }];
}

/**
 * Get the default technique for a product.
 *
 * @param productName - The product name
 * @returns The default TechniqueInfo for the product
 */
export function getDefaultTechniqueForProduct(productName: string): TechniqueInfo {
  const productType = getProductTypeFromName(productName);

  if (productType) {
    const config = PRODUCT_TECHNIQUE_MAPPING[productType];
    if (config) {
      return {
        technique: config.default,
        ...TECHNIQUE_INFO[config.default],
      };
    }
  }

  return { technique: 'dtg', ...TECHNIQUE_INFO['dtg'] };
}
