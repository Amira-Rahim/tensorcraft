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
  THEME_SHAPE,
  getThemeTotalLessons,
  EXERCISE_CONTENT,
  DEFAULT_THEME,
  getModuleLessonCount,
  getPaidLessonCount,
  isValidThemeSlug,
  isValidSlug,
  isLaunched,
  isComingSoon,
  SCHEME_STORAGE_KEY,
  isColorScheme,
} from "./constants";
export type {
  ThemeSlug,
  ThemeShape,
  LaunchedTheme,
  PricingTier,
  ColorScheme,
  SchemePreference,
} from "./constants";

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
  JOURNEY_ORDER,
  JOURNEY_NODES,
  SPINES,
  getJourneyNode,
  getArrivesFrom,
  getLeadsTo,
  getSpineStops,
  recommendedNextTheme,
} from "./journey";
export type { JourneyNode, Spine, SpineStop } from "./journey";
