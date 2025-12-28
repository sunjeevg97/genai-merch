/**
 * Mockup Configuration File
 *
 * This file defines product mockups and their print areas for the design studio.
 * Mockups are templates showing how logos will appear on different products.
 *
 * HOW TO MEASURE PRINT AREA COORDINATES:
 * =======================================
 * 1. Open your mockup image in an image editor (Photoshop, GIMP, etc.)
 * 2. Identify the printable area on the garment (chest area for t-shirts)
 * 3. Note the X and Y coordinates of the top-left corner of the print area
 * 4. Measure the width and height of the print area in pixels
 * 5. Add these values to the printArea object below
 *
 * STANDARD PRINT SIZES FOR T-SHIRTS:
 * ===================================
 * - Adult T-Shirt Front: 12" wide x 16" tall (typical maximum)
 * - Adult T-Shirt Back: 12" wide x 16" tall
 * - Youth T-Shirt: 10" wide x 14" tall
 * - Pocket Print: 3.5" wide x 3.5" tall
 * - Full Front Print: Up to 14" wide x 18" tall
 *
 * Note: Actual pixel dimensions depend on your mockup image resolution.
 * For a 1000px wide mockup, a 12" print area might be ~400px wide.
 *
 * HOW TO ADD NEW MOCKUPS:
 * =======================
 * 1. Create or obtain a high-quality product mockup image (PNG recommended)
 * 2. Save it in the public/mockups/ directory
 * 3. Measure the print area coordinates (see instructions above)
 * 4. Add a new entry to the MOCKUPS array below
 * 5. Ensure the ID is unique (use format: productType-color-view)
 * 6. Test the mockup in the design studio to verify alignment
 *
 * Example workflow:
 * - Add image: public/mockups/polo-navy-front.png
 * - Measure print area: x=220, y=190, width=180, height=230
 * - Add to MOCKUPS array (see examples below)
 */

/**
 * Product types available in the design studio
 */
export type ProductType = 'tshirt' | 'hoodie' | 'polo' | 'sweatshirt' | 'mug' | 'pen' | 'sticker' | 'hat' | 'tote';

/**
 * View angles for mockups
 */
export type MockupView = 'front' | 'back';

/**
 * Mockup Interface
 *
 * Defines the structure of a product mockup with its print area specifications
 */
export interface Mockup {
  /** Unique identifier for the mockup (format: productType-color-view) */
  id: string;

  /** Display name shown to users */
  name: string;

  /** Type of product (tshirt, hoodie, polo, sweatshirt) */
  productType: ProductType;

  /** Color of the product (e.g., 'black', 'white', 'navy') */
  color: string;

  /** View angle of the mockup (front or back) */
  view: MockupView;

  /** Path to the mockup image (relative to public directory) */
  imageUrl: string;

  /** Print area coordinates and dimensions */
  printArea: {
    /** X position of top-left corner of print area (pixels) */
    x: number;

    /** Y position of top-left corner of print area (pixels) */
    y: number;

    /** Width of print area (pixels) */
    width: number;

    /** Height of print area (pixels) */
    height: number;
  };
}

/**
 * Available Mockups
 *
 * This array contains all available product mockups.
 * Add new mockups here following the same structure.
 *
 * IMPORTANT:
 * - Each mockup must have a unique ID
 * - Image files must exist in the public/mockups/ directory
 * - Print area coordinates must be accurate for proper logo placement
 * - Test each mockup thoroughly before deploying to production
 */
export const MOCKUPS: Mockup[] = [
  {
    id: 'tshirt-front',
    name: 'T-Shirt',
    productType: 'tshirt',
    color: 'white',
    view: 'front',
    imageUrl: '/products/t-shirt.png',
    printArea: {
      x: 150,
      y: 120,
      width: 300,
      height: 350,
    },
  },
  {
    id: 'sweatshirt-front',
    name: 'Sweatshirt',
    productType: 'sweatshirt',
    color: 'white',
    view: 'front',
    imageUrl: '/products/sweatshirt.png',
    printArea: {
      x: 150,
      y: 140,
      width: 300,
      height: 350,
    },
  },
  {
    id: 'hoodie-front',
    name: 'Hoodie',
    productType: 'hoodie',
    color: 'gray',
    view: 'front',
    imageUrl: '/products/hoodie.png',
    printArea: {
      x: 150,
      y: 160,
      width: 300,
      height: 350,
    },
  },
  {
    id: 'polo-front',
    name: 'Polo Shirt',
    productType: 'polo',
    color: 'navy',
    view: 'front',
    imageUrl: '/products/t-shirt.png', // Using t-shirt as polo placeholder
    printArea: {
      x: 150,
      y: 120,
      width: 300,
      height: 350,
    },
  },
  {
    id: 'mug-front',
    name: 'Mug',
    productType: 'mug',
    color: 'white',
    view: 'front',
    imageUrl: '/products/mug.png',
    printArea: {
      x: 200,
      y: 180,
      width: 200,
      height: 200,
    },
  },
  {
    id: 'pen-front',
    name: 'Pen',
    productType: 'pen',
    color: 'black',
    view: 'front',
    imageUrl: '/products/pen.png',
    printArea: {
      x: 180,
      y: 250,
      width: 240,
      height: 80,
    },
  },
  {
    id: 'sticker-front',
    name: 'Sticker',
    productType: 'sticker',
    color: 'white',
    view: 'front',
    imageUrl: '/products/sticker.png',
    printArea: {
      x: 180,
      y: 220,
      width: 240,
      height: 240,
    },
  },
  {
    id: 'hat-front',
    name: 'Hat',
    productType: 'hat',
    color: 'black',
    view: 'front',
    imageUrl: '/products/hat.png',
    printArea: {
      x: 200,
      y: 200,
      width: 200,
      height: 150,
    },
  },
  {
    id: 'tote-front',
    name: 'Tote Bag',
    productType: 'tote',
    color: 'natural',
    view: 'front',
    imageUrl: '/products/tote-bag.png',
    printArea: {
      x: 180,
      y: 180,
      width: 240,
      height: 280,
    },
  },
];

