/**
 * Dashboard Layout
 *
 * Minimal layout wrapper for the dashboard page.
 * Uses root layout's Navbar and ConditionalFooter.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Regalia',
  description: 'Your creative hub. Design amazing merchandise, explore products, and manage your creations.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
