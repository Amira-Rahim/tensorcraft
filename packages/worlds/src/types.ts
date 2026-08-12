/**
 * World color palette, maps to CSS custom properties (--tc-*).
 * These colors are designed for dark backgrounds (the default scheme).
 * See `paletteLight` on WorldManifest for the data-scheme="light" variant.
 *
 * Brutalist Terminal aesthetic: sharp edges, offset shadows, monospace-first.
 */
export interface WorldPalette {
  /** Page background */
  bg: string;
  /** Primary brand color (buttons, links, active states) */
  primary: string;
  /** Secondary accent color (highlights, badges) */
  accent: string;
  /** Raised surface (cards, panels) */
  surface: string;
  /** Elevated surface (overlays, dropdowns) */
  surfaceOverlay: string;
  /** Body text */
  text: string;
  /** Muted/secondary text */
  muted: string;
  /** Border color */
  border: string;
  /** Code block background */
  codeBg: string;
}

/**
 * World-specific terminology (replaces generic labels in UI).
 */
export interface WorldTerminology {
  lesson: string;
  module: string;
  exercise: string;
}

/**
 * Character profile for narrative rendering.
 */
export interface WorldCharacter {
  name: string;
  role: string;
  personality: string;
  /** kebab-case id for the avatar asset path. */
  slug?: string;
  /** Alternate speaker strings used in dialogue (deep-orbit needs none). */
  aliases?: string[];
  /** AI characters render an abstract glyph, not a portrait/monogram. */
  isAI?: boolean;
  /**
   * Canonical expression variant ids, kebab-case, matching the avatar asset
   * naming `<slug>-<expression>.webp`. "neutral" maps to the base portrait
   * `<slug>.webp`. For isAI characters these are waveform state ids rendered
   * procedurally, not files.
   */
  expressions?: readonly string[];
}

/**
 * One module row in a coming-soon curriculum teaser.
 * Titles come from docs/scripts/<slug>.md module outlines.
 */
export interface WorldPreviewModule {
  /** 1-11 */
  order: number;
  title: string;
  /** Exactly one per world, always module 1 */
  free?: boolean;
  /** Exactly one per world, always module 11 */
  capstone?: boolean;
}

/**
 * Teaser data for coming-soon stub pages. Hand-curated; real lesson
 * content for these worlds is excluded from the build until launch.
 */
export interface WorldPreview {
  /** In-world framing for the hero, e.g. org board + incident status */
  statusBoard: {
    org: string;
    status: string;
  };
  /** Hero waitlist button label, e.g. "Get paged" */
  ctaLabel: string;
  /** Exactly 11 entries */
  modules: WorldPreviewModule[];
  /** Exactly 8 short skill chips */
  skills: string[];
}

/**
 * Full world manifest matching the technical spec.
 * Each world defines visual identity and narrative context. Launch status is
 * tracked separately in @tensorcraft/shared → LAUNCHED_WORLDS.
 */
export interface WorldManifest {
  /** Internal world identifier (e.g., "space") */
  id: string;
  /** URL-friendly slug (e.g., "deep-orbit") */
  slug: string;
  /** User-facing display name */
  displayName: string;
  /** Short tagline */
  tagline: string;
  /** World description */
  description: string;
  /** Color palette */
  palette: WorldPalette;
  /**
   * Light-scheme variant of `palette`, applied when data-scheme="light" is
   * set on <html>. Must mirror the CSS `[data-scheme="light"]` /
   * `[data-world="<slug>"][data-scheme="light"]` values in
   * packages/worlds/src/css/worlds.css — locked by world-properties.test.ts.
   */
  paletteLight: WorldPalette;
  /** UI label overrides */
  terminology: WorldTerminology;
  /** Learner's role in the narrative */
  protagonist: string;
  /** Characters in the story */
  characters: WorldCharacter[];
  /** ML specialization area */
  specialization: string;
  /** Model the learner builds */
  modelBuilt: string;
  /** Relevant career paths with salary ranges */
  careerPaths: string[];
  /** Coming-soon teaser data; absent for launched worlds */
  preview?: WorldPreview;
}
