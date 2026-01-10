/**
 * Stripe Client Helpers
 *
 * Provides helper functions for creating and managing Stripe checkout sessions.
 */

import { loadStripe, Stripe } from '@stripe/stripe-js';
import type { CartItem } from '@/lib/cart/store';

/**
 * Singleton Stripe instance
 */
let stripePromise: Promise<Stripe | null>;

/**
 * Get Stripe client instance
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.error('[Stripe] Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

/**
 * Checkout Session Request
 */
export interface CreateCheckoutSessionRequest {
  items: CartItem[];
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout Session Response
 */
export interface CreateCheckoutSessionResponse {
  sessionId: string;
  sessionUrl: string;
  orderId: string;
  orderNumber: string;
}

/**
 * Create Stripe checkout session
 *
 * Calls our API route which creates the session server-side and returns the session ID.
 * Then uses Stripe.js to redirect to Stripe Checkout.
 */
export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest
): Promise<CreateCheckoutSessionResponse> {
  console.log('[Stripe] Creating checkout session...', {
    itemCount: request.items.length,
  });

  // Call our API to create the session
  const response = await fetch('/api/stripe/create-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  const data = await response.json();

  console.log('[Stripe] Checkout session created:', {
    sessionId: data.sessionId,
    orderId: data.orderId,
  });

  return data;
}

/**
 * Redirect to Stripe Checkout
 *
 * Redirects to the Stripe Checkout page using the session URL.
 */
export async function redirectToCheckout(sessionUrl: string): Promise<void> {
  console.log('[Stripe] Redirecting to checkout...', { sessionUrl });

  // Direct redirect to Stripe Checkout URL
  window.location.href = sessionUrl;
}

/**
 * Retrieve checkout session details
 *
 * Fetches session details from our API (which proxies to Stripe).
 */
export async function retrieveCheckoutSession(sessionId: string) {
  console.log('[Stripe] Retrieving session...', { sessionId });

  const response = await fetch(`/api/stripe/session/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to retrieve session');
  }

  const data = await response.json();
  console.log('[Stripe] Session retrieved:', data);

  return data;
}

/**
 * Format price in cents to currency string
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}