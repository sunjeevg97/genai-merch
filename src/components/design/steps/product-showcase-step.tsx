/**
 * Product Showcase Step
 *
 * Fourth and final step in the AI-first design wizard.
 * Displays the full product catalog with filtering, search, and inline mockup preview.
 * Users stay within the wizard flow to browse and add products to cart.
 */

'use client';

import { useDesignWizard, getWizardDesignData } from '@/lib/store/design-wizard';
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
import { ShoppingCart, Eye, Package, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MockupPreview } from '@/components/products/mockup-preview';
import type { ProductVariant } from '@prisma/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const { finalDesignUrl, preparationStatus, nextStep } = useDesignWizard();

  // Cart state
  const { items, subtotal, itemCount, removeItem, updateQuantity } = useCart();

  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/sort state
  const [category, setCategory] = useState<Category>('all');
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  // Product detail view state (null = show catalog, product = show detail)
  const [viewingProduct, setViewingProduct] = useState<ProductWithVariants | null>(null);

  /**
   * Fetch all products on mount
   */
  useEffect(() => {
    async function fetchAllProducts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/products/all');
        if (!response.ok) throw new Error('Failed to fetch products');

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

    if (category !== 'all') {
      result = result.filter((p) => p.category === category);
    }

    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'newest':
        result.reverse();
        break;
      case 'featured':
      default:
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

  const getCategoryCounts = () => {
    return {
      all: products.length,
      apparel: products.filter((p) => p.category === 'apparel').length,
      accessories: products.filter((p) => p.category === 'accessories').length,
      'home-living': products.filter((p) => p.category === 'home-living').length,
    };
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Loading products...</h2>
          <p className="text-lg text-muted-foreground">Finding the perfect products for you</p>
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

  // Show product detail page
  if (viewingProduct) {
    return (
      <ProductDetailPage
        product={viewingProduct}
        designUrl={finalDesignUrl}
        onBack={() => setViewingProduct(null)}
        formatPrice={formatPrice}
        items={items}
        subtotal={subtotal}
        itemCount={itemCount}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        handleCheckout={nextStep}
      />
    );
  }

  // Show product catalog
  return (
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

        {/* Design Preparation Status Indicators */}
        {preparationStatus === 'preparing' && (
          <Alert className="mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Preparing Design for Print</AlertTitle>
            <AlertDescription>
              Your design is being optimized for professional printing. This won't affect adding to cart.
            </AlertDescription>
          </Alert>
        )}

        {preparationStatus === 'completed' && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Design Ready for Print</AlertTitle>
            <AlertDescription className="text-green-700">
              Your design has been optimized for professional printing.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        {/* Left: Product Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCardInline
                key={product.id}
                product={product}
                designUrl={finalDesignUrl}
                onClick={() => setViewingProduct(product)}
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

        {/* Right: Cart Sidebar */}
        <CartSidebar
          items={items}
          subtotal={subtotal}
          itemCount={itemCount}
          removeItem={removeItem}
          updateQuantity={updateQuantity}
          formatPrice={formatPrice}
          handleCheckout={nextStep}
        />
      </div>
    </div>
  );
}

// =============================================================================
// Product Card Component
// =============================================================================

interface ProductCardInlineProps {
  product: ProductWithVariants;
  designUrl: string | null;
  onClick: () => void;
}

function ProductCardInline({ product, designUrl, onClick }: ProductCardInlineProps) {
  const startingPrice =
    product.variants.length > 0 ? Math.min(...product.variants.map((v) => v.price)) : product.basePrice;

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
        return 'bg-muted text-foreground';
    }
  };

  const formatProductType = (type: string) => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg" onClick={onClick}>
      <div className="relative aspect-square bg-muted">
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

      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold line-clamp-2 text-sm min-h-10 group-hover:text-primary">{product.name}</h3>
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
// Cart Sidebar Component
// =============================================================================

interface CartSidebarProps {
  items: any[];
  subtotal: number;
  itemCount: number;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  formatPrice: (cents: number) => string;
  handleCheckout: () => void;
}

function CartSidebar({
  items,
  subtotal,
  itemCount,
  removeItem,
  updateQuantity,
  formatPrice,
  handleCheckout,
}: CartSidebarProps) {
  return (
    <div className="lg:col-span-1">
      <Card className="sticky top-6">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart ({itemCount})
            </h3>
            {itemCount > 0 && <span className="text-sm font-medium text-primary">{formatPrice(subtotal)}</span>}
          </div>

          <Separator />

          {items.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Package className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Your cart is empty</p>
              <p className="text-xs text-muted-foreground">Click products to add them</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.id} className="space-y-3">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
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
                        <span className="text-xs font-medium ml-auto">{formatPrice(item.unitPrice * item.quantity)}</span>
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

          {items.length > 0 && (
            <>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout</p>
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
  );
}

// =============================================================================
// Product Detail Page Component
// =============================================================================

interface ProductDetailPageProps {
  product: ProductWithVariants;
  designUrl: string | null;
  onBack: () => void;
  formatPrice: (cents: number) => string;
  items: any[];
  subtotal: number;
  itemCount: number;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  handleCheckout: () => void;
}

function ProductDetailPage({
  product,
  designUrl,
  onBack,
  formatPrice,
  items,
  subtotal,
  itemCount,
  removeItem,
  updateQuantity,
  handleCheckout,
}: ProductDetailPageProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Initialize with first variant's size and color
  useEffect(() => {
    if (product.variants.length > 0 && !selectedSize && !selectedColor) {
      const firstVariant = product.variants[0];
      setSelectedSize(firstVariant.size);
      setSelectedColor(firstVariant.color);
    }
  }, [product, selectedSize, selectedColor]);

  // Find variant matching both selected size and color
  const selectedVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  ) || product.variants[0];

  // Get unique sizes and colors
  const availableSizes = Array.from(new Set(product.variants.filter((v) => v.size).map((v) => v.size)));
  const availableColors = Array.from(new Set(product.variants.filter((v) => v.color).map((v) => v.color)));

  /**
   * Handle size change - keep color if possible, otherwise pick first available color for this size
   */
  const handleSizeChange = (newSize: string) => {
    setSelectedSize(newSize);

    // Check if current color is available for this size
    const variantWithSizeAndColor = product.variants.find(
      (v) => v.size === newSize && v.color === selectedColor
    );

    // If current color not available for this size, pick first available color
    if (!variantWithSizeAndColor) {
      const firstColorForSize = product.variants.find((v) => v.size === newSize)?.color;
      if (firstColorForSize) {
        setSelectedColor(firstColorForSize);
      }
    }
  };

  /**
   * Handle color change - keep size if possible, otherwise pick first available size for this color
   */
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);

    // Check if current size is available for this color
    const variantWithSizeAndColor = product.variants.find(
      (v) => v.size === selectedSize && v.color === newColor
    );

    // If current size not available for this color, pick first available size
    if (!variantWithSizeAndColor) {
      const firstSizeForColor = product.variants.find((v) => v.color === newColor)?.size;
      if (firstSizeForColor) {
        setSelectedSize(firstSizeForColor);
      }
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="hover:text-primary transition-colors flex items-center gap-1">
          <ChevronRight className="h-4 w-4 rotate-180" />
          Products
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-md">{product.name}</span>
      </div>

      {/* Main Grid: Product Details + Cart */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Product Content (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.description && <p className="mt-2 text-muted-foreground">{product.description}</p>}
          </div>

          {/* Variant Selectors */}
          <div className="space-y-6">
            {/* Size Selection */}
            {availableSizes.length > 1 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Size</p>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map((size) => {
                    const isSelected = size === selectedSize;
                    return (
                      <Button
                        key={size}
                        variant={isSelected ? 'default' : 'outline'}
                        size="default"
                        className="min-w-[60px] h-11"
                        onClick={() => handleSizeChange(size!)}
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
                <p className="text-sm font-semibold uppercase tracking-wide text-foreground/80">Color</p>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map((color) => {
                    const isSelected = color === selectedColor;
                    return (
                      <Button
                        key={color}
                        variant={isSelected ? 'default' : 'outline'}
                        size="default"
                        onClick={() => handleColorChange(color!)}
                      >
                        {color}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mockup Preview with Add to Cart */}
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
              design={getWizardDesignData(useDesignWizard.getState()) || {
                id: 'wizard-design',
                imageUrl: designUrl,
                thumbnailUrl: designUrl,
              }}
            />
          ) : (
            <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
              <Image
                src={selectedVariant?.imageUrl || product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Right: Cart Sidebar (1/3 width) */}
        <CartSidebar
          items={items}
          subtotal={subtotal}
          itemCount={itemCount}
          removeItem={removeItem}
          updateQuantity={updateQuantity}
          formatPrice={formatPrice}
          handleCheckout={handleCheckout}
        />
      </div>
    </div>
  );
}