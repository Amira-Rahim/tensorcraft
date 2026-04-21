"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog, isInitialized } from "../../lib/posthog";

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
