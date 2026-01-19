/**
 * Product Card Component
 *
 * Displays a single product in the catalog grid.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProductWithVariants } from '@/lib/products/queries';

interface ProductCardProps {
  product: ProductWithVariants;
}

/**
 * Format product type for display
 */
function formatProductType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get category badge color
 */
function getCategoryColor(category: string): string {
  switch (category) {
    case 'apparel':
      return 'bg-primary/10 text-primary hover:bg-primary/10';
    case 'accessories':
      return 'bg-accent/10 text-accent hover:bg-accent/10';
    case 'home-living':
      return 'bg-success/10 text-success hover:bg-success/10';
    default:
      return 'bg-muted text-foreground hover:bg-muted';
  }
}

export function ProductCard({ product }: ProductCardProps) {
  // Calculate starting price (lowest variant price)
  const startingPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : product.basePrice;

  const formattedPrice = `$${(startingPrice / 100).toFixed(2)}`;

  // Validate image URL
  const isValidImageUrl = (url: string | null): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const hasValidImage = isValidImageUrl(product.imageUrl);

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        {/* Product Image */}
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden bg-muted">
            {hasValidImage ? (
              <Image
                src={product.imageUrl!}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={(e) => {
                  console.error('Failed to load image:', product.imageUrl);
                  console.error('Product:', product.name);
                }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <Package className="h-12 w-12" />
                <span className="text-xs">No image available</span>
              </div>
            )}

            {/* Category Badge */}
            <div className="absolute left-2 top-2">
              <Badge className={getCategoryColor(product.category)}>
                {formatProductType(product.productType)}
              </Badge>
            </div>
          </div>
        </CardHeader>

        {/* Product Info */}
        <CardContent className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {product.description}
            </p>
          )}
        </CardContent>

        {/* Price & Variants */}
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-lg font-bold text-foreground">{formattedPrice}</p>
          </div>

          {product.variants.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {product.variants.length}+ options
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

/**
 * Product Card Skeleton
 *
 * Loading placeholder for product cards.
 */
export function ProductCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="p-0">
        <div className="aspect-square animate-pulse bg-muted" />
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
        <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-muted" />
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-4">
        <div>
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-5 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </CardFooter>
    </Card>
  );
}
