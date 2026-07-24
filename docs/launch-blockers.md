# Launch Blockers — Definitive List (2026-07-21)

> **What this document is:** the complete set of pre-launch work — code defects (Tier 1; Tier 2 in week 1), operator setup (Tier 1-OPS), and legal/compliance actions (Tier 1-LEGAL). Originally scoped to code defects only ("when Tier 1 is done there is no further blocker"); that claim is superseded — since the 2026-07-22 consolidation the release gate is **Tier 1 + Tier 1-OPS + Tier 1-LEGAL complete**, with Tier 2 due in week 1 before ad spend.
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

Two structural notes worth more than any single item:

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

## Tier 1 — STATUS: ALL SIX FIXED IN CODE (2026-07-21)

Typecheck 11/11, 1367 unit tests passing.

**ONE OPERATOR STEP REMAINS AND IT IS BLOCKING:** apply migration
`039_lock_security_definer_rpcs.sql` to production Supabase. Until it is
applied, item 1 below is still live — the code change alone does nothing.

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
- [ ] **FAQPage JSON-LD on `/pricing`** — ~30 min of markup over the FAQ
  content that already renders there (Horizon 0 P3). Rich-result
  eligibility has weeks of lead time; start the clock before launch.
- [ ] **Distribution head start:** write + publish the first blog batch and
  begin the audience track. `roadmap.md` §7: longest lead time in the plan,
  runs in parallel, starts before the code is ready.
- [ ] **Apply the pending migrations in order.** The `schema_migrations`
  ledger now EXISTS (migration 042 built it + backfilled 001–041), so this is
  no longer "establish a ledger" — run `pnpm migrate:status`, then apply each
  PENDING file in numeric order via the runbook. Pending as of 2026-07-24:
  **037–048** (037–044 from prior sessions; 045 dashboard indexes, 046
  onboarding token-hook, 047 tax columns, 048 arena_submissions added in the
  scalability re-audit). None of 045–048 is launch-blocking on its own, but
  they apply cleanly now on near-empty tables and 047's tax columns should be
  live before the first sale so no jurisdiction is lost once Stripe Tax flips.
- [ ] **Move Vercel off the Hobby plan.** Hobby prohibits commercial use;
  selling a $59-159 product on it is a ToS/takedown risk before it is a
  cost one (R2-5).
- [ ] **Env-var hygiene** (audit §4; no validation exists anywhere, so
  misconfiguration = silently disabled features): add a startup env
  assertion (`env.ts`/zod); fix the name traps — code reads
  `GITHUB_PRIVATE_KEY` and `CORS_ORIGINS` while docs/example name
  `GITHUB_APP_PRIVATE_KEY` / `CORS_ALLOWED_ORIGINS`; resolve the Upstash
  required/optional contradiction (code **throws**); document
  `CERT_SIGNING_SECRET` (unset → certificate issuance 500s); add
  `SENTRY_AUTH_TOKEN` (absent → every production stack trace minified);
  set `SUPABASE_URL` + service key on **Vercel** for the RFC 8058
  one-click unsubscribe route (throws unset — Gmail/Yahoo bulk rules).
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
- [ ] **Migration + runbook safety** (do with the ledger reconcile):
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
- [ ] Implement the chosen tax handling (`automatic_tax`,
  `billing_address_collection`, `tax_id_collection` as applicable).
- [ ] Refund terms: collect the express withdrawal-right waiver +
  acknowledgment, or drop the 20%-accessed condition for EU/UK buyers.
- [ ] Add legal entity, postal address, and jurisdiction clause to terms +
  privacy pages.
- [ ] Send a real receipt/invoice on purchase (the Kit receipt automation
  in Tier 1-OPS covers the email; confirm it satisfies invoice
  requirements or enable Stripe invoices).
- [ ] Postal address in the weekly digest footer (CAN-SPAM).
- [ ] Waitlist consent fix (code): `subscribed` must not default to
  newsletter enrollment, and the sender must respect `theme_id`.
