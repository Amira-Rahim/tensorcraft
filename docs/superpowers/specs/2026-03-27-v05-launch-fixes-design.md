# V0.5 Launch Fixes Design

> **Scope:** 6 issues blocking V0.5 launch readiness
> **Approach:** Minimal, pragmatic fixes using existing infrastructure
> **Timeline:** 2-3 days of focused work

---

## Context

A full-stack audit revealed 9 potential launch blockers. After verifying each against the actual codebase, 3 were false alarms (exercises work, GitHub integration is complete, no placeholder Discord links). The remaining 6 require targeted fixes.

---

## Fix 1: Email After Payment (Kit Integration)

**Problem:** After `checkout.session.completed`, the webhook records the purchase but never sends a confirmation email. Users pay $79 and get no email proof.

**Solution:** In the webhook handler, after the purchase upsert succeeds, look up the user's email from `profiles` and call the existing Kit client to tag them as a purchaser.

**Changes:**
- `apps/api/src/routes/payments.ts` — After purchase upsert in the `checkout.session.completed` handler:
  1. Query `profiles` for user email using `userId` from session metadata
  2. Call `addSubscriber(email)` (idempotent — safe if already subscribed)
  3. Call `tagSubscriber(email, tagId)` where `tagId` is a **numeric Kit tag ID** (NOT a string slug — the Kit v3 API requires numeric IDs at `/tags/{tagId}/subscribe`)
  4. Wrap in try/catch — Kit failure must not block the purchase flow
  5. Log success/failure for monitoring

**Important:** The existing `tagSubscriber(email, tagId)` function in `apps/api/src/lib/kit.ts` expects a **numeric tag ID**, not a human-readable name. Tag IDs must be created in the Kit dashboard first, then stored as environment variables.

- `apps/api/.env.example` — Add: `KIT_TAG_PURCHASED_DEEP_ORBIT=123456`
- `apps/api/src/routes/payments.ts` — Read tag ID from `process.env.KIT_TAG_PURCHASED_DEEP_ORBIT`

**Kit dashboard setup (manual, not in code):**
- Create tag: "purchased-deep-orbit" → note the numeric tag ID
- Set env var `KIT_TAG_PURCHASED_DEEP_ORBIT` to that numeric ID
- Create automation: When tagged → send "Purchase Confirmation" email
- Email content: theme name, module count, "Start Module 2" CTA, receipt link

**Error handling:** Fire-and-forget. Kit calls wrapped in try/catch. Purchase succeeds regardless of email delivery.

---

## Fix 2: Capstone Certificate PDF Download

**Problem:** The capstone page renders a certificate card with stats but has no download/export option.

**Solution:** Add `@media print` CSS to the capstone page that isolates the certificate card. Add a "Download Certificate" button that triggers `window.print()`.

**Changes:**
- `apps/web/app/themes/[slug]/capstone/page.tsx` — Add a client component `CertificateDownloadButton` with `onClick={() => window.print()}`
- `apps/web/app/themes/[slug]/capstone/print.css` (or inline `<style>`) — Print-specific styles:
  - Hide: nav, footer, AmbientBackground, journey timeline, stats grid, "next theme" teaser
  - Show: certificate card only
  - Style: white background, black text, clean borders, Tensorcraft logo, no neon effects
  - Page size: landscape A4

**No new dependencies.** Browser-native print-to-PDF.

---

## Fix 3: Skill Genome Computation

**Problem:** `skill_events` are recorded but never aggregated into `skill_genome` proficiency scores. The dashboard radar chart shows zeros.

**Solution:** Create a Postgres function `compute_user_skill_genome(p_user_id, p_theme_id)` that reads recent skill_events and upserts computed scores into skill_genome. Call it via RPC after lesson completion.

**New migration:** `packages/supabase/migrations/014_skill_genome_computation.sql`

