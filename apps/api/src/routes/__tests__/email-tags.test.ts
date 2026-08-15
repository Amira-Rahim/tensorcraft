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

  /**
   * Intent tags. The original vocabulary (signed_up / onboarded /
   * first_lesson / capstone) tracked progress but never captured the moment a
   * learner ran out of free content - the highest-intent signal in the
   * product. Without these, a user could finish module 1, hit the wall and
   * leave, and no retention sequence could ever address them.
   * See docs/email-retention-sequences.md.
   */
  it.each(["paywall_hit", "module_1_complete"])(
    "accepts the %s intent event",
    async (event) => {
      const res = await app.request("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ event }),
      });
      // 200 (not 400) proves the event is in the vocabulary; it reports
      // skipped when the Kit tag id env var isn't configured.
      expect(res.status).toBe(200);
    },
  );

  it("tags paywall_hit when its Kit tag id is configured", async () => {
    vi.stubEnv("KIT_TAG_PAYWALL_HIT", "67890");
    const res = await app.request("/api/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
      body: JSON.stringify({ event: "paywall_hit" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.skipped).toBeUndefined();
    expect(body.event).toBe("paywall_hit");
    vi.unstubAllEnvs();
  });
});
