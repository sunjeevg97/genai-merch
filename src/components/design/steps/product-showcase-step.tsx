/**
 * Product Showcase Step
 *
 * Fourth and final step in the AI-first design wizard.
 * Displays the full product catalog with filtering, search, and inline mockup preview.
 * Users stay within the wizard flow to browse and add products to cart.
 */

'use client';

import { useDesignWizard } from '@/lib/store/design-wizard';
import { useCart } from '@/lib/cart/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShoppingCart, Eye, Package, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MockupPreview } from '@/components/products/mockup-preview';
import type { ProductVariant } from '@prisma/client';

/**
 * Product with Variants
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
    printfulVariantId: number;
  }>;
}

type Category = 'all' | 'apparel' | 'accessories' | 'home-living';
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

const CATEGORIES = [
  { value: 'all' as const, label: 'All Products' },
  { value: 'apparel' as const, label: 'Apparel' },
  { value: 'accessories' as const, label: 'Accessories' },
  { value: 'home-living' as const, label: 'Home & Living' },
];

const SORT_OPTIONS = [
  { value: 'featured' as const, label: 'Featured' },
  { value: 'price-asc' as const, label: 'Price: Low to High' },
  { value: 'price-desc' as const, label: 'Price: High to Low' },
  { value: 'newest' as const, label: 'Newest' },
];

/**
 * Product Showcase Step Component
 */
