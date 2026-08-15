# Visualizations Design - SkillRadar + LossCurve

**Date:** 2026-04-20
**Status:** Approved for implementation planning
**Scope:** Phase 11 (Brutalist Terminal Redesign) §11b - new data-visualization components for the dashboard
**Supersedes:** Parts of dev-plan §11b line 974 (original list included `LossLandscape` and `ActivityHeatmap`; both deferred - see §10 below)

---

## 1. Context

Phase 11 of the Tensorcraft redesign originally called for four visualization components: `LossLandscape`, `SkillRadar`, `ActivityHeatmap`, and `LossCurve`. During brainstorming on 2026-04-20, scope was reduced to two components (`SkillRadar`, `LossCurve`) for V0.5. The remaining two are explicitly deferred with reasons documented in §10.

The retained visualizations are data-driven widgets for the authenticated user Dashboard (`apps/web/app/dashboard/page.tsx`). They render a user's current ML skill profile and their learning independence trend over time, using data already present in the Supabase schema.

## 2. Scope

**In scope:**
- `LossCurve` - new React component in `packages/ui/src/visualizations/`. Staircase line chart showing rolling 7-day average hints-used per exercise over the last 12 weeks.
- Refactor of the existing [`apps/web/app/dashboard/skill-genome.tsx`](apps/web/app/dashboard/skill-genome.tsx) widget - apply the Option C "Code Comment" style (no concentric rings, no data-point dots, stroke-only polygon, monospace legend table) to the `RadarChart` subcomponent inside it. **Updated 2026-04-20:** this is a refactor-in-place, not a new `SkillRadar` file in `packages/ui` (the existing widget already ships - see §4).
- Shared geometry helpers (`hexCorners`, `stepPath`, `SKILL_AXIS_ORDER`) extracted to `packages/ui/src/visualizations/helpers.ts` so both the refactored SkillGenome and the new LossCurve reuse them.
- Data helpers in `apps/web/app/dashboard/_lib/` for weekly hint-bucketing and skill-axis padding.
- Integration into the existing Dashboard server component.
- Snapshot + unit tests.
- Accessibility hooks (`role="img"`, `<title>`, `<desc>`).

**Out of scope (deferred - see §10):** LossLandscape, ActivityHeatmap, hover/click interactivity, animations, theme switcher UI, SQL-side aggregation, server-streamed updates.

## 3. Decisions log

Seven decisions locked via brainstorming. Each records the chosen option, rejected alternatives, and rationale - so future contributors can understand *why* without re-litigating.

| # | Decision | Chosen | Rejected | Rationale |
|---|---|---|---|---|
| 1 | Component scope | SkillRadar + LossCurve only | Full 4-viz scope; SkillRadar-only | LossLandscape is atmospheric (no data); ActivityHeatmap already deferred per dev-plan §5b; LossCurve + SkillRadar are the functional data widgets |
| 2 | LossCurve metric | Rolling 7-day avg `hints_used` per exercise (descending line) | Cumulative lessons; rolling avg score; avg attempts-to-pass | Honors the ML "loss curve" metaphor (line goes down = improvement); `hints_used` is always populated unlike `attempts`; signals independence growth |
| 3 | SkillRadar axes | 6 axes from schema: `data_prep`, `model_arch`, `training`, `evaluation`, `deployment`, `fe_integration` | Custom axis set | Already defined in `apps/api/src/routes/skill-events.ts:17` `VALID_SKILL_AXES`; hexagonal shape is visually stable; reusing the existing enum avoids dual-source-of-truth |
| 4 | Rendering | Hand-rolled SVG | `visx` (~15KB); `recharts` (~80KB); `d3` (~30KB) | Zero bundle cost; brutalist aesthetic wants sharp angular control; no library fights us on rounded defaults; geometrically simple (polygon + polyline) so implementation is ~100 lines per component |
| 5 | SkillRadar data scope | Active theme only (single large widget) | Per-theme grid (5 radars); aggregate across themes | Matches existing "resume learning" flow; single large widget has clearer visual hierarchy; schema is keyed `(user_id, theme_id)` so aggregate loses info |
| 6 | Interactivity | Fully static, all values as visible labels | Hover/focus tooltips; click-to-drill-down | Brutalist "information dense, no hidden state" aesthetic; avoids adding to the a11y audit's existing hidden-state debt (tooltips need keyboard + ARIA + touch paths); single implementation |
| 7 | Visual style | Option C - Code Comment (spokes + dashed tick; mono table legend; staircase curve) | A (grid+outline); B (filled+inline) | Maximally differentiated - reads as Tensorcraft specifically, not a generic ML dashboard; mono-first aligns with brutalist direction; staircase renders clearer at small sizes |

