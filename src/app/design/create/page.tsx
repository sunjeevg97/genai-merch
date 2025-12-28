/**
 * Design Wizard - Main Page
 *
 * AI-first design wizard with 5 steps:
 * 1. Event Type Selection
 * 2. Product Selection
 * 3. Brand Assets Upload (Optional)
 * 4. AI Chat Interface
 * 5. Canvas Editor (Final Tweaks)
 */

'use client';

import { DesignWizard } from '@/components/design/design-wizard';

/**
 * Design Wizard Page Component
 *
 * Wrapper page that renders the main design wizard
 */
export default function CreateDesignPage() {
  return <DesignWizard />;
}
