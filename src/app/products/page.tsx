/**
 * Product Catalog Page
 *
 * Browse all products from Printful catalog.
 * Supports filtering by category and sorting.
 */

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getProducts, getProductCounts } from '@/lib/products/queries';
import { ProductGrid, ProductGridSkeleton } from '@/components/products/product-grid';
import { ProductFilters } from '@/components/products/product-filters';
import { EmptyState } from '@/components/products/empty-state';

export const metadata: Metadata = {
  title: 'Custom Products | GenAI-Merch',
  description:
    'Browse our custom apparel, accessories, and home & living products. Create unique designs with AI-powered tools.',
  keywords: [
    'custom t-shirts',
    'custom hoodies',
    'custom mugs',
    'print on demand',
    'custom apparel',
    'personalized products',
  ],
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    search?: string;
  }>;
}

/**
 * Products Content Component
 *
 * Fetches and displays products based on filters.
 */
async function ProductsContent({
  category,
  sort,
  search,
}: {
  category?: string;
  sort?: string;
  search?: string;
}) {
  const products = await getProducts({
    category,
    sort: sort as any,
    search,
  });

  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      <ProductGrid products={products} />
    </>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const { category, sort, search } = params;

  // Fetch product counts for filter tabs
  const counts = await getProductCounts();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Browse Products
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Discover custom apparel, accessories, and more. Design your perfect
          product with AI.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ProductFilters counts={counts} />
      </div>

      {/* Products Grid */}
      <Suspense
        key={`${category}-${sort}-${search}`}
        fallback={<ProductGridSkeleton count={12} />}
      >
        <ProductsContent category={category} sort={sort} search={search} />
      </Suspense>
    </div>
  );
}
