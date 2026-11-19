"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { isLaunched } from "@tensorcraft/shared";
import { EVENTS, track } from "@/lib/analytics-events";
import { useAnalyticsReady } from "@/lib/analytics-ready";

/**
 * Headless funnel instrumentation for the paywall redirect on /pricing.
 *
 * A locked lesson sends the learner here as
 * `/pricing?locked=<worldSlug>&module=<moduleSlug>` (see
 * apps/web/app/worlds/[slug]/[module]/[lesson]/page.tsx). This reads that
 * context and records it.
 *
 * It renders nothing. There used to be a visible banner here restating the
 * offer (lesson count, capstone, certificate, guarantee); that copy was
 * removed (owner, 2026-09-15) and the plan picker below carries the offer
 * on its own. Only the events survived the removal, so this component is
 * now shaped like its neighbour <PricingAnalytics>.
 *
 * The `isLaunched` guard is still load-bearing even with no markup: it
 * keeps an arbitrary or stale `locked` value, and a coming-soon world that
 * has nothing to unlock, out of the funnel numbers.
 *
 * Fires `paywall_hit`. That event was specced but never
 * actually fired: its only call site was <LessonPaywall>, which the lesson
 * route stopped rendering when it moved to redirect-based enforcement, so
 * the funnel's most important stage recorded nothing. This mounts at
 * exactly the paywall-hit moment, which makes it the correct home for it.
 * `?module=` carries the gated module so the event keeps that dimension.
 *
 * Also fires `upgrade_cta_shown` (source=`paywall`) on mount. The
 * click-through CTA is the plan picker below; that button fires
 * `upgrade_cta_clicked` when the user engages.
 */
export function PaywallNotice() {
  const searchParams = useSearchParams();
  const locked = searchParams.get("locked");
  const gatedModule = searchParams.get("module");
  const isValidLocked = !!locked && isLaunched(locked);
  const ready = useAnalyticsReady();

  useEffect(() => {
    if (!ready || !isValidLocked) return;
    track(EVENTS.PAYWALL_HIT, {
      worldId: locked ?? undefined,
      moduleId: gatedModule ?? "unknown",
    });
    track(EVENTS.UPGRADE_CTA_SHOWN, {
      source: "paywall",
      worldId: locked ?? undefined,
    });
  }, [ready, isValidLocked, locked, gatedModule]);

  useEffect(() => {
    if (!isValidLocked) return;
    // Tag the buyer in Kit so retention sequence B can reach someone who ran
    // out of free content and didn't buy. Dedupe correctness (only record
    // "tagged" when Kit actually tagged) lives in tagKitEventOnce - getting
    // it wrong here silently and permanently discards this exact audience.
    void import("@/lib/kit-tag").then(({ tagKitEventOnce }) =>
      tagKitEventOnce("paywall_hit", "tc_paywall_hit_tagged").catch(() => {}),
    );
  }, [isValidLocked, locked, gatedModule]);

  return null;
}
