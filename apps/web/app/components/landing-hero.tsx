"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ParticleField } from "@tensorcraft/ui/effects";

/**
 * Brutalist landing hero (Phase 11 §11d Wave 1).
 *
 * Replaces the previous `HeroSection` when used from the landing page:
 *  - ParticleField canvas background (aria-hidden, z-0, low density).
 *  - Square-edged CTAs (rounded-none) with hard brutalist-shadow.
 *  - Mono labels, uppercase tracking, focus-visible rings.
 *
 * The landing headline text is intentionally preserved from the iterated
 * copy baseline (`project_copy_lines.md`) — do not silently rewrite.
 */
export function LandingHero() {
  return (
    <section
      data-testid="landing-hero"
      className="min-h-screen flex items-center px-10 md:px-20 pt-24 pb-28 border-b border-border relative overflow-hidden"
    >
      {/* Particle canvas background — pure decoration, low density */}
      <ParticleField
        density={0.3}
        className="absolute inset-0 z-0 pointer-events-none"
      />
      <div className="absolute inset-0 grid-bg pointer-events-none z-1" />

      <motion.div
        className="max-w-[620px] w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9 }}
      >
        <div className="font-mono text-xs text-primary tracking-[0.14em] uppercase mb-9 flex items-center gap-3">
          <span className="inline-block w-[7px] h-[7px] bg-primary" />
          Deep Orbit is live · Launch cohort open
        </div>

        <h1 className="text-5xl md:text-6xl font-mono font-black leading-[0.93] tracking-[-0.045em] mb-10 uppercase">
          <span className="block">The Bridge from</span>
          <span className="block">
            Frontend to <span className="text-primary">ML</span>
          </span>
          <span className="block">Is Shorter Than</span>
          <span className="block">You Think</span>
        </h1>

        <p className="text-lg text-text-muted max-w-[520px] mb-12 leading-relaxed font-sans">
          Every ML concept maps to a frontend analogy you already know. Every
          analogy ships with a label that says{" "}
          <span className="text-text-primary">where it lies</span>, so you stop
          past the honest limit. Eleven modules, fifty-five lessons, one
          deployable model. Built in JavaScript.
        </p>

        <div className="flex gap-4 flex-wrap mb-14">
          <Link
            href="/themes/deep-orbit/foundations/introduction-to-tensors"
            data-testid="landing-cta-primary"
            className="rounded-none inline-flex items-center gap-2 px-8 py-4 bg-primary text-page font-mono font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Start Module 1 — Free →
          </Link>
          <Link
            href="#five-c-loop"
            data-testid="landing-cta-secondary"
            className="rounded-none inline-flex items-center gap-2 px-8 py-4 border-2 border-border text-text-primary font-mono font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all brutalist-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            See how it works
          </Link>
        </div>

        <p className="font-mono text-xs text-text-muted">
          No credit card. No account for module 1. No Python.
        </p>
        <p className="font-mono text-[11px] text-text-muted/60 mt-3 max-w-[460px] leading-relaxed">
          Want to be a research ML engineer in PyTorch? This is not your course.
          Want to ship ML in your web app this quarter? It is.
        </p>
      </motion.div>
    </section>
  );
}
