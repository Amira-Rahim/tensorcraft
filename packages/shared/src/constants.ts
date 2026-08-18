/**
 * World slugs: the 5 worlds.
 */
export const WORLD_SLUGS = [
  "deep-orbit",
  "neon-protocol",
  "signal-ward",
  "nova-canvas",
  "terra-grid",
] as const;

export type WorldSlug = (typeof WORLD_SLUGS)[number];

/**
 * Per-world corpus SHAPE - the real lesson/module counts on disk, per world.
 *
 * Scalability re-audit 2026-07-24 (§RE-AUDIT / N2, finding F-A). The corpus is
 * NOT uniform: deep-orbit has 56 lessons (browser-runtimes carries 6),
 * neon-protocol 54 (image-data carries 4), the other three 55. Before this, the
 * shape lived as single Deep-Orbit scalars (`totalLessonsPerWorld: 56`,
 * `modulesPerWorld: 11`, a GLOBAL `moduleLessonOverrides`), so every count-gate
 * asserted 56/11 against every built world and the DISPATCH milestone producer
 * sized every world's modules from one global map. The moment a second world
 * joined the build those gates went RED and milestones misfired.
 *
 * Now each world declares its own shape here, verified against the filesystem
 * by packages/content/__tests__/module-counts.test.ts + structure-variety.
 * Overrides are keyed by module slug WITHIN a world, so two worlds may share a
 * module name with different counts (F-B). Launch a world → its gate assertions
 * and milestone sizing come from its own row, no per-test edit.
 */
export interface WorldShape {
  /** Total lessons authored for this world (the certificate completion gate). */
  totalLessons: number;
  /** Module directories in this world. */
  modules: number;
  /**
   * Modules whose lesson count deviates from `lessonsPerModule` (5), keyed by
   * module slug. Empty when every module holds the standard count.
   */
  moduleOverrides: Record<string, number>;
}

export const WORLD_SHAPE: Record<WorldSlug, WorldShape> = {
  "deep-orbit": {
    totalLessons: 56,
    modules: 11,
    moduleOverrides: { "browser-runtimes": 6 },
  },
  "neon-protocol": {
    totalLessons: 54,
    modules: 11,
    moduleOverrides: { "image-data": 4 },
  },
  "signal-ward": { totalLessons: 55, modules: 11, moduleOverrides: {} },
  "nova-canvas": { totalLessons: 55, modules: 11, moduleOverrides: {} },
  "terra-grid": { totalLessons: 55, modules: 11, moduleOverrides: {} },
};

/** Total lessons authored for a world (the module-completion / cert gate). */
export function getWorldTotalLessons(worldSlug: string): number {
  const shape = WORLD_SHAPE[worldSlug as WorldSlug];
  return shape ? shape.totalLessons : WORLD_SHAPE["deep-orbit"].totalLessons;
}

/**
 * V1 launched worlds. Other worlds in WORLD_SLUGS are "coming soon"; their
 * registry metadata still loads (palettes, taglines, characters), but build,
 * routing, payments, and dashboards gate on this set. Move a slug here when
 * its content is QA'd and the world is ready to ship.
 */
export const LAUNCHED_WORLDS = ["deep-orbit"] as const;

export type LaunchedWorld = (typeof LAUNCHED_WORLDS)[number];

/** Slugs not yet launched, derived so it stays in sync with WORLD_SLUGS. */
export const COMING_SOON_WORLDS = WORLD_SLUGS.filter(
  (slug): slug is Exclude<WorldSlug, LaunchedWorld> =>
    !(LAUNCHED_WORLDS as readonly string[]).includes(slug),
);

export function isLaunched(slug: string): slug is LaunchedWorld {
  return (LAUNCHED_WORLDS as readonly string[]).includes(slug);
}

export function isComingSoon(slug: string): boolean {
  return (COMING_SOON_WORLDS as readonly string[]).includes(slug);
}

/**
 * Pricing tiers: per-model, one-time purchase.
 * No subscriptions. Team pricing deferred to post-V1.0.
 *
 * `price` is the amount actually charged (drives Stripe `unit_amount` and
 * webhook amount validation in apps/api/src/routes/payments.ts) and the
 * Schema.org Offer price in JSON-LD. Single source of truth for all pricing
 * display, checkout, and structured data.
 */
export const PRICING = {
  free: { price: 0, worlds: 0, label: "Free Preview" },
  single: { price: 59, worlds: 1, label: "Single World" },
  twoBundle: { price: 99, worlds: 2, label: "Two Worlds" },
  threeBundle: { price: 129, worlds: 3, label: "Three Worlds" },
  allFive: { price: 159, worlds: 5, label: "All 5 Worlds" },
} as const;

export type PricingTier = keyof typeof PRICING;

/**
 * Route constants for the web app.
 */
