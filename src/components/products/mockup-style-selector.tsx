/**
 * Mockup Style Selector Component
 *
 * Displays available mockup styles and allows user to select one.
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Layers, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MockupStyle } from '@/lib/printful/mockups';

interface MockupStyleSelectorProps {
  printfulProductId: number;
  onStyleSelect: (styleId: number, viewName: string, placements: string[]) => void;
  selectedStyleId?: number;
  placement?: string;
  generatedStyles?: Set<number>;
  backgroundGenerating?: boolean;
}

/**
 * Convert technical Printful style names to user-friendly labels
 */
function getFriendlyStyleLabel(categoryName: string, viewName: string): {
  category: string;
  view: string;
  description: string;
} {
  const category = categoryName.toLowerCase();
  const view = viewName.toLowerCase();

  // Map common category names
  const categoryMap: Record<string, string> = {
    'default': 'Product Photo',
    'ghost': 'Flat Lay',
    'placeholder': 'Simple',
    'lifestyle': 'Lifestyle',
    'model': 'On Model',
    'hanger': 'On Hanger',
  };

  // Map common view names with descriptions
  const viewDescriptions: Record<string, { label: string; description: string }> = {
    'front': { label: 'Front View', description: 'Front-facing product shot' },
    'back': { label: 'Back View', description: 'Back-facing product shot' },
    'left': { label: 'Left Side', description: 'Left side angle' },
    'right': { label: 'Right Side', description: 'Right side angle' },
    'handle on right': { label: 'Handle Right', description: 'Mug with handle on right' },
    'handle on left': { label: 'Handle Left', description: 'Mug with handle on left' },
    'default': { label: 'Standard', description: 'Classic product view' },
  };

  // Try to find a match
  const friendlyCategory = categoryMap[category] || categoryName;
  const viewMatch = viewDescriptions[view] || {
    label: viewName,
    description: `${friendlyCategory} view`
  };

  return {
    category: friendlyCategory,
    view: viewMatch.label,
    description: viewMatch.description,
  };
}

export function MockupStyleSelector({
  printfulProductId,
  onStyleSelect,
  selectedStyleId,
  placement,
  generatedStyles = new Set(),
  backgroundGenerating = false,
}: MockupStyleSelectorProps) {
  const [styles, setStyles] = useState<MockupStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyles = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build URL - DON'T filter by placement
        // We want to show ALL available mockup styles for the product
        // The placement filtering happens during mockup generation, not style selection
        const url = `/api/printful/mockup-styles?printfulProductId=${printfulProductId}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch mockup styles');
        }

        const data = await response.json();
        setStyles(data.styles || []);

        // Do NOT auto-select - user must choose
      } catch (err) {
        console.error('[Mockup Style Selector] Error:', err);
        const message = err instanceof Error ? err.message : 'Failed to fetch mockup styles';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, [printfulProductId]); // Removed placement from dependencies since we're not filtering by it

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" />
            Mockup Style
          </CardTitle>
          <CardDescription>Choose a presentation style before we generate your mockup</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-sm text-gray-600">Loading styles...</span>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-red-900">
            <AlertCircle className="h-5 w-5" />
            Failed to Load Styles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (styles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" />
            Mockup Style
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">No mockup styles available for this product.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="h-5 w-5" />
          Mockup Style
        </CardTitle>
        <CardDescription>Choose a presentation style before we generate your mockup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {styles.map((style) => {
            const isGenerated = generatedStyles.has(style.id);
            const isGenerating = backgroundGenerating && !isGenerated && selectedStyleId !== style.id;
            const friendly = getFriendlyStyleLabel(style.category_name, style.view_name);

            return (
              <Button
                key={style.id}
                type="button"
                variant={selectedStyleId === style.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onStyleSelect(style.id, style.view_name, style.placements)}
                className={cn(
                  'h-auto flex-col items-start justify-start p-4 text-left relative hover:shadow-md transition-all',
                  selectedStyleId === style.id && 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                )}
              >
                {/* Status indicator badge */}
                {isGenerated && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                )}
                {isGenerating && (
                  <div className="absolute top-2 right-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}

                {/* Icon placeholder */}
                <div className="w-full flex items-center justify-center mb-2">
                  <Layers className={cn(
                    "h-8 w-8",
                    selectedStyleId === style.id ? "text-primary-foreground" : "text-gray-400"
                  )} />
                </div>

                {/* Labels */}
                <div className="w-full space-y-1">
                  <div className="font-semibold text-sm">
                    {friendly.view}
                  </div>
                  <div className={cn(
                    "text-xs opacity-75",
                    selectedStyleId === style.id ? "text-primary-foreground" : "text-gray-600"
                  )}>
                    {friendly.category}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {selectedStyleId
              ? 'Switch between styles instantly'
              : 'Select a style to begin generating your mockup'}
          </p>
          {backgroundGenerating && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Generating previews...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
