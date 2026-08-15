"use client";

import { SceneCanvas } from "./scene-canvas";

/* ── Deep Orbit: 3D orbital system ─────────────────────────
   Six tilted orbital rings rendered with real 3D math (perspective
   projection + slow Y-axis precession), drawn on a 2D canvas - no three.js.
   Depth drives size/alpha so far-side particles dim and shrink behind the
   central body. Time-parameterized (no mutable particle state), so the
   reduced-motion static frame is just t=0.

   Two rendering languages, one geometry (scheme independence is locked by
   orbit-canvas.test.ts - styling only may branch on scheme):
   - dark: light emitted from darkness - additive "lighter" compositing so
     overlaps bloom, highlights lifted toward white, soft glow halos.
   - light: ink laid on paper - "multiply" compositing so overlaps pool
     darker like wet ink, highlights deepened toward near-black, alphas
     scaled up because tinted marks on paper need more body than glows on
     black. Target: an etched orbital diagram in world-ink on paper.

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

// Deterministic 0..1 hash from an integer - GLSL-style fract(sin·k). Used for
// starfield positions/phases so the field is stable across frames (the static
// reduced-motion frame at t=0 must match the animated one); a per-frame
// Math.random() would make stars jitter.
const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const STAR_COUNT = 70;

/** Scheme-aware highlight: dark lifts the hue toward white (glow),
    light deepens it toward ink (#1A1A1A). Geometry-independent. */
export const highlight = (
  [r, g, b]: [number, number, number],
  scheme: "dark" | "light",
): [number, number, number] =>
  scheme === "light"
    ? [Math.round(r * 0.45), Math.round(g * 0.45), Math.round(b * 0.45)]
    : [
        Math.round(r + (255 - r) * 0.6),
        Math.round(g + (255 - g) * 0.6),
        Math.round(b + (255 - b) * 0.6),
      ];

