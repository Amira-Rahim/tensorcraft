"use client";

import { useEffect, useRef, useCallback } from "react";

/* ── Particle types ─────────────────────────────────────── */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  life: number;
  maxLife: number;
  col: [number, number, number];
}

const PALETTES: [number, number, number][] = [
  [107, 170, 138], // primary teal
  [112, 150, 176], // blue-grey
  [168, 144, 96], // warm amber
];

function spawn(w: number, h: number): Particle {
  const life = 250 + Math.random() * 400;
  const col = PALETTES[Math.floor(Math.random() * PALETTES.length)];
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -0.12 - Math.random() * 0.25,
    r: Math.random() < 0.18 ? 2.0 : 0.9,
    alpha: 0.3 + Math.random() * 0.5,
    life,
    maxLife: life,
    col,
  };
}

/* ── Component ──────────────────────────────────────────── */

/**
 * Transparent particle atmosphere background.
 * Uses clearRect so particles blend naturally over the page.
 * Matches the AtmosphereCanvas system from Five Worlds.
 */
export function AmbientBackground({ count = 200 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef(0);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    timeRef.current += 0.003;
    const t = timeRef.current;

    // Fully transparent clear — blends with page background
    ctx.clearRect(0, 0, w, h);

    const ps = particles.current;

    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];

      // Flow field influence (organic movement)
      const nx = p.x / w;
      const ny = p.y / h;
      const angle =
        Math.sin(nx * 3.1 + t) * Math.cos(ny * 2.4 - t * 0.7) * Math.PI * 2 +
        Math.sin(ny * 2.7 + t * 1.1) * Math.PI;
      p.vx = p.vx * 0.96 + Math.cos(angle) * 0.04;
      p.vy = p.vy * 0.96 + Math.sin(angle) * 0.04;

      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      const lr = p.life / p.maxLife;
      const fade =
        lr > 0.85 ? (1 - lr) * (1 / 0.15) : lr > 0.15 ? 1 : lr * (1 / 0.15);
      const alpha = p.alpha * fade * 1.3;

      if (
        p.life <= 0 ||
        p.x < -20 ||
        p.x > w + 20 ||
        p.y < -20 ||
        p.y > h + 20
      ) {
        ps[i] = spawn(w, h);
        continue;
      }

      const [r, g, b] = p.col;

      // Main dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      // Soft glow halo on larger particles
      if (p.r > 1.2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`;
        ctx.fill();
      }
    }

    frame.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const resize = () => {
      const parent = c.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      c.style.width = rect.width + "px";
      c.style.height = rect.height + "px";
      particles.current = Array.from({ length: count }, () =>
        spawn(c.width, c.height),
      );
    };

    resize();
    frame.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", resize);
    };
  }, [count, draw]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
