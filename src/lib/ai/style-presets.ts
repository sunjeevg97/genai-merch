/**
 * Style Preset Library
 *
 * Twelve curated visual style presets that anchor image generation to specific
 * eras, mediums, and lineages — replacing the "platonic average of all merch
 * designs" output that comes from unscoped prompts.
 *
 * Each preset carries:
 *   - promptFragment: the lineage-anchoring language injected into the STYLE
 *     section of the assembled prompt
 *   - specificNegatives: per-preset exclusions appended to UNIVERSAL_NEGATIVES
 *   - paletteStrategy: how to reconcile preset palette vs user brand colors
 *
 * The fragments themselves are intentionally TODO-tagged until the user
 * supplies the final language. Replacing a single `promptFragment` string
 * does not require touching consuming code anywhere else.
 */

import type { EventType } from "@/lib/store/design-wizard";

export type StylePresetBucket = "vintage" | "trending" | "refined" | "bold";

/**
 * Palette resolution strategy
 *
 * - "fixed": the preset's palette is non-negotiable (e.g., Sailor Jerry tattoo
 *   flash uses red/black/yellow/green — brand colors get demoted to accents)
 * - "brand-driven": the preset is palette-agnostic; user brand colors lead
 * - "preset-led": the preset suggests a palette but defers to brand colors
 *   when present (default for most apparel-friendly styles)
 */
export type PaletteStrategy = "fixed" | "brand-driven" | "preset-led";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  bucket: StylePresetBucket;
  /** Lineage-anchoring style language. Replace TODO placeholders. */
  promptFragment: string;
  /** Per-preset negatives appended to UNIVERSAL_NEGATIVES. May be "". */
  specificNegatives: string;
  paletteStrategy: PaletteStrategy;
  /** Optional palette description used by composePaletteGuidance(). */
  paletteHints?: string;
}

/**
 * The Twelve.
 *
 * Bucket distribution: 3 vintage, 3 trending, 4 refined, 2 bold.
 * IDs are stable — they get stored on Design.presetId for analytics, so
 * renaming an id constitutes a breaking change.
 */
