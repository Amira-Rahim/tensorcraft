"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { hasAnalyticsConsent, onConsentChange } from "@/lib/consent";

function subscribe(onStoreChange: () => void): () => void {
  return onConsentChange(onStoreChange);
}

/**
 * Vercel Web Analytics behind the SAME consent gate as PostHog/Plausible.
 *
 * The bare `<Analytics />` used to render unconditionally in the root layout
 * — outside every consent gate — beaconing pageviews (URL + referrer, with a
 * server-side visitor id derived from IP + UA) before consent and AFTER an
 * explicit reject, with the `beforeSend` escape hatch unused (Tier 1-LEGAL,
 * full-audit §2 P1).
 *
 * Two layers here, both needed:
 *  - Render nothing until consent: no script, no beacon, nothing to argue
 *    about under ePrivacy.
 *  - `beforeSend` drops events if consent is withdrawn while the script is
 *    already loaded in this tab (component unmount does not unload the
 *    queued script state).
 */
export function ConsentGatedVercelAnalytics() {
  const consented = useSyncExternalStore(
    subscribe,
    hasAnalyticsConsent,
    // SSR snapshot: no consent known on the server — render nothing.
    () => false,
  );

  if (!consented) return null;

  return (
    <Analytics beforeSend={(event) => (hasAnalyticsConsent() ? event : null)} />
  );
}
