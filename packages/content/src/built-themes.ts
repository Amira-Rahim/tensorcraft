/**
 * The theme directories that are BUILT (compiled by Velite) and therefore
 * covered by the content QA gates.
 *
 * Single source of truth. Before this, the build glob lived in
 * velite.config.ts AND every gate re-declared its own
 * `["deep-orbit", "extras"]` literal (exercise-counts, epoch-traces,
 * metadata-consistency, end-of-lesson). The consequence, per the scalability
 * audit F3: when a second theme launches, the automated consistency net that
 * keeps 5C variety, metadata truth and numeric canon coherent would NOT cover
 * it — it saw only the 77 shipped lessons out of ~275 authored.
 *
 * Now there is one list. Launch a theme by adding its dir here (and to
 * LAUNCHED_THEMES in @tensorcraft/shared): Velite compiles it and every gate
 * covers it, with no per-test edits. That is the parameterization — gate scope
 * tracks the build from a single constant.
 *
 * `extras` is cross-theme companion content, always built alongside the
 * launched story themes.
 */
export const BUILT_THEME_DIRS = ["deep-orbit", "extras"] as const;

export type BuiltThemeDir = (typeof BUILT_THEME_DIRS)[number];

/** Velite glob form, e.g. `{deep-orbit,extras}`. Derived so it cannot drift. */
export const BUILT_THEME_GLOB = `{${BUILT_THEME_DIRS.join(",")}}`;

/** The launched STORY themes among the built dirs (excludes `extras`). */
export const BUILT_STORY_THEMES = BUILT_THEME_DIRS.filter(
  (d) => d !== "extras",
);