```sql
CREATE OR REPLACE FUNCTION public.compute_user_skill_genome(
  p_user_id uuid,
  p_theme_id text
) RETURNS void AS $$
DECLARE
  v_axis record;
  v_score numeric;
  v_confidence numeric;
  v_old_proficiency numeric;
  v_velocity numeric;
BEGIN
  FOR v_axis IN
    SELECT DISTINCT skill_axis FROM skill_events
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND created_at > now() - interval '90 days'
  LOOP
    -- Weighted score: pass=+3, complete=+2, bridge=+1, fail=-0.5, hint=-0.25, solution=-1
    SELECT COALESCE(SUM(
      CASE event_type
        WHEN 'exercise_pass' THEN 3
        WHEN 'lesson_complete' THEN 2
        WHEN 'bridge_interaction' THEN 1
        WHEN 'review_recall' THEN 1
        WHEN 'exercise_fail' THEN -0.5
        WHEN 'hint_reveal' THEN -0.25
        WHEN 'solution_view' THEN -1
        ELSE 0
      END
    ), 0) INTO v_score
    FROM skill_events
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND skill_axis = v_axis.skill_axis
      AND created_at > now() - interval '90 days';

    -- Normalize to 0-100
    v_score := GREATEST(0, LEAST(100, v_score * 2));

    -- Confidence: min(1.0, event_count / 50)
    SELECT LEAST(1.0, count(*)::numeric / 50) INTO v_confidence
    FROM skill_events
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND skill_axis = v_axis.skill_axis
      AND created_at > now() - interval '90 days';

    -- Velocity: change vs previous proficiency
    SELECT COALESCE(proficiency, 0) INTO v_old_proficiency
    FROM skill_genome
    WHERE user_id = p_user_id AND theme_id = p_theme_id
      AND skill_axis = v_axis.skill_axis;

    IF NOT FOUND THEN v_old_proficiency := 0; END IF;
    v_velocity := v_score - v_old_proficiency;

    -- Upsert
    INSERT INTO skill_genome (user_id, theme_id, skill_axis, proficiency, confidence, velocity)
    VALUES (p_user_id, p_theme_id, v_axis.skill_axis, v_score, v_confidence, v_velocity)
    ON CONFLICT (user_id, theme_id, skill_axis)
    DO UPDATE SET
      proficiency = EXCLUDED.proficiency,
      confidence = EXCLUDED.confidence,
      velocity = EXCLUDED.velocity,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Trigger point:** In `apps/web/lib/progress-client.ts`, after `markLessonCompleted()` succeeds, call `supabase.rpc("compute_user_skill_genome", { p_user_id: userId, p_theme_id: themeId })` — fire-and-forget, same pattern as streak updates.

**Types update:** Add `compute_user_skill_genome` to the Functions block in `packages/supabase/src/types.ts`.

---

## Fix 4: Test Configuration

**Problem:** 11 test files exist but `apps/api/package.json` has no `test` script. Tests can't run.

**Solution:**
1. Add `"test": "vitest run"` and `"test:watch": "vitest"` to `apps/api/package.json` scripts
2. Ensure `vitest` is available (check root workspace devDependencies)
3. Update rate-limit test to mock the new `@upstash/redis` SDK instead of raw fetch
4. Run all tests and fix any remaining assertion failures

**Scope:** Make existing tests pass. Don't write new tests (that's the axe test task).

---

## Fix 5: Analytics Event Wiring

**Problem:** 8 tracking functions declared in `apps/web/lib/analytics.ts` but never called.

**Callsite wiring:**

| Function | File | Trigger | Notes |
|----------|------|---------|-------|
| `trackLessonStarted` | `lesson-progress.tsx` | Inside `markLessonStarted()` call | Straightforward |
| `trackLessonCompleted` | Same file | After `markLessonCompleted()` succeeds | Straightforward |
| `trackExerciseSubmitted` | **Parent component that provides `onSubmit` to Exercise** (e.g., `lesson-content.tsx`) | When `onSubmit`/`onAttempt` fires | `exercise.tsx` itself lacks `themeId`/`lessonId` — must wire in the parent that has lesson context |
| `trackPaywallShown` | **Already wired** in `lesson-paywall.tsx` | — | Verified: already calls tracking. No work needed. |
| `trackCheckoutStarted` | `checkout-button.tsx` | **Already wired** (line 36) | Verified. No work needed. |
| `trackCheckoutCompleted` | `purchase-success/page.tsx` | On mount | **This page is a server component.** Create a small `<PurchaseAnalytics planId={...} />` client component that fires the event on mount via `useEffect`. |
| `trackThemeSelected` | `onboarding/page.tsx` | When user selects theme in step 5 | Straightforward |
| `trackStreakAchieved` | `progress-client.ts` | After streak RPC call (conditional on streak > 0) | Straightforward |

**Key callouts:**
- `trackExerciseSubmitted` must be wired in the **parent** that passes `onSubmit` to `<Exercise>`, not inside `exercise.tsx` itself (which lacks theme/lesson context).
- `trackCheckoutCompleted` needs a small client component wrapper because `purchase-success/page.tsx` is a server component and `posthog-js` requires `window`.
- `trackPaywallShown` and `trackCheckoutStarted` are already wired — verify only, do not duplicate.

---

## Fix 6: Accessibility (Axe Tests)

**Problem:** `vitest-axe` is installed but no axe tests exist. WCAG violations go undetected.

**Solution:**
1. Create `apps/web/__tests__/accessibility.test.tsx` with axe checks on key **client component** renders
2. Test components that are `"use client"`: auth form, onboarding wizard, lesson progress tracker, settings form, checkout button, mobile nav
3. **Do NOT test server components directly** — `vitest-axe` with `@testing-library/react` runs in jsdom which cannot render async server components. For server-rendered pages (dashboard, lesson), test their presentational client sub-components instead.
4. Fix any violations found (likely: contrast on muted text, missing labels on icon buttons)
5. Test runs as part of `pnpm turbo test`

**Scope limit:** Automated axe testing on client components only. Manual screen reader testing deferred to post-launch.

---

## Fix 7: Documentation Update

After all fixes are implemented, update these docs to match reality:

- **dev-plan.md** — Fix incorrectly marked [x] items, add V0.5 launch checklist
- **product-plan.md** — Update timeline to reflect actual state
- **infrastructure.md** — Already mostly correct from earlier audit

Specific corrections:
- Mark Kit email integration as [x] (after Fix 1)
- Mark skill genome computation as [x] (after Fix 3)
- Mark test configuration as [x] (after Fix 4)
- Mark analytics wiring as [x] (after Fix 5)
- Mark axe accessibility tests as [x] (after Fix 6)
- Change any [x] items that are still actually incomplete to [ ] or [~]
