"use client";

import { useMemo } from "react";
import { SceneCanvas } from "./scene-canvas";
import type { SceneDraw } from "./scene-canvas";
import { highlight } from "./orbit-canvas";

/* ── ARIA: procedural waveform avatar ──────────────────────
   The ship AI's avatar per docs/character-bible.md: a steady horizontal
   oscilloscope waveform inside a thin voice-orb ring with fine brass tick
   marks. Strictly abstract: no face, no eyes, no humanoid form, ever. Her
   "expressions" are waveform states, not a countenance, so this glyph is
   drawn live instead of shipping raster art like the human cast.

   Each state is its own SceneDraw from the factory below, mounted on
   SceneCanvas to inherit the effects contract (own clock, reduced-motion
   static frame, IntersectionObserver gating, scheme handling). Within a
   state the usual purity contract holds: positions derive from t only,
   hot/scheme style only. Dark renders light-on-glass (additive), light
   renders the ink grammar (multiply, deepened highlight, 0.9 alpha clamp),
   matching orbit-canvas. */

export const ARIA_WAVEFORM_STATES = [
  "neutral",
  "emphasis",
  "deadpan",
  "alarm",
] as const;

/** Bible expression set: calm even ripple, one clean tall spike, a flat
    steady line, a tight agitated scatter. */
export type AriaWaveformState = (typeof ARIA_WAVEFORM_STATES)[number];

export interface AriaWaveformOptions {
  /** Ring tick color in dark scheme; defaults to deep-orbit brass #A89060. */
  tickRgb?: [number, number, number];
  /** Ring tick color in light scheme; defaults to the darkened brass
      #6B5A3B (the light-palette accent, ink on paper). */
  tickRgbLight?: [number, number, number];
}

const TWO_PI = Math.PI * 2;
const WAVE_SEGMENTS = 48;

// Deterministic 0..1 hash from an integer, GLSL-style fract(sin*k), same
// idiom as the orbit starfield: alarm's scatter must be stable at a fixed t
// so the reduced-motion static frame matches the animated one.
const hash = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/** Waveform vertical offset (device px) for one sample. Pure in (u, t). */
const waveDy = (
  state: AriaWaveformState,
  u: number,
  t: number,
  i: number,
  m: number,
): number => {
  switch (state) {
    case "neutral":
      // Calm even ripple: two slow incommensurate sines breathing past
      // each other.
      return (
        m *
        (0.1 * Math.sin(u * 6 * Math.PI + t * 2.2) +
          0.045 * Math.sin(u * 11 * Math.PI - t * 1.4))
      );
    case "emphasis": {
      // One clean tall spike drifting around the center over a faint
      // ripple. At t=0 the spike sits dead center: the signature frame.
      const s = 0.5 + 0.28 * Math.sin(t * 0.9);
      const d = (u - s) / 0.059;
      return (
        m * 0.05 * Math.sin(u * 7 * Math.PI + t * 2.6) -
        m * 0.3 * Math.exp(-0.5 * d * d)
      );
    }
    case "deadpan":
      // A flat steady line. Literally: deadpan certainty has no ripple.
      return 0;
    case "alarm":
      // Tight agitated scatter: high-frequency sines with hash-scrambled
      // per-sample phase and body, jagged across x, continuous in t.
      return (
        m *
        0.16 *
        Math.sin(u * 44 * Math.PI + t * 13 + hash(i) * TWO_PI) *
        (0.55 + 0.45 * hash(i * 3.7))
      );
  }
};

