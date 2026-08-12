import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../../types";

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: () => ({
      update: (data: unknown) => {
        mockUpdate(data);
        return {
          eq: () => ({
            select: () => ({
              single: mockSingle,
            }),
          }),
        };
      },
    }),
  }),
}));

const { profiles } = await import("../profiles");

function createApp() {
  const app = new Hono<AppEnv>();
  app.route("/api/profiles", profiles);
  return app;
}

describe("Profiles routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    mockGetUser.mockReset();
    mockUpdate.mockReset();
    mockSingle.mockReset();
    app = createApp();
  });

  describe("PATCH /api/profiles/:userId", () => {
    it("returns 401 without auth", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "No token" },
      });

      const res = await app.request("/api/profiles/user_123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: "Test" }),
      });
      expect(res.status).toBe(401);
    });

    it("returns profile on successful update", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const profileData = {
        id: "user_123",
        display_name: "Updated Name",
      };
      mockSingle.mockResolvedValue({ data: profileData, error: null });

      const res = await app.request("/api/profiles/user_123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify({ display_name: "Updated Name" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.profile.display_name).toBe("Updated Name");
    });

    it("updates profile fields", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });
      mockSingle.mockResolvedValue({
        data: { id: "user_123", display_name: "New Name" },
        error: null,
      });

      const res = await app.request("/api/profiles/user_123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify({ display_name: "New Name" }),
      });

      expect(res.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({ display_name: "New Name" });
    });

    it("rejects invalid github_username", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const res = await app.request("/api/profiles/user_123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify({ github_username: "invalid user!@#" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/github_username/i);
    });

    it("rejects invalid avatar_url (not a valid URL)", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const res = await app.request("/api/profiles/user_123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify({ avatar_url: "not-a-valid-url" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/avatar_url/i);
    });

    it("validates preferred_world_id against valid strings", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user_123" } },
        error: null,
      });

      const res = await app.request("/api/profiles/user_123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid_token",
        },
        body: JSON.stringify({ preferred_world_id: "" }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/preferred_world_id/i);
    });
  });
});