export function drawOrbit(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rgb: [number, number, number],
  hot: number,
  t: number,
  scheme: "dark" | "light",
) {
  const [r, g, b] = rgb;
  // Highlight for near-side particles: in dark scheme the world colour is
  // pushed toward white so the near edge of each ring glows hotter than the
  // body; in light scheme highlight() flips the target toward deep ink, so
  // the near edge presses HARDER into the paper instead.
  const [hr, hg, hb] = highlight(rgb, scheme);
  const ink = scheme === "light";
  // Ink marks on paper need more body than glows on black: scale every
  // literal alpha up in light scheme, clamped so no mark becomes a blot.
  const A = ink ? 1.8 : 1;
  // Ink-only: dark alphas pass through untouched - clamping them too would
  // cap values the original art let the browser clamp at 1.0 (near-side
  // hover particles compute 1.139), visibly dimming the dark hover state.
  const scaleA = (x: number): number => (ink ? Math.min(0.9, x * A) : x);
  // Watercolour-wash tints for ink mode's large soft fields (nebula, halo).
  // Multiply compositing squares mid-value colours toward black wherever
  // fields overlap themselves or the marks, so a big gradient in the raw
  // world ink reads as a storm cloud; starting the wash near paper value
  // keeps the pool a tinted green, like thinned ink. (wr.. = pale wash,
  // dr.. = slightly deeper wash for the halo's centre.)
  const wr = Math.round(r + (255 - r) * 0.55);
  const wg = Math.round(g + (255 - g) * 0.55);
  const wb = Math.round(b + (255 - b) * 0.55);
  const dr = Math.round(r + (255 - r) * 0.3);
  const dg = Math.round(g + (255 - g) * 0.3);
  const db = Math.round(b + (255 - b) * 0.3);
  // Centered, sized off the larger card dimension so the outermost ring's
  // projected ellipse spans the full background, not a corner ornament.
  const cx = w * 0.5;
  const cy = h * 0.5;
  const R = Math.max(w, h) * 0.5;
  const f = R * 2.6; // perspective focal length
  // `hot` is a continuous 0..1 hover amount and may only affect styling.
  // Positions are pure functions of t; feeding hot into any angle would
  // rescale all elapsed time and teleport the whole system when it changes.
  const boost = 1 + 0.7 * hot;

  // ── Nebula wash ── a huge, barely-there radial gradient anchored on the
  // core gives the whole field depth instead of a flat black backdrop.
  const neb = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.1);
  const nebInk = ink ? `${wr},${wg},${wb}` : `${r},${g},${b}`;
  neb.addColorStop(0, `rgba(${nebInk},${scaleA(0.1 * boost)})`);
  neb.addColorStop(0.4, `rgba(${nebInk},${scaleA(0.04 * boost)})`);
  // Transparent endpoint: a no-op under both composite ops (alpha 0), so the
  // same stop serves the dark glow falloff and the light paper-wash edge.
  neb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neb;
  ctx.fillRect(0, 0, w, h);

  // Dark: everything below is light on darkness - additive blending makes
  // overlaps bloom instead of muddying. Light: ink on paper - multiply makes
  // overlaps pool darker, like wet ink. Scoped in save/restore.
  ctx.save();
  ctx.globalCompositeOperation = ink ? "multiply" : "lighter";

  // ── Twinkling starfield ── deterministic positions, sine-phased alpha.
  // In light scheme this reads as an engraving stipple: same positions and
  // twinkle, deep-ink colour, damped ×0.6 so it whispers, not peppers.
  for (let i = 0; i < STAR_COUNT; i++) {
    const sx = hash(i) * w;
    const sy = hash(i + 99) * h;
    const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + hash(i + 3) * 1.4) + i);
    const a = scaleA(
      (0.12 + 0.5 * hash(i + 7)) * tw * (1 + 0.3 * hot) * (ink ? 0.6 : 1),
    );
    const sr = 0.5 + hash(i + 5) * 1.2;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${a})`;
    ctx.fill();
  }

  // ── Central body ── layered glow + a breathing core. Dark: a hot-white
  // halo blooming out of the core. Light: a watercolour GLAZE - drawn
  // source-over, not multiply, because a soft field multiplied against the
  // nebula wash squares the tint toward desaturated grey and the card gains
  // a storm cloud instead of a pooled green disc (found empirically via
  // pixel probes; pale × pale under multiply = mid grey over a huge area).
  // Multiply is reserved for the crisp marks, where wet-ink pooling reads
  // as intended. The composite-op flip is styling; draw order is unchanged.
  const pulse = 1 + 0.12 * Math.sin(t * 1.8);
  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.42 * pulse);
  if (ink) {
    ctx.globalCompositeOperation = "source-over";
    halo.addColorStop(0, `rgba(${dr},${dg},${db},${scaleA(0.2 * boost)})`);
    halo.addColorStop(0.25, `rgba(${wr},${wg},${wb},${scaleA(0.12 * boost)})`);
  } else {
    halo.addColorStop(0, `rgba(${hr},${hg},${hb},${0.5 * boost})`);
    halo.addColorStop(0.25, `rgba(${r},${g},${b},${0.22 * boost})`);
  }
  halo.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.42 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.035 * pulse, 0, Math.PI * 2);
  // Core dot: capped in ink mode - a fully opaque near-black disc (0.95, or
  // 0.85 × hover boost) reads as a hole punched in the page, not a body.
  ctx.fillStyle = `rgba(${hr},${hg},${hb},${ink ? Math.min(0.88, 0.85 * boost) : 0.95 * boost})`;
  ctx.fill();
  // Back to wet-ink pooling for the ring marks (no-op in dark scheme).
  if (ink) ctx.globalCompositeOperation = "multiply";

  for (const ring of ORBIT_RINGS) {
    const rr = R * ring.radius;
    const psi = t * ring.precession; // Y-axis precession
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
      ctx.strokeStyle = `rgba(${r},${g},${b},${scaleA((0.04 + 0.16 * front) * boost)})`;
      ctx.lineWidth = 0.5 + front;
      ctx.stroke();
    }

    // Particles riding the ring.
    for (let i = 0; i < ring.count; i++) {
      const theta = (i / ring.count) * Math.PI * 2 + t * ring.speed;
      const [sx, sy, depth] = project(theta);
      const front = (depth + 1) / 2; // 0 far … 1 near
      const radius = 0.7 + 1.8 * front;
      const alpha = scaleA((0.12 + 0.55 * front) * boost);
      // Colour shifts from world-hue (far) toward the scheme highlight
      // (near): hot-white in dark, deep ink in light - highlight() already
      // flipped the lerp target, so this needs no scheme branch.
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

      // Soft halo via gradient, then the solid core dot. Dark: the halo is
      // the glow that sells the particle as a light source. Light: damp it
      // to a whisper of ink bleed - at full strength each near-black centre
      // becomes a bokeh smudge, and the field reads as printing mud instead
      // of stippled dots.
      const gr = radius * (front > 0.85 ? 5 : 3);
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, gr);
      glow.addColorStop(
        0,
        `rgba(${pr},${pg},${pb},${alpha * (ink ? 0.16 : 0.45)})`,
      );
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
  /** World colour as an [r,g,b] triple (0–255), used in dark scheme. */
  rgb: [number, number, number];
  /** World colour for light scheme. Falls back to `rgb` when absent. */
  rgbLight?: [number, number, number];
  /** Speeds/brightens the system (hover state on the homepage cards). */
  hovered?: boolean;
  className?: string;
}

/**
 * Self-contained Deep Orbit canvas: drawOrbit mounted on the shared
 * SceneCanvas chrome (clock, hover easing, visibility + reduced-motion
 * gating). Decorative only - always `aria-hidden`.
 */
export function OrbitCanvas({
  rgb,
  rgbLight,
  hovered = false,
  className,
}: OrbitCanvasProps) {
  return (
    <SceneCanvas
      draw={drawOrbit}
      rgb={rgb}
      rgbLight={rgbLight}
      hovered={hovered}
      className={className}
    />
  );
}
