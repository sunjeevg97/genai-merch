/**
 * Design Wizard - Main Page
 *
 * Streamlined AI-first design wizard with 4 steps:
 * 1. Event Type Selection
 * 2. Event Details
 * 3. AI Chat Interface (with optional brand assets)
 * 4. Product Selection & Checkout
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
