interface BridgeMapping {
  feTitle: string;
  mlTitle: string;
  feCode?: string;
  mlCode?: string;
  tier: "identity" | "structural" | "intuition";
}

interface ConceptProps {
  /** Package-level API: explanation text */
  explanation?: string;
  /** Package-level API: nested bridge object */
  bridge?: BridgeMapping;
  /** App-level API: flat bridge props */
  feTitle?: string;
  feCode?: string;
  mlTitle?: string;
  mlCode?: string;
  tier?: "identity" | "structural" | "intuition";
}

const tierColors: Record<BridgeMapping["tier"], string> = {
  identity: "var(--tc-tier-identity, #6BAA8A)",
  structural: "var(--tc-tier-structural, #7096B0)",
  intuition: "var(--tc-tier-intuition, #A89060)",
};

const tierLabels: Record<BridgeMapping["tier"], string> = {
  identity: "Identity Bridge",
  structural: "Structural Bridge",
  intuition: "Intuition Bridge",
};

function BridgeSection({ bridge }: { bridge: BridgeMapping }) {
  const color = tierColors[bridge.tier];

  return (
    <div
      className="p-4 bg-surface border border-border"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <span
        className="text-xs font-mono font-semibold uppercase tracking-widest block mb-3"
        style={{ color }}
      >
        {tierLabels[bridge.tier]}
      </span>

      <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2">
        {/* FE side */}
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-text-muted block mb-1">
            Frontend
          </span>
          <span className="text-sm font-semibold text-text-primary block">
            {bridge.feTitle}
          </span>
          {bridge.feCode && (
            <pre
              className="block mt-2 p-2 text-[13px] leading-relaxed font-mono bg-surface border border-border overflow-x-auto"
              style={{ color }}
            >
              <code>{bridge.feCode}</code>
            </pre>
          )}
        </div>

        {/* Arrow */}
        <span className="text-center text-sm font-mono" style={{ color }}>
          →
        </span>

        {/* ML side */}
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-text-muted block mb-1">
            ML
          </span>
          <span className="text-sm font-semibold text-text-primary block">
            {bridge.mlTitle}
          </span>
          {bridge.mlCode && (
            <pre
              className="block mt-2 p-2 text-[13px] leading-relaxed font-mono bg-surface border border-border overflow-x-auto"
              style={{ color }}
            >
              <code>{bridge.mlCode}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export function Concept({
  explanation,
  bridge,
  feTitle,
  feCode,
  mlTitle,
  mlCode,
  tier,
}: ConceptProps) {
  // Normalize: if flat bridge props are provided, build a BridgeMapping
  const resolvedBridge: BridgeMapping | undefined =
    bridge ??
    (feTitle && mlTitle && tier
      ? { feTitle, feCode, mlTitle, mlCode, tier }
      : undefined);

  // App-level flat API (no explanation): render bridge directly at top level
  if (!explanation && resolvedBridge) {
    const color = tierColors[resolvedBridge.tier];
    return (
      <div
        className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border"
        style={{ borderLeftWidth: 3, borderLeftColor: color }}
      >
        <BridgeSection bridge={resolvedBridge} />
      </div>
    );
  }

  // Package-level API (with explanation): render explanation + optional bridge
  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Concept
      </h4>
      {explanation && (
        <p className="text-sm leading-relaxed text-text-primary/80">
          {explanation}
        </p>
      )}

      {resolvedBridge && (
        <div className="mt-4">
          <BridgeSection bridge={resolvedBridge} />
        </div>
      )}
    </div>
  );
}
