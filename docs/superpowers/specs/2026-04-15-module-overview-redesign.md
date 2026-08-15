> **Status: MERGED** - This design was merged into the module map accordion at `/themes/[slug]` (file: `module-map-client.tsx`). The standalone module overview page was deleted 2026-04-15.

# Module Overview Page Redesign

**Date:** 2026-04-15
**Scope:** Full redesign of the module overview page (`/themes/[slug]/[module]`) - narrative banner header, mission dossier lesson cards, brutalist-hover fix, theme terminology integration
**Aesthetic:** Dark brutalist (unchanged), mission-dossier industrial, full narrative experience

---

## Problem Statement

The module overview is the most-visited page in a learner's journey (they return after every lesson), yet it's the least designed page in the app. Six issues were identified:

1. **Flat list fatigue.** All 5 lesson cards are identical in size, weight, and visual treatment. No rhythm, no active-lesson emphasis, no completion celebration, no upcoming dimming.

2. **Underweight module header.** The header uses ~120px of vertical space with plain text - the thinnest header in the app. The theme detail page (~200px, stats grid, colored border) and dashboard (~180px, ambient canvas) both have much stronger headers.

3. **Missing narrative context.** Tensorcraft's story-driven identity is invisible. Theme terminology ("Missions" not "Lessons", "Sectors" not "Modules"), protagonist references, and scene locations are all available in the data but not displayed.

4. **No visual progression.** Flat vertical stack with no sense of "you are here" in a 5-step journey. The tiny progress nodes are the only hint of state.

5. **`brutalist-hover` shadow is hardcoded.** The `.brutalist-hover:hover` class in `globals.css` uses `rgba(107,170,138,0.35)` - hardcoded Deep Orbit teal. On Nova Canvas (red), Terra Grid (orange), etc., the hover shadow is the wrong color.

6. **Rich data not displayed.** Fields like `lesson.scene.location`, `lesson.context.narrative`, `lesson.concept.bridge`, `lesson.keywords[]`, and `lesson.skillAxes[]` are available but hidden.

## Design Decisions

These were validated during brainstorming and are not open for re-evaluation:

- **Full narrative experience** - the page reads like a chapter outline with scene locations, narrative excerpts, and story context. Each lesson is a narrative beat, not a generic list item.
- **Mission dossier card style** - numbered side panel with big ordinal + progress indicator, structured data layout (location, title, narrative, bridge, difficulty). Industrial briefing aesthetic.
- **Full-width narrative banner header** - scene-setting header with module label (using theme terminology), title, italic narrative blockquote, stats row, and theme-tinted bottom glow.
- **Three card states** - complete (full content, checkmark, tinted border), active (full content, glowing border, "Continue" badge), upcoming (title + location only, dimmed to 45% opacity).

---

## 1. Page Structure

**Container:** `max-w-6xl` (1152px), centered with `mx-auto`. Unchanged from current.

**Page layers (top to bottom):**

1. **Breadcrumb** - existing pattern, unchanged: `Themes / {theme.displayName} / {mod.title}`
2. **Narrative Banner** - new full-width header section
3. **Dossier List** - new lesson card design, replaces the current flat list

---

## 2. Narrative Banner

Replaces the current plain-text module header. Full-width within the container, with a subtle theme gradient wash and bottom glow border.

### Structure

```
┌──────────────────────────────────────────────────┐
│  // {terminology.module} {mod.order} · {count} {terminology.lesson}s   │ ← label
│                                                  │
│  {mod.title}                                     │ ← h1, monospace, 28px bold
│                                                  │
│  │ "{mod.description}"                           │ ← italic blockquote, primary-tinted left border
│                                                  │
│  ─────────────────────────────────────────────── │ ← border-top, var(--tc-border)
│  Scenes: 1/5   Time Left: ~58m   Difficulty: B→I │  ▃▃▃▃░░░░░░  │ ← stats row + progress bar
└──────────────────────────────────────────────────┘
  ═══════ glow fade ═══════                         │ ← 6px gradient, primary/8%
```

### Styling

