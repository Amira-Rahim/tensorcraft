"use client";

import { useState } from "react";

const TIER_COLORS: Record<string, string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

interface BridgeItem {
  lessonSlug: string;
  moduleSlug: string;
  feTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
  collected: boolean;
}

export function BridgeCollection({ bridges }: { bridges: BridgeItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const collected = bridges.filter((b) => b.collected);
  const total = bridges.length;

  // Collected first, then locked — each group sorted by module then lesson
  const sorted = [...bridges].sort((a, b) => {
    if (a.collected !== b.collected) return a.collected ? -1 : 1;
    return 0;
  });

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-xs font-bold text-text-muted tracking-wider uppercase">
          // Bridges Collected
        </div>
        <div className="font-mono text-xs text-text-muted">
          <span className="text-primary font-bold">{collected.length}</span>
          <span className="opacity-60">/{total}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border overflow-hidden mb-4">
        <div
          className="h-full bg-primary transition-all"
          style={{
            width: `${total > 0 ? (collected.length / total) * 100 : 0}%`,
          }}
        />
      </div>

      {/* Token grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-0.5">
        {sorted.map((bridge) => {
          const color = TIER_COLORS[bridge.tier];
          const isExpanded = expanded === bridge.lessonSlug;

          if (!bridge.collected) {
            return (
              <div
                key={bridge.lessonSlug}
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
              className="relative aspect-square bg-surface-raised border border-border flex items-center justify-center transition-all hover:border-primary"
              style={{
                borderLeftColor: color,
                borderLeftWidth: 3,
              }}
              title={`${bridge.feTitle} → ${bridge.mlTitle}`}
            >
              <span className="font-mono text-xs font-bold" style={{ color }}>
                {bridge.tier[0].toUpperCase()}
              </span>

              {/* Expanded overlay */}
              {isExpanded && (
                <div
                  className="absolute z-20 left-0 top-full mt-1 w-48 p-3 bg-surface border border-border shadow-lg text-left"
                  style={{ borderTopColor: color, borderTopWidth: 2 }}
                >
                  <div className="font-mono text-xs text-text-primary font-bold mb-1">
                    {bridge.feTitle}
                  </div>
                  <div className="font-mono text-xs mb-1" style={{ color }}>
                    →
                  </div>
                  <div className="font-mono text-xs text-text-primary font-bold mb-2">
                    {bridge.mlTitle}
                  </div>
                  <span
                    className="font-mono text-[8px] uppercase tracking-wider font-bold"
                    style={{ color }}
                  >
                    {bridge.tier}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
