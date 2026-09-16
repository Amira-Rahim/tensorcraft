# Tensorcraft - Growth Roadmap

> **Status:** living document. Supersedes the version-roadmap tables in `docs/prd.md` §7 and `docs/dev-plan.md` "Version Roadmap", both of which predate the 100k-paying-users goal and are reconciled below.
> **Scope:** what to build, in what order, to grow revenue. Engineering phase detail stays in `docs/dev-plan.md`; pricing/positioning detail stays in `docs/product-plan.md`.
> **Task index (2026-07-21):** the Horizon 1-3 work items are indexed canonically in `docs/post-launch-backlog.md` §8, the single source of truth for post-launch tasks. This file remains the strategy detail doc (arithmetic, gates, framing). Still-open Horizon 0 defects: `docs/audits/launch-blockers-history-2026-08-23.md`.
> **Deduped 2026-07-22:** horizon sections carry rationale, decisions, and codebase facts only - item enumerations and exit criteria live solely in the backlog §8 index; still-open defect lists live solely in `docs/audits/launch-blockers-history-2026-08-23.md`.

---

## 0. Where We Actually Are

Honest current state, verified against the codebase:

| Dimension | Reality |
|---|---|
| Worlds purchasable | **1** (`deep-orbit`). 4 exist as unbuilt MDX, gated coming-soon |
| Revenue model | One-time only. Stripe `mode:"payment"`. No subscriptions |
| Account model | Individual only. No teams/orgs/seats. Flat `user \| admin` role |
| Entitlement | Derived ad-hoc from `purchases.world_ids`; no entitlements table |
| Cross-user features | **None.** All gamification is per-user RLS. No leaderboard |
| Free tier | Module 1 (5 lessons). (`/extras` and its 23 public lessons removed 2026-08-15, owner decision) |
| Product quality | High. Content, grading, and trust handling are genuinely strong |

**The gap is not product quality. It is distribution and business model.**

---

## 1. The Goal and the Re-Base

**Goal: 100,000 _paying_ customers.**

This is a different order of magnitude than every previously written plan, and the roadmap must say so plainly rather than append to plans that contradict it:

| Prior plan | Its terminal milestone | vs. new goal |
|---|---|---|
| `prd.md` §7 V5.0 "Universe" (2028-Q3) | **100,000 _free_ users**, $250K MRR | Goal is ~**30×** this, in paying users |
| `prd.md` §7 V1.0 "Liftoff" (2026-Q3 - now) | 2,000 free users, 3% conversion ≈ **60 paying**; requires all 5 worlds | **Already slipping**: 1 world launched |
| `dev-plan.md` V2.0 (2027-Q1) | Team tier, admin dashboard | Correct instinct - this is the enterprise lever, and it matters far more than its position implied |

**Implication:** the old roadmap paces toward ~$3M ARR by 2028. 100k paying implies **$10–50M ARR**. Re-base, don't extend.

### Where the 100,000 comes from

100k is a portfolio, not a channel. Each bucket has its own playbook, and the mix dictates the priority order below.

| Source | Users | Requires | Realism |
|---|---|---|---|
| **Enterprise seats** (H3) | 50–60k | ~500–1,000 contracts × 100–500 seats | Hardest build, **easiest count** |
| **Subscription B2C** (H2) | 25–30k | LTV $300–600, ads profitable, low churn | Needs recurring revenue + proven funnel |
| **Viral arena → paid** (H2) | 10–15k | K > 0.5 | Highest variance |
| **One-time sales** (today) | 5–10k | Current model, matured | **This is the entire current business** |

**The load-bearing observation: today's model is the smallest box.** Perfecting it reaches ~10% of the goal.

### The arithmetic

- **Individual sales:** 100k × ~$200 CAC = **~$20M spend**. Against ~$100 one-time LTV that is insolvent by construction.
- **Seat sales:** 1,000 contracts × 100 seats = 100k users at $10–50k ACV → **$10–50M ARR**. CAC *per user* collapses to ~$50–200 because one sale delivers hundreds. Throughput: 10 AEs × 2 deals/mo ≈ 24k seats/yr.

**Strategy in one line: don't sell 100,000 people - sell ~1,000 buyers who each bring 100 people.**

---

## 2. Horizon 0 - Sell What Already Exists (SHIPPED 2026-07-21)

Conversion repairs to the current product, most of them trivial. **Several restored assets that were already built but disconnected from the funnel.**

### P0 - Verified defects that were costing sales

