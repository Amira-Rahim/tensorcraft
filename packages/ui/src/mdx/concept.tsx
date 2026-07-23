interface BridgeMapping {
  feTitle: string;
  mlTitle: string;
  feCode?: string;
  mlCode?: string;
  tier: "identity" | "structural" | "intuition";
}

interface ConceptProps {
  explanation: string;
  bridge?: BridgeMapping;
}

const tierColors: Record<BridgeMapping["tier"], string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

const tierLabels: Record<BridgeMapping["tier"], string> = {
  identity: "Identity Bridge",
  structural: "Structural Bridge",
  intuition: "Intuition Bridge",
};

export function Concept({ explanation, bridge }: ConceptProps) {
  return (
    <div className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border">
      <h4 className="text-xs font-mono font-semibold uppercase tracking-widest mb-3 text-primary">
        Concept
      </h4>
      <p className="text-sm leading-relaxed text-text-primary/80">
        {explanation}
      </p>

      {bridge && (
        <div
          className="mt-4 p-4 bg-surface border border-border"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: tierColors[bridge.tier],
          }}
        >
          <span
            className="text-xs font-mono font-semibold uppercase tracking-widest block mb-3"
            style={{ color: tierColors[bridge.tier] }}
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
                <code
                  className="block mt-2 p-2 text-[13px] leading-relaxed bg-surface-raised border border-border"
                  style={{ color: tierColors[bridge.tier] }}
                >
                  {bridge.feCode}
                </code>
              )}
            </div>

            {/* Arrow */}
            <span
              className="text-center text-sm font-mono"
              style={{ color: tierColors[bridge.tier] }}
            >
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
                <code
                  className="block mt-2 p-2 text-[13px] leading-relaxed bg-surface-raised border border-border"
                  style={{ color: tierColors[bridge.tier] }}
                >
                  {bridge.mlCode}
                </code>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
