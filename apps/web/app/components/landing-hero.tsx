"use client";

import Link from "next/link";
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
 * The 2026-10-19 copy audit names the course and audience directly.
 * The supporting copy introduces the crew's task and browser-based models.
 * Earlier design: docs/superpowers/specs/2026-08-31-landing-headline-story-first.md.
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
        <div>
          {/* Fluid type keeps the longest line inside the page gutters on
              mobile and caps the desktop headline at 8.5rem. */}
          <h1 className="text-[clamp(1.75rem,calc(8.8vw-1rem),8.5rem)] font-mono font-black leading-[0.93] tracking-[-0.045em] mb-12 uppercase">
            {/* Keep the three word groups on separate lines. Trailing spaces
                preserve readable text for assistive technology. */}
            <span className="block">Machine learning </span>
            <span className="block">for JavaScript </span>
            <span className="block text-primary">engineers.</span>
          </h1>

          {/* One row under the wall: subhead anchors left, CTAs anchor right,
              so the furniture spans the same measure as the headline instead
              of stacking in the left corner. Stacks below lg. */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-16">
            <p className="text-lg text-text-muted max-w-[520px] leading-relaxed font-sans">
              Help the crew of the Archimedes investigate a signal. You’ll build
              and train the models in JavaScript, then run them in your browser.
            </p>

            <div className="flex gap-4 flex-wrap shrink-0">
              <Link
                href="/worlds/deep-orbit/foundations/introduction-to-tensors"
                data-testid="landing-cta-primary"
                className="rounded-none inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                Start Mission: Deep Orbit
              </Link>
              <Link
                href="/learn"
                data-testid="landing-cta-secondary"
                className="rounded-none inline-flex items-center gap-2 px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all brutalist-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                About the course
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
