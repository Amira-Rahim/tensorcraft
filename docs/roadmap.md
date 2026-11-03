# Tensorcraft - Growth Roadmap

For the complete product delivery view, see the root
[product roadmap](../ROADMAP.md). This document retains the current growth
strategy, commercial goals, and evidence gates.

> **Status:** living document. The owner confirmed a long-term goal of 200,000 unique paying customers on 2026-10-03. This supersedes the earlier 100,000 target and the version-roadmap tables in `docs/prd.md` §7 and `docs/dev-plan.md`. Earlier channel, revenue, staffing, and timing scenarios are planning assumptions, not forecasts for the current goal.
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
| Product quality | Internally reviewed content and grading; independent beginner learning, delayed transfer, and paid demand remain unvalidated |

The October 6 working tree applies the visual/story-first experience to all
56 Deep Orbit lessons, with internal verification recorded in the
[rollout report](design-previews/deep-orbit-rollout.md). The owner removed the
five-person test as an implementation prerequisite. Observing independent
learning remains a separate source of future product evidence. Distribution
and acquisition economics also need evidence; internal quality checks do not
settle any of those questions.

---

## 1. The Current Goal

**Goal: 200,000 unique paying customers over the lifetime of Tensorcraft.**

Owner decision, 2026-10-03: the goal is cumulative customers, not simultaneous active subscribers. The previous 100,000 target is superseded. Count successful real purchases with positive retained revenue, excluding staff, test payments, complimentary access, and fully refunded purchases. Deduplicate repeat buyers. Track enterprise contracts and paid learner seats separately rather than treating one company purchase as hundreds of individual customers.

At the current $50 price, 200,000 customers each buying once would produce $10 million in cumulative gross sales before refunds, taxes, fees, and operating costs. It would not be annual recurring revenue. Over ten years the average would be 20,000 new customers per year; this is arithmetic, not a forecast.

The next commercial milestone remains 1,000 paying customers under the [current acquisition plan](marketing-first-1000-paid.md). The [foundations opening plan](foundations-opening-plan.md) improves the visual and story-driven entrance to the existing course. Its internal work does not establish demand at the long-term scale.

The product remains a visual, story-driven path for JavaScript engineers to
understand, build, train, evaluate, and deploy real models. Growth work should
support that promise. A larger audience target does not justify hiding hard
concepts, adding competing learning routes, or substituting API integration
for model understanding.

### Earlier channel assumptions

The earlier roadmap divided a hypothetical 100,000 learners or seats among enterprise, subscription, an arena, and one-time sales. That mix did not consistently count unique customers. Its proposed revenue, acquisition costs, and staffing were unvalidated. It cannot supply a forecast for the new cumulative goal, and doubling its channel counts would not resolve that problem.

The horizons below retain those product options and their existing dependencies. Changing the target does not authorize subscriptions, enterprise infrastructure, or an arena. Reassess them using actual buyer demand, learning outcomes, and acquisition costs. Deferred tasks remain indexed in the backlog.

### Superseded scenario (set 2026-07-14, superseded 2026-10-03)

Retained as the record of how the 100,000 goal was expected to be reached, so the reasoning is not lost with the number. It is history, not a forecast for the current goal. The text below is reproduced as it stood in the roadmap on 2026-07-22; "the goal" and "100k" in it refer to the superseded target.

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

The scenario also set the gate wording and the framing that §3 and §8 replaced on 2026-10-03:

- Gate 1 as written then: **Gate 1 - Denominator.** Only 1 world is purchasable and the ICP was "frontend dev ∩ wants ML ∩ pays" (low millions). 100k would be several % of everyone who qualifies - impossible arithmetic. Widen to JS devs (10M+) and launch more worlds. *Nothing downstream matters until this opens.* Status 2026-08-19: the JavaScript rebrand is complete (copy, SEO metadata, schema identifiers, docs, content noun pass, and the browser-anchored bridge triage across all five worlds and the canonical registry). Still open for Gate 1: launching more worlds.
- Horizon 3 enterprise sequencing as written then: **Sequenced last despite carrying ~60% of the count** - it sits behind Gate 3 (buyers demand completion data) and Gate 4 (a single narrow path fails procurement). Built earlier, it produces a seat-management system with nothing sellable to put in it.
- §8 framing as written then:
  - **The binding constraint at 100k is distribution** - audience, brand, sales pipeline, category position. None of it lives in this repo.
  - **Cost of admission:** ~4–5 year arc, 20–40 person company, ~$5–20M deployed, and a founder whose days become hiring and sales rather than writing lessons.
  - **Odds:** ~1% on the current model; ~15–25% with all levers executed over ~5 years. A real plan, not a lottery ticket.

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

### P0 - PostHog data integrity (found 2026-10-02, fixed 2026-10-03)

