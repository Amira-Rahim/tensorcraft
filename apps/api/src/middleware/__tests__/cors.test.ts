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

  it("allows authenticated requests after analytics adds tracing headers", async () => {
    // initPostHog enables tracing_headers for the API hostname after consent.
    const requestedHeaders = [
      "authorization",
      "content-type",
      "x-posthog-session-id",
      "x-posthog-window-id",
      "x-posthog-distinct-id",
    ];
    const res = await app.request("/api/github/connect", {
      method: "OPTIONS",
      headers: {
        Origin: "https://tensorcraft.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": requestedHeaders.join(","),
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://tensorcraft.app",
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    const allowedHeaders = res.headers
      .get("Access-Control-Allow-Headers")
      ?.toLowerCase()
      .split(",")
      .map((header) => header.trim());
    for (const header of requestedHeaders) {
      expect(allowedHeaders).toContain(header);
    }
  });

  it("rejects tracing preflights from an untrusted origin", async () => {
    const res = await app.request("/api/github/connect", {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,x-posthog-session-id",
      },
    });

    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
