# Launch Blockers — Definitive List (2026-07-21, re-baselined 2026-07-25)

> **What this document is:** the complete set of pre-launch work — code defects (Tier 1; Tier 2 in week 1), operator setup (Tier 1-OPS), and legal/compliance actions (Tier 1-LEGAL). Originally scoped to code defects only ("when Tier 1 is done there is no further blocker"); that claim is superseded — since the 2026-07-22 consolidation the release gate is **Tier 1 + Tier 1-OPS + Tier 1-LEGAL complete**, with Tier 2 due in week 1 before ad spend. **Round 3 (2026-07-25) adds two release-gate items: R3-1 (API undeployable at HEAD) and R3-2 (migration 047 must precede the next API deploy).**
>
> **What it is not:** a path to 100,000 paying users. See "The honest ceiling" at the bottom. Do not conflate the two.
>
> **This document is the actionable subset.** The complete findings register —
> every Medium and Low item across all six audit dimensions, with file:line and
> status — is `docs/audits/full-audit-2026-07-21.md`. If something you remember
> being raised is not here, it is there.

## Why earlier audits said "launch ready"

Every audit before 2026-07-21 examined **content and copy** (`docs/audits/*`). The verdict "A+ / launch ready" was accurate about lesson quality, story, and exercise rigor. It was never a statement about the monetization path, funnel instrumentation, database security, or behaviour at scale — those dimensions had **never been audited**. They were unexamined, not cleared. This document closes that gap.

---

## ROUND 2 (2026-07-21, six-dimension audit) — NEW BLOCKERS

A second, deliberately exhaustive audit covered the dimensions the first pass
had not: security/RLS, legal/tax, data integrity, operational readiness,
accessibility, runtime correctness. It found blockers more severe than
anything in Round 1.

### R2-1. CRITICAL — any signed-up user could make themselves admin

`001_initial_schema.sql:30-32` declares the profiles UPDATE policy with
`using (auth.uid() = id)` and **no `with check`**. Postgres reuses the `using`
expression as the check, so the post-update row need only still be your own —
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

**FIXED in code** — migration `040_fix_privilege_escalation_and_view_leaks.sql`
adds a BEFORE UPDATE trigger that reverts any role change not made by the
service role, plus an explicit `with check`. **Must be applied to production.**

### R2-2. HIGH — two views leak every user's data (fixed in 040)

- `dashboard_stats` (`012:25`) is a materialized view aggregating all users'
  progress. **Materialized views cannot carry RLS in PostgreSQL**, and it sits
  in `public`, so PostgREST served it to anon. 040 revokes it (no app code
  queries it).
- `theme_progress_summary` (`005:10`) carries a comment asserting it "inherits
  RLS from underlying table." That is false: views default to
  `security_invoker = false`, so policies evaluate as the view's *owner*,
  bypassing RLS entirely. 040 sets `security_invoker = true`.

### R2-3. HIGH — the GitHub token was returned in an API response (fixed)

`profiles.ts` used a bare `.select()` (≡ `select("*")`) and returned the row to
the caller, so `PATCH /api/profiles/{self}` with `{"display_name":"x"}`
answered with the caller's plaintext GitHub token — into devtools, HAR
exports, and any frontend error reporter capturing response bodies. Now an
explicit column list.

Still open on this column: it is stored **plaintext** and is readable directly
by the browser (`select("github_token")` works for your own row, since the RLS
policy is row-level with no column restriction). Encrypting it is Tier 2.

### R2-4. P0 LEGAL — these are not code problems and need an advisor

An advisor who knows your establishment country should see these before you
sell to anyone in the EU/UK. I am flagging exposure, not giving legal advice.

- **No tax handling of any kind exists.** Zero matches for `automatic_tax`,
  `tax_id_collection`, or `billing_address_collection` in the repo. EU VAT on
  digital services is due at the *buyer's* rate from the **first sale** — the
  €10k threshold applies only to EU-established sellers. Unremitted VAT comes
  out of your margin retroactively and OSS registration cannot be backdated.
  Your own `docs/prd.md:528` risk register already prescribed "Use Stripe Tax";
  it was never implemented. (2026-07-22: the merchant-of-record route was
  assessed as the alternative — Lemon Squeezy rejected as a sunset product
  post-acquisition; Stripe Managed Payments costs 6.4% + 30¢ vs ~3.7%
  all-in for Stripe + Stripe Tax. Resolution remains Stripe Tax + OSS
  registration, or geo-gating EU checkout at launch. Analysis:
  `docs/roadmap.md` §4.)
- **The refund terms are unenforceable against EU/UK consumers as written.**
  "14 days *if less than 20% accessed*" (`terms/page.tsx:90`) only holds if the
  buyer expressly waived the withdrawal right and acknowledged losing it.
  Nothing collects that waiver. So today every EU buyer keeps a full,
  unconditional 14-day right regardless of how much they consumed — and
  presenting the 20% condition as binding is itself an unfair commercial
  practice.
- **No legal entity, address, or jurisdiction clause anywhere** in terms or
  privacy. Required pre-contract disclosure under the Consumer Rights and
  E-Commerce Directives.
- **No receipt or invoice is sent.** The "confirmation" at `payments.ts:676`
  fires a Kit *tag*, and the Kit automations do not exist yet — so buyers
  currently receive nothing. A leading cause of chargebacks.
- **No postal address in the weekly digest** — CAN-SPAM requires one in every
  commercial message, and the digest is live.
- **Waitlist consent escalation:** `subscribed` defaults to `true` and the
  sender ignores `theme_id`, so someone who asked to be told when one theme
  ships is auto-enrolled into a newsletter carrying discounts.

### R2-5. HIGH OPERATIONAL — you would not know anything broke

- **Zero alerting.** Sentry captures; nothing notifies. A failing Stripe
  webhook, a 500 spike, or a payment failure would reach you only via a user
  email. `pre-launch-checklist.md:561` already specifies the three rules
  needed; §B10 remains unticked.
- **8 of 11 error boundaries never reported to Sentry** — including `/pricing`
  and `/paywall`. A nested boundary stops propagation, so crashes on the two
  revenue routes were swallowed before the root boundary saw them. **FIXED.**
- **No record of which migrations are applied.** No `schema_migrations`, no
  CLI state, no CI step; four docs disagree and the newest stops at 026. With
  40 migration files and manual SQL-editor application, **nobody can state the
  production schema**. 037, 038, 039 and now 040 are all pending. Reconcile
  before applying anything.
- **Vercel Hobby.** `docs/infrastructure.md` records the web app on the free
  tier. Hobby prohibits commercial use, and you sell a $59-159 product — a ToS
  and takedown risk before it is a cost one.
- **Fly is `iad`, Supabase is `eu-west-1`** (per `supabase/.temp/pooler-url`),
  though `infrastructure.md` claims co-location. Every API→DB query crosses
  the Atlantic.
- **Health check gates Fly liveness on a DB query**, so a Supabase blip kills
  the whole API fleet instead of riding it out.

### R2-6. Resolved, not a bug

- **Dependency CVEs: clean.** `pnpm audit` → 0 vulnerabilities across 938
  deps. The "91 Dependabot alerts" note in project memory is **refuted** —
  they were fixed via an 18-entry `pnpm.overrides` block.
- **The lesson SSG/dynamic contradiction is benign.** `prerender-manifest.json`
  lists **0** lesson routes: `cookies()` forces dynamic rendering, so no
  per-user paywall state is baked into shared HTML. The cost is that
  `generateStaticParams` buys nothing and the "edge cache" comment is false —
  a perf issue, not access control.
- **No price tampering, no IDOR, no XSS, no committed secrets, no open
  redirect.** Verified explicitly.

### R2-6b. Runtime correctness — fixed this round

- **Every OG image sitewide was blocked from crawlers.** `robots.ts` carried a
  blanket `Disallow: /api/`, and every OG/Twitter card on the site is
  generated at `/api/og?...`. Every share card you or anyone else posted would
  have rendered imageless — directly undercutting the distribution phase.
  Fixed with an explicit `Allow: /api/og`.
