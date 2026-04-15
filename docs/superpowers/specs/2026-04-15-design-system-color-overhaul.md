# Design System Color Overhaul

**Date:** 2026-04-15
**Scope:** Full design system overhaul — palette, header, ticker, surfaces, hardcoded color fixes
**Aesthetic:** Dark brutalist (unchanged), shared neutral backgrounds, stronger accent system per theme

---

## Problem Statement

The current color system has four interconnected issues:

1. **No depth separation.** Nav (`#1C1C1C`), ticker (`#252525`), and page background (`#1C1C1C`) are within 9 hex steps of each other. Borders (`#2A2A2A`) are 14 steps from background — nearly invisible. The entire viewport reads as a flat dark surface with no visual hierarchy.

2. **Zero theme identity in chrome.** All 5 themes share identical background, surface, and border values. The header and ticker look the same regardless of active theme. Theme presence is limited to link text color.

3. **Hardcoded colors ignore theme switching.** The ticker canvas streaks are hardcoded to `rgba(107,170,138,...)` (Deep Orbit teal). Difficulty badges in the module overview use hardcoded hex values that never change with the theme.

4. **Flat visual hierarchy.** No shadows, glows, or border variation between active and inactive states. Chrome and content sit on the same visual plane.

## Design Decisions

These decisions were made during brainstorming and are not open for re-evaluation:

- **Shared neutral backgrounds** — all 5 themes use the same bg/surface/border values. Theme identity comes from the accent system, not tinted backgrounds. This simplifies WCAG compliance and maintenance.
- **Theme-tinted border glow on header** — the nav's bottom border becomes primary-colored with a soft downward glow. No elevation change or shadow. Brutalist-compatible.
- **Primary-tinted borders on active surfaces** — active cards and panels get `border: primary/25%`. Inactive surfaces get neutral borders. No left-bar or asymmetric accents.
- **Bold contrast push** — base background drops from `#1C1C1C` to `#181818`. Borders push from `#2A2A2A` to `#3D3D3D`. A new "raised" surface tier is added at `#2C2C2C`. This creates a +21 step spread between background and border.

---

## 1. New Color Palette

All themes share these neutral values. Only the `--tc-primary` and `--tc-accent` (and derived variables) differ per theme.

### Base Neutrals (shared)

| Variable | Old Value | New Value | Role |
|----------|-----------|-----------|------|
| `--tc-bg` | `#1C1C1C` | `#181818` | Page background |
| `--tc-surface` | `#252525` | `#232323` | Card/panel backgrounds |
| `--tc-surface-overlay` | `#313131` | `#313131` | *(unchanged)* — modals, dropdowns, popovers |
| `--tc-surface-raised` | *(none — mapped to `--tc-surface` in Tailwind)* | `#2C2C2C` | New tier: ticker, elevated non-modal content |
| `--tc-border` | `#2A2A2A` | `#3D3D3D` | Default neutral borders |
| `--tc-code-bg` | `#161616` | `#141414` | Code block backgrounds |
| `--tc-text` | `#E0E0E0` | `#E0E0E0` | *(unchanged)* |
| `--tc-muted` | `#A0A0A0` | `#A0A0A0` | *(unchanged)* |

### New Accent Variables (derived from `--tc-primary` per theme)

| Variable | Value | Role |
|----------|-------|------|
| `--tc-border-active` | `color-mix(in srgb, var(--tc-primary) 25%, transparent)` | Active card/panel borders |
| `--tc-border-subtle` | `color-mix(in srgb, var(--tc-primary) 12%, transparent)` | Internal dividers on active surfaces |
| `--tc-glow` | `color-mix(in srgb, var(--tc-primary) 10%, transparent)` | Header downward glow, ambient effects |
| `--tc-primary-muted` | `color-mix(in srgb, var(--tc-primary) 8%, transparent)` | Tinted backgrounds for badges, indicators |

### WCAG AA Verification

Text contrast against new backgrounds:

