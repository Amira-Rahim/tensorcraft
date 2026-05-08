import { describe, it, expect } from "vitest";
import {
  REVIEW_EPSILON,
  SM2_SUCCESS_MULTIPLIER,
  SM2_FAIL_INTERVAL_HOURS,
  MIN_INTERVAL_HOURS,
  forgettingScore,
  epsilonGreedy,
  nextReviewAt,
  type BanditArm,
} from "./bandit";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function makeArm(overrides: Partial<BanditArm> = {}): BanditArm {
  const now = new Date("2026-05-08T12:00:00Z");
  return {
    themeId: "deep-orbit",
    moduleId: "m1",
    lessonId: "lesson-1",
    armPulls: 0,
    armSuccesses: 0,
    lastReviewedAt: null,
    nextReviewAt: new Date(now.getTime() - DAY),
    createdAt: new Date(now.getTime() - 2 * DAY),
    ...overrides,
  };
}

// Mulberry32 — small, fast, deterministic seeded RNG.
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("forgettingScore", () => {
  it("is zero for an arm that's never failed and was just reviewed", () => {
    const now = new Date("2026-05-08T12:00:00Z");
    const arm = makeArm({
      armPulls: 3,
      armSuccesses: 3,
      lastReviewedAt: now,
    });
    expect(forgettingScore(arm, now)).toBe(0);
  });

  it("grows with hours since last review when success rate < 1", () => {
    const now = new Date("2026-05-08T12:00:00Z");
    const recent = makeArm({
      armPulls: 4,
      armSuccesses: 2,
      lastReviewedAt: new Date(now.getTime() - 1 * HOUR),
    });
    const stale = makeArm({
      armPulls: 4,
      armSuccesses: 2,
      lastReviewedAt: new Date(now.getTime() - 48 * HOUR),
    });
    expect(forgettingScore(stale, now)).toBeGreaterThan(
      forgettingScore(recent, now),
    );
  });

  it("uses createdAt when never reviewed", () => {
    const now = new Date("2026-05-08T12:00:00Z");
    const arm = makeArm({
      armPulls: 0,
      armSuccesses: 0,
      lastReviewedAt: null,
      createdAt: new Date(now.getTime() - 5 * DAY),
    });
    // Failure rate is 1 (never pulled), so score = 1 * hoursSince = 120.
    expect(forgettingScore(arm, now)).toBeCloseTo(120, 5);
  });

  it("caps hours-since at 30 days", () => {
    const now = new Date("2026-05-08T12:00:00Z");
    const arm = makeArm({
      armPulls: 0,
      armSuccesses: 0,
      createdAt: new Date(now.getTime() - 365 * DAY),
    });
    // Capped at 24*30 = 720.
    expect(forgettingScore(arm, now)).toBe(720);
  });
});

