/**
 * Spaced review writes (stage 1, 2026-09-16).
 *
 * The write half of the review queue. Reads happen server-side in the Next
 * app (`apps/web/lib/review-store-server.ts`); this route only records what
 * the learner did and schedules what comes next. Spec:
 * docs/superpowers/specs/2026-09-15-spaced-review-design.md.
 *
 * WHAT THIS ROUTE DOES NOT DO, all deliberate:
 *
 * - It does not validate `lessonId` or `moduleId` against the content build.
 *   apps/api has no `@tensorcraft/content` dependency, and adding one would
 *   buy nothing: migration 061 grants each learner INSERT and UPDATE on their
 *   own rows, and they hold the public anon key plus their own JWT, so they
 *   can write to `review_queue` through PostgREST without ever calling this
 *   route. Validation here would constrain only the attackers polite enough
 *   to use the front door. The read path treats every key as untrusted and is
 *   the authoritative gate. Spec section D.
 * - It does no interval math. Every date on the record path comes from
 *   `nextInterval`, which is owner-authored and the single place the policy
 *   lives, so guests and signed-in learners run one curve. The single
 *   exception is the one-day first-due offset on enqueue, which the spec
 *   mandates and which `nextInterval` cannot produce because there is no
 *   prior item to grow an interval from.
 * - It emits no `skill_events` row. `review_recall` still carries a weight of
 *   1 in the live `compute_user_skill_genome` (migration 055 line 62), so
 *   resuming emission would move the Genome of every learner who reviews
 *   before anyone has decided that is intended. Spec Departures item 4.
 *
 * Writes go through `getSupabaseServerClient(token)`, which is built on the
 * service-role key but spreads the caller's JWT as the Authorization header,
 * so PostgREST resolves the role from that JWT and RLS is enforced. Row
 * ownership always comes from `c.get("userId")`, never from the body.
 */

import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import {
  isValidWorldSlug,
  isValidSlug,
  nextInterval,
} from "@tensorcraft/shared";
import type { ReviewItem, ReviewOutcome } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const review = new Hono<AppEnv>();

review.use("*", authMiddleware);

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The conflict target names exactly the primary key of `review_queue`
 * (migration 061). `module_id` is a non-key column on this table, and naming
 * it raises Postgres 42P10, "no unique or exclusion constraint matching the
 * ON CONFLICT specification".
 */
const REVIEW_QUEUE_PK = "user_id,world_id,lesson_id,prompt_index";

/**
 * Upper bound on one enqueue call. The richest deep-orbit lesson carries
 * three recall prompts, so this is roomy by an order of magnitude and still
 * stops a single request writing an unbounded number of rows.
 */
const MAX_PROMPTS_PER_LESSON = 32;

const OUTCOMES: readonly ReviewOutcome[] = ["got-it", "review", "bailed"];

function isOutcome(value: unknown): value is ReviewOutcome {
  return (
    typeof value === "string" && (OUTCOMES as readonly string[]).includes(value)
  );
}

/**
 * `prompt_index` is an int4 in migration 061, so the column's own ceiling is
 * the bound. Past it Postgres raises a numeric overflow, which would surface
 * as a 500 on what is plainly bad input.
 */
function isPromptIndex(value: unknown): value is number {
  return (
    Number.isInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= 2_147_483_647
  );
}

/**
 * POST /api/review, record one retrieval attempt.
 *
 * Body: `{ worldId, lessonId, promptIndex, outcome }`. No `moduleId`: the key
 * is the four primary-key columns and nothing else, and accepting a fifth
 * field here would invite a later change to filter on it.
 *
 * A prompt with no row returns 404 and writes nothing, rather than creating
 * one. Enqueue is the only way into the queue, which keeps "what is due"
 * answerable, and the warm-up can only offer a prompt that the read path
 * already returned, so a missing row means the key did not come from the
 * queue. 404 is also distinguishable from 500, so the client outbox (spec
 * section H) can drop a permanently failing write instead of retrying it
 * forever.
 */
