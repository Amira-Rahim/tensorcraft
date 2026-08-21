"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ParticleField } from "@tensorcraft/ui/effects";

// The hero's proof panel is the free-tier Deep Scan demo: a real 4 KB TFJS
// model classifying readings live in the visitor's tab. ssr:false, tfjs is
// browser-only and the panel is post-LCP enhancement, not critical path.
const DeepScanDemo = dynamic(
  () => import("./mdx/deep-scan-demo").then((m) => m.DeepScanDemo),
  { ssr: false },
);

/**
 * Brutalist landing hero (Phase 11 §11d Wave 1; conversion pass 2026-06-10).
 *
 * - ParticleField canvas background (aria-hidden, z-0, low density).
 * - Square-edged CTAs (rounded-none) with hard brutalist-shadow.
 * - Mono labels, uppercase tracking, focus-visible rings.
 * - Right column embeds the live Deep Scan inference demo as proof of the
 *   headline's claim. Spec: docs/superpowers/specs/2026-06-10-hero-conversion-pass.md.
 *
 * The landing headline ("ML Speaks JavaScript. / Turns Out You're Fluent.") is
 * the iterated baseline as of 2026-05-08, do not silently rewrite. Spec:
 * docs/superpowers/specs/2026-05-08-landing-headline-audience-callout.md.
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

      <div className="w-full grid lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)] gap-16 lg:gap-24 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
        >
          <h1 className="text-5xl md:text-6xl font-mono font-black leading-[0.93] tracking-[-0.045em] mb-8 uppercase">
            <span className="block">ML Speaks JavaScript.</span>
            <span className="block text-primary">
              Turns Out You&apos;re Fluent.
            </span>
          </h1>

          <p className="text-lg text-text-muted max-w-[520px] mb-6 leading-relaxed font-sans">
            Skip Python. Learn machine learning in JavaScript, in the browser.
            You&apos;ll build a model and ship it.
          </p>

          <div className="flex gap-4 flex-wrap mb-5">
            <Link
              href="/worlds/deep-orbit/foundations/introduction-to-tensors"
              data-testid="landing-cta-primary"
              className="rounded-none inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              Run Your First Tensor (Free) →
            </Link>
            <Link
              href="/learn"
              data-testid="landing-cta-secondary"
              className="rounded-none inline-flex items-center gap-2 px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all brutalist-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              See how it works
            </Link>
          </div>
        </motion.div>

        <motion.div
          data-testid="hero-demo-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="max-w-[560px] w-full lg:justify-self-end"
        >
          <div className="[&_[data-testid=deep-scan-demo]]:my-0 brutalist-shadow">
            <DeepScanDemo
              framing
              headerLabel="LIVE DEMO · running in your tab"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
