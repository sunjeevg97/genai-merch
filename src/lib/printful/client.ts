/**
 * Printful API Client
 *
 * Handles all interactions with the Printful API for print-on-demand fulfillment.
 * Includes rate limiting, error handling, and comprehensive logging.
 *
 * Documentation: https://developers.printful.com/docs/
 */

import Bottleneck from 'bottleneck';
import type {
  PrintfulApiResponse,
  PrintfulProduct,
  PrintfulProductVariant,
  PrintfulMockupRequest,
  PrintfulMockupTask,
  PrintfulOrderRequest,
  PrintfulOrder,
  PrintfulShippingRateRequest,
  PrintfulShippingRate,
  PrintfulError as PrintfulErrorType,
  PrintfulRateLimitInfo,
} from './types';
import { PrintfulError } from './types';

/**
 * Printful API Client
 *
 * Provides methods for interacting with Printful's print-on-demand API.
 * Features:
 * - Bearer token authentication
 * - Rate limiting (120 requests per minute)
 * - Exponential backoff on rate limit errors
 * - Comprehensive error handling
 * - Request/response logging
 */
export class PrintfulClient {
  private readonly apiToken: string;
  private readonly baseUrl: string = 'https://api.printful.com';
  private readonly limiter: Bottleneck;
  private rateLimitInfo: PrintfulRateLimitInfo | null = null;

  constructor(apiToken?: string) {
    // Support both PRINTFUL_API_KEY (newer) and PRINTFUL_API_TOKEN (legacy)
    this.apiToken = apiToken || process.env.PRINTFUL_API_KEY || process.env.PRINTFUL_API_TOKEN || '';

    if (!this.apiToken) {
      throw new Error(
        'Printful API token is required. Set PRINTFUL_API_KEY environment variable.'
      );
    }

    // Configure rate limiter: 120 requests per minute
    this.limiter = new Bottleneck({
      reservoir: 120, // Initial number of requests
      reservoirRefreshAmount: 120, // Refill amount
      reservoirRefreshInterval: 60 * 1000, // Refill every 60 seconds
      maxConcurrent: 10, // Max concurrent requests
      minTime: 500, // Minimum time between requests (ms)
    });

    // Log rate limit events
    this.limiter.on('failed', async (error, jobInfo) => {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 429) {
        console.warn('[Printful] Rate limit hit, retrying...', {
          retryCount: jobInfo.retryCount,
        });
        // Exponential backoff: wait longer on each retry
        const delay = Math.min(1000 * Math.pow(2, jobInfo.retryCount), 30000);
        return delay;
      }
      // Don't retry other errors
      return 0;
    });

