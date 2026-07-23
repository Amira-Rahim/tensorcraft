/**
 * Theme slugs: the 5 themed courses.
 */
export const THEME_SLUGS = [
  "deep-orbit",
  "neon-protocol",
  "signal-ward",
  "nova-canvas",
  "terra-grid",
] as const;

export type ThemeSlug = (typeof THEME_SLUGS)[number];

/**
 * V1 launched themes. Other themes in THEME_SLUGS are "coming soon"; their
 * registry metadata still loads (palettes, taglines, characters), but build,
 * routing, payments, and dashboards gate on this set. Move a slug here when
 * its content is QA'd and the theme is ready to ship.
 */
export const LAUNCHED_THEMES = ["deep-orbit"] as const;

export type LaunchedTheme = (typeof LAUNCHED_THEMES)[number];

/** Slugs not yet launched, derived so it stays in sync with THEME_SLUGS. */
export const COMING_SOON_THEMES = THEME_SLUGS.filter(
  (slug): slug is Exclude<ThemeSlug, LaunchedTheme> =>
    !(LAUNCHED_THEMES as readonly string[]).includes(slug),
);

export function isLaunched(slug: string): slug is LaunchedTheme {
  return (LAUNCHED_THEMES as readonly string[]).includes(slug);
}

export function isComingSoon(slug: string): boolean {
  return (COMING_SOON_THEMES as readonly string[]).includes(slug);
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
  free: { price: 0, themes: 0, label: "Free Preview" },
  single: { price: 59, themes: 1, label: "Single Theme" },
  twoBundle: { price: 99, themes: 2, label: "Two Themes" },
  threeBundle: { price: 129, themes: 3, label: "Three Themes" },
  allFive: { price: 159, themes: 5, label: "All 5 Themes" },
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
  themes: "/themes",
  theme: (slug: ThemeSlug) => `/themes/${slug}` as const,
  module: (themeSlug: ThemeSlug, moduleSlug: string) =>
    `/themes/${themeSlug}/${moduleSlug}` as const,
  lesson: (themeSlug: ThemeSlug, moduleSlug: string, lessonSlug: string) =>
    `/themes/${themeSlug}/${moduleSlug}/${lessonSlug}` as const,
  dashboard: "/dashboard",
  settings: "/settings",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}` as const,
} as const;

/**
 * Per-theme content structure: full course (V1.0).
 * Used by pricing page and marketing. Update when course structure changes.
 */
export const THEME_CONTENT = {
  modulesPerTheme: 11,
  lessonsPerModule: 5,
  // 10 modules x 5 + browser-runtimes' 6 = 56 (Deep Orbit actual; also the
  // certificate completion gate). Revisit if a future theme ships a different count.
  totalLessonsPerTheme: 56,
  // Coming-soon themes are scoped at 11 x 5 = 55. Single source for the
  // coming-soon stubs AND the pricing bundle math (56 + 55·(N−1)); the two
  // surfaces carried separate literals until 2026-07-13. Bundle totals
  // assume Deep Orbit is in every bundle — true while it is the only
  // launched theme; revisit when a second theme ships.
  comingSoonLessonsPerTheme: 55,
  // Modules that deviate from lessonsPerModule. The API can't import the
  // content package (velite build artifact), so the DISPATCH milestone
  // producer resolves module sizes from here; a gate in packages/content
  // asserts these numbers against the real MDX corpus.
  moduleLessonOverrides: { "browser-runtimes": 6 } as Record<string, number>,
  // Lesson-embedded FE→ML bridges in the launched theme. Single source for
  // every marketing surface (/learn, FAQ, onboarding) — three surfaces
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
  /** Shipped exercises: deep-orbit + extras (the dirs velite compiles). */
  liveExercises: 85,
  /** Authored across the five theme directories (extras excluded). */
  authoredFiveThemes: 299,
} as const;

/**
 * Lessons in a module, for code that cannot see the content package
 * (module completion = this many `completed` rows in theme_progress).
 */
export function getModuleLessonCount(moduleSlug: string): number {
  return (
    THEME_CONTENT.moduleLessonOverrides[moduleSlug] ??
    THEME_CONTENT.lessonsPerModule
  );
}

/**
 * Lessons behind the paywall in the launched theme: everything except the
 * free first module. 56 - 5 = 51.
 *
 * Only meaningful for a LAUNCHED theme. Coming-soon themes are scoped at
 * `comingSoonLessonsPerTheme` and are not purchasable, so a paywall surface
 * must not quote this number for them.
 */
export function getPaidLessonCount(): number {
  return (
    THEME_CONTENT.totalLessonsPerTheme -
    getModuleLessonCount(THEME_CONTENT.freeModuleSlug)
  );
}

/** Default theme used for fallbacks */
export const DEFAULT_THEME: ThemeSlug = "deep-orbit";

/** Validate that a string is a known theme slug */
export function isValidThemeSlug(slug: string): slug is ThemeSlug {
  return (THEME_SLUGS as readonly string[]).includes(slug);
}

/** Validate slug format: alphanumeric with hyphens, max 100 chars */
export function isValidSlug(id: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,98}[a-z0-9])?$/.test(id);
}

/**
 * Color scheme axis (light/dark), orthogonal to the narrative theme slug
 * (`ThemeSlug`/`data-theme`). `SchemePreference` is the stored value: an
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
