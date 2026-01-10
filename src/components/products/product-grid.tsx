/**
 * Product Grid Component
 *
 * Responsive grid container for product cards.
 */

import { ProductCard, ProductCardSkeleton } from './product-card';
import type { ProductWithVariants } from '@/lib/products/queries';

interface ProductGridProps {
  products: ProductWithVariants[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/**
 * Product Grid Skeleton
 *
 * Loading placeholder for product grid.
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