    this.limiter.on('retry', (error, jobInfo) => {
      console.log('[Printful] Retrying request', {
        retryCount: jobInfo.retryCount,
        error: error.message,
      });
    });
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: unknown
  ): Promise<PrintfulApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();

    console.log(`[Printful] ${method} ${endpoint}`, body ? { body } : {});

    try {
      const response = await this.limiter.schedule(() =>
        fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID || '',
          },
          body: body ? JSON.stringify(body) : undefined,
        })
      );

      // Extract rate limit info from headers
      this.updateRateLimitInfo(response.headers);

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (!response.ok) {
        const errorData = data as PrintfulErrorType;
        console.error(`[Printful] Error ${response.status} ${endpoint}`, {
          status: response.status,
          code: errorData.error?.code,
          message: errorData.error?.message,
          reason: errorData.error?.reason,
          duration: `${duration}ms`,
        });

        throw new PrintfulError(
          errorData.error?.message || 'Printful API error',
          response.status,
          errorData.error?.code || response.status,
          errorData.error?.reason
        );
      }

      console.log(`[Printful] Success ${method} ${endpoint}`, {
        status: response.status,
        duration: `${duration}ms`,
        rateLimit: this.rateLimitInfo,
      });

      return data as PrintfulApiResponse<T>;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof PrintfulError) {
        throw error;
      }

      console.error(`[Printful] Request failed ${method} ${endpoint}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
      });

      throw new PrintfulError(
        error instanceof Error ? error.message : 'Network error',
        0,
        0
      );
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }
  }

  // ==========================================================================
  // Product Catalog Methods
  // ==========================================================================

  /**
   * Get all products from Printful catalog
   *
   * @param categoryId - Optional category ID to filter products
   * @returns List of available products
   *
   * @example
   * const products = await printful.getProducts();
   * console.log(`Found ${products.length} products`);
   */
  async getProducts(categoryId?: number): Promise<PrintfulProduct[]> {
    const endpoint = categoryId
      ? `/products?category_id=${categoryId}`
      : '/products';

    const response = await this.request<PrintfulProduct[]>('GET', endpoint);
    return response.result;
  }

  /**
   * Get single product details
   *
   * @param productId - Printful product ID
   * @returns Product details with variants and options
   *
   * @example
   * const product = await printful.getProduct(71); // Bella Canvas 3001
   * console.log(product.title, product.variant_count);
   */
  async getProduct(productId: number): Promise<PrintfulProduct> {
    const response = await this.request<PrintfulProduct>(
      'GET',
      `/products/${productId}`
    );
    return response.result;
  }

  /**
   * Get all variants for a product
   *
   * @param productId - Printful product ID
   * @returns List of product variants (sizes, colors)
   *
   * @example
   * const variants = await printful.getProductVariants(71);
   * const blackMedium = variants.find(v => v.size === 'M' && v.color === 'Black');
   */
  async getProductVariants(productId: number): Promise<PrintfulProductVariant[]> {
    const response = await this.request<
      { product: PrintfulProduct; variants: PrintfulProductVariant[] }
    >('GET', `/products/${productId}`);

    return response.result.variants;
  }

  /**
   * Get specific variant details
   *
   * @param variantId - Printful variant ID
   * @returns Variant details including pricing and availability
   *
   * @example
   * const variant = await printful.getVariant(4012); // Bella Canvas 3001 Black M
   * console.log(variant.price, variant.in_stock);
   */
  async getVariant(variantId: number): Promise<PrintfulProductVariant> {
    const response = await this.request<{
      product: PrintfulProduct;
      variant: PrintfulProductVariant;
    }>('GET', `/products/variant/${variantId}`);

    return response.result.variant;
  }

  // ==========================================================================
  // Mockup Generation Methods
  // ==========================================================================

  /**
   * Create mockup generation task
   *
   * Generates product mockups with design applied.
   * Returns task key to check generation status.
   *
   * @param mockupRequest - Mockup generation request with variant IDs and design files
   * @returns Task key for checking generation status
   *
   * @example
   * const taskKey = await printful.createMockup({
   *   variant_ids: [4012, 4013],
   *   files: [{
   *     placement: 'front',
   *     image_url: 'https://example.com/design.png'
   *   }]
   * });
   */
  async createMockup(mockupRequest: PrintfulMockupRequest): Promise<string> {
    const response = await this.request<{ task_key: string }>(
      'POST',
      '/mockup-generator/create-task/71', // Generic product for mockups
      mockupRequest
    );

    return response.result.task_key;
  }

  /**
   * Get mockup generation task status
   *
   * Check if mockup generation is complete and retrieve URLs.
   *
   * @param taskKey - Task key from createMockup()
   * @returns Task status and mockup URLs if completed
   *
   * @example
   * const task = await printful.getMockupTaskStatus(taskKey);
   * if (task.status === 'completed') {
   *   console.log('Mockup URLs:', task.mockups);
   * }
   */
  async getMockupTaskStatus(taskKey: string): Promise<PrintfulMockupTask> {
    const response = await this.request<PrintfulMockupTask>(
      'GET',
      `/mockup-generator/task?task_key=${taskKey}`
    );

    return response.result;
  }

  // ==========================================================================
  // Order Management Methods
  // ==========================================================================

  /**
   * Create new order
   *
   * Submit order to Printful for fulfillment.
   * Orders are created as drafts and must be confirmed separately.
   *
   * @param orderData - Order details with recipient and items
   * @param confirm - Auto-confirm order (default: false)
   * @returns Created order details
   *
   * @example
   * const order = await printful.createOrder({
   *   recipient: {
   *     name: 'John Doe',
   *     address1: '123 Main St',
   *     city: 'Los Angeles',
   *     state_code: 'CA',
   *     country_code: 'US',
   *     zip: '90001'
   *   },
   *   items: [{
   *     variant_id: 4012,
   *     quantity: 2,
   *     files: [{ url: 'https://...' }]
   *   }]
   * });
   */
  async createOrder(
    orderData: PrintfulOrderRequest,
    confirm = false
  ): Promise<PrintfulOrder> {
    const endpoint = confirm ? '/orders?confirm=1' : '/orders';
    const response = await this.request<PrintfulOrder>('POST', endpoint, orderData);
    return response.result;
  }

  /**
   * Get order details
   *
   * @param orderId - Printful order ID or external ID (prefixed with @)
   * @returns Order details including status and shipments
   *
   * @example
   * const order = await printful.getOrder(12345);
   * console.log(order.status, order.shipments);
   *
   * // Get by external ID
   * const order = await printful.getOrder('@order-abc-123');
   */
  async getOrder(orderId: number | string): Promise<PrintfulOrder> {
    const response = await this.request<PrintfulOrder>('GET', `/orders/${orderId}`);
    return response.result;
  }

  /**
   * Cancel order
   *
   * Cancel order if it hasn't been fulfilled yet.
   * Only draft and pending orders can be canceled.
   *
   * @param orderId - Printful order ID
   * @returns Canceled order details
   *
   * @example
   * const canceledOrder = await printful.cancelOrder(12345);
   * console.log(canceledOrder.status); // 'canceled'
   */
  async cancelOrder(orderId: number): Promise<PrintfulOrder> {
    const response = await this.request<PrintfulOrder>(
      'DELETE',
      `/orders/${orderId}`
    );
    return response.result;
  }

  /**
   * Confirm draft order
   *
   * Confirm draft order to start fulfillment.
   * Order must be in 'draft' status.
   *
   * @param orderId - Printful order ID
   * @returns Confirmed order details
   *
   * @example
   * const confirmedOrder = await printful.confirmOrder(12345);
   * console.log(confirmedOrder.status); // 'pending'
   */
  async confirmOrder(orderId: number): Promise<PrintfulOrder> {
    const response = await this.request<PrintfulOrder>(
      'POST',
      `/orders/${orderId}/confirm`
    );
    return response.result;
  }

  /**
   * Get list of orders
   *
   * @param status - Filter by order status
   * @param offset - Pagination offset
   * @param limit - Results per page (max 100)
   * @returns List of orders
   *
   * @example
   * const orders = await printful.getOrders('pending', 0, 20);
   * console.log(`Found ${orders.length} pending orders`);
   */
  async getOrders(
    status?: string,
    offset = 0,
    limit = 20
  ): Promise<PrintfulOrder[]> {
    let endpoint = `/orders?offset=${offset}&limit=${limit}`;
    if (status) {
      endpoint += `&status=${status}`;
    }

    const response = await this.request<PrintfulOrder[]>('GET', endpoint);
    return response.result;
  }

  // ==========================================================================
  // Shipping Methods
  // ==========================================================================

  /**
   * Calculate shipping rates
   *
   * Get available shipping options and costs for an order.
   *
   * @param shippingRequest - Recipient and items
   * @returns Available shipping rates
   *
   * @example
   * const rates = await printful.getShippingRates({
   *   recipient: {
   *     address1: '123 Main St',
   *     city: 'Los Angeles',
   *     state_code: 'CA',
   *     country_code: 'US',
   *     zip: '90001'
   *   },
   *   items: [{ variant_id: 4012, quantity: 2 }]
   * });
   *
   * console.log(rates.map(r => `${r.name}: $${r.rate}`));
   */
  async getShippingRates(
    shippingRequest: PrintfulShippingRateRequest
  ): Promise<PrintfulShippingRate[]> {
    const response = await this.request<PrintfulShippingRate[]>(
      'POST',
      '/shipping/rates',
      shippingRequest
    );

    return response.result;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get current rate limit information
   *
   * @returns Rate limit status or null if no requests made yet
   */
  getRateLimitInfo(): PrintfulRateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Test API connection
   *
   * Makes a simple request to verify API token is valid.
   *
   * @returns True if connection successful
   * @throws PrintfulError if authentication fails
   *
   * @example
   * const isConnected = await printful.testConnection();
   * console.log('Printful API connected:', isConnected);
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getProducts();
      return true;
    } catch (error) {
      if (error instanceof PrintfulError) {
        console.error('[Printful] Connection test failed:', {
          statusCode: error.statusCode,
          code: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  }
}

/**
 * Create singleton Printful client instance
 */
let printfulClient: PrintfulClient | null = null;

export function getPrintfulClient(): PrintfulClient {
  if (!printfulClient) {
    printfulClient = new PrintfulClient();
  }
  return printfulClient;
}

/**
 * Export default client instance
 */
export const printful = getPrintfulClient();
