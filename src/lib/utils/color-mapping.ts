/**
 * Color Mapping Utilities
 *
 * Converts color names to hex codes for visual swatches.
 */

/**
 * Comprehensive color name to hex code mapping
 */
const COLOR_HEX_MAP: Record<string, string> = {
  // Blacks and Grays
  black: '#000000',
  'true black': '#000000',
  'jet black': '#0A0A0A',
  charcoal: '#36454F',
  'dark gray': '#4B5563',
  'dark grey': '#4B5563',
  gray: '#9CA3AF',
  grey: '#9CA3AF',
  'light gray': '#D1D5DB',
  'light grey': '#D1D5DB',
  silver: '#C0C0C0',
  'heather gray': '#B8B8B8',
  'heather grey': '#B8B8B8',
  slate: '#708090',

  // Whites
  white: '#FFFFFF',
  'off white': '#F8F8F8',
  cream: '#FFFDD0',
  ivory: '#FFFFF0',
  beige: '#D4C5B9',
  natural: '#F5F5DC',

  // Reds
  red: '#EF4444',
  'true red': '#FF0000',
  'dark red': '#8B0000',
  'light red': '#FFB3BA',
  crimson: '#DC143C',
  scarlet: '#FF2400',
  maroon: '#800000',
  burgundy: '#800020',
  cardinal: '#C41E3A',
  'heather red': '#D84B4B',

  // Blues
  blue: '#3B82F6',
  'true blue': '#0000FF',
  'dark blue': '#00008B',
  'light blue': '#ADD8E6',
  'sky blue': '#87CEEB',
  navy: '#001F3F',
  'navy blue': '#000080',
  royal: '#4169E1',
  'royal blue': '#4169E1',
  sapphire: '#0F52BA',
  cobalt: '#0047AB',
  'heather blue': '#6B9BD1',
  indigo: '#4B0082',

  // Greens
  green: '#10B981',
  'true green': '#008000',
  'dark green': '#006400',
  'light green': '#90EE90',
  'forest green': '#228B22',
  'kelly green': '#4CBB17',
  lime: '#00FF00',
  mint: '#98FF98',
  olive: '#808000',
  'military green': '#4B5320',
  'heather green': '#7FB069',
  teal: '#008080',

  // Yellows and Golds
  yellow: '#F59E0B',
  'true yellow': '#FFFF00',
  gold: '#FFD700',
  'dark yellow': '#CCCC00',
  'light yellow': '#FFFFE0',
  mustard: '#FFDB58',
  'heather yellow': '#F5D76E',

  // Oranges
  orange: '#F97316',
  'true orange': '#FFA500',
  'dark orange': '#FF8C00',
  'light orange': '#FED8B1',
  'burnt orange': '#CC5500',
  coral: '#FF7F50',
  'heather orange': '#FF9B6A',

  // Purples and Pinks
  purple: '#A855F7',
  'dark purple': '#5B2A86',
  'light purple': '#E0B0FF',
  violet: '#8F00FF',
  lavender: '#E6E6FA',
  plum: '#8E4585',
  pink: '#EC4899',
  'hot pink': '#FF69B4',
  'light pink': '#FFB6C1',
  'dark pink': '#E75480',
  magenta: '#FF00FF',
  'heather purple': '#B993D6',

  // Browns
  brown: '#92400E',
  'dark brown': '#654321',
  'light brown': '#B5651D',
  tan: '#D2B48C',
  khaki: '#C3B091',
  chocolate: '#D2691E',
  coffee: '#6F4E37',
  espresso: '#3C2317',
};

/**
 * Get hex code for a color name
 * Returns default gray if color not found
 */
export function getColorHexCode(colorName: string): string {
  const normalized = colorName.toLowerCase().trim();

  // Direct match
  if (COLOR_HEX_MAP[normalized]) {
    return COLOR_HEX_MAP[normalized];
  }

  // Try partial matches (e.g., "Heather Navy" → "navy")
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return hex;
    }
  }

  // Default to medium gray if unknown
  return '#6B7280';
}

/**
 * Determine if a color is light (for contrast purposes)
 */
export function isLightColor(hexCode: string): boolean {
  // Remove # if present
  const hex = hexCode.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Light if luminance > 0.6
  return luminance > 0.6;
}
