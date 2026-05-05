# Upgrade Path (Pay the Difference) — Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

Users who buy a single theme ($49) cannot upgrade to a bundle. The checkout API rejects any purchase that includes already-owned themes with "You already own this theme" (400 error). The product plan explicitly promises "pay the difference" upgrades.

## Solution

Calculate credit from prior purchases and charge only the difference. If credit covers the full price, auto-grant instantly without Stripe.

## Changes

### 1. Backend: Checkout endpoint (`apps/api/src/routes/payments.ts`)

**Current behavior (lines 70-88):** Blocks checkout if ANY theme is already owned.

**New behavior:**
1. Query all completed purchases for the user → build `ownedThemes` set and `totalPaid` sum
2. Separate the requested `themeIds` into `newThemes` (not owned) and `existingThemes` (already owned)
3. If ALL themes are already owned → return 400 "You already own all these themes"
4. If SOME themes are already owned (upgrade case):
   - Calculate `credit = sum of amounts from completed purchases whose theme_ids overlap with the request`
   - Calculate `adjustedPrice = plan.price - credit`
   - If `adjustedPrice <= 0`: **auto-grant** — insert purchase record directly, skip Stripe, return `{ granted: true, themes: themeIds }`
   - If `adjustedPrice > 0`: create Stripe checkout with `adjustedPrice` as the line item amount. Store `creditApplied` and `originalPrice` in session metadata.
5. If NO themes are already owned → existing behavior (full price checkout)

**Credit calculation:**
```
creditFromPriorPurchases = SUM(amount) FROM purchases
  WHERE user_id = userId
  AND status = 'completed'
  AND theme_ids && requestedThemeIds  -- array overlap operator
```

Credit is **capped at the target plan price** to prevent over-crediting. Example: a user who bought two separate bundles ($79 + $99 = $178) and upgrades to All 5 ($129) gets at most $129 credit, not $178. `adjustedPrice = max(0, plan.price - credit)`.

**Important:** Both the `ownedThemes` set and the credit query must filter by `status = 'completed'`. Pending, failed, or refunded purchases do not count as credit.

**API response contract:**
- Normal checkout: `{ url: string }` — Stripe checkout URL
- Auto-grant: `{ granted: true, themes: string[] }` — themes granted instantly
- Error: `{ error: string }` — validation failure

### 2. Backend: Auto-grant endpoint

When `adjustedPrice <= 0`, the API creates a purchase record directly without Stripe:

```sql
INSERT INTO purchases (user_id, plan_id, theme_ids, amount, status, stripe_session_id)
VALUES ($userId, $planId, $allThemeIds, 0, 'completed', 'auto_grant_' || gen_random_uuid())
```

The `stripe_session_id` uses an `auto_grant_` prefix to distinguish from Stripe-created records. The amount is 0 since the user already paid enough.

### 3. Backend: Webhook validation

The webhook handler already validates `amount_total` against `plan.price`. For upgrade sessions, it needs to accept the adjusted amount:

- Read `creditApplied` from session metadata
- Expected amount = `plan.price - creditApplied`
- Validate `session.amount_total / 100` matches expected amount exactly (integer cents, no rounding needed)

### 4. Frontend: Show adjusted pricing (`pricing-tiers.tsx`)

When a user is logged in and owns themes:
1. Fetch owned themes via the existing `purchases` query in `CheckoutButton`
2. For each pricing tier, calculate the adjusted price
3. Display: "Pay $30" with subtext "(includes $49 credit from Deep Orbit)" if the user has credit
4. The `themeIds` passed to `CheckoutButton` always includes ALL themes for the tier (owned + new)

### 5. Frontend: CheckoutButton changes (`checkout-button.tsx`)

- Handle the `{ granted: true }` response from auto-grant — redirect to `/dashboard/purchase-success` without going through Stripe
- Update the "Already Owned" state: only show when user owns ALL themes of the tier (already works this way)
- Show adjusted price on the button text when credit applies: "Upgrade — $30 →" instead of "Get Started →"

### 6. Frontend: ThemePicker changes (`pricing-tiers.tsx`)

For multi-theme tiers (2, 3), when the user already owns some themes:
- Pre-select owned themes in the picker (they're locked — can't be deselected)
- Show a small "Owned" badge on pre-selected themes
- User picks remaining themes to fill the tier
- If owned themes already fill the tier (e.g., user owns 2 themes and looks at "Two Themes" tier), show "Already Owned ✓" instead of the picker

## What Doesn't Change

- PRICING constants — prices stay the same
- Webhook handler for normal purchases — unchanged flow
- Purchase success page — works for both normal and upgrade purchases
- Single-theme tier — if user already owns that theme, "Already Owned" shows (no upgrade needed)
- All 5 tier — always includes all themes, adjusted price calculated automatically

## Verification

1. `pnpm build` passes
2. User with no purchases → sees full prices, normal checkout
3. User who owns Deep Orbit ($49) → "Two Themes" shows "$30" (was $79), "All 5" shows "$80" (was $129)
4. User clicks "Two Themes" upgrade → Stripe checkout for $30 → themes granted
5. User who owns enough to cover a bundle → instant grant, no Stripe
6. User who owns ALL themes → "Already Owned ✓"
7. Tests cover: credit calculation, adjusted price, auto-grant, webhook validation
8. Docs updated: dev-plan, api-reference, product-plan
