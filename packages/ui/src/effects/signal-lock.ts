import { drawOrbit, highlight } from "./orbit-canvas";
import type { SceneDraw } from "./scene-canvas";

/* ── Signal lock: the pricing curriculum boot ──────────────────────
   One-shot cinematic on the SceneDraw time axis: t in [0, BOOT_DURATION)
   plays a terminal boot (static resolves, a scan sweep passes, rings draw
   themselves in), then the scene delegates wholesale to drawOrbit, so the
   settled backdrop can never drift from the canonical Deep Orbit scene.
   Used by apps/web/app/pricing/curriculum-scene.tsx; spec at
   docs/superpowers/specs/2026-08-15-pricing-curriculum-signal-lock-design.md.

   Contract (as every SceneDraw): positions are pure functions of t; hot
   and scheme touch styling only. Deterministic hash() keeps every frame
   reproducible. Ink mode follows the wash-tint rule: the sweep is a
   paper-lifted tint, never the raw hue over a large soft field (the
   grey-storm-cloud lesson in orbit-canvas.tsx). */

export const BOOT_DURATION = 3;
// Crossfade length; the fade runs over [BOOT_DURATION - CROSSFADE,
// BOOT_DURATION] so tuning BOOT_DURATION cannot desync the handoff.
const CROSSFADE = 0.8;

// GLSL-style fract(sin·k) hash, same convention as orbit-canvas.tsx: the
// static frame at any t must match the animated frame at that t.
const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
const easeOut = (x: number): number => 1 - Math.pow(1 - x, 3);
/** Base hue lerped k toward white: ink mode's thinned-wash tint. */
const wash = (
  [r, g, b]: [number, number, number],
  k: number,
): [number, number, number] => [
  Math.round(r + (255 - r) * k),
  Math.round(g + (255 - g) * k),
  Math.round(b + (255 - b) * k),
];

// Flat silhouettes of ORBIT_RINGS' radii (orbit-canvas.tsx) so the boot
// rings dissolve into the 3D system at roughly their own size.
const RING_RADII = [0.16, 0.3, 0.45, 0.62, 0.8, 1.0];

export const drawSignalLock: SceneDraw = (ctx, w, h, rgb, hot, t, scheme) => {
  const ink = scheme === "light";
  const [r, g, b] = rgb;
  const [hr, hg, hb] = highlight(rgb, scheme);
  const boost = 1 + 0.3 * hot; // styling only, never geometry

  // Crossfade over the boot's last CROSSFADE seconds: real orbit ramps in
  // under the boot marks, boot marks ramp out above it. Both are alpha
  // ramps, so the handoff is a double exposure, never a geometry pop.
  const orbitIn = clamp01((t - (BOOT_DURATION - CROSSFADE)) / CROSSFADE);
  const bootOut = 1 - orbitIn;

  if (orbitIn > 0) {
    ctx.save();
    // drawOrbit paints via rgba() strings and never touches globalAlpha,
    // so an outer globalAlpha scales the whole delegated scene.
    ctx.globalAlpha = orbitIn;
    drawOrbit(ctx, w, h, rgb, hot, t, scheme);
    ctx.restore();
  }
  if (bootOut <= 0) return; // settled: nothing above the delegated scene

  // ── Static noise resolving, t in [0, 0.7] ──
  const noise = (1 - easeOut(clamp01(t / 0.7))) * bootOut;
  if (noise > 0.01) {
    // Re-rolls every 1/60s tick; deterministic at any given t.
    const seed = Math.floor(t * 60) * 7919;
    const a0 = ink ? 0.5 : 0.3;
    for (let i = 0; i < 220; i++) {
      const x = hash(i + seed) * w;
      const y = hash(i + seed + 99) * h;
      ctx.fillStyle = `rgba(${hr},${hg},${hb},${noise * a0 * hash(i + 3) * boost})`;
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }

  // ── Scan sweep, t in (0.15, 1.5) ── The 14% overshoot lets the trailing
  // band leave the canvas before the window closes, instead of popping off
  // mid-frame (mirrors drawNeonProtocol's extended-cycle convention).
  const sweep = clamp01((t - 0.15) / 1.35);
  if (sweep > 0 && sweep < 1) {
    const sy = sweep * h * 1.14;
    // Ink: paper-lifted wash tint drawn source-over; dark: raw hue.
    const [sr, sg, sb] = ink ? wash(rgb, 0.55) : rgb;
    const band = ctx.createLinearGradient(0, sy - h * 0.12, 0, sy);
    band.addColorStop(0, `rgba(${sr},${sg},${sb},0)`);
    band.addColorStop(
      1,
      `rgba(${sr},${sg},${sb},${(ink ? 0.35 : 0.25) * bootOut * boost})`,
    );
    ctx.fillStyle = band;
    ctx.fillRect(0, sy - h * 0.12, w, h * 0.12);
    // Ink alphas capped per orbit's ink doctrine: an opaque near-black mark
    // reads as a hole in the page (orbit-canvas.tsx caps its core at 0.88).
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${ink ? Math.min(0.9, 0.8 * bootOut * boost) : 0.8 * bootOut * boost})`;
    ctx.fillRect(0, sy, w, 1.2);
  }

  // ── Rings draw in as arc progress, t in [0.9, 2.2] ──
  const cx = w * 0.5;
  const cy = h * 0.5;
  const R = Math.max(w, h) * 0.5;
  const rings = clamp01((t - 0.9) / 1.3);
  for (let i = 0; i < RING_RADII.length; i++) {
    const p = clamp01(rings * 1.6 - i * 0.12);
    if (p <= 0) continue;
    const rr = R * RING_RADII[i];
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy,
      rr,
      rr * 0.38,
      0,
      -Math.PI / 2,
      -Math.PI / 2 + p * Math.PI * 2,
    );
    ctx.strokeStyle = `rgba(${r},${g},${b},${(ink ? 0.55 : 0.4) * bootOut * boost})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  if (rings > 0.3) {
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.035, 0, Math.PI * 2);
    // Same ink cap as above: 0.88 ceiling keeps the core from going opaque.
    ctx.fillStyle = `rgba(${hr},${hg},${hb},${ink ? Math.min(0.88, 0.85 * bootOut * boost) : 0.9 * bootOut * boost})`;
    ctx.fill();
  }
};
