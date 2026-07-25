/**
 * Analytics Event Taxonomy, canonical, type-safe registry of every
 * product event fired from the Tensorcraft web client.
 *
 * Source of truth: `docs/dev-plan.md` Appendix B + PRD 4.7.
 *
 * Design rules:
 *  - Event names are `snake_case` (PostHog convention).
 *  - Properties are flat, JSON-serializable primitives.
 *  - No PII (email, full name), user IDs (UUIDs) are fine.
 *  - Adding a new event = append to {@link EVENTS} + its matching
 *    entry in the {@link EventProperties} interface. TypeScript will
 *    then force call sites to pass the correct payload.
 *
 * See also:
 *  - `apps/web/lib/posthog.ts`, init / consent-gated capture
 *  - `apps/api/src/lib/posthog.ts`, server-side captures (webhook)
 *  - `docs/analytics-verification.md`, per-event verification checklist
 */

import { capture } from "./posthog";

// ──────────────────────────────────────────────
// Canonical event-name registry
// ──────────────────────────────────────────────

export const EVENTS = {
  // Learning
  LESSON_STARTED: "lesson_started",
  LESSON_COMPLETED: "lesson_completed",
  EXERCISE_ATTEMPTED: "exercise_attempted",
  EXERCISE_COMPLETED: "exercise_completed",
  HINT_REQUESTED: "hint_requested",
  CHECKPOINT_SUBMITTED: "checkpoint_submitted",
  RECALL_ANSWERED: "recall_answered",
  MODULE_COMPLETED: "module_completed",

  // Conversion
  PRICING_PAGE_VIEWED: "pricing_page_viewed",
  PLAN_SELECTED: "plan_selected",
  CHECKOUT_STARTED: "checkout_started",
  PAYMENT_COMPLETED: "payment_completed",
  PAYMENT_FAILED: "payment_failed",
  PAYWALL_HIT: "paywall_hit",
  UPGRADE_CTA_SHOWN: "upgrade_cta_shown",
  UPGRADE_CTA_CLICKED: "upgrade_cta_clicked",

  // Signup funnel.
  // Added 2026-07-21: the auth screen previously emitted NOTHING, so the
  // single most important step between a visitor and a customer was
  // unmeasurable. That is untenable going into a paid-distribution phase,
  // where the top of the funnel is exactly what spend is judged on.
  SIGNUP_STARTED: "signup_started",
  MAGIC_LINK_SENT: "magic_link_sent",
  SIGNUP_COMPLETED: "signup_completed",
  SIGNUP_FAILED: "signup_failed",

  // Onboarding funnel
  ONBOARDING_STEP_VIEWED: "onboarding_step_viewed",
  ONBOARDING_COMPLETED: "onboarding_completed",

  // Canonical journey (R3-6: shipped dark 2026-07-24; instrumented 2026-07-25)
  JOURNEY_ENROLLED: "journey_enrolled",

  // Story pacing. The content-QA rule ">40% skip triggers narrative redesign"
  // (post-launch-backlog §2, dev-plan §10c risk #1) was uncomputable until
  // this event existed.
  SCRIPT_SKIPPED: "script_skipped",

  // Engagement
  CODE_PUSHED: "code_pushed",
  THEME_SELECTED: "theme_selected",
  PROGRESS_SHARED: "progress_shared",
  SESSION_STARTED: "session_started",
  SESSION_ENDED: "session_ended",
  STREAK_ACHIEVED: "streak_achieved",

  // Digest / blog (browser-ML news pipeline)
  DIGEST_PUBLISHED: "digest_published",
  DIGEST_LINK_CLICKED: "digest_link_clicked",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ──────────────────────────────────────────────
// Per-event property contracts
// ──────────────────────────────────────────────

export interface EventProperties {
  [EVENTS.LESSON_STARTED]: {
    themeId: string;
    moduleId: string;
    lessonId: string;
  };
  [EVENTS.LESSON_COMPLETED]: {
    themeId: string;
    moduleId: string;
    lessonId: string;
    /** Optional time-on-lesson (ms). Absent when not instrumented. */
    durationMs?: number;
    /** Number of hints revealed before completion, if tracked. */
    hintsUsed?: number;
  };
  [EVENTS.EXERCISE_ATTEMPTED]: {
    themeId: string;
    lessonId: string;
    exerciseSlug: string;
    passed: boolean;
    score: number;
    hintsUsed?: number;
  };
  [EVENTS.EXERCISE_COMPLETED]: {
    themeId: string;
    lessonId: string;
    exerciseSlug: string;
    score: number;
    hintsUsed?: number;
  };
  [EVENTS.HINT_REQUESTED]: {
    exerciseSlug?: string;
    lessonId?: string;
    themeId?: string;
    /** 1 = nudge, 2 = guidance, 3 = solution */
    hintLevel: 1 | 2 | 3;
  };
  [EVENTS.CHECKPOINT_SUBMITTED]: {
    themeId?: string;
    lessonId?: string;
    checkpointId?: string;
    passed: boolean;
    attempts: number;
  };
  [EVENTS.RECALL_ANSWERED]: {
    themeId?: string;
    lessonId?: string;
    /** What the user did with the prompt. */
    action: "revealed" | "hidden" | "got-it" | "review";
  };
  [EVENTS.MODULE_COMPLETED]: {
    themeId: string;
    moduleId: string;
    lessonsCount: number;
  };

  [EVENTS.PRICING_PAGE_VIEWED]: {
    /** How the user arrived at /pricing (direct, paywall redirect, etc.) */
    source?: "direct" | "paywall" | "dashboard" | "landing" | "upgrade_cta";
    /** Populated when the user was redirected from a locked theme. */
    lockedThemeId?: string;
  };
  [EVENTS.PLAN_SELECTED]: {
    planId: string;
    themeIds: string[];
    price: number;
  };
  [EVENTS.CHECKOUT_STARTED]: {
    planId: string;
    themeIds?: string[];
    price?: number;
  };
  [EVENTS.PAYMENT_COMPLETED]: {
    planId: string;
    themeIds: string[];
    amount: number;
    /** Stripe checkout session id (cs_...). */
    sessionId?: string;
  };
  [EVENTS.PAYMENT_FAILED]: {
    planId?: string;
    /** Stripe failure reason / decline code, if available. */
    reason?: string;
    sessionId?: string;
  };
  [EVENTS.PAYWALL_HIT]: {
    themeId: string;
    moduleId: string;
    lessonId?: string;
  };
  [EVENTS.UPGRADE_CTA_SHOWN]: {
    source: "paywall" | "pricing" | "dashboard" | "lesson_footer";
    themeId?: string;
  };
  [EVENTS.UPGRADE_CTA_CLICKED]: {
    source: "paywall" | "pricing" | "dashboard" | "lesson_footer";
    themeId?: string;
  };

  /**
   * Signup funnel. `method` distinguishes the OAuth paths from the magic
   * link, which matters because the magic link is the one that forces the
   * buyer out to an inbox — its drop-off should be read separately.
   */
  [EVENTS.SIGNUP_STARTED]: {
    method: "github" | "google" | "magic_link";
  };
  [EVENTS.MAGIC_LINK_SENT]: {
    method: "magic_link";
  };
  /**
   * Closes the funnel opened by SIGNUP_STARTED. `method` comes from Supabase
   * `app_metadata.provider`, so it is whatever actually established the
   * session rather than what the user first clicked.
   */
  [EVENTS.SIGNUP_COMPLETED]: {
    method: string;
  };
  [EVENTS.SIGNUP_FAILED]: {
    method: "github" | "google" | "magic_link";
  };

  [EVENTS.ONBOARDING_STEP_VIEWED]: {
    /** 1-based step number, matching the on-screen "STEP N OF 4" label. */
    step: number;
    stepName: "Welcome" | "Background" | "Goal" | "Ready";
  };
  [EVENTS.ONBOARDING_COMPLETED]: {
    experienceLevel: string;
    learningGoal: string;
    framework?: string;
    yearsExperience?: number;
  };

  [EVENTS.JOURNEY_ENROLLED]: {
    /** Where the enroll came from; only /journey exists today. */
    source: "journey_page";
  };
  [EVENTS.SCRIPT_SKIPPED]: {
    themeId: string;
    lessonId: string;
    /** 0-based lesson step the script was skipped on. */
    step: number;
    /** How long the learner watched before skipping, in milliseconds. */
    elapsedMs: number;
  };

  [EVENTS.CODE_PUSHED]: {
    themeId: string;
    lessonId: string;
    exerciseSlug: string;
    /** Resulting commit SHA from GitHub. */
    commitSha: string;
  };
  [EVENTS.THEME_SELECTED]: {
    themeId: string;
    source: "onboarding" | "themes_grid" | "dashboard" | "settings";
  };
  [EVENTS.PROGRESS_SHARED]: {
    platform: "twitter" | "linkedin" | "copy" | "other";
    themeId?: string;
  };
  [EVENTS.SESSION_STARTED]: {
    /** Client-generated correlation id shared with the matching session_ended. */
    sessionId: string;
    /** Optional, absent on anonymous sessions. */
    userId?: string;
  };
  [EVENTS.SESSION_ENDED]: {
    sessionId: string;
    /** Wall-clock duration from mount to end event, in milliseconds. */
    durationMs: number;
    userId?: string;
  };
  [EVENTS.STREAK_ACHIEVED]: {
    streakDays: number;
  };
  [EVENTS.DIGEST_PUBLISHED]: {
    /** ISO week label, e.g. "2026-W18". */
    weekIso: string;
    /** Blog post slug. */
    postSlug: string;
    /** How many news items the post covers. */
    itemCount: number;
  };
  [EVENTS.DIGEST_LINK_CLICKED]: {
    /** Blog post slug the click originated from. */
    postSlug: string;
    /** Lesson slug the user clicked through to. */
    lessonSlug: string;
    moduleId: string;
    themeId: string;
    /** ISO week label (used as utm_campaign). */
    weekIso?: string;
  };
}

// ──────────────────────────────────────────────
// Typed capture helper
// ──────────────────────────────────────────────

/**
 * Emit a typed analytics event to PostHog.
 *
 * Type-safe: the compiler rejects unknown event names and mismatched
 * property shapes. No-ops when PostHog is not initialized (dev without
 * a key, SSR, before init runs).
 */
export function track<K extends EventName>(
  event: K,
  properties: EventProperties[K],
): void {
  capture(event, properties as Record<string, unknown>);
}