## 4. Architecture

```text
packages/ui/src/visualizations/       # NEW subdir - shared primitives
├── loss-curve.tsx                    # NEW ~120 lines
├── loss-curve.test.tsx               # snapshot + step-line tests
├── helpers.ts                        # NEW pure geometry (hexCorners, stepPath, SKILL_AXIS_ORDER)
├── helpers.test.ts                   # unit tests for the helpers
└── index.ts                          # re-exports (LossCurve + helpers)

apps/web/app/dashboard/
├── skill-genome.tsx                  # REFACTORED in place - Option C style applied to the existing RadarChart
├── skill-genome.test.tsx             # NEW/updated - asserts Option C invariants
└── _lib/
    ├── viz-data.ts                   # NEW - Supabase row → prop transforms
    └── viz-data.test.ts              # NEW
```

**Naming:** throughout this spec, earlier drafts used "SkillRadar" for the widget. Post-brainstorm (2026-04-20) we confirmed the existing widget keeps its `SkillGenome` export name. When this document says "SkillRadar" in §5, §6, §7.1, §9, §11, or §12, read it as "the refactored radar inside `skill-genome.tsx`". The consumer API (the exported `<SkillGenome>` component) stays stable.

`LossCurve` is a **pure function of props** (no state, no fetch). Both the refactored SkillGenome and LossCurve render SVG that is hydration-safe (identical server and client output).

**Consumer:** `apps/web/app/dashboard/dashboard-view.tsx` already receives `genomeData` and renders `<SkillGenome>`. We extend it to also accept `lossCurveData` and render `<LossCurve>` adjacent. The page does the Supabase queries (following the established pattern).

## 5. Component APIs

```ts
// SkillRadar
export interface SkillAxisValue {
  name: "data_prep" | "model_arch" | "training" | "evaluation" | "deployment" | "fe_integration";
  proficiency: number;  // [0, 1]; 0 = no data; 1 = mastered
}

export interface SkillRadarProps {
  themeName: string;              // Display name, e.g., "Deep Orbit"
  axes: SkillAxisValue[];         // Length always 6 (use padSkillAxes helper)
  className?: string;
}

export function SkillRadar(props: SkillRadarProps): JSX.Element;
```

```ts
// LossCurve
export interface WeeklyHints {
  weekStart: string;         // ISO date string, Monday of the week
  avgHints: number | null;   // null = no exercises attempted that week
}

export interface LossCurveProps {
  weekly: WeeklyHints[];          // Length up to 12; oldest → newest
  className?: string;
}

export function LossCurve(props: LossCurveProps): JSX.Element;
```

**Color strategy:** neither component takes a color prop. Colors are consumed via CSS custom properties already defined in `packages/themes/src/css/themes.css`:
- `var(--tc-primary)` - radar polygon stroke, curve stroke, data values
- `var(--tc-border)` - spokes, baseline, dashed tick
- `var(--tc-muted)` - comment text ("# skill_genome", "// loss.hints - 12wk")
- `var(--tc-text)` - axis names

When the active theme changes, the same component re-renders with the new accent automatically.

## 6. Data flow

```
apps/web/app/dashboard/page.tsx (server component)
   │
   ├─ derives activeThemeId from theme_progress (most recent updated_at)
   │
   ├─ Supabase.from("skill_genome")
   │     .select("skill_axis, proficiency")
   │     .eq("user_id", user.id)
   │     .eq("theme_id", activeThemeId)
   │   → rows[]
   │   → padSkillAxes(rows) → SkillAxisValue[6]
   │
   ├─ Supabase.from("exercise_attempts")
   │     .select("attempted_at, hints_used")
   │     .eq("user_id", user.id)
   │     .gte("attempted_at", now() - 12 weeks)
   │   → attempts[]
   │   → computeWeeklyHints(attempts, 12) → WeeklyHints[up to 12]
   │
   └─ passes both as props to <DashboardView />
        └─ renders <SkillRadar />, <LossCurve />
```

### 6.1 Helpers in `apps/web/app/dashboard/_lib/viz-data.ts`

```ts
export function padSkillAxes(
  rows: Array<{ skill_axis: string; proficiency: number }>
): SkillAxisValue[];
// Ensures all 6 canonical axes are present, fills missing with proficiency=0,
// orders them deterministically (same as VALID_SKILL_AXES).

export function computeWeeklyHints(
  attempts: Array<{ attempted_at: string; hints_used: number }>,
  weekCount: number
): WeeklyHints[];
// Buckets attempts into Monday-aligned weeks for the last `weekCount` weeks,
// computing avg `hints_used` per bucket. Empty weeks → { weekStart, avgHints: null }.
// UTC-based bucketing to avoid timezone drift.
```

