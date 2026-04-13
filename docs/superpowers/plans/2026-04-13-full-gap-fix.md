# Full Gap Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 14 issues found in end-to-end audit — critical payment bug, backend logic gaps, code consistency, stale docs.

**Architecture:** Surgical fixes across frontend, backend API, database, and documentation. No new features — only corrections to existing behavior.

**Tech Stack:** Next.js 15, Hono API, Supabase (Postgres), Stripe, Kit email

**Spec:** `docs/superpowers/specs/2026-04-13-full-gap-fix-design.md`

---

### Task 1: Fix planId format mismatch (CRITICAL)

**Files:**
- Modify: `apps/web/app/pricing/pricing-tiers.tsx:171,209,240`

- [ ] **Step 1: Fix the three planId values**

Change kebab-case to camelCase to match the `PRICING` constant keys:

```tsx
// Line 171: "two-bundle" → "twoBundle"
planId="twoBundle"

// Line 209: "three-bundle" → "threeBundle"
planId="threeBundle"

// Line 240: "all-five" → "allFive"
planId="allFive"
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 2: Fix webhook silent failures

**Files:**
- Modify: `apps/api/src/routes/payments.ts:246-262`

- [ ] **Step 1: Replace `break` with error responses**

At line 248, replace `break;` with:
```ts
return c.json({ error: "Webhook: Invalid theme IDs in metadata" }, 400);
```

At line 255, replace `break;` with:
```ts
return c.json({ error: "Webhook: Invalid planId in metadata" }, 400);
```

At line 261, replace `break;` with:
```ts
return c.json({ error: "Webhook: Invalid session ID format" }, 400);
```

Note: 400 is correct — Stripe metadata is immutable after session creation, so retries would never succeed. The key improvement is returning an explicit error response instead of silently swallowing.

- [ ] **Step 2: Verify API builds**

Run: `cd apps/api && pnpm build`
Expected: No errors

---

### Task 3: Fix duplicate purchase race condition

**Files:**
- Modify: `apps/api/src/routes/payments.ts:76`

- [ ] **Step 1: Remove the status filter**

Delete `.eq("status", "completed")` from line 76 so the query checks ALL purchases regardless of status:

```ts
// Before:
  .eq("user_id", userId)
  .eq("status", "completed");

// After:
  .eq("user_id", userId);
```

- [ ] **Step 2: Verify API builds**

Run: `cd apps/api && pnpm build`
Expected: No errors

---

### Task 4: Fix email tag hardcoded to Deep Orbit

**Files:**
- Modify: `apps/api/src/routes/payments.ts:298`
- Modify: `apps/api/.env`
- Modify: `apps/api/.env.example:37`

- [ ] **Step 1: Rename env var in payments.ts**

Line 298, change:
```ts
// Before:
const purchaseTagId = process.env.KIT_TAG_PURCHASED_DEEP_ORBIT;

// After:
const purchaseTagId = process.env.KIT_TAG_PURCHASED;
```

- [ ] **Step 2: Add env var to .env**

The live `.env` file does not currently contain a `KIT_TAG_PURCHASED_DEEP_ORBIT` entry (it was never set). Add a new line:
```
KIT_TAG_PURCHASED=
```
The numeric tag ID should be obtained from the Kit dashboard and filled in before production use.

- [ ] **Step 3: Rename in .env.example**

Line 37, change:
```
KIT_TAG_PURCHASED_DEEP_ORBIT=
```
to:
```
# Kit purchase tag (numeric ID — triggers confirmation email for any theme purchase)
KIT_TAG_PURCHASED=
```

---

### Task 5: Replace hardcoded "deep-orbit" fallbacks with DEFAULT_THEME

**Files:**
- Modify: `apps/web/app/settings/page.tsx:55`
- Modify: `apps/web/app/dashboard/purchase-success/page.tsx:34`
- Modify: `apps/web/app/layout.tsx:74`
- Modify: `apps/web/app/api/og/route.tsx:10,14`

- [ ] **Step 1: Update settings page**

Add import `import { DEFAULT_THEME } from "@tensorcraft/shared";` and change line 55:
```ts
// Before:
(profileRecord?.preferred_theme_id as string) ?? "deep-orbit"
// After:
(profileRecord?.preferred_theme_id as string) ?? DEFAULT_THEME
```

- [ ] **Step 2: Update purchase-success page**

Add import and change line 34:
```ts
// Before:
const firstTheme = purchasedThemeIds[0] ?? "deep-orbit";
// After:
const firstTheme = purchasedThemeIds[0] ?? DEFAULT_THEME;
```

- [ ] **Step 3: Update layout.tsx**

Add import and change line 74:
```tsx
// Before:
data-theme="deep-orbit"
// After:
data-theme={DEFAULT_THEME}
```

- [ ] **Step 4: Update OG route**

Add import and change lines 10 and 14:
```ts
// Before:
const theme = searchParams.get("theme") || "deep-orbit";
themes[theme]?.palette.primary || themes["deep-orbit"].palette.primary;
// After:
const theme = searchParams.get("theme") || DEFAULT_THEME;
themes[theme]?.palette.primary || themes[DEFAULT_THEME].palette.primary;
```

- [ ] **Step 5: Verify no remaining hardcoded "deep-orbit" in app code**

Run: `grep -rn '"deep-orbit"' apps/web/app/ --include='*.tsx' --include='*.ts'`
Expected: Zero matches

- [ ] **Step 6: Verify build**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks

---

### Task 6: Remove Vercel preview domain from CORS

**Files:**
- Modify: `apps/api/.env:11`
- Modify: `apps/api/.env.example:13`

- [ ] **Step 1: Update .env**

Line 11, change:
```
CORS_ORIGINS=https://tensorcraft.app,https://www.tensorcraft.app,https://tensorcraft.vercel.app
```
to:
```
CORS_ORIGINS=https://tensorcraft.app,https://www.tensorcraft.app
```

- [ ] **Step 2: Update .env.example**

Line 13, change:
```
CORS_ORIGINS=http://localhost:3000,https://tensorcraft.app,https://www.tensorcraft.app,https://tensorcraft.vercel.app
```
to:
```
CORS_ORIGINS=http://localhost:3000,https://tensorcraft.app,https://www.tensorcraft.app
```

---

### Task 7: Add DB constraint for preferred_theme_id

**Files:**
- Create: `packages/supabase/migrations/016_theme_id_check.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Constrain preferred_theme_id to valid theme slugs
ALTER TABLE profiles
ADD CONSTRAINT chk_valid_theme_id
CHECK (preferred_theme_id IS NULL OR preferred_theme_id IN (
  'deep-orbit',
  'neon-protocol',
  'signal-ward',
  'nova-canvas',
  'terra-grid'
));
```

---

### Task 8: Deprecate waitlist route (comment only)

**Files:**
- Modify: `apps/api/src/routes/waitlist.ts:1`

- [ ] **Step 1: Add deprecation comment**

Add after line 1:
```ts
/**
 * Waitlist route — originally designed for "coming soon" theme interest capture.
 * All 5 themes now launch simultaneously, so theme-specific waitlist signups
 * are no longer needed. This route is kept for general newsletter signups
 * and may be repurposed in the future.
 */
