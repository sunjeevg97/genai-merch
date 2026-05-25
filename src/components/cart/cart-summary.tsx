/**
 * Cart Summary Component
 *
 * Displays order summary with subtotal, shipping, and tax information.
 */

'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Lock } from 'lucide-react';

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
          <span className="text-muted-foreground">
            Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground italic">Calculated at checkout</span>
        </div>

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Tax</span>
          <span className="text-muted-foreground italic">Calculated at checkout</span>
        </div>

        <Separator />

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-base font-semibold">Subtotal</span>
          <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
        </div>

        {/* Transition reassurance — last surface before the Stripe redirect. */}
        <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            You&apos;re one screen away. Stripe handles shipping, tax, and payment securely.
          </p>
        </div>
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        <p>
          Prices are in USD. All products are printed and shipped by our fulfillment
          partner.
        </p>
      </CardFooter>
    </Card>
  );
}
