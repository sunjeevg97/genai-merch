/**
 * Printful Order Submission Background Job
 *
 * Triggered after Stripe payment confirmation to submit orders to Printful.
 * Features:
 * - Automatic retries with exponential backoff
 * - Full error handling with auto-refund on failure
 * - Status history tracking
 */

import { task, logger } from '@trigger.dev/sdk/v3';
import { printful } from '@/lib/printful/client';
import {
  getOrderForPrintful,
  updateOrderStatus,
  updateOrderWithPrintfulDetails,
  validateOrderForPrintful,
  handleOrderFailure,
} from '@/lib/orders/status';
import type { OrderItemCustomization } from '@/lib/orders/types';
import type { PrintfulOrderRequest, PrintfulOrderItem, PrintfulOrderItemFile } from '@/lib/printful/types';

// File type for Printful order items
type PrintfulFileType = NonNullable<PrintfulOrderItemFile['type']>;

/**
 * Build Printful order payload from database order
 */
function buildPrintfulPayload(
  order: NonNullable<Awaited<ReturnType<typeof getOrderForPrintful>>>
): PrintfulOrderRequest & { external_id: string } {
  const { shippingAddress, items } = order;

  if (!shippingAddress) {
    throw new Error('Order has no shipping address');
  }

  // Build order items
  const printfulItems: PrintfulOrderItem[] = items.map((item) => {
    const customization = item.customizationData as OrderItemCustomization | null;

    // Get design URL - prefer print-ready, fall back to original
    const designUrl =
      customization?.printReadyUrl ||
      customization?.designUrl ||
      customization?.originalDesignUrl;

    if (!designUrl) {
      throw new Error(`Item ${item.id} has no design URL`);
    }

    // Get printing technique
    const technique = customization?.technique || 'dtg';

    // Get placement for file type
    const placement = customization?.placement || 'front';

    // Get variant ID (already a number in the database)
    const variantId = item.productVariant.printfulVariantId;

    const printfulItem: PrintfulOrderItem = {
      variant_id: variantId,
      quantity: item.quantity,
      files: [
        {
          url: designUrl,
          type: placement as PrintfulFileType,
        },
      ],
      options: [
        {
          id: 'technique',
          value: technique,
        },
      ],
    };

    return printfulItem;
  });

  return {
    external_id: order.orderNumber,
    recipient: {
      name: shippingAddress.name || 'Customer',
      address1: shippingAddress.address1,
      address2: shippingAddress.address2 || undefined,
      city: shippingAddress.city,
      state_code: shippingAddress.stateCode,
      country_code: shippingAddress.countryCode,
      zip: shippingAddress.zip,
      email: shippingAddress.email || undefined,
      phone: shippingAddress.phone || undefined,
    },
    items: printfulItems,
  };
}

/**
 * Submit POD Order Task
 *
 * Takes an order ID and submits it to Printful for fulfillment.
 */
export const submitPodOrder = task({
  id: 'submit-pod-order',
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: { orderId: string }) => {
    const { orderId } = payload;

    logger.info('Starting POD order submission', { orderId });

    // Step 1: Fetch order with all details
    const order = await getOrderForPrintful(orderId);

    if (!order) {
      logger.error('Order not found', { orderId });
      throw new Error(`Order not found: ${orderId}`);
    }

    logger.info('Order fetched', {
      orderId,
      orderNumber: order.orderNumber,
      status: order.status,
      itemCount: order.items.length,
    });

    // Step 2: Check if already submitted (idempotency)
    if (order.printfulOrderId) {
      logger.warn('Order already submitted to Printful', {
        orderId,
        printfulOrderId: order.printfulOrderId,
      });
      return {
        success: true,
        skipped: true,
        printfulOrderId: order.printfulOrderId,
        reason: 'Already submitted',
      };
    }

    // Step 3: Validate order can be submitted
    const validation = validateOrderForPrintful(order);
    if (!validation.valid) {
      logger.error('Order validation failed', {
        orderId,
        error: validation.error,
      });

      // Don't retry validation failures - they won't fix themselves
      await handleOrderFailure(orderId, validation.error || 'Validation failed');
      throw new Error(validation.error);
    }

    // Step 4: Build Printful payload
    let printfulPayload: ReturnType<typeof buildPrintfulPayload>;
    try {
      printfulPayload = buildPrintfulPayload(order);
      logger.info('Printful payload built', {
        orderId,
        external_id: printfulPayload.external_id,
        itemCount: printfulPayload.items.length,
      });
    } catch (payloadError) {
      const errorMessage =
        payloadError instanceof Error ? payloadError.message : 'Payload build failed';
      logger.error('Failed to build Printful payload', {
        orderId,
        error: errorMessage,
      });
      await handleOrderFailure(orderId, errorMessage);
      throw payloadError;
    }

    // Step 5: Submit to Printful (create as draft first)
    let printfulOrder;
    try {
      logger.info('Submitting order to Printful', { orderId });
      printfulOrder = await printful.createOrder(printfulPayload, false);

      logger.info('Printful draft order created', {
        orderId,
        printfulOrderId: printfulOrder.id,
        printfulStatus: printfulOrder.status,
      });
    } catch (submitError) {
      const errorMessage =
        submitError instanceof Error ? submitError.message : 'Printful submission failed';
      logger.error('Failed to create Printful order', {
        orderId,
        error: errorMessage,
      });

      // Let Trigger.dev retry - this might be a temporary API issue
      throw submitError;
    }

    // Step 6: Confirm the order (submit for fulfillment)
    try {
      logger.info('Confirming Printful order', {
        orderId,
        printfulOrderId: printfulOrder.id,
      });

      const confirmedOrder = await printful.confirmOrder(printfulOrder.id);

      logger.info('Printful order confirmed', {
        orderId,
        printfulOrderId: confirmedOrder.id,
        printfulStatus: confirmedOrder.status,
      });
    } catch (confirmError) {
      // If confirmation fails, we already have a draft order
      // Log it but don't fail - the order exists in Printful
      logger.warn('Failed to confirm Printful order, order exists as draft', {
        orderId,
        printfulOrderId: printfulOrder.id,
        error: confirmError instanceof Error ? confirmError.message : 'Confirmation failed',
      });
    }

    // Step 7: Update database with Printful details
    await updateOrderWithPrintfulDetails(orderId, printfulOrder.id, printfulOrder.status);

    logger.info('Database updated with Printful details', {
      orderId,
      printfulOrderId: printfulOrder.id,
    });

    // Step 8: Update order status to SUBMITTED_TO_POD
    const statusResult = await updateOrderStatus(
      orderId,
      'SUBMITTED_TO_POD',
      'job:submit-pod-order',
      `Submitted to Printful as order ${printfulOrder.id}`
    );

    if (!statusResult.success) {
      logger.warn('Failed to update order status', {
        orderId,
        error: statusResult.error,
      });
    }

    logger.info('POD order submission complete', {
      orderId,
      orderNumber: order.orderNumber,
      printfulOrderId: printfulOrder.id,
      printfulStatus: printfulOrder.status,
    });

    return {
      success: true,
      orderId,
      orderNumber: order.orderNumber,
      printfulOrderId: printfulOrder.id,
      printfulStatus: printfulOrder.status,
    };
  },

  // Handle final failure after all retries
  onFailure: async ({ payload, error }) => {
    const { orderId } = payload as { orderId: string };
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('POD order submission failed after all retries', {
      orderId,
      error: errorMessage,
    });

    // Mark order as failed and trigger refund
    await handleOrderFailure(
      orderId,
      `Failed to submit to Printful after multiple attempts: ${errorMessage}`
    );
  },
});
