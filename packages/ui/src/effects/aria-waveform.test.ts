import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { makeAriaWaveformDraw, ARIA_WAVEFORM_STATES } from "./aria-waveform";
import type { AriaWaveformState } from "./aria-waveform";
import {
  recordingCtx,
  gradientStopAlphas,
} from "./test-utils/recording-canvas";

/* Same contract as the theme scenes (see theme-scenes.test.ts): each state's
   draw is time-parameterized, so positions are pure functions of t and the
   eased hover amount / scheme may only change styling. States are DIFFERENT
   draw functions from the factory, so geometry may differ between states
   (that is the whole point, see the distinctiveness suite), but within one
   state the purity contract holds. */

const RGB: [number, number, number] = [107, 170, 138];
const STATES = ARIA_WAVEFORM_STATES.map(
  (s) => [s, makeAriaWaveformDraw(s)] as const,
);

// Avatar-slot proportions: a 44px CSS slot at DPR 2.
const W = 88;
const H = 88;

describe.each(STATES)("%s hover continuity", (_state, draw) => {
  it("keeps all geometry identical when hover flips at the same t", () => {
    const t = 123.456;

    const idle = recordingCtx();
    draw(idle.ctx, W, H, RGB, 0, t, "dark");

    const hot = recordingCtx();
    draw(hot.ctx, W, H, RGB, 1, t, "dark");

    expect(hot.rec).toEqual(idle.rec);
  });
});

describe.each(STATES)("%s scheme independence", (_state, draw) => {
  it("draws identical geometry under dark and light scheme at the same t", () => {
    const t = 123.456;

    const dark = recordingCtx();
    draw(dark.ctx, W, H, RGB, 0.4, t, "dark");

    const light = recordingCtx();
    draw(light.ctx, W, H, RGB, 0.4, t, "light");

    expect(light.rec).toEqual(dark.rec);
  });
});

describe.each(STATES)("%s static frame", (_state, draw) => {
  it("draws a non-empty glyph at t=0 for the reduced-motion frame", () => {
    const { ctx, rec } = recordingCtx();
    draw(ctx, W, H, RGB, 0, 0, "dark");
    const primitives = rec.arcs.length + rec.lines.length + rec.rects.length;
    // Ring arc + 12 ticks (2 points each) + waveform polyline + glow wash.
    expect(primitives).toBeGreaterThan(20);
  });
});

/** Isolates waveform polyline points from the ring ticks. The wave spans
    |x-cx| <= 0.30m with |dy| <= 0.308m (emphasis spike + ripple); the
    nearest tick endpoints inside that x-range sit at |dy| >= 0.346m (the
    60-degree ticks' inner ends, sin(60) * 0.40m). 0.33 splits the bands.
    If the wave ever escaped the band it would also fail the point-count
    guard below. */
const waveOf = (lines: [number, number][]): [number, number][] =>
  lines.filter(
    ([x, y]) =>
      Math.abs(x - W / 2) < W * 0.31 && Math.abs(y - H / 2) < H * 0.33,
  );

describe("state semantics", () => {
  it("deadpan is a literally flat centerline (bible: a flat steady line)", () => {
    const { ctx, rec } = recordingCtx();
    makeAriaWaveformDraw("deadpan")(ctx, W, H, RGB, 0, 7.89, "dark");
    const wave = waveOf(rec.lines);
    expect(wave.length).toBeGreaterThan(40);
    for (const [, y] of wave) {
      expect(Math.abs(y - H / 2)).toBeLessThan(0.001);
    }
  });

  it("every pair of states draws distinct waveform geometry at the same t", () => {
    const t = 3.21;
    const recs = ARIA_WAVEFORM_STATES.map((s) => {
      const { ctx, rec } = recordingCtx();
      makeAriaWaveformDraw(s)(ctx, W, H, RGB, 0, t, "dark");
      return [s, rec.lines] as const;
    });
    for (let i = 0; i < recs.length; i++) {
      for (let j = i + 1; j < recs.length; j++) {
        expect(
          recs[i]![1],
          `${recs[i]![0]} and ${recs[j]![0]} drew identical waveforms`,
        ).not.toEqual(recs[j]![1]);
      }
    }
  });

  it("emphasis shows its tall spike at the t=0 signature frame", () => {
    const { ctx, rec } = recordingCtx();
    makeAriaWaveformDraw("emphasis")(ctx, W, H, RGB, 0, 0, "dark");
    const wave = waveOf(rec.lines);
    const peak = Math.min(...wave.map(([, y]) => y));
    // The spike rises well above the resting ripple, toward the ring.
    expect(H / 2 - peak).toBeGreaterThan(H * 0.2);
  });
});