export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  auth: {
    root: "/auth",
    signIn: "/auth",
    signUp: "/auth",
    callback: "/auth/callback",
  },
  worlds: "/worlds",
  world: (slug: WorldSlug) => `/worlds/${slug}` as const,
  module: (worldSlug: WorldSlug, moduleSlug: string) =>
    `/worlds/${worldSlug}/${moduleSlug}` as const,
  lesson: (worldSlug: WorldSlug, moduleSlug: string, lessonSlug: string) =>
    `/worlds/${worldSlug}/${moduleSlug}/${lessonSlug}` as const,
  dashboard: "/dashboard",
  settings: "/settings",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}` as const,
} as const;

/**
 * Per-world content structure: full course (V1.0).
 * Used by pricing page and marketing. Update when course structure changes.
 */
export const WORLD_CONTENT = {
  modulesPerWorld: 11,
  lessonsPerModule: 5,
  // 10 modules x 5 + browser-runtimes' 6 = 56 (Deep Orbit actual; also the
  // certificate completion gate). Revisit if a future world ships a different count.
  totalLessonsPerWorld: 56,
  // comingSoonLessonsPerWorld (flat 55) RETIRED 2026-07-25: neon-protocol
  // authors 54 lessons, so the flat scalar overpromised on every surface
  // that quoted it (fresh-eyes rerun 2026-07-25, T0). Coming-soon stubs and
  // the pricing bundle math now read per-world counts from WORLD_SHAPE via
  // getWorldTotalLessons.
  // Per-module deviations moved to per-world WORLD_SHAPE (re-audit N2/F-B):
  // module sizes are now world-scoped, so getModuleLessonCount takes a world.
  // WORLD_CONTENT.modulesPerWorld / totalLessonsPerWorld describe the LAUNCHED
  // world (deep-orbit) for marketing; a gate asserts they equal
  // WORLD_SHAPE["deep-orbit"] so the two cannot drift.
  // Lesson-embedded JS-to-ML bridges in the launched world. Single source for
  // every marketing surface (/learn, FAQ, onboarding) - three surfaces
  // carried three different counts (50+/51/55) until 2026-07-14. Pinned to
  // the real corpus by packages/content/__tests__/bridge-breaks.test.ts.
  lessonBridges: 55,
  // Module 1 is free; it is the funnel's whole hook. Named here because both
  // paywall surfaces quote what sits BEHIND the wall, and both pasted the
  // literal 51 until 2026-07-15.
  freeModuleSlug: "foundations",
} as const;

/**
 * Exercise counts quoted in marketing copy (/about). Pinned against the real
 * YAML corpus by packages/content/__tests__/exercise-counts.test.ts so the
 * copy cannot drift from the filesystem again: audit run #7 found /about
 * claiming "80 live / 315 authored" when the corpus held 84 / 298.
 */
export const EXERCISE_CONTENT = {
  /** Shipped exercises: the dirs velite compiles (deep-orbit only). */
  // 85 -> 86 (2026-07-25): T3-34 added capstone/export-model-artifact so the
  // "walk out with a deployable model" claim has a .save() exercise behind it.
  // 86 -> 88 (2026-07-27): math-deep-dive gained signal-statistics and
  // power-iteration alongside the two new deep-dive lessons.
  // 88 -> 65 (2026-08-15): /extras removed (owner decision); its 23
  // exercises went with it.
  liveExercises: 65,
  /** Authored across the five world directories (extras excluded). */
  // 299 -> 300 (2026-07-25): same addition, counted in deep-orbit.
  authoredFiveWorlds: 300,
} as const;

/**
 * Lessons in a module, for code that cannot see the content package (module
 * completion = this many `completed` rows in world_progress). World-scoped
 * (re-audit N2/F-B): a module's size is read from THAT world's shape, so the
 * DISPATCH milestone producer sizes each world's modules correctly and two
 * worlds may share a module name with different counts. Unknown world/module
 * falls back to the standard per-module count.
 */
export function getModuleLessonCount(
  worldSlug: string,
  moduleSlug: string,
): number {
  const shape = WORLD_SHAPE[worldSlug as WorldSlug];
  return shape?.moduleOverrides[moduleSlug] ?? WORLD_CONTENT.lessonsPerModule;
}

/**
 * Lessons behind the paywall in the launched world: everything except the
 * free first module. 56 - 5 = 51.
 *
 * Only meaningful for a LAUNCHED world. Coming-soon worlds carry their own
 * per-world counts in WORLD_SHAPE (via getWorldTotalLessons) and are not
 * purchasable, so a paywall surface must not quote this number for them.
 */
export function getPaidLessonCount(): number {
  return (
    WORLD_CONTENT.totalLessonsPerWorld -
    getModuleLessonCount(DEFAULT_WORLD, WORLD_CONTENT.freeModuleSlug)
  );
}

/** Default world used for fallbacks */
export const DEFAULT_WORLD: WorldSlug = "deep-orbit";

/** Validate that a string is a known world slug */
export function isValidWorldSlug(slug: string): slug is WorldSlug {
  return (WORLD_SLUGS as readonly string[]).includes(slug);
}

/** Validate slug format: alphanumeric with hyphens, max 100 chars */
export function isValidSlug(id: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,98}[a-z0-9])?$/.test(id);
}

/**
 * Color scheme axis (light/dark), orthogonal to the narrative world slug
 * (`WorldSlug`/`data-world`). `SchemePreference` is the stored value: an
 * explicit user choice, or `null` meaning "follow OS
 * `prefers-color-scheme`" (the default). Only explicit choices persist to
 * localStorage, under `SCHEME_STORAGE_KEY`.
 */
export type ColorScheme = "light" | "dark";
export type SchemePreference = ColorScheme | null; // null = follow OS
export const SCHEME_STORAGE_KEY = "tc-scheme";

/** Validate that a string is a known color scheme value. */
export function isColorScheme(v: string): v is ColorScheme {
  return v === "light" || v === "dark";
}
