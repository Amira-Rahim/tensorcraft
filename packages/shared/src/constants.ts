/**
 * Theme slugs — the 5 themed courses.
 * Deep Orbit launches first (V0.5). Others are coming soon.
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
 * Pricing tiers — per-model, one-time purchase.
 * No subscriptions. Team pricing deferred to post-V1.0.
 */
export const PRICING = {
  free: { price: 0, themes: 0, label: "Free Preview" },
  single: { price: 79, themes: 1, label: "Single Theme" },
  twoBundle: { price: 129, themes: 2, label: "Two Themes" },
  threeBundle: { price: 169, themes: 3, label: "Three Themes" },
  allFive: { price: 219, themes: 5, label: "All 5 Themes" },
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
  bridgeConcept: (concept: string) => `/bridges/${concept}` as const,
} as const;

/**
 * V0.5 scope — Deep Orbit, Modules 1–3 (15 lessons).
 */
export const V05_SCOPE = {
  theme: "deep-orbit" as ThemeSlug,
  modules: 3,
  lessons: 15,
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