- **Background:** Subtle gradient wash: `linear-gradient(135deg, primary/4% 0%, transparent 60%)` as a `::before` pseudo-element
- **Bottom border:** `1px solid primary/25%` (matches nav border treatment)
- **Bottom glow:** `6px linear-gradient(to bottom, primary/8%, transparent)` via `::after`
- **Label:** `font-mono text-[11px] text-primary uppercase tracking-[0.12em]`
- **Title:** `font-mono text-[28px] font-bold text-text-primary leading-tight`
- **Narrative blockquote:** `text-[13px] text-muted italic` with `border-left: 2px solid primary/30%` and `pl-3.5`, max-width `680px`
- **Stats row:** `flex gap-8 pt-4 border-t border-border` with stat label (9px muted uppercase) + stat value (15px mono text-primary)
- **Progress bar:** `h-[3px] w-[140px] bg-border` with fill `bg-primary`, aligned to the right via `ml-auto`

### Stats Computed From Data

| Stat | Source | Display |
|------|--------|---------|
| Scenes complete | `completedCount / lessons.length` | `"1 / 5 complete"` |
| Time left | `sum(estimatedMinutes) - sum(completed estimatedMinutes)` | `"~58 min"` |
| Difficulty range | `min(difficulty) → max(difficulty)` across lessons | `"Beginner → Intermediate"` |

### Theme Terminology

The label uses `theme.terminology.module` and `theme.terminology.lesson`:
- Deep Orbit: `"// Sector 01 · 5 Missions"`
- Neon Protocol: `"// Sector 01 · 5 Missions"`
- Signal Ward: `"// Ward 01 · 5 Cases"`
- Nova Canvas: `"// Sequence 01 · 5 Scenes"`
- Terra Grid: `"// Zone 01 · 5 Operations"`

(Exact terminology per theme comes from `theme.terminology` - the labels above use whatever values are defined there.)

---

## 3. Mission Dossier Cards

Replaces the current flat lesson links. Each card is a clickable `<Link>` with a structured two-section layout: numbered side panel + body content.

### Card Structure

```
┌─────┬────────────────────────────────────────────┬───┐
│     │  LOCATION · {time} min                     │   │
│ 01  │  {title}                                   │ → │
│ [●] │  "{narrative excerpt}"                     │   │
│     │  [bridge tag]  [difficulty]                 │   │
└─────┴────────────────────────────────────────────┴───┘
  64px   flex-1                                     48px
```

### Side Panel (64px fixed width)

- Background: `bg-page` (default), `primary/6%` (complete), `primary/10%` (active)
- Border-right: `1px solid var(--tc-border)` (default), `primary/15%` (complete), `primary/20%` (active)
- **Ordinal:** `font-mono text-[20px] font-bold` - `text-muted` (default), `text-primary` (complete/active)
- **Node:** `14×14px` square - `bg-border` (default), `bg-primary` with `✓` (complete), `border-2 border-primary bg-transparent` (active)

### Body Content

- **Location label:** `font-mono text-[10px] text-muted uppercase tracking-[0.1em]` - format: `"{scene.location} · {estimatedMinutes} min"`. Falls back to `"{theme.terminology.lesson} {order}"` if no scene data.
- **Title:** `font-mono text-[16px] font-bold text-text-primary mt-1`
- **Narrative excerpt:** `text-[12px] text-muted italic leading-relaxed mt-2` - shows `context.narrative` (first ~150 chars). Only visible on **complete** and **active** cards.
- **Meta row:** `flex gap-2.5 items-center mt-2.5 flex-wrap`
  - **Bridge tag:** `font-mono text-[10px] text-primary bg-primary-muted px-2 py-0.5` - shows `"{bridge.feTitle} → {bridge.mlTitle}"`. Only if bridge exists.
  - **Difficulty badge:** `font-mono text-[10px] uppercase tracking-wider px-2 py-0.5` with `color: var(--tc-tier-*)` and `background: color-mix(... 8%)`. Only on complete/active.

### Arrow

Right-aligned `→` in `text-muted font-mono text-base`, padded `px-4`, vertically centered.

### Status Badge (top-right of body)

- **Complete:** `font-mono text-[9px] bg-primary text-page px-2.5 py-[3px] uppercase tracking-wider` - text: `"✓ Complete"`
- **Active:** `font-mono text-[9px] border border-primary text-primary px-2.5 py-[3px] uppercase tracking-wider` - text: `"▶ Continue"`
- **Upcoming:** no badge

