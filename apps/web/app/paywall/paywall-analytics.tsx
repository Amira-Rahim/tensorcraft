"use client";

import { useEffect } from "react";
import { EVENTS, track } from "@/lib/analytics-events";

/**
 * Client-side analytics wire-up for the dedicated `/paywall` upsell page.
 *
 * Fires `upgrade_cta_shown` (source=`paywall`) on mount so we can measure
 * paywall-page impressions. Click-throughs are wired via
 * {@link PaywallCtaClickHandler} on each CTA link.
 */
export function PaywallAnalytics() {
  useEffect(() => {
    track(EVENTS.UPGRADE_CTA_SHOWN, { source: "paywall" });
  }, []);

  return null;
}

/**
 * Fires `upgrade_cta_clicked` when the user clicks an upsell link on
 * `/paywall`. Attached as a child of the `<Link>` so we don't need to
 * convert the server-rendered anchor into a button.
 *
 * Uses `onClickCapture` to log before navigation kicks in.
 */
export function PaywallCtaTracker({ children }: { children: React.ReactNode }) {
  return (
    <span
      onClickCapture={() => {
        track(EVENTS.UPGRADE_CTA_CLICKED, { source: "paywall" });
      }}
      className="contents"
    >
      {children}
    </span>
  );
}
