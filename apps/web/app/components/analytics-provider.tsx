"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog, isInitialized } from "../../lib/posthog";
import { EVENTS, track } from "../../lib/analytics-events";

const CONSENT_KEY = "tc-cookie-consent";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function AnalyticsInner() {
  const initialized = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog (EU instance via lib/posthog — no-op without key).
  useEffect(() => {
    if (initialized.current) return;
    if (!hasAnalyticsConsent()) return;

    const instance = initPostHog();
    if (instance) {
      initialized.current = true;
    }
  }, []);

  // Capture page views on route changes
  useEffect(() => {
    if (!isInitialized()) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  // Session lifecycle — fires `session_started` on mount and `session_ended`
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
