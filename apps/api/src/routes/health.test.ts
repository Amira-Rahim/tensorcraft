import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { health } from "./health";

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: () => Promise.resolve({ error: null, count: 0 }),
    }),
  }),
}));

const app = new Hono();
app.route("/api/health", health);

describe("GET /api/health", () => {
  it("returns status ok", async () => {
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("tensorcraft-api");
    expect(body.timestamp).toBeDefined();
  });
});
