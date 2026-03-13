import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { securityHeadersMiddleware } from "../security-headers";

describe("securityHeadersMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use("*", securityHeadersMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("sets X-Request-Id header", async () => {
    const res = await app.request("/test");
    const requestId = res.headers.get("X-Request-Id");
    expect(requestId).toBeDefined();
    expect(requestId).not.toBe("");
    // UUID format check
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("sets X-Content-Type-Options header", async () => {
    const res = await app.request("/test");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets X-Frame-Options header", async () => {
    const res = await app.request("/test");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("sets Strict-Transport-Security header", async () => {
    const res = await app.request("/test");
    const hsts = res.headers.get("Strict-Transport-Security");
    expect(hsts).toBe("max-age=63072000; includeSubDomains; preload");
  });

  it("generates unique request IDs per request", async () => {
    const res1 = await app.request("/test");
    const res2 = await app.request("/test");
    expect(res1.headers.get("X-Request-Id")).not.toBe(
      res2.headers.get("X-Request-Id"),
    );
  });
});
