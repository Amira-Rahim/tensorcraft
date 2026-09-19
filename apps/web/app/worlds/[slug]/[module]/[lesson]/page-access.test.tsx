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
vi.mock("@/app/components/learning-route-picker", () => ({
  LearningRoutePicker: () => null,
}));
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

it("opens a paid challenge with incomplete prerequisites, without marking any lesson complete", async () => {
  const page = await LessonPage({ params: Promise.resolve(paid) });
  const steps = findSteps(page)!;
  expect(steps.entryStep).toBe(3);
  expect(
    (steps.lessons as { locked: boolean; completed: boolean }[]).every(
      (l) => !l.locked && !l.completed,
    ),
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
