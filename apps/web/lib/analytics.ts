/**
 * Back-compat domain helpers that wrap the type-safe {@link track}
 * function from `./analytics-events`.
 *
 * New call sites should import {@link track} + {@link EVENTS} directly.
 * This file exists so previously-wired sites (lesson-progress, onboarding,
 * checkout-button, etc.) keep working without churn.
 */

import posthog from "posthog-js";
import { EVENTS, track } from "./analytics-events";

/**
 * Generic event capture, wraps posthog.capture with a guard.
 * No-ops on the server and when PostHog is not initialized.
 *
 * Prefer {@link track} for new code, it is type-safe per Appendix B.
 */
export function capture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  posthog?.capture(event, properties);
}

/**
 * Identify a user, wraps posthog.identify with a guard.
 * Call after login or signup so events are attributed to the user.
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  posthog?.identify(userId, traits);
}

// Re-export the typed primitives for convenience.
export { EVENTS, track } from "./analytics-events";
export type { EventName, EventProperties } from "./analytics-events";

/* ── Domain-specific helpers (back-compat) ── */

export function trackLessonStarted(
  themeId: string,
  moduleId: string,
  lessonId: string,
) {
  track(EVENTS.LESSON_STARTED, { themeId, moduleId, lessonId });
}

export function trackLessonCompleted(
  themeId: string,
  moduleId: string,
  lessonId: string,
  durationMs?: number,
) {
  track(EVENTS.LESSON_COMPLETED, { themeId, moduleId, lessonId, durationMs });
}

/**
 * Back-compat: pre-existing `exercise_submitted` call sites. Now routes
 * through the typed {@link EVENTS.EXERCISE_ATTEMPTED} and, on pass, also
 * emits {@link EVENTS.EXERCISE_COMPLETED}.
 */
export function trackExerciseSubmitted(
  themeId: string,
  lessonId: string,
  passed: boolean,
  score: number,
  exerciseSlug: string = "unknown",
  hintsUsed?: number,
) {
  track(EVENTS.EXERCISE_ATTEMPTED, {
    themeId,
    lessonId,
    exerciseSlug,
    passed,
    score,
    hintsUsed,
  });
  if (passed) {
    track(EVENTS.EXERCISE_COMPLETED, {
      themeId,
      lessonId,
      exerciseSlug,
      score,
      hintsUsed,
    });
  }
}

export function trackPaywallShown(
  themeId: string,
  moduleId: string,
  lessonId?: string,
) {
  track(EVENTS.PAYWALL_HIT, { themeId, moduleId, lessonId });
}

export function trackCheckoutStarted(planId: string) {
  track(EVENTS.CHECKOUT_STARTED, { planId });
}

/**
 * Back-compat: pre-existing `checkout_completed` client helper. Paired
 * with the server-side {@link EVENTS.PAYMENT_COMPLETED} event fired from
 * the Stripe webhook, the client event is for post-redirect UI tracking,
 * the server event is the authoritative revenue signal.
 */
export function trackCheckoutCompleted(planId: string, amount: number) {
  track(EVENTS.PAYMENT_COMPLETED, {
    planId,
    amount,
    themeIds: [],
  });
}

export function trackThemeSelected(
  themeId: string,
  source:
    | "onboarding"
    | "themes_grid"
    | "dashboard"
    | "settings" = "onboarding",
) {
  track(EVENTS.THEME_SELECTED, { themeId, source });
}

export function trackStreakAchieved(streakDays: number) {
  track(EVENTS.STREAK_ACHIEVED, { streakDays });
}

export function trackHintRequested(
  hintLevel: 1 | 2 | 3,
  context?: { themeId?: string; lessonId?: string; exerciseSlug?: string },
) {
  track(EVENTS.HINT_REQUESTED, {
    hintLevel,
    themeId: context?.themeId,
    lessonId: context?.lessonId,
    exerciseSlug: context?.exerciseSlug,
  });
}

export function trackCheckpointSubmitted(
  passed: boolean,
  attempts: number,
  context?: {
    themeId?: string;
    lessonId?: string;
    checkpointId?: string;
  },
) {
  track(EVENTS.CHECKPOINT_SUBMITTED, {
    passed,
    attempts,
    themeId: context?.themeId,
    lessonId: context?.lessonId,
    checkpointId: context?.checkpointId,
  });
}

export function trackRecallAnswered(
  action: "revealed" | "hidden" | "got-it" | "review",
  context?: { themeId?: string; lessonId?: string },
) {
  track(EVENTS.RECALL_ANSWERED, {
    action,
    themeId: context?.themeId,
    lessonId: context?.lessonId,
  });
}

export function trackPricingPageViewed(
  source?: "direct" | "paywall" | "dashboard" | "landing" | "upgrade_cta",
  lockedThemeId?: string,
) {
  track(EVENTS.PRICING_PAGE_VIEWED, { source, lockedThemeId });
}

export function trackModuleCompleted(
  themeId: string,
  moduleId: string,
  lessonsCount: number,
) {
  track(EVENTS.MODULE_COMPLETED, { themeId, moduleId, lessonsCount });
}
