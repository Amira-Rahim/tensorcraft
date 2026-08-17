import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";

/**
 * Fake of @upstash/ratelimit's documented contract (constructor + limit()),
 * backed by an in-memory count per `${prefix}:${identifier}`. The middleware's
 * real logic (subject derivation, exemptions, headers, fail-open) is under
 * test; the windowing algorithm itself is Upstash's and is tested upstream.
 * `store` doubles as a probe: exemption tests assert it stays empty, proving
 * zero Redis-bound calls for exempt paths.
 */
const state = vi.hoisted(() => ({
  store: new Map<string, number>(),
  failMode: false,
}));

vi.mock("@upstash/ratelimit", () => {
  class Ratelimit {
    private readonly tokens: number;
    private readonly prefix: string;

    constructor(cfg: { limiter: { tokens: number }; prefix: string }) {
      this.tokens = cfg.limiter.tokens;
      this.prefix = cfg.prefix;
    }

    static fixedWindow(tokens: number, window: string) {
      return { tokens, window };
    }

    async limit(identifier: string) {
      if (state.failMode) throw new Error("redis unavailable");
      const key = `${this.prefix}:${identifier}`;
      const count = (state.store.get(key) ?? 0) + 1;
      state.store.set(key, count);
      return {
        success: count <= this.tokens,
        limit: this.tokens,
        remaining: Math.max(0, this.tokens - count),
        reset: Date.now() + 60_000,
        pending: Promise.resolve(),
      };
    }
  }
  return { Ratelimit };
});

// The middleware hands getRedis() to the Ratelimit constructor; with the SDK
// faked the client is never used, but the call must not throw.
vi.mock("../lib/redis", () => ({ getRedis: () => ({}) }));

// Import AFTER vi.mock so the middleware picks up the mocks.
const { rateLimitMiddleware, globalRateLimitMiddleware, createRateLimiter } =
  await import("./rate-limit");

describe("rateLimitMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    state.store.clear();
    state.failMode = false;
    app = new Hono();
    app.use("*", rateLimitMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("allows requests under the limit and reports headers", async () => {
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("59");
  });

  it("returns 429 when rate limit exceeded", async () => {
    const headers = { "x-forwarded-for": "192.168.1.101" };

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

  it("buckets by bearer-token identity, not IP, when a token is present", async () => {
    const auth = `Bearer ${"a".repeat(32)}`;

    // Rotating the IP must not mint fresh buckets (the recorded
    // cf-connecting-ip bypass): same token = same budget.
    for (let i = 0; i < 60; i++) {
      await app.request("/test", {
        headers: { authorization: auth, "x-forwarded-for": `10.9.${i}.1` },
      });
    }

    const res = await app.request("/test", {
      headers: { authorization: auth, "x-forwarded-for": "10.9.255.1" },
    });
    expect(res.status).toBe(429);
  });

  it("fails open when the limiter errors", async () => {
    state.failMode = true;
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "192.168.1.102" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
  });
});

describe("createRateLimiter", () => {
  it("enforces a route-scoped budget", async () => {
    state.store.clear();
    state.failMode = false;
    const app = new Hono();
    app.post(
      "/scoped",
      createRateLimiter({ max: 2, keyPrefix: "rl:test-scope" }),
      (c) => c.json({ ok: true }),
    );

    const headers = { "x-forwarded-for": "192.168.2.1" };
    for (let i = 0; i < 2; i++) {
      const res = await app.request("/scoped", { method: "POST", headers });
      expect(res.status).toBe(200);
    }

    const res = await app.request("/scoped", { method: "POST", headers });
    expect(res.status).toBe(429);
  });
});

describe("globalRateLimitMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    state.store.clear();
    state.failMode = false;
    app = new Hono();
    app.use("*", globalRateLimitMiddleware);
    app.get("/api/health", (c) => c.json({ status: "ok" }));
    app.get("/api/health/ready", (c) => c.json({ status: "ok" }));
    app.post("/api/payments/webhook", (c) => c.json({ received: true }));
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("exempts /api/health without touching Redis", async () => {
    const res = await app.request("/api/health", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    expect(res.status).toBe(200);
    // Limiter never ran: no headers set, no Redis commands issued.
    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    expect(state.store.size).toBe(0);
  });

  it("still rate limits /api/health/ready (it queries the DB)", async () => {
    const res = await app.request("/api/health/ready", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(state.store.size).toBe(1);
  });

  it("exempts webhook paths without touching Redis", async () => {
    const res = await app.request("/api/payments/webhook", {
      method: "POST",
      headers: { "x-forwarded-for": "10.0.0.3" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBeNull();
    expect(state.store.size).toBe(0);
  });

  it("rate limits ordinary routes", async () => {
    const headers = { "x-forwarded-for": "10.0.0.4" };
    for (let i = 0; i < 60; i++) {
      await app.request("/test", { headers });
    }
    const res = await app.request("/test", { headers });
    expect(res.status).toBe(429);
  });
});
