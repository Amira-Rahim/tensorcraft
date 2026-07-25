import { describe, it, expect, vi, beforeEach } from "vitest";

let mockEnrollment: {
  enrolled_at: string;
  completed_at: string | null;
} | null = null;
let mockProgressRows: Array<{
  theme_id: string;
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
      // theme_progress
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
  getEntitledThemes: async () => mockOwned,
}));

vi.mock("@tensorcraft/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tensorcraft/shared")>();
  return {
    ...actual,
    // Pin every theme's lesson total to 2 so the "completed" threshold is
    // deterministic here. journey-progress now reads getThemeTotalLessons(slug)
    // per theme (re-audit N2/F-A), so the pin lives on that function, not on
    // the old THEME_CONTENT scalar.
    getThemeTotalLessons: () => 2,
  };
});

vi.mock("@tensorcraft/content", () => ({
  // The corpus for these tests is two lessons per theme ("a", "b"), matching
  // the pinned getThemeTotalLessons above. journey-progress filters progress
  // rows against the CURRENT corpus so orphaned rows from re-slugged lessons
  // can't overshoot totals (R3-6).
  getThemeLessons: () => [{ slug: "a" }, { slug: "b" }],
}));

import { getJourneyState } from "../journey-progress";
import { JOURNEY_ORDER } from "@tensorcraft/shared";

/**
 * getJourneyState composes the three already-centralized sources (ring order,
 * entitlements, completion) into the canonical-track shape. These pin the
 * derivation — especially that position/completion are DERIVED, not stored.
 */
describe("getJourneyState", () => {
  beforeEach(() => {
    mockEnrollment = null;
    mockProgressRows = [];
    mockOwned = new Set();
    mockProgressError = null;
  });

  it("returns all five themes in ring order with derived progress", async () => {
    const s = await getJourneyState("u1");
    expect(s.themes.map((t) => t.slug)).toEqual([...JOURNEY_ORDER]);
    expect(s.themes.every((t) => t.totalLessons === 2)).toBe(true);
  });

  it("marks a theme completed only when all its lessons are done", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { theme_id: t0, lesson_id: "a", status: "completed" },
      { theme_id: t0, lesson_id: "b", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.themes[0].completed).toBe(true);
    expect(s.themes[0].completedLessons).toBe(2);
    expect(s.themes[1].completed).toBe(false);
  });

  it("dedupes lesson rows so double-writes don't over-count", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { theme_id: t0, lesson_id: "a", status: "completed" },
      { theme_id: t0, lesson_id: "a", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.themes[0].completedLessons).toBe(1);
  });

  it("reflects enrollment state", async () => {
    mockEnrollment = { enrolled_at: "2026-01-01", completed_at: null };
    const s = await getJourneyState("u1");
    expect(s.enrolled).toBe(true);
    expect(s.enrolledAt).toBe("2026-01-01");
  });

  it("recommends the next uncompleted theme in ring order", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { theme_id: t0, lesson_id: "a", status: "completed" },
      { theme_id: t0, lesson_id: "b", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.recommendedNext).toBe(JOURNEY_ORDER[1]);
  });

  it("reports ringComplete only when every theme is finished", async () => {
    mockProgressRows = JOURNEY_ORDER.flatMap((t) => [
      { theme_id: t, lesson_id: "a", status: "completed" },
      { theme_id: t, lesson_id: "b", status: "completed" },
    ]);
    const s = await getJourneyState("u1");
    expect(s.ringComplete).toBe(true);
    expect(s.recommendedNext).toBeNull();
  });

  it("ignores progress rows for lessons no longer in the corpus (R3-6)", async () => {
    const t0 = JOURNEY_ORDER[0];
    mockProgressRows = [
      { theme_id: t0, lesson_id: "a", status: "completed" },
      // Orphans from a re-slugged/removed lesson (tl/05 was rebuilt once):
      // counting them can mark a theme completed while live lessons remain,
      // and push completedLessons past totalLessons.
      { theme_id: t0, lesson_id: "old-slug-1", status: "completed" },
      { theme_id: t0, lesson_id: "old-slug-2", status: "completed" },
    ];
    const s = await getJourneyState("u1");
    expect(s.themes[0].completedLessons).toBe(1);
    expect(s.themes[0].completed).toBe(false);
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
