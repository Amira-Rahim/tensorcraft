import { describe, it, expect, beforeEach, vi } from "vitest";

// posthog-js reads window at import time; mock it per-test.
vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

import posthog from "posthog-js";
import { __resetForTests, initPostHog } from "../posthog";
import { EVENTS, track } from "../analytics-events";

describe("lib/analytics-events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    __resetForTests();
  });

  it("EVENTS registry contains every taxonomy entry", () => {
    // Sanity-check a representative sample from each category.
    expect(EVENTS.LESSON_STARTED).toBe("lesson_started");
    expect(EVENTS.LESSON_COMPLETED).toBe("lesson_completed");
    expect(EVENTS.EXERCISE_ATTEMPTED).toBe("exercise_attempted");
    expect(EVENTS.EXERCISE_COMPLETED).toBe("exercise_completed");
    expect(EVENTS.HINT_REQUESTED).toBe("hint_requested");
    expect(EVENTS.CHECKPOINT_SUBMITTED).toBe("checkpoint_submitted");
    expect(EVENTS.RECALL_ANSWERED).toBe("recall_answered");
    expect(EVENTS.MODULE_COMPLETED).toBe("module_completed");
    expect(EVENTS.PRICING_PAGE_VIEWED).toBe("pricing_page_viewed");
    expect(EVENTS.CHECKOUT_STARTED).toBe("checkout_started");
    expect(EVENTS.PAYMENT_COMPLETED).toBe("payment_completed");
    expect(EVENTS.PAYMENT_FAILED).toBe("payment_failed");
    expect(EVENTS.PAYWALL_HIT).toBe("paywall_hit");
    expect(EVENTS.CODE_PUSHED).toBe("code_pushed");
    expect(EVENTS.THEME_SELECTED).toBe("theme_selected");
    expect(EVENTS.PROGRESS_SHARED).toBe("progress_shared");
    expect(EVENTS.SESSION_STARTED).toBe("session_started");
    expect(EVENTS.STREAK_ACHIEVED).toBe("streak_achieved");
  });

  it("every event name is snake_case (PostHog convention)", () => {
    const SNAKE = /^[a-z]+(_[a-z]+)*$/;
    for (const name of Object.values(EVENTS)) {
      expect(name, name).toMatch(SNAKE);
    }
  });

  it("track is a no-op when PostHog is not initialized", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    track(EVENTS.LESSON_STARTED, {
      themeId: "deep-orbit",
      moduleId: "m1",
      lessonId: "l1",
    });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("track forwards event + properties once PostHog is initialized", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initPostHog();

    track(EVENTS.EXERCISE_ATTEMPTED, {
      themeId: "deep-orbit",
      lessonId: "l1",
      exerciseSlug: "ex-1",
      passed: true,
      score: 100,
    });

    expect(posthog.capture).toHaveBeenCalledWith("exercise_attempted", {
      themeId: "deep-orbit",
      lessonId: "l1",
      exerciseSlug: "ex-1",
      passed: true,
      score: 100,
    });
  });

  it("track carries forward typed properties verbatim", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initPostHog();

    track(EVENTS.PAYWALL_HIT, {
      themeId: "signal-ward",
      moduleId: "m2",
      lessonId: "intro",
    });

    expect(posthog.capture).toHaveBeenLastCalledWith("paywall_hit", {
      themeId: "signal-ward",
      moduleId: "m2",
      lessonId: "intro",
    });
  });

  it("track works for conversion events with optional props", () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    initPostHog();

    track(EVENTS.PRICING_PAGE_VIEWED, { source: "paywall" });
    track(EVENTS.HINT_REQUESTED, { hintLevel: 2 });

    expect(posthog.capture).toHaveBeenCalledWith("pricing_page_viewed", {
      source: "paywall",
    });
    expect(posthog.capture).toHaveBeenCalledWith("hint_requested", {
      hintLevel: 2,
    });
  });
});
