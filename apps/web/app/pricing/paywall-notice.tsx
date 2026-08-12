"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { worlds } from "@tensorcraft/worlds";
import { isLaunched, getPaidLessonCount } from "@tensorcraft/shared";
import { EVENTS, track } from "@/lib/analytics-events";

/**
 * Banner shown on /pricing when a user was redirected here from a
 * paywalled lesson (see apps/web/app/worlds/[slug]/[module]/[lesson]/page.tsx).
 * The `?locked=<worldSlug>` query param carries the context so we can
 * tell the user *why* they landed here and which world is gated.
 *
 * Renders nothing when `locked` is absent or not a LAUNCHED slug - we never
 * want to render a banner for an arbitrary user-supplied value, and a
 * coming-soon world has nothing to unlock. It previously accepted any
 * canonical slug, so /pricing?locked=neon-protocol rendered a purchase
 * banner quoting Deep Orbit's lesson count for a world that ships no
 * lessons at all.
 *
 * Fires `upgrade_cta_shown` (source=`paywall`) on mount when the banner is
 * rendered. The click-through CTA itself is the plan picker below; that
 * button fires `upgrade_cta_clicked` when the user engages.
 *
 * Also fires `paywall_hit` (dev-plan §4c). That event was specced but never
 * actually fired: its only call site was <LessonPaywall>, which the lesson
 * route stopped rendering when it moved to redirect-based enforcement, so
 * the funnel's most important stage recorded nothing. The banner renders at
 * exactly the paywall-hit moment, which makes it the correct home for it.
 * `?module=` carries the gated module so the event keeps that dimension.
 */
export function PaywallNotice() {
  const searchParams = useSearchParams();
  const locked = searchParams.get("locked");
  const gatedModule = searchParams.get("module");
  const isValidLocked = !!locked && isLaunched(locked);

  useEffect(() => {
    if (!isValidLocked) return;
    track(EVENTS.PAYWALL_HIT, {
      worldId: locked ?? undefined,
      moduleId: gatedModule ?? "unknown",
    });
    track(EVENTS.UPGRADE_CTA_SHOWN, {
      source: "paywall",
      worldId: locked ?? undefined,
    });

    // Tag the buyer in Kit so retention sequence B can reach someone who ran
    // out of free content and didn't buy. Dedupe correctness (only record
    // "tagged" when Kit actually tagged) lives in tagKitEventOnce — getting
    // it wrong here silently and permanently discards this exact audience.
    void import("@/lib/kit-tag").then(({ tagKitEventOnce }) =>
      tagKitEventOnce("paywall_hit", "tc_paywall_hit_tagged").catch(() => {}),
    );
  }, [isValidLocked, locked, gatedModule]);

  if (!locked) return null;
  if (!isValidLocked) return null;

  const displayName = worlds[locked as keyof typeof worlds].displayName;

  return (
    <div
      role="status"
      className="flex items-center gap-3.5 relative mx-auto max-w-[720px] px-6 py-4 bg-surface-raised border border-primary/40"
    >
      <span className="w-2 h-2 bg-primary shrink-0" aria-hidden="true" />
      <p className="flex-1 m-0 text-sm leading-relaxed text-text-primary">
        Modules 2-11 of <strong>{displayName}</strong> are where the model
        actually learns: {getPaidLessonCount()} lessons, the capstone you ship,
        and your certificate. One payment, lifetime access, and a 14-day
        money-back guarantee.
      </p>
    </div>
  );
}
