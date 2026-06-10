import Link from "next/link";
import type { Metadata } from "next";
import { PRICING } from "@tensorcraft/shared";
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

        {/* ===== BRIDGE TICKER — scrolling FE→ML band (client island) ===== */}
        <LandingBridgeTicker />

        {/* ===== HOW IT WORKS LINK ===== */}
        <div className="px-10 md:px-20 py-6 border-b border-border">
          <p className="text-sm text-text-muted font-sans">
            New to ML?{" "}
            <Link
              href="/learn"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              See how it works
            </Link>
          </p>
        </div>

        {/* ===== STATS (server-rendered — zero JS) ===== */}
        <section className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
          {[
            ["55", "Lessons per theme"],
            ["11", "Modules"],
            [`$${PRICING.single.price}`, "One-time, no sub"],
            ["1 / 5", "Themes live (4 coming)"],
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

        {/* ===== BRIDGE SYSTEM (client island — framework picker) ===== */}
        <BridgePreviewSection />

        {/* ===== FIVE WORLDS (client island — canvas animations) ===== */}
        <FiveWorldsSection />

        {/* ===== WHAT YOU'LL BUILD (server-rendered — zero JS) ===== */}
        <section id="how-it-works" className="border-b border-border">
          <div className="px-10 md:px-20 pt-16 pb-12">
            <h2 className="text-3xl font-mono font-black tracking-tight mb-3">
              What You&apos;ll Build
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px] font-sans">
              By Module 11, you&apos;ll have a real-time anomaly detection
              system — trained, tested, and deployed entirely in the browser.
            </p>
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
              {/* Status indicator */}
              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="w-2 h-2 bg-primary inline-block animate-pulse" />
                <span className="text-primary">LIVE</span>
                <span className="text-text-muted">
                  — runs at 60fps in your browser
                </span>
              </div>
            </div>

            {/* Right: Capabilities */}
            <div className="px-10 md:px-14 py-12 flex flex-col justify-center gap-8 min-w-0">
              {[
                {
                  label: "Train",
                  desc: "Build neural networks layer by layer in TensorFlow.js and train them in your browser tab. No Python, no backend, no GPU farm.",
                },
                {
                  label: "Detect",
                  desc: "Classify real-time signal data as normal or anomalous with an autoencoder + LSTM detector ensemble you assemble yourself.",
                },
                {
                  label: "Deploy",
                  desc: "Ship a production-ready model that runs entirely client-side. Inference at 60fps via WebGL acceleration.",
                },
                {
                  label: "Own it",
                  desc: "Every exercise you solve auto-commits to your GitHub. Walk into interviews able to explain every layer you built.",
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

        {/* ===== FINAL CTA (server-rendered — zero JS) ===== */}
        <section className="px-10 md:px-20 py-28 flex flex-col items-start gap-10">
          <div className="font-mono text-xs text-text-muted tracking-wider">
            // module 1 · free · no account required
          </div>
          <h2 className="text-5xl md:text-6xl font-mono font-black tracking-[-0.045em] leading-[0.95] uppercase">
            Bridge
            <br />
            <span className="text-primary">the gap.</span>
          </h2>
          <p className="text-base text-text-muted max-w-[420px] leading-relaxed font-sans">
            Module 1 is free. No account, no card, no setup. Open the lesson and
            start reading.
          </p>
          <Link
            href="/auth"
            data-testid="landing-cta-final"
            className="rounded-none inline-flex items-center gap-2 px-11 py-[18px] bg-primary text-page font-mono font-bold text-base tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-page"
          >
            Start Module 1 →
          </Link>
          <p className="text-sm text-text-muted font-sans mt-6">
            Want a glossary first?{" "}
            <Link
              href="/glossary"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              Browse 50 ML terms with FE bridges
            </Link>
            . Weighing alternatives?{" "}
            <Link
              href="/compare"
              className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
            >
              See how Tensorcraft compares to fast.ai, Karpathy, and Coursera
            </Link>
            .
          </p>
        </section>
      </main>
    </>
  );
}
