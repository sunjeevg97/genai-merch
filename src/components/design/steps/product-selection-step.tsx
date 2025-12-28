/**
 * Product Selection Step
 *
 * Second step in the AI-first design wizard.
 * Users select which products they want to create designs for.
 * Multiple products can be selected.
 */

'use client';

import { useDesignWizard } from '@/lib/store/design-wizard';
import { MOCKUPS, type Mockup } from '@/lib/design/mockups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import Image from 'next/image';

/**
 * Product Selection Step Component
 *
 * Displays a grid of product mockup cards for multi-selection.
 * Users can select multiple products and proceed when at least one is selected.
 *
 * @example
 * ```tsx
 * <ProductSelectionStep />
 * ```
 */
export function ProductSelectionStep() {
  const { selectedProducts, toggleProduct, nextStep, previousStep } = useDesignWizard();

  /**
   * Check if a product is currently selected
   */
  const isProductSelected = (productId: string): boolean => {
    return selectedProducts.includes(productId);
  };

  /**
   * Handle Continue button click
   * Only proceeds if at least one product is selected
   */
  const handleContinue = () => {
    if (selectedProducts.length > 0) {
      nextStep();
    }
  };

  /**
   * Get display information for a product
   */
  const getProductDisplayName = (mockup: Mockup): string => {
    // Capitalize first letter of product type
    const type = mockup.productType.charAt(0).toUpperCase() + mockup.productType.slice(1);
    // Capitalize first letter of color
    const color = mockup.color.charAt(0).toUpperCase() + mockup.color.slice(1);
    return `${color} ${type}`;
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

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCKUPS.map((mockup) => {
          const selected = isProductSelected(mockup.id);

          return (
            <Card
              key={mockup.id}
              className={`
                cursor-pointer
                transition-all
                duration-200
                hover:border-primary
                hover:shadow-lg
                relative
                ${selected ? 'border-primary ring-2 ring-primary' : 'border-border'}
              `}
              onClick={() => toggleProduct(mockup.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleProduct(mockup.id);
                }
              }}
              aria-pressed={selected}
            >
              {/* Selection Indicator */}
              {selected && (
                <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}

              <CardHeader className="pb-3">
                {/* Product Image */}
                <div className="relative w-full aspect-square mb-3 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={mockup.imageUrl}
                    alt={getProductDisplayName(mockup)}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>

                {/* Product Name */}
                <CardTitle className="text-lg text-center">
                  {getProductDisplayName(mockup)}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center pt-0">
                <CardDescription className="text-sm">
                  {mockup.name}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          {selectedProducts.length === 0
            ? 'Select at least one product to continue'
            : `${selectedProducts.length} product${selectedProducts.length !== 1 ? 's' : ''} selected`}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={previousStep}
          type="button"
        >
          Back
        </Button>

        <Button
          onClick={handleContinue}
          disabled={selectedProducts.length === 0}
          type="button"
        >
          Continue to Brand Assets
        </Button>
      </div>
    </div>
  );
}
