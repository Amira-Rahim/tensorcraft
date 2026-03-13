import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";

const mockGetUser = vi.fn();
const mockInsert = vi.fn();
const mockSelectQuery = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => {
      const chainable: Record<string, unknown> = {
        insert: (data: unknown) => {
          mockInsert(data);
          return {
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: "attempt_1", ...data },
                  error: null,
                }),
            }),
          };
        },
        select: () => chainable,
        eq: () => chainable,
        order: () => chainable,
        then: (resolve: (v: unknown) => void) => {
          return mockSelectQuery().then(resolve);
        },
      };
      return chainable;
    },
  }),
}));

vi.mock("@tensorcraft/shared", () => ({
  isValidThemeSlug: (slug: string) =>
    [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ].includes(slug),
  isValidSlug: (slug: string) =>
    typeof slug === "string" && /^[a-z0-9-]+$/.test(slug) && slug.length > 0,
}));

const { exerciseAttempts } = await import("../exercise-attempts");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/exercise-attempts", exerciseAttempts);
  return app;
}

const validAttempt = {
  exerciseSlug: "tensor-basics",
  lessonId: "lesson-01",
  themeId: "deep-orbit",
  passed: true,
  score: 85,
};

describe("Exercise attempts routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    mockGetUser.mockReset();
    mockInsert.mockReset();
    mockSelectQuery.mockReset();
    app = createApp();
  });

  describe("GET /api/exercise-attempts", () => {
    it("returns 401 without auth", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "No token" },
      });

      const res = await app.request(
        "/api/exercise-attempts?lessonId=lesson-01",
      );
      expect(res.status).toBe(401);
    });

    it("returns attempts for authenticated user", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const attempts = [
        { id: "a1", passed: true, score: 90 },
        { id: "a2", passed: false, score: 40 },
      ];
      mockSelectQuery.mockResolvedValue({ data: attempts, error: null });

      const res = await app.request(
        "/api/exercise-attempts?lessonId=lesson-01&themeId=deep-orbit",
        {
          headers: { Authorization: "Bearer valid_token" },
        },
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attempts).toHaveLength(2);
    });
  });

  describe("POST /api/exercise-attempts", () => {
    it("creates new attempt", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const res = await app.request("/api/exercise-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify(validAttempt),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.attempt).toBeDefined();
      expect(mockInsert).toHaveBeenCalled();
    });

    it("validates required fields", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const res = await app.request("/api/exercise-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify({ passed: true }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/required/i);
    });

    it("rejects oversized submitted_code", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const oversizedCode = "x".repeat(102_401);

      const res = await app.request("/api/exercise-attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify({
          ...validAttempt,
          submittedCode: oversizedCode,
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/submittedCode/i);
    });
  });
});