/* ── Style locks ── same shape as theme-scenes.test.ts. Re-goldening after
   an INTENTIONAL dark art change: update EVERY field of the changed state's
   GOLDEN entry (all five); the summary is compared with a single toEqual,
   so one failing run prints the complete fresh object. */

const alphaOf = (style: unknown): number =>
  typeof style === "string" ? parseFloat(style.split(",")[3] ?? "0") : NaN;

/* All four states share one capture today because styling is deliberately
   state-invariant: a state changes the waveform's geometry, never its paint.
   Kept per-state anyway (theme-scenes idiom) so a state quietly gaining its
   own styling shows up as a lock break, not a silent drift. maxFillAlpha is
   NaN: the only fill is the glow wash, a gradient, which the plain-paint
   scan skips by design (its stops are swept in the light-invariants test). */
const ARIA_GOLDEN = {
  fills: 1,
  strokes: 14,
  maxFillAlpha: NaN,
  maxStrokeAlpha: 1.275,
  sha: "0632b210bb25dbcf9df7e151a756735d585382e16bc04ecfcdc1cc657942a66b",
};

const GOLDEN: Record<
  AriaWaveformState,
  {
    fills: number;
    strokes: number;
    maxFillAlpha: number;
    maxStrokeAlpha: number | null;
    sha: string;
  }
> = {
  neutral: { ...ARIA_GOLDEN },
  emphasis: { ...ARIA_GOLDEN },
  deadpan: { ...ARIA_GOLDEN },
  alarm: { ...ARIA_GOLDEN },
};

describe.each(STATES)("%s style lock", (state, draw) => {
  it("matches the dark golden style capture at the t=0 signature frame, hot=1", () => {
    const { ctx, styles } = recordingCtx();
    draw(ctx, W, H, RGB, 1, 0, "dark");

    // Structural op locks: the glow wash composites source-over; every
    // other dark mark is additive.
    expect(styles.fills[0]?.op).toBe("source-over");
    expect(styles.fills.slice(1).every((f) => f.op === "lighter")).toBe(true);
    expect(styles.strokes.every((s) => s.op === "lighter")).toBe(true);

    const plainFillAlphas = styles.fills
      .map((f) => alphaOf(f.style))
      .filter((a) => !Number.isNaN(a));
    const plainStrokeAlphas = styles.strokes
      .map((s) => alphaOf(s.style))
      .filter((a) => !Number.isNaN(a));
    expect({
      fills: styles.fills.length,
      strokes: styles.strokes.length,
      maxFillAlpha: plainFillAlphas.length ? Math.max(...plainFillAlphas) : NaN,
      maxStrokeAlpha: plainStrokeAlphas.length
        ? Math.max(...plainStrokeAlphas)
        : null,
      sha: createHash("sha256").update(JSON.stringify(styles)).digest("hex"),
    }).toEqual(GOLDEN[state]);
  });

  it("light scheme clamps every alpha at 0.9 and never composites additively", () => {
    for (const [hot, t] of [
      [1, 0],
      [0.4, 123.456],
    ] as const) {
      const { ctx, styles } = recordingCtx();
      draw(ctx, W, H, RGB, hot, t, "light");

      const plainAlphas = [
        ...styles.fills.map((f) => alphaOf(f.style)),
        ...styles.strokes.map((s) => alphaOf(s.style)),
      ].filter((a) => !Number.isNaN(a));
      if (plainAlphas.length) {
        expect(Math.max(...plainAlphas)).toBeLessThanOrEqual(0.9);
      }
      const gradientAlphas = [
        ...gradientStopAlphas(styles.fills),
        ...gradientStopAlphas(styles.strokes),
      ];
      if (gradientAlphas.length) {
        expect(Math.max(...gradientAlphas)).toBeLessThanOrEqual(0.9);
      }

      const ops = new Set([
        ...styles.fills.map((f) => f.op),
        ...styles.strokes.map((s) => s.op),
      ]);
      expect(ops.has("lighter")).toBe(false);
      expect([...ops].sort()).toEqual(["multiply", "source-over"]);
    }
  });
});
