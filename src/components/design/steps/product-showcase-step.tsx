/**
 * Product Showcase Step
 *
 * Fourth and final step in the AI-first design wizard.
 * Displays 5-10 recommended products based on event type and details.
 * Users can preview their design on products, select variants, and add to cart.
 */

'use client';

import { useDesignWizard } from '@/lib/store/design-wizard';
import { useCart } from '@/lib/cart/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Eye, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Product with Variants
 *
 * Extended product type including variants from database.
 */
interface ProductWithVariants {
  id: string;
  name: string;
  description: string | null;
  productType: string;
  category: string;
  basePrice: number;
  imageUrl: string;
  printfulId: number;
  variants: Array<{
    id: string;
    name: string;
    size: string | null;
    color: string | null;
    price: number;
    inStock: boolean;
    imageUrl: string | null;
  }>;
}

/**
 * Product Showcase Step Component
 *
 * Fetches recommended products and displays them with add-to-cart functionality.
 */
export function ProductShowcaseStep() {
  const {
    eventType,
    eventDetails,
    finalDesignUrl,
    previousStep,
    complete,
    setRecommendedProducts,
  } = useDesignWizard();
  const { openCart, itemCount } = useCart();

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch recommended products on mount
   */
  useEffect(() => {
    async function fetchRecommendedProducts() {
      if (!eventType) return;

      try {
        setLoading(true);
        setError(null);

        // Get recommended product IDs from API route
        const recommendationsResponse = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType,
            eventDetails,
            limit: 8,
          }),
        });

        if (!recommendationsResponse.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const { productIds } = await recommendationsResponse.json();

        // Store in wizard state
        setRecommendedProducts(productIds);

        // Fetch full product data
        const response = await fetch('/api/products/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.products);
      } catch (err) {
        console.error('Error fetching recommended products:', err);
        setError('Failed to load recommended products. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendedProducts();
  }, [eventType, eventDetails, setRecommendedProducts]);

  /**
   * Handle checkout
   */
  const handleCheckout = () => {
    complete();
    openCart();
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Loading recommendations...</h2>
          <p className="text-lg text-muted-foreground">
            Finding the perfect products for your event
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Products</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>No Products Found</CardTitle>
            <CardDescription>
              We couldn't find any products matching your event. Please try a different event type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={previousStep}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Products</h2>
        <p className="text-lg text-muted-foreground">
          We've curated {products.length} products perfect for your {eventType} event
        </p>
        {finalDesignUrl && (
          <Badge variant="secondary" className="mt-2">
            <Eye className="mr-1 h-3 w-3" />
            Your design will be previewed on each product
          </Badge>
        )}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} designUrl={finalDesignUrl} />
        ))}
      </div>

      <Separator />

      {/* Cart Summary & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
        <Button variant="outline" onClick={previousStep} type="button">
          Back to Design
        </Button>

        <div className="flex items-center gap-4">
          {itemCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in cart
            </div>
          )}

          <Button onClick={handleCheckout} size="lg" disabled={itemCount === 0}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {itemCount > 0 ? 'Checkout' : 'Add Products to Continue'}
          </Button>
        </div>
      </div>

      {/* Continue Shopping Link */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Want more options?{' '}
          <Link href="/products" className="text-primary hover:underline">
            Browse all products
          </Link>
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Product Card Component
// =============================================================================

interface ProductCardProps {
  product: ProductWithVariants;
  designUrl: string | null;
}

function ProductCard({ product, designUrl }: ProductCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  // Get selected variant or first available
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  /**
   * Handle add to cart
   */
  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addItem({
      productVariantId: selectedVariant.id,
      product: {
        name: product.name,
        imageUrl: selectedVariant.imageUrl || product.imageUrl,
        productType: product.productType,
      },
      variant: {
        name: selectedVariant.name,
        size: selectedVariant.size,
        color: selectedVariant.color,
      },
      design: designUrl
        ? {
            id: 'wizard-design',
            imageUrl: designUrl,
            thumbnailUrl: designUrl,
          }
        : null,
      quantity,
      unitPrice: selectedVariant.price,
    });

    // Reset quantity after adding
    setQuantity(1);
  };

  /**
   * Handle preview with design
   */
  const handlePreview = () => {
    const queryParams = new URLSearchParams();
    if (designUrl) {
      queryParams.set('designId', 'wizard-design');
      queryParams.set('designUrl', designUrl);
    }
    window.open(`/products/${product.id}?${queryParams.toString()}`, '_blank');
  };

  // Get unique sizes and colors for variant selection
  const availableSizes = Array.from(
    new Set(product.variants.filter((v) => v.size).map((v) => v.size))
  );
  const availableColors = Array.from(
    new Set(product.variants.filter((v) => v.color).map((v) => v.color))
  );

  return (
    <Card className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
      {/* Product Image */}
      <div className="relative aspect-square bg-muted group">
        <Image
          src={selectedVariant?.imageUrl || product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
        />
        {designUrl && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" size="sm" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview with Design
            </Button>
          </div>
        )}
        <Badge className="absolute top-2 left-2 bg-primary">
          {formatProductType(product.productType)}
        </Badge>
      </div>

      {/* Product Info */}
      <CardContent className="flex-1 p-4 space-y-3">
        <div>
          <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
          <p className="text-sm text-muted-foreground">From ${(selectedVariant.price / 100).toFixed(2)}</p>
        </div>

        {/* Variant Selectors */}
        {availableSizes.length > 1 && (
          <div className="space-y-1">
            <Label className="text-xs">Size</Label>
            <div className="flex flex-wrap gap-1">
              {availableSizes.slice(0, 4).map((size) => (
                <Button
                  key={size}
                  variant={selectedVariant?.size === size ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs px-2 py-1 h-7"
                  onClick={() => {
                    const variant = product.variants.find((v) => v.size === size);
                    if (variant) setSelectedVariantId(variant.id);
                  }}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="flex items-center gap-2">
          <Label className="text-xs">Qty:</Label>
          <div className="flex items-center border rounded">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              -
            </Button>
            <span className="px-3 text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
            >
              +
            </Button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button onClick={handleAddToCart} className="w-full" size="sm" disabled={!selectedVariant?.inStock}>
          {selectedVariant?.inStock ? (
            <>
              <ShoppingCart className="mr-2 h-3 w-3" />
              Add to Cart
            </>
          ) : (
            <>
              <Package className="mr-2 h-3 w-3" />
              Out of Stock
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

function Label({ children, htmlFor, className = '' }: { children: React.ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium ${className}`}>
      {children}
    </label>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

/** Format product type for display */
function formatProductType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
