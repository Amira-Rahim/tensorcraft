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
  EXPERIMENT_STARTED: "experiment_started",
  LEARNING_ROUTE_SELECTED: "learning_route_selected",
  EXPERIMENT_SUBMITTED: "experiment_submitted",
  // Added 2026-09-04 (lesson-format audit): the funnel between
  // lesson_started and lesson_completed was invisible - no way to know
  // whether anyone reads any step or where readers quit. Fires on every
  // step entry, including the initial mount and back-navigation.
  LESSON_STEP_VIEWED: "lesson_step_viewed",
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
  // Added 2026-08-24: /learn gained free-lesson CTAs with the story-driven
  // redesign, and no marketing surface had ever measured the free-start
  // click. Deliberately separate from UPGRADE_CTA_* (paid intent); this one
  // opens the activation funnel that LESSON_STARTED continues.
  FREE_LESSON_CTA_CLICKED: "free_lesson_cta_clicked",
  // Added 2026-08-25 with the /learn trailer hero: measures whether the
  // trailer earns its slot (loop = ambient hero playback began; full = the
  // visitor chose the 90-second cut).
  TRAILER_PLAYED: "learn_trailer_played",
  // Added 2026-08-29 with the world-page trailer band. A separate event
  // from learn_trailer_played (different film, different surface) so the
  // /learn cohorts stay clean. No loop mode here by design: the world
  // backdrop already animates, so the band is poster-only at rest.
  WORLD_TRAILER_PLAYED: "world_trailer_played",

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

  // Story pacing. The content-QA rule ">40% skip triggers narrative redesign"
  // (post-launch-backlog §2, dev-plan §10c risk #1) was uncomputable until
  // this event existed. 2026-09-04: `via` added because the 2026-08-23
  // skip-preference change made the metric structurally biased low - the
  // remembered preference auto-skipped every later scene with no event, and
  // paging past a playing scene with Continue was never counted. Skip rate =
  // skipped(all vias) / (skipped + finished).
  SCRIPT_SKIPPED: "script_skipped",
  // The denominator: the scene played to its natural end. Absent for
  // reduced-motion visitors, whose scenes never play - exclude them from
  // skip-rate math rather than counting them either way.
  SCRIPT_FINISHED: "script_finished",

  // Scene clips (2026-09-04 owner ruling: launch ships with video).
  // Played fires per playback start; completed fires when the clip
  // reaches its natural end. Both scoped to the Briefing's art slot.
  SCENE_CLIP_PLAYED: "scene_clip_played",
  SCENE_CLIP_COMPLETED: "scene_clip_completed",

  // Consent. Fired once per browser at the moment analytics first becomes
  // active after acceptance. The decline side deliberately emits nothing
  // (the banner promises analytics only on accept); read the opt-in rate as
  // consent_granted uniques over log-drain unique visitors.
  CONSENT_GRANTED: "consent_granted",

  // Engagement
  CODE_PUSHED: "code_pushed",
  WORLD_SELECTED: "world_selected",
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
  [EVENTS.LEARNING_ROUTE_SELECTED]: {
    worldId: string;
    route: "guided" | "challenge";
    source: "world" | "lesson" | "settings";
    persistence: "account" | "browser";
  };
  [EVENTS.EXPERIMENT_STARTED]: {
    worldId: string;
    lessonId: string;
    experimentId: string;
    contentVersion: number;
  };
  [EVENTS.EXPERIMENT_SUBMITTED]: EventProperties[typeof EVENTS.EXPERIMENT_STARTED] & {
    phase: "prediction" | "changed_case";
    attempt: number;
    correct: boolean;
    assisted: boolean;
  };
  [EVENTS.LESSON_STARTED]: {
    worldId: string;
    moduleId: string;
    lessonId: string;
  };
  [EVENTS.LESSON_STEP_VIEWED]: {
    worldId: string;
    moduleId: string;
    lessonId: string;
    /** Version 2: Briefing 0, Concept 1, Challenge 2, Takeaways 3,
     * Consequence 4. Legacy events: Briefing 0, Concept 1, Code 2,
     * Challenge 3, Takeaways 4, Consequence 5. */
    step: number;
    stepName: string;
    /** Absent on historical six-step events; 2 is the five-step reader. */
    stepsVersion?: 2;
    /** The step just left; absent on the first view after mount. */
    prevStep?: number;
    /** Dwell on the step just left, ms; absent on the first view. */
    prevStepMs?: number;
    /** True when this step was already visited (back-nav, or a restored
     *  position revisiting ground covered in an earlier session). */
    revisit: boolean;
    /**
     * Which Briefing this lesson serves this browser: clip (scene video
     * in the art slot) or text (still + text reveal, the holdback
     * control or a lesson with no shipped clip). Launch-window analysis
     * splits on it.
     */
    briefingVariant?: "clip" | "text";
  };
  [EVENTS.LESSON_COMPLETED]: {
    worldId: string;
    moduleId: string;
    lessonId: string;
    /** Ms from this session's lesson mount to the Epilogue transition.
     *  Sessions that resume mid-lesson under-report total lesson time;
     *  sum lesson_step_viewed.prevStepMs across sessions for the truth. */
    durationMs?: number;
    /** Distinct hint levels revealed this session (0-3). */
    hintsUsed?: number;
  };
  [EVENTS.EXERCISE_ATTEMPTED]: {
    worldId: string;
    lessonId: string;
    exerciseSlug: string;
    passed: boolean;
    score: number;
    hintsUsed?: number;
    /** Ms from the editor becoming interactive to this graded run. */
    durationMs?: number;
    /** True when the run crashed or timed out instead of grading. */
    errored?: boolean;
  };
  [EVENTS.EXERCISE_COMPLETED]: {
    worldId: string;
    lessonId: string;
    exerciseSlug: string;
    score: number;
    hintsUsed?: number;
  };
  [EVENTS.HINT_REQUESTED]: {
    exerciseSlug?: string;
    lessonId?: string;
    worldId?: string;
    /** 1 = nudge, 2 = guidance, 3 = solution */
    hintLevel: 1 | 2 | 3;
  };
  [EVENTS.CHECKPOINT_SUBMITTED]: {
    worldId?: string;
    lessonId?: string;
    checkpointId?: string;
    passed: boolean;
    attempts: number;
  };
  [EVENTS.RECALL_ANSWERED]: {
    worldId?: string;
    lessonId?: string;
    /** What the user did with the prompt. */
    action: "attempted" | "bailed" | "got-it" | "review";
  };
  [EVENTS.MODULE_COMPLETED]: {
    worldId: string;
    moduleId: string;
    lessonsCount: number;
  };

  [EVENTS.PRICING_PAGE_VIEWED]: {
    /** How the user arrived at /pricing (direct, paywall redirect, etc.) */
    source?: "direct" | "paywall" | "dashboard" | "landing" | "upgrade_cta";
    /** Populated when the user was redirected from a locked world. */
    lockedWorldId?: string;
  };
  [EVENTS.PLAN_SELECTED]: {
    planId: string;
    worldIds: string[];
    price: number;
  };
  [EVENTS.CHECKOUT_STARTED]: {
    planId: string;
    worldIds?: string[];
    price?: number;
  };
  [EVENTS.PAYMENT_COMPLETED]: {
    planId: string;
    worldIds: string[];
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
    worldId: string;
    moduleId: string;
    lessonId?: string;
  };
  [EVENTS.UPGRADE_CTA_SHOWN]: {
    source: "paywall" | "pricing" | "dashboard" | "lesson_footer";
    worldId?: string;
  };
  [EVENTS.UPGRADE_CTA_CLICKED]: {
    source: "paywall" | "pricing" | "dashboard" | "lesson_footer";
    worldId?: string;
  };
  [EVENTS.FREE_LESSON_CTA_CLICKED]: {
    /**
     * Placement of the clicked free-lesson CTA. Landing and pricing adopted
     * the tracker 2026-11-02 so the funnel can compare entry points.
     */
    source:
      | "learn_hero"
      | "learn_footer"
      | "world_trailer_endcard"
      | "landing_hero"
      | "landing_footer"
      | "pricing_footer";
  };
  [EVENTS.TRAILER_PLAYED]: {
    /** loop = silent hero loop began; full = the lightbox 90s cut opened. */
    mode: "loop" | "full";
  };
  [EVENTS.WORLD_TRAILER_PLAYED]: {
    worldId: string;
    /** Only the lightbox cut exists on world pages; kept for parity. */
    mode: "full";
  };

  /**
   * Signup funnel. `method` distinguishes the OAuth paths from the magic
   * link, which matters because the magic link is the one that forces the
   * buyer out to an inbox - its drop-off should be read separately.
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
    yearsExperience?: number;
  };

  [EVENTS.SCRIPT_SKIPPED]: {
    worldId: string;
    lessonId: string;
    /** 0-based lesson step the script was skipped on. */
    step: number;
    /** How long the learner watched before skipping, in milliseconds. */
    elapsedMs: number;
    /**
     * button = the Skip intro control; continue = paged past a playing
     * scene with Continue (or swipe); auto = the remembered skip
     * preference suppressed playback before it began (elapsedMs 0).
     */
    via: "button" | "continue" | "auto";
    briefingVariant?: "clip" | "text";
  };
  [EVENTS.SCRIPT_FINISHED]: {
    worldId: string;
    lessonId: string;
    step: number;
    /** Full playback duration, ms. */
    elapsedMs: number;
    /** auto = the once-per-visit autoplay; replay = the Replay control. */
    run: "auto" | "replay";
    briefingVariant?: "clip" | "text";
  };

  [EVENTS.SCENE_CLIP_PLAYED]: {
    worldId: string;
    lessonId: string;
    /** auto = eligible autoplay on the Briefing; manual = the play control. */
    trigger: "auto" | "manual";
  };
  [EVENTS.SCENE_CLIP_COMPLETED]: {
    worldId: string;
    lessonId: string;
    /** Playback position at the ended event, ms. */
    watchedMs: number;
  };

  [EVENTS.CONSENT_GRANTED]: {
    source: "banner";
  };

  [EVENTS.CODE_PUSHED]: {
    worldId: string;
    lessonId: string;
    exerciseSlug: string;
    /** Resulting commit SHA from GitHub. */
    commitSha: string;
  };
  [EVENTS.WORLD_SELECTED]: {
    worldId: string;
    source: "onboarding" | "worlds_grid" | "dashboard" | "settings";
  };
  [EVENTS.PROGRESS_SHARED]: {
    platform: "twitter" | "linkedin" | "copy" | "other";
    worldId?: string;
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
    worldId: string;
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
