"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog, isInitialized } from "../../lib/posthog";
import { EVENTS, track } from "../../lib/analytics-events";
import { hasAnalyticsConsent, onConsentChange } from "../../lib/consent";
import { AnalyticsReadyContext } from "../../lib/analytics-ready";

function AnalyticsInner({
  onReadyChange,
}: {
  onReadyChange: (ready: boolean) => void;
}) {
  const initialized = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mirrors of the current route, so the consent subscription (which must not
  // re-subscribe on every navigation) can still report the right URL for the
  // pageview it emits at init time.
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams?.toString() ?? "");
  pathnameRef.current = pathname;
  searchParamsRef.current = searchParams?.toString() ?? "";

  // The single way a $pageview is sent. On a hard load with stored consent
  // the consent handler captures the landing page at init and the route
  // effect runs in the same commit for the same URL; without this guard every
  // hard load counted twice (28% of production pageviews). Only a repeat of
  // the last captured URL is skipped. The URL itself is left to posthog-js
  // (location.href, which Next has already updated when the route effect
  // runs), so $pageview matches every other event.
  const lastPageviewUrl = useRef<string | null>(null);
  const capturePageview = useCallback((path: string, query: string) => {
    if (!hasAnalyticsConsent() || !isInitialized()) return;
    const url = query ? `${path}?${query}` : path;
    if (lastPageviewUrl.current === url) return;
    lastPageviewUrl.current = url;
    posthog.capture("$pageview");
  }, []);

  const session = useRef<{ id: string; startedAt: number } | null>(null);
  const startSession = useCallback(() => {
    if (
      session.current ||
      !hasAnalyticsConsent() ||
      !isInitialized() ||
      document.visibilityState === "hidden"
    )
      return;
    const id = crypto.randomUUID();
    session.current = { id, startedAt: Date.now() };
    track(EVENTS.SESSION_STARTED, { sessionId: id });
  }, []);
  const endSession = useCallback(() => {
    const current = session.current;
    session.current = null;
    if (!current || !hasAnalyticsConsent() || !isInitialized()) return;
    track(EVENTS.SESSION_ENDED, {
      sessionId: current.id,
      durationMs: Date.now() - current.startedAt,
    });
  }, []);

  // Initialize PostHog (EU instance via lib/posthog, no-op without key).
  //
  // Subscribed to consent rather than read once on mount. A first-time
  // visitor has no consent key when this mounts, and the old mount-once
  // effect never re-ran - so accepting the banner did nothing until the next
  // hard page load, and the entire first session (land, read, hit paywall,
  // decide) emitted no events at all.
  useEffect(() => {
    return onConsentChange(() => {
      if (!hasAnalyticsConsent()) {
        // Discard the observed interval. Withdrawal must not emit an event.
        session.current = null;
        lastPageviewUrl.current = null;
        onReadyChange(false);
        if (isInitialized()) posthog.opt_out_capturing();
        return;
      }

      if (initialized.current) {
        // Consent granted again after a withdrawal. Opt in only while
        // PostHog's opt-out flag (shared by every tab through localStorage)
        // is set: calling opt_in_capturing() on every notification is what
        // fed the cross-tab $opt_in loop.
        if (posthog.has_opted_out_capturing()) {
          posthog.opt_in_capturing({ captureEventName: false });
        }
        onReadyChange(true);
        startSession();
        capturePageview(pathnameRef.current, searchParamsRef.current);
        return;
      }

      const instance = initPostHog();
      if (!instance) return;
      initialized.current = true;
      // consent_granted below is the opt-in metric; the SDK's own $opt_in
      // event would only duplicate it.
      posthog.opt_in_capturing({ captureEventName: false });
      onReadyChange(true);
      startSession();

      // Opt-in numerator, once per browser, at the first moment consent
      // makes capture possible. The decline side deliberately emits
      // nothing (the banner promises analytics only on accept); the
      // denominator is log-drain unique visitors. Guarded by its own key
      // so re-inits on later visits do not re-count this browser.
      try {
        if (!localStorage.getItem("tc-consent-reported")) {
          localStorage.setItem("tc-consent-reported", "1");
          track(EVENTS.CONSENT_GRANTED, { source: "banner" });
        }
      } catch {
        // localStorage unavailable: skip rather than risk double-counting.
      }

      // The route effect below only fires on navigation, so without this the
      // page consent was granted on would never be counted.
      capturePageview(pathnameRef.current, searchParamsRef.current);
    });
  }, [capturePageview, onReadyChange, startSession]);

  // Capture page views on route changes
  useEffect(() => {
    if (!isInitialized()) return;
    capturePageview(pathname, searchParams?.toString() ?? "");
  }, [pathname, searchParams, capturePageview]);

  // Observe visible intervals after consent. A return from a hidden tab starts
  // a new interval. Nothing before consent or after withdrawal is replayed.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") endSession();
      else startSession();
    };

    window.addEventListener("beforeunload", endSession);
    window.addEventListener("pageshow", onVisibility);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("beforeunload", endSession);
      window.removeEventListener("pageshow", onVisibility);
      document.removeEventListener("visibilitychange", onVisibility);
      endSession();
    };
  }, [endSession, startSession]);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  return (
    <AnalyticsReadyContext.Provider value={ready}>
      <Suspense fallback={null}>
        <AnalyticsInner onReadyChange={setReady} />
      </Suspense>
      {children}
    </AnalyticsReadyContext.Provider>
  );
}
