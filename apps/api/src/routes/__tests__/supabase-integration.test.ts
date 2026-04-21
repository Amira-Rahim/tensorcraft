/**
 * §8j Supabase integration tests.
 *
 * APPROACH
 * ────────
 * Integration-level in the sense that each test exercises the full Hono
 * request → auth middleware → route handler → response pipeline. The
 * Supabase client is a high-fidelity in-memory mock that:
 *
 *   1. Holds per-user, per-table rows so cross-user queries return zero
 *      matches (simulates RLS enforcement).
 *   2. Exposes the same chainable query builder contract used by the
 *      routes (`.select().eq().order()...`) so no route code needs to
 *      change.
 *   3. Accepts writes and round-trips them — a later SELECT can verify
 *      what was written.
 *
 * RLS simulation: when a SELECT filters by a `user_id` that does not
 * match the authenticated user we return `[]`. This mirrors real RLS
 * behaviour where a cross-user query silently yields zero rows.
 *
 * Live-service caveat: we do NOT hit a real Supabase instance. CI can't
 * afford the flakiness / data pollution. Beta acceptance testing is the
 * first time real RLS actually runs against these routes.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";

// ─────────────────────────────────────────────────────────────
// In-memory DB shared by every route under test.
// ─────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;
type Tables =
  | "profiles"
  | "purchases"
  | "theme_progress"
  | "exercise_attempts"
  | "streaks"
  | "skill_genome"
  | "certificates"
  | "skill_events"
  | "waitlist";

const db: Record<Tables, Row[]> = {
  profiles: [],
  purchases: [],
  theme_progress: [],
  exercise_attempts: [],
  streaks: [],
  skill_genome: [],
  certificates: [],
  skill_events: [],
  waitlist: [],
};

/** Reset the in-memory DB between tests. */
function resetDb() {
  for (const k of Object.keys(db) as Tables[]) db[k] = [];
}

/** Tracks the currently-authenticated user for RLS simulation. */
let currentAuthUserId: string | null = null;

// ─────────────────────────────────────────────────────────────
// Chainable query builder — mirrors the subset of the Supabase
// JS client surface the routes actually use.
// ─────────────────────────────────────────────────────────────

type Filter = { field: string; value: unknown; op: "eq" | "contains" | "gte" };

function buildQuery(table: Tables) {
  const filters: Filter[] = [];
  let selectCols: string | null = null;

  function applyFilters(rows: Row[]): Row[] {
    return rows.filter((row) =>
      filters.every((f) => {
        const v = row[f.field];
        if (f.op === "eq") return v === f.value;
        if (f.op === "gte")
          return typeof v === "string" && v >= (f.value as string);
        if (f.op === "contains") {
          if (!Array.isArray(v)) return false;
          const needle = f.value as unknown[];
          return needle.every((n) => v.includes(n));
        }
        return true;
      }),
    );
  }

  /**
   * RLS simulation: if a .eq("user_id", X) filter exists and X does NOT
   * match the authenticated user, return an empty result set. Routes
   * always filter by the authenticated user id, so this effectively
   * prevents cross-user reads.
   */
  function rlsFilter(rows: Row[]): Row[] {
    const userIdFilter = filters.find(
      (f) => f.field === "user_id" && f.op === "eq",
    );
    if (!userIdFilter) return rows;
    if (userIdFilter.value !== currentAuthUserId) return [];
    return rows;
  }

  function resolve(): { data: Row[]; error: null } {
    const filtered = applyFilters(db[table]);
    const enforced = rlsFilter(filtered);
    return { data: enforced, error: null };
  }

  const api: Record<string, unknown> = {};
  const chain = () => api;

  api.select = (cols?: string) => {
    selectCols = cols ?? null;
    return api;
  };
  api.eq = (field: string, value: unknown) => {
    filters.push({ field, value, op: "eq" });
    return api;
  };
  api.gte = (field: string, value: unknown) => {
    filters.push({ field, value, op: "gte" });
    return api;
  };
  api.contains = (field: string, value: unknown[]) => {
    filters.push({ field, value, op: "contains" });
    return api;
  };
  api.order = chain;
  api.limit = chain;
  api.not = chain;
  api.maybeSingle = () => {
    const { data } = resolve();
    return Promise.resolve({ data: data[0] ?? null, error: null });
  };
  api.single = () => {
    const { data } = resolve();
    if (data.length === 0)
      return Promise.resolve({
        data: null,
        error: { code: "PGRST116", message: "Not found" },
      });
    return Promise.resolve({ data: data[0], error: null });
  };
  api.insert = (payload: Row | Row[]) => {
    const rows = Array.isArray(payload) ? payload : [payload];
    db[table].push(...rows);
    // Support .select().single() chained off insert
    return {
      select: () => ({
        single: () => Promise.resolve({ data: rows[0], error: null }),
      }),
      // The raw insert result (for routes that don't chain .select())
      then: (onFulfilled: (v: unknown) => unknown) =>
        Promise.resolve({ error: null }).then(onFulfilled),
    };
  };
  api.update = (patch: Row) => {
    // Apply filters to find rows, then mutate them.
    const rowsToUpdate = rlsFilter(applyFilters(db[table]));
    for (const row of rowsToUpdate) Object.assign(row, patch);
    return {
      eq: (_field: string, _value: unknown) => {
        // Supabase PostgREST: update.eq() returns a thenable. We emulate
        // the common pattern `update(...).eq(...).select().single()`.
        return {
          select: () => ({
            single: () =>
              Promise.resolve({
                data: rowsToUpdate[0] ?? null,
                error: null,
              }),
          }),
          then: (onFulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ error: null }).then(onFulfilled),
        };
      },
    };
  };
  api.upsert = (_payload: Row) => {
    // Not needed for this suite — skip.
    return Promise.resolve({ error: null, data: null });
  };
  // Top-level thenable so `await from('x').select().eq(...)` resolves.
  api.then = (
    onFulfilled: (v: { data: Row[]; error: null }) => unknown,
    onRejected?: (err: unknown) => unknown,
  ) => Promise.resolve(resolve()).then(onFulfilled, onRejected);

  return api;
}

