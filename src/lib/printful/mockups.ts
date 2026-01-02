/**
 * Printful Mockup Generation Utilities
 *
 * Generate product mockups with custom designs using Printful's Mockup API v2.
 *
 * PLACEMENT HANDLING FOR ALL PRODUCT TYPES:
 *
 * When using mockup styles (recommended):
 * - The placement comes from the style's `placements` array
 * - Each style defines which placements it supports
 * - We use the first valid placement from the style's array
 * - NO mapping or transformation is applied
 * - The TECHNIQUE is derived from the placement name itself
 *   (e.g., "embroidery_front" → embroidery, "front_dtf_hat" → dtfilm)
 *
 * Supported Product Types & Their Placements:
 *
 * 1. APPAREL (t-shirts, hoodies, sweatshirts, polos, tank tops, long sleeves):
 *    - Technique: DTG (direct-to-garment)
 *    - Placements: front, back, sleeve_left, sleeve_right
 *
 * 2. HATS (hats, caps, beanies):
 *    - Technique: DTFilm (preferred) or Embroidery
 *    - DTFilm placements: front_dtf_hat, back_dtf_hat
 *    - Embroidery placements: embroidery_front, embroidery_front_large, embroidery_back, embroidery_left, embroidery_right
 *
 * 3. MUGS & CUPS:
 *    - Technique: Digital (sublimation)
 *    - Placements: default (wraps around the mug)
 *
 * 4. STICKERS:
 *    - Technique: Varies by product
 *    - Placements: default, front
 *
 * 5. TOTE BAGS:
 *    - Technique: DTG
 *    - Placements: front, back
 *
 * Valid Printful Placements (from API v2):
 * - Standard: front, back, left, right, default
 * - Sleeves: sleeve_left, sleeve_right
 * - Labels: label_inside, label_outside, label_inside_dtf
 * - DTF: front_dtf, back_dtf, front_large_dtf, back_large_dtf, short_sleeve_left_dtf, short_sleeve_right_dtf
 * - Embroidery: embroidery_front, embroidery_front_large, embroidery_back, embroidery_left, embroidery_right
 * - Hat-specific: front_dtf_hat, back_dtf_hat
 */

import crypto from 'crypto';

/**
 * Mockup placement options
 * Based on Printful API v2 allowed values
 */
export type MockupPlacement =
  | 'front'
  | 'back'
  | 'left'
  | 'right'
  | 'sleeve_left'
  | 'sleeve_right'
  | 'label_inside'
  | 'label_outside'
  | 'front_dtf'
  | 'front_large_dtf'
  | 'back_dtf'
  | 'back_large_dtf'
  | 'short_sleeve_left_dtf'
  | 'short_sleeve_right_dtf'
  | 'label_inside_dtf'
  | 'embroidery_front'
  | 'embroidery_front_large'
  | 'embroidery_back'
  | 'embroidery_left'
  | 'embroidery_right'
  | 'front_dtf_hat'
  | 'back_dtf_hat'
  | 'default'; // For mugs, stickers, etc.

/**
 * Design position on mockup
 */
export interface MockupPosition {
  area_width?: number;   // Print area width (optional, for internal use)
  area_height?: number;  // Print area height (optional, for internal use)
  width: number;        // Design width
  height: number;       // Design height
  top: number;          // Top offset
  left: number;         // Left offset
}

/**
 * Mockup request structure for Printful API v2
 */
export interface MockupRequest {
  format: 'jpg' | 'png';
  products: Array<{
    source: 'catalog';
    catalog_product_id: number;
    catalog_variant_ids: number[];
    style_id?: number; // Optional mockup style (flat lay, model, hanger, etc.)
    placements: Array<{
      placement: string;
      technique: 'dtg' | 'dtfilm' | 'embroidery' | 'digital';
      layers: Array<{
        type: 'file';
        url: string;
        position?: MockupPosition;
      }>;
    }>;
  }>;
}

/**
 * Mockup task creation response (v2)
 */
export interface MockupTaskResponse {
  id: number;
  status: 'pending' | 'completed' | 'failed';
  catalog_variant_mockups: Array<{
    catalog_variant_id: number;
    mockups: Array<{
      placement: string;
      mockup_url: string;
      display_name: string;
      technique: string;
      style_id: number;
      view: string;
    }>;
  }>;
  failure_reasons: string[];
  _links: {
    self: {
      href: string;
    };
  };
}

