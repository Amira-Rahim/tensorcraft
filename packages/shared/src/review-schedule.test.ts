import { describe, it, expect } from "vitest";
import { selectDue, nextInterval } from "./review-schedule";
import type { ReviewItem } from "./review-types";

const DAY = 24 * 60 * 60 * 1000;

/** Days between `now` and a returned nextReviewAt, to 3 decimal places. */
function daysOut(nextReviewAt: string, now: Date): number {
  return (
    Math.round(((Date.parse(nextReviewAt) - now.getTime()) / DAY) * 1000) / 1000
  );
}

/** An item last reviewed `days` ago, so its current interval is `days`. */
function servedFor(
  days: number,
  now: Date,
  over: Partial<ReviewItem> = {},
): ReviewItem {
  return {
    ...item(over),
    lastReviewedAt: new Date(now.getTime() - days * DAY).toISOString(),
  };
}

const NOW = new Date("2026-09-16T12:00:00.000Z");

function item(over: Partial<ReviewItem> = {}): ReviewItem {
  return {
    worldId: "deep-orbit",
    moduleId: "foundations",
    lessonId: "normalization",
    promptIndex: 0,
    pulls: 0,
    successes: 0,
    lastReviewedAt: null,
    nextReviewAt: "2026-09-15T12:00:00.000Z",
    ...over,
  };
}

describe("selectDue", () => {
  it("excludes items not yet due", () => {
    const future = item({ nextReviewAt: "2026-09-17T12:00:00.000Z" });
    expect(selectDue([future], NOW, 2)).toEqual([]);
  });

  it("includes an item due exactly now", () => {
    const exact = item({ nextReviewAt: NOW.toISOString() });
    expect(selectDue([exact], NOW, 2)).toHaveLength(1);
  });

  it("orders most overdue first", () => {
    const older = item({
      lessonId: "a",
      nextReviewAt: "2026-09-10T12:00:00.000Z",
    });
    const newer = item({
      lessonId: "b",
      nextReviewAt: "2026-09-15T12:00:00.000Z",
    });
    expect(selectDue([newer, older], NOW, 2).map((i) => i.lessonId)).toEqual([
      "a",
      "b",
    ]);
  });

  it("breaks ties on failure rate, weakest first", () => {
    const strong = item({ lessonId: "strong", pulls: 4, successes: 4 });
    const weak = item({ lessonId: "weak", pulls: 4, successes: 1 });
    expect(selectDue([strong, weak], NOW, 2).map((i) => i.lessonId)).toEqual([
      "weak",
      "strong",
    ]);
  });

  it("treats an unpulled item as maximum failure rate", () => {
    const pulled = item({ lessonId: "pulled", pulls: 2, successes: 2 });
    const fresh = item({ lessonId: "fresh", pulls: 0, successes: 0 });
    expect(selectDue([pulled, fresh], NOW, 2).map((i) => i.lessonId)).toEqual([
      "fresh",
      "pulled",
    ]);
  });

  it("caps at the limit", () => {
    const many = [1, 2, 3, 4].map((n) => item({ lessonId: `l${n}` }));
    expect(selectDue(many, NOW, 2)).toHaveLength(2);
  });

  it("is stable for identical items so the same two do not shuffle per render", () => {
    const a = item({ lessonId: "a" });
    const b = item({ lessonId: "b" });
    expect(selectDue([a, b], NOW, 1)).toEqual(selectDue([a, b], NOW, 1));
  });
});

describe("nextInterval", () => {
  const NOW = new Date("2026-09-16T12:00:00.000Z");

  it("sends a fresh item 2.5 days out on a first success", () => {
    const r = nextInterval(item(), "got-it", NOW);
    expect(daysOut(r.nextReviewAt, NOW)).toBe(2.5);
    expect(r.pulls).toBe(1);
    expect(r.successes).toBe(1);
  });

  it("compounds the served interval on a repeat success", () => {
    const r = nextInterval(servedFor(10, NOW), "got-it", NOW);
    expect(daysOut(r.nextReviewAt, NOW)).toBe(25);
  });

  it("caps a long interval at 90 days", () => {
    // 60 served days would compound to 150. The ceiling holds it at 90.
    const r = nextInterval(servedFor(60, NOW), "got-it", NOW);
    expect(daysOut(r.nextReviewAt, NOW)).toBe(90);
  });

  it("never exceeds the cap however long the item has been held", () => {
    const r = nextInterval(servedFor(400, NOW), "got-it", NOW);
    expect(daysOut(r.nextReviewAt, NOW)).toBe(90);
  });

  it("resets an attempted miss to 2 days, however well known the item was", () => {
    const r = nextInterval(
      servedFor(60, NOW, { pulls: 5, successes: 5 }),
      "review",
      NOW,
    );
    expect(daysOut(r.nextReviewAt, NOW)).toBe(2);
  });

  it("resets a bail-out to 1 day, harder than an attempted miss", () => {
    const r = nextInterval(
      servedFor(60, NOW, { pulls: 5, successes: 5 }),
      "bailed",
      NOW,
    );
    expect(daysOut(r.nextReviewAt, NOW)).toBe(1);
  });

  it("counts the pull but not a success on an attempted miss", () => {
    const r = nextInterval(item({ pulls: 3, successes: 2 }), "review", NOW);
    expect(r.pulls).toBe(4);
    expect(r.successes).toBe(2);
  });

  it("counts the pull but not a success on a bail-out", () => {
    const r = nextInterval(item({ pulls: 3, successes: 2 }), "bailed", NOW);
    expect(r.pulls).toBe(4);
    expect(r.successes).toBe(2);
  });

  it("floors the served interval at one day so a same-day review cannot collapse it", () => {
    // Reviewed an hour ago: without the floor this would schedule 2.5 hours out.
    const hourAgo = servedFor(1 / 24, NOW);
    expect(
      daysOut(nextInterval(hourAgo, "got-it", NOW).nextReviewAt, NOW),
    ).toBe(2.5);
  });

  it("always schedules strictly after now, for every outcome", () => {
    for (const outcome of ["got-it", "review", "bailed"] as const) {
      const r = nextInterval(item(), outcome, NOW);
      expect(Date.parse(r.nextReviewAt)).toBeGreaterThan(NOW.getTime());
    }
  });
});
