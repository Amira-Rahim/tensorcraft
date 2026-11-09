import Link from "next/link";
import type { Metadata } from "next";
import { PRICING } from "@tensorcraft/shared";
import { FaqSection } from "./components/faq-section";
import { FreeLessonCtaTracker } from "./components/free-lesson-cta-tracker";
import { LandingHero } from "./components/landing-hero";
import { BridgePreviewSection } from "./components/bridge-preview-section";
import { IntroVideoSection } from "./components/intro-video-section";

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

        <IntroVideoSection />

        <h2 className="sr-only">
          Machine learning in JavaScript through browser exercises.
        </h2>

        {/* ===== BRIDGE SYSTEM (client island) ===== */}
        <BridgePreviewSection />

        {/* ===== DEEP ORBIT OUTCOME (server-rendered, zero JS) ===== */}
        <section id="how-it-works" className="border-b border-border">
          {/* One pipeline band: header owns the first cell, steps 01-04 fill
              the rest. Hard dividers between cells; oversized ghost
              numerals = Five Worlds card grammar. No floating paragraphs. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <div className="px-10 md:px-14 py-12 border-b xl:border-b-0 sm:border-r border-border sm:col-span-2 xl:col-span-1">
              <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3">
                Your Deep Orbit project
              </h2>
              {/* One sentence on purpose: browser, no-Python, and GitHub are
                  each already stated by the hero, the FAQ, or the cards and
                  commit log beside this. (Owner, 2026-08-16: this band was
                  overcrowded; every card now carries one fact once.) */}
              <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px] font-sans mb-5">
                In Deep Orbit&apos;s 11 modules, you&apos;ll build and deploy a
                real-time anomaly detection system.
              </p>
              <Link
                href="/pricing#curriculum"
                className="font-mono text-xs uppercase tracking-wider text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Learn more
              </Link>
              {/* CommitTrail was cut here 2026-08-16 (owner: unreadable
                  without framing, and it crowded the band). It stays on
                  /paywall, where "The proof is the artifact" prose supplies
                  the frame this cell never had. */}
            </div>
            {[
              {
                label: "Training",
                desc: "Build neural networks layer by layer in TensorFlow.js and train them in your browser.",
              },
              {
                label: "Anomaly detection",
                desc: "Classify readings as normal or anomalous with the network you built yourself.",
              },
              {
                label: "Browser inference",
                desc: "Run predictions in your browser, using WebGL for GPU acceleration when it is available.",
              },
              {
                label: "Your GitHub repository",
                desc: "Save solved exercises to your GitHub repository so you can revisit and share your code.",
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
                {/* Ghost numeral at 10% opacity is pure decoration (the real
                    step number is in the label below), which WCAG 1.4.3
                    exempts from contrast. axe-core >= 4.12 computes through
                    the opacity and would flag it, so it carries the audit's
                    data-decorative exclusion. */}
                <span
                  aria-hidden="true"
                  data-decorative="true"
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

        {/* ===== FAQ (server-rendered, static Q|A rows, zero JS) =====
            Objection handling before the close. Each row is a question |
            answer grid, so both halves of the page carry content. Shared
            with /pricing via <FaqSection>. The Who This Is For section was
            cut here 2026-08-16 (owner: overexplained the obvious); its
            load-bearing objections moved into faq-data.ts. The component
            survives on /paywall. */}
        <FaqSection
          testId="landing-faq"
          eyebrow="Before you ask"
          heading="Common Questions"
        />

        {/* ===== FINAL CTA (server-rendered, FreeLessonCtaTracker client island) =====
            Centered bookend: the one symmetric moment on an asymmetric
            page; closes without a dead half. */}
        <section className="px-10 md:px-20 py-20 flex flex-col items-center text-center gap-8">
          <div className="font-mono text-xs text-text-muted tracking-wider">
            module 1, free, no account required
          </div>
          <h2 className="text-5xl md:text-6xl font-mono font-black tracking-[-0.045em] leading-[0.95] uppercase">
            The free <br /> <span className="text-primary">first module.</span>
          </h2>
          <p className="text-base text-text-muted max-w-[420px] leading-relaxed font-sans">
            Open the lesson and start reading. If it clicks, the full world is $
            {PRICING.single.price} once, no subscription.
            {PRICING.single.price < PRICING.single.regularPrice &&
              ` That’s the introductory price. The regular price is $${PRICING.single.regularPrice}.`}
          </p>
          {/* Free-first stays the primary action. The secondary link exists
              because this block names the price and then previously offered
              only a free-lesson link, so a reader who was already sold had
              nowhere to act on it without going back to the nav. */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <FreeLessonCtaTracker source="landing_footer">
              <Link
                href="/worlds/deep-orbit/foundations/introduction-to-tensors"
                data-testid="landing-cta-final"
                className="rounded-none inline-flex items-center gap-2 px-11 py-[18px] bg-primary text-on-primary font-mono font-bold text-base tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow brutalist-stamp focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
              >
                Start Module 1
              </Link>
            </FreeLessonCtaTracker>
            <Link
              href="/pricing"
              data-testid="landing-cta-final-pricing"
              className="rounded-none inline-flex items-center px-8 py-[18px] font-mono font-bold text-sm tracking-wider uppercase border-2 border-interactive text-text-muted hover:text-primary hover:border-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
            >
              See pricing
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
