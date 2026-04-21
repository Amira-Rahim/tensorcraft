import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

const loggerWarnMock = vi.fn();

vi.mock("../../lib/logger", () => ({
  logger: {
    warn: loggerWarnMock,
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const { webhooks } = await import("../webhooks");

const app = new Hono();
app.route("/api/webhooks", webhooks);

describe("POST /api/webhooks/kit-bounce", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("503 when KIT_WEBHOOK_SECRET is not configured", async () => {
    const res = await app.request("/api/webhooks/kit-bounce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriber: { email_address: "x@y.com" } }),
    });
    expect(res.status).toBe(503);
  });

  it("401 for missing / wrong shared secret", async () => {
    vi.stubEnv("KIT_WEBHOOK_SECRET", "correct");
    // missing header
    const missing = await app.request("/api/webhooks/kit-bounce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriber: { email_address: "x@y.com" } }),
    });
    expect(missing.status).toBe(401);

    const wrong = await app.request("/api/webhooks/kit-bounce", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-kit-webhook-secret": "wrong",
      },
      body: JSON.stringify({ subscriber: { email_address: "x@y.com" } }),
    });
    expect(wrong.status).toBe(401);
  });

  it("400 for invalid JSON", async () => {
    vi.stubEnv("KIT_WEBHOOK_SECRET", "correct");
    const res = await app.request("/api/webhooks/kit-bounce", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-kit-webhook-secret": "correct",
      },
      body: "not-json",
    });
    expect(res.status).toBe(400);
  });

  it("logs bounce + returns { received: true } for valid payload", async () => {
    vi.stubEnv("KIT_WEBHOOK_SECRET", "correct");
    const res = await app.request("/api/webhooks/kit-bounce", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-kit-webhook-secret": "correct",
      },
      body: JSON.stringify({
        subscriber: {
          id: 42,
          email_address: "bouncy@example.com",
          state: "bounced",
        },
        event: {
          name: "subscriber.bounced",
          created_at: "2026-04-21T00:00:00Z",
        },
        reason: "mailbox_full",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "webhooks.kit-bounce",
        email: "bouncy@example.com",
        event: "subscriber.bounced",
        reason: "mailbox_full",
      }),
      expect.any(String),
    );
  });
});
