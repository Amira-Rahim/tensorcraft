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
    case 0: // Deep Orbit: drifting stars
      return {
        ...base,
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.15 - Math.random() * 0.3,
        r: Math.random() < 0.2 ? 2.2 : 1.0,
        alpha: 0.35 + Math.random() * 0.5,
      };
    case 1: // Neon Protocol: horizontal scan streaks
      return {
        ...base,
        x: -5,
        y: Math.random() * h,
        vx: 0.5 + Math.random() * 1.5,
        vy: 0,
        r: 0.8,
        alpha: 0.25 + Math.random() * 0.4,
      };
    case 2: // Signal Ward: rising pulses
      return {
        ...base,
        x: Math.random() * w,
        y: h + 5,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.25 - Math.random() * 0.45,
        r: 1.1,
        alpha: 0.3 + Math.random() * 0.4,
      };
    case 3: // Nova Canvas: slow spiral
      return {
        ...base,
        x: w / 2 + (Math.random() - 0.5) * w,
        y: h / 2 + (Math.random() - 0.5) * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 0.6 + Math.random() * 1.8,
        alpha: 0.25 + Math.random() * 0.45,
      };
    default: // Terra Grid: falling data
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

/* ── Deep Orbit: 3D orbital system ─────────────────────────
   Six tilted orbital rings rendered with real 3D math (perspective
   projection + slow Y-axis precession), drawn on the same 2D canvas —
   no three.js. Depth drives size/alpha so far-side particles dim and
   shrink behind the central body. Time-parameterized (no mutable
   particle state), so the reduced-motion static frame is just t=0. */

const ORBIT_RINGS = [
  { radius: 0.16, tilt: 1.25, speed: 0.85, precession: 0.09, count: 14 },
  { radius: 0.3, tilt: 1.05, speed: 0.6, precession: -0.07, count: 20 },
  { radius: 0.45, tilt: 1.35, speed: 0.42, precession: 0.05, count: 26 },
  { radius: 0.62, tilt: 0.95, speed: 0.3, precession: -0.04, count: 30 },
  { radius: 0.8, tilt: 1.2, speed: 0.22, precession: 0.03, count: 36 },
  { radius: 1.0, tilt: 1.12, speed: 0.15, precession: -0.022, count: 42 },
];

// Deterministic 0..1 hash from an integer — GLSL-style fract(sin·k). Used for
// starfield positions/phases so the field is stable across frames (the static
// reduced-motion frame at t=0 must match the animated one); a per-frame
// Math.random() would make stars jitter.
const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const STAR_COUNT = 70;

