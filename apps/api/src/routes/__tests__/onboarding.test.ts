import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";

const mockGetUser = vi.fn();
const mockAdminUpdate = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: { getUser: mockGetUser },
    from: () => ({}),
  }),
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "profiles") {
        return {
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

beforeEach(() => {
  mockGetUser.mockReset();
  mockAdminUpdate.mockReset();
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
        fe_framework: "react",
        fe_experience_years: 4,
        fe_background: "Built apps in prod",
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
        fe_framework: "react",
        fe_experience_years: 4,
      }),
    );
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

  it("rejects fe_experience_years out of range", async () => {
    authedUser();
    const res = await createApp().request("/api/onboarding", {
      method: "PATCH",
      headers: {
        Authorization: "Bearer valid",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fe_experience_years: 99 }),
    });
    expect(res.status).toBe(400);
  });
});
