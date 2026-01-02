/**
 * Mockup Preview Component
 *
 * Shows product mockup with custom design overlay.
 * Generates mockup via Printful API and handles caching.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, AlertCircle, RefreshCw, Layers, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import type { MockupPlacement, MockupPosition } from '@/lib/printful/mockups';
import { getAvailableTechniques } from '@/lib/printful/mockups';
import { useCart } from '@/lib/cart/store';
import type { ProductVariant } from '@prisma/client';

interface MockupPreviewProps {
  productVariantId: string | null;
  printfulProductId: number;
  designUrl: string | null;
  productImageUrl: string;
  productType: string;
  placement?: MockupPlacement;
  onPlacementChange?: (placement: MockupPlacement) => void;
  // Additional data needed for cart functionality
  product?: {
    id: string;
    name: string;
    imageUrl: string;
    productType: string;
  };
  selectedVariant?: ProductVariant | null;
  design?: {
    id: string;
    imageUrl: string;
    thumbnailUrl?: string;
  } | null;
}

export function MockupPreview({
  productVariantId,
  printfulProductId,
  designUrl,
  productImageUrl,
  productType,
  placement = 'front',
  onPlacementChange,
  product,
  selectedVariant,
  design,
}: MockupPreviewProps) {
  const [selectedTechnique, setSelectedTechnique] = useState<'dtg' | 'dtfilm' | 'embroidery' | 'digital' | undefined>(undefined);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [generatedMockups, setGeneratedMockups] = useState<Array<{
    styleId: number;
    styleName: string;
    placement: string;
    mockupUrl: string;
  }>>([]);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 });

  // Modal state for viewing and adding to cart
  const [selectedMockup, setSelectedMockup] = useState<{
    styleId: number;
    styleName: string;
    placement: string;
    mockupUrl: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Get cart actions
  const { addItem } = useCart();

  // Get available techniques for this product type
  const availableTechniques = getAvailableTechniques(productType);

  /**
   * Convert technical Printful style names to customer-friendly labels
   */
  const getFriendlyStyleLabel = (categoryName: string, viewName: string): string => {
    const category = categoryName.toLowerCase();
    const view = viewName.toLowerCase();

    // Map category names to customer-friendly terms
    const categoryMap: Record<string, string> = {
      'default': 'Product Photo',
      'ghost': 'Flat Lay',
      'placeholder': 'Simple View',
      'lifestyle': 'Lifestyle',
      'model': 'On Model',
      'hanger': 'On Hanger',
    };

    // Map view names to simple descriptions
    const viewMap: Record<string, string> = {
      'front': 'Front',
      'back': 'Back',
      'left': 'Left',
      'right': 'Right',
      'default': 'Standard',
    };

    const friendlyCategory = categoryMap[category] || categoryName;
    const friendlyView = viewMap[view] || viewName;

    return `${friendlyCategory} - ${friendlyView}`;
  };

  /**
   * Convert technical placement names to customer-friendly labels
   */
  const getFriendlyPlacementLabel = (placement: string): string => {
    const placementMap: Record<string, string> = {
      'front': 'Front',
      'back': 'Back',
      'left': 'Left Side',
      'right': 'Right Side',
      'sleeve_left': 'Left Sleeve',
      'sleeve_right': 'Right Sleeve',
      'front_large': 'Front (Large)',
      'back_large': 'Back (Large)',
      'default': 'Standard',
      'label_inside': 'Inside Label',
      'label_outside': 'Outside Label',
      'embroidery_front': 'Embroidered Front',
      'embroidery_back': 'Embroidered Back',
      'embroidery_front_large': 'Embroidered Front (Large)',
      'embroidery_chest_left': 'Left Chest (Embroidered)',
      'embroidery_chest_right': 'Right Chest (Embroidered)',
      'embroidery_left': 'Left Side (Embroidered)',
      'embroidery_right': 'Right Side (Embroidered)',
      'front_dtf_hat': 'Front (DTF Print)',
      'back_dtf_hat': 'Back (DTF Print)',
      'front_dtf': 'Front (DTF Print)',
      'back_dtf': 'Back (DTF Print)',
      'front_large_dtf': 'Front Large (DTF Print)',
      'back_large_dtf': 'Back Large (DTF Print)',
    };

    return placementMap[placement] || placement.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  /**
   * Generate a single mockup for a specific style and placement
   * Returns the mockup URL or null if failed
   */
  const generateSingleMockup = async (
    styleId: number,
    placement: string,
    showToast = true
  ): Promise<string | null> => {
    if (!productVariantId || !designUrl || !selectedTechnique) {
      return null;
    }

    // Build cache key for this specific style + placement + technique
    const cacheKey = `mockup:${productVariantId}:${placement}:style${styleId}:${selectedTechnique}:${designUrl}`;

    // Check client-side cache first
    const cachedUrl = sessionStorage.getItem(cacheKey);
    if (cachedUrl) {
      console.log(`[Mockup Preview] Using cached mockup for style ${styleId} placement ${placement}`);
      return cachedUrl;
    }

    try {
      console.log(`[Mockup Preview] Generating mockup for style ${styleId} placement ${placement}`);

      const response = await fetch('/api/printful/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId,
          designImageUrl: designUrl,
          placement,
          styleId,
          technique: selectedTechnique,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate mockup');
      }

      const data = await response.json();
      console.log(`[Mockup Preview] Mockup generated for style ${styleId} placement ${placement}`);

      // Store in client-side cache
      sessionStorage.setItem(cacheKey, data.mockupUrl);

      if (showToast && !data.cached) {
        toast.success('Mockup generated!', {
          description: 'Your design preview is ready.',
        });
      }

      return data.mockupUrl;
    } catch (err) {
      // Log error but don't show toast for batch generation failures
      // The batch summary will report incompatible combinations
      console.error(`[Mockup Preview] Error generating style ${styleId} placement ${placement}:`, err);
      return null;
    }
  };


  /**
   * Generate all mockup combinations (all styles × all placements) for the selected technique
   */
  const handleBatchGeneration = async () => {
    if (!productVariantId || !designUrl || !selectedTechnique) {
      toast.error('Please ensure variant and design are selected');
      return;
    }

    setBatchGenerating(true);
    setGeneratedMockups([]);
    setGenerationProgress({ current: 0, total: 0 });

    try {
      // Step 1: Fetch all available mockup styles for this product
      console.log('[Batch Generation] Fetching mockup styles for product:', printfulProductId);
      const response = await fetch(
        `/api/printful/mockup-styles?printfulProductId=${printfulProductId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch mockup styles');
      }

      const data = await response.json();
      const styles = data.styles || [];

      console.log('[Batch Generation] Found', styles.length, 'mockup styles');
      console.log('[Batch Generation] Available styles:', styles.map(s => `${s.category_name} - ${s.view_name} (${s.placements.length} placements)`));

      // Step 2: Build list of all combinations (style × placement) for selected technique
      const combinations: Array<{
        styleId: number;
        styleName: string;
        placement: string;
      }> = [];

      for (const style of styles) {
        // Filter placements that match the selected technique
        // Use allowlist approach for better accuracy
        const techniquePlacements = style.placements.filter((p: string) => {
          if (selectedTechnique === 'embroidery') {
            // Only embroidery-specific placements
            return p.startsWith('embroidery_');
          } else if (selectedTechnique === 'dtfilm') {
            // Only DTF/DTFilm placements
            return p.includes('_dtf') || p.includes('_dtfilm');
          } else if (selectedTechnique === 'dtg') {
            // DTG uses standard placements - explicit allowlist
            const dtgPlacements = [
              'front', 'back', 'left', 'right',
              'sleeve_left', 'sleeve_right',
              'front_large', 'back_large',
              'default'
            ];
            return dtgPlacements.includes(p);
          } else if (selectedTechnique === 'digital') {
            // Digital printing typically uses default or standard placements
            return ['default', 'front', 'back'].includes(p);
          }
          return false;
        });

        // Add all combinations for this style
        for (const placement of techniquePlacements) {
          combinations.push({
            styleId: style.id,
            styleName: getFriendlyStyleLabel(style.category_name, style.view_name),
            placement,
          });
        }
      }

      console.log('[Batch Generation] Generated', combinations.length, 'combinations for', selectedTechnique);
      console.log('[Batch Generation] Combinations:', combinations.map(c => `${c.styleName} (${c.placement})`));
      setGenerationProgress({ current: 0, total: combinations.length });

      if (combinations.length === 0) {
        toast.info('No mockup styles available for this technique', {
          description: `This product doesn't support ${selectedTechnique} mockups. Try a different technique.`,
        });
        setBatchGenerating(false);
        return;
      }

      // Step 3: Generate mockups for all combinations
      const results: Array<{
        styleId: number;
        styleName: string;
        placement: string;
        mockupUrl: string;
      }> = [];

      for (let i = 0; i < combinations.length; i++) {
        const combo = combinations[i];

        setGenerationProgress({ current: i + 1, total: combinations.length });

        console.log(`[Batch Generation] Generating ${i + 1}/${combinations.length}:`, combo);

        const mockupUrl = await generateSingleMockup(combo.styleId, combo.placement, false);

        if (mockupUrl) {
          results.push({
            ...combo,
            mockupUrl,
          });
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setGeneratedMockups(results);

      const successCount = results.length;
      const failCount = combinations.length - results.length;

      console.log('[Batch Generation] Complete:', {
        successful: successCount,
        failed: failCount,
        total: combinations.length
      });

      if (failCount > 0) {
        toast.success('Mockup generation complete!', {
          description: `Generated ${successCount} mockups (${failCount} incompatible with this product)`,
        });
      } else {
        toast.success('Mockup generation complete!', {
          description: `Generated ${successCount} mockup variations`,
        });
      }
    } catch (error) {
      console.error('[Batch Generation] Error:', error);
      toast.error('Batch generation failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setBatchGenerating(false);
    }
  };

  /**
   * Reset generated mockups when technique changes
   */
  useEffect(() => {
    if (generatedMockups.length > 0) {
      console.log('[Mockup Preview] Technique changed, clearing generated mockups');
      setGeneratedMockups([]);
      setGenerationProgress({ current: 0, total: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTechnique]);

  /**
   * Handle mockup grid item click - open modal for viewing and adding to cart
   */
  const handleMockupClick = (mockup: typeof generatedMockups[0]) => {
    setSelectedMockup(mockup);
    setQuantity(1); // Reset quantity
    setIsModalOpen(true);
  };

  /**
   * Handle quantity change in modal
   */
  const handleQuantityChange = (newQuantity: number) => {
    const clampedQuantity = Math.max(1, Math.min(10, newQuantity));
    setQuantity(clampedQuantity);
  };

  /**
   * Handle add to cart from modal
   */
  const handleAddToCart = async () => {
    if (!selectedMockup || !product || !selectedVariant || !design) {
      toast.error('Missing required information', {
        description: 'Please ensure product, variant, and design are selected.',
      });
      return;
    }

    if (!selectedVariant.inStock) {
      toast.error('This variant is out of stock', {
        description: 'Please select a different size or color.',
      });
      return;
    }

    setIsAddingToCart(true);

    try {
      // Add item to cart with mockup configuration
      addItem({
        productVariantId: selectedVariant.id,
        product: {
          name: product.name,
          imageUrl: product.imageUrl,
          productType: product.productType,
        },
        variant: {
          name: selectedVariant.name,
          size: selectedVariant.size,
          color: selectedVariant.color,
        },
        design: {
          id: design.id,
          imageUrl: design.imageUrl,
          thumbnailUrl: design.thumbnailUrl,
        },
        // Include mockup-specific configuration
        mockupConfig: {
          mockupUrl: selectedMockup.mockupUrl,
          technique: selectedTechnique!,
          placement: selectedMockup.placement,
          styleId: selectedMockup.styleId,
          styleName: selectedMockup.styleName,
        },
        quantity,
        unitPrice: selectedVariant.price,
      });

      // Show success notification
      toast.success('Added to cart!', {
        description: `${quantity}x ${product.name} with custom mockup`,
        action: {
          label: 'View Cart',
          onClick: () => {
            window.location.href = '/cart';
          },
        },
      });

      // Close modal
      setIsModalOpen(false);
      setSelectedMockup(null);
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart', {
        description: 'Please try again.',
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  /**
   * Format price from cents to dollars
   */
  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Show default product image if no design
  if (!designUrl) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={productImageUrl}
          alt="Product"
          fill
          className="object-cover"
          priority
        />
      </div>
    );
  }

  // Always show technique selector if design present and no technique selected
  if (designUrl && !selectedTechnique) {
    return (
      <div className="space-y-4">
        {/* Technique Selector */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 font-semibold text-gray-900">Select Printing Technique</h3>
            <div className="grid gap-3">
              {availableTechniques.map((tech) => (
                <button
                  key={tech.value}
                  onClick={() => setSelectedTechnique(tech.value)}
                  className="flex flex-col items-start rounded-lg border-2 border-gray-200 p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                >
                  <div className="font-semibold text-gray-900">{tech.label}</div>
                  <div className="text-sm text-gray-600">{tech.description}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Placeholder message */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="mb-4 h-12 w-12 text-blue-500" />
            <h3 className="mb-2 font-semibold text-blue-900">Choose Your Printing Technique</h3>
            <p className="text-sm text-blue-700">
              Select the printing method you'd like, then click "Generate Images" to create mockups for all available styles and sizes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show batch generation interface if design and technique selected
  if (designUrl && selectedTechnique) {
    return (
      <div className="space-y-4">
        {/* Technique Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Printing Technique:</span>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {availableTechniques.find(t => t.value === selectedTechnique)?.label}
          </Badge>
          {!batchGenerating && generatedMockups.length === 0 && (
            <button
              onClick={() => {
                setSelectedTechnique(undefined);
                setGeneratedMockups([]);
              }}
              className="text-sm text-primary hover:underline"
            >
              Change
            </button>
          )}
        </div>

        {/* Batch Generation Button (shown before generation starts) */}
        {!batchGenerating && generatedMockups.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="mb-4 h-12 w-12 text-blue-500" />
              <h3 className="mb-2 font-semibold text-blue-900">Ready to Generate Mockups</h3>
              <p className="mb-6 text-sm text-blue-700">
                Click below to generate mockups for all available styles and placements using {availableTechniques.find(t => t.value === selectedTechnique)?.label}.
              </p>
              <Button onClick={handleBatchGeneration} size="lg">
                Generate Images
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Generation Progress */}
        {batchGenerating && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
              <h3 className="mb-2 font-semibold text-blue-900">Generating Mockups</h3>
              <p className="text-sm text-blue-700">
                {generationProgress.current} of {generationProgress.total} mockups generated
              </p>
              <div className="mt-4 w-full max-w-md">
                <div className="h-2 w-full rounded-full bg-blue-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${(generationProgress.current / generationProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Mockups Grid */}
        {generatedMockups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Generated Mockups ({generatedMockups.length})
              </h3>
              {!batchGenerating && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGeneratedMockups([]);
                    setGenerationProgress({ current: 0, total: 0 });
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              )}
            </div>

            {/* Grid of mockups */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {generatedMockups.map((mockup, index) => (
                <Card
                  key={index}
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow"
                  onClick={() => handleMockupClick(mockup)}
                >
                  <div className="relative aspect-square bg-gray-100">
                    <Image
                      src={mockup.mockupUrl}
                      alt={`${mockup.styleName} - ${mockup.placement}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                    {/* Hover overlay with cart icon hint */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="rounded-full bg-white p-3 shadow-lg">
                          <ShoppingCart className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {mockup.styleName}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getFriendlyPlacementLabel(mockup.placement)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mockup Detail Drawer */}
        <Drawer open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DrawerContent className="max-h-[96vh]">
            <DrawerHeader>
              <DrawerTitle>Mockup Preview</DrawerTitle>
              <DrawerDescription>
                Review this mockup configuration and add to cart
              </DrawerDescription>
            </DrawerHeader>

            {selectedMockup && (
              <div className="overflow-y-auto px-4 pb-4">
                {/* Two-column layout: Image left, Details right */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Left: Large Mockup Image */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={selectedMockup.mockupUrl}
                      alt={`${selectedMockup.styleName} - ${selectedMockup.placement}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>

                  {/* Right: Details and Actions */}
                  <div className="flex flex-col space-y-6">
                    {/* Configuration Details */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900">Configuration</h3>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Style:</span>
                          <p className="font-medium text-gray-900">{selectedMockup.styleName}</p>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Placement:</span>
                          <p className="font-medium text-gray-900">
                            {getFriendlyPlacementLabel(selectedMockup.placement)}
                          </p>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Technique:</span>
                          <p className="font-medium text-gray-900">
                            {availableTechniques.find(t => t.value === selectedTechnique)?.label}
                          </p>
                        </div>

                        {selectedVariant && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Variant:</span>
                            <p className="font-medium text-gray-900">{selectedVariant.name}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price Display */}
                    {selectedVariant && (
                      <div className="rounded-lg bg-gray-50 p-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Price per item</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatPrice(selectedVariant.price)}
                            </p>
                            {quantity > 1 && (
                              <p className="mt-1 text-sm text-gray-600">
                                Total: {formatPrice(selectedVariant.price * quantity)}
                              </p>
                            )}
                          </div>

                          {selectedVariant.inStock ? (
                            <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                          ) : (
                            <Badge variant="destructive">Out of Stock</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">Quantity</label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className="w-20 text-center"
                        />

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= 10}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

                        <span className="text-sm text-gray-600">Max 10</span>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="mt-auto space-y-3">
                      <Button
                        size="lg"
                        className="w-full"
                        disabled={!selectedVariant || !selectedVariant.inStock || isAddingToCart}
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                      </Button>

                      <DrawerClose asChild>
                        <Button variant="outline" size="lg" className="w-full">
                          Cancel
                        </Button>
                      </DrawerClose>
                    </div>

                    {/* Stock Warning */}
                    {selectedVariant && !selectedVariant.inStock && (
                      <p className="text-center text-sm text-red-600">
                        This variant is currently out of stock. Please select a different size or color.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  // Fallback - should never reach here
  return null;
}