function drawOrbit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: [number, number, number],
  hot: boolean,
  t: number,
) {
  const [r, g, b] = rgb;
  // A warm highlight (theme colour pushed toward white) for near-side
  // particles, so the bright edge of each ring glows hotter than the body.
  const hr = Math.round(r + (255 - r) * 0.6);
  const hg = Math.round(g + (255 - g) * 0.6);
  const hb = Math.round(b + (255 - b) * 0.6);
  // Centered, sized off the larger card dimension so the outermost ring's
  // projected ellipse spans the full background, not a corner ornament.
  const cx = w * 0.5;
  const cy = h * 0.5;
  const R = Math.max(w, h) * 0.5;
  const f = R * 2.6; // perspective focal length
  const boost = hot ? 1.7 : 1;

  // ── Nebula wash ── a huge, barely-there radial gradient anchored on the
  // core gives the whole field depth instead of a flat black backdrop.
  const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
  neb.addColorStop(0, `rgba(${r},${g},${b},${0.1 * boost})`);
  neb.addColorStop(0.4, `rgba(${r},${g},${b},${0.04 * boost})`);
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  // Everything below is light on darkness, so additive blending makes
  // overlaps bloom instead of muddying. Scoped in save/restore.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // ── Twinkling starfield ── deterministic positions, sine-phased alpha.
  for (let i = 0; i < STAR_COUNT; i++) {
    const sx = hash(i) * w;
    const sy = hash(i + 99) * h;
    const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(i + 3) * 1.4) + i);
    const a = (0.12 + 0.5 * hash(i + 7)) * tw * (hot ? 1.3 : 1);
    const sr = 0.5 + hash(i + 5) * 1.2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${a})`;
    ctx.fill();
  }

  // ── Central body ── layered glow + a bright, breathing core.
  const pulse = 1 + 0.12 * Math.sin(t * 1.8);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.42 * pulse);
  halo.addColorStop(0, `rgba(${hr},${hg},${hb},${0.5 * boost})`);
  halo.addColorStop(0.25, `rgba(${r},${g},${b},${0.22 * boost})`);
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.42 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.035 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${hr},${hg},${hb},${0.95 * boost})`;
  ctx.fill();

  for (const ring of ORBIT_RINGS) {
    const rr = R * ring.radius;
    const psi = t * ring.precession * (hot ? 1.6 : 1); // Y-axis precession
    const cosT = Math.cos(ring.tilt);
    const sinT = Math.sin(ring.tilt);
    const cosP = Math.cos(psi);
    const sinP = Math.sin(psi);

    // Project a point at ring angle theta into screen space; returns
    // [sx, sy, depth] with depth in [-1, 1] (1 = nearest).
    const project = (theta: number): [number, number, number] => {
      const x = Math.cos(theta) * rr;
      const y = Math.sin(theta) * rr;
      // Tilt around X, then precess around Y.
      const y2 = y * cosT;
      const z2 = y * sinT;
      const x3 = x * cosP + z2 * sinP;
      const z3 = -x * sinP + z2 * cosP;
      const p = f / (f + z3);
      return [cx + x3 * p, cy + y2 * p, -z3 / rr];
    };

    // Faint orbit path so the shape reads even between particles. Depth-shaded
    // segment-by-segment so the near arc glows and the far arc recedes.
    for (let s = 0; s < 96; s++) {
      const [sx, sy, d0] = project((s / 96) * Math.PI * 2);
      const [ex, ey] = project(((s + 1) / 96) * Math.PI * 2);
      const front = (d0 + 1) / 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = `rgba(${r},${g},${b},${(0.04 + 0.16 * front) * boost})`;
      ctx.lineWidth = 0.5 + front;
      ctx.stroke();
    }

    // Particles riding the ring.
    for (let i = 0; i < ring.count; i++) {
      const theta =
        (i / ring.count) * Math.PI * 2 + t * ring.speed * (hot ? 1.6 : 1);
      const [sx, sy, depth] = project(theta);
      const front = (depth + 1) / 2; // 0 far … 1 near
      const radius = 0.7 + 1.8 * front;
      const alpha = (0.12 + 0.55 * front) * boost;
      // Colour shifts from theme-hue (far) to hot-white (near).
      const pr = Math.round(r + (hr - r) * front);
      const pg = Math.round(g + (hg - g) * front);
      const pb = Math.round(b + (hb - b) * front);

      // Comet trail: a few fading echoes behind the particle along its arc.
      for (let k = 1; k <= 3; k++) {
        const [tx, ty, td] = project(theta - k * 0.05);
        const tf = (td + 1) / 2;
        ctx.beginPath();
        ctx.arc(tx, ty, radius * (1 - k * 0.22), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${pr},${pg},${pb},${alpha * (0.22 - k * 0.05) * tf})`;
        ctx.fill();
      }

      // Soft glow halo via gradient, then the bright core dot.
      const gr = radius * (front > 0.85 ? 5 : 3);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
      glow.addColorStop(0, `rgba(${pr},${pg},${pb},${alpha * 0.45})`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, sy, gr, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pr},${pg},${pb},${alpha})`;
      ctx.fill();
    }
  }

  ctx.restore();
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
  // Animation gates: rAF loop runs only while on-screen AND motion is OK.
  // Reduced-motion users get a single static frame; off-screen cards stop
  // burning CPU entirely (five cards × 55 particles otherwise run forever).
  const runningRef = useRef(false);

  const draw = useCallback(
    (now = 0) => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const w = c.width;
      const h = c.height;
      const hot = hovRef.current;

      ctx.clearRect(0, 0, w, h);

      // Deep Orbit gets the 3D orbital system — time-parameterized, no
      // mutable particle state, so the generic loop below is skipped.
      if (kind === 0) {
        drawOrbit(ctx, w, h, rgb, hot, now * 0.001);
        if (runningRef.current) frame.current = requestAnimationFrame(draw);
        return;
      }

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

        // Neon Protocol, streaks
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

      // Signal Ward, EKG line
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

      // Terra Grid, faint grid lines
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

      if (runningRef.current) frame.current = requestAnimationFrame(draw);
    },
    [rgb, kind],
  );

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

    const mql = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let inView = true;

    const stop = () => {
      runningRef.current = false;
      cancelAnimationFrame(frame.current);
    };
    const sync = () => {
      const reduced = !!mql?.matches;
      if (reduced || !inView) {
        stop();
        // Reduced motion still deserves the atmosphere, one static frame.
        if (reduced && inView) draw();
        return;
      }
      if (!runningRef.current) {
        runningRef.current = true;
        frame.current = requestAnimationFrame(draw);
      }
    };

    resize();
    sync();
    window.addEventListener("resize", resize);
    mql?.addEventListener?.("change", sync);

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              inView = entry.isIntersecting;
              sync();
            },
            { rootMargin: "120px" },
          )
        : null;
    io?.observe(c);

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      mql?.removeEventListener?.("change", sync);
      io?.disconnect();
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
      {/* Title lives ON the flagship surface — header and Deep Orbit share
          one full-width canvas, so they can't read as separate sections.
          The four unlaunched worlds run as a compact strip underneath. */}
      <motion.div
        className="relative overflow-hidden"
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
        <div className="relative z-10 px-10 md:px-20 pt-16 pb-16">
          <div className="flex items-start justify-between gap-6 mb-3">
            <div className="font-mono text-xs text-primary tracking-[0.2em] uppercase">
              CHOOSE YOUR WORLD
            </div>
            <span
              className="font-mono text-xs font-bold tracking-wider px-3 py-1 shrink-0"
              style={{
                color: HERO_CARD.col,
                background: `color-mix(in srgb, ${HERO_CARD.col} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${HERO_CARD.col} 35%, transparent)`,
              }}
            >
              LIVE NOW
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-mono font-black tracking-tight mb-3">
            Five Worlds
          </h2>
          <p className="text-[15px] text-text-muted leading-relaxed max-w-[520px]">
            Same ML syllabus. Five story universes.{" "}
            <span style={{ color: HERO_CARD.col }}>{HERO_CARD.name}</span> is
            live; the other four ship in waves.
          </p>

          <Link
            href={`/themes/${HERO_CARD.slug}`}
            className="block mt-12 group max-w-[640px]"
          >
            <div
              className="text-4xl md:text-6xl font-mono font-black tracking-tight mb-3"
              style={{ color: HERO_CARD.col }}
            >
              {HERO_CARD.name}
            </div>
            <div className="font-mono text-sm text-text-primary mb-4">
              {HERO_CARD.spec}
            </div>
            <p className="text-base md:text-lg text-text-muted leading-relaxed mb-6">
              {HERO_CARD.tagline}
            </p>
            <span
              className="font-mono text-sm tracking-wider group-hover:opacity-80 transition-opacity"
              style={{ color: HERO_CARD.col }}
            >
              Start Module 1 &rarr;
            </span>
          </Link>
        </div>
      </motion.div>

      {/* Coming-next strip — compact 4-up row under the flagship */}
      <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {COMING_SOON_CARDS.map((t, i) => (
          <motion.div
            key={t.code}
            className="relative overflow-hidden group"
            style={{
              borderRight:
                i < COMING_SOON_CARDS.length - 1
                  ? "1px solid var(--tc-border)"
                  : "none",
              opacity: 0.85,
            }}
            onMouseEnter={() => setHovered(t.slug)}
            onMouseLeave={() => setHovered(null)}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 0.85, y: 0 }}
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
              className="flex flex-col gap-1.5 relative z-10 px-8 py-8 h-full"
              data-testid={`coming-soon-card-${t.slug}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className="text-[13px] font-bold tracking-tight uppercase group-hover:text-text-primary transition-colors"
                  style={{ color: "var(--tc-muted)" }}
                >
                  {t.name}
                </div>
                <span
                  className="font-mono text-[10px] font-bold tracking-wider px-2 py-0.5 shrink-0"
                  style={{
                    color: t.col,
                    background: `color-mix(in srgb, ${t.col} 8%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${t.col} 22%, transparent)`,
                  }}
                >
                  COMING SOON
                </span>
              </div>
              <div className="font-mono text-xs text-text-muted opacity-60">
                {t.spec}
              </div>
              <span
                className="font-mono text-xs tracking-wider opacity-60 group-hover:opacity-100 transition-opacity mt-1"
                style={{ color: t.col }}
              >
                Notify me &rarr;
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
