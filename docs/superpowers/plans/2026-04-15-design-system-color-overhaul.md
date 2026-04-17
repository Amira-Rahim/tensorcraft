# Design System Color Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Tensorcraft color palette, surface hierarchy, header, and hardcoded colors to create proper visual depth and theme identity.

**Architecture:** Update CSS custom properties in `themes.css` (foundation), remap Tailwind utilities in `base.css`, then cascade changes through components. The `bg-surface` semantic shift (from page-background to card-surface) affects 42 files and is the highest-risk change — handled as a dedicated bulk migration task.

**Tech Stack:** CSS custom properties, `color-mix()`, Tailwind CSS v4 `@theme` block, Next.js React components

**Spec:** `docs/superpowers/specs/2026-04-15-design-system-color-overhaul.md`

---

### Task 1: Update Theme CSS Variables (Foundation)

**Files:**
- Modify: `packages/themes/src/css/themes.css`

This is the foundation — every subsequent task depends on these values being correct.

- [ ] **Step 1: Update shared neutral values in Deep Orbit (`:root`) block**

In `packages/themes/src/css/themes.css`, update the `:root, [data-theme="deep-orbit"]` block. Change these existing variables:

```css
--tc-bg: #181818;
--tc-surface: #232323;
/* --tc-surface-overlay stays #313131 — unchanged */
--tc-border: #3d3d3d;
--tc-code-bg: #141414;
```

Add these new variables inside the same block, after `--tc-code-bg`:

```css
/* New surface tier */
--tc-surface-raised: #2c2c2c;

/* RGB triplet for canvas/inline rgba() usage — must stay in sync with --tc-primary */
--tc-primary-rgb: 107, 170, 138;

/* Derived accent variables */
--tc-border-active: color-mix(in srgb, var(--tc-primary) 25%, transparent);
--tc-border-subtle: color-mix(in srgb, var(--tc-primary) 12%, transparent);
--tc-glow: color-mix(in srgb, var(--tc-primary) 10%, transparent);
--tc-primary-muted: color-mix(in srgb, var(--tc-primary) 8%, transparent);
```

- [ ] **Step 2: Update Neon Protocol block**

Same neutral changes (`--tc-bg`, `--tc-surface`, `--tc-border`, `--tc-code-bg`) plus add the new variables. The only difference is `--tc-primary-rgb`:

```css
--tc-primary-rgb: 74, 144, 217;
```

All other new variables (`--tc-surface-raised`, `--tc-border-active`, `--tc-border-subtle`, `--tc-glow`, `--tc-primary-muted`) are identical across themes because they derive from `var(--tc-primary)`.

- [ ] **Step 3: Update Signal Ward block**

Same neutral changes. Signal Ward `--tc-primary-rgb`:

```css
--tc-primary-rgb: 101, 192, 125;
```

- [ ] **Step 4: Update Nova Canvas block**

Same neutral changes. Nova Canvas `--tc-primary-rgb`:

```css
--tc-primary-rgb: 192, 96, 96;
```

- [ ] **Step 5: Update Terra Grid block**

Same neutral changes. Terra Grid `--tc-primary-rgb`:

```css
--tc-primary-rgb: 196, 149, 53;
```

- [ ] **Step 6: Verify — check the file compiles**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && pnpm build --filter=@tensorcraft/themes 2>&1 | head -20`

Expected: Build succeeds (or no build step for CSS-only package — in that case, check the dev server loads without CSS errors).

- [ ] **Step 7: Commit**

```bash
git add packages/themes/src/css/themes.css
git commit -m "feat(themes): update palette to bold contrast + add accent variables

