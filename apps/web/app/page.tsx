"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AmbientBackground } from "./components/ambient-background";

const bridges = [
  {
    fe: "useState()",
    ml: "Model Weights",
    tier: "Structural",
    col: "var(--tc-tier-structural, #7096B0)",
    eq: "w ∈ ℝⁿ",
  },
  {
    fe: "Event propagation",
    ml: "Forward Pass",
    tier: "Structural",
    col: "var(--tc-tier-structural, #7096B0)",
    eq: "ŷ = f(Wx+b)",
  },
  {
    fe: "Event bubbling",
    ml: "Backpropagation",
    tier: "Structural",
    col: "var(--tc-tier-structural, #7096B0)",
    eq: "∂L/∂w",
  },
  {
    fe: "React diff algo",
    ml: "Loss Function",
    tier: "Identity",
    col: "var(--tc-tier-identity, #6BAA8A)",
    eq: "L = Σ(y−ŷ)²",
  },
  {
    fe: "transition-duration",
    ml: "Learning Rate η",
    tier: "Intuition",
    col: "var(--tc-tier-intuition, #A89060)",
    eq: "η = 0.01",
  },
  {
    fe: "Re-render cycle",
    ml: "Training Epoch",
    tier: "Structural",
    col: "var(--tc-tier-structural, #7096B0)",
    eq: "T = {1..N}",
  },
  {
    fe: "Array.map()",
    ml: "Tensor Operation",
    tier: "Identity",
    col: "var(--tc-tier-identity, #6BAA8A)",
    eq: "T: ℝⁿ→ℝᵐ",
  },
  {
    fe: "CSS clamp()",
    ml: "Activation σ(x)",
    tier: "Intuition",
    col: "var(--tc-tier-intuition, #A89060)",
    eq: "σ(x)∈[0,1]",
  },
];

const tierCol: Record<string, string> = {
  Identity: "var(--tc-tier-identity, #6BAA8A)",
  Structural: "var(--tc-tier-structural, #7096B0)",
  Intuition: "var(--tc-tier-intuition, #A89060)",
};

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

const loop5C = [
  {
    id: "C1",
    name: "Context",
    desc: "Mission briefing from ARIA. You learn what problem the station is facing today, grounding the ML concept in a concrete narrative.",
    sym: "📰",
  },
  {
    id: "C2",
    name: "Concept",
    desc: "The bridge is revealed. Your existing frontend mental model maps directly to an ML concept — no prior ML knowledge required.",
    sym: "⇄",
  },
  {
    id: "C3",
    name: "Code",
    desc: "You write real TensorFlow.js in the browser. Not pseudocode — a real model you can run. The IDE checks your work automatically.",
    sym: "{}",
  },
  {
    id: "C4",
    name: "Check",
    desc: "A short checkpoint quiz gates your progress. You must pass to continue. Hints are available but each one costs 10 points.",
    sym: "✓",
  },
  {
    id: "C5",
    name: "Connect",
    desc: "The bridge is revisited. You preview the next lesson. Your DEEP SCAN signal classifier advances one detection stage.",
    sym: "→",
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
                See how it works
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
        <section className="border-b border-border">
          <div className="px-10 md:px-20 pt-16 pb-10">
            <div className="flex items-baseline gap-6 mb-2 flex-wrap">
              <h2 className="text-3xl font-mono font-black tracking-tight">
                The Bridge System
              </h2>
              <div className="flex gap-5 ml-auto">
                {Object.entries(tierCol).map(([tier, col]) => (
                  <span
                    key={tier}
                    className="font-mono text-[11px] flex items-center gap-1.5 text-text-muted"
                  >
                    <span
                      className="w-2 h-2 inline-block"
                      style={{ background: col }}
                    />
                    {tier}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-[560px] mb-10">
              You already understand machine learning — you just don&apos;t have
              the vocabulary yet. Every concept below maps directly to your
              existing work.
            </p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_140px_140px] border-t border-b border-border bg-surface-raised">
            {["Frontend concept", "ML equivalent", "Tier", "Formula"].map(
              (h, i) => (
                <div
                  key={h}
                  className="px-6 py-3.5 font-mono text-[10px] font-bold text-text-muted tracking-wider uppercase"
                  style={{
                    borderRight: i < 3 ? "1px solid var(--tc-border)" : "none",
                  }}
                >
                  {h}
                </div>
              ),
            )}
          </div>

          {/* Table rows */}
          {bridges.map((b, i) => (
            <motion.div
              key={i}
              className="grid grid-cols-[1fr_1fr_140px_140px] border-b border-border hover:bg-primary/[0.04] transition-colors cursor-pointer"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.5}
            >
              <div
                className="px-6 py-5 text-sm font-semibold text-text-primary font-mono"
                style={{
                  borderRight: "1px solid var(--tc-border)",
                }}
              >
                {b.fe}
              </div>
              <div
                className="px-6 py-5 text-sm text-text-muted font-mono"
                style={{
                  borderRight: "1px solid var(--tc-border)",
                }}
              >
                {b.ml}
              </div>
              <div
                className="px-6 py-5 flex items-center"
                style={{
                  borderRight: "1px solid var(--tc-border)",
                }}
              >
                <span
                  className="font-mono text-[10px] font-bold tracking-wider"
                  style={{ color: tierCol[b.tier] }}
                >
                  {b.tier}
                </span>
              </div>
              <div className="px-6 py-5 font-mono text-xs text-primary opacity-50 flex items-center">
                {b.eq}
              </div>
            </motion.div>
          ))}
        </section>

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

        {/* ===== 5C LOOP ===== */}
        <section id="how-it-works" className="border-b border-border">
          <div className="px-10 md:px-20 pt-16 pb-12">
            <h2 className="text-3xl font-mono font-black tracking-tight mb-3">
              The 5C Learning Loop
            </h2>
            <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px]">
              Every lesson follows the same five-step structure. You always know
              where you are and what comes next.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 border-t border-border">
            {loop5C.map((s, i) => (
              <div
                key={i}
                className="px-9 pt-12 pb-14"
                style={{
                  borderRight: i < 4 ? "1px solid var(--tc-border)" : "none",
                }}
              >
                <div className="text-[28px] mb-5 leading-none">{s.sym}</div>
                <div className="font-mono text-[11px] text-primary font-bold tracking-wider mb-3">
                  {s.id} — {s.name}
                </div>
                <p className="text-sm text-text-muted leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
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
