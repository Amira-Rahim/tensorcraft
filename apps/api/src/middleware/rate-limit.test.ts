import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { rateLimitMiddleware } from "./rate-limit";

describe("rateLimitMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use("*", rateLimitMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("allows requests under the limit", async () => {
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    expect(res.status).toBe(200);
  });

  it("returns 429 when rate limit exceeded", async () => {
    // Use a unique IP for this test
    const ip = `rate-limit-test-${Date.now()}`;
    const headers = { "x-forwarded-for": ip };

    // Send 61 requests (limit is 60)
    for (let i = 0; i < 60; i++) {
      await app.request("/test", { headers });
    }

    const res = await app.request("/test", { headers });
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/too many/i);
    expect(res.headers.get("Retry-After")).toBeDefined();
  });
});
