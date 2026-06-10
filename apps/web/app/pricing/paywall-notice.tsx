"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { themes, themeSlugs } from "@tensorcraft/themes";
import { EVENTS, track } from "@/lib/analytics-events";

/**
 * Banner shown on /pricing when a user was redirected here from a
 * paywalled lesson (see apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx).
 * The `?locked=<themeSlug>` query param carries the context so we can
 * tell the user *why* they landed here and which theme is gated.
 *
 * Renders nothing when `locked` is absent or not a canonical slug -
 * we never want to render a banner for an arbitrary user-supplied value.
 *
 * Fires `upgrade_cta_shown` (source=`paywall`) on mount when the banner is
 * rendered. The click-through CTA itself is the plan picker below; that
 * button fires `upgrade_cta_clicked` when the user engages.
 */
export function PaywallNotice() {
  const searchParams = useSearchParams();
  const locked = searchParams.get("locked");
  const isValidLocked =
    !!locked && (themeSlugs as readonly string[]).includes(locked);

  useEffect(() => {
    if (!isValidLocked) return;
    track(EVENTS.UPGRADE_CTA_SHOWN, {
      source: "paywall",
      themeId: locked ?? undefined,
    });
  }, [isValidLocked, locked]);

  if (!locked) return null;
  if (!isValidLocked) return null;

  const displayName = themes[locked as keyof typeof themes].displayName;

  return (
    <div
      role="status"
      className="flex items-center gap-3.5 relative mx-auto max-w-[720px] px-6 py-4 bg-surface-raised border border-primary/40"
    >
      <span className="w-2 h-2 bg-primary shrink-0" aria-hidden="true" />
      <p className="flex-1 m-0 text-sm leading-relaxed text-text-primary">
        Module 2 and beyond in <strong>{displayName}</strong> require a
        purchase. Pick a plan below to access all 11 modules and 55 lessons.
      </p>
    </div>
  );
}
