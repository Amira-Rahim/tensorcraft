# Upgrade Path (Pay the Difference) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users who own themes to upgrade to bundles by paying only the difference. Auto-grant if credit covers the full price.

**Architecture:** Backend calculates credit from prior completed purchases, charges the difference via Stripe (or auto-grants if $0). Frontend shows adjusted prices and handles the new `{ granted: true }` response.

**Tech Stack:** Hono API, Stripe Checkout, Supabase, React

**Spec:** `docs/superpowers/specs/2026-04-14-upgrade-path-design.md`

---

### Task 1: Backend — Replace duplicate-purchase block with credit calculation

**Files:**
- Modify: `apps/api/src/routes/payments.ts:70-88`

- [ ] **Step 1: Replace the duplicate-purchase block**

Replace lines 70-88 (the current block that rejects checkout if ANY theme is owned) with upgrade-aware logic:

```typescript
// Calculate credit from prior purchases for upgrade path
const supabase = getSupabaseServerClient(c.get("accessToken"));
const { data: existingPurchases } = await supabase
  .from("purchases")
  .select("theme_ids, amount")
  .eq("user_id", userId)
  .eq("status", "completed");

const ownedThemes = new Set<string>();
let credit = 0;

if (existingPurchases && existingPurchases.length > 0) {
  for (const p of existingPurchases) {
    for (const t of p.theme_ids) {
      ownedThemes.add(t);
    }
    // Credit from purchases that overlap with requested themes
    const overlaps = p.theme_ids.some((t: string) => body.themeIds.includes(t));
    if (overlaps) {
      credit += Number(p.amount);
    }
  }

  // If ALL requested themes are already owned, reject
  const allOwned = body.themeIds.every((id) => ownedThemes.has(id));
  if (allOwned) {
    return c.json({ error: "You already own all these themes" }, 400);
  }
}

// Cap credit at plan price to prevent over-crediting
credit = Math.min(credit, plan.price);
const adjustedPrice = Math.max(0, plan.price - credit);
const isUpgrade = credit > 0;
```

- [ ] **Step 2: Add auto-grant for $0 upgrades**

After the credit calculation, before the Stripe session creation, add:

```typescript
// Auto-grant if credit covers the full price
if (adjustedPrice === 0) {
  const { error: grantError } = await supabase.from("purchases").insert({
    user_id: userId,
    plan_id: body.planId,
    theme_ids: body.themeIds,
    amount: 0,
    status: "completed",
    stripe_session_id: `auto_grant_${crypto.randomUUID()}`,
  });

  if (grantError) {
    return c.json({ error: "Failed to grant themes" }, 500);
  }

  return c.json({ granted: true, themes: body.themeIds });
}
```

- [ ] **Step 3: Modify Stripe session to use adjusted price**

Change the `line_items` price from `plan.price * 100` to `adjustedPrice * 100`. Add credit info to metadata:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: "payment",
  client_reference_id: userId,
  line_items: [
    {
      price_data: {
        currency: "usd",
        product_data: {
          name: isUpgrade
            ? `Tensorcraft — Upgrade to ${plan.label}`
            : `Tensorcraft — ${plan.label}`,
          description: `Access to ${body.themeIds.join(", ")}`,
        },
        unit_amount: adjustedPrice * 100, // cents — adjusted for credit
      },
      quantity: 1,
    },
  ],
  metadata: {
    planId: body.planId,
    themeIds: body.themeIds.join(","),
    creditApplied: String(credit),
    originalPrice: String(plan.price),
  },
  success_url: `${appUrl}/dashboard/purchase-success`,
  cancel_url: `${appUrl}/pricing?purchase=cancelled`,
});
```

- [ ] **Step 4: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 2: Backend — Update webhook validation for upgrades

**Files:**
- Modify: `apps/api/src/routes/payments.ts` (webhook handler, ~line 250)

- [ ] **Step 1: Accept adjusted amounts in webhook**

In the webhook's `checkout.session.completed` handler, after reading metadata, update the amount validation:

```typescript
const creditApplied = Number(metadata.creditApplied || "0");
const expectedAmount = plan.price - creditApplied;

// Validate paid amount matches expected (exact — integer cents, no rounding)
const paidAmount = amount ? amount / 100 : expectedAmount;
if (Math.abs(paidAmount - expectedAmount) > 0.01) {
  console.error("Webhook: Amount mismatch", { paidAmount, expectedAmount, creditApplied });
  return c.json({ error: "Webhook: Amount mismatch" }, 400);
}
```

Store the actual amount paid (not the plan price):

```typescript
amount: paidAmount,  // was: amount ? amount / 100 : plan.price
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 3: Frontend — Handle auto-grant response in CheckoutButton