/**
 * Get Mockup by ID
 *
 * Retrieves a specific mockup by its unique identifier
 *
 * @param id - The unique mockup ID (e.g., 'sweatshirt-black-front')
 * @returns The mockup object if found, undefined otherwise
 *
 * @example
 * const mockup = getMockupById('sweatshirt-black-front');
 * if (mockup) {
 *   console.log(mockup.name); // "Black Sweatshirt (Front)"
 * }
 */
export function getMockupById(id: string): Mockup | undefined {
  return MOCKUPS.find((mockup) => mockup.id === id);
}

/**
 * Get Mockups by Product Type
 *
 * Retrieves all mockups for a specific product type
 *
 * @param productType - The product type to filter by (tshirt, hoodie, polo, sweatshirt)
 * @returns Array of mockups matching the product type
 *
 * @example
 * const tshirts = getMockupsByProduct('tshirt');
 * console.log(tshirts.length); // Number of t-shirt mockups
 */
export function getMockupsByProduct(productType: ProductType): Mockup[] {
  return MOCKUPS.filter((mockup) => mockup.productType === productType);
}

/**
 * Get Default Mockup
 *
 * Returns the default mockup to show when the design studio loads.
 * This is typically the first mockup in the array, but can be customized.
 *
 * @returns The default mockup object
 *
 * @example
 * const defaultMockup = getDefaultMockup();
 * console.log(defaultMockup.name); // "Black Sweatshirt (Front)"
 */
export function getDefaultMockup(): Mockup {
  return MOCKUPS[0];
}

/**
 * Get Mockups by Color
 *
 * Retrieves all mockups for a specific color
 *
 * @param color - The color to filter by
 * @returns Array of mockups matching the color
 *
 * @example
 * const blackProducts = getMockupsByColor('black');
 */
export function getMockupsByColor(color: string): Mockup[] {
  return MOCKUPS.filter((mockup) => mockup.color === color);
}

/**
 * Get Mockups by View
 *
 * Retrieves all mockups for a specific view (front or back)
 *
 * @param view - The view to filter by
 * @returns Array of mockups matching the view
 *
 * @example
 * const frontViews = getMockupsByView('front');
 */
export function getMockupsByView(view: MockupView): Mockup[] {
  return MOCKUPS.filter((mockup) => mockup.view === view);
}

/**
 * Get Available Colors for Product
 *
 * Returns all unique colors available for a specific product type
 *
 * @param productType - The product type to check
 * @returns Array of unique color names
 *
 * @example
 * const tshirtColors = getAvailableColors('tshirt');
 * console.log(tshirtColors); // ['white', 'black']
 */
export function getAvailableColors(productType: ProductType): string[] {
  const colors = new Set(
    MOCKUPS
      .filter((mockup) => mockup.productType === productType)
      .map((mockup) => mockup.color)
  );
  return Array.from(colors);
}

/**
 * Get Available Product Types
 *
 * Returns all unique product types available in the mockups
 *
 * @returns Array of unique product types
 *
 * @example
 * const products = getAvailableProductTypes();
 * console.log(products); // ['sweatshirt', 'tshirt', 'hoodie', 'polo']
 */
export function getAvailableProductTypes(): ProductType[] {
  const types = new Set(MOCKUPS.map((mockup) => mockup.productType));
  return Array.from(types);
}

/**
 * Validate Mockup Exists
 *
 * Checks if a mockup exists for the given product type, color, and view
 *
 * @param productType - Product type
 * @param color - Product color
 * @param view - Mockup view
 * @returns True if mockup exists, false otherwise
 *
 * @example
 * if (mockupExists('tshirt', 'black', 'front')) {
 *   // Mockup is available
 * }
 */
export function mockupExists(
  productType: ProductType,
  color: string,
  view: MockupView
): boolean {
  return MOCKUPS.some(
    (mockup) =>
      mockup.productType === productType &&
      mockup.color === color &&
      mockup.view === view
  );
}
