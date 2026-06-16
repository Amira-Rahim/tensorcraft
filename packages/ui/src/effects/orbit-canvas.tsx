"use client";

import { useRef, useEffect, useCallback } from "react";

/* ── Deep Orbit: 3D orbital system ─────────────────────────
   Six tilted orbital rings rendered with real 3D math (perspective
   projection + slow Y-axis precession), drawn on a 2D canvas — no three.js.
   Depth drives size/alpha so far-side particles dim and shrink behind the
   central body. Time-parameterized (no mutable particle state), so the
   reduced-motion static frame is just t=0.

   Extracted from the landing-page five-worlds section so the auth page and the
   homepage render the identical, vibrant orbit from one source. */

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

export function drawOrbit(
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

export interface OrbitCanvasProps {
  /** Theme colour as an [r,g,b] triple (0–255). */
  rgb: [number, number, number];
  /** Speeds/brightens the system (hover state on the homepage cards). */
  hovered?: boolean;
  className?: string;
}

/**
 * Self-contained Deep Orbit canvas. Sizes to its positioned parent, gates the
 * rAF loop on visibility + reduced-motion (static t=0 frame when reduced), and
 * cleans up on unmount. Decorative only — always `aria-hidden`.
 */
export function OrbitCanvas({
  rgb,
  hovered = false,
  className,
}: OrbitCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  const hovRef = useRef(hovered);
  hovRef.current = hovered;
  const runningRef = useRef(false);

  const draw = useCallback(
    (now = 0) => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      drawOrbit(ctx, c.width, c.height, rgb, hovRef.current, now * 0.001);
      if (runningRef.current) frame.current = requestAnimationFrame(draw);
    },
    [rgb],
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

    const onResize = () => {
      resize();
      // Keep the static frame correct after a resize when not animating.
      if (mql?.matches && inView) draw();
    };

    resize();
    sync();
    window.addEventListener("resize", onResize);
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
      window.removeEventListener("resize", onResize);
      mql?.removeEventListener?.("change", sync);
      io?.disconnect();
    };
  }, [draw]);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
