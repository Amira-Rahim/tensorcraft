import { describe, it, expect } from "vitest";
import {
  drawNeonProtocol,
  drawSignalWard,
  drawNovaCanvas,
  drawTerraGrid,
} from "./theme-scenes";

/* Same contract as drawOrbit (see orbit-canvas.test.ts): every scene is
   time-parameterized — positions are pure functions of t, and the eased
   hover amount may only change styling. If hot ever leaks into geometry,
   flipping hover teleports the scene mid-animation. These tests record
   every geometry call and require identical output at hot=0 and hot=1.

   The second suite pins the reduced-motion promise: the static frame at
   t=0 must actually show the scene's signature moment, not a blank. */

type Scene = typeof drawNeonProtocol;

const SCENES: [string, Scene][] = [
  ["drawNeonProtocol", drawNeonProtocol],
  ["drawSignalWard", drawSignalWard],
  ["drawNovaCanvas", drawNovaCanvas],
  ["drawTerraGrid", drawTerraGrid],
];

interface Recorded {
  arcs: [number, number, number][];
  ellipses: [number, number, number, number][];
  lines: [number, number][];
  curves: [number, number, number, number][];
  rects: [number, number, number, number][];
}

function recordingCtx(): { ctx: CanvasRenderingContext2D; rec: Recorded } {
  const rec: Recorded = {
    arcs: [],
    ellipses: [],
    lines: [],
    curves: [],
    rects: [],
  };
  const gradient = { addColorStop: () => {} };
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    globalCompositeOperation: "",
    createRadialGradient: () => gradient,
    createLinearGradient: () => gradient,
    clearRect: () => {},
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: (x: number, y: number, fw: number, fh: number) => {
      rec.rects.push([x, y, fw, fh]);
    },
    arc: (x: number, y: number, r: number) => {
      rec.arcs.push([x, y, r]);
    },
    ellipse: (x: number, y: number, rx: number, ry: number) => {
      rec.ellipses.push([x, y, rx, ry]);
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
  return { ctx, rec };
}

const RGB: [number, number, number] = [196, 149, 53];

describe.each(SCENES)("%s hover continuity", (_name, draw) => {
  it("keeps all geometry identical when hover flips at the same t", () => {
    // Large t: with hover leaking into position math, error grows with
    // elapsed time, so a long-lived page makes any leak obvious.
    const t = 123.456;

    const idle = recordingCtx();
    draw(idle.ctx, 1000, 400, RGB, 0, t);

    const hot = recordingCtx();
    draw(hot.ctx, 1000, 400, RGB, 1, t);

    expect(hot.rec).toEqual(idle.rec);
  });
});

describe.each(SCENES)("%s static frame", (_name, draw) => {
  it("draws a non-empty scene at t=0 for the reduced-motion frame", () => {
    const { ctx, rec } = recordingCtx();
    draw(ctx, 1000, 400, RGB, 0, 0);
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
    drawNeonProtocol(ctx, 1000, 400, RGB, 0, 0);
    // Brackets are stroked 3-point polylines; the confidence bars add
    // 2-point lines. Without any lock, only bars/none would appear.
    expect(rec.lines.length).toBeGreaterThan(12);
  });

  it("Nova Canvas is fully formed (rose outline traced)", () => {
    const { ctx, rec } = recordingCtx();
    drawNovaCanvas(ctx, 1000, 400, RGB, 0, 0);
    // The outline only draws when formation m > 0.65; it contributes 121
    // polyline points on its own.
    expect(rec.lines.length).toBeGreaterThan(100);
  });

  it("Terra Grid has live pings", () => {
    const { ctx, rec } = recordingCtx();
    drawTerraGrid(ctx, 1000, 400, RGB, 0, 0);
    expect(rec.ellipses.length).toBe(5);
  });
});
