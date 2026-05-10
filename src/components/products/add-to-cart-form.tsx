/**
 * Add to Cart Form Component
 *
 * Handles quantity selection and adding items to cart.
 */

'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart/store';
import type { ProductVariant } from '@prisma/client';
import type { DesignData } from './design-preview';
import { toast } from 'sonner';

interface AddToCartFormProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    productType: string;
  };
  selectedVariant: ProductVariant | null;
  design: DesignData | null;
}

/**
 * Format price from cents to dollars
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AddToCartForm({ product, selectedVariant, design }: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  const handleQuantityChange = (newQuantity: number) => {
    // Clamp quantity between 1 and 10
    const clampedQuantity = Math.max(1, Math.min(10, newQuantity));
    setQuantity(clampedQuantity);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Please select a variant', {
        description: 'Choose a size and color before adding to cart.',
      });
      return;
    }

    if (!selectedVariant.inStock) {
      toast.error('This variant is out of stock', {
        description: 'Please select a different size or color.',
      });
      return;
    }

    setIsAdding(true);

    try {
      // Add item to cart
      addItem({
        productVariantId: selectedVariant.id,
        product: {
          name: product.name,
          imageUrl: product.imageUrl,
          productType: product.productType,
        },
        variant: {
          name: selectedVariant.name,
          size: selectedVariant.size,
          color: selectedVariant.color,
        },
        design: design
          ? {
              id: design.id,
              imageUrl: design.imageUrl,
              thumbnailUrl: design.thumbnailUrl,
            }
          : null,
        quantity,
        unitPrice: selectedVariant.price,
      });

      // Show success notification
      toast.success('Added to cart!', {
        description: `${quantity}x ${product.name} (${selectedVariant.name})`,
        action: {
          label: 'View Cart',
          onClick: () => {
            window.location.href = '/cart';
          },
        },
      });

      // Reset quantity after adding
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart', {
        description: 'Please try again.',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const totalPrice = selectedVariant ? selectedVariant.price * quantity : 0;

  return (
    <div className="space-y-6">
      {/* Price Display - Large & Bold */}
      <div className="flex items-start justify-between gap-4">
        <div>
          {selectedVariant ? (
            <>
              <p className="text-4xl font-bold tracking-tight text-foreground">
                {formatPrice(selectedVariant.price)}
              </p>
              {quantity > 1 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Total: <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-2xl font-medium text-muted-foreground">Select size & color</p>
          )}
        </div>

        {selectedVariant && (
          <div>
            {selectedVariant.inStock ? (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                In Stock
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                Out of Stock
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quantity Selector - Inline */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Quantity</span>
        <div className="flex items-center rounded-lg border border-border bg-card">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-r-none hover:bg-muted"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Input
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="h-9 w-14 border-0 bg-transparent text-center focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-l-none hover:bg-muted"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= 10}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">Max 10</span>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full text-base font-semibold"
        disabled={!selectedVariant || !selectedVariant.inStock || isAdding}
        onClick={handleAddToCart}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </Button>

      {/* Stock Warning */}
      {selectedVariant && !selectedVariant.inStock && (
        <p className="text-center text-sm text-red-400">
          This variant is currently out of stock. Please select a different size or color.
        </p>
      )}
    </div>
  );
}
