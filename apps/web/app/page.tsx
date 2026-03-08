"use client";

import { motion } from "framer-motion";

const themes = [
  {
    name: "Deep Orbit",
    tagline: "Time-Series & Signals",
    status: "launched" as const,
    color: "#7B68EE",
    accent: "#F0C75E",
    model: "DEEP SCAN — Signal Classifier",
  },
  {
    name: "Neon Protocol",
    tagline: "Computer Vision",
    status: "coming-soon" as const,
    color: "#00D4FF",
    accent: "#FF2D7B",
    model: "Protocol Sentinel — Anomaly Detector",
  },
  {
    name: "Signal Ward",
    tagline: "NLP & Text Intelligence",
    status: "coming-soon" as const,
    color: "#2ECC71",
    accent: "#5B8DEF",
    model: "Diagnostic One — Text Assistant",
  },
  {
    name: "Nova Canvas",
    tagline: "Multimodal & GenAI",
    status: "coming-soon" as const,
    color: "#FF6B6B",
    accent: "#A78BFA",
    model: "Nova Canvas AI — Creative Assistant",
  },
  {
    name: "Terra Grid",
    tagline: "Edge AI & MLOps",
    status: "coming-soon" as const,
    color: "#F59E0B",
    accent: "#10B981",
    model: "Terra Grid Intelligence — Edge System",
  },
];

