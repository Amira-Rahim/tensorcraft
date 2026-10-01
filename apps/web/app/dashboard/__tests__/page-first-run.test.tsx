import { describe, it, expect, vi, beforeEach } from "vitest";
const state = vi.hoisted(() => ({
  tables: {} as Record<string, unknown[]>,
  errors: {} as Record<string, unknown>,
  owned: new Set<string>(),
  route: null as null | "challenge",
  user: { id: "u-1", email: "amira@example.test" },
}));
vi.mock("@/lib/learning-route-server", () => ({
  getLearningRoutePreference: async () => ({ route: state.route }),
}));
vi.mock("@/lib/entitlements", () => ({
  getEntitledWorlds: async () => state.owned,
}));
vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new Error(`redirect:${target}`);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      const result = {
        data: state.tables[table] ?? [],
        error: state.errors[table] ?? null,
      };
      const q: Record<string, unknown> = {};
      for (const method of ["select", "eq", "in", "order", "limit"])
        q[method] = () => q;
      q.single = () => result;
      q.then = (resolve: (v: typeof result) => unknown) =>
        Promise.resolve(result).then(resolve);
      return q;
    },
  }),
}));
vi.mock("@tensorcraft/content", () => {
  const modules = [
    { slug: "foundations", order: 1, title: "Foundations" },
    { slug: "networks", order: 2, title: "Neural networks" },
    { slug: "training", order: 3, title: "Training" },
  ];
  const lessons = [
    {
      slug: "intro",
      title: "Introduction to Tensors",
      moduleId: "foundations",
    },
    { slug: "shapes", title: "Tensor Shapes", moduleId: "foundations" },
    { slug: "neuron", title: "First Neuron", moduleId: "networks" },
    { slug: "loss", title: "Loss", moduleId: "training" },
  ];
  return {
    getModules: () => modules,
    getModuleLessons: (_world: string, module: string) =>
      lessons.filter((l) => l.moduleId === module),
    getWorldLessons: () => lessons,
    getLesson: (_world: string, _module: string, lesson: string) =>
      lessons.find((l) => l.slug === lesson),
    getLessonTotalMinutes: () => 12,
    getLessonsWithBridges: () => [],
  };
});
vi.mock("../dashboard-view", () => ({ DashboardView: () => null }));
const progress = (
  lesson_id: string,
  module_id = "foundations",
  status = "completed",
) => ({
  world_id: "deep-orbit",
  module_id,
  lesson_id,
  status,
  updated_at: "2026-09-30T10:00:00Z",
});
beforeEach(() => {
  state.tables = {};
  state.errors = {};
  state.owned = new Set();
  state.route = null;
});
async function data(view: "home" | "progress" | "project" = "home") {
  const { loadDashboardData } = await import("../_lib/load-dashboard");
  return loadDashboardData(view);
}

describe("dashboard learning states", () => {
  it("uses the same compact dashboard for a new learner, a completion, and an exercise attempt", async () => {
    const { default: Page } = await import("../page");
    const first = await Page();
    expect(first.props.currentModule.topic).toBe("Introduction to Tensors");
    expect(first.props.resumeLabel).toBe("Start learning →");
    state.tables.world_progress = [progress("intro")];
    const returning = await Page();
    expect(returning.type).toBe(first.type);
    expect(returning.props.currentModule.topic).toBe("Tensor Shapes");
    expect(returning.props.resumeLabel).toBe("Continue course →");
    state.tables.world_progress = [];
    state.tables.exercise_attempts = [
      {
        score: null,
        world_id: "deep-orbit",
        lesson_id: "intro",
        hints_used: 0,
        attempted_at: "2026-09-30T10:00:00Z",
      },
    ];
    expect((await Page()).type).toBe(first.type);
  });
  it("describes the first incomplete lesson as Continue course when newer lessons were visited", async () => {
    state.tables.world_progress = [
      progress("intro"),
      progress("loss", "training", "in_progress"),
    ];
    const { dashboard } = await data();
    expect(dashboard.resumeUrl).toBe("/worlds/deep-orbit/foundations/shapes");
    expect(dashboard.resumeLabel).toBe("Continue course →");
  });
  it("distinguishes paid frontier access from later prerequisites", async () => {
    state.tables.world_progress = [progress("intro"), progress("shapes")];
    const { dashboard } = await data();
    expect(dashboard.modules[1].lockReason).toBe("access");
    expect(dashboard.modules[2].lockReason).toBe("prerequisite");
    expect(dashboard.resumeUrl).toBe(
      "/pricing?locked=deep-orbit&module=networks",
    );
    state.owned.add("deep-orbit");
    const paid = (await data()).dashboard;
    expect(paid.modules[1].status).toBe("active");
    expect(paid.modules[2].lockReason).toBe("prerequisite");
  });
  it("surfaces due reviews directly and excludes future reviews", async () => {
    state.tables.review_queue = [
      { lesson_id: "intro", next_review_at: "2020-01-01T00:00:00Z" },
      { lesson_id: "shapes", next_review_at: "2099-01-01T00:00:00Z" },
    ];
    const { dashboard } = await data();
    expect(dashboard.dueReviews).toHaveLength(1);
    expect(dashboard.dueReviews[0].href).toBe(
      "/worlds/deep-orbit/foundations/intro#step-1",
    );
  });
  it("keeps unavailable review records distinct from an empty queue", async () => {
    state.errors.review_queue = new Error("Unavailable");
    const { dashboard } = await data();
    expect(dashboard.reviewsUnavailable).toBe(true);
    expect(dashboard.dueReviews).toEqual([]);
  });
  it("excludes null scores and other worlds from the score average", async () => {
    state.tables.exercise_attempts = [
      {
        world_id: "deep-orbit",
        lesson_id: "intro",
        score: 100,
        hints_used: 0,
        attempted_at: "2026-09-30T00:00:00Z",
      },
      {
        world_id: "deep-orbit",
        lesson_id: "intro",
        score: null,
        hints_used: null,
        attempted_at: "2026-09-29T00:00:00Z",
      },
      {
        world_id: "other",
        lesson_id: "test",
        score: 0,
        hints_used: 2,
        attempted_at: "2026-09-29T00:00:00Z",
      },
    ];
    const { dashboard } = await data("progress");
    expect(dashboard.averageScore).toBe(100);
    expect(dashboard.scoredAttemptCount).toBe(1);
    expect(dashboard.exerciseLessonCount).toBe(1);
  });
  it("preserves the challenge route preference for course continuation", async () => {
    state.route = "challenge";
    expect((await data()).dashboard.resumeUrl).toBe(
      "/worlds/deep-orbit/foundations/intro?start=challenge",
    );
  });
  it("counts known completed lessons once and links recent accomplishments", async () => {
    state.tables.world_progress = [
      progress("intro"),
      progress("intro"),
      progress("removed"),
    ];
    const { dashboard } = await data();
    expect(dashboard.completedLessons).toBe(1);
    expect(dashboard.totalLessons).toBe(4);
    expect(dashboard.recentActivity[0].href).toBe(
      "/worlds/deep-orbit/foundations/intro",
    );
  });
});