- [ ] Self-serve account deletion (code): right to erasure is listed as
  "`/api/profiles/delete` (planned §6h)" in `privacy-compliance.md:103`
  but was never built — the Settings "Delete Account" control is a
  contact-support stub. Build the endpoint + wire the button before
  selling in the EU (added 2026-07-22).
- [ ] GDPR data export (code): `/api/profiles/export` also "planned §6h",
  never built, while `privacy/page.tsx:170` **promises** export. Build it,
  write a DSAR runbook (30-day clock), unify `privacy@` vs `support@`.
- [ ] Vercel Analytics consent gating (code): renders unconditionally
  outside every consent gate and keeps beaconing after an explicit
  reject; the `beforeSend` prop that fixes this is unused.
- [ ] Consent withdrawal path (code): banner only shows when the key is
  missing; no cookie-settings link in footer or `/settings`, while the
  privacy page claims "withdraw at any time" (Art. 7(3): withdrawal as
  easy as giving).
- [ ] Privacy-page Art. 13 gaps (advisor + copy): controller identity,
  lawful basis, international-transfer disclosure (EU personal data on
  US-hosted Supabase, disclosed nowhere), complaint right, Art. 27 EU/UK
  representative, waitlist retention.
- [ ] Sub-processor list + DPAs: page omits Resend (live digest sender)
  and Vercel Web Analytics; no DPA in the checklist has been signed.