- [x] **Paywall analytics restored.** `page.tsx:151-153` called `redirect()`, which throws, so line 155's `requiresPaywall` re-tested the *identical* condition and was always `false` - the `LessonPaywall` block at 184-207 was **provably dead code**. Its only consumer, `trackPaywallShown`, therefore never ran: **`paywall_hit` recorded nothing from launch until 2026-07-21.** Treat all earlier paywall funnel data as absent, not as zero conversions. Fixed by firing `paywall_hit` from `<PaywallNotice>` (which renders at exactly the paywall-hit moment on the redirect target) and deleting `LessonPaywall` plus the orphaned helper. Redirects now carry `&module=<slug>` to preserve the module dimension. Closes the long-open `dev-plan.md` §4c checkbox.
- [x] **Redirect contract kept deliberately.** The audit proposed rendering the paywall in-context. Rejected: redirect-based enforcement is the documented §4c contract and `page.tsx:117` was deliberately changed on 2026-07-19 to show price rather than a signup form. Reversing that silently would have undone a considered UX decision, so `/pricing` was strengthened instead (see P3).

### P1 - Recover abandoned intent

- [x] **Intent tags added.** Kit vocabulary gained `paywall_hit` and `module_1_complete` (`email-tags.ts`), wired from `<PaywallNotice>` and from the final lesson of module 1 respectively, each fired once per browser. Previously a user could finish the free tier, hit the wall and leave, and no sequence could ever reach them.
- [x] **Stripe cart recovery enabled.** The Checkout session now sets `customer_email` (read in parallel with the existing purchases query, so no extra round-trip) and `after_expiration.recovery`. Both recovery channels - ours and Stripe's - had been dark simultaneously.
- [ ] **OPERATOR: build the Kit automations.** Code side is done; sequences A/B/C in `docs/email-retention-sequences.md` still need creating in the Kit dashboard, and the new tag ids need env vars (see below).

### P2 - Reduce purchase friction

- [ ] **Guest checkout - UI disabled 2026-07-21; API blocked 2026-09-16.** `POST /api/payments/guest-checkout` returns 403 without creating a session; `checkout-button.tsx` sends signed-out buyers through `/auth`. Existing signed guest-payment webhooks still process. An adversarial review found three defects that only surface *after* the card is charged:
  1. Stripe returns to `/dashboard/purchase-success`, which redirects a session-less visitor to `/auth` - pay, then hit a login wall, no receipt, `session_id` discarded.
  2. A returning customer whose session merely expired reads as a guest, and the route carries neither the already-own guard nor the upgrade credit → charged full price a second time.
  3. `checkout.session.async_payment_succeeded` resolves identity from `client_reference_id` only → a guest paying by bank debit stays `pending` forever: money taken, access never granted, nothing logged.

  None were caught by the 30 passing API tests, because those mock `lib/guest-account.ts` wholesale and never exercise the post-payment redirect. **Before re-enabling:** guest-safe success page, ownership + credit checks (an email field collects the address without an inbox round-trip), guest fallback in both `async_payment_*` handlers, a unique index on `lower(profiles.email)`, an anon (not service-role) client for the OTP send, and real unmocked tests for `guest-account.ts`. See the corrections in `docs/privacy-compliance.md` - the original justification contained a false claim that payment verifies the email address. (Re-enable is tracked as a work item in `post-launch-backlog.md` §8 Horizon 1, 2026-07-22; this block remains the defect record.)
- [x] ~~Collapse the unbuyable bundle tiers.~~ **Won't do.** Sequential release (ship one world, learn, apply) is deliberate strategy, and the gating is already honest - no one can overpay for missing content.

### P3 - Trust and qualification