| Combination | Ratio | Pass? |
|-------------|-------|-------|
| `--tc-text` (#E0E0E0) on `--tc-bg` (#181818) | ~12.5:1 | Yes (AA requires 4.5:1) |
| `--tc-muted` (#A0A0A0) on `--tc-bg` (#181818) | ~6.2:1 | Yes |
| `--tc-text` (#E0E0E0) on `--tc-surface` (#232323) | ~10.1:1 | Yes |
| `--tc-muted` (#A0A0A0) on `--tc-surface` (#232323) | ~5.0:1 | Yes |

All primary colors already pass AA 4.5:1+ on the current darker backgrounds, so the new darker base only improves ratios.

---

## 2. Header (Nav Component)

**File:** `apps/web/app/components/nav.tsx`

### Changes

- **Bottom border:** Replace `border-b border-border` with a primary-tinted border: `border-b border-border-active`
- **Downward glow:** Add an `::after` pseudo-element (or a child div) with:
  - `height: 8px`
  - `background: linear-gradient(to bottom, var(--tc-glow), transparent)`
  - `position: absolute; bottom: -8px; left: 0; right: 0`
  - `pointer-events: none; z-index: 49` (below nav, above ticker)
- **Background:** Changes to `bg-surface` class mapped to `--tc-surface` (`#232323`), giving the nav a slightly lighter base than the page (`#181818`). Combined with the border glow, this creates clear chrome/content separation. **Note:** this requires updating the Tailwind mapping — currently `--color-surface` maps to `--tc-bg`. See Section 6.

### Mobile Nav

**File:** `apps/web/app/components/mobile-nav.tsx`

- Hamburger button border: use `border-border` (now `#3D3D3D`, more visible)
- Full-screen overlay: `bg-surface` (updated automatically)
- Active nav items: use `border-border-active` and `text-primary`
- Auth buttons active state: use `border-border-active bg-primary-muted`

No structural changes to mobile nav — the palette update cascades.

---

## 3. Ticker (Bridge System)

**File:** `apps/web/app/components/ticker.tsx`

### Changes

- **Canvas streaks:** Replace hardcoded `rgba(107,170,138,${s.alpha})` with a dynamic value read from `--tc-primary`. Extract the RGB components of the CSS custom property at render time (via `getComputedStyle` or a pre-computed RGB variable) and apply with per-streak alpha.
- **Background:** `bg-surface-raised` remains but now maps to `#2C2C2C` (or keep as a distinct ticker surface — either works since the new raised value is close to the old `#252525`).
- **Bottom border:** Already uses `border-border`, which updates automatically to `#3D3D3D`.

### Implementation Note

For the canvas streak color fix, add a new CSS variable `--tc-primary-rgb` that provides the primary color as comma-separated RGB values:

```css
/* In themes.css, per theme */
--tc-primary-rgb: 196, 149, 53; /* Terra Grid */
```

Then in the canvas: `rgba(var(--tc-primary-rgb), ${s.alpha})`

This avoids runtime `getComputedStyle` calls in the animation loop.

---

## 4. Surface Hierarchy (Active/Inactive States)

### Active Surfaces (cards, panels with user interaction)

```
background: var(--tc-surface)          /* #232323 */
border: 1px solid var(--tc-border-active)  /* primary/25% */
```

Internal dividers within active surfaces:
```
border-color: var(--tc-border-subtle)  /* primary/12% */
```

### Inactive Surfaces

```
background: var(--tc-bg)               /* #181818 */
border: 1px solid var(--tc-border)     /* #3D3D3D */
```

### Raised Surfaces (ticker, elevated non-modal content)

```
background: var(--tc-surface-raised)   /* #2C2C2C */
border: 1px solid var(--tc-border)     /* #3D3D3D */
```

### Overlay Surfaces (modals, dropdowns, popovers)

```
background: var(--tc-surface-overlay)  /* #313131 — unchanged */
border: 1px solid var(--tc-border)     /* #3D3D3D */
```

### Affected Components

- **Module overview** (`apps/web/app/themes/[slug]/[module]/page.tsx`): Active module card uses `--tc-border-active`. Inactive modules use `--tc-border`. Progress node indicators switch from inline styles to CSS custom properties.
- **Lesson items:** Active lesson row gets `border-bottom: var(--tc-border-subtle)`. Inactive rows get `border-bottom: var(--tc-border)`.
- **Dashboard panels:** Any card with interactive state uses the active/inactive pattern.

---

## 5. Hardcoded Color Fixes

### Difficulty Badges

**File:** `apps/web/app/themes/[slug]/[module]/page.tsx` (lines ~169-176)

**Current (broken):**
```js
const difficultyColors = {
  beginner: "#6BAA8A",     // Always Deep Orbit teal
  intermediate: "#7096B0", // Always structural blue
  advanced: "#A89060",     // Always intuition amber
};
```

**Fix:** Use the theme's tier colors instead:
```js
const difficultyColors = {
  beginner: "var(--tc-tier-identity)",
  intermediate: "var(--tc-tier-structural)",
  advanced: "var(--tc-tier-intuition)",
};
```

These `--tc-tier-*` variables already exist in `themes.css` and change per theme. The badge background uses the same variable at 8% opacity: `background: var(--tc-primary-muted)`.

### Ticker Canvas Streaks

**File:** `apps/web/app/components/ticker.tsx`

Replace `rgba(107,170,138,${s.alpha})` with `rgba(var(--tc-primary-rgb),${s.alpha})`.

### Skip-to-Content Link

**File:** `apps/web/app/layout.tsx` (lines ~298-306)

Replace hardcoded `color: "#1C1C1C"` with `color: "var(--tc-bg)"`.

### Additional Hardcoded `rgba(107,170,138,...)` Instances

These files also contain hardcoded Deep Orbit teal that must be replaced with `rgba(var(--tc-primary-rgb), <alpha>)` or the appropriate `var(--tc-*)` variable:

| File | Usage | Replacement |
|------|-------|-------------|
| `apps/web/app/pricing/pricing-tiers.tsx` | Background tint (`0.12` alpha) | `var(--tc-primary-muted)` or `rgba(var(--tc-primary-rgb), 0.12)` |
| `apps/web/app/settings/settings-form.tsx` | Background tint (`0.06` alpha) | `rgba(var(--tc-primary-rgb), 0.06)` |
| `apps/web/app/components/user-avatar.tsx` | Background tint (`0.12` alpha) | `var(--tc-primary-muted)` or `rgba(var(--tc-primary-rgb), 0.12)` |
| `apps/web/app/glossary/[term]/page.tsx` | Border/highlight (`0.3` alpha) | `rgba(var(--tc-primary-rgb), 0.3)` |
| `apps/web/app/themes/[slug]/capstone/capstone-client.tsx` | Shadow effects (2 instances) | `rgba(var(--tc-primary-rgb), <alpha>)` |

**Out of scope:** References to `rgba(107,170,138,...)` in documentation files (`docs/prd.md`, `docs/ui-ux-notes.md`) are not code and do not affect rendering. They can be updated in a separate docs pass.

---

## 6. Tailwind Configuration Updates

**File:** `packages/config/tailwind/base.css`

**Remap existing utilities** (breaking changes — intentional):

```css
/* CHANGED: was var(--tc-bg), now var(--tc-surface) so bg-surface gives card/nav backgrounds */
--color-surface:         var(--tc-surface);
/* CHANGED: was var(--tc-surface), now var(--tc-surface-raised) */
--color-surface-raised:  var(--tc-surface-raised);
```

**Rationale:** The current mapping `--color-surface: var(--tc-bg)` is confusing — `bg-surface` gives the page background, not a "surface." Remapping so `bg-surface` = card/nav surface (`#232323`) and the page background uses no explicit class (inherits from `body { background: var(--tc-bg) }`). Any component currently using `bg-surface` to mean "page background" must be updated to use no background class or a new `bg-page` utility.

**Add new utility** for page background (if explicit class is needed):

```css
--color-page:            var(--tc-bg);
```

**Add new accent utility mappings:**

```css
--color-border-active:   var(--tc-border-active);
--color-border-subtle:   var(--tc-border-subtle);
--color-glow:            var(--tc-glow);
--color-primary-muted:   var(--tc-primary-muted);
```

This enables classes like `border-border-active`, `bg-primary-muted`, `bg-surface-raised`.

---

## 7. Files to Modify

| File | Change Type | Risk |
| ---- | ----------- | ---- |
| `packages/themes/src/css/themes.css` | Palette values + new variables + `--tc-primary-rgb` | **High** — cascades everywhere |
| `packages/config/tailwind/base.css` | Remap `bg-surface`/`bg-surface-raised` + new utilities | **High** — semantic change |
| `apps/web/app/components/nav.tsx` | Border glow effect + `bg-surface` semantics | Low |
| `apps/web/app/components/mobile-nav.tsx` | Active state classes | Low |
| `apps/web/app/components/ticker.tsx` | Canvas streak color fix → `--tc-primary-rgb` | Medium |
| `apps/web/app/themes/[slug]/[module]/page.tsx` | Difficulty badges + active states | Medium |
| `apps/web/app/layout.tsx` | Skip-to-content hardcoded color | Low |
| `apps/web/app/globals.css` | Potential minor adjustments | Low |
| `apps/web/app/pricing/pricing-tiers.tsx` | Hardcoded teal → CSS variable | Low |
| `apps/web/app/settings/settings-form.tsx` | Hardcoded teal → CSS variable | Low |
| `apps/web/app/components/user-avatar.tsx` | Hardcoded teal → CSS variable | Low |
| `apps/web/app/glossary/[term]/page.tsx` | Hardcoded teal → CSS variable | Low |
| `apps/web/app/themes/[slug]/capstone/capstone-client.tsx` | Hardcoded teal shadows → CSS variable | Low |

---

## 8. What Does NOT Change

- **Typography:** Inter + JetBrains Mono, minimum 12px — unchanged.
- **Border radius:** All `0` (brutalist) — unchanged.
- **Color scheme:** `dark` only — unchanged.
- **Theme primary/accent colors:** All 5 theme primaries and accents stay the same.
- **Layout/structure:** No component restructuring. Changes are purely color/border/glow.
- **Text colors:** `--tc-text` (#E0E0E0) and `--tc-muted` (#A0A0A0) unchanged.

---

## 9. Testing Strategy

1. **Visual regression:** Check all 5 themes on the module overview page, lesson viewer, dashboard, landing page, and auth pages.
2. **WCAG AA audit:** Verify contrast ratios for text on all surface tiers using the new palette values.
3. **Theme switching:** Confirm header glow, ticker streaks, and difficulty badges all update when switching themes.
4. **Mobile:** Verify mobile nav overlay, hamburger button, and active states on small viewports.
5. **Edge cases:** Code blocks on `--tc-code-bg`, selection highlight on new backgrounds, focus outlines.