- [ ] Confirm (don't assume) the EAA microenterprise exemption with the
  advisor — accessibility-statement obligation applies to e-commerce
  since 2025-06-28.

---

## Tier 2 — Fix in week 1, before spending real money on ads

Not launch blockers. Each one wastes acquisition spend if left.

- **First lesson opens with a ~15.5s auto-playing scene** during which the page is functionally blank, escapable only via a `text-[10px]` "Skip" control. This is the activation moment for the entire product, and it is the destination of the landing page's primary CTA.
- **No email capture for guests anywhere in the free module.** A guest who reads two lessons and leaves is permanently unreachable — no retention sequence can target them.
- **Mobile: code editor sets 13px type**, below the iOS 16px auto-zoom threshold, with no mobile affordance past the mandatory exercise gate. No axe run exists at any mobile viewport.
- **Lessons ship ~100 indexable words** (only the current step is in the DOM) and require JS to render at all, with no `<noscript>`. Large organic-acquisition loss for a content-led product.
- **SEO/metadata + funnel polish** (folded from R2-6b, 2026-07-22): `/themes/deep-orbit/capstone` sits in the sitemap but 307s anonymous crawlers to the noindexed `/auth`; most routes inherit the homepage's `og:url` + Twitter card; a guest who finishes module 1 sees "Continue M1" pointing backwards; first-time visitors are told `error=session_expired`; four unpurchasable themes advertise `PreOrder` + `$59`; `numberOfCredits: 11` reads as an accreditation claim.
- **Load test before ad spend** (gap found 2026-07-22 — no audit dimension
  covered it): nobody has ever pushed the payment path, the SSR lesson
  route, or the Stripe webhook handler under concurrency. Gates 2/3
  explicitly precede buying traffic; measure before spending.
- **Support workflow** (2026-07-22): support@ is a mailbox, not a process.
  Write the refund-processing runbook (exact Stripe steps), the
  chargeback-evidence workflow, and a response-time target before launch
  week fills the inbox.
- **Story-skip instrumentation missing — verified 2026-07-22.**
  `analytics-events.ts` contains zero skip events and the lesson Skip
  control tracks nothing, so the content-QA rule ">40% skip triggers
  narrative redesign" (`post-launch-backlog.md` §2, dev-plan §10c risk #1)
  is **uncomputable**. Add `script_skipped` (lesson, step, elapsed) at the
  Skip call site.
- **Uptime monitoring + status page** (gap found 2026-07-22): no external
  uptime check exists on web, API, or the Stripe webhook endpoint, and no
  status page. Sentry alert rules (Tier 1-OPS) cover errors, not
  down-and-silent.
- **Mobile/a11y** (folded from R2-6c, 2026-07-22): lesson step bar measures 0px wide at 320px and 0.7px at 375px (`flex-1` crushed by `shrink-0` siblings); waitlist email input has no focus indicator at all (`focus:outline-none`, and it is the capture field on all four coming-soon pages); `--tc-border #3d3d3d` is 1.63:1 against the page background vs the 3.0 WCAG 1.4.11 requires, on every form field boundary in the app; hint reveal, recall reveal and the magic-link confirmation each replace a control with its result, losing focus and announcing nothing (`exercise.tsx:133-170` contains the correct fix to copy); theme purchase toggles carry no `aria-pressed` (selection on the $99-159 basket is colour-only); 5 of 6 lesson steps have no `<h1>`.
- **Security mediums from the audit register** (triaged in 2026-07-22): rate-limit bypass — `cf-connecting-ip` trusted first with no Fly origin lock, so hitting the Fly hostname directly gives unlimited buckets; CSP carries removable `'unsafe-inline'` (keep the genuinely required `'unsafe-eval'`, fix the misattributing comment); `POST /api/github/token` stores any caller-supplied token (stolen-token binding); waitlist INSERT volume control (shape bounded by migration 041; rate-limit/captcha still open); run the empirical check that skill_events child partitions inherit the parent RLS policy via direct PostgREST select.
- **Unsubscribe does not propagate to Kit.** Handlers flip `waitlist.subscribed` in Supabase only; `unsubscribeFromAll()` is dead code, no Kit webhook exists. Once the Tier 1-OPS retention automations go live, an unsubscribed address would keep receiving sequence emails. Wire both directions.
- **No server-side timeouts anywhere** (Redis, Kit, Resend, Octokit, Supabase queries); client-side, settings/GitHub/onboarding/report-issue/capstone bypass `apiFetch`. Sharpest case: a hung Kit call stalls a webhook that already granted access → Stripe re-delivers → fulfilment re-runs.
- **Error-boundary copy misattributes DB faults** — a paying customer during a 2s Supabase blip reads "Lesson failed to load / something went wrong on our end" as a content bug; only hard-failing Postgres call on a render path.
- **Fly config drift:** no `[[vm]]` block (machine size unversioned; docs claim 256MB/$15 with no source), and the Dockerfile builds `dist/` then runs `tsx src/index.ts` anyway — TypeScript transpiled at runtime inside the container on the payment path.
- **Rate limit is 60/min in code, 120/min in both docs** — users hit 429s at half the documented rate. Reconcile.
- **Opacity-dimmed text fails contrast at 41 sites, invisible to axe** (muted @50-60%, primary composites, landing "Notify me →" CTA at 3.0:1 or worse).
- **Lesson body ships in HTML at `opacity:0`** until JS stamps the beat state — cloaking-adjacent on the primary organic surface (compounds the ~100-indexable-words item above).
- **Small UX/cleanup:** both 404 pages point anonymous users at `/dashboard` → `/auth` bounce; `supabase/.temp/` is git-tracked and `.gitignore` misses `.env.production`/`.env.development`; `docs/ci-cd.md` still claims "~210 allowlisted" exercises (allowlist is empty, gate fully strict).
- **`github_token` stored plaintext and browser-readable.** R2-3 assigned this to Tier 2 but it was never listed here until 2026-07-22. `select("github_token")` works for your own row (row-level RLS, no column restriction). Encrypt at rest + block direct column reads.
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

| Capability | Status | Share of 100k |
|---|---|---|
| Subscription / recurring billing | no code | makes paid acquisition solvent |
| Teams / orgs / seats | no code | ~50–60k |
| Leaderboard / arena | no code | ~10–15k |
| Referral / invite | no code | the viral loop |
| Themes purchasable | **1** (`LAUNCHED_THEMES`) | the TAM denominator |

With one theme at one-time pricing, the realistic ceiling is the **5–10k paying** band, however well distribution goes. Reaching 100k means building the above — quarters of work — as laid out in `docs/roadmap.md` Horizons 1–3.

**So: launch tomorrow on Tier 1. Distribute. Measure. Then decide whether the 100k arc is the business you want to build.** Those are separate decisions and they do not have to be made together.
