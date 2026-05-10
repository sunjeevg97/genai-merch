'use client';

/**
 * Collapsible Side Navigation
 *
 * A minimalist side navigation that collapses to an icon rail.
 * Features:
 * - Fixed position on left side
 * - Collapsed: 56px icon rail / Expanded: 240px with labels
 * - Persistent state via localStorage
 * - Cart badge with item count
 * - Active state indicators
 * - Offline indicator
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wand2,
  ShoppingBag,
  Images,
  ShoppingCart,
  PanelLeftClose,
  PanelLeftOpen,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSideNav } from './side-nav-provider';
import { useCartItemCount } from '@/lib/cart/store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Navigation Item Configuration
 */
interface NavItem {
  label: string;
  shortLabel: string;
  tooltip: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  comingSoon?: boolean;
}

/**
 * Build navigation items with dynamic data
 */
function useNavItems(): NavItem[] {
  const cartItemCount = useCartItemCount();

  return [
    {
      label: 'Home',
      shortLabel: 'Home',
      tooltip: 'Back to home',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Create Design',
      shortLabel: 'Create',
      tooltip: 'Start a new design',
      href: '/design/create',
      icon: Wand2,
    },
    {
      label: 'Products',
      shortLabel: 'Products',
      tooltip: 'Browse products',
      href: '/products',
      icon: ShoppingBag,
    },
    {
      label: 'My Designs',
      shortLabel: 'Designs',
      tooltip: 'Your creations',
      href: '/designs',
      icon: Images,
      comingSoon: true,
    },
    {
      label: 'Cart',
      shortLabel: 'Cart',
      tooltip: 'View your cart',
      href: '/cart',
      icon: ShoppingCart,
      badge: cartItemCount > 0 ? cartItemCount : undefined,
    },
  ];
}

/**
 * Check if a path is active
 */
function isPathActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname.startsWith(href);
}

/**
 * Navigation Item Component
 */
function NavItemLink({
  item,
  isActive,
  isExpanded,
}: {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
}) {
  const Icon = item.icon;

  const content = (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        'hover:bg-accent hover:text-accent-foreground',
        isActive
          ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:h-6 before:-translate-y-1/2 before:w-1 before:rounded-r-full before:bg-primary'
          : 'text-muted-foreground',
        item.comingSoon && 'opacity-60'
      )}
    >
      <div className="relative flex-shrink-0">
        <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
        {/* Badge */}
        {item.badge && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Coming Soon Badge */}
      {isExpanded && item.comingSoon && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          Soon
        </motion.span>
      )}
    </Link>
  );

  // Wrap in tooltip when collapsed
  if (!isExpanded) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          <p>{item.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}

/**
 * Offline Indicator Component
 */
function OfflineIndicator({ isExpanded }: { isExpanded: boolean }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-600',
        !isExpanded && 'justify-center px-2'
      )}
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      {isExpanded && (
        <span className="text-xs">You&apos;re offline — we&apos;ll save your progress!</span>
      )}
    </div>
  );
}

/**
 * SideNav Component
 */
export function SideNav() {
  const pathname = usePathname();
  const { isExpanded, toggle } = useSideNav();
  const navItems = useNavItems();

  return (
    <TooltipProvider>
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 240 : 56 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-16 z-40 flex h-[calc(100vh-4rem)] flex-col border-r bg-background/95 backdrop-blur-sm',
          'supports-[backdrop-filter]:bg-background/60'
        )}
      >
        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-2 pt-4">
          {navItems.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              isActive={isPathActive(pathname, item.href)}
              isExpanded={isExpanded}
            />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="space-y-2 border-t p-2">
          {/* Offline Indicator */}
          <OfflineIndicator isExpanded={isExpanded} />

          {/* Toggle Button */}
          <button
            onClick={toggle}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              !isExpanded && 'justify-center px-2'
            )}
          >
            {isExpanded ? (
              <>
                <PanelLeftClose className="h-5 w-5" />
                <span>Collapse</span>
              </>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <PanelLeftOpen className="h-5 w-5" />
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  <p>Expand sidebar</p>
                </TooltipContent>
              </Tooltip>
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

/**
 * SideNav Spacer
 *
 * Adds left margin to main content to account for SideNav width.
 * Use this in layouts where SideNav is present.
 */
export function SideNavSpacer({ children }: { children: React.ReactNode }) {
  const { isExpanded } = useSideNav();

  return (
    <motion.div
      initial={false}
      animate={{ marginLeft: isExpanded ? 240 : 56 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}
