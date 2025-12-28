/**
 * Cart Item Component
 *
 * Displays a single item in the shopping cart with quantity controls.
 */

'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CartItem as CartItemType } from '@/lib/cart/store';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

/**
 * Format price from cents to dollars
 */
function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const totalPrice = item.unitPrice * item.quantity;

  const handleQuantityChange = (newQuantity: number) => {
    // Ensure quantity is between 1 and 99
    const clampedQuantity = Math.max(1, Math.min(99, newQuantity));
    onUpdateQuantity(item.id, clampedQuantity);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
            {item.design?.imageUrl ? (
              <Image
                src={item.design.thumbnailUrl || item.design.imageUrl}
                alt={`${item.product.name} with custom design`}
                fill
                className="object-cover"
              />
            ) : item.product.imageUrl ? (
              <Image
                src={item.product.imageUrl}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-xs">No image</span>
              </div>
            )}

            {/* Custom Design Badge */}
            {item.design && (
              <div className="absolute bottom-1 left-1">
                <Badge variant="secondary" className="text-xs">
                  Custom
                </Badge>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-1 flex-col justify-between">
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.variant.name}</p>

                  {/* Variant Details */}
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    {item.variant.size && <span>Size: {item.variant.size}</span>}
                    {item.variant.color && <span>Color: {item.variant.color}</span>}
                  </div>

                  {/* Design Info */}
                  {item.design && (
                    <p className="mt-1 text-xs text-primary">
                      Custom Design Applied
                    </p>
                  )}
                </div>

                {/* Price (Desktop) */}
                <div className="hidden text-right sm:block">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(totalPrice)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPrice(item.unitPrice)} each
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Controls & Remove */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Decrease Quantity */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                {/* Quantity Input */}
                <Input
                  type="number"
                  min="1"
                  max="99"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  className="h-8 w-16 text-center"
                />

                {/* Increase Quantity */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={item.quantity >= 99}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Remove
              </Button>
            </div>

            {/* Price (Mobile) */}
            <div className="mt-2 flex justify-between sm:hidden">
              <p className="font-semibold text-gray-900">{formatPrice(totalPrice)}</p>
              <p className="text-sm text-gray-500">{formatPrice(item.unitPrice)} each</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
