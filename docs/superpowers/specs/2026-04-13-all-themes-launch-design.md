# All Themes Simultaneous Launch — Design Spec

**Date:** 2026-04-13
**Status:** Draft

## Problem

The codebase assumes Deep Orbit launches first and the other 4 themes are "coming soon." This is enforced through a `status` field on each theme manifest and hardcoded UI layouts. All 5 themes now have complete content, and the decision has been made to launch all themes simultaneously.

## Solution

Remove the `ThemeStatus` type and `status` field from theme manifests entirely — all themes are available. Update every UI component that filters or branches on theme status.

## Changes

### 1. Remove ThemeStatus type and status field

**`packages/themes/src/types.ts`**
- Remove the `ThemeStatus` type (`"launched" | "coming-soon" | "beta" | "hidden"`)
- Remove the `status` field from the `ThemeManifest` interface
- Remove the `ThemeComingSoon` interface and `comingSoon?` optional field from `ThemeManifest` if present

**`packages/themes/src/index.ts`**
- Remove `ThemeStatus` from exports

**Theme manifest files (5 files):**
- `packages/themes/src/deep-orbit.ts` — remove `status: "launched"`
- `packages/themes/src/neon-protocol.ts` — remove `status: "coming-soon"`
- `packages/themes/src/signal-ward.ts` — remove `status: "coming-soon"`
- `packages/themes/src/nova-canvas.ts` — remove `status: "coming-soon"`
- `packages/themes/src/terra-grid.ts` — remove `status: "coming-soon"`

**`packages/themes/src/theme-properties.test.ts`**
- Remove the assertion that checks `theme.status` matches the status pattern

### 2. Landing Page Five Worlds Section

**File:** `apps/web/app/components/five-worlds-section.tsx`

Current: Deep Orbit as large hero card + 4 smaller "coming soon" cards with estimated dates.

Replace with: 5 equal-sized cards in a responsive grid (3 cols desktop, 2 tablet, 1 mobile). Each card shows theme name, subtitle, color accent, "LIVE" badge, and "Explore →" CTA linking to `/themes/{slug}`. Remove coming-soon dates and waitlist captures from this section.

Source card data from the `themes` import (`@tensorcraft/themes`) instead of the current hardcoded `HERO` and `COMING` inline constants.

Also remove the footer text "Others coming -- join waitlists" (line 502) since all themes are now live.

### 3. Themes Listing Page

**File:** `apps/web/app/themes/page.tsx`

Current: Filters themes into `featured` (`status === "launched"`) and `comingSoon` (`status === "coming-soon"`), renders differently.

Replace: Show all themes as equal launched cards. Remove the `featured`/`comingSoon` split. Remove `ComingSoonCard` import.

### 4. Pricing Page

**File:** `apps/web/app/pricing/page.tsx`

Current: Only Deep Orbit purchasable. Bundle section says "available when additional themes launch." Single-theme checkout hardcodes `themeIds={["deep-orbit"]}`.

Changes:
- Enable all pricing tiers: Single ($79), Two ($129), Three ($169), All 5 ($219)
- Single-theme tier: add theme selector so users pick which theme
- Multi-theme tiers (2, 3): add theme picker for selecting which themes to include
- All 5 tier: no selector needed — includes everything
- Remove "available when additional themes launch" text
- Checkout button `themeIds` prop becomes dynamic based on selection. The existing `CheckoutButton` component already accepts an arbitrary `themeIds: string[]` prop and the payment API validates against `THEME_SLUGS` (all 5 are valid) — no changes needed to `CheckoutButton` itself, only to the `themeIds` value passed in by the pricing page.

### 5. Onboarding Theme Selection

**File:** `apps/web/app/onboarding/page.tsx`

Current: Only Deep Orbit selectable. Others disabled with "SOON" badge. Pre-selects "deep-orbit".

Changes:
- All 5 themes selectable
- No pre-selected default — user must choose
- Remove "SOON" badges
- Remove the `available` flag logic that checks `themes[slug].status`

### 6. Dashboard

**File:** `apps/web/app/dashboard/page.tsx`

Current: Filters `launchedThemes` by `t.status === "launched"` (line 69).

Change: Use all themes instead of filtering. Remove the status filter.

### 7. Capstone Page

**File:** `apps/web/app/themes/[slug]/capstone/page.tsx`

Current: Lines 119-128 filter "other launched themes" and fall back to "coming-soon" themes.

Change: Show all other themes (exclude current). Remove status-based filtering. Also remove the status-conditional logic in the teaser link section (~lines 443-498) where `teaserTheme.status === "launched"` controls the link href and button text ("Explore" vs "Coming Soon"). All teasers should link directly to `/themes/{slug}` with "Explore" text.

### 8. Constants

**File:** `packages/shared/src/constants.ts`

- Remove "Deep Orbit launches first (V0.5)" comment
- Update V0.5 scope comment to reflect all themes available

## What Doesn't Change

- **Database schema** — no theme status stored in DB
- **Payment API** — validates against `THEME_SLUGS` which already includes all 5
- **Content pipeline** — all 5 themes have full MDX content
- **Coming soon modal** (`apps/web/app/themes/coming-soon-modal.tsx`) — delete. No themes use "coming-soon" status.
- **Coming soon card** (`apps/web/app/themes/coming-soon-card.tsx`) — delete. No longer imported after themes page update.

## Verification

1. `pnpm build` passes
2. Visit `/` — Five Worlds section shows 5 equal cards, all clickable
3. Visit `/themes` — all 5 themes displayed as full cards (no coming-soon cards)
4. Visit `/pricing` — all tiers enabled, theme selection works for purchases
5. Visit `/onboarding` — step 4 shows all 5 themes selectable, none pre-selected
6. Visit `/dashboard` — shows all themes in theme switcher
7. Complete a checkout for a non-Deep-Orbit theme — purchase succeeds
8. TypeScript compiles with no references to removed `ThemeStatus` type
