import { describe, it, expect } from "vitest";
import { drawOrbit } from "./orbit-canvas";

/* drawOrbit is time-parameterized: every position is a pure function of t.
   The hover boost must therefore never feed into position math; a discrete
   speed multiplier on absolute time rescales the whole elapsed history and
   teleports every particle the moment hover flips. Hover may only change
   styling (alpha/brightness); the caller speeds time up by advancing its
   accumulated clock faster. */

interface Recorded {
  arcs: [number, number, number][];
  lines: [number, number][];
}

function recordingCtx(): { ctx: CanvasRenderingContext2D; rec: Recorded } {
  const rec: Recorded = { arcs: [], lines: [] };
  const gradient = { addColorStop: () => {} };
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalCompositeOperation: "",
    createRadialGradient: () => gradient,
    fillRect: () => {},
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    fill: () => {},
    stroke: () => {},
    arc: (x: number, y: number, r: number) => {
      rec.arcs.push([x, y, r]);
    },
    moveTo: (x: number, y: number) => {
      rec.lines.push([x, y]);
    },
    lineTo: (x: number, y: number) => {
      rec.lines.push([x, y]);
    },
  } as unknown as CanvasRenderingContext2D;
  return { ctx, rec };
}

describe("drawOrbit hover continuity", () => {
  it("keeps every particle and ring-path position identical when hover flips at the same t", () => {
    // A long-lived page: with a hover speed multiplier applied to absolute
    // time, the position error grows with t, so a large t makes any
    // discontinuity obvious.
    const t = 123.456;
    const rgb: [number, number, number] = [107, 170, 138];

    const idle = recordingCtx();
    drawOrbit(idle.ctx, 1000, 600, rgb, 0, t);

    const hot = recordingCtx();
    drawOrbit(hot.ctx, 1000, 600, rgb, 1, t);

    expect(hot.rec.arcs).toEqual(idle.rec.arcs);
    expect(hot.rec.lines).toEqual(idle.rec.lines);
  });
});
