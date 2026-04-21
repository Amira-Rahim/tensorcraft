"use client";

import { useEffect, useRef } from "react";

export interface ParticleFieldProps {
  className?: string;
  /**
   * Particle density from 0..1 (default 0.5). Maps to a particle count that
   * is capped at MAX_PARTICLES (150).
   */
  density?: number;
  /**
   * CSS var name used to fill particles. Default `var(--tc-primary)`.
   * The canvas looks this up via getComputedStyle so the theme system works.
   */
  colorToken?: string;
}

const MAX_PARTICLES = 150;
const MIN_PARTICLES = 20;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

function makeParticles(
  count: number,
  width: number,
  height: number,
): Particle[] {
  const arr: Particle[] = [];
  for (let i = 0; i < count; i += 1) {
    arr.push({
      x: Math.random() * width,
      y: Math.random() * height,
      // Slow drift: ±0.3 px/frame at 60fps ≈ 18 px/sec.
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 0.8 + Math.random() * 1.4,
    });
  }
  return arr;
}

function resolveColor(canvas: HTMLCanvasElement, token: string): string {
  // If the token is a CSS variable reference, resolve it via computed style.
  const match = token.match(/^var\((--[^),\s]+)\)/);
  if (match) {
    const resolved = getComputedStyle(canvas).getPropertyValue(match[1]).trim();
    if (resolved) return resolved;
  }
  return token;
}

export function ParticleField({
  className,
  density = 0.5,
  colorToken = "var(--tc-primary)",
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // In some environments (notably jsdom without the canvas package)
    // getContext returns null — we still want to attach the observers so
    // unmount cleanup is consistent, but we skip all drawing work.
    const ctx = canvas.getContext("2d");

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const clamped = Math.max(0, Math.min(1, density));
    const count = Math.max(
      MIN_PARTICLES,
      Math.min(MAX_PARTICLES, Math.round(clamped * MAX_PARTICLES)),
    );

    let width = canvas.clientWidth || 1;
    let height = canvas.clientHeight || 1;
    let dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    let particles: Particle[] = makeParticles(count, width, height);

    const applySize = () => {
      width = canvas.clientWidth || 1;
      height = canvas.clientHeight || 1;
      dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Keep existing particle positions clamped inside the new box.
      particles.forEach((p) => {
        p.x = ((p.x % width) + width) % width;
        p.y = ((p.y % height) + height) % height;
      });
    };

    const drawFrame = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = resolveColor(canvas, colorToken);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    applySize();

    // Static render first — covers both reduced-motion and initial paint.
    drawFrame();

    if (prefersReducedMotion) {
      // Respect the user's preference — no rAF loop, no observers beyond
      // ResizeObserver so the static scatter stays sharp on reflow.
      const ro = new ResizeObserver(() => {
        applySize();
        drawFrame();
      });
      ro.observe(canvas);
      // Intersection observer is still attached so the unmount-cleanup tests
      // consistently see both observers being disposed.
      const io = new IntersectionObserver(() => {});
      io.observe(canvas);
      return () => {
        ro.disconnect();
        io.disconnect();
      };
    }

    let rafId: number | null = null;
    let isVisible = true;

    const step = () => {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        // Wrap around edges.
        if (p.x < -2) p.x = width + 2;
        else if (p.x > width + 2) p.x = -2;
        if (p.y < -2) p.y = height + 2;
        else if (p.y > height + 2) p.y = -2;
      }
      drawFrame();
      rafId = window.requestAnimationFrame(step);
    };

    const start = () => {
      if (rafId != null) return;
      rafId = window.requestAnimationFrame(step);
    };
    const stop = () => {
      if (rafId != null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const ro = new ResizeObserver(() => {
      applySize();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting;
          if (isVisible) start();
          else stop();
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    // Kick off immediately; IO will pause us if we're off-screen on mount.
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      particles = [];
    };
  }, [density, colorToken]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="presentation"
      data-color-token={colorToken}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
