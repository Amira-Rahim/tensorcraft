import Link from "next/link";
import type { Metadata } from "next";
import { PRICING } from "@tensorcraft/shared";
import { FaqSection } from "./components/faq-section";
import { WhoThisIsFor } from "./components/who-this-is-for";
import { LandingHero } from "./components/landing-hero";
import { CommitTrail } from "./components/commit-trail";
import { BridgePreviewSection } from "./components/bridge-preview-section";
import { FiveWorldsSection } from "./components/five-worlds-section";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "https://tensorcraft.app" },
};

export default function Home() {
  return (
    <>
      <main className="relative z-2">
        {/* ===== HERO, brutalist, ParticleField bg (client island) ===== */}
        <LandingHero />

        <h2 className="sr-only">
          Learn machine learning for frontend developers with JavaScript and
          TensorFlow.js, browser-based ML tutorials, TensorFlow JS courses, and
          Transformers.js guides.
        </h2>

        {/* ===== BRIDGE SYSTEM (client island, framework picker) ===== */}
        <BridgePreviewSection />

        {/* ===== WHAT YOU'LL BUILD (server-rendered, zero JS) =====
            Outcome before catalog: the payoff motivates the world choice
            in Five Worlds below. ===== */}
        <section id="how-it-works" className="border-b border-border">
          {/* One pipeline band: header owns the first cell, steps 01-04 fill
              the rest. Hard dividers between cells; oversized ghost
              numerals = Five Worlds card grammar. No floating paragraphs. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <div className="px-10 md:px-14 py-12 border-b xl:border-b-0 sm:border-r border-border sm:col-span-2 xl:col-span-1">
              <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3">
                What You&apos;ll Build
              </h2>
              <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px] font-sans mb-5">
                By Module 11 you have assembled and deploy-drilled every
                component of a real-time anomaly detection system, all of it
                running in the browser, with your solutions committed to your
                GitHub.
              </p>
              <Link
                href="/pricing#curriculum"
                className="font-mono text-xs uppercase tracking-wider text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Learn more →
              </Link>
              {/* The most interview-legible artifact the product makes,
                  previously invisible until Settings: show it at the fold. */}
              <div className="mt-6 max-w-[440px]">
                <CommitTrail compact />
              </div>
            </div>
            {[
              {
                label: "Train",
                desc: "Neural networks built layer by layer in TensorFlow.js, trained in your tab. The tab is the whole toolchain, Python never enters it.",
              },
              {
                label: "Detect",
                desc: "Real-time signals classified normal or anomalous by an autoencoder + LSTM ensemble you assemble yourself.",
              },
              {
                label: "Deploy",
                desc: "A working model that runs entirely client-side: real-time inference on an ordinary laptop via WebGL.",
              },
              {
                label: "Own",
                desc: "Solved exercises push to your GitHub as commits, starting free in Module 1. Walk into interviews able to explain every layer.",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className={`relative overflow-hidden px-8 py-10 border-border ${
                  i < 3 ? "border-b sm:border-b-0" : ""
                } ${i % 2 === 0 ? "sm:border-r" : ""} xl:border-r-0 ${
                  i < 3 ? "xl:border-r" : ""
                } group`}
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-[72px] font-black leading-none text-primary opacity-10 group-hover:opacity-20 transition-opacity block mb-4 select-none"
                >
                  0{i + 1}
                </span>
                <div className="font-mono text-xs text-primary font-bold tracking-wider uppercase mb-2">
                  {item.label}
                </div>
                <p className="text-sm text-text-muted leading-relaxed font-sans">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== FIVE WORLDS (client island, canvas animations) ===== */}
        <FiveWorldsSection />

        {/* ===== WHO THIS IS FOR (server-rendered, zero JS) =====
            Qualification immediately before objection handling and the
            close: "is this me?" then "but what about…" then "start". */}
        <WhoThisIsFor testId="landing-who-for" />

        {/* ===== FAQ (server-rendered, native <details>, zero JS) =====
            Objection handling before the close. Full-width rows: every
            question spans the page, so there's no dead half. Shared with
            /pricing via <FaqSection>. */}
        <FaqSection
          testId="landing-faq"
          eyebrow="Before you ask"
          heading="Fair Questions, Honest Answers"
        />

        {/* ===== FINAL CTA (server-rendered, zero JS) =====
            Centered bookend: the one symmetric moment on an asymmetric
            page; closes without a dead half. */}
        <section className="px-10 md:px-20 py-20 flex flex-col items-center text-center gap-8">
          <div className="font-mono text-xs text-text-muted tracking-wider">
            module 1 · free · no account required
          </div>
          <h2 className="text-5xl md:text-6xl font-mono font-black tracking-[-0.045em] leading-[0.95] uppercase">
            Bridge
            <br />
            <span className="text-primary">the gap.</span>
          </h2>
          <p className="text-base text-text-muted max-w-[420px] leading-relaxed font-sans">
            Open the lesson and start reading. If it clicks, the full world is $
            {PRICING.single.price} once, no subscription.
          </p>
          {/* Free-first stays the primary action. The secondary link exists
              because this block names the price and then previously offered
              only a free-lesson link, so a reader who was already sold had
              nowhere to act on it without going back to the nav. */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/worlds/deep-orbit/foundations/introduction-to-tensors"
              data-testid="landing-cta-final"
              className="rounded-none inline-flex items-center gap-2 px-11 py-[18px] bg-primary text-on-primary font-mono font-bold text-base tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow brutalist-stamp focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              Start Module 1 →
            </Link>
            <Link
              href="/pricing"
              data-testid="landing-cta-final-pricing"
              className="rounded-none inline-flex items-center px-8 py-[18px] font-mono font-bold text-sm tracking-wider uppercase border-2 border-border text-text-muted hover:text-primary hover:border-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              See pricing
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
