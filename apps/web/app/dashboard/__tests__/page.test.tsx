import { describe, it, expect, vi, beforeEach } from "vitest";

// `redirect()` in next/navigation throws a special error at runtime. We mock
// it to throw a tagged error so the test can assert the correct target
// without pulling in the Next runtime.
class RedirectError extends Error {
  constructor(public target: string) {
    super(`NEXT_REDIRECT:${target}`);
  }
}

vi.mock("@/lib/learning-route-server", () => ({
  getLearningRoutePreference: vi.fn(async () => ({
    route: null,
    unavailable: false,
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new RedirectError(target);
  },
}));

// Avoid reaching into the real Supabase server helper which requires
// env vars + the Next `cookies()` runtime. The dashboard page only needs
// the shape used in its auth guard / queries.
const getUserMock = vi.fn();

// Per-table query results. Tests override specific tables; unknown tables
// default to empty arrays so the page's `?? []` fallbacks kick in.
const tableData: Record<string, unknown> = {};
function resetTableData() {
  for (const key of Object.keys(tableData)) delete tableData[key];
}

/**
 * Build a chainable thenable query-builder that returns `{ data }` regardless
 * of which combination of `.select().eq().eq().order().limit().single().gte()`
 * is invoked. Supports `await` via the top-level `then` so callers that treat
 * the builder itself as a promise (e.g. `Promise.all([supabase.from(...)])`)
 * receive the same `{ data }` payload.
 */
function buildQuery(data: unknown) {
  const result = { data };
  const api: Record<string, unknown> = {};
  const chain = () => api;
  api.select = chain;
  api.eq = chain;
  api.in = chain;
  api.gte = chain;
  api.lte = chain;
  api.order = chain;
  api.limit = chain;
  api.single = () => result;
  api.then = (
    onFulfilled: (value: { data: unknown }) => unknown,
    onRejected?: (err: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: (table: string) => buildQuery(tableData[table] ?? []),
  }),
}));

// Content package is a pure ESM module backed by Velite output; we don't
// need real content for the unauthenticated redirect test.
vi.mock("@tensorcraft/content", () => ({
  getModules: () => [],
  getModule: () => null,
  getModuleLessons: () => [],
  getLesson: () => null,
  getWorldLessons: () => [],
  getLessonsWithBridges: () => [],
}));

// We inspect the React element returned by DashboardPage directly to read
// the props handed to `<DashboardView>` without needing to render the full
// client tree (which pulls in canvas / styling / hooks).
vi.mock("../dashboard-view", () => ({
  DashboardView: function DashboardViewMock() {
    return null;
  },
}));

// The page branches to FirstRunView for zero-activity accounts
// (first-run tests live in page-first-run.test.tsx); stub it so this
// file's tests don't pull in its imports.
vi.mock("../first-run-view", () => ({
  FirstRunView: function FirstRunViewMock() {
    return null;
  },
}));

// `world-cards` is rendered as JSX inside the page; stub it out so tests
// don't need its full props surface.
vi.mock("../world-cards", () => ({
  WorldCards: () => null,
}));

/**
 * The dashboard page is a React server component that returns a
 * `<DashboardView .../>` element. We don't render that element, we just
 * read `.props` off the returned React element to assert on what the page
 * would pass to the view.
 */
function getDashboardViewProps(
  element: unknown,
): Record<string, unknown> | null {
  if (!element || typeof element !== "object") return null;
  const el = element as { props?: Record<string, unknown> };
  return el.props ?? null;
}

describe("dashboard/page (server component)", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    resetTableData();
  });

  it("never renders a continuation section, even after the finale completion record", async () => {
    // Owner ruling 2026-09-20: only Deep Orbit for now. A forthcoming-course
    // teaser on the dashboard was the "no future product plans" violation
    // the 2026-09-19 audit flagged; the coming-soon pages stay the one exception.
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "x@example.com" } },
      error: null,
    });
    tableData.world_progress = [
      {
        world_id: "deep-orbit",
        module_id: "capstone",
        lesson_id: "launch",
        status: "completed",
        updated_at: new Date().toISOString(),
      },
    ];
    const { default: DashboardPage } = await import("../page");
    expect(
      getDashboardViewProps(await DashboardPage())?.continuation,
    ).toBeUndefined();
    tableData.world_progress = [
      {
        world_id: "deep-orbit",
        module_id: "foundations",
        lesson_id: "introduction-to-tensors",
        status: "completed",
        updated_at: new Date().toISOString(),
      },
    ];
    expect(
      getDashboardViewProps(await DashboardPage())?.continuation,
    ).toBeUndefined();
  });

  it("redirects unauthenticated users to /auth", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const { default: DashboardPage } = await import("../page");

    await expect(DashboardPage()).rejects.toMatchObject({
      target: "/auth",
    });
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it("does not redirect to /auth when a user is present", async () => {
    // When a user exists the page proceeds past the auth guard and eventually
    // hits the rest of the data-loading pipeline. We only care here that the
    // /auth redirect specifically is NOT triggered, any later failure or
    // success is outside this test's scope.
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "x@example.com" } },
      error: null,
    });

    const { default: DashboardPage } = await import("../page");

    try {
      await DashboardPage();
    } catch (err) {
      if (err instanceof RedirectError) {
        expect(err.target).not.toBe("/auth");
      }
      // Any non-redirect error is irrelevant to this assertion.
    }
  });

  it("passes lossCurveData to DashboardView with 12 weekly buckets", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "x@example.com" } },
      error: null,
    });

    tableData.exercise_attempts = [
      { attempted_at: "2026-04-14T10:00:00Z", hints_used: 3 },
      { attempted_at: "2026-04-16T22:00:00Z", hints_used: 5 },
    ];

    const { default: DashboardPage } = await import("../page");

    const element = await DashboardPage();
    const props = getDashboardViewProps(element);

    expect(props).not.toBeNull();
    const lossCurveData = props!.lossCurveData as {
      weekly: Array<{ weekStart: string; avgHints: number | null }>;
    };
    expect(lossCurveData).toBeDefined();
    expect(Array.isArray(lossCurveData.weekly)).toBe(true);
    expect(lossCurveData.weekly).toHaveLength(12);
    // Each entry has the canonical weekly-hints shape.
    for (const w of lossCurveData.weekly) {
      expect(typeof w.weekStart).toBe("string");
      expect(w.avgHints === null || typeof w.avgHints === "number").toBe(true);
    }
  });

  it("yields 12 null-avgHints buckets when exercise_attempts is empty", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "x@example.com" } },
      error: null,
    });

    tableData.exercise_attempts = [];
    // A completed lesson keeps this zero-attempts account out of the
    // first-run branch, so the page still returns DashboardView.
    tableData.world_progress = [
      {
        world_id: "deep-orbit",
        module_id: "m",
        lesson_id: "l",
        status: "completed",
        updated_at: "2026-08-01T00:00:00Z",
      },
    ];

    const { default: DashboardPage } = await import("../page");

    const element = await DashboardPage();
    const props = getDashboardViewProps(element);

    expect(props).not.toBeNull();
    const lossCurveData = props!.lossCurveData as {
      weekly: Array<{ weekStart: string; avgHints: number | null }>;
    };
    expect(lossCurveData.weekly).toHaveLength(12);
    expect(lossCurveData.weekly.every((w) => w.avgHints === null)).toBe(true);
  });
});
