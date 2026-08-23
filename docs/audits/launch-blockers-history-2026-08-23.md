# Launch blockers: audit history and resolved record

Frozen 2026-08-23. This is everything `docs/launch-blockers.md` accumulated
between 2026-07-21 and 2026-08-23: the six-dimension audit, the Round 3 delta
re-audit and its two verification passes, the 2026-08-14 CI and Vercel
incidents, the 2026-08-23 working session, and the Tier 1 record.

It was moved out because that file is now a live list of what remains, not a
log. Nothing here is actionable; open work lives in
`docs/post-launch-backlog.md` with a benchmark tag, and the two remaining
blockers stayed behind in `docs/launch-blockers.md`.

Kept because the reasoning is what makes the surviving tasks intelligible, and
because several entries record misdiagnoses that would have caused outages if
acted on literally (the 019 RPC, the Dockerfile CMD, the GitHub token route).

---

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

> **Moved 2026-08-23.** The lockfile install-command item that lived here has
> gone to `docs/post-launch-backlog.md`. It failed the beta bar: it is a
> deploy-reproducibility concern, not something the app cannot be tested
> without. Recording the move rather than deleting it, because a live item
> sitting under a heading that reads as resolved is exactly the trap the
> 2026-08-20 reconcile called out, and silently removing it would recreate it.

---

## 2026-08-23: launch-before-LLC decided, three fixes shipped, one live bug found

A working session that changed both the plan and the code. Recorded here
because the tiers below now read differently as a result.

**Decisions taken (owner).** The entity will be a **US LLC**, and the product
**ships and sells before it exists**, with formation gated at 500 users and
proven market need. EU/UK checkout is **geo-gated** rather than sold into or
routed through a merchant of record. Both are written up in the Tier 1-LEGAL
decision note, including the accepted risk (the controller is a natural
person until the LLC) and its named exit.

**A live bug found and fixed: every waitlist signup was failing.** 009's
`chk_waitlist_source` enum allowed only five values; every capture surface
built since passes something else (`world-selection`, `free-module-end`,
`coming-soon-hero`, `coming-soon-footer`), and the newsletter modal also
passes `world_id` "all", which 041 rejects. `submitWaitlist` returns "error"
rather than throwing, so this failed silently behind a generic message with
nothing logged. The coming-soon pages are the only waitlist entry point for
four of five worlds. **Migration 060 replaces the enum with a shape check and
is APPLIED to production**, verified by reading `pg_constraint` before and
after. Production held exactly one waitlist row, from 2026-03-27, source
`landing`, the only value the old constraint ever allowed.

**Shipped in code, all pending one API deploy:**

- **Purchase receipt on Resend** (not Kit, whose credentials 401), wired into
  both settle paths inside the existing dedupe guard. Buyers previously
  received nothing at all after paying.
- **EU/UK checkout geo-gate**: shared country table, API refusal on
  Cloudflare's `CF-IPCountry`, and a `/pricing` notice that captures the
  blocked demand instead of discarding it.
- **`billing_address_collection` hoisted out of the tax flag**, so the buyer's
  country is captured whether or not Stripe Tax is on. Without it the gate had
  nothing to verify against and the exposure could not even be measured.

**Verified against production rather than assumed:** the migration ledger
(59/59, then 60/60 after 060), the 056 foreign key (`confdeltype = 'n'`, so
account deletion preserves VAT records), all three GitHub Actions secrets,
both health endpoints (`checks.db: ok`), and CI green on `main`.

**Two corrections to THIS document.** The 019 entry instructed dropping
`get_shared_certificate`, which is load-bearing for the public certificate
share pages; following it would have broken production. The real defect was
one line of rollback SQL naming a `(text)` overload that never existed, now
fixed. Separately, four entries carried `(OPERATOR)` on the premise that the
ledger could not be checked from a checkout; `apps/api/.env` carries the
credentials, so it can.

**Battery at the end:** typecheck 10/10, 1797 tests passing across 200 files,
content gates (em dash, slop lexicon) green.

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