export function ProductShowcaseStep() {
  const {
    finalDesignUrl,
    previousStep,
    complete,
  } = useDesignWizard();

  // Cart state - must be called before any conditional returns
  const { items, subtotal, itemCount, removeItem, updateQuantity } = useCart();

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/sort state
  const [category, setCategory] = useState<Category>('all');
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  /**
   * Fetch all products on mount
   */
  useEffect(() => {
    async function fetchAllProducts() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all active products
        const response = await fetch('/api/products/all');

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data = await response.json();
        setProducts(data.products);
        setFilteredProducts(data.products);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchAllProducts();
  }, []);

  /**
   * Filter and sort products whenever filters change
   */
  useEffect(() => {
    let result = [...products];

    // Filter by category
    if (category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    // Sort products
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'newest':
        // Newest first (assuming later in array = newer)
        result.reverse();
        break;
      case 'featured':
      default:
        // Featured: sort by category, then price
        result.sort((a, b) => {
          if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
          }
          return a.basePrice - b.basePrice;
        });
        break;
    }

    setFilteredProducts(result);
  }, [category, sortOption, products]);

  /**
   * Get product counts by category
   */
  const getCategoryCounts = () => {
    return {
      all: products.length,
      apparel: products.filter((p) => p.category === 'apparel').length,
      accessories: products.filter((p) => p.category === 'accessories').length,
      'home-living': products.filter((p) => p.category === 'home-living').length,
    };
  };

  /**
   * Handle product card click
   */
  const handleProductClick = (product: ProductWithVariants) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  /**
   * Handle checkout
   */
  const handleCheckout = () => {
    complete();
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Loading products...</h2>
          <p className="text-lg text-muted-foreground">
            Finding the perfect products for you
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
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-destructive">Error Loading Products</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const counts = getCategoryCounts();

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <>
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Choose Your Products</h2>
            <p className="text-lg text-muted-foreground">
              Browse our catalog of {counts.all} products and see your design come to life
            </p>
            {finalDesignUrl && (
              <Badge variant="secondary" className="mt-2">
                <Eye className="mr-1 h-3 w-3" />
                Click any product to preview your design
              </Badge>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Category Tabs */}
            <Tabs value={category} onValueChange={(v) => setCategory(v as Category)} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-4 sm:w-auto">
                {CATEGORIES.map((cat) => {
                  const count = counts[cat.value];
                  return (
                    <TabsTrigger key={cat.value} value={cat.value} className="text-xs sm:text-sm">
                      <span className="hidden sm:inline">{cat.label}</span>
                      <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
                      <span className="ml-1 text-xs text-muted-foreground">({count})</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
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
        </div>

        {/* Main Content: Products Grid + Cart Sidebar */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Product Grid (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCardInline
                  key={product.id}
                  product={product}
                  designUrl={finalDesignUrl}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg text-muted-foreground">No products found in this category</p>
              </div>
            )}
          </div>

          {/* Right: Cart Sidebar (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6 space-y-4">
                {/* Cart Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Your Cart ({itemCount})
                  </h3>
                  {itemCount > 0 && (
                    <span className="text-sm font-medium text-primary">
                      {formatPrice(subtotal)}
                    </span>
                  )}
                </div>

                <Separator />

                {/* Cart Items */}
                {items.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Your cart is empty
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click products to add them
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="space-y-3">
                        <div className="flex gap-3">
                          {/* Item Image - Use mockup if available */}
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                            <Image
                              src={item.mockupConfig?.mockupUrl || item.design?.imageUrl || item.product.imageUrl}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                            {item.design && (
                              <Badge className="absolute bottom-0.5 left-0.5 text-[10px] h-4 px-1" variant="secondary">
                                Custom
                              </Badge>
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{item.variant.name}</p>
                            {item.mockupConfig && (
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {item.mockupConfig.technique.toUpperCase()}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {item.mockupConfig.placement}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <span className="text-xs w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                              <span className="text-xs font-medium ml-auto">
                                {formatPrice(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-full text-xs text-destructive hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          Remove
                        </Button>

                        <Separator />
                      </div>
                    ))}
                  </div>
                )}

                {/* Cart Footer */}
                {items.length > 0 && (
                  <>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">{formatPrice(subtotal)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Shipping and taxes calculated at checkout
                      </p>
                    </div>

                    <Button onClick={handleCheckout} className="w-full" size="lg">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Proceed to Checkout
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={previousStep} type="button" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Design
          </Button>
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          designUrl={finalDesignUrl}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}
    </>
  );
}

// =============================================================================
// Product Card Inline Component
// =============================================================================

interface ProductCardInlineProps {
  product: ProductWithVariants;
  designUrl: string | null;
  onClick: () => void;
}

function ProductCardInline({ product, designUrl, onClick }: ProductCardInlineProps) {
  const startingPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => v.price))
      : product.basePrice;

  const formattedPrice = `$${(startingPrice / 100).toFixed(2)}`;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'apparel':
        return 'bg-blue-100 text-blue-800';
      case 'accessories':
        return 'bg-purple-100 text-purple-800';
      case 'home-living':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatProductType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={onClick}
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {designUrl && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Badge variant="secondary" className="bg-white/90">
              <Eye className="mr-1 h-3 w-3" />
              Preview with Design
            </Badge>
          </div>
        )}
        <Badge className={`absolute top-2 left-2 ${getCategoryColor(product.category)}`}>
          {formatProductType(product.productType)}
        </Badge>
      </div>

      {/* Product Info */}
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold line-clamp-2 text-sm min-h-[2.5rem] group-hover:text-primary">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-lg font-bold">{formattedPrice}</p>
          </div>
          {product.variants.length > 0 && (
            <p className="text-xs text-muted-foreground">{product.variants.length}+ options</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Product Detail Modal Component
// =============================================================================

interface ProductDetailModalProps {
  product: ProductWithVariants;
  designUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function ProductDetailModal({ product, designUrl, isOpen, onClose }: ProductDetailModalProps) {
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Select first variant by default
  useEffect(() => {
    if (product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

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

    setQuantity(1);
    onClose();
  };

  // Color name to hex mapping for common colors
  const colorMap: Record<string, string> = {
    // Basics
    'White': '#FFFFFF',
    'Black': '#000000',
    'Gray': '#808080',
    'Grey': '#808080',
    'Heather Grey': '#B8B8B8',
    'Dark Grey': '#4A4A4A',
    'Light Grey': '#D3D3D3',

    // Blues
    'Navy': '#000080',
    'Navy Blue': '#000080',
    'Royal Blue': '#4169E1',
    'Blue': '#0000FF',
    'Light Blue': '#ADD8E6',
    'Sky Blue': '#87CEEB',

    // Reds & Pinks
    'Red': '#FF0000',
    'Maroon': '#800000',
    'Pink': '#FFC0CB',
    'Hot Pink': '#FF69B4',

    // Greens
    'Green': '#008000',
    'Forest Green': '#228B22',
    'Dark Green': '#006400',
    'Olive': '#808000',
    'Kelly Green': '#4CBB17',

    // Yellows & Oranges
    'Yellow': '#FFFF00',
    'Gold': '#FFD700',
    'Orange': '#FFA500',

    // Purples
    'Purple': '#800080',

    // Browns
    'Brown': '#A52A2A',
    'Tan': '#D2B48C',
  };

  const getColorHex = (colorName: string | null): string => {
    if (!colorName) return '#CCCCCC';
    return colorMap[colorName] || '#CCCCCC';
  };

  // Get unique sizes and colors
  const availableSizes = Array.from(new Set(product.variants.filter((v) => v.size).map((v) => v.size)));
  const availableColors = Array.from(new Set(product.variants.filter((v) => v.color).map((v) => v.color)));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription className="text-base">{product.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 md:grid-cols-2 mt-6">
          {/* Left: Product Preview / Mockup */}
          <div>
            {designUrl && selectedVariant ? (
              <MockupPreview
                productVariantId={selectedVariant.id}
                printfulProductId={product.printfulId}
                designUrl={designUrl}
                productImageUrl={product.imageUrl}
                productType={product.productType}
                product={{
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  productType: product.productType,
                }}
                selectedVariant={selectedVariant as ProductVariant}
                design={{
                  id: 'wizard-design',
                  imageUrl: designUrl,
                  thumbnailUrl: designUrl,
                }}
              />
            ) : (
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedVariant?.imageUrl || product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Right: Product Details & Add to Cart */}
          <div className="space-y-8">
            {/* Price */}
            <div className="pb-4 border-b">
              <p className="text-sm text-muted-foreground mb-2">Price</p>
              <p className="text-4xl font-bold">${(selectedVariant.price / 100).toFixed(2)}</p>
            </div>

            {/* Size Selection */}
            {availableSizes.length > 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">Size</p>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => {
                    const variant = product.variants.find((v) => v.size === size);
                    const isSelected = variant?.id === selectedVariantId;
                    return (
                      <Button
                        key={size}
                        variant={isSelected ? 'default' : 'outline'}
                        size="default"
                        className="min-w-[60px] h-11"
                        onClick={() => variant && setSelectedVariantId(variant.id)}
                      >
                        {size}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {availableColors.length > 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">Color</p>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => {
                    const variant = product.variants.find((v) => v.color === color);
                    const isSelected = variant?.id === selectedVariantId;
                    const hexColor = getColorHex(color);
                    return (
                      <button
                        key={color}
                        onClick={() => variant && setSelectedVariantId(variant.id)}
                        className={`flex items-center gap-2 px-4 h-11 rounded-md border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 ${
                            color === 'White' ? 'border-gray-300' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: hexColor }}
                        />
                        <span className="text-sm font-medium">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-700">Quantity</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  className="h-12 w-12"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="w-16 text-center text-lg font-semibold">{quantity}</span>
                <Button
                  variant="outline"
                  size="default"
                  className="h-12 w-12"
                  onClick={() => setQuantity(Math.min(99, quantity + 1))}
                >
                  +
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleAddToCart}
              disabled={!selectedVariant?.inStock}
            >
              {selectedVariant?.inStock ? (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Out of Stock
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