// ─────────────────────────────────────────────────────────────
// Supabase client mocks
// ─────────────────────────────────────────────────────────────

const mockAuthGetUser = vi.fn();

function makeSupabaseClient() {
  return {
    auth: { getUser: mockAuthGetUser },
    from: (table: string) => buildQuery(table as Tables),
    rpc: (_fn: string, _args: Record<string, unknown>) =>
      Promise.resolve({ data: [], error: null }),
  };
}

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => makeSupabaseClient(),
  getSupabaseAdminClient: () => makeSupabaseClient(),
}));

vi.mock("../../lib/redis", () => ({
  getRedis: () => ({
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
  }),
}));

// Silence Kit/PostHog in routes that fire-and-forget.
vi.mock("../../lib/kit", () => ({
  addSubscriber: () => Promise.resolve(),
  tagSubscriber: () => Promise.resolve(),
  removeTagFromSubscriber: () => Promise.resolve(),
}));

vi.mock("../../lib/posthog", () => ({
  captureServer: vi.fn(),
  SERVER_EVENTS: {
    PAYMENT_COMPLETED: "payment_completed",
    PAYMENT_FAILED: "payment_failed",
    PAYMENT_REFUNDED: "payment_refunded",
    PAYMENT_DISPUTED: "payment_disputed",
    CODE_PUSHED: "code_pushed",
  },
}));

// Import routes after mocks are in place.
const { profiles } = await import("../profiles");
const { purchases } = await import("../purchases");
const { exerciseAttempts } = await import("../exercise-attempts");
const { onboarding } = await import("../onboarding");
const { skillEvents } = await import("../skill-events");
const { waitlist } = await import("../waitlist");
const { progress } = await import("../progress");

// Helper: build a Hono app with every route mounted.
function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/profiles", profiles);
  app.route("/api/purchases", purchases);
  app.route("/api/exercise-attempts", exerciseAttempts);
  app.route("/api/onboarding", onboarding);
  app.route("/api/skill-events", skillEvents);
  app.route("/api/waitlist", waitlist);
  app.route("/api/progress", progress);
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

