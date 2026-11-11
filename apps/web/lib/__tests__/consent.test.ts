import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CONSENT_KEY,
  CONSENT_VERSION,
  CONSENT_VERSION_KEY,
  setConsentChoice,
  hasAnalyticsConsent,
  notifyConsentChanged,
  onConsentChange,
} from "../consent";

/**
 * Regression cover for the bug that made the entire first session untracked.
 *
 * Every consent consumer used to read localStorage once inside a mount-only
 * effect. On a first visit the key does not exist, the effect returned early,
 * and nothing ever re-ran it - accepting the banner only wrote localStorage.
 * So the session in which a visitor lands, reads the free lesson, hits the
 * paywall and decides whether to buy emitted no events at all. The `storage`
 * event is not a fix: browsers do not fire it in the tab that wrote the value,
 * which is precisely the tab that must react.
 */
describe("analytics consent", () => {
  beforeEach(() => {
    setConsentChoice(null);
    localStorage.clear();
    localStorage.setItem(CONSENT_VERSION_KEY, CONSENT_VERSION);
  });

  it("reports no consent before the banner is answered", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("requires a fresh choice when an older acceptance has no version", () => {
    localStorage.removeItem(CONSENT_VERSION_KEY);
    localStorage.setItem(CONSENT_KEY, "accepted");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("reports consent once accepted", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("preserves an older refusal without asking for a new acceptance", () => {
    localStorage.removeItem(CONSENT_VERSION_KEY);
    localStorage.setItem(CONSENT_KEY, "declined");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("treats an explicit decline as no consent", () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("runs the handler immediately so an already-consented visitor is covered", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    const handler = vi.fn();
    const off = onConsentChange(handler);
    expect(handler).toHaveBeenCalledTimes(1);
    off();
  });

  it("notifies same-tab listeners when consent is granted - the actual bug", () => {
    const handler = vi.fn();
    const off = onConsentChange(handler);
    handler.mockClear(); // drop the immediate call

    // Simulates CookieConsent.accept(): write, then notify.
    localStorage.setItem(CONSENT_KEY, "accepted");
    notifyConsentChanged();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(hasAnalyticsConsent()).toBe(true);
    off();
  });

  it("stops notifying after unsubscribe", () => {
    const handler = vi.fn();
    const off = onConsentChange(handler);
    handler.mockClear();
    off();

    notifyConsentChanged();
    expect(handler).not.toHaveBeenCalled();
  });

  it("still reacts to cross-tab consent via the storage event", () => {
    const handler = vi.fn();
    const off = onConsentChange(handler);
    handler.mockClear();

    window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY }));
    expect(handler).toHaveBeenCalledTimes(1);
    off();
  });

  it("ignores storage writes to other keys, so open tabs cannot ping-pong", () => {
    // PostHog persists its own state to localStorage on every capture, and
    // each write fires `storage` in every other open tab. Reacting to those
    // made two tabs re-trigger each other without end: tens of thousands of
    // $opt_in events in production, and a drained client rate limiter that
    // dropped real events.
    const handler = vi.fn();
    const off = onConsentChange(handler);
    handler.mockClear();

    window.dispatchEvent(
      new StorageEvent("storage", { key: "ph_phc_test_posthog" }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: "tc-lesson-progress" }),
    );
    expect(handler).not.toHaveBeenCalled();
    off();
  });

  it("reacts when another tab clears all of localStorage", () => {
    const handler = vi.fn();
    const off = onConsentChange(handler);
    handler.mockClear();

    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(handler).toHaveBeenCalledTimes(1);
    off();
  });
});
