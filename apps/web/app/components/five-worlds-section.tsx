"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useEffect, useCallback, useState } from "react";

/* ── Theme data ─────────────────────────────────────────── */

const HERO = {
  code: "01",
  name: "Deep Orbit",
  spec: "RNN / LSTM / Signals",
  tagline:
    "Detect anomalies in deep-space telemetry aboard the research vessel Archimedes.",
  modules: "11 modules · 55 lessons · ~22h",
  price: "$79",
  col: "var(--tc-primary, #6BAA8A)",
  rgb: [107, 170, 138] as [number, number, number],
};

const COMING = [
  {
    code: "02",
    name: "Neon Protocol",
    spec: "CNN / Computer Vision",
    tagline: "Hunt rogue surveillance in a cyberpunk city.",
    status: "Q4 '26",
    col: "#A07090",
    rgb: [160, 112, 144] as [number, number, number],
  },
  {
    code: "03",
    name: "Signal Ward",
    spec: "NLP / Transformers",
    tagline: "Build a clinical NLP assistant under pressure.",
    status: "Q1 '27",
    col: "#A89060",
    rgb: [168, 144, 96] as [number, number, number],
  },
  {
    code: "04",
    name: "Nova Canvas",
    spec: "GAN / Diffusion",
    tagline: "Create generative art for a digital biennale.",
    status: "Q2 '27",
    col: "#7868A8",
    rgb: [120, 104, 168] as [number, number, number],
  },
  {
    code: "05",
    name: "Terra Grid",
    spec: "Edge AI / MLOps",
    tagline: "Monitor infrastructure at the network edge.",
    status: "Q3 '27",
    col: "#907040",
    rgb: [144, 112, 64] as [number, number, number],
  },
];

/* ── Transparent canvas overlay ─────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  life: number;
  maxLife: number;
}

function spawn(w: number, h: number, kind: number): Particle {
  const life = 250 + Math.random() * 350;
  const base = { life, maxLife: life };
  switch (kind) {
    case 0: // Deep Orbit — drifting stars
      return {
        ...base,
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.3,
        r: Math.random() < 0.2 ? 2.2 : 1.0,
        alpha: 0.35 + Math.random() * 0.5,
      };
    case 1: // Neon Protocol — horizontal scan streaks
      return {
        ...base,
        x: -5,
        y: Math.random() * h,
        vx: 0.5 + Math.random() * 1.5,
        vy: 0,
        r: 0.8,
        alpha: 0.25 + Math.random() * 0.4,
      };
    case 2: // Signal Ward — rising pulses
      return {
        ...base,
        x: Math.random() * w,
        y: h + 5,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.25 - Math.random() * 0.45,
        r: 1.1,
        alpha: 0.3 + Math.random() * 0.4,
      };
    case 3: // Nova Canvas — slow spiral
      return {
        ...base,
        x: w / 2 + (Math.random() - 0.5) * w,
        y: h / 2 + (Math.random() - 0.5) * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 0.6 + Math.random() * 1.8,
        alpha: 0.25 + Math.random() * 0.45,
      };
    default: // Terra Grid — falling data
      return {
        ...base,
        x: Math.random() * w,
        y: -5,
        vx: 0,
        vy: 0.2 + Math.random() * 0.4,
        r: 0.8,
        alpha: 0.2 + Math.random() * 0.35,
      };
  }
}

function AtmosphereCanvas({
  kind,
  rgb,
  hovered,
}: {
  kind: number;
  rgb: [number, number, number];
  hovered: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef(0);
  const hovRef = useRef(hovered);
  hovRef.current = hovered;

  const draw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    const hot = hovRef.current;

    // Fully transparent clear — canvas sits over page bg
    ctx.clearRect(0, 0, w, h);

    const [r, g, b] = rgb;
    const ps = particles.current;

    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.x += p.vx * (hot ? 1.6 : 1);
      p.y += p.vy * (hot ? 1.6 : 1);
      p.life--;

      // Nova spiral
      if (kind === 3) {
        const cx = w / 2,
          cy = h / 2;
        const dx = p.x - cx,
          dy = p.y - cy;
        const a = 0.003;
        p.x = cx + dx * Math.cos(a) - dy * Math.sin(a);
        p.y = cy + dx * Math.sin(a) + dy * Math.cos(a);
      }

      const lr = p.life / p.maxLife;
      const fade = lr > 0.8 ? (1 - lr) * 5 : lr > 0.2 ? 1 : lr * 5;
      const alpha = p.alpha * fade * (hot ? 2.5 : 1.4);

      if (
        p.life <= 0 ||
        p.x < -10 ||
        p.x > w + 10 ||
        p.y < -10 ||
        p.y > h + 10
      ) {
        ps[i] = spawn(w, h, kind);
        continue;
      }

      // Neon Protocol — streaks
      if (kind === 1) {
        ctx.beginPath();
        ctx.moveTo(p.x - 6, p.y);
        ctx.lineTo(p.x + 6, p.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      // Glow halo
      if (p.r > 1) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * (hot ? 0.2 : 0.1)})`;
        ctx.fill();
      }
    }

    // Signal Ward — EKG line
    if (kind === 2) {
      const t = Date.now() * 0.002;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(${r},${g},${b},${hot ? 0.3 : 0.15})`;
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 2) {
        const blip =
          Math.sin((x * 0.05 + t) * 4) *
          Math.exp(-((((x + t * 40) % 120) - 60) ** 2) / 200);
        const y = h * 0.45 + blip * (hot ? 28 : 14);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Terra Grid — faint grid lines
    if (kind === 4) {
      ctx.strokeStyle = `rgba(${r},${g},${b},${hot ? 0.08 : 0.04})`;
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    frame.current = requestAnimationFrame(draw);
  }, [rgb, kind]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const resize = () => {
      const rect = c.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      particles.current = Array.from({ length: 55 }, () =>
        spawn(c.width, c.height, kind),
      );
    };

    resize();
    frame.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", resize);
    };
  }, [draw, kind]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

/* ── Main section ──────────────────────────────────────── */