beforeEach(() => {
  resetDb();
  mockAuthGetUser.mockReset();
  currentAuthUserId = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe("Supabase integration — per-table CRUD + RLS simulation", () => {
  describe("profiles", () => {
    it("updates own profile (PATCH) — row round-trips via SELECT", async () => {
      const userId = "user-A";
      db.profiles.push({
        id: userId,
        display_name: "Old",
        email: "a@example.com",
      });
      authAs(userId);

      const res = await createApp().request(`/api/profiles/${userId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ display_name: "New Name" }),
      });

      expect(res.status).toBe(200);
      const row = db.profiles.find((r) => r.id === userId);
      expect(row?.display_name).toBe("New Name");
    });

    it("rejects update to another user's profile (403)", async () => {
      authAs("user-A");
      const res = await createApp().request("/api/profiles/user-B", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ display_name: "Hacked" }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe("purchases", () => {
    it("GET /access returns only the authenticated user's rows (RLS)", async () => {
      db.purchases.push(
        {
          user_id: "user-A",
          theme_ids: ["deep-orbit"],
          status: "completed",
        },
        {
          user_id: "user-B",
          theme_ids: ["neon-protocol"],
          status: "completed",
        },
      );
      authAs("user-A");

      const res = await createApp().request("/api/purchases/access", {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { themeIds: string[] };
      expect(body.themeIds).toEqual(["deep-orbit"]);
      expect(body.themeIds).not.toContain("neon-protocol");
    });

    it("user B sees only their own purchases (cross-user isolation)", async () => {
      db.purchases.push(
        {
          user_id: "user-A",
          theme_ids: ["deep-orbit"],
          status: "completed",
        },
        {
          user_id: "user-B",
          theme_ids: ["neon-protocol"],
          status: "completed",
        },
      );
      authAs("user-B");

      const res = await createApp().request("/api/purchases/access", {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { themeIds: string[] };
      expect(body.themeIds).toEqual(["neon-protocol"]);
    });
  });

  describe("theme_progress (dashboard read path)", () => {
    it("GET /progress?themeId=... returns only own rows", async () => {
      db.theme_progress.push(
        {
          user_id: "user-A",
          theme_id: "deep-orbit",
          module_id: "foundations",
          lesson_id: "l1",
          status: "completed",
        },
        {
          user_id: "user-B",
          theme_id: "deep-orbit",
          module_id: "foundations",
          lesson_id: "l1",
          status: "completed",
        },
      );
      authAs("user-A");

      const res = await createApp().request(
        "/api/progress?themeId=deep-orbit",
        { headers: authHeaders() },
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { progress: Row[] };
      expect(body.progress).toHaveLength(1);
      expect(body.progress[0].user_id).toBe("user-A");
    });
  });

  describe("exercise_attempts", () => {
    it("POST inserts a row attributable to the authenticated user", async () => {
      authAs("user-A");
      const res = await createApp().request("/api/exercise-attempts", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          exerciseSlug: "create-tensor",
          lessonId: "introduction-to-tensors",
          themeId: "deep-orbit",
          passed: true,
          score: 90,
        }),
      });
      expect(res.status).toBe(201);
      expect(db.exercise_attempts).toHaveLength(1);
      expect(db.exercise_attempts[0].user_id).toBe("user-A");
    });

    it("GET returns only own attempts (RLS)", async () => {
      db.exercise_attempts.push(
        {
          user_id: "user-A",
          lesson_id: "l1",
          theme_id: "deep-orbit",
          passed: true,
          score: 90,
        },
        {
          user_id: "user-B",
          lesson_id: "l1",
          theme_id: "deep-orbit",
          passed: false,
          score: 10,
        },
      );
      authAs("user-A");
      const res = await createApp().request(
        "/api/exercise-attempts?lessonId=l1",
        { headers: authHeaders() },
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { attempts: Row[] };
      expect(body.attempts).toHaveLength(1);
      expect(body.attempts[0].user_id).toBe("user-A");
    });
  });

  describe("streaks (dashboard read path)", () => {
    it("GET /progress/summary reads streak rows scoped to own user", async () => {
      db.streaks.push(
        {
          user_id: "user-A",
          theme_id: "deep-orbit",
          current_streak: 3,
          longest_streak: 7,
        },
        {
          user_id: "user-B",
          theme_id: "deep-orbit",
          current_streak: 50,
          longest_streak: 50,
        },
      );
      db.theme_progress.push({
        user_id: "user-A",
        theme_id: "deep-orbit",
        module_id: "foundations",
        lesson_id: "l1",
        status: "completed",
      });
      authAs("user-A");

      const res = await createApp().request("/api/progress/summary", {
        headers: authHeaders(),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        summary: { bestStreak: number; themes: Array<Row> };
      };
      // user-B's 50-streak must NOT leak in.
      expect(body.summary.bestStreak).toBe(7);
    });
  });

  describe("skill_events", () => {
    it("POST inserts a skill event attributed to the user", async () => {
      authAs("user-A");
      const res = await createApp().request("/api/skill-events", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          themeId: "deep-orbit",
          eventType: "exercise_pass",
          skillAxis: "training",
        }),
      });
      expect(res.status).toBe(201);
      expect(db.skill_events).toHaveLength(1);
      expect(db.skill_events[0].user_id).toBe("user-A");
      expect(db.skill_events[0].event_type).toBe("exercise_pass");
    });
  });

  describe("waitlist", () => {
    it("POST inserts an email (no auth required)", async () => {
      const res = await createApp().request("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "newbie@example.com" }),
      });
      expect(res.status).toBe(201);
      expect(db.waitlist).toHaveLength(1);
      expect(db.waitlist[0].email).toBe("newbie@example.com");
    });
  });

  describe("onboarding (profiles PATCH via admin client)", () => {
    it("updates own profile onboarding fields", async () => {
      const userId = "user-A";
      db.profiles.push({ id: userId });
      authAs(userId);

      const res = await createApp().request("/api/onboarding", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          experience_level: "intermediate",
          learning_goal: "career",
          fe_background: "5 years React",
          fe_framework: "react",
          fe_experience_years: 5,
        }),
      });

      expect(res.status).toBe(200);
      const row = db.profiles.find((r) => r.id === userId);
      expect(row?.experience_level).toBe("intermediate");
      expect(row?.learning_goal).toBe("career");
    });
  });

  describe("auth gate (401 without bearer token)", () => {
    it("all authenticated endpoints reject without a bearer token", async () => {
      const app = createApp();
      const endpoints = [
        ["PATCH", "/api/profiles/user-A"],
        ["GET", "/api/purchases/access"],
        ["GET", "/api/progress?themeId=deep-orbit"],
        ["POST", "/api/exercise-attempts"],
        ["POST", "/api/skill-events"],
        ["PATCH", "/api/onboarding"],
      ] as const;
      for (const [method, path] of endpoints) {
        const res = await app.request(path, {
          method,
          headers: { "Content-Type": "application/json" },
          body: method === "GET" ? undefined : JSON.stringify({ themeId: "x" }),
        });
        expect(res.status, `${method} ${path}`).toBe(401);
      }
    });
  });
});
