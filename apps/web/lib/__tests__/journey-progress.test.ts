import { describe, it, expect, vi, beforeEach } from "vitest";

let mockEnrollment: {
  enrolled_at: string;
  completed_at: string | null;
} | null = null;
let mockProgressRows: Array<{
  world_id: string;
  lesson_id: string;
  status: string;
}> = [];
let mockOwned: Set<string> = new Set();
let mockProgressError: { message: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    from: (table: string) => {
      if (table === "journey_enrollment") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({ data: mockEnrollment, error: null }),
            }),
          }),
        };
      }
      // world_progress
      return {
        select: () => ({
          eq: () => ({
            eq: () =>
              Promise.resolve(
                mockProgressError
                  ? { data: null, error: mockProgressError }
                  : { data: mockProgressRows, error: null },
              ),
          }),
        }),
      };
    },
  }),
}));

vi.mock("@/lib/entitlements", () => ({
  getEntitledWorlds: async () => mockOwned,
}));

vi.mock("@tensorcraft/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tensorcraft/shared")>();
  return {
    ...actual,
    // Pin every world's lesson total to 2 so the "completed" threshold is
    // deterministic here. journey-progress now reads getWorldTotalLessons(slug)
    // per world (re-audit N2/F-A), so the pin lives on that function, not on
    // the old WORLD_CONTENT scalar.
    getWorldTotalLessons: () => 2,
  };
});

vi.mock("@tensorcraft/content", () => ({
  // The corpus for these tests is two lessons per world ("a", "b"), matching
  // the pinned getWorldTotalLessons above. journey-progress filters progress
  // rows against the CURRENT corpus so orphaned rows from re-slugged lessons
  // can't overshoot totals (R3-6).
  getWorldLessons: () => [{ slug: "a" }, { slug: "b" }],
}));

import { buildGuestJourneyStates, getJourneyState } from "../journey-progress";
import { JOURNEY_ORDER } from "@tensorcraft/shared";

/**
 * getJourneyState composes the three already-centralized sources (ring order,
 * entitlements, completion) into the canonical-track shape. These pin the
 * derivation - especially that position/completion are DERIVED, not stored.
 */
describe("getJourneyState", () => {
  beforeEach(() => {
    mockEnrollment = null;
    mockProgressRows = [];
    mockOwned = new Set();
    mockProgressError = null;
  });

  it("returns all five worlds in ring order with derived progress", async () => {
    const s = await getJourneyState("u1");
    expect(s.worlds.map((t) => t.slug)).toEqual([...JOURNEY_ORDER]);
    expect(s.worlds.every((t) => t.totalLessons === 2)).toBe(true);
  });

  it("marks a world completed only when all its lessons are done", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { world_id: t0, lesson_id: "a", status: "completed" },
      { world_id: t0, lesson_id: "b", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.worlds[0].completed).toBe(true);
    expect(s.worlds[0].completedLessons).toBe(2);
    expect(s.worlds[1].completed).toBe(false);
  });

  it("dedupes lesson rows so double-writes don't over-count", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { world_id: t0, lesson_id: "a", status: "completed" },
      { world_id: t0, lesson_id: "a", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.worlds[0].completedLessons).toBe(1);
  });

  it("surfaces the recorded completion timestamp, null when absent", async () => {
    // No enrollment concept anymore (cut 2026-08-15): the journey_enrollment
    // row is purely the durable completion record. Most users have no row.
    const before = await getJourneyState("u1");
    expect(before.completedAt).toBeNull();

    mockEnrollment = { enrolled_at: "2026-01-01", completed_at: "2026-02-01" };
    const s = await getJourneyState("u1");
    expect(s.completedAt).toBe("2026-02-01");
  });

  it("recommends the next uncompleted world in ring order", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { world_id: t0, lesson_id: "a", status: "completed" },
      { world_id: t0, lesson_id: "b", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.recommendedNext).toBe(JOURNEY_ORDER[1]);
  });

  it("reports ringComplete only when every world is finished", async () => {
    mockProgressRows = JOURNEY_ORDER.flatMap((t) => [
      { world_id: t, lesson_id: "a", status: "completed" },
      { world_id: t, lesson_id: "b", status: "completed" },
    ]);
    const s = await getJourneyState("u1");
    expect(s.ringComplete).toBe(true);
    expect(s.recommendedNext).toBeNull();
  });

  it("ignores progress rows for lessons no longer in the corpus (R3-6)", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { world_id: t0, lesson_id: "a", status: "completed" },
      // Orphans from a re-slugged/removed lesson (tl/05 was rebuilt once):
      // counting them can mark a world completed while live lessons remain,
      // and push completedLessons past totalLessons.
      { world_id: t0, lesson_id: "old-slug-1", status: "completed" },
      { world_id: t0, lesson_id: "old-slug-2", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.worlds[0].completedLessons).toBe(1);
    expect(s.worlds[0].completed).toBe(false);
  });

  it("builds guest states: five worlds in ring order, nothing owned or done", () => {
    const s = buildGuestJourneyStates();
    expect(s.map((t) => t.slug)).toEqual([...JOURNEY_ORDER]);
    expect(s.map((t) => t.position)).toEqual([0, 1, 2, 3, 4]);
    expect(
      s.every((t) => !t.owned && !t.completed && t.completedLessons === 0),
    ).toBe(true);
    // Totals come from getWorldTotalLessons (pinned to 2 above), so the
    // guest ring can still render real lesson counts.
    expect(s.every((t) => t.totalLessons === 2)).toBe(true);
  });

  it("throws instead of misreporting when a lookup fails (R3-6)", async () => {
    mockProgressError = { message: "connection reset" };
    // Fail loud, not blank: a transient PostgREST fault must not render an
    // enrolled learner as un-enrolled with zero progress (same contract as
    // entitlements.ts).
    await expect(getJourneyState("u1")).rejects.toThrow(
      /Journey progress lookup failed/,
    );
  });
});
