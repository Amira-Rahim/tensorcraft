import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";

/**
 * Regression cover for the PostHog defects found in the 2026-10-02 data audit:
 *
 * - Every full page load with stored consent sent two $pageview events (the
 *   consent handler's init capture plus the route effect in the same commit),
 *   so 28% of production pageviews were duplicates.
 * - The consent subscription re-ran on every cross-tab `storage` write and
 *   called opt_in_capturing() each time. PostHog writes localStorage on every
 *   capture, so two open tabs fed each other $opt_in events without end (97%
 *   of all events) and drained the client rate limiter, dropping real ones.
 *
 * The real lib/consent is used on purpose: the storage-key filter and the
 * provider's idempotent opt-in are tested together.
 */

const posthogMock = vi.hoisted(() => ({
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  has_opted_out_capturing: vi.fn(() => false),
  capture: vi.fn(),
}));

const route = vi.hoisted(() => {
  // useSearchParams returns a stable object per URL in Next; mirror that so
  // the route effect only re-runs when the URL actually changes.
  const cache = new Map<string, URLSearchParams>();
  return {
    initialized: false,
    pathname: "/learn",
    query: "",
    params(query: string) {
      if (!cache.has(query)) cache.set(query, new URLSearchParams(query));
      return cache.get(query)!;
    },
  };
});

vi.mock("posthog-js", () => ({ default: posthogMock }));

vi.mock("../../../lib/posthog", () => ({
  initPostHog: vi.fn(() => {
    route.initialized = true;
    return posthogMock;
  }),
  isInitialized: () => route.initialized,
}));

vi.mock("../../../lib/analytics-events", () => ({
  EVENTS: {
    CONSENT_GRANTED: "consent_granted",
    SESSION_STARTED: "session_started",
    SESSION_ENDED: "session_ended",
    PRICING_PAGE_VIEWED: "pricing_page_viewed",
  },
  track: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useSearchParams: () => route.params(route.query),
}));

import { AnalyticsProvider } from "../analytics-provider";
import { CONSENT_KEY, notifyConsentChanged } from "../../../lib/consent";
import { track } from "../../../lib/analytics-events";
import { PricingAnalytics } from "../../pricing/pricing-analytics";

function pageviews() {
  return posthogMock.capture.mock.calls.filter(
    ([event]) => event === "$pageview",
  );
}

function renderProvider() {
  return render(
    <AnalyticsProvider>
      <div />
    </AnalyticsProvider>,
  );
}

