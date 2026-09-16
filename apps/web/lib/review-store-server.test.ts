import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessons, modules } from "@tensorcraft/content";
import { DEFAULT_WORLD } from "@tensorcraft/shared";

/*
  THE SECURITY BOUNDARY of spaced review, signed-in half. 74 of Deep Orbit's
  80 recall prompts are paid content, so these tests are the only thing
  between a stale or forged `review_queue` row and paid prompt text on a
  learner's screen. Spec:
  docs/superpowers/specs/2026-09-15-spaced-review-design.md section D.

  Every fixture is derived from the real velite build rather than hand-written,
  so the join these tests assert is the join the product performs. The
  entitlement decision is mocked, because `canAccessWorld` has its own tests
  in lib/__tests__/entitlements.test.ts.
*/

const mockCanAccessWorld = vi.fn();

vi.mock("@/lib/entitlements", () => ({
  // Wrapped in a lambda rather than handed over directly: vi.mock is hoisted
  // above the const above, and the module under test imports entitlements
  // during its own static import, so a bare reference lands in the temporal
  // dead zone.
  canAccessWorld: (userId: string, worldSlug: string) =>
    mockCanAccessWorld(userId, worldSlug),
}));

import { resolveDueForUser } from "./review-store-server";

const WORLD = DEFAULT_WORLD;
const USER = "user_123";
const NOW = new Date("2026-09-16T12:00:00.000Z");
const OVERDUE = "2026-09-01T00:00:00.000Z";

function required<T>(value: T | undefined, what: string): T {
  if (!value) throw new Error(`Fixture missing: ${what}`);
  return value;
}

const freeModule = required(
  modules.find((m) => m.worldId === WORLD && m.order === 1),
  `a module with order 1 in ${WORLD}`,
);
const paidModuleSlugs = new Set(
  modules.filter((m) => m.worldId === WORLD && m.order > 1).map((m) => m.slug),
);
const freeLesson = required(
  lessons.find(
    (l) =>
      l.worldId === WORLD &&
      l.moduleId === freeModule.slug &&
      l.recallPrompts.length > 0,
  ),
  "a free-module lesson carrying a recall prompt",
);
const paidLessons = lessons.filter(
  (l) =>
    l.worldId === WORLD &&
    paidModuleSlugs.has(l.moduleId) &&
    l.recallPrompts.length > 0,
);
const paidLesson = required(paidLessons[0], "a paid lesson with a prompt");
const otherPaidLesson = required(
  paidLessons[1],
  "a second paid lesson with a prompt",
);

interface QueueRow {
  module_id: string;
  lesson_id: string;
  prompt_index: number;
  pulls: number;
  successes: number;
  last_reviewed_at: string | null;
  next_review_at: string;
}

