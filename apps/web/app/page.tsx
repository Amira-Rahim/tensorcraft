"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Nav } from "./components/nav";

const bridges = [
  {
    fe: "Math.max(0, x)",
    ml: "ReLU Activation",
    desc: "The same function, used in every neural network",
  },
  {
    fe: "Array.map()",
    ml: "Neural Network",
    desc: "Sequential data transformation through layers",
  },
  {
    fe: "CSS blur()",
    ml: "Convolution",
    desc: "Sliding window operations on pixel data",
  },
  {
    fe: "Promise.all()",
    ml: "Batch Processing",
    desc: "Parallel execution with configurable chunk size",
  },
  {
    fe: "addEventListener",
    ml: "Backpropagation",
    desc: "Signals propagating through a layered system",
  },
  {
    fe: "flex-grow",
    ml: "Attention",
    desc: "Proportional weight distribution across elements",
  },
];

const comingSoonThemes = [
  {
    name: "Neon Protocol",
    domain: "Computer Vision",
    hook: "Navigate the neon-lit digital underground as a white-hat hacker, using computer vision to detect intrusions and analyze network anomalies.",
    model: "Protocol Sentinel",
    color: "#00D4FF",
    icon: "\u26A1",
    variant: "neon",
  },
  {
    name: "Signal Ward",
    domain: "NLP & Text Intelligence",
    hook: "Join a cutting-edge hospital team training NLP models to analyze clinical text and assist doctors with early diagnosis.",
    model: "Diagnostic One",
    color: "#2ECC71",
    icon: "\u{1FA79}",
    variant: "signal",
  },
  {
    name: "Nova Canvas",
    domain: "Multimodal & GenAI",
    hook: "Step into a creative AI collective where you train generative models to produce art, style transfers, and multimodal experiences in the browser.",
    model: "Nova Canvas",
    color: "#FF6B6B",
    icon: "\u{1F3A8}",
    variant: "nova",
  },
  {
    name: "Terra Grid",
    domain: "Edge AI & MLOps",
    hook: "Manage a vast industrial grid, training predictive models to prevent equipment failures and optimize energy distribution at the edge.",
    model: "Terra Grid Intelligence",
    color: "#F59E0B",
    icon: "\u2699",
    variant: "terra",
  },
];

