/**
 * Style Preset Picker
 *
 * Surfaces style preset choice to the user during the wizard's design-generation
 * step. Shows 3 event-mapped defaults prominently with "See all 12" expansion
 * grouped by bucket (vintage / trending / refined / bold).
 *
 * Tiles are text-only for v1 — no thumbnail images. The preset name +
 * description carry the meaning; bucket-colored borders give visual structure.
 * Stock thumbnails can be added later without changing this component's API.
 */

"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  STYLE_PRESETS,
  getPresetDefaultsForEventType,
  getPresetsByBucket,
  type StylePreset,
  type StylePresetBucket,
} from "@/lib/ai/style-presets";
import type { EventType } from "@/lib/store/design-wizard";

interface StylePresetPickerProps {
  /** Current event type — drives the 3 default suggestions. */
  eventType: EventType | null;
  /** Currently selected preset id, or null when nothing chosen yet. */
  selectedPresetId: string | null;
  /** Fires when the user picks (or re-picks) a preset. */
  onChange: (presetId: string) => void;
}

/**
 * Bucket → Tailwind class mapping for the colored border + badge.
 *
 * Each bucket has a distinct hue so users can read at a glance which family
 * they're picking from when the expanded grid is visible.
 */
const BUCKET_STYLES: Record<
  StylePresetBucket,
  { border: string; badgeBg: string; badgeText: string; label: string }
> = {
  vintage: {
    border: "border-amber-400/50",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900",
    label: "Vintage",
  },
  trending: {
    border: "border-cyan-400/50",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-900",
    label: "Trending",
  },
  refined: {
    border: "border-slate-400/50",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-900",
    label: "Refined",
  },
  bold: {
    border: "border-rose-400/50",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-900",
    label: "Bold",
  },
};

const BUCKET_ORDER: StylePresetBucket[] = [
  "vintage",
  "trending",
  "refined",
  "bold",
];

function PresetTile({
  preset,
  selected,
  onSelect,
}: {
  preset: StylePreset;
  selected: boolean;
  onSelect: () => void;
}) {
  const bucket = BUCKET_STYLES[preset.bucket];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex h-full flex-col rounded-lg border-2 bg-card p-4 text-left",
        "transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary",
        selected
          ? "border-primary ring-2 ring-primary/30 shadow-md"
          : cn(bucket.border, "hover:border-primary/60"),
      )}
    >
      {selected && (
        <span
          aria-hidden="true"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
            bucket.badgeBg,
            bucket.badgeText,
          )}
        >
          {bucket.label}
        </span>
      </div>

      <h4 className="mb-1 text-base font-semibold leading-tight text-foreground">
        {preset.name}
      </h4>
      <p className="text-sm leading-snug text-muted-foreground">
        {preset.description}
      </p>
    </button>
  );
}

export function StylePresetPicker({
  eventType,
  selectedPresetId,
  onChange,
}: StylePresetPickerProps) {
  const [showAll, setShowAll] = useState(false);

  const defaultIds = getPresetDefaultsForEventType(eventType);
  const defaultPresets = defaultIds
    .map((id) => STYLE_PRESETS[id])
    .filter((p): p is StylePreset => !!p);

  const byBucket = getPresetsByBucket();
  const defaultIdSet = new Set(defaultIds);

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-base font-semibold text-foreground">
          Choose a style
        </h3>
        <p className="text-sm text-muted-foreground">
          {eventType
            ? "We picked three styles that tend to land for this kind of project — or browse all 12."
            : "Pick a visual lineage. Each one anchors the design to a specific era and medium rather than the generic AI default."}
        </p>
      </div>

      {/* Default 3 (or 4 for "other") suggestions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {defaultPresets.map((preset) => (
          <PresetTile
            key={preset.id}
            preset={preset}
            selected={selectedPresetId === preset.id}
            onSelect={() => onChange(preset.id)}
          />
        ))}
      </div>

      {/* Toggle for full library */}
      <button
        type="button"
        onClick={() => setShowAll((v) => !v)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        {showAll ? (
          <>
            Hide the full library
            <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            See all 12 styles
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Expanded view — all 12, grouped by bucket */}
      <AnimatePresence initial={false}>
        {showAll && (
          <motion.div
            key="expanded-presets"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-5 border-t pt-5">
              {BUCKET_ORDER.map((bucket) => {
                const presets = byBucket[bucket];
                if (!presets || presets.length === 0) return null;
                const style = BUCKET_STYLES[bucket];
                return (
                  <div key={bucket}>
                    <h4
                      className={cn(
                        "mb-2 text-xs font-semibold uppercase tracking-wider",
                        style.badgeText,
                      )}
                    >
                      {style.label}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {presets.map((preset) => (
                        <PresetTile
                          key={preset.id}
                          preset={preset}
                          selected={selectedPresetId === preset.id}
                          onSelect={() => onChange(preset.id)}
                        />
                      ))}
                    </div>
                    {/* Note when a bucket member is also a default suggestion */}
                    {presets.some((p) => defaultIdSet.has(p.id)) && (
                      <p className="mt-2 text-[11px] text-muted-foreground/80">
                        {presets
                          .filter((p) => defaultIdSet.has(p.id))
                          .map((p) => p.name)
                          .join(", ")}
                        {presets.filter((p) => defaultIdSet.has(p.id))
                          .length === 1
                          ? " is suggested above for this event type."
                          : " are suggested above for this event type."}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
