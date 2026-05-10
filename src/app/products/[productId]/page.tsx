/**
 * Product Detail Page
 *
 * Dynamic route for viewing product details and adding to cart.
 */

'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { use } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Package, Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { VariantSelector } from '@/components/products/variant-selector';
import { toTechniqueOptions } from '@/components/products/technique-selector';
import { AddToCartForm } from '@/components/products/add-to-cart-form';
import { DesignPreview, type DesignData } from '@/components/products/design-preview';
import { MockupPreview } from '@/components/products/mockup-preview';
import { FormattedDescription } from '@/components/products/formatted-description';
import { cn } from '@/lib/utils';
import {
  getValidTechniquesForProduct,
  getDefaultTechniqueForProduct,
  type PrintTechnique,
} from '@/lib/printful/technique-mapping';
import type { ProductVariant } from '@prisma/client';
import type { MockupPlacement } from '@/lib/printful/mockups';

interface ProductDetailPageProps {
  params: Promise<{
    productId: string;
  }>;
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
 * Get category badge color (dark theme compatible)
 */
function getCategoryColor(category: string): string {
  switch (category) {
    case 'apparel':
      return 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20';
    case 'accessories':
      return 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20';
    case 'home-living':
      return 'bg-green-500/10 text-green-400 hover:bg-green-500/20';
    default:
      return 'bg-muted text-muted-foreground hover:bg-muted/80';
  }
}

/**
 * Validate if a string is a valid image URL
 */
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<PrintTechnique | null>(null);
  const [design, setDesign] = useState<DesignData | null>(null);
  const [viewMode, setViewMode] = useState<'product' | 'mockup'>('product');
  const [placement, setPlacement] = useState<MockupPlacement>('front');
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const [showStickyCart, setShowStickyCart] = useState(false);

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${resolvedParams.productId}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch product');
        }

        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [resolvedParams.productId]);

  // Load design from query params if provided
  useEffect(() => {
    const designId = searchParams.get('designId');
    const designUrl = searchParams.get('designUrl');

    if (designId && designUrl) {
      setDesign({
        id: designId,
        imageUrl: designUrl,
        thumbnailUrl: designUrl,
      });
    }
  }, [searchParams]);

  // Compute available techniques for this product
  const techniques = useMemo(() => {
    if (!product?.name) return [];
    const validTechniques = getValidTechniquesForProduct(product.name);
    const defaultTechniqueInfo = getDefaultTechniqueForProduct(product.name);
    return toTechniqueOptions(validTechniques, defaultTechniqueInfo.technique);
  }, [product?.name]);

  // Auto-select default technique when product loads
  useEffect(() => {
    if (product?.name && !selectedTechnique) {
      const defaultTechniqueInfo = getDefaultTechniqueForProduct(product.name);
      if (defaultTechniqueInfo) {
        setSelectedTechnique(defaultTechniqueInfo.technique);
      }
    }
  }, [product?.name, selectedTechnique]);

  // Auto-switch to mockup view when design is selected
  useEffect(() => {
    if (design && selectedVariant) {
      setViewMode('mockup');
    }
  }, [design, selectedVariant]);

  // Show sticky cart when scrolled past the main add-to-cart button
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCart(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-100px 0px 0px 0px' }
    );

    if (addToCartRef.current) {
      observer.observe(addToCartRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-muted-foreground/30 border-t-primary"></div>
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  // Get current variant image or product image (validate URLs)
  const variantImage = selectedVariant?.imageUrl;
  const productImage = product.imageUrl;
  const displayImage = (isValidImageUrl(variantImage) ? variantImage : null) ||
                       (isValidImageUrl(productImage) ? productImage : null);

  // Build gallery images from variant colors and product image
  const galleryImages = (() => {
    const images: { src: string; alt: string; type: 'product' | 'variant' }[] = [];

    // Add main product image
    if (isValidImageUrl(product.imageUrl)) {
      images.push({ src: product.imageUrl, alt: product.name, type: 'product' });
    }

    // Add unique variant images (different colors)
    if (product.variants) {
      const seenUrls = new Set([product.imageUrl]);
      product.variants.forEach((variant: ProductVariant) => {
        if (isValidImageUrl(variant.imageUrl) && !seenUrls.has(variant.imageUrl)) {
          seenUrls.add(variant.imageUrl!);
          images.push({
            src: variant.imageUrl!,
            alt: `${product.name} - ${variant.color || variant.name}`,
            type: 'variant',
          });
        }
      });
    }

    return images.slice(0, 6); // Max 6 thumbnails
  })();

  // Get current display image
  const currentImage = galleryImages[selectedImageIndex]?.src || displayImage;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 lg:py-10">
        {/* Back Button */}
        <Link
          href="/products"
          className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Products
        </Link>

        {/* Product Layout - Details LEFT, Image RIGHT */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* LEFT: Product Details & Add to Cart */}
          <div className="order-2 lg:order-1 space-y-8">
            {/* Product Info */}
            <div>
              {/* Category Badge */}
              <Badge className={cn('mb-3', getCategoryColor(product.category))}>
                {formatProductType(product.productType)}
              </Badge>

              <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
                {product.name}
              </h1>

              {product.description && (
                <FormattedDescription
                  description={product.description}
                  className="mt-4"
                />
              )}
            </div>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedSize={selectedSize}
                selectedColor={selectedColor}
                onSizeChange={setSelectedSize}
                onColorChange={setSelectedColor}
                onVariantChange={setSelectedVariant}
                techniques={techniques}
                selectedTechnique={selectedTechnique}
                onTechniqueChange={setSelectedTechnique}
              />
            )}

            {/* Design Preview/Upload */}
            <DesignPreview
              design={design}
              onDesignChange={setDesign}
              onRemove={() => setDesign(null)}
              productId={resolvedParams.productId}
            />

            {/* Add to Cart Form */}
            <div ref={addToCartRef}>
              <AddToCartForm
                product={{
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  productType: product.productType,
                }}
                selectedVariant={selectedVariant}
                design={design}
              />
            </div>

            {/* Product Details - Collapsible Accordion */}
            {product.metadata && (
              <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted">
                  <span className="text-sm font-medium text-foreground">Product Details</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200',
                      isDetailsOpen && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                  <div className="mt-2 rounded-lg border border-border bg-card p-4">
                    <div className="space-y-3 text-sm">
                      {product.metadata.brand && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Brand</span>
                          <span className="font-medium text-foreground">{product.metadata.brand}</span>
                        </div>
                      )}
                      {product.metadata.model && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Model</span>
                          <span className="font-medium text-foreground">{product.metadata.model}</span>
                        </div>
                      )}
                      {product.metadata.origin_country && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Origin</span>
                          <span className="font-medium text-foreground">{product.metadata.origin_country}</span>
                        </div>
                      )}
                      {product.metadata.techniques && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Print Techniques</span>
                          <span className="font-medium text-foreground">
                            {product.metadata.techniques.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Made-to-Order Note - Subtle Muted Banner */}
            <div className="rounded-lg bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Made to order</span> · Printed by our fulfillment partner. Shipping times vary by location.
              </p>
            </div>
          </div>

          {/* RIGHT: Product Image/Mockup */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-6 lg:self-start space-y-4">
            {/* View Mode Toggle */}
            {design && selectedVariant && (
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as 'product' | 'mockup')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="product" className="text-sm">Product View</TabsTrigger>
                  <TabsTrigger value="mockup" className="text-sm">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Mockup Preview
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* Placement Selector (for mockup view with design) */}
            {viewMode === 'mockup' && design && product.productType.includes('shirt') && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Placement:</span>
                <Tabs value={placement} onValueChange={(v) => setPlacement(v as MockupPlacement)}>
                  <TabsList className="h-8">
                    <TabsTrigger value="front" className="text-xs px-3">Front</TabsTrigger>
                    <TabsTrigger value="back" className="text-xs px-3">Back</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            {/* Image Display */}
            {viewMode === 'mockup' && design ? (
              <MockupPreview
                productVariantId={selectedVariant?.id || null}
                printfulProductId={product.printfulId}
                designUrl={design.imageUrl}
                productImageUrl={product.imageUrl}
                productType={product.productType}
                placement={placement}
                onPlacementChange={setPlacement}
                selectedTechnique={selectedTechnique}
                onTechniqueChange={(technique) => setSelectedTechnique(technique as PrintTechnique)}
                product={{
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                  productType: product.productType,
                }}
                selectedVariant={selectedVariant}
                design={design}
              />
            ) : (
              <div className="space-y-3">
                {/* Main Image */}
                <div className="relative aspect-square overflow-hidden rounded-xl bg-card ring-1 ring-border">
                  {currentImage ? (
                    <Image
                      src={currentImage}
                      alt={product.name}
                      fill
                      className="object-cover transition-opacity duration-300"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="h-24 w-24" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {galleryImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={cn(
                          'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg ring-2 transition-all',
                          selectedImageIndex === index
                            ? 'ring-primary ring-offset-2 ring-offset-background'
                            : 'ring-transparent hover:ring-border'
                        )}
                      >
                        <Image
                          src={img.src}
                          alt={img.alt}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Add to Cart Bar */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm transition-transform duration-300',
          showStickyCart && selectedVariant ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Product thumbnail */}
            {currentImage && (
              <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-card">
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground line-clamp-1">{product.name}</p>
              {selectedVariant && (
                <p className="text-lg font-bold text-foreground">
                  ${(selectedVariant.price / 100).toFixed(2)}
                </p>
              )}
            </div>
          </div>
          <Button
            size="lg"
            className="shrink-0 px-8"
            disabled={!selectedVariant || !selectedVariant.inStock}
            onClick={() => {
              // Scroll to add to cart form
              addToCartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
