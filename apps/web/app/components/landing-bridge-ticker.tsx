"use client";

import { BridgeTicker, type BridgeItem } from "@tensorcraft/ui/effects";
import { BRIDGES } from "@tensorcraft/shared";

/**
 * Scrolling band of canonical FE → ML bridges.
 *
 * Sources items from the shared `BRIDGES` catalog (50 bridges) and surfaces
 * the first 12, they're curated, tier-labelled, and cover the breadth of
 * concepts a learner hits in the first few modules.
 *
 * BridgeTicker internally respects `prefers-reduced-motion` (renders a
 * static wrap instead of scrolling) and offers a pause button.
 */
const TICKER_ITEMS: BridgeItem[] = BRIDGES.slice(0, 12).map((b) => ({
  fe: b.feConcept,
  ml: b.mlConcept,
  tier: b.tier,
}));

export function LandingBridgeTicker() {
  return (
    <section
      data-testid="landing-bridge-ticker"
      aria-label="Frontend to ML bridge examples"
      className="border-b border-border bg-surface"
    >
      <div className="px-10 md:px-20 pt-8 pb-2">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-2">
          FROM THE BRIDGE CATALOG · {TICKER_ITEMS.length} OF {BRIDGES.length}
        </div>
      </div>
      <BridgeTicker items={TICKER_ITEMS} speed="medium" />
    </section>
  );
}

export { TICKER_ITEMS as LANDING_BRIDGE_ITEMS };
