"use client";

import { Suspense, useEffect, useRef } from "react";
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
        posthog.opt_in_capturing();
        return;
      }

      const instance = initPostHog();
      if (!instance) return;
      initialized.current = true;
      posthog.opt_in_capturing();

      // The route effect below only fires on navigation, so without this the
      // page consent was granted on would never be counted.
      const url = searchParamsRef.current
        ? `${pathnameRef.current}?${searchParamsRef.current}`
        : pathnameRef.current;
      posthog.capture("$pageview", { $current_url: url });
    });
  }, []);

  // Capture page views on route changes
  useEffect(() => {
    if (!isInitialized()) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

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
