interface Bridge {
  feTitle: string;
  feCode: string;
  mlTitle: string;
  mlCode: string;
  tier: "identity" | "structural" | "intuition";
}

interface BridgeCalloutProps {
  bridge: Bridge | undefined;
}

const tierColors: Record<Bridge["tier"], string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

const tierLabels: Record<Bridge["tier"], string> = {
  identity: "Identity Bridge",
  structural: "Structural Bridge",
  intuition: "Intuition Bridge",
};

export function BridgeCallout({ bridge }: BridgeCalloutProps) {
  if (!bridge) return null;

  const color = tierColors[bridge.tier];

  return (
    <div className="grid grid-cols-[1fr_48px_1fr] items-stretch my-8">
      {/* Frontend side */}
      <div className="p-5 brutalist-shadow bg-surface-raised border border-border">
        <h4 className="text-[11px] font-mono uppercase tracking-widest mb-3 text-text-muted">
          Frontend
        </h4>
        <h5 className="text-base font-semibold mb-2 text-text-primary">
          {bridge.feTitle}
        </h5>
        <code
          className="block p-3 text-[13px] leading-relaxed bg-surface border border-border"
          style={{ color }}
        >
          {bridge.feCode}
        </code>
      </div>

      {/* Connector */}
      <div className="flex items-center justify-center relative">
        <div className="absolute w-px h-[60%] bg-border" />
        <div
          className="relative z-10 w-7 h-7 flex items-center justify-center text-xs bg-surface-raised"
          style={{
            border: `1px solid ${color}`,
            color,
          }}
        >
          ⇄
        </div>
      </div>

      {/* ML side */}
      <div className="p-5 brutalist-shadow bg-surface-raised border border-border">
        <h4 className="text-[11px] font-mono uppercase tracking-widest mb-3 text-text-muted">
          Machine Learning
        </h4>
        <h5 className="text-base font-semibold mb-2 text-text-primary">
          {bridge.mlTitle}
        </h5>
        <code
          className="block p-3 text-[13px] leading-relaxed bg-surface border border-border"
          style={{ color }}
        >
          {bridge.mlCode}
        </code>
      </div>

      {/* Tier label */}
      <div className="col-span-3 text-center mt-2">
        <span
          className="text-[11px] font-mono uppercase tracking-widest"
          style={{ color }}
        >
          {tierLabels[bridge.tier]}
        </span>
      </div>
    </div>
  );
}
