"use client";

import { useState } from "react";

const TIER_COLORS: Record<string, string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

/**
 * The tile badge used to be `tier[0].toUpperCase()`, which renders "I" for BOTH
 * identity and intuition: two of the three tiers were indistinguishable except
 * by colour, on a grid whose whole job is to show the mix you have collected.
 * Two letters, and no deriving them from the slug.
 */
const TIER_ABBR: Record<string, string> = {
  identity: "ID",
  structural: "ST",
  intuition: "IN",
};

const TIER_LABEL: Record<string, string> = {
  identity: "Identity",
  structural: "Structural",
  intuition: "Intuition",
};

interface BridgeItem {
  lessonSlug: string;
  moduleSlug: string;
  feTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
  collected: boolean;
}

const DETAIL_ID = "bridge-collection-detail";

export function BridgeCollection({ bridges }: { bridges: BridgeItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const collected = bridges.filter((b) => b.collected);
  const total = bridges.length;
  const expandedBridge = bridges.find((b) => b.lessonSlug === expanded) ?? null;

  // Collected first, then locked, each group sorted by module then lesson
  const sorted = [...bridges].sort((a, b) => {
    if (a.collected !== b.collected) return a.collected ? -1 : 1;
    return 0;
  });

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-xs font-bold text-text-muted tracking-wider uppercase">
          Bridges Collected
        </div>
        <div className="font-mono text-xs text-text-muted">
          <span className="text-primary font-bold">{collected.length}</span>
          <span>/{total}</span>
        </div>
      </div>

      {/* Progress bar. Decorative: the count above states the same thing in
          text, so announcing it twice is noise. */}
      <div className="h-1 bg-border overflow-hidden mb-4" aria-hidden="true">
        <div
          className="h-full bg-primary transition-all"
          style={{
            width: `${total > 0 ? (collected.length / total) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Token grid. Fixed 44px tiles: fractional columns scaled with
          the viewport, so ~50 uncollected tiles rendered as a wall of
          giant "?" squares on wide monitors (owner report, 2026-08-16). */}
      <div className="grid grid-cols-[repeat(auto-fill,2.75rem)] gap-0.5">
        {sorted.map((bridge) => {
          const color = TIER_COLORS[bridge.tier];
          const isExpanded = expanded === bridge.lessonSlug;

          // An uncollected bridge is deliberately a mystery: no title, no tier,
          // just a dimmed "?" until you finish the lesson. It therefore says
          // nothing a screen reader can use, and 50+ tiles each announcing
          // "question mark" is pure noise. Hide them and let the collected
          // count above carry the progress, which is the only information the
          // placeholders actually encode.
          if (!bridge.collected) {
            return (
              <div
                key={bridge.lessonSlug}
                aria-hidden="true"
                className="aspect-square bg-surface-raised border border-border flex items-center justify-center opacity-25"
              >
                <span className="font-mono text-xs text-text-muted">?</span>
              </div>
            );
          }

          return (
            <button
              key={bridge.lessonSlug}
              type="button"
              onClick={() => setExpanded(isExpanded ? null : bridge.lessonSlug)}
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? DETAIL_ID : undefined}
              className="relative aspect-square bg-surface-raised border border-border flex items-center justify-center transition-all hover:border-primary focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              title={`${TIER_LABEL[bridge.tier]} bridge: ${bridge.feTitle} → ${bridge.mlTitle}`}
            >
              {/* text-xs is 12px, the design system's floor. This badge was
                  text-[10px] and the detail caption below was text-[8px]; the
                  2026-04-20 a11y audit flagged both, and the component never
                  shipped, so the fix never landed either. */}
              <span
                className="font-mono text-xs font-bold tracking-tight"
                style={{ color }}
                aria-hidden="true"
              >
                {TIER_ABBR[bridge.tier]}
              </span>
              {/* The tile carries its tier as a two-letter badge and a colour,
                  neither of which a screen reader reads. Only collected bridges
                  reach this branch, so there is no locked state to announce. */}
              <span className="sr-only">
                {TIER_LABEL[bridge.tier]} bridge: {bridge.feTitle} to{" "}
                {bridge.mlTitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail panel.
          This was a w-48 popover anchored inside each tile. At 320px the grid
          is 4 columns of ~72px, so a 192px popover opened on the right-hand
          column extended past the viewport and pushed the document sideways
          (WCAG 1.4.10). A full-width panel below the grid cannot overflow at
          any width, and a 192px card hanging off a 72px tile was poor on
          mobile regardless. */}
      {expandedBridge && (
        <div
          id={DETAIL_ID}
          className="mt-2 p-4 bg-surface border border-border text-left"
          style={{
            borderTopColor: TIER_COLORS[expandedBridge.tier],
            borderTopWidth: 2,
          }}
        >
          <div className="font-mono text-xs text-text-primary font-bold">
            {expandedBridge.feTitle}
          </div>
          <div
            className="font-mono text-xs my-1"
            style={{ color: TIER_COLORS[expandedBridge.tier] }}
            aria-hidden="true"
          >
            &darr;
          </div>
          <div className="font-mono text-xs text-text-primary font-bold mb-2">
            {expandedBridge.mlTitle}
          </div>
          <span
            className="font-mono text-xs uppercase tracking-wider font-bold"
            style={{ color: TIER_COLORS[expandedBridge.tier] }}
          >
            {TIER_LABEL[expandedBridge.tier]}
            {expandedBridge.collected ? "" : " (locked)"}
          </span>
        </div>
      )}
    </section>
  );
}
