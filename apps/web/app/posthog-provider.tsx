"use client";

/**
 * PostHog provider — initializes PostHog on the EU instance and captures
 * pageviews on route changes. Consent-gated via localStorage to satisfy
 * GDPR (no tracking before the user accepts analytics cookies).
 *
 * Skips initialization gracefully when `NEXT_PUBLIC_POSTHOG_KEY` is absent,
 * so dev/preview environments run without analytics configuration.
 */

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { initPostHog, isInitialized } from "../lib/posthog";

const CONSENT_KEY = "tc-cookie-consent";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

function PostHogPageView() {
  const initialized = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (initialized.current) return;
    if (!hasAnalyticsConsent()) return;

    const instance = initPostHog();
    if (instance) {
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isInitialized()) return;
    if (!pathname) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  );
}
