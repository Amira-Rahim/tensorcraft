import { describe, it, expect } from "vitest";
import { computeWeeklyHints } from "./viz-data";

describe("computeWeeklyHints", () => {
  const monday = (iso: string) => new Date(iso + "T00:00:00Z").toISOString();

  it("buckets attempts into UTC Monday-aligned weeks", () => {
    // All within the same ISO week of 2026-04-13 (Monday)
    const result = computeWeeklyHints(
      [
        { attempted_at: "2026-04-14T10:00:00Z", hints_used: 3 },
        { attempted_at: "2026-04-16T22:00:00Z", hints_used: 5 },
      ],
      12,
      new Date("2026-04-19T00:00:00Z"),
    );
    expect(result).toHaveLength(12);
    // Week-of-2026-04-13 should have avg (3+5)/2 = 4
    const thatWeek = result.find(
      (w) => w.weekStart === monday("2026-04-13").slice(0, 10),
    );
    expect(thatWeek?.avgHints).toBe(4);
  });

  it("returns null avgHints for weeks with no attempts", () => {
    const result = computeWeeklyHints([], 12, new Date("2026-04-19T00:00:00Z"));
    expect(result).toHaveLength(12);
    expect(result.every((w) => w.avgHints === null)).toBe(true);
  });

  it("orders weeks oldest → newest", () => {
    const result = computeWeeklyHints([], 12, new Date("2026-04-19T00:00:00Z"));
    const starts = result.map((w) => w.weekStart);
    const sorted = [...starts].sort();
    expect(starts).toEqual(sorted);
  });
});
