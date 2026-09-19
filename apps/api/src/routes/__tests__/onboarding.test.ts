import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";

const mockGetUser = vi.fn();
const mockAdminUpdate = vi.fn();
const mockTagSubscriber = vi.fn();

// Profile row returned by the initial SELECT before the UPDATE. Tests
// override this to flip `onboarding_completed` between false (the
// first-time transition case) and true (the retry/no-op case).
let mockProfileRow: { onboarding_completed: boolean; email: string } = {
  onboarding_completed: false,
  email: "user@test.dev",
};

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({}),
  }),
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: mockProfileRow, error: null }),
            }),
          }),
          update: (data: unknown) => {
            mockAdminUpdate(data);
            return {
              eq: () => ({
                select: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: "user_123",
                        ...(data as Record<string, unknown>),
                      },
                      error: null,
                    }),
                }),
              }),
            };
          },
        };
      }
      return {};
    },
  }),
}));

vi.mock("../../lib/redis", () => ({
  getRedis: () => ({
    get: () => Promise.resolve(null),
    set: () => Promise.resolve("OK"),
  }),
}));

vi.mock("../../lib/kit", () => ({
  tagSubscriber: (...args: unknown[]) => {
    mockTagSubscriber(...args);
    return Promise.resolve({ id: 1, email_address: "user@test.dev" });
  },
}));

beforeEach(() => {
  mockGetUser.mockReset();
  mockAdminUpdate.mockReset();
  mockTagSubscriber.mockReset();
  mockProfileRow = { onboarding_completed: false, email: "user@test.dev" };
  vi.unstubAllEnvs();
});

const { onboarding } = await import("../onboarding");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/onboarding", onboarding);
  return app;
}

function authedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user_123" } },
    error: null,
  });
}

describe("PATCH /api/onboarding", () => {
  it.each(["guided", "challenge", null])(
    "saves ML route %s without changing JS experience or awarding completion",
    async (route) => {
      authedUser();
      const res = await createApp().request("/api/onboarding", {
        method: "PATCH",
        headers: {
          Authorization: "Bearer valid",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ml_learning_route: route,
          role: "admin",
          user_id: "another-user",
        }),
      });
      expect(res.status).toBe(200);
      expect(mockAdminUpdate).toHaveBeenCalledWith({
        ml_learning_route: route,
        updated_at: expect.any(String),
      });
      expect(mockTagSubscriber).not.toHaveBeenCalled();
    },
  );

  it.each([
    { ml_learning_route: "advanced" },
    { ml_learning_route: 1 },
    null,
    [],
    "challenge",
  ])("rejects invalid preference input %j", async (payload) => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    expect(res.status).toBe(400);
    expect(mockAdminUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 without auth", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "no token" },
    });

    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experience_level: "beginner" }),
    });
    expect(res.status).toBe(401);
  });

  it("updates valid fields and returns the profile", async () => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        experience_level: "intermediate",
        learning_goal: "career",
        js_experience_years: 4,
        js_background: "Built apps in prod",
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      profile: Record<string, unknown>;
    };
    expect(body.profile.experience_level).toBe("intermediate");
    expect(body.profile.learning_goal).toBe("career");
    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        experience_level: "intermediate",
        learning_goal: "career",
        js_experience_years: 4,
      }),
    );
  });

  it("shims the pre-059 keys from stale clients onto the js_* columns", async () => {
    // One-release shim: a client deployed before the rebrand still sends
    // fe_background / fe_experience_years / fe_framework. The first two map
    // to the renamed columns; fe_framework is ignored (column dropped).
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fe_background: "Legacy client",
        fe_experience_years: 3,
        fe_framework: "react",
      }),
    });
    expect(res.status).toBe(200);
    expect(mockAdminUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        js_background: "Legacy client",
        js_experience_years: 3,
      }),
    );
    const updateArg = mockAdminUpdate.mock.calls.at(-1)?.[0] as Record<
      string,
      unknown
    >;
    expect(updateArg).not.toHaveProperty("fe_framework");
    expect(updateArg).not.toHaveProperty("fe_background");
    expect(updateArg).not.toHaveProperty("fe_experience_years");
  });

  it("rejects invalid experience_level", async () => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ experience_level: "guru" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/experience_level/);
  });

  it("rejects invalid learning_goal", async () => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ learning_goal: "worldpeace" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/learning_goal/);
  });

  it("rejects empty body", async () => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("rejects js_experience_years out of range", async () => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ js_experience_years: 99 }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects non-boolean onboarding_completed", async () => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ onboarding_completed: "yes" }),
    });
    expect(res.status).toBe(400);
  });

  it("fires Kit onboarded tag on false -> true transition", async () => {
    authedUser();
    vi.stubEnv("KIT_TAG_ONBOARDED", "9999");
    mockProfileRow = {
      onboarding_completed: false,
      email: "first-timer@test.dev",
    };

    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ onboarding_completed: true }),
    });

    expect(res.status).toBe(200);
    // Allow the best-effort .catch() promise to settle.
    await new Promise((r) => setTimeout(r, 0));
    expect(mockTagSubscriber).toHaveBeenCalledTimes(1);
    expect(mockTagSubscriber).toHaveBeenCalledWith(
      "first-timer@test.dev",
      "9999",
    );
  });

  it("does NOT fire Kit onboarded tag on repeat (true -> true)", async () => {
    authedUser();
    vi.stubEnv("KIT_TAG_ONBOARDED", "9999");
    mockProfileRow = {
      onboarding_completed: true,
      email: "already-done@test.dev",
    };

    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ onboarding_completed: true }),
    });

    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockTagSubscriber).not.toHaveBeenCalled();
  });

  it("does NOT fire Kit onboarded tag when KIT_TAG_ONBOARDED is unset", async () => {
    authedUser();
    mockProfileRow = {
      onboarding_completed: false,
      email: "no-kit-config@test.dev",
    };
    // KIT_TAG_ONBOARDED intentionally unstubbed / undefined.

    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ onboarding_completed: true }),
    });

    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockTagSubscriber).not.toHaveBeenCalled();
  });

  it("does NOT fire Kit onboarded tag when onboarding_completed is not in the payload", async () => {
    authedUser();
    vi.stubEnv("KIT_TAG_ONBOARDED", "9999");
    mockProfileRow = {
      onboarding_completed: false,
      email: "partial-update@test.dev",
    };

    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ experience_level: "beginner" }),
    });

    expect(res.status).toBe(200);
    await new Promise((r) => setTimeout(r, 0));
    expect(mockTagSubscriber).not.toHaveBeenCalled();
  });
});
