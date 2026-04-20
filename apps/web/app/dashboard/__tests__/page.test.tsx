import { describe, it, expect, vi, beforeEach } from "vitest";

// `redirect()` in next/navigation throws a special error at runtime. We mock
// it to throw a tagged error so the test can assert the correct target
// without pulling in the Next runtime.
class RedirectError extends Error {
  constructor(public target: string) {
    super(`NEXT_REDIRECT:${target}`);
  }
}

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new RedirectError(target);
  },
}));

// Avoid reaching into the real Supabase server helper which requires
// env vars + the Next `cookies()` runtime. The dashboard page only needs
// the shape used in its auth guard / queries.
const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ data: [] }),
          order: () => ({ limit: () => ({ data: [] }) }),
          single: () => ({ data: null }),
        }),
      }),
    }),
  }),
}));

// Content package is a pure ESM module backed by Velite output; we don't
// need real content for the unauthenticated redirect test.
vi.mock("@tensorcraft/content", () => ({
  getModules: () => [],
  getModule: () => null,
  getModuleLessons: () => [],
  getLesson: () => null,
  getThemeLessons: () => [],
  getLessonsWithBridges: () => [],
}));

describe("dashboard/page (server component)", () => {
  beforeEach(() => {
    getUserMock.mockReset();
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
    // /auth redirect specifically is NOT triggered — any later failure or
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
});
