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
  const selectedLabel =
    FRAMEWORKS.find((f) => f.id === selected)?.label ?? selected;

  return (
    <section className="border-b border-border">
      {/* Header */}
      <div className="px-10 md:px-20 pt-20 pb-6 text-center">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-4">
          // THE BRIDGE SYSTEM
        </div>
        <h2 className="text-4xl md:text-5xl font-mono font-black tracking-tight mb-4">
          You Already Know ML
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[500px] mx-auto">
          Every ML concept maps to something you use daily. Pick your framework
          — we&apos;ll prove it.
        </p>
      </div>

      {/* Framework selector — horizontal tabs */}
      <div className="flex justify-center px-6 pb-10">
        <div className="inline-flex gap-0.5">
          {FRAMEWORKS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelected(f.id)}
              className={`flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-wider transition-all border-2 ${
                selected === f.id
                  ? "bg-primary/10 border-primary text-primary font-bold"
                  : "bg-surface border-border text-text-muted hover:border-primary/20 hover:text-text-primary"
              }`}
            >
              <span className="text-sm">{f.icon}</span>
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bridge display — full width, centered */}
      <div className="border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
          {/* FE side */}
          <div className="px-10 md:px-16 py-12 md:py-16">
            <div className="max-w-md ml-auto">
              <div className="font-mono text-xs text-primary uppercase tracking-[0.15em] mb-3">
                // YOUR {selectedLabel.toUpperCase()} CODE
              </div>
              <h3 className="font-mono text-xl font-bold text-text-primary mb-4">
                {feTitle}
              </h3>
              <div className="bg-code-bg border border-border p-5 font-mono text-[13px] text-primary leading-relaxed whitespace-pre-wrap">
                {feCode}
              </div>
              <div className="font-mono text-xs text-text-muted mt-3">
                You write this every day.
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="hidden md:flex flex-col items-center justify-center px-2 relative">
            <div className="absolute top-0 bottom-0 w-px bg-border" />
            <div
              className="relative z-10 w-10 h-10 flex items-center justify-center bg-surface-raised border-2 font-mono text-sm"
              style={{
                borderColor: "var(--tc-tier-structural)",
                color: "var(--tc-tier-structural)",
                boxShadow:
                  "0 0 20px color-mix(in srgb, var(--tc-tier-structural) 30%, transparent)",
              }}
            >
              ⇄
            </div>
          </div>
          {/* Mobile connector */}
          <div className="md:hidden flex items-center justify-center py-3">
            <div
              className="w-8 h-8 flex items-center justify-center bg-surface-raised border-2 font-mono text-xs"
              style={{
                borderColor: "var(--tc-tier-structural)",
                color: "var(--tc-tier-structural)",
              }}
            >
              ⇄
            </div>
          </div>

          {/* ML side */}
          <div className="px-10 md:px-16 py-12 md:py-16">
            <div className="max-w-md">
              <div className="font-mono text-xs uppercase tracking-[0.15em] mb-3 text-text-muted">
                // ML EQUIVALENT
              </div>
              <h3 className="font-mono text-xl font-bold text-text-primary mb-4">
                {PREVIEW_BRIDGE.mlConcept}
              </h3>
              <div
                className="bg-code-bg border border-border p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--tc-tier-intuition)" }}
              >
                {
                  "model.fit(trainingData, labels);\n// data shapes model behavior"
                }
              </div>
              <div className="font-mono text-xs text-text-muted mt-3">
                It&apos;s the same pattern.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bridge explanation footer */}
      <div className="border-t border-border px-10 md:px-20 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="font-mono text-[12px] text-text-muted leading-relaxed max-w-lg">
          <span style={{ color: "var(--tc-tier-structural)" }}>// bridge:</span>{" "}
          {PREVIEW_BRIDGE.connection.split(".")[0]}.
        </p>
        <div
          className="shrink-0 px-4 py-2 font-mono text-xs"
          style={{
            background:
              "color-mix(in srgb, var(--tc-tier-structural) 8%, transparent)",
            borderLeft: "2px solid var(--tc-tier-structural)",
          }}
        >
          <span style={{ color: "var(--tc-tier-structural)" }}>50 bridges</span>{" "}
          <span className="text-text-muted">
            — all personalized to {selectedLabel}
          </span>
        </div>
      </div>
    </section>
  );
}
