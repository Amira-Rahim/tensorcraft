import { describe, it, expect, beforeEach, vi } from "vitest";

// posthog-js reads window at import time; we mock it per-test.
vi.mock("posthog-js", () => {
  return {
    default: {
      init: vi.fn(),
      capture: vi.fn(),
    },
  };
});

import posthog from "posthog-js";

describe("lib/posthog", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("does not initialize when NEXT_PUBLIC_POSTHOG_KEY is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    const mod = await import("../posthog");
    const instance = mod.initPostHog();

    expect(instance).toBeNull();
    expect(mod.isInitialized()).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("capture is a no-op when PostHog is not initialized", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");

    const mod = await import("../posthog");
    mod.capture("lesson_started", { worldId: "deep-orbit" });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("initializes with EU host by default when key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

    const mod = await import("../posthog");
    mod.__resetForTests();

    const instance = mod.initPostHog();

    expect(instance).not.toBeNull();
    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ api_host: "https://eu.posthog.com" }),
    );
    expect(mod.isInitialized()).toBe(true);
  });

  it("respects NEXT_PUBLIC_POSTHOG_HOST when provided", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://custom.posthog.host");

    const mod = await import("../posthog");
    mod.__resetForTests();

    mod.initPostHog();

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ api_host: "https://custom.posthog.host" }),
    );
  });

  it("capture forwards to posthog.capture once initialized", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");

    const mod = await import("../posthog");
    mod.__resetForTests();
    mod.initPostHog();

    mod.capture("lesson_completed", { lessonId: "l1" });

    expect(posthog.capture).toHaveBeenCalledWith("lesson_completed", {
      lessonId: "l1",
    });
  });
});