export const STYLE_PRESETS: Record<string, StylePreset> = {
  // ===== VINTAGE-LEANING =====
  vintage_athletic: {
    id: "vintage_athletic",
    name: "Vintage Collegiate",
    description:
      "1970s university athletic department — chenille letters, varsity crests, weathered ink.",
    bucket: "vintage",
    promptFragment:
      "1970s collegiate athletic department print, varsity letterforms with subtle serif details and slight ink bleed, faded ink colors as if washed many times in a college dorm, 2 to 3 color limited palette built around cream, navy, burnt orange, or forest green, hand-drawn mascot or emblem with confident bold lines and slight imperfection, visible screen-printed texture with subtle ink registration offset, no smooth gradients, evoking authentic 1973 university athletics merchandise rather than a contemporary throwback..",
    specificNegatives:
      "clean digital vector, perfectly smooth edges, modern flat illustration, neon colors",
    paletteStrategy: "preset-led",
    paletteHints:
      "two-color school palette (primary + secondary), often on heather or cream substrate",
  },
  skate_90s: {
    id: "skate_90s",
    name: "90s Skate",
    description:
      "Powell Peralta / World Industries era — irreverent characters, halftones, hand-drawn type.",
    bucket: "vintage",
    promptFragment:
      "Late 1990s skateboard graphic in the lineage of Powell Peralta, World Industries, and early Toy Machine, bold uneven black outline with confident hand-drawn character, halftone dot shading instead of smooth fills, 3-color limited palette, slightly distressed and weathered as if pulled from a worn deck, irreverent composition with character or creature as focal subject, visible screen-printed texture, evoking a 1996 skateboard deck graphic or skate-brand band tee crossover.",
    specificNegatives:
      "clean vector lines, smooth gradient shading, polished mascot proportions, corporate illustration",
    paletteStrategy: "preset-led",
    paletteHints:
      "limited 90s-print palette: black + 1-2 bright colors, off-register overprint",
  },
  tattoo_traditional: {
    id: "tattoo_traditional",
    name: "American Traditional",
    description:
      "Sailor Jerry tattoo flash — bold outlines, classic motifs (eagles, hearts, daggers, roses), no shading subtlety.",
    bucket: "vintage",
    promptFragment:
      "American traditional tattoo flash in the lineage of Sailor Jerry and Ed Hardy's early work, bold even-weight black outlines with confident hand-drawn quality, limited palette of brick red, mustard yellow, forest green, and black on cream parchment background, classic motifs available (eagles, roses, anchors, snakes, daggers, swallows, hearts, banners), banner scrolls with space for text where appropriate, no shading gradients — flat color fills only, evoking an authentic 1950s tattoo parlor flash sheet.",
    specificNegatives:
      "realistic shading, soft gradients, fine-line modern tattoo style, color blending, photorealistic",
    paletteStrategy: "fixed",
    paletteHints:
      "Sailor Jerry canonical palette: red, black, yellow, dark green — no other hues",
  },

  // ===== CURRENTLY-TRENDING =====
  y2k_chrome: {
    id: "y2k_chrome",
    name: "Y2K Chrome",
    description:
      "2002 mall graphics — liquid metal type, holographic surfaces, lens flares, butterfly motifs.",
    bucket: "trending",
    promptFragment:
      "Early 2000s Y2K chrome aesthetic, liquid metal type and forms with reflective surface highlights, frosted chrome material with rainbow refraction at the edges, bubble shapes, butterfly and star ornaments, lens flare and sparkle accents, magenta-to-cyan gradient backgrounds where appropriate, evoking 2002 mall graphics, frosted Motorola Razr-era design, and the visual language of Y2K club flyers.",
    specificNegatives:
      "matte finish, vintage texture, hand-drawn quality, muted palette, screen-printed grain",
    paletteStrategy: "preset-led",
    paletteHints:
      "chrome silver + iridescent gradient highlights (cyan/magenta), single accent color",
  },
  acid_rave: {
    id: "acid_rave",
    name: "Acid Rave",
    description:
      "Warped 90s-2010s rave flyer — distorted type, scan-line noise, smiley acid motif, neon over black.",
    bucket: "trending",
    promptFragment:
      "1990s through 2010s acid rave flyer aesthetic, distorted melting type that warps and stretches, smiley faces with x-eyes, neon green / hot pink / cyan / yellow palette on black or deep purple background, warped checkerboard or grid backgrounds, evoking late-night warehouse party flyers and the PC Music / hyperpop era graphics, intentionally chaotic but compositionally controlled with a clear focal point.",
    specificNegatives:
      "clean composition, muted palette, vintage feel, polished illustration, smooth shading",
    paletteStrategy: "fixed",
    paletteHints:
      "highlighter neons over black: acid green, hot magenta, electric cyan, sodium-vapor yellow",
  },
  western_revival: {
    id: "western_revival",
    name: "Western Revival",
    description:
      "Cowboy Carter / modern rodeo poster — slab serifs, woodblock textures, dust and grit.",
    bucket: "trending",
    promptFragment:
      "Contemporary western revival in the lineage of Cowboy Carter-era merchandise and modern country reissue tees, hand-painted sign-shop quality, ornate Victorian-influenced display type with western flourishes and slab-serif weight, dusty desert palette of bone, rust, sage, and dusty rose with selective brights, decorative borders and rope ornaments where appropriate, evoking vintage rodeo posters and 1970s country album covers reissued with contemporary design polish.",
    specificNegatives:
      "cartoon cowboy, generic western clipart, sheriff badge cliché, neon colors",
    paletteStrategy: "preset-led",
    paletteHints:
      "sun-bleached earth tones: rust, ochre, bone, denim, occasional turquoise accent",
  },

  // ===== REFINED / SOPHISTICATED =====
  editorial_illustration: {
    id: "editorial_illustration",
    name: "Editorial Illustration",
    description:
      "Christoph Niemann / New Yorker cover — conceptual, flat shapes, sly visual pun, restrained.",
    bucket: "refined",
    promptFragment:
      "Contemporary editorial illustration in the lineage of Christoph Niemann, Olimpia Zagnoli, Malika Favre, and Tom Bachtell, conceptual visual metaphor as the core idea rather than literal depiction, flat color shapes with selective grain texture overlay, sophisticated muted palette (terracotta, ochre, slate, cream, deep teal), single clear concept with strong silhouette, slightly abstracted figures and forms, evoking a New Yorker cover, NYT op-ed illustration, or New York Magazine feature.",
    specificNegatives:
      "cartoon style, mascot character, photorealistic, decorative ornament, complex background scene",
    paletteStrategy: "brand-driven",
    paletteHints:
      "restrained palette of 3-4 muted hues with one saturated accent; flat fills",
  },
  risograph: {
    id: "risograph",
    name: "Risograph Print",
    description:
      "2-3 ink riso print — visible grain, deliberate off-register overprint, fluorescent inks.",
    bucket: "refined",
    promptFragment:
      "Risograph print aesthetic, 2 to 3 ink colors with visible registration offset where colors don't quite align, overprint creating a third blended tone where two inks overlap, soft grainy uncoated paper texture, fluorescent pink or teal as one of the inks, hand-drawn quality with friendly imperfection, evoking indie zine culture, small-press art prints, and contemporary illustrated children's books for grown-ups.",
    specificNegatives:
      "perfect registration, smooth digital print, vector cleanness, photorealistic, high-saturation palette",
    paletteStrategy: "fixed",
    paletteHints:
      "riso ink set: fluorescent pink, federal blue, sunflower yellow, mint, hunter green — only these inks, no blending outside overprint mix",
  },
  minimalist_line: {
    id: "minimalist_line",
    name: "Minimal Line",
    description:
      "Single-weight continuous line drawing — no fill, no shading, no breaks where avoidable.",
    bucket: "refined",
    promptFragment:
      "Single-weight continuous line drawing, pure black ink on pure white background, hand-drawn quality with subtle imperfection in the line, abstract or semi-figurative subject, generous negative space, no fills, no shading, no color — line work only, evoking Picasso's continuous line drawings, contemporary single-line tattoo work, and the visual language of refined gift shop merchandise.",
    specificNegatives:
      "filled shapes, color, shading, gradient, multiple line weights, complex detail, busy composition",
    paletteStrategy: "brand-driven",
    paletteHints:
      "single ink color (black or one brand color) on flat background — no second color",
  },
  hand_lettered: {
    id: "hand_lettered",
    name: "Hand Lettered",
    description:
      "Custom brush and pen lettering as the subject itself — the type IS the design.",
    bucket: "refined",
    promptFragment:
      "Hand-lettered custom typography as the central design element, brush or pen lettering with character and slight intentional imperfection, the subject is expressed primarily through the letterforms themselves rather than illustration, supporting decorative flourishes (small ornaments, underline swashes, banner ribbons) as accents only, warm and personal feel, evoking custom wedding invitations, memorial keepsakes, and family-event design where the message and names are the point.",
    specificNegatives:
      "digital font, sans-serif type, illustration as focal point, sterile design, generic typography",
    paletteStrategy: "brand-driven",
    paletteHints:
      "one ink color (brand-led) on contrasting flat ground — letters are the figure, not a label",
  },

  // ===== BOLD / IRREVERENT =====
  bootleg_heat_transfer: {
    id: "bootleg_heat_transfer",
    name: "Bootleg Tee",
    description:
      "1990s bootleg band tee — clipart-collage, off-register heat transfer, drop shadows, fake-stretched type.",
    bucket: "bold",
    promptFragment:
      "Bootleg heat-transfer merchandise graphic in the lineage of unauthorized 1990s band tees and contemporary bootleg revivals, layered composition with text wrapping around the image edges in multiple weights and sizes, halftone photograph or illustration at the center, intentionally lo-fi composition that looks assembled rather than designed, slight off-register printing as if heat-pressed by hand, evoking a flea-market bootleg tee or unauthorized tour merch.",
    specificNegatives:
      "polished layout, professional graphic design, clean composition, single typeface, balanced hierarchy",
    paletteStrategy: "preset-led",
    paletteHints:
      "faded heat-transfer print: red, black, occasional yellow, on white or grey tee",
  },
  death_metal: {
    id: "death_metal",
    name: "Death Metal Logo",
    description:
      "Ornate blackletter heavy metal logo — illegible-by-design, sharp serifs, anatomical detail.",
    bucket: "bold",
    promptFragment:
      "Heavy metal band logo aesthetic in the lineage of Christophe Szpajdel's work for Emperor, Enslaved, and underground death metal bands, ornate gothic blackletter or near-illegible spiky logotype as the focal element, sharp angular forms with thorns and serifs extending outward, dense ornamental composition, high contrast pure black on white or white on black, evoking underground death metal, doom, and black metal tees that genuinely commit to the aesthetic rather than ironize it.",
    specificNegatives:
      "readable typography, friendly composition, color palette, cartoon character, ironic distance",
    paletteStrategy: "fixed",
    paletteHints:
      "black + one accent (silver, blood red, or bone white) — high contrast, no mid-tones",
  },
};

