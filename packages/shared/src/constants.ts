/**
 * Theme slugs — the 5 themed courses.
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
 * V1 launched themes. Other themes in THEME_SLUGS are "coming soon" — their
 * registry metadata still loads (palettes, taglines, characters), but build,
 * routing, payments, and dashboards gate on this set. Move a slug here when
 * its content is QA'd and the theme is ready to ship.
 */
export const LAUNCHED_THEMES = ["deep-orbit"] as const;

export type LaunchedTheme = (typeof LAUNCHED_THEMES)[number];

/** Slugs not yet launched — derived so it stays in sync with THEME_SLUGS. */
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
 * Pricing tiers — per-model, one-time purchase.
 * No subscriptions. Team pricing deferred to post-V1.0.
 *
 * `price` is the amount actually charged (drives Stripe `unit_amount` and
 * webhook amount validation in apps/api/src/routes/payments.ts) and the
 * Schema.org Offer price in JSON-LD. NEVER set it to the anchor.
 *
 * `regularPrice` is a DISPLAY-ONLY anchor for founder/launch pricing. When
 * present and greater than `price`, the pricing UI renders it struck-through
 * next to the live price ("~~$99~~ $49"). It must never reach Stripe, the
 * webhook validator, or JSON-LD. To soften/remove the anchor, change or drop
 * `regularPrice` here — the single source of truth.
 */
export const PRICING = {
  free: { price: 0, themes: 0, label: "Free Preview" },
  single: { price: 49, regularPrice: 99, themes: 1, label: "Single Theme" },
  twoBundle: { price: 79, themes: 2, label: "Two Themes" },
  threeBundle: { price: 99, themes: 3, label: "Three Themes" },
  allFive: { price: 129, themes: 5, label: "All 5 Themes" },
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
  glossary: "/glossary",
  glossaryTerm: (term: string) => `/glossary/${term}` as const,
} as const;

/**
 * Per-theme content structure — full course (V1.0).
 * Used by pricing page and marketing. Update when course structure changes.
 */
export const THEME_CONTENT = {
  modulesPerTheme: 11,
  lessonsPerModule: 5,
  totalLessonsPerTheme: 55,
} as const;

/** Default theme used for fallbacks */
export const DEFAULT_THEME: ThemeSlug = "deep-orbit";

/** Validate that a string is a known theme slug */
export function isValidThemeSlug(slug: string): slug is ThemeSlug {
  return (THEME_SLUGS as readonly string[]).includes(slug);
}

/** Validate slug format — alphanumeric with hyphens, max 100 chars */
export function isValidSlug(id: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,98}[a-z0-9])?$/.test(id);
}
