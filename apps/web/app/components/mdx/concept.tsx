interface ConceptProps {
  feTitle: string;
  feCode?: string;
  mlTitle: string;
  mlCode?: string;
  tier: "identity" | "structural" | "intuition";
}

const tierColors: Record<ConceptProps["tier"], string> = {
  identity: "var(--tc-tier-identity, #6BAA8A)",
  structural: "var(--tc-tier-structural, #7096B0)",
  intuition: "var(--tc-tier-intuition, #A89060)",
};

const tierLabels: Record<ConceptProps["tier"], string> = {
  identity: "Identity Bridge",
  structural: "Structural Bridge",
  intuition: "Intuition Bridge",
};

export function Concept({
  feTitle,
  feCode,
  mlTitle,
  mlCode,
  tier,
}: ConceptProps) {
  const color = tierColors[tier];

  return (
    <div
      className="p-5 my-6 brutalist-shadow bg-surface-raised border border-border"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <span
        className="text-[11px] font-mono font-semibold uppercase tracking-widest block mb-4"
        style={{ color }}
      >
        {tierLabels[tier]}
      </span>

      <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2">
        {/* FE side */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted block mb-1">
            Frontend
          </span>
          <span className="text-sm font-semibold text-text-primary block">
            {feTitle}
          </span>
          {feCode && (
            <pre
              className="block mt-2 p-2 text-[13px] leading-relaxed font-mono bg-surface border border-border overflow-x-auto"
              style={{ color }}
            >
              <code>{feCode}</code>
            </pre>
          )}
        </div>

        {/* Arrow */}
        <span className="text-center text-sm font-mono" style={{ color }}>
          →
        </span>

        {/* ML side */}
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-text-muted block mb-1">
            ML
          </span>
          <span className="text-sm font-semibold text-text-primary block">
            {mlTitle}
          </span>
          {mlCode && (
            <pre
              className="block mt-2 p-2 text-[13px] leading-relaxed font-mono bg-surface border border-border overflow-x-auto"
              style={{ color }}
            >
              <code>{mlCode}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
