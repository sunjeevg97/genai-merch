/**
 * My Designs Layout
 *
 * Minimal layout wrapper for the My Designs page.
 * Uses root layout's Navbar and ConditionalFooter.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Designs | Regalia',
  description: 'View and manage all your AI-generated designs.',
};

export default function DesignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
