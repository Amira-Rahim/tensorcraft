import posthog from "posthog-js";

/**
 * Generic event capture — wraps posthog.capture with a guard.
 * No-ops on the server and when PostHog is not initialized.
 */
export function capture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  posthog?.capture(event, properties);
}

/**
 * Identify a user — wraps posthog.identify with a guard.
 * Call after login or signup so events are attributed to the user.
 */
export function identify(
  userId: string,
  traits?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  posthog?.identify(userId, traits);
}

/* ── Domain-specific helpers ── */

export function trackLessonStarted(
  themeId: string,
  moduleId: string,
  lessonId: string,
) {
  capture("lesson_started", { themeId, moduleId, lessonId });
}

export function trackLessonCompleted(
  themeId: string,
  moduleId: string,
  lessonId: string,
) {
  capture("lesson_completed", { themeId, moduleId, lessonId });
}

export function trackExerciseSubmitted(
  themeId: string,
  lessonId: string,
  passed: boolean,
  score: number,
) {
  capture("exercise_submitted", { themeId, lessonId, passed, score });
}

export function trackPaywallShown(themeId: string, moduleId: string) {
  capture("paywall_shown", { themeId, moduleId });
}

export function trackCheckoutStarted(planId: string) {
  capture("checkout_started", { planId });
}

export function trackCheckoutCompleted(planId: string, amount: number) {
  capture("checkout_completed", { planId, amount });
}

export function trackThemeSelected(themeId: string) {
  capture("theme_selected", { themeId });
}

export function trackStreakAchieved(streakDays: number) {
  capture("streak_achieved", { streakDays });
}
