/**
 * Design Studio Layout
 *
 * Layout wrapper for design creation pages
 * Provides consistent structure and can include:
 * - Design-specific navigation
 * - Auto-save indicators
 * - Exit confirmations
 */

import { ReactNode } from 'react';

interface DesignLayoutProps {
  children: ReactNode;
}

export default function DesignLayout({ children }: DesignLayoutProps) {
  return (
    <div className="design-layout">
      {/* Design-specific header/navigation can go here */}
      <main>{children}</main>
    </div>
  );
}
