# Tensorcraft → 100k Paying Users: Code & Content Transformation Plan

> **For agentic workers:** This is a PROGRAM plan, not a single-feature TDD plan. It decomposes the pivot into 6 workstreams (WS0–WS5). Each workstream marked "→ spawn TDD plan" should get its own `docs/superpowers/plans/` implementation plan (via superpowers:writing-plans) before coding. Steps here are scoped at the task level, not the 2-minute TDD-step level.

**Goal:** Shift Tensorcraft from a single-user, one-time, per-theme course purchase into a platform whose code + content can plausibly support 100,000 *paying* users.

**Why the current shape caps out (grounded in the codebase):**
- Monetization is one-time Stripe `mode:"payment"` only ([payments.ts:154](../../../apps/api/src/routes/payments.ts)), ladder `$0/$59/$99/$129/$159` ([constants.ts:38-55](../../../packages/shared/src/constants.ts)). LTV ≈ one purchase. No recurring revenue → paid acquisition can't close (CAC > LTV).
- One theme is actually purchasable (`LAUNCHED_THEMES = ["deep-orbit"]`, [constants.ts:20](../../../packages/shared/src/constants.ts)). TAM is narrowed to "frontend devs who want ML."
- Everything is keyed to an individual `user_id`. No teams/orgs/seats → no way to sell 100k seats via ~1,000 contracts.
- All gamification is single-player (`RLS auth.uid() = user_id`). No cross-user layer → no viral loop. The "Arena" exists only in [product-plan.md:303-313](../../product-plan.md).

**The reframe:** 100k paying is reached by stacking four levers, each of which maps to concrete code/content work:
1. **Widen TAM** (WS4) — more people qualify to buy.
2. **Fix unit economics** (WS1) — subscription so LTV > 3×CAC → ads become viable.
3. **Multiply reach** (WS2 + WS5) — viral arena + SEO free-content funnel.
4. **Leverage the count** (WS3) — enterprise seats: 1 contract = hundreds/thousands of users.

Plus WS0 (instrumentation) as the measurement substrate under all of it.

**Tech Stack (confirmed):** Next.js (`apps/web`), Hono API (`apps/api`), Supabase (Postgres + Auth + RLS), Stripe Checkout, Velite content pipeline, PostHog (EU) analytics, Kit + Resend email, in-browser TensorFlow.js grading.

---

## Workstream Map & Dependency Order

```
WS0 Instrumentation ───┬─────────────────────────────────────────────► (gates measurement of all)
                       │
WS5 SEO/Free funnel ───┼──► (quick wins now; ongoing top-of-funnel)
                       │
WS4 Widen TAM ─────────┼──► (relabel cheap; unlock 4 themes = content quarters)
                       │
WS1 Subscription ──────┼──► unlocks paid ads ──► WS2 arena monetization
                       │
WS2 Viral Arena ───────┴──► the reach engine (depends on WS0 events)
                       │
WS3 Enterprise/Seats ──┴──► do AFTER B2C funnel is proven; biggest build, biggest count-leverage
```

**Sequencing principle:** cheap-and-foundational first (WS0, WS5 quick wins, WS4 relabel), then the economics fix (WS1), then the reach engine (WS2), then the count-leverage play (WS3) once B2C is proven.

---

## Tier 0 — Quick Wins (days–weeks, do first)

These are near-free because the asset already exists or is a config flip. Ship them before the structural workstreams to start the funnel clock.

