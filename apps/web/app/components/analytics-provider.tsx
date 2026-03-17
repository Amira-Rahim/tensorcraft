"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const CONSENT_KEY = "tc-cookie-consent";

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize PostHog
  useEffect(() => {
    if (initialized.current) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!key || !host) return;
    if (!hasAnalyticsConsent()) return;

    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      persistence: "localStorage+cookie",
      autocapture: false,
    });

    initialized.current = true;
  }, []);

  // Capture page views on route changes
  useEffect(() => {
    if (!initialized.current) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return <>{children}</>;
}
