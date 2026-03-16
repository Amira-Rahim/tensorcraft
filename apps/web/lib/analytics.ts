import posthog from "posthog-js";

function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog?.capture(event, properties);
}

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
