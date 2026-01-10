/**
 * Design Wizard - Main Page
 *
 * Streamlined AI-first design wizard with 5 steps:
 * 1. Event Type Selection
 * 2. Event Details
 * 3. AI Chat Interface (with optional brand assets)
 * 4. Product Selection
 * 5. Checkout
 *
 * Supports direct navigation via ?step=X query parameter.
 */

'use client';

import { Suspense } from 'react';
import { DesignWizard } from '@/components/design/design-wizard';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading component for wizard initialization
 */
function WizardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

/**
 * Design Wizard Page Component
 *
 * Wrapper page that renders the main design wizard.
 * Wrapped in Suspense to support useSearchParams() for direct step navigation.
 */
export default function CreateDesignPage() {
  return (
    <Suspense fallback={<WizardLoading />}>
      <DesignWizard />
    </Suspense>
  );
}
