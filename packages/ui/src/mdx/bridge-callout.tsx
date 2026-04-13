"use client";

import { useState, useRef, useCallback } from "react";
import {
  BRIDGES,
  type Framework,
  type BridgeVariant,
} from "@tensorcraft/shared";

interface Bridge {
  feTitle: string;
  feCode: string;
  mlTitle: string;
  mlCode: string;
  tier: "identity" | "structural" | "intuition";
}

interface BridgeCalloutProps {
  bridge: Bridge | undefined;
  userFramework?: Framework;
}

const FRAMEWORKS: Framework[] = [
  "react",
  "vue",
  "angular",
  "svelte",
  "vanilla",
];

const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: "React",
  vue: "Vue",
  angular: "Angular",
  svelte: "Svelte",
  vanilla: "Vanilla",
};

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

export function BridgeCallout({ bridge, userFramework }: BridgeCalloutProps) {
  if (!bridge) return null;

  const sharedBridge = BRIDGES.find(
    (b) =>
      b.feConcept.toLowerCase() === bridge.feTitle.toLowerCase() ||
      b.mlConcept.toLowerCase() === bridge.mlTitle.toLowerCase(),
  );

  const hasVariants =
    sharedBridge?.variants && Object.keys(sharedBridge.variants).length > 0;

  if (!hasVariants) {
    return <GenericBridgeLayout bridge={bridge} />;
  }

  return (
    <TabbedBridgeLayout
      bridge={bridge}
      sharedBridge={sharedBridge!}
      userFramework={userFramework}
    />
  );
}

function GenericBridgeLayout({ bridge }: { bridge: Bridge }) {
  const color = tierColors[bridge.tier];

  return (
    <div className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="p-5">
          <h4 className="text-xs font-mono uppercase tracking-widest mb-3 text-text-muted">
            Frontend
          </h4>
          <h5 className="text-base font-semibold mb-2 text-text-primary">
            {bridge.feTitle}
          </h5>
          <code
            className="block p-3 text-[13px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap"
            style={{ color }}
          >
            {bridge.feCode}
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
    </div>
  );
}

function TabbedBridgeLayout({
  bridge,
  sharedBridge,
  userFramework,
}: {
  bridge: Bridge;
  sharedBridge: (typeof BRIDGES)[number];
  userFramework?: Framework;
}) {
  const defaultTab = userFramework || "vanilla";
  const [activeTab, setActiveTab] = useState<Framework>(defaultTab);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const color = tierColors[bridge.tier];
  const variants = sharedBridge.variants!;

  const variant: BridgeVariant | undefined =
    variants[activeTab] ?? variants.vanilla;
  const feTitle = variant?.feConcept || bridge.feTitle;
  const feCode = variant?.feCode || bridge.feCode;

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % FRAMEWORKS.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + FRAMEWORKS.length) % FRAMEWORKS.length;
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveTab(FRAMEWORKS[index]);
      return;
    } else {
      return;
    }
    e.preventDefault();
    tabRefs.current[nextIndex]?.focus();
  }, []);

  return (
    <div className="my-8 brutalist-shadow bg-surface-raised border border-border overflow-hidden">
      <div
        className="flex border-b border-border overflow-x-auto"
        role="tablist"
        aria-label="Framework variants"
      >
        {FRAMEWORKS.map((fw, i) => {
          const isActive = fw === activeTab;
          const hasVariant = !!variants[fw];
          return (
            <button
              key={fw}
              type="button"
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              aria-selected={isActive ? "true" : "false"}
              aria-controls="bridge-content"
              tabIndex={isActive ? 0 : -1}
              disabled={!hasVariant}
              onClick={() => hasVariant && setActiveTab(fw)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors whitespace-nowrap"
              style={{
                color: isActive ? color : undefined,
                borderBottom: isActive
                  ? `2px solid ${color}`
                  : "2px solid transparent",
                background: isActive
                  ? `color-mix(in srgb, ${color} 15%, transparent)`
                  : undefined,
                opacity: hasVariant ? 1 : 0.35,
                cursor: hasVariant ? "pointer" : "default",
              }}
            >
              {FRAMEWORK_LABELS[fw]}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 px-4 shrink-0">
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
        </div>
      </div>

      <div
        id="bridge-content"
        role="tabpanel"
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-border"
      >
        <div className="p-5">
          <h4 className="text-xs font-mono uppercase tracking-widest mb-3 text-text-muted">
            Your Framework
          </h4>
          <h5 className="text-sm font-semibold mb-2 text-text-primary">
            {feTitle}
          </h5>
          <code
            className="block p-3 text-[12px] leading-relaxed bg-code-bg border border-border whitespace-pre-wrap font-mono"
            style={{ color }}
          >
            {feCode}
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
            <span style={{ color }}>// bridge:</span> {sharedBridge.connection}
          </span>
        </div>
      )}
    </div>
  );
}
