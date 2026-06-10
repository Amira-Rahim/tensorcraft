"use client";

import { useEffect, useState } from "react";

export type BridgeTier = "identity" | "structural" | "intuition";

export interface BridgeItem {
  fe: string;
  ml: string;
  tier?: BridgeTier;
}

export interface BridgeTickerProps {
  items: BridgeItem[];
  /** Scroll duration tier — slow (60s), medium (40s), fast (25s). */
  speed?: "slow" | "medium" | "fast";
  className?: string;
}

const SPEED_DURATIONS: Record<
  NonNullable<BridgeTickerProps["speed"]>,
  string
> = {
  slow: "60s",
  medium: "40s",
  fast: "25s",
};

const TIER_TINT: Record<BridgeTier, string> = {
  identity: "var(--tc-primary)",
  structural: "var(--tc-accent, var(--tc-primary))",
  intuition: "var(--tc-muted)",
};

// Plain-language gloss for the tier taxonomy — cold visitors see "structural"
// as jargon; the tooltip carries how literally the mapping holds.
const TIER_HINT: Record<BridgeTier, string> = {
  identity: "Identity bridge — same concept, same math",
  structural: "Structural bridge — same shape, different mechanics",
  intuition: "Intuition bridge — useful mental model, not literal",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    )
      return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (ev: MediaQueryListEvent) => setReduced(ev.matches);
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  }, []);

  return reduced;
}

function Card({ item }: { item: BridgeItem }) {
  const tier = item.tier;
  return (
    <div
      data-testid="bridge-card"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0.875rem",
        marginRight: "0.75rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.8125rem",
        border: "1px solid var(--tc-border)",
        color: "var(--tc-fg, inherit)",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      <span>{item.fe}</span>
      <span aria-hidden="true" style={{ color: "var(--tc-muted)" }}>
        {"→"}
      </span>
      <span style={{ color: "var(--tc-primary)" }}>{item.ml}</span>
      {tier && (
        <span
          data-testid="tier-badge"
          title={TIER_HINT[tier]}
          aria-label={TIER_HINT[tier]}
          style={{
            marginLeft: "0.25rem",
            padding: "0.125rem 0.375rem",
            fontSize: "0.6875rem",
            textTransform: "lowercase",
            letterSpacing: "0.02em",
            border: "1px solid var(--tc-border)",
            color: TIER_TINT[tier],
          }}
        >
          {tier}
        </span>
      )}
    </div>
  );
}

export function BridgeTicker({
  items,
  speed = "medium",
  className,
}: BridgeTickerProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);

  const duration = SPEED_DURATIONS[speed];

  if (reducedMotion) {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          padding: "0.5rem 0",
        }}
      >
        <div
          data-testid="ticker-track"
          data-reduced-motion="true"
          data-paused="true"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            width: "100%",
          }}
        >
          {items.map((item, i) => (
            <Card key={`${item.fe}-${item.ml}-${i}`} item={item} />
          ))}
        </div>
      </div>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        borderTop: "1px solid var(--tc-border)",
        borderBottom: "1px solid var(--tc-border)",
        padding: "0.5rem 0",
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes tc-bridge-ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        data-testid="ticker-track"
        data-paused={paused ? "true" : "false"}
        data-reduced-motion="false"
        style={{
          display: "inline-flex",
          whiteSpace: "nowrap",
          willChange: "transform",
          animation: `tc-bridge-ticker-scroll ${duration} linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {doubled.map((item, i) => (
          <Card key={`${item.fe}-${item.ml}-${i}`} item={item} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? "Play bridge ticker" : "Pause bridge ticker"}
        style={{
          position: "absolute",
          top: "0.25rem",
          right: "0.25rem",
          padding: "0.125rem 0.5rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          // Solid fill — cards scroll underneath; transparent made the
          // control collide visually with badge text.
          background: "var(--tc-bg, #1c1c1c)",
          color: "var(--tc-muted)",
          border: "1px solid var(--tc-border)",
          cursor: "pointer",
        }}
      >
        {paused ? "play" : "pause"}
      </button>
    </div>
  );
}
