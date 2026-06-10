import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { LAUNCHED_THEMES, PRICING, THEME_SLUGS } from "@tensorcraft/shared";
import { FAQ_ITEMS } from "./faq-data";
import { LandingHero } from "./components/landing-hero";
import { LandingBridgeTicker } from "./components/landing-bridge-ticker";
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
        {/* ===== HERO — brutalist, ParticleField bg (client island) ===== */}
        <LandingHero />

        <h2 className="sr-only">
          Learn machine learning for frontend developers with JavaScript and
          TensorFlow.js — browser-based ML tutorials, TensorFlow JS courses, and
          Transformers.js guides.
        </h2>

        {/* ===== STATS (server-rendered — zero JS) =====
            Directly under the hero: each slot extends a hero claim ($49,
            0 Python, the 8 KB model the visitor just watched run). Lesson/
            module counts live in the hero stat line — these slots carry
            information the hero doesn't. */}
        <section className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
          {[
            [`$${PRICING.single.price}`, "Per theme. One-time, no sub"],
            ["0", "Lines of Python"],
            ["8 KB", "The model running in the hero above"],
            [
              `${LAUNCHED_THEMES.length} / ${THEME_SLUGS.length}`,
              "Themes live",
            ],
          ].map(([v, l], i) => (
            <div
              key={l}
              className="px-10 md:px-14 py-12"
              style={{
                borderRight: i < 3 ? "1px solid var(--tc-border)" : "none",
              }}
            >
              <div className="font-mono text-[42px] font-black text-text-primary leading-none mb-2.5">
                {v}
              </div>
              <div className="text-sm text-text-muted leading-normal">{l}</div>
            </div>
          ))}
        </section>

        {/* ===== BRIDGE TICKER — scrolling marquee intro for the bridge
            system directly below (client island) ===== */}
        <LandingBridgeTicker />

        {/* ===== BRIDGE SYSTEM (client island — framework picker) ===== */}
        <BridgePreviewSection />

        {/* ===== WHAT YOU'LL BUILD (server-rendered — zero JS) =====
            Outcome before catalog: the payoff motivates the theme choice
            in Five Worlds below. ===== */}
        <section id="how-it-works" className="border-b border-border">
          <div className="px-10 md:px-20 pt-16 pb-12">
            <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3">
              What You&apos;ll Build
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px] font-sans">
              By Module 11, you&apos;ll have a real-time anomaly detection
              system — trained, tested, and deployed entirely in the browser.
            </p>
            <Link
              href="/pricing#curriculum"
              className="inline-block mt-4 font-mono text-xs uppercase tracking-wider text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              See the full module-by-module syllabus →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] border-t border-border">
            {/* Left: Project showcase */}
            <div className="px-10 md:px-14 py-12 border-b md:border-b-0 md:border-r border-border min-w-0">
              <div className="font-mono text-xs text-primary tracking-[0.15em] mb-6">
                // DEEP SCAN — ANOMALY DETECTOR
              </div>
              {/* Code mockup */}
              <div className="bg-code-bg border border-border p-5 mb-6">
                <div className="font-mono text-xs text-text-muted mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary opacity-60 inline-block" />
                  deep-scan.ts
                </div>
                <pre className="font-mono text-[12px] leading-relaxed text-text-primary overflow-x-auto">
                  <code>
                    <span className="text-primary">const</span> model ={" "}
                    <span className="text-primary">await</span>{" "}
                    tf.loadLayersModel(
                    <span style={{ color: "var(--tc-tier-intuition)" }}>
                      &apos;/deep-scan/model.json&apos;
                    </span>
                    );{"\n\n"}
                    <span className="text-text-muted">
                      // Real-time signal classification
                    </span>
                    {"\n"}
                    <span className="text-primary">const</span> prediction =
                    model.predict(signalTensor);{"\n"}
                    <span className="text-primary">const</span> isAnomaly =
                    prediction.dataSync()[0]{" "}
                    <span style={{ color: "var(--tc-tier-structural)" }}>
                      &gt;
                    </span>{" "}
                    THRESHOLD;
                  </code>
                </pre>
              </div>
              {/* Cross-reference to the live hero demo — the proof for this
                  promise already ran in the visitor's tab. */}
              <div className="flex items-center gap-3 font-mono text-xs mb-8">
                <span className="w-2 h-2 bg-primary inline-block" />
                <span className="text-text-muted">
                  The hero demo up top is this system&apos;s 8 KB preview — it
                  already ran in your tab.
                </span>
              </div>

              {/* Real product shot — the actual free lesson, not a mockup.
                  Re-capture: node scripts/capture-lesson-shot.mjs */}
              <div className="font-mono text-xs text-primary tracking-[0.15em] uppercase mb-3 flex items-center gap-2">
                <span className="w-[7px] h-[7px] bg-primary inline-block" />
                The lesson UI — the actual free lesson
              </div>
              <Link
                href="/themes/deep-orbit/foundations/introduction-to-tensors"
                data-testid="lesson-screenshot-link"
                className="block border border-border brutalist-shadow hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Image
                  src="/landing/lesson-screenshot.png"
                  alt="Lesson 1, Introduction to Tensors — story dialogue between Commander Mirza and ARIA above a six-step lesson with progress bar"
                  width={1440}
                  height={900}
                  className="w-full h-auto"
                  sizes="(min-width: 768px) 50vw, 100vw"
                />
              </Link>
            </div>

            {/* Right: Capabilities */}
            <div className="px-10 md:px-14 py-12 flex flex-col justify-center gap-8 min-w-0">
              {[
                {
                  label: "Train",
                  desc: "Build neural networks layer by layer in TensorFlow.js and train them in your browser tab. The tab is the whole toolchain — Python never enters it.",
                },
                {
                  label: "Detect",
                  desc: "Classify real-time signal data as normal or anomalous with an autoencoder + LSTM detector ensemble you assemble yourself.",
                },
                {
                  label: "Deploy",
                  desc: "Ship a working model that runs entirely client-side — 60fps inference on an ordinary laptop via WebGL.",
                },
                {
                  label: "Own it",
                  desc: "Solved exercises push to your GitHub — connect once, and every solution lands as a commit (included with any paid theme). Walk into interviews able to explain every layer you built.",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="font-mono text-xs text-primary font-bold tracking-wider mb-2">
                    {item.label}
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FIVE WORLDS (client island — canvas animations) ===== */}
        <FiveWorldsSection />

        {/* ===== FAQ (server-rendered — native <details>, zero JS) =====
            Objection handling before the close. Items single-sourced with
            the sitewide FAQPage JSON-LD via app/faq-data.ts. */}
        <section
          data-testid="landing-faq"
          className="border-b border-border px-10 md:px-20 py-16"
        >
          <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3 flex items-center gap-3">
            <span className="w-[7px] h-[7px] bg-primary inline-block" />
            Before you ask
          </div>
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-8">
            Fair Questions
          </h2>
          <div className="max-w-3xl divide-y divide-border border-y border-border">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="group">
                <summary className="cursor-pointer list-none px-1 py-4 font-mono text-sm font-bold text-text-primary flex items-center justify-between gap-4 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="text-primary shrink-0 group-open:rotate-45 transition-transform font-black"
                  >
                    +
                  </span>
                </summary>
                <p className="px-1 pb-5 text-sm text-text-muted leading-relaxed font-sans max-w-[640px]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ===== FINAL CTA (server-rendered — zero JS) ===== */}
        <section className="px-10 md:px-20 py-20 flex flex-col items-start gap-10">
          <div className="font-mono text-xs text-text-muted tracking-wider">
            // module 1 · free · no account required
          </div>
          <h2 className="text-5xl md:text-6xl font-mono font-black tracking-[-0.045em] leading-[0.95] uppercase">
            Bridge
            <br />
            <span className="text-primary">the gap.</span>
          </h2>
          <p className="text-base text-text-muted max-w-[420px] leading-relaxed font-sans">
            Open the lesson and start reading. If it clicks, the full theme is $
            {PRICING.single.price} once &mdash; no subscription.
          </p>
          <Link
            href="/themes/deep-orbit/foundations/introduction-to-tensors"
            data-testid="landing-cta-final"
            className="rounded-none inline-flex items-center gap-2 px-11 py-[18px] bg-primary text-page font-mono font-bold text-base tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Start Module 1 →
          </Link>
        </section>
      </main>
    </>
  );
}
