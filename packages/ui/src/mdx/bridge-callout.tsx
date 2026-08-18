"use client";

import { BRIDGES, type BridgeVariant } from "@tensorcraft/shared";

interface Bridge {
  jsTitle: string;
  jsCode: string;
  mlTitle: string;
  mlCode: string;
  tier: "identity" | "structural" | "intuition";
  breaks?: string;
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

  const sharedBridge = BRIDGES.find(
    (b) =>
      b.jsConcept.toLowerCase() === bridge.jsTitle.toLowerCase() ||
      b.mlConcept.toLowerCase() === bridge.mlTitle.toLowerCase(),
  );

  // V1 ships React only. Use the registry's react variant when present;
  // otherwise fall back to the generic prose layout from the inline bridge.
  const reactVariant: BridgeVariant | undefined = sharedBridge?.variants?.react;

  const breaks = bridge.breaks || sharedBridge?.breaks;

  if (!reactVariant) {
    return <GenericBridgeLayout bridge={bridge} breaks={breaks} />;
  }

  return (
    <ReactBridgeLayout
      bridge={bridge}
      sharedBridge={sharedBridge!}
      reactVariant={reactVariant}
      breaks={breaks}
    />
  );
}

function BridgeBreaks({ breaks, color }: { breaks: string; color: string }) {
  return (
    <div
      data-testid="bridge-breaks"
      className="px-5 py-3 border-t border-border bg-code-bg"
      style={{
        borderTop: `1px dashed ${color}`,
      }}
    >
      <div
        className="font-mono text-xs uppercase tracking-widest mb-1"
        style={{ color }}
      >
        Where the analogy ends
      </div>
      <div className="font-mono text-xs leading-relaxed text-text-muted">
        {breaks}
      </div>
    </div>
  );
}

function GenericBridgeLayout({
  bridge,
  breaks,
}: {
  bridge: Bridge;
  breaks?: string;
}) {
  const color = tierColors[bridge.tier];

  return (
    <div className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5">
          <h4 className="text-xs font-mono uppercase tracking-widest mb-3 text-text-muted">
            JavaScript
          </h4>
          <h5 className="text-base font-semibold mb-2 text-text-primary">
            {bridge.jsTitle}
          </h5>
          <code
            className="block p-3 text-[13px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap"
            style={{ color }}
          >
            {bridge.jsCode}
          </code>
        </div>
        <div className="p-5">
          <h4 className="text-xs font-mono uppercase tracking-widest mb-3 text-text-muted">
            Machine Learning
          </h4>
          <h5 className="text-base font-semibold mb-2 text-text-primary">
            {bridge.mlTitle}
          </h5>
          <code
            className="block p-3 text-[13px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap"
            style={{ color }}
          >
            {bridge.mlCode}
          </code>
        </div>
      </div>
      <div className="text-center py-2 border-t border-border">
        <span
          className="text-xs font-mono uppercase tracking-widest"
          style={{ color }}
        >
          {tierLabels[bridge.tier]}
        </span>
      </div>
      {breaks && <BridgeBreaks breaks={breaks} color={color} />}
    </div>
  );
}

function ReactBridgeLayout({
  bridge,
  sharedBridge,
  reactVariant,
  breaks,
}: {
  bridge: Bridge;
  sharedBridge: (typeof BRIDGES)[number];
  reactVariant: BridgeVariant;
  breaks?: string;
}) {
  const color = tierColors[bridge.tier];
  const jsTitle = reactVariant.jsConcept || bridge.jsTitle;
  const jsCode = reactVariant.jsCode || bridge.jsCode;

  return (
    <div className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
          React
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 inline-block"
            style={{ background: color }}
          />
          <span
            className="font-mono text-xs uppercase tracking-widest"
            style={{ color }}
          >
            {tierLabels[bridge.tier]}
          </span>
        </span>
      </div>

      <div
        id="bridge-content"
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border"
      >
        <div className="p-5">
          <h4 className="text-xs font-mono uppercase tracking-widest mb-3 text-text-muted">
            Your Framework
          </h4>
          <h5 className="text-sm font-semibold mb-2 text-text-primary">
            {jsTitle}
          </h5>
          <code
            className="block p-3 text-[12px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap font-mono"
            style={{ color }}
          >
            {jsCode}
          </code>
        </div>
        <div className="p-5">
          <h4 className="text-xs font-mono uppercase tracking-widest mb-3 text-text-muted">
            ML Equivalent
          </h4>
          <h5 className="text-sm font-semibold mb-2 text-text-primary">
            {bridge.mlTitle}
          </h5>
          <code
            className="block p-3 text-[12px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap font-mono"
            style={{ color }}
          >
            {bridge.mlCode}
          </code>
        </div>
      </div>

      {sharedBridge.connection && (
        <div
          data-testid="bridge-footer"
          className="px-5 py-3 border-t border-border bg-code-bg"
        >
          <span className="font-mono text-xs leading-relaxed text-text-muted">
            <span style={{ color }}>bridge:</span> {sharedBridge.connection}
          </span>
        </div>
      )}
      {breaks && <BridgeBreaks breaks={breaks} color={color} />}
    </div>
  );
}
