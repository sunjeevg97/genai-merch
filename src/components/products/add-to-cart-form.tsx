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
      {/* Price Display */}
      <div className="rounded-lg bg-gray-50 p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm text-gray-600">Price</p>
            {selectedVariant ? (
              <>
                <p className="text-3xl font-bold text-gray-900">
                  {formatPrice(selectedVariant.price)}
                </p>
                {quantity > 1 && (
                  <p className="mt-1 text-sm text-gray-600">
                    Total: {formatPrice(totalPrice)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-2xl font-semibold text-gray-500">Select variant</p>
            )}
          </div>

          {selectedVariant && (
            <div className="text-right">
              {selectedVariant.inStock ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  In Stock
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                  Out of Stock
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">Quantity</label>

        <div className="flex items-center gap-3">
          {/* Decrease Quantity */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>

          {/* Quantity Input */}
          <Input
            type="number"
            min="1"
            max="10"
            value={quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-20 text-center"
          />

          {/* Increase Quantity */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={quantity >= 10}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <span className="text-sm text-gray-600">Max 10 per order</span>
        </div>
      </div>

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full"
        disabled={!selectedVariant || !selectedVariant.inStock || isAdding}
        onClick={handleAddToCart}
      >
        <ShoppingCart className="mr-2 h-5 w-5" />
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </Button>

      {/* Stock Warning */}
      {selectedVariant && !selectedVariant.inStock && (
        <p className="text-center text-sm text-red-600">
          This variant is currently out of stock. Please select a different size or color.
        </p>
      )}
    </div>
  );
}
