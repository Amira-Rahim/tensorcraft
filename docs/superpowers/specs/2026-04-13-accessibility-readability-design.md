# Accessibility & Readability Improvements — Design Spec

**Date:** 2026-04-13
**Status:** Draft

## Problem

The app's dark aesthetic causes measurable readability issues:
- 54% of UI text uses 9-11px font sizes — below readable thresholds for many users
- Muted text (#8A8A8A) has only 4.1:1 contrast against the background (#1C1C1C) — barely passes WCAG AA and fails at small sizes
- All prose content uses monospace (JetBrains Mono) — less readable than sans-serif for long-form educational text
- Two theme primary colors (Signal Ward #5BAA70, Terra Grid #B08030) fail WCAG AA contrast at 4.2:1
- Accessibility tests explicitly disable color-contrast checking, hiding violations

## Solution

Improve readability while preserving the dark brutalist aesthetic. No light mode. No new color palette. Just make existing content readable.

## Changes

### 1. Minimum Font Size: 12px

Replace all sub-12px font sizes across the app:

| Current | Replace with | Affected count |
|---------|-------------|----------------|
| `text-[9px]` | `text-xs` (12px) | ~32 uses |
| `text-[10px]` | `text-xs` (12px) | ~55 uses |
| `text-[11px]` | `text-sm` (14px) | ~42 uses |

Files affected: Most components in `packages/ui/src/mdx/`, `apps/web/app/components/`, page files across the app.

Approach: Global find-and-replace of the three Tailwind classes, then visual review of each page to ensure layouts aren't broken by the size increase. Note: `text-[11px]` → `text-sm` is a 27% jump (11→14px); review these cases carefully and use `text-xs` (12px) instead where 14px would break a compact layout (badges, inline tags). Snapshot test files (`__snapshots__/*.snap`) will need regeneration after the class renames.

### 2. Prose Font: Inter (sans-serif) for body text

Currently the entire app uses JetBrains Mono. Educational prose (lesson content, descriptions, onboarding text) should use Inter for better readability.

**Keep monospace (JetBrains Mono) for:**
- Code blocks and inline code
- Labels, badges, section markers (`// MODULE 3`)
- Navigation text
- Data displays (prices, stats, counts)
- The "T_ TENSORCRAFT" brand mark

**Switch to Inter for:**
- Lesson body text (MDX rendered content)
- Page descriptions and subtitles
- Onboarding explanatory text
- Pricing tier descriptions
- Error messages and help text

Implementation: Add a `font-sans` class to prose containers. The lesson page in `apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx` renders MDX body — apply `font-sans` to the prose wrapper there. For other pages, apply selectively to `<p>` and description text.

### 3. Contrast Improvements

**Muted text color:**
- Current: `#8A8A8A` (4.1:1 on #1C1C1C)
- New: `#A0A0A0` (5.3:1 on #1C1C1C) — passes WCAG AA at all sizes

**Primary text color:**
- Current: `#C8C8C8` (8.2:1)
- New: `#E0E0E0` (11.4:1) — passes WCAG AAA

Update in: `packages/themes/src/css/themes.css` — the `--tc-text` and `--tc-muted` custom properties. All 5 themes share these values, so one change applies everywhere.

**Fix failing theme primary colors:**
- Signal Ward: `#5BAA70` (4.2:1) → `#65C07D` (5.0:1)
- Terra Grid: `#B08030` (4.2:1) → `#C49535` (5.1:1)

Update in: `packages/themes/src/signal-ward.ts` and `packages/themes/src/terra-grid.ts` — the `palette.primary` values.

### 4. Fix accessibility test suppression

Remove `rules: { "color-contrast": { enabled: false } }` from axe configuration in ALL test files that suppress it. Known files include `privacy/page.a11y.test.tsx`, `terms/page.a11y.test.tsx`, `nav.test.tsx`, `site-footer.test.tsx`, `cookie-consent.test.tsx`, and any MDX component tests in `packages/ui/src/mdx/`. Search for `color-contrast.*enabled.*false` across the codebase and remove every instance. After the contrast fixes above, these tests should pass without suppression.

## What Doesn't Change

- Dark mode only — no light mode toggle
- Background color (#1C1C1C) stays the same
- Color palette identity (greens, blues, reds per theme)
- Brutalist/terminal aesthetic
- Code blocks remain monospace
- Layout, spacing, and component structure

## Verification

1. `pnpm build` passes
2. No `text-[9px]`, `text-[10px]`, or `text-[11px]` classes remain in the codebase
3. Lesson content renders in Inter (sans-serif), code blocks in JetBrains Mono
4. `--tc-muted` value is `#A0A0A0` and `--tc-text` is `#E0E0E0` in themes.css
5. Signal Ward and Terra Grid primary colors pass WCAG AA (4.5:1+)
6. Accessibility tests run without `color-contrast: { enabled: false }` suppression
7. Visual check: landing page, lesson viewer, dashboard, pricing all readable at default zoom