- **Free signed-in users were shown modules 2-4 as unlocked, then bounced.**
  The theme map gated on `isFoundationsModule` (`track === "foundations"`,
  which spans deep-orbit modules 1 *through 4*) while the lesson route gates
  on `mod.order > 1`. So immediately after the free-account CTA converted
  someone, they saw three more modules apparently available and hit a paywall
  on click. Anonymous visitors were unaffected, which is why every
  anonymous-path check passed. Map now uses `mod.order === 1`.
- **`/certificates/<uuid>` returned a raw 500** when the API was unreachable —
  no try/catch around the fetch — on the most-shared surface in the product.
  Now rethrows into a new `certificates/error.tsx` that says "temporarily
  unreachable" with a retry, rather than 500ing or (worse) claiming the
  credential does not exist.
- **Organization JSON-LD asserted `logo.png`, which 404s** (there is no PNG in
  `public/` at all). False structured data and a failed rich result. Removed.
- **Extras breadcrumb JSON-LD pointed at a 404** — `/extras/<module>` has no
  route — from all 21 extras lessons. Level removed.

Still-open items from this sweep were folded into the Tier 2 list below
(2026-07-22) so this document has exactly one week-1 list.

Also worth knowing: `apps/web/app/metadata.test.ts` passes 21/21 while every
metadata defect above survived it — it reads exported objects in isolation,
tests zero `generateMetadata` functions, and never imports 10 of the routes.

### R2-6c. Accessibility & compatibility — one outage-class bug, fixed

- **White screen on every route for anyone blocking site data.**
  `theme-provider.tsx` guarded `typeof window` but not the `localStorage` call
  itself. `localStorage` does not return null when site data is blocked — it
  **throws SecurityError** (Safari "Block All Cookies", Chrome site-data
  blocking, enterprise policy, any sandboxed iframe). That read is the
  `getSnapshot` of a `useSyncExternalStore` in a provider wrapping the whole
  app, so it threw **during render** and unwound to `global-error.tsx`: an
  unrecoverable white screen on every route, including /terms and /privacy.
  The inline bootstrap at `layout.tsx:111` already wraps this same API in
  try/catch, as do ~25 other storage sites — this one was missed. **FIXED**,
  2 regression tests.
- **The exercise editor mounted twice on mobile — on the graded path.**
  `LessonShell` renders `right` at every width, while `lesson-steps` *also*
  embeds the same pane behind a mobile toggle. Measured at 375px: two
  `.sp-wrapper`, two "Run Tests", two `role="status"` regions — two code
  buffers racing on one `tc-code-{slug}` key, breaking the single-submit
  invariant the code itself asserts. Desktop was always correct, which is why
  desktop-only e2e never saw it. **FIXED** (pane slot is now `hidden lg:block`),
  2 regression tests.

Still-open mobile/a11y items from this sweep were folded into the Tier 2
list below (2026-07-22).

Two structural notes worth more than any single item (**both since resolved —
see R3-10**: runner timeout is 30s with an honest "Downloading TFJS" label;
webServer timeout is 180s and the 28/28 axe matrix genuinely runs):

1. **The 1.47 MB TFJS bundle downloads inside the exercise runner's 10s
   timeout.** On 3G that download alone is ~30s, so every slow-connection
   learner's first "Run Tests" fails as "Timed out after 10 seconds" —
   misattributed to their code.
2. **The e2e accessibility gate fails open.** `playwright.config.ts` allows
   30s for `webServer`, against measured cold compiles of 19-154s. When it
   times out the result reads as infra flake, not as "accessibility was never
   checked" — and the ten specs that never ran cover Themes, Theme Detail,
   Pricing and all six lesson steps, i.e. the entire paid surface. Only
   Landing, Auth, Terms and Privacy are actually verified.

Also corrected: `docs/browser-support.md` claims a Chrome/Firefox/Safari/Edge
CI matrix. Reality — `playwright.config.ts` defines chromium plus three WebKit
projects, and **all three WebKit projects are `testMatch: /mobile\.spec\.ts/`**,
so WebKit only ever runs the mobile smoke suite. **Firefox has zero automated
coverage.** There is no `browserslist` in the repo, so the stated floors are
unenforced.

### R2-7. Also fixed this round

- **Kit tags could be permanently lost.** `/api/email` answers
  `200 {skipped:true}` when a tag id is unset — the default, since
  `KIT_TAG_PAYWALL_HIT` / `KIT_TAG_MODULE_1_COMPLETE` are undocumented. The
  client treated that 200 as success and burned a permanent dedupe flag, so
  configuring the secret later could never recover those users. Now centralised
  in `lib/kit-tag.ts`, which records the flag only on a real tag. 6 tests.
- **Sign-in could strand users forever** — `auth-form.tsx` lacked try/finally,
  so a throw left the button spinning with no error and no retry, on the front
  door. Resend now also confirms success.
- **`signup_completed` fired nowhere**, making the signup conversion rate
  uncomputable and the `tech-spec.md` KPI formulas undefined. Now fired on
  session establishment.
- **Middleware ran on `/vendor/*` and `/models/*`**, costing an edge
  invocation plus a GoTrue call per static asset. Matcher tightened.
- **`immutable` cache headers** added for `/vendor` and `/models`.

---

## ROUND 3 (2026-07-25, delta re-audit) — THE CODEBASE MOVED PAST THE LIST

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
hold** — nothing regressed across the churn.

### R3-1. CRITICAL — the API cannot deploy: Dockerfile references a deleted package

`apps/api/Dockerfile:10` still COPYs `packages/github/package.json`, but
`24d45e4` deleted `packages/github/` entirely (dead code — zero source imports;
the dependency and lockfile entries were removed in the same commit). Docker
COPY of a missing path fails the deps stage, so **any `fly deploy` from HEAD
fails** — the Stripe-webhook host cannot ship the tax-capture code or any other
fix. One-line fix: delete the COPY line. (The stale `docs/tech-spec.md` and
root `tsconfig.json` references to the deleted package were removed in the
same sweep.)

### R3-2. HIGH — migration 047 is deploy-order blocking (supersedes "none of 045-048 is launch-blocking")

`payments.ts:670-684` (sync) and `:912-935` (async) include `tax_amount`,
`tax_country`, `customer_tax_id` in the purchases upsert **unconditionally** —
the keys are present even with the tax flag off. If this API deploys before 047
is applied, every `checkout.session.completed` upsert fails (PGRST204 unknown
column) → handler returns 500 → Stripe retries exhaust → **customer charged,
purchase never recorded, no access granted.** `payments.test.ts` 34/34 is blind
to this (mock DB accepts any columns). The 043 write is accidentally safe only
because its result is never inspected — which is its own bug (R3-4e).
**Order: apply migrations 037-051 first, then deploy the API.** (Range updated 2026-07-25 — an earlier revision said 037-048, predating 049-051.)

### R3-3. HIGH — Stripe Tax code now EXISTS, flag-gated, ~~documented nowhere~~ (**documented 2026-07-25** in `.env.example` + deployment-guide with prerequisites; remaining work is the operator half — dashboard Tax setup, OSS decision, flag flip)

R2-4's "no tax handling of any kind exists" is stale as written:
`payments.ts:47-55` `taxSessionParams()` sets `automatic_tax`,
`billing_address_collection: "required"`, `tax_id_collection`,
`invoice_creation`, spread into both session creates; the webhook persists the
tax columns and `stripe_customer_id`. All of it is behind
`STRIPE_TAX_ENABLED === "true"` — **default OFF**, absent from every
`.env.example` and operator doc (only the scalability audit mentions it).
Unset → checkout silently collects no tax (the R2-4 exposure persists while its
fix sits dark). Set `true` before the Stripe-dashboard Tax setup → session
creation fails (checkout outage). Tier 1-LEGAL items 1-2 are now
"advisor + dashboard + flag flip", not "write code".

### R3-4. Money-path defects in the new payments.ts — **ALL SIX FIXED 2026-07-25** (payments.test.ts 41/41)