function rowFor(
  lesson: { slug: string; moduleId: string },
  promptIndex = 0,
  overrides: Partial<QueueRow> = {},
): QueueRow {
  return {
    module_id: lesson.moduleId,
    lesson_id: lesson.slug,
    prompt_index: promptIndex,
    pulls: 0,
    successes: 0,
    last_reviewed_at: null,
    next_review_at: OVERDUE,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────
// Supabase double. Mirrors the thenable-builder style used in
// apps/api/src/routes/__tests__/activity.test.ts, and records the
// filters so a test can assert the read is scoped to one user.
// ─────────────────────────────────────────────────────────────

type ServerClient = Parameters<typeof resolveDueForUser>[0];

let queueRows: QueueRow[] = [];
let queueError: { message: string } | null = null;
let queriedTables: string[] = [];
let queryFilters: Array<[string, string, unknown]> = [];

function fakeSupabase(): ServerClient {
  const builder: Record<string, unknown> = {};
  builder.select = () => builder;
  builder.eq = (column: string, value: unknown) => {
    queryFilters.push(["eq", column, value]);
    return builder;
  };
  builder.lte = (column: string, value: unknown) => {
    queryFilters.push(["lte", column, value]);
    return builder;
  };
  builder.then = (resolve: (v: unknown) => void) => {
    resolve({ data: queueError ? null : queueRows, error: queueError });
  };
  return {
    from: (table: string) => {
      queriedTables.push(table);
      return builder;
    },
  } as unknown as ServerClient;
}

beforeEach(() => {
  mockCanAccessWorld.mockReset();
  queueRows = [];
  queueError = null;
  queriedTables = [];
  queryFilters = [];
});

describe("resolveDueForUser", () => {
  it("resolves a free-module key for an unentitled learner", async () => {
    mockCanAccessWorld.mockResolvedValue(false);
    queueRows = [rowFor(freeLesson)];

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 2, NOW);

    expect(due).toHaveLength(1);
    expect(due[0].lessonId).toBe(freeLesson.slug);
    expect(due[0].question).toBe(freeLesson.recallPrompts[0].question);
    expect(due[0].answer).toBe(freeLesson.recallPrompts[0].answer);

    // Scoped to the caller's own rows in this world, belt and braces over the
    // RLS select policy in migration 061.
    expect(queriedTables).toEqual(["review_queue"]);
    expect(queryFilters).toContainEqual(["eq", "user_id", USER]);
    expect(queryFilters).toContainEqual(["eq", "world_id", WORLD]);
  });

  it("drops a paid key for an unentitled learner", async () => {
    mockCanAccessWorld.mockResolvedValue(false);
    queueRows = [rowFor(paidLesson)];

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 2, NOW);

    expect(due).toEqual([]);
  });

  it("resolves a paid key for an entitled learner", async () => {
    mockCanAccessWorld.mockResolvedValue(true);
    queueRows = [rowFor(paidLesson)];

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 2, NOW);

    expect(due).toHaveLength(1);
    expect(due[0].lessonId).toBe(paidLesson.slug);
    expect(due[0].answer).toBe(paidLesson.recallPrompts[0].answer);
    expect(mockCanAccessWorld).toHaveBeenCalledWith(USER, WORLD);
  });

  // The case an earlier spec draft got wrong: filtering on the page's
  // `purchased` value would pass here, because purchased is a hardcoded
  // true on every module-1 lesson (page.tsx:137).
  it("drops a refunded learner's paid keys while they sit on a module-1 lesson", async () => {
    mockCanAccessWorld.mockResolvedValue(false);
    queueRows = [
      rowFor(paidLesson),
      rowFor(otherPaidLesson),
      rowFor(freeLesson),
    ];

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 5, NOW);

    expect(due.map((d) => d.lessonId)).toEqual([freeLesson.slug]);
    const answers = due.map((d) => d.answer);
    expect(answers).not.toContain(paidLesson.recallPrompts[0].answer);
    expect(answers).not.toContain(otherPaidLesson.recallPrompts[0].answer);
    // Once for the request, never once per key.
    expect(mockCanAccessWorld).toHaveBeenCalledTimes(1);
  });

  it("propagates an entitlement lookup fault instead of denying", async () => {
    // getEntitledWorlds throws by design so a transient DB fault never
    // silently shows a paying customer the paywall. Do not catch per key.
    mockCanAccessWorld.mockRejectedValue(
      new Error("Entitlement lookup failed for user_123: PostgREST 503"),
    );
    queueRows = [rowFor(paidLesson), rowFor(freeLesson)];

    await expect(
      resolveDueForUser(fakeSupabase(), USER, WORLD, 5, NOW),
    ).rejects.toThrow(/Entitlement lookup failed/);
  });

  it("drops a key whose lesson or prompt index no longer exists in the build", async () => {
    // Entitled, so nothing here is the entitlement filter's doing: content is
    // edited, and a stale row must not crash a page render.
    mockCanAccessWorld.mockResolvedValue(true);
    queueRows = [
      rowFor({ slug: "a-lesson-that-was-deleted", moduleId: freeModule.slug }),
      rowFor(freeLesson, 99),
    ];

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 5, NOW);

    expect(due).toEqual([]);
  });

  // ── Added beyond the plan's six, both guarding a branch of the ────────
  // ── implementation that nothing else covers. ─────────────────────────

  it("drops a row whose module_id claims the free module but whose lesson is paid", async () => {
    // Migration 061 grants every learner INSERT and UPDATE on their OWN
    // review_queue rows (the API route writes through a JWT-scoped client, so
    // the policies are required). A row is therefore client-writable, and
    // `module_id` in particular is a value the learner can choose. Reading
    // freeness off the row would hand paid prompt text to anyone willing to
    // type one INSERT. Freeness comes from the lesson's own module in the
    // velite build, and a row that disagrees with the build is dropped.
    mockCanAccessWorld.mockResolvedValue(false);
    queueRows = [
      rowFor(paidLesson, 0, { module_id: freeModule.slug }),
      rowFor(paidLesson, 0, { module_id: "not-a-module" }),
    ];

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 5, NOW);

    expect(due).toEqual([]);
  });

  it("issues no entitlement lookup when nothing is due", async () => {
    mockCanAccessWorld.mockResolvedValue(true);
    queueRows = [
      rowFor(freeLesson, 0, { next_review_at: "2026-09-20T00:00:00.000Z" }),
    ];

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 2, NOW);

    expect(due).toEqual([]);
    expect(mockCanAccessWorld).not.toHaveBeenCalled();
  });

  it("renders no warm-up when the queue read fails", async () => {
    // Spec section H: a read failure stays silent and the learner proceeds.
    // The opposite rule governs writes, which is where the 2026-08-23
    // waitlist incident lives.
    mockCanAccessWorld.mockResolvedValue(true);
    queueError = { message: "PostgREST 503" };

    const due = await resolveDueForUser(fakeSupabase(), USER, WORLD, 2, NOW);

    expect(due).toEqual([]);
    expect(mockCanAccessWorld).not.toHaveBeenCalled();
  });
});

