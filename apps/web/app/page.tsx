"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AmbientBackground } from "./components/ambient-background";
import { BridgePreviewSection } from "./components/bridge-preview-section";

const themes = [
  {
    code: "01",
    name: "Deep Orbit",
    spec: "RNN / LSTM / Signals",
    status: "LIVE",
    price: "$79",
    col: "var(--tc-primary, #6BAA8A)",
    live: true,
  },
  {
    code: "02",
    name: "Neon Protocol",
    spec: "CNN / Computer Vision",
    status: "Q4 '26",
    col: "#A07090",
    live: false,
  },
  {
    code: "03",
    name: "Signal Ward",
    spec: "NLP / Transformers",
    status: "Q1 '27",
    col: "#A89060",
    live: false,
  },
  {
    code: "04",
    name: "Nova Canvas",
    spec: "GAN / Diffusion",
    status: "Q2 '27",
    col: "#7868A8",
    live: false,
  },
  {
    code: "05",
    name: "Terra Grid",
    spec: "Edge AI / MLOps",
    status: "Q3 '27",
    col: "#907040",
    live: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function Home() {
  return (
    <>
      <main className="relative z-2">
        {/* ===== HERO ===== */}
        <section className="min-h-screen flex items-center px-10 md:px-20 pt-24 pb-28 border-b border-border relative overflow-hidden">
          <AmbientBackground count={260} />
          <div className="absolute inset-0 grid-bg pointer-events-none z-1" />
          <motion.div
            className="max-w-[620px] w-full relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
          >
            <div className="font-mono text-[11px] text-primary tracking-[0.14em] uppercase mb-9 flex items-center gap-3">
              <span className="inline-block w-[7px] h-[7px] bg-primary" />
              Deep Orbit is live · Launch cohort open
            </div>

            <h1 className="text-5xl md:text-6xl font-mono font-black leading-[0.93] tracking-[-0.045em] mb-10 uppercase">
              <span className="block">
                Machine <span className="text-primary">Learning</span>
              </span>
              <span className="block">for Frontend</span>
              <span className="block">
                Devs, <span className="text-primary">Finally.</span>
              </span>
            </h1>

            <p className="text-lg text-text-muted max-w-[480px] mb-12 leading-relaxed">
              Every ML concept mapped to a frontend analogy you already know.
              Eleven modules. Fifty-five lessons. One real model — built
              entirely in JavaScript.
            </p>

            <div className="flex gap-4 flex-wrap mb-14">
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-surface font-bold text-sm tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
              >
                Start Module 1 — Free →
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-border text-text-primary font-bold text-sm tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all brutalist-hover"
              >
                See what you&apos;ll build
              </Link>
            </div>

            <p className="font-mono text-xs text-text-muted">
              No credit card. No account for module 1. No Python.
            </p>
          </motion.div>
        </section>

        {/* ===== STATS ===== */}
        <section className="grid grid-cols-2 md:grid-cols-4 border-b border-border">
          {[
            ["55", "Lessons per theme"],
            ["11", "Modules"],
            ["$79", "One-time, no sub"],
            ["5", "Themes total"],
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

        {/* ===== BRIDGE SYSTEM ===== */}
        <BridgePreviewSection />

        {/* ===== THEMES ===== */}
        <section className="border-b border-border">
          <div className="px-10 md:px-20 pt-16 pb-12">
            <h2 className="text-3xl font-mono font-black tracking-tight mb-3">
              Five Worlds
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px] mb-12">
              Same syllabus, different story universe. Each theme immerses you
              in a world where the ML problem feels inevitable.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 border-t border-border">
            {themes.map((t, i) => (
              <div
                key={i}
                className="px-9 pt-10 pb-12 transition-colors"
                style={{
                  borderRight: i < 4 ? "1px solid var(--tc-border)" : "none",
                }}
              >
                <div
                  className="font-mono text-[28px] font-black mb-5 leading-none"
                  style={{
                    color: t.col,
                    opacity: t.live ? 1 : 0.35,
                  }}
                >
                  {t.code}
                </div>
                <div
                  className="text-[15px] font-bold tracking-tight mb-2 uppercase"
                  style={{
                    color: t.live ? "var(--tc-text)" : "var(--tc-muted)",
                  }}
                >
                  {t.name}
                </div>
                <div className="font-mono text-[11px] text-text-muted leading-relaxed mb-6">
                  {t.spec}
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="font-mono text-[10px] font-bold tracking-wider px-2.5 py-1"
                    style={{
                      color: t.live ? "var(--tc-primary)" : "var(--tc-muted)",
                      border: t.live
                        ? "1px solid color-mix(in srgb, var(--tc-primary) 35%, transparent)"
                        : "1px solid var(--tc-border)",
                    }}
                  >
                    {t.status}
                  </span>
                  {t.price && (
                    <span className="font-mono text-sm font-black text-primary">
                      {t.price}
                    </span>
                  )}
                </div>
                {t.live && (
                  <div className="absolute top-4 right-4 w-[7px] h-[7px] bg-primary" />
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-border px-10 md:px-20 py-8 flex flex-wrap justify-between items-center gap-4">
            <p className="font-mono text-xs text-text-muted">
              // Deep Orbit is live now. Others are coming — join waitlists.
            </p>
            <Link
              href="/themes/deep-orbit"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-surface font-bold text-sm font-mono tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
            >
              Enrol in Deep Orbit →
            </Link>
          </div>
        </section>

        {/* ===== WHAT YOU'LL BUILD ===== */}
        <section id="how-it-works" className="border-b border-border">
          <div className="px-10 md:px-20 pt-16 pb-12">
            <h2 className="text-3xl font-mono font-black tracking-tight mb-3">
              What You&apos;ll Build
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px]">
              By Module 11, you&apos;ll have a real-time anomaly detection
              system — trained, tested, and deployed entirely in the browser.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] border-t border-border">
            {/* Left: Project showcase */}
            <div className="px-10 md:px-14 py-12 border-b md:border-b-0 md:border-r border-border">
              <div className="font-mono text-[9px] text-primary tracking-[0.15em] mb-6">
                // DEEP SCAN — ANOMALY DETECTOR
              </div>
              {/* Code mockup */}
              <div className="bg-code-bg border border-border p-5 mb-6">
                <div className="font-mono text-[10px] text-text-muted mb-3 flex items-center gap-2">
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
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="w-2 h-2 bg-primary inline-block animate-pulse" />
                <span className="text-primary">LIVE</span>
                <span className="text-text-muted">
                  — runs at 60fps in your browser
                </span>
              </div>
            </div>

            {/* Right: Capabilities */}
            <div className="px-10 md:px-14 py-12 flex flex-col justify-center gap-8">
              {[
                {
                  label: "Train",
                  desc: "Build and train a neural network from scratch using TensorFlow.js. No Python, no backend, no GPU required.",
                },
                {
                  label: "Detect",
                  desc: "Classify real-time signal data as normal or anomalous using your own trained LSTM autoencoder.",
                },
                {
                  label: "Deploy",
                  desc: "Ship a production-ready model that runs entirely client-side. Inference at 60fps via WebGL acceleration.",
                },
                {
                  label: "Own it",
                  desc: "Every line of code is yours. Auto-commit to GitHub. Add it to your portfolio. Show it in interviews.",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="font-mono text-[11px] text-primary font-bold tracking-wider mb-2">
                    {item.label}
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FINAL CTA ===== */}
        <section className="px-10 md:px-20 py-28 flex flex-col items-start gap-10">
          <div className="font-mono text-[11px] text-text-muted tracking-wider">
            // module 1 · free · no account required
          </div>
          <h2 className="text-5xl md:text-6xl font-mono font-black tracking-[-0.045em] leading-[0.95] uppercase">
            Bridge
            <br />
            <span className="text-primary">the gap.</span>
          </h2>
          <p className="text-base text-text-muted max-w-[420px] leading-relaxed">
            Module 1 is completely free. No account, no card, no setup. Just
            open the lesson and start reading.
          </p>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center gap-2 px-11 py-[18px] bg-primary text-surface font-bold text-base tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
          >
            Start learning now →
          </Link>
        </section>
      </main>
    </>
  );
}
