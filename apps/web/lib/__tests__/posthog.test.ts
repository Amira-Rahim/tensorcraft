import { describe, it, expect, beforeEach, vi } from "vitest";

// posthog-js reads window at import time; we mock it per-test.
vi.mock("posthog-js", () => {
  return {
    default: {
      init: vi.fn(),
      capture: vi.fn(),
      identify: vi.fn(),
      reset: vi.fn(),
      opt_in_capturing: vi.fn(),
      opt_out_capturing: vi.fn(),
    },
  };
});

import posthog from "posthog-js";

describe("lib/posthog", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it("throws outside production when NEXT_PUBLIC_POSTHOG_KEY is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");

    expect(() => mod.initPostHog()).toThrow(/NEXT_PUBLIC_POSTHOG_KEY/);
    expect(mod.isInitialized()).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("throws outside production when NEXT_PUBLIC_POSTHOG_HOST is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");

    const mod = await import("../posthog");

    expect(() => mod.initPostHog()).toThrow(/NEXT_PUBLIC_POSTHOG_HOST/);
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("returns null silently in production when the key is absent", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");
    const instance = mod.initPostHog();

    expect(instance).toBeNull();
    expect(mod.isInitialized()).toBe(false);
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("capture is a no-op when PostHog is not initialized", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");
    mod.capture("lesson_started", { worldId: "deep-orbit" });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("initializes with the configured host when key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");
    mod.__resetForTests();

    const instance = mod.initPostHog();

    expect(instance).not.toBeNull();
    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ api_host: "https://example.test" }),
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

  it("captures $pageleave even though pageviews are sent manually", async () => {
    // capture_pageview is false because AnalyticsProvider sends pageviews
    // itself. The SDK default for capture_pageleave follows capture_pageview,
    // which silently dropped every $pageleave, so the last page of each visit
    // had no duration or scroll depth.
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");
    mod.__resetForTests();
    mod.initPostHog();

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({
        capture_pageview: false,
        capture_pageleave: true,
      }),
    );
  });

  it("keeps session replay, heatmaps and console recording off", async () => {
    // The PostHog project records sessions, but the privacy policy covers
    // pageviews and product events only. The init options must win.
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");
    mod.__resetForTests();
    mod.initPostHog();

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({
        disable_session_recording: true,
        enable_heatmaps: false,
        enable_recording_console_log: false,
      }),
    );
  });

  it("fails closed: nothing is captured until consent opts the SDK in", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");
    mod.__resetForTests();
    mod.initPostHog();

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test_key",
      expect.objectContaining({ opt_out_capturing_by_default: true }),
    );
  });

  it("keeps a withdrawn consent after sign-out resets the SDK", async () => {
    // posthog.reset() deletes the SDK's shared opt-out flag. Without a
    // re-apply, a visitor who withdrew consent and then signed out was
    // tracked again in every open tab until the next hard load.
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");
    localStorage.setItem("tc-cookie-consent", "declined");

    const mod = await import("../posthog");
    mod.__resetForTests();
    mod.initPostHog();
    mod.reset();

    expect(posthog.reset).toHaveBeenCalledTimes(1);
    expect(posthog.opt_out_capturing).toHaveBeenCalledTimes(1);
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
  });

  it("keeps a granted consent after sign-out, without an $opt_in event", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");
    localStorage.setItem("tc-cookie-consent-version", "2");
    localStorage.setItem("tc-cookie-consent", "accepted");

    const mod = await import("../posthog");
    mod.__resetForTests();
    mod.initPostHog();
    mod.reset();

    expect(posthog.reset).toHaveBeenCalledTimes(1);
    expect(posthog.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    });
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("capture forwards to posthog.capture once initialized", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");

    const mod = await import("../posthog");
    mod.__resetForTests();
    mod.initPostHog();

    mod.capture("lesson_completed", { lessonId: "l1" });

    expect(posthog.capture).toHaveBeenCalledWith("lesson_completed", {
      lessonId: "l1",
    });
  });

  it("labels the first anonymous SDK event and preserves its other properties", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test_key");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://example.test");
    vi.stubGlobal("location", {
      hostname: "tensorcraft.app",
      search: "?tc_internal=1",
    });
    try {
      const mod = await import("../posthog");
      mod.initPostHog();
      const options = vi.mocked(posthog.init).mock.calls[0]![1]!;
      const beforeSend = options.before_send;
      if (typeof beforeSend !== "function") {
        throw new Error("Expected one before_send callback");
      }
      const event = {
        uuid: "test-internal-pageview",
        event: "$pageview",
        properties: { $pathname: "/learn", tc_internal: false },
      };
      const labeled = beforeSend(event);
      expect(labeled).toEqual({
        ...event,
        properties: { $pathname: "/learn", tc_internal: true },
      });
      // The SDK reset can clear its own persistence, but the browser marker
      // must still label subsequent anonymous events.
      mod.reset();
      expect(
        beforeSend({
          uuid: "test-after-reset",
          event: "$pageview",
          properties: {},
        }),
      ).toMatchObject({ properties: { tc_internal: true } });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
