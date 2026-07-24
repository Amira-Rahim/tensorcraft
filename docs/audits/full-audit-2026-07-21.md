# Full Six-Dimension Audit — 2026-07-21

Complete findings register. `docs/launch-blockers.md` is the *actionable*
subset (what blocks launch); this is the *whole* record, including Medium and
Low items that did not make that cut.

**Why this document exists:** six parallel audits produced far more detail than
the blocker list carries. That detail lived only in agent transcripts in a
session-scoped temp directory. Everything below is transcribed here so it
survives.

**Scope.** Six dimensions, chosen to cover what prior audits had not. Every
audit before today examined content and copy only — which is why "A+ launch
ready" was a true statement about lesson quality and a false one about the
product.

| Dimension | Prior coverage |
|---|---|
| Security (RLS, secrets, tokens, IDOR, CSP, XSS) | never audited |
| Legal / tax / compliance | never audited |
| Data integrity & resilience | never audited |
| Operational readiness | never audited |
| Accessibility & cross-browser | partially (desktop axe only) |
| Runtime correctness | never audited |

Status key: **[FIXED]** this session · **[OPEN]** · **[WONTFIX]** owner decision
· **[VERIFIED-SAFE]** checked and correct.

> **Triaged 2026-07-22.** Every [OPEN] item now has a tracked home:
> pre-launch work in `docs/launch-blockers.md` (Tier 1-OPS / Tier 1-LEGAL /
> Tier 2), post-launch work in `docs/post-launch-backlog.md` (§1 compliance
> polish, §4 a11y sweep + DISPATCH, §5 theme-2 prereqs, §7 security-low +
> data-integrity + CI/CD groups, §9 scale debt). This file stays the
> findings record; statuses here are not updated as items get fixed.

---

## 1. Security

### Critical

- **[FIXED] Privilege escalation to admin.** `001_initial_schema.sql:30-32`
  declares the profiles UPDATE policy with `using (auth.uid() = id)` and no
  `with check`; Postgres reuses `using` as the check, so `role = 'admin'`
  passes. `006_admin_roles.sql:11` added the `role` column to that table with
  nothing guarding it, and `settings-form.tsx` writes to profiles directly over
  PostgREST. One line in any signed-up user's console:
  `supabase.from("profiles").update({role:"admin"}).eq("id", user.id)`.
  `021_fix_admin_policy_recursion.sql:19-33` then grants SELECT on all
  profiles (incl. plaintext `github_token`), all purchases, all progress, and
  the waitlist. Fixed by migration `040` (BEFORE UPDATE trigger + explicit
  `with check`). **Requires applying to production.**

### High

- **[FIXED] `dashboard_stats` materialized view leaks all users.**
  `012_scalability_indexes.sql:25-40`. Materialized views cannot carry RLS in
  PostgreSQL; it sits in `public`, so PostgREST served it to `anon` —
  cross-user progress plus a user-id enumeration oracle. Revoked in `040`.
- **[FIXED] `theme_progress_summary` view bypasses RLS.**
  `005_progress_summary_view.sql:10-26`. The comment asserts "view inherits RLS
  from underlying table" — false. Views default to `security_invoker = false`,
  so policies evaluate as the view owner, which owns the table and bypasses
  RLS. `040` sets `security_invoker = true`.
- **[FIXED] `github_token` returned in an API response.** `profiles.ts` used a
  bare `.select()` (≡ `select("*")`) and returned the row, so
  `PATCH /api/profiles/{self}` with `{"display_name":"x"}` answered with the
  caller's plaintext GitHub token. Now an explicit column list.
- **[OPEN] `github_token` is plaintext and browser-readable.**
  `011_fix_github_token_and_purchase_enum.sql:15` is a bare `text` column; no
  `pgcrypto` or vault usage anywhere. `001:26-28` is a row-level SELECT policy
  with no column restriction, so `supabase.from("profiles").select("github_token")`
  works from any logged-in browser. The careful column-explicit selects in
  `apps/api/src/routes/github.ts` are therefore moot. Column holds a mix of
  narrow GitHub App tokens and Supabase `provider_token`s (potentially full
  `repo` scope).

### Medium

- **[OPEN] Rate-limit bypass.** `middleware/rate-limit.ts:52-55` and
  `issues.ts:35` trust `cf-connecting-ip` first. Cloudflare fronts
  `api.tensorcraft.app` but `fly.toml` has no origin lock — hitting the Fly
  hostname directly with a rotating `cf-connecting-ip` gives unlimited buckets
  on every endpoint.
- **[OPEN] CSP carries `'unsafe-inline'` AND `'unsafe-eval'`** with no
  nonce/hash (`next.config.ts:131`), reducing script-XSS protection to near
  zero. `'unsafe-eval'` is genuinely required (Velite MDX `new Function()` at
  `lesson-content.tsx:428`, `post-body.tsx:18`). `'unsafe-inline'` is not, and
  its presence would nullify any nonce added later. The inline comment
  misattributes the requirement to "Next.js hydration and PostHog."
- **[PARTLY FIXED 2026-07-21 — migration 041 bounds shape; volume control still open] Anyone can inject emails into the newsletter list.**
  `001_initial_schema.sql:157-159` — `with check (true)` on waitlist INSERT,
  unauthenticated via PostgREST; `newsletter.ts` sends to `subscribed = true`
  (the default). Spam, deliverability, and CAN-SPAM exposure.
- **[OPEN] Purchase credit survives refund/dispute.** `payments.ts:129,147`
  sums `p.amount` including `partially_refunded` rows; a dispute sets only that
  row terminal, leaving the credit-funded upgrade granted. Unreachable today
  (one launched theme); live with theme #2.
- **[OPEN] `POST /api/github/token`** (`github.ts:718-759`) stores any GitHub
  token the caller supplies, letting a user bind a stolen third-party token to
  their profile and act as that victim through Tensorcraft.
- **[OPEN] Guest delayed payments never grant access.** `payments.ts:815-818`
  reads `client_reference_id`, null for guests, so the handler drops the event.
  Mitigated today because guest checkout is disabled.
- **[OPEN] `avatar_url` validation is dead code.** `profiles.ts:44-52` validates
  the protocol, but settings writes straight to PostgREST
  (`settings-form.tsx:225-231`) and there is no DB CHECK. Not script execution
  (`javascript:` in `<img src>` does not run, and it renders only to its owner),
  but it is an unvalidated stored URL.

### Low

`achievements` allows self-insert of any badge (`003:65-67`) · `theme_progress`
score/status fully client-writable · rate limiter fails **open** on Redis
outage (`rate-limit.ts:86-90`) · JWT cache gives revoked tokens up to 30s of
life (`auth.ts:7`) · `allowedHosts` check in the auth callback falls through to
`origin` rather than rejecting (`auth/callback/route.ts:31-39`) · unvalidated
`module_id`/`exercise_slug` into the GitHub API path, self-scoped
(`github.ts:642,659`) · webhook amount mismatch logs but still grants
(`payments.ts:548-560`) · logger redact list misses `github_token`
(`lib/logger.ts:49-67`) · unsubscribe token in query string
(`unsubscribe/page.tsx:41`).

