"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BRIDGES, type Framework } from "@tensorcraft/shared";

const FRAMEWORKS: { id: Framework; label: string; icon: string }[] = [
  { id: "react", label: "React", icon: "⚛" },
  { id: "vue", label: "Vue", icon: "◆" },
  { id: "angular", label: "Angular", icon: "▲" },
  { id: "svelte", label: "Svelte", icon: "◐" },
  { id: "vanilla", label: "Vanilla JS", icon: "{ }" },
];

// Only bridges that carry a real ML snippet AND a code variant for every
// framework qualify for the landing preview, guarantees we never fall back
// to prose inside a code-styled block, whichever combination is selected.
const PREVIEW_BRIDGES = BRIDGES.filter(
  (b) => b.mlCode && FRAMEWORKS.every((f) => b.variants?.[f.id]?.feCode),
);

export function BridgePreviewSection() {
  const [selected, setSelected] = useState<Framework>("react");
  const [index, setIndex] = useState(0);

  const bridge = PREVIEW_BRIDGES[index] ?? BRIDGES[0];
  const variant = bridge.variants?.[selected];
  const feTitle = variant?.feConcept || bridge.feConcept;
  const feCode = variant?.feCode ?? "";
  const selectedLabel =
    FRAMEWORKS.find((f) => f.id === selected)?.label ?? selected;

  const cycle = (dir: 1 | -1) =>
    setIndex(
      (i) => (i + dir + PREVIEW_BRIDGES.length) % PREVIEW_BRIDGES.length,
    );

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
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[500px] mx-auto">
          {BRIDGES.length} bridges map ML concepts to the code you write daily.
          Pick your framework. We&apos;ll prove it.
        </p>
      </div>

      {/* Framework selector, horizontal tabs */}
      <div className="flex justify-center px-6 pb-6">
        <div className="inline-flex gap-0.5">
          {FRAMEWORKS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelected(f.id)}
              aria-pressed={selected === f.id ? "true" : "false"}
              aria-label={`Show bridges in ${f.label}`}
              className={`flex items-center gap-2 px-5 py-2.5 font-mono text-xs uppercase tracking-wider transition-all border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page ${
                selected === f.id
                  ? "bg-primary/10 border-primary text-primary font-bold underline underline-offset-8 decoration-2"
                  : "bg-surface border-border text-text-muted hover:border-primary/20 hover:text-text-primary"
              }`}
            >
              <span aria-hidden="true" className="text-sm">
                {f.icon}
              </span>
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bridge cycler controls, ←/→ keys work while focus is inside */}
      <div
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            cycle(-1);
          } else if (e.key === "ArrowRight") {
            e.preventDefault();
            cycle(1);
          }
        }}
        className="flex justify-center items-center gap-4 pb-8 font-mono text-xs text-text-muted"
      >
        <button
          type="button"
          onClick={() => cycle(-1)}
          aria-label="Previous bridge"
          data-testid="bridge-prev"
          className="px-3 py-1.5 border border-border hover:border-primary/30 hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
        >
          ←
        </button>
        <span
          data-testid="bridge-counter"
          className="tracking-[0.14em] uppercase tabular-nums"
        >
          Bridge #{bridge.id} of {BRIDGES.length}
        </span>
        <button
          type="button"
          onClick={() => cycle(1)}
          aria-label="Next bridge"
          data-testid="bridge-next"
          className="px-3 py-1.5 border border-border hover:border-primary/30 hover:text-text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
        >
          →
        </button>
      </div>

      {/* Bridge display, full width, centered. Keyed crossfade so a
          framework/bridge switch reads as a transition, not a teleport. */}
      <div className="border-t border-border overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${bridge.id}-${selected}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]"
          >
            {/* FE side */}
            <div className="px-10 md:px-16 py-10 md:py-12">
              <div className="max-w-lg mx-auto md:mx-0 md:ml-auto">
                <div className="font-mono text-xs text-primary uppercase tracking-[0.15em] mb-3">
                  YOUR {selectedLabel.toUpperCase()} CODE
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
                <div className="font-mono text-xs text-text-muted mt-3">
                  It&apos;s the same pattern: switch frameworks above, this side
                  never changes.
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Section exit CTA */}
      <div className="border-t border-border px-10 md:px-20 py-8 text-center">
        <Link
          href="/themes/deep-orbit/foundations/introduction-to-tensors"
          data-testid="bridge-section-cta"
          className="inline-flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-wider text-primary border-b-2 border-primary pb-1 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
        >
          Run a bridge yourself, module 1 is free →
        </Link>
      </div>
    </section>
  );
}
