"use client";

import { useEffect } from "react";
import { tagKitEventOnce } from "@/lib/kit-tag";

/**
 * Tag the learner `capstone` in Kit, once per browser per world.
 *
 * Routed through tagKitEventOnce (R3-6): the old inline version burned its
 * localStorage dedupe flag BEFORE the request - the exact defect class R2-7
 * fixed for paywall_hit/module_1_complete - so any browser that reached the
 * capstone before the KIT_TAG_* env vars were configured could never be
 * tagged, permanently.
 */
export function CapstoneEmailTag({ worldSlug }: { worldSlug: string }) {
  useEffect(() => {
    void tagKitEventOnce("capstone", `tc_capstone_tagged_${worldSlug}`);
  }, [worldSlug]);

  return null;
}
