import { describe, it, expect } from "vitest";
import {
  drawNeonProtocol,
  drawSignalWard,
  drawNovaCanvas,
  drawTerraGrid,
} from "./world-scenes";
import {
  recordingCtx,
  gradientStopAlphas,
  styleCaptureSha,
  canonRound,
} from "./test-utils/recording-canvas";

/* Same contract as drawOrbit (see orbit-canvas.test.ts): every scene is
   time-parameterized — positions are pure functions of t, and the eased
   hover amount may only change styling. If hot ever leaks into geometry,
   flipping hover teleports the scene mid-animation. These tests record
   every geometry call and require identical output at hot=0 and hot=1.

   recordingCtx (shared with orbit-canvas.test.ts, see
   ./test-utils/recording-canvas.ts) captures every geometry-producing call,
   including fillRect args — so a light-art redesign (Task 10) can't sneak a
   positioned rect past this lock either.

   The second suite pins the reduced-motion promise: the static frame at
   t=0 must actually show the scene's signature moment, not a blank. */

type Scene = typeof drawNeonProtocol;

const SCENES: [string, Scene][] = [
  ["drawNeonProtocol", drawNeonProtocol],
  ["drawSignalWard", drawSignalWard],
  ["drawNovaCanvas", drawNovaCanvas],
  ["drawTerraGrid", drawTerraGrid],
];

const RGB: [number, number, number] = [196, 149, 53];

describe.each(SCENES)("%s hover continuity", (_name, draw) => {
  it("keeps all geometry identical when hover flips at the same t", () => {
    // Large t: with hover leaking into position math, error grows with
    // elapsed time, so a long-lived page makes any leak obvious.
    const t = 123.456;

    const idle = recordingCtx();
    draw(idle.ctx, 1000, 400, RGB, 0, t, "dark");

    const hot = recordingCtx();
    draw(hot.ctx, 1000, 400, RGB, 1, t, "dark");

    expect(hot.rec).toEqual(idle.rec);
  });
});

describe.each(SCENES)("%s scheme independence", (_name, draw) => {
  it("draws identical geometry under dark and light scheme at the same t", () => {
    // The light art redesign (Task 10) may only change styling — never
    // position. Recording every geometry call under both schemes and
    // diffing locks that contract before the art work lands.
    const t = 123.456;

    const dark = recordingCtx();
    draw(dark.ctx, 1000, 400, RGB, 0.4, t, "dark");

    const light = recordingCtx();
    draw(light.ctx, 1000, 400, RGB, 0.4, t, "light");

    expect(light.rec).toEqual(dark.rec);
  });
});

describe.each(SCENES)("%s static frame", (_name, draw) => {
  it("draws a non-empty scene at t=0 for the reduced-motion frame", () => {
    const { ctx, rec } = recordingCtx();
    draw(ctx, 1000, 400, RGB, 0, 0, "dark");
    const primitives =
      rec.arcs.length +
      rec.ellipses.length +
      rec.lines.length +
      rec.rects.length;
    expect(primitives).toBeGreaterThan(20);
  });
});

describe("signature layers present at t=0", () => {
  // Each scene phase-shifts its clock so the reduced-motion static frame
  // lands on the signature moment. Pin that per scene.
  it("Neon Protocol shows locked detection brackets", () => {
    const { ctx, rec } = recordingCtx();
    drawNeonProtocol(ctx, 1000, 400, RGB, 0, 0, "dark");
    // Brackets are stroked 3-point polylines; the confidence bars add
    // 2-point lines. Without any lock, only bars/none would appear.
    expect(rec.lines.length).toBeGreaterThan(12);
  });

  it("Nova Canvas is fully formed (rose outline traced)", () => {
    const { ctx, rec } = recordingCtx();
    drawNovaCanvas(ctx, 1000, 400, RGB, 0, 0, "dark");
    // The outline only draws when formation m > 0.65; it contributes 121
    // polyline points on its own.
    expect(rec.lines.length).toBeGreaterThan(100);
  });

  it("Terra Grid has live pings", () => {
    const { ctx, rec } = recordingCtx();
    drawTerraGrid(ctx, 1000, 400, RGB, 0, 0, "dark");
    expect(rec.ellipses.length).toBe(5);
  });
});

