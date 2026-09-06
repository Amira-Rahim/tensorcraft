import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getAssignedBriefingVariant } from "../briefing-variant";

// NEXT_PUBLIC_CLIP_HOLDBACK is build-time inlined in prod; in vitest it
// reads process.env live, which is what these tests exercise.

beforeEach(() => {
  localStorage.clear();
  delete process.env.NEXT_PUBLIC_CLIP_HOLDBACK;
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.NEXT_PUBLIC_CLIP_HOLDBACK;
});

describe("getAssignedBriefingVariant", () => {
  it("assigns clip when the holdback is unset (the default: everyone gets video)", () => {
    expect(getAssignedBriefingVariant()).toBe("clip");
  });

  it("assigns text under a full holdback", () => {
    process.env.NEXT_PUBLIC_CLIP_HOLDBACK = "1";
    expect(getAssignedBriefingVariant()).toBe("text");
  });

  it("is sticky per browser: the first assignment wins forever", () => {
    process.env.NEXT_PUBLIC_CLIP_HOLDBACK = "1";
    expect(getAssignedBriefingVariant()).toBe("text");
    // The dial changing later must not flip an assigned browser: the
    // cohort would bleed and the experiment become unreadable.
    process.env.NEXT_PUBLIC_CLIP_HOLDBACK = "0";
    expect(getAssignedBriefingVariant()).toBe("text");
  });

  it("splits by the configured share", () => {
    process.env.NEXT_PUBLIC_CLIP_HOLDBACK = "0.5";
    vi.spyOn(Math, "random").mockReturnValue(0.4);
    expect(getAssignedBriefingVariant()).toBe("text");
    localStorage.clear();
    vi.spyOn(Math, "random").mockReturnValue(0.6);
    expect(getAssignedBriefingVariant()).toBe("clip");
  });

  it("falls to clip when storage is blocked (product over experiment)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(getAssignedBriefingVariant()).toBe("clip");
  });

  it("clamps a garbage share to no holdback", () => {
    process.env.NEXT_PUBLIC_CLIP_HOLDBACK = "banana";
    expect(getAssignedBriefingVariant()).toBe("clip");
  });
});
