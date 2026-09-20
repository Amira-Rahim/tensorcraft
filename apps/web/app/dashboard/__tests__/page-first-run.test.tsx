import { describe, it, expect, vi, beforeEach } from "vitest";

// Same mock scaffolding as page.test.tsx, but the content mock carries
// one real module so the first-run briefing can build.
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

const getUserMock = vi.fn();

const tableData: Record<string, unknown> = {};
function resetTableData() {
  for (const key of Object.keys(tableData)) delete tableData[key];
}

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

vi.mock("@tensorcraft/content", () => {
  const lessons = [
    { slug: "introduction-to-tensors", title: "Introduction to Tensors" },
    {
      slug: "understanding-tensor-shapes",
      title: "Understanding Tensor Shapes",
    },
  ];
  return {
    getModules: () => [
      {
        slug: "foundations",
        order: 1,
        title: "Foundations: Tensors & Data",
        description: "Build your first net",
      },
    ],
    getModule: () => null,
    getModuleLessons: () => lessons,
    getLesson: () => null,
    getLessonTotalMinutes: () => 12,
    getWorldLessons: () => lessons,
    getLessonsWithBridges: () => [],
  };
});

vi.mock("../first-run-view", () => ({
  FirstRunView: function FirstRunViewMock() {
    return null;
  },
}));
vi.mock("../dashboard-view", () => ({
  DashboardView: function DashboardViewMock() {
    return null;
  },
}));
vi.mock("../world-cards", () => ({
  WorldCards: () => null,
}));

function viewName(element: unknown): string | undefined {
  const el = element as { type?: { name?: string } };
  return el?.type?.name;
}

function viewProps(element: unknown): Record<string, unknown> {
  const el = element as { props?: Record<string, unknown> };
  return el?.props ?? {};
}

describe("dashboard/page first-run branch", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    resetTableData();
    getUserMock.mockResolvedValue({
      data: { user: { id: "u-1", email: "amira@example.com" } },
      error: null,
    });
  });

  it("renders FirstRunView for an account with no completed lessons and no attempts", async () => {
    const { default: DashboardPage } = await import("../page");

    const element = await DashboardPage();
    expect(viewName(element)).toBe("FirstRunViewMock");

    const props = viewProps(element);
    const briefing = props.briefing as { number: number; lessonNumber: number };
    expect(briefing.number).toBe(1);
    expect(briefing.lessonNumber).toBe(1);
    expect(props.resumeUrl).toBe(
      "/worlds/deep-orbit/foundations/introduction-to-tensors",
    );
    expect(props.totalWorldLessons).toBe(2);
  });

  it("hands FirstRunView no evidence panel, because nothing has been recorded yet", async () => {
    // Audit 2026-09-20: the five-stage panel rendered empty on first run and
    // pointed a free learner at four paid modules. It waits for a record.
    const { default: DashboardPage } = await import("../page");
    const element = await DashboardPage();
    expect(viewName(element)).toBe("FirstRunViewMock");
    expect(viewProps(element).systemEvidence).toBeUndefined();
  });

  it("renders FirstRunView when lessons were started but never completed", async () => {
    tableData.world_progress = [
      {
        world_id: "deep-orbit",
        module_id: "foundations",
        lesson_id: "introduction-to-tensors",
        status: "in_progress",
        updated_at: "2026-08-16T10:00:00Z",
      },
    ];

    const { default: DashboardPage } = await import("../page");

    const element = await DashboardPage();
    expect(viewName(element)).toBe("FirstRunViewMock");
  });

  it("renders the full DashboardView once a lesson is completed", async () => {
    tableData.world_progress = [
      {
        world_id: "deep-orbit",
        module_id: "foundations",
        lesson_id: "introduction-to-tensors",
        status: "completed",
        updated_at: "2026-08-16T10:00:00Z",
      },
    ];

    const { default: DashboardPage } = await import("../page");

    const element = await DashboardPage();
    expect(viewName(element)).toBe("DashboardViewMock");
  });

  it("renders the full DashboardView once any exercise attempt exists", async () => {
    tableData.exercise_attempts = [
      {
        score: null,
        attempted_at: "2026-08-16T10:00:00Z",
        lesson_id: "introduction-to-tensors",
        world_id: "deep-orbit",
        hints_used: 0,
      },
    ];

    const { default: DashboardPage } = await import("../page");

    const element = await DashboardPage();
    // A recorded attempt exits first-run even with a null score.
    expect(viewName(element)).toBe("DashboardViewMock");
  });
});
