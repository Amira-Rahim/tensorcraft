import type { ReviewItem, ReviewOutcome, ScheduleResult } from "./review-types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Interval growth on a success. SM-2's value, and the one migration 027 used. */
const SUCCESS_MULTIPLIER = 2.5;

/**
 * Interval ceiling. 90 days matches the window compute_user_skill_genome
 * already sums over (migration 055), so the product looks back over one
 * horizon rather than two. It also keeps a well-known prompt in rotation
 * instead of letting 2.5x compound it past the life of the course: without
 * a cap the seventh success lands eight months out, which is retirement.
 */
const MAX_INTERVAL_MS = 90 * DAY_MS;

/**
 * A learner who attempted, missed, and then read the answer. A failed
 * retrieval followed by feedback still teaches, so this sits one day further
 * out than a non-attempt.
 */
const ATTEMPTED_MISS_MS = 2 * DAY_MS;

/**
 * A learner who pressed "I couldn't recall it". No retrieval happened, so
 * this is the hardest reset available. Keeping it distinct from an attempted
 * miss is the point of requiring a commit before reveal: the product paid
 * for that signal, so the schedule spends it.
 */
const NO_ATTEMPT_MS = DAY_MS;

/**
 * The interval policy: how long until a prompt comes back.
 *
 * The four numbers above were proposed by Claude and confirmed by the repo
 * owner on 2026-09-16, who delegated the choice after being shown the
 * trade-offs. They are a starting position, not a result: nobody has learner
 * data yet, and every one of them is a one-line change. Recording the
 * provenance because a reader otherwise cannot tell a deliberate choice from
 * an unexamined default.
 *
 * What was decided, and against what alternative:
 *   1. 2.5x on success. SM-2's value, and the one deleted migration 027 used,
 *      so the restore carries no unexplained change.
 *   2. An attempted miss resets to 2 days, a bail-out to 1. The simpler
 *      choice was to collapse them. Kept apart because the product added
 *      commit-before-reveal specifically to tell "attempted" from "did not",
 *      so the schedule should spend that signal rather than discard it.
 *   3. A 90-day ceiling, matching the window `compute_user_skill_genome`
 *      already sums over, so the product looks back over one horizon.
 *
 * NOTE, and confirm this is wanted: the multiplier compounds ELAPSED time,
 * not the scheduled interval. A 5-day item answered 40 days late schedules
 * 40 x 2.5, capped to 90, where textbook SM-2 would give 12.5. The argument
 * for elapsed is that recalling something after 40 days is evidence the
 * memory holds for 40 days, and the ceiling bounds the damage if that is
 * generous. The argument against is that one lucky late recall retires an
 * item. Cheap to flip: use the scheduled interval instead of `now - last`.
 *
 * Invariants the callers rely on:
 *   - `pulls` always increments by 1
 *   - `successes` increments only on a genuine success
 *   - the returned `nextReviewAt` is strictly after `now`
 */
export function nextInterval(
  item: ReviewItem,
  outcome: ReviewOutcome,
  now: Date,
): ScheduleResult {
  // The interval this item has just served, floored at one day so a same-day
  // re-review cannot collapse the schedule toward zero.
  const lastMs = item.lastReviewedAt ? Date.parse(item.lastReviewedAt) : null;
  const currentIntervalMs = lastMs
    ? Math.max(now.getTime() - lastMs, DAY_MS)
    : DAY_MS;

  let nextMs: number;
  if (outcome === "got-it") {
    nextMs = Math.min(currentIntervalMs * SUCCESS_MULTIPLIER, MAX_INTERVAL_MS);
  } else if (outcome === "review") {
    nextMs = ATTEMPTED_MISS_MS;
  } else {
    nextMs = NO_ATTEMPT_MS;
  }

  return {
    nextReviewAt: new Date(now.getTime() + nextMs).toISOString(),
    pulls: item.pulls + 1,
    successes: item.successes + (outcome === "got-it" ? 1 : 0),
  };
}

/** An item never pulled counts as fully unlearned, so it sorts ahead of a pulled one. */
function failureRate(item: ReviewItem): number {
  if (item.pulls <= 0) return 1;
  return 1 - item.successes / item.pulls;
}

/**
 * Due items, most overdue first, ties broken by failure rate (weakest first).
 * Deliberately NOT the epsilon-greedy bandit from the deleted migration 027:
 * see the spec's "Departures" item 1. Selection here is plain and explainable.
 */
export function selectDue(
  items: ReviewItem[],
  now: Date,
  limit: number,
): ReviewItem[] {
  const nowMs = now.getTime();
  return items
    .filter((i) => Date.parse(i.nextReviewAt) <= nowMs)
    .sort((a, b) => {
      const byDue = Date.parse(a.nextReviewAt) - Date.parse(b.nextReviewAt);
      if (byDue !== 0) return byDue;
      return failureRate(b) - failureRate(a);
    })
    .slice(0, Math.max(limit, 0));
}
