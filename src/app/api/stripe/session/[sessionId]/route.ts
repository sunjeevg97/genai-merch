/**
 * Stripe Session Retrieval API
 *
 * GET /api/stripe/session/[sessionId]
 *
 * Retrieves Stripe checkout session details and associated order
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    console.log('[Stripe Session] Retrieving session:', sessionId);

    // Step 1: Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'payment_intent', 'line_items', 'shipping_cost', 'total_details'],
    });

    console.log('[Stripe Session] Session retrieved:', {
      id: session.id,
      status: session.payment_status,
      orderId: session.metadata?.order_id,
    });

    // Step 2: Get order from database
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      return NextResponse.json(
        {
          error: 'Order not found',
          message: 'No order associated with this session',
        },
        { status: 404 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
            design: true,
          },
        },
        shippingAddress: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: 'Order not found',
          message: `Order ${orderId} not found in database`,
        },
        { status: 404 }
      );
    }

    // Step 3: Return combined data
    // Type assertion for shipping_details (available when session is expanded)
    const sessionWithShipping = session as any;

    return NextResponse.json(
      {
        session: {
          id: session.id,
          status: session.payment_status,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          shipping: session.shipping_cost
            ? {
                amount: session.shipping_cost.amount_total,
                name: session.shipping_cost.shipping_rate,
              }
            : null,
          shipping_details: sessionWithShipping.shipping_details
            ? {
                name: sessionWithShipping.shipping_details.name,
                address: {
                  line1: sessionWithShipping.shipping_details.address?.line1,
                  line2: sessionWithShipping.shipping_details.address?.line2,
                  city: sessionWithShipping.shipping_details.address?.city,
                  state: sessionWithShipping.shipping_details.address?.state,
                  postal_code: sessionWithShipping.shipping_details.address?.postal_code,
                  country: sessionWithShipping.shipping_details.address?.country,
                },
              }
            : null,
          tax: session.total_details?.amount_tax || 0,
        },
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          subtotal: order.subtotal,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total,
          currency: order.currency,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            id: item.id,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            thumbnailUrl: item.thumbnailUrl,
            customization: item.customizationData,
          })),
          shippingAddress: order.shippingAddress,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Stripe Session] Error:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: 'Stripe error',
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to retrieve session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}