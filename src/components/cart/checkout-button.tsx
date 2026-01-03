/**
 * Checkout Button Component
 *
 * Handles checkout flow initiation with Stripe.
 */

'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart/store';
import { createCheckoutSession, redirectToCheckout } from '@/lib/stripe/client';

interface CheckoutButtonProps {
  disabled?: boolean;
  itemCount: number;
  subtotal: number;
}

export function CheckoutButton({ disabled, itemCount, subtotal }: CheckoutButtonProps) {
  const { items } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (disabled || itemCount === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[Checkout Button] Creating Stripe session...', { itemCount, subtotal });

      // Create checkout session with cart items
      const { sessionId, sessionUrl, orderId, orderNumber } = await createCheckoutSession({
        items,
      });

      console.log('[Checkout Button] Session created:', { sessionId, orderId, orderNumber });

      toast.success('Redirecting to checkout...', {
        description: `Order ${orderNumber} created`,
      });

      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionUrl);

      // Note: Cart will be cleared on the success page after payment confirmation
    } catch (error) {
      console.error('[Checkout Button] Error:', error);
      toast.error('Failed to proceed to checkout', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={disabled || itemCount === 0 || isProcessing}
      onClick={handleCheckout}
    >
      <ShoppingBag className="mr-2 h-5 w-5" />
      {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
    </Button>
  );
}
