'use client';

import { useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart/store';
import { createCheckoutSession, redirectToCheckout } from '@/lib/stripe/client';

interface CheckoutButtonProps {
  disabled?: boolean;
  itemCount: number;
}

export function CheckoutButton({ disabled, itemCount }: CheckoutButtonProps) {
  const { items } = useCart();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (disabled || itemCount === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const { sessionUrl, orderNumber } = await createCheckoutSession({ items });
      toast.success(`Order ${orderNumber} created`, {
        description: 'Redirecting to secure checkout…',
      });
      await redirectToCheckout(sessionUrl);
    } catch (error) {
      console.error('[CheckoutButton] Failed to start checkout:', error);
      toast.error('Could not start checkout', {
        description:
          error instanceof Error
            ? error.message
            : 'Please try again in a moment.',
      });
      setLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={disabled || itemCount === 0 || loading}
      onClick={handleCheckout}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Preparing checkout…
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2 h-5 w-5" />
          Proceed to Checkout
        </>
      )}
    </Button>
  );
}
