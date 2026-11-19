/**
 * Back-compat domain helpers that wrap the type-safe {@link track}
 * function from `./analytics-events`.
 *
 * New call sites should import {@link track} + {@link EVENTS} directly.
 * This file exists so previously-wired sites (lesson-progress, onboarding,
 * checkout-button, etc.) keep working without churn.
 */

import { EVENTS, track } from "./analytics-events";
import {
  capture as capturePostHog,
  identify as identifyPostHog,
  reset as resetPostHog,
} from "./posthog";

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
  capturePostHog(event, properties);
}

/**
 * Identify a user, wraps posthog.identify with a guard.
 * Call after login or signup so events are attributed to the user.
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  identifyPostHog(userId, traits);
}

/** Clear the browser's PostHog identity after a completed sign-out. */
export function reset(): void {
  resetPostHog();
}

// Re-export the typed primitives for convenience.
export { EVENTS, track } from "./analytics-events";
export type { EventName, EventProperties } from "./analytics-events";

/* ── Domain-specific helpers (back-compat) ── */

export function trackLessonStarted(
  worldId: string,
  moduleId: string,
  lessonId: string,
) {
  track(EVENTS.LESSON_STARTED, { worldId, moduleId, lessonId });
}

export function trackLessonCompleted(
  worldId: string,
  moduleId: string,
  lessonId: string,
  durationMs?: number,
  hintsUsed?: number,
) {
  track(EVENTS.LESSON_COMPLETED, {
    worldId,
    moduleId,
    lessonId,
    durationMs,
    hintsUsed,
  });
}

/**
 * Back-compat: pre-existing `exercise_submitted` call sites. Now routes
 * through the typed {@link EVENTS.EXERCISE_ATTEMPTED} and, on pass, also
 * emits {@link EVENTS.EXERCISE_COMPLETED}.
 */
export function trackExerciseSubmitted(
  worldId: string,
  lessonId: string,
  passed: boolean,
  score: number,
  exerciseSlug: string = "unknown",
  hintsUsed?: number,
  durationMs?: number,
  errored?: boolean,
) {
  track(EVENTS.EXERCISE_ATTEMPTED, {
    worldId,
    lessonId,
    exerciseSlug,
    passed,
    score,
    hintsUsed,
    durationMs,
    errored,
  });
  if (passed) {
    track(EVENTS.EXERCISE_COMPLETED, {
      worldId,
      lessonId,
      exerciseSlug,
      score,
      hintsUsed,
    });
  }
}

// `trackPaywallShown` used to live here. It was removed once its only caller
// (<LessonPaywall>) was deleted: the lesson route enforces the paywall by
// redirecting, so a component-mount helper could never fire and `paywall_hit`
// silently recorded nothing. <PaywallNotice> on /pricing now fires the event
// directly at the redirect target. Do not reintroduce a mount-based helper
// without a component that actually renders at the gate.

export function trackCheckoutStarted(planId: string) {
  track(EVENTS.CHECKOUT_STARTED, { planId });
}

export function trackWorldSelected(
  worldId: string,
  source:
    "onboarding" | "worlds_grid" | "dashboard" | "settings" = "onboarding",
) {
  track(EVENTS.WORLD_SELECTED, { worldId, source });
}

export function trackStreakAchieved(streakDays: number) {
  track(EVENTS.STREAK_ACHIEVED, { streakDays });
}

export function trackHintRequested(
  hintLevel: 1 | 2 | 3,
  context?: { worldId?: string; lessonId?: string; exerciseSlug?: string },
) {
  track(EVENTS.HINT_REQUESTED, {
    hintLevel,
    worldId: context?.worldId,
    lessonId: context?.lessonId,
    exerciseSlug: context?.exerciseSlug,
  });
}

export function trackCheckpointSubmitted(
  passed: boolean,
  attempts: number,
  context?: {
    worldId?: string;
    lessonId?: string;
    checkpointId?: string;
  },
) {
  track(EVENTS.CHECKPOINT_SUBMITTED, {
    passed,
    attempts,
    worldId: context?.worldId,
    lessonId: context?.lessonId,
    checkpointId: context?.checkpointId,
  });
}

export function trackRecallAnswered(
  action: "attempted" | "bailed" | "got-it" | "review",
  context?: { worldId?: string; lessonId?: string },
) {
  track(EVENTS.RECALL_ANSWERED, {
    action,
    worldId: context?.worldId,
    lessonId: context?.lessonId,
  });
}

export function trackPricingPageViewed(
  source?: "direct" | "paywall" | "dashboard" | "landing" | "upgrade_cta",
  lockedWorldId?: string,
) {
  track(EVENTS.PRICING_PAGE_VIEWED, { source, lockedWorldId });
}

export function trackModuleCompleted(
  worldId: string,
  moduleId: string,
  lessonsCount: number,
) {
  track(EVENTS.MODULE_COMPLETED, { worldId, moduleId, lessonsCount });
}
