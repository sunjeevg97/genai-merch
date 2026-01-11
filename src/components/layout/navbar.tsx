"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - conditional link based on auth state and current page */}
          {/* Always clickable on auth pages, otherwise only when signed out */}
          {pathname === '/signin' || pathname === '/signup' ? (
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Regalia</span>
            </Link>
          ) : (
            <>
              <SignedOut>
                <Link href="/" className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">Regalia</span>
                </Link>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold">Regalia</span>
                </div>
              </SignedIn>
            </>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <SignedOut>
              <Button variant="ghost" asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button variant="ghost" asChild>
                <Link href="/design/create">Create Design</Link>
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10"
                  }
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 space-y-2">
              <SignedOut>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/design/create">Create Design</Link>
                </Button>
                <div className="flex items-center justify-center pt-2">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10"
                      }
                    }}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
