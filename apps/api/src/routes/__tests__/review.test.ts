/**
 * Spaced review write route (stage 1, 2026-09-16).
 *
 * Style follows `supabase-integration.test.ts`: each test drives the full
 * Hono request, auth middleware, handler, response pipeline against an
 * in-memory Supabase mock rather than a live instance.
 *
 * The mock is deliberately stricter than that file's, because two of the
 * three things worth testing here are properties of the WRITE ITSELF and
 * are invisible to a mock that accepts any upsert:
 *
 *   1. `ignoreDuplicates: true` must be passed. supabase-js defaults it to
 *      false, which sends `Prefer: resolution=merge-duplicates` and lands as
 *      ON CONFLICT DO UPDATE. That overwrites `next_review_at`, so
 *      re-completing a lesson would cancel the learner's schedule. Migration
 *      061 grants UPDATE (the route needs it to record outcomes), so RLS no
 *      longer denies the merge by accident. Here the mock merges when the
 *      flag is absent, which makes the idempotence test fail.
 *   2. The conflict target must name exactly the four primary-key columns.
 *      `module_id` is a non-key column, and naming it raises Postgres 42P10.
 *      The mock returns that error for any other target.
 *
 * RLS is simulated by making rows owned by another user invisible and
 * unwritable, which is what `auth.uid() = user_id` produces through the
 * JWT-scoped client the route builds.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { nextInterval } from "@tensorcraft/shared";
import type { ReviewItem, ReviewOutcome } from "@tensorcraft/shared";
import type { AppEnv } from "../../types";

type Row = Record<string, unknown>;

/** The primary key of `review_queue`, migration 061. */
const PK = ["user_id", "world_id", "lesson_id", "prompt_index"] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

const NOW = new Date("2026-09-16T12:00:00.000Z");

const db: { review_queue: Row[] } = { review_queue: [] };

/** The user the JWT resolves to, for RLS simulation. */
let currentAuthUserId: string | null = null;

/** Second argument of the last upsert, so both traps can be asserted directly. */
let lastUpsertOptions: Record<string, unknown> | undefined;

/**
 * Every `.eq()` the route issues, across all queries in a request.
 *
 * The mock simulates RLS in `visible()`, so a route that forgot its own
 * `.eq("user_id", ...)` would STILL pass the cross-user tests: the mock would
 * hide the row for it. That makes those tests a check on the mock rather than
 * on the route. Recording the filters lets a test assert the route scopes its
 * own queries, which is what actually has to be true in production where the
 * database, not a double, enforces RLS.
 */
let recordedFilters: Array<[string, unknown]> = [];

function buildQuery(table: "review_queue") {
  const filters: { field: string; value: unknown }[] = [];
  let pendingUpdate: Row | null = null;

  /** RLS: another user's rows are not visible and not writable. */
  function visible(): Row[] {
    return db[table].filter((r) => r.user_id === currentAuthUserId);
  }

  function matched(): Row[] {
    return visible().filter((r) =>
      filters.every((f) => r[f.field] === f.value),
    );
  }

  function run(): { data: Row[]; error: null } {
    const rows = matched();
    if (pendingUpdate) {
      for (const row of rows) Object.assign(row, pendingUpdate);
    }
    return { data: rows, error: null };
  }

  const api: Record<string, unknown> = {};

  api.select = () => api;
  api.eq = (field: string, value: unknown) => {
    filters.push({ field, value });
    recordedFilters.push([field, value]);
    return api;
  };
  api.update = (patch: Row) => {
    pendingUpdate = patch;
    return api;
  };
  api.maybeSingle = () =>
    Promise.resolve({ data: run().data[0] ?? null, error: null });
  api.upsert = (
    payload: Row | Row[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean },
  ) => {
    lastUpsertOptions = options as Record<string, unknown> | undefined;
    const rows = Array.isArray(payload) ? payload : [payload];
    const target = (options?.onConflict ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const targetsPk =
      target.length === PK.length && PK.every((c) => target.includes(c));
    if (!targetsPk) {
      return Promise.resolve({
        data: null,
        error: {
          code: "42P10",
          message:
            "there is no unique or exclusion constraint matching the ON CONFLICT specification",
        },
      });
    }
    for (const row of rows) {
      if (row.user_id !== currentAuthUserId) {
        return Promise.resolve({
          data: null,
          error: {
            code: "42501",
            message: "new row violates row-level security policy",
          },
        });
      }
      const existing = db[table].find((r) => PK.every((c) => r[c] === row[c]));
      if (!existing) {
        db[table].push({ ...row });
        continue;
      }
      // ON CONFLICT DO NOTHING only when the caller asked for it. The default
      // is a merge, which is the trap this mock exists to expose.
      if (options?.ignoreDuplicates) continue;
      Object.assign(existing, row);
    }
    return Promise.resolve({ data: null, error: null });
  };
  api.then = (
    onFulfilled: (v: { data: Row[]; error: null }) => unknown,
    onRejected?: (err: unknown) => unknown,
  ) => Promise.resolve(run()).then(onFulfilled, onRejected);

  return api;
}

const mockAuthGetUser = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: { getUser: mockAuthGetUser },
    from: (table: string) => buildQuery(table as "review_queue"),
  }),
}));

