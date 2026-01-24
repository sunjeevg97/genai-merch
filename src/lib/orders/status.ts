/**
 * Order Status Utilities
 *
 * Functions for managing order status transitions with full audit trail.
 * Used by webhooks, background jobs, and admin actions.
 */

import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import type { Order, OrderStatusHistory } from '@prisma/client';
import type {
  OrderStatus,
  StatusChangedBy,
  OrderWithDetails,
  StatusUpdateResult,
} from './types';

// Initialize Stripe (lazy-loaded)
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

/**
 * Update order status with automatic history tracking
 *
 * @param orderId - Database order ID
 * @param newStatus - New status to set
 * @param changedBy - Who/what triggered the change
 * @param reason - Optional reason for the change
 * @returns Updated order and history entry
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  changedBy: StatusChangedBy,
  reason?: string
): Promise<StatusUpdateResult> {
  try {
    // Fetch current order
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!currentOrder) {
      return {
        success: false,
        error: `Order not found: ${orderId}`,
      };
    }

    const fromStatus = currentOrder.status;

    // Skip if already in target status
    if (fromStatus === newStatus) {
      console.log(
        `[Order Status] Order ${orderId} already in ${newStatus} status, skipping`
      );
      return {
        success: true,
        order: currentOrder as Order,
      };
    }

    // Update order and create history in transaction
    const [updatedOrder, historyEntry] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          // Set timestamps based on status
          ...(newStatus === 'PAID' && { paidAt: new Date() }),
          ...(newStatus === 'SHIPPED' && { shippedAt: new Date() }),
          ...(newStatus === 'DELIVERED' && { deliveredAt: new Date() }),
        },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus,
          toStatus: newStatus,
          changedBy,
          reason,
        },
      }),
    ]);

    console.log(
      `[Order Status] Updated order ${orderId}: ${fromStatus} → ${newStatus} (by ${changedBy})`
    );

    return {
      success: true,
      order: updatedOrder,
      historyEntry,
    };
  } catch (error) {
    console.error(`[Order Status] Failed to update order ${orderId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a status history entry without updating the order status
 * Useful for logging events that don't change the status
 *
 * @param orderId - Database order ID
 * @param fromStatus - Previous status (null for initial)
 * @param toStatus - New status
 * @param changedBy - Who/what triggered the change
 * @param reason - Optional reason
 */
export async function createStatusHistory(
  orderId: string,
  fromStatus: string | null,
  toStatus: string,
  changedBy: StatusChangedBy,
  reason?: string
): Promise<OrderStatusHistory> {
  return prisma.orderStatusHistory.create({
    data: {
      orderId,
      fromStatus,
      toStatus,
      changedBy,
      reason,
    },
  });
}

/**
 * Get order with all details needed for Printful submission
 *
 * @param orderId - Database order ID
 * @returns Full order with items, variants, and shipping address
 */
export async function getOrderForPrintful(
  orderId: string
): Promise<OrderWithDetails | null> {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          productVariant: true,
        },
      },
      shippingAddress: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 10, // Last 10 status changes
      },
    },
  });
}

/**
 * Get order by Stripe checkout session ID
 *
 * @param sessionId - Stripe checkout session ID
 * @returns Order if found
 */
export async function getOrderByStripeSession(
  sessionId: string
): Promise<Order | null> {
  return prisma.order.findFirst({
    where: { stripeCheckoutSessionId: sessionId },
  });
}

/**
 * Update order with Stripe session details after payment
 * Includes final totals (with Stripe-calculated shipping/tax)
 *
 * @param orderId - Database order ID
 * @param session - Stripe checkout session with details
 */
export async function updateOrderFromStripeSession(
  orderId: string,
  session: Stripe.Checkout.Session
): Promise<Order> {
  const updateData: Record<string, unknown> = {
    stripePaymentIntentId:
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id,
    total: session.amount_total || 0,
  };

  // Extract shipping cost
  if (session.shipping_cost?.amount_total) {
    updateData.shipping = session.shipping_cost.amount_total;
  }

  // Extract tax
  if (session.total_details?.amount_tax) {
    updateData.tax = session.total_details.amount_tax;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });
}