- [ ] **QW1 — Re-render the orphaned bridge catalog as a public SEO page.** The 51-bridge dataset still lives in [bridges.ts:62-819](../../../packages/shared/src/bridges.ts) and the MIT re-export `packages/bridges-public`, but the `/bridges` route was deleted ([site-footer.test.tsx:65](../../../apps/web/app/components/site-footer.test.tsx) asserts the dead link is gone). Rebuild a public `apps/web/app/bridges/page.tsx` rendering the catalog with per-bridge JSON-LD. Free, indexable, long-tail SEO ("react useState to tensor", etc.). Update sitemap + footer.
- [ ] **QW2 — Flip sitemap from "core" to "full".** [sitemap.ts:15](../../../apps/web/app/sitemap.ts) is throttled to ~22 URLs; the "full" branch (lessons + extras, lines 107-139) is coded but inactive. The 21 fully-public `/extras` lessons are already ungated SEO assets — get them crawled.
- [ ] **QW3 — Add share-to-network buttons.** `progress_shared` already types `platform: "twitter" | "linkedin"` ([analytics-events.ts:193](../../../apps/web/lib/analytics-events.ts)) but only `"copy"` is ever emitted. Add real intent buttons to [capstone-client.tsx](../../../apps/web/app/themes/[slug]/capstone/capstone-client.tsx) certificate + skill-genome. Reuse existing OG route ([api/og/route.tsx](../../../apps/web/app/api/og/route.tsx)).
- [ ] **QW4 — Build the drafted retention email automations + `purchased` Kit tag.** Copy is drafted ([email-retention-sequences.md](../../email-retention-sequences.md), status "Kit automations NOT yet created"). Tags `signed_up/onboarded/first_lesson/capstone` already fire ([kit.ts](../../../apps/api/src/lib/kit.ts)); add a `purchased` tag (fired from the Stripe webhook in [payments.ts](../../../apps/api/src/routes/payments.ts)) so sequence B can distinguish free-stall vs paid-stall. Build sequences A/B/C in the Kit dashboard.
- [ ] **QW5 — Widen `Framework` relabel (marketing only, no content rewrite).** Change audience copy on [compare/page.tsx:8,31-36](../../../apps/web/app/compare/page.tsx), [about](../../../apps/web/app/about/page.tsx), and onboarding from "frontend developers" to "web/JS developers." No lesson body changes. This is the cheapest TAM expansion; full expansion is WS4.

---

## WS0 — Growth Instrumentation Foundation → spawn TDD plan (small)

**Why:** You cannot manage a funnel toward 100k without k-factor, activation, and cohort retention visibility. Current analytics ([analytics-events.ts](../../../apps/web/lib/analytics-events.ts)) instruments the *conversion* funnel well but has **no virality/referral instrumentation** and no LTV/retention cohorting.

**Current state:** PostHog EU, ~27 typed events, server-side revenue events from the Stripe webhook ([apps/api/src/lib/posthog.ts](../../../apps/api/src/lib/posthog.ts)). No k-factor, no referral attribution, no activation-metric definition.

**Build:**
- Define & instrument the **activation metric** (proposed: "completed ≥1 graded exercise green in first session") as a first-class event.
- Add referral/virality events: `invite_sent`, `invite_accepted`, `referral_attributed`, `share_clicked{platform}` (extend the existing `progress_shared`).
- Add `subscription_started/renewed/churned` event shells now (WS1 fills them).
- Document canonical PostHog dashboards: acquisition → activation → retention → revenue; k-factor; cohort LTV. (Dashboards live PostHog-side; commit their definitions to `docs/analytics-verification.md`.)

**Files:** `apps/web/lib/analytics-events.ts` (extend registry), `apps/api/src/lib/posthog.ts` (server events), `docs/analytics-verification.md` (dashboard specs).

**Success metric:** every funnel stage from anonymous visit → activated → paid → retained → referred is queryable in PostHog.

---

## WS1 — Recurring Revenue (Subscription Billing) → spawn TDD plan (medium)

**Why:** This is the unit-economics fix that makes paid acquisition possible. One-time LTV (~$100) < realistic blended CAC. Subscription LTV ($300–600) clears CAC with margin. Without WS1, ads burn cash and 100k stays ~1%.

**Current state (all one-time):**
- Pricing constants: [constants.ts:38-55](../../../packages/shared/src/constants.ts) bundle ladder.
- Checkout: [payments.ts:58-182](../../../apps/api/src/routes/payments.ts), Stripe `mode:"payment"`, upgrade-credit logic, auto-grant path.
- Webhook: [payments.ts:238-674](../../../apps/api/src/routes/payments.ts) — only one-time events (`checkout.session.completed`, refund, dispute).
- Entitlement: derived on-the-fly from `purchases.theme_ids` ([progress.ts:54-69](../../../apps/web/lib/progress.ts)); **no entitlements table**; gate enforced inline in [themes/[slug]/[module]/[lesson]/page.tsx:85-203](../../../apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx).
- No `stripe_customer_id` persisted, no `subscriptions` table.

