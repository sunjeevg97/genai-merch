'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './footer';

export function ConditionalFooter() {
  const pathname = usePathname();

  // Only show footer on the landing page
  if (pathname !== '/') {
    return null;
  }

  return <Footer />;
}
