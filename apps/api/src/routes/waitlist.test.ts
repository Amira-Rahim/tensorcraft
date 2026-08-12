import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { waitlist } from "./waitlist";

// Mock the Supabase admin client
const mockInsert = vi.fn();
vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      insert: mockInsert,
    }),
  }),
}));

const app = new Hono();
app.route("/api/waitlist", waitlist);

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    mockInsert.mockReset();
  });

  it("returns 400 for missing email", async () => {
    const res = await app.request("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/email/i);
  });

  it("returns 400 for invalid email", async () => {
    const res = await app.request("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "notanemail" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 201 on successful signup", async () => {
    mockInsert.mockResolvedValue({ error: null });

    const res = await app.request("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toMatch(/added/i);
  });

  it("returns 200 for duplicate email (23505)", async () => {
    mockInsert.mockResolvedValue({ error: { code: "23505" } });

    const res = await app.request("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/already/i);
  });

  it("returns 500 on database error", async () => {
    mockInsert.mockResolvedValue({ error: { code: "50000" } });

    const res = await app.request("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    expect(res.status).toBe(500);
  });

  it("passes worldId and source to insert", async () => {
    mockInsert.mockResolvedValue({ error: null });

    await app.request("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        worldId: "deep-orbit",
        source: "landing",
      }),
    });

    expect(mockInsert).toHaveBeenCalledWith({
      email: "test@example.com",
      world_id: "deep-orbit",
      source: "landing",
    });
  });
});
