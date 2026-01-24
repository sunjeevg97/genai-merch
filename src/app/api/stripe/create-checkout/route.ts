/**
 * Stripe Create Checkout Session API
 *
 * POST /api/stripe/create-checkout
 *
 * Creates a Stripe checkout session and order in database
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseUser } from '@/lib/clerk/server';
import { z } from 'zod';

// Initialize Stripe (lazy-loaded to avoid build-time errors)
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
  });
}

/**
 * Request validation schema
 */
const checkoutRequestSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      productVariantId: z.string(),
      product: z.object({
        name: z.string(),
        imageUrl: z.string(),
        productType: z.string(),
      }),
      variant: z.object({
        name: z.string(),
        size: z.string().nullable(),
        color: z.string().nullable(),
      }),
      design: z
        .object({
          id: z.string(),
          imageUrl: z.string(),
          thumbnailUrl: z.string().optional(),
          printReadyUrl: z.string().optional(), // Print-prepared design URL (300 DPI, upscaled)
        })
        .nullable(),
      mockupConfig: z
        .object({
          mockupUrl: z.string(),
          technique: z.string(),
          placement: z.string(),
          styleId: z.number(),
          styleName: z.string(),
        })
        .optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().int().positive(), // in cents
    })
  ),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

/**
 * Generate unique order number
 * Format: ORD-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${year}${month}${day}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    // Get user (optional - allow guest checkout)
    const { userId: clerkUserId } = await auth();
    let user = null;
    let userId: string | undefined = undefined;

    if (clerkUserId) {
      user = await getSupabaseUser(clerkUserId);
      userId = user?.id;
    }

    console.log('[Stripe Checkout] Request from user:', userId || 'guest');

    // Parse and validate request body
    const body = await request.json();
    const validation = checkoutRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { items, successUrl, cancelUrl } = validation.data;

    console.log(`[Stripe Checkout] Processing ${items.length} items`);

    // Step 1: Validate all items are in stock
    const variantIds = items.map((item) => item.productVariantId);
    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
      },
      include: {
        product: true,
      },
    });

    // Check that all variants exist and are in stock
    for (const item of items) {
      const variant = variants.find((v) => v.id === item.productVariantId);

      if (!variant) {
        return NextResponse.json(
          {
            error: 'Product not found',
            message: `Product variant ${item.productVariantId} not found`,
          },
          { status: 404 }
        );
      }

      if (!variant.inStock) {
        return NextResponse.json(
          {
            error: 'Product out of stock',
            message: `${variant.product.name} - ${variant.name} is currently out of stock`,
          },
          { status: 400 }
        );
      }

      // Verify price hasn't changed (security measure)
      if (variant.price !== item.unitPrice) {
        console.warn(
          `[Stripe Checkout] Price mismatch for variant ${variant.id}: expected ${variant.price}, got ${item.unitPrice}`
        );
        return NextResponse.json(
          {
            error: 'Price mismatch',
            message: `The price for ${variant.product.name} has changed. Please refresh your cart.`,
          },
          { status: 400 }
        );
      }
    }

    // Step 2: Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    console.log('[Stripe Checkout] Subtotal:', subtotal, 'cents');

    // Step 3: Generate order number
    const orderNumber = generateOrderNumber();

    console.log('[Stripe Checkout] Generated order number:', orderNumber);

    // Step 4: Create order in database with PENDING_PAYMENT status
    // Build order data conditionally to handle optional userId
    const orderData: any = {
      orderNumber,
      status: 'PENDING_PAYMENT',
      subtotal,
      shipping: 0, // Will be updated by Stripe webhook
      tax: 0, // Will be updated by Stripe webhook
      total: subtotal, // Temporary - will be updated after Stripe calculates shipping/tax
      currency: 'USD',
      items: {
        create: items.map((item) => {
          const itemData: any = {
            productVariant: {
              connect: { id: item.productVariantId },
            },
            productName: item.product.name,
            variantName: item.variant.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            thumbnailUrl: item.mockupConfig?.mockupUrl || item.product.imageUrl,
            customizationData: item.mockupConfig
              ? {
                  technique: item.mockupConfig.technique,
                  placement: item.mockupConfig.placement,
                  styleId: item.mockupConfig.styleId,
                  styleName: item.mockupConfig.styleName,
                  mockupUrl: item.mockupConfig.mockupUrl,
                  // Prefer print-ready URL over original
                  designUrl: item.design?.printReadyUrl || item.design?.imageUrl,
                  // Keep original for reference
                  originalDesignUrl: item.design?.imageUrl,
                  // Track preparation status
                  isPrintReady: !!item.design?.printReadyUrl,
                }
              : Prisma.JsonNull,
          };

          // Only connect to Design if it's a real database ID (UUID format)
          // Skip placeholder IDs like 'wizard-design'
          if (item.design?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.design.id)) {
            itemData.design = {
              connect: { id: item.design.id },
            };
          }

          return itemData;
        }),
      },
    };

    // Add user relation only if userId exists (supports guest checkout)
    if (userId) {
      orderData.user = { connect: { id: userId } };
    }

    const order = await prisma.order.create({
      data: orderData,
      include: {
        items: true,
      },
    });

    console.log('[Stripe Checkout] Order created:', order.id);

    // Step 5: Create Stripe checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: user?.email,
        line_items: items.map((item) => ({
          price_data: {
            currency: 'usd',
            unit_amount: item.unitPrice,
            product_data: {
              name: `${item.product.name} - ${item.variant.name}`,
              description: item.design
                ? `Custom design with ${item.mockupConfig?.technique || 'printing'} on ${item.mockupConfig?.placement || 'front'}`
                : undefined,
              images: [item.mockupConfig?.mockupUrl || item.product.imageUrl],
              metadata: {
                product_variant_id: item.productVariantId,
                design_id: item.design?.id || '',
                technique: item.mockupConfig?.technique || '',
                placement: item.mockupConfig?.placement || '',
              },
            },
          },
          quantity: item.quantity,
        })),
        shipping_address_collection: {
          allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'NZ', 'JP'],
        },
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 599, // $5.99 flat rate
                currency: 'usd',
              },
              display_name: 'Standard Shipping',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 5,
                },
                maximum: {
                  unit: 'business_day',
                  value: 10,
                },
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: {
                amount: 1299, // $12.99
                currency: 'usd',
              },
              display_name: 'Express Shipping',
              delivery_estimate: {
                minimum: {
                  unit: 'business_day',
                  value: 2,
                },
                maximum: {
                  unit: 'business_day',
                  value: 3,
                },
              },
            },
          },
        ],
        automatic_tax: {
          enabled: true,
        },
        payment_intent_data: {
          metadata: {
            order_id: order.id,
            order_number: orderNumber,
            user_id: userId || 'guest',
          },
        },
        metadata: {
          order_id: order.id,
          order_number: orderNumber,
          user_id: userId || 'guest',
        },
        success_url: successUrl || `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${baseUrl}/cart`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
      },
      {
        idempotencyKey: `checkout_${order.id}`, // Prevent duplicate sessions
      }
    );

    console.log('[Stripe Checkout] Session created:', session.id);

    // Step 6: Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    // Step 7: Log status change
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: 'PENDING_PAYMENT',
        changedBy: 'system',
        reason: 'Order created, awaiting payment',
      },
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        sessionUrl: session.url,
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);

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
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}