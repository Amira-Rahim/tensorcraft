# Moat UI Design Enhancements — Design Spec

## Context

The V0.5 light moat implementation (Skill Genome tracking, Adaptive Bridges, onboarding persistence) is functionally complete but the frontend surfaces are minimal — the BridgeCallout cloned the existing layout, the onboarding step is a plain radio list, and the Skill Genome has no visualization at all. This spec enhances three UI surfaces to make the moat features visible, interactive, and differentiated.

---

## 1. BridgeCallout — Tabbed Framework Switcher

### Current State
A static 3-column grid (FE box / connector / ML box) that shows the user's framework variant but gives no indication of personalization and no way to explore other frameworks.

### New Design
Replace the 3-column grid with an integrated card featuring a framework tab bar across the top.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  React │ Vue │ Angular │ Svelte │ Vanilla  │ ■ Tier  │
├────────────────────────┬─────────────────────────────┤
│  YOUR FRAMEWORK        │  ML EQUIVALENT              │
│  Component Props       │  Training Data              │
│  ┌──────────────────┐  │  ┌───────────────────────┐  │
│  │ React code here  │  │  │ ML code here          │  │
│  └──────────────────┘  │  └───────────────────────┘  │
├────────────────────────┴─────────────────────────────┤
│  // bridge: Both are external inputs that shape...   │
└──────────────────────────────────────────────────────┘
```

### Behavior

- Default active tab = user's `fe_framework` from profile. If `userFramework` is undefined (user skipped onboarding), default to `'vanilla'`
- Clicking another tab swaps FE code + title instantly (client-side — all variants are already in the BRIDGES array)
- ML side stays constant regardless of selected tab
- Tab bar right side shows tier badge (Identity/Structural/Intuition) with tier color dot
- Connection explanation shown in comment-style footer
- Tabs with no variant for this bridge render as disabled/dimmed (reduced opacity, no click handler)
- When `bridge` is `undefined`: render nothing (return null), same as current behavior
- When bridge exists but has no `variants` property: fall back to the current generic 3-column layout (no tabs)
- Tab bar uses WAI-ARIA `role="tablist"` / `role="tab"` semantics with arrow-key navigation and Enter/Space selection

### Integration

The `userFramework` prop is passed from the lesson page's server component, which reads `profiles.fe_framework` from Supabase (already implemented in `apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx`). It flows through `LessonContent` → `mdxComponents` → `BridgeCallout`.

### Props

```typescript
interface BridgeCalloutProps {
  bridge: Bridge | undefined;
  userFramework?: Framework;     // default active tab, falls back to 'vanilla'
}
```

### Styling

All tier colors use CSS custom properties (`var(--tc-tier-identity)`, `var(--tc-tier-structural)`, `var(--tc-tier-intuition)`) as the source of truth — NOT the `BRIDGE_TIER_COLORS` constant which has different values.

- Container: `brutalist-shadow bg-surface-raised border border-border` (existing pattern)
- Tab bar: `border-b border-border`, tabs in `font-mono text-[10px] uppercase tracking-widest`
- Active tab: tier color bottom border (2px), `bg-{tierColor}/15` background
- Inactive tabs: `text-text-muted`, hover lightens
- Content area: 2-column grid, `border-r border-border` dividing FE/ML
- Code blocks: `bg-code-bg border border-border` with tier color text
- Footer: `bg-code-bg border-t border-border`, connection text prefixed with `// bridge:`
- No border-radius anywhere (brutalist)

### Responsive

- Desktop: full tab bar visible, 2-column content
- Mobile (<640px): tab bar scrolls horizontally, content stacks vertically

### File

`packages/ui/src/mdx/bridge-callout.tsx` — rewrite (keep export name)

---

## 2. Onboarding Framework Step — Side-by-Side Selector + Live Bridge Preview

### Current State
A plain radio-button list identical to the Background and Goal steps. No indication of what choosing a framework actually does.

### New Design
Two-panel layout: framework list on the left, live bridge preview on the right that updates instantly when a framework is selected.

### Layout

```
┌──────────────────────────────────────────────────────┐
│          // PRIMARY TOOLKIT                          │
│     What's your primary framework?                   │
│     Pick yours — we'll show you a bridge preview.    │
├──────────────┬───────────────────────────────────────┤
│  ⚛ React ◄── │  // BRIDGE PREVIEW                   │
│  ◆ Vue       │  Training Data ⇄ Component Props     │
│  ▲ Angular   │  ┌─────────────────────────────────┐  │
│  ◐ Svelte    │  │ function Card({ title }) {      │  │
│  { } Vanilla │  │   return <div>{title}</div>;     │  │
│              │  └─────────────────────────────────┘  │
│              │  This is how bridges will look →      │
└──────────────┴───────────────────────────────────────┘
```

### Behavior

- Clicking a framework on the left instantly updates the preview on the right
- Preview uses Bridge #1 (Training Data / Component Props) as the sample — it's the most intuitive shared bridge
- Bridge lookup: `BRIDGES.find(b => b.id === 1)` (by id, not array index)
- Code in the preview pulls from the found bridge's `variants[selectedFramework]`
- No selection initially — preview shows placeholder: "Select a framework to preview your bridges"
- Selection state: `bg-primary/10 border-2 border-primary` (existing pattern)
- Each framework shows an icon glyph: ⚛ React, ◆ Vue, ▲ Angular, ◐ Svelte, { } Vanilla

### Styling

- Overall container: max-width 560px, centered
- Framework list: `flex flex-col gap-0.5`, buttons match existing onboarding radio pattern
- Preview panel: `bg-surface-raised border border-border p-4`
- Preview header: `font-mono text-[9px] uppercase tracking-widest text-text-muted`
- Bridge title: `font-mono text-[11px] font-semibold text-text-primary`
- Code block: `bg-code-bg border border-border p-3 font-mono text-[11px]` with primary color
- Footer hint: `font-mono text-[9px] text-text-muted`

### Responsive

- Desktop: `grid-template-columns: 180px 1fr`
- Mobile (<640px): `grid-template-columns: 1fr` (stacked — list on top, preview below)

### File

`apps/web/app/onboarding/page.tsx` — modify step 3 (framework step)

---

## 3. Skill Genome Visualization — Radar + Progress Bars + Velocity

### Current State
No UI exists. The `skill_genome` and `skill_events` tables are created but no component reads from them.

### New Design
A new dashboard component with a compact radar chart on the left, precise progress bars on the right, and a velocity indicator at the bottom.

### Layout

```
┌──────────────────────────────────────────────────────┐
│  // SKILL GENOME                                     │
├─────────────────────┬────────────────────────────────┤
│                     │  Data Prep        ████████░ 82% │
│      Radar SVG      │  Model Arch       ███████░░ 71% │
│    (6-axis hex)     │  Training         ████░░░░░ 45% │
│                     │  Evaluation       ██░░░░░░░ 22% │
│                     │  Deployment       █████░░░░ 58% │
│                     │  FE Integration   ██████░░░ 63% │
├─────────────────────┴────────────────────────────────┤
│  VELOCITY                              ▲ +4.2 /week  │
└──────────────────────────────────────────────────────┘
```

### Radar Chart (SVG)

- 6-vertex hexagon with 3 concentric rings (33%, 66%, 100%)
- Rings: `stroke: var(--tc-border)`, 1px
- Axis lines from center to each vertex: `stroke: var(--tc-border)`, 0.5px
- Data polygon: `fill: var(--tc-primary)` at 15% opacity, `stroke: var(--tc-primary)` at 2px
- Vertex dots: 4px circles filled with `var(--tc-primary)`
- Labels: `font-mono text-[9px] uppercase` positioned outside the hexagon
- Size: 200x200 desktop, 160x160 mobile

### Progress Bars

- 6 bars, one per skill axis
- Each axis has a distinct color, defined as CSS custom properties for themeability:
  - Data Prep: `var(--tc-axis-data-prep)` — defaults to `var(--tc-primary)`
  - Model Arch: `var(--tc-axis-model-arch)` — defaults to `var(--tc-tier-structural)`
  - Training: `var(--tc-axis-training)` — defaults to `var(--tc-tier-intuition)`
  - Evaluation: `var(--tc-axis-evaluation)` — defaults to `#c06060`
  - Deployment: `var(--tc-axis-deployment)` — defaults to `#b08030`
  - FE Integration: `var(--tc-axis-fe-integration)` — defaults to `#4a90d9`
- These 6 custom properties should be added to `packages/themes/src/css/themes.css` in each theme block
- Bar track: `h-1 bg-border rounded-none`
- Bar fill: axis color, `transition-all duration-600 ease-out`
- Mount animation: bars animate from width 0 to actual value, staggered 100ms per bar
- Labels: `font-mono text-[9px]`, axis name left-aligned, percentage right-aligned in axis color

### Velocity Indicator

- Full-width bar at the bottom
- Reads `velocity` from `skill_genome` table (average across all axes)
- Display: `font-mono text-[9px]`
- Positive velocity: green text, `▲` arrow
- Negative velocity: red text, `▼` arrow
- Zero/no data: muted text, `—` dash