const bridges = [
  { fe: "Array.map() chain", ml: "Neural Network" },
  { fe: "CSS custom properties", ml: "Weights & Biases" },
  { fe: "Lighthouse score", ml: "Loss Function" },
  { fe: "git bisect", ml: "Backpropagation" },
  { fe: "CSS blur() + kernel", ml: "Convolution" },
  { fe: "Promise.all()", ml: "Batch Processing" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const letterAnimation = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function Home() {
  const title = "TENSORCRAFT";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated grid background */}
      <div className="fixed inset-0 grid-pattern opacity-40" />

      {/* Gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[40%] -left-[20%] w-[80vw] h-[80vw] rounded-full animate-gradient opacity-20 blur-[120px]"
          style={{
            background:
              "radial-gradient(ellipse, var(--tc-primary), transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-[30%] -right-[20%] w-[60vw] h-[60vw] rounded-full animate-gradient opacity-15 blur-[100px]"
          style={{
            background:
              "radial-gradient(ellipse, var(--tc-accent), transparent 70%)",
            animationDelay: "-7s",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          {/* Neon line top */}
          <motion.div
            className="neon-line h-px w-32 mb-12"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Title with letter animation */}
          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-[0.2em] neon-text-subtle"
            style={{ color: "var(--tc-primary)" }}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {title.split("").map((letter, i) => (
              <motion.span
                key={i}
                variants={letterAnimation}
                className="inline-block"
              >
                {letter}
              </motion.span>
            ))}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            className="mt-6 text-xl md:text-2xl text-text-muted max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Learn machine learning through{" "}
            <span className="text-text-primary font-medium">
              code you already know
            </span>
          </motion.p>

          <motion.p
            className="mt-3 text-base text-text-muted max-w-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            Interactive, story-driven ML education for frontend engineers.
            Build real models in the browser.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="mt-10 flex gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.6 }}
          >
            <button className="relative group px-8 py-4 rounded-lg bg-primary text-surface font-semibold text-lg transition-all duration-300 hover:scale-105">
              <span className="relative z-10">Start Learning — Free</span>
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 neon-box" />
            </button>
            <button className="px-8 py-4 rounded-lg border border-border text-text-primary font-medium text-lg transition-all duration-300 hover:border-primary hover:text-primary">
              View Curriculum
            </button>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-6 h-10 rounded-full border-2 border-text-muted flex justify-center pt-2"
            >
              <div className="w-1 h-2 rounded-full bg-text-muted" />
            </motion.div>
          </motion.div>
        </section>

        {/* FE Bridge Section */}
        <section className="px-6 py-32 max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
          >
            <p className="text-sm font-mono uppercase tracking-[0.3em] text-accent mb-4">
              The Core Innovation
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Frontend → ML Bridges
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mb-16">
              Every ML concept is introduced through a frontend concept you
              already know. 50+ deep structural mappings, not casual analogies.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {bridges.map((bridge, i) => (
              <motion.div
                key={bridge.fe}
                variants={fadeUp}
                custom={i}
                className="group grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-5 rounded-xl glass border border-border transition-all duration-300 hover:border-primary"
              >
                <div className="text-right">
                  <span className="font-mono text-sm text-accent">
                    {bridge.fe}
                  </span>
                </div>
                <div className="flex items-center justify-center">
                  <motion.div
                    className="w-8 h-px bg-primary"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  />
                  <div
                    className="w-2 h-2 rounded-full mx-1"
                    style={{ backgroundColor: "var(--tc-primary)" }}
                  />
                  <motion.div
                    className="w-8 h-px bg-primary"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  />
                </div>
                <div>
                  <span className="font-semibold text-text-primary">
                    {bridge.ml}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="mt-8 text-center text-text-muted text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
          >
            + 44 more bridges across 5 themes
          </motion.p>
        </section>

        {/* Themes Section */}
        <section className="px-6 py-32 max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            custom={0}
            className="mb-16"
          >
            <p className="text-sm font-mono uppercase tracking-[0.3em] text-accent mb-4">
              5 Complete Courses
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
              Choose Your World
            </h2>
            <p className="text-lg text-text-muted max-w-2xl">
              Each theme is a complete ML education with a unique
              specialization. 11 modules. 55 lessons. ~22 hours. A real model on
              GitHub.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {themes.map((theme, i) => (
              <motion.div
                key={theme.name}
                variants={fadeUp}
                custom={i}
                className={`group relative rounded-2xl p-6 transition-all duration-500 ${
                  i === 0 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
                style={{
                  background: `linear-gradient(135deg, ${theme.color}08, ${theme.accent}05)`,
                  border: `1px ${theme.status === "launched" ? "solid" : "dashed"} ${theme.color}30`,
                }}
                whileHover={{
                  y: -4,
                  borderColor: `${theme.color}60`,
                  transition: { duration: 0.3 },
                }}
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="text-xs font-mono uppercase tracking-wider px-2 py-1 rounded-full"
                    style={{
                      color: theme.color,
                      backgroundColor: `${theme.color}15`,
                    }}
                  >
                    {theme.status === "launched"
                      ? "▶ Available Now"
                      : "◇ Coming Soon"}
                  </div>
                </div>

                {/* Theme name */}
                <h3
                  className="text-2xl font-bold mb-1"
                  style={{ color: theme.color }}
                >
                  {theme.name}
                </h3>
                <p className="text-sm text-text-muted mb-4">{theme.tagline}</p>

                {/* Model */}
                <div className="mt-auto pt-4 border-t border-border">
                  <p className="text-xs font-mono text-text-muted mb-1">
                    You&apos;ll build:
                  </p>
                  <p className="text-sm text-text-primary">{theme.model}</p>
                </div>

                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: `0 0 30px ${theme.color}15, inset 0 0 30px ${theme.color}05`,
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Stats / Social Proof */}
        <section className="px-6 py-24 border-t border-border">
          <motion.div
            className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { value: "50+", label: "FE→ML Bridges" },
              { value: "275", label: "Total Lessons" },
              { value: "5", label: "Themed Worlds" },
              { value: "$79", label: "Per Theme" },
            ].map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i}>
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="text-sm text-text-muted mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA Footer */}
        <section className="px-6 py-32 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
              Ready to bridge the gap?
            </h2>
            <p className="text-lg text-text-muted mb-10 max-w-lg mx-auto">
              Module 1 is free across all themes. No credit card required.
            </p>
            <button className="relative group px-10 py-5 rounded-lg bg-primary text-surface font-semibold text-lg transition-all duration-300 hover:scale-105">
              <span className="relative z-10">Start Deep Orbit — Free</span>
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 neon-box" />
            </button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-border text-center">
          <p className="text-sm text-text-muted">
            Tensorcraft — ML education for frontend engineers
          </p>
        </footer>
      </div>
    </main>
  );
}