describe("the quota is applied after the entitlement gate", () => {
  /*
    A refunded learner keeps up to 74 paid rows and 6 free ones, and their
    paid rows are the oldest, so the most overdue. Applying `limit` BEFORE
    the gate hands selectDue two paid keys, drops both, and shows them an
    empty warm-up forever while free items sit due. No leak, they see less
    and never more, but a silent cliff for the population least likely to
    report it.
  */
  it("still fills the quota when the most overdue items are paid and dropped", async () => {
    mockCanAccessWorld.mockResolvedValue(false);
    queueRows = [
      // Older, so selected first, and both unresolvable for this learner.
      rowFor(paidLesson, 0, { next_review_at: "2026-08-01T00:00:00.000Z" }),
      rowFor(otherPaidLesson, 0, {
        next_review_at: "2026-08-02T00:00:00.000Z",
      }),
      // Newer but resolvable. Must survive to the result.
      rowFor(freeLesson, 0, { next_review_at: "2026-09-10T00:00:00.000Z" }),
    ];

    const out = await resolveDueForUser(fakeSupabase(), USER, WORLD, 2, NOW);

    expect(out).toHaveLength(1);
    expect(out[0].lessonId).toBe(freeLesson.slug);
  });

  it("never returns more than the limit", async () => {
    mockCanAccessWorld.mockResolvedValue(true);
    queueRows = paidLessons.slice(0, 5).map((l, i) =>
      rowFor(l, 0, {
        next_review_at: new Date(
          Date.parse("2026-08-01T00:00:00.000Z") + i * 1000,
        ).toISOString(),
      }),
    );

    const out = await resolveDueForUser(fakeSupabase(), USER, WORLD, 2, NOW);

    expect(out).toHaveLength(2);
  });
});

describe("review-store-server is server-only", () => {
  /*
    Same rule and same reasoning as free-recall-prompts.test.ts: this module
    imports the velite `lessons` collection, which velite re-exports as one
    ~1.2 MB JSON default, so a "use client" directive here would ship every
    lesson to every browser. Stage 1 has no consumer, so nothing else would
    catch it.
  */
  it("carries no 'use client' directive", () => {
    const src = readFileSync(join(__dirname, "review-store-server.ts"), "utf8");
    const directive = src
      .split("\n")
      .find((line) => /^\s*["']use client["'];?\s*$/.test(line));
    expect(
      directive,
      "review-store-server.ts must stay server-only: it imports the velite lessons collection",
    ).toBeUndefined();
  });
});

describe("the limit is honoured at its edges", () => {
  it("returns nothing when the limit is zero", async () => {
    mockCanAccessWorld.mockResolvedValue(true);
    queueRows = [rowFor(freeLesson, 0)];
    expect(
      await resolveDueForUser(fakeSupabase(), USER, WORLD, 0, NOW),
    ).toEqual([]);
  });
});

it("silently omits the warm-up when the queue request rejects", async () => {
  const query = {
    select: () => query,
    eq: () => query,
    lte: () => Promise.reject(new Error("Network unavailable")),
  };
  const client = { from: () => query } as unknown as ServerClient;
  await expect(resolveDueForUser(client, USER, WORLD, 2, NOW)).resolves.toEqual(
    [],
  );
  expect(mockCanAccessWorld).not.toHaveBeenCalled();
});
