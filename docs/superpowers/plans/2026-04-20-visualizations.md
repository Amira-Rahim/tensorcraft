# Visualizations (SkillRadar + LossCurve) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **User's commit rule:** Per `CLAUDE.md`, NEVER run `git add`, `git commit`, or `git push` on behalf of the user. Each task ends with "Report completion and stop" — the user commits manually after review.

**Spec:** [docs/superpowers/specs/2026-04-20-visualizations-design.md](../specs/2026-04-20-visualizations-design.md)

**Goal:** Build two static SVG dashboard visualizations — `SkillRadar` (6-axis hex radar for active theme's skill proficiency) and `LossCurve` (staircase line of rolling 7-day avg hints per exercise over 12 weeks) — with hand-rolled SVG, zero new deps, brutalist code-comment aesthetic.

**Architecture:** New `LossCurve` component + shared geometry helpers live in `packages/ui/src/visualizations/`. Existing [`apps/web/app/dashboard/skill-genome.tsx`](../../../apps/web/app/dashboard/skill-genome.tsx) gets refactored in place to apply the Option C "Code Comment" style (no concentric rings, no data-point dots, stroke-only polygon, monospace legend table). Dashboard server component adds a single new query (`exercise_attempts`) for LossCurve; the existing `skill_genome` query stays. No state, no hover/click, all values rendered as visible labels.

**Post-brainstorm updates (2026-04-20):** Plan reviewer flagged that `skill-genome.tsx` + `SkillGenome` component already ship. User confirmed "iterate in place" (Decision 1-B). Null-week dashed placeholder dropped per YAGNI (Decision 2-B). File layout simplified — no separate `skill-radar.tsx` file.

**Tech Stack:** TypeScript, React (server + client), Vitest + React Testing Library (colocated `.test.tsx`), Supabase JS client, CSS custom properties for theming (`var(--tc-primary)` etc.).

---

## Pre-flight checks

Before starting Phase 1, confirm in ~2 minutes:

- [ ] **Check 1: Verify `@tensorcraft/ui` is wired to `apps/web`**
  - Run: `grep '@tensorcraft/ui' /Users/amira.salah/Desktop/tensorcraft/apps/web/package.json`
  - Expected: `"@tensorcraft/ui": "workspace:*"` appears. If missing, STOP — the spec's package location assumption is broken; consult the user.

- [ ] **Check 2: Verify test infrastructure**
  - Run from repo root: `pnpm --filter @tensorcraft/ui test -- --run 2>&1 | tail -5`
  - Expected: tests run (exit 0 or pass count). If the command fails or hangs, STOP — fix test infra before writing new tests.

- [ ] **Check 3: Confirm palette CSS vars exist**
  - Run: `grep -E "\-\-tc-(primary|border|muted|text)" /Users/amira.salah/Desktop/tensorcraft/packages/themes/src/css/themes.css`
  - Expected: all four tokens appear. If `--tc-border` or `--tc-muted` is missing, Phase 11 §11a hasn't landed yet — STOP and flag. This plan assumes Stage 1 foundation is complete OR will land before Phase 3 integration.

---

## Phase 1 — Pure primitives (parallelizable)

### Task 1.1: Geometry helpers

**Files:**
- Create: `packages/ui/src/visualizations/helpers.ts`
- Create: `packages/ui/src/visualizations/helpers.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/visualizations/helpers.test.ts`:

```typescript
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
      "fe_integration",
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
    expect(stepPath([[0, 10], [10, 20]])).toBe("0,10 10,10 10,20");
  });

  it("chains staircase for multi-point series", () => {
    expect(stepPath([[0, 0], [5, 5], [10, 3]])).toBe(
      "0,0 5,0 5,5 10,5 10,3"
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tensorcraft/ui test -- --run helpers.test`
Expected: FAIL — module `./helpers` does not export `hexCorners`, `stepPath`, or `SKILL_AXIS_ORDER`.

- [ ] **Step 3: Implement the helpers**

Create `packages/ui/src/visualizations/helpers.ts`:

```typescript
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
  "fe_integration",
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
export function stepPath(points: ReadonlyArray<readonly [number, number]>): string {
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @tensorcraft/ui test -- --run helpers.test`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter @tensorcraft/ui typecheck` (or `tsc --noEmit` scoped to package)
Expected: no errors.

- [ ] **Step 6: Report completion and stop**

Report to user: "Task 1.1 complete. Created `helpers.ts` + test (7 tests passing). Do not commit — user reviews."

---

### Task 1.2: Data transform helpers

**Files:**
- Create: `apps/web/app/dashboard/_lib/viz-data.ts`
- Create: `apps/web/app/dashboard/_lib/viz-data.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/app/dashboard/_lib/viz-data.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { padSkillAxes, computeWeeklyHints } from "./viz-data";

describe("padSkillAxes", () => {
  it("pads missing axes with proficiency 0", () => {
    const result = padSkillAxes([
      { skill_axis: "training", proficiency: 0.5 },
    ]);
    expect(result).toHaveLength(6);
    expect(result.find((a) => a.name === "training")?.proficiency).toBe(0.5);
    expect(result.find((a) => a.name === "data_prep")?.proficiency).toBe(0);
  });

  it("orders axes deterministically in SKILL_AXIS_ORDER sequence", () => {
    const result = padSkillAxes([
      { skill_axis: "fe_integration", proficiency: 0.9 },
      { skill_axis: "data_prep", proficiency: 0.1 },
    ]);
    expect(result.map((a) => a.name)).toEqual([
      "data_prep", "model_arch", "training",
      "evaluation", "deployment", "fe_integration",
    ]);
  });

  it("ignores unknown axis names", () => {
    const result = padSkillAxes([
      { skill_axis: "unknown_axis", proficiency: 0.5 } as never,
      { skill_axis: "training", proficiency: 0.3 },
    ]);
    expect(result).toHaveLength(6);
    expect(result.find((a) => a.name === "training")?.proficiency).toBe(0.3);
  });

  it("handles empty input", () => {
    const result = padSkillAxes([]);
    expect(result).toHaveLength(6);
    expect(result.every((a) => a.proficiency === 0)).toBe(true);
  });
});

describe("computeWeeklyHints", () => {
  const monday = (iso: string) => new Date(iso + "T00:00:00Z").toISOString();

  it("buckets attempts into UTC Monday-aligned weeks", () => {
    // All within the same ISO week of 2026-04-13 (Monday)
    const result = computeWeeklyHints(
      [
        { attempted_at: "2026-04-14T10:00:00Z", hints_used: 3 },
        { attempted_at: "2026-04-16T22:00:00Z", hints_used: 5 },
      ],
      12,
      new Date("2026-04-20T00:00:00Z"),
    );
    expect(result).toHaveLength(12);
    // Week-of-2026-04-13 should have avg (3+5)/2 = 4
    const thatWeek = result.find((w) => w.weekStart === monday("2026-04-13").slice(0, 10));
    expect(thatWeek?.avgHints).toBe(4);
  });

  it("returns null avgHints for weeks with no attempts", () => {
    const result = computeWeeklyHints([], 12, new Date("2026-04-20T00:00:00Z"));
    expect(result).toHaveLength(12);
    expect(result.every((w) => w.avgHints === null)).toBe(true);
  });

  it("orders weeks oldest → newest", () => {
    const result = computeWeeklyHints([], 12, new Date("2026-04-20T00:00:00Z"));
    const starts = result.map((w) => w.weekStart);
    const sorted = [...starts].sort();
    expect(starts).toEqual(sorted);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tensorcraft/web test -- --run viz-data`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement the helpers**

Create `apps/web/app/dashboard/_lib/viz-data.ts`:

```typescript
import { SKILL_AXIS_ORDER, type SkillAxisName } from "@tensorcraft/ui";

export interface SkillAxisValue {
  name: SkillAxisName;
  proficiency: number;
}

export interface WeeklyHints {
  weekStart: string; // "YYYY-MM-DD" (Monday, UTC)
  avgHints: number | null;
}

/**
 * Ensures all 6 canonical axes are present, filling missing with 0,
 * and returns them in SKILL_AXIS_ORDER sequence. Unknown axes are discarded.
 */
export function padSkillAxes(
  rows: ReadonlyArray<{ skill_axis: string; proficiency: number }>,
): SkillAxisValue[] {
  const map = new Map<SkillAxisName, number>();
  for (const row of rows) {
    if ((SKILL_AXIS_ORDER as readonly string[]).includes(row.skill_axis)) {
      map.set(row.skill_axis as SkillAxisName, row.proficiency);
    }
  }
  return SKILL_AXIS_ORDER.map((name) => ({
    name,
    proficiency: map.get(name) ?? 0,
  }));
}

/**
 * Returns the UTC Monday (00:00:00) of the ISO week containing `d`.
 */
function utcMonday(d: Date): Date {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = copy.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const offset = dow === 0 ? -6 : 1 - dow;
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Buckets exercise attempts into N Monday-aligned UTC weeks ending at `now`'s week,
 * computing avg `hints_used` per bucket. Empty weeks → avgHints=null. Oldest first.
 */
export function computeWeeklyHints(
  attempts: ReadonlyArray<{ attempted_at: string; hints_used: number }>,
  weekCount: number,
  now: Date = new Date(),
): WeeklyHints[] {
  const currentWeekStart = utcMonday(now);
  const buckets: Array<{ weekStart: Date; total: number; count: number }> = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    buckets.push({
      weekStart: new Date(currentWeekStart.getTime() - i * MS_PER_WEEK),
      total: 0,
      count: 0,
    });
  }
  for (const a of attempts) {
    const wkStart = utcMonday(new Date(a.attempted_at)).getTime();
    const bucket = buckets.find((b) => b.weekStart.getTime() === wkStart);
    if (bucket) {
      bucket.total += a.hints_used;
      bucket.count += 1;
    }
  }
  return buckets.map((b) => ({
    weekStart: b.weekStart.toISOString().slice(0, 10),
    avgHints: b.count === 0 ? null : b.total / b.count,
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @tensorcraft/web test -- --run viz-data`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Report completion and stop**

Report: "Task 1.2 complete. Created `viz-data.ts` + test (7 tests passing). Do not commit."

---

## Phase 2 — Components (depend on Phase 1)

### Task 2.1: Refactor skill-genome.tsx → Option C style

**Files:**
- Modify: `apps/web/app/dashboard/skill-genome.tsx`
- Create (or update if exists): `apps/web/app/dashboard/skill-genome.test.tsx`

- [ ] **Step 1: Read the existing component end-to-end**

Read `apps/web/app/dashboard/skill-genome.tsx` in full. Note:
- The `AXES` constant (6 axes with `shortLabel`s and per-axis CSS color vars). The short-label grid will be dropped in favor of a mono table legend, but keep the `label` / `key` fields.
- `polarToCartesian` helper — will be replaced by `hexCorners` from `@tensorcraft/ui`.
- `RadarChart` subcomponent — this is what changes.
- The wrapping panel/empty-state code — this **stays** unless it conflicts with the new tests.
- The `values` array scale — likely 0–100 in the component's internal state (`v / 100` appears in the original). Keep that internal; format display labels by dividing by 100 before `.toFixed(2)`.

- [ ] **Step 2: Write failing tests asserting Option C invariants**

Create/update `apps/web/app/dashboard/skill-genome.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SkillGenome } from "./skill-genome";

const sampleData = [
  { skill_axis: "data_prep", proficiency: 60 },
  { skill_axis: "model_arch", proficiency: 30 },
  { skill_axis: "training", proficiency: 45 },
  { skill_axis: "evaluation", proficiency: 20 },
  { skill_axis: "deployment", proficiency: 15 },
  { skill_axis: "fe_integration", proficiency: 85 },
];

describe("SkillGenome (Option C)", () => {
  it("renders role=img with title and desc for a11y", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.querySelector("title")?.textContent).toBeTruthy();
    expect(svg?.querySelector("desc")?.textContent).toMatch(/data_prep/);
  });

  it("renders NO concentric ring polygons (Option C uses only one dashed tick)", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    // Original had 3 ring <polygon>s (0.33, 0.66, 1.0); Option C has exactly 0 ring polygons.
    // The data polygon is 1, no rings. Dashed tick is a <circle>, not <polygon>.
    const polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBe(1); // only the data polygon
  });

  it("renders exactly one dashed tick circle at 50%", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const dashed = container.querySelector("circle[stroke-dasharray]");
    expect(dashed).not.toBeNull();
  });

  it("renders NO data-point dots", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    // Non-tick circles (data dots) should be zero. The dashed 50% tick is the only circle.
    const circles = Array.from(container.querySelectorAll("circle"));
    const nonTickCircles = circles.filter((c) => !c.hasAttribute("stroke-dasharray"));
    expect(nonTickCircles.length).toBe(0);
  });

  it("data polygon has fill=none (stroke only)", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const polygon = container.querySelector("polygon");
    expect(polygon?.getAttribute("fill")).toBe("none");
  });

  it("renders mono legend table with # skill_genome header", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    expect(container.textContent).toMatch(/# skill_genome/);
    for (const axis of ["data_prep", "model_arch", "training", "evaluation", "deployment", "fe_integration"]) {
      expect(container.textContent).toContain(axis);
    }
  });

  it("values are formatted as 0.XX, not 0–100 or percentages", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    // 60/100 should render as 0.60
    expect(container.textContent).toMatch(/0\.60/);
    // And NOT as "60%" or "60"
    expect(container.textContent).not.toMatch(/60%/);
  });

  it("shows empty-state when all proficiencies are zero", () => {
    const empty = [
      { skill_axis: "data_prep", proficiency: 0 },
      { skill_axis: "model_arch", proficiency: 0 },
      { skill_axis: "training", proficiency: 0 },
      { skill_axis: "evaluation", proficiency: 0 },
      { skill_axis: "deployment", proficiency: 0 },
      { skill_axis: "fe_integration", proficiency: 0 },
    ];
    const { container } = render(<SkillGenome data={empty} />);
    expect(container.textContent).toMatch(/No activity yet/);
  });

  it("matches snapshot for typical data", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

If the existing component's data prop shape differs from the test's `{ skill_axis, proficiency }[]` form (it uses `genomeData` of some shape — check `dashboard-view.tsx:97` for the TypeScript interface), align the test input to match the actual prop contract rather than inventing one.

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @tensorcraft/web test -- --run skill-genome`
Expected: FAIL — current implementation has 3 ring polygons, data-point dots, filled polygon, 0–100 value display.

- [ ] **Step 4: Refactor the RadarChart subcomponent in `skill-genome.tsx`**

Changes inside `skill-genome.tsx` (keep everything else — imports, wrapping panel, empty-state detection, consumer API):

1. Replace `polarToCartesian` with an import: `import { hexCorners, SKILL_AXIS_ORDER } from "@tensorcraft/ui";` Then use `hexCorners(cx, cy, maxR)` to generate the 6 outer vertices.
2. **Delete** the `rings` constant and the `ringPolygons` rendering block (3 `<polygon>` elements at 0.33/0.66/1.0).
3. **Add** a single `<circle cx={cx} cy={cy} r={maxR * 0.5} fill="none" stroke="var(--tc-border)" strokeDasharray="1 3"/>` — the 50% dashed tick.
4. **Change** the data polygon: `fill="none"` (was `fill="var(--tc-primary)" fillOpacity="0.15"`), keep `stroke="var(--tc-primary)" strokeWidth="1.5"` (down from 2).
5. **Delete** the `dataPoints.map((p, i) => <circle ... r="4" />)` dot rendering block.
6. **Delete** the `labelPositions.map((lp, i) => <text ... />)` short-label rendering block around the SVG edges.
7. **Add** an adjacent HTML legend (outside the SVG) formatted as mono table — see the Option C reference in `docs/superpowers/specs/2026-04-20-visualizations-design.md` §7.1. Layout: horizontal flex, SVG on left (55%), legend on right (45%). Header: `<div style={{color: "var(--tc-muted)", fontFamily: MONO}}># skill_genome</div>`. Rows: one per axis, flex space-between, axis name in body color, value in primary color, values formatted as `(proficiency / 100).toFixed(2)`.
8. **Add** `role="img"`, a `<title>`, and a `<desc>` to the root SVG. Title: `"Skill profile"` (or include the theme name if available in props). Desc: `"Skill profile. " + axes.map(a => \`${a.name} ${(a.proficiency/100).toFixed(2)}\`).join(", ") + "."`.
9. **Empty state:** if all proficiencies are 0, render the center-text `"No activity yet"` in the SVG (currently the widget may render a different empty state — match that behavior if it already exists, else add this).
10. Remove any references to `color: axis.color` or `var(--tc-axis-*)` on the data polygon — Option C uses a single `var(--tc-primary)` for the whole polygon.

Keep the `AXES` constant's `key` + `label` fields (needed for the desc string). The `shortLabel` and per-axis `color` fields can be deleted OR kept as dead code — deletion is preferred.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tensorcraft/web test -- --run skill-genome`
Expected: PASS — all 9 tests green.

- [ ] **Step 6: Run broader web test suite to catch regressions**

Run: `pnpm --filter @tensorcraft/web test -- --run`
Expected: no new failures. If a dashboard-view snapshot breaks, regenerate it (`-u`) only after confirming the diff is intentional (per @superpowers:verification-before-completion).

- [ ] **Step 7: Report and stop**

Report: "Task 2.1 complete. `skill-genome.tsx` refactored to Option C. 9 tests passing. Do not commit."

---

### Task 2.2: LossCurve component

**Files:**
- Create: `packages/ui/src/visualizations/loss-curve.tsx`
- Create: `packages/ui/src/visualizations/loss-curve.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `packages/ui/src/visualizations/loss-curve.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LossCurve } from "./loss-curve";

function makeWeekly(values: Array<number | null>) {
  return values.map((v, i) => ({
    weekStart: `2026-0${1 + Math.floor(i / 4)}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
    avgHints: v,
  }));
}

describe("LossCurve", () => {
  const full = makeWeekly([5.0, 4.8, 4.2, 3.9, 3.5, 3.1, 2.9, 2.7, 2.5, 2.4, 2.3, 2.1]);

  it("renders role=img with title and desc", () => {
    const { container } = render(<LossCurve weekly={full} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.querySelector("title")?.textContent).toMatch(/hints per exercise/i);
    expect(svg?.querySelector("desc")?.textContent).toMatch(/2\.1|decreas/i);
  });

  it("renders the comment-style header label", () => {
    const { container } = render(<LossCurve weekly={full} />);
    expect(container.textContent).toMatch(/\/\/ loss\.hints/);
  });

  it("renders empty-state text when all avgHints are null", () => {
    const allNull = makeWeekly([null, null, null, null, null, null, null, null, null, null, null, null]);
    const { container } = render(<LossCurve weekly={allNull} />);
    expect(container.textContent).toMatch(/Complete 3\+ exercises/);
  });

  it("handles a single data point without crashing", () => {
    const single = makeWeekly([3.0]);
    expect(() => render(<LossCurve weekly={single} />)).not.toThrow();
  });

  it("matches snapshot for typical 12-week series", () => {
    const { container } = render(<LossCurve weekly={full} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tensorcraft/ui test -- --run loss-curve`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement the component**

Create `packages/ui/src/visualizations/loss-curve.tsx`:

```tsx
import { stepPath } from "./helpers";

export interface WeeklyHints {
  weekStart: string;
  avgHints: number | null;
}

export interface LossCurveProps {
  weekly: WeeklyHints[];
  className?: string;
}

const MONO = "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";
const VIEW_W = 260;
const VIEW_H = 130;
const LEFT = 30;
const RIGHT = 250;
const TOP = 20;
const BOTTOM = 115;

export function LossCurve({ weekly, className }: LossCurveProps) {
  const nonNull = weekly.filter((w): w is WeeklyHints & { avgHints: number } => w.avgHints !== null);
  const isEmpty = nonNull.length === 0;
  const isInsufficient = nonNull.length > 0 && nonNull.length < 3;

  const titleId = "lc-title";
  const descId = "lc-desc";

  const yMax = Math.max(5, ...nonNull.map((w) => w.avgHints)) + 0.5;
  const plotY = (v: number) => BOTTOM - ((v / yMax) * (BOTTOM - TOP));
  const plotX = (i: number) =>
    LEFT + (i / Math.max(1, weekly.length - 1)) * (RIGHT - LEFT);

  const points: Array<[number, number]> = [];
  weekly.forEach((w, i) => {
    if (w.avgHints !== null) points.push([plotX(i), plotY(w.avgHints)]);
  });

  const first = nonNull[0];
  const last = nonNull[nonNull.length - 1];
  const direction =
    nonNull.length < 2
      ? "single data point"
      : last.avgHints < first.avgHints
        ? "decreasing"
        : last.avgHints > first.avgHints
          ? "increasing"
          : "flat";

  const desc = isEmpty
    ? "No exercise data yet. Complete 3 or more exercises to see a trend."
    : `Rolling 7-day average hints per exercise, last ${weekly.length} weeks. ` +
      `Started at ${first.avgHints.toFixed(1)} hints in the earliest week, ` +
      `currently ${last.avgHints.toFixed(1)} hints. Trend: ${direction}.`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={className}
      style={{ width: "100%" }}
    >
      <title id={titleId}>Rolling 7-day average hints per exercise</title>
      <desc id={descId}>{desc}</desc>

      {/* Comment header */}
      <text x={LEFT} y={10} fontFamily={MONO} fontSize="9" fill="var(--tc-muted)">
        // loss.hints — {weekly.length}wk
      </text>

      {/* Baseline */}
      <line x1={LEFT} y1={BOTTOM} x2={RIGHT} y2={BOTTOM} stroke="var(--tc-border)" />

      {isEmpty ? (
        <text
          x={VIEW_W / 2}
          y={(TOP + BOTTOM) / 2}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="10"
          fill="var(--tc-muted)"
        >
          Complete 3+ exercises to see trend
        </text>
      ) : (
        <>
          {/* Staircase line */}
          <polyline
            points={stepPath(points)}
            fill="none"
            stroke="var(--tc-primary)"
            strokeWidth="1.5"
          />

          {/* Start/end labels */}
          <text
            x={LEFT}
            y={TOP - 6}
            fontFamily={MONO}
            fontSize="9"
            fill="var(--tc-muted)"
          >
            {first.avgHints.toFixed(1)} W1
          </text>
          {last !== first && (
            <text
              x={RIGHT}
              y={plotY(last.avgHints) - 6}
              fontFamily={MONO}
              fontSize="9"
              fill="var(--tc-primary)"
              textAnchor="end"
            >
              {last.avgHints.toFixed(1)} W{weekly.length}
            </text>
          )}

          {/* Insufficient-data notice */}
          {isInsufficient && (
            <text
              x={VIEW_W / 2}
              y={BOTTOM + 12}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="9"
              fill="var(--tc-muted)"
            >
              {nonNull.length} of 3+ exercises
            </text>
          )}
        </>
      )}
    </svg>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @tensorcraft/ui test -- --run loss-curve`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Report completion and stop**

Report: "Task 2.2 complete. LossCurve component + 5 tests passing."

---

### Task 2.3: Index re-exports

**Files:**
- Create: `packages/ui/src/visualizations/index.ts`
- Modify: `packages/ui/src/index.ts` (add re-exports)

- [ ] **Step 1: Create the visualizations barrel file**

Create `packages/ui/src/visualizations/index.ts`:

```typescript
export { LossCurve } from "./loss-curve";
export type { LossCurveProps, WeeklyHints } from "./loss-curve";
export { hexCorners, stepPath, SKILL_AXIS_ORDER } from "./helpers";
export type { SkillAxisName } from "./helpers";
```

- [ ] **Step 2: Add re-export to the top-level package index**

Modify `packages/ui/src/index.ts`. After the existing `export { ... } from "./mdx";` block, add:

```typescript
// Dashboard visualizations + shared geometry
export {
  LossCurve,
  hexCorners,
  stepPath,
  SKILL_AXIS_ORDER,
} from "./visualizations";
export type {
  LossCurveProps,
  WeeklyHints,
  SkillAxisName,
} from "./visualizations";
```

Note: `hexCorners` is exported because `skill-genome.tsx` in `apps/web` imports it in Task 2.1.

- [ ] **Step 3: Run typecheck and full ui test suite**

Run: `pnpm --filter @tensorcraft/ui typecheck && pnpm --filter @tensorcraft/ui test -- --run`
Expected: typecheck passes; all ui tests green including the 3 new files.

- [ ] **Step 4: Report and stop**

Report: "Task 2.3 complete. Barrel files wired. Full @tensorcraft/ui test suite green."

---

## Phase 3 — Dashboard integration (depends on Phase 2)

### Task 3.1: Dashboard server component — add LossCurve query + apply padSkillAxes

**Files:**
- Modify: `apps/web/app/dashboard/page.tsx`
- Modify: `apps/web/app/dashboard/__tests__/page.test.tsx`

- [ ] **Step 1: Read the existing dashboard page and its test**

Read in full:
- `apps/web/app/dashboard/page.tsx` — the `skill_genome` query already exists around line 100; `activeTheme` and `genomeData` derivation already in place.
- `apps/web/app/dashboard/dashboard-view.tsx` — note the existing `genomeData` prop shape (~line 97).
- `apps/web/app/dashboard/__tests__/page.test.tsx` — existing test patterns.

**What changes in this task:**
1. ADD a new `exercise_attempts` query into the existing `Promise.all`.
2. ADD a call to `computeWeeklyHints` to transform those rows into `lossCurveData`.
3. Pass `lossCurveData` as a new prop to `<DashboardView>`.
4. (Optional) Run the existing `skillGenomeRows` through `padSkillAxes` for deterministic ordering before passing to DashboardView — if the current code already passes rows through as-is, this is a safe improvement but check for consumer assumptions.

**What does NOT change:**
- The `skill_genome` query (already there).
- `activeTheme` derivation (already there).
- Any redirect / auth logic.

- [ ] **Step 2: Add failing tests**

In `apps/web/app/dashboard/__tests__/page.test.tsx`, add tests that:

1. Mock Supabase to return sample `exercise_attempts` rows alongside the existing mocks.
2. Assert `<DashboardView>` receives a `lossCurveData` prop with shape `{ weekly: Array<{ weekStart, avgHints }> }`, length 12.
3. Assert that when `exercise_attempts` returns empty, `lossCurveData.weekly` is an array of 12 entries all with `avgHints: null`.

Do NOT delete existing skill_genome assertions; the query stays.

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @tensorcraft/web test -- --run dashboard/__tests__/page`
Expected: FAIL — `lossCurveData` prop not present.

- [ ] **Step 4: Modify `apps/web/app/dashboard/page.tsx`**

Add to the existing `Promise.all([...])`:

```typescript
// exercise_attempts within last 12 weeks (for LossCurve)
supabase
  .from("exercise_attempts")
  .select("attempted_at, hints_used")
  .eq("user_id", user.id)
  .gte("attempted_at", new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString()),
```

After resolution, import and use the helper:

```typescript
import { computeWeeklyHints } from "./_lib/viz-data";

// … after the Promise.all resolves …
const lossCurveData = {
  weekly: computeWeeklyHints(exerciseAttemptRows ?? [], 12),
};
```

Pass as prop: `<DashboardView ... lossCurveData={lossCurveData} />`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter @tensorcraft/web test -- --run dashboard/__tests__/page`
Expected: PASS (including the pre-existing unauth-redirect test).

- [ ] **Step 6: Report and stop**

Report: "Task 3.1 complete. LossCurve query wired. Existing skill_genome flow untouched."

---

### Task 3.2: Dashboard view — render LossCurve

**Files:**
- Modify: `apps/web/app/dashboard/dashboard-view.tsx`
- Modify: existing dashboard-view test file (if present) OR extend `apps/web/app/dashboard/__tests__/page.test.tsx`

- [ ] **Step 1: Write failing tests for the LossCurve section**

Add a test that renders `<DashboardView>` with a sample `lossCurveData` prop and asserts:
- The rendered output contains the LossCurve's `// loss.hints` comment header.
- A heading like "# learning trend" (or whatever mono-style heading matches the theme-cards pattern) precedes the chart.

SkillGenome rendering is already covered by Task 2.1's tests — don't duplicate those assertions here.

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @tensorcraft/web test -- --run dashboard-view`
Expected: FAIL — `lossCurveData` prop not yet consumed in the view.

- [ ] **Step 3: Modify `apps/web/app/dashboard/dashboard-view.tsx`**

1. Add to `DashboardViewProps`:
   ```typescript
   import type { WeeklyHints } from "@tensorcraft/ui";
   // …
   lossCurveData: { weekly: WeeklyHints[] };
   ```
2. Import: `import { LossCurve } from "@tensorcraft/ui";`
3. Render the LossCurve block near the existing `<SkillGenome>` block — either adjacent (side-by-side in a grid on wider screens) or stacked below. Use a mono-style section heading consistent with the existing theme-cards heading (e.g., `# learning trend` or `// loss curve`). Wrap in a section with `aria-labelledby` referencing the heading id.
4. The SkillGenome section continues to render the existing `<SkillGenome data={genomeData} />` with no changes required here — its redesign happened in Task 2.1.

- [ ] **Step 4: Run tests and build**

Run (sequential): `pnpm --filter @tensorcraft/web test -- --run dashboard-view && pnpm --filter @tensorcraft/web build`
Expected: PASS + build succeeds. If a dashboard-view snapshot breaks, regenerate it ONLY after confirming the diff is the intended LossCurve addition (per @superpowers:verification-before-completion).

- [ ] **Step 5: Visual smoke test**

Start the dev server: `pnpm --filter @tensorcraft/web dev`. Visit `/dashboard` as a test user. Verify:
- The refactored SkillGenome renders with spokes (no concentric rings), no data dots, stroke-only polygon, and a mono legend table listing all 6 axes with `0.XX` values.
- LossCurve renders as a staircase line with start/end labels.
- Both use `var(--tc-primary)` (the active theme's primary) — check by temporarily switching active theme or inspecting computed styles.
- No layout overflow on dashboard widths ≥768px.

If a visual issue is blocking, capture and STOP.

- [ ] **Step 6: Report and stop**

Report: "Task 3.2 complete. Dashboard view renders LossCurve adjacent to the refactored SkillGenome. Build green. Visual smoke: <summary>."

---

## Phase 4 — Documentation (depends on Phase 3)

### Task 4.1: Update dev-plan.md

**Files:**
- Modify: `docs/dev-plan.md`

- [ ] **Step 1: Mark completed items**

In `docs/dev-plan.md`:

1. In Phase 11 §11b, change the visualization entry to `[x]` with completion date 2026-04-NN (use today's date when executing):
   ```
   - [x] Build `SkillRadar` + `LossCurve` visualization components — **COMPLETED YYYY-MM-DD**
   ```

2. In §11f "Test Updates", mark the viz-tests line `[x]` if both component test files exist and pass.

3. In §5b "Dashboard", add a sub-bullet under the completed dashboard entry: "Added SkillRadar and LossCurve widgets YYYY-MM-DD (see `docs/superpowers/specs/2026-04-20-visualizations-design.md`)."

- [ ] **Step 2: Append a short entry to the Session log** (top of dev-plan.md)

Under a new dated sub-heading inside `## Session log`, list:
- Files created (`packages/ui/src/visualizations/helpers.ts` + test, `apps/web/app/dashboard/_lib/viz-data.ts` + test, `packages/ui/src/visualizations/loss-curve.tsx` + test, `packages/ui/src/visualizations/index.ts`)
- Files modified (`apps/web/app/dashboard/skill-genome.tsx` — refactored in place to Option C style; `apps/web/app/dashboard/skill-genome.test.tsx` — new/updated; `apps/web/app/dashboard/page.tsx` — added exercise_attempts query; `apps/web/app/dashboard/dashboard-view.tsx` — renders LossCurve adjacent to SkillGenome; `packages/ui/src/index.ts` — added LossCurve + helpers re-exports)
- Test counts (total + new)
- Any deferred items encountered (note if the Nova Canvas contrast fix hasn't landed — visualizations inherit whatever primary colors are in the palette).

- [ ] **Step 3: Report completion and stop**

Report: "Plan fully executed. Two visualizations shipped. Dev-plan and Session log updated. Do NOT commit — user reviews the full Batch 3 Stage 2b visualizations work before any git actions."

---

## Rollback hints (if a phase needs to be undone)

- **Phase 1:** delete `packages/ui/src/visualizations/helpers.ts{,test.ts}` and `apps/web/app/dashboard/_lib/viz-data.ts{,test.ts}`.
- **Phase 2:** delete the four component/test files + `packages/ui/src/visualizations/index.ts`; revert the append to `packages/ui/src/index.ts`.
- **Phase 3:** revert the dashboard/page.tsx + dashboard-view.tsx changes (git diff should be scoped to the two new prop paths + import lines).
- **Phase 4:** revert the dev-plan.md diff for the §11b/§11f/§5b entries and the new Session log sub-entry.

Because each task ends without a commit, rollback is just a revert of the working tree — no branch gymnastics.

---

## References

- Spec: [docs/superpowers/specs/2026-04-20-visualizations-design.md](../specs/2026-04-20-visualizations-design.md)
- A11y audit: [docs/audits/accessibility-audit-2026-04-20.md](../../audits/accessibility-audit-2026-04-20.md)
- Skill axis enum: [apps/api/src/routes/skill-events.ts:17](../../../apps/api/src/routes/skill-events.ts)
- Supabase schema: `packages/supabase/migrations/010_skill_genome.sql`, `004_exercise_attempts.sql`
- Related skills: @superpowers:test-driven-development, @superpowers:verification-before-completion, @superpowers:subagent-driven-development
