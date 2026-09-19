/**
 * @tensorcraft/shared
 *
 * Shared types, utilities, and constants used across apps and packages.
 */

export {
  WORLD_SLUGS,
  LAUNCHED_WORLDS,
  COMING_SOON_WORLDS,
  PRICING,
  ROUTES,
  WORLD_CONTENT,
  WORLD_SHAPE,
  getWorldTotalLessons,
  EXERCISE_CONTENT,
  DEFAULT_WORLD,
  getModuleLessonCount,
  getPaidLessonCount,
  isValidWorldSlug,
  isValidSlug,
  isLaunched,
  isComingSoon,
  SCHEME_STORAGE_KEY,
  isColorScheme,
} from "./constants";
export type {
  WorldSlug,
  WorldShape,
  LaunchedWorld,
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
  recommendedNextWorld,
} from "./journey";
export type { JourneyNode, Spine, SpineStop } from "./journey";

export { selectDue, nextInterval } from "./review-schedule";
export type {
  ReviewItem,
  ResolvedReviewItem,
  ReviewOutcome,
  ScheduleResult,
  ReviewStore,
} from "./review-types";

export * from "./project-export";
export * from "./learning-route";

export * from "./story-decisions";
export * from "./learning-activity";
export * from "./curriculum";
