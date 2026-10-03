"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog, isInitialized } from "../../lib/posthog";
import { EVENTS, track } from "../../lib/analytics-events";
import { hasAnalyticsConsent, onConsentChange } from "../../lib/consent";

function AnalyticsInner() {
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
    const url = query ? `${path}?${query}` : path;
    if (lastPageviewUrl.current === url) return;
    lastPageviewUrl.current = url;
    posthog.capture("$pageview");
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
        return;
      }

      const instance = initPostHog();
      if (!instance) return;
      initialized.current = true;
      // consent_granted below is the opt-in metric; the SDK's own $opt_in
      // event would only duplicate it.
      posthog.opt_in_capturing({ captureEventName: false });

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
  }, [capturePageview]);

  // Capture page views on route changes
  useEffect(() => {
    if (!isInitialized()) return;
    capturePageview(pathname, searchParams?.toString() ?? "");
  }, [pathname, searchParams, capturePageview]);

  // Session lifecycle, fires `session_started` on mount and `session_ended`
  // on tab hide / navigation away. The `sessionId` correlates the two halves
  // in PostHog without any server state. PostHog no-ops when not initialized,
  // so these fire only after consent + key are available.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startedAt = Date.now();
    let ended = false;

    track(EVENTS.SESSION_STARTED, { sessionId });

    const end = () => {
      if (ended) return;
      ended = true;
      track(EVENTS.SESSION_ENDED, {
        sessionId,
        durationMs: Date.now() - startedAt,
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") end();
    };

    window.addEventListener("beforeunload", end);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("beforeunload", end);
      document.removeEventListener("visibilitychange", onVisibility);
      end();
    };
  }, []);

  return null;
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsInner />
      </Suspense>
      {children}
    </>
  );
}
