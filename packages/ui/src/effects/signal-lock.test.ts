import { describe, it, expect } from "vitest";
import { drawSignalLock, BOOT_DURATION } from "./signal-lock";
import { drawOrbit } from "./orbit-canvas";
import { recordingCtx } from "./test-utils/recording-canvas";

const RGB: [number, number, number] = [107, 170, 138];
const MID_BOOT = 1.0;
const SETTLED = BOOT_DURATION + 2;

describe("signal lock hover continuity", () => {
  it.each([MID_BOOT, 2.6, SETTLED])(
    "keeps all geometry identical when hover flips at t=%s",
    (t) => {
      const a = recordingCtx();
      const b = recordingCtx();
      drawSignalLock(a.ctx, 800, 400, RGB, 0, t, "dark");
      drawSignalLock(b.ctx, 800, 400, RGB, 1, t, "dark");
      expect(b.rec).toEqual(a.rec);
    },
  );
});

describe("signal lock scheme independence", () => {
  it.each([MID_BOOT, 2.6, SETTLED])(
    "draws identical geometry under dark and light scheme at t=%s",
    (t) => {
      const dark = recordingCtx();
      const light = recordingCtx();
      drawSignalLock(dark.ctx, 800, 400, RGB, 0.5, t, "dark");
      drawSignalLock(light.ctx, 800, 400, RGB, 0.5, t, "light");
      expect(light.rec).toEqual(dark.rec);
    },
  );
});

describe("signal lock boot frames", () => {
  it("draws a non-empty static frame at t=0 (resolving noise)", () => {
    const { ctx, rec } = recordingCtx();
    drawSignalLock(ctx, 800, 400, RGB, 0, 0, "dark");
    expect(rec.rects.length).toBeGreaterThan(0);
  });

  it("draws the ring draw-in mid-boot", () => {
    const { ctx, rec } = recordingCtx();
    drawSignalLock(ctx, 800, 400, RGB, 0, 1.6, "dark");
    expect(rec.ellipses.length).toBeGreaterThan(0);
  });
});

describe("signal lock settled delegation", () => {
  it("is exactly drawOrbit past the boot, geometry and styles", () => {
    const boot = recordingCtx();
    const orbit = recordingCtx();
    drawSignalLock(boot.ctx, 800, 400, RGB, 0.45, SETTLED, "dark");
    drawOrbit(orbit.ctx, 800, 400, RGB, 0.45, SETTLED, "dark");
    expect(boot.rec).toEqual(orbit.rec);
    expect(boot.styles).toEqual(orbit.styles);
  });

  it("draws no boot ellipses past the crossfade", () => {
    // drawOrbit never calls ellipse(); the boot rings do. An empty ellipse
    // list past the boot proves the theatrics fully retire.
    const { ctx, rec } = recordingCtx();
    drawSignalLock(ctx, 800, 400, RGB, 0, SETTLED, "dark");
    expect(rec.ellipses).toEqual([]);
  });
});