/** Factory: fixed state to a pure SceneDraw for that waveform mode. */
export function makeAriaWaveformDraw(
  state: AriaWaveformState,
  opts: AriaWaveformOptions = {},
): SceneDraw {
  const { tickRgb = [168, 144, 96], tickRgbLight = [107, 90, 59] } = opts;
  return (ctx, w, h, rgb, hot, t, scheme) => {
    const [r, g, b] = rgb;
    const [hr, hg, hb] = highlight(rgb, scheme);
    const ink = scheme === "light";
    // Ink marks need more body than glows on black; clamp so no mark
    // becomes a blot. Dark alphas pass through untouched (orbit precedent:
    // the browser clamps at 1.0, a pre-clamp dims the hover state).
    const A = ink ? 1.8 : 1;
    const scaleA = (x: number): number => (ink ? Math.min(0.9, x * A) : x);
    const m = Math.min(w, h);
    const cx = w * 0.5;
    const cy = h * 0.5;
    // Continuous hover amount, styling only.
    const boost = 1 + 0.5 * hot;

    // ── Glass glow ── soft radial wash behind the glyph: self-illumination
    // in dark, a pale watercolour glaze in light (multiply would square a
    // soft field toward grey, so the wash stays source-over, per orbit).
    const wr = Math.round(r + (255 - r) * 0.55);
    const wg = Math.round(g + (255 - g) * 0.55);
    const wb = Math.round(b + (255 - b) * 0.55);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, m * 0.5);
    const washInk = ink ? `${wr},${wg},${wb}` : `${r},${g},${b}`;
    glow.addColorStop(0, `rgba(${washInk},${scaleA(0.1 * boost)})`);
    glow.addColorStop(0.6, `rgba(${washInk},${scaleA(0.04 * boost)})`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = ink ? "multiply" : "lighter";

    // ── Voice-orb ring ── clean and concentric, the only container.
    const ringR = m * 0.42;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, TWO_PI);
    ctx.strokeStyle = `rgba(${r},${g},${b},${scaleA(0.5 * boost)})`;
    ctx.lineWidth = Math.max(1, m * 0.02);
    ctx.stroke();

    // ── Brass ticks ── 12 fine oscilloscope marks straddling the ring.
    const [tr, tg, tb] = ink ? tickRgbLight : tickRgb;
    ctx.strokeStyle = `rgba(${tr},${tg},${tb},${scaleA(0.55)})`;
    ctx.lineWidth = Math.max(1, m * 0.018);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TWO_PI - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * m * 0.4, cy + Math.sin(a) * m * 0.4);
      ctx.lineTo(cx + Math.cos(a) * m * 0.46, cy + Math.sin(a) * m * 0.46);
      ctx.stroke();
    }

    // ── Waveform ── the only living element, kept inside the ring.
    ctx.beginPath();
    const half = m * 0.3;
    for (let i = 0; i <= WAVE_SEGMENTS; i++) {
      const u = i / WAVE_SEGMENTS;
      const x = cx + (u - 0.5) * 2 * half;
      const y = cy + waveDy(state, u, t, i, m);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `rgba(${hr},${hg},${hb},${scaleA(0.85 * boost)})`;
    ctx.lineWidth = Math.max(1.2, m * 0.035);
    ctx.stroke();

    ctx.restore();
  };
}

export interface AriaWaveformAvatarProps {
  /** Waveform mode; maps 1:1 to ARIA's manifest expression ids. */
  state?: AriaWaveformState;
  /** Accessible name on the frame; the canvas itself stays aria-hidden. */
  name?: string;
  size?: number;
  /** Theme colour as an [r,g,b] triple, dark scheme. App-supplied: this
      package stays manifest-blind, like CharacterAvatar. */
  rgb: [number, number, number];
  rgbLight?: [number, number, number];
  accentColor?: string;
}

/**
 * ARIA's avatar-slot glyph: the standard square avatar frame (identical
 * chrome to CharacterAvatar) around a live SceneCanvas waveform. Replaces
 * the static AI placeholder glyph wherever ARIA speaks.
 */
export function AriaWaveformAvatar({
  state = "neutral",
  name = "ARIA",
  size = 44,
  rgb,
  rgbLight,
  accentColor = "var(--tc-primary)",
}: AriaWaveformAvatarProps) {
  // Stable per state so SceneCanvas's render effect doesn't re-subscribe
  // every parent render.
  const draw = useMemo(() => makeAriaWaveformDraw(state), [state]);
  return (
    <div
      data-testid="aria-waveform-avatar"
      role="img"
      aria-label={name}
      className="shrink-0 select-none relative"
      style={{
        width: size,
        height: size,
        border: `2px solid ${accentColor}`,
        background: "var(--tc-surface)",
        borderRadius: 0,
      }}
    >
      {/* SceneCanvas sizes to its positioned parent; this inner box is the
          padding box inside the 2px frame so the canvas never bleeds. */}
      <div className="absolute inset-0" aria-hidden="true">
        <SceneCanvas
          draw={draw}
          rgb={rgb}
          rgbLight={rgbLight}
          intensity={0.6}
          className="block"
        />
      </div>
    </div>
  );
}
