import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";

// ─────────────────────────────────────────────────────────────
// Mocks, cover both theme_progress (completions) and
// exercise_attempts queries behind the activity-daily endpoint.
// ─────────────────────────────────────────────────────────────

const mockGetUser = vi.fn();

let mockCompletions: Array<{
  completed_at: string | null;
  theme_id?: string;
}> = [];
let mockCompletionsError: unknown = null;

let mockAttempts: Array<{ attempted_at: string | null; theme_id?: string }> =
  [];
let mockAttemptsError: unknown = null;

function makeThenable<T>(source: () => { data: T; error: unknown }) {
  const q: Record<string, unknown> = {};
  q.select = () => q;
  q.eq = () => q;
  q.gte = () => q;
  q.not = () => q;
  q.then = (resolve: (v: unknown) => void) => {
    resolve(source());
  };
  return q;
}

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: (table: string) => {
      if (table === "theme_progress") {
        return makeThenable(() => ({
          data: mockCompletions,
          error: mockCompletionsError,
        }));
      }
      if (table === "exercise_attempts") {
        return makeThenable(() => ({
          data: mockAttempts,
          error: mockAttemptsError,
        }));
      }
      // used by /summary and others, return a compatible default stub
      return makeThenable(() => ({ data: [], error: null }));
    },
  }),
  getSupabaseAdminClient: () => ({ from: () => ({}) }),
}));

vi.mock("../../lib/redis", () => ({
  getRedis: () => ({
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
  }),
}));

beforeEach(() => {
  mockGetUser.mockReset();
  mockCompletions = [];
  mockCompletionsError = null;
  mockAttempts = [];
  mockAttemptsError = null;
});

const { progress } = await import("../progress");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/progress", progress);
  return app;
}

function authedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user_123" } },
    error: null,
  });
}

describe("GET /api/progress/activity/daily", () => {
  it("returns 401 without auth", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "no token" },
    });
    const res = await createApp().request("/api/progress/activity/daily");
    expect(res.status).toBe(401);
  });

  it("returns 30 days of zeros with no activity", async () => {
    authedUser();
    const res = await createApp().request(
      "/api/progress/activity/daily?days=30",
      {
        headers: { Authorization: "Bearer valid" },
      },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      activity: Array<{
        date: string;
        lessonsCompleted: number;
        exercisesAttempted: number;
      }>;
    };
    expect(body.activity).toHaveLength(30);
    for (const row of body.activity) {
      expect(row.lessonsCompleted).toBe(0);
      expect(row.exercisesAttempted).toBe(0);
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    // Dates must be sorted ascending.
    const dates = body.activity.map((r) => r.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("buckets completions and attempts into the correct UTC date", async () => {
    authedUser();

    // Use today's UTC date so the rows fall inside the default 30-day
    // window no matter when the test runs.
    const today = new Date();
    const todayKey = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
    )
      .toISOString()
      .slice(0, 10);

    mockCompletions = [
      { completed_at: `${todayKey}T12:00:00Z` },
      { completed_at: `${todayKey}T23:59:59Z` },
    ];
    mockAttempts = [
      { attempted_at: `${todayKey}T09:00:00Z` },
      { attempted_at: `${todayKey}T10:00:00Z` },
      { attempted_at: `${todayKey}T11:00:00Z` },
    ];

    const res = await createApp().request("/api/progress/activity/daily", {
      headers: { Authorization: "Bearer valid" },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      activity: Array<{
        date: string;
        lessonsCompleted: number;
        exercisesAttempted: number;
      }>;
    };

    const todayRow = body.activity.find((r) => r.date === todayKey);
    expect(todayRow).toBeDefined();
    expect(todayRow?.lessonsCompleted).toBe(2);
    expect(todayRow?.exercisesAttempted).toBe(3);
  });

  it("rejects days > 365", async () => {
    authedUser();
    const res = await createApp().request(
      "/api/progress/activity/daily?days=999",
      {
        headers: { Authorization: "Bearer valid" },
      },
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid themeId", async () => {
    authedUser();
    const res = await createApp().request(
      "/api/progress/activity/daily?themeId=not-a-theme",
      {
        headers: { Authorization: "Bearer valid" },
      },
    );
    expect(res.status).toBe(400);
  });

  it("respects custom days parameter", async () => {
    authedUser();
    const res = await createApp().request(
      "/api/progress/activity/daily?days=7",
      {
        headers: { Authorization: "Bearer valid" },
      },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { activity: unknown[] };
    expect(body.activity).toHaveLength(7);
  });
});
