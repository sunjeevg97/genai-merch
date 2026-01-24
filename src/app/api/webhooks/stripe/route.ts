/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 *
 * Handles Stripe webhook events for payment processing:
 * - checkout.session.completed: Payment successful, trigger order fulfillment
 * - checkout.session.expired: Session timed out, cleanup pending order
 *
 * Security:
 * - Signature verification using STRIPE_WEBHOOK_SECRET
 * - Idempotency via event ID tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { tasks } from '@trigger.dev/sdk/v3';
import {
  updateOrderStatus,
  getOrderByStripeSession,
  updateOrderFromStripeSession,
  saveShippingAddress,
} from '@/lib/orders/status';

// Initialize Stripe
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

// Store processed event IDs to prevent duplicate processing
// In production, use Redis or database for persistence
const processedEvents = new Set<string>();

/**
 * Verify and parse Stripe webhook event
 */
async function verifyWebhookSignature(
  request: NextRequest
): Promise<Stripe.Event | null> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set');
    return null;
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    console.error('[Stripe Webhook] No stripe-signature header');
    return null;
  }

  const body = await request.text();

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
    return null;
  }
}

/**
 * Handle checkout.session.completed event
 *
 * 1. Find order by session ID
 * 2. Update order with final Stripe totals
 * 3. Save shipping address
 * 4. Update status to PAID
 * 5. Trigger Printful submission job
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const sessionId = session.id;

  console.log('[Stripe Webhook] Processing checkout.session.completed', {
    sessionId,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
  });

  // Step 1: Find order by session ID
  const order = await getOrderByStripeSession(sessionId);

  if (!order) {
    console.error('[Stripe Webhook] Order not found for session', { sessionId });
    // Don't throw - Stripe expects 200 response
    return;
  }

  console.log('[Stripe Webhook] Found order', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    currentStatus: order.status,
  });

  // Step 2: Skip if already processed (idempotency)
  if (order.status !== 'PENDING_PAYMENT') {
    console.log('[Stripe Webhook] Order already processed, skipping', {
      orderId: order.id,
      status: order.status,
    });
    return;
  }

  // Step 3: Update order with Stripe totals
  await updateOrderFromStripeSession(order.id, session);

  console.log('[Stripe Webhook] Updated order with Stripe totals', {
    orderId: order.id,
    total: session.amount_total,
    shipping: session.shipping_cost?.amount_total,
    tax: session.total_details?.amount_tax,
  });

  // Step 4: Save shipping address if provided
  // Note: Stripe API version 2025-12-15.clover may store shipping in different locations
  type ShippingDetailsType = { name?: string | null; address?: Record<string, string | null> | null };
  const shippingDetails = (session as unknown as { shipping_details?: ShippingDetailsType }).shipping_details
    ?? (session as unknown as { collected_information?: { shipping_details?: ShippingDetailsType } }).collected_information?.shipping_details;

  if (shippingDetails) {
    await saveShippingAddress(order.id, shippingDetails);

    console.log('[Stripe Webhook] Saved shipping address', {
      orderId: order.id,
      name: shippingDetails.name,
    });
  }

  // Step 5: Update order status to PAID
  const statusResult = await updateOrderStatus(
    order.id,
    'PAID',
    'webhook:stripe',
    `Payment completed via Stripe session ${sessionId}`
  );

  if (!statusResult.success) {
    console.error('[Stripe Webhook] Failed to update order status', {
      orderId: order.id,
      error: statusResult.error,
    });
    return;
  }

  console.log('[Stripe Webhook] Order status updated to PAID', {
    orderId: order.id,
    orderNumber: order.orderNumber,
  });

  // Step 6: Trigger Printful submission job
  try {
    const handle = await tasks.trigger('submit-pod-order', {
      orderId: order.id,
    });

    console.log('[Stripe Webhook] Triggered POD submission job', {
      orderId: order.id,
      taskId: handle.id,
    });
  } catch (triggerError) {
    // Log but don't fail - order is paid, job can be retried manually
    console.error('[Stripe Webhook] Failed to trigger POD job', {
      orderId: order.id,
      error: triggerError instanceof Error ? triggerError.message : 'Unknown error',
    });
  }
}

/**
 * Handle checkout.session.expired event
 *
 * Clean up pending orders when checkout session expires
 */
async function handleCheckoutExpired(
  session: Stripe.Checkout.Session
): Promise<void> {
  const sessionId = session.id;

  console.log('[Stripe Webhook] Processing checkout.session.expired', {
    sessionId,
  });

  // Find order by session ID
  const order = await getOrderByStripeSession(sessionId);

  if (!order) {
    console.log('[Stripe Webhook] No order found for expired session', {
      sessionId,
    });
    return;
  }

  // Only cancel if still pending
  if (order.status === 'PENDING_PAYMENT') {
    await updateOrderStatus(
      order.id,
      'CANCELLED',
      'webhook:stripe',
      `Checkout session expired: ${sessionId}`
    );

    console.log('[Stripe Webhook] Cancelled expired order', {
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  }
}

/**
 * POST handler for Stripe webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log('[Stripe Webhook] Received webhook request');

  // Verify webhook signature
  const event = await verifyWebhookSignature(request);

  if (!event) {
    console.error('[Stripe Webhook] Signature verification failed');
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  console.log('[Stripe Webhook] Signature verified successfully');

  // Idempotency check
  if (processedEvents.has(event.id)) {
    console.log('[Stripe Webhook] Event already processed, skipping', {
      eventId: event.id,
    });
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Mark as processed (do this early to prevent race conditions)
  processedEvents.add(event.id);

  // Cleanup old events (keep last 1000)
  if (processedEvents.size > 1000) {
    const oldestEvents = Array.from(processedEvents).slice(0, 100);
    oldestEvents.forEach((id) => processedEvents.delete(id));
  }

  console.log('[Stripe Webhook] Received event', {
    eventId: event.id,
    type: event.type,
  });

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      default:
        console.log('[Stripe Webhook] Unhandled event type', {
          type: event.type,
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event', {
      eventId: event.id,
      type: event.type,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return 200 to prevent Stripe retries for application errors
    // Stripe will retry for 5xx errors
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

/**
 * GET handler - returns webhook status (for testing)
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'Stripe webhook endpoint active',
    configured: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
}
