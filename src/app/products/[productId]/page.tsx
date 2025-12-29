/**
 * Product Detail Page
 *
 * Dynamic route for viewing product details and adding to cart.
 */

'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { notFound, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Package, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VariantSelector } from '@/components/products/variant-selector';
import { AddToCartForm } from '@/components/products/add-to-cart-form';
import { DesignPreview, type DesignData } from '@/components/products/design-preview';
import type { ProductVariant } from '@prisma/client';

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

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [design, setDesign] = useState<DesignData | null>(null);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
            <p className="text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  // Get current variant image or product image
  const displayImage = selectedVariant?.imageUrl || product.imageUrl;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link
        href="/products"
        className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Products
      </Link>

      {/* Product Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Product Image */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative aspect-square bg-gray-100">
              {displayImage ? (
                <Image
                  src={displayImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    console.error('Failed to load image:', displayImage);
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <Package className="h-24 w-24" />
                </div>
              )}

              {/* Category Badge */}
              <div className="absolute left-4 top-4">
                <Badge className={getCategoryColor(product.category)}>
                  {formatProductType(product.productType)}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Product Info Card (Mobile Only) */}
          <Card className="lg:hidden">
            <CardContent className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

              {product.description && (
                <p className="mt-2 text-gray-600">{product.description}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Product Details & Add to Cart */}
        <div className="space-y-6">
          {/* Product Info (Desktop Only) */}
          <div className="hidden lg:block">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {product.description && (
              <p className="mt-4 text-lg text-gray-600">{product.description}</p>
            )}

            <Separator className="my-6" />
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
            />
          )}

          <Separator />

          {/* Design Preview/Upload */}
          <DesignPreview
            design={design}
            onRemove={() => setDesign(null)}
            onUpload={() => {
              // TODO: Implement design upload modal
              alert('Design upload coming soon!');
            }}
          />

          <Separator />

          {/* Add to Cart Form */}
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

          {/* Product Details */}
          {product.metadata && (
            <>
              <Separator />

              <div className="space-y-4">
                <h3 className="flex items-center text-lg font-semibold">
                  <Info className="mr-2 h-5 w-5" />
                  Product Details
                </h3>

                <div className="space-y-2 text-sm">
                  {product.metadata.brand && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Brand:</span>
                      <span className="font-medium">{product.metadata.brand}</span>
                    </div>
                  )}

                  {product.metadata.model && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{product.metadata.model}</span>
                    </div>
                  )}

                  {product.metadata.origin_country && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Origin:</span>
                      <span className="font-medium">
                        {product.metadata.origin_country}
                      </span>
                    </div>
                  )}

                  {product.metadata.techniques && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Print Techniques:</span>
                      <span className="font-medium">
                        {product.metadata.techniques.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Additional Info */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This product is made-to-order and printed by our
                fulfillment partner. Shipping times may vary based on your location.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
