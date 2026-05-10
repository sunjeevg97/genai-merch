'use client';

/**
 * SideNav Provider Context
 *
 * Manages the collapsed/expanded state of the side navigation.
 * Persists state to localStorage for consistent UX across sessions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SideNavContextType {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

const SideNavContext = createContext<SideNavContextType | undefined>(undefined);

const STORAGE_KEY = 'side-nav-expanded';

// Default: collapsed on mobile, expanded on desktop
function getDefaultExpanded(): boolean {
  if (typeof window === 'undefined') return false;

  // Check localStorage first
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    return stored === 'true';
  }

  // Default based on screen size
  return window.innerWidth >= 1024; // lg breakpoint
}

export function SideNavProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate state from localStorage after mount
  useEffect(() => {
    setIsExpanded(getDefaultExpanded());
    setIsHydrated(true);
  }, []);

  // Persist to localStorage when state changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(STORAGE_KEY, String(isExpanded));
    }
  }, [isExpanded, isHydrated]);

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return (
    <SideNavContext.Provider value={{ isExpanded, toggle, expand, collapse }}>
      {children}
    </SideNavContext.Provider>
  );
}

export function useSideNav() {
  const context = useContext(SideNavContext);
  if (context === undefined) {
    throw new Error('useSideNav must be used within a SideNavProvider');
  }
  return context;
}