export function FiveWorldsSection() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="border-b border-border">
      {/* Header — left-aligned, matches other sections */}
      <div className="px-10 md:px-20 pt-16 pb-10">
        <div className="font-mono text-[9px] text-primary tracking-[0.2em] uppercase mb-3">
          // CHOOSE YOUR WORLD
        </div>
        <h2 className="text-3xl font-mono font-black tracking-tight mb-3">
          Five Worlds
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[480px]">
          Same ML syllabus. Five story universes. Each one makes the problem
          feel real.
        </p>
      </div>

      {/* Deep Orbit — featured row with canvas atmosphere */}
      <div
        className="border-t border-border relative overflow-hidden"
        onMouseEnter={() => setHovered(0)}
        onMouseLeave={() => setHovered(null)}
      >
        <AtmosphereCanvas kind={0} rgb={HERO.rgb} hovered={hovered === 0} />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_340px]">
          {/* Left — content */}
          <div className="px-10 md:px-20 py-10 md:border-r border-border">
            <div className="flex items-center gap-4 mb-5">
              <span className="font-mono text-[56px] font-black leading-none text-primary opacity-20">
                {HERO.code}
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold tracking-tight uppercase text-text-primary">
                    {HERO.name}
                  </h3>
                  <span className="font-mono text-[9px] font-bold tracking-wider px-2 py-0.5 text-primary bg-primary/10 border border-primary/25">
                    LIVE
                  </span>
                </div>
                <div className="font-mono text-[11px] text-text-muted mt-0.5">
                  {HERO.spec}
                </div>
              </div>
            </div>
            <p className="text-[14px] text-text-muted leading-relaxed max-w-md mb-6">
              {HERO.tagline}
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/themes/deep-orbit"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-surface font-bold text-xs font-mono tracking-wider uppercase border-2 border-primary hover:bg-transparent hover:text-primary transition-all brutalist-hover brutalist-shadow"
              >
                Start Deep Orbit →
              </Link>
              <span className="font-mono text-base font-black text-primary">
                {HERO.price}
              </span>
              <span className="font-mono text-[10px] text-text-muted">
                one-time
              </span>
            </div>
            <div className="font-mono text-[10px] text-text-muted mt-5">
              {HERO.modules}
            </div>
          </div>

          {/* Right — terminal */}
          <div className="hidden md:block">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-[7px] h-[7px] rounded-full bg-[#ff5f57] opacity-50" />
                <div className="w-[7px] h-[7px] rounded-full bg-[#febc2e] opacity-50" />
                <div className="w-[7px] h-[7px] rounded-full bg-[#28c840] opacity-50" />
              </div>
              <span className="font-mono text-[9px] text-text-muted tracking-wider ml-2">
                deep-scan.ts
              </span>
            </div>
            <div className="p-5 font-mono text-[11px] leading-[1.8]">
              <div className="text-text-muted opacity-30">
                {"// anomaly detection — your capstone"}
              </div>
              <div className="mt-2">
                <span className="text-[#c586c0]">import</span>
                <span className="text-text-muted">{" { "}</span>
                <span className="text-[#9cdcfe]">sequential</span>
                <span className="text-text-muted">{", "}</span>
                <span className="text-[#9cdcfe]">layers</span>
                <span className="text-text-muted">{" } "}</span>
                <span className="text-[#c586c0]">from</span>
                <span className="text-[#ce9178]">
                  {" "}
                  &apos;@tensorflow/tfjs&apos;
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[#c586c0]">const</span>
                <span className="text-[#4fc1ff]"> model</span>
                <span className="text-text-muted"> = </span>
                <span className="text-[#dcdcaa]">sequential</span>
                <span className="text-text-muted">({"{"}</span>
              </div>
              <div className="pl-4">
                <span className="text-[#9cdcfe]">layers</span>
                <span className="text-text-muted">{": ["}</span>
              </div>
              <div className="pl-8">
                <span className="text-[#9cdcfe]">layers</span>
                <span className="text-text-muted">.</span>
                <span className="text-[#dcdcaa]">lstm</span>
                <span className="text-text-muted">{"({ "}</span>
                <span className="text-[#9cdcfe]">units</span>
                <span className="text-text-muted">{": "}</span>
                <span className="text-[#b5cea8]">64</span>
                <span className="text-text-muted">{" }),"}</span>
              </div>
              <div className="pl-8">
                <span className="text-[#9cdcfe]">layers</span>
                <span className="text-text-muted">.</span>
                <span className="text-[#dcdcaa]">dense</span>
                <span className="text-text-muted">{"({ "}</span>
                <span className="text-[#9cdcfe]">units</span>
                <span className="text-text-muted">{": "}</span>
                <span className="text-[#b5cea8]">1</span>
                <span className="text-text-muted">{" }),"}</span>
              </div>
              <div className="pl-4">
                <span className="text-text-muted">{"]"}</span>
              </div>
              <div>
                <span className="text-text-muted">{"});"}</span>
              </div>
              <div className="mt-3 text-text-muted opacity-30">
                {"// "}
                <span className="text-primary">{"▸ DEEP SCAN online"}</span>
                <span
                  className="inline-block w-[6px] h-[14px] ml-0.5 align-middle bg-primary"
                  style={{ animation: "blink 1.1s step-end infinite" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming soon — 4 columns with per-card canvas atmospheres */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border">
        {COMING.map((t, i) => (
          <motion.div
            key={t.code}
            className="relative overflow-hidden px-8 md:px-10 py-10 group cursor-default"
            style={{
              borderRight: i < 3 ? "1px solid var(--tc-border)" : "none",
            }}
            onMouseEnter={() => setHovered(i + 1)}
            onMouseLeave={() => setHovered(null)}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            {/* Canvas — transparent, sits behind content */}
            <AtmosphereCanvas
              kind={i + 1}
              rgb={t.rgb}
              hovered={hovered === i + 1}
            />

            {/* Content — on top */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span
                  className="font-mono text-[32px] font-black leading-none opacity-15 group-hover:opacity-30 transition-opacity"
                  style={{ color: t.col }}
                >
                  {t.code}
                </span>
                <span
                  className="font-mono text-[9px] tracking-wider px-2 py-0.5"
                  style={{
                    color: t.col,
                    border: `1px solid color-mix(in srgb, ${t.col} 20%, transparent)`,
                    opacity: 0.6,
                  }}
                >
                  {t.status}
                </span>
              </div>
              <div
                className="text-[14px] font-bold tracking-tight uppercase mb-1 group-hover:text-text-primary transition-colors"
                style={{ color: "var(--tc-muted)" }}
              >
                {t.name}
              </div>
              <div className="font-mono text-[10px] text-text-muted opacity-50 mb-3">
                {t.spec}
              </div>
              <p className="text-[12px] text-text-muted leading-relaxed opacity-40 group-hover:opacity-65 transition-opacity">
                {t.tagline}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-10 md:px-20 py-4">
        <p className="font-mono text-[10px] text-text-muted text-center">
          // Module 1 is free. No account needed. Others coming — join
          waitlists.
        </p>
      </div>
    </section>
  );
}