**Files:**
- Modify: `apps/web/app/pricing/checkout-button.tsx:96-103`

- [ ] **Step 1: Handle { granted: true } response**

After `const { url } = await response.json();` (line 98), change to:

```typescript
const data = await response.json();

if (data.granted) {
  // Auto-grant — redirect to success page without Stripe
  window.location.href = "/dashboard/purchase-success";
  return;
}

if (data.url) {
  window.location.href = data.url;
} else {
  setError("No checkout URL received. Please try again.");
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 4: Frontend — Show adjusted prices in PricingTiers

**Files:**
- Modify: `apps/web/app/pricing/pricing-tiers.tsx`

- [ ] **Step 1: Add owned themes state and credit calculation**

At the top of the `PricingTiers` component, add state for owned themes and amounts:

```typescript
const [ownedThemes, setOwnedThemes] = useState<Set<string>>(new Set());
const [totalCredit, setTotalCredit] = useState(0);

useEffect(() => {
  const supabase = getSupabaseBrowserClient();
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) return;
    supabase
      .from("purchases")
      .select("theme_ids, amount")
      .eq("user_id", session.user.id)
      .eq("status", "completed")
      .then(({ data }) => {
        if (!data) return;
        const owned = new Set<string>();
        let credit = 0;
        for (const p of data) {
          for (const t of p.theme_ids) owned.add(t);
          credit += Number(p.amount);
        }
        setOwnedThemes(owned);
        setTotalCredit(credit);
      });
  });
}, []);
```

Add import for `getSupabaseBrowserClient` from `@/lib/supabase/client` and `useEffect`.

- [ ] **Step 2: Show adjusted prices on each tier**

For each pricing tier, calculate and display the adjusted price. For the Single tier:

```tsx
{totalCredit > 0 && singleTheme && !ownedThemes.has(singleTheme) && (
  <p className="text-xs font-mono text-primary mb-2">
    Includes ${totalCredit} credit from prior purchases
  </p>
)}
```

For bundle tiers, show adjusted price next to the original:

```tsx
const twoAdjusted = Math.max(0, PRICING.twoBundle.price - totalCredit);
// Show: "Pay $50" with "(includes $79 credit)" if credit applies
```

- [ ] **Step 3: Lock owned themes in ThemePicker**

Pass `ownedThemes` to the ThemePicker. In the ThemePicker component, pre-select owned themes and show "Owned" badge:

```tsx
// In ThemePicker, for each theme button:
const isOwned = ownedThemes?.has(t.slug);
// If owned: pre-selected, can't deselect, shows "OWNED" badge
// If not owned: normal toggle behavior
```

- [ ] **Step 4: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 5: Tests

**Files:**
- Modify: `apps/api/src/routes/payments.test.ts`

- [ ] **Step 1: Add upgrade path tests**

Add test cases for:
1. User with no prior purchases → normal checkout (full price)
2. User who owns 1 theme → upgrade to 2-theme bundle (adjusted price)
3. User who owns enough for auto-grant → `{ granted: true }` response
4. User who owns ALL themes → 400 "already own all"
5. Credit capped at plan price (no over-crediting)

- [ ] **Step 2: Run tests**

Run: `cd apps/api && pnpm test 2>&1 | tail -20`

---

### Task 6: Update docs

**Files:**
- Modify: `docs/dev-plan.md`
- Modify: `docs/api-reference.md`
- Modify: `docs/product-plan.md`

- [ ] **Step 1: Update dev-plan**

Mark the upgrade path task as completed:
```
[x] Upgrade credit logic (pay difference when moving to higher tier). COMPLETED 2026-04-14.
```

- [ ] **Step 2: Update api-reference**

Add upgrade path documentation to the POST /api/payments/checkout section:
- New request behavior: if user owns overlapping themes, credit is calculated
- New response: `{ granted: true, themes: [...] }` for auto-grant
- New metadata fields: `creditApplied`, `originalPrice`

- [ ] **Step 3: Update product-plan**

Mark the upgrade path section as implemented.

- [ ] **Step 4: Final build verification**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

## Critical Files

| File | Action |
|------|--------|
| `apps/api/src/routes/payments.ts` | Modify — credit calculation, auto-grant, adjusted Stripe session |
| `apps/web/app/pricing/checkout-button.tsx` | Modify — handle `{ granted: true }` response |
| `apps/web/app/pricing/pricing-tiers.tsx` | Modify — show adjusted prices, lock owned themes |
| `apps/api/src/routes/payments.test.ts` | Modify — add upgrade path tests |
| `docs/dev-plan.md`, `docs/api-reference.md`, `docs/product-plan.md` | Update |