### Empty State

When no skill events exist yet:

```
┌──────────────────────────────────────────────────────┐
│  // SKILL GENOME                                     │
│                                                      │
│            ◎                                         │
│   Complete exercises to unlock                       │
│   your Skill Genome                                  │
│                                                      │
│   ░░░░░░░░░░░░░░░░░░░░░░  0 / 6 axes active         │
└──────────────────────────────────────────────────────┘
```

- Centered icon (◎ in primary color, faded)
- Muted explanatory text
- Single progress bar showing 0/6 axes with data

### Velocity Computation

The `velocity` column in `skill_genome` stores a unitless rate (points-per-week equivalent). The dashboard displays the average velocity across all axes that have data. If only 3 of 6 axes have rows, average across 3 (not 6). Format: sign + one decimal place + " /week" (e.g., "+4.2 /week", "-1.0 /week").

### Data Source

- Query `skill_genome` table for user's active theme
- If no genome rows exist: show empty state directly (no fallback computation from skill_events — that complexity belongs in V0.8 when proficiency computation ships)
- If some axes have data but not all: show radar with zero-value vertices for missing axes, bars at 0% for missing axes
- Refresh: on page load only (no real-time polling)

### Styling

- Container: `brutalist-shadow bg-surface-raised border border-border p-5`
- Header: `font-mono text-[9px] uppercase tracking-widest text-text-muted` with `// SKILL GENOME` prefix
- Grid: `grid-cols-[200px_1fr]` desktop, `grid-cols-1` mobile
- Velocity bar: `bg-surface border-t border-border p-2`

### Responsive

- Desktop: radar left, bars right, side by side
- Mobile (<640px): radar centered on top (160px), bars below full-width

### File

`apps/web/app/dashboard/skill-genome.tsx` — new component

---

## Files to Modify

| File | Change |
| --- | --- |
| `packages/ui/src/mdx/bridge-callout.tsx` | Rewrite: 3-column grid → tabbed framework switcher |
| `packages/ui/src/mdx/bridge-callout.test.tsx` | Update tests for new tabbed structure |
| `apps/web/app/onboarding/page.tsx` | Rewrite step 3: radio list → side-by-side selector + bridge preview |
| `apps/web/app/dashboard/skill-genome.tsx` | New component: radar + progress bars + velocity |
| `apps/web/app/dashboard/page.tsx` | Import and render SkillGenome component |
| `packages/themes/src/css/themes.css` | Add 6 `--tc-axis-*` custom properties per theme |

---

## Verification Plan

1. **BridgeCallout tabs:** Load a lesson with a shared bridge → verify 5 tabs visible → click each tab → verify FE code and title change, ML side stays constant
2. **BridgeCallout default tab:** User with `fe_framework: 'vue'` loads lesson → verify Vue tab is active by default
3. **BridgeCallout fallback:** Load a theme-specific bridge with no variants → verify component renders without tabs (graceful fallback to generic layout)
4. **BridgeCallout disabled tabs:** Bridge has only React + Vue variants → verify Angular/Svelte/Vanilla tabs appear dimmed
5. **Onboarding preview:** Click React → verify React code appears in preview panel → click Vue → verify Vue code replaces it
6. **Onboarding empty state:** Load step with no selection → verify placeholder text shows in preview panel
7. **Onboarding mobile:** Resize to <640px → verify panels stack vertically
8. **Skill Genome with data:** User with skill_events → verify radar renders with correct shape, bars show correct percentages, velocity shows
9. **Skill Genome empty state:** New user with zero events → verify empty state renders with "Complete exercises" message
10. **Skill Genome responsive:** Resize to mobile → verify radar stacks above bars
11. **Bar animations:** Load Genome → verify bars animate from 0 to value with staggered timing (~1100ms total for all 6 bars)
12. **BridgeCallout undefined bridge:** Pass `bridge={undefined}` → verify component returns null (renders nothing)
13. **BridgeCallout no userFramework:** User who skipped onboarding (no `fe_framework` in profile) → verify Vanilla tab is active by default
14. **Skill Genome partial data:** User with data on 3 of 6 axes → verify radar shows zero-value vertices for missing axes, bars show 0% for those
15. **BridgeCallout keyboard:** Focus tab bar → press arrow keys → verify focus moves between tabs → press Enter → verify tab activates
16. **Onboarding missing variant:** If Bridge #1 somehow lacks a variant for selected framework → verify preview shows generic `connection` text as fallback
