# E2E Test Suite Fix + Expansion — Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

30 of 41 Playwright E2E tests are failing. The lesson viewer tests reference a removed sidebar and old navigation patterns. The theme listing tests reference "coming soon" badges that no longer exist. Missing test coverage for pricing and onboarding pages.

## Solution

Fix broken tests to match the current UI. Add new tests for pricing and onboarding flows.

## Changes

### 1. Fix `e2e/themes.spec.ts`

**Broken tests:**
- "shows coming soon badges" → all themes are LIVE now. Change to test for "LIVE" badges.
- "Deep Orbit links to its theme page" → link text may have changed. Update selector.
- "shows sidebar navigation" → sidebar removed. Replace with test for step-based navigation (progress bar, Continue button).
- "has prev/next navigation" → replaced by Continue/Back buttons. Update assertions.

**Keep passing tests:**
- Theme listing shows Deep Orbit ✓
- Module overview shows lessons ✓
- 404 for unknown theme/lesson ✓

### 2. Fix `e2e/accessibility.spec.ts`

**Broken:** Auth pages fail axe due to `<meta http-equiv="refresh">` from Next.js redirect (`/auth/sign-up` → `/auth`). Fix: exclude the `meta-refresh` rule for pages that use Next.js redirects, OR navigate directly to `/auth` (the actual page, not the redirect).

### 3. Add `e2e/pricing.spec.ts`

New test file covering:
- Pricing page loads with all tiers visible (Free, Single $49, bundles)
- Theme selector pills are clickable
- "Get Started" button exists for each tier
- Feature comparison table renders

### 4. Add `e2e/onboarding.spec.ts`

New test file covering:
- Onboarding page loads with welcome step
- Step navigation (Continue button advances)
- Background/Goal/Framework selection steps render options
- Theme selection step shows all 5 themes

Note: Can't test full onboarding flow without auth. Test the UI rendering and step navigation only.

## Verification

1. `npx playwright test` — all tests pass
2. No skipped or `.only` tests
3. Tests run in CI (GitHub Actions)
