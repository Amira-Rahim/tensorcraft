import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { drawOrbit } from "./orbit-canvas";
import {
  recordingCtx,
  gradientStopAlphas,
} from "./test-utils/recording-canvas";

/* drawOrbit is time-parameterized: every position is a pure function of t.
   The hover boost must therefore never feed into position math; a discrete
   speed multiplier on absolute time rescales the whole elapsed history and
   teleports every particle the moment hover flips. Hover may only change
   styling (alpha/brightness); the caller speeds time up by advancing its
   accumulated clock faster.

   recordingCtx (shared with world-scenes.test.ts, see
   ./test-utils/recording-canvas.ts) captures EVERY geometry-producing call,
   including fillRect args into `.rects` — drawOrbit today only calls
   fillRect once, with the constant full-canvas nebula wash (0, 0, w, h),
   but capturing it (rather than discarding, as an earlier version of this
   recorder did) means a future positioned fillRect can't sneak scheme- or
   hover-dependent geometry past this lock. */

describe("drawOrbit hover continuity", () => {
  it("keeps every particle and ring-path position identical when hover flips at the same t", () => {
    // A long-lived page: with a hover speed multiplier applied to absolute
    // time, the position error grows with t, so a large t makes any
    // discontinuity obvious.
    const t = 123.456;
    const rgb: [number, number, number] = [107, 170, 138];

    const idle = recordingCtx();
    drawOrbit(idle.ctx, 1000, 600, rgb, 0, t, "dark");

    const hot = recordingCtx();
    drawOrbit(hot.ctx, 1000, 600, rgb, 1, t, "dark");

    expect(hot.rec.arcs).toEqual(idle.rec.arcs);
    expect(hot.rec.lines).toEqual(idle.rec.lines);
    expect(hot.rec.rects).toEqual(idle.rec.rects);
  });
});

describe("drawOrbit scheme independence", () => {
  it("draws identical geometry under dark and light scheme at the same t", () => {
    // The light art redesign (Task 9) may only change styling (colors,
    // composite mode, alpha) — never position. Recording every geometry
    // call under both schemes and diffing locks that contract before the
    // art work lands.
    const t = 123.456;
    const rgb: [number, number, number] = [107, 170, 138];

    const dark = recordingCtx();
    drawOrbit(dark.ctx, 1000, 600, rgb, 0.4, t, "dark");

    const light = recordingCtx();
    drawOrbit(light.ctx, 1000, 600, rgb, 0.4, t, "light");

    expect(light.rec.arcs).toEqual(dark.rec.arcs);
    expect(light.rec.lines).toEqual(dark.rec.lines);
    expect(light.rec.rects).toEqual(dark.rec.rects);
  });
});

/* The geometry locks above are blind to styling: a helper that wrongly
   clamped DARK alphas at 0.9 (Task 9's first cut of scaleA) passed the whole
   suite while visibly dimming the dark hover state. The golden lock below
   captures the styled output (fill/stroke paints incl. gradient stops,
   composite ops, line widths) of the dark scheme at a fixed t/hot and pins
   it byte-for-byte, so Task 10-era refactors can't silently shift dark.

   If this fails after an INTENTIONAL dark art change: verify the new look
   visually, then update the counts/hash below (the failure output shows the
   new hash). If you didn't mean to touch dark, you regressed it. */

const alphaOf = (style: unknown): number =>
  typeof style === "string" ? parseFloat(style.split(",")[3] ?? "0") : NaN;

describe("drawOrbit dark-scheme style lock", () => {
  it("matches the golden style capture (paints, alphas, composite ops)", () => {
    const { ctx, styles } = recordingCtx();
    drawOrbit(ctx, 1000, 600, [107, 170, 138], 1, 123.456, "dark");

    expect(styles.fills).toHaveLength(913);
    expect(styles.strokes).toHaveLength(576);

    // Human-readable spot locks for the regression class that motivated this
    // test. Dark alphas pass through UNclamped — the browser clamps >1 at
    // raster time. At this t/hot, 42 fills exceed alpha 1: the core dot
    // (0.95 × boost 1.7 = 1.615, which bypasses the scale helper) plus 41
    // near-side hover particles (~1.14, which go THROUGH it) — so a clamp
    // leaking into the dark path collapses this count to 1 even though the
    // max stays 1.615. Both are asserted for a readable failure.
    const plainFillAlphas = styles.fills
      .map((f) => alphaOf(f.style))
      .filter((a) => !Number.isNaN(a));
    expect(Math.max(...plainFillAlphas)).toBeCloseTo(1.615, 10);
    expect(plainFillAlphas.filter((a) => a > 1)).toHaveLength(42);
    // Nebula wash composites source-over; every other dark mark is additive.
    expect(styles.fills[0]?.op).toBe("source-over");
    expect(styles.fills.slice(1).every((f) => f.op === "lighter")).toBe(true);
    expect(styles.strokes.every((s) => s.op === "lighter")).toBe(true);

    // Full identity lock on the serialized capture.
    const sha = createHash("sha256")
      .update(JSON.stringify(styles))
      .digest("hex");
    expect(sha).toBe(
      "17fe58121dbfc7e50dab2c7095712e41df2d092da790bb811da6d60a1e1d28f0",
    );
  });

  it("light scheme clamps every plain-paint alpha at 0.9 and never composites additively", () => {
    // Complement to the dark lock: ink mode's whole premise is bounded-body
    // marks (scaleA clamp ≤ 0.9; core dot capped 0.88) pooled via multiply,
    // with the nebula/halo glazes on source-over — "lighter" is dark-only.
    const { ctx, styles } = recordingCtx();
    drawOrbit(ctx, 1000, 600, [107, 170, 138], 1, 123.456, "light");

    const plainFillAlphas = styles.fills
      .map((f) => alphaOf(f.style))
      .filter((a) => !Number.isNaN(a));
    expect(Math.max(...plainFillAlphas)).toBeLessThanOrEqual(0.9);
    const strokeAlphas = styles.strokes.map((s) => alphaOf(s.style));
    expect(Math.max(...strokeAlphas)).toBeLessThanOrEqual(0.9);
    const ops = new Set([
      ...styles.fills.map((f) => f.op),
      ...styles.strokes.map((s) => s.op),
    ]);
    expect(ops.has("lighter")).toBe(false);
    expect([...ops].sort()).toEqual(["multiply", "source-over"]);

    // The nebula/halo/particle-glow gradients fill as gradients, captured
    // as their addColorStop stop list rather than a plain string —
    // alphaOf(...) is NaN for those and the plain-paint scan above
    // silently skips them. Parse every stop's own alpha so an unclamped
    // wash stop can't hide behind the plain-paint scan.
    const gradientAlphas = [
      ...gradientStopAlphas(styles.fills),
      ...gradientStopAlphas(styles.strokes),
    ];
    if (gradientAlphas.length) {
      expect(Math.max(...gradientAlphas)).toBeLessThanOrEqual(0.9);
    }
  });
});
