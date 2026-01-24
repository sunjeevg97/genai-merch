/**
 * Order-related type definitions
 */

import type { Order, OrderItem, ProductVariant, Address, OrderStatusHistory } from '@prisma/client';

// Valid order statuses
export const ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'PAID',
  'SUBMITTED_TO_POD',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
  'FAILED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Status transition changedBy identifiers
export type StatusChangedBy =
  | 'system'
  | 'webhook:stripe'
  | 'webhook:printful'
  | `admin:${string}`
  | `job:${string}`;

// Order with all relations needed for Printful submission
export interface OrderWithDetails extends Order {
  items: (OrderItem & {
    productVariant: ProductVariant;
  })[];
  shippingAddress: Address | null;
  statusHistory: OrderStatusHistory[];
}

// Customization data stored in OrderItem.customizationData JSON field
export interface OrderItemCustomization {
  technique?: 'dtg' | 'embroidery' | 'sublimation';
  placement?: 'front' | 'back' | 'left' | 'right' | 'sleeve_left' | 'sleeve_right';
  styleId?: number;
  styleName?: string;
  mockupUrl?: string;
  designUrl?: string;
  printReadyUrl?: string;
  originalDesignUrl?: string;
  isPrintReady?: boolean;
}

// Printful order submission result
export interface PrintfulSubmissionResult {
  success: boolean;
  printfulOrderId?: number;
  printfulStatus?: string;
  error?: string;
}

// Status update result
export interface StatusUpdateResult {
  success: boolean;
  order?: Order;
  historyEntry?: OrderStatusHistory;
  error?: string;
}
