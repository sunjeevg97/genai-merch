/**
 * Middleware for Route Protection with Clerk
 *
 * Protects authenticated routes using Clerk authentication
 * Redirects unauthenticated users to signin page
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define protected routes using route matcher
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/design(.*)',
  '/orders(.*)',
  '/groups(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      // Redirect to signin if not authenticated
      const signInUrl = new URL('/signin', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
