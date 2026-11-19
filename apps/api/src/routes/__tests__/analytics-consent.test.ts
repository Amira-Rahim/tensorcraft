import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  read: vi.fn(),
  rpc: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: mocks.client,
}));
vi.mock("../../lib/logger", () => ({ logger: { warn: mocks.warn } }));
vi.mock("../../middleware/auth", () => ({
  authMiddleware: async (
    c: {
      req: { header: (key: string) => string | undefined };
      set: (key: string, value: string) => void;
      json: (body: unknown, status: number) => Response;
    },
    next: () => Promise<void>,
  ) => {
    const auth = c.req.header("Authorization");
    if (auth !== "Bearer learner-token") {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("userId", "learner-id");
    c.set("accessToken", "learner-token");
    return next();
  },
}));

import { analyticsConsent } from "../analytics-consent";

const app = new Hono();
app.route("/api/analytics-consent", analyticsConsent);
const headers = {
  Authorization: "Bearer learner-token",
  "Content-Type": "application/json",
};
const persisted = {
  granted: true,
  revision: 3,
  updated_at: "2026-11-11T12:00:00.000Z",
};

function put(body: unknown) {
  return app.request("/api/analytics-consent", {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.client.mockReturnValue({ from: mocks.from, rpc: mocks.rpc });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.read });
  mocks.read.mockResolvedValue({ data: persisted, error: null });
  mocks.rpc.mockResolvedValue({
    data: [{ ...persisted, applied: true }],
    error: null,
  });
});

describe("analytics consent API", () => {
  it.each(["GET", "PUT"])("requires authentication for %s", async (method) => {
    const res = await app.request("/api/analytics-consent", { method });
    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("reads only the authenticated account and prevents caching", async () => {
    const res = await app.request("/api/analytics-consent", { headers });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({
      granted: true,
      revision: 3,
      updatedAt: persisted.updated_at,
    });
    expect(mocks.client).toHaveBeenCalledWith("learner-token");
    expect(mocks.from).toHaveBeenCalledWith("analytics_consents");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "learner-id");
  });

  it("treats a missing choice as disabled at revision zero", async () => {
    mocks.read.mockResolvedValue({ data: null, error: null });
    const res = await app.request("/api/analytics-consent", { headers });
    expect(await res.json()).toEqual({
      granted: false,
      revision: 0,
      updatedAt: null,
    });
  });

  it.each(["returned", "thrown"])(
    "reports %s read errors without granting",
    async (kind) => {
      if (kind === "returned")
        mocks.read.mockResolvedValue({
          data: null,
          error: { message: "private failure" },
        });
      else mocks.read.mockRejectedValue(new Error("private failure"));
      const res = await app.request("/api/analytics-consent", { headers });
      expect(res.status).toBe(503);
      expect(JSON.stringify(await res.json())).not.toContain("private failure");
      expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain(
        "private failure",
      );
    },
  );

  it.each([
    null,
    [],
    "accepted",
    {},
    { granted: "true", expectedRevision: 0 },
    { granted: null, expectedRevision: 0 },
    { granted: true },
    { granted: true, expectedRevision: null },
    { granted: true, expectedRevision: "0" },
    { granted: true, expectedRevision: -1 },
    { granted: true, expectedRevision: 0.5 },
    { granted: true, expectedRevision: 2_147_483_648 },
    { granted: false, expectedRevision: 0, userId: "someone-else" },
  ])("rejects invalid input without a database call: %j", async (body) => {
    const res = await put(body);
    expect(res.status).toBe(400);
    expect(mocks.client).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const res = await app.request("/api/analytics-consent", {
      method: "PUT",
      headers,
      body: "{",
    });
    expect(res.status).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("passes a grant and its observed revision through the user-scoped RPC", async () => {
    const res = await put({ granted: true, expectedRevision: 2 });
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.client).toHaveBeenCalledWith("learner-token");
    expect(mocks.rpc).toHaveBeenCalledWith("set_analytics_consent", {
      p_granted: true,
      p_expected_revision: 2,
    });
    expect(await res.json()).toEqual({
      granted: true,
      revision: 3,
      updatedAt: persisted.updated_at,
    });
  });

  it("returns the current state with 409 when a stale grant loses", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ ...persisted, granted: false, applied: false }],
      error: null,
    });
    const res = await put({ granted: true, expectedRevision: 1 });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      granted: false,
      revision: 3,
      updatedAt: persisted.updated_at,
    });
  });

  it("accepts a withdrawal with an old revision", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ ...persisted, granted: false, revision: 4, applied: true }],
      error: null,
    });
    const res = await put({ granted: false, expectedRevision: 0 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      granted: false,
      revision: 4,
      updatedAt: persisted.updated_at,
    });
  });

  it.each(["returned", "thrown", "empty"])(
    "does not report a saved choice for %s RPC failure",
    async (kind) => {
      if (kind === "returned")
        mocks.rpc.mockResolvedValue({
          data: null,
          error: { message: "private failure" },
        });
      else if (kind === "thrown")
        mocks.rpc.mockRejectedValue(new Error("private failure"));
      else mocks.rpc.mockResolvedValue({ data: [], error: null });
      const res = await put({ granted: false, expectedRevision: 0 });
      expect(res.status).toBe(503);
      expect(JSON.stringify(await res.json())).not.toContain("private failure");
      expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain(
        "private failure",
      );
    },
  );
});
