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
} as const;

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