New neutrals: bg #181818, surface #232323, border #3D3D3D, raised #2C2C2C.
Add --tc-primary-rgb, --tc-border-active, --tc-border-subtle, --tc-glow,
--tc-primary-muted derived via color-mix() per theme."
```

---

### Task 2: Update Tailwind Configuration

**Files:**
- Modify: `packages/config/tailwind/base.css`

- [ ] **Step 1: Remap existing utilities and add new ones**

In `packages/config/tailwind/base.css`, update the `@theme` block. Replace the current background surfaces section:

```css
/* Background surfaces */
--color-surface: var(--tc-bg);
--color-surface-raised: var(--tc-surface);
--color-surface-overlay: var(--tc-surface-overlay);
--color-code-bg: var(--tc-code-bg);
```

With:

```css
/* Background surfaces — REMAPPED for clarity */
/* bg-page: explicit page background (#181818) */
--color-page: var(--tc-bg);
/* bg-surface: card/panel/nav backgrounds (#232323) — was var(--tc-bg), now var(--tc-surface) */
--color-surface: var(--tc-surface);
/* bg-surface-raised: ticker, elevated non-modal content (#2C2C2C) — was var(--tc-surface), now var(--tc-surface-raised) */
--color-surface-raised: var(--tc-surface-raised);
--color-surface-overlay: var(--tc-surface-overlay);
--color-code-bg: var(--tc-code-bg);
```

Add new accent utilities inside the `@theme` block, after the existing `--color-border-focus` line:

```css
/* Theme-derived accent borders and surfaces */
--color-border-active: var(--tc-border-active);
--color-border-subtle: var(--tc-border-subtle);
--color-glow: var(--tc-glow);
--color-primary-muted: var(--tc-primary-muted);
```

- [ ] **Step 2: Commit**

```bash
git add packages/config/tailwind/base.css
git commit -m "feat(tailwind): remap surface utilities + add accent color mappings

