import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

/**
 * GDPR self-serve endpoints (Tier 1-LEGAL, built 2026-07-25):
 * GET /api/profiles/export and POST /api/profiles/delete. The privacy page
 * promised both since April; these tests pin the contracts that matter -
 * no live credential in the export, typed confirmation on delete, waitlist
 * cleanup by email, and a loud failure when the auth deletion fails.
 */

const mockDeleteUser = vi.fn();
const mockWaitlistDelete = vi.fn();
const mockUnsubscribeFromAll = vi.fn(async () => null);

const mockProfileRow: Record<string, unknown> | null = {
  id: "user-test-123",
  email: "learner@example.com",
  display_name: "Learner",
  avatar_url: null,
  github_username: null,
  github_connected: true,
  onboarding_completed: true,
  experience_level: "mid",
  learning_goal: "ship-ml",
  fe_background: "react",
  fe_experience_years: 4,
  email_alerts: true,
  weekly_digest: false,
  stripe_customer_id: null,
  created_at: "2026-01-01",
  updated_at: "2026-07-01",
};

function tableApi() {
  const api: Record<string, unknown> = {};
  api.select = () => api;
  api.eq = () => api;
  api.limit = () => Promise.resolve({ data: [], error: null });
  api.single = () => Promise.resolve({ data: mockProfileRow, error: null });
  api.maybeSingle = () =>
    Promise.resolve({ data: mockProfileRow, error: null });
  api.delete = () => ({
    eq: (...args: unknown[]) => {
      mockWaitlistDelete(...args);
      return Promise.resolve({ error: null });
    },
  });
  return api;
}

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: "user-test-123" } },
          error: null,
        }),
    },
    from: () => tableApi(),
  }),
  getSupabaseAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
    from: () => tableApi(),
  }),
}));

vi.mock("../../lib/kit", () => ({
  unsubscribeFromAll: (...args: unknown[]) => mockUnsubscribeFromAll(...args),
}));

import { profiles } from "../profiles";

const app = new Hono();
app.route("/api/profiles", profiles);

const AUTH = { Authorization: "Bearer test-token" };

beforeEach(() => {
  mockDeleteUser.mockReset();
  mockDeleteUser.mockResolvedValue({ data: {}, error: null });
  mockWaitlistDelete.mockReset();
  mockUnsubscribeFromAll.mockClear();
});

describe("GET /api/profiles/export", () => {
  it("returns a JSON attachment with account + tables, never the raw GitHub token", async () => {
    const res = await app.request("/api/profiles/export", { headers: AUTH });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("attachment");

    const body = await res.json();
    expect(body.exportVersion).toBe(1);
    expect(body.account.email).toBe("learner@example.com");
    // The token is a LIVE credential: disclosed, never exported.
    expect(body.account.github_token).toMatch(/revoke|Disconnect/);
    expect(JSON.stringify(body)).not.toMatch(/gho_|ghp_/);
    // Every user-data table appears, even when empty.
    expect(Object.keys(body.tables)).toContain("purchases");
    expect(Object.keys(body.tables)).toContain("world_progress");
    expect(Array.isArray(body.waitlist)).toBe(true);
  });
});

describe("POST /api/profiles/delete", () => {
  it("refuses without the typed confirmation literal", async () => {
    const res = await app.request("/api/profiles/delete", {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "yes" }),
    });
    expect(res.status).toBe(400);
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it("deletes the auth user and cleans waitlist rows by email", async () => {
    const res = await app.request("/api/profiles/delete", {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockUnsubscribeFromAll).toHaveBeenCalledWith("learner@example.com");
    expect(mockWaitlistDelete).toHaveBeenCalledWith(
      "email",
      "learner@example.com",
    );
    expect(mockDeleteUser).toHaveBeenCalledWith("user-test-123");
  });

  it("fails loud (500) when the auth deletion fails", async () => {
    mockDeleteUser.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });
    const res = await app.request("/api/profiles/delete", {
      method: "POST",
      headers: { ...AUTH, "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    expect(res.status).toBe(500);
  });
});