review.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: {
    worldId: string;
    lessonId: string;
    promptIndex: number;
    outcome: ReviewOutcome;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.worldId || !body.lessonId) {
    return c.json({ error: "worldId and lessonId are required" }, 400);
  }
  if (!isValidWorldSlug(body.worldId)) {
    return c.json({ error: "Invalid worldId" }, 400);
  }
  if (!isValidSlug(body.lessonId)) {
    return c.json({ error: "Invalid lessonId" }, 400);
  }
  if (!isPromptIndex(body.promptIndex)) {
    return c.json({ error: "promptIndex must be a non-negative integer" }, 400);
  }
  if (!isOutcome(body.outcome)) {
    return c.json(
      { error: `outcome must be one of ${OUTCOMES.join(", ")}` },
      400,
    );
  }

  const supabase = getSupabaseServerClient(token);

  const { data: existing, error: readError } = await supabase
    .from("review_queue")
    .select("module_id, pulls, successes, last_reviewed_at, next_review_at")
    .eq("user_id", userId)
    .eq("world_id", body.worldId)
    .eq("lesson_id", body.lessonId)
    .eq("prompt_index", body.promptIndex)
    .maybeSingle();

  if (readError) {
    return c.json(
      {
        error: "Failed to read review item",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // Also the answer when the row belongs to another user: RLS hides it, so
  // there is nothing to read and nothing to write.
  if (!existing) {
    return c.json({ error: "No review item for that key" }, 404);
  }

  const item: ReviewItem = {
    worldId: body.worldId,
    moduleId: existing.module_id,
    lessonId: body.lessonId,
    promptIndex: body.promptIndex,
    pulls: existing.pulls,
    successes: existing.successes,
    lastReviewedAt: existing.last_reviewed_at,
    nextReviewAt: existing.next_review_at,
  };

  const now = new Date();
  const result = nextInterval(item, body.outcome, now);

  // UPDATE, not upsert: a missing row must stay missing, and the 404 above
  // has already ruled that case out.
  const { error: writeError } = await supabase
    .from("review_queue")
    .update({
      pulls: result.pulls,
      successes: result.successes,
      last_reviewed_at: now.toISOString(),
      next_review_at: result.nextReviewAt,
    })
    .eq("user_id", userId)
    .eq("world_id", body.worldId)
    .eq("lesson_id", body.lessonId)
    .eq("prompt_index", body.promptIndex);

  if (writeError) {
    return c.json(
      {
        error: "Failed to record review",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ review: result });
});

/**
 * POST /api/review/enqueue, add a lesson's recall prompts to the queue.
 *
 * Body: `{ worldId, moduleId, lessonId, promptIndices }`. An explicit list of
 * indices rather than a count, because `parseRecallPrompts` advances its
 * counter past a prompt it fails to parse, so the indices in the content are
 * not guaranteed contiguous. A count would synthesize 0..n-1, and any gap
 * would enqueue a key the read path drops while losing the key that exists.
 * The caller already holds the lesson's `recallPrompts`, so sending
 * `p.index` costs it nothing.
 *
 * Idempotent by design. Re-completing a lesson must never reset
 * `next_review_at`, which would cancel a schedule the learner has been
 * working through for weeks. See `ignoreDuplicates` below.
 *
 * The response carries no insert count on purpose: ON CONFLICT DO NOTHING
 * makes "rows actually created" unobservable without a second read, and the
 * caller does not need it.
 */
review.post("/enqueue", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: {
    worldId: string;
    moduleId: string;
    lessonId: string;
    promptIndices: number[];
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.worldId || !body.moduleId || !body.lessonId) {
    return c.json(
      { error: "worldId, moduleId, and lessonId are required" },
      400,
    );
  }
  if (!isValidWorldSlug(body.worldId)) {
    return c.json({ error: "Invalid worldId" }, 400);
  }
  if (!isValidSlug(body.moduleId)) {
    return c.json({ error: "Invalid moduleId" }, 400);
  }
  if (!isValidSlug(body.lessonId)) {
    return c.json({ error: "Invalid lessonId" }, 400);
  }
  if (!Array.isArray(body.promptIndices) || body.promptIndices.length === 0) {
    return c.json({ error: "promptIndices must be a non-empty array" }, 400);
  }
  if (body.promptIndices.length > MAX_PROMPTS_PER_LESSON) {
    return c.json(
      { error: `promptIndices exceeds ${MAX_PROMPTS_PER_LESSON} entries` },
      400,
    );
  }
  if (!body.promptIndices.every(isPromptIndex)) {
    return c.json(
      { error: "promptIndices must hold non-negative integers" },
      400,
    );
  }

  const supabase = getSupabaseServerClient(token);

  // First due one day out (spec section G.1), matching the guest store. This
  // is the one date in the file that does not come from `nextInterval`: a
  // never-pulled item has no interval to grow.
  const nextReviewAt = new Date(Date.now() + DAY_MS).toISOString();

  const rows = [...new Set(body.promptIndices)].map((promptIndex) => ({
    user_id: userId,
    world_id: body.worldId,
    module_id: body.moduleId,
    lesson_id: body.lessonId,
    prompt_index: promptIndex,
    pulls: 0,
    successes: 0,
    last_reviewed_at: null,
    next_review_at: nextReviewAt,
  }));

  const { error } = await supabase.from("review_queue").upsert(rows, {
    onConflict: REVIEW_QUEUE_PK,
    // ON CONFLICT DO NOTHING. supabase-js defaults this to false, which sends
    // `Prefer: resolution=merge-duplicates` and becomes ON CONFLICT DO
    // UPDATE, overwriting `next_review_at` on every re-completion. Migration
    // 061 grants UPDATE (the record path needs it), so RLS no longer blocks
    // that merge by accident and the intent has to be explicit here.
    ignoreDuplicates: true,
  });

  if (error) {
    return c.json(
      {
        error: "Failed to enqueue reviews",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ ok: true }, 201);
});

export { review };
