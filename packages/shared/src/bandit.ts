/**
 * Bandit-driven spaced recall — algorithm module.
 *
 * Single source of truth for the ε-greedy scheduler that powers
 * Tensorcraft's review queue. Mirrored in SQL by:
 *   packages/supabase/migrations/027_review_queue.sql
 *     (review_queue_epsilon, get_review_queue, record_recall_attempt)
 *
 * Imported by:
 *   - apps/web/lib/review-client.ts (client-side scheduling preview)
 *   - packages/ui/src/visualizations/bandit-state.tsx (live lesson demo)
 *   - packages/content/content/terra-grid/ab-testing/05-multi-armed-bandits.mdx
 *     (lesson code samples — student reads the actual algorithm in use)
 *
 * If you change ε or the SM-2-lite multipliers here, change them in the
 * SQL migration too. The lesson explicitly states the values.
 */

/** ε for the review-queue ε-greedy selector. */
export const REVIEW_EPSILON = 0.15;

/** SM-2-lite success multiplier applied to the prior review interval. */
export const SM2_SUCCESS_MULTIPLIER = 2.5;

/** SM-2-lite fail interval — recall attempt failed, re-show within 24h. */
export const SM2_FAIL_INTERVAL_HOURS = 24;

/** Minimum interval used in the schedule computation. */
export const MIN_INTERVAL_HOURS = 24;

/** Cap on hours-since-review used in forgetting score (30 days). */
export const FORGETTING_HOURS_CAP = 24 * 30;

export interface BanditArm {
  themeId: string;
  moduleId: string;
  lessonId: string;
  armPulls: number;
  armSuccesses: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date;
  createdAt: Date;
}

export interface SelectedArm extends BanditArm {
  /** True if this arm was returned by the explore branch (random). */
  wasExplored: boolean;
}

/**
 * Forgetting score = (1 - success_rate) * hours_since_review (capped).
 * Higher = more likely to be forgotten = higher exploit priority.
 */
export function forgettingScore(arm: BanditArm, now: Date): number {
  const successRate = arm.armPulls === 0 ? 0 : arm.armSuccesses / arm.armPulls;
  const failureRate = 1 - successRate;
  const reference = arm.lastReviewedAt ?? arm.createdAt;
  const hoursSince = (now.getTime() - reference.getTime()) / (1000 * 60 * 60);
  const capped = Math.min(hoursSince, FORGETTING_HOURS_CAP);
  return failureRate * capped;
}

/**
 * ε-greedy selection over due arms.
 *
 * Per-arm Bernoulli: each arm independently rolls. With probability ε it
 * is "explored" (random key); else it is "exploited" (forgetting score).
 * Returns top `limit` arms sorted by their key descending.
 *
 * `rng` defaults to Math.random; pass a seeded RNG for deterministic tests.
 */
export function epsilonGreedy(
  arms: BanditArm[],
  options: {
    now: Date;
    limit: number;
    epsilon?: number;
    rng?: () => number;
  },
): SelectedArm[] {
  const eps = options.epsilon ?? REVIEW_EPSILON;
  const rng = options.rng ?? Math.random;
  const limit = Math.max(options.limit, 1);

  const due = arms.filter(
    (a) => a.nextReviewAt.getTime() <= options.now.getTime(),
  );

  const scored = due.map((arm) => {
    const explore = rng() < eps;
    const key = explore ? rng() : forgettingScore(arm, options.now);
    return { arm, explore, key };
  });

  scored.sort((a, b) => b.key - a.key);

  return scored.slice(0, limit).map(({ arm, explore }) => ({
    ...arm,
    wasExplored: explore,
  }));
}

/**
 * SM-2-lite next-review scheduler.
 *
 * Success → interval *= 2.5 (capped only by storage limits).
 * Fail    → interval = 24h (forces re-show tomorrow).
 *
 * `intervalHours` defaults to MIN_INTERVAL_HOURS if there's no prior
 * interval (first ever review). Mirrors SQL `record_recall_attempt`.
 */
export function nextReviewAt(args: {
  now: Date;
  lastReviewedAt: Date | null;
  createdAt: Date;
  success: boolean;
}): Date {
  const reference = args.lastReviewedAt ?? args.createdAt;
  const elapsedMs = args.now.getTime() - reference.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const intervalHours = Math.max(elapsedHours, MIN_INTERVAL_HOURS);

  const nextHours = args.success
    ? intervalHours * SM2_SUCCESS_MULTIPLIER
    : SM2_FAIL_INTERVAL_HOURS;

  return new Date(args.now.getTime() + nextHours * 60 * 60 * 1000);
}
