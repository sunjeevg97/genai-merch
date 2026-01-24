/**
 * Dark Mode Theme Preview Page
 *
 * Showcases all 4 dark mode color palette options with live UI examples
 * and modern typography pairings
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ShoppingCart, Heart, Check, Type } from 'lucide-react';
import { Inter, Space_Grotesk, DM_Sans, Manrope, Archivo } from 'next/font/google';

// Font configurations
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });
const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo' });

// Define all 4 color palettes
const palettes = {
  slate: {
    name: 'Slate Minimalist',
    description: 'Linear-inspired • Refined & Professional',
    colors: {
      bg: { base: '#0D0E12', elevated: '#16171D', subtle: '#1E1F26' },
      text: { primary: '#E6E7EB', secondary: '#9B9CA4', muted: '#6B6C75' },
      accent: { primary: '#8B7FF4', hover: '#A396F7', muted: '#5B4FC9' },
      border: { default: '#2A2B33', focus: '#8B7FF4' },
      status: { success: '#4ADE80', error: '#F87171', warning: '#FBBF24' },
    },
  },
  neon: {
    name: 'Neon Gradient',
    description: 'Midjourney-inspired • Bold & Creative',
    colors: {
      bg: { base: '#0A0A0F', elevated: '#13131A', subtle: '#1C1C26' },
      text: { primary: '#F0F0F5', secondary: '#B5B5C8', muted: '#7A7A8E' },
      accent: { primary: '#6366F1', hover: '#818CF8', muted: '#4F46E5' },
      border: { default: '#2D2D3D', focus: '#6366F1' },
      status: { success: '#10B981', error: '#EF4444', warning: '#F59E0B' },
    },
  },
  warm: {
    name: 'Warm Cedar',
    description: 'Notion-inspired • Comfortable & Organic',
    colors: {
      bg: { base: '#1A1614', elevated: '#242220', subtle: '#2E2C29' },
      text: { primary: '#FFF8F0', secondary: '#C9C3BC', muted: '#8A8379' },
      accent: { primary: '#F97316', hover: '#FB923C', muted: '#EA580C' },
      border: { default: '#3A3731', focus: '#F97316' },
      status: { success: '#22C55E', error: '#DC2626', warning: '#EAB308' },
    },
  },
  cyber: {
    name: 'Cyber Blue',
    description: 'Vercel/Cursor-inspired • Technical & Precise',
    colors: {
      bg: { base: '#000000', elevated: '#0A0A0A', subtle: '#141414' },
      text: { primary: '#EDEDED', secondary: '#A1A1AA', muted: '#71717A' },
      accent: { primary: '#06B6D4', hover: '#22D3EE', muted: '#0891B2' },
      border: { default: '#27272A', focus: '#06B6D4' },
      status: { success: '#14B8A6', error: '#EF4444', warning: '#F59E0B' },
    },
  },
};

type PaletteKey = keyof typeof palettes;

// Typography pairings
const typographyPairings = {
  geist: {
    name: 'Modern Precision',
    description: 'Technical & clean • Vercel-inspired',
    display: 'Geist',
    body: 'Geist',
    mono: 'Geist Mono',
    fontClass: '', // Default fonts (already loaded in layout.tsx)
    displayClass: '',
    bodyClass: '',
    vibe: 'Technical, precise, minimalist',
  },
  inter: {
    name: 'Industry Standard',
    description: 'Professional & trustworthy • GitHub-inspired',
    display: 'Inter',
    body: 'Inter',
    mono: 'JetBrains Mono',
    fontClass: inter.className,
    displayClass: inter.className,
    bodyClass: inter.className,
    vibe: 'Professional, neutral, reliable',
  },
  geometric: {
    name: 'Geometric Contrast',
    description: 'Bold headings & friendly body • Startup-inspired',
    display: 'Space Grotesk',
    body: 'DM Sans',
    mono: 'Fira Code',
    fontClass: '', // Will use different classes for display vs body
    displayClass: spaceGrotesk.className,
    bodyClass: dmSans.className,
    vibe: 'Bold, distinctive, playful',
  },
  humanist: {
    name: 'Soft Humanist',
    description: 'Accessible & friendly • Product-focused',
    display: 'Manrope',
    body: 'Manrope',
    mono: 'Geist Mono',
    fontClass: manrope.className,
    displayClass: manrope.className,
    bodyClass: manrope.className,
    vibe: 'Soft, approachable, warm',
  },
  editorial: {
    name: 'Editorial Mix',
    description: 'Versatile & clean • Content-focused',
    display: 'Archivo',
    body: 'Inter',
    mono: 'Geist Mono',
    fontClass: '', // Will use different classes for display vs body
    displayClass: archivo.className,
    bodyClass: inter.className,
    vibe: 'Versatile, editorial, balanced',
  },
};

type TypographyKey = keyof typeof typographyPairings;

function PalettePreview({ paletteKey }: { paletteKey: PaletteKey }) {
  const palette = palettes[paletteKey];
  const { colors } = palette;

  return (
    <div
      className="rounded-xl overflow-hidden border-2 transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: colors.bg.base,
        borderColor: colors.border.default,
      }}
    >
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{
          backgroundColor: colors.bg.elevated,
          borderColor: colors.border.default,
        }}
      >
        <h3
          className="text-2xl font-bold mb-1"
          style={{ color: colors.text.primary }}
        >
          {palette.name}
        </h3>
        <p
          className="text-sm"
          style={{ color: colors.text.secondary }}
        >
          {palette.description}
        </p>
      </div>

      {/* Color Swatches */}
      <div className="p-6 space-y-4">
        <div>
          <p
            className="text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: colors.text.muted }}
          >
            Background
          </p>
          <div className="flex gap-2">
            <ColorSwatch color={colors.bg.base} label="Base" />
            <ColorSwatch color={colors.bg.elevated} label="Elevated" />
            <ColorSwatch color={colors.bg.subtle} label="Subtle" />
          </div>
        </div>

        <div>
          <p
            className="text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: colors.text.muted }}
          >
            Accent
          </p>
          <div className="flex gap-2">
            <ColorSwatch color={colors.accent.primary} label="Primary" />
            <ColorSwatch color={colors.accent.hover} label="Hover" />
            <ColorSwatch color={colors.accent.muted} label="Muted" />
          </div>
        </div>

        <div>
          <p
            className="text-xs font-semibold mb-2 uppercase tracking-wide"
            style={{ color: colors.text.muted }}
          >
            Status
          </p>
          <div className="flex gap-2">
            <ColorSwatch color={colors.status.success} label="Success" />
            <ColorSwatch color={colors.status.error} label="Error" />
            <ColorSwatch color={colors.status.warning} label="Warning" />
          </div>
        </div>
      </div>

      {/* UI Components Preview */}
      <div
        className="p-6 border-t space-y-4"
        style={{ borderColor: colors.border.default }}
      >
        <p
          className="text-xs font-semibold mb-4 uppercase tracking-wide"
          style={{ color: colors.text.muted }}
        >
          UI Components
        </p>

        {/* Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            className="px-4 py-2 rounded-md font-medium text-sm transition-colors"
            style={{
              backgroundColor: colors.accent.primary,
              color: colors.bg.base,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent.primary;
            }}
          >
            Primary Button
          </button>

          <button
            className="px-4 py-2 rounded-md font-medium text-sm transition-colors border"
            style={{
              backgroundColor: 'transparent',
              color: colors.text.primary,
              borderColor: colors.border.default,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.subtle;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Secondary
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Search products..."
          className="w-full px-3 py-2 rounded-md text-sm border transition-colors"
          style={{
            backgroundColor: colors.bg.subtle,
            color: colors.text.primary,
            borderColor: colors.border.default,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.accent.primary;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.border.default;
          }}
        />

        {/* Card */}
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: colors.bg.elevated,
            borderColor: colors.border.default,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: colors.accent.primary }}
            >
              <Sparkles className="w-5 h-5" style={{ color: colors.bg.base }} />
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: colors.text.primary }}
              >
                AI-Generated Design
              </p>
              <p
                className="text-xs"
                style={{ color: colors.text.secondary }}
              >
                Created just for you
              </p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: colors.status.success + '20',
              color: colors.status.success,
            }}
          >
            In Stock
          </span>
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: colors.accent.primary + '20',
              color: colors.accent.primary,
            }}
          >
            Featured
          </span>
          <span
            className="px-2 py-1 rounded text-xs font-medium"
            style={{
              backgroundColor: colors.status.warning + '20',
              color: colors.status.warning,
            }}
          >
            Limited
          </span>
        </div>

        {/* Text Hierarchy */}
        <div className="space-y-1 pt-2">
          <p
            className="text-base font-semibold"
            style={{ color: colors.text.primary }}
          >
            Primary Text
          </p>
          <p
            className="text-sm"
            style={{ color: colors.text.secondary }}
          >
            Secondary descriptive text for additional context
          </p>
          <p
            className="text-xs"
            style={{ color: colors.text.muted }}
          >
            Muted text for metadata and timestamps
          </p>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex-1">
      <div
        className="w-full h-12 rounded-md border border-white/10 mb-1"
        style={{ backgroundColor: color }}
      />
      <p className="text-[10px] text-center text-gray-400 font-mono">
        {label}
      </p>
      <p className="text-[9px] text-center text-gray-500 font-mono">
        {color.toUpperCase()}
      </p>
    </div>
  );
}

