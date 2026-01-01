/**
 * Checkout Step
 *
 * Final step in the design wizard where users review their cart and proceed to payment.
 */

'use client';

import { useCart } from '@/lib/cart/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, Package, Truck, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

export function CheckoutStep() {
  const { items, subtotal, itemCount } = useCart();

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Calculate estimated shipping and tax (placeholder)
  const estimatedShipping = 599; // $5.99
  const estimatedTax = Math.round(subtotal * 0.08); // 8% tax
  const total = subtotal + estimatedShipping + estimatedTax;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Review & Checkout</h2>
        <p className="text-lg text-muted-foreground">
          Review your order and proceed to payment
        </p>
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">Your cart is empty</h3>
            <p className="mb-6 text-muted-foreground">
              Add some products to your cart to continue
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items ({itemCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      {/* Item Image - Use mockup if available */}
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <Image
                          src={item.mockupConfig?.mockupUrl || item.design?.imageUrl || item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                        {item.design && (
                          <Badge className="absolute bottom-1 left-1 text-xs" variant="secondary">
                            Custom
                          </Badge>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold">{item.product.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                        {item.mockupConfig && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            <Badge variant="outline">{item.mockupConfig.technique.toUpperCase()}</Badge>
                            <Badge variant="outline">{item.mockupConfig.placement}</Badge>
                            <Badge variant="outline">{item.mockupConfig.styleName}</Badge>
                          </div>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">{formatPrice(item.unitPrice)}</span>
                          <span className="text-muted-foreground"> × {item.quantity}</span>
                        </p>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Information (Placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Shipping address and delivery options will be collected during checkout.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping (est.)</span>
                  <span className="font-medium">{formatPrice(estimatedShipping)}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (est.)</span>
                  <span className="font-medium">{formatPrice(estimatedTax)}</span>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold">{formatPrice(total)}</span>
                </div>

                {/* Checkout Button (Placeholder) */}
                <Button className="w-full" size="lg" disabled>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Proceed to Payment (Coming Soon)
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Stripe checkout integration coming soon
                </p>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <h4 className="mb-2 font-semibold text-blue-900">What happens next?</h4>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Secure payment processing via Stripe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Order submitted to Printful for fulfillment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Production time: 2-7 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>Shipping: 3-10 business days</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
