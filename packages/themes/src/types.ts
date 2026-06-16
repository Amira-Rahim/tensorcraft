/**
 * Theme color palette, maps to CSS custom properties (--tc-*).
 * All colors are designed for dark backgrounds. No light mode.
 *
 * Brutalist Terminal aesthetic: sharp edges, offset shadows, monospace-first.
 */
export interface ThemePalette {
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
 * Theme-specific terminology (replaces generic labels in UI).
 */
export interface ThemeTerminology {
  lesson: string;
  module: string;
  exercise: string;
}

/**
 * Character profile for narrative rendering.
 */
export interface ThemeCharacter {
  name: string;
  role: string;
  personality: string;
  /** kebab-case id for the avatar asset path. */
  slug?: string;
  /** Alternate speaker strings used in dialogue (deep-orbit needs none). */
  aliases?: string[];
  /** AI characters render an abstract glyph, not a portrait/monogram. */
  isAI?: boolean;
}

/**
 * One module row in a coming-soon curriculum teaser.
 * Titles come from docs/scripts/<slug>.md module outlines.
 */
export interface ThemePreviewModule {
  /** 1-11 */
  order: number;
  title: string;
  /** Exactly one per theme, always module 1 */
  free?: boolean;
  /** Exactly one per theme, always module 11 */
  capstone?: boolean;
}

/**
 * Teaser data for coming-soon stub pages. Hand-curated; real lesson
 * content for these themes is excluded from the build until launch.
 */
export interface ThemePreview {
  /** In-world framing for the hero, e.g. org board + incident status */
  statusBoard: {
    org: string;
    status: string;
  };
  /** Hero waitlist button label, e.g. "Get paged" */
  ctaLabel: string;
  /** Exactly 11 entries */
  modules: ThemePreviewModule[];
  /** Exactly 8 short skill chips */
  skills: string[];
}

/**
 * Full theme manifest matching the technical spec.
 * Each theme defines visual identity and narrative context. Launch status is
 * tracked separately in @tensorcraft/shared → LAUNCHED_THEMES.
 */
export interface ThemeManifest {
  /** Internal theme identifier (e.g., "space") */
  id: string;
  /** URL-friendly slug (e.g., "deep-orbit") */
  slug: string;
  /** User-facing display name */
  displayName: string;
  /** Short tagline */
  tagline: string;
  /** Theme description */
  description: string;
  /** Color palette */
  palette: ThemePalette;
  /** UI label overrides */
  terminology: ThemeTerminology;
  /** Learner's role in the narrative */
  protagonist: string;
  /** Sandpack editor color theme */
  sandpackTheme: string;
  /** Characters in the story */
  characters: ThemeCharacter[];
  /** ML specialization area */
  specialization: string;
  /** Model the learner builds */
  modelBuilt: string;
  /** Relevant career paths with salary ranges */
  careerPaths: string[];
  /** Coming-soon teaser data; absent for launched themes */
  preview?: ThemePreview;
}
