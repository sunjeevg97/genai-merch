'use client';

/**
 * Authenticated Layout
 *
 * Provides SideNav and content spacing for authenticated users.
 * Only renders SideNav when user is signed in and not on excluded pages.
 */

import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { SideNavProvider } from './side-nav-provider';
import { SideNav, SideNavSpacer } from './side-nav';

/**
 * Pages where SideNav should NOT appear
 */
const EXCLUDED_PATHS = ['/', '/signin', '/signup'];

/**
 * Check if SideNav should be hidden for current path
 */
function shouldHideSideNav(pathname: string): boolean {
  // Exact match for excluded paths
  if (EXCLUDED_PATHS.includes(pathname)) {
    return true;
  }

  // Match auth routes with Clerk's catch-all pattern
  if (pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
    return true;
  }

  return false;
}

/**
 * Main Content Wrapper
 *
 * Handles the conditional rendering of SideNav based on:
 * 1. User authentication state
 * 2. Current pathname (excluded paths)
 *
 * Wraps the main content with appropriate spacing when SideNav is shown.
 */
export function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const hideSideNav = shouldHideSideNav(pathname);

  // While auth is loading, render without SideNav to prevent layout shift
  if (!isLoaded) {
    return <>{children}</>;
  }

  // If on excluded page or not signed in, render without SideNav
  if (hideSideNav || !isSignedIn) {
    return <>{children}</>;
  }

  // Signed in on a protected page - show SideNav with spacing
  return (
    <SideNavProvider>
      <SideNav />
      <SideNavSpacer>{children}</SideNavSpacer>
    </SideNavProvider>
  );
}
