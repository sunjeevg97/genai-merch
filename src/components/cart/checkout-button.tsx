/**
 * Checkout Button Component
 *
 * Handles checkout flow initiation.
 */

'use client';

import { useState } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (disabled || itemCount === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement checkout flow
      // For now, just show a coming soon message
      toast.info('Checkout coming soon!', {
        description: 'We are working on the checkout process.',
      });

      // Future implementation:
      // 1. Create checkout session
      // 2. Redirect to Stripe checkout or custom checkout page
      // router.push('/checkout');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to proceed to checkout', {
        description: 'Please try again or contact support.',
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