### Card States

| Property | Complete | Active | Upcoming |
|----------|----------|--------|----------|
| Background | `bg-surface` (#232323) | `bg-surface` (#232323) | `bg-page` (#181818) |
| Border | `primary/20%` | `primary/30%` | `border/60%` |
| Box-shadow | none | `0 0 20px primary/5%` | none |
| Opacity | 1 | 1 | 0.45 |
| Narrative | shown | shown | hidden |
| Bridge tag | shown | shown | hidden |
| Difficulty | shown | shown | hidden |
| Hover | brutalist-hover | brutalist-hover + ambient glow | opacity → 0.65, no transform |

---

## 4. brutalist-hover Fix

**File:** `apps/web/app/globals.css` (lines 74-83)

### Current (broken)

```css
.brutalist-hover:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 rgba(107, 170, 138, 0.35);
}
```

### Fix

```css
.brutalist-hover:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 color-mix(in srgb, var(--tc-primary) 35%, transparent);
}
```

This makes the hover shadow theme-aware across all pages that use `brutalist-hover`, not just the module overview.

---

## 5. Data Requirements

The redesign uses fields that are already available in the lesson and theme data:

| Field | Source | Used In |
|-------|--------|---------|
| `theme.terminology.module` | Theme manifest | Banner label |
| `theme.terminology.lesson` | Theme manifest | Banner label, location fallback |
| `lesson.context.narrative` | Lesson content | Dossier excerpt (complete + active) |
| `lesson.scene.location` | Lesson content | Dossier location label |
| `lesson.concept.bridge.feTitle` | Lesson content | Bridge tag (left side) |
| `lesson.concept.bridge.mlTitle` | Lesson content | Bridge tag (right side) |
| `lesson.estimatedMinutes` | Lesson content | Location label, stats computation |
| `lesson.difficulty` | Lesson content | Difficulty badge |
| `lesson.order` | Lesson content | Side panel ordinal |
| `mod.description` | Module content | Banner narrative blockquote |

**New data fetching:** The current page already fetches `lessons` via `getModuleLessons()`. The lesson objects should include `context.narrative`, `scene.location`, and `concept.bridge` - verify these are returned by the content layer. If not, the content query may need to include these fields.

---

## 6. Files to Modify

| File | Change Type | Risk |
|------|-------------|------|
| `apps/web/app/themes/[slug]/[module]/page.tsx` | Full rewrite of JSX + new data usage | **High** - main deliverable |
| `apps/web/app/globals.css` | Fix `brutalist-hover` shadow color | Low |
| `packages/content/src/` | May need to expose additional lesson fields | Medium - depends on current content API |

---

## 7. What Does NOT Change

- **Page route and URL structure** - `/themes/[slug]/[module]` unchanged
- **Data fetching pattern** - server component, same Supabase auth check
- **Container width** - `max-w-6xl` stays
- **AmbientBackground** - keeps `count={180}`
- **Breadcrumb** - existing pattern, unchanged
- **Color system** - uses the updated CSS custom properties from the color overhaul
- **Typography** - Inter + JetBrains Mono, no new fonts
- **Border radius** - all 0 (brutalist)

---

## 8. Responsive Behavior

- **Desktop (≥768px):** Full dossier layout as designed - 64px side panel, full body content, arrow
- **Mobile (<768px):** Side panel narrows to 48px, ordinal drops to 16px, narrative excerpt hidden on all cards (only title + location visible). Stats row in banner wraps to 2×2 grid. Progress bar goes full-width below stats.

---

## 9. Testing Strategy

1. **All 5 themes:** Verify banner label uses correct terminology, colors adapt, bridge tags show theme-appropriate primary color.
2. **Progress states:** Test with 0 completed (all upcoming), 1 completed + 1 active, all completed.
3. **Missing data:** Test with lessons that have no `scene.location` (fallback to terminology), no `concept.bridge` (hide bridge tag), no `context.narrative` (hide excerpt).
4. **Mobile viewport:** Verify responsive behavior at <768px - side panel narrows, excerpts hide, stats wrap.
5. **Hover states:** Confirm `brutalist-hover` shadow uses theme color, not hardcoded teal.
6. **Accessibility:** All cards are focusable links, progress states have aria-labels, narrative text has sufficient contrast.
