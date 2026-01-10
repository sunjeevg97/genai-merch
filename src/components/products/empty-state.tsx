/**
 * Product Catalog Empty State
 *
 * Shown when no products are found in the catalog.
 */

'use client';

import { useState } from 'react';
import { PackageOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

export function EmptyState() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);

    try {
      const response = await fetch('/api/printful/sync-catalog', {
        method: 'GET',
        headers: {
          'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || 'dev_secret_12345_replace_in_production',
        },
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();

      toast.success('Product sync completed!', {
        description: `Synced ${result.products_synced} products with ${result.variants_synced} variants.`,
      });

      // Reload page to show products
      window.location.reload();
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync products', {
        description: 'Please try again or contact support.',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>No Products Found</CardTitle>
          <CardDescription>
            The product catalog is empty. Sync products from Printful to get
            started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSync} disabled={syncing} size="lg">
            {syncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing Products...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Products Now
              </>
            )}
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            This will fetch products from Printful and may take a few minutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
