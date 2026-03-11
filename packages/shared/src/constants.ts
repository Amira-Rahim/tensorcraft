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
} as const;

export type PricingTier = keyof typeof PRICING;

/**
 * Route constants for the web app.
 */
export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  auth: {
    signIn: "/auth/sign-in",
    signUp: "/auth/sign-up",
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
} as const;

/**
 * V0.5 scope — Deep Orbit, Modules 1–3 (15 lessons).
 */
export const V05_SCOPE = {
  theme: "deep-orbit" as ThemeSlug,
  modules: 3,
  lessons: 15,
} as const;