## 7. Rendering specification (Option C)

### 7.1 SkillRadar

Layout: horizontal split - SVG on the left (55% width), mono legend table on the right (45% width).

**SVG (viewBox 0 0 160 200, flexible width):**
- Center at (80, 100), radius r=80 at 100% proficiency.
- Six spokes rendered as `<line>` elements from (80, 100) to the 100% vertices at angles 90°, 30°, -30° (=330°), -90° (=270°), -150° (=210°), 150° (measuring from positive x-axis, CCW).
- One scale tick: `<circle cx="80" cy="100" r="40" stroke="var(--tc-border)" stroke-dasharray="1 3" fill="none"/>` (50% reference).
- Data polygon: `<polygon fill="none" stroke="var(--tc-primary)" stroke-width="1.5"/>` with vertices at `(80 + r*p_i*cos θ_i, 100 - r*p_i*sin θ_i)`.

**Legend (HTML, not SVG):**
```html
<div class="tc-viz-legend">
  <div class="comment"># skill_genome</div>
  <div class="row"><span class="name">data_prep</span><span class="value">0.60</span></div>
  ...
</div>
```
Rendered with `font-family: var(--font-mono)`, mono values right-aligned at a fixed column.

### 7.2 LossCurve

SVG (viewBox 0 0 260 130):
- Baseline at y=115 from x=30 to x=250.
- Staircase polyline generated by `stepPath(points)` helper - each data pair `(x_n, y_n)` contributes TWO segments: horizontal from previous `(x_{n-1}, y_n)` to current `(x_n, y_n)`, then vertical from `(x_n, y_n)` to next. Results in a classic staircase shape.
- Y value domain: `[0, max(5, observedMax + 0.5)]` - keep 5 as a sensible floor for the top of the chart so an unusually high week doesn't compress the rest.
- X positions: evenly spaced across available weeks.
- Two text labels: start value at top-left (`<text x="30" y="14">5.0 W1</text>` in muted color); end value at line terminus in primary color.
- Header label: `<text x="30" y="10" fill="var(--tc-muted)">// loss.hints - 12wk</text>` (rendered above the chart area).
- Null-value weeks (no exercises) are **filtered out** of the polyline - the staircase connects only non-null points. **Updated 2026-04-20 (YAGNI):** an earlier draft specified a dashed placeholder bridge across null weeks; dropped to simplify the typical-user case. Revisit only if sparse-data rendering reads as confusing in the wild.

### 7.3 Pure helpers

```ts
// packages/ui/src/visualizations/helpers.ts

/** Returns the 6 hexagon vertex coords at a given radius, top-pointing. */
export function hexCorners(cx: number, cy: number, r: number): Array<[number, number]>;

/** Generates SVG path/polyline points for a staircase line. */
export function stepPath(points: Array<[number, number]>): string;

/** Re-export for component use. */
export const SKILL_AXIS_ORDER = [
  "data_prep", "model_arch", "training", "evaluation", "deployment", "fe_integration"
] as const;
```

## 8. Empty and partial states

| Condition | SkillRadar | LossCurve |
|---|---|---|
| No `skill_genome` rows | Empty hexagon outline; center text "No activity yet" in muted color; legend shows all axes at 0.00 | - |
| No `exercise_attempts` rows in 12 weeks | - | Empty axes; centered text "Complete 3+ exercises to see trend" |
| Partial axes (< 6 rows) | Missing axes rendered at proficiency 0 → polygon shrinks on that spoke | - |
| Partial weeks (< 12) | - | Render what exists; no extrapolation |
| Single data point | Single-vertex polygon (renders as a dot) | Single circle at right edge; no line |
| All-null weeks | - | Empty axes; "Complete 3+ exercises…" message |

## 9. Accessibility

Each SVG receives:
- `role="img"`
- `aria-labelledby={titleId}` and `aria-describedby={descId}`
- Hidden `<title id={titleId}>` and `<desc id={descId}>` children

Content:
- SkillRadar `<title>`: `"Skill profile for {themeName}"`
- SkillRadar `<desc>`: `"Six axes: data_prep 0.60, model_arch 0.30, training 0.45, evaluation 0.20, deployment 0.15, fe_integration 0.85."` (dynamic from props)
- LossCurve `<title>`: `"Rolling 7-day average hints per exercise, last 12 weeks"`
- LossCurve `<desc>`: `"Started at 5.0 hints in week 1, currently 2.1 hints in week 12. Trend: decreasing."` (dynamic)

Because all numerical values are also visible as text in the SVG/legend per decision #6, screen-reader output mirrors visual output - no information asymmetry. No `aria-live` needed (static per page load).