/**
 * Universal negatives appended to every assembled prompt's AVOID section.
 *
 * These are the generic-AI tells the user explicitly called out as
 * disqualifying. Per-preset specificNegatives concatenate after these.
 */
export const UNIVERSAL_NEGATIVES =
  "photorealistic 3D rendering, smooth gradient airbrush AI aesthetic, " +
  "plastic shading, hyperreal eyes on cartoon characters, generic stock illustration, " +
  "t-shirt mockups, product photography, model wearing the design, watermarks, " +
  "generic mascot proportions, Disney/Pixar aesthetic";

/**
 * Universal wildcard preset.
 *
 * Used when "Mix presets" mode (Phase 3) needs a 4th preset for event types
 * that only map to 3 defaults. Editorial illustration is the safest pairing
 * because its brand-driven palette and conceptual restraint compose with
 * almost any subject.
 */
export const WILDCARD_PRESET_ID = "editorial_illustration";

/**
 * Per-event-type preset suggestions surfaced in the wizard's preset picker.
 *
 * Sports/School/Family/Charity/Company get 3 mapped defaults each.
 * "Other" gets 4 because it's the catchall — no obvious "first choice."
 */
export const EVENT_TYPE_PRESET_DEFAULTS: Record<EventType, string[]> = {
  sports: ["vintage_athletic", "skate_90s", "tattoo_traditional"],
  charity: ["editorial_illustration", "risograph", "hand_lettered"],
  company: ["editorial_illustration", "minimalist_line", "hand_lettered"],
  family: ["hand_lettered", "vintage_athletic", "risograph"],
  school: ["vintage_athletic", "skate_90s", "tattoo_traditional"],
  other: [
    "y2k_chrome",
    "bootleg_heat_transfer",
    "death_metal",
    "western_revival",
  ],
};