vi.mock("../../lib/redis", () => ({
  getRedis: () => ({
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
  }),
}));

vi.mock("../../lib/posthog", () => ({
  captureServer: vi.fn(),
  withPostHogUserContext: (_distinctId: string, fn: () => unknown) => fn(),
  SERVER_EVENTS: {},
}));

const { review } = await import("../review");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/review", review);
  return app;
}

function authAs(userId: string) {
  currentAuthUserId = userId;
  mockAuthGetUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

function authHeaders(): HeadersInit {
  return {
    Authorization: "Bearer valid-token",
    "Content-Type": "application/json",
  };
}

/** One already-scheduled prompt, the shape the record path expects to find. */
const SEEDED: ReviewItem = {
  worldId: "deep-orbit",
  moduleId: "foundations",
  lessonId: "tensors-101",
  promptIndex: 0,
  pulls: 2,
  successes: 1,
  lastReviewedAt: "2026-09-10T12:00:00.000Z",
  nextReviewAt: "2026-09-16T00:00:00.000Z",
};

function seed(userId: string, item: ReviewItem = SEEDED) {
  db.review_queue.push({
    user_id: userId,
    world_id: item.worldId,
    module_id: item.moduleId,
    lesson_id: item.lessonId,
    prompt_index: item.promptIndex,
    pulls: item.pulls,
    successes: item.successes,
    last_reviewed_at: item.lastReviewedAt,
    next_review_at: item.nextReviewAt,
    created_at: "2026-09-01T00:00:00.000Z",
  });
}

function rowFor(userId: string, promptIndex = 0): Row | undefined {
  return db.review_queue.find(
    (r) => r.user_id === userId && r.prompt_index === promptIndex,
  );
}

beforeEach(() => {
  db.review_queue = [];
  currentAuthUserId = null;
  lastUpsertOptions = undefined;
  recordedFilters = [];
  mockAuthGetUser.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/review/enqueue", () => {
  const body = {
    worldId: "deep-orbit",
    moduleId: "foundations",
    lessonId: "tensors-101",
    promptIndices: [0, 1],
  };

  it("rejects an unauthenticated request", async () => {
    const res = await createApp().request("/api/review/enqueue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(401);
    expect(db.review_queue).toHaveLength(0);
  });

  it("inserts one row per prompt index, first due one day out", async () => {
    authAs("user-A");

    const res = await createApp().request("/api/review/enqueue", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(201);
    expect(db.review_queue).toHaveLength(2);

    const first = rowFor("user-A", 0);
    expect(first).toMatchObject({
      user_id: "user-A",
      world_id: "deep-orbit",
      module_id: "foundations",
      lesson_id: "tensors-101",
      prompt_index: 0,
      pulls: 0,
      successes: 0,
      last_reviewed_at: null,
    });
    expect(first?.next_review_at).toBe(
      new Date(NOW.getTime() + DAY_MS).toISOString(),
    );
    expect(rowFor("user-A", 1)?.prompt_index).toBe(1);
  });

  it("targets exactly the primary key and asks for do-nothing on conflict", async () => {
    authAs("user-A");

    await createApp().request("/api/review/enqueue", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    // `module_id` is not part of the key. Naming it is Postgres 42P10.
    expect(lastUpsertOptions?.onConflict).toBe(
      "user_id,world_id,lesson_id,prompt_index",
    );
    // Without this the write becomes ON CONFLICT DO UPDATE.
    expect(lastUpsertOptions?.ignoreDuplicates).toBe(true);
  });

  it("is idempotent and never resets an existing schedule", async () => {
    authAs("user-A");
    const app = createApp();

    await app.request("/api/review/enqueue", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    // The learner reviews prompt 0 once, pushing it well into the future.
    const reviewed = rowFor("user-A", 0);
    if (reviewed) {
      reviewed.pulls = 3;
      reviewed.successes = 3;
      reviewed.last_reviewed_at = NOW.toISOString();
      reviewed.next_review_at = "2026-10-30T12:00:00.000Z";
    }

    // Ten days later they re-complete the same lesson.
    vi.setSystemTime(new Date(NOW.getTime() + 10 * DAY_MS));
    const res = await app.request("/api/review/enqueue", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(201);
    expect(db.review_queue).toHaveLength(2);
    expect(rowFor("user-A", 0)).toMatchObject({
      pulls: 3,
      successes: 3,
      last_reviewed_at: NOW.toISOString(),
      next_review_at: "2026-10-30T12:00:00.000Z",
    });
  });

  it("writes under the authenticated user, never a user id from the body", async () => {
    authAs("user-A");

    const res = await createApp().request("/api/review/enqueue", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...body, userId: "user-B" }),
    });

    expect(res.status).toBe(201);
    expect(db.review_queue.every((r) => r.user_id === "user-A")).toBe(true);
  });

  it("rejects an invalid worldId with 400", async () => {
    authAs("user-A");

    const res = await createApp().request("/api/review/enqueue", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...body, worldId: "not-a-world" }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/worldId/i);
    expect(db.review_queue).toHaveLength(0);
  });

  it("rejects prompt indices that are not non-negative integers", async () => {
    authAs("user-A");
    const app = createApp();

    // The last entry is past int4, which Postgres would answer with an
    // overflow rather than a constraint violation.
    for (const promptIndices of [
      [-1],
      [1.5],
      ["0"],
      [],
      "0",
      [2_147_483_648],
    ]) {
      const res = await app.request("/api/review/enqueue", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...body, promptIndices }),
      });
      expect(res.status).toBe(400);
    }
    expect(db.review_queue).toHaveLength(0);
  });
});

