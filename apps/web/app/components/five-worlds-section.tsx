"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useRef, useEffect, useCallback, useState } from "react";
import { themes, themeSlugs } from "@tensorcraft/themes";
import { isLaunched } from "@tensorcraft/shared";

/* ── Theme card data derived from manifests ──────────────── */

const THEME_CARDS = themeSlugs.map((slug, i) => {
  const t = themes[slug];
  return {
    code: String(i + 1).padStart(2, "0"),
    name: t.displayName,
    slug: t.slug,
    spec: t.specialization,
    tagline: t.tagline,
    col: t.palette.primary,
    rgb: hexToRgb(t.palette.primary),
    launched: isLaunched(t.slug),
    // Atmosphere kind keyed off original index so each theme keeps its identity.
    kind: i,
  };
});

const HERO_CARD = THEME_CARDS.find((c) => c.launched) ?? THEME_CARDS[0];
const COMING_SOON_CARDS = THEME_CARDS.filter((c) => !c.launched);

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

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
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="border-b border-border">
      {/* Header */}
      <div className="px-10 md:px-20 pt-16 pb-10">
        <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-3">
          // CHOOSE YOUR WORLD
        </div>
        <h2 className="text-3xl font-mono font-black tracking-tight mb-3">
          Five Worlds
        </h2>
        <p className="text-[15px] text-text-muted leading-relaxed max-w-[520px]">
          Same ML syllabus. Five story universes.{" "}
          <span style={{ color: HERO_CARD.col }}>{HERO_CARD.name}</span>{" "}
          launches today &mdash; the other four ship in waves.
        </p>
      </div>

      {/* Hero card — launched theme */}
      <motion.div
        className="relative overflow-hidden border-t border-border"
        onMouseEnter={() => setHovered(HERO_CARD.slug)}
        onMouseLeave={() => setHovered(null)}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
      >
        <AtmosphereCanvas
          kind={HERO_CARD.kind}
          rgb={HERO_CARD.rgb}
          hovered={hovered === HERO_CARD.slug}
        />
        <Link
          href={`/themes/${HERO_CARD.slug}`}
          className="block relative z-10 px-8 md:px-20 py-14 md:py-20 group"
        >
          <div className="flex items-start justify-between gap-6 mb-6">
            <span
              className="font-mono text-[80px] md:text-[120px] font-black leading-none opacity-15 group-hover:opacity-25 transition-opacity"
              style={{ color: HERO_CARD.col }}
            >
              {HERO_CARD.code}
            </span>
            <span
              className="font-mono text-xs font-bold tracking-wider px-3 py-1"
              style={{
                color: HERO_CARD.col,
                background: `color-mix(in srgb, ${HERO_CARD.col} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${HERO_CARD.col} 35%, transparent)`,
              }}
            >
              LIVE TODAY
            </span>
          </div>
          <div
            className="text-3xl md:text-5xl font-mono font-black tracking-tight mb-3"
            style={{ color: HERO_CARD.col }}
          >
            {HERO_CARD.name}
          </div>
          <div className="font-mono text-sm text-text-muted opacity-70 mb-4">
            {HERO_CARD.spec}
          </div>
          <p className="text-base md:text-lg text-text-muted leading-relaxed max-w-[640px] mb-6">
            {HERO_CARD.tagline}
          </p>
          <span
            className="font-mono text-sm tracking-wider"
            style={{ color: HERO_CARD.col }}
          >
            Start the journey &rarr;
          </span>
        </Link>
      </motion.div>

      {/* Coming-soon themes — muted 2x2 grid */}
      <div className="border-t border-border px-10 md:px-20 pt-10 pb-4">
        <div className="font-mono text-xs text-text-muted tracking-[0.2em] uppercase">
          // Coming next
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-border">
        {COMING_SOON_CARDS.map((t, i) => (
          <motion.div
            key={t.code}
            className="relative overflow-hidden group"
            style={{
              borderRight: i % 2 === 0 ? "1px solid var(--tc-border)" : "none",
              borderBottom:
                i < COMING_SOON_CARDS.length - 2
                  ? "1px solid var(--tc-border)"
                  : "none",
              opacity: 0.78,
            }}
            onMouseEnter={() => setHovered(t.slug)}
            onMouseLeave={() => setHovered(null)}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 0.78, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <AtmosphereCanvas
              kind={t.kind}
              rgb={t.rgb}
              hovered={hovered === t.slug}
            />
            <Link
              href={`/themes/${t.slug}`}
              className="block relative z-10 px-8 md:px-10 py-10"
              data-testid={`coming-soon-card-${t.slug}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="font-mono text-[32px] font-black leading-none opacity-15 group-hover:opacity-25 transition-opacity"
                  style={{ color: t.col }}
                >
                  {t.code}
                </span>
                <span
                  className="font-mono text-[10px] font-bold tracking-wider px-2 py-0.5"
                  style={{
                    color: t.col,
                    background: `color-mix(in srgb, ${t.col} 8%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${t.col} 22%, transparent)`,
                  }}
                >
                  COMING SOON
                </span>
              </div>
              <div
                className="text-[14px] font-bold tracking-tight uppercase mb-1 group-hover:text-text-primary transition-colors"
                style={{ color: "var(--tc-muted)" }}
              >
                {t.name}
              </div>
              <div className="font-mono text-xs text-text-muted opacity-50 mb-3">
                {t.spec}
              </div>
              <p className="text-[12px] text-text-muted leading-relaxed opacity-40 group-hover:opacity-65 transition-opacity mb-4">
                {t.tagline}
              </p>
              <span
                className="font-mono text-xs tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: t.col }}
              >
                Notify me &rarr;
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-10 md:px-20 py-4">
        <p className="font-mono text-xs text-text-muted text-center">
          // Module 1 of {HERO_CARD.name} is free. No account needed.
        </p>
      </div>
    </section>
  );
}
