"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { themeSlugs } from "@tensorcraft/themes";
import { trackPricingPageViewed } from "@/lib/analytics";

/**
 * Fires {@link EVENTS.PRICING_PAGE_VIEWED} on mount with a best-guess
 * `source` based on URL context:
 *   - `?locked=<slug>`   → redirected from a paywalled lesson
 *   - `?purchase=cancelled` → user aborted a Stripe checkout
 *   - otherwise          → `direct`
 *
 * Rendered from `apps/web/app/pricing/page.tsx`; renders nothing.
 */
export function PricingAnalytics() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const locked = searchParams.get("locked");
    const purchase = searchParams.get("purchase");

    let source: "direct" | "paywall" | "dashboard" | "upgrade_cta" = "direct";
    let lockedThemeId: string | undefined;

    if (locked && (themeSlugs as readonly string[]).includes(locked)) {
      source = "paywall";
      lockedThemeId = locked;
    } else if (purchase === "cancelled") {
      source = "upgrade_cta";
    }

    trackPricingPageViewed(source, lockedThemeId);
  }, [searchParams]);

  return null;
}
