"use client";

import { useState } from "react";
import { BRIDGES, type Framework } from "@tensorcraft/shared";

const FRAMEWORKS: { id: Framework; label: string; icon: string }[] = [
  { id: "react", label: "React", icon: "⚛" },
  { id: "vue", label: "Vue", icon: "◆" },
  { id: "angular", label: "Angular", icon: "▲" },
  { id: "svelte", label: "Svelte", icon: "◐" },
  { id: "vanilla", label: "Vanilla JS", icon: "{ }" },
];

// Use Bridge #1 (Training Data / Component Props) — the most intuitive bridge
const PREVIEW_BRIDGE = BRIDGES.find((b) => b.id === 1)!;

export function BridgePreviewSection() {
  const [selected, setSelected] = useState<Framework>("react");

  const variant = PREVIEW_BRIDGE.variants?.[selected];
  const feTitle = variant?.feConcept || PREVIEW_BRIDGE.feConcept;
  const feCode = variant?.feCode || PREVIEW_BRIDGE.connection;

  return (
    <section className="border-b border-border">
      <div className="px-10 md:px-20 pt-16 pb-10">
        <h2 className="text-3xl font-mono font-black tracking-tight mb-2">
          You Already Know ML
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[560px]">
          Pick your stack. We&apos;ll show you what you already understand.
        </p>
      </div>

      <div className="px-10 md:px-20 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-0.5 max-w-[640px]">
          {/* Framework list */}
          <div className="flex flex-col gap-0.5">
            {FRAMEWORKS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelected(f.id)}
                className={`flex items-center gap-3 px-5 py-3 text-left transition-all border-2 ${
                  selected === f.id
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border hover:border-primary/20"
                }`}
              >
                <span
                  className={`font-mono text-base w-6 text-center ${
                    selected === f.id ? "text-primary" : "text-text-muted"
                  }`}
                >
                  {f.icon}
                </span>
                <span
                  className={`font-mono text-xs ${
                    selected === f.id
                      ? "text-text-primary font-semibold"
                      : "text-text-muted"
                  }`}
                >
                  {f.label}
                </span>
              </button>
            ))}
          </div>

          {/* Bridge preview */}
          <div className="bg-surface-raised border border-border p-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-text-muted mb-4">
              // YOUR BRIDGE PREVIEW
            </div>
            <div className="font-mono text-[14px] font-semibold text-text-primary mb-1.5">
              {feTitle} <span className="text-text-muted font-normal">→</span>{" "}
              {PREVIEW_BRIDGE.mlConcept}
            </div>
            <p className="text-[13px] text-text-muted leading-relaxed mb-5">
              {PREVIEW_BRIDGE.connection.split(".")[0]}.
            </p>

            {/* Side-by-side code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
              <div>
                <div className="font-mono text-[9px] text-primary uppercase tracking-widest mb-2">
                  Your Code
                </div>
                <div className="bg-code-bg border border-border p-3 font-mono text-[11px] text-primary leading-relaxed whitespace-pre-wrap min-h-[72px]">
                  {feCode}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-widest mb-2 text-text-muted">
                  ML Equivalent
                </div>
                <div
                  className="bg-code-bg border border-border p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap min-h-[72px]"
                  style={{ color: "var(--tc-tier-intuition)" }}
                >
                  model.fit(trainingData, labels);{"\n"}
                  {"// data shapes model behavior"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="p-2.5 font-mono text-[10px] text-text-muted"
              style={{
                background:
                  "color-mix(in srgb, var(--tc-tier-structural) 8%, transparent)",
                borderLeft: "2px solid var(--tc-tier-structural)",
              }}
            >
              <span style={{ color: "var(--tc-tier-structural)" }}>
                50 bridges
              </span>{" "}
              like this — all personalized to{" "}
              {FRAMEWORKS.find((f) => f.id === selected)?.label}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
