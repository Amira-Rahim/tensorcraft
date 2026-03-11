import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { authMiddleware } from "./auth";
import type { AppEnv } from "../types";

const mockGetUser = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

describe("authMiddleware", () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    mockGetUser.mockReset();
    app = new Hono<AppEnv>();
    app.use("*", authMiddleware);
    app.get("/test", (c) => {
      return c.json({
        userId: c.get("userId"),
        accessToken: c.get("accessToken"),
      });
    });
  });

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  it("returns 401 with non-Bearer token", async () => {
    const res = await app.request("/test", {
      headers: { Authorization: "Basic abc123" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 when Supabase rejects the token", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid token" },
    });

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer invalid_token" },
    });
    expect(res.status).toBe(401);
  });

  it("sets userId and accessToken on success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user_123" } },
      error: null,
    });

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer valid_token" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe("user_123");
    expect(body.accessToken).toBe("valid_token");
  });
});
