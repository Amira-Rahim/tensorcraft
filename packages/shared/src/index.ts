/**
 * @tensorcraft/shared
 *
 * Shared types, utilities, and constants used across apps and packages.
 */

export {
  THEME_SLUGS,
  PRICING,
  ROUTES,
  V05_SCOPE,
  THEME_CONTENT,
  DEFAULT_THEME,
  isValidThemeSlug,
  isValidSlug,
} from "./constants";
export type { ThemeSlug, PricingTier } from "./constants";

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