/**
 * Mockup result
 */
export interface MockupResult {
  mockupUrl: string;
  variantId: number;
  placement: string;
}

/**
 * Mockup style from Printful API
 */
export interface MockupStyle {
  id: number;
  category_name: string;
  view_name: string;
  template_width: number;
  template_height: number;
  placements: string[];
}

/**
 * Printful API client
 */
class PrintfulMockupClient {
  private apiKey: string;
  private baseUrl = 'https://api.printful.com';

  constructor() {
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (!apiKey) {
      throw new Error('PRINTFUL_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  /**
   * Create mockup generation task using Printful API v2 with automatic retry on rate limit
   */
  async createMockupTask(request: MockupRequest, retryCount = 0): Promise<number> {
    const maxRetries = 3;

    console.log('[Printful Mockup V2] Creating task with request:', JSON.stringify(request, null, 2));

    const response = await fetch(`${this.baseUrl}/v2/mockup-tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Check if it's a rate limit error
      if (response.status === 429) {
        console.log('[Printful Mockup] Rate limited, parsing error:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          const message = errorData.error?.message || errorData.data || '';

          // Extract wait time from message (e.g., "Please try again after 42 seconds")
          const waitTimeMatch = message.match(/after (\d+) seconds/);
          const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 60;

          if (retryCount < maxRetries) {
            console.log(`[Printful Mockup] Rate limited. Waiting ${waitTime} seconds before retry ${retryCount + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, (waitTime + 2) * 1000)); // Add 2 seconds buffer
            return this.createMockupTask(request, retryCount + 1);
          }
        } catch (parseError) {
          console.error('[Printful Mockup] Failed to parse rate limit error:', parseError);
        }
      }

      console.error('[Printful Mockup] Task creation failed:', errorText);
      throw new Error(`Failed to create mockup task: ${errorText}`);
    }

    const data = await response.json();
    console.log('[Printful Mockup] Full response:', JSON.stringify(data, null, 2));

    // Extract task ID from v2 response structure: data[0].id
    const taskId = data.data?.[0]?.id;
    if (!taskId) {
      throw new Error('No task ID returned from Printful API');
    }