- [x] **Pageviews were double-counted again, by a different path.** On every hard load with stored consent, the consent handler's init capture and the route effect captured the same URL in one commit (28% of production pageviews). One deduping helper now sends every `$pageview`.
- [x] **A cross-tab storage loop made 97% of all events `$opt_in`** and drained the client rate limiter, which dropped real events in any session with two tabs open. The consent listener now reacts to the consent key only.
- [x] **`$pageleave` was never captured**, so until 2026-10-03 the last page of every visit had no duration or scroll depth (earlier pages carry theirs on the next `$pageview`).
- [x] **Signing out could resume tracking after a consent withdrawal.** `posthog.reset()` deletes the SDK's opt-out flag; `reset()` now re-applies the stored consent, and PostHog starts opted out until consent opts it in.

**Filter PostHog data from 2026-08-26 to 2026-10-03 before using it:** drop `$opt_in`, the owner, `localhost` hosts and the 2026-10-01 automation burst, and expect duplicates and gaps in multi-tab sessions. `$pageview` `$current_url` was a relative path before 2026-10-03 and the full URL after, so group pageviews by `$pathname` across that date. Open items: `docs/post-launch-backlog.md`, "PostHog data audit follow-ups (2026-10-03)".

### Still open from the 2026-07-21 re-audit

Tracked canonically in `docs/audits/launch-blockers-history-2026-08-23.md`; not duplicated here. Status has moved since this section was first written: the six Tier 1 defects (world-callable `SECURITY DEFINER` RPCs, middleware SPOF, paying customers shown the paywall, checkout hang/double-charge, missing signup instrumentation, false guest-progress notice) were **fixed in code the same day** - one blocking operator step remains (apply migration `039`). Everything else open lives in that doc's Tier 1-OPS (operator/distribution setup), Tier 2 (fix in week 1, pre-ad-spend) and Tier 3 (fix before ~10k users). One item this list previously carried was stale: `immutable` headers on `/vendor`/`/models` shipped 2026-07-21 (`next.config.ts`).

### New environment variables (operator)

`KIT_TAG_PAYWALL_HIT` and `KIT_TAG_MODULE_1_COMPLETE` - documented with the rest of the Kit setup in `docs/audits/launch-blockers-history-2026-08-23.md` Tier 1-OPS. Setting them late is safe: R2-7 made missing-tag skips recoverable.