bg-surface now maps to --tc-surface (#232323) instead of --tc-bg.
bg-page added for explicit page background. New utilities:
border-border-active, border-border-subtle, bg-glow, bg-primary-muted."
```

---

### Task 3: Migrate `bg-surface` Usage (Bulk)

**Files:**
- Modify: 42 files across `apps/web/` (see list below)

The `bg-surface` class previously meant "page background" (`#1C1C1C` → now `#181818`). After the Tailwind remap, `bg-surface` means "card/panel surface" (`#232323`). Components using `bg-surface` as a page background must switch to `bg-page` or remove the class (body already has `background: var(--tc-bg)`).

**Strategy:** Most `bg-surface` usages fall into two categories:
1. **Page/section backgrounds** (e.g., `<main className="min-h-screen bg-surface">`) — change to `bg-page`
2. **Card/component surfaces** (e.g., nav, hamburger button, overlays) — keep as `bg-surface` (the new meaning is correct)

- [ ] **Step 1: Bulk search-and-categorize**

Run: `grep -rn "bg-surface\b" apps/web/ --include="*.tsx" --include="*.ts" | grep -v "bg-surface-" | head -60`

Categorize each hit: does it describe a page/section background or a card/component surface?

**Page backgrounds** (change to `bg-page`): These are typically `<main>`, `<div>` wrappers with `min-h-screen`, loading pages, error pages, and full-page sections. Examples:
- `apps/web/app/themes/[slug]/[module]/page.tsx:54` — `<main className="min-h-screen px-6 py-20 bg-surface ...">` → `bg-page`
- Loading pages (`loading.tsx` files) — typically full-page → `bg-page`
- Error pages (`error.tsx` files) — typically full-page → `bg-page`
- Full-page routes like `pricing/page.tsx`, `learn/page.tsx`, etc. → `bg-page`

**Card/component surfaces** (keep as `bg-surface`): These are navs, buttons, overlays, cards. Examples:
- `apps/web/app/components/nav.tsx:52` — nav bar → keep `bg-surface`
- `apps/web/app/components/mobile-nav.tsx:57` — hamburger button → keep `bg-surface`
- `apps/web/app/components/mobile-nav.tsx:66` — overlay → keep `bg-surface`
- `apps/web/app/components/ticker.tsx:121` — ticker label section → keep `bg-surface`

- [ ] **Step 2: Replace page backgrounds with `bg-page`**

For each file where `bg-surface` is used as a page/section background, replace `bg-surface` with `bg-page`. This is a mechanical replacement — no logic changes.

Work through the 42 files systematically. Use the Edit tool for each file, replacing only `bg-surface` instances that represent page backgrounds (not `bg-surface-raised` or `bg-surface-overlay` — leave those alone).

- [ ] **Step 3: Verify the dev server renders correctly**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && pnpm dev --filter=web 2>&1 | head -20`

Open the browser and spot-check:
- Landing page background should be `#181818`
- Nav should be `#232323` (slightly lighter than page)
- Module overview page background should be `#181818`

- [ ] **Step 4: Commit**

```bash
git add apps/web/
git commit -m "refactor(web): migrate bg-surface page backgrounds to bg-page

42 files updated. bg-surface now means card/panel surface (#232323).
Page/section backgrounds use bg-page (#181818) or inherit from body."
```

---

### Task 4: Header Border Glow

**Files:**
- Modify: `apps/web/app/components/nav.tsx`

- [ ] **Step 1: Update nav element classes**

In `apps/web/app/components/nav.tsx` line 52, replace:

```tsx
className="sticky top-0 z-50 h-15 flex items-center justify-between px-8 bg-surface border-b border-border"
```

With:

```tsx
className="sticky top-0 z-50 h-15 flex items-center justify-between px-8 bg-surface border-b border-border-active relative"
```

Changes: `border-border` → `border-border-active` (primary-tinted border), added `relative` for the glow pseudo-element.

- [ ] **Step 2: Add the glow div**

Add a glow child element inside the `<nav>`, just before the closing `</nav>` tag (after the MobileNav div). In `nav.tsx`, after line 78 (`</div>`) and before line 79 (`</nav>`):

```tsx
      {/* Theme-tinted downward glow */}
      <div
        className="absolute -bottom-2 left-0 right-0 h-2 pointer-events-none z-49"
        style={{
          background: "linear-gradient(to bottom, var(--tc-glow), transparent)",
        }}
        aria-hidden="true"
      />
```

- [ ] **Step 3: Verify in browser**

Check the nav on any page. You should see:
- Nav background is `#232323` (lighter than page)
- Bottom border has a primary-colored tint
- Soft 8px glow fades downward below the nav
- The glow color changes per theme (check Deep Orbit teal vs Terra Grid orange)

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/nav.tsx
git commit -m "feat(nav): add theme-tinted border glow to header

Bottom border uses border-active (primary/25%). 8px downward glow
using linear-gradient with --tc-glow. Adapts to all 5 themes."
```

---

### Task 5: Fix Ticker Canvas Streaks

**Files:**
- Modify: `apps/web/app/components/ticker.tsx`

- [ ] **Step 1: Replace hardcoded color in canvas draw function**

In `apps/web/app/components/ticker.tsx` line 55, replace:

```tsx
ctx.strokeStyle = `rgba(107,170,138,${s.alpha})`;
```

With:

```tsx
ctx.strokeStyle = `rgba(var(--tc-primary-rgb),${s.alpha})`;
```

**Wait** — CSS variables don't work directly in canvas `strokeStyle`. The canvas API needs raw color strings. We need to read the CSS variable once and cache it.

Instead, update the `draw` function to read the CSS variable. Replace the `draw` callback (lines 32-61) approach:

In the `TickerCanvas` component, add a ref to cache the color:

After line 9 (`const frame = useRef(0);`), add:

```tsx
const primaryRgb = useRef("107,170,138");
```

In the `useEffect` (around line 63), after `resize();` and before `frame.current = requestAnimationFrame(draw);`, add:

```tsx
// Read theme primary RGB from CSS variable
const style = getComputedStyle(c);
const rgb = style.getPropertyValue("--tc-primary-rgb").trim();
if (rgb) primaryRgb.current = rgb;
```

Then in the `draw` callback, line 55, replace:

```tsx
ctx.strokeStyle = `rgba(107,170,138,${s.alpha})`;
```

With:

```tsx
ctx.strokeStyle = `rgba(${primaryRgb.current},${s.alpha})`;
```

- [ ] **Step 2: Verify in browser**

Switch between themes. The ticker canvas streaks should change color:
- Deep Orbit: teal streaks
- Neon Protocol: blue streaks
- Terra Grid: orange/amber streaks

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/components/ticker.tsx
git commit -m "fix(ticker): use theme-aware primary color for canvas streaks

Was hardcoded to Deep Orbit teal rgba(107,170,138). Now reads
--tc-primary-rgb CSS variable at mount and uses per-theme color."
```

---

### Task 6: Module Overview — Difficulty Badges + Active States

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/page.tsx`

- [ ] **Step 1: Replace hardcoded difficulty colors**

In `apps/web/app/themes/[slug]/[module]/page.tsx` lines 25-29, replace:

```tsx
const difficultyColors = {
  beginner: "#6BAA8A",
  intermediate: "#7096B0",
  advanced: "#A89060",
};
```

With:

```tsx
const difficultyColors = {
  beginner: "var(--tc-tier-identity)",
  intermediate: "var(--tc-tier-structural)",
  advanced: "var(--tc-tier-intuition)",
};
```

- [ ] **Step 2: Update the main page background class**

Line 54 — this should already be `bg-page` from Task 3. Verify it reads:

```tsx
<main className="min-h-screen px-6 py-20 bg-page relative overflow-hidden">
```

- [ ] **Step 3: Update lesson card active/inactive borders**

Line 120-121, the lesson `<Link>` currently has:

```tsx
className="p-5 flex items-center justify-between transition-colors brutalist-hover border border-border bg-surface-raised"
```

This is fine as-is — `bg-surface-raised` now correctly maps to `#2C2C2C`, and `border-border` maps to `#3D3D3D`. No change needed for inactive cards.

For active module distinction (if the current module card needs the active treatment), this would be handled in a parent component. For now, all lesson cards use the same neutral border — the difficulty badges and progress nodes provide the active state signal.

- [ ] **Step 4: Verify in browser**

Navigate to any module overview page. Check:
- Difficulty badges show theme-appropriate colors (not always Deep Orbit teal)
- Switch themes — badge colors should change
- Page background is `#181818`, cards are `#2C2C2C`

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/themes/[slug]/[module]/page.tsx
git commit -m "fix(module-overview): use theme-aware tier colors for difficulty badges

Was hardcoded to Deep Orbit palette. Now uses --tc-tier-identity,
--tc-tier-structural, --tc-tier-intuition which change per theme."
```

---

### Task 7: Fix Remaining Hardcoded Colors (5 Files)

**Files:**
- Modify: `apps/web/app/pricing/pricing-tiers.tsx`
- Modify: `apps/web/app/settings/settings-form.tsx`
- Modify: `apps/web/app/components/user-avatar.tsx`
- Modify: `apps/web/app/glossary/[term]/page.tsx`
- Modify: `apps/web/app/themes/[slug]/capstone/capstone-client.tsx`

- [ ] **Step 1: Fix pricing-tiers.tsx (line 112)**

Replace `bg-[rgba(107,170,138,0.12)]` with `bg-primary-muted`:

Find: `bg-[rgba(107,170,138,0.12)]`
Replace with: `bg-primary-muted`

Note: `--tc-primary-muted` is `primary/8%` while the original was `0.12`. If the visual difference matters, use the arbitrary value `bg-[color-mix(in_srgb,var(--tc-primary)_12%,transparent)]` instead. Start with `bg-primary-muted` and adjust if needed visually.

- [ ] **Step 2: Fix settings-form.tsx (line 558)**

Replace the inline style:

Find: `"rgba(107,170,138,0.06)"`
Replace with: `"color-mix(in srgb, var(--tc-primary) 6%, transparent)"`

Also fix line ~406 if it has a hardcoded fallback `#6BAA8A` in a boxShadow — replace with `var(--tc-primary)`.

- [ ] **Step 3: Fix user-avatar.tsx (line 36)**

Replace the inline style:

Find: `"rgba(107,170,138,0.12)"`
Replace with: `"color-mix(in srgb, var(--tc-primary) 12%, transparent)"`

- [ ] **Step 4: Fix glossary/[term]/page.tsx (line 118)**

Replace the hardcoded domain colors:

Find:
```tsx
color: domain === "ml" ? "#7096B0" : "#6BAA8A",
borderColor: domain === "ml" ? "rgba(112,150,176,0.3)" : "rgba(107,170,138,0.3)",
```

Replace with:
```tsx
color: domain === "ml" ? "var(--tc-tier-structural)" : "var(--tc-tier-identity)",
borderColor: domain === "ml"
  ? "color-mix(in srgb, var(--tc-tier-structural) 30%, transparent)"
  : "color-mix(in srgb, var(--tc-tier-identity) 30%, transparent)",
```

- [ ] **Step 5: Fix capstone-client.tsx (lines 21, 59)**

Line 21 — replace:
```tsx
boxShadow: hov ? `4px 4px 0 rgba(107,170,138,0.3)` : "none",
```
With:
```tsx
boxShadow: hov ? `4px 4px 0 rgba(var(--tc-primary-rgb),0.3)` : "none",
```

**Wait** — `rgba(var(...))` doesn't work in inline styles because the browser parses the style attribute as a raw string, not CSS. For inline styles in JSX, use `color-mix`:

```tsx
boxShadow: hov ? `4px 4px 0 color-mix(in srgb, var(--tc-primary) 30%, transparent)` : "none",
```

Apply the same pattern to line 59 (with `15%` instead of `30%`):

```tsx
boxShadow: hov ? `3px 3px 0 color-mix(in srgb, var(--tc-primary) 15%, transparent)` : "none",
```

- [ ] **Step 6: Verify in browser**

Check each page with multiple themes:
- Pricing page: recommended tier card has theme-colored tint
- Settings: profile and notification preferences render correctly
- User avatar: fallback background matches theme
- Glossary term: domain badge colors use theme palette
- Capstone: hover shadows use theme color

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/pricing/pricing-tiers.tsx apps/web/app/settings/settings-form.tsx apps/web/app/components/user-avatar.tsx apps/web/app/glossary/[term]/page.tsx apps/web/app/themes/[slug]/capstone/capstone-client.tsx
git commit -m "fix: replace hardcoded Deep Orbit teal with theme-aware variables

5 files had rgba(107,170,138,...) hardcoded, always showing Deep Orbit
teal regardless of active theme. Now uses --tc-primary, --tc-tier-*,
and color-mix() for proper theme switching."
```

---

### Task 8: Mobile Nav Updates

**Files:**
- Modify: `apps/web/app/components/mobile-nav.tsx`

- [ ] **Step 1: Update active nav link borders**

The mobile nav active states currently use `border-border` and hardcoded `border-primary` / `bg-primary/10` patterns. These should use the new accent utilities where appropriate.

Line 111 — active nav links already use `text-primary` (correct). The `border-b border-border` on nav links transitions automatically to `#3D3D3D` — more visible now. No change needed for nav links.

Lines 129-133 — Dashboard active state currently uses `border-primary bg-primary/10 text-primary`. This is fine — `border-primary` gives full primary color for the active button, which is the correct design. Keep as-is.

Lines 140-144 — Settings button — same pattern, keep as-is.

The palette cascade from Task 1 (new `--tc-border` = `#3D3D3D`) automatically improves mobile nav border visibility. **No manual changes needed in this file.**

- [ ] **Step 2: Verify in browser (mobile viewport)**

Open the site at mobile width (< 768px):
- Hamburger button border should be clearly visible (`#3D3D3D`)
- Open menu — overlay background should be `#232323` (card surface)
- Nav link borders should be visible
- Active states should show primary color

- [ ] **Step 3: Commit (skip if no changes)**

If no changes were made, skip this commit. The mobile nav benefits from the cascade.

---

### Task 9: Fix Layout Skip-to-Content

**Files:**
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 1: Replace hardcoded color**

In `apps/web/app/layout.tsx` line ~303, replace:

```tsx
style={{
  background: "var(--tc-primary, #6BAA8A)",
  color: "#1C1C1C",
}}
```

With:

```tsx
style={{
  background: "var(--tc-primary, #6BAA8A)",
  color: "var(--tc-bg, #181818)",
}}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/layout.tsx
git commit -m "fix(layout): use CSS variable for skip-to-content text color

Was hardcoded #1C1C1C, now uses var(--tc-bg) to stay in sync with
the updated page background."
```

---

### Task 10: Visual Verification Across All Themes

- [ ] **Step 1: Start dev server**

Run: `cd /Users/amira.salah/Desktop/tensorcraft && pnpm dev --filter=web`

- [ ] **Step 2: Check Deep Orbit (default)**

Navigate to:
- `/` — landing page: header has teal glow, page bg `#181818`, nav bg `#232323`
- `/themes/deep-orbit/edge-ai-basics` — module overview: difficulty badges use theme colors, cards have visible borders
- Ticker: canvas streaks are teal, label section distinct from ticker body

- [ ] **Step 3: Switch to each remaining theme and spot-check**

For each theme (neon-protocol, signal-ward, nova-canvas, terra-grid):
- Header glow changes color
- Ticker streaks change color
- Difficulty badges change color
- Active card borders show theme tint
- All text remains readable (no contrast issues)

- [ ] **Step 4: Check mobile viewport**

Resize to < 768px:
- Hamburger button borders visible
- Mobile nav overlay has proper bg
- Active states show theme color

- [ ] **Step 5: WCAG spot-check**

Use browser DevTools accessibility panel or axe extension:
- Text on `#181818` background: contrast ≥ 4.5:1
- Text on `#232323` surface: contrast ≥ 4.5:1
- Muted text on all surfaces: contrast ≥ 4.5:1

- [ ] **Step 6: Document any remaining issues**

If any component looks wrong after the cascade, note it for a follow-up fix. The spec declares documentation files (`docs/prd.md`, `docs/ui-ux-notes.md`) out of scope — they can be updated in a separate pass.
