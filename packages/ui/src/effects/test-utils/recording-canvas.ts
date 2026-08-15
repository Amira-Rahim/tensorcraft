/**
 * Shared geometry-recording mock CanvasRenderingContext2D, used by
 * orbit-canvas.test.ts and world-scenes.test.ts to lock the SceneDraw
 * contract: every position must be a pure function of t; `hot`/`scheme` may
 * only affect styling. Both test files record EVERY geometry-producing call
 * (arcs, ellipses, line segments, quadratic curves, filled rects) and diff
 * across hover states / color schemes — nothing here is discarded, because
 * a discarded call is exactly the gap a future draw function (Task 9/10's
 * light art redesign) could sneak scheme- or hover-dependent geometry
 * through undetected. (A prior version of this recorder discarded fillRect
 * args entirely; extracting it here also fixed that.)
 *
 * Extracted to one module (rather than duplicated per test file) so the two
 * scene families can't drift into checking different geometry — a real gap
 * already bit once (fillRect wasn't captured until a review caught it).
 *
 * STYLE capture (added with Task 9's review): geometry-only recording left
 * alpha/color regressions invisible — a scheme-scaling helper that clamped
 * dark alphas passed the whole suite. Every fill()/fillRect()/stroke() now
 * also snapshots the active fillStyle/strokeStyle (gradients as their
 * recorded color-stop lists), globalCompositeOperation, and lineWidth, so a
 * test can golden-lock the styled output of a scheme, not just its shapes.
 */

import { createHash } from "node:crypto";

/** Canonical rounding for style-capture assertions. Raw shortest-round-trip
    float printing is architecture-sensitive at the ulp level: the same
    trig-heavy draw math produced different last bits on macOS arm64 (where
    the goldens were authored) and CI's linux x64, so a byte-for-byte hash
    of a raw capture is only stable on the machine that authored it. Ten
    significant digits sit far above ulp noise and far below any styling
    change worth locking. */
export const canonRound = (n: number): number => Number(n.toPrecision(10));

const NUM_IN_STRING = /-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g;

/** sha256 of a style capture with every number canonicalized via
    `canonRound`, including floats embedded inside paint strings (the
    `rgba(...)` alpha channel is where the cross-platform bits actually
    surfaced). Golden-lock tests must hash through this, never through a
    raw JSON.stringify of the capture. */
export const styleCaptureSha = (styles: RecordedStyles): string =>
  createHash("sha256")
    .update(
      JSON.stringify(styles, (_key, value) =>
        typeof value === "number"
          ? canonRound(value)
          : typeof value === "string"
            ? value.replace(NUM_IN_STRING, (m) => String(canonRound(Number(m))))
            : value,
      ),
    )
    .digest("hex");

export interface RecordedGeometry {
  arcs: [number, number, number][];
  ellipses: [number, number, number, number, number, number, number][];
  lines: [number, number][];
  curves: [number, number, number, number][];
  rects: [number, number, number, number][];
}

/** A paint snapshot: a color string as-is, or a gradient serialized as its
    addColorStop calls in order. */
export type RecordedPaint = string | [number, string][];

export interface RecordedStyles {
  /** One entry per fill()/fillRect(), in draw order. */
  fills: { style: RecordedPaint; op: string }[];
  /** One entry per stroke(), in draw order. */
  strokes: { style: RecordedPaint; op: string; lineWidth: number }[];
}

interface RecordingGradient {
  addColorStop: (offset: number, color: string) => void;
  stops: [number, string][];
}

const makeGradient = (): RecordingGradient => {
  const stops: [number, string][] = [];
  return {
    stops,
    addColorStop: (offset: number, color: string) => {
      stops.push([offset, color]);
    },
  };
};

const paintOf = (style: unknown): RecordedPaint =>
  typeof style === "string"
    ? style
    : [...((style as RecordingGradient).stops ?? [])];

/** Alpha channel of a single `rgba(...)` string, parsed the same way the
    style-lock tests parse plain fillStyle/strokeStyle alphas. */
const parseAlpha = (color: string): number =>
  parseFloat(color.split(",")[3] ?? "0");

/** Every gradient color-stop's own alpha, flattened across a whole
    fills/strokes capture array — contributes nothing for plain-string
    entries. A gradient's captured style serializes as its addColorStop()
    stop list (see `paintOf` above), not a string, so a plain
    `alphaOf(style)` scan (which only handles strings) returns NaN for it
    and gets filtered out — silently exempting every gradient stop (nebula
    washes, scan beams, bloom glazes, ground washes) from an alpha-bound
    sweep built only on that scan. Callers that need EVERY alpha a scene
    paints, not just plain-paint ones, should combine both scans. */
export const gradientStopAlphas = (
  entries: { style: RecordedPaint }[],
): number[] =>
  entries.flatMap(({ style }) =>
    Array.isArray(style) ? style.map(([, color]) => parseAlpha(color)) : [],
  );

export function recordingCtx(): {
  ctx: CanvasRenderingContext2D;
  rec: RecordedGeometry;
  styles: RecordedStyles;
} {
  const rec: RecordedGeometry = {
    arcs: [],
    ellipses: [],
    lines: [],
    curves: [],
    rects: [],
  };
  const styles: RecordedStyles = { fills: [], strokes: [] };
  // Style state lives in closure variables (exposed via accessors) so the
  // recording methods can read it without the object referencing itself.
  let fillStyle: unknown = "";
  let strokeStyle: unknown = "";
  let lineWidth = 0;
  let compositeOp = "source-over";
  const ctx = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(v: unknown) {
      fillStyle = v;
    },
    get strokeStyle() {
      return strokeStyle;
    },
    set strokeStyle(v: unknown) {
      strokeStyle = v;
    },
    get lineWidth() {
      return lineWidth;
    },
    set lineWidth(v: number) {
      lineWidth = v;
    },
    get globalCompositeOperation() {
      return compositeOp;
    },
    set globalCompositeOperation(v: string) {
      compositeOp = v;
    },
    createRadialGradient: () => makeGradient(),
    createLinearGradient: () => makeGradient(),
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    fill: () => {
      styles.fills.push({ style: paintOf(fillStyle), op: compositeOp });
    },
    stroke: () => {
      styles.strokes.push({
        style: paintOf(strokeStyle),
        op: compositeOp,
        lineWidth,
      });
    },
    fillRect: (x: number, y: number, w: number, h: number) => {
      rec.rects.push([x, y, w, h]);
      styles.fills.push({ style: paintOf(fillStyle), op: compositeOp });
    },
    arc: (x: number, y: number, r: number) => {
      rec.arcs.push([x, y, r]);
    },
    ellipse: (
      x: number,
      y: number,
      rx: number,
      ry: number,
      rot: number,
      a0: number,
      a1: number,
    ) => {
      rec.ellipses.push([x, y, rx, ry, rot, a0, a1]);
    },
    moveTo: (x: number, y: number) => {
      rec.lines.push([x, y]);
    },
    lineTo: (x: number, y: number) => {
      rec.lines.push([x, y]);
    },
    quadraticCurveTo: (cx: number, cy: number, x: number, y: number) => {
      rec.curves.push([cx, cy, x, y]);
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, rec, styles };
}
