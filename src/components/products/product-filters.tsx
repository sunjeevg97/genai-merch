/**
 * Product Filters Component
 *
 * Client component for filtering and sorting products.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  counts: {
    all: number;
    apparel: number;
    accessories: number;
    'home-living': number;
  };
}

const CATEGORIES = [
  { value: 'all', label: 'All Products' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'home-living', label: 'Home & Living' },
] as const;

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
] as const;

export function ProductFilters({ counts }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || 'all';
  const currentSort = searchParams.get('sort') || 'featured';

  /**
   * Update URL search params
   */
  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all' && key === 'category') {
      params.delete('category');
    } else if (value === 'featured' && key === 'sort') {
      params.delete('sort');
    } else {
      params.set(key, value);
    }

    router.push(`/products?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Category Tabs */}
      <Tabs
        value={currentCategory}
        onValueChange={(value) => updateParams('category', value)}
        className="w-full sm:w-auto"
      >
        <TabsList className="grid w-full grid-cols-4 sm:w-auto">
          {CATEGORIES.map((category) => {
            const count =
              category.value === 'all'
                ? counts.all
                : counts[category.value as keyof typeof counts];

            return (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">
                  {category.label.split(' ')[0]}
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({count})
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        <Select value={currentSort} onValueChange={(value) => updateParams('sort', value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
