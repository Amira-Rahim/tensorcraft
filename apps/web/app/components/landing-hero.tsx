"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ParticleField } from "@tensorcraft/ui/effects";

/**
 * Brutalist landing hero (Phase 11 §11d Wave 1; conversion pass 2026-06-10).
 *
 * - ParticleField canvas background (aria-hidden, z-0, low density).
 * - Square-edged CTAs (rounded-none) with hard brutalist-shadow.
 * - Mono labels, uppercase tracking, focus-visible rings.
 * - The live Deep Scan proof panel that filled the right column from
 *   2026-06-10 was REMOVED on 2026-08-31 (owner request); DeepScanDemo now
 *   mounts only inside lessons. The headline then scaled up to a full-width
 *   fluid type wall, with the subhead and CTAs on one baseline row below,
 *   so the type owns the width the panel vacated.
 *
 * The landing headline ("Stories That / Take You From / JavaScript to ML.")
 * is the owner-decided baseline as of 2026-08-31 (story-first, category-clear
 * for cold traffic; the accent line carries the information), do not silently
 * rewrite. Spec: docs/superpowers/specs/2026-08-31-landing-headline-story-first.md.
 * Prior: docs/superpowers/specs/2026-05-08-landing-headline-audience-callout.md.
 */
export function LandingHero() {
  return (
    <section
      data-testid="landing-hero"
      className="min-h-screen flex items-center px-10 md:px-20 pt-24 pb-16 border-b border-border relative overflow-hidden"
    >
      {/* Particle canvas background, pure decoration, low density */}
      <ParticleField
        density={0.3}
        className="absolute inset-0 z-0 pointer-events-none"
      />
      <div className="absolute inset-0 grid-bg pointer-events-none z-1" />

      <div className="w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          {/* Fluid type wall: the longest line is 17 mono chars at 0.555em
              per char (0.6em advance minus 0.045em tracking), so 10vw-1rem
              keeps it inside the md:px-20 gutters at every width. The 3rem
              floor matches the old mobile size exactly; the 8.5rem ceiling
              stops ultrawide from going absurd. */}
          <h1 className="text-[clamp(3rem,calc(10vw-1rem),8.5rem)] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-12 uppercase">
            {/* Explicit line breaks: free wrapping orphans single words
                ("YOU", "ML.") wherever a line runs out of room, so the stair
                is three deliberate word groups at every size. Each non-final
                span keeps a trailing space so the accessibility tree and
                textContent stay legible across the block boundaries. */}
            <span className="block">Stories That </span>
            <span className="block">Take You From </span>
            <span className="block text-primary">JavaScript to ML.</span>
          </h1>

          {/* One row under the wall: subhead anchors left, CTAs anchor right,
              so the furniture spans the same measure as the headline instead
              of stacking in the left corner. Stacks below md. */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-16">
            <p className="text-lg text-text-muted max-w-[520px] leading-relaxed font-sans">
              Skip Python. Learn machine learning in JavaScript, in the browser.
              You&apos;ll build a model and ship it.
            </p>

            <div className="flex gap-4 flex-wrap shrink-0">
              <Link
                href="/worlds/deep-orbit/foundations/introduction-to-tensors"
                data-testid="landing-cta-primary"
                className="rounded-none inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                Start Mission: Deep Orbit →
              </Link>
              <Link
                href="/learn"
                data-testid="landing-cta-secondary"
                className="rounded-none inline-flex items-center gap-2 px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all brutalist-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                Discover Tensorcraft
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
