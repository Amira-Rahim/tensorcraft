"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { isLaunched } from "@tensorcraft/shared";
import { EVENTS, track } from "@/lib/analytics-events";
import { useAnalyticsReady } from "@/lib/analytics-ready";

/**
 * Records the current pricing-page context after analytics becomes ready.
 * Entry context describes this page, not the external acquisition channel.
 */
export function PricingAnalytics() {
  const searchParams = useSearchParams();
  const ready = useAnalyticsReady();

  useEffect(() => {
    if (!ready) return;
    const locked = searchParams.get("locked");
    const purchase = searchParams.get("purchase");

    const gated = locked && isLaunched(locked);
    track(EVENTS.PRICING_PAGE_VIEWED, {
      entryContext: gated
        ? "locked_lesson"
        : purchase === "cancelled"
          ? "checkout_cancelled"
          : "standard",
      ...(gated
        ? { source: "paywall" as const, lockedWorldId: locked }
        : purchase === "cancelled"
          ? { source: "upgrade_cta" as const }
          : {}),
    });
  }, [ready, searchParams]);

  return null;
}