// Shipping details type (Stripe's type varies by API version)
interface ShippingDetailsInput {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postal_code?: string | null;
  } | null;
}

/**
 * Save shipping address from Stripe session to database
 *
 * @param orderId - Database order ID
 * @param shippingDetails - Stripe shipping details
 */
export async function saveShippingAddress(
  orderId: string,
  shippingDetails: ShippingDetailsInput
): Promise<Order> {
  const address = shippingDetails.address;

  // Create or update address
  const savedAddress = await prisma.address.create({
    data: {
      name: shippingDetails.name || '',
      address1: address?.line1 || '',
      address2: address?.line2 || null,
      city: address?.city || '',
      stateCode: address?.state || '',
      countryCode: address?.country || 'US',
      zip: address?.postal_code || '',
    },
  });

  // Link address to order
  return prisma.order.update({
    where: { id: orderId },
    data: { shippingAddressId: savedAddress.id },
  });
}

/**
 * Update order with Printful details after submission
 *
 * @param orderId - Database order ID
 * @param printfulOrderId - Printful's order ID
 * @param printfulStatus - Printful's order status
 */
export async function updateOrderWithPrintfulDetails(
  orderId: string,
  printfulOrderId: number,
  printfulStatus: string
): Promise<Order> {
  return prisma.order.update({
    where: { id: orderId },
    data: {
      printfulOrderId,
      printfulStatus,
    },
  });
}

/**
 * Handle order failure with refund and status update
 *
 * @param orderId - Database order ID
 * @param reason - Failure reason
 */
export async function handleOrderFailure(
  orderId: string,
  reason: string
): Promise<void> {
  console.error(`[Order Failure] Order ${orderId} failed: ${reason}`);

  // Fetch order to get payment intent
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      stripePaymentIntentId: true,
      total: true,
    },
  });

  if (!order) {
    console.error(`[Order Failure] Order ${orderId} not found`);
    return;
  }

  // Only refund if order was paid
  if (order.status === 'PAID' && order.stripePaymentIntentId) {
    try {
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        reason: 'requested_by_customer',
        metadata: {
          order_id: order.id,
          order_number: order.orderNumber,
          failure_reason: reason,
        },
      });

      console.log(
        `[Order Failure] Refund created for order ${order.orderNumber}: ${refund.id}`
      );

      // Update order status to REFUNDED
      await updateOrderStatus(
        orderId,
        'REFUNDED',
        'system',
        `Auto-refunded due to fulfillment failure: ${reason}`
      );
    } catch (refundError) {
      console.error(
        `[Order Failure] Failed to create refund for order ${orderId}:`,
        refundError
      );

      // Still mark as failed even if refund fails
      await updateOrderStatus(
        orderId,
        'FAILED',
        'system',
        `Fulfillment failed and refund failed: ${reason}`
      );
    }
  } else {
    // Not paid or no payment intent, just mark as failed
    await updateOrderStatus(orderId, 'FAILED', 'system', reason);
  }
}

/**
 * Check if an order can be submitted to Printful
 *
 * @param order - Order to check
 * @returns Validation result with error message if invalid
 */
export function validateOrderForPrintful(order: OrderWithDetails): {
  valid: boolean;
  error?: string;
} {
  // Check status
  if (order.status !== 'PAID') {
    return {
      valid: false,
      error: `Order status must be PAID, got ${order.status}`,
    };
  }

  // Check shipping address
  if (!order.shippingAddress) {
    return {
      valid: false,
      error: 'Order has no shipping address',
    };
  }

  // Check items
  if (!order.items || order.items.length === 0) {
    return {
      valid: false,
      error: 'Order has no items',
    };
  }

  // Check each item has required data
  for (const item of order.items) {
    if (!item.productVariant.printfulVariantId) {
      return {
        valid: false,
        error: `Item ${item.id} has no Printful variant ID`,
      };
    }

    // Check for design URL in customization data
    const customization = item.customizationData as Record<string, unknown> | null;
    const designUrl =
      customization?.printReadyUrl ||
      customization?.designUrl ||
      customization?.originalDesignUrl;

    if (!designUrl) {
      return {
        valid: false,
        error: `Item ${item.id} has no design URL`,
      };
    }
  }

  return { valid: true };
}
