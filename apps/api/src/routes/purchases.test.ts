import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { purchases } from "./purchases";

/**
 * Controls what `supabase.from("purchases").select(...).eq(...).eq(...)`
 * resolves to in the access endpoint.
 */
let mockPurchaseRows: { world_ids: (string | null)[] | null }[] | null = null;
let mockAuthUserId: string | null = "user-test-123";

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: () =>
        Promise.resolve({
          data: mockAuthUserId ? { user: { id: mockAuthUserId } } : null,
          error: mockAuthUserId ? null : new Error("unauthenticated"),
        }),
    },
    from: (table: string) => {
      if (table === "purchases") {
        return {
          select: () => ({
            eq: () => ({
              in: () =>
                Promise.resolve({ data: mockPurchaseRows, error: null }),
            }),
          }),
        };
      }
      return {};
    },
  }),
}));

vi.mock("@tensorcraft/shared", () => ({
  WORLD_SLUGS: [
    "deep-orbit",
    "neon-protocol",
    "signal-ward",
    "nova-canvas",
    "terra-grid",
  ] as const,
  isValidWorldSlug: (slug: string) =>
    [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ].includes(slug),
}));

const app = new Hono();
app.route("/api/purchases", purchases);

function authed(path: string): Promise<Response> {
  return app.request(path, {
    headers: { Authorization: "Bearer test-token" },
  });
}

describe("GET /api/purchases/access", () => {
  beforeEach(() => {
    mockPurchaseRows = null;
    mockAuthUserId = "user-test-123";
  });

  it("returns 401 without Authorization header", async () => {
    const res = await app.request("/api/purchases/access");
    expect(res.status).toBe(401);
  });

  it("returns empty worldIds for a user with no purchases", async () => {
    mockPurchaseRows = [];
    const res = await authed("/api/purchases/access");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ worldIds: [], hasFullBundle: false });
  });

  it("returns deduplicated sorted world IDs across purchases", async () => {
    // User bought deep-orbit alone, then upgraded to a two-bundle
    // that re-included deep-orbit + neon-protocol. Expect dedupe.
    mockPurchaseRows = [
      { world_ids: ["deep-orbit"] },
      { world_ids: ["deep-orbit", "neon-protocol"] },
    ];
    const res = await authed("/api/purchases/access");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      worldIds: ["deep-orbit", "neon-protocol"],
      hasFullBundle: false,
    });
  });

  it("flags hasFullBundle when user owns all 5 canonical worlds", async () => {
    mockPurchaseRows = [
      {
        world_ids: [
          "deep-orbit",
          "neon-protocol",
          "signal-ward",
          "nova-canvas",
          "terra-grid",
        ],
      },
    ];
    const res = await authed("/api/purchases/access");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.hasFullBundle).toBe(true);
    expect(body.worldIds).toHaveLength(5);
  });

  it("filters out unknown slugs defensively (§6h)", async () => {
    // Even if a DB anomaly smuggles in an unknown slug, the endpoint
    // must not surface it, only canonical worlds flow to the client.
    mockPurchaseRows = [
      { world_ids: ["deep-orbit", "not-a-world", "neon-protocol"] },
    ];
    const res = await authed("/api/purchases/access");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      worldIds: ["deep-orbit", "neon-protocol"],
      hasFullBundle: false,
    });
  });

  it("tolerates rows with null world_ids", async () => {
    mockPurchaseRows = [{ world_ids: null }, { world_ids: ["signal-ward"] }];
    const res = await authed("/api/purchases/access");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      worldIds: ["signal-ward"],
      hasFullBundle: false,
    });
  });
});