> a) dispute zero-row → 500 retry (mirrors the refund fix) · b) pending
> writes now ON CONFLICT DO NOTHING (demotion race closed at the DB call) ·
> c) sync path guards duplicates like async (`existingRow?.status !==
> "completed"`) · d) `failed` sessions render "Payment Didn't Go Through" +
> back-to-pricing, never the poller · e) `stripe_customer_id` write error is
> inspected + logged · f) checkout reuses the stored Stripe Customer with a
> retry-without fallback. Original findings retained below as the record.

- a) **`charge.dispute.created` matching zero rows is ACKed** (`:855-874`, no
  zero-row check, returns 200) — access never revoked, no Stripe retry. The
  identical bug in `charge.refunded` was fixed in run #7 (`:810-825` 500s);
  the dispute handler never got the fix.
- b) **`completed` → `pending` demotion race** on delayed methods: retried
  `checkout.session.completed` (unpaid) interleaving with
  `async_payment_succeeded` can overwrite `completed` with `pending`; trigger
  038 guards only terminal statuses. SEPA/bank-debit buyer permanently loses
  access. Millisecond window.
- c) **Sync path re-fires the PAYMENT_COMPLETED revenue event + Kit
  confirmation email on webhook re-delivery** — the async handler has the
  duplicate guard (`:942`), the sync handler doesn't. Revenue double-count in
  the server "source of truth" event.
- d) **A `failed` (async_payment_failed) purchase renders "Almost There" +
  poller** — a bounced payment reads as "still confirming".
- e) **The `stripe_customer_id` persistence error path is dead code** —
  supabase-js returns errors, doesn't throw; the result is never inspected, so
  043-unapplied (currently true in prod) is a silent no-op with no operator
  signal.
- f) **No `customer:` reuse at checkout** — with `invoice_creation` on, Stripe
  mints a new Customer per purchase; repeat buyers accumulate duplicates.
  Footgun for the H1 subscriptions the 043 column exists for.

### R3-5. MEDIUM — `profiles.stripe_customer_id` was client-writable (billing-linkage poisoning) — **FIXED in code 2026-07-25: migration 049** extends the 040 trigger to clamp it (apply with the pending batch)

040's trigger clamps only `role`; no column-level revoke exists on `profiles`.
Any signed-in user can pre-set their own row's `stripe_customer_id` to a
victim's `cus_...` via PostgREST, and the webhook's
`.is("stripe_customer_id", null)` guard then **permanently blocks the
legitimate capture**. Inert in V1 (nothing reads the column); must be closed
before subscription/seat billing ships — extend the 040 trigger to clamp
server-owned columns, or `revoke update(stripe_customer_id)`.
Everything else in 041-048 audited clean: 044/046/048/042 have correct
RLS/grants/WITH CHECK, no new SECURITY DEFINER exposure (046's hook is
supabase_auth_admin-only), every down migration exactly reverses its up (no
019-style signature mismatch), 047's columns sit on write-locked `purchases`.

### R3-6. New surfaces shipped un-instrumented / un-hardened — **MOSTLY FIXED 2026-07-25**

> Fixed: `journey_enrolled` + `script_skipped` events added to the typed
> registry; `getJourneyState` now throws on lookup errors (new
> `journey/error.tsx` boundary; regression tests); ring pct clamped AND
> orphan lesson rows filtered against the live corpus (journey-progress);
> enroll button re-arms on auth redirect and after refresh; onboarding
> retries a failed `refreshSession` once and warns; `capstone-email-tag`
> migrated to `tagKitEventOnce`. ~~Still open: completed_at writer;
> axe/e2e coverage~~ — **both closed later the same day (run 2)**:
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
- **Onboarding ignores `refreshSession()` failure** (`page.tsx:235`) — with
  hook 046 enabled, a failed refresh leaves the stale `onboarding_completed:
  false` claim bouncing the learner back into the wizard until token expiry.
- **`capstone-email-tag.tsx:10-28` still burns its Kit dedupe flag before the
  request** — the exact R2-7 defect class, never migrated to `lib/kit-tag.ts`;
  the `capstone` tag is unrecoverable for browsers that visit before the Kit
  env vars are configured (that window is live until Tier 1-OPS closes).

### R3-7. Runtime/SEO delta — **MOSTLY FIXED 2026-07-25**

> Fixed: full openGraph+twitter blocks on theme detail / lesson / learn /
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

- **og:url shallow-merge drop on the 4 highest-share routes**: theme detail,
  every lesson, `/learn`, capstone declare images-only `openGraph`, which
  replaces (not merges) the parent — og:url/type/siteName vanish and the
  homepage Twitter card is inherited. The fix pattern exists in the repaired
  routes; these four were skipped.
- **Skill-genome inflation**: the step-5 completion effect refires per revisit
  and per repeated passing run (`lesson-steps.tsx:314-353`, `:401-407`);
  `skill-events.ts:139` raw-inserts and 014 SUMs with no dedupe — reopening a
  finished lesson 10× adds +40 proficiency, and completion analytics inflate
  from day 1. Dedupe/guard before real users generate genome data.
- **Two Sandpack editors mount at every width** — the R2-6c fix is CSS-only
  (`hidden` classes); rotate/resize across `lg` shows a stale buffer (restore
  is mount-once), and the graded path pays doubled CPU/memory. Regression
  tests assert classes, not mount counts.
- Smaller: `session-toast.tsx:15` timer never cleared (re-fire hides fresh
  toast, setState after unmount) · `particle-field.tsx` runs
  `getComputedStyle` every rAF frame on the landing hero and never re-checks
  reduced-motion (violates the contract in `effects/index.ts:9-12`) ·
  duplicate `Course` JSON-LD on all five theme slugs (layout array + page,
  different names/offers) · bundles still emit `PreOrder` on hard-disabled
  2/3/5-theme buttons and coming-soon themes still assert `price: "59"` in two
  places · `pending-poller.tsx:54-58` mounts `role="status"` with its content
  (unreliable announcement, on the lost-webhook recovery moment) ·
  `deep-scan-demo.tsx:134-143` fires one `setRows` after unmount ·
  `ticker.tsx` is dead code with an ungated rAF loop if ever remounted ·
  `use-attribute-observer.ts:54-57` hardcodes its attributeFilter while
  accepting arbitrary attribute args.

### R3-8. Privacy/legal delta (fold into Tier 1-LEGAL)

Legal pages unchanged since March/April — they now lag four new data
categories: `tax_country` + `customer_tax_id` (047), full billing address once
the tax flag flips, `stripe_customer_id` (043), `arena_submissions.
submitted_code` (048). Privacy §7's "remove your personal data within 30 days"
**conflicts with ~10-year VAT/OSS record retention** — the future deletion
endpoint must carve out tax records (advisor). GitHub integration creates
**public** repos by default (`lib/github.ts:259`) with zero terms coverage,
and privacy's "industry-standard OAuth 2.0 / PKCE" line is a written security
representation contradicted by the recorded plaintext, browser-readable
`github_token`. Arena's planned public leaderboard needs UGC/moderation/
retention terms before that feature ships (not before launch — no arena UI
exists).

### R3-9. Ops/CI delta — **FIXED 2026-07-25**

