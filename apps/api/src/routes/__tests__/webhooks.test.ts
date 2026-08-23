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

const waitlistUpdate = vi.fn().mockResolvedValue({ error: null });
const profilesUpdate = vi.fn().mockResolvedValue({ error: null });
vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => ({
      update: (values: unknown) => ({
        ilike: (column: string, value: string) => {
          const call = { table, values, column, value };
          return table === "waitlist"
            ? waitlistUpdate(call)
            : profilesUpdate(call);
        },
      }),
    }),
  }),
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
        subscriberId: 42,
        event: "subscriber.bounced",
        reason: "mailbox_full",
      }),
      expect.any(String),
    );
    // The raw address must not reach Fly logs; Kit's dashboard is the
    // system of record for bounces (privacy sweep 2026-08-16).
    expect(JSON.stringify(loggerWarnMock.mock.calls)).not.toContain(
      "bouncy@example.com",
    );
  });
});

/**
 * Inbound suppression. Kit is the system of record for bounces and
 * complaints, but the weekly digest is sent from OUR side off
 * `waitlist.subscribed`. Until 2026-08-23 this handler only logged, so
 * someone who unsubscribed from a Kit email kept receiving the digest, which
 * is precisely how a complaint becomes a deliverability problem.
 */
describe("kit-bounce suppression writes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("KIT_WEBHOOK_SECRET", "correct");
    waitlistUpdate.mockResolvedValue({ error: null });
    profilesUpdate.mockResolvedValue({ error: null });
  });

  async function deliver(payload: unknown) {
    return app.request("/api/webhooks/kit-bounce", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-kit-webhook-secret": "correct",
      },
      body: JSON.stringify(payload),
    });
  }

  it("suppresses the address on an unsubscribe", async () => {
    const res = await deliver({
      event: { name: "subscriber.unsubscribe" },
      subscriber: { id: 1, email_address: "Gone@Example.com" },
    });

    expect(res.status).toBe(200);
    // Matched case-insensitively: Kit echoes whatever casing the subscriber
    // typed, and waitlist rows are stored as entered.
    expect(waitlistUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        values: { subscribed: false },
        column: "email",
        value: "Gone@Example.com",
      }),
    );
    expect(profilesUpdate).toHaveBeenCalled();
  });

  it("suppresses on a spam complaint", async () => {
    await deliver({
      event: { name: "subscriber.complain" },
      subscriber: { id: 2, email_address: "angry@example.com" },
    });

    expect(waitlistUpdate).toHaveBeenCalled();
  });

  it("suppresses a hard bounce, since the address is undeliverable", async () => {
    await deliver({
      event: { name: "subscriber.bounce" },
      subscriber: { id: 3, email_address: "dead@example.com" },
    });

    expect(waitlistUpdate).toHaveBeenCalled();
  });

  it("does not suppress on an unrelated event", async () => {
    await deliver({
      event: { name: "subscriber.subscribe" },
      subscriber: { id: 4, email_address: "new@example.com" },
    });

    expect(waitlistUpdate).not.toHaveBeenCalled();
    expect(profilesUpdate).not.toHaveBeenCalled();
  });

  it("acknowledges even when the address is missing, so Kit stops retrying", async () => {
    const res = await deliver({ event: { name: "subscriber.unsubscribe" } });

    expect(res.status).toBe(200);
    expect(waitlistUpdate).not.toHaveBeenCalled();
  });

  it("still acknowledges when the database write fails", async () => {
    waitlistUpdate.mockResolvedValue({ error: { message: "boom" } });

    const res = await deliver({
      event: { name: "subscriber.unsubscribe" },
      subscriber: { id: 5, email_address: "x@example.com" },
    });

    // A 500 makes Kit retry forever against a database that is not answering.
    expect(res.status).toBe(200);
  });
});
