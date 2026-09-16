import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  enqueueGuestReviews,
  getGuestDue,
  recordGuestReview,
} from "./review-store-guest";

const NOW = new Date("2026-09-16T12:00:00.000Z");

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("review-store-guest", () => {
  it("returns nothing when the store is empty", () => {
    expect(getGuestDue("deep-orbit", 2, NOW)).toEqual([]);
  });

  it("enqueues one item per prompt index", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", [0, 1]);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    expect(
      getGuestDue("deep-orbit", 5, tomorrow).map((i) => i.promptIndex),
    ).toEqual([0, 1]);
  });

  it("enqueues non-contiguous indices exactly, not 0..n-1", () => {
    // The reason this takes indices rather than a count. parseRecallPrompts
    // increments its counter for a tag it drops, so a lesson can in principle
    // carry prompts 0 and 2 with no 1. A count would enqueue 0 and 1: one key
    // the read path drops, and the real prompt 2 lost silently.
    enqueueGuestReviews("deep-orbit", "foundations", "gapped", [0, 2]);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    expect(
      getGuestDue("deep-orbit", 5, tomorrow).map((i) => i.promptIndex),
    ).toEqual([0, 2]);
  });

  it("deduplicates repeated indices", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "dupes", [1, 1, 1]);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    expect(getGuestDue("deep-orbit", 5, tomorrow)).toHaveLength(1);
  });

  it("does not resurface an item before it is due", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", [0]);
    expect(getGuestDue("deep-orbit", 5, NOW)).toEqual([]);
  });

  it("never resets an existing schedule on re-enqueue", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", [0]);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    const before = getGuestDue("deep-orbit", 5, tomorrow)[0].nextReviewAt;
    vi.setSystemTime(new Date("2026-09-18T12:00:00.000Z"));
    enqueueGuestReviews("deep-orbit", "foundations", "normalization", [0]);
    expect(getGuestDue("deep-orbit", 5, tomorrow)[0].nextReviewAt).toBe(before);
  });

  it("degrades to empty when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: blocked site data");
    });
    expect(() => getGuestDue("deep-orbit", 2, NOW)).not.toThrow();
    expect(getGuestDue("deep-orbit", 2, NOW)).toEqual([]);
  });

  it("does not throw when a write is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() =>
      enqueueGuestReviews("deep-orbit", "foundations", "x", [0]),
    ).not.toThrow();
  });
});

describe("recordGuestReview", () => {
  const LESSON = ["deep-orbit", "foundations", "normalization"] as const;

  function entry(promptIndex = 0) {
    const raw = localStorage.getItem("tc_guest_reviews_v1");
    return JSON.parse(raw ?? "{}")[
      `deep-orbit/foundations/normalization/${promptIndex}`
    ];
  }

  it("counts the pull and the success, and stamps lastReviewedAt", () => {
    enqueueGuestReviews(...LESSON, [0]);
    recordGuestReview(...LESSON, 0, "got-it", NOW);
    expect(entry()).toMatchObject({
      pulls: 1,
      successes: 1,
      lastReviewedAt: NOW.toISOString(),
    });
  });

  it("counts the pull but not a success on a bail-out", () => {
    enqueueGuestReviews(...LESSON, [0]);
    recordGuestReview(...LESSON, 0, "bailed", NOW);
    expect(entry()).toMatchObject({ pulls: 1, successes: 0 });
  });

  it("pushes a success further out than a bail-out", () => {
    enqueueGuestReviews("deep-orbit", "foundations", "a", [0]);
    enqueueGuestReviews("deep-orbit", "foundations", "b", [0]);
    recordGuestReview("deep-orbit", "foundations", "a", 0, "got-it", NOW);
    recordGuestReview("deep-orbit", "foundations", "b", 0, "bailed", NOW);
    const map = JSON.parse(localStorage.getItem("tc_guest_reviews_v1") ?? "{}");
    expect(
      Date.parse(map["deep-orbit/foundations/a/0"].nextReviewAt),
    ).toBeGreaterThan(
      Date.parse(map["deep-orbit/foundations/b/0"].nextReviewAt),
    );
  });

  it("takes a reviewed item out of the due list", () => {
    enqueueGuestReviews(...LESSON, [0]);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    expect(getGuestDue("deep-orbit", 5, tomorrow)).toHaveLength(1);
    recordGuestReview(...LESSON, 0, "got-it", tomorrow);
    expect(getGuestDue("deep-orbit", 5, tomorrow)).toEqual([]);
  });

  it("brings a bailed item back the next day", () => {
    enqueueGuestReviews(...LESSON, [0]);
    const tomorrow = new Date("2026-09-17T12:00:01.000Z");
    recordGuestReview(...LESSON, 0, "bailed", tomorrow);
    expect(getGuestDue("deep-orbit", 5, tomorrow)).toEqual([]);
    const dayAfter = new Date("2026-09-18T12:00:02.000Z");
    expect(getGuestDue("deep-orbit", 5, dayAfter)).toHaveLength(1);
  });

  it("does not throw when the write is blocked", () => {
    enqueueGuestReviews(...LESSON, [0]);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => recordGuestReview(...LESSON, 0, "got-it", NOW)).not.toThrow();
  });
});
