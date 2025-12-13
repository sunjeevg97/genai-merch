/**
 * Mockup Data and Utilities
 *
 * Configuration and helpers for product mockups
 *
 * Features:
 * - Mockup definitions (t-shirt, hoodie, etc.)
 * - Print area specifications
 * - Color variants
 * - View types (front, back, side)
 */

export type ProductType = 't-shirt' | 'hoodie';
export type MockupView = 'front' | 'back' | 'side';
export type MockupColor = 'white' | 'black' | 'gray' | 'navy';

export interface PrintArea {
  x: number; // X position on canvas
  y: number; // Y position on canvas
  width: number; // Width in pixels
  height: number; // Height in pixels
  widthInches?: number; // Actual print width in inches
  heightInches?: number; // Actual print height in inches
}

export interface Mockup {
  id: string;
  productType: ProductType;
  view: MockupView;
  color: MockupColor;
  imageUrl: string;
  printArea: PrintArea;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * Mockup catalog
 * In production, these would be loaded from a database or API
 */
export const MOCKUPS: Mockup[] = [
  {
    id: 'tshirt-front-white',
    productType: 't-shirt',
    view: 'front',
    color: 'white',
    imageUrl: '/mockups/tshirt-front-white.png',
    printArea: {
      x: 300,
      y: 200,
      width: 400,
      height: 500,
      widthInches: 12,
      heightInches: 16,
    },
    canvasWidth: 1000,
    canvasHeight: 1200,
  },
  {
    id: 'tshirt-front-black',
    productType: 't-shirt',
    view: 'front',
    color: 'black',
    imageUrl: '/mockups/tshirt-front-black.png',
    printArea: {
      x: 300,
      y: 200,
      width: 400,
      height: 500,
      widthInches: 12,
      heightInches: 16,
    },
    canvasWidth: 1000,
    canvasHeight: 1200,
  },
  // More mockups will be added here
];

/**
 * Get mockup by criteria
 */
export function getMockup(
  productType: ProductType,
  view: MockupView,
  color: MockupColor
): Mockup | undefined {
  return MOCKUPS.find(
    (m) =>
      m.productType === productType && m.view === view && m.color === color
  );
}

/**
 * Get all mockups for a product type
 */
export function getMockupsByProduct(productType: ProductType): Mockup[] {
  return MOCKUPS.filter((m) => m.productType === productType);
}

/**
 * Get available colors for a product type
 */
export function getAvailableColors(productType: ProductType): MockupColor[] {
  const colors = new Set(
    MOCKUPS.filter((m) => m.productType === productType).map((m) => m.color)
  );
  return Array.from(colors);
}

/**
 * Get available views for a product type
 */
export function getAvailableViews(productType: ProductType): MockupView[] {
  const views = new Set(
    MOCKUPS.filter((m) => m.productType === productType).map((m) => m.view)
  );
  return Array.from(views);
}

/**
 * Check if logo is within print area
 */
export function isWithinPrintArea(
  logoX: number,
  logoY: number,
  logoWidth: number,
  logoHeight: number,
  printArea: PrintArea
): boolean {
  return (
    logoX >= printArea.x &&
    logoY >= printArea.y &&
    logoX + logoWidth <= printArea.x + printArea.width &&
    logoY + logoHeight <= printArea.y + printArea.height
  );
}

/**
 * Calculate optimal logo size for print area
 */
export function calculateOptimalLogoSize(
  printArea: PrintArea,
  logoAspectRatio: number
): { width: number; height: number } {
  const printAspectRatio = printArea.width / printArea.height;

  if (logoAspectRatio > printAspectRatio) {
    // Logo is wider - fit to width
    const width = printArea.width * 0.7; // 70% of print area
    const height = width / logoAspectRatio;
    return { width, height };
  } else {
    // Logo is taller - fit to height
    const height = printArea.height * 0.7; // 70% of print area
    const width = height * logoAspectRatio;
    return { width, height };
  }
}