### Verified safe

**[VERIFIED-SAFE]** No open redirect (middleware blocks `//`, `/\`, control
chars; 9/9 tests) · Stripe webhook uses raw body, fails closed on missing
secret, default 5-min tolerance · no price tampering (both endpoints accept
only `{planId, themeIds}`, priced from canonical `PRICING`; `purchases` has no
client INSERT/UPDATE policy) · OAuth CSRF correct (HttpOnly state +
`timingSafeEqual`) · admin key constant-time, fails closed · CORS is an
explicit allowlist, never `*` · **no IDOR** — every API route scopes to
`c.get("userId")`, `profiles.ts:94` 403s on mismatch · **no XSS** — all 11
`dangerouslySetInnerHTML` are build-time content, all 3 `new Function()` are
Velite MDX or sandboxed Worker code · no secrets client-reachable; admin client
unreachable from client components (the one bridge is a type-only erased
import) · no tokens in localStorage (cookie auth) · security headers complete
both sides · RLS confirmed correct on `purchases`, `certificates`,
`skill_genome`, `skill_events` (parent), `exercise_attempts`,
`dispatch_messages`, `boss_beat_choices`, `counterfactual_choices`; `streaks`
correctly moved to a guarded RPC in `008`; `issues`/`news_items` are
intentionally RLS-on-with-zero-policies (service-role only), which is correct.

**[OPEN — needs empirical check]** `013_skill_events_partitioning.sql:30-57`
enables RLS on the partitioned parent only. Child partitions are separate
relations in `public` and individually PostgREST-addressable
(`/rest/v1/skill_events_2026_07`). Run a direct-partition select as
`authenticated` to confirm parent-policy inheritance holds.

---

## 2. Legal / tax / compliance

**All P0 items here need an advisor who knows your establishment country. This
is exposure, not legal advice.**

### P0

- **[OPEN] No tax handling exists at all.** Zero matches for `automatic_tax`,
  `tax_id_collection`, `tax_behavior`, `billing_address_collection` across
  `apps/api/src`, `apps/web/app`, `packages`. Both sessions
  (`payments.ts:210-248`, `:311-339`) are flat USD charges. EU VAT on digital
  services is due at the **buyer's** rate from the **first euro** — the €10,000
  threshold applies only to EU-established sellers. UK VAT from the first sale.
  VAT comes out of margin retroactively; OSS registration cannot be backdated.
  `tax_id_collection` is also absent, so **B2B reverse charge is impossible** —
  an EU business buyer cannot supply a VAT number, so you cannot zero-rate the
  sale to them and they cannot reclaim, which makes the product materially
  more expensive for exactly the team-purchase segment the roadmap depends on.
  Two-piece location evidence (billing address + IP/BIN) is uncollectable
  retroactively because billing address is never captured. US economic nexus
  (~$100k or 200 transactions per state, ~30 states tax digital goods) is a
  lower but real risk. **Your own `docs/prd.md:528` risk register prescribed
  "Use Stripe Tax"; it was never implemented.**
- **[OPEN] Refund terms are unenforceable against EU/UK consumers.**
  `terms/page.tsx:90-95`, repeated at `pricing/page.tsx:167-172` and
  `faq-data.ts:31`: "14 days **if less than 20% accessed**." Under CRD Art.
  16(m) a digital-content seller loses the withdrawal right only if the
  consumer gives prior express consent AND acknowledges losing it AND the
  trader confirms on a durable medium. None happens — Stripe's
  `consent_collection` / `terms_of_service` are unused, and there is no
  pre-purchase checkbox. So every EU/UK buyer retains a full unconditional
  14-day right regardless of consumption, and presenting the 20% condition as
  binding is itself an unfair commercial practice (UCPD Annex I). Worst case: a
  buyer completes all 56 lessons, takes the certificate, and is still entitled
  to a full refund.
- **[OPEN] No invoice or receipt.** No `invoice_creation`, no `receipt_email`.
  The post-purchase "confirmation" at `payments.ts:676-690` fires a Kit *tag*,
  and the Kit automations do not exist — so buyers currently receive **nothing**.
  Stripe's dashboard auto-receipt is a payment receipt, not a VAT invoice (no
  VAT number, rate, or breakdown). Missing receipts are a leading chargeback
  driver.
- **[OPEN] No legal entity, address, or jurisdiction** in either legal page.
  Zero hits for LLC/Ltd/GmbH/Inc. No governing-law clause at all. CRD Art.
  6(1)(b)-(c) and E-Commerce Directive Art. 5 require trader identity and
  geographic address *before* the consumer is bound. Absent a jurisdiction
  clause every EU consumer can sue locally under Brussels I bis Art. 18.
- **[OPEN] No postal address in commercial email.** Absent from the digest HTML
  footer (`newsletter.ts:166-169`), the plain-text footer (`:117`), both legal
  pages, and the site footer — and `docs/email-templates.md:129` bakes the
  omission into the template spec. **CAN-SPAM §316.5(a)(5) requires it in every
  commercial message; the weekly digest is live and non-compliant.** Statutory
  damages to ~$53k per email.
- **[OPEN] Waitlist consent escalation.** `025_waitlist_subscribed.sql:16` sets
  `subscribed boolean not null default true`, and `newsletter.ts:187-190`
  selects every `subscribed = true` row unfiltered by `theme_id` or `source`.
  Someone who asked to be told when one theme ships is auto-enrolled into a
  newsletter carrying discounts. Consent neither specific nor freely given
  (GDPR Art. 4(11), PECR reg. 22). No consent checkbox exists anywhere, checked
  or unchecked; no double opt-in; no consent record (timestamp/IP/copy), so
  **Art. 7(1) accountability cannot be discharged**. The frontend inserts
  straight to Supabase (`lib/waitlist.ts:11-14`), bypassing the API, so
  server-side capture is impossible on the current path.

### P1

- **[OPEN] GDPR export endpoint does not exist.**
  `docs/privacy-compliance.md:101-103` claims `/api/profiles/export` and
  `/api/profiles/delete` are "planned §6h". Neither exists — `profiles.ts`
  registers only `use("*", authMiddleware)` and `patch("/:userId")`.
  `privacy/page.tsx:170` nonetheless promises "Access and export your personal
  data." Erasure-by-email (`settings-form.tsx:925-930`) is legally acceptable;
  **export is not**. No DSAR runbook or 30-day process. Contact addresses are
  inconsistent (`privacy@` vs `support@`).
- **[OPEN] Vercel Analytics runs pre-consent and post-reject.** `<Analytics/>`
  imported at `layout.tsx:17`, rendered unconditionally at `:291`, outside
  every consent gate. It does not touch client storage (so strict ePrivacy
  Art. 5(3) is arguable) but it beacons pageviews with URL and referrer, and
  Vercel derives a visitor identifier server-side from IP + UA — personal-data
  processing with no lawful basis or Art. 13 disclosure. It keeps beaconing
  after an explicit reject. The `beforeSend` prop that would fix this is unused.
- **[OPEN] No consent withdrawal path.** Banner shows only when the key is
  missing (`cookie-consent.tsx:15`); no cookie-settings link in the footer or
  `/settings`. `privacy/page.tsx:174` claims "Withdraw consent at any time" —
  actionable only by email or clearing localStorage. **Art. 7(3) requires
  withdrawal be as easy as giving consent.**
- **[OPEN] Art. 13 gaps** (all verified absent): controller identity, lawful
  basis, international-transfer disclosure, right to lodge a complaint with a
  supervisory authority, **Art. 27 EU/UK representative** (required for a
  non-EU controller targeting EU consumers), retention specifics for waitlist
  data. The transfer gap is concrete: Fly is `iad` and Supabase is US-hosted —
  the primary store of EU personal data — disclosed nowhere.
- **[OPEN] Sub-processor list out of date.** `privacy/page.tsx:104-149` omits
  **Resend** (the live digest sender) and **Vercel Web Analytics** (Vercel is
  listed as hosting only). Resend is also absent from the DPA list at
  `pre-launch-checklist.md:527-535`, and **no DPA in that list has been signed**.
- **[OPEN] Unsubscribe does not propagate to the ESP.** Both handlers flip
  `waitlist.subscribed = false` in Supabase only; neither calls Kit.
  `unsubscribeFromAll()` (`kit.ts:173`) is dead code, and no Kit webhook exists.
  So unsubscribing from the digest leaves the address fully tagged in Kit, and
  a Kit-side unsubscribe never writes back. (The mechanics themselves are good:
  no login required, UUID token, no write on GET, real RFC 8058 one-click POST,
  correct `List-Unsubscribe` headers.)

### P2

Consent is all-or-nothing with no granularity, no versioning, no expiry (CNIL
expects ~6 months); a new vendor silently inherits old consent · Accept and
"Essential only" are both one click but Accept has tinted fill + hover-lift, a
salience asymmetry CNIL/EDPB guidance targets · banner names only PostHog,
omitting Plausible and Vercel Analytics · Sentry initializes ungated with
`replaysOnErrorSampleRate: 1.0` (full session replay on every error) — exceeds
"strictly necessary", though its PII scrubbing is genuinely correct ·
`tc_theme` cookie set by navigation (`middleware.ts:10-14`), 1-year maxAge, no
`httpOnly`/`secure`, disclosed nowhere · no accessibility statement (EAA has
applied to e-commerce since 2025-06-28; microenterprise exemption <10 staff AND
≤€2m turnover likely applies — **confirm rather than assume**) ·
`privacy/page.tsx:205` claims under-16s not intended, with no age gate.

### Verified honest

**[VERIFIED-SAFE]** JSON-LD marks only the launched theme `InStock`; the four
coming-soon themes are correctly `PreOrder` · **zero** `aggregateRating`,
`ratingValue`, `reviewCount` or `Review` anywhere — no fabricated social proof,
the most common structured-data penalty · checkout enforces launch state
server-side (`validateThemeIds` + `isLaunched`) so coming-soon themes cannot be
bought even by a crafted request · certificates honestly framed —
`compare/page.tsx:219-221` states "a completion record, not an accreditation",
JSON-LD is self-`recognizedBy` with `credentialCategory: "Course Completion"`.

---

## 3. Data integrity & resilience

### P0

- **[OPEN] No migration tracking of any kind.** No `schema_migrations`, no
  Supabase CLI state, no CI application, no ledger, no drift detection. The
  documented process is manual SQL-editor paste
  (`docs/deployment-guide.md:149`). The only applied-state record is prose that
  **stops at migration 026** (`pre-launch-checklist.md:44,94-110`) — migrations
  027-040 have no record at all, and four docs actively conflict. **Nobody can
  state the production schema.**
- **[OPEN] No restore procedure exists anywhere.** Not in deployment-guide,
  infrastructure, ci-cd, or pre-launch-checklist. No PITR steps, no dump-reload
  runbook, no RTO/RPO. `deployment-guide.md:154` is one future-tense paragraph
  ("schedule weekly `pg_dump`… test restore quarterly") with no command,
  bucket, or schedule, and it is conditional on Supabase Pro (§A9) which is
  still outstanding. **Whether production has backups at all is an open
  question in the repo's own checklist.**

### P1

- **[FIXED] Sign-in stranded users.** `auth-form.tsx:77,101` — `setLoading(true)
  … await … setLoading(false)` with no `finally`. Any throw left the button
  spinning with no error and no retry, on the front door; Resend died the same
  way. Fixed, plus a success confirmation on resend.
- **[FIXED 2026-07-21] `emitSkillEvent` had zero call sites.** `progress-client.ts:262`.
  The buffer, the 5s flush, the `keepalive` batch endpoint, and
  `POST /api/skill-events` are all dead. Nothing has ever written a skill
  event. Downstream, `compute_user_skill_genome` aggregates exclusively from
  `skill_events`, so `skill_genome` is empty for every user and the dashboard
  renders a radar chart that is **structurally always zero**. It degrades
  visually (there is an `isEmpty` state) so nothing crashes — the feature
  simply does not exist while appearing to. **And it would fail if wired up:**
  `013:65-68` recreated the partitioned table with only a SELECT policy, and
  the route writes with the user's JWT (so RLS applies as `authenticated`), so
  inserts would be denied. Contrast `exercise_attempts`, which needed an
  explicit insert policy (`004:25`) for the identical client factory.
- **[FIXED 2026-07-21] Permanent spinners** (same missing-`finally` class):
  `settings-form.tsx:208` (cannot tell if your name saved — the correct pattern
  exists at `:199` in the same file) · `theme-waitlist-form.tsx:41` and
  `newsletter-modal.tsx:42` (both call an unguarded `submitWaitlist`; both
  render a good error state that a throw makes unreachable) ·
  `boss-beat.tsx:124` — worst variant: `setSubmittedIndex(idx)` fires *before*
  the await and the `:121` guard then permanently blocks retry, so the choice
  **looks saved and never was** · `boss-beat.tsx:89` stuck on "Loading beat…"
  forever.
- **[FIXED 2026-07-21] Onboarding could infinite-loop.** `onboarding/page.tsx:212-215` awaits
  `update({onboarding_completed: true})`, never checks the result, then pushes.
  If that write fails, middleware bounces the user straight back into the
  wizard.
- **[FIXED 2026-07-21] `guest-progress-bridge.tsx` had no try/catch.** A rejection is
  an unhandled rejection: no migration, no `router.refresh()`, and `ran.current`
  blocks retry for that mount — the guest then hits the module-2 prerequisite
  gate, the exact bug the bridge exists to prevent.
- **[OPEN] `apiFetch` is the only timeout in the codebase.** Server-side there
  are none — not Redis, not Kit, not Resend, not Octokit, not any Supabase
  query. Client-side, settings/GitHub (`:294,332,377`), onboarding (`:188`),
  report-issue (`:154`) and capstone (`:164`) all bypass it. Everything degrades
  on *failure* and not at all on *slowness*. Sharpest case: a hung Kit call at
  `payments.ts:685` stalls a webhook handler that has already granted access,
  Stripe times out and re-delivers, and fulfilment re-runs.
- **[OPEN] DISPATCH milestones use strict equality and can silently stop
  firing.** `dispatch.ts:79,99` compare `=== count`. Because clients can write
  arbitrary `lesson_id` (below) and renames leave orphan rows, a user can land
  at 57 completed rows and never receive the board-clear message — the
  narrative payoff for finishing. `certificates.ts:137` gets this right with
  `completed < expected`.
- **[FIXED 2026-07-21 — migration 041] `theme_progress` had no CHECK on
  `theme_id`/`module_id`/`lesson_id` and no length limit.** The insert policy only checks `auth.uid() = user_id`
  (`001:88-93`) and the web client writes direct to Supabase, never through the
  validating API route. Any authenticated user can insert arbitrary or
  megabyte-sized slugs — unlocking prerequisite gates, breaking DISPATCH,
  inflating the certificate completion count, and an unbounded storage vector.
  `016` constrains `profiles.preferred_theme_id` to canonical slugs;
  `theme_progress` deserves the same.
- **[OPEN] Error-boundary copy misattributes DB faults.** `hasThemePurchase`
  now throws on a lookup failure, but the boundary says "Lesson failed to load"
  and `errorMessageForCode(undefined)` returns "Something went wrong on our
  end." A paying customer during a 2-second Supabase blip reads that as a
  content bug. It is also now the **only** hard-failing Postgres call on a
  render path — every other server query degrades to empty state — so one
  incident produces four different user-facing presentations.
- **[OPEN] Migration 013 is the most dangerous file in the repo.** Not
  re-runnable (fails at `:30`). `INSERT ... SELECT` with no lock (`:60-61`) —
  rows written between the SELECT and the rename at `:75` are **silently lost**
  into `skill_events_old`. Header says "requires brief write pause"; nothing
  enforces it. `DROP TABLE skill_events_old` (`:79`) is commented out pending
  manual verification with no record it happened — **production may still carry
  a full duplicate**.

### P2

Client-supplied `completed_at` (`progress-client.ts:105`) corrupts the activity
heatmap for skewed device clocks · guest replay discards real completion dates
and collapses multi-day study into one streak call · DISPATCH dedup is a real
TOCTOU (two tabs → duplicate inbox message; cosmetic) · `/certificates/[id]`
shows 404 for valid certificates during an API outage — **partially fixed**
(transport failures now route to an error boundary; non-ok HTTP still 404s) ·
`lesson-progress.tsx` is dead code carrying two live bugs · `POST /api/progress`
and all its validation is unused because the frontend bypasses it ·
`exercise_attempts` unbounded (100KB `submitted_code`, no dedup, no retention;
~6MB/min achievable per user) · a paying user can self-issue a certificate by
inserting 56 rows (credential credibility, not revenue; acknowledged at
`certificates.ts:84-88`) · `cert_hash` is decorative — no verification endpoint
exists, so a third party cannot check it; fine as-is, just do not describe it
publicly as a verification hash · `apps/api/src/lib/cache.ts:12-21` has bare
Redis calls with no error handling and zero callers (latent landmine).

### Destructive migrations worth knowing about

`034:17-20` overwrote every non-React onboarding answer with no backup column
(irreversible) · `009:12` dropped `last_active_at`, **not derivable** from
anything else · `023:9` unconditionally demotes a named account to `'user'`, so
re-running silently revokes admin · `033` drops `review_queue`/`lore_drops`
with `cascade` (intentional).

**Non-idempotent (fail on second run):** 001, 002, 003, 004, 006, 009, 010,
011, 013, 015, 016, 017, 027, 029, 030, 031, 032 — bare `create table` /
`create policy` / `create type` / `create index` (Postgres has no
`CREATE POLICY IF NOT EXISTS`). Correct drop-then-create: 018, 019, 020, 021,
024, 034, 035, 037, 038, 039, 040.

**Rollback covers 3 of 40.** `pre-launch-checklist.md:655-668` has SQL for
018/019/020 only. The 019 entry has a **signature mismatch** — it drops
`get_shared_certificate(text)` but the function is `(p_id uuid)`, so it
silently succeeds while leaving the anon-callable function live. **No
down-migrations exist, and not one migration is wrapped in BEGIN/COMMIT**, so a
multi-statement file failing halfway leaves the schema partially migrated with
no record of how far it got.

**[P1] The incident runbook is dangerous.** `pre-launch-checklist.md:670-673`
suggests `update purchases set status='refunded' where created_at > '<ts>'` —
revokes access from every legitimate purchaser in the window, issues no Stripe
refund, no dry-run. And if 038 is applied, its trigger makes those rows
terminal, so the corrective `update ... set status='completed'` is **silently
ignored**. The runbook and migration 038 have never been reconciled.

### Verified robust

**[VERIFIED-SAFE]** `theme_progress` has `unique(user_id, theme_id, lesson_id)`
and every write is an upsert — concurrent tabs cannot duplicate or corrupt ·
the **offline path genuinely works**: a failed write falls through to
`recordGuestCompletion` in localStorage and replays on next load · guest replay
is idempotent and only clears on full success · streak updates are safe (unique
constraint makes the loser raise, swallowed) · skill genome uses
`ON CONFLICT DO UPDATE` · error boundaries exist at every level that matters,
each with a working `reset()` retry · `emitSkillEvent` uses `keepalive` and
flushes on `visibilitychange` (correct, if unused) · certificates **cannot be
forged** — service-role-only writes, `uq_certificates_user_theme`, issuance
requires both a matching purchase and ≥56 completions · Redis rate limiting
fails **open** (nobody locked out) — correct choice · TFJS local-first with CDN
fallback and a real error message is the best-designed dependency in the repo ·
localStorage guest data is ~3.4KB against a 5MB ceiling, all reads/writes
already wrapped.

---

## 4. Operational readiness

### Critical / High

- **[OPEN] Zero alerting.** Sentry captures; nothing notifies. Exhaustive grep
  for pagerduty/opsgenie/uptimerobot/betterstack/checkly/cronitor/
  healthchecks.io/SLACK_WEBHOOK/DISCORD_WEBHOOK/alert_rule returns **no
  configuration** — only two doc lines admitting the gap
  (`pre-launch-checklist.md:561,716`). §B10 specifies exactly the three rules
  needed (error rate >5% in 5min, API p95 >2s, **any 5xx on
  `/api/payments/webhook` → immediate email**) and remains unticked. The
  webhook handler logs errors at ~20 sites and correctly 500s so Stripe
  retries — but those logs go to the Fly stream, and **nobody watches the Fly
  stream at 3am**. After Stripe exhausts retries the purchase is lost silently.
- **[FIXED] 8 of 11 error boundaries never reached Sentry** — including
  `/pricing` and `/paywall`. A nested boundary stops propagation, so crashes on
  the two revenue routes were swallowed before the root boundary saw them.
- **[OPEN] Vercel Hobby plan.** `docs/infrastructure.md` records the web app on
  the free tier and projects "$0/mo" at 100K/500K/1M users. Hobby **prohibits
  commercial use** and you sell a $59-159 product — a ToS/takedown risk before
  it is a cost one. Hobby also caps bandwidth at 100 GB/mo, edge middleware at
  ~1M invocations, and **source images at 1,000/month** (every distinct user
  avatar counts).
- **[OPEN] Health check gates Fly liveness on a DB query.**
  `routes/health.ts` returns 503 when the DB errors; `fly.toml:17-22` probes
  every 10s and the Dockerfile adds another every 15s. A Supabase blip makes
  all machines report unhealthy simultaneously → **Fly kills the entire API
  fleet** during a dependency hiccup it would have ridden out. Also
  `count: exact` is a sequential scan: ~20 seq scans/min on `profiles`, forever.
- **[FIXED] Middleware ran on `/vendor/*` and `/models/*`** — one edge
  invocation plus one GoTrue call per static asset fetch, hitting both metered
  services for nothing. Matcher tightened.
- **[FIXED] No cache headers on `public/`** — the 1.4 MB TFJS bundle
  revalidated every session while the exercise runner fetches it per exercise.
  `immutable` added for `/vendor` and `/models`.

### Environment variables

**There is no env validation anywhere** — no `env.ts`, no zod schema, no
`t3-env`, no startup assertion. Every var is read ad-hoc at point of use, so
nothing fails at build and almost nothing fails at boot. Misconfiguration
surfaces as a silently disabled feature discovered by a user not receiving
something.

**Read by code, missing from all docs:**

| Var | Site | Failure when unset |
|---|---|---|
| `KIT_TAG_PAYWALL_HIT` | `email-tags.ts:20` | **silent 200** |
| `KIT_TAG_MODULE_1_COMPLETE` | `email-tags.ts:19` | **silent 200** |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` **on Vercel** | `unsubscribe/one-click/route.ts:18` | **throws** — breaks RFC 8058 one-click unsubscribe, which Gmail/Yahoo bulk-sender rules require at your volume |
| `NEWSLETTER_FROM`, `NEXT_PUBLIC_SITE_URL`, `LOG_LEVEL` | various | silent defaults |

**Documented but never read (traps):** `GITHUB_APP_PRIVATE_KEY` (code reads
`GITHUB_PRIVATE_KEY`; both listed adjacently in `.env.example` — an operator
will fill the wrong one) · `NEXT_PUBLIC_APP_URL` (described as an `APP_URL`
fallback; no such fallback exists, `payments.ts:203-207` throws instead) ·
`CORS_ALLOWED_ORIGINS` (code reads `CORS_ORIGINS`) ·
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_*`,
`KIT_TAG_PURCHASED_DEEP_ORBIT`, `DATABASE_URL` — all unused.

**Direct contradiction:** `deployment-guide.md` marks Upstash
`Required: No`, while `.env.example:18` says "REQUIRED" and `redis.ts:11-16`
**throws**. An operator trusting the deployment guide ships an API that throws
on every rate-limited request. · `CERT_SIGNING_SECRET` is absent from
`deployment-guide.md` entirely; unset, certificate issuance 500s — the capstone
payoff. · `SENTRY_AUTH_TOKEN` **does not exist anywhere in the repo**, so no
sourcemaps are uploaded and every production stack trace will be minified.

### CI / rollback

CI content is strong — lint, typecheck, content build, build, test, exercise
validation, 14 Playwright specs, plus a lychee link job and a Lighthouse budget.
**But none of it gates anything.** `docs/ci-cd.md:4-5`: "No branch protection,
no required-check gating"; `:31-33`: "Advisory only… nothing blocks merge."
There is no `vercel.json`, so Vercel deploys on push to `main` independently of
GitHub Actions — a failing `next build` stops it, but **failing tests, e2e,
exercise validation, or lint do not**. `next.config.ts:10-13` also sets
`eslint.ignoreDuringBuilds: true`. The real gate is `.husky/pre-push`
(typecheck + test), bypassable with `--no-verify`, and it runs neither e2e nor
lint nor the validator. Not in CI at all: `pnpm audit`, `format:check`,
migration drift.

**Rollback is adequate** — git revert / Vercel promote-prior
(`ci-cd.md:135-137`), `fly deploy --image <prior>`
(`pre-launch-checklist.md:679`). Note the API rollback lives in the checklist,
not in `ci-cd.md` where an operator under pressure would look. **No deploy
workflow exists for the API** — `fly deploy` is manual, so web and API deploy
independently and version skew is possible and unmonitored.

### Cost / config

**[OPEN] Fly is undersized and unversioned.** `fly.toml` has **no `[[vm]]`
block**, so machine size is whatever was set at creation and is not in version
control. `infrastructure.md` claims "3-5 instances, 256MB" and projects $15/mo;
neither number appears in the file. `fly scale show -a tensorcraft-api` is the
one-command check. Compounding: the Dockerfile runs `pnpm build` then
**discards `dist/` and runs `tsx src/index.ts`**, transpiling TypeScript at
runtime inside a 256MB container — the `start` script (`node dist/index.js`) is
never used.

**[OPEN] Fly `iad` vs Supabase `eu-west-1`.** `supabase/.temp/pooler-url` shows
`aws-1-eu-west-1`, while `fly.toml:2` is `primary_region = "iad"` and
`infrastructure.md` explicitly claims co-location. **Every API→Postgres round
trip crosses the Atlantic (~80-90ms).** Both a latency finding and a
documentation-correctness one — it silently undercuts the capacity math.

**[OPEN] Rate limit is 60/min in code, 120/min in docs.** `rate-limit.ts:5`
says 60; both `deployment-guide.md` and `infrastructure.md` say 120, with
`infrastructure.md` explicitly noting it was "increased from 60 to support
multi-tab usage." **Real users will hit 429s at half the documented rate.**

**[OPEN] Upstash budget.** ~5-6 commands per authenticated API request (4-command
rate-limit pipeline + JWT cache GET/SET). The free tier is 10k commands/day —
roughly **1,700 API requests**. Needs a paid plan well before 5,000 users.

**[LOW] `supabase/.temp/` is git-tracked** (project ref + pooler host, no
password). Recon convenience, not a credential — but CLI scratch state has no
business in git. `.gitignore` also misses `.env.production` / `.env.development`.

### Verified solid

**[VERIFIED-SAFE] Dependency CVEs: clean.** `pnpm audit` → 0 across 938 deps
(prod, dev, and total). **The "91 Dependabot alerts pending" note in project
memory is REFUTED** — resolved via an 18-entry `pnpm.overrides` block
(`package.json:47-66`). Gaps: no Dependabot/Renovate config, so nothing surfaces
the *next* CVE, and `pnpm audit` is not a CI step. · **No committed secrets, in
the working tree or in history** — verified by pattern sweep across all history
for `sk_live_`, `whsec_`, `AKIA`, private-key blocks, JWTs, and connection
strings. · `min_machines_running = 2` — **no cold start on the payment path**,
the thing most likely to have been wrong. · Secret *documentation* is unusually
thorough (~40-var table with required/optional flags; `.env.example` explains
*why* for each). · Logger has pino `redact` with `remove: true`, and no code
logs headers/cookies/payloads/env — verified by grep, not assumed. (Gap: redact
paths reach depth 1 only, so a nested `err.response.config.headers.authorization`
would survive.) · ISR well configured: zero `force-dynamic`, sensible
`revalidate`, `dynamicParams = false` on lesson routes. · No realtime
subscriptions anywhere — a common surprise-bill source, simply not used. ·
Webhooks correctly exempt from rate limiting with sound reasoning.

---

## 5. Accessibility & cross-browser

### Blockers

- **[FIXED] White screen on every route when site data is blocked.**
  `theme-provider.tsx` — unguarded `localStorage` inside a
  `useSyncExternalStore` `getSnapshot`, in a provider wrapping the app.
  `localStorage` **throws SecurityError** when blocked (Safari "Block All
  Cookies", Chrome site-data blocking, enterprise policy, sandboxed iframe), so
  it threw during render and unwound to `global-error.tsx`. 2 regression tests.
- **[FIXED] Exercise editor mounted twice on mobile.** Measured at 375px: two
  `.sp-wrapper`, two "Run Tests", two `role="status"` — two code buffers racing
  on one `tc-code-{slug}` key, on the graded path, breaking the single-submit
  invariant the code asserts. 2 regression tests.
- **[OPEN] Lesson step bar renders 0px wide.** Measured **0.0px × 16px at
  320px**, 0.7px at 375px (`lesson-steps.tsx:826-859`). The `ChromeBar` row is
  `flex gap-4` with a 44px button, a `shrink-0` 146px link and a `shrink-0`
  counter; fixed children exceed the 272px content box and crush the only
  `flex-1` child — the entire progress indicator. WCAG 1.4.10 / 2.5.8.

### High

- **[OPEN] Waitlist email input has no focus indicator at all.**
  `theme-waitlist-form.tsx:85` — `focus:outline-none` with `borderColor`
  hard-pinned via inline style. This is the pre-launch capture on all four
  coming-soon pages. WCAG 2.4.7.
- **[FIXED 2026-07-24] `--tc-border #3d3d3d` is 1.63:1** against the page
  background — roughly half the 3.0 WCAG 1.4.11 requires — and it drew the
  visible boundary of **every form field in the app**. axe does not reliably
  flag 1.4.11. **Fix (option b — raise only interactive borders):** new
  `--tc-border-interactive` token (`themes.css`; `#808080` dark, `#8a8a8a`
  light) mapped to a `border-interactive` Tailwind utility (`globals.css`),
  swapped onto the resting boundary of every genuine control — text/number
  inputs, textareas, select, radio/checkbox options (quiz + onboarding),
  toggle tracks, and outline buttons (auth, newsletter, waitlist, onboarding
  back, settings disconnect/sign-out, report-issue trigger/dropzone, exercise
  action, payment-error dismiss). Decorative dividers/card outlines keep the
  quiet `#3d3d3d`. `#808080` clears 3:1 against BOTH the page bg (4.50:1) and
  the lightest surface a control sits on, surface-overlay `#313131` (3.30:1);
  `#8a8a8a` clears white (3.45:1) and the light page bg (3.17:1). Locked by
  4 new assertions in `theme-properties.test.ts` (contrast computed from the
  real CSS text, both schemes, both adjacent surfaces).
- **[OPEN] Opacity-dimmed text fails 1.4.3 at 41 sites** and is **invisible to
  axe**, which folds no `opacity` into contrast: `muted` @60% = 3.74:1, @50% =
  3.00:1 (`bridge-collection.tsx:61`, `five-worlds-section.tsx:184,188` — the
  landing "Notify me →" CTA), @40% = 2.38:1 (`ticker.tsx:158`); `primary`
  @50/60/70% = 2.59/3.18/3.84:1; all four `accent` + axis colours on
  `raised`/`overlay` = 3.86-4.44:1. (The `muted` **token** is fine at 8.19:1
  solid — only composites fail. There is no light theme.) **Deferred by
  decision 2026-07-24:** when the palette a11y work was scoped, the owner chose
  option (b) — raise interactive borders only (1.4.11, now FIXED above) — and
  left this 1.4.3 opacity-composite item for a later pass. Fix shape when taken:
  replace `opacity`/`text-*/NN` dimming on text with a solid token that already
  clears 4.5:1 (e.g. drop to `text-text-muted` solid), site by site.
- **[OPEN] Four places replace a control with its own result, losing focus and
  announcing nothing:** `hint-panel.tsx:50-81` (**all 56 lessons**),
  `recall-prompt.tsx:37-76`, `auth-form.tsx:150-186` (magic-link sent),
  `lesson-progress.tsx:126-158`. Focus falls to `<body>`. WCAG 4.1.3, 2.4.3.
  **`exercise.tsx:133-170` already contains the correct, well-commented fix —
  applying that shape closes all four.**
- **[OPEN] Theme purchase toggles have no `aria-pressed`**
  (`pricing-tiers.tsx:44-66`) — selection on the $99-$159 basket is
  colour-only. WCAG 4.1.2, 1.4.1.
- **[OPEN] No `<h1>` on 5 of 6 lesson steps**; MDX starts at h2/h4
  (`lesson-steps.tsx`, h1 only at `:1237`). WCAG 1.3.1, 2.4.6.
- **[OPEN] 1.47 MB TFJS downloads inside a 10s timeout.**
  `exercise-runner.ts:796` `importScripts` a 1,469,843-byte bundle while the
  timeout starts at `:1052`. On 3G that download alone is ~30s, so **every
  slow-connection learner's first Run Tests fails as "Timed out after 10
  seconds"** — misattributed to their code. No `w.onerror` handler
  (`:1006-1015`), so a blocked script also reports as a timeout.
- **[OPEN] `docs/browser-support.md` claims coverage that does not exist.** It
  states a Chrome/Firefox/Safari/Edge matrix. `playwright.config.ts:26-49`
  defines chromium plus three WebKit projects — and **all three WebKit projects
  are `testMatch: /mobile\.spec\.ts/`**, so WebKit only runs the mobile smoke
  suite. **Firefox has zero automated coverage.** No `browserslist` anywhere,
  so the stated floors are unenforced.
- **[OPEN] The e2e accessibility gate fails open.**
  `playwright.config.ts:56` allows 30s for `webServer` against measured cold
  compiles of 19-154s. A timeout reads as infra flake, not as "accessibility
  was never checked." **Only Landing, Auth, Terms and Privacy actually pass
  axe** — the ten specs that never ran cover Themes, Theme Detail, Pricing and
  all six lesson steps, i.e. the entire paid surface.

### Medium / Low

Keyboard: the editor is **not** a hard trap (Sandpack binds Escape → wrapper
focus, so 2.1.1 passes) but **nothing tells the user**, and Tab indents — WCAG
2.1.2, a ~1-line fix · `report-issue-button.tsx:647-658` screenshot dropzone is
mouse-only (bare `div` with `onClick`, hidden file input) — 2.1.1 ·
`code-block.tsx:104,109` overflowing code has no `tabIndex={0}`, so keyboard
users cannot scroll to read long samples · step bar announces position and name
but **not completion** — `visited`/`filled` are background+opacity only, so a
finished step and an unvisited one announce identically; `title="…(locked)"` at
`:842` is silently discarded because `aria-label` wins · auth errors have no
`role="alert"`, no `aria-invalid`/`aria-describedby` (**`aria-invalid` appears
zero times in the entire codebase**) · onboarding has no `<main>` ·
`settings-form.tsx:481` puts `role="tabpanel"` **on** `<main>`, destroying the
landmark · unlabelled second `<nav>`s (`mobile-nav.tsx:118`,
`capstone/page.tsx:279`) · `user-menu.tsx:100-133` declares `role="menu"` with
no arrow-key/Escape handling · `pricing-tiers.tsx:264,478` hide "Best
Value"/"Available Now" behind `aria-hidden` — that is purchasing information ·
the Skip control for the 15.5s autoplay is `text-[10px]` in muted on
transparent — small and low-contrast for the one escape hatch ·
`auth-form.tsx:293` sets the signup email field to 15px and report-issue inputs
to 12px, both under the iOS 16px zoom threshold (the 13px editor is not the
whole picture) · the code editor is **220px wide holding 468px lines** at 320px ·
`report-issue-button.tsx:283-293` measures **`left: -60px` at 320px** and its
own `overflowX:"hidden"` means **`e2e/reflow.spec.ts` passes green while the
panel is permanently clipped**, on every page.

**Test-coverage correction:** `e2e/mobile.spec.ts:9-10` claims iPhone SE is
"375×667, the tightest viewport we support." Playwright's `devices["iPhone SE"]`
is **320×568** — so **375px, the most common real iPhone width, is covered by
no project at all** (the others are 412 and 810). Tap-target size is asserted on
exactly one element, and the lesson route never reaches steps 2-3 at phone
width in any test.

**No-JS:** there is no `<noscript>` anywhere, but `"use client"` components
*are* SSR'd, so marketing, pricing, themes, blog, compare and the legal pages
**are readable with JS off**. The failure is confined to the lesson route, and
is two-layered: steps 2-6 never enter the DOM, and step 1's body is CSS-hidden
because `data-script-state` initialises to `"playing"` while `globals.css:298-310`
applies `opacity:0`/`display:none` until JS stamps `data-beat-shown`. **The
sharper edge is SEO**: lesson text ships in the HTML at `opacity: 0` —
cloaking-adjacent, on the primary organic-acquisition surface.

### Verified correct

**[VERIFIED-SAFE]** The 15.5s beat autoplay **is** correctly reduced-motion
gated (`lesson-steps.tsx:1154-1159` short-circuits before scheduling any timer)
— WCAG 2.3.3 passes; and a real **Skip** button renders during playback with
`aria-busy="true"`, so 2.2.2 passes too · `globals.css:420-428` has a correct
global reduced-motion killswitch, and all five canvas effects check the query,
register a live `change` listener, and `cancelAnimationFrame` on cleanup (the
2026-07-12 rAF leak appears resolved) · skip link present · `aria-label` on all
7 icon-only controls · **all 13 form inputs have programmatic labels** · every
`<canvas>` is `aria-hidden` + `role="presentation"` · both charts use
`role="img"` + `<title>` + `<desc>` · `aria-current="step"` on the step bar ·
focus management on step change is genuinely well done, citing 2.4.3 · all
three dialogs use a real `FocusTrap` with Escape · `exercise.tsx:133-170` is a
model always-mounted live region · global `*:focus-visible` outline plus 73
components adding explicit indicators · no horizontal scroll at 320px on any of
6 routes · `mobile-nav.tsx` is exemplary (44×44 targets, FocusTrap, scroll lock,
route-change close) · pricing collapses correctly with all controls ≥44px ·
zoom permitted (no `maximumScale`/`userScalable:false` anywhere) ·
`deep-scan-demo.tsx:63-75` probes WebGL before touching tfjs and has a real
error UI · `worker-src 'self' blob:` correctly declared with a bug-driven
comment · `exercise-runner.ts:992-1002` feature-detects Worker/Blob/URL and
surfaces visible failure · **auth is cookie-based, not localStorage**, so it
survives ITP eviction · zero Safari-breaking JS APIs.

---

## 6. Runtime correctness

### Fixed

- **[FIXED] Every OG image sitewide was robots-disallowed.** `robots.ts`
  carried a blanket `Disallow: /api/`, and every OG/Twitter card is generated
  at `/api/og?...` (root layout plus pricing, privacy, terms, learn, blog,
  themes, capstone, lesson, extras, certificates). Every share card would have
  rendered imageless — directly undercutting the distribution phase. Now
  `Allow: /api/og`.
- **[FIXED] Free signed-in users saw modules 2-4 as unlocked, then bounced.**
  Two conflicting definitions of free: the theme map gated on
  `isFoundationsModule` (`track === "foundations"`, which spans deep-orbit
  modules **1 through 4**) while the lesson route gates on `mod.order > 1`. It
  landed immediately after the free-account CTA converted someone. Anonymous
  users were unaffected, which is why every anonymous-path check passed.
- **[FIXED] `/certificates/<uuid>` returned a raw 500** when the API was
  unreachable (`page.tsx:36`, no try/catch) — on the most-shared surface. Now
  rethrows into a new `certificates/error.tsx` offering retry, rather than
  500ing or falsely claiming the credential does not exist.
- **[FIXED] Organization JSON-LD asserted `logo.png`, which 404s** — there is
  no PNG in `public/` at all. Required property for the Organization rich
  result, and false structured data. Removed.
- **[FIXED] Extras breadcrumb JSON-LD pointed at a 404** —
  `/extras/<moduleSlug>` has no route — from all 21 extras lessons.

### Open

- **[FIXED 2026-07-21] `/themes/deep-orbit/capstone` was in the sitemap but 307s anonymous
  crawlers** to `/auth`, which is both `noindex` and `Disallow`. Google records
  "Page with redirect" and drops it. Emitted by `sitemap.ts:98-105`.
- **[FIXED 2026-07-21 — about/compare/extras/themes] Most routes emitted the homepage's Twitter card and `og:url`.** Only
  pricing, privacy, terms and `blog/[slug]` define their own `twitter`;
  `/about`, `/compare`, `/extras`, `/themes` define no `openGraph` at all, so
  they inherit `og:url = https://tensorcraft.app`. **Sharing `/compare`
  presents as the homepage.**
- **[OPEN] Guest who completes module 1 sees "Continue M1" pointing backwards**
  (`themes/[slug]/page.tsx:211-242`) — guest progress is localStorage-only, so
  server progress is `[]` and `activeModule` stays module 1. The largest button
  on the page points backwards at the conversion moment. `GuestModuleBanner`
  mitigates, does not fix.
- **[FIXED 2026-07-21] First-time visitors were told their session expired.**
  `lib/supabase/middleware.ts:78` sets `error=session_expired` whenever
  `authError && !user`, which includes cookieless first visits. Verified:
  `/onboarding`, `/dashboard`, `/settings` all 307 with that param from a clean
  request.
- **[FIXED 2026-07-21 — now OutOfStock] `PreOrder` + `$59` on four unpurchasable themes**
  (`layout.tsx:181/209/237/265`, `coming-soon-stub.tsx:83`). Checkout hard-rejects
  them; only a waitlist exists. `OutOfStock`/`LimitedAvailability` would be
  truthful.
- **[FIXED 2026-07-21 — property removed] `numberOfCredits: 11`** (`themes/[slug]/page.tsx:257`) means
  **academic credits** in schema.org — reads as an accreditation claim.
- **[OPEN] Broken admin link** — `admin/digest/page.tsx:171` →
  `/learn/${themeId}/${moduleId}/${slug}`, no such route (404). Admin-only.
- **[OPEN] Both 404 pages** make "Back to dashboard" the primary CTA
  (`not-found.tsx:17-22`), and `/dashboard` redirects anonymous users to
  `/auth`.
- **[OPEN] `neon-protocol` has 54 MDX files**, not the 55
  `THEME_CONTENT.comingSoonLessonsPerTheme` promises (`image-data` has 4). Not
  user-visible in V1; no test pins coming-soon counts.

### The lesson route is SSR, not SSG — resolved

The build table shows `● /themes/[slug]/[module]/[lesson]` with 56 paths.
Reality, from `prerender-manifest.json`: **0 lesson routes prerendered** (50
prerendered total = 10 module + 21 extras + statics; lesson HTML on disk = 10,
all module pages). `page.tsx:108` calls `getSupabaseServerClient()` → `cookies()`
unconditionally, opting the route out of static generation.

**Good news:** no per-user paywall state is baked into shared HTML — this is
**not** an access-control bug. **Bad news:** the comment at `page.tsx:28-32`
("with static params the first paint is served from the edge cache") is
**false**; every lesson view pays full SSR plus the auth round-trips it claims
to have eliminated. `dynamicParams = false` does still work (unknown slugs 404
at the router). Largest single infra item at 5-10k users.

### Verified working

**[VERIFIED-SAFE]** Content pipeline clean — velite builds, and
`validate-exercises.mjs --starters` → **85 passed, 0 failed, 0 warned** (note:
the allowlist is now **empty**, so the gate runs fully strict — `docs/ci-cd.md`'s
"~210 allowlisted" description is stale) · **THEME_CONTENT matches the corpus
exactly** — deep-orbit 56 MDX across 11 modules, `browser-runtimes` 6, other ten
5; extras 21; blog 4; 85 live / 299 authored exercises; `lessonBridges: 55` ·
`courseWorkload: "PT29H"` independently recomputed (975 lesson min + 754
exercise min = 1,729 min = 28.8h) — accurate · **all 404 edges behave** (unknown
lesson/module, coming-soon lesson and capstone, `/themes/garbage`,
`/extras/garbage`, `/blog/nope`, `/certificates/not-a-uuid`) — no crashes, no
blank screens, no soft-404s · **anonymous free path works end to end** — all
five foundations lessons 200 cookieless, module 2 correctly 307s to
`/pricing?locked=…&module=…`, grading is client-side so no 401 is possible for
guests, `canContinue` never depends on a save result, `/paywall` renders with no
session · sitemap is accurate (20 URLs, 19×200; capstone the exception) ·
**canonicals 100% coverage**, self-referential, origin matching · removed
surfaces genuinely gone (no dead links to `/bridges`, `/log/rewind`, review
queue, lore) · production build succeeds, 122/122 static pages.

**Gate-scope correction:** `apps/web/app/metadata.test.ts` passes **21/21**
while every metadata finding above survives it — it reads each module's exported
object in isolation, never sees what Next resolves after merging, tests **zero**
`generateMetadata` functions, never imports 10 of the routes, and its
duplicate-title check compares only 4 titles.

---

## The pattern worth more than any single finding

Three independent audits arrived at the same structural conclusion, and it is
the thing most likely to bite again:

**Green gates repeatedly meant "the gate does not look there," not "it works."**

- `metadata.test.ts` — 21/21 green, every metadata defect survived it.
- `payments.test.ts` — 30 green, mocked `guest-account.ts` wholesale, so the
  module doing the security-sensitive work had zero real coverage and three P0s
  shipped.
- `e2e/reflow.spec.ts` — green on every page while the report panel is
  permanently clipped, because the panel sets its own `overflowX: hidden`.
- `e2e/accessibility.spec.ts` — fails **open** on a 30s server timeout, so
  "never ran" is indistinguishable from "passed".
- `e2e/mobile.spec.ts` — asserts tap-target size on exactly one element, and
  its stated "tightest viewport" is wrong, leaving 375px uncovered.
- Desktop-only e2e projects — never saw the double editor mount.
- The four `--tc-muted` opacity failures — invisible to axe by construction.

The gates are individually well-written. **Their scope is the gap.** The
highest-leverage structural fix after launch is not more tests; it is tests that
exercise *resolved behaviour at the viewports and configurations real users
have*, plus making the accessibility gate fail **closed**.
