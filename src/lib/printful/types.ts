/**
 * Printful API TypeScript Type Definitions
 *
 * Comprehensive types for Printful API v1 responses.
 * Documentation: https://developers.printful.com/docs/
 */

// ============================================================================
// Base API Response Types
// ============================================================================

export interface PrintfulApiResponse<T> {
  code: number;
  result: T;
  extra?: Record<string, unknown>;
  error?: {
    code: number;
    message: string;
    reason?: string;
  };
}

export interface PrintfulPaging {
  total: number;
  offset: number;
  limit: number;
}

// ============================================================================
// Product Catalog Types
// ============================================================================

export interface PrintfulProduct {
  id: number;
  main_category_id: number;
  type: string;
  type_name: string;
  title: string;
  brand: string | null;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  description: string;
  files: PrintfulProductFile[];
  options: PrintfulProductOption[];
  is_discontinued: boolean;
  avg_fulfillment_time: number | null;
  techniques: PrintfulTechnique[];
  origin_country: string;
}

export interface PrintfulProductFile {
  id: string;
  type: 'default' | 'front' | 'back' | 'left' | 'right' | 'detail' | 'preview';
  title: string;
  additional_price: number | null;
  options?: Record<string, unknown>[];
}

export interface PrintfulProductOption {
  id: string;
  title: string;
  type: 'select' | 'multi_select' | 'text' | 'color';
  values: Record<string, string>;
  additional_price_breakdown?: Record<string, number>;
}

export interface PrintfulTechnique {
  key: string;
  display_name: string;
  is_default: boolean;
}

export interface PrintfulProductVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  color_code2: string | null;
  image: string;
  price: string;
  in_stock: boolean;
  availability_regions: Record<string, string>;
  availability_status: PrintfulAvailabilityStatus[];
  material: PrintfulMaterial[];
}

export interface PrintfulAvailabilityStatus {
  region: string;
  status: 'in_stock' | 'stocked_on_demand' | 'out_of_stock' | 'discontinued';
}

export interface PrintfulMaterial {
  name: string;
  percentage: number;
}

// ============================================================================
// Mockup Generation Types
// ============================================================================

export interface PrintfulMockupRequest {
  variant_ids: number[];
  format?: 'jpg' | 'png';
  width?: number;
  files?: PrintfulMockupFile[];
  options?: PrintfulMockupOptions[];
}

export interface PrintfulMockupFile {
  placement: string;
  image_url: string;
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export interface PrintfulMockupOptions {
  id: string;
  value: string | string[];
}

export interface PrintfulMockupTask {
  task_key: string;
  status: 'pending' | 'completed' | 'failed';
  mockups?: PrintfulMockup[];
  error?: string;
}

export interface PrintfulMockup {
  variant_ids: number[];
  placement: string;
  mockup_url: string;
  extra?: PrintfulMockupExtra[];
}

export interface PrintfulMockupExtra {
  title: string;
  url: string;
  option: string;
  option_group: string;
}

// ============================================================================
// Order Types
// ============================================================================

export interface PrintfulOrderRequest {
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  retail_costs?: PrintfulRetailCosts;
  gift?: PrintfulGift;
  packing_slip?: PrintfulPackingSlip;
}

export interface PrintfulRecipient {
  name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state_code: string;
  state_name?: string;
  country_code: string;
  country_name?: string;
  zip: string;
  phone?: string;
  email?: string;
  tax_number?: string;
}

export interface PrintfulOrderItem {
  variant_id: number;
  quantity: number;
  files?: PrintfulOrderItemFile[];
  options?: PrintfulOrderItemOption[];
  retail_price?: string;
  name?: string;
  product?: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
}

export interface PrintfulOrderItemFile {
  id?: number;
  url?: string;
  type?: 'default' | 'preview' | 'front' | 'back' | 'left' | 'right';
  filename?: string;
  visible?: boolean;
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

export interface PrintfulOrderItemOption {
  id: string;
  value: string | string[];
}

export interface PrintfulRetailCosts {
  currency: string;
  subtotal?: string;
  discount?: string;
  shipping?: string;
  tax?: string;
}

export interface PrintfulGift {
  subject: string;
  message: string;
}

export interface PrintfulPackingSlip {
  email?: string;
  phone?: string;
  message?: string;
  logo_url?: string;
  store_name?: string;
  custom_order_id?: string;
}

export interface PrintfulOrder {
  id: number;
  external_id: string;
  store: number;
  status: PrintfulOrderStatus;
  shipping: string;
  shipping_service_name: string;
  created: number;
  updated: number;
  recipient: PrintfulRecipient;
  items: PrintfulOrderItem[];
  branding_items?: unknown[];
  incomplete_items: PrintfulIncompleteItem[];
  costs: PrintfulOrderCosts;
  retail_costs?: PrintfulRetailCosts;
  pricing_breakdown: PrintfulPricingBreakdown[];
  shipments: PrintfulShipment[];
  gift?: PrintfulGift;
  packing_slip?: PrintfulPackingSlip;
  dashboard_url?: string;
}

export type PrintfulOrderStatus =
  | 'draft'
  | 'pending'
  | 'failed'
  | 'canceled'
  | 'onhold'
  | 'inprocess'
  | 'partial'
  | 'fulfilled';

export interface PrintfulIncompleteItem {
  name: string;
  quantity: number;
  sync_variant_id?: number;
  external_variant_id?: string;
  external_line_item_id?: string;
}

export interface PrintfulOrderCosts {
  currency: string;
  subtotal: string;
  discount: string;
  shipping: string;
  digitization: string;
  additional_fee: string;
  fulfillment_fee: string;
  retail_delivery_fee: string;
  tax: string;
  vat: string;
  total: string;
}

export interface PrintfulPricingBreakdown {
  customer_pays: string;
  printful_price: string;
  profit: string;
  currency_symbol: string;
}

export interface PrintfulShipment {
  id: number;
  carrier: string;
  service: string;
  tracking_number: string;
  tracking_url: string;
  created: number;
  ship_date: string;
  shipped_at: number;
  reshipment: boolean;
  items: number[];
}

// ============================================================================
// Shipping Rate Types
// ============================================================================

export interface PrintfulShippingRateRequest {
  recipient: PrintfulRecipient;
  items: Pick<PrintfulOrderItem, 'variant_id' | 'quantity'>[];
  currency?: string;
  locale?: string;
}

export interface PrintfulShippingRate {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
  minDeliveryDate?: string;
  maxDeliveryDate?: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface PrintfulWebhook {
  type: PrintfulWebhookType;
  created: number;
  retries: number;
  store: number;
  data: PrintfulWebhookData;
}

export type PrintfulWebhookType =
  | 'package_shipped'
  | 'package_returned'
  | 'order_failed'
  | 'order_canceled'
  | 'order_put_hold'
  | 'order_remove_hold'
  | 'product_synced'
  | 'stock_updated';

export interface PrintfulWebhookData {
  order?: PrintfulOrder;
  shipment?: PrintfulShipment;
  reason?: string;
  // Additional fields based on webhook type
  [key: string]: unknown;
}

// ============================================================================
// Error Types
// ============================================================================

export interface PrintfulErrorResponse {
  code: number;
  result: string;
  error: {
    code: number;
    message: string;
    reason?: string;
  };
}

export class PrintfulError extends Error {
  public statusCode: number;
  public code: number;
  public reason?: string;

  constructor(message: string, statusCode: number, code: number, reason?: string) {
    super(message);
    this.name = 'PrintfulError';
    this.statusCode = statusCode;
    this.code = code;
    this.reason = reason;
  }
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface PrintfulRateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}
