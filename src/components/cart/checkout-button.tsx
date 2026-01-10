/**
 * Checkout Button Component
 *
 * Navigates to the design wizard's checkout step for order review.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  disabled?: boolean;
  itemCount: number;
  subtotal: number;
}

export function CheckoutButton({ disabled, itemCount, subtotal }: CheckoutButtonProps) {
  const router = useRouter();

  const handleCheckout = () => {
    console.log('[Checkout Button] Button clicked!', { disabled, itemCount, subtotal });

    if (disabled || itemCount === 0) {
      console.log('[Checkout Button] Cart is empty, showing error');
      toast.error('Your cart is empty');
      return;
    }

    console.log('[Checkout Button] Navigating to checkout step...');
    console.log('[Checkout Button] Current URL:', window.location.href);

    try {
      // Navigate to design wizard's checkout step (Step 5)
      const targetUrl = '/design/create?step=5';
      console.log('[Checkout Button] Target URL:', targetUrl);
      router.push(targetUrl);
      console.log('[Checkout Button] Navigation triggered successfully');

      // Log URL after a brief delay to see if it changed
      setTimeout(() => {
        console.log('[Checkout Button] URL after navigation:', window.location.href);
      }, 100);
    } catch (error) {
      console.error('[Checkout Button] Navigation error:', error);
    }
  };

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={disabled || itemCount === 0}
      onClick={handleCheckout}
    >
      <ShoppingBag className="mr-2 h-5 w-5" />
      Proceed to Checkout
    </Button>
  );
}
