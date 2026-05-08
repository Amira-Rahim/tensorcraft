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

export {
  REVIEW_EPSILON,
  SM2_SUCCESS_MULTIPLIER,
  SM2_FAIL_INTERVAL_HOURS,
  MIN_INTERVAL_HOURS,
  FORGETTING_HOURS_CAP,
  forgettingScore,
  epsilonGreedy,
  nextReviewAt,
} from "./bandit";
export type { BanditArm, SelectedArm } from "./bandit";
