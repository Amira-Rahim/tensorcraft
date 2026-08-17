"use client";

import { useSyncExternalStore } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

function subscribe(onStoreChange: () => void): () => void {
  return onConsentChange(onStoreChange);
}

/**
 * Vercel Speed Insights behind the SAME consent gate as Vercel Analytics
 * (see consent-gated-vercel-analytics.tsx for the two-layer rationale).
 *
 * Speed Insights sets no cookies and Vercel discards visitor identifiers,
 * so an ungated mount is arguable; it still loads a third-party script that
 * beacons page URLs, and the privacy page promises no telemetry before the
 * banner is accepted. One rule for every script beats a defensible
 * exception, so it waits for consent like the rest.
 */
export function ConsentGatedSpeedInsights() {
  const consented = useSyncExternalStore(
    subscribe,
    hasAnalyticsConsent,
    // SSR snapshot: no consent known on the server - render nothing.
    () => false,
  );

  if (!consented) return null;

  return (
    <SpeedInsights
      beforeSend={(event) => (hasAnalyticsConsent() ? event : null)}
    />
  );
}
