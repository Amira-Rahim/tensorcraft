# Accessibility & Readability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix readability issues — bump minimum font to 12px, switch prose to sans-serif, improve contrast ratios, fix theme colors, remove a11y test suppression.

**Architecture:** CSS custom property changes for contrast, global find-and-replace for font sizes, selective `font-sans` class additions for prose. No layout changes, no new components.

**Tech Stack:** Tailwind CSS 4, CSS custom properties, Next.js 15

**Spec:** `docs/superpowers/specs/2026-04-13-accessibility-readability-design.md`

---

### Task 1: Improve contrast — update CSS custom properties

**Files:**
- Modify: `packages/themes/src/css/themes.css`

- [ ] **Step 1: Update --tc-text and --tc-muted in all 5 theme blocks**

In `packages/themes/src/css/themes.css`, find-and-replace across all theme blocks:

```css
/* In ALL 5 theme blocks (lines 19-20, 49-50, 77-78, 105-106, 133-134): */
--tc-text: #c8c8c8;    →  --tc-text: #e0e0e0;
--tc-muted: #8a8a8a;    →  --tc-muted: #a0a0a0;
```

This is 5 occurrences of each (one per theme block).

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 2: Fix failing theme primary colors

**Files:**
- Modify: `packages/themes/src/signal-ward.ts`
- Modify: `packages/themes/src/terra-grid.ts`
- Modify: `packages/themes/src/css/themes.css`

- [ ] **Step 1: Update Signal Ward primary**

In `packages/themes/src/signal-ward.ts`, change:
```ts
primary: "#5BAA70",  →  primary: "#65C07D",
```

In `packages/themes/src/css/themes.css` (signal-ward block, line 73), change:
```css
--tc-primary: #5baa70;  →  --tc-primary: #65c07d;
```

Also update `--tc-tier-identity` in the same block (line 82):
```css
--tc-tier-identity: #5baa70;  →  --tc-tier-identity: #65c07d;
```

- [ ] **Step 2: Update Terra Grid primary**

In `packages/themes/src/terra-grid.ts`, change:
```ts
primary: "#B08030",  →  primary: "#C49535",
```

In `packages/themes/src/css/themes.css` (terra-grid block, line 129), change:
```css
--tc-primary: #b08030;  →  --tc-primary: #c49535;
```

Also update `--tc-tier-identity` in the same block (line 138):
```css
--tc-tier-identity: #b08030;  →  --tc-tier-identity: #c49535;
```

Also update `--tc-axis-deployment` in ALL theme blocks where it references `#b08030` — this is lines 38, 66, 94, 122, 150:
```css
--tc-axis-deployment: #b08030;  →  --tc-axis-deployment: #c49535;
```

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 3: Replace text-[9px] with text-xs (33 occurrences, 11 files)

**Files:** 11 files across `apps/web/` and `packages/ui/`

- [ ] **Step 1: Global replace**

Using the Edit tool with `replace_all: true` on each file, change `text-[9px]` to `text-xs` in all 11 files:

1. `apps/web/app/onboarding/page.tsx` (11 occurrences)
2. `apps/web/app/components/five-worlds-section.tsx` (2)
3. `apps/web/app/components/site-footer.tsx` (1)
4. `apps/web/app/components/bridge-preview-section.tsx` (3)
5. `apps/web/app/components/ticker.tsx` (1)
6. `apps/web/app/themes/[slug]/module-map-client.tsx` (3)
7. `apps/web/app/themes/[slug]/page.tsx` (1)
8. `apps/web/app/dashboard/bridge-collection.tsx` (2)
9. `apps/web/app/page.tsx` (1)
10. `apps/web/app/dashboard/skill-genome.tsx` (7)
11. `packages/ui/src/mdx/bridge-callout.tsx` (1)

- [ ] **Step 2: Verify no text-[9px] remains**

Run: `grep -rn 'text-\[9px\]' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'`
Expected: Zero matches (excluding docs/specs)

---

### Task 4: Replace text-[10px] with text-xs (59 occurrences, 21 files)

**Files:** 21 files across `apps/web/` and `packages/ui/`

- [ ] **Step 1: Global replace**

Using the Edit tool with `replace_all: true` on each file, change `text-[10px]` to `text-xs` in all 21 files:

1. `apps/web/app/onboarding/page.tsx` (2)
2. `apps/web/app/themes/[slug]/module-map-client.tsx` (4)
3. `apps/web/app/themes/[slug]/page.tsx` (1)
4. `apps/web/app/blog/page.tsx` (1)
5. `apps/web/app/themes/[slug]/[module]/page.tsx` (2)
6. `apps/web/app/bridges/[concept]/page.tsx` (7)
7. `apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx` (2)
8. `apps/web/app/themes/[slug]/[module]/[lesson]/mobile-lesson-nav.tsx` (2)
9. `apps/web/app/themes/[slug]/capstone/page.tsx` (1)
10. `apps/web/app/themes/page.tsx` (1)
11. `apps/web/app/page.tsx` (1)
12. `packages/ui/src/mdx/bridge-callout.tsx` (3)
13. `apps/web/app/components/bridge-preview-section.tsx` (3)
14. `packages/ui/src/mdx/code-block.tsx` (1)
15. `apps/web/app/components/mobile-nav.tsx` (2)
16. `apps/web/app/components/five-worlds-section.tsx` (3)
17. `apps/web/app/components/site-footer.tsx` (7)
18. `apps/web/app/components/nav.tsx` (1)
19. `apps/web/app/glossary/glossary-list.tsx` (4)
20. `apps/web/app/glossary/[term]/page.tsx` (7)
21. `apps/web/app/dashboard/bridge-collection.tsx` (4)

