/**
 * Cart Summary Component
 *
 * Displays order summary with subtotal, shipping, and tax information.
 */

'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: number; // Price in cents
  itemCount: number;
}

/**
 * Format price from cents to dollars
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartSummary({ subtotal, itemCount }: CartSummaryProps) {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Item Count */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-gray-500 italic">Calculated at checkout</span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Estimated Tax</span>
          <span className="text-gray-500 italic">Calculated at checkout</span>
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-base font-semibold">Subtotal</span>
          <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500">
          Final shipping cost and tax will be calculated during checkout based on your
          delivery address.
        </p>
      </CardContent>

      <CardFooter className="text-xs text-gray-500">
        <p>
          Prices are in USD. All products are printed and shipped by our fulfillment
          partner.
        </p>
      </CardFooter>
    </Card>
  );
}
