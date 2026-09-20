import { beforeEach, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { Children, isValidElement } from "react";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  purchase: vi.fn(),
  preference: vi.fn(),
  completed: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("404");
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/progress", () => ({
  getUserProgress: async () => [],
  getPassedExercises: async () => ({ slugs: [], unavailable: false }),
  hasWorldPurchase: mocks.purchase,
  isModuleCompleted: mocks.completed,
}));
vi.mock("@/lib/learning-route-server", () => ({
  getLearningRoutePreference: mocks.preference,
}));
vi.mock("@/lib/review-store-server", () => ({
  resolveDueForUser: async () => [],
}));
vi.mock("./lesson-steps", () => ({ LessonSteps: () => null }));
import LessonPage from "./page";
import { LessonSteps } from "./lesson-steps";

function findSteps(element: ReactElement): Record<string, unknown> | undefined {
  if (element.type === LessonSteps)
    return element.props as Record<string, unknown>;
  for (const child of Children.toArray(
    (element.props as { children?: React.ReactNode }).children,
  )) {
    if (isValidElement(child)) {
      const found = findSteps(child);
      if (found) return found;
    }
  }
}
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement(node)) {
    const type = node.type as string | { name?: string };
    const name = typeof type === "string" ? type : (type.name ?? "");
    return `${name} ${textOf((node.props as { children?: React.ReactNode }).children)}`;
  }
  return "";
}

const paid = {
  slug: "deep-orbit",
  module: "browser-runtimes",
  lesson: "why-the-browser",
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "alice" } } });
  mocks.purchase.mockResolvedValue(true);
  mocks.completed.mockResolvedValue(false);
  mocks.preference.mockResolvedValue({
    route: "challenge",
    unavailable: false,
  });
});

it("holds a paid lesson behind the previous module while that module is incomplete", async () => {
  // Owner ruling 2026-09-20: sequential module unlock stays. P2 had made
  // prerequisites advisory for purchasers; that removal does not stand.
  const page = await LessonPage({ params: Promise.resolve(paid) });
  expect(findSteps(page)).toBeUndefined();
  expect(textOf(page)).toContain("Complete the previous module first");
  expect(textOf(page)).toContain("Go to previous module");
  expect(mocks.purchase).toHaveBeenCalledWith("alice", "deep-orbit");
});

it("opens a paid lesson on its scene once the previous module is complete, without marking any lesson complete", async () => {
  mocks.completed.mockResolvedValue(true);
  const page = await LessonPage({ params: Promise.resolve(paid) });
  const steps = findSteps(page)!;
  // The saved challenge route used to enter at step 3, so a learner who
  // picked it never saw a Briefing on any lesson (owner, 2026-09-20).
  expect(steps.entryStep).toBe(0);
  expect(
    (steps.lessons as { completed: boolean }[]).every((l) => !l.completed),
  ).toBe(true);
  expect(mocks.purchase).toHaveBeenCalledWith("alice", "deep-orbit");
});

it.each([null, { id: "alice" }])(
  "cannot use a route query to enter paid content without entitlement (%j)",
  async (user) => {
    mocks.getUser.mockResolvedValue({ data: { user } });
    mocks.purchase.mockResolvedValue(false);
    await expect(
      LessonPage({
        params: Promise.resolve(paid),
        searchParams: Promise.resolve({ start: "challenge" }),
      }),
    ).rejects.toThrow(
      "REDIRECT:/pricing?locked=deep-orbit&module=browser-runtimes",
    );
  },
);

it("allows explicit conceptual review over the saved challenge recommendation", async () => {
  mocks.completed.mockResolvedValue(true);
  const page = await LessonPage({
    params: Promise.resolve(paid),
    searchParams: Promise.resolve({ start: "concept" }),
  });
  expect(findSteps(page)!.entryStep).toBe(1);
});

it("keeps the first experiment free with a guided fallback when preferences are unavailable", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  mocks.preference.mockResolvedValue({ route: null, unavailable: true });
  const page = await LessonPage({
    params: Promise.resolve({
      slug: "deep-orbit",
      module: "foundations",
      lesson: "tensor-shapes",
    }),
    searchParams: Promise.resolve({ start: "experiment" }),
  });
  expect(findSteps(page)!.entryStep).toBe(1);
  expect(mocks.purchase).not.toHaveBeenCalled();
});

it("still honors an explicit challenge link for a learner on that route", async () => {
  mocks.completed.mockResolvedValue(true);
  const page = await LessonPage({
    params: Promise.resolve(paid),
    searchParams: Promise.resolve({ start: "challenge" }),
  });
  expect(findSteps(page)!.entryStep).toBe(3);
});

it("keeps course preferences off the lesson page", async () => {
  mocks.completed.mockResolvedValue(true);
  const rendered = textOf(await LessonPage({ params: Promise.resolve(paid) }));
  expect(rendered).not.toContain("LearningRoutePicker");
  expect(rendered).not.toContain("Course route and prerequisites");
  expect(rendered).not.toContain("ModuleEntryContext");
});

it("gives a module opener catch-up and hands it to the reader, not the page", async () => {
  mocks.completed.mockResolvedValue(true);
  const page = await LessonPage({ params: Promise.resolve(paid) });
  expect(findSteps(page)!.moduleEntry).toEqual({
    moduleSlug: "browser-runtimes",
    previousModule: "training-loop",
    previousComplete: true,
  });
  // It belongs to the Briefing, so the page itself must not render it.
  expect(textOf(page)).not.toContain("Where the investigation stands");
});

it.each([
  [
    "foundations",
    "introduction-to-tensors",
    "the first module has nothing to catch up on",
  ],
  [
    "browser-runtimes",
    "tensorflow-js-setup",
    "a mid-module lesson follows the one before it",
  ],
])("carries no catch-up on %s/%s, because %s", async (module, lesson) => {
  mocks.completed.mockResolvedValue(true);
  const page = await LessonPage({
    params: Promise.resolve({ slug: "deep-orbit", module, lesson }),
  });
  expect(findSteps(page)!.moduleEntry).toBeNull();
});