const stats = [
  { value: "50+", label: "FE \u2192 ML Bridges" },
  { value: "275", label: "Total Lessons" },
  { value: "5", label: "Themed Worlds" },
  { value: "$79", label: "Per Theme" },
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
      <Nav />

      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden px-6 pt-40 pb-24 text-center">
          {/* Breathing color washes */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div
              className="absolute w-[700px] h-[500px] top-[45%] left-[25%] -translate-x-1/2 -translate-y-1/2 blur-[40px]"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70%, rgba(0,212,255,0.25) 0%, rgba(0,212,255,0.08) 45%, transparent 70%)",
                animation: "breathe-left 10s ease-in-out infinite",
              }}
            />
            <div
              className="absolute w-[700px] h-[500px] top-[50%] left-[75%] -translate-x-1/2 -translate-y-1/2 blur-[40px]"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70%, rgba(123,104,238,0.25) 0%, rgba(123,104,238,0.08) 45%, transparent 70%)",
                animation: "breathe-right 10s ease-in-out infinite",
              }}
            />
          </div>

          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage:
                "radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 50% at 50% 50%, black 20%, transparent 70%)",
            }}
          />

          <div className="relative z-10">
            <motion.div
              className="inline-flex px-5 py-2 rounded-full border border-white/10 text-[13px] text-text-muted tracking-wider mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Interactive &middot; Story-Driven &middot; Browser-Based
            </motion.div>

            <motion.h1
              className="text-5xl md:text-[64px] font-bold leading-[1.1] tracking-tight mb-7"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
            >
              The Bridge from Frontend to ML
              <br />
              Is Shorter Than You Think
            </motion.h1>

            <motion.p
              className="text-lg text-text-muted max-w-[560px] mx-auto mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Components, state, data flow — you already use the building blocks
              of machine learning every day. We just connect the dots.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <Link
                href="/auth/sign-in"
                className="inline-flex items-center rounded-full border border-accent/30 bg-accent/8 px-8 py-3.5 text-base font-medium hover:bg-accent/15 hover:border-accent/50 transition-all"
              >
                Begin Your ML Journey &rarr;
              </Link>
              <p className="text-sm text-text-muted mt-4">
                Module 1 included as preview &middot; No credit card required
              </p>
            </motion.div>
          </div>
        </section>

        {/* ===== PRODUCT PREVIEW ===== */}
        <motion.div
          className="max-w-[900px] mx-auto px-6 -mt-10 relative z-10 mb-24"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="rounded-2xl border border-border bg-surface-raised overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "#FF5F56" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "#FFBD2E" }}
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "#27C93F" }}
              />
              <span className="ml-3 text-[13px] text-text-muted">
                Deep Orbit &mdash; M1L3: Your First Model
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px]">
              <div className="p-7 border-b md:border-b-0 md:border-r border-border text-sm text-text-muted leading-relaxed">
                <div className="text-[15px] font-semibold text-text-primary mb-4">
                  The Signal Arrives
                </div>
                <p className="mb-3">
                  The deep-space array picks up a repeating signal at 1420 MHz.
                  Your task: classify whether this is natural background noise
                  or something worth investigating.
                </p>
                <p className="mb-3">
                  You already know how{" "}
                  <code className="text-accent">Array.map()</code> transforms
                  data through a chain of operations. A neural network does the
                  same thing — each layer transforms the signal, extracting
                  increasingly abstract features.
                </p>
                <p className="text-text-primary font-medium">
                  Let&apos;s build the classifier.
                </p>
              </div>
              <div className="p-6 font-mono text-[13px] text-text-muted leading-relaxed">
                <div className="text-[11px] uppercase tracking-widest text-white/30 mb-4">
                  model.js
                </div>
                <pre className="whitespace-pre-wrap">
                  <span className="text-[#484F58]">
                    {"//"} Your first neural network
                  </span>
                  {"\n"}
                  <span className="text-[#FF7B72]">const</span> model ={" "}
                  <span className="text-[#D2A8FF]">sequential</span>([{"\n"}
                  {"  "}
                  <span className="text-[#D2A8FF]">dense</span>({"{"}{" "}
                  <span className="text-[#A5D6FF]">units</span>:{" "}
                  <span className="text-[#79C0FF]">16</span>,{" "}
                  <span className="text-[#A5D6FF]">activation</span>:{" "}
                  <span className="text-[#A5D6FF]">&apos;relu&apos;</span> {"}"}
                  ),{"\n"}
                  {"  "}
                  <span className="text-[#D2A8FF]">dense</span>({"{"}{" "}
                  <span className="text-[#A5D6FF]">units</span>:{" "}
                  <span className="text-[#79C0FF]">8</span>,{"  "}
                  <span className="text-[#A5D6FF]">activation</span>:{" "}
                  <span className="text-[#A5D6FF]">&apos;relu&apos;</span> {"}"}
                  ),{"\n"}
                  {"  "}
                  <span className="text-[#D2A8FF]">dense</span>({"{"}{" "}
                  <span className="text-[#A5D6FF]">units</span>:{" "}
                  <span className="text-[#79C0FF]">1</span>,{"  "}
                  <span className="text-[#A5D6FF]">activation</span>:{" "}
                  <span className="text-[#A5D6FF]">&apos;sigmoid&apos;</span>{" "}
                  {"}"}),{"\n"}]);{"\n\n"}
                  <span className="text-[#484F58]">
                    {"//"} Like Array.map() — data flows
                  </span>
                  {"\n"}
                  <span className="text-[#484F58]">
                    {"//"} through each layer sequentially
                  </span>
                  {"\n"}
                  <span className="text-[#FF7B72]">const</span> prediction =
                  model{"\n"}
                  {"  "}.<span className="text-[#D2A8FF]">forward</span>
                  (signalData);
                </pre>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== BRIDGES SECTION ===== */}
        <section className="px-6 py-28">
          <div className="max-w-[1200px] mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent max-w-[600px] mx-auto mb-14" />

            <motion.div
              className="text-center mb-14"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={0}
            >
              <p className="text-[13px] text-text-muted uppercase tracking-[0.15em] mb-3">
                The Core Innovation
              </p>
              <h2 className="text-[40px] font-bold mb-4">
                Frontend &rarr; ML Bridges
              </h2>
              <p className="text-lg text-text-muted max-w-[560px] mx-auto">
                Every ML concept maps to something you already know
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
            >
              {bridges.map((bridge, i) => (
                <motion.div
                  key={bridge.fe}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-xl border border-border bg-surface-raised p-7 hover:border-accent/15 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="inline-block font-mono text-[13px] bg-accent/8 border border-accent/15 rounded-md px-3 py-1 text-accent mb-3">
                    {bridge.fe}
                  </div>
                  <div className="text-text-muted my-3">&darr;</div>
                  <div className="text-base font-semibold mb-1">
                    {bridge.ml}
                  </div>
                  <div className="text-sm text-text-muted leading-relaxed">
                    {bridge.desc}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ===== THEMES SECTION ===== */}
        <section id="themes" className="px-6 py-28">
          <div className="max-w-[1200px] mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent max-w-[600px] mx-auto mb-14" />

            <motion.div
              className="text-center mb-14"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={0}
            >
              <p className="text-[13px] text-text-muted uppercase tracking-[0.15em] mb-3">
                Five Themed Worlds
              </p>
              <h2 className="text-[40px] font-bold mb-4">Choose Your Story</h2>
              <p className="text-lg text-text-muted max-w-[560px] mx-auto">
                Each theme is a complete ML education — same core curriculum,
                unique narrative and specialization
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Featured: Deep Orbit */}
              <motion.div
                className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 rounded-2xl border border-[#7B68EE]/20 bg-surface-raised overflow-hidden hover:border-[#7B68EE]/40 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
              >
                {/* Art / Code mockup */}
                <div
                  className="relative min-h-[320px] flex items-center justify-center p-10"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 60% at 30% 70%, rgba(123,104,238,0.15), transparent), radial-gradient(ellipse 50% 40% at 70% 30%, rgba(240,199,94,0.08), transparent), var(--tc-surface)",
                  }}
                >
                  <div className="w-full max-w-[360px] rounded-[10px] border border-[#7B68EE]/15 bg-[rgba(11,13,26,0.8)] overflow-hidden">
                    <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/6">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#FF5F56" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#FFBD2E" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: "#27C93F" }}
                      />
                    </div>
                    <div className="p-4 font-mono text-xs text-text-muted leading-relaxed">
                      <span className="text-[#FF7B72]">const</span> signal ={" "}
                      <span className="text-[#D2A8FF]">classify</span>(
                      <br />
                      &nbsp;&nbsp;fftData,
                      <br />
                      &nbsp;&nbsp;{"{"}{" "}
                      <span className="text-[#A5D6FF]">layers</span>: [
                      <span className="text-[#79C0FF]">16</span>,{" "}
                      <span className="text-[#79C0FF]">8</span>,{" "}
                      <span className="text-[#79C0FF]">1</span>] {"}"}
                      <br />
                      );
                      <br />
                      <br />
                      <span className="text-[#484F58]">
                        {"// Like Array.map() — each layer"}
                      </span>
                      <br />
                      <span className="text-[#484F58]">
                        {"// transforms the signal forward"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-12 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#2ECC71]/10 text-[#2ECC71] border border-[#2ECC71]/20 w-fit mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2ECC71]" />
                    Available Now
                  </div>
                  <h3 className="text-[32px] font-bold text-[#7B68EE] mb-1">
                    Deep Orbit
                  </h3>
                  <p className="text-sm text-text-muted uppercase tracking-widest mb-4">
                    Time-Series &amp; Signal Processing
                  </p>
                  <p className="text-base text-white/70 leading-relaxed mb-5">
                    Aboard the deep-space research vessel <em>Archimedes</em>,
                    decode mysterious cosmic signals using FFT, neural networks,
                    and browser-based ML. Every lesson is a mission. Every
                    concept has a frontend bridge.
                  </p>
                  <div className="flex gap-6 mb-6 text-[13px] text-text-muted">
                    <span>
                      <strong className="text-text-primary">11</strong> Modules
                    </span>
                    <span>
                      <strong className="text-text-primary">55</strong> Lessons
                    </span>
                    <span>
                      <strong className="text-text-primary">26</strong> FE
                      Bridges
                    </span>
                  </div>
                  <p className="text-[13px] text-text-muted mb-7">
                    Meet Commander Okafor, Dr. Sato, Chief Torres, Ensign Park
                    &amp; ARIA
                  </p>
                  <Link
                    href="/themes/deep-orbit"
                    className="inline-flex items-center gap-2 rounded-full bg-[#7B68EE] text-white px-7 py-3.5 text-[15px] font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all w-fit"
                  >
                    Start Deep Orbit &rarr;
                  </Link>
                  <p className="text-sm text-text-muted mt-3">
                    <strong className="text-text-primary text-lg">$79</strong>{" "}
                    &middot; Module 1 included as preview
                  </p>
                </div>
              </motion.div>

              {/* Coming Soon Cards */}
              {comingSoonThemes.map((theme, i) => (
                <motion.div
                  key={theme.name}
                  className={`rounded-2xl border border-border bg-surface-raised overflow-hidden hover:-translate-y-0.5 transition-all duration-300 hover:border-[${theme.color}]/20`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i + 1}
                >
                  <div
                    className="h-[100px] relative flex items-center justify-center"
                    style={{
                      background: `radial-gradient(ellipse at 50% 80%, ${theme.color}1F, transparent 70%), var(--tc-surface)`,
                    }}
                  >
                    <span className="text-[32px] relative z-10">
                      {theme.icon}
                    </span>
                  </div>
                  <div className="p-6 pb-7">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-white/5 text-text-muted border border-white/8 mb-3.5">
                      Coming Soon
                    </div>
                    <h3
                      className="text-[22px] font-bold mb-0.5"
                      style={{ color: theme.color }}
                    >
                      {theme.name}
                    </h3>
                    <p className="text-xs text-text-muted uppercase tracking-widest mb-3">
                      {theme.domain}
                    </p>
                    <p className="text-sm text-white/55 leading-relaxed mb-4">
                      {theme.hook}
                    </p>
                    <p className="font-mono text-xs text-text-muted mb-3">
                      You&apos;ll build:{" "}
                      <span className="text-white/70">{theme.model}</span>
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">
                        11 Modules &middot; 55 Lessons
                      </span>
                      <span className="text-base font-semibold">$79</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== STATS ===== */}
        <section className="border-t border-b border-border px-6 py-20">
          <motion.div
            className="max-w-[900px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i}>
                <div className="text-5xl font-bold">{stat.value}</div>
                <div className="text-sm text-text-muted mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ===== CTA FOOTER ===== */}
        <section
          className="px-6 py-28 text-center relative"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,212,255,0.12), transparent 60%), radial-gradient(ellipse 40% 30% at 50% 0%, rgba(0,212,255,0.08), transparent 50%), radial-gradient(ellipse 100% 60% at 50% -20%, rgba(123,104,238,0.06), transparent 60%)",
          }}
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-[32px] font-bold mb-4">
              Your frontend skills are the foundation.
            </h2>
            <p className="text-lg text-text-muted mb-10">
              Add machine learning to your engineering toolkit.
            </p>
            <Link
              href="/themes/deep-orbit"
              className="inline-flex items-center rounded-full border border-accent/30 bg-accent/8 px-9 py-4 text-[17px] font-medium hover:bg-accent/15 hover:border-accent/50 transition-all"
            >
              Explore Deep Orbit &rarr;
            </Link>
            <p className="text-sm text-text-muted mt-5">
              Join 2,400+ frontend engineers already learning
            </p>
          </motion.div>
        </section>
      </main>
    </>
  );
}
