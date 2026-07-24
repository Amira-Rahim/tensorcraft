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
  isValidThemeSlug: (s: string) =>
    [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ].includes(s),
}));

import { getEntitledThemes, canAccessTheme } from "../entitlements";

/**
 * The single entitlement source (Tier 1 F4). When seats land, this is the ONE
 * function that changes (union purchased + seat-granted); these tests pin its
 * current contract so that swap can be made with confidence.
 */
describe("getEntitledThemes", () => {
  beforeEach(() => {
    mockRows = [];
    mockError = null;
  });

  it("flattens theme_ids across purchase rows into a set", async () => {
    mockRows = [
      { theme_ids: ["deep-orbit"] },
      { theme_ids: ["neon-protocol", "signal-ward"] },
    ];
    const set = await getEntitledThemes("u1");
    expect([...set].sort()).toEqual([
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
    ]);
  });

  it("drops unknown / non-string slugs defensively", async () => {
    mockRows = [{ theme_ids: ["deep-orbit", "not-a-theme", 42, null] }];
    const set = await getEntitledThemes("u1");
    expect([...set]).toEqual(["deep-orbit"]);
  });

  it("returns an empty set for no purchases", async () => {
    mockRows = [];
    expect((await getEntitledThemes("u1")).size).toBe(0);
  });

  it("THROWS on a lookup error rather than silently denying access", async () => {
    // The bug this codebase fixed once: a transient fault must not read as
    // "not entitled" and show a paying customer the paywall.
    mockError = { message: "PostgREST 503" };
    await expect(getEntitledThemes("u1")).rejects.toThrow(
      /Entitlement lookup failed/,
    );
  });

  it("canAccessTheme delegates to the same source", async () => {
    mockRows = [{ theme_ids: ["neon-protocol"] }];
    expect(await canAccessTheme("u1", "neon-protocol")).toBe(true);
    expect(await canAccessTheme("u1", "deep-orbit")).toBe(false);
  });
});
