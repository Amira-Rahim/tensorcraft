/**
 * Theme color palette — maps to CSS custom properties (--tc-*).
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
}

/**
 * Full theme manifest matching the technical spec.
 * Each theme defines visual identity, narrative context, and launch status.
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
}