- [ ] **Step 2: Verify no text-[10px] remains**

Run: `grep -rn 'text-\[10px\]' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'`
Expected: Zero matches

---

### Task 5: Replace text-[11px] with text-xs or text-sm (53 occurrences, 25 files)

**Files:** 25 files across `apps/web/` and `packages/ui/`

- [ ] **Step 1: Replace text-[11px] with text-xs as default**

Change `text-[11px]` to `text-xs` (12px — a conservative 1px bump rather than jumping to 14px). This avoids breaking compact layouts. Use `replace_all: true` on each file:

1. `apps/web/app/onboarding/page.tsx` (6)
2. `apps/web/app/bridges/[concept]/page.tsx` (4)
3. `packages/ui/src/mdx/bridge-callout.tsx` (4)
4. `packages/ui/src/mdx/exercise.tsx` (2)
5. `packages/ui/src/mdx/concept.tsx` (3)
6. `packages/ui/src/mdx/hint-panel.tsx` (1)
7. `packages/ui/src/mdx/next-lesson.tsx` (1)
8. `apps/web/app/components/bridge-preview-section.tsx` (1)
9. `apps/web/app/page.tsx` (3)
10. `apps/web/app/glossary/page.tsx` (1)
11. `apps/web/app/components/hero-section.tsx` (1)
12. `apps/web/app/glossary/glossary-list.tsx` (3)
13. `apps/web/app/glossary/[term]/page.tsx` (1)
14. `apps/web/app/components/auth-form.tsx` (1)
15. `apps/web/app/themes/[slug]/module-map-client.tsx` (2)
16. `apps/web/app/components/ticker.tsx` (3)
17. `apps/web/app/components/mdx/concept.tsx` (3)
18. `apps/web/app/components/mdx/math-block.tsx` (2)
19. `apps/web/app/themes/[slug]/[module]/[lesson]/error.tsx` (1)
20. `apps/web/app/components/mdx/next-lesson.tsx` (1)
21. `apps/web/app/dashboard/bridge-collection.tsx` (1)
22. `apps/web/app/themes/page.tsx` (1)
23. `apps/web/app/dashboard/error.tsx` (1)
24. `apps/web/app/pricing/pricing-tiers.tsx` (4)
25. `apps/web/app/blog/page.tsx` (2)

- [ ] **Step 2: Verify no text-[11px] remains**

Run: `grep -rn 'text-\[11px\]' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'`
Expected: Zero matches

---

### Task 6: Add font-sans to prose content

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx` — lesson body prose wrapper
- Modify: `apps/web/app/onboarding/page.tsx` — explanatory text
- Modify: `apps/web/app/pricing/page.tsx` — tier descriptions

- [ ] **Step 1: Add font-sans to lesson content wrapper**

In `apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx`, find the prose/MDX content wrapper div and add `font-sans` class. The lesson body is rendered inside a max-w-3xl container — add `font-sans` to that wrapper so all prose renders in Inter while code blocks (which have their own `font-mono`) stay monospace.

- [ ] **Step 2: Add font-sans to page descriptions selectively**

In page files that have descriptive `<p>` elements (pricing descriptions, onboarding explanations), add `font-sans` to those specific elements. Do NOT add to navigation, labels, or code — those stay mono.

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 7: Regenerate snapshot tests

**Files:**
- Modify: `apps/web/app/components/__snapshots__/nav.snapshot.test.tsx.snap`

- [ ] **Step 1: Delete existing snapshots and regenerate**

The font-size class changes will break snapshot tests. Delete the snapshot files and regenerate:

Run: `rm -f apps/web/app/components/__snapshots__/*.snap`
Run: `cd apps/web && npx vitest run app/components/nav.snapshot.test.tsx --update 2>&1 | tail -10`

- [ ] **Step 2: Verify snapshots are updated**

Check the updated snapshot file exists and contains the new class names (text-xs instead of text-[9px]).

---

### Task 8: Remove color-contrast test suppression

**Files (9 test files):**
- `apps/web/app/components/nav.test.tsx`
- `apps/web/app/components/site-footer.test.tsx`
- `apps/web/app/components/cookie-consent.test.tsx`
- `apps/web/app/privacy/page.a11y.test.tsx`
- `apps/web/app/terms/page.a11y.test.tsx`
- `packages/ui/src/mdx/dialogue.test.tsx`
- `packages/ui/src/mdx/learning-objectives.test.tsx`
- `packages/ui/src/mdx/hint-panel.test.tsx`
- `packages/ui/src/mdx/key-takeaways.test.tsx`

- [ ] **Step 1: Remove suppression from all 9 files**

In each file, find and remove `"color-contrast": { enabled: false }` from the axe rules configuration. If the `rules` object becomes empty after removal, remove the entire `rules` property.

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

- [ ] **Step 3: Verify no suppression remains**

Run: `grep -rn 'color-contrast.*enabled.*false' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'`
Expected: Zero matches

---

## Verification Checklist

After all tasks complete:

- [ ] `pnpm build` passes (9/9)
- [ ] `grep -rn 'text-\[9px\]' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'` → zero matches
- [ ] `grep -rn 'text-\[10px\]' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'` → zero matches
- [ ] `grep -rn 'text-\[11px\]' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'` → zero matches
- [ ] `grep -rn 'color-contrast.*enabled.*false' apps/web/ packages/ui/ --include='*.tsx' --include='*.ts'` → zero matches
- [ ] `--tc-text` is `#e0e0e0` and `--tc-muted` is `#a0a0a0` in all 5 theme blocks
- [ ] Signal Ward primary is `#65c07d`, Terra Grid primary is `#c49535`
- [ ] Visual check: landing page, lesson viewer, dashboard, pricing readable at default zoom
