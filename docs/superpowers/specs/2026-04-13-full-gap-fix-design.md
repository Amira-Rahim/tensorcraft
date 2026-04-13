# Full Gap Fix — Design Spec

**Date:** 2026-04-13
**Status:** Draft

## Problem

An end-to-end audit after the auth consolidation and all-themes launch revealed 14 issues: 1 critical payment bug, 3 high-severity backend issues, 4 medium code/config issues, and 6 stale docs.

## Fixes

### A. Payment Logic (Critical + High)

**A1. Fix planId format mismatch (CRITICAL)**

Frontend `pricing-tiers.tsx` sends kebab-case planIds (`"two-bundle"`, `"three-bundle"`, `"all-five"`) but `PRICING` keys are camelCase (`twoBundle`, `threeBundle`, `allFive`). The API lookup `PRICING[body.planId]` returns `undefined`, rejecting all bundle purchases.

Fix: Change frontend to send camelCase planIds matching the PRICING constant keys.

File: `apps/web/app/pricing/pricing-tiers.tsx`
- Line 171: `planId="two-bundle"` → `planId="twoBundle"`
- Line 209: `planId="three-bundle"` → `planId="threeBundle"`
- Line 240: `planId="all-five"` → `planId="allFive"`

**A2. Webhook silent failure (HIGH)**

File: `apps/api/src/routes/payments.ts`
- Lines 246-249: Replace `break` with `return c.json({ error: "Invalid theme IDs" }, 400)`. Returning 400 tells Stripe not to retry — this is correct because Stripe metadata is immutable after session creation, so retries would never succeed. The key change is logging + returning an error instead of silently swallowing.
- Lines 253-256: Same — replace `break` with `return c.json({ error: "Invalid planId" }, 400)`.
- Lines 259-262: Same — replace `break` with `return c.json({ error: "Invalid session ID" }, 400)`.

**A3. Duplicate purchase race condition (HIGH)**

File: `apps/api/src/routes/payments.ts`
- Line 76: Remove `.eq("status", "completed")` from the existing-purchases query. Check against ALL purchase statuses to prevent TOCTOU race.

**A4. Email tag hardcoded to Deep Orbit (HIGH)**

File: `apps/api/src/routes/payments.ts`
- Lines 298-301: Replace `KIT_TAG_PURCHASED_DEEP_ORBIT` with a generic `KIT_TAG_PURCHASED` env var. If theme-specific tags are needed later, they can be added as a follow-up. For now, one tag for all purchases is correct.
- Update `apps/api/.env` and `apps/api/.env.example` to rename the env var.

### B. Code Consistency (Medium)

**B1. Replace hardcoded "deep-orbit" fallbacks**

Use `DEFAULT_THEME` from `@tensorcraft/shared` instead of string literals:
- `apps/web/app/settings/page.tsx` — `preferred_theme_id ?? DEFAULT_THEME`
- `apps/web/app/dashboard/purchase-success/page.tsx` — `purchasedThemeIds[0] ?? DEFAULT_THEME`
- `apps/web/app/layout.tsx` — `data-theme={DEFAULT_THEME}`
- `apps/web/app/api/og/route.tsx` — `theme || DEFAULT_THEME`

**B2. Remove Vercel preview domain from CORS**

File: `apps/api/.env`
- Remove `https://tensorcraft.vercel.app` from CORS_ORIGINS. Only keep production domains. Dev localhost is auto-included by the CORS middleware in non-production mode.

**B3. Add DB constraint for preferred_theme_id**

New migration: `packages/supabase/migrations/016_theme_id_check.sql`
```sql
ALTER TABLE profiles
ADD CONSTRAINT chk_valid_theme_id
CHECK (preferred_theme_id IS NULL OR preferred_theme_id IN ('deep-orbit','neon-protocol','signal-ward','nova-canvas','terra-grid'));
```

**B4. Deprecate waitlist (documentation only)**

Add a comment to `apps/api/src/routes/waitlist.ts` noting the waitlist was designed for "coming soon" themes and is now used only for general newsletter signups. No code deletion — the route still works and may be repurposed.

### C. Documentation Updates (Low)

Update 6 docs to remove V0.5 / "coming soon" / "Deep Orbit first" references:
- `docs/prd.md` — Section 3.1: change all "Coming soon" to "Available"
- `docs/dev-plan.md` — Lines 32, 133, 596: mark as obsolete
- `docs/product-plan.md` — Risk assessment: remove "only 1 theme at launch"
- `docs/architecture.md` — Remove "coming soon metadata" reference
- `docs/tech-spec.md` — Remove `ThemeStatus` enum definition
- `docs/api-reference.md` — Update waitlist example source

### D. Test Coverage

File: `apps/api/src/routes/payments.test.ts`
- Add `allFive: { price: 219, themes: 5, label: "All 5 Themes" }` to the PRICING mock.
- Fix the webhook test mock: the test mocks `insert` but the production code uses `upsert` (payments.ts line 270). Update the mock from `insert` to `upsert` and update the corresponding assertions so the webhook test actually exercises the real code path.

## Verification

1. `pnpm build` passes
2. API accepts `planId: "twoBundle"` for 2-theme checkout
3. API accepts `planId: "allFive"` for all-5 checkout
4. Webhook returns 400 (not silent break) on invalid metadata
5. Duplicate purchase blocked regardless of existing purchase status
6. No remaining hardcoded `"deep-orbit"` strings in app code (outside DEFAULT_THEME)
7. Docs contain no "coming soon" or V0.5 references
