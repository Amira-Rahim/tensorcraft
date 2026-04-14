import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: { user: { id: "user-test", email: "test@example.com" } },
          error: null,
        }),
    },
  }),
}));

vi.mock("../../lib/kit", () => ({
  addSubscriber: vi
    .fn()
    .mockResolvedValue({ id: 1, email_address: "test@example.com" }),
  tagSubscriber: vi
    .fn()
    .mockResolvedValue({ id: 1, email_address: "test@example.com" }),
}));

const { emailTags } = await import("../email-tags");

const app = new Hono();
app.route("/api/email", emailTags);

describe("POST /api/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for missing event", async () => {
    const res = await app.request("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid event", async () => {
    const res = await app.request("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ event: "invalid_event" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Invalid event/);
  });

  it("returns 401 without auth header", async () => {
    vi.stubEnv("KIT_TAG_SIGNED_UP", "12345");
    const res = await app.request("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "signed_up" }),
    });
    expect(res.status).toBe(401);
    vi.unstubAllEnvs();
  });

  it("returns ok with skipped when tag not configured", async () => {
    const res = await app.request("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ event: "signed_up" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBe(true);
  });

  it("returns ok for valid event with configured tag", async () => {
    vi.stubEnv("KIT_TAG_SIGNED_UP", "12345");
    const res = await app.request("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ event: "signed_up" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.event).toBe("signed_up");
    vi.unstubAllEnvs();
  });
});
