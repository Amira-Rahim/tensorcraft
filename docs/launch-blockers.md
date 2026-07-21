# Launch Blockers — Definitive List (2026-07-21)

> **What this document is:** the complete, finite set of code defects that must be fixed before releasing and starting paid distribution. It is scoped to *launch safety and measurability*, and it is closed — when Tier 1 is done, there is no further internal blocker to releasing and distributing.
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
  it was never implemented.
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

Still open from this sweep (Tier 2): `/themes/deep-orbit/capstone` is in the
sitemap but 307s anonymous crawlers to the noindexed `/auth`; most routes
inherit the homepage's `og:url` and Twitter card; a guest who finishes module 1
sees "Continue M1" pointing backwards; first-time visitors are told
`error=session_expired`; four unpurchasable themes advertise `PreOrder` + `$59`;
`numberOfCredits: 11` reads as an accreditation claim.

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

Still open (Tier 2, mobile/a11y): the lesson step bar measures **0px wide at
320px** and 0.7px at 375px — `flex-1` crushed by `shrink-0` siblings; the
waitlist email input sets `focus:outline-none` with no replacement, so it has
**no focus indicator at all** (it is the pre-launch capture on all four
coming-soon pages); `--tc-border #3d3d3d` is **1.63:1** against the page
background, roughly half the 3.0 that WCAG 1.4.11 requires, and it draws every
form field boundary in the app; hint reveal, recall reveal and the magic-link
confirmation each replace a control with its own result, losing focus and
announcing nothing (`exercise.tsx:133-170` already contains the correct fix to
copy); theme purchase toggles carry no `aria-pressed`, so selection on the
$99-$159 basket is colour-only; 5 of 6 lesson steps have no `<h1>`.

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

## Tier 2 — Fix in week 1, before spending real money on ads

Not launch blockers. Each one wastes acquisition spend if left.

- **First lesson opens with a ~15.5s auto-playing scene** during which the page is functionally blank, escapable only via a `text-[10px]` "Skip" control. This is the activation moment for the entire product, and it is the destination of the landing page's primary CTA.
- **No email capture for guests anywhere in the free module.** A guest who reads two lessons and leaves is permanently unreachable — no retention sequence can target them.
- **Mobile: code editor sets 13px type**, below the iOS 16px auto-zoom threshold, with no mobile affordance past the mandatory exercise gate. No axe run exists at any mobile viewport.
- **Lessons ship ~100 indexable words** (only the current step is in the DOM) and require JS to render at all, with no `<noscript>`. Large organic-acquisition loss for a content-led product.
- **No `immutable` cache headers on `/vendor` or `/models`** — 1.4 MB of TFJS revalidates every session. Roughly $800/yr from a one-line change.
- **Kit automations still unbuilt** (operator task) and `KIT_TAG_PAYWALL_HIT` / `KIT_TAG_MODULE_1_COMPLETE` unset.

---

## Tier 3 — Fix before ~10k users, not before launch

- `skill_events` partitions end **2027-04-01**; `ensure_skill_events_partitions()` has zero callers and writes are fire-and-forget, so it fails **silently**.
- Six `auth.getUser()` round-trips per authenticated page view; no `React.cache()` anywhere.
- All 22 RLS policies use unwrapped `auth.uid()` (Supabase's documented #1 RLS performance anti-pattern).
- Missing `(user_id, attempted_at DESC)` on `exercise_attempts`; the `skill_axis` index was silently dropped in the `013` partition swap.
- Landing ships ~249 kB gzipped of TFJS eagerly.

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
