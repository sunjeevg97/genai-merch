/**
 * Mockup Preview Component
 *
 * Shows product mockup with custom design overlay.
 * Generates mockup via Printful API and handles caching.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { MockupPlacement } from '@/lib/printful/mockups';

interface MockupPreviewProps {
  productVariantId: string | null;
  designUrl: string | null;
  productImageUrl: string;
  productType: string;
  placement?: MockupPlacement;
  onPlacementChange?: (placement: MockupPlacement) => void;
}

export function MockupPreview({
  productVariantId,
  designUrl,
  productImageUrl,
  productType,
  placement = 'front',
  onPlacementChange,
}: MockupPreviewProps) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  // Cache key for client-side caching
  const getCacheKey = () => {
    if (!productVariantId || !designUrl) return null;
    return `mockup:${productVariantId}:${placement}:${designUrl}`;
  };

  /**
   * Generate mockup via Printful API
   */
  const generateMockup = async () => {
    if (!productVariantId || !designUrl) {
      setError('Missing variant or design');
      return;
    }

    // Check client-side cache first
    const cacheKey = getCacheKey();
    if (cacheKey) {
      const cachedUrl = sessionStorage.getItem(cacheKey);
      if (cachedUrl) {
        console.log('[Mockup Preview] Using cached mockup:', cachedUrl);
        setMockupUrl(cachedUrl);
        setCached(true);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[Mockup Preview] Generating mockup:', {
        productVariantId,
        designUrl,
        placement,
      });

      const response = await fetch('/api/printful/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId,
          designImageUrl: designUrl,
          placement,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate mockup');
      }

      const data = await response.json();
      console.log('[Mockup Preview] Mockup generated:', data);

      setMockupUrl(data.mockupUrl);
      setCached(data.cached || false);

      // Cache in sessionStorage
      if (cacheKey && data.mockupUrl) {
        sessionStorage.setItem(cacheKey, data.mockupUrl);
      }

      if (!data.cached) {
        toast.success('Mockup generated!', {
          description: 'Your design preview is ready.',
        });
      }
    } catch (err) {
      console.error('[Mockup Preview] Generation failed:', err);
      const message = err instanceof Error ? err.message : 'Failed to generate mockup';
      setError(message);
      toast.error('Mockup generation failed', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate mockup when design or variant changes
   */
  useEffect(() => {
    if (designUrl && productVariantId) {
      generateMockup();
    } else {
      setMockupUrl(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productVariantId, designUrl, placement]);

  /**
   * Retry mockup generation
   */
  const handleRetry = () => {
    // Clear cache and regenerate
    const cacheKey = getCacheKey();
    if (cacheKey) {
      sessionStorage.removeItem(cacheKey);
    }
    generateMockup();
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

  // Show error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 font-semibold text-red-900">Mockup Generation Failed</h3>
          <p className="mb-4 text-sm text-red-700">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading || !mockupUrl) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-500" />
          <h3 className="mb-2 font-semibold text-blue-900">Generating Preview</h3>
          <p className="text-sm text-blue-700">
            Creating a realistic mockup with your design...
          </p>
          <p className="mt-2 text-xs text-blue-600">This may take 5-10 seconds</p>
        </CardContent>
      </Card>
    );
  }

  // Show mockup
  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        <Image
          src={mockupUrl}
          alt="Product mockup with design"
          fill
          className="object-cover"
          priority
        />

        {/* Cached Badge */}
        {cached && (
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Cached
            </Badge>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleRetry}
        disabled={loading}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Regenerate Mockup
      </Button>
    </div>
  );
}