describe("AnalyticsProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    posthogMock.has_opted_out_capturing.mockReturnValue(false);
    route.initialized = false;
    route.pathname = "/learn";
    route.query = "";
    localStorage.clear();
    localStorage.setItem("tc-cookie-consent-version", "2");
    // Skip the once-per-browser consent_granted path; it is not under test.
    localStorage.setItem("tc-consent-reported", "1");
    localStorage.setItem(CONSENT_KEY, "accepted");
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("counts a full page load with stored consent as one $pageview", () => {
    renderProvider();
    expect(pageviews()).toHaveLength(1);
  });

  it("leaves $current_url to posthog-js, so it matches every other event", () => {
    // Rebuilding the URL from the route hooks dropped the hash and
    // re-encoded the query (a%20b became a+b), so a page split in two
    // between $pageview and the rest. Next has already pushed the new URL
    // when the route effect runs, so the SDK's location.href is exact.
    route.query = "locked=deep-orbit";
    renderProvider();
    expect(pageviews()).toEqual([["$pageview"]]);
  });

  it("still counts a client-side navigation to a new URL", () => {
    const { rerender } = renderProvider();
    route.pathname = "/pricing";
    rerender(
      <AnalyticsProvider>
        <div />
      </AnalyticsProvider>,
    );
    expect(pageviews()).toHaveLength(2);
  });

  it("counts a return to an earlier URL", () => {
    // The dedupe skips only a repeat of the last captured URL; a visitor
    // going back to a page they saw before is a real pageview.
    const view = renderProvider();
    for (const path of ["/pricing", "/learn"]) {
      route.pathname = path;
      view.rerender(
        <AnalyticsProvider>
          <div />
        </AnalyticsProvider>,
      );
    }
    expect(pageviews()).toHaveLength(3);
  });

  it("counts the page consent is granted on", () => {
    // First visit: the route effect ran before consent and captured
    // nothing, so the consent handler must count the landing page.
    localStorage.removeItem(CONSENT_KEY);
    renderProvider();
    expect(pageviews()).toHaveLength(0);

    act(() => {
      localStorage.setItem(CONSENT_KEY, "accepted");
      notifyConsentChanged();
    });

    expect(pageviews()).toHaveLength(1);
  });

  it("opts in without emitting an $opt_in event", () => {
    renderProvider();
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    });
  });

  it("ignores another tab's unrelated storage writes", () => {
    renderProvider();
    vi.clearAllMocks();

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "ph_phc_test_posthog" }),
      );
    });

    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it("does not opt in again while already opted in", () => {
    renderProvider();
    posthogMock.opt_in_capturing.mockClear();

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY }));
    });

    expect(posthogMock.opt_in_capturing).not.toHaveBeenCalled();
  });

  it("opts back in once when another tab grants consent again", () => {
    renderProvider();

    act(() => {
      localStorage.setItem(CONSENT_KEY, "declined");
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY }));
    });
    expect(posthogMock.opt_out_capturing).toHaveBeenCalledTimes(1);

    posthogMock.has_opted_out_capturing.mockReturnValue(true);
    posthogMock.opt_in_capturing.mockClear();

    act(() => {
      localStorage.setItem(CONSENT_KEY, "accepted");
      window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY }));
    });

    expect(posthogMock.opt_in_capturing).toHaveBeenCalledTimes(1);
    expect(posthogMock.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    });
  });

  it("starts a visible interval at consent and excludes time before acceptance", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible");
    localStorage.removeItem(CONSENT_KEY);
    renderProvider();
    expect(track).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000);
      localStorage.setItem(CONSENT_KEY, "accepted");
      notifyConsentChanged();
    });
    const start = vi
      .mocked(track)
      .mock.calls.find(([event]) => event === "session_started");
    expect(start).toBeDefined();
    act(() => {
      vi.advanceTimersByTime(1000);
      visibility.mockReturnValue("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("beforeunload"));
    });
    const ends = vi
      .mocked(track)
      .mock.calls.filter(([event]) => event === "session_ended");
    expect(ends).toEqual([
      [
        "session_ended",
        {
          sessionId: (start![1] as { sessionId: string }).sessionId,
          durationMs: 1000,
        },
      ],
    ]);

    act(() => {
      visibility.mockReturnValue("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(
      vi
        .mocked(track)
        .mock.calls.filter(([event]) => event === "session_started"),
    ).toHaveLength(2);
  });

  it("discards the interval on withdrawal and observes a new one on reacceptance", () => {
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const view = renderProvider();
    expect(
      vi
        .mocked(track)
        .mock.calls.filter(([event]) => event === "session_started"),
    ).toHaveLength(1);
    act(() => {
      localStorage.setItem(CONSENT_KEY, "declined");
      notifyConsentChanged();
    });
    vi.mocked(track).mockClear();
    posthogMock.capture.mockClear();
    route.pathname = "/pricing";
    view.rerender(
      <AnalyticsProvider>
        <div />
      </AnalyticsProvider>,
    );
    act(() => window.dispatchEvent(new Event("beforeunload")));
    expect(track).not.toHaveBeenCalled();
    expect(pageviews()).toHaveLength(0);

    act(() => {
      posthogMock.has_opted_out_capturing.mockReturnValue(true);
      localStorage.setItem(CONSENT_KEY, "accepted");
      notifyConsentChanged();
    });
    expect(
      vi
        .mocked(track)
        .mock.calls.filter(([event]) => event === "session_started"),
    ).toHaveLength(1);
    expect(pageviews()).toHaveLength(1);
  });

  it("records the current pricing context after late consent without duplicate views", () => {
    route.pathname = "/pricing";
    route.query = "locked=deep-orbit&module=neural-networks";
    localStorage.removeItem(CONSENT_KEY);
    render(
      <AnalyticsProvider>
        <PricingAnalytics />
      </AnalyticsProvider>,
    );
    expect(
      vi
        .mocked(track)
        .mock.calls.filter(([event]) => event === "pricing_page_viewed"),
    ).toHaveLength(0);
    act(() => {
      localStorage.setItem(CONSENT_KEY, "accepted");
      notifyConsentChanged();
      notifyConsentChanged();
    });
    expect(
      vi
        .mocked(track)
        .mock.calls.filter(([event]) => event === "pricing_page_viewed"),
    ).toEqual([
      [
        "pricing_page_viewed",
        {
          entryContext: "locked_lesson",
          source: "paywall",
          lockedWorldId: "deep-orbit",
        },
      ],
    ]);
  });

  it("does not label ordinary pricing navigation as direct acquisition or a coming-soon paywall", () => {
    route.pathname = "/pricing";
    route.query = "locked=neon-protocol";
    render(
      <AnalyticsProvider>
        <PricingAnalytics />
      </AnalyticsProvider>,
    );
    expect(
      vi
        .mocked(track)
        .mock.calls.filter(([event]) => event === "pricing_page_viewed"),
    ).toEqual([["pricing_page_viewed", { entryContext: "standard" }]]);
  });
});
