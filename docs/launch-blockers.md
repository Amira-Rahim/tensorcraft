# Launch Blockers - Definitive List (2026-07-21, re-baselined 2026-07-25, reconciled 2026-08-20)

> **Status convention (introduced by the 2026-08-20 reconcile). Every
> forward-looking entry below now carries exactly one of these, and nothing
> else counts as a status:**
>
> - `- [x]` **DONE** - verified against the repo, with the evidence named in
>   the entry. Not "a previous session said so".
> - `- [ ]` **OPEN** - real work, doable in this repository.
> - `- [ ] (OPERATOR)` - real work that CANNOT be done or verified from a
>   checkout: a third-party dashboard, a billing plan, a DNS record, a
>   signature, a production database. The entry names what to check and
>   where.
>
> **Why this was needed:** before the reconcile the file mixed 30 checkbox
> items with 91 prose bullets, and genuine open work lived in both. Anyone
> counting `- [ ]` undercounted, and three live items were sitting inside
> sections whose headings say "CLEARED" or "FIXED" (external uptime
> monitoring, Vercel deploys not gated on CI, and the Vercel install
> command). Those are now checkboxes in the tiers below.
>
> **What the reconcile did NOT touch:** the round-by-round audit narrative
> (ROUND 2, ROUND 3, the 2026-08-14 CI and Vercel sections, Tier 1). That is
> the historical record of what was found and fixed, and it stays as written.
> Only the four forward-looking tiers were normalized.
>
> **A caution that came out of the pass:** several entries previously marked
> done rest on production database state (migrations applied, ledger IN
> SYNC). A checkout cannot confirm any of it. Those are now `(OPERATOR)`
> with the exact command to run, rather than `[x]`.
>
> **Same-day correction (2026-08-20, later):** that caution was half wrong,
> and the half that was wrong cost four entries a false OPERATOR label.
> `apps/api/.env` carries `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and
> `DATABASE_URL`, so the ledger IS checkable from a normal checkout.
> `pnpm migrate:status` was run and reports **IN SYNC 59/59**, closing the
> ledger entry, the 037-055 batch, migration 056 and the 057 half of the
> runbook item. `gh secret list` and a live health probe closed the rest of
> the ops-deploy entry. What survives as genuinely operator-only is narrower
> and now stated as such: the 046 Auth hook, which is dashboard config with
> no schema footprint.
>
> **The reconcile's own rule caught a bad entry, in the other direction.**
> "Verify before you record" applies to newly written findings too, not just
> inherited ones: the 019 sub-item told the reader to drop
> `get_shared_certificate`, which is load-bearing for the public certificate
> share pages. Reading the entry as a work order would have broken
> production. The real defect was one line of rollback SQL, now fixed. When
> an entry says to DELETE something, confirm what depends on it first.

> **What this document is:** the complete set of pre-launch work - code defects (Tier 1; Tier 2 in week 1), operator setup (Tier 1-OPS), and legal/compliance actions (Tier 1-LEGAL). Originally scoped to code defects only ("when Tier 1 is done there is no further blocker"); that claim is superseded - since the 2026-07-22 consolidation the release gate is **Tier 1 + Tier 1-OPS + Tier 1-LEGAL complete**, with Tier 2 due in week 1 before ad spend. **Round 3 (2026-07-25) adds two release-gate items: R3-1 (API undeployable at HEAD) and R3-2 (migration 047 must precede the next API deploy).**
>
> **What it is not:** a path to 100,000 paying users. See "The honest ceiling" at the bottom. Do not conflate the two.
>
> **This document is the actionable subset.** The complete findings register -
> every Medium and Low item across all six audit dimensions, with file:line and
> status - is `docs/audits/full-audit-2026-07-21.md`. If something you remember
> being raised is not here, it is there.

## Why earlier audits said "launch ready"

Every audit before 2026-07-21 examined **content and copy** (`docs/audits/*`). The verdict "A+ / launch ready" was accurate about lesson quality, story, and exercise rigor. It was never a statement about the monetization path, funnel instrumentation, database security, or behaviour at scale - those dimensions had **never been audited**. They were unexamined, not cleared. This document closes that gap.

---

## ROUND 2 (2026-07-21, six-dimension audit) - NEW BLOCKERS

A second, deliberately exhaustive audit covered the dimensions the first pass
had not: security/RLS, legal/tax, data integrity, operational readiness,
accessibility, runtime correctness. It found blockers more severe than
anything in Round 1.

### R2-1. CRITICAL - any signed-up user could make themselves admin

`001_initial_schema.sql:30-32` declares the profiles UPDATE policy with
`using (auth.uid() = id)` and **no `with check`**. Postgres reuses the `using`
expression as the check, so the post-update row need only still be your own -
and `006_admin_roles.sql:11` later added a `role` column to that same table
with nothing guarding it. The settings page writes to profiles directly over
PostgREST with the anon key, so the exploit was one line in a browser console:

```js
supabase.from("profiles").update({ role: "admin" }).eq("id", user.id)
```

`021_fix_admin_policy_recursion.sql` then grants admins SELECT on **every**
user's profile (including the plaintext `github_token`), every purchase, every
progress row, and the whole waitlist. A full customer-data breach reachable by
anyone who signs up.

**FIXED in code** - migration `040_fix_privilege_escalation_and_view_leaks.sql`
adds a BEFORE UPDATE trigger that reverts any role change not made by the
service role, plus an explicit `with check`. **Must be applied to production.**

### R2-2. HIGH - two views leak every user's data (fixed in 040)

- `dashboard_stats` (`012:25`) is a materialized view aggregating all users'
  progress. **Materialized views cannot carry RLS in PostgreSQL**, and it sits
  in `public`, so PostgREST served it to anon. 040 revokes it (no app code
  queries it).
- `world_progress_summary` (`005:10`) carries a comment asserting it "inherits
  RLS from underlying table." That is false: views default to
  `security_invoker = false`, so policies evaluate as the view's *owner*,
  bypassing RLS entirely. 040 sets `security_invoker = true`.

### R2-3. HIGH - the GitHub token was returned in an API response (fixed)

`profiles.ts` used a bare `.select()` (≡ `select("*")`) and returned the row to
the caller, so `PATCH /api/profiles/{self}` with `{"display_name":"x"}`
answered with the caller's plaintext GitHub token - into devtools, HAR
exports, and any frontend error reporter capturing response bodies. Now an
explicit column list.

Still open on this column: it is stored **plaintext** and is readable directly
by the browser (`select("github_token")` works for your own row, since the RLS
policy is row-level with no column restriction). Encrypting it is Tier 2.

### R2-4. P0 LEGAL - these are not code problems and need an advisor

An advisor who knows your establishment country should see these before you
sell to anyone in the EU/UK. I am flagging exposure, not giving legal advice.

- **No tax handling of any kind exists.** Zero matches for `automatic_tax`,
  `tax_id_collection`, or `billing_address_collection` in the repo. EU VAT on
  digital services is due at the *buyer's* rate from the **first sale** - the
  €10k threshold applies only to EU-established sellers. Unremitted VAT comes
  out of your margin retroactively and OSS registration cannot be backdated.
  Your own `docs/prd.md:528` risk register already prescribed "Use Stripe Tax";
  it was never implemented. (2026-07-22: the merchant-of-record route was
  assessed as the alternative - Lemon Squeezy rejected as a sunset product
  post-acquisition; Stripe Managed Payments costs 6.4% + 30¢ vs ~3.7%
  all-in for Stripe + Stripe Tax. Resolution remains Stripe Tax + OSS
  registration, or geo-gating EU checkout at launch. Analysis:
  `docs/roadmap.md` §4.)
- **The refund terms are unenforceable against EU/UK consumers as written.**
  "14 days *if less than 20% accessed*" (`terms/page.tsx:90`) only holds if the
  buyer expressly waived the withdrawal right and acknowledged losing it.
  Nothing collects that waiver. So today every EU buyer keeps a full,
  unconditional 14-day right regardless of how much they consumed - and
  presenting the 20% condition as binding is itself an unfair commercial
  practice.
- **No legal entity, address, or jurisdiction clause anywhere** in terms or
  privacy. Required pre-contract disclosure under the Consumer Rights and
  E-Commerce Directives.
- **No receipt or invoice is sent.** The "confirmation" at `payments.ts:676`
  fires a Kit *tag*, and the Kit automations do not exist yet - so buyers
  currently receive nothing. A leading cause of chargebacks.
- **No postal address in the weekly digest** - CAN-SPAM requires one in every
  commercial message, and the digest is live.
- **Waitlist consent escalation:** `subscribed` defaults to `true` and the
  sender ignores `world_id`, so someone who asked to be told when one world
  ships is auto-enrolled into a newsletter carrying discounts.

### R2-5. HIGH OPERATIONAL - you would not know anything broke

- **Zero alerting.** Sentry captures; nothing notifies. A failing Stripe
  webhook, a 500 spike, or a payment failure would reach you only via a user
  email. `pre-launch-checklist.md:561` already specifies the three rules
  needed; §B10 remains unticked.
- **8 of 11 error boundaries never reported to Sentry** - including `/pricing`
  and `/paywall`. A nested boundary stops propagation, so crashes on the two
  revenue routes were swallowed before the root boundary saw them. **FIXED.**
- **No record of which migrations are applied.** No `schema_migrations`, no
  CLI state, no CI step; four docs disagree and the newest stops at 026. With
  40 migration files and manual SQL-editor application, **nobody can state the
  production schema**. 037, 038, 039 and now 040 are all pending. Reconcile
  before applying anything.
- **Vercel Hobby.** `docs/infrastructure.md` records the web app on the free
  tier. Hobby prohibits commercial use, and you sell a $59-159 product - a ToS
  and takedown risk before it is a cost one.
- **Fly is `iad`, Supabase is `eu-west-1`** (per `supabase/.temp/pooler-url`),
  though `infrastructure.md` claims co-location. Every API→DB query crosses
  the Atlantic.
- **Health check gates Fly liveness on a DB query**, so a Supabase blip kills
  the whole API fleet instead of riding it out.

### R2-6. Resolved, not a bug

- **Dependency CVEs: clean.** `pnpm audit` → 0 vulnerabilities across 938
  deps. The "91 Dependabot alerts" note in project memory is **refuted** -
  they were fixed via an 18-entry `pnpm.overrides` block.
- **The lesson SSG/dynamic contradiction is benign.** `prerender-manifest.json`
  lists **0** lesson routes: `cookies()` forces dynamic rendering, so no
  per-user paywall state is baked into shared HTML. The cost is that
  `generateStaticParams` buys nothing and the "edge cache" comment is false -
  a perf issue, not access control.
- **No price tampering, no IDOR, no XSS, no committed secrets, no open
  redirect.** Verified explicitly.

### R2-6b. Runtime correctness - fixed this round

- **Every OG image sitewide was blocked from crawlers.** `robots.ts` carried a
  blanket `Disallow: /api/`, and every OG/Twitter card on the site is
  generated at `/api/og?...`. Every share card you or anyone else posted would
  have rendered imageless - directly undercutting the distribution phase.
  Fixed with an explicit `Allow: /api/og`.
- **Free signed-in users were shown modules 2-4 as unlocked, then bounced.**
  The world map gated on `isFoundationsModule` (`track === "foundations"`,
  which spans deep-orbit modules 1 *through 4*) while the lesson route gates
  on `mod.order > 1`. So immediately after the free-account CTA converted
  someone, they saw three more modules apparently available and hit a paywall
  on click. Anonymous visitors were unaffected, which is why every
  anonymous-path check passed. Map now uses `mod.order === 1`.
- **`/certificates/<uuid>` returned a raw 500** when the API was unreachable -
  no try/catch around the fetch - on the most-shared surface in the product.
  Now rethrows into a new `certificates/error.tsx` that says "temporarily
  unreachable" with a retry, rather than 500ing or (worse) claiming the
  credential does not exist.
- **Organization JSON-LD asserted `logo.png`, which 404s** (there is no PNG in
  `public/` at all). False structured data and a failed rich result. Removed.
- **Extras breadcrumb JSON-LD pointed at a 404** - `/extras/<module>` has no
  route - from all 21 extras lessons. Level removed.

Still-open items from this sweep were folded into the Tier 2 list below
(2026-07-22) so this document has exactly one week-1 list.

Also worth knowing: `apps/web/app/metadata.test.ts` passes 21/21 while every
metadata defect above survived it - it reads exported objects in isolation,
tests zero `generateMetadata` functions, and never imports 10 of the routes.

### R2-6c. Accessibility & compatibility - one outage-class bug, fixed

- **White screen on every route for anyone blocking site data.**
  `world-provider.tsx` guarded `typeof window` but not the `localStorage` call
  itself. `localStorage` does not return null when site data is blocked - it
  **throws SecurityError** (Safari "Block All Cookies", Chrome site-data
  blocking, enterprise policy, any sandboxed iframe). That read is the
  `getSnapshot` of a `useSyncExternalStore` in a provider wrapping the whole
  app, so it threw **during render** and unwound to `global-error.tsx`: an
  unrecoverable white screen on every route, including /terms and /privacy.
  The inline bootstrap at `layout.tsx:111` already wraps this same API in
  try/catch, as do ~25 other storage sites - this one was missed. **FIXED**,
  2 regression tests.
- **The exercise editor mounted twice on mobile - on the graded path.**
  `LessonShell` renders `right` at every width, while `lesson-steps` *also*
  embeds the same pane behind a mobile toggle. Measured at 375px: two
  `.sp-wrapper`, two "Run Tests", two `role="status"` regions - two code
  buffers racing on one `tc-code-{slug}` key, breaking the single-submit
  invariant the code itself asserts. Desktop was always correct, which is why
  desktop-only e2e never saw it. **FIXED** (pane slot is now `hidden lg:block`),
  2 regression tests.

Still-open mobile/a11y items from this sweep were folded into the Tier 2
list below (2026-07-22).

Two structural notes worth more than any single item (**both since resolved -
see R3-10**: runner timeout is 30s with an honest "Downloading TFJS" label;
webServer timeout is 180s and the 28/28 axe matrix genuinely runs):

1. **The 1.47 MB TFJS bundle downloads inside the exercise runner's 10s
   timeout.** On 3G that download alone is ~30s, so every slow-connection
   learner's first "Run Tests" fails as "Timed out after 10 seconds" -
   misattributed to their code.
2. **The e2e accessibility gate fails open.** `playwright.config.ts` allows
   30s for `webServer`, against measured cold compiles of 19-154s. When it
   times out the result reads as infra flake, not as "accessibility was never
   checked" - and the ten specs that never ran cover Worlds, World Detail,
   Pricing and all six lesson steps, i.e. the entire paid surface. Only
   Landing, Auth, Terms and Privacy are actually verified.

Also corrected: `docs/browser-support.md` claims a Chrome/Firefox/Safari/Edge
CI matrix. Reality - `playwright.config.ts` defines chromium plus three WebKit
projects, and **all three WebKit projects are `testMatch: /mobile\.spec\.ts/`**,
so WebKit only ever runs the mobile smoke suite. **Firefox has zero automated
coverage.** There is no `browserslist` in the repo, so the stated floors are
unenforced.

### R2-7. Also fixed this round

- **Kit tags could be permanently lost.** `/api/email` answers
  `200 {skipped:true}` when a tag id is unset - the default, since
  `KIT_TAG_PAYWALL_HIT` / `KIT_TAG_MODULE_1_COMPLETE` are undocumented. The
  client treated that 200 as success and burned a permanent dedupe flag, so
  configuring the secret later could never recover those users. Now centralised
  in `lib/kit-tag.ts`, which records the flag only on a real tag. 6 tests.
- **Sign-in could strand users forever** - `auth-form.tsx` lacked try/finally,
  so a throw left the button spinning with no error and no retry, on the front
  door. Resend now also confirms success.
- **`signup_completed` fired nowhere**, making the signup conversion rate
  uncomputable and the `tech-spec.md` KPI formulas undefined. Now fired on
  session establishment.
- **Middleware ran on `/vendor/*` and `/models/*`**, costing an edge
  invocation plus a GoTrue call per static asset. Matcher tightened.
- **`immutable` cache headers** added for `/vendor` and `/models`.

---

## ROUND 3 (2026-07-25, delta re-audit) - THE CODEBASE MOVED PAST THE LIST

Commits `0c85ab9..24d45e4` (2026-07-21 → 24) changed ~219 files and added whole
subsystems **after** the six-dimension audit: journey enrollment (044 +
`/journey`), arena submissions (048, schema only), onboarding JWT-claim hook
(046), Stripe Tax capture (043/047 + `payments.ts`), light mode, entitlements
consolidation, and deletions (`packages/github`, `apps/api/src/lib/cache.ts`,
counterfactual client). Eight parallel re-audits covered the delta: new-migration
security, money path, new subsystems, regression check of all 20 prior FIXED
claims, ops/env/CI, light-mode a11y, legal delta, runtime/SEO delta.

Battery at HEAD `24d45e4`: typecheck 10/10, vitest 1553 passed / 85 skipped,
axe matrix 28/28 re-run green (both schemes). **All 20 previously-FIXED claims
hold** - nothing regressed across the churn.

### R3-1. CRITICAL - the API cannot deploy: Dockerfile references a deleted package

`apps/api/Dockerfile:10` still COPYs `packages/github/package.json`, but
`24d45e4` deleted `packages/github/` entirely (dead code - zero source imports;
the dependency and lockfile entries were removed in the same commit). Docker
COPY of a missing path fails the deps stage, so **any `fly deploy` from HEAD
fails** - the Stripe-webhook host cannot ship the tax-capture code or any other
fix. One-line fix: delete the COPY line. (The stale `docs/tech-spec.md` and
root `tsconfig.json` references to the deleted package were removed in the
same sweep.)

### R3-2. HIGH - migration 047 is deploy-order blocking (supersedes "none of 045-048 is launch-blocking")

`payments.ts:670-684` (sync) and `:912-935` (async) include `tax_amount`,
`tax_country`, `customer_tax_id` in the purchases upsert **unconditionally** -
the keys are present even with the tax flag off. If this API deploys before 047
is applied, every `checkout.session.completed` upsert fails (PGRST204 unknown
column) → handler returns 500 → Stripe retries exhaust → **customer charged,
purchase never recorded, no access granted.** `payments.test.ts` 34/34 is blind
to this (mock DB accepts any columns). The 043 write is accidentally safe only
because its result is never inspected - which is its own bug (R3-4e).
**Order: apply migrations 037-051 first, then deploy the API.** (Range updated 2026-07-25 - an earlier revision said 037-048, predating 049-051.)

### R3-3. HIGH - Stripe Tax code now EXISTS, flag-gated, ~~documented nowhere~~ (**documented 2026-07-25** in `.env.example` + deployment-guide with prerequisites; remaining work is the operator half - dashboard Tax setup, OSS decision, flag flip)

R2-4's "no tax handling of any kind exists" is stale as written:
`payments.ts:47-55` `taxSessionParams()` sets `automatic_tax`,
`billing_address_collection: "required"`, `tax_id_collection`,
`invoice_creation`, spread into both session creates; the webhook persists the
tax columns and `stripe_customer_id`. All of it is behind
`STRIPE_TAX_ENABLED === "true"` - **default OFF**, absent from every
`.env.example` and operator doc (only the scalability audit mentions it).
Unset → checkout silently collects no tax (the R2-4 exposure persists while its
fix sits dark). Set `true` before the Stripe-dashboard Tax setup → session
creation fails (checkout outage). Tier 1-LEGAL items 1-2 are now
"advisor + dashboard + flag flip", not "write code".

### R3-4. Money-path defects in the new payments.ts - **ALL SIX FIXED 2026-07-25** (payments.test.ts 41/41)

> a) dispute zero-row → 500 retry (mirrors the refund fix) · b) pending
> writes now ON CONFLICT DO NOTHING (demotion race closed at the DB call) ·
> c) sync path guards duplicates like async (`existingRow?.status !==
> "completed"`) · d) `failed` sessions render "Payment Didn't Go Through" +
> back-to-pricing, never the poller · e) `stripe_customer_id` write error is
> inspected + logged · f) checkout reuses the stored Stripe Customer with a
> retry-without fallback. Original findings retained below as the record.

- a) **`charge.dispute.created` matching zero rows is ACKed** (`:855-874`, no
  zero-row check, returns 200) - access never revoked, no Stripe retry. The
  identical bug in `charge.refunded` was fixed in run #7 (`:810-825` 500s);
  the dispute handler never got the fix.
- b) **`completed` → `pending` demotion race** on delayed methods: retried
  `checkout.session.completed` (unpaid) interleaving with
  `async_payment_succeeded` can overwrite `completed` with `pending`; trigger
  038 guards only terminal statuses. SEPA/bank-debit buyer permanently loses
  access. Millisecond window.
- c) **Sync path re-fires the PAYMENT_COMPLETED revenue event + Kit
  confirmation email on webhook re-delivery** - the async handler has the
  duplicate guard (`:942`), the sync handler doesn't. Revenue double-count in
  the server "source of truth" event.
- d) **A `failed` (async_payment_failed) purchase renders "Almost There" +
  poller** - a bounced payment reads as "still confirming".
- e) **The `stripe_customer_id` persistence error path is dead code** -
  supabase-js returns errors, doesn't throw; the result is never inspected, so
  043-unapplied (currently true in prod) is a silent no-op with no operator
  signal.
- f) **No `customer:` reuse at checkout** - with `invoice_creation` on, Stripe
  mints a new Customer per purchase; repeat buyers accumulate duplicates.
  Footgun for the H1 subscriptions the 043 column exists for.

### R3-5. MEDIUM - `profiles.stripe_customer_id` was client-writable (billing-linkage poisoning) - **FIXED in code 2026-07-25: migration 049** extends the 040 trigger to clamp it (apply with the pending batch)

040's trigger clamps only `role`; no column-level revoke exists on `profiles`.
Any signed-in user can pre-set their own row's `stripe_customer_id` to a
victim's `cus_...` via PostgREST, and the webhook's
`.is("stripe_customer_id", null)` guard then **permanently blocks the
legitimate capture**. Inert in V1 (nothing reads the column); must be closed
before subscription/seat billing ships - extend the 040 trigger to clamp
server-owned columns, or `revoke update(stripe_customer_id)`.
Everything else in 041-048 audited clean: 044/046/048/042 have correct
RLS/grants/WITH CHECK, no new SECURITY DEFINER exposure (046's hook is
supabase_auth_admin-only), every down migration exactly reverses its up (no
019-style signature mismatch), 047's columns sit on write-locked `purchases`.

### R3-6. New surfaces shipped un-instrumented / un-hardened - **MOSTLY FIXED 2026-07-25**

> Fixed: `journey_enrolled` + `script_skipped` events added to the typed
> registry; `getJourneyState` now throws on lookup errors (new
> `journey/error.tsx` boundary; regression tests); ring pct clamped AND
> orphan lesson rows filtered against the live corpus (journey-progress);
> enroll button re-arms on auth redirect and after refresh; onboarding
> retries a failed `refreshSession` once and warns; `capstone-email-tag`
> migrated to `tagKitEventOnce`. ~~Still open: completed_at writer;
> axe/e2e coverage~~ - **both closed later the same day (run 2)**:
> `journey/page.tsx` writes `completed_at` once when the closed ring is
> observed, and `/journey` + `/learn` joined the axe matrix (both schemes).
> Original findings below as the record.

- **Journey funnel is dark**: zero analytics events on enroll or page;
  `journey-progress.ts:53-66` swallows DB errors, so an enrolled learner mid-
  blip sees "Begin the canonical journey" + 0/56 (contradicts the fail-loud
  rule codified in `entitlements.ts` one file over); ring renders >100% after
  content re-slugs; `journey_enrollment.completed_at` has no writer; enroll
  button has no terminal state on a failed refresh; **zero tests and zero axe
  coverage on `/journey` and `/learn`**.
- **Onboarding ignores `refreshSession()` failure** (`page.tsx:235`) - with
  hook 046 enabled, a failed refresh leaves the stale `onboarding_completed:
  false` claim bouncing the learner back into the wizard until token expiry.
- **`capstone-email-tag.tsx:10-28` still burns its Kit dedupe flag before the
  request** - the exact R2-7 defect class, never migrated to `lib/kit-tag.ts`;
  the `capstone` tag is unrecoverable for browsers that visit before the Kit
  env vars are configured (that window is live until Tier 1-OPS closes).

### R3-7. Runtime/SEO delta - **MOSTLY FIXED 2026-07-25**

> Fixed: full openGraph+twitter blocks on world detail / lesson / learn /
> capstone; skill-genome refire closed (completion signals fire only on an
> in-session transition into step 5, exercise_pass only on first pass);
> session-toast timer cleared/reset; particle-field caches its resolved
> color (no per-frame getComputedStyle) + live reduced-motion listener +
> scheme-flip repaint; the five sitewide Course JSON-LD blocks removed from
> the root layout (page-level markup is canonical); bundle offers emit
> OutOfStock instead of PreOrder; pending-poller live region always-mounted;
> deep-scan post-await cancelled check; dead `ticker.tsx` deleted;
> `use-attribute-observer` filter derived from consumers (widens in place).
> Still open (Tier 2, tracked in the journey/new-surface bullet): the
> double Sandpack mount (structural, CSS-only fix today); `/journey`
> per-request `getUser()` crawl-cost nit. Original findings below as the
> record.

- **og:url shallow-merge drop on the 4 highest-share routes**: world detail,
  every lesson, `/learn`, capstone declare images-only `openGraph`, which
  replaces (not merges) the parent - og:url/type/siteName vanish and the
  homepage Twitter card is inherited. The fix pattern exists in the repaired
  routes; these four were skipped.
- **Skill-genome inflation**: the step-5 completion effect refires per revisit
  and per repeated passing run (`lesson-steps.tsx:314-353`, `:401-407`);
  `skill-events.ts:139` raw-inserts and 014 SUMs with no dedupe - reopening a
  finished lesson 10× adds +40 proficiency, and completion analytics inflate
  from day 1. Dedupe/guard before real users generate genome data.
- **Two Sandpack editors mount at every width** - the R2-6c fix is CSS-only
  (`hidden` classes); rotate/resize across `lg` shows a stale buffer (restore
  is mount-once), and the graded path pays doubled CPU/memory. Regression
  tests assert classes, not mount counts.
- Smaller: `session-toast.tsx:15` timer never cleared (re-fire hides fresh
  toast, setState after unmount) · `particle-field.tsx` runs
  `getComputedStyle` every rAF frame on the landing hero and never re-checks
  reduced-motion (violates the contract in `effects/index.ts:9-12`) ·
  duplicate `Course` JSON-LD on all five world slugs (layout array + page,
  different names/offers) · bundles still emit `PreOrder` on hard-disabled
  2/3/5-world buttons and coming-soon worlds still assert `price: "59"` in two
  places · `pending-poller.tsx:54-58` mounts `role="status"` with its content
  (unreliable announcement, on the lost-webhook recovery moment) ·
  `deep-scan-demo.tsx:134-143` fires one `setRows` after unmount ·
  `ticker.tsx` is dead code with an ungated rAF loop if ever remounted ·
  `use-attribute-observer.ts:54-57` hardcodes its attributeFilter while
  accepting arbitrary attribute args.

### R3-8. Privacy/legal delta (fold into Tier 1-LEGAL)

Legal pages unchanged since March/April - they now lag four new data
categories: `tax_country` + `customer_tax_id` (047), full billing address once
the tax flag flips, `stripe_customer_id` (043), `arena_submissions.
submitted_code` (048). Privacy §7's "remove your personal data within 30 days"
**conflicts with ~10-year VAT/OSS record retention** - the future deletion
endpoint must carve out tax records (advisor). GitHub integration creates
**public** repos by default (`lib/github.ts:259`) with zero terms coverage,
and privacy's "industry-standard OAuth 2.0 / PKCE" line is a written security
representation contradicted by the recorded plaintext, browser-readable
`github_token`. Arena's planned public leaderboard needs UGC/moderation/
retention terms before that feature ships (not before launch - no arena UI
exists).

### R3-9. Ops/CI delta - **FIXED 2026-07-25**

> CI installs chromium+webkit; new `migrations` CI job runs
> `pnpm migrate:status` (script now exits non-zero under CI when secrets
> are missing - fail closed, never silent green). **Operator: add
> `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as GitHub Actions secrets or
> this job stays red by design.** Guest purchase email falls back to the
> production domain instead of a broken relative link; `infrastructure.md`
> query-cache and `tech-spec.md` packages/github references removed.
> Original findings below as the record.

- **CI installs only Chromium** (`ci.yml:77`) while two Playwright projects
  (iPhone SE, iPad) are WebKit - on any browser-cache miss the mobile e2e
  fails "Executable doesn't exist"; the mobile gate is riding a stale cache.
- **`pnpm migrate:status` exists and is correct** (numeric sort, down-file
  exclusion, drift detection) **but is not a CI step** - the ledger gate the
  script was built for is unwired. Nit: offline mode exits 0, so a CI job
  with missing secrets would silently pass.
- **Guest purchase email builds its access link from `APP_URL ?? ""`**
  (`payments.ts:498`) - unset means a paying guest gets a broken link with no
  error anywhere (every other APP_URL site fails loud).
- `docs/infrastructure.md:17` still lists the Redis "query cache" deleted in
  24d45e4.

### R3-10. Stale-entry sweep - recorded OPEN, actually FIXED (docs overstated risk)

Verified against code at HEAD; the Tier 2 bullets below have been edited to
match.

- **e2e a11y fail-open**: `playwright.config.ts:74` webServer timeout is
  180s since 1c43c8f (same day as the audit); the 28/28 axe matrix genuinely
  runs. R2-6c structural note 2 is historical.
- **Exercise runner timeout**: now 30s with a "Downloading TFJS runtime
  (first run)..." button label - the 3G misattribution is mitigated (no
  prefetch yet; R2-6c structural note 1 downgraded, not gone).
- **Tier 2 SEO bullet, 5 of 7 sub-items**: capstone excluded from sitemap;
  `session_expired` only set when an `sb-` cookie existed; coming-soon worlds
  emit `OutOfStock`; `numberOfCredits` removed; og:url fixed on
  pricing/about/compare/worlds/journey/certificates (remainder → R3-7).
- **Tier 2 Mobile/a11y bullet, 6 of 7 sub-items**: step bar wraps at 320px
  (24×24 targets); waitlist input has a focus outline; hint/recall/magic-link
  reveals use the always-mounted live-region + focus-move pattern;
  `aria-pressed` on purchase toggles; sr-only `<h1>` per lesson step;
  `--tc-border-interactive` token (#808080 dark / #8a8a8a light) clears 3:1 on
  every genuine control in both schemes. Remaining: 13px editor type (now in
  BOTH Sandpack worlds) and no mobile-viewport axe run.
- **Opacity-dimmed text**: re-census at HEAD finds the 41-site figure
  obsolete - 22 sites remain, all ≥/65 alpha computing 4.96-11.4:1 in both
  schemes; the cited failures (landing "Notify me", ticker @40, bridge tiles)
  are gone or exempt-class. Residual: dark accents on overlay surfaces at
  3.99-4.23:1 (text-size use only).
- **"No server-side timeouts anywhere"**: GitHub lib now has 15s
  `AbortSignal.timeout` on all 8 fetch sites + retry/backoff. Kit, Resend,
  Upstash, Supabase remain timeout-less - the hung-Kit-in-webhook case
  stands.
- **`GITHUB_PRIVATE_KEY` name trap inverted**: no code reads any GitHub App
  key var anymore (sole reader deleted with `packages/github`); but
  `.env.example` and two docs still tell the operator to provision the dead
  secrets. OAuth vars (`GITHUB_CLIENT_ID/SECRET/CALLBACK_URL`) are the live
  ones.
- **Upstash "code throws" framing was wrong**: every call site catches -
  missing Upstash env means the API boots and serves with rate limiting +
  JWT cache **silently disabled** (a security degradation, not an outage).
  `infrastructure.md:136` ("will not start without") is false.
- **`cache.ts` latent landmine**: file deleted, zero references - resolved.
- **Counterfactual feature silently removed**: client deleted in 24d45e4,
  zero code references remain; table 031 + generated types + backlog
  mentions survive as debris. Update memory/backlog; drop the table in a
  future migration or document it as intentionally dormant.
- Light-mode additions audited clean: every storage/matchMedia touch guarded
  (SecurityError-safe), no FOUC/hydration path found, OG/favicon stay dark
  as decided, light palette gated by 124 assertions. Light-scheme residuals:
  decorative `--tc-border` #d8d8d4 is 1.31:1 (same deliberate split as dark;
  a few interactive stragglers still use it - landing secondary CTAs, picker
  toggle unselected, scheme toggle, poller support link), and
  `e2e/visual/responsive.spec.ts` has no light baselines; all non-axe e2e
  still runs dark-only via the global `colorScheme: "dark"` pin.

---

## ROUND 3, RUN 2 (2026-07-25, verification pass) - the audit audited itself

A second same-day pass re-verified the Round 3 remediation (three agents:
doc-vs-code truth walk, fresh gap sweep, adversarial diff review) and closed
what it found. Battery after: typecheck 10/10, vitest 1560+ green,
payments.test.ts 44/44, `pnpm audit --prod` clean.

**Doc-truth walk:** zero FIXED claims were false; five fixes were
UNDERSTATED (doc listed them open) and are now reconciled above; the one
dangerous doc bug - R3-2 still instructing "apply 037-048" after 049/050
existed - is corrected (the range is **037-051**).

**New findings, all fixed in code this pass:**

- **F1 HIGH - the digest sender could not record a failure and had no
  throttle.** The Resend SDK never throws (429/4xx/5xx resolve
  `{data:null, error}`); `error` was ignored, so `failed` was structurally
  unreachable - a fully-rate-limited launch blast would report
  `sent:500, failed:0` with zero Sentry captures, on the cold domain the
  warmup plan worries about. Now: `error` inspected + captured, 600ms
  spacing between sends (Resend limit is 2/s), regression test encoding the
  real SDK contract. Same class fixed in `sendIssueNotification`.
- **F2 - a WON dispute could never restore access.** No
  `charge.dispute.closed` handler existed, and 038's trigger silently
  clamped any manual repair back to "disputed" (`UPDATE 1`, no effect).
  Fixed with **migration 051**: a transaction-local escape hatch in the 038
  trigger + a service-role-only `restore_purchase_after_dispute(pi)` RPC -
  NOT a blanket service-role exemption, which would have re-opened the
  run-#7 race the trigger exists to close. New webhook handler restores on
  `won` (500-retries on zero rows / missing migration), no-ops on `lost`.
  3 tests.
- **F3 - the 040/049/051 clamps also block the OPERATOR's own SQL-editor
  updates** (sessions run as `postgres`, `auth.role()` is null → treated as
  a client; role promotions and customer-id repairs silently no-op). For
  purchases, `select public.restore_purchase_after_dispute('pi_...')` is
  the sanctioned path; for profiles.role/stripe_customer_id use PostgREST
  with the service key or `set local request.jwt.claims`. Recorded in the
  051 header; fold into the migration runbook when next touched.
- **F4 - `/api/og` + the one-click unsubscribe POST paid middleware + a
  GoTrue call per hit** (the R2-7 class, for route handlers). Matcher
  excludes both now.
- **Dependency CVEs had gone stale in 4 days:** `pnpm audit` showed 5 high
  and 5 moderate (Next.js SSRF/DoS ≤15.5.20, sharp, brace-expansion) against
  the register's "clean". Bumped next → 15.5.21, sharp → ^0.35.0,
  brace-expansion → ^5.0.8; **`pnpm audit --prod` is now a CI step** and
  `.github/dependabot.yml` exists (npm + actions + docker, weekly,
  grouped), closing the register's "nothing surfaces the next CVE" gap.
  `engines.node >= 22` pinned in root package.json (F5).
- Debris: root tsconfig's dead `@tensorcraft/github` path mapping removed
  (F6); dashboard loading skeleton's phantom ticker bar removed (F7);
  admin digest lesson links fixed to `/worlds/...` (was the 404ing
  `/learn/...` form).

**Adversarial diff review of the remediation itself** found three defects in
the run-1 fixes, all fixed same-pass:

- **D1 - the skill-genome refire guard was defeated by its own mount
  order** (the restore effect's `setCurrentStep(5)` lands after the
  completion effect stamps prev=0, so restored mounts still read 0→5 and
  fired; verified empirically). Now a `restoredAtFinalStepRef` consumed by
  the completion effect suppresses exactly the restored arrival; **2
  regression tests, including one that fails against the run-1 code.**
- **D2 - the first-pass dedupe put state in the callback deps**, giving
  `handleExerciseComplete` a new identity per pass and remounting the whole
  MDX subtree - wiping the "All tests passed!" panel the instant it
  appeared. Dedupe moved to a ref; callback identity stable again.
- **D3 - "the webhook re-captures the fresh Customer" was false**: the
  `.is(null)` capture guard meant a stale id was never repaired. The
  checkout fallback now clears the stale id (service-role, permitted
  through the 049 clamp) so the next webhook capture works.

Accepted-risk notes from the same review (recorded, not fixed): concurrent
same-event deliveries can still double-fire the revenue event (TOCTOU window
matching the async handler's pre-existing guard; sequential retries - the
common case - are deduped); a dispute whose intent matches no row 500s for
Stripe's ~3-day retry window then drops (same contract as the refund fix);
`APP_URL` unset on a STAGING deploy now mails production links to guests
(deliberate production-first trade); in-session 4→5→4→5 navigation re-fires
completion signals (requires real navigation, not reloads).

**Known-red by design:** the CI `migrations` job until the two Supabase
secrets exist (fork PRs will always fail it). If `pnpm audit` goes red in CI
later, that is a NEW advisory - the intended behavior, not a broken gate.

---

## ROUND 3, WAVE 3 (2026-07-25) - the fresh-eyes ledger executed

The owner directed that every item in
`docs/audits/fresh-eyes-rerun-2026-07-25.md` be worked; everything not
requiring the owner is now in code (the ledger carries the full EXECUTED
annotation at its top - read it there; this entry only records the deltas
that touch THIS document's lists):

- **Pending migrations are now 037–055.** 052 entitlement-provenance
  columns (irreversible list #1/#2) · 053 `payment_events` webhook
  idempotency (#6; wired into both settle paths - closes the accepted
  TOCTOU from run 2) · 054 bounds `exercise_attempts.submitted_code`
  (register P2) · 055 skill-genome normalization (T1-21; asymptotic curve
  replaces the clamp that pinned every finished world's axes at 100).
- **New workflows:** `deploy-api.yml` (manual deploy gated on ZERO pending
  migrations - the §7 "breaks first on deploy day" ordering is now
  mechanical, needs `FLY_API_TOKEN` as a third secret) ·
  `partitions.yml` (monthly `ensure_skill_events_partitions()` - the
  2027-04 partition cliff now has a caller).
- **Refund terms simplified in code** (T0-8): the unenforceable 20% clause
  is GONE from terms/pricing/FAQ - the Tier 1-LEGAL refund item is now
  advisor-review-only, not a code change.
- **Tier 2 closures from the ledger wave:** free-module guest email
  capture (was "no email capture anywhere in the free module") · the
  renderer XS slice (task brief no longer precedes the teaching on steps
  1-3) · solution hints render as code · health check no longer DB-gates
  liveness (`/api/health` = liveness, `/api/health/ready` = readiness;
  also removes the R2-5 count-scan) · rate limiting keyed on identity
  (closes the `cf-connecting-ip` bypass for authenticated traffic; the
  anonymous-IP path remains and the Fly origin lock is still worth doing).
- **Correction to the register:** T2-30's "7 exercises defeated by
  constant returns" was NINE, and the dominant cause was a `toBeCloseTo`
  NaN hole in BOTH grading harnesses (non-numeric actuals passed every
  closeTo-only suite). Harness fixed in the shipped runtime AND the CI
  validator, with a regression test; all 9 exercise test suites hardened;
  0/10 defeatable on re-check.

> **Owner tracking split (2026-07-25, owner decision):** the ADVISOR items
> (Tier 1-LEGAL) are handled separately by the owner and are no longer
> tracked through this session's action list. DISTRIBUTION work (blog
> batch, Product Hunt, X/Twitter, Search Console, domain warmup, Discord)
> executes under `docs/marketing-plan.md` - the reach-flavored Tier 1-OPS
> checkboxes above remain the launch-gating subset of that plan. "Buy your
> own product twice" is sequenced AFTER testing completes.

**Owner-only remainder (unchanged in nature, restated):** apply migrations
**037–055** then deploy via the new workflow; GitHub secrets
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FLY_API_TOKEN`); Stripe
dashboard (Tax setup, receipt toggle, SEPA decision) + `STRIPE_TAX_ENABLED`
flip; Kit dashboard emails (T0-2, the "highest ratio of customer-facing
words to reviewed words"); buy the product twice (T0-3); ~~real name on
/about~~ - **RESOLVED 2026-07-25 by owner decision: identity stays
private.** /about now opens with the collective origin story ("built by a
group of JavaScript engineers…", wording updated 2026-08-18 with the
audience rebrand; the identity stays collective and private); do not add a
personal name without asking;
~~manual light-mode + 375px pass~~ - **DONE 2026-07-25, owner-verified
clean** (8 core routes at phone width in light scheme; no defects
reported); Tier 1-OPS accounts; Tier 1-LEGAL
advisor items; ~~world-2 build-or-reprice decision~~ - **DECIDED
2026-07-25: world 2 is DEFERRED until world 1 is launched, distributed to
at least 200 users, and the data is collected.** Until that gate: bundles
stay `disabled` (already true in source), pricing keeps the honest
OutOfStock markup, and no world-2 authoring starts. Cost basis when the
gate opens: `docs/world-launch-checklist.md`.

---

## CI RED CLEARED (2026-08-14): links job + audit gate

Both jobs that had been red on `main` since 2026-08-12 are fixed in this
working tree (uncommitted):

- **`links` job:** lychee died parsing `.lychee.toml` before checking any
  link, so the job gave zero link coverage the whole time it was red. Root
  cause: the config set `include_fragments = true`, but the lychee version
  pinned in ci.yml (v0.24.2) takes a mode string for that key. Now
  `include_fragments = "full"`, the value the v0.24.2 example config uses.
- **Audit gate:** `pnpm audit --prod` reported 9 advisories (3 high, 5
  moderate, 1 low). This is the gate working as designed (see "Known-red by
  design" in R3 wave 2). Fixes: apps/api `hono` floor raised to `^4.12.34`
  (resolves 4.13.2; clears the CORS ReDoS, the `memo()` cross-user SSR
  disclosure, and the language-middleware DoS); override floors raised for
  `postcss@8` (^8.5.23) and `brace-expansion@5` (^5.0.9); override floors
  added for `fast-uri@3` (^3.1.5), `nanoid@3` (^3.3.18), `dompurify@3`
  (^3.4.13). All six transitive bumps are patch releases inside ranges the
  parent packages already accept.

Verified locally: `pnpm audit --prod --audit-level moderate` exits 0 with
no findings; api vitest 252/252 against hono 4.13.2; full workspace vitest
1757 passed / 88 skipped. Still open from 2026-08-12: Vercel deploys are
not gated on CI, so a green `main` does not by itself prevent the next
deploy-before-CI incident.

**Round 2, same day: the unblocked pipeline surfaced three latent
failures.** Context that reframes this whole section: none of the last 40
`ci` workflow runs ever succeeded, and the audit step sits before
typecheck/build/tests/e2e, so a red audit had been silencing the entire
battery. Found and fixed once the gates opened:

- **`next build` required runtime env.** `getSupabaseServerClient`
  (apps/web/lib/supabase/server.ts) checked the two NEXT_PUBLIC_SUPABASE
  vars before calling `cookies()`. During prerender that plain Error fires
  before the cookies() dynamic bailout, so an env-less CI box crashed the
  build on the first page using the helper (`/admin/digest` in CI, the
  lesson page locally; the page named is just whichever prerender worker
  hit the helper first). Fix: `await cookies()` first, then the env guard.
  This restores the contract assertWebEnv documents in lib/env.ts (build
  works without secrets, runtime still fails loudly). Verified both ways:
  fully env-blanked build exits 0, normal build exits 0.
- **50 broken markdown links, now visible.** The lychee job had never
  scanned anything (config was unparseable), so links rotted silently.
  Living docs fixed for real: 18 links in pre-launch-checklist.md were
  written repo-root-relative and needed `../`; digest-runbook.md linked a
  local plan file that is not in the repo (de-linked). Dated records
  (docs/audits, docs/superpowers) are excluded from scanning per the
  frozen-history policy from the rename session; links pointing TO them
  are still checked. Local lychee 0.24.2 (the CI-pinned version): 0
  errors.
- **E2E would be next to fail:** the playwright webServer is `next dev`,
  and the boot assertion requires the NEXT_PUBLIC_SUPABASE vars in every
  environment, which the env-less ci job never had. Placeholder values on
  the e2e step only (all specs run as guests; unreachable Supabase
  degrades to signed-out). Proven locally: landing + pricing specs 17/17
  against a placeholder-env server. Deliberately step-level, not
  job-level, so the build step keeps running env-less as a regression
  test for the bullet above.

Also verified locally for the steps CI has not reached in weeks: typecheck
10/10, env-blanked unit battery green, validate-exercises 88/88. The full
e2e suite on CI hardware is the one step still unproven.

**Round 3, same day: run #194 (first run with all round-2 fixes) failed on
two findings, both environment-class, both fixed:**

- **The orbit-canvas golden style hash is architecture-sensitive.** The
  five style locks (orbit + four world scenes) hashed a raw
  `JSON.stringify` of the capture. Raw float printing differs between CPU
  architectures at the last bit: the same commit produced the golden hash
  on macOS arm64 under BOTH node 20 and CI's exact node 22.23.2, and a
  different hash on CI's linux x64. Every human-readable lock in the same
  test (913 fills, 576 strokes, alpha counts, composite ops) passed on
  CI, which is what isolated the failure to float serialization. Fix:
  `styleCaptureSha` + `canonRound` in recording-canvas.ts round every
  number (including alphas embedded in `rgba(...)` strings) to 10
  significant digits before hashing; all five goldens regenerated, and
  the two full-precision `maxFillAlpha`/`maxStrokeAlpha` fields in the
  world-scenes GOLDEN table (the same latent class, passing on CI only by
  luck) are canonicalized too. Verified identical under node 20 and node
  22.23.2; the linux side is proven by the next CI run.
- **lychee, now actually scanning, flagged an auth-walled external URL.**
  `supabase.com/dashboard/project/...` answers 404 to anonymous visitors
  by design (project ids must not leak), so a logged-out CI bot can never
  validate those links. Both dashboard URLs in pre-launch-checklist.md
  are excluded as a class in .lychee.toml. Full online scan: 88 links, 0
  errors.

Battery after round 3: 1748 passed / 88 skipped, ui tsc clean, effects
suite 43/43 under both node versions.

**Round 4 (2026-08-15): the first run to reach E2E scored 125/127; the 2
failures share one root cause, now fixed.** Both failing specs are the
live DeepScanDemo (landing hero + lesson demo). The Playwright trace from
the CI artifact shows zero requests to `/models/`: the failure happens
before the model fetch. Console log in the trace: "Initialization of
backend webgl failed ... WebGL is not supported on this device". Root
cause: deep-scan-demo's canvas probe requested WebGL with no context
attributes, so CI's software GL (SwiftShader) answered yes; tfjs then
requests its context with `failIfMajorPerformanceCaveat`, which rejects
software GL, so the webgl backend never initialized and the demo showed
"model failed to load". Machines with bare WebGL but not tfjs-grade
WebGL were the probe's blind spot. Fix in deep-scan-demo.tsx: the probe
now passes the same `failIfMajorPerformanceCaveat` attribute tfjs uses
(software-GL machines take the instant cpu path, as the probe always
intended), plus a cpu fallback when `setBackend("webgl")` resolves false
so probe/tfjs disagreement can never strand the demo on the error state.
Verified: component unit test green, web tsc clean, both failing specs
12/12 locally (real GPU exercises the unchanged webgl path). Also proven
by this run: the linux golden hashes from round 3 passed, and the
placeholder-env e2e server worked (125 specs ran against it).

## VERCEL BUILD FAILURE (2026-08-14): lockfile not honored at install

The 22:50 Vercel build failed on a type error in
`apps/web/app/admin/digest/actions.ts` that does not reproduce locally.
The error names `RejectExcessProperties`, a type helper that exists in
recent `@supabase/postgrest-js` releases but not in 2.98.0, the version
`pnpm-lock.yaml` pins. Vercel therefore resolved a newer supabase-js
through the `^2.98.0` range at install time instead of installing what the
lockfile pins. The newer client rejects `.update()` payloads typed
`Record<string, unknown>` because their index signature defeats its
excess-property check.

Fixed in code (uncommitted): the digest action's update payload is now
typed `Database["public"]["Tables"]["news_items"]["Update"]`, which
compiles under both 2.98.0 and 2.112.3 (verified against each). A sweep of
every `.update()`/`.insert()`/`.upsert()` call in apps/web and
packages/supabase found no other widened payload; all other call sites
pass inline literals.

- [ ] **Operator: make Vercel installs honor the lockfile.** Set the
  project's install command to `pnpm install --frozen-lockfile` in the
  Vercel dashboard (Settings, Build and Development Settings). Until then
  every deploy re-resolves caret ranges and can compile against
  dependencies CI never tested. This is the same reproducibility gap as
  the deploys-not-gated-on-CI item above, at the install step instead of
  the trigger.

---

## Tier 1 - STATUS: ALL SIX FIXED IN CODE (2026-07-21)

Typecheck 11/11, 1367 unit tests passing. (Re-verified 2026-07-25 at HEAD
`24d45e4`: typecheck 10/10 - task count changed, all green - vitest 1553
passed; all six fixes hold, see R3.)

**BLOCKING STEPS AS OF 2026-07-25 (order matters):**

1. ~~Fix `apps/api/Dockerfile:10` (R3-1)~~ - **FIXED in code 2026-07-25**
   (COPY line removed; base image also bumped `node:20-alpine` →
   `node:22-alpine`, Node 20 being EOL since 2026-04 - scanner CVE count
   24 → 5; CI workflows bumped to node 22 to match).
2. Apply migrations **037–051** to production Supabase (039 keeps item 1
   below live until applied; **047 must precede the next API deploy or every
   purchase 500s post-charge**, R3-2; 049 = stripe_customer_id clamp, 050 =
   waitlist consent default, 051 = dispute-won restoration - the new
   `charge.dispute.closed` handler 500-retries until 051 exists; all three
   added 2026-07-25).
3. Then deploy the API.

Details of each item, retained as the record of what was wrong and why.

### 1. SECURITY: world-callable `SECURITY DEFINER` functions

Migration `036` documents this exact vulnerability class in its own header, then fixes exactly one function - it is the only `revoke` in the entire schema. Postgres grants `EXECUTE` to `PUBLIC` by default, so PostgREST exposes these at `/rest/v1/rpc/<name>` to `anon`:

- `refresh_dashboard_stats()` (`012_scalability_indexes.sql:48`) - no arguments, no guard, forces `REFRESH MATERIALIZED VIEW CONCURRENTLY` over all of `world_progress`. One HTTP POST in a loop pegs the database. **Trivial denial of service.**
- `compute_user_skill_genome(p_user_id uuid, p_world_id text)` (`014_skill_genome_computation.sql:6`) - accepts an **arbitrary user id** with no `auth.uid()` check, ~19 scans per call.
- `ensure_skill_events_partitions()` (`013:84`) - executes DDL.

The Hono rate limiter does not protect this. PostgREST is a separate public endpoint reached with the anon key that ships in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Fix:** new migration revoking `EXECUTE` from `public, anon, authenticated` on each, granting to `service_role` where a server caller exists. Follow the pattern in `036`.

### 2. Total-outage single point of failure

`apps/web/middleware.ts` calls `auth.getUser()` (a network call to GoTrue) with **no try/catch and no timeout**, and its matcher excludes only `_next/*` - everything in `public/` still triggers it. If Supabase Auth is slow or down, **every request 500s, including the static landing page**.

**Fix:** wrap in try/catch, fail open to an unauthenticated render; tighten the matcher to skip `public/` assets.

### 3. Paying customers get shown the paywall

`apps/web/lib/progress.ts:55-69` destructures only `{ data }` and returns `!!data`. Any transient error - network blip, RLS hiccup, PostgREST 5xx - is indistinguishable from "never purchased", so `worlds/[slug]/page.tsx:61` renders the world **locked for someone who paid**. No error state, no retry, no way for them to tell. Same discard at `dashboard/page.tsx:50-56`.

Direct refund and support driver, and the worst possible first impression for a new customer.

**Fix:** surface the error distinctly from "not purchased"; render a retry state rather than a paywall.

### 4. Checkout can hang forever, and can double-charge

- **No timeout:** `checkout-button.tsx` uses raw `fetch` instead of the project's own `apiFetch` (`lib/api-fetch.ts:16`), which exists for this and provides a 10s `AbortController` plus a timeout toast. If the API stalls, the button sits on "Redirecting…" forever and no error ever renders.
- **Double-charge window:** it sets `window.location.href` and then immediately `setLoading(false)`, re-enabling the button while the browser is still navigating to Stripe. A second click creates a second Checkout Session.

**Fix:** switch to `apiFetch`; do not clear loading state on the success path.

### 5. No signup instrumentation

Verified absent from `lib/analytics-events.ts`: no `signup_started`, `signup_completed`, `magic_link_sent`, or `oauth_started`. `auth-form.tsx` imports no analytics at all.

This is a launch blocker **specifically because the next phase is distribution**. Spending on acquisition without measuring the signup step means the top of the funnel is unobservable exactly when it matters most.

**Fix:** add the events and wire them in `auth-form.tsx`.

### 6. Guest progress notice is false

`worlds/[slug]/[module]/[lesson]/page.tsx:293` tells learners "your progress is not saved." It **is** saved - `lib/guest-progress.ts` persists it and `components/guest-progress-bridge.tsx:20-69` replays it into `world_progress` after signup. `GuestModuleBanner` even says the opposite. The false message is the more prominent of the two, and it discourages starting.

**Fix:** correct the copy to match actual behaviour.

---

## Tier 1 - ALREADY FIXED 2026-07-21

Recorded so they are not re-litigated.

- **Analytics was dark for every first session.** Consent was read once in a mount-only effect; a first-time visitor had no consent key, so it returned early and never re-ran - accepting the banner only wrote localStorage. The entire first session (land → read → hit paywall → decide) emitted **zero events**. Fixed via `lib/consent.ts`; 7 regression tests.
- **Pageviews were double-counted** - two providers both capturing `$pageview`; every conversion denominator was 2× too large. Duplicate deleted.
- **`paywall_hit` never fired since launch** - its only call site was in a component the route stopped rendering. Now fires from `<PaywallNotice>`.
- **Stripe abandoned-cart recovery was off**; **no intent tags existed**; **FAQ was absent from `/pricing`**; **refund badge sat below the grid**; **no audience qualifier**; **no direct buy path from the final landing CTA**. All fixed.
- **Guest checkout was written, then disabled the same day** after review found three post-charge defects. Not on the launch path.

**Consequence for your data:** historical funnel numbers are unreliable, not merely sparse - computed against a doubled denominator, with first-session behaviour never recorded. Baseline from release day forward.

---

## Tier 1-OPS - Operator + distribution setup, do before flipping live

Moved from `docs/post-launch-backlog.md` 2026-07-22. Not code defects:
measurement, email, and reach infrastructure whose value is multiplied by
launch traffic. Launch-day data is unrepeatable, and historical funnel data
has already been written off once (see above) - do not launch dark again.

- [x] **Migration 060 APPLIED to production 2026-08-23, and the waitlist
  bug is fixed at the database level.** Verified directly, not assumed:
  `chk_waitlist_source` now reads
  `length(source) between 1 and 64 and source ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`
  and `chk_waitlist_world_id` now includes `'all'`. Ledger reads 60/60 and
  `pnpm migrate:status` exits 0, so the `deploy-api.yml` zero-pending gate is
  clear again.
  **What this means in practice:** every capture surface on the site can now
  write a row. The pre-apply state was captured first and confirmed the
  diagnosis exactly, so this was a real defect and not a theoretical one.
  **What it fixes is a live bug, not new-feature scaffolding.** 009 declared
  `chk_waitlist_source` as an enum allowing only
  ('landing','pricing','blog','referral','social'). Every capture surface
  built since passes something else: `world-selection` (newsletter modal),
  `free-module-end` (guest email capture), `coming-soon-hero` and
  `coming-soon-footer` (the coming-soon pages). The newsletter modal also
  passes `world_id` "all", which 041's CHECK rejects too. `submitWaitlist`
  returns "error" instead of throwing, by design, so every one of those
  submissions has been failing silently behind a generic error message, with
  nothing logged and nothing alerting.
  **Why this is launch-gating:** the coming-soon pages are the ONLY waitlist
  entry point for four of the five worlds, and the launch plan depends on
  mailing that list. Production currently holds ONE waitlist row, from
  2026-03-27, source `landing`, which is the only source the constraint ever
  allowed. Traffic has been near zero so the absence of rows is not proof on
  its own, but the constraint analysis is deterministic and 009/041 are both
  in the applied ledger with no later migration dropping either.
  060 replaces the enum with a shape check (lowercase kebab-case, 64 chars),
  the same call 041 deliberately made for email, so a new capture surface
  never again needs a migration to work.
- [x] **Migration ledger verified IN SYNC at 59/59 for 001-059.** Closed
  2026-08-20 by running the check instead of reasoning about it.
  Superseded in part 2026-08-23 by the 060 entry above: the ledger was
  genuinely in sync when checked, and a new migration has been added since. `node
  scripts/migration-status.mjs` reported `files on disk : 59`,
  `applied (ledger): 59`, "IN SYNC, every file is applied, no orphan ledger
  rows", exit 0. **Nothing is pending**, so 058 and 059 are both live in
  production and the zero-pending gate in `deploy-api.yml` passes.
  **The premise that this needed an operator was wrong:** `apps/api/.env`
  carries both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, so the ledger
  is checkable from a normal checkout. Anyone re-verifying can run
  `set -a; eval "$(grep -E '^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' apps/api/.env)"; set +a; pnpm migrate:status`.
  Original text retained as the record of why the target moved:
  Reconciled 2026-08-20: this entry used to say
  "apply 058, ledger will read 58/58". That target is now stale. The repo
  has **59** migrations on disk (001..059); `059_rename_fe_identifiers_to_js`
  landed with the 2026-08-18 JavaScript rebrand and carries the same
  apply-before-you-deploy ordering rule 058 does, and the app code at HEAD
  already reads BOTH renames (`world_progress`/`p_world_id` in
  `apps/web/lib/progress.ts` and `apps/api/src/routes/profiles.ts`;
  `js_background`/`js_integration` in `apps/api/src/routes/onboarding.ts`
  and `apps/web/app/onboarding/page.tsx`). A pre-058 or pre-059 database
  therefore errors at runtime.
  **How to check:** `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… pnpm
  migrate:status`, expect IN SYNC 59/59. Without credentials the script
  exits 0 in OFFLINE mode and tells you nothing, which is why this cannot
  be closed from a checkout.
  Repo side is ready and already gated: `.github/workflows/ci.yml:186` and
  `.github/workflows/deploy-api.yml:48` both run `migrate:status`, and type
  parity is done (`packages/supabase/src/types.ts` defines `world_progress`
  and contains zero `theme` identifiers).
- [ ] (OPERATOR) **Verify the 059 rename end to end with a signed-in
  session.** Migration 059 was applied 2026-08-20 and the API redeployed
  (Fly v18) the same day, but the two behaviors it touched have only been
  checked at the infrastructure layer (ledger IN SYNC 59/59,
  `/api/health/ready` reports `db: ok`, CI green). Neither has been
  exercised as a user, because both need an authenticated session:
  (1) complete an onboarding and confirm the JavaScript-background and
  years-of-experience answers persist, which is what the deployed-old-API
  window was silently discarding; (2) download a GDPR export from settings
  and confirm it returns `js_background` and `js_experience_years`, the
  endpoint that would have 500'd between the migration and the API deploy.
  Also worth one query while signed into Supabase: profiles with
  `onboarding_completed = true` and a null `js_background` created between
  2026-08-18 and 2026-08-20 are learners whose answers the old API dropped.
  Expected to be zero or near-zero at current traffic.
- [ ] (OPERATOR) **PostHog:** create the EU project, set
  `NEXT_PUBLIC_POSTHOG_KEY` (web `.env.local` + Vercel), then walk the
  event checklist in `docs/analytics-verification.md`. Free tier = 1M
  events/month.
  Repo side is wired and fails soft: `apps/web/lib/posthog.ts:25` only
  initializes when the key is present, and `apps/web/lib/env.ts:38` warns
  "product analytics OFF" when it is not.
  Stale count corrected 2026-08-20: this entry said "the 10 events".
  `docs/analytics-verification.md` documents 20, and
  `apps/web/lib/analytics-events.ts` defines about 25.
- [ ] (OPERATOR) **Success-metrics dashboard + alerts** in PostHog: lesson completion
  (target ≥60%), paid conversion (3%), NPS (≥40), 7-day retention (≥30%),
  30-day retention (≥15%), avg time per lesson, hint dependency, paywall
  conversion. At minimum, payment-failure alerting live before real money
  flows.
- [ ] (OPERATOR) **Kit (ConvertKit) lifecycle setup.** Code side is complete
  and verified 2026-08-20: the client (`apps/api/src/lib/kit.ts`), every tag
  lookup (`apps/api/src/routes/email-tags.ts:8-19`,
  `preferences.ts:98,109`, `payments.ts:873,1196`), the fail-closed bounce
  webhook (`webhooks.ts:50-54`, rejects everything while
  `KIT_WEBHOOK_SECRET` is unset, and that var is in the API's `PROD_REQUIRED`
  list so production refuses to boot without it), and all names documented in
  `apps/api/.env.example:47-72`. Everything below is dashboard and secret
  work. Manually create the Form + the
  seven lifecycle Tags in the Kit dashboard (`signed_up`, `onboarded`,
  `first_lesson`, `capstone`, `purchased`, `email_alerts`, `weekly_digest`),
  then set `KIT_FORM_ID` + `KIT_TAG_SIGNED_UP` / `KIT_TAG_ONBOARDED` /
  `KIT_TAG_FIRST_LESSON` / `KIT_TAG_CAPSTONE` / `KIT_TAG_PURCHASED` /
  `KIT_TAG_EMAIL_ALERTS` / `KIT_TAG_WEEKLY_DIGEST` env vars (numeric tag
  IDs). **API keys are NOT usable, see the entry directly below.** Also set `KIT_WEBHOOK_SECRET` and
  register the bounce webhook per `docs/email-setup.md` §3, plus
  `KIT_TAG_PAYWALL_HIT` / `KIT_TAG_MODULE_1_COMPLETE` (R2-7 made
  missing-tag skips recoverable, but sequences cannot fire on tags that do
  not exist). Purchase is a single world-agnostic tag in V1 (per-world
  sequences: `post-launch-backlog.md` §5). Without this, purchases succeed
  but subscribers are never tagged and no lifecycle email fires - including
  the purchase receipt flagged in R2-4. Templates must follow
  `docs/email-templates.md`.
- [ ] (OPERATOR) **Kit credentials fail auth, and the client may target a
  retired API base. BLOCKS both Kit entries above.** Found 2026-08-20 by
  probing the live API with the stored credentials, not by reading config.
  Three findings, each verified:
  1. **Both stored keys 401.** `KIT_API_KEY` and `KIT_API_SECRET` from
     `apps/api/.env` were tried against Kit v4
     (`GET https://api.kit.com/v4/tags`, header `X-Kit-Api-Key`): both
     return `401 {"errors":["The API key is invalid"]}`. The v3 secret
     endpoint (`GET /v3/account?api_secret=...`) returns
     `401 {"error":"Authorization Failed"}`.
  2. **The client points at a base URL that now redirects.**
     `apps/api/src/lib/kit.ts:6` hardcodes
     `https://api.convertkit.com/v3`. `GET /v3/tags?api_key=...` answers
     `302`. ConvertKit rebranded to Kit and moved to `api.kit.com/v4`, so
     the version question has to be settled, not just the credential.
  3. **No tag IDs exist in production.** `flyctl secrets list -a
     tensorcraft-api` shows exactly one Kit variable deployed,
     `KIT_WEBHOOK_SECRET`. None of the nine `KIT_TAG_*` vars the code reads
     are set on the host.
  Combined effect, and why this is a launch blocker rather than a chore:
  `/api/email` answers `{ ok: true, skipped: true }` when a tag var is
  unset (R2-7), so every lifecycle tag call has been succeeding loudly and
  doing nothing. The failure is invisible from logs, dashboards, and the
  app. Purchases, onboarding, first lesson and capstone all currently tag
  nobody.
  Order of work: regenerate a key in the Kit dashboard; decide v3 versus a
  port to v4 (`kit.ts` is the only caller); set the key plus the nine
  `KIT_TAG_*` IDs as Fly secrets; then re-verify with a real tag call
  before trusting either entry above. Do NOT mark those done on dashboard
  state alone: this entry existed as "API keys already configured" and was
  wrong.
- [ ] (OPERATOR) **Kit retention automations** A/B/C per
  `docs/email-retention-sequences.md`. Copy drafted, code side live;
  dashboard work only. The sequences target exactly the launch cohort
  (signed up / stalled / finished free tier). Blocked by the credential
  entry above: an automation cannot fire on a tag that is never applied.
- [ ] (OPERATOR) **Sentry alerting.** Capture is real and verified in both
  apps (`apps/api/src/lib/sentry.ts` + `middleware/sentry.ts`; web's three
  `sentry.*.config.ts` loaded via `instrumentation.ts:14-18`), but alert
  rules have no repo representation at all. Create the three rules specified
  at `pre-launch-checklist.md` §B10 in each Sentry project.
- [ ] (OPERATOR) **Plausible:** add site `tensorcraft.app`, set
  `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` in Vercel. ~EUR 9/mo. The script component
  (`apps/web/app/components/plausible-script.tsx:8`) is already conditional
  on the var. Note `apps/web/.env.example:26` carries a template default,
  which is NOT evidence the Vercel env is set.
- [x] **Google Search Console: verified.** Closed 2026-08-20. A real
  performance baseline was pulled on 2026-08-17 (3 months: 6 clicks, 549
  impressions, average position 51), which is impossible without a verified
  property. Verification used a method that leaves no repo artifact: there
  is no `verification.google` key in `apps/web/app/layout.tsx` metadata.
  Remaining GSC work (resubmit the sitemap, request indexing) is ordinary
  SEO operations, tracked in `docs/post-launch-backlog.md`, not a launch
  blocker.
- [ ] (OPERATOR) **Product Hunt "upcoming" page** - follower capture only works
  pre-launch.
- [ ] (OPERATOR) **Twitter/X account @tensorcraft** - create now (posting cadence can
  wait). Launch execution (`dev-plan.md` §10b) announces on Twitter/X, so
  the account must predate launch; also removes handle-squatting risk. The
  old "DEFERRED to V1.0" note contradicted §10b and is resolved in favor of
  pre-launch (2026-07-22).
- [x] **FAQPage JSON-LD on `/pricing`** - **DONE 2026-07-25**: FaqSection
  now emits the FAQPage markup itself, so `/` and `/pricing` both carry it,
  and the sitewide copy was removed from the root layout (wrong-page
  markup, same class as the Course dedup).
- [ ] **Distribution head start:** write + publish the first blog batch and
  begin the audience track. `roadmap.md` §7: longest lead time in the plan,
  runs in parallel, starts before the code is ready.
  Verified 2026-08-20: infrastructure is DONE and content is ZERO.
  `packages/content/content/blog/` holds only `.gitkeep`, while the whole
  render path is built and waiting (`apps/web/app/blog/page.tsx` branches on
  `posts.length === 0`, `blog/[slug]/page.tsx` and `blog/rss.xml/route.ts`
  both exist). This is a writing task, not an engineering one.
- [x] **Ledger, secrets and health all re-confirmed.** Closed 2026-08-20.
  Every claim this entry makes except the 046 auth hook now has direct
  evidence. The 037-055 batch is covered by the verified IN SYNC 59/59 at
  the top of this tier. `gh secret list` shows `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` (both 2026-07-25) alongside `FLY_API_TOKEN`,
  so the fail-closed `migrations` CI job has what it needs. Both health
  endpoints answer live: `/api/health` returns static ok, and
  `/api/health/ready` returns `checks.db: ok`, which independently proves
  the deployed API can reach the database.
  The 046 hook is split into its own entry below, being the one claim here
  that only a dashboard can settle. Original text follows.
  **Apply the pending migrations - claimed DONE 2026-07-25 (ops-deploy session):** 037-055 applied to production in order; `pnpm migrate:status` = IN SYNC 55/55; GitHub secrets set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FLY_API_TOKEN); `deploy-api.yml` ran green; `/api/health` + `/api/health/ready` both 200. ~~Remaining sub-step: enable the 046 Custom Access Token hook in the Supabase Auth dashboard (middleware falls back safely meanwhile).~~ 046 hook ENABLED in the Supabase dashboard 2026-07-25 (ops-deploy session); ledger now IN SYNC **57/57** after 056/057 (entries below). Original text retained below for the record.
- [ ] (OPERATOR) **Settle whether the 046 Custom Access Token hook is
  enabled.** Split out 2026-08-20 from the entry above, which is where the
  contradiction lives: that entry says the hook was enabled in the Supabase
  dashboard on 2026-07-25, while the struck entry further down still lists
  enabling it as an open step. Neither the repo nor the database can settle
  it, because it is Supabase Auth configuration rather than schema, and it
  is the only sub-claim in the ops-deploy entry left unproven. Check
  Authentication, Hooks in the Supabase dashboard, then correct whichever
  entry is wrong. Consequence if it is off: middleware falls back safely,
  so this is a correctness-of-record question, not an outage risk.
- [x] **Migration 056 is applied.** Closed 2026-08-20 by the verified
  ledger: 56 appears in `schema_migrations`, and the run reported no
  pending files and no orphan rows, so the migration executed against
  production. That matters because the account-deletion endpoint is live
  (`apps/api/src/routes/profiles.ts:351`) and its own comment says 056 MUST
  ship first, otherwise every deletion erases VAT records the law requires
  you to keep.
  **Upgraded from ledger-inference to direct proof 2026-08-23:** a
  `pg_constraint` query over `DATABASE_URL` returns
  `purchases_user_id_fkey` with `confdeltype = 'n'`, which is SET NULL. So
  the FK rule is confirmed in the live database, not merely inferred from
  the migration having run, and the account-deletion endpoint is safe to
  ship: erasing an account unlinks its purchases instead of deleting the VAT
  records the law requires you to keep. Original text follows.
  **Apply migration 056 - claimed DONE 2026-07-25:** applied to production via
  the same Node `pg` procedure as 037-055; pre/post state verified in
  `pg_constraint` (delete rule CASCADE → SET NULL, `user_id` now nullable,
  still references `profiles`); `pnpm migrate:status` = IN SYNC 56/56, so
  the deploy-api.yml gate passes again. The deletion endpoint is now safe
  to deploy. Original text: purchases FK → ON DELETE SET NULL so tax
  records survive account deletion - with the old cascade, deleting an
  account erases VAT records the law requires you to keep.
- [ ] ~~**Apply the pending migrations in order - BEFORE the next API deploy.**~~
  The `schema_migrations` ledger now EXISTS (migration 042 built it +
  backfilled 001–041), so this is no longer "establish a ledger" - run
  `pnpm migrate:status`, then apply each PENDING file in numeric order via the
  runbook. Pending as of 2026-07-25: **037–051** (049 clamps
  stripe_customer_id, R3-5; 050 flips the waitlist consent default,
  Tier 1-LEGAL; 051 adds the dispute-won restoration RPC + 038 escape
  hatch, run-2 F2). ~~None of 045–048 is
  launch-blocking on its own~~ - **superseded by R3-2: 047 must be applied
  before the current `payments.ts` ships or every purchase 500s post-charge.**
  046 additionally carries its own operator step (enable the Custom Access
  Token hook in the Supabase dashboard; middleware falls back safely while it
  is off). ~~Wire `pnpm migrate:status` into CI~~ - CI job added 2026-07-25;
  needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as GitHub Actions
  secrets or it stays red (fail-closed by design, R3-9).
- [ ] (OPERATOR) **Move Vercel off the Hobby plan.** Hobby prohibits
  commercial use; selling a $59-159 product on it is a ToS/takedown risk
  before it is a cost one (R2-5). Still recorded as Hobby in the repo at
  `docs/infrastructure.md:45` and in the cost table at `:202`; the
  authoritative source is the Vercel billing dashboard. After upgrading,
  update both lines.
- [ ] (OPERATOR) **Make Vercel installs honor the lockfile.** Moved here
  2026-08-20 from the "VERCEL BUILD FAILURE (2026-08-14)" section, where it
  was the only live item under a heading that reads as resolved. Set the
  install command to `pnpm install --frozen-lockfile`; until then every
  deploy re-resolves caret ranges and can compile against dependencies CI
  never tested, which is exactly what broke the 2026-08-14 build. The code
  half is done (`apps/web/app/admin/digest/actions.ts` types its update
  payload as `NewsItemUpdate`, which compiles under both supabase-js
  versions).
  Worth considering instead: there is no `vercel.json` in the repo, so this
  setting lives only in the dashboard and can drift silently. Committing a
  `vercel.json` with `installCommand` would put it under version control.
  Not done here because a wrong value breaks every deploy; owner call.
- [~] **Gate Vercel deploys on CI. Code side DONE 2026-08-20; one operator
  step remains.** Moved here 2026-08-20 from the "CI RED CLEARED
  (2026-08-14)" section, where it was one prose sentence under a heading
  that reads as fully resolved. A green `main` does not by itself prevent
  the next deploy-before-CI incident, which is the same class of failure as
  the 2026-08-12 outage where the web app auto-deployed before its
  migration was applied. **It recurred on 2026-08-18**: migration 059
  shipped with the code that needed it, CI went red on the drift check and
  stayed red, and Vercel deployed anyway, so production ran new code on an
  old schema for two days.
  - [x] `vercel.json` added at the repo root with an `ignoreCommand` that
    runs `scripts/migration-status.mjs` and SKIPS the deploy when the
    ledger is behind. Exit-code mapping and the reasoning are documented in
    `docs/migration-runbook.md` ("Deploy gating"). Note the inversion: for
    an `ignoreCommand`, exit 0 means skip and non-zero means build. Drift
    (status exit 1) skips; in-sync (0) and cred/connection failure (2) both
    build, so a missing env var cannot brick every deploy including the one
    that fixes it. CI stays the fail-closed gate.
  - [x] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present in the
    Vercel project env: both Sensitive, scoped to Production and Preview,
    added 2026-05-03. Confirmed 2026-08-23 from the Environment Variables
    page. The gate has the credentials it needs.
  - [x] Root Directory question settled: it is `apps/web`, NOT the repo
    root. Vercel reads the repo-root `vercel.json` but runs the
    `ignoreCommand` with cwd `apps/web`, so the path is
    `../../scripts/migration-status.mjs` and the file stays at the root.
    Both facts are now pinned by
    `packages/content/__tests__/vercel-ignore-command.test.ts`. When
    testing this gate by hand, `cd apps/web` first: run from the repo root
    and the script path fails to resolve, node exits 1, the wrapper reads
    that as drift, and it looks like the gate cancels every deploy. That
    false alarm is easy to hit.
  - [x] Gate output is no longer piped to `/dev/null` (2026-08-23), so the
    migration-status verdict appears in the build log. Without it the gate
    was unverifiable and undebuggable from Vercel's side. The script prints
    counts and version numbers only, never secrets.
  - [ ] (OPERATOR) **Confirm the gate is actually live by reading one build
    log.** This is the last unverified assumption in the whole mechanism:
    whether Vercel's Ignored Build Step receives project environment
    variables at all. Open the next deployment's log and look for the
    `Migration status` summary. If it shows `files on disk : NN` and
    `applied (ledger): NN`, the gate is real. If it instead prints the
    offline "Set the env vars to diff against the live ledger" message, the
    vars are not reaching that step and the gate is decorative, passing
    every deploy regardless of schema state.
- [ ] (OPERATOR) **Env-var hygiene: three settings remain, all outside the
  repo.** Verified 2026-08-20: every code and doc sub-item below is genuinely
  done (`apps/api/src/env.ts` three tiers boot-called at `index.ts:123`;
  `apps/web/lib/env.ts` mirrored through `instrumentation.ts`, unit-tested).
  What is left: (1) `SENTRY_AUTH_TOKEN` in Vercel, absent means minified
  production stack traces; (2) `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
  in the Vercel **production** environment, which is a hard launch gate now
  that the boot assertion refuses to start production without them; (3)
  `APP_URL` on Fly. Historical detail follows.
  (audit §4; doc side CLOSED 2026-07-25 - remaining
  work is the startup assertion + operator settings): ~~document
  `STRIPE_TAX_ENABLED`~~ (now in `.env.example` + deployment-guide, with
  prerequisites); ~~remove dead GitHub App vars~~ (gone from `.env.example`,
  deployment-guide, pre-launch-checklist); ~~fix Upstash docs~~ (all three
  docs now state the silent-degradation truth); ~~CERT_SIGNING_SECRET in
  deployment-guide~~ (added); ~~CORS_ALLOWED_ORIGINS straggler~~ (fixed);
  ~~KIT_TAG_PAYWALL_HIT / MODULE_1_COMPLETE in .env.example~~ (added);
  ~~rate-limit 60-vs-120 doc split~~ (all docs now say 60, the code truth).
  ~~STILL OPEN: add a startup env assertion (`env.ts`/zod)~~ **Code side
  DONE 2026-08-11:** API had `apps/api/src/env.ts` since the R3 wave
  (three tiers, boot-called, deploy-preflight diffs its exported lists);
  web now mirrors it in `apps/web/lib/env.ts` wired through
  `instrumentation.ts` (nodejs runtime, skips the build phase, keys the
  prod tier off `VERCEL_ENV` so previews stay bootable; unit-tested).
  REMAINING (operator): set `SENTRY_AUTH_TOKEN` (absent → production stack
  traces minified), `SUPABASE_URL` + service key on **Vercel** (RFC 8058
  one-click unsubscribe throws unset - Gmail/Yahoo bulk rules; the boot
  assertion now refuses to start production without them), and `APP_URL`
  on Fly (guest email falls back to the production domain rather than a
  broken link, but the explicit var is still correct).
- [ ] (OPERATOR) **Upstash plan check.** This entry's arithmetic is stale:
  it assumed 5-6 Redis commands per API request. The 2026-08-17 limiter
  rewrite cut that to 2 commands per request (fixed window via
  `@upstash/ratelimit`, blocked subjects served from an ephemeral cache),
  and `/api/health` is now exempt from the limiter entirely, which was the
  probe traffic that consumed most of the quota. Free tier headroom is
  therefore roughly 250k requests/month, not 1,700/day, and the owner has
  deferred payment until traffic justifies it. Re-check the console before
  a launch spike rather than treating this as a hard blocker.
  Code fails closed in production: `apps/api/src/env.ts:42-43` puts both
  Upstash vars in `PROD_REQUIRED`.
- [ ] (OPERATOR) **Email domain warmup + Postmaster.** Doc conflict found
  2026-08-20 and still unresolved: this entry says register Postmaster
  Tools pre-launch, while `docs/email-setup.md:153` defers it ("worth doing
  post-V1 once volume > 5k/day"). Pick one and make both docs agree. No
  warmup schedule exists anywhere in the repo. DNS auth is in place with
  DMARC at `p=none` (`docs/dns-records.md:31`).
  §10b plans a launch-week blast
  to 500 waitlist users from a domain that has never bulk-sent - cold
  domain + burst = spam folder at the worst moment. Ramp sends gradually
  over the preceding weeks; register Google Postmaster Tools (added
  2026-07-22).
- [ ] **Create the community space.** Verified 2026-08-20: the repo half is
  definitively not done. There is no Discord reference anywhere in
  `apps/web`, and the footer that is supposed to carry the invite has only
  four links (`apps/web/app/components/site-footer.tsx:30,33,36,39`).
  Creating the server is operator work; adding the link and updating the
  footer snapshot is repo work. The ops cadence
  (`post-launch-backlog.md` §2) says "respond to community Discord
  questions" but no task ever created a Discord - server, channels,
  rules, invite link in the app footer (added 2026-07-22).
- [ ] (OPERATOR) **Cloud-cost alerts.** Configure billing/usage alerts on Vercel
  (bandwidth), Supabase (egress/compute), Fly, PostHog (1M-event
  overage), Upstash. One viral spike currently produces a surprise bill
  with zero warning (added 2026-07-22).
- [x] **Migration + runbook safety: closed, and the 019 sub-item was
  MISFRAMED.** Closed 2026-08-20. 057 is applied (verified ledger, 59/59),
  and the runbook/refund concern is genuinely superseded by 051's
  `restore_purchase_after_dispute`.
  **Read this before acting on the previous wording, which was dangerous.**
  It said to check `pg_proc` and "drop it with the correct signature if
  present". Do not. `public.get_shared_certificate(uuid)` is live **by
  design**: migration 019 creates it and grants execute to `anon` on
  purpose (`019_certificates.sql:99`), migration 039 lists it as a reviewed
  SECURITY DEFINER RPC, `CONVENTIONS.md:85` documents it as the canonical
  cross-user read pattern, and it is the read path behind
  `GET /api/certificates/:id` (`apps/api/src/routes/certificates.ts:225`)
  and the public `/certificates/[id]` share pages. Dropping it would break
  the most-shared surface in the product. 019 is applied and intended to
  stay applied, so a function it created being present is correct, not a
  finding.
  **The real defect was one line of rollback SQL, and it is now FIXED:**
  `docs/pre-launch-checklist.md:671` said
  `drop function if exists public.get_shared_certificate(text) cascade;`.
  No such overload exists, so `if exists` made it a silent no-op and a
  genuine 019 rollback would have left the function behind pointing at a
  table the next line drops. Corrected to `(uuid)`. This was only ever a
  rollback-path bug, never a live exposure, which is why no later migration
  "fixes" it and why there was nothing to find in `pg_proc`.
  Original text follows.
  **Migration + runbook safety** - claimed closed 2026-07-25: `skill_events_old`
  VERIFIED still existing in production with ZERO rows (PostgREST probe);
  **migration 057** drops it - APPLIED to production 2026-07-26 (table
  re-verified 0 rows immediately before drop; ledger IN SYNC 57/57;
  deploy gate green). The 019 rollback-signature and
  runbook-vs-038 items were superseded earlier: the ledger (042) replaced
  the rollback-SQL page as the source of truth, and migration 051's
  `restore_purchase_after_dispute` is the sanctioned repair path the old
  runbook SQL lacked. Original text below for the record.

> Historical, superseded by the entry above (2026-08-20): ~~**Migration +
> runbook safety** (do with the ledger reconcile):~~
> verify `skill_events_old` was actually dropped (013's DROP is commented
> out - production may carry a full duplicate); fix the 019 rollback
> signature mismatch (`(text)` vs `(p_id uuid)` - it silently succeeds
> leaving the anon-callable function live); reconcile the incident
> runbook's refund-window SQL with migration 038's terminal-status
> trigger, which silently ignores the corrective update.

- [ ] (OPERATOR) **Verify backups + run one restore drill.** Re-verified
  2026-08-20 and the gap is exactly as described: `docs/infrastructure.md`
  contains zero hits for backup, PITR, or restore across all 254 lines, so
  the file this entry says to write the result into still has no such
  section. The only backup prose in the repo is generic advice at
  `docs/deployment-guide.md:167`, which assumes a Supabase Pro plan while
  `docs/infrastructure.md:45` records the web tier as Hobby; the Supabase
  tier is stated nowhere.
  Confirm the plan includes daily backups and note the PITR window, restore
  into a scratch project once, then write the tier, retention window, drill
  date and result into `docs/infrastructure.md`.

## Tier 1-LEGAL - advisor + compliance actions before selling in the EU/UK

Action list for the R2-4 findings (R2-4 stays as the findings record;
flagging exposure, not legal advice).

> **DECISION (owner, 2026-08-23): the entity will be a US LLC. Formation
> is deferred, so the decision is made but the entity does not exist yet.**
> That answers the question this tier funnelled through, and it changes the
> tax math rather than merely filling in a blank. Still flagging exposure,
> not giving legal advice: an advisor should confirm all of the below.
>
> **What US establishment settles.** The seller is established OUTSIDE the
> EU and outside the UK, which removes the threshold cushion the entries
> below were written assuming might exist:
>
> - The **EUR 10,000 threshold does not apply**. It is available only to
>   EU-established sellers. For a US seller, EU VAT on digital services is
>   due at the buyer's rate from the **first** B2C sale.
> - The registration route is the **non-Union OSS scheme**, not Union OSS.
> - **The UK is separate and also has no threshold** for non-UK-established
>   sellers. UK VAT is due from the first consumer sale. Two registrations,
>   not one.
> - **GDPR Art. 27 (EU representative) and UK GDPR Art. 27 (UK
>   representative) become live requirements**, not open questions, unless
>   the narrow Art. 27(2) exemption applies. Selling accounts that store
>   progress over time reads as regular rather than occasional processing,
>   so do not assume the exemption. Both are paid appointments.
> - US side: state economic nexus, home state first, the rest on crossing
>   thresholds. This is what Stripe Tax is good at.
>
> **What formation still gates, and the cost of deferring it.** The
> published entity name, the postal address, the controller identity, which
> entity signs the DPAs, and the EAA microenterprise thresholds (headcount
> and turnover of an entity that does not exist yet).
>
> **The deferral collides with a standing owner directive, and this is the
> part worth deciding deliberately.** Identity stays private is an explicit
> rule for this project. A US LLC is precisely the mechanism that satisfies
> it: the LLC name and a registered agent or virtual business address are
> what get published, so the consumer-disclosure requirements are met
> without exposing a personal name or home address. Selling BEFORE
> formation inverts that. A sole proprietor's required disclosures point at
> the individual, so the choice becomes publishing personal details or
> shipping legal pages that stay non-compliant. Forming the LLC is not
> merely paperwork ahead of launch, it is the thing that keeps the identity
> private once money changes hands.
>
> **Sequencing consequence.** Because a US seller gets no threshold cushion
> in either the EU or the UK, **geo-gating EU and UK checkout at launch is
> now the cheaper opening move**, not the fallback. It defers two VAT
> registrations and two Art. 27 appointments until volume justifies them.
> It does not exist in code today (see the entry below), so choosing it is
> a small build, not a config flip. Stripe account ownership is the other
> sequencing item: revenue taken before formation lands on an individual
> and has to be migrated to the LLC afterwards.
>
> Original note, now answered: every open item in this tier funnelled
> through ONE unmade decision, the establishment country and legal entity.
> It blocked the postal address, the controller identity, the Art. 27
> question, the choice of advisor and OSS registration, and the EAA
> microenterprise thresholds.
>
> ---
>
> **LAUNCH SEQUENCING (owner, 2026-08-23): ship and sell BEFORE the LLC
> exists. The LLC gets formed only once 500 users prove real market need.**
> Same shape as the world-2 gate: validate first, spend second. The concern
> below was raised and the owner reaffirmed the plan, so this is the
> recorded decision, not an open question. What follows is how to keep its
> cost bounded.
>
> **Geo-gating fixes exactly one of the two problems.** The distinction
> decides most of this tier, so it is worth stating precisely:
>
> - **VAT is triggered by a supply for consideration.** Blocking EU and UK
>   **checkout** therefore removes the EU/UK VAT exposure completely, and
>   with it non-Union OSS, the separate UK registration, and the tax half of
>   the advisor engagement. Those all move behind the 500-user gate.
> - **GDPR is triggered by OFFERING services to EU data subjects, free
>   included.** It applies the moment an EU visitor signs up for the free
>   module. Geo-gating checkout does NOT remove it. Art. 13 controller
>   identity, the Art. 27 representatives, and the privacy-page gaps all
>   stay live during validation.
>
> The only way to escape GDPR would be blocking EU/UK from the whole site,
> which would defeat the validation goal outright, since the free module is
> the top of exactly the funnel the 500-user gate measures. So it is not on
> the table.
>
> **ACCEPTED RISK, recorded rather than hidden.** Selling before formation
> means the controller is a natural person. This project will publish a
> trading name plus a mailbox address and will not name that person, which
> is what most indie operators do and which is NOT strictly complete under
> Art. 13(1)(a). The owner has weighed that against the identity-private
> directive and chosen it deliberately. Trigger to close: LLC formation at
> the 500-user gate. Do not silently re-open this as a finding; it is a
> decision with a known cost and a named exit.
>
> **How to bound the exposure while validating:**
>
> 1. **Geo-gate checkout for EU/UK, and CAPTURE the blocked demand instead
>    of just refusing it.** That converts lost revenue into a measurable
>    EU/UK paid-demand list, which is precisely the evidence the 500-user
>    gate is supposed to weigh. Refusing silently throws that away.
> 2. **Get a virtual business address now.** It satisfies CAN-SPAM for the
>    already-live digest and gives a publishable address that is not a home
>    address. It does not depend on formation and becomes the LLC's address
>    later.
> 3. **Keep free signups global.** No VAT is triggered, and signups are the
>    validation metric.
> 4. **Merchant of record is the unlock AT the gate, not now.** `roadmap.md`
>    §4's re-evaluate trigger is arguably met already, since OSS filing is
>    not merely costly without an entity, it is impractical. But the same
>    section's warning stands: the money path is deep and freshly hardened,
>    and switching rails pre-launch is risk with no launch upside. An MoR
>    would also put the MoR's identity on the invoice rather than a natural
>    person, which is why it is the right conversation to have once the
>    entity question is live again.

- [ ] (OPERATOR) **Engage a US advisor, and pick the launch market scope.**
  Rewritten 2026-08-23 now that the entity is decided (US LLC). Two things
  to settle, and they are separable:
  (a) **Market scope at launch.** Sell to EU/UK from day one, which means
  non-Union OSS plus a UK VAT registration plus two Art. 27
  representatives before the first sale, or geo-gate EU/UK checkout and
  defer all four until volume justifies them. For a US seller with no
  threshold cushion in either market, the geo-gate is the cheaper opening
  move.
  (b) **The advisor.** A US CPA or tax counsel who has actually handled
  non-Union OSS and UK VAT for a US seller of digital services, not a
  generalist. Fee analysis: `roadmap.md` §4.
  Note geo-gating does not exist in code: the checkout path has no country
  restriction, so choosing it means writing it. Scope it as billing-country
  detection at checkout plus an explanatory state on `/pricing`, and expect
  it to need its own test coverage on the money path.
- [ ] (OPERATOR) **Tax handling: code is written but switched OFF.**
  Verified 2026-08-20. `taxSessionParams()`
  (`apps/api/src/routes/payments.ts:47-53`) wires `automatic_tax`,
  `billing_address_collection`, `tax_id_collection` and `invoice_creation`,
  and is spread into both checkout sessions (`:282`, `:426`). But it returns
  `{}` unless `STRIPE_TAX_ENABLED === "true"` (`:48`), and that var ships
  empty (`apps/api/.env.example:17`). **At repo defaults, zero tax is
  collected**, so the R2-4 exposure is live even though the code exists.
  **Rescoped 2026-08-23 by the launch-before-LLC decision.** With EU/UK
  checkout geo-gated, EU VAT and OSS drop out of the launch path entirely,
  so this entry is no longer blocked on OSS registration.
  **But US-only is not tax-free, and that is the trap in this rescope.**
  Digital-goods taxability varies by state, and home-state nexus applies
  from the first sale with no threshold to hide behind, so whether tax is
  owed depends on which state the owner sells from. Confirm that with the
  US advisor before assuming the flag can stay off. If the home state taxes
  digital products, the sequence is unchanged in shape: Stripe dashboard Tax
  setup, then register in that one state, then set `STRIPE_TAX_ENABLED=true`
  and redeploy. The 0.5% Stripe Tax fee on a single-state registration is
  the cheap version of this problem.
  Original remaining work, for when EU/UK opens at the gate:
  Stripe-dashboard Tax setup, OSS registration, then set
  `STRIPE_TAX_ENABLED=true` and redeploy.
  **Migration 047 is confirmed applied** (2026-08-20, ledger IN SYNC 59/59),
  so one hazard is formally retired: R3-2 warned that deploying the current
  `payments.ts` before 047 would 500 every `checkout.session.completed`
  upsert and leave customers charged with no access. The tax columns exist
  in production, so flipping the flag is now a dashboard and redeploy step
  with no ordering trap in front of it.
- [x] Refund terms - **RESOLVED in code 2026-07-25 (wave 3):** the
  20%-accessed condition is dropped from terms/pricing/FAQ; refunds are an
  unconditional 14 days via support@. Advisor sanity-check remains part of
  the general terms review, but no waiver mechanism is needed anymore.
- [ ] (OPERATOR) **Form the US LLC. GATED: at 500 users with proven market
  need, per the owner decision of 2026-08-23, NOT before launch.** Added as
  its own entry because the decision and the formation are different things
  and only the first is done. What downstream work needs from it: the registered
  legal name, a registered agent or virtual business address that is safe
  to publish, an EIN, a business bank account, and the Stripe account moved
  to or opened under the entity. Until it exists, five entries below cannot
  close, and any sale made in the meantime is made by an individual, with
  the disclosure consequences described in the decision note above.
  When the gate opens, revisit merchant-of-record at the same time: the two
  decisions interact (see item 4 of the decision note).
- [ ] **EU/UK checkout geo-gate: CODE DONE 2026-08-23, three steps left.**
  Built after the owner chose to gate rather than sell into the EU/UK or
  switch to a merchant of record.
  **Shipped in this working tree (all tested, all suites green: api 268,
  web 620, shared 45, content 413, typecheck 10/10):**
  (a) `billing_address_collection: "required"` hoisted OUT of
  `taxSessionParams()` so the buyer's country is captured whether or not the
  tax flag is on (2 tests).
  (b) `VAT_GATED_COUNTRIES` + `isVatGatedCountry()` in `@tensorcraft/shared`,
  the 27 EU states plus GB, failing OPEN on an absent or `XX` country
  (6 tests).
  (c) API refuses `/checkout` and `/guest-checkout` with 403
  `region_unavailable` when Cloudflare's `CF-IPCountry` is gated, asserting
  no Stripe session is created, since a created session is a payable link
  (4 tests).
  (d) `RegionNotice` on `/pricing` replacing the buy button with an
  explanation plus email capture against source `region-blocked` (4 tests),
  fed by a middleware cookie so the statically rendered page stays static
  (5 tests).
  **What is left:**
  1. ~~Apply migration 060~~ **DONE 2026-08-23** (see Tier 1-OPS). The
     capture writes `region-blocked`, which the new shape constraint accepts,
     so the notice will record blocked demand as soon as the code deploys.
  2. **Deploy both halves.** The API gate is the enforcement and the web
     cookie is only presentation, so shipping the web half alone leaves
     purchases open.
  3. **Add the webhook backstop** when real money is flowing: check
     `customer_details.address.country` on `checkout.session.completed` and
     flag or refund what slipped through a VPN. Deliberately deferred as the
     hardened layer; the country is now always collected, so no further
     change is needed to enable it.
  Also add the country restriction to `/terms`, which is still open.
  **Original scoping note, and the blocker it named, now fixed:**
  `billing_address_collection: "required"` currently sits INSIDE
  `taxSessionParams()` (`apps/api/src/routes/payments.ts:47-55`), which
  returns `{}` while `STRIPE_TAX_ENABLED` is unset. So today Stripe collects
  no billing country at all, and a geo-gate has nothing to verify against
  after the fact. Hoist `billing_address_collection` out of the tax-gated
  block so it applies unconditionally. That is a one-line change on the
  money path and needs its own test.
  **Then three layers, because an IP check alone is not enough:**
  (1) UI: the web layer knows the country from Vercel's
  `x-vercel-ip-country` (middleware already runs), so render an
  explanatory state instead of the buy button, and capture an email against
  a `region_blocked` source so the demand is measured.
  (2) API: refuse session creation for EU/UK, since the Fly host has no geo
  header of its own and must not trust a client-supplied country.
  (3) Webhook: check `customer_details.address.country` on
  `checkout.session.completed` and flag or refund anything that slipped
  through. VPN traffic makes this a real path, not a theoretical one.
  Add the country restriction to `/terms` in the same change.
- [ ] (OPERATOR) **Get a virtual business address or PO box.** New
  2026-08-23. Independent of LLC formation and unblocks the CAN-SPAM
  postal-address entry below for the digest that is already sending. A USPS
  PO box or a commercial mail-receiving agency address is acceptable for
  CAN-SPAM. This is also the address that goes on `/terms` and `/privacy`
  under the trading name, which is what keeps a home address off the site.
- [ ] **Add legal entity, postal address, and jurisdiction clause to terms +
  privacy pages.** Re-verified 2026-08-20 and still fully open.
  `apps/web/app/terms/page.tsx` has no entity, no address and no
  governing-law section anywhere in its ten sections;
  `apps/web/app/privacy/page.tsx:55-59` carries an explicit code comment
  marking the GDPR Art. 13(1)(a) hole and names only bare "Tensorcraft".
  This is the blocking decision described above.
- [ ] **Send a real receipt/invoice on purchase. RECEIPT BUILT 2026-08-23,
  needs deploying; the invoice half is still open.**
  Built on **Resend, deliberately not Kit**: Kit's credentials 401 (see
  Tier 1-OPS), and a receipt is the legally expected artifact of a payment,
  so it must not sit behind an integration that is currently dark. Resend was
  already wired and sending (digest, issue notifications).
  `sendPurchaseReceipt` (`apps/api/src/lib/email.ts`) inspects Resend's
  `{data, error}` result rather than assuming a throw (the F1 lesson), bounds
  its own wait so a hung mailer cannot hold the Stripe webhook past its
  timeout, and never throws. Wired into BOTH settle paths inside the existing
  dedupe guard, so it inherits the two-layer dedupe instead of inventing a
  third: the sync path and `async_payment_succeeded`, the latter being where
  delayed methods (SEPA, bank debit) settle. 10 tests.
  **Two defects found while building it, both fixed:** the buyer's email was
  looked up INSIDE the Kit try block, so a Kit failure (the current state)
  would have skipped the receipt too; and the webhook 500'd when the receipt
  rejected, turning a successful payment into a Stripe retry. The lookup is
  now shared and each sender has its own failure domain, and the call site is
  guarded independently of the helper's contract.
  **Also worth knowing:** `async_payment_succeeded` had NO test coverage at
  all before this, and the admin-client `profiles` mock returned a bare null,
  which had made both the receipt and the pre-existing Kit tag unreachable in
  tests. Both fixed.
  **Remaining:** deploy the API, and decide the invoice half, which is
  unreachable while `STRIPE_TAX_ENABLED` is unset. Original text follows.
  Verified 2026-08-20: still fully open. The only purchase-time email action is a Kit tag
  (`apps/api/src/routes/payments.ts:873-875` and the async duplicate at
  `:1196-1198`); no receipt email template exists anywhere
  (`apps/api/src/lib/email.ts` sends issue notifications only). The
  on-screen receipt at `apps/web/app/dashboard/purchase-success/page.tsx`
  is not an email. Two independent halves: the Kit receipt automation
  (dashboard, Tier 1-OPS) and the Stripe invoice half, which is unreachable
  while `STRIPE_TAX_ENABLED` is unset.
- [ ] **Postal address in the weekly digest footer (CAN-SPAM).** Verified
  2026-08-20: the plaintext footer is one unsubscribe line
  (`apps/api/src/lib/newsletter.ts:119`) and the HTML footer is
  read-on-web plus unsubscribe (`:167-171`). No postal-address constant or
  env var exists anywhere in the repo to inject.
  **Unblocked 2026-08-23:** this no longer waits on the entity. It waits
  only on the virtual mailbox entry above, since CAN-SPAM accepts a PO box
  or a commercial mail-receiving agency address and does not require a
  registered company. Once the address exists this is a small repo change:
  add the constant plus an env var, inject into both the plaintext and HTML
  footers, and cover it with a test. The digest is already sending, so this
  is live non-compliance today rather than a pre-launch task.
- [x] Waitlist consent fix (code) - **DONE 2026-07-25.** Migration 050 flips
  the column default to false; `submitWaitlist` takes an explicit
  `subscribeToDigest` flag that only the newsletter modal passes, so the
  digest sender's `subscribed = true` filter now selects exactly the
  consented set. OPERATOR DECISION remains: whether to un-enroll the
  pre-050 auto-enrolled rows (one-line SQL in the migration header).
  **Two things found 2026-08-20 that make this urgent rather than tidy.**
  (1) No surface anywhere passes `subscribeToDigest: true` (verified across
  all three callers, and stated in the docstring at
  `apps/web/lib/waitlist.ts:19-29`). So the digest's recipient set today is
  *exactly and only* the pre-050 auto-enrolled legacy rows: the weekly
  digest currently mails the non-consented cohort and nobody else, and the
  Settings toggle cannot add anyone to it. (2) The remediation SQL in the
  050 header is stale: it filters `source not in ('theme-selection')`, but
  migration 058 renamed theme to world and the live call site now writes
  `"world-selection"` (`apps/web/app/worlds/newsletter-modal.tsx:50`).
  Running it as written would not match the rows you intend.
- [x] Self-serve account deletion (code) - **BUILT 2026-07-25.**
  `POST /api/profiles/delete` (typed-DELETE confirmation, ESP cleanup,
  waitlist rows removed by email, auth user deleted) + real Settings flow.
  **Requires migration 056** (purchases FK → ON DELETE SET NULL) so tax
  records survive erasure unlinked (Art. 17(3)(b)) - **056 APPLIED to
  production 2026-07-25** (same session-day as the build; ledger IN SYNC
  56/56), so this is clear to ship.
- [x] GDPR data export (code) - **BUILT 2026-07-25.**
  `GET /api/profiles/export` returns a JSON attachment (account + all 12
  user tables + waitlist rows by email; the GitHub token is disclosed but
  never exported - it is a live credential); Settings has the download
  button. Re-verified 2026-08-20: the loop now covers **14** tables, not 12
  (`arena_submissions` and `issues` were added 2026-08-16).
  STILL OPEN, both confirmed still missing: the DSAR runbook with its
  30-day clock does not exist anywhere (the only "DSAR" hits in the repo are
  this entry and the original finding), and the contact address is now split
  three ways rather than two: `privacy@` on /privacy, `legal@` on /terms,
  and `support@` in the Settings deletion and export flows.
- [x] Vercel Analytics consent gating (code) - **DONE 2026-07-25.**
  `ConsentGatedVercelAnalytics` renders nothing pre-consent and drops
  queued events via `beforeSend` after a withdrawal.
- [x] Consent withdrawal path (code) - **DONE 2026-07-25.** Sitewide
  "Cookie settings" footer control clears the consent key, re-shows the
  banner, and flips every consent gate off in-tab (Art. 7(3)).
- [ ] **Privacy-page Art. 13 gaps: 4 of 6 closed by the 2026-08-16 rewrite,
  3 still open.** Re-verified line by line 2026-08-20.
  CLOSED: lawful basis per purpose (§3), international transfers with
  DPF/SCC safeguards (§7), complaint right (§10).
  STILL OPEN: controller identity (no longer an open question as of
  2026-08-23, just gated on LLC formation: the controller is the LLC);
  **Art. 27 EU/UK representative**, which the policy does not mention at
  all and which US establishment turns from a question into a requirement,
  in both the EU and the UK, unless the narrow Art. 27(2) exemption is
  confirmed to apply (do not assume it does, and note the geo-gate option
  above avoids both appointments); and **waitlist retention**, which §2 collects but §9 never gives a
  period for.
  Also open and narrower than the original wording: §7 names US-processing
  providers generically but does not name Supabase, so "EU personal data on
  US-hosted Supabase" is only addressed in the abstract. Confirm the
  Supabase project region and name it.
- [ ] **Sub-processor list + DPAs: the list is done, no DPA is signed.**
  Re-verified 2026-08-20. The list half is CLOSED: /privacy §5 now
  enumerates twelve processors including Resend (correctly described as the
  digest sender) and Vercel. The DPA half is untouched: all six boxes in
  the "DPA execution checklist" at `docs/privacy-compliance.md:87-101` are
  unchecked, the processor table marks "DPA required: Yes" for all ten, and
  no executed-DPA artifact exists in the repo. One checklist line there
  ("Add PostHog + Sentry to the privacy Sub-processors section") is in fact
  already done and can be ticked now.
- [ ] (OPERATOR) **Confirm (don't assume) the EAA microenterprise
  exemption** with the advisor - the accessibility-statement obligation has
  applied to e-commerce since 2025-06-28. Verified 2026-08-20: no
  accessibility statement page or route exists. Note the exemption turns on
  headcount and turnover of a legal entity that does not exist yet, and
  that the repo's a11y coverage is desktop-chromium only, so a conformance
  claim is not currently evidenced.
- [ ] **Correct the guest-checkout copy.** Found 2026-08-20 during the
  reconcile, not previously tracked: /privacy §2 and /terms §3 both
  describe guest checkout as a live flow, but it is disabled
  (`apps/web/app/pricing/checkout-button.tsx:66-83`: the endpoint exists on
  the API but nothing routes to it). Shipped legal copy should not describe
  a flow the product does not offer.
- [ ] **Privacy-page data-inventory update (R3-8): mostly closed, one real
  gap left.** Re-verified 2026-08-20.
  DONE: billing country + VAT id are disclosed (§2); arena `submitted_code`
  is disclosed and covered by the §9 learning-data rule; the "30-day
  removal" versus ten-year VAT retention conflict is resolved in copy (§9
  carries the carve-out) and genuinely implemented in code
  (`apps/api/src/routes/profiles.ts:346-349` with migration 056's
  `on delete set null`).
  STILL OPEN: **`stripe_customer_id` is stored and is returned in the data
  export (`profiles.ts:259`) but is disclosed nowhere in the policy.** Add
  it to §2. Separately, the ten-year figure is currently an assertion in
  shipped copy with no jurisdiction behind it; the advisor should confirm
  it for the eventual establishment country.
- [x] **GitHub integration disclosure (R3-8)** - terms side **DONE
  2026-07-25**: new Terms §6 "GitHub Integration" (public-by-default
  repos, token storage + removal on disconnect, code ownership);
  consent-moment disclosures were already added in wave 3.
  Re-verified 2026-08-20: the overclaiming "industry-standard OAuth 2.0 /
  PKCE" line is GONE from the rewritten policy, which now makes no security
  claim about the token. STILL OPEN underneath it: `profiles.github_token`
  is stored plaintext and is browser-readable through the row-level RLS
  policy (Tier 2 encryption item), and neither /privacy nor /terms §6 tells
  the user the token is unencrypted.

---

## Tier 2 - Fix in week 1, before spending real money on ads

Not launch blockers. Each one wastes acquisition spend if left.

> **Reconciled 2026-08-20.** Before this pass every entry in this tier was a
> prose bullet, so a reader building a worklist from `- [ ]` saw none of it.
> All entries are now checkboxes. Four were verified DONE and one was found
> to be describing a feature that already shipped; the rest were re-verified
> against current code and several had their sub-items corrected.

- [ ] **First lesson opens with a ~15.5s auto-playing scene** during which the page is functionally blank, escapable only via a `text-[10px]` "Skip" control. This is the activation moment for the entire product, and it is the destination of the landing page's primary CTA. Re-verified 2026-08-20: `lesson-steps.tsx:1357` still auto-plays on first visit, per-beat hold is 800-3200ms so 6-8 beats lands in the 15s band, and the Skip control is still `text-[10px]`. The only other escape is `prefers-reduced-motion`.
- [x] **Guest email capture: SHIPPED.** Corrected 2026-08-20; this entry said "no email capture for guests anywhere in the free module", which is no longer true. `guest-email-capture.tsx` renders for guests only and is mounted in the lesson flow behind `isFreeModule` (`lesson-steps.tsx:1757`). Rows land with `subscribed` false per migration 050, so capture does not imply digest consent.
- [ ] **Mobile: code editor sets 13px type**, below the iOS 16px auto-zoom threshold. Re-verified 2026-08-20: still `size: "13px"` in BOTH Sandpack themes (`packages/ui/src/mdx/exercise.tsx:174` dark, `:205` light). Also still true: no axe run at any mobile viewport (`e2e/accessibility.spec.ts` runs only in the chromium project, which excludes the mobile specs), and all non-axe e2e is dark-only via the global `colorScheme: "dark"` pin (`playwright.config.ts:32`). **Corrected:** the "no mobile affordance past the exercise gate" clause is stale, the mobile pane toggle exists (`lesson-steps.tsx:820`).
- [ ] **Lessons ship ~100 indexable words** (only the current step is in the DOM) and require JS to render at all, with no `<noscript>`. Re-verified 2026-08-20: zero `noscript` anywhere in `apps/web`, and exactly one of six steps renders because `currentStep` is client state. Large organic-acquisition loss for a content-led product.
- [ ] **SEO/metadata + funnel polish: ONE sub-item left of four.** Re-verified 2026-08-20 and this entry was badly out of date. **Now fixed and struck:** the og:url shallow-merge drop (all four surfaces, world detail / lesson / `/learn` / capstone, now declare full `openGraph` and their own `twitter` block); the `PreOrder` emission (gated bundles are filtered out of the catalog entirely, `PreOrder` survives only in a comment and a negative test); and both "duplicate `Course` JSON-LD" and "`price: 59` in two places" are **not reproducible** (the launched and coming-soon Course emitters are mutually exclusive because the page early-returns, and the price has a single source in `packages/shared/src/constants.ts:101`).
  **Still genuinely open:** a guest who finishes module 1 sees **"Continue M1" pointing backwards**. The paywall branch at `apps/web/app/worlds/[slug]/page.tsx:272-278` requires `!activeModule`, so a learner whose `activeModule` still resolves to module 1 gets a Continue link back into the module they just finished. Fix the `activeModule`/`paywallBlocked` precedence so a completed module 1 advances or routes to `/paywall`.
- [ ] **Load test before ad spend** (gap found 2026-07-22 - no audit dimension
  covered it): nobody has ever pushed the payment path, the SSR lesson
  route, or the Stripe webhook handler under concurrency. Gates 2/3
  explicitly precede buying traffic; measure before spending.
- [ ] **Support workflow** (2026-07-22): support@ is a mailbox, not a process.
  Re-verified 2026-08-20: `docs/` contains a digest runbook and a migration
  runbook, and nothing for support or refunds.
  Write the refund-processing runbook (exact Stripe steps), the
  chargeback-evidence workflow, and a response-time target before launch
  week fills the inbox.
- [x] ~~Story-skip instrumentation missing~~ - **DONE 2026-07-25**, re-verified 2026-08-20:
  `script_skipped` fires from the Skip control with exactly the four
  documented fields (`lesson-steps.tsx:1406-1414`), and is covered by a test.
  The ">40% skip triggers narrative redesign" rule is computable from day 1.
- [ ] (OPERATOR) **Uptime monitoring + status page.** Re-verified 2026-08-20,
  and this is the single most consequential gap in this tier: it is the
  failure mode that let the API certificate expire unnoticed for weeks in
  July, killing every browser-to-API call.
  What exists: `/api/health` (liveness, static JSON) and `/api/health/ready`
  (readiness, real DB check, 503 on failure), correctly split at
  `apps/api/src/routes/health.ts`. What does NOT exist: any external
  observer. Both current probes are self-probes from inside the host
  (`apps/api/fly.toml` `[checks.health]` every 10s, and a Dockerfile
  `HEALTHCHECK` hitting localhost), which is exactly the case that cannot
  report down-and-silent. No workflow pings a URL on a schedule, and no
  status page route exists.
  Cheap to close: `/api/health` is already exempt from rate limiting
  (`apps/api/src/middleware/rate-limit.ts:95`), so an external monitor can
  poll it freely. Point one at the web root, at
  `https://api.tensorcraft.app/api/health/ready`, and at the Stripe webhook
  path. Sentry alert rules (Tier 1-OPS) cover errors, not silence.
- [ ] **Mobile/a11y residuals.** Re-verified 2026-08-20. Confirmed FIXED and struck: `pending-poller` (its `role="status"` region is always mounted) and the `--tc-border-interactive` token, which exists in both schemes and is in real use. Still open, all sites confirmed: the **challenge-passed banner** still mounts `role="status"` together with its content (`lesson-steps.tsx:743-753`), the exact defect pending-poller fixed, so lift the region out of the `canContinue` conditional; and interactive controls still carry decorative `border-border` at `apps/web/app/page.tsx:152`, `components/scheme-toggle.tsx:69`, and `dashboard/purchase-success/pending-poller.tsx:88`, plus the unselected picker toggle. The 3.99-4.23:1 overlay-contrast claim needs a rendered run and could not be settled by reading. 13px editor type and mobile axe are in the bullet above.
- [ ] **Security mediums from the audit register.** Re-verified 2026-08-20; one improved, three unchanged, one unverifiable.
  - **Rate-limit bypass: reduced, NOT closed, and the code comment overstates it.** Identity is now keyed first off a hash of the bearer token, which cannot be spoofed by rotating a header. But the anonymous fallback still reads `cf-connecting-ip` first with **no Fly origin lock** (`apps/api/src/middleware/rate-limit.ts:124`), so unauthenticated traffic hitting the Fly hostname directly with a rotated header still mints unlimited buckets. The comment at `:113-115` describes the bypass in the past tense; correct it along with the fix.
  - **CSP `'unsafe-inline'` still present** in `script-src` and `style-src` (`apps/web/next.config.ts:180,189`), and the misattributing comment at `:174-176` is still there. `'unsafe-eval'` is the genuinely required one.
  - **`POST /api/github/token` still accepts any caller-supplied token** (`apps/api/src/routes/github.ts:718-757`): it validates only that GitHub answers with some username, then stores the token on the caller's row. No binding between the token's identity and the calling user. Its only caller is the web session listener, so deleting the route is a live option.
  - **Waitlist has no route-scoped limiter and no captcha.** It falls back to the global 60/min keyed on the spoofable anonymous identity above.
  - **skill_events child-partition RLS check: still not run.** The parent's RLS and INSERT policy are declared in migrations, but the ask is a live PostgREST select against a child partition, and nothing in CI performs it.
- [ ] **Unsubscribe does not propagate to Kit.** Core defect CONFIRMED open in both directions 2026-08-20, but two clauses of this entry were stale and are corrected here: `unsubscribeFromAll()` is **not** dead code (account deletion calls it), and a Kit webhook **does** exist (`apps/api/src/routes/webhooks.ts:49`, shared-secret guarded). What is actually broken: the two unsubscribe handlers only flip `waitlist.subscribed` in Supabase and never call `unsubscribeFromAll`; and the kit-bounce handler only logs, performing zero database writes, so a Kit-side unsubscribe or complaint never flips anything. Once the Tier 1-OPS retention automations go live, an unsubscribed address keeps receiving sequence emails. Wire both directions.
- [ ] **No server-side timeouts on Kit, Resend, or Supabase queries.** Re-verified 2026-08-20 by grepping every `AbortSignal.timeout` in the repo: there are exactly 8, all in the GitHub lib. Kit's single `kitFetch` wrapper has no signal, the Resend send has none, and no Supabase query has one. Upstash has a partial mitigation (a 2s SDK-level timeout on the rate limiter only). The sharpest case is confirmed and worth noting precisely: `apps/api/src/routes/payments.ts:872-875` **awaits** two Kit calls inline in the Stripe webhook handler even though the comment above them says fire-and-forget, so a hung Kit connection stalls the webhook. Re-delivery is fully deduped via the `payment_events` ledger, so the cost is retry noise and delayed fulfilment rather than double-firing. Client-side, seven call sites still bypass `apiFetch` and its 10s abort (settings x4, onboarding, report-issue, capstone).
- [ ] **Error-boundary copy misattributes DB faults** - a paying customer during a 2s Supabase blip reads "Lesson failed to load / something went wrong on our end" as a content bug. Re-verified 2026-08-20: a DB throw carries no code the message map recognizes, so it falls through to the generic "our end" string, and six sibling boundaries share the pattern.
- [ ] **Fly config drift:** re-verified 2026-08-20, both halves still true. `apps/api/fly.toml` has no `[[vm]]` block, so machine size is unversioned while `docs/infrastructure.md:33` asserts 256MB with no in-repo source. And the Dockerfile builds `dist/` and then discards it: the runner stage copies `src`, installs `tsx` globally, and runs `CMD ["tsx", "src/index.ts"]`, so TypeScript is transpiled at container runtime on the payment path.
- [x] ~~Rate limit is 60/min in code, 120/min in both docs~~ - **reconciled 2026-07-25**, re-verified 2026-08-20: code is 60 and all five docs say 60, with no surviving 120 claim. Raising the actual limit remains a product decision if multi-tab 429s show up. **New drift found in passing:** `docs/infrastructure.md:149` still describes a sliding-window algorithm using sorted sets, but the limiter was rewritten to `Ratelimit.fixedWindow` on 2026-08-17. Correct that line.
- [ ] **Opacity-dimmed text contrast: the "22 sites, all ≥/65" claim does not reproduce.** Re-censused 2026-08-20: **29** alpha-dimmed text sites, and **4 are below the claimed /65 floor** (`components/auth-form.tsx:339` and `:346` at `/30`; `pricing/pricing-tiers.tsx:72` and `pricing/page.tsx:135` at `/40`). The cited fixes do check out (no "Notify me" or ticker `/40` survives). Either re-census and correct the number, or document those four as exempt-class with the reason. The measured 4.96-11.4:1 range needs a rendered run.
- [ ] **Lesson body ships in HTML at `opacity:0`** until JS stamps the beat state - cloaking-adjacent on the primary organic surface (compounds the ~100-indexable-words item above). Re-verified 2026-08-20: `globals.css:323-336` hides unshown beats and sets instructional content to `display: none` while playing, and the file's own comment states that first-visit SSR HTML starts in "playing", so JS is required to reveal the page.
- [ ] **Small UX/cleanup: one item left.** Re-verified 2026-08-20. Now also fixed and struck: ~~broken admin link `admin/digest` → `/learn/...`~~ (now points at `/worlds/...`, with a code comment naming this exact defect), alongside the previously struck root-404 CTA and `.gitignore` items. **Still open: counterfactual debris.** Table 031 was never dropped (033 explicitly preserves it, nothing through 059 touches it), and it survives in the ledger, in generated types, in two RPCs that migration 058 still maintains, and in the GDPR export table list (`apps/api/src/routes/profiles.ts:196`). Drop it in a new migration and regenerate types, or document it as dormant.
- [ ] **`github_token` stored plaintext and browser-readable.** Re-verified 2026-08-20: written in plaintext at three sites in `apps/api/src/routes/github.ts` and read back at eight, with an in-code acknowledgement at `profiles.ts:139`. No encryption helper, no pgcrypto, and no column-level grant restriction in any migration (049 clamps `stripe_customer_id`; nothing equivalent here). Encrypt at rest + block direct column reads.
- [x] ~~Money-path hardening (R3-4)~~ - **all six DONE 2026-07-25** (payments.test.ts 41/41). Partially re-verified 2026-08-20: the sub-claim other entries lean on, webhook dedupe via the `payment_events` ledger, checks out in code and migration 053. The 41/41 figure was not re-run.
- [x] **Journey/new-surface hardening (R3-6/R3-7): both "still open" items are now closed.** Re-verified 2026-08-20. The lesson editor is genuinely single-mount, not CSS-only: `lesson-shell.tsx:22-31` states the pane is single-mount by contract and takes `paneOpenOnMobile`, and the second copy is gone from the caller. The `/journey` `getUser()` nit is moot because the route no longer exists (consolidated into `/worlds` on 2026-08-15). **Note the concern migrated rather than vanished:** `apps/web/app/worlds/page.tsx:110` does a per-request `getUser()` and that file exports no `revalidate`, so the same crawl-cost characteristic now applies to `/worlds`. Tracked as a nit, not a blocker.
- [x] ~~CI hardening (R3-9)~~ - **DONE 2026-07-25**, code side re-verified 2026-08-20: WebKit is installed in CI, and the `migrations` job runs unconditionally and is fail-closed by design. The operator half (adding the two Supabase secrets to GitHub) is external and is tracked in Tier 1-OPS; until they exist the job fails on every push, deliberately.
- [x] ~~No `immutable` cache headers on `/vendor` or `/models`~~ - **stale entry; shipped 2026-07-21**, re-verified 2026-08-20 against `next.config.ts:106-126` (both paths carry `public, max-age=31536000, immutable`).
- [x] ~~Kit automations still unbuilt~~ - promoted to Tier 1-OPS above (2026-07-22). Note the dependency: the unsubscribe gap above becomes user-visible the moment those automations go live.

---

## Tier 3 - Fix before ~10k users, not before launch

> **MOVED 2026-07-22** to `docs/post-launch-backlog.md` §9 ("Scale debt,
> before ~10k users") - post-launch by this tier's own definition, so it
> belongs in the post-launch source of truth. §9 also picked up the two
> R2-5 infra findings (Fly/Supabase region split, DB-gated health check)
> that previously had no checkbox anywhere.

---

## The honest ceiling

Tier 1 makes the app **safe to release and possible to measure**. It does not make 100,000 paying users reachable, and nothing in this document does.

100k requires capabilities that **do not exist in the codebase** - verified by grep, all returning zero:

| Capability | Status (re-checked 2026-07-25) | Share of 100k |
|---|---|---|
| Subscription / recurring billing | groundwork only (043 `stripe_customer_id`, webhook capture; no product code) | makes paid acquisition solvent |
| Teams / orgs / seats | no code | ~50–60k |
| Leaderboard / arena | schema + contract only (048, `arena-scoring-contract.md`; zero UI/API) | ~10–15k |
| Referral / invite | no code | the viral loop |
| Worlds purchasable | **1** (`LAUNCHED_WORLDS`) | the TAM denominator |

With one world at one-time pricing, the realistic ceiling is the **5–10k paying** band, however well distribution goes. Reaching 100k means building the above - quarters of work - as laid out in `docs/roadmap.md` Horizons 1–3.

**So: launch tomorrow on Tier 1. Distribute. Measure. Then decide whether the 100k arc is the business you want to build.** Those are separate decisions and they do not have to be made together.