**Build:**
1. **Introduce an all-access subscription plan** (proposed $15–25/mo or ~$180/yr) alongside — not replacing — one-time theme purchases. Add to `PRICING` in [constants.ts](../../../packages/shared/src/constants.ts).
2. **New migration** `037_subscriptions.sql`: `subscriptions` table (`user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `current_period_end`, `plan`), plus persist `stripe_customer_id` on `profiles`.
3. **New migration** `038_entitlements.sql`: a real `entitlements` / access-grants table (source = union of one-time `purchases` + active `subscriptions`). Stop deriving access ad-hoc; centralize it. This is a prerequisite for clean team/seat entitlement in WS3.
4. **Checkout**: add `mode:"subscription"` path + Stripe price IDs in [payments.ts](../../../apps/api/src/routes/payments.ts).
5. **Webhook**: handle `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed` (dunning). Note [payments.test.ts:367](../../../apps/api/src/routes/payments.test.ts) currently treats `invoice.paid` as *unhandled* — that flips.
6. **Entitlement refactor**: replace `hasThemePurchase` derivation with a single `getEntitlements(userId)` reading the new table; update the lesson gate to consult it.
7. **Billing management UI**: manage/cancel subscription in [settings](../../../apps/web/app/settings/settings-form.tsx) (Stripe customer portal link).

**Success metric:** a user can subscribe, entitlement flips instantly, renewal/cancel/dunning all handled idempotently; blended LTV measurable in WS0 dashboards.

**Risk:** billing is correctness-critical and money-touching — full TDD, idempotency tests, Stripe test-mode e2e before any real charge.

---

## WS2 — Viral Competition Arena → spawn TDD plan (large)

**Why:** The only lever that attacks the top-of-funnel *visitor* wall instead of the conversion rate. A free, public, shareable arena is built-in distribution (Kaggle/Advent-of-Code/Leetcode-contest pattern). Target viral coefficient K > 0.5.

**Current state — the hard parts already exist, the cross-user layer does not:**
- ✅ Real in-browser TFJS grading with numeric 0–100 scores in a sandboxed Worker ([exercise-runner.ts](../../../packages/ui/src/mdx/exercise-runner.ts)).
- ✅ Reaction-time capture ([boss-beat.tsx](../../../apps/web/app/components/mdx/boss-beat.tsx)).
- ✅ Public, no-auth shareable object + OG images ([certificates/[id]/page.tsx](../../../apps/web/app/certificates/[id]/page.tsx), [api/og/route.tsx](../../../apps/web/app/api/og/route.tsx)).
- ✅ Trained model assets in `apps/web/public/models/*`.
- ❌ **No leaderboard / ranking / ELO / PvP / challenge / tournament table or code anywhere.** Every gamification table is per-user RLS.
- ❌ No referral loop, no public profiles, no share-network UI (see QW3).
- The Arena is doc-only: [product-plan.md:303-313](../../product-plan.md) ($29/yr concept).

**Build:**
1. **Public, no-auth playable challenge route** `apps/web/app/arena/*` — a weekly ML challenge graded by the *existing* `exercise-runner`. Playable before signup (signup to save score / climb ranks).
2. **New migration** `039_arena.sql`: `challenges`, `arena_submissions` (cross-user, score + runtime), `leaderboard` (materialized/view), `arena_seasons`. This is the first intentional cross-user aggregation — RLS must allow public read of ranks while protecting submission internals.
3. **Scoring/ranking**: ELO-style or percentile ranking service (`apps/api/src/routes/arena.ts` + `apps/api/src/lib/arena.ts`).
4. **Shareable result card**: extend [api/og/route.tsx](../../../apps/web/app/api/og/route.tsx) with an `arena` kind (rank, score, badge). Every share = a free impression → the K-factor engine.
5. **Referral loop** → spawn its own sub-plan: referral codes/links, `referrals` table, attribution wired to WS0 events, reward (free month / theme unlock). Public profiles `apps/web/app/u/[handle]/*` to make results shareable.
6. **Funnel**: free arena → email capture → activation → subscription (WS1). Arena is the acquisition source; WS1 is the monetization.

**Success metric:** K-factor measurable and trending toward >0.5; arena → signup → paid conversion instrumented.

**Note:** keep the arena *free* to maximize virality; monetize via the free→paid funnel, not an arena paywall (the $29/yr doc concept undercuts virality — revisit).

---

## WS3 — Enterprise / Teams (Seats) → spawn TDD plan (largest)

**Why:** Individual credit cards will not reach 100k profitably. Seats will: 100k = ~200 companies × 500 seats, or ~1,000 × 100. B2B deals ($10k–100k) absorb the CAC that kills B2C ads. This lever likely supplies the majority of the 100k count.

**Current state:** zero. Everything is per-`user_id`. Role enum is flat `user | admin` ([006_admin_roles.sql](../../../packages/supabase/migrations/006_admin_roles.sql)). "Team" appears only as an onboarding learning-goal string. No orgs, members, seats, invitations, or org-scoped roles.

**Build (do AFTER B2C funnel proven — it's a different company):**
1. **New migrations**: `teams`/`organizations`, `org_members` (with org-scoped roles: `billing_owner | manager | learner`), `seats`, `invitations`. Entitlement (WS1's table) extends to "granted via org seat."
2. **Seat-based Stripe billing**: quantity-based subscription, seat add/remove proration.
3. **Admin/manager dashboard**: `apps/web/app/teams/*` — invite members, assign seats, **team progress reporting** (reuse per-user progress aggregated at org level), export.
4. **SSO** (SAML/OIDC) via Supabase Auth enterprise + **SCIM** provisioning for large accounts.
5. **Procurement table stakes**: SOC2 track, invoicing, seat reporting, DPA. Mostly ops/docs, but gate enterprise sales.
6. **ICP note**: enterprises buy *broad* upskilling. "Frontend→ML" alone is too narrow for enterprise — WS4 (widen TAM) + a broader catalog is a hard dependency for WS3 to be sellable.

**Success metric:** a company can buy N seats, invite members, see team progress; one contract materializes as N paying users in the count.

---

## WS4 — Widen TAM: ICP + Content Volume → spawn TDD plan (content-heavy)

**Why:** "Frontend dev ∩ wants ML ∩ pays" is too small a denominator for 100k. Widening to "web/JS developer → AI" (10M+) makes 100k = <1% penetration instead of an impossible multiple.

**Current state — coupling is thin and well-isolated:**
- ML lesson bodies are framework-agnostic. "Frontend dev" identity = the optional `concept.bridge` frontmatter field + `Framework="react"` union ([bridges.ts:11](../../../packages/shared/src/bridges.ts)) + marketing copy.
- Bridge *content* is already ~75% general JS/web (`Array.reduce`, `Math.max`, `requestAnimationFrame`, CDN, CI/CD); only a minority are React-specific (`useState`, reconciliation, SSR).
- The `variants?: Partial<Record<Framework, BridgeVariant>>` model already anticipates multi-framework ([bridges.ts:25](../../../packages/shared/src/bridges.ts)) — every bridge just populates `react` only.
- 4 full themes already exist as MDX (297 total files) but are unbuilt/gated; only 77 are built.

**Build:**
1. **Reframe "frontend dev" → "web/JS dev"** in copy (QW5 is the down-payment). Full pass over onboarding, `/compare`, `/about`, landing.
2. **Relabel the React-specific bridge subset** to general-JS where possible; where genuinely React-specific, use the existing `variants` map to add a vanilla-JS / general variant. This touches [bridges.ts](../../../packages/shared/src/bridges.ts) + the 76/77 lessons that embed a bridge (frontmatter only, ML body unchanged). Widen the `Framework` union.
3. **Unlock the 4 built-but-gated themes** → 5× the shippable corpus. Per-theme launch checklist already exists: add slug to `LAUNCHED_THEMES` ([constants.ts:20](../../../packages/shared/src/constants.ts)) + `LAUNCHED_THEME_DIRS` ([velite.config.ts:57](../../../packages/content/velite.config.ts)), author that theme's bridges, reconcile `THEME_CONTENT` counts. Gated on each theme passing the existing validator battery.
4. **Build a content generator/scaffold CLI** (`scripts/new-lesson.mjs`, `scripts/new-theme.mjs`) — there is none today; authoring velocity is the bottleneck for volume. Scaffold the 5C MDX + exercise YAML + module.yaml with schema-valid stubs. This de-risks WS3's "broad catalog" dependency.

**Success metric:** a self-identified "backend/full-stack/vanilla-JS dev" completes onboarding without friction; ≥3 themes launched; new-lesson authoring time cut materially.

---

## WS5 — SEO / Free-Content Funnel → ongoing (start with Tier-0 quick wins)

**Why:** Organic search is the cheapest sustained top-of-funnel and compounds for years. It's how a 100k funnel is fed without a permanent ad furnace.

**Current state:** sitemap throttled to "core" ([sitemap.ts:15](../../../apps/web/app/sitemap.ts)); lessons excluded. Blog has **1 post** ([2026-W18-webgpu MDX](../../../packages/content/content/blog/)). JSON-LD is widespread (good). `/bridges` catalog deleted. `/extras` (21 lessons) is fully public but under-exploited.

**Build (beyond QW1/QW2):**
1. **Scale the blog pipeline.** The news→lesson matching engine exists (`scripts/news/`, `getLessonsByConcepts` in [queries.ts:146](../../../packages/content/src/queries.ts)) but produces ~1 post. Turn it into a steady cadence (weekly "The Bridge" ML-news posts linking to lessons) — each post is a durable SEO asset + internal link into the funnel.
2. **Public lesson previews** beyond Module 1 (first-N-steps public, gated at the paywall step) to expand indexable surface without giving away paid content.
3. **Arena as SEO** (WS2 dependency): public challenge pages + leaderboards are highly linkable/shareable.
4. **Programmatic SEO** off the bridge catalog: one indexable page per bridge concept (QW1 is the seed).

**Success metric:** indexed page count and organic sessions trending up month-over-month in WS0 dashboards.

---

## Sequenced Roadmap (ties to the 4-lever, ~5-year arc)

| Phase | Horizon | Workstreams | Exit milestone |
|-------|---------|-------------|----------------|
| **0. Quick wins** | weeks | QW1–QW5, WS0 | funnel instrumented; free SEO assets live; retention emails on |
| **1. Economics + activation** | 0–9 mo | WS1 (subscription), WS4 relabel + 1–2 theme unlocks, WS5 blog cadence | LTV > 3×CAC provable; ads can turn on warm; ≥3 themes live |
| **2. Reach engine** | 9–24 mo | WS2 (arena + referral), WS5 arena-SEO | K > 0.5; arena→paid funnel converting |
| **3. Count leverage** | 24–48 mo | WS3 (enterprise/seats), WS4 broad catalog | first seat contracts; team dashboard live |
| **4. Scale** | 48–60 mo | all levers compounding | approach 100k (mostly seats + subscription + viral B2C) |

---

## Honest framing (carried from the strategy discussion)

- **Code/content is necessary, not sufficient.** These workstreams remove the *structural* ceilings. The remaining ceiling is distribution/audience (not solvable in the repo) — build audience in parallel starting now.
- **Each workstream is a different business.** Subscription = SaaS ops. Arena = consumer growth. Enterprise = B2B sales + compliance. Plan team/capital accordingly.
- **Odds:** course-only ~1% → all levers executed over ~5 yr ~15–25%. Real plan, not a lottery ticket.

## Recommended first move

Ship **Tier 0 quick wins + WS0** now (days–weeks, mostly reusing existing assets), then open **WS1 (subscription)** as the first full TDD implementation plan — it's the keystone that makes every acquisition lever downstream economically viable.
