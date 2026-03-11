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
  identity: "#00D4FF",
  structural: "#7B68EE",
  intuition: "#F0C75E",
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
      <div
        className="rounded-[14px] p-5"
        style={{
          background: "var(--tc-surface, #0F1320)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h4
          className="text-[11px] uppercase tracking-widest mb-3"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          Frontend
        </h4>
        <h5
          className="text-base font-semibold mb-2"
          style={{ color: "var(--tc-text, #fff)" }}
        >
          {bridge.feTitle}
        </h5>
        <code
          className="block rounded-lg p-3 text-[13px] leading-relaxed"
          style={{
            background: "var(--tc-bg, #0D1117)",
            color: "var(--tc-accent, #00D4FF)",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {bridge.feCode}
        </code>
      </div>

      {/* Connector */}
      <div className="flex items-center justify-center relative">
        <div
          className="absolute w-px h-[60%]"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <div
          className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs"
          style={{
            background: "var(--tc-surface, #0F1320)",
            border: `1px solid ${color}`,
            color,
          }}
        >
          ⇄
        </div>
      </div>

      {/* ML side */}
      <div
        className="rounded-[14px] p-5"
        style={{
          background: "var(--tc-surface, #0F1320)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h4
          className="text-[11px] uppercase tracking-widest mb-3"
          style={{ color: "var(--tc-muted, #8B92A5)" }}
        >
          Machine Learning
        </h4>
        <h5
          className="text-base font-semibold mb-2"
          style={{ color: "var(--tc-text, #fff)" }}
        >
          {bridge.mlTitle}
        </h5>
        <code
          className="block rounded-lg p-3 text-[13px] leading-relaxed"
          style={{
            background: "var(--tc-bg, #0D1117)",
            color,
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {bridge.mlCode}
        </code>
      </div>

      {/* Tier label */}
      <div className="col-span-3 text-center mt-2">
        <span
          className="text-[11px] uppercase tracking-widest"
          style={{ color }}
        >
          {tierLabels[bridge.tier]}
        </span>
      </div>
    </div>
  );
}
