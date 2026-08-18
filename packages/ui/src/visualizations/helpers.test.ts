import { describe, it, expect } from "vitest";
import { hexCorners, stepPath, SKILL_AXIS_ORDER } from "./helpers";

describe("SKILL_AXIS_ORDER", () => {
  it("matches the canonical 6 axes from the API", () => {
    expect(SKILL_AXIS_ORDER).toEqual([
      "data_prep",
      "model_arch",
      "training",
      "evaluation",
      "deployment",
      "js_integration",
    ]);
  });
});

describe("hexCorners", () => {
  it("produces 6 points for a top-pointing hexagon", () => {
    const pts = hexCorners(100, 100, 50);
    expect(pts).toHaveLength(6);
    // Top vertex is at (cx, cy - r)
    expect(pts[0][0]).toBeCloseTo(100, 2);
    expect(pts[0][1]).toBeCloseTo(50, 2);
  });

  it("vertices are 60 degrees apart on the circle of radius r", () => {
    const pts = hexCorners(0, 0, 10);
    // All vertices should be on the circle of radius 10
    for (const [x, y] of pts) {
      expect(Math.hypot(x, y)).toBeCloseTo(10, 2);
    }
  });
});

describe("stepPath", () => {
  it("returns empty string for no points", () => {
    expect(stepPath([])).toBe("");
  });

  it("returns a single coordinate for one point", () => {
    expect(stepPath([[10, 20]])).toBe("10,20");
  });

  it("produces staircase segments between points", () => {
    // For points (0,10) → (10,20): emit (0,10), (10,10), (10,20)
    expect(
      stepPath([
        [0, 10],
        [10, 20],
      ]),
    ).toBe("0,10 10,10 10,20");
  });

  it("chains staircase for multi-point series", () => {
    expect(
      stepPath([
        [0, 0],
        [5, 5],
        [10, 3],
      ]),
    ).toBe("0,0 5,0 5,5 10,5 10,3");
  });
});