/**
 * Returns the suggested presets for an event type, or the wildcard if
 * eventType is null/unknown. Used by the preset picker UI (Phase 2) and
 * server-side prompt assembly when no presetId is supplied.
 */
export function getPresetDefaultsForEventType(
  eventType: EventType | null,
): string[] {
  if (!eventType) {
    return [WILDCARD_PRESET_ID];
  }
  return EVENT_TYPE_PRESET_DEFAULTS[eventType] ?? [WILDCARD_PRESET_ID];
}

/**
 * Safe accessor for a preset by id. Falls back to the wildcard preset if
 * the id is unknown — important because Design.presetId is user-supplied
 * and we never want a stale id to crash generation.
 */
export function getPreset(presetId: string | null | undefined): StylePreset {
  if (!presetId) {
    return STYLE_PRESETS[WILDCARD_PRESET_ID];
  }
  return STYLE_PRESETS[presetId] ?? STYLE_PRESETS[WILDCARD_PRESET_ID];
}

/**
 * Returns all presets grouped by bucket — used by the "See all 12" expansion
 * in the preset picker (Phase 2).
 */
export function getPresetsByBucket(): Record<StylePresetBucket, StylePreset[]> {
  const buckets: Record<StylePresetBucket, StylePreset[]> = {
    vintage: [],
    trending: [],
    refined: [],
    bold: [],
  };
  for (const preset of Object.values(STYLE_PRESETS)) {
    buckets[preset.bucket].push(preset);
  }
  return buckets;
}