describe("POST /api/review", () => {
  const body = {
    worldId: "deep-orbit",
    lessonId: "tensors-101",
    promptIndex: 0,
    outcome: "got-it" as ReviewOutcome,
  };

  it("rejects an unauthenticated request", async () => {
    seed("user-A");

    const res = await createApp().request("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(res.status).toBe(401);
    expect(rowFor("user-A")?.pulls).toBe(SEEDED.pulls);
  });

  it.each(["got-it", "review", "bailed"] as const)(
    "moves next_review_at per nextInterval on %s",
    async (outcome) => {
      authAs("user-A");
      seed("user-A");
      const expected = nextInterval(SEEDED, outcome, NOW);

      const res = await createApp().request("/api/review", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...body, outcome }),
      });

      expect(res.status).toBe(200);
      expect((await res.json()).review).toEqual(expected);
      expect(rowFor("user-A")).toMatchObject({
        pulls: expected.pulls,
        successes: expected.successes,
        last_reviewed_at: NOW.toISOString(),
        next_review_at: expected.nextReviewAt,
      });
    },
  );

  it("returns 404 and writes nothing for a prompt that was never enqueued", async () => {
    authAs("user-A");

    const res = await createApp().request("/api/review", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...body, promptIndex: 7 }),
    });

    expect(res.status).toBe(404);
    expect(db.review_queue).toHaveLength(0);
  });

  it("cannot record against another user's row", async () => {
    seed("user-B");
    authAs("user-A");

    const res = await createApp().request("/api/review", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...body, userId: "user-B" }),
    });

    expect(res.status).toBe(404);
    expect(rowFor("user-B")).toMatchObject({
      pulls: SEEDED.pulls,
      successes: SEEDED.successes,
      last_reviewed_at: SEEDED.lastReviewedAt,
      next_review_at: SEEDED.nextReviewAt,
    });
  });

  /*
    The cross-user test above passes even if the route drops its own
    `.eq("user_id", ...)`, because the mock's `visible()` hides another user's
    rows regardless. That makes it a test of the double, not of the route.
    This one asserts the route scopes its own queries, which is the property
    that has to hold against a real database.
  */
  it("scopes both the read and the write to the authenticated user", async () => {
    authAs("user-A");
    seed("user-A");

    await createApp().request("/api/review", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    expect(
      recordedFilters.filter(([field]) => field === "user_id"),
      "every review_queue query must filter on the authenticated user id",
    ).not.toHaveLength(0);
    for (const [field, value] of recordedFilters) {
      if (field === "user_id") expect(value).toBe("user-A");
    }
  });

  it("rejects an invalid worldId with 400", async () => {
    authAs("user-A");
    seed("user-A");

    const res = await createApp().request("/api/review", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...body, worldId: "not-a-world" }),
    });

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/worldId/i);
    expect(rowFor("user-A")?.pulls).toBe(SEEDED.pulls);
  });

  it("rejects an unknown outcome with 400", async () => {
    authAs("user-A");
    seed("user-A");

    const res = await createApp().request("/api/review", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ ...body, outcome: "skipped" }),
    });

    expect(res.status).toBe(400);
    expect(rowFor("user-A")?.pulls).toBe(SEEDED.pulls);
  });

  it("rejects a malformed JSON body with 400", async () => {
    authAs("user-A");

    const res = await createApp().request("/api/review", {
      method: "POST",
      headers: authHeaders(),
      body: "{not json",
    });

    expect(res.status).toBe(400);
  });
});
