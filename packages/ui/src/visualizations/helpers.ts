/**
 * Canonical 6 skill axes, in render order (top, then clockwise).
 * Mirrors VALID_SKILL_AXES in apps/api/src/routes/skill-events.ts.
 */
export const SKILL_AXIS_ORDER = [
  "data_prep",
  "model_arch",
  "training",
  "evaluation",
  "deployment",
  "js_integration",
] as const;

export type SkillAxisName = (typeof SKILL_AXIS_ORDER)[number];

/**
 * Returns the 6 vertex coordinates of a top-pointing regular hexagon.
 * Order: top, upper-right, lower-right, bottom, lower-left, upper-left.
 * SVG y axis is inverted (down is positive), so we subtract sin from cy.
 */
export function hexCorners(
  cx: number,
  cy: number,
  r: number,
): Array<[number, number]> {
  const angles = [90, 30, -30, -90, -150, 150]; // degrees from +x axis, CCW
  return angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
  });
}

/**
 * Converts a series of points into a staircase polyline string.
 * Between consecutive points (x_n, y_n) → (x_{n+1}, y_{n+1}), inserts
 * an intermediate point (x_{n+1}, y_n) so the line moves horizontally
 * before stepping vertically. Output is space-separated "x,y" pairs
 * suitable for <polyline points="…" />.
 */
export function stepPath(
  points: ReadonlyArray<readonly [number, number]>,
): string {
  if (points.length === 0) return "";
  const parts: string[] = [`${points[0][0]},${points[0][1]}`];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    parts.push(`${curr[0]},${prev[1]}`); // horizontal step
    parts.push(`${curr[0]},${curr[1]}`); // vertical step
  }
  return parts.join(" ");
}
