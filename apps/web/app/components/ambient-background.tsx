"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAttributeObserver } from "./use-attribute-observer";

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

// Dark deep-orbit values — used only when CSS custom properties are missing
// (SSR-adjacent edge cases, or the properties failing to parse). Real
// rendering reads the live world/scheme palette via readPalettes() below.
const FALLBACK_PALETTES: [number, number, number][] = [
  [107, 170, 138], // primary teal
  [112, 150, 176], // blue-grey (tier-structural)
  [168, 144, 96], // warm amber (tier-intuition)
];

function parseRgbTriplet(value: string): [number, number, number] | null {
  const parts = value
    .trim()
    .split(",")
    .map((p) => Number.parseInt(p.trim(), 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Reads the current world + scheme's ambient palette straight off the live
 * CSS custom properties on `<html>` (`--tc-primary-rgb`, `--tc-tier-
 * structural`, `--tc-tier-intuition`) — the same three hues the old
 * hardcoded PALETTES array approximated for deep-orbit-dark only, now
 * correct for every narrative world and both color schemes. Falls back to
 * the dark deep-orbit defaults if a property is missing or unparsable.
 */
export function readPalettes(): [number, number, number][] {
  if (typeof document === "undefined") return FALLBACK_PALETTES;
  const style = getComputedStyle(document.documentElement);
  const parsed = [
    parseRgbTriplet(style.getPropertyValue("--tc-primary-rgb")),
    hexToRgb(style.getPropertyValue("--tc-tier-structural")),
    hexToRgb(style.getPropertyValue("--tc-tier-intuition")),
  ].filter((p): p is [number, number, number] => p !== null);
  return parsed.length > 0 ? parsed : FALLBACK_PALETTES;
}

function spawn(
  w: number,
  h: number,
  palettes: [number, number, number][],
): Particle {
  const life = 250 + Math.random() * 400;
  const col = palettes[Math.floor(Math.random() * palettes.length)];
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
  const palettesRef = useRef<[number, number, number][]>(FALLBACK_PALETTES);
  // Set inside the main effect below, read from the attribute-change handler
  // so a world/scheme flip can repaint the reduced-motion static frame
  // without that handler needing its own matchMedia listener.
  const motionQueryRef = useRef<MediaQueryList | null>(null);

  // One simulation step + paint, NO scheduling. The looping wrapper below
  // owns requestAnimationFrame so the reduced-motion path can render a
  // genuinely static frame (the old code called the self-scheduling draw
  // once, which silently started the full loop and leaked it on unmount).
  const renderFrame = useCallback(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const w = c.width;
    const h = c.height;
    timeRef.current += 0.003;
    const t = timeRef.current;

    // Fully transparent clear, blends with page background
    ctx.clearRect(0, 0, w, h);

    // Cheap attribute read every frame — never getComputedStyle in the loop
    // (that forces a style recalc per frame; readPalettes() only runs on
    // mount + attribute change, see the MutationObserver-driven handler
    // below).
    const scheme: "dark" | "light" =
      document.documentElement.dataset.scheme === "light" ? "light" : "dark";

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
      // Light mode gets clean ink motes: dust reads far fainter against a
      // white/paper surface than against dark-brutalist black at the same
      // alpha, so boost it. (Dark path is untouched: ×1 no-ops.)
      const alpha = p.alpha * fade * 1.3 * (scheme === "light" ? 1.6 : 1);

      if (
        p.life <= 0 ||
        p.x < -20 ||
        p.x > w + 20 ||
        p.y < -20 ||
        p.y > h + 20
      ) {
        ps[i] = spawn(w, h, palettesRef.current);
        continue;
      }

      const [r, g, b] = p.col;

      // Main dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();

      // Soft glow halo on larger particles — dark-native (additive glow
      // dust). Light mode skips it entirely: a bloom halo reads as a smudge
      // on paper rather than atmosphere, so light gets clean ink motes only.
      if (scheme === "dark" && p.r > 1.2) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.1})`;
        ctx.fill();
      }
    }
  }, []);

  const draw = useCallback(() => {
    renderFrame();
    frame.current = requestAnimationFrame(draw);
  }, [renderFrame]);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    // Read the live world/scheme palette once up front so the very first
    // resize()'s particle spawn already uses the right hues (avoids a
    // one-frame flash of the fallback palette).
    palettesRef.current = readPalettes();

    // Honour `prefers-reduced-motion: reduce`: one static textured frame,
    // no rAF loop (WCAG 2.3.3). Resizing clears the canvas, so the static
    // path must repaint after each resize or the backdrop goes blank.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQueryRef.current = motionQuery;

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
        spawn(c.width, c.height, palettesRef.current),
      );
      if (motionQuery.matches) renderFrame();
    };

    resize();

    const applyMotionPreference = () => {
      cancelAnimationFrame(frame.current);
      if (motionQuery.matches) {
        renderFrame();
      } else {
        frame.current = requestAnimationFrame(draw);
      }
    };

    applyMotionPreference();
    motionQuery.addEventListener("change", applyMotionPreference);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame.current);
      motionQuery.removeEventListener("change", applyMotionPreference);
      window.removeEventListener("resize", resize);
      motionQueryRef.current = null;
    };
  }, [count, draw, renderFrame]);

  // Re-read the palette whenever the narrative world or color scheme
  // changes (fixes the pre-existing bug where the ambient dust ignored
  // both and always rendered deep-orbit-dark's hues). Newly spawned
  // particles pick up the change immediately; already-alive ones age out
  // naturally within their ~4-11s lifespan. If a static reduced-motion
  // frame is showing, repaint it immediately so it doesn't go stale.
  const handleWorldOrSchemeChange = useCallback(() => {
    palettesRef.current = readPalettes();
    if (motionQueryRef.current?.matches) renderFrame();
  }, [renderFrame]);

  useAttributeObserver(
    ["data-world", "data-scheme"],
    handleWorldOrSchemeChange,
  );

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