Addresses specific findings from `docs/audits/accessibility-audit-2026-04-20.md` (sub-12px text avoided - min 10px for comment labels, which is a mono-specific concession; we'll use 11px minimum for axis values).

## 10. Out of scope (deferred)

### 10.1 LossLandscape (auth page atmospheric decoration)
**Deferred 2026-04-20.** Reason: atmospheric-only; auth page already works; not in the functional/data critical path. Revisit during a dedicated polish pass once other Phase 11 work lands.

### 10.2 ActivityHeatmap (GitHub-style daily activity grid)
**Deferred per dev-plan §5b line 357** (pre-existing decision). Reason: post-V0.5 per product plan; requires daily activity aggregation infrastructure (dev-plan §11e) that itself is pending.

### 10.3 Hover/click interactivity
**Deferred indefinitely.** Reason: brutalist aesthetic explicitly favors visible labels over hidden state. If product analytics shows users want drill-down, revisit with a standalone design.

### 10.4 Animations
**Not in scope.** Neither transition-in nor data-change transitions. Static charts ship first.

### 10.5 Theme switcher UI on Dashboard
**Not in scope.** Active theme derives from `theme_progress.updated_at`. A user-selectable theme toggle is a future UX call.

### 10.6 SQL-side aggregation
**Deferred.** Current approach computes weekly hints in TypeScript. Move to a Postgres function only if query performance becomes a problem (benchmark: dashboard load should remain < 500ms with 1000+ exercise_attempts per user).

### 10.7 Server-streamed updates
**Not in scope.** Charts render at page load. Live update during a session is not a V0.5 need.

## 11. Implementation sequence (for the plan)

1. **Phase 1 - Pure primitives (parallelizable):**
   - `packages/ui/src/visualizations/helpers.ts` + tests (hexCorners, stepPath, SKILL_AXIS_ORDER)
   - `apps/web/app/dashboard/_lib/viz-data.ts` + tests (padSkillAxes, computeWeeklyHints)

2. **Phase 2 - Components (depend on Phase 1):**
   - Refactor `apps/web/app/dashboard/skill-genome.tsx` RadarChart → Option C (no rings, no dots, stroke-only, mono legend) + tests asserting the new invariants
   - Create `packages/ui/src/visualizations/loss-curve.tsx` + snapshot tests
   - Wire `packages/ui/src/visualizations/index.ts` + top-level `packages/ui/src/index.ts` re-export for LossCurve

3. **Phase 3 - Integration (sequential, depends on Phase 2):**
   - Dashboard server component adds the `exercise_attempts` query for LossCurve (the `skill_genome` query already exists - just run its rows through `padSkillAxes` before passing to `<SkillGenome>`)
   - Dashboard view receives `lossCurveData` prop, renders `<LossCurve>` adjacent to `<SkillGenome>`
   - Update existing `dashboard/page.tsx` and `dashboard-view.tsx` tests

4. **Phase 4 - Documentation (depends on Phase 3):**
   - Update `docs/dev-plan.md` §11b marking the visualization entry `[x]` with completion date
   - Update §5b cross-reference
   - Append Session log entry

## 12. Open questions at implementation time

- **Timezone for week bucketing:** UTC Monday-aligned is proposed. If user-local-time bucketing turns out to matter (e.g., a learner in UTC-8 submitting at 11pm local on Sunday would be bucketed into next week under UTC), we'd adjust. Ship UTC first, revisit only on evidence.
- **Deep Orbit primary color verification:** The existing palette values are assumed correct against `#232323` surface. Nova Canvas primary (`#C06060`) is known to fail WCAG AA and is being addressed as part of Phase 11 §11a foundation work (see separate dev-plan decision). SkillRadar/LossCurve themselves don't pick colors - they inherit - so this is a palette concern, not a component concern.
- **SkillRadar legend layout at narrow widths:** The horizontal SVG + table split works at dashboard widths (≥768px). Below that, the legend might need to stack under the SVG. Mobile handling should be decided during Stage 3 integration based on where `SkillRadar` actually sits in the dashboard grid.

## 13. Related documents

- Dev plan: `docs/dev-plan.md` §11b (new shared components), §5b (dashboard), §5a (progress tracking)
- Prior Phase 11 decisions: `docs/superpowers/specs/2026-04-15-design-system-color-overhaul.md`
- Accessibility audit: `docs/audits/accessibility-audit-2026-04-20.md`
- Schema source: `apps/api/src/routes/skill-events.ts:17` (`VALID_SKILL_AXES`), `packages/supabase/migrations/` (skill_genome, exercise_attempts tables)