- [x] **FAQ now renders on `/pricing` as well as landing**, via a shared `<FaqSection>`; the refund badge moved **above** the tier grid, since risk reversal only works if it is read while deciding. `<PaywallNotice>` copy rewritten from a statement of the rule into the offer plus the guarantee.
- [x] **"Who this is for" block added** to landing and `/paywall` via `<WhoThisIsFor>`. Naming who it *isn't* for is what makes the "for you" column believable, so the exclusion column is deliberately unsoftened.
- [x] **Convinced visitors have a buy path.** The final landing CTA named the $59 price and then offered only a free-lesson link; a secondary "See pricing" link now sits beside it. (The audit's stronger claim that the landing page "never routes to pricing" was **false** - `nav.tsx:114` and `page.tsx:51` both link there. Corrected.)
- [ ] ~~Give the teacher a name.~~ **Won't do.** Anonymity is intentional for now. The separable half still stands and needs no personal association: **acquire real third-party proof** (beta quotes, a review prompt at certificate issuance). Confirmed absent sitewide: testimonials, reviews, student counts, case studies.

### P0 - Analytics was dark for every first session (fixed 2026-07-21, second pass)

- [x] **PostHog never initialized in a visitor's first session.** Every consent consumer read localStorage once inside a mount-only effect; on a first visit the key does not exist, the effect returned early, and nothing re-ran it - `CookieConsent.accept()` only wrote localStorage and hid the banner. So the session in which someone lands, reads the free lesson, hits the paywall and decides whether to buy emitted **zero events**: no `$pageview`, no `lesson_started`, no `paywall_hit`, no `checkout_started`. **This means the `paywall_hit` fix earlier the same day did not actually fire for first-session users either.** Fixed with a shared `lib/consent.ts` (`onConsentChange` / `notifyConsentChanged`) that both same-tab and cross-tab listeners subscribe to; init now also emits the pageview for the page consent was granted on. 7 regression tests.
- [x] **Pageviews were double-counted.** `PostHogProvider` and `AnalyticsProvider` were both mounted and both captured `$pageview`, so every conversion-rate denominator was 2× too large. The former was a strict subset of the latter and has been deleted.
- [x] **Plausible had the same bug** via `storage`, which browsers never fire in the tab that wrote the value. Now on the shared subscription.

**Treat all historical funnel data as unreliable, not merely sparse.** Rates were computed against a doubled denominator, and first-session behaviour - the entire acquisition and activation path - was never recorded at all.

### Still open from the 2026-07-21 re-audit

Tracked canonically in `docs/audits/launch-blockers-history-2026-08-23.md`; not duplicated here. Status has moved since this section was first written: the six Tier 1 defects (world-callable `SECURITY DEFINER` RPCs, middleware SPOF, paying customers shown the paywall, checkout hang/double-charge, missing signup instrumentation, false guest-progress notice) were **fixed in code the same day** - one blocking operator step remains (apply migration `039`). Everything else open lives in that doc's Tier 1-OPS (operator/distribution setup), Tier 2 (fix in week 1, pre-ad-spend) and Tier 3 (fix before ~10k users). One item this list previously carried was stale: `immutable` headers on `/vendor`/`/models` shipped 2026-07-21 (`next.config.ts`).

### New environment variables (operator)

`KIT_TAG_PAYWALL_HIT` and `KIT_TAG_MODULE_1_COMPLETE` - documented with the rest of the Kit setup in `docs/audits/launch-blockers-history-2026-08-23.md` Tier 1-OPS. Setting them late is safe: R2-7 made missing-tag skips recoverable.

**Why Horizon 0 came first:** it is the cheapest revenue in the plan, and it produces the funnel data (`paywall_hit`, conversion by step) that Gate 3 below requires before any spending scales. That data now exists for the first time.

---

## 3. Gating Sequence - What Must Be True Before What

Preconditions, not preferences. Violating the order wastes capital.

- **Gate 1 - Denominator.** Only 1 world is purchasable and the ICP was "frontend dev ∩ wants ML ∩ pays" (low millions). 100k would be several % of everyone who qualifies - impossible arithmetic. Widen to JS devs (10M+) and launch more worlds. *Nothing downstream matters until this opens.* Status 2026-08-19: the JavaScript rebrand is complete (copy, SEO metadata, schema identifiers, docs, content noun pass, and the browser-anchored bridge triage across all five worlds and the canonical registry). Still open for Gate 1: launching more worlds.
- **Gate 2 - LTV.** No recurring revenue exists. Until LTV > 3×CAC, paid acquisition is a furnace, not an engine.
- **Gate 3 - Proof.** Do not hire sales or buy traffic against an unproven funnel. Activation/retention curves must exist and flatten - and enterprise buyers will demand completion data. (Horizon 0 produces it.)
- **Gate 4 - Catalog.** Enterprises buy *broad* upskilling. One narrow path does not clear procurement. Catalog breadth is a hard dependency for enterprise being sellable.

---

## 4. Horizon 1 - Fix the Economics (0–9 months)

_Work items: `docs/post-launch-backlog.md` §8, Horizon 1. This section carries rationale and decisions only._

**Widen the market (Gate 1).** Executed 2026-08-18: the audience is JavaScript engineers across copy, metadata, schema (migration 059), docs, and content; the bridge frontmatter fields are now `jsTitle`/`jsCode` and the `Framework = "react"` union (`packages/shared/src/bridges.ts:11`) remains typed for `variants`. What remains is editorial: ~72 of 274 bridges still anchor on browser-only concepts (triage tracked in `docs/post-launch-backlog.md` Horizon 1). The volume bottleneck is authoring velocity (no lesson generator exists), which is what puts the authoring scaffold on the critical path.

**Add recurring revenue (Gate 2).** An all-access subscription (~$15–25/mo) alongside one-time purchases, replacing ad-hoc entitlement derivation with a real entitlements model. Money-touching - full TDD and Stripe test-mode e2e before any live charge.

**Payment rails (decided 2026-07-22): stay on Stripe; Lemon Squeezy rejected.** Lemon Squeezy has been in maintenance mode since Stripe acquired it (July 2024) - its team now builds Stripe Managed Payments (SMP), Stripe's own merchant-of-record product, and LS support/updates have visibly slowed. Adopting it in 2026 means migrating twice. Fee reality on the $59–159 ladder: Stripe direct 2.9% + 30¢ (~3.2% effective on $99); Lemon Squeezy 5% + 50¢, plus 1.5% international and 0.5% subscription surcharges (~5.5%); SMP 6.4% + 30¢ (~6.7%). The MoR premium is 2.3–3.5 points of revenue, and what it buys - global tax registration, filing, remittance - matters to us almost entirely as EU/UK VAT, which is already a launch blocker (`docs/audits/launch-blockers-history-2026-08-23.md` R2-4). Stripe Tax (+0.5%/txn) automates calculation and collection but leaves OSS registration and filing with us.

The money path is deep and freshly hardened (`apps/api/src/routes/payments.ts`, migrations 035/037/038, Run #7 behavioral proofs); switching providers pre-launch is pure risk with zero launch upside. Re-evaluate MoR only when the subscription launches or international mix makes OSS filing a real operating cost - and then compare Paddle (5% + 50¢, mature B2B invoicing, relevant to Horizon 3 seats) and Polar (~4% + 40¢) against SMP, not Lemon Squeezy.

**Instrument growth.** Existing PostHog taxonomy covers conversion and onboarding well but has **no virality instrumentation** - nothing measures whether users bring users, which the Gate 2 LTV math and Horizon 2's K-factor exit both depend on.

---

## 5. Horizon 2 - Build Reach (9–24 months)

_Work items: `docs/post-launch-backlog.md` §8, Horizon 2._

**Viral competition arena.** The expensive half already exists: real in-browser TFJS grading with numeric scores in a sandboxed worker (`packages/ui/src/mdx/exercise-runner.ts`), reaction-time capture, trained model assets, and a public OG-imaged shareable (`certificates/[id]`). What is missing is purely the **cross-user layer** - every gamification table today is per-user RLS with zero aggregation, and the Arena exists only as prose in `docs/product-plan.md`.

Keep the arena **free** - monetize via the free→paid funnel, not an arena paywall. The $29/yr arena concept in `product-plan.md` undercuts the virality that is the entire point.

**Scale SEO.** The assets already exist, disconnected: the 51-bridge dataset (`packages/shared/src/bridges.ts`) has rendered nowhere public since the 2026-05-05 revert, the sitemap is deliberately throttled to "core", and the blog sits at one post despite a working news→lesson matching pipeline.

---

## 6. Horizon 3 - Leverage the Count (24–48 months)

_Work items: `docs/post-launch-backlog.md` §8, Horizon 3._

**Enterprise / seats.** Currently zero exists in the codebase: no orgs, members, seats, or invitations; the role enum is a flat `user | admin`. Everything procurement expects - SSO/SCIM, SOC2, invoicing, DPA - is greenfield.

**Sequenced last despite carrying ~60% of the count** - it sits behind Gate 3 (buyers demand completion data) and Gate 4 (a single narrow path fails procurement). Built earlier, it produces a seat-management system with nothing sellable to put in it.

---

## 7. What Code Cannot Fix

Every item here could ship perfectly and the goal could still be missed.

- **The binding constraint at 100k is distribution** - audience, brand, sales pipeline, category position. None of it lives in this repo.
- **It has the longest lead time and no shortcuts.** Comparable creators built free audiences for *years*; the course monetized existing trust rather than creating it.
- **So it runs in parallel, starting before the code is ready.** Audience-building is the critical path and it is slower than the engineering. Do not sequence it after the platform work.

---

## 8. Honest Framing

- **Each horizon is a different business.** Subscription = SaaS ops. Arena = consumer growth. Enterprise = B2B sales + compliance. Staff and capitalize accordingly.
- **Cost of admission:** ~4–5 year arc, 20–40 person company, ~$5–20M deployed, and a founder whose days become hiring and sales rather than writing lessons.
- **Odds:** ~1% on the current model; ~15–25% with all levers executed over ~5 years. A real plan, not a lottery ticket.
- **Product quality is not the constraint** - it is the necessary foundation that makes the 1k–10k range achievable and the rest possible.

---

## Related Documents

| Domain | Document |
|---|---|
| Engineering phases, session log, deferrals | `docs/dev-plan.md` |
| Pricing, revenue projections, positioning | `docs/product-plan.md` |
| Requirements, release gates (superseded §7) | `docs/prd.md` |
| SEO, launch sequence, paid ads | `docs/marketing-plan.md` |
| Retention email sequences (operator setup pending) | `docs/email-retention-sequences.md` |
| **Launch blockers (actionable subset)** | `docs/audits/launch-blockers-history-2026-08-23.md` |
| **Full six-dimension audit register (everything found)** | `docs/audits/full-audit-2026-07-21.md` |
| V1 launch scope (Deep Orbit only) | `docs/launch-scope.md` |