```

---

### Task 9: Fix payment test coverage

**Files:**
- Modify: `apps/api/src/routes/payments.test.ts:42-47,22-23`

- [ ] **Step 1: Add allFive to PRICING mock**

Line 46, after `threeBundle`, add:
```ts
    allFive: { price: 219, themes: 5, label: "All 5 Themes" },
```

- [ ] **Step 2: Fix mock from insert to upsert**

Line 23, change:
```ts
// Before:
          insert: mockInsert,
// After:
          upsert: mockInsert,
```

- [ ] **Step 3: Run tests**

Run: `cd apps/api && pnpm test 2>&1 | tail -20`
Expected: Tests pass (some may need assertion updates if they reference `insert`)

---

### Task 10: Update stale documentation (6 files)

**Files:**
- Modify: `docs/prd.md`
- Modify: `docs/dev-plan.md`
- Modify: `docs/product-plan.md`
- Modify: `docs/architecture.md`
- Modify: `docs/tech-spec.md`
- Modify: `docs/api-reference.md`

- [ ] **Step 1: Update prd.md**

In Section 3.1 theme table, change all "Coming soon" statuses to "Available". Remove the "V0.5 Status" column header.

- [ ] **Step 2: Update dev-plan.md**

At lines referencing V0.5 / "Deep Orbit only" / "coming soon" gating (lines 32, 133, 596), add:
```
> **OBSOLETE (2026-04-13):** All 5 themes now launch simultaneously. Theme status field removed.
```

- [ ] **Step 3: Update product-plan.md**

Find "only 1 theme at launch" in risk assessment and update to "All 5 themes available at launch."

- [ ] **Step 4: Update architecture.md**

Remove reference to "coming soon metadata" near line 75.

- [ ] **Step 5: Update tech-spec.md**

Remove the `status` row (line 166, type `ThemeStatus`) and the `comingSoon` row (line 172, type `ThemeComingSoon`) from the Theme Manifest table. Add a note above the table: "All themes are available. No status field — theme manifests contain only content and visual identity."

- [ ] **Step 6: Update api-reference.md**

Change waitlist example `"source": "coming-soon-modal"` to `"source": "newsletter"`.

- [ ] **Step 7: Final build verification**

Run: `pnpm build 2>&1 | tail -5`
Expected: 9 successful tasks, no errors

---

## Verification Checklist

After all tasks complete:

- [ ] `pnpm build` passes (9/9)
- [ ] `grep -rn "two-bundle\|three-bundle\|all-five" apps/web/` returns zero matches
- [ ] `grep -rn '"deep-orbit"' apps/web/app/ --include='*.tsx' --include='*.ts'` returns zero matches
- [ ] `grep -rn "KIT_TAG_PURCHASED_DEEP_ORBIT" apps/api/` returns zero matches
- [ ] `grep -rn "coming-soon\|Coming soon\|V0.5\|V05_SCOPE" docs/` returns only historical/archived references
- [ ] `grep -rn "tensorcraft.vercel.app" apps/api/` returns zero matches
