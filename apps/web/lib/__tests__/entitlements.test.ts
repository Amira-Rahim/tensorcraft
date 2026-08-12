import { describe, it, expect, vi, beforeEach } from "vitest";

let mockRows: unknown = [];
let mockError: { message: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => Promise.resolve({ data: mockRows, error: mockError }),
        }),
      }),
    }),
  }),
}));

vi.mock("@tensorcraft/shared", () => ({
  isValidWorldSlug: (s: string) =>
    [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ].includes(s),
}));

import { getEntitledWorlds, canAccessWorld } from "../entitlements";

/**
 * The single entitlement source (Tier 1 F4). When seats land, this is the ONE
 * function that changes (union purchased + seat-granted); these tests pin its
 * current contract so that swap can be made with confidence.
 */
describe("getEntitledWorlds", () => {
  beforeEach(() => {
    mockRows = [];
    mockError = null;
  });

  it("flattens world_ids across purchase rows into a set", async () => {
    mockRows = [
      { world_ids: ["deep-orbit"] },
      { world_ids: ["neon-protocol", "signal-ward"] },
    ];
    const set = await getEntitledWorlds("u1");
    expect([...set].sort()).toEqual([
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
    ]);
  });

  it("drops unknown / non-string slugs defensively", async () => {
    mockRows = [{ world_ids: ["deep-orbit", "not-a-world", 42, null] }];
    const set = await getEntitledWorlds("u1");
    expect([...set]).toEqual(["deep-orbit"]);
  });

  it("returns an empty set for no purchases", async () => {
    mockRows = [];
    expect((await getEntitledWorlds("u1")).size).toBe(0);
  });

  it("THROWS on a lookup error rather than silently denying access", async () => {
    // The bug this codebase fixed once: a transient fault must not read as
    // "not entitled" and show a paying customer the paywall.
    mockError = { message: "PostgREST 503" };
    await expect(getEntitledWorlds("u1")).rejects.toThrow(
      /Entitlement lookup failed/,
    );
  });

  it("canAccessWorld delegates to the same source", async () => {
    mockRows = [{ world_ids: ["neon-protocol"] }];
    expect(await canAccessWorld("u1", "neon-protocol")).toBe(true);
    expect(await canAccessWorld("u1", "deep-orbit")).toBe(false);
  });
});
