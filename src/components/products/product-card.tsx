/**
 * Product Card Component
 *
 * Displays a single product in the catalog grid.
 */

import Link from 'next/link';
import Image from 'next/image';
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
      return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
    case 'accessories':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    case 'home-living':
      return 'bg-green-100 text-green-800 hover:bg-green-100';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  }
}

export function ProductCard({ product }: ProductCardProps) {
  // Calculate starting price (lowest variant price)
  const startingPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : product.basePrice;

  const formattedPrice = `$${(startingPrice / 100).toFixed(2)}`;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
        {/* Product Image */}
        <CardHeader className="p-0">
          <div className="relative aspect-square overflow-hidden bg-gray-100">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                <span className="text-sm">No image</span>
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
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:text-primary">
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-gray-500">
              {product.description}
            </p>
          )}
        </CardContent>

        {/* Price & Variants */}
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div>
            <p className="text-xs text-gray-500">From</p>
            <p className="text-lg font-bold text-gray-900">{formattedPrice}</p>
          </div>

          {product.variants.length > 0 && (
            <p className="text-xs text-gray-500">
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
        <div className="aspect-square animate-pulse bg-gray-200" />
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-200" />
        <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-gray-200" />
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t p-4">
        <div>
          <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
          <div className="mt-1 h-5 w-16 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
      </CardFooter>
    </Card>
  );
}