    console.log('[Printful Mockup] Task created successfully with ID:', taskId);
    return taskId;
  }

  /**
   * Check mockup task status using Printful API v2
   */
  async checkTaskStatus(taskId: number): Promise<MockupTaskResponse> {
    const response = await fetch(
      `${this.baseUrl}/v2/mockup-tasks?id=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to check task status: ${error}`);
    }

    const data = await response.json();

    // Extract task data from v2 response structure: data[0]
    const taskData = data.data?.[0];
    if (!taskData) {
      throw new Error('No task data returned from Printful API');
    }

    return taskData;
  }

  /**
   * Get available mockup styles for a product
   */
  async getMockupStyles(productId: number): Promise<MockupStyle[]> {
    const response = await fetch(
      `${this.baseUrl}/v2/catalog-products/${productId}/mockup-styles`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch mockup styles: ${error}`);
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Poll task until complete or timeout
   */
  async pollTaskCompletion(
    taskId: number,
    maxAttempts = 90,
    intervalMs = 2000
  ): Promise<MockupTaskResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkTaskStatus(taskId);

      console.log(`[Mockup Poll] Attempt ${attempt + 1}/${maxAttempts}, Status: ${status.status}`);

      if (status.status === 'completed') {
        console.log('[Mockup Poll] Task completed successfully');
        return status;
      }

      if (status.status === 'failed') {
        throw new Error(
          status.failure_reasons.join(', ') || 'Mockup generation failed'
        );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Mockup generation timed out after 180 seconds');
  }
}

/**
 * Generate cache key for mockup
 */
export function generateMockupCacheKey(
  productVariantId: string,
  designImageUrl: string,
  placement: MockupPlacement = 'front',
  position?: MockupPosition,
  styleId?: number,
  technique?: 'dtg' | 'dtfilm' | 'embroidery' | 'digital'
): string {
  // Include position data in hash if provided
  const positionStr = position
    ? `:${position.width}x${position.height}:${position.top},${position.left}`
    : '';

  // Include style ID in hash if provided
  const styleStr = styleId ? `:style${styleId}` : '';

  // Include technique in hash if provided
  const techniqueStr = technique ? `:${technique}` : '';

  const hash = crypto
    .createHash('sha256')
    .update(`${productVariantId}:${designImageUrl}:${placement}${positionStr}${styleStr}${techniqueStr}`)
    .digest('hex')
    .substring(0, 16);

  return `mockup:${productVariantId}:${placement}${positionStr}${styleStr}${techniqueStr}:${hash}`;
}

/**
 * Generate mockup for product variant with custom design
 *
 * @param printfulProductId - Printful catalog product ID
 * @param printfulVariantId - Printful catalog variant ID
 * @param designImageUrl - URL of design image to overlay
 * @param productName - Product name (for detecting product category like hat, mug, etc.)
 * @param placement - Where to place design (default: 'front')
 * @param position - Optional design position and size
 * @param styleId - Optional mockup style ID (e.g., flat lay, model, hanger)
 * @returns Mockup image URL
 */
export async function generateMockup(
  printfulProductId: number,
  printfulVariantId: number,
  designImageUrl: string,
  productName: string,
  placement: MockupPlacement = 'front',
  position?: MockupPosition,
  styleId?: number,
  technique?: 'dtg' | 'dtfilm' | 'embroidery' | 'digital'
): Promise<MockupResult> {
  // Debug logging
  console.log('[generateMockup] Parameters:', {
    printfulProductId,
    printfulVariantId,
    designImageUrl,
    productName,
    placement,
    position,
    styleId
  });

  // Validate design URL
  if (!designImageUrl || !designImageUrl.startsWith('http')) {
    throw new Error('Invalid design image URL');
  }

  // Create Printful client
  const client = new PrintfulMockupClient();

  // Technique selection logic (priority order):
  // 1. Explicit technique parameter (user-selected) - HIGHEST PRIORITY
  // 2. Derive from placement name when using styles (e.g., embroidery_front → embroidery)
  // 3. Default technique based on product type (legacy fallback)

  const selectedTechnique = technique
    ? technique  // Use explicit technique if provided
    : styleId
      ? getTechniqueFromPlacement(placement)  // Derive from placement when using styles
      : getDefaultTechnique(productName);     // Legacy: default for product type

  const mappedPlacement = styleId
    ? placement  // Use placement as-is from style's placements array
    : mapPlacementForProduct(placement, productName, selectedTechnique);  // Legacy mapping for non-style requests

  console.log('[generateMockup] Technique and placement:', {
    original: placement,
    mapped: mappedPlacement,
    technique: selectedTechnique,
    explicitTechnique: !!technique,
    styleId,
    derivedFromPlacement: !!styleId && !technique
  });

  // Strip out area_width and area_height from position (Printful doesn't expect these)
  // Convert from pixels to inches (Printful expects inches, not pixels)
  const DPI = 150; // Our print area is defined at 150 DPI

  const printfulPosition = position ? {
    width: Math.round(position.width / DPI), // Convert pixels to inches
    height: Math.round(position.height / DPI),
    top: Math.round(position.top / DPI),
    left: Math.round(position.left / DPI),
  } : undefined;

  // Build mockup request (v2 format with catalog source)
  const request: MockupRequest = {
    format: 'jpg',
    products: [
      {
        source: 'catalog',
        catalog_product_id: printfulProductId,
        catalog_variant_ids: [printfulVariantId],
        ...(styleId && { style_id: styleId }),
        placements: [
          {
            placement: mappedPlacement,
            technique: selectedTechnique,
            layers: [
              {
                type: 'file',
                url: designImageUrl,
                ...(printfulPosition && { position: printfulPosition }),
              },
            ],
          },
        ],
      },
    ],
  };

  try {
    // Step 1: Create mockup task
    console.log('[Mockup] Creating mockup task:', {
      productId: printfulProductId,
      variantId: printfulVariantId,
      placement,
      styleId,
    });
    const taskId = await client.createMockupTask(request);
    console.log('[Mockup] Task created with ID:', taskId);

    // Step 2: Poll for completion
    console.log('[Mockup] Polling for completion...');
    const result = await client.pollTaskCompletion(taskId);

    // Debug: Log the completed task response
    console.log('[Mockup] Completed task result:', JSON.stringify(result, null, 2));

    // Step 3: Extract mockup URL from v2 response
    const variantMockup = result.catalog_variant_mockups.find(
      (vm) => vm.catalog_variant_id === printfulVariantId
    );

    if (!variantMockup || variantMockup.mockups.length === 0) {
      throw new Error('No mockup generated');
    }

    // Find mockup matching both placement AND styleId (if provided)
    // IMPORTANT: Search using mappedPlacement (the one sent to Printful), not the original placement
    console.log('[Mockup] Searching for mockup with mappedPlacement:', mappedPlacement, 'styleId:', styleId);
    console.log('[Mockup] Available mockups:', variantMockup.mockups.map(m => ({
      placement: m.placement,
      style_id: m.style_id,
      view: m.view
    })));

    let mockup = styleId
      ? variantMockup.mockups.find((m) => m.placement === mappedPlacement && m.style_id === styleId)
      : variantMockup.mockups.find((m) => m.placement === mappedPlacement);

    if (mockup) {
      console.log('[Mockup] Found exact match:', { placement: mockup.placement, style_id: mockup.style_id, view: mockup.view });
    }

    if (!mockup) {
      // Fallback: if no exact match, try just placement
      console.warn('[Mockup] No exact style match, falling back to placement only');
      mockup = variantMockup.mockups.find((m) => m.placement === mappedPlacement);
      if (mockup) {
        console.log('[Mockup] Fallback mockup:', { placement: mockup.placement, style_id: mockup.style_id, view: mockup.view });
      }
    }

    if (!mockup) {
      // Final fallback to first available mockup
      const firstMockup = variantMockup.mockups[0];
      console.warn(`[Mockup] Placement ${placement} not found, using ${firstMockup.placement}`);

      return {
        mockupUrl: firstMockup.mockup_url,
        variantId: printfulVariantId,
        placement: firstMockup.placement,
      };
    }

    console.log('[Mockup] Mockup generated:', mockup.mockup_url);

    return {
      mockupUrl: mockup.mockup_url,
      variantId: printfulVariantId,
      placement: mockup.placement,
    };
  } catch (error) {
    console.error('[Mockup] Generation failed:', error);

    if (error instanceof Error) {
      // Re-throw with more context
      throw new Error(`Mockup generation failed: ${error.message}`);
    }

    throw new Error('Mockup generation failed with unknown error');
  }
}

/**
 * Get available printing techniques for a product type
 * Used to show technique selector options in the UI
 *
 * @param productType - Product type (from product name or category)
 * @returns Array of available techniques for this product
 */
export function getAvailableTechniques(
  productType: string
): Array<{ value: 'dtg' | 'dtfilm' | 'embroidery' | 'digital'; label: string; description: string }> {
  const lowerType = productType.toLowerCase();

  // Hats/Caps - Support both DTFilm and Embroidery
  if (
    lowerType.includes('hat') ||
    lowerType.includes('cap') ||
    lowerType.includes('beanie')
  ) {
    return [
      {
        value: 'embroidery',
        label: 'Embroidery',
        description: 'Classic stitched design, premium look'
      },
      {
        value: 'dtfilm',
        label: 'DTF Print',
        description: 'Full-color print, more detail'
      }
    ];
  }

  // Mugs/Cups - Digital printing (sublimation)
  if (
    lowerType.includes('mug') ||
    lowerType.includes('cup')
  ) {
    return [
      {
        value: 'digital',
        label: 'Digital Print',
        description: 'Vibrant, permanent print'
      }
    ];
  }

  // Stickers - Digital printing
  if (lowerType.includes('sticker')) {
    return [
      {
        value: 'digital',
        label: 'Full Color Print',
        description: 'High-quality digital print'
      }
    ];
  }

  // Apparel - DTG (most common)
  // Includes: t-shirts, sweatshirts, hoodies, polos, tank tops, long sleeves
  return [
    {
      value: 'dtg',
      label: 'Direct-to-Garment',
      description: 'Soft, high-quality print'
    }
  ];
}

/**
 * Derive technique from placement name
 * When using mockup styles, the placement name tells us which technique to use
 */
export function getTechniqueFromPlacement(
  placement: string
): 'dtg' | 'dtfilm' | 'embroidery' | 'digital' {
  const lowerPlacement = placement.toLowerCase();

  // Embroidery placements
  if (lowerPlacement.includes('embroidery')) {
    return 'embroidery';
  }

  // DTFilm placements
  if (lowerPlacement.includes('dtf') || lowerPlacement.includes('dtfilm')) {
    return 'dtfilm';
  }

  // Digital for default (usually mugs, sublimation products)
  if (lowerPlacement === 'default') {
    return 'digital';
  }

  // Default to DTG for standard placements (front, back, sleeve_left, etc.)
  return 'dtg';
}

/**
 * Get default technique for product type
 * Note: This is LEGACY - only used when NO styleId is provided
 * When using styles, use getTechniqueFromPlacement() instead
 */
export function getDefaultTechnique(
  productType: string
): 'dtg' | 'dtfilm' | 'embroidery' | 'digital' {
  const lowerType = productType.toLowerCase();

  // DTFilm for hats (faster than embroidery)
  if (lowerType.includes('hat') || lowerType.includes('cap') || lowerType.includes('beanie')) {
    return 'dtfilm';
  }

  // Digital for mugs, cups, and all-over prints (formerly sublimation)
  if (lowerType.includes('mug') || lowerType.includes('cup') || lowerType.includes('all-over')) {
    return 'digital';
  }

  // Embroidery for stickers and bags (actually these usually use different techniques, but embroidery as fallback)
  // Note: Most stickers and bags have their own specific placement handling

  // Default to DTG (direct-to-garment) for all apparel
  // This includes: t-shirts, hoodies, sweatshirts, polos, tank tops, long sleeves
  return 'dtg';
}

/**
 * Map generic placement to product-specific placement
 * Note: This is LEGACY mode - only used when NO styleId is provided
 * When using mockup styles, the placement comes directly from the style's placements array
 */
export function mapPlacementForProduct(
  placement: MockupPlacement,
  productType: string,
  technique: 'dtg' | 'dtfilm' | 'embroidery' | 'digital'
): string {
  const lowerType = productType.toLowerCase();

  // Hat placements - DTFilm vs Embroidery have different placement names
  if (lowerType.includes('hat') || lowerType.includes('cap') || lowerType.includes('beanie')) {
    // DTFilm technique uses DTF placement names
    if (technique === 'dtfilm') {
      if (placement === 'front') return 'front_dtf_hat';
      if (placement === 'back') return 'back_dtf_hat';
      // For other placements, fallback to front
      return 'front_dtf_hat';
    }

    // Embroidery technique uses embroidery placement names
    if (technique === 'embroidery') {
      if (placement === 'front') return 'embroidery_front_large';
      if (placement === 'back') return 'embroidery_back';
      if (placement === 'left') return 'embroidery_left';
      if (placement === 'right') return 'embroidery_right';
    }
  }

  // Mug and cup placements - use default
  if (lowerType.includes('mug') || lowerType.includes('cup')) {
    return 'default';
  }

  // Sticker placements - typically use default or front
  if (lowerType.includes('sticker') || lowerType.includes('decal')) {
    return 'default';
  }

  // Tote bag placements - use standard front/back
  if (lowerType.includes('tote') || lowerType.includes('bag')) {
    return placement;
  }

  // For all apparel (t-shirts, hoodies, sweatshirts, polos, tank tops, long sleeves)
  // Use standard placements as-is
  return placement;
}

/**
 * Get available placements for product type
 * Note: This is a general guideline. The actual available placements
 * come from the mockup style's placements array via the API.
 */
export function getAvailablePlacements(productType: string): MockupPlacement[] {
  const lowerType = productType.toLowerCase();

  // Mugs and cups - typically front only (default placement)
  if (lowerType.includes('mug') || lowerType.includes('cup')) {
    return ['front'];
  }

  // Hats, caps, beanies - typically front only
  if (lowerType.includes('hat') || lowerType.includes('cap') || lowerType.includes('beanie')) {
    return ['front'];
  }

  // Stickers - typically one placement
  if (lowerType.includes('sticker') || lowerType.includes('decal')) {
    return ['front'];
  }

  // Tote bags - front and back
  if (lowerType.includes('tote') || lowerType.includes('bag')) {
    return ['front', 'back'];
  }

  // All apparel: t-shirts, hoodies, sweatshirts, polos, tank tops, long sleeves
  if (
    lowerType.includes('shirt') ||
    lowerType.includes('hoodie') ||
    lowerType.includes('sweatshirt') ||
    lowerType.includes('polo') ||
    lowerType.includes('tank') ||
    lowerType.includes('sleeve')
  ) {
    return ['front', 'back'];
  }

  // Default placements for unknown types
  return ['front', 'back'];
}