function TypographyPreview({ typographyKey }: { typographyKey: TypographyKey }) {
  const typography = typographyPairings[typographyKey];
  const displayFont = typography.displayClass || typography.fontClass || '';
  const bodyFont = typography.bodyClass || typography.fontClass || '';

  return (
    <div className="rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 transition-all hover:scale-[1.02]">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {typography.name}
            </h3>
            <p className="text-sm text-gray-400">
              {typography.description}
            </p>
          </div>
          <Type className="w-6 h-6 text-cyan-400" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-zinc-800 text-gray-300">
            Display: {typography.display}
          </span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-gray-300">
            Body: {typography.body}
          </span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-gray-300 font-mono">
            Mono: {typography.mono}
          </span>
        </div>
      </div>

      {/* Typography Scale */}
      <div className="p-6 space-y-6">
        <div>
          <p className="text-xs font-semibold mb-4 uppercase tracking-wide text-gray-500">
            Typography Scale
          </p>

          {/* Display Large */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Display Large (64px)</p>
            <h1 className={`text-6xl font-bold tracking-tight text-white ${displayFont}`} style={{ letterSpacing: '-0.02em', lineHeight: '1.1' }}>
              The future of design
            </h1>
          </div>

          {/* Display */}
          <div className="mb-4">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Display (48px)</p>
            <h2 className={`text-5xl font-bold tracking-tight text-white ${displayFont}`} style={{ letterSpacing: '-0.01em', lineHeight: '1.15' }}>
              Create without limits
            </h2>
          </div>

          {/* Heading 1 */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Heading 1 (36px)</p>
            <h3 className={`text-4xl font-bold text-white ${displayFont}`} style={{ letterSpacing: '-0.01em', lineHeight: '1.2' }}>
              AI-Powered Merchandise
            </h3>
          </div>

          {/* Heading 2 */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Heading 2 (30px)</p>
            <h4 className={`text-3xl font-semibold text-white ${displayFont}`} style={{ letterSpacing: '-0.005em', lineHeight: '1.25' }}>
              Custom designs for teams
            </h4>
          </div>

          {/* Heading 3 */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Heading 3 (24px)</p>
            <h5 className={`text-2xl font-semibold text-white ${displayFont}`} style={{ lineHeight: '1.3' }}>
              Product Showcase
            </h5>
          </div>

          {/* Body Large */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Body Large (18px)</p>
            <p className={`text-lg text-gray-300 ${bodyFont}`} style={{ lineHeight: '1.6' }}>
              Transform your ideas into stunning custom apparel with AI-powered design generation.
            </p>
          </div>

          {/* Body Regular */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Body (16px)</p>
            <p className={`text-base text-gray-300 ${bodyFont}`} style={{ lineHeight: '1.6' }}>
              Generate unique designs for t-shirts, hoodies, and more. Perfect for teams, events, and organizations seeking professional merchandise solutions.
            </p>
          </div>

          {/* Body Small */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Body Small (14px)</p>
            <p className={`text-sm text-gray-400 ${bodyFont}`} style={{ lineHeight: '1.5' }}>
              Supporting text for additional context and detailed information. Ideal for descriptions, metadata, and supplementary content.
            </p>
          </div>

          {/* Caption */}
          <div className="mb-3">
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Caption (12px)</p>
            <p className={`text-xs text-gray-500 ${bodyFont}`} style={{ lineHeight: '1.4', letterSpacing: '0.01em' }}>
              Caption text for image labels, timestamps, and fine print
            </p>
          </div>

          {/* Overline */}
          <div>
            <p className="text-[10px] text-gray-500 mb-1 font-mono">Overline (12px)</p>
            <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${bodyFont}`} style={{ lineHeight: '1.2', letterSpacing: '0.08em' }}>
              Category Label
            </p>
          </div>
        </div>

        {/* Code Sample */}
        <div className="border-t border-zinc-800 pt-6">
          <p className="text-xs font-semibold mb-3 uppercase tracking-wide text-gray-500">
            Code Sample
          </p>
          <div className="bg-zinc-900 rounded-lg p-4 font-mono text-sm text-gray-300 border border-zinc-800">
            <code>
              <span className="text-purple-400">const</span> <span className="text-cyan-400">generateDesign</span> = <span className="text-yellow-400">async</span> () =&gt; &#123;<br />
              &nbsp;&nbsp;<span className="text-purple-400">const</span> result = <span className="text-purple-400">await</span> <span className="text-cyan-400">openai</span>.<span className="text-cyan-400">images</span>.<span className="text-cyan-400">generate</span>();<br />
              &nbsp;&nbsp;<span className="text-purple-400">return</span> result;<br />
              &#125;;
            </code>
          </div>
        </div>

        {/* Vibe */}
        <div className="border-t border-zinc-800 pt-6">
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide text-gray-500">
            Character
          </p>
          <p className="text-sm text-gray-400 italic">
            {typography.vibe}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ThemePreviewPage() {
  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-white">
            Theme & Typography Preview
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Explore color palettes and typography options side-by-side. Each includes live examples
            to help you visualize the complete design system.
          </p>
        </div>

        {/* Color Palettes Section */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Color Palettes
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Four distinct dark mode themes with live UI component examples
            </p>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PalettePreview paletteKey="slate" />
            <PalettePreview paletteKey="neon" />
            <PalettePreview paletteKey="warm" />
            <PalettePreview paletteKey="cyber" />
          </div>
        </div>

        {/* Typography Section */}
        <div className="mt-20 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              Typography Options
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Five modern font pairings showcasing complete typography scales
            </p>
          </div>

          {/* Typography Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TypographyPreview typographyKey="geist" />
            <TypographyPreview typographyKey="inter" />
            <TypographyPreview typographyKey="geometric" />
            <TypographyPreview typographyKey="humanist" />
            <TypographyPreview typographyKey="editorial" />
          </div>
        </div>

        {/* Recommendation */}
        <div className="mt-12 p-6 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
          <p className="text-gray-400 text-sm">
            <span className="font-semibold text-white">Tip:</span> Hover over cards to see scale effects.
            All options are optimized for legibility and modern web applications.
          </p>
        </div>
      </div>
    </div>
  );
}