describe("epsilonGreedy", () => {
  const now = new Date("2026-05-08T12:00:00Z");

  it("filters out arms whose next_review_at is in the future", () => {
    const due = makeArm({
      lessonId: "due",
      nextReviewAt: new Date(now.getTime() - DAY),
    });
    const notDue = makeArm({
      lessonId: "later",
      nextReviewAt: new Date(now.getTime() + DAY),
    });
    const result = epsilonGreedy([due, notDue], {
      now,
      limit: 5,
      rng: seededRng(1),
    });
    expect(result.map((a) => a.lessonId)).toEqual(["due"]);
  });

  it("returns at most `limit` arms", () => {
    const arms = Array.from({ length: 10 }, (_, i) =>
      makeArm({
        lessonId: `l${i}`,
        nextReviewAt: new Date(now.getTime() - DAY),
      }),
    );
    const result = epsilonGreedy(arms, { now, limit: 3, rng: seededRng(7) });
    expect(result).toHaveLength(3);
  });

  it("explores roughly ε of the time across many trials", () => {
    const arms = Array.from({ length: 5 }, (_, i) =>
      makeArm({
        lessonId: `l${i}`,
        nextReviewAt: new Date(now.getTime() - DAY),
      }),
    );
    let exploreCount = 0;
    let totalCount = 0;
    const rng = seededRng(42);
    for (let trial = 0; trial < 1000; trial++) {
      const result = epsilonGreedy(arms, { now, limit: 5, rng });
      for (const arm of result) {
        totalCount++;
        if (arm.wasExplored) exploreCount++;
      }
    }
    const observed = exploreCount / totalCount;
    expect(observed).toBeGreaterThan(0.1);
    expect(observed).toBeLessThan(0.2);
  });

  it("when ε=0, sorts purely by forgetting score (most-forgotten first)", () => {
    const fresh = makeArm({
      lessonId: "fresh",
      armPulls: 5,
      armSuccesses: 5,
      lastReviewedAt: new Date(now.getTime() - 1 * HOUR),
      nextReviewAt: new Date(now.getTime() - DAY),
    });
    const stale = makeArm({
      lessonId: "stale",
      armPulls: 5,
      armSuccesses: 1,
      lastReviewedAt: new Date(now.getTime() - 100 * HOUR),
      nextReviewAt: new Date(now.getTime() - DAY),
    });
    const result = epsilonGreedy([fresh, stale], {
      now,
      limit: 2,
      epsilon: 0,
      rng: seededRng(1),
    });
    expect(result[0].lessonId).toBe("stale");
    expect(result[1].lessonId).toBe("fresh");
  });

  it("when ε=1, ordering is non-deterministic across seeds", () => {
    const arms = Array.from({ length: 5 }, (_, i) =>
      makeArm({
        lessonId: `l${i}`,
        armPulls: 1,
        armSuccesses: i % 2,
        lastReviewedAt: new Date(now.getTime() - (i + 1) * HOUR),
        nextReviewAt: new Date(now.getTime() - DAY),
      }),
    );
    const r1 = epsilonGreedy(arms, {
      now,
      limit: 5,
      epsilon: 1,
      rng: seededRng(1),
    });
    const r2 = epsilonGreedy(arms, {
      now,
      limit: 5,
      epsilon: 1,
      rng: seededRng(99),
    });
    expect(r1.map((a) => a.lessonId)).not.toEqual(r2.map((a) => a.lessonId));
    expect(r1.every((a) => a.wasExplored)).toBe(true);
  });

  it("default ε is 0.15", () => {
    expect(REVIEW_EPSILON).toBe(0.15);
  });
});

describe("nextReviewAt (SM-2-lite)", () => {
  const now = new Date("2026-05-08T12:00:00Z");

  it("on success, multiplies prior interval by 2.5", () => {
    const lastReviewedAt = new Date(now.getTime() - 4 * DAY);
    const next = nextReviewAt({
      now,
      lastReviewedAt,
      createdAt: lastReviewedAt,
      success: true,
    });
    // Prior interval = 4 days = 96 hours. Next = 96 * 2.5 = 240 hours = 10 days.
    const expected = new Date(now.getTime() + 240 * HOUR);
    expect(next.getTime()).toBe(expected.getTime());
  });

  it("on fail, resets to 24h regardless of prior interval", () => {
    const lastReviewedAt = new Date(now.getTime() - 30 * DAY);
    const next = nextReviewAt({
      now,
      lastReviewedAt,
      createdAt: lastReviewedAt,
      success: false,
    });
    const expected = new Date(now.getTime() + SM2_FAIL_INTERVAL_HOURS * HOUR);
    expect(next.getTime()).toBe(expected.getTime());
  });

  it("first-ever review uses createdAt as reference", () => {
    const createdAt = new Date(now.getTime() - 2 * DAY);
    const next = nextReviewAt({
      now,
      lastReviewedAt: null,
      createdAt,
      success: true,
    });
    // 2 days * 2.5 = 5 days from now.
    const expected = new Date(now.getTime() + 5 * DAY);
    expect(next.getTime()).toBe(expected.getTime());
  });

  it("interval floors at 24h before applying multiplier", () => {
    // Last reviewed 1h ago — too short. Floor to 24h. Success → 24*2.5 = 60h.
    const lastReviewedAt = new Date(now.getTime() - 1 * HOUR);
    const next = nextReviewAt({
      now,
      lastReviewedAt,
      createdAt: lastReviewedAt,
      success: true,
    });
    const expected = new Date(now.getTime() + 60 * HOUR);
    expect(next.getTime()).toBe(expected.getTime());
  });

  it("constants stay in sync", () => {
    expect(SM2_SUCCESS_MULTIPLIER).toBe(2.5);
    expect(SM2_FAIL_INTERVAL_HOURS).toBe(24);
    expect(MIN_INTERVAL_HOURS).toBe(24);
  });
});