**Why Horizon 0 came first:** it made the existing offer purchasable and added
funnel instrumentation. The October 3 [PostHog follow-ups](post-launch-backlog.md#posthog-data-audit-follow-ups-2026-10-03)
record low tracked external use and attribution, event-loss, and duplication
gaps. Instrumentation exists; a trustworthy funnel baseline is still pending.

---

## 3. Gating Sequence - What Must Be True Before What

These are evidence requirements for expansion. Learning observations,
measurement repairs, and audience-building can proceed in parallel. The gate
numbers do not put learner validation after subscription implementation.

- **Gate 1 - Qualified demand.** Demonstrate that JavaScript engineers with a concrete learning need will buy and use the course. The JavaScript rebrand was completed on 2026-08-19 across copy, metadata, schema, and content. Broader positioning and additional worlds cannot establish demand by themselves. Use the first 1,000 buyers plan and separate learner observations before expanding the catalog.
- **Gate 2 - Acquisition economics.** Measure retained revenue after refunds, fees, delivery/support costs, and attributable acquisition costs for the actual offer. Report source, cohort, observation window, and missing attribution. A one-time course can satisfy this gate; recurring billing is optional. Do not count hypothetical future subscriptions or purchases as observed lifetime value.
- **Gate 3 - Learning and funnel proof.** Complete internal checks, run the opening discovery round, then retain the existing [formal novice pilot](learning-study/pilot-protocol.md). It observes all five free lessons, independent model work, the final project, delayed understanding, and actual use. Fix failed learning gates before claiming effectiveness. Repair measurement and reconcile genuine purchases/refunds before scaling an unproven paid funnel. Completion clicks and story enjoyment are insufficient by themselves.
- **Gate 4 - Relevant coverage.** For an optional enterprise offer, establish the specific team's learning need and whether the catalog meets it. Broader coverage is required only where that buyer need requires it. Each additional world retains its own release and learner gates.

---

## 4. Horizon 1 - Fix the Economics (0–9 months)

_Work items: `docs/post-launch-backlog.md` §8, Horizon 1. This section carries rationale and decisions only._

**Qualified demand (Gate 1).** The JavaScript rebrand shipped August 18 and
the browser-anchored bridge triage completed August 19, as recorded in the
canonical backlog. Wider positioning is implemented, but paid demand remains
unmeasured. Observe whether beginners see why the free foundations lead to
useful model work, including learners initially interested in AI features
rather than training. Record research intent separately from product analytics.
Authoring tools and more worlds follow a demonstrated content need; they are
not substitutes for that evidence.

**Optional subscription.** Reassess all-access only if buyers want continuing
learning value and a sustainable release cadence exists. Compare its economics
with the one-time offer before committing to billing or entitlements work.
The earlier ~$15–25/month range is an unvalidated proposal. If selected, retain
the backlog's payment tests, existing-buyer treatment, and release-cadence
dependencies. A subscription is not Gate 2's required implementation.

**Payment rails (decided 2026-07-22): stay on Stripe; Lemon Squeezy rejected.** Lemon Squeezy has been in maintenance mode since Stripe acquired it (July 2024) - its team now builds Stripe Managed Payments (SMP), Stripe's own merchant-of-record product, and LS support/updates have visibly slowed. Adopting it in 2026 means migrating twice. Fee reality on the $59–159 ladder: Stripe direct 2.9% + 30¢ (~3.2% effective on $99); Lemon Squeezy 5% + 50¢, plus 1.5% international and 0.5% subscription surcharges (~5.5%); SMP 6.4% + 30¢ (~6.7%). The MoR premium is 2.3–3.5 points of revenue, and what it buys - global tax registration, filing, remittance - matters to us almost entirely as EU/UK VAT, which is already a launch blocker (`docs/audits/launch-blockers-history-2026-08-23.md` R2-4). Stripe Tax (+0.5%/txn) automates calculation and collection but leaves OSS registration and filing with us.

The money path is deep and freshly hardened (`apps/api/src/routes/payments.ts`, migrations 035/037/038, Run #7 behavioral proofs); switching providers pre-launch is pure risk with zero launch upside. Re-evaluate MoR only when the subscription launches or international mix makes OSS filing a real operating cost - and then compare Paddle (5% + 50¢, mature B2B invoicing, relevant to Horizon 3 seats) and Polar (~4% + 40¢) against SMP, not Lemon Squeezy.

**Instrument growth.** Complete the existing PostHog repairs and reconcile
payments first. Then measure sources, qualified use, retained revenue, and
acquisition costs. Add referral events when testing a referral mechanism;
virality is not required to establish viable one-time acquisition economics.

---

## 5. Horizon 2 - Build Reach (9–24 months)

_Work items: `docs/post-launch-backlog.md` §8, Horizon 2._

This horizon is a set of distribution options. The 9–24-month range is a
legacy planning label, not a measured delivery forecast.

**Optional competition arena.** Test whether learners want shared challenges
and whether a small prototype improves learning or qualified acquisition
before building the full product. Existing browser exercise grading is
client-authoritative; it does not establish trustworthy public rankings.
The canonical backlog and [arena scoring contract](arena-scoring-contract.md)
retain the server-side re-scoring, sandbox, determinism, moderation, and
cross-user requirements. An arena is not needed to make the core course useful.

If an arena is selected, retain the earlier free-arena decision and measure its
learning and free-to-paid outcomes. Do not assume a viral coefficient in the
200,000-customer forecast.

**Scale SEO.** The assets already exist, disconnected: the 51-bridge dataset (`packages/shared/src/bridges.ts`) has rendered nowhere public since the 2026-05-05 revert, the sitemap is deliberately throttled to "core", and the blog sits at one post despite a working news→lesson matching pipeline.

---

## 6. Horizon 3 - Leverage the Count (24–48 months)

_Work items: `docs/post-launch-backlog.md` §8, Horizon 3._

Enterprise remains optional. The 24–48-month range is a legacy planning label,
not a required timetable or forecast of customer contribution.

**Enterprise / seats.** No orgs, members, seats, or invitations exist; the role
enum is a flat `user | admin`. Establish the actual team's learning and
procurement requirements before selecting infrastructure. SSO/SCIM, invoicing,
and compliance proposals retain their own dependencies and estimates.

**Sequenced behind Gate 3 and Gate 4.** Enterprise buyers need evidence of useful learning and coverage suitable for their specific need. The earlier assumption that enterprise would supply about 60% of the count was a seat scenario, not a forecast of unique customers.

---

## 7. What Code Cannot Fix

Every item here could ship perfectly and the goal could still be missed.

- **Reaching 200,000 paying customers requires sustained distribution:** an audience, trusted recommendations, and repeatable acquisition. Product implementation alone cannot provide them.
- **It has the longest lead time and no shortcuts.** Comparable creators built free audiences for *years*; the course monetized existing trust rather than creating it.
- **So it runs in parallel, starting before the code is ready.** Audience-building is the critical path and it is slower than the engineering. Do not sequence it after the platform work.

---

## 8. Honest Framing

- **Each horizon is a different business.** Subscription = SaaS ops. Arena = consumer growth. Enterprise = B2B sales + compliance. Staff and capitalize accordingly.
- **Timing, staffing, and capital remain unmeasured.** The earlier four-to-five-year, 20–40-person, and $5–20M scenarios were assumptions for a different business mix. They are not requirements or forecasts for the cumulative customer goal.
- **No defensible probability estimate exists.** The previous percentage estimates had no supporting model or customer evidence and are withdrawn.
- **Learner effectiveness and paying demand remain open questions.** Internal review supports proceeding to observation, not a claim that any customer-count range is achievable. Require useful independent model work and genuine buying evidence before expanding the offer or scaling acquisition.

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
