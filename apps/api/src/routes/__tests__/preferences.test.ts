import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const tagSubscriberMock = vi.fn(async () => ({
  id: 1,
  email_address: "user@example.com",
}));
const removeTagMock = vi.fn(async () => ({
  id: 1,
  email_address: "user@example.com",
}));
const addSubscriberMock = vi.fn(async () => ({
  id: 1,
  email_address: "user@example.com",
}));

vi.mock("../../lib/kit", () => ({
  addSubscriber: addSubscriberMock,
  tagSubscriber: tagSubscriberMock,
  removeTagFromSubscriber: removeTagMock,
}));

let mockUpdatedRow: Record<string, unknown> = {
  email: "user@example.com",
  email_alerts: true,
  weekly_digest: true,
};
const updateSingleMock = vi.fn(async () => ({
  data: mockUpdatedRow,
  error: null,
}));
const updateSelectMock = vi.fn(() => ({ single: updateSingleMock }));
const updateEqMock = vi.fn(() => ({ select: updateSelectMock }));
const updateMock = vi.fn(() => ({ eq: updateEqMock }));

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({ update: updateMock }),
  }),
}));

vi.mock("../../middleware/auth", () => ({
  authMiddleware: async (
    c: {
      set: (k: string, v: string) => void;
      req: { header: (k: string) => string | undefined };
      json: (b: unknown, s?: number) => unknown;
    },
    next: () => Promise<void>,
  ) => {
    const auth = c.req.header("Authorization");
    if (!auth) return c.json({ error: "Unauthorized" }, 401);
    c.set("userId", "user-1");
    c.set("accessToken", "token");
    await next();
  },
}));

const { preferences } = await import("../preferences");

const app = new Hono();
app.route("/api/preferences", preferences);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PATCH /api/preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockUpdatedRow = {
      email: "user@example.com",
      email_alerts: true,
      weekly_digest: true,
    };
  });

  it("401 without auth header", async () => {
    const res = await app.request("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_alerts: true }),
    });
    expect(res.status).toBe(401);
  });

  it("400 for invalid JSON", async () => {
    const res = await app.request("/api/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("400 if no valid fields provided", async () => {
    const res = await app.request("/api/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ unrelated: "yes" }),
    });
    expect(res.status).toBe(400);
  });

  it("400 if email_alerts not a boolean", async () => {
    const res = await app.request("/api/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ email_alerts: "yes" }),
    });
    expect(res.status).toBe(400);
  });

  it("persists updates and tags Kit subscriber when email_alerts=true", async () => {
    vi.stubEnv("KIT_TAG_EMAIL_ALERTS", "tag-alerts");
    const res = await app.request("/api/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ email_alerts: true }),
    });
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ email_alerts: true }),
    );
    // Fire-and-forget, resolve microtasks.
    await Promise.resolve();
    await Promise.resolve();
    expect(tagSubscriberMock).toHaveBeenCalledWith(
      "user@example.com",
      "tag-alerts",
    );
    expect(removeTagMock).not.toHaveBeenCalled();
  });

  it("removes Kit tag when email_alerts=false", async () => {
    vi.stubEnv("KIT_TAG_EMAIL_ALERTS", "tag-alerts");
    mockUpdatedRow = {
      email: "user@example.com",
      email_alerts: false,
      weekly_digest: true,
    };
    const res = await app.request("/api/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ email_alerts: false }),
    });
    expect(res.status).toBe(200);
    await Promise.resolve();
    await Promise.resolve();
    expect(removeTagMock).toHaveBeenCalledWith(
      "user@example.com",
      "tag-alerts",
    );
    expect(tagSubscriberMock).not.toHaveBeenCalled();
  });

  it("skips Kit calls when tag env vars unset (still persists DB)", async () => {
    const res = await app.request("/api/preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
      body: JSON.stringify({ weekly_digest: false }),
    });
    expect(res.status).toBe(200);
    expect(updateMock).toHaveBeenCalled();
    expect(tagSubscriberMock).not.toHaveBeenCalled();
    expect(removeTagMock).not.toHaveBeenCalled();
  });
});
