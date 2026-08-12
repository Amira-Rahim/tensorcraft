"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BRIDGES } from "@tensorcraft/shared";

// ONE bridge on the landing page: the catalog is paid content, not for
// public browsing (the prev/next cycler was removed 2026-06-10 for this
// reason; do not reintroduce). V1 ships React only, so the preview just
// needs a real ML snippet and a React code variant.
const PREVIEW_BRIDGE =
  BRIDGES.find((b) => b.mlCode && b.variants?.react?.feCode) ?? BRIDGES[0];

export function BridgePreviewSection() {
  const bridge = PREVIEW_BRIDGE;
  const variant = bridge.variants?.react;
  const feTitle = variant?.feConcept || bridge.feConcept;
  const feCode = variant?.feCode ?? "";

  return (
    <section className="border-b border-border">
      {/* Header */}
      <div className="px-10 md:px-20 pt-16 pb-6 text-center">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-4">
          THE BRIDGE SYSTEM
        </div>
        <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-4">
          Every ML Concept Has a Frontend Name
        </h2>
      </div>

      {/* Bridge display, full width, centered. */}
      <div className="border-t border-border overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]"
        >
          {/* FE side */}
          <div className="px-10 md:px-16 py-10 md:py-12">
            <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
              <div className="font-mono text-xs text-primary uppercase tracking-[0.15em] mb-3">
                YOUR REACT CODE
              </div>
              <h3 className="font-mono text-xl font-bold text-text-primary mb-4">
                {feTitle}
              </h3>
              <div className="bg-code-bg border border-border p-5 font-mono text-[13px] text-primary leading-relaxed whitespace-pre-wrap">
                {feCode}
              </div>
            </div>
          </div>

          {/* Connector */}
          <div className="hidden md:flex flex-col items-center justify-center px-2 relative">
            <div className="absolute top-0 bottom-0 w-px bg-border" />
            <div
              aria-hidden="true"
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
              aria-hidden="true"
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
          <div className="px-10 md:px-16 py-10 md:py-12">
            <div className="max-w-lg mx-auto md:mx-0">
              <div className="font-mono text-xs uppercase tracking-[0.15em] mb-3 text-text-muted">
                ML EQUIVALENT
              </div>
              <h3 className="font-mono text-xl font-bold text-text-primary mb-4">
                {bridge.mlConcept}
              </h3>
              <div
                className="bg-code-bg border border-border p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--tc-tier-intuition)" }}
              >
                {bridge.mlCode}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Section exit CTA */}
      <div className="border-t border-border px-10 md:px-20 py-8 text-center">
        <Link
          href="/worlds/deep-orbit/foundations/introduction-to-tensors"
          data-testid="bridge-section-cta"
          className="inline-flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-primary border-b-2 border-primary pb-1 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
        >
          Write your first tensor, free →
        </Link>
      </div>
    </section>
  );
}
