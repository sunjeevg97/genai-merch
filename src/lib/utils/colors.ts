/**
 * Color Utility Functions
 *
 * Helpers for color conversion and manipulation,
 * specifically for Fabric.js compatibility with OKLCH colors
 */

/**
 * Convert OKLCH color to RGB hex
 *
 * Uses the Canvas API to convert CSS color values (including OKLCH)
 * to hex format that Fabric.js can understand.
 *
 * @param oklch - OKLCH color string (e.g., "oklch(0.75 0.15 200)")
 * @returns RGB hex color (e.g., "#06B6D4") or null if conversion fails
 *
 * @example
 * ```ts
 * const hex = oklchToRgb("oklch(0.75 0.15 200)");
 * console.log(hex); // "#06b6d4"
 * ```
 */
export function oklchToRgb(oklch: string): string | null {
  // Create temporary canvas for color conversion
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('[Colors] Failed to create canvas context for color conversion');
    return null;
  }

  try {
    // Set the fillStyle to the OKLCH color
    // Canvas API will automatically convert to a usable format
    ctx.fillStyle = oklch;

    // Return the converted color (will be in hex format)
    return ctx.fillStyle;
  } catch (error) {
    console.error('[Colors] Failed to convert OKLCH to RGB:', error);
    return null;
  }
}

/**
 * Get CSS variable value from computed styles
 *
 * Retrieves the current value of a CSS custom property
 *
 * @param variable - CSS variable name (e.g., "--primary")
 * @returns CSS variable value or empty string if not found
 *
 * @example
 * ```ts
 * const primaryColor = getCssVariable("--primary");
 * console.log(primaryColor); // "oklch(0.75 0.15 200)"
 * ```
 */
export function getCssVariable(variable: string): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue(variable).trim();
}

/**
 * Get theme color as RGB hex
 *
 * Retrieves a CSS custom property value and converts it to RGB hex
 * for use with libraries that don't support OKLCH (like Fabric.js)
 *
 * @param variable - CSS variable name (e.g., "--primary")
 * @param fallback - Fallback hex color if conversion fails
 * @returns RGB hex color
 *
 * @example
 * ```ts
 * const primaryHex = getThemeColorAsHex("--primary", "#06B6D4");
 * // Use with Fabric.js
 * canvas.selectionBorderColor = primaryHex;
 * ```
 */
export function getThemeColorAsHex(variable: string, fallback: string): string {
  const oklchValue = getCssVariable(variable);

  if (!oklchValue) {
    console.warn(`[Colors] CSS variable ${variable} not found, using fallback`);
    return fallback;
  }

  const hex = oklchToRgb(oklchValue);

  if (!hex) {
    console.warn(`[Colors] Failed to convert ${variable} to hex, using fallback`);
    return fallback;
  }

  return hex;
}

/**
 * Get theme color with alpha
 *
 * Converts an OKLCH color to RGBA format with specified opacity
 *
 * @param variable - CSS variable name (e.g., "--primary")
 * @param alpha - Alpha value (0-1)
 * @param fallback - Fallback RGBA color if conversion fails
 * @returns RGBA color string
 *
 * @example
 * ```ts
 * const primaryWithAlpha = getThemeColorWithAlpha("--primary", 0.2, "rgba(6, 182, 212, 0.2)");
 * // Use for semi-transparent overlays
 * canvas.selectionColor = primaryWithAlpha;
 * ```
 */
export function getThemeColorWithAlpha(
  variable: string,
  alpha: number,
  fallback: string
): string {
  const hex = getThemeColorAsHex(variable, fallback);

  // If we got a fallback RGBA, return it
  if (hex === fallback && fallback.startsWith('rgba')) {
    return fallback;
  }

  // Convert hex to RGB values
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
