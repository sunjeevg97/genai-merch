/**
 * Shopping Cart Page
 *
 * Displays cart items with quantity controls and checkout.
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PackageOpen, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { CheckoutButton } from '@/components/cart/checkout-button';
import { useCart } from '@/lib/cart/store';

/**
 * Empty Cart State
 *
 * Shown when cart has no items.
 * Uses warm, friendly copy per UX guidelines.
 */
function EmptyCart() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center py-12 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <PackageOpen className="h-12 w-12 text-muted-foreground" />
      </div>

      <h2 className="mb-2 text-2xl font-bold">
        Your cart is feeling lonely 🥺
      </h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Let&apos;s fill it with something amazing!
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/design/create">
            <Sparkles className="mr-2 h-5 w-5" />
            Start Designing
          </Link>
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart();

  // Recalculate totals on mount (in case of localStorage desync)
  useEffect(() => {
    // Totals are automatically recalculated by the store
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <Link
          href="/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Continue Shopping
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Shopping Cart
        </h1>

        {itemCount > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            You have {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
          </p>
        )}
      </div>

      {/* Empty State */}
      {items.length === 0 && <EmptyCart />}

      {/* Cart Content */}
      {items.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            <h2 className="text-lg font-semibold">Items in Cart</h2>

            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            {/* Mobile Checkout Button */}
            <div className="lg:hidden">
              <Separator className="my-6" />
              <CartSummary subtotal={subtotal} itemCount={itemCount} />
              <div className="mt-4">
                <CheckoutButton itemCount={itemCount} />
              </div>
            </div>
          </div>

          {/* Cart Summary (Desktop) */}
          <div className="hidden lg:block">
            <CartSummary subtotal={subtotal} itemCount={itemCount} />
            <div className="mt-4">
              <CheckoutButton itemCount={itemCount} />
            </div>

            {/* Continue Shopping */}
            <Button asChild variant="outline" className="mt-3 w-full">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