/* ── Style locks ── inherited from orbit-canvas.test.ts's pattern (see
   there for the dark-regression that motivated them): the geometry locks
   above are blind to styling, so each scene's DARK styled output is pinned
   as a canonicalized capture (floats rounded to 10 significant digits, see
   recording-canvas.ts) at hot=1, t=0 — t=0 is each scene's phase-shifted
   signature frame, which keeps conditional styling branches (Nova's rose
   outline, Neon's locked brackets, Terra's pings) inside the capture —
   plus a light complement asserting ink mode's global invariants.

   Re-goldening after an INTENTIONAL dark art change: update EVERY field of
   the changed scene's GOLDEN entry — `fills`, `strokes`, `maxFillAlpha`,
   `maxStrokeAlpha`, AND `sha` (all five; a partial update leaves the lock
   asserting a hybrid that can never pass). The summary is compared with a
   single toEqual, so one failing run prints the complete fresh object —
   copy it verbatim. If you didn't mean to touch dark, you regressed it. */

const alphaOf = (style: unknown): number =>
  typeof style === "string" ? parseFloat(style.split(",")[3] ?? "0") : NaN;

const GOLDEN: Record<
  string,
  {
    fills: number;
    strokes: number;
    maxFillAlpha: number;
    maxStrokeAlpha: number | null;
    sha: string;
  }
> = {
  drawNeonProtocol: {
    fills: 73,
    strokes: 24,
    maxFillAlpha: 0.9318065009,
    maxStrokeAlpha: 0.8531575524,
    sha: "7dc10c4544b91d57125f72be5db930fc7e0abec1f9497667d73a0c90c23b907f",
  },
  drawSignalWard: {
    fills: 33,
    strokes: 2,
    maxFillAlpha: 0.6543078599,
    maxStrokeAlpha: 0.4673627571,
    sha: "e83a3c2598ec1a44a0eed71870d971b513d2912bd13f2df67008df1c67f06a6e",
  },
  drawNovaCanvas: {
    fills: 117,
    strokes: 1,
    maxFillAlpha: 1.53,
    maxStrokeAlpha: 0.5,
    sha: "e9eecbc908dbf9daa5881fec43caf80713ada07f1f36d5acf8e47385f53fd74c",
  },
  drawTerraGrid: {
    fills: 24,
    strokes: 27,
    maxFillAlpha: 0.9,
    maxStrokeAlpha: 0.2752610363,
    sha: "12716c6536afe16f02b0d73c69c7c317a44723edef57cbcf3b6f1be9e968c7a2",
  },
};

describe.each(SCENES)("%s style lock", (name, draw) => {
  it("matches the dark golden style capture at the t=0 signature frame, hot=1", () => {
    const { ctx, styles } = recordingCtx();
    draw(ctx, 1000, 400, RGB, 1, 0, "dark");

    // Structural op locks, asserted separately for a readable failure: the
    // nebula wash composites source-over; every other dark mark is additive.
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
      // canonRound on the alphas and styleCaptureSha on the capture: raw
      // float bits differ across CPU architectures, so exact-equality locks
      // must compare canonicalized values (see recording-canvas.ts).
      maxFillAlpha: canonRound(Math.max(...plainFillAlphas)),
      maxStrokeAlpha: plainStrokeAlphas.length
        ? canonRound(Math.max(...plainStrokeAlphas))
        : null,
      sha: styleCaptureSha(styles),
    }).toEqual(GOLDEN[name]);
  });

  it("light scheme clamps every plain-paint alpha at 0.9 and never composites additively", () => {
    // Ink mode's premise: bounded-body marks (scaleA clamp ≤ 0.9) pooled
    // via multiply, soft fields glazed source-over — "lighter" is
    // dark-only. Swept at two (hot, t) points so both the signature frame
    // and a long-lived mid-cycle frame pass their paints through.
    for (const [hot, t] of [
      [1, 0],
      [0.4, 123.456],
    ] as const) {
      const { ctx, styles } = recordingCtx();
      draw(ctx, 1000, 400, RGB, hot, t, "light");

      const plainFillAlphas = styles.fills
        .map((f) => alphaOf(f.style))
        .filter((a) => !Number.isNaN(a));
      expect(Math.max(...plainFillAlphas)).toBeLessThanOrEqual(0.9);
      const plainStrokeAlphas = styles.strokes
        .map((s) => alphaOf(s.style))
        .filter((a) => !Number.isNaN(a));
      if (plainStrokeAlphas.length) {
        expect(Math.max(...plainStrokeAlphas)).toBeLessThanOrEqual(0.9);
      }

      // Gradient fills (nebula washes, Neon's scan beam, Nova's bloom,
      // Terra's ground wash) are captured as a stop array, not a string —
      // alphaOf(...) is NaN for those and the plain-paint scans above
      // silently skip them. Parse every stop's own alpha so an unclamped
      // wash stop can't hide behind the plain-paint scan.
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
