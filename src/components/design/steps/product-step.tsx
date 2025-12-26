/**
 * Product Selection Step
 *
 * Second step in the AI-first design wizard.
 * Users select which product types they want to order.
 * Multiple products can be selected.
 */

'use client';

import { useState } from 'react';
import { useDesignWizard } from '@/lib/store/design-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';

/**
 * Product Type
 */
interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: 'apparel' | 'drinkware' | 'stationery' | 'accessories';
}

/**
 * Available Products
 */
const PRODUCTS: Product[] = [
  {
    id: 'tshirt',
    name: 'T-Shirts',
    description: 'Classic comfort, perfect for any occasion',
    imageUrl: '/products/t-shirt.png',
    category: 'apparel',
  },
  {
    id: 'sweatshirt',
    name: 'Sweatshirts',
    description: 'Cozy and warm for cooler days',
    imageUrl: '/products/sweatshirt.png',
    category: 'apparel',
  },
  {
    id: 'hoodie',
    name: 'Hoodies',
    description: 'Comfortable hooded sweatshirts',
    imageUrl: '/products/hoodie.png',
    category: 'apparel',
  },
  {
    id: 'mug',
    name: 'Mugs',
    description: 'Ceramic mugs for coffee and tea',
    imageUrl: '/products/mug.png',
    category: 'drinkware',
  },
  {
    id: 'pen',
    name: 'Pens',
    description: 'Professional branded pens',
    imageUrl: '/products/pen.png',
    category: 'stationery',
  },
  {
    id: 'sticker',
    name: 'Stickers',
    description: 'Durable vinyl stickers',
    imageUrl: '/products/sticker.png',
    category: 'stationery',
  },
  {
    id: 'tote',
    name: 'Tote Bags',
    description: 'Reusable canvas tote bags',
    imageUrl: '/products/tote-bag.png',
    category: 'accessories',
  },
  {
    id: 'hat',
    name: 'Hats',
    description: 'Adjustable baseball caps',
    imageUrl: '/products/hat.png',
    category: 'accessories',
  },
];

/**
 * Product Step Component
 *
 * Displays a grid of product cards with checkboxes for multi-selection.
 *
 * @example
 * ```tsx
 * <ProductStep />
 * ```
 */
export function ProductStep() {
  const { selectedProducts, setSelectedProducts, nextStep, previousStep } = useDesignWizard();
  const [showValidationError, setShowValidationError] = useState(false);

  /**
   * Check if a product is selected
   */
  const isProductSelected = (productId: string): boolean => {
    return selectedProducts.includes(productId);
  };

  /**
   * Toggle product selection
   */
  const handleToggleProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      // Remove product
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      // Add product
      setSelectedProducts([...selectedProducts, productId]);
    }
    // Clear validation error when user makes a selection
    setShowValidationError(false);
  };

  /**
   * Handle Continue button
   */
  const handleContinue = () => {
    if (selectedProducts.length === 0) {
      setShowValidationError(true);
      return;
    }
    nextStep();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Choose your products</h2>
        <p className="text-lg text-muted-foreground">
          Select one or more products for your custom designs
        </p>
      </div>

      {/* Validation Error */}
      {showValidationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select at least one product to continue
          </AlertDescription>
        </Alert>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRODUCTS.map((product) => {
          const selected = isProductSelected(product.id);

          return (
            <Card
              key={product.id}
              className={`
                cursor-pointer
                transition-all
                duration-200
                hover:border-primary
                hover:shadow-md
                ${selected ? 'border-primary bg-primary/5' : 'border-border'}
              `}
              onClick={() => handleToggleProduct(product.id)}
            >
              <CardHeader className="pb-3">
                {/* Product Image */}
                <div className="relative w-full aspect-square mb-3 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    onError={(e) => {
                      // Fallback to a gradient background if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  {/* Fallback gradient when image is missing */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl opacity-50">
                      {product.category === 'apparel' && '👕'}
                      {product.category === 'drinkware' && '☕'}
                      {product.category === 'stationery' && '✏️'}
                      {product.category === 'accessories' && '🎒'}
                    </span>
                  </div>
                </div>

                {/* Checkbox and Title */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => handleToggleProduct(product.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base">{product.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="text-sm">
                  {product.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {selectedProducts.length === 0 ? (
            'No products selected'
          ) : (
            <>
              {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected:{' '}
              <span className="font-medium text-foreground">
                {PRODUCTS.filter((p) => selectedProducts.includes(p.id))
                  .map((p) => p.name)
                  .join(', ')}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={previousStep} type="button">
          Back
        </Button>

        <Button onClick={handleContinue} type="button">
          Continue to Brand Assets
        </Button>
      </div>
    </div>
  );
}
