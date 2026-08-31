"use client";

import { motion } from "framer-motion";
import { BRIDGES } from "@tensorcraft/shared";
import type { BridgeTier } from "@tensorcraft/shared";

// ONE bridge on the landing page: the catalog is paid content, not for
// public browsing (the prev/next cycler was removed 2026-06-10 for this
// reason; do not reintroduce). V1 ships React only, so the preview just
// needs a real ML snippet and a React code variant.
const PREVIEW_BRIDGE =
  BRIDGES.find((b) => b.mlCode && b.variants?.react?.jsCode) ?? BRIDGES[0];

// Theme-aware tier tokens (themes.css), same mapping as the exercise
// bridge hint. One accent per band: both code blocks, the connector, and
// the connection prefix all carry the previewed bridge's tier color.
const TIER_VARS: Record<BridgeTier, string> = {
  identity: "var(--tc-tier-identity)",
  structural: "var(--tc-tier-structural)",
  intuition: "var(--tc-tier-intuition)",
};

// bridges.ts stores mlCode single-line for the compact lesson callout; at
// landing-panel width two statements on one line read as a run-on.
function statementPerLine(code: string): string {
  return code.replace(/;\s+/g, ";\n");
}

export function BridgePreviewSection() {
  const bridge = PREVIEW_BRIDGE;
  const variant = bridge.variants?.react;
  const jsTitle = variant?.jsConcept || bridge.jsConcept;
  const jsCode = variant?.jsCode ?? "";
  const tierColor = TIER_VARS[bridge.tier];

  return (
    <section className="border-b border-border">
      {/* Header */}
      <div className="px-10 md:px-20 pt-16 pb-6 text-center">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-4">
          THE BRIDGE SYSTEM
        </div>
        {/* "Anchor", not "Name" (owner, 2026-08-23): only 2 of the 51
            catalog bridges are tier `identity`. 38 are structural and 11
            are intuition, and every entry carries a `breaks` note recording
            where the analogy stops (this section hides it by owner
            decision, so the headline gets no counterweight on screen). A
            name would claim an equivalence the data does not support. An
            anchor claims a starting point, which is what a bridge is. */}
        <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
          Every ML Concept Has a JavaScript Anchor
        </h2>
      </div>

      {/* Code band: the lesson BridgeCallout grammar scaled up, so the
          landing previews the surface learners actually use. Labels are
          symmetric and muted; the analogy's two sides get equal weight. */}
      <div className="border-t border-border overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]"
        >
          {/* JS side */}
          <div className="px-10 md:px-16 py-10 md:py-12 flex">
            <div className="max-w-lg w-full mx-auto md:mx-0 md:ml-auto flex flex-col">
              <div className="font-mono text-xs text-text-muted uppercase tracking-[0.15em] mb-3">
                JAVASCRIPT
              </div>
              <h3 className="font-mono text-xl font-bold text-text-primary mb-4">
                {jsTitle}
              </h3>
              <div
                className="flex-1 bg-code-bg border border-border p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ color: tierColor }}
              >
                {jsCode}
              </div>
            </div>
          </div>

          {/* Connector: decoration sitting on the divider. Deliberately
              button-free (no border, no glow, no raised surface); the old
              boxed treatment read as a toggle and drew dead clicks. */}
          <div className="hidden md:flex items-center justify-center px-2 relative">
            <div className="absolute top-0 bottom-0 w-px bg-border" />
            <span
              aria-hidden="true"
              className="relative z-10 bg-page py-2 font-mono text-lg"
              style={{ color: tierColor }}
            >
              ⇄
            </span>
          </div>
          {/* Mobile connector */}
          <div className="md:hidden flex items-center justify-center py-3">
            <span
              aria-hidden="true"
              className="font-mono text-base"
              style={{ color: tierColor }}
            >
              ⇄
            </span>
          </div>

          {/* ML side */}
          <div className="px-10 md:px-16 py-10 md:py-12 flex">
            <div className="max-w-lg w-full mx-auto md:mx-0 flex flex-col">
              <div className="font-mono text-xs text-text-muted uppercase tracking-[0.15em] mb-3">
                MACHINE LEARNING
              </div>
              <h3 className="font-mono text-xl font-bold text-text-primary mb-4">
                {bridge.mlConcept}
              </h3>
              <div
                data-testid="bridge-ml-code"
                className="flex-1 bg-code-bg border border-border p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ color: tierColor }}
              >
                {statementPerLine(bridge.mlCode ?? "")}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Connection band: why the two sides map. Same "bridge:" grammar as
          the lesson callout footer; the headline's claim gets its evidence
          instead of standing alone. */}
      <div className="border-t border-border px-10 md:px-20 py-8">
        <p className="max-w-[65ch] mx-auto font-mono text-sm leading-relaxed text-text-muted">
          <span style={{ color: tierColor }}>bridge:</span> {bridge.connection}
        </p>
      </div>

      {/* The section exit CTA ("Write your first tensor..., free") was
          removed 2026-08-31 (owner request); the hero's primary CTA above
          and the closing section's CTA below both point at the same free
          lesson, so the section ends on its content. */}
    </section>
  );
}
