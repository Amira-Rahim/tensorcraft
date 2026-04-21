import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { securityHeadersMiddleware } from "../security-headers";

describe("securityHeadersMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use("*", securityHeadersMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
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

  it("sets Content-Security-Policy header", async () => {
    const res = await app.request("/test");
    expect(res.headers.get("Content-Security-Policy")).toBe(
      "default-src 'none'",
    );
  });

  it("sets Referrer-Policy header", async () => {
    const res = await app.request("/test");
    expect(res.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });
});