> CI installs chromium+webkit; new `migrations` CI job runs
> `pnpm migrate:status` (script now exits non-zero under CI when secrets
> are missing — fail closed, never silent green). **Operator: add
> `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as GitHub Actions secrets or
> this job stays red by design.** Guest purchase email falls back to the
> production domain instead of a broken relative link; `infrastructure.md`
> query-cache and `tech-spec.md` packages/github references removed.
> Original findings below as the record.

- **CI installs only Chromium** (`ci.yml:77`) while two Playwright projects
  (iPhone SE, iPad) are WebKit — on any browser-cache miss the mobile e2e
  fails "Executable doesn't exist"; the mobile gate is riding a stale cache.
- **`pnpm migrate:status` exists and is correct** (numeric sort, down-file
  exclusion, drift detection) **but is not a CI step** — the ledger gate the
  script was built for is unwired. Nit: offline mode exits 0, so a CI job
  with missing secrets would silently pass.
- **Guest purchase email builds its access link from `APP_URL ?? ""`**
  (`payments.ts:498`) — unset means a paying guest gets a broken link with no
  error anywhere (every other APP_URL site fails loud).
- `docs/infrastructure.md:17` still lists the Redis "query cache" deleted in
  24d45e4.

### R3-10. Stale-entry sweep — recorded OPEN, actually FIXED (docs overstated risk)

Verified against code at HEAD; the Tier 2 bullets below have been edited to
match.

- **e2e a11y fail-open**: `playwright.config.ts:74` webServer timeout is
  180s since 1c43c8f (same day as the audit); the 28/28 axe matrix genuinely
  runs. R2-6c structural note 2 is historical.
- **Exercise runner timeout**: now 30s with a "Downloading TFJS runtime
  (first run)..." button label — the 3G misattribution is mitigated (no
  prefetch yet; R2-6c structural note 1 downgraded, not gone).
- **Tier 2 SEO bullet, 5 of 7 sub-items**: capstone excluded from sitemap;
  `session_expired` only set when an `sb-` cookie existed; coming-soon themes
  emit `OutOfStock`; `numberOfCredits` removed; og:url fixed on
  pricing/about/compare/themes/journey/certificates (remainder → R3-7).
- **Tier 2 Mobile/a11y bullet, 6 of 7 sub-items**: step bar wraps at 320px
  (24×24 targets); waitlist input has a focus outline; hint/recall/magic-link
  reveals use the always-mounted live-region + focus-move pattern;
  `aria-pressed` on purchase toggles; sr-only `<h1>` per lesson step;
  `--tc-border-interactive` token (#808080 dark / #8a8a8a light) clears 3:1 on
  every genuine control in both schemes. Remaining: 13px editor type (now in
  BOTH Sandpack themes) and no mobile-viewport axe run.
- **Opacity-dimmed text**: re-census at HEAD finds the 41-site figure
  obsolete — 22 sites remain, all ≥/65 alpha computing 4.96-11.4:1 in both
  schemes; the cited failures (landing "Notify me", ticker @40, bridge tiles)
  are gone or exempt-class. Residual: dark accents on overlay surfaces at
  3.99-4.23:1 (text-size use only).
- **"No server-side timeouts anywhere"**: GitHub lib now has 15s
  `AbortSignal.timeout` on all 8 fetch sites + retry/backoff. Kit, Resend,
  Upstash, Supabase remain timeout-less — the hung-Kit-in-webhook case
  stands.
- **`GITHUB_PRIVATE_KEY` name trap inverted**: no code reads any GitHub App
  key var anymore (sole reader deleted with `packages/github`); but
  `.env.example` and two docs still tell the operator to provision the dead
  secrets. OAuth vars (`GITHUB_CLIENT_ID/SECRET/CALLBACK_URL`) are the live
  ones.
- **Upstash "code throws" framing was wrong**: every call site catches —
  missing Upstash env means the API boots and serves with rate limiting +
  JWT cache **silently disabled** (a security degradation, not an outage).
  `infrastructure.md:136` ("will not start without") is false.
- **`cache.ts` latent landmine**: file deleted, zero references — resolved.
- **Counterfactual feature silently removed**: client deleted in 24d45e4,
  zero code references remain; table 031 + generated types + backlog
  mentions survive as debris. Update memory/backlog; drop the table in a
  future migration or document it as intentionally dormant.
- Light-mode additions audited clean: every storage/matchMedia touch guarded
  (SecurityError-safe), no FOUC/hydration path found, OG/favicon stay dark
  as decided, light palette gated by 124 assertions. Light-scheme residuals:
  decorative `--tc-border` #d8d8d4 is 1.31:1 (same deliberate split as dark;
  a few interactive stragglers still use it — landing secondary CTAs, picker
  toggle unselected, scheme toggle, poller support link), and
  `e2e/visual/responsive.spec.ts` has no light baselines; all non-axe e2e
  still runs dark-only via the global `colorScheme: "dark"` pin.

---

## ROUND 3, RUN 2 (2026-07-25, verification pass) — the audit audited itself

A second same-day pass re-verified the Round 3 remediation (three agents:
doc-vs-code truth walk, fresh gap sweep, adversarial diff review) and closed
what it found. Battery after: typecheck 10/10, vitest 1560+ green,
payments.test.ts 44/44, `pnpm audit --prod` clean.

**Doc-truth walk:** zero FIXED claims were false; five fixes were
UNDERSTATED (doc listed them open) and are now reconciled above; the one
dangerous doc bug — R3-2 still instructing "apply 037-048" after 049/050
existed — is corrected (the range is **037-051**).

**New findings, all fixed in code this pass:**

- **F1 HIGH — the digest sender could not record a failure and had no
  throttle.** The Resend SDK never throws (429/4xx/5xx resolve
  `{data:null, error}`); `error` was ignored, so `failed` was structurally
  unreachable — a fully-rate-limited launch blast would report
  `sent:500, failed:0` with zero Sentry captures, on the cold domain the
  warmup plan worries about. Now: `error` inspected + captured, 600ms
  spacing between sends (Resend limit is 2/s), regression test encoding the
  real SDK contract. Same class fixed in `sendIssueNotification`.
- **F2 — a WON dispute could never restore access.** No
  `charge.dispute.closed` handler existed, and 038's trigger silently
  clamped any manual repair back to "disputed" (`UPDATE 1`, no effect).
  Fixed with **migration 051**: a transaction-local escape hatch in the 038
  trigger + a service-role-only `restore_purchase_after_dispute(pi)` RPC —
  NOT a blanket service-role exemption, which would have re-opened the
  run-#7 race the trigger exists to close. New webhook handler restores on
  `won` (500-retries on zero rows / missing migration), no-ops on `lost`.
  3 tests.
- **F3 — the 040/049/051 clamps also block the OPERATOR's own SQL-editor
  updates** (sessions run as `postgres`, `auth.role()` is null → treated as
  a client; role promotions and customer-id repairs silently no-op). For
  purchases, `select public.restore_purchase_after_dispute('pi_...')` is
  the sanctioned path; for profiles.role/stripe_customer_id use PostgREST
  with the service key or `set local request.jwt.claims`. Recorded in the
  051 header; fold into the migration runbook when next touched.
- **F4 — `/api/og` + the one-click unsubscribe POST paid middleware + a
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
  admin digest lesson links fixed to `/themes/...` (was the 404ing
  `/learn/...` form).

**Adversarial diff review of the remediation itself** found three defects in
the run-1 fixes, all fixed same-pass:

- **D1 — the skill-genome refire guard was defeated by its own mount
  order** (the restore effect's `setCurrentStep(5)` lands after the
  completion effect stamps prev=0, so restored mounts still read 0→5 and
  fired; verified empirically). Now a `restoredAtFinalStepRef` consumed by
  the completion effect suppresses exactly the restored arrival; **2
  regression tests, including one that fails against the run-1 code.**
- **D2 — the first-pass dedupe put state in the callback deps**, giving
  `handleExerciseComplete` a new identity per pass and remounting the whole
  MDX subtree — wiping the "All tests passed!" panel the instant it
  appeared. Dedupe moved to a ref; callback identity stable again.
- **D3 — "the webhook re-captures the fresh Customer" was false**: the
  `.is(null)` capture guard meant a stale id was never repaired. The
  checkout fallback now clears the stale id (service-role, permitted
  through the 049 clamp) so the next webhook capture works.

Accepted-risk notes from the same review (recorded, not fixed): concurrent
same-event deliveries can still double-fire the revenue event (TOCTOU window
matching the async handler's pre-existing guard; sequential retries — the
common case — are deduped); a dispute whose intent matches no row 500s for
Stripe's ~3-day retry window then drops (same contract as the refund fix);
`APP_URL` unset on a STAGING deploy now mails production links to guests
(deliberate production-first trade); in-session 4→5→4→5 navigation re-fires
completion signals (requires real navigation, not reloads).

**Known-red by design:** the CI `migrations` job until the two Supabase
secrets exist (fork PRs will always fail it). If `pnpm audit` goes red in CI
later, that is a NEW advisory — the intended behavior, not a broken gate.

---

## ROUND 3, WAVE 3 (2026-07-25) — the fresh-eyes ledger executed

The owner directed that every item in
`docs/audits/fresh-eyes-rerun-2026-07-25.md` be worked; everything not
requiring the owner is now in code (the ledger carries the full EXECUTED
annotation at its top — read it there; this entry only records the deltas
that touch THIS document's lists):

- **Pending migrations are now 037–055.** 052 entitlement-provenance
  columns (irreversible list #1/#2) · 053 `payment_events` webhook
  idempotency (#6; wired into both settle paths — closes the accepted
  TOCTOU from run 2) · 054 bounds `exercise_attempts.submitted_code`
  (register P2) · 055 skill-genome normalization (T1-21; asymptotic curve
  replaces the clamp that pinned every finished theme's axes at 100).
- **New workflows:** `deploy-api.yml` (manual deploy gated on ZERO pending
  migrations — the §7 "breaks first on deploy day" ordering is now
  mechanical, needs `FLY_API_TOKEN` as a third secret) ·
  `partitions.yml` (monthly `ensure_skill_events_partitions()` — the
  2027-04 partition cliff now has a caller).
- **Refund terms simplified in code** (T0-8): the unenforceable 20% clause
  is GONE from terms/pricing/FAQ — the Tier 1-LEGAL refund item is now
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
> executes under `docs/marketing-plan.md` — the reach-flavored Tier 1-OPS
> checkboxes above remain the launch-gating subset of that plan. "Buy your
> own product twice" is sequenced AFTER testing completes.

**Owner-only remainder (unchanged in nature, restated):** apply migrations
**037–055** then deploy via the new workflow; GitHub secrets
(`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FLY_API_TOKEN`); Stripe
dashboard (Tax setup, receipt toggle, SEPA decision) + `STRIPE_TAX_ENABLED`
flip; Kit dashboard emails (T0-2, the "highest ratio of customer-facing
words to reviewed words"); buy the product twice (T0-3); ~~real name on
/about~~ — **RESOLVED 2026-07-25 by owner decision: identity stays
private.** /about now opens with the collective origin story ("built by a
group of frontend engineers…"); do not add a personal name without asking;
~~manual light-mode + 375px pass~~ — **DONE 2026-07-25, owner-verified
clean** (8 core routes at phone width in light scheme; no defects
reported); Tier 1-OPS accounts; Tier 1-LEGAL
advisor items; ~~theme-2 build-or-reprice decision~~ — **DECIDED
2026-07-25: theme 2 is DEFERRED until theme 1 is launched, distributed to
at least 200 users, and the data is collected.** Until that gate: bundles
stay `disabled` (already true in source), pricing keeps the honest
OutOfStock markup, and no theme-2 authoring starts. Cost basis when the
gate opens: `docs/theme-launch-checklist.md`.

---

## Tier 1 — STATUS: ALL SIX FIXED IN CODE (2026-07-21)

Typecheck 11/11, 1367 unit tests passing. (Re-verified 2026-07-25 at HEAD
`24d45e4`: typecheck 10/10 — task count changed, all green — vitest 1553
passed; all six fixes hold, see R3.)

**BLOCKING STEPS AS OF 2026-07-25 (order matters):**

1. ~~Fix `apps/api/Dockerfile:10` (R3-1)~~ — **FIXED in code 2026-07-25**
   (COPY line removed; base image also bumped `node:20-alpine` →
   `node:22-alpine`, Node 20 being EOL since 2026-04 — scanner CVE count
   24 → 5; CI workflows bumped to node 22 to match).
2. Apply migrations **037–051** to production Supabase (039 keeps item 1
   below live until applied; **047 must precede the next API deploy or every
   purchase 500s post-charge**, R3-2; 049 = stripe_customer_id clamp, 050 =
   waitlist consent default, 051 = dispute-won restoration — the new
   `charge.dispute.closed` handler 500-retries until 051 exists; all three
   added 2026-07-25).
3. Then deploy the API.

Details of each item, retained as the record of what was wrong and why.

### 1. SECURITY: world-callable `SECURITY DEFINER` functions

Migration `036` documents this exact vulnerability class in its own header, then fixes exactly one function — it is the only `revoke` in the entire schema. Postgres grants `EXECUTE` to `PUBLIC` by default, so PostgREST exposes these at `/rest/v1/rpc/<name>` to `anon`:

- `refresh_dashboard_stats()` (`012_scalability_indexes.sql:48`) — no arguments, no guard, forces `REFRESH MATERIALIZED VIEW CONCURRENTLY` over all of `theme_progress`. One HTTP POST in a loop pegs the database. **Trivial denial of service.**
- `compute_user_skill_genome(p_user_id uuid, p_theme_id text)` (`014_skill_genome_computation.sql:6`) — accepts an **arbitrary user id** with no `auth.uid()` check, ~19 scans per call.
- `ensure_skill_events_partitions()` (`013:84`) — executes DDL.

The Hono rate limiter does not protect this. PostgREST is a separate public endpoint reached with the anon key that ships in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

**Fix:** new migration revoking `EXECUTE` from `public, anon, authenticated` on each, granting to `service_role` where a server caller exists. Follow the pattern in `036`.

### 2. Total-outage single point of failure

`apps/web/middleware.ts` calls `auth.getUser()` (a network call to GoTrue) with **no try/catch and no timeout**, and its matcher excludes only `_next/*` — everything in `public/` still triggers it. If Supabase Auth is slow or down, **every request 500s, including the static landing page**.

**Fix:** wrap in try/catch, fail open to an unauthenticated render; tighten the matcher to skip `public/` assets.

### 3. Paying customers get shown the paywall

`apps/web/lib/progress.ts:55-69` destructures only `{ data }` and returns `!!data`. Any transient error — network blip, RLS hiccup, PostgREST 5xx — is indistinguishable from "never purchased", so `themes/[slug]/page.tsx:61` renders the theme **locked for someone who paid**. No error state, no retry, no way for them to tell. Same discard at `dashboard/page.tsx:50-56`.

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

`themes/[slug]/[module]/[lesson]/page.tsx:293` tells learners "your progress is not saved." It **is** saved — `lib/guest-progress.ts` persists it and `components/guest-progress-bridge.tsx:20-69` replays it into `theme_progress` after signup. `GuestModuleBanner` even says the opposite. The false message is the more prominent of the two, and it discourages starting.

**Fix:** correct the copy to match actual behaviour.

---

## Tier 1 — ALREADY FIXED 2026-07-21

Recorded so they are not re-litigated.

- **Analytics was dark for every first session.** Consent was read once in a mount-only effect; a first-time visitor had no consent key, so it returned early and never re-ran — accepting the banner only wrote localStorage. The entire first session (land → read → hit paywall → decide) emitted **zero events**. Fixed via `lib/consent.ts`; 7 regression tests.
- **Pageviews were double-counted** — two providers both capturing `$pageview`; every conversion denominator was 2× too large. Duplicate deleted.
- **`paywall_hit` never fired since launch** — its only call site was in a component the route stopped rendering. Now fires from `<PaywallNotice>`.
- **Stripe abandoned-cart recovery was off**; **no intent tags existed**; **FAQ was absent from `/pricing`**; **refund badge sat below the grid**; **no audience qualifier**; **no direct buy path from the final landing CTA**. All fixed.
- **Guest checkout was written, then disabled the same day** after review found three post-charge defects. Not on the launch path.

**Consequence for your data:** historical funnel numbers are unreliable, not merely sparse — computed against a doubled denominator, with first-session behaviour never recorded. Baseline from release day forward.

---

## Tier 1-OPS — Operator + distribution setup, do before flipping live

Moved from `docs/post-launch-backlog.md` 2026-07-22. Not code defects:
measurement, email, and reach infrastructure whose value is multiplied by
launch traffic. Launch-day data is unrepeatable, and historical funnel data
has already been written off once (see above) — do not launch dark again.

- [ ] **PostHog:** create project, set `NEXT_PUBLIC_POSTHOG_KEY` (web
  `.env.local` + Vercel). Then verify each of the 10 events appears in the
  dashboard (checklist: `docs/analytics-verification.md`). Free tier = 1M
  events/month.
- [ ] **Success-metrics dashboard + alerts** in PostHog: lesson completion
  (target ≥60%), paid conversion (3%), NPS (≥40), 7-day retention (≥30%),
  30-day retention (≥15%), avg time per lesson, hint dependency, paywall
  conversion. At minimum, payment-failure alerting live before real money
  flows.
- [ ] **Kit (ConvertKit) lifecycle setup.** Manually create the Form + the
  seven lifecycle Tags in the Kit dashboard (`signed_up`, `onboarded`,
  `first_lesson`, `capstone`, `purchased`, `email_alerts`, `weekly_digest`),
  then set `KIT_FORM_ID` + `KIT_TAG_SIGNED_UP` / `KIT_TAG_ONBOARDED` /
  `KIT_TAG_FIRST_LESSON` / `KIT_TAG_CAPSTONE` / `KIT_TAG_PURCHASED` /
  `KIT_TAG_EMAIL_ALERTS` / `KIT_TAG_WEEKLY_DIGEST` env vars (numeric tag
  IDs). API keys already configured. Also set `KIT_WEBHOOK_SECRET` and
  register the bounce webhook per `docs/email-setup.md` §3, plus
  `KIT_TAG_PAYWALL_HIT` / `KIT_TAG_MODULE_1_COMPLETE` (R2-7 made
  missing-tag skips recoverable, but sequences cannot fire on tags that do
  not exist). Purchase is a single theme-agnostic tag in V1 (per-theme
  sequences: `post-launch-backlog.md` §5). Without this, purchases succeed
  but subscribers are never tagged and no lifecycle email fires — including
  the purchase receipt flagged in R2-4. Templates must follow
  `docs/email-templates.md`.
- [ ] **Kit retention automations** A/B/C per
  `docs/email-retention-sequences.md`. Copy drafted, code side live;
  dashboard work only. The sequences target exactly the launch cohort
  (signed up / stalled / finished free tier).
- [ ] **Sentry alerting.** Capture works; nothing notifies (R2-5). Create
  the three alert rules specified at `pre-launch-checklist.md` §B10.
- [ ] **Plausible:** add site `tensorcraft.app`, set
  `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`. ~EUR 9/mo.
- [ ] **Google Search Console:** verify the production domain now — indexing
  lead time is weeks, the clock should start before launch.
- [ ] **Product Hunt "upcoming" page** — follower capture only works
  pre-launch.
- [ ] **Twitter/X account @tensorcraft** — create now (posting cadence can
  wait). Launch execution (`dev-plan.md` §10b) announces on Twitter/X, so
  the account must predate launch; also removes handle-squatting risk. The
  old "DEFERRED to V1.0" note contradicted §10b and is resolved in favor of
  pre-launch (2026-07-22).
- [x] **FAQPage JSON-LD on `/pricing`** — **DONE 2026-07-25**: FaqSection
  now emits the FAQPage markup itself, so `/` and `/pricing` both carry it,
  and the sitewide copy was removed from the root layout (wrong-page
  markup, same class as the Course dedup).
- [ ] **Distribution head start:** write + publish the first blog batch and
  begin the audience track. `roadmap.md` §7: longest lead time in the plan,
  runs in parallel, starts before the code is ready.
- [x] **Apply the pending migrations — DONE 2026-07-25 (ops-deploy session):** 037-055 applied to production in order; `pnpm migrate:status` = IN SYNC 55/55; GitHub secrets set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FLY_API_TOKEN); `deploy-api.yml` ran green; `/api/health` + `/api/health/ready` both 200. Remaining sub-step: enable the 046 Custom Access Token hook in the Supabase Auth dashboard (middleware falls back safely meanwhile). Original text retained below for the record.
- [x] **Apply migration 056 — DONE 2026-07-25:** applied to production via
  the same Node `pg` procedure as 037-055; pre/post state verified in
  `pg_constraint` (delete rule CASCADE → SET NULL, `user_id` now nullable,
  still references `profiles`); `pnpm migrate:status` = IN SYNC 56/56, so
  the deploy-api.yml gate passes again. The deletion endpoint is now safe
  to deploy. Original text: purchases FK → ON DELETE SET NULL so tax
  records survive account deletion — with the old cascade, deleting an
  account erases VAT records the law requires you to keep.
- [ ] ~~**Apply the pending migrations in order — BEFORE the next API deploy.**~~
  The `schema_migrations` ledger now EXISTS (migration 042 built it +
  backfilled 001–041), so this is no longer "establish a ledger" — run
  `pnpm migrate:status`, then apply each PENDING file in numeric order via the
  runbook. Pending as of 2026-07-25: **037–051** (049 clamps
  stripe_customer_id, R3-5; 050 flips the waitlist consent default,
  Tier 1-LEGAL; 051 adds the dispute-won restoration RPC + 038 escape
  hatch, run-2 F2). ~~None of 045–048 is
  launch-blocking on its own~~ — **superseded by R3-2: 047 must be applied
  before the current `payments.ts` ships or every purchase 500s post-charge.**
  046 additionally carries its own operator step (enable the Custom Access
  Token hook in the Supabase dashboard; middleware falls back safely while it
  is off). ~~Wire `pnpm migrate:status` into CI~~ — CI job added 2026-07-25;
  needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` as GitHub Actions
  secrets or it stays red (fail-closed by design, R3-9).
- [ ] **Move Vercel off the Hobby plan.** Hobby prohibits commercial use;
  selling a $59-159 product on it is a ToS/takedown risk before it is a
  cost one (R2-5).
- [ ] **Env-var hygiene** (audit §4; doc side CLOSED 2026-07-25 — remaining
  work is the startup assertion + operator settings): ~~document
  `STRIPE_TAX_ENABLED`~~ (now in `.env.example` + deployment-guide, with
  prerequisites); ~~remove dead GitHub App vars~~ (gone from `.env.example`,
  deployment-guide, pre-launch-checklist); ~~fix Upstash docs~~ (all three
  docs now state the silent-degradation truth); ~~CERT_SIGNING_SECRET in
  deployment-guide~~ (added); ~~CORS_ALLOWED_ORIGINS straggler~~ (fixed);
  ~~KIT_TAG_PAYWALL_HIT / MODULE_1_COMPLETE in .env.example~~ (added);
  ~~rate-limit 60-vs-120 doc split~~ (all docs now say 60, the code truth).
  STILL OPEN: add a startup env assertion (`env.ts`/zod); operator must set
  `SENTRY_AUTH_TOKEN` (absent → production stack traces minified),
  `SUPABASE_URL` + service key on **Vercel** (RFC 8058 one-click unsubscribe
  throws unset — Gmail/Yahoo bulk rules), and `APP_URL` on Fly (guest email
  now falls back to the production domain rather than a broken link, but the
  explicit var is still correct).
- [ ] **Upstash paid plan.** Free tier is 10k commands/day ≈ **1,700 API
  requests** at ~5-6 commands each. Dies on launch day.
- [ ] **Email domain warmup + Postmaster.** §10b plans a launch-week blast
  to 500 waitlist users from a domain that has never bulk-sent — cold
  domain + burst = spam folder at the worst moment. Ramp sends gradually
  over the preceding weeks; register Google Postmaster Tools (added
  2026-07-22).
- [ ] **Create the community space.** The ops cadence
  (`post-launch-backlog.md` §2) says "respond to community Discord
  questions" but no task ever created a Discord — server, channels,
  rules, invite link in the app footer (added 2026-07-22).
- [ ] **Cloud-cost alerts.** Configure billing/usage alerts on Vercel
  (bandwidth), Supabase (egress/compute), Fly, PostHog (1M-event
  overage), Upstash. One viral spike currently produces a surprise bill
  with zero warning (added 2026-07-22).
- [x] **Migration + runbook safety** — closed 2026-07-25: `skill_events_old`
  VERIFIED still existing in production with ZERO rows (PostgREST probe);
  **migration 057** drops it — APPLIED to production 2026-07-26 (table
  re-verified 0 rows immediately before drop; ledger IN SYNC 57/57;
  deploy gate green). The 019 rollback-signature and
  runbook-vs-038 items were superseded earlier: the ledger (042) replaced
  the rollback-SQL page as the source of truth, and migration 051's
  `restore_purchase_after_dispute` is the sanctioned repair path the old
  runbook SQL lacked. Original text below for the record.
- [ ] ~~**Migration + runbook safety** (do with the ledger reconcile):~~
  verify `skill_events_old` was actually dropped (013's DROP is commented
  out — production may carry a full duplicate); fix the 019 rollback
  signature mismatch (`(text)` vs `(p_id uuid)` — it silently succeeds
  leaving the anon-callable function live); reconcile the incident
  runbook's refund-window SQL with migration 038's terminal-status
  trigger, which silently ignores the corrective update.
- [ ] **Verify backups + run one restore drill.** No doc anywhere records
  the Supabase backup tier, PITR status, or a tested restore (gap found
  2026-07-22 — the ops audit covered alerting but not recoverability).
  Confirm the plan includes daily backups, then restore into a scratch
  project once and write the result into `docs/infrastructure.md`.

## Tier 1-LEGAL — advisor + compliance actions before selling in the EU/UK

Action list for the R2-4 findings (R2-4 stays as the findings record;
flagging exposure, not legal advice).

- [ ] Engage an advisor in the establishment country; decide Stripe Tax +
  OSS registration vs geo-gating EU checkout at launch (fee analysis:
  `roadmap.md` §4).
- [ ] ~~Implement the chosen tax handling~~ **Code side DONE (R3-3,
  2026-07-24):** `taxSessionParams()` wires `automatic_tax`,
  `billing_address_collection`, `tax_id_collection`, `invoice_creation`.
  Remaining: Stripe-dashboard Tax setup + OSS registration, document + set
  `STRIPE_TAX_ENABLED=true`, apply migration 047 first (R3-2).
- [x] Refund terms — **RESOLVED in code 2026-07-25 (wave 3):** the
  20%-accessed condition is dropped from terms/pricing/FAQ; refunds are an
  unconditional 14 days via support@. Advisor sanity-check remains part of
  the general terms review, but no waiver mechanism is needed anymore.
- [ ] Add legal entity, postal address, and jurisdiction clause to terms +
  privacy pages.
- [ ] Send a real receipt/invoice on purchase (the Kit receipt automation
  in Tier 1-OPS covers the email; confirm it satisfies invoice
  requirements or enable Stripe invoices — note `invoice_creation` is now
  wired behind `STRIPE_TAX_ENABLED`, R3-3, so flipping the flag covers the
  invoice half).
- [ ] Postal address in the weekly digest footer (CAN-SPAM).
- [x] Waitlist consent fix (code) — **DONE 2026-07-25.** Migration 050 flips
  the column default to false; `submitWaitlist` takes an explicit
  `subscribeToDigest` flag that only the newsletter modal passes, so the
  digest sender's `subscribed = true` filter now selects exactly the
  consented set. OPERATOR DECISION remains: whether to un-enroll the
  pre-050 auto-enrolled rows (one-line SQL in the migration header).
- [x] Self-serve account deletion (code) — **BUILT 2026-07-25.**
  `POST /api/profiles/delete` (typed-DELETE confirmation, ESP cleanup,
  waitlist rows removed by email, auth user deleted) + real Settings flow.
  **Requires migration 056** (purchases FK → ON DELETE SET NULL) so tax
  records survive erasure unlinked (Art. 17(3)(b)) — **056 APPLIED to
  production 2026-07-25** (same session-day as the build; ledger IN SYNC
  56/56), so this is clear to ship.
- [x] GDPR data export (code) — **BUILT 2026-07-25.**
  `GET /api/profiles/export` returns a JSON attachment (account + all 12
  user tables + waitlist rows by email; the GitHub token is disclosed but
  never exported — it is a live credential); Settings has the download
  button. STILL OPEN: DSAR runbook (30-day clock) + unify `privacy@` vs
  `support@` (advisor/copy).
- [x] Vercel Analytics consent gating (code) — **DONE 2026-07-25.**
  `ConsentGatedVercelAnalytics` renders nothing pre-consent and drops
  queued events via `beforeSend` after a withdrawal.
- [x] Consent withdrawal path (code) — **DONE 2026-07-25.** Sitewide
  "Cookie settings" footer control clears the consent key, re-shows the
  banner, and flips every consent gate off in-tab (Art. 7(3)).
- [ ] Privacy-page Art. 13 gaps (advisor + copy): controller identity,
  lawful basis, international-transfer disclosure (EU personal data on
  US-hosted Supabase, disclosed nowhere), complaint right, Art. 27 EU/UK
  representative, waitlist retention.
- [ ] Sub-processor list + DPAs: page omits Resend (live digest sender)
  and Vercel Web Analytics; no DPA in the checklist has been signed.
- [ ] Confirm (don't assume) the EAA microenterprise exemption with the
  advisor — accessibility-statement obligation applies to e-commerce
  since 2025-06-28.
- [ ] **Privacy-page data-inventory update (R3-8, added 2026-07-25):** add
  the new categories — billing country + VAT id (047, once tax flips full
  billing address), `stripe_customer_id` (043), arena `submitted_code`
  retention (048, pre-ship) — and resolve the §7 "30-day removal" clause
  against ~10-year VAT/OSS record retention with the advisor (the deletion
  endpoint must carve out tax records).
- [x] **GitHub integration disclosure (R3-8)** — terms side **DONE
  2026-07-25**: new Terms §6 "GitHub Integration" (public-by-default
  repos, token storage + removal on disconnect, code ownership);
  consent-moment disclosures were already added in wave 3. STILL OPEN:
  privacy's "industry-standard OAuth 2.0 / PKCE" line vs the plaintext
  browser-readable `github_token` (Tier 2 encryption item + advisor copy
  pass).

---

## Tier 2 — Fix in week 1, before spending real money on ads

Not launch blockers. Each one wastes acquisition spend if left.

- **First lesson opens with a ~15.5s auto-playing scene** during which the page is functionally blank, escapable only via a `text-[10px]` "Skip" control. This is the activation moment for the entire product, and it is the destination of the landing page's primary CTA.
- **No email capture for guests anywhere in the free module.** A guest who reads two lessons and leaves is permanently unreachable — no retention sequence can target them.
- **Mobile: code editor sets 13px type**, below the iOS 16px auto-zoom threshold, with no mobile affordance past the mandatory exercise gate — now duplicated in BOTH Sandpack themes (dark + light, `exercise.tsx`). No axe run exists at any mobile viewport (the 28/28 matrix is desktop-chromium only), and all non-axe e2e runs dark-only via the global `colorScheme: "dark"` pin.
- **Lessons ship ~100 indexable words** (only the current step is in the DOM) and require JS to render at all, with no `<noscript>`. Large organic-acquisition loss for a content-led product.
- **SEO/metadata + funnel polish** (folded from R2-6b, 2026-07-22; **re-baselined 2026-07-25 — 5 of 7 sub-items were already fixed in code, see R3-10**). Still open: a guest who finishes module 1 sees "Continue M1" pointing backwards; **og:url shallow-merge drop on theme detail / every lesson / `/learn` / capstone** (images-only `openGraph` wipes url/type/siteName and inherits the homepage Twitter card, R3-7); duplicate `Course` JSON-LD on all five theme slugs; bundles still emit `PreOrder` on hard-disabled buttons and coming-soon themes assert `price: "59"` in two places. Fixed and removed from this list: capstone sitemap 307, `session_expired` for first-timers, `PreOrder`→`OutOfStock` on coming-soon themes, `numberOfCredits`, og:url on pricing/about/compare/themes.
- **Load test before ad spend** (gap found 2026-07-22 — no audit dimension
  covered it): nobody has ever pushed the payment path, the SSR lesson
  route, or the Stripe webhook handler under concurrency. Gates 2/3
  explicitly precede buying traffic; measure before spending.
- **Support workflow** (2026-07-22): support@ is a mailbox, not a process.
  Write the refund-processing runbook (exact Stripe steps), the
  chargeback-evidence workflow, and a response-time target before launch
  week fills the inbox.
- ~~Story-skip instrumentation missing~~ — **DONE 2026-07-25:**
  `script_skipped` (themeId, lessonId, step, elapsedMs) fires from the
  Skip control; the ">40% skip triggers narrative redesign" rule is now
  computable from day 1.
- **Uptime monitoring + status page** (gap found 2026-07-22): no external
  uptime check exists on web, API, or the Stripe webhook endpoint, and no
  status page. Sentry alert rules (Tier 1-OPS) cover errors, not
  down-and-silent.
- **Mobile/a11y** (folded from R2-6c, 2026-07-22; **re-baselined 2026-07-25 — 6 of 7 sub-items fixed in code, see R3-10**: step bar wraps, waitlist focus outline, live-region reveals, `aria-pressed`, per-step `<h1>`, `--tc-border-interactive` token both schemes). Still open: 13px editor type + no mobile axe (bullet above); LOW residuals — interactive stragglers on decorative `border-border` (landing secondary CTAs, unselected picker toggle, scheme toggle, poller support link; worst in light at 1.31:1), dark accents on overlay surfaces 3.99-4.23:1 for text-size use, ~~`pending-poller`~~ (fixed — always-mounted since run 1) — only the challenge-passed banner still mounts `role="status"` with its content.
- **Security mediums from the audit register** (triaged in 2026-07-22): rate-limit bypass — `cf-connecting-ip` trusted first with no Fly origin lock, so hitting the Fly hostname directly gives unlimited buckets; CSP carries removable `'unsafe-inline'` (keep the genuinely required `'unsafe-eval'`, fix the misattributing comment); `POST /api/github/token` stores any caller-supplied token (stolen-token binding); waitlist INSERT volume control (shape bounded by migration 041; rate-limit/captcha still open); run the empirical check that skill_events child partitions inherit the parent RLS policy via direct PostgREST select.
- **Unsubscribe does not propagate to Kit.** Handlers flip `waitlist.subscribed` in Supabase only; `unsubscribeFromAll()` is dead code, no Kit webhook exists. Once the Tier 1-OPS retention automations go live, an unsubscribed address would keep receiving sequence emails. Wire both directions.
- **No server-side timeouts on Kit, Resend, Upstash, or Supabase queries** (re-baselined 2026-07-25: the GitHub lib now has 15s `AbortSignal.timeout` on all 8 fetch sites + retry/backoff; Octokit no longer exists); client-side, settings/GitHub/onboarding/report-issue/capstone bypass `apiFetch`. Sharpest case narrowed 2026-07-25: a hung Kit call still stalls the webhook past Stripe's timeout and forces a re-delivery, but the re-delivery is now fully deduped (R3-4c fixed) — the remaining cost is retry noise and delayed fulfilment, not double-firing. A Kit/Resend timeout wrapper is still the right week-1 fix.
- **Error-boundary copy misattributes DB faults** — a paying customer during a 2s Supabase blip reads "Lesson failed to load / something went wrong on our end" as a content bug; only hard-failing Postgres call on a render path.
- **Fly config drift:** no `[[vm]]` block (machine size unversioned; docs claim 256MB/$15 with no source), and the Dockerfile builds `dist/` then runs `tsx src/index.ts` anyway — TypeScript transpiled at runtime inside the container on the payment path.
- ~~Rate limit is 60/min in code, 120/min in both docs~~ — **reconciled 2026-07-25**: all docs now state 60/min (the code truth). Raising the actual limit to 120 remains a product decision if multi-tab 429s show up.
- ~~Opacity-dimmed text fails contrast at 41 sites~~ — **substantially remediated by 2026-07-25 re-census (R3-10):** 22 sites remain, all ≥/65 alpha at 4.96-11.4:1 in both schemes; cited failures (landing "Notify me", ticker @40, bridge tiles) gone or exempt-class. Residual tracked in the Mobile/a11y bullet above.
- **Lesson body ships in HTML at `opacity:0`** until JS stamps the beat state — cloaking-adjacent on the primary organic surface (compounds the ~100-indexable-words item above).
- **Small UX/cleanup — mostly DONE 2026-07-25:** ~~root 404 primary CTA → /dashboard~~ (now public `/themes`; theme 404 already had it); ~~`.gitignore` misses `.env.production`/`.env.development`~~ (added; `supabase/.temp/` was already untracked); ~~ci-cd.md "~210 allowlisted" claim~~ (corrected to empty-allowlist truth); ~~infrastructure.md query cache / tech-spec.md packages/github~~ (removed). Still open: counterfactual debris — table 031 + generated types survive a fully-deleted feature (drop in a future migration or document as dormant); broken admin link `admin/digest` → `/learn/...` (admin-only).
- **`github_token` stored plaintext and browser-readable.** R2-3 assigned this to Tier 2 but it was never listed here until 2026-07-22. `select("github_token")` works for your own row (row-level RLS, no column restriction). Encrypt at rest + block direct column reads.
- ~~Money-path hardening (R3-4)~~ — **all six DONE 2026-07-25** (see R3-4 note; payments.test.ts 41/41).
- **Journey/new-surface hardening (R3-6/R3-7):** **DONE 2026-07-25 through run 2** (completed_at writer + journey/learn axe cells landed in run 2). Still open: **single-mount the lesson editor for real** (CSS-only today — stale buffer on rotate across `lg`, doubled CPU on the graded path); `/journey` does a per-request `getUser()`, keeping an otherwise-static marketing page dynamic (crawl-cost nit).
- ~~CI hardening (R3-9)~~ — **DONE 2026-07-25** (WebKit installed; `migrations` CI job added, fail-closed; operator must add the two Supabase secrets to GitHub).
- ~~No `immutable` cache headers on `/vendor` or `/models`~~ — **stale entry; shipped 2026-07-21** (see R2-7 above; verified against `next.config.ts` headers 2026-07-22).
- ~~Kit automations still unbuilt~~ — promoted to Tier 1-OPS above (2026-07-22).

---

## Tier 3 — Fix before ~10k users, not before launch

> **MOVED 2026-07-22** to `docs/post-launch-backlog.md` §9 ("Scale debt,
> before ~10k users") — post-launch by this tier's own definition, so it
> belongs in the post-launch source of truth. §9 also picked up the two
> R2-5 infra findings (Fly/Supabase region split, DB-gated health check)
> that previously had no checkbox anywhere.

---

## The honest ceiling

Tier 1 makes the app **safe to release and possible to measure**. It does not make 100,000 paying users reachable, and nothing in this document does.

100k requires capabilities that **do not exist in the codebase** — verified by grep, all returning zero:

| Capability | Status (re-checked 2026-07-25) | Share of 100k |
|---|---|---|
| Subscription / recurring billing | groundwork only (043 `stripe_customer_id`, webhook capture; no product code) | makes paid acquisition solvent |
| Teams / orgs / seats | no code | ~50–60k |
| Leaderboard / arena | schema + contract only (048, `arena-scoring-contract.md`; zero UI/API) | ~10–15k |
| Referral / invite | no code | the viral loop |
| Themes purchasable | **1** (`LAUNCHED_THEMES`) | the TAM denominator |

With one theme at one-time pricing, the realistic ceiling is the **5–10k paying** band, however well distribution goes. Reaching 100k means building the above — quarters of work — as laid out in `docs/roadmap.md` Horizons 1–3.

**So: launch tomorrow on Tier 1. Distribute. Measure. Then decide whether the 100k arc is the business you want to build.** Those are separate decisions and they do not have to be made together.
