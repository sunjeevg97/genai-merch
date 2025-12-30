/**
 * Printful Mockup Generation Utilities
 *
 * Generate product mockups with custom designs using Printful's Mockup API.
 */

import crypto from 'crypto';

/**
 * Mockup placement options
 */
export type MockupPlacement = 'front' | 'back' | 'left' | 'right' | 'sleeve_left' | 'sleeve_right';

/**
 * Mockup request structure for Printful API
 */
export interface MockupRequest {
  format: 'jpg' | 'png';
  width: number;
  products: Array<{
    source: 'catalog';
    catalog_variant_id: number;
    placements: Array<{
      placement: MockupPlacement;
      technique: 'dtg' | 'embroidery' | 'sublimation';
      image_url: string;
    }>;
  }>;
}

/**
 * Mockup task creation response
 */
export interface MockupTaskResponse {
  result: {
    task_key: string;
  };
}

/**
 * Mockup task status response
 */
export interface MockupTaskStatusResponse {
  result: {
    status: 'pending' | 'completed' | 'failed';
    mockups?: Array<{
      mockup_url: string;
      variant_id: number;
      placement: string;
    }>;
    error?: {
      code: string;
      message: string;
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
   * Create mockup generation task
   */
  async createMockupTask(request: MockupRequest): Promise<string> {
    console.log('[Printful Mockup] Creating task with request:', JSON.stringify(request, null, 2));

    const response = await fetch(`${this.baseUrl}/mockup-generator/create-task`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Printful Mockup] Task creation failed:', error);
      throw new Error(`Failed to create mockup task: ${error}`);
    }

    const data: MockupTaskResponse = await response.json();
    console.log('[Printful Mockup] Task created successfully:', data.result.task_key);
    return data.result.task_key;
  }

  /**
   * Check mockup task status
   */
  async checkTaskStatus(taskKey: string): Promise<MockupTaskStatusResponse> {
    const response = await fetch(
      `${this.baseUrl}/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`,
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

    return await response.json();
  }

  /**
   * Poll task until complete or timeout
   */
  async pollTaskCompletion(
    taskKey: string,
    maxAttempts = 15,
    intervalMs = 2000
  ): Promise<MockupTaskStatusResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkTaskStatus(taskKey);

      if (status.result.status === 'completed') {
        return status;
      }

      if (status.result.status === 'failed') {
        throw new Error(
          status.result.error?.message || 'Mockup generation failed'
        );
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Mockup generation timed out after 30 seconds');
  }
}

/**
 * Generate cache key for mockup
 */
export function generateMockupCacheKey(
  productVariantId: string,
  designImageUrl: string,
  placement: MockupPlacement = 'front'
): string {
  const hash = crypto
    .createHash('sha256')
    .update(`${productVariantId}:${designImageUrl}:${placement}`)
    .digest('hex')
    .substring(0, 16);

  return `mockup:${productVariantId}:${placement}:${hash}`;
}

/**
 * Generate mockup for product variant with custom design
 *
 * @param productVariantId - Database ProductVariant ID
 * @param printfulVariantId - Printful catalog variant ID
 * @param designImageUrl - URL of design image to overlay
 * @param placement - Where to place design (default: 'front')
 * @returns Mockup image URL
 */
export async function generateMockup(
  productVariantId: string,
  printfulVariantId: number,
  designImageUrl: string,
  placement: MockupPlacement = 'front'
): Promise<MockupResult> {
  // Validate design URL
  if (!designImageUrl || !designImageUrl.startsWith('http')) {
    throw new Error('Invalid design image URL');
  }

  // Create Printful client
  const client = new PrintfulMockupClient();

  // Build mockup request
  const request: MockupRequest = {
    format: 'jpg',
    width: 1200,
    products: [
      {
        source: 'catalog',
        catalog_variant_id: printfulVariantId,
        placements: [
          {
            placement,
            technique: 'dtg', // Direct-to-garment printing
            image_url: designImageUrl,
          },
        ],
      },
    ],
  };

  try {
    // Step 1: Create mockup task
    console.log('[Mockup] Creating mockup task for variant:', printfulVariantId);
    const taskKey = await client.createMockupTask(request);
    console.log('[Mockup] Task created:', taskKey);

    // Step 2: Poll for completion
    console.log('[Mockup] Polling for completion...');
    const result = await client.pollTaskCompletion(taskKey);

    // Step 3: Extract mockup URL
    const mockup = result.result.mockups?.[0];
    if (!mockup) {
      throw new Error('No mockup generated');
    }

    console.log('[Mockup] Mockup generated:', mockup.mockup_url);

    return {
      mockupUrl: mockup.mockup_url,
      variantId: mockup.variant_id,
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
 * Get default technique for product type
 */
export function getDefaultTechnique(
  productType: string
): 'dtg' | 'embroidery' | 'sublimation' {
  const lowerType = productType.toLowerCase();

  // Embroidery for hats
  if (lowerType.includes('hat') || lowerType.includes('cap')) {
    return 'embroidery';
  }

  // Sublimation for mugs and all-over prints
  if (lowerType.includes('mug') || lowerType.includes('all-over')) {
    return 'sublimation';
  }

  // Default to DTG (direct-to-garment) for most apparel
  return 'dtg';
}

/**
 * Get available placements for product type
 */
export function getAvailablePlacements(productType: string): MockupPlacement[] {
  const lowerType = productType.toLowerCase();

  // Mugs only have one placement
  if (lowerType.includes('mug')) {
    return ['front'];
  }

  // Hats typically have front only
  if (lowerType.includes('hat') || lowerType.includes('cap')) {
    return ['front'];
  }

  // T-shirts, hoodies, etc.
  if (
    lowerType.includes('shirt') ||
    lowerType.includes('hoodie') ||
    lowerType.includes('sweatshirt')
  ) {
    return ['front', 'back'];
  }

  // Default placements
  return ['front', 'back'];
}
