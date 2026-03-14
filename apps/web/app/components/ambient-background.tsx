"use client";

import { useEffect, useRef } from "react";

const PALETTES: [number, number, number][] = [
  [107, 170, 138],
  [112, 150, 176],
  [168, 144, 96],
];

/**
 * ParticleField — canvas-based flow field background.
 * Matches the prototype's ParticleField component exactly.
 */
export function AmbientBackground({ count = 200 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    type Dot = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      col: [number, number, number];
      spd: number;
    };

    let W = 0;
    let H = 0;
    const dots: Dot[] = [];

    const makeDot = (w: number, h: number): Dot => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 0,
      vy: 0,
      life: Math.random(),
      maxLife: 0.65 + Math.random() * 0.35,
      col: PALETTES[Math.floor(Math.random() * PALETTES.length)],
      spd: 0.18 + Math.random() * 0.25,
    });

    const resize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      dots.length = 0;
      for (let i = 0; i < count; i++) dots.push(makeDot(W, H));
    };
    resize();
    window.addEventListener("resize", resize);

    let t = 0;

    const tick = () => {
      t += 0.003;
      ctx.fillStyle = "rgba(28,28,28,0.13)";
      ctx.fillRect(0, 0, W, H);

      for (let i = 0; i < dots.length; i++) {
        const p = dots[i];
        const nx = p.x / W;
        const ny = p.y / H;
        const angle =
          Math.sin(nx * 3.1 + t) * Math.cos(ny * 2.4 - t * 0.7) * Math.PI * 2 +
          Math.sin(ny * 2.7 + t * 1.1) * Math.PI;

        p.vx = p.vx * 0.92 + Math.cos(angle) * 0.15;
        p.vy = p.vy * 0.92 + Math.sin(angle) * 0.15;
        p.x += p.vx * p.spd;
        p.y += p.vy * p.spd;
        p.life += 0.004;

        if (p.life > p.maxLife || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          dots[i] = makeDot(W, H);
          continue;
        }

        const env =
          p.life < 0.15
            ? p.life / 0.15
            : p.life > p.maxLife - 0.15
              ? (p.maxLife - p.life) / 0.15
              : 1;
        const alpha =
          env * (0.1 + Math.sin((p.life * Math.PI) / p.maxLife) * 0.12);
        const [r, g, b] = p.col;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
