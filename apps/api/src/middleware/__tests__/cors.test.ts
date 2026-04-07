import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

// Need to set env before importing cors module (since it reads env at module level)
vi.stubEnv("CORS_ORIGINS", "http://localhost:3000,https://tensorcraft.app");

const { corsMiddleware } = await import("../cors");

describe("corsMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use("*", corsMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
  });

  it("sets correct CORS headers for allowed origin", async () => {
    const res = await app.request("/test", {
      headers: { Origin: "http://localhost:3000" },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });

  it("handles OPTIONS preflight", async () => {
    const res = await app.request("/test", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(res.headers.get("Access-Control-Allow-Headers")).toContain(
      "Content-Type",
    );
  });

  it("does not set CORS headers for disallowed origin", async () => {
    const res = await app.request("/test", {
      headers: { Origin: "https://evil.com" },
    });

    expect(res.status).toBe(200);
    // hono/cors returns null for disallowed origins
    const allowOrigin = res.headers.get("Access-Control-Allow-Origin");
    expect(allowOrigin).toBeNull();
  });
});
