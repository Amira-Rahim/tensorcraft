/**
 * @tensorcraft/shared
 *
 * Shared types, utilities, and constants used across apps and packages.
 */

export {
  THEME_SLUGS,
  LAUNCHED_THEMES,
  COMING_SOON_THEMES,
  PRICING,
  ROUTES,
  THEME_CONTENT,
  DEFAULT_THEME,
  getModuleLessonCount,
  isValidThemeSlug,
  isValidSlug,
  isLaunched,
  isComingSoon,
} from "./constants";
export type { ThemeSlug, LaunchedTheme, PricingTier } from "./constants";

export {
  BRIDGES,
  BRIDGE_TIER_COLORS,
  BRIDGE_TIER_LABELS,
  BRIDGE_CATEGORY_LABELS,
} from "./bridges";
export type {
  Bridge,
  BridgeTier,
  BridgeCategory,
  Framework,
  BridgeVariant,
} from "./bridges";
