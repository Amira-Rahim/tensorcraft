# Scalability / Skeleton Architecture Audit — 2026-07-21

**The question this answers.** The goal is 100,000 paying JS developers learning
ML through storytelling across 5 themes, later scaled by enterprise seats and a
competitive arena. The owner already knows the current features won't reach
100k alone. What they need to know NOW: does the app's *skeleton* have the
potential to scale there, and are there **foundational** changes to the bones
that must be made early because retrofitting them after the corpus is large and
100k rows exist is exponentially costly?

**This is not a bug audit.** For launch bugs, security, legal, a11y and runtime,
see `docs/audits/full-audit-2026-07-21.md` and `docs/launch-blockers.md`.

**Method.** Three parallel architectural evaluations — story/content framework,
enterprise-seat multi-tenancy, arena/cross-user — each tagging findings
`FOUNDATIONAL` (fix early), `ADDITIVE` (safe to defer), or `SOLID` (already
scales). Every load-bearing claim below was re-verified by hand against the
code.

---

## Verdict

**The skeleton has the potential. No axis requires a rewrite.** The engine is
data-driven where it counts: theme content is a data manifest, the data model
keys on bare `user_id` (so orgs join on top rather than backfill), the grader is
a generic pure function with a headless Node twin, and the public-certificate
stack is already the exact shape a leaderboard needs.

The foundational items are few, and they are all the **same class of change** —
*move a hardcoded/scattered thing into the data layer that already exists beside
it, before it fans out.* Cheap now, punishing at scale. They are listed as the
convergent list at the end; the per-axis detail follows.

---

## Axis 1 — Story / Content framework

**Headline: the content ENGINE is theme-agnostic; the STORY SPINE and the QA
HARNESS are hardcoded to Deep Orbit.** All 5 themes are already authored to one
schema (~275 lessons: deep-orbit 56, neon 54, signal 55, nova 55, terra 55,
extras 21); Velite builds only `{deep-orbit,extras}` today
(`velite.config.ts:57`).

### SOLID (already scales)
- **The 5C schema, `themeId`-based queries, and the reader engine** are
  parameterized by slug, not branched per theme (`velite.config.ts:59-167`,
  `packages/content/src/queries.ts`, `lesson-steps.tsx` props).
- **The `ThemeManifest` data model** (`packages/themes/src/types.ts`,
  `packages/themes/src/*.ts`): slug, palette, `terminology`, `protagonist`,
  `characters`. A 6th theme is mostly *data* — a manifest, a content dir, a
  palette, a slug.
- **Character casting is a template, not bespoke:** every theme ships 1 Mentor +
  1 Skeptic + 1 AI plus peers/stakeholders. Theme-agnostic structure,
  theme-specific instances — the strongest scale signal.
- **DISPATCH / boss beats / counterfactuals** are theme-parameterized data
  mechanisms (`apps/api/src/lib/dispatch.ts` resolves module sizes by slug).
- **The content model is domain-general:** the `mlContent`/`skillAxis` axes are
  domain-neutral and TFJS represents image/text/audio as tensors uniformly, so
  CV/NLP/generative themes author in the same exercise collection with no schema
  fork.
- **The learner-capture substrate supports future adaptivity:** skill genome,
  boss-beat stance labels, and counterfactual choices are already recorded
  per user. A branching narrative would be additive on top; nothing blocks it.

### FOUNDATIONAL (fix before theme 2 — retrofit cost is exponential)
- **F1. The reader and capstone ignore `theme.terminology` and hardcode Deep
  Orbit words.** Verified: `lesson-steps.tsx:1230` emits `SECTOR {moduleSlug} ·
  MISSION {lesson.order}`, plus "Mission Map" (821), "Mission Complete" (1522),
  "Next Mission" (1569); capstone hardcodes the same. Meanwhile
  `module-map-client.tsx:82` *already* consumes `terminology.module` correctly.
  So the reader contradicts the map, and Neon Protocol (lesson word = "Protocol")
  would render "MISSION 3" on every lesson page. It's a handful of components
  reading a field that already exists — but it's an immersion break on every
  page of four themes if deferred until after they ship.
- **F2. The cross-theme META-ARC exists in prose but has no data model.** A real
  collection-level arc is designed — a closed narrative ring (deep-orbit →
  neon → signal → nova → terra → deep-orbit), the Deep Orbit finale literally
  hands its anomaly to the next theme, and a game-theory spine links Nova's GAN
  to Terra's bandits. But it lives as hardcoded `<DispatchTease>` props across 5
  capstone files plus a **2-entry `const THREAD` inline in
  `strategy-thread.tsx`** (verified). There is no schema field for a thread, no
  theme-graph, no meta-arc position. Reordering or inserting a theme means
  hand-rewiring pointers and continuity prose across capstones. **For a product
  sold on the arc, the arc is the least-modeled asset in the system.** Give it a
  lightweight data layer now (ordered ring, per-theme arrives-from/leads-to,
  named spines) so references resolve against data. Also decide whether sequence
  should be rewarded/soft-guided — today nothing does, so a learner who buys
  Terra Grid first sees a "continue from Nova Canvas" tease for a theme they
  never saw.
- **F3. The QA gate harness is hardcoded to deep-orbit+extras**, so it is blind
  to 72% of the authored corpus. Verified: `end-of-lesson.test.ts:21` iterates
  `["deep-orbit","extras"]`; `exercise-counts`, `epoch-traces`,
  `metadata-consistency`, `interval-canon`, and `structure-variety` are all
  similarly scoped, and the anti-template *variety* gate — the direct answer to
  prior "template lockstep" audits — sees only the 77 shipped lessons. At 275
  lessons across 5 themes, template-sameness is the single biggest
  perceived-quality risk to a large audience, and it is currently policed on a
  quarter of the content. Parameterize the harness to iterate `THEME_SLUGS` and
  externalize the per-theme canon table now, while there is one canon to
  generalize instead of five that have silently diverged.

### ADDITIVE (safe to defer)
- Per-theme live-demo components + trained model assets (the `DeepScanDemo`
  pattern is bespoke per theme — a per-launch artifact, not a schema change).
- Multi-framework bridge variants: the seam is already correct
  (`bridges.ts:25` `variants?: Partial<Record<Framework, BridgeVariant>>`).
  Widening "React dev" → "any JS dev" as *positioning* is a cheap labeling
  layer; true Vue/Svelte analogies are a large content effort but need no schema
  fork. Keep new FE analogies flowing through the `bridge`/`variants` field —
  do not bake framework assumptions deeper into the lesson body.
- Adaptive/branching narrative over the existing choice-capture layer.
- Full per-theme character bibles + voice cards (input to consistency; produce
  just before each theme's launch, not after).
- Reconcile the stale secondary Zod mirror (`packages/content/src/schemas.ts`
  still asserts `lessonCount: literal(5)` / `hints.length(3)`; Velite is the
  build authority, so harmless — just a fossil).

---

## Axis 2 — Enterprise-seat multi-tenancy

**Headline: no single-tenant assumption is baked into the leaf tables, so seats
are additive.** Verified: `org_id`/`organization`/`tenant`/`seat`/`team_id`
returns **zero** hits across schema and code — clean greenfield, nothing to
unwind. All 11 user-owned tables key on a bare `user_id`, so org membership is a
**join table** (`orgs`, `org_members`), NOT an `org_id` backfilled across 11
tables. The expensive path is not required.

### SOLID
- Bare-`user_id` keying on all 11 tables; uniform `auth.uid() = user_id` RLS
  that extends by *addition* (Postgres ORs permissive policies, so a manager
  read is a second SELECT policy alongside the self-read).
- The guest-provisioning primitive `resolveOrCreateUserByEmail`
  (`apps/api/src/lib/guest-account.ts:19`) is exactly what seat invite/provision
  needs — reusable as-is.
- Aggregate view shapes grouped by `(user_id, theme_id)`
  (`005_progress_summary_view.sql`, `012_scalability_indexes.sql`) are the
  natural substrate for org rollups — a join+group-by, no denormalization at
  current scale.

### FOUNDATIONAL (cheap now, exponential after 100k rows / more migrations)
- **F4. Centralize entitlement behind one function.** Verified: access is
  decided by `theme_ids`/`hasThemePurchase` reads across **13 files** (47 hits),
  roughly half hand-rolling `.contains("theme_ids", …)` outside the helper —
  and `hasThemePurchase` itself carries the warning *"keep this in sync with
  apps/api"* (`progress.ts:80`). The manual-sync burden is already real
  single-tenant. Seats require swapping the entitlement *source* (individual
  purchase → org seat grant); that means touching all 13 sites unless collapsed
  now into one `getEntitledThemes(userId)`. Highest-leverage code item.
- **F5. Establish a `SECURITY DEFINER` helper for cross-user reads** now,
  mirroring `is_admin()` (`006:67` / `021`). An org-admin read policy that
  subqueries `org_members` will otherwise reproduce the exact recursion trap
  (42P17) that migration 021 already had to fix once. Set the convention before
  many policies exist. **(Converges with Axis 3.)**
- **F6. Add nullable `stripe_customer_id`** (to `profiles` or a
  `billing_accounts` table). Verified: zero `stripe_customer` anywhere — only
  `stripe_session_id` is stored. Quantity-based seat subscriptions AND recurring
  billing (roadmap Horizon 1, *before* seats) both need a durable Stripe
  customer. One nullable column now vs a Stripe backfill after subscription rows
  exist.
- **F7. Decide the org-report access path** (SECURITY DEFINER function vs
  service-role API aggregation) before the summary/materialized views calcify.
  Matviews can't carry RLS — this already caused the `dashboard_stats` breach
  fixed in migration 040 — so an org report cannot be a plain RLS'd view.

### ADDITIVE
- `orgs` / `org_members` / `seats` / `invitations` tables — pure additions;
  membership is a join, **no `org_id` backfill on the 11 leaf tables**.
- A second "org-admin can read" RLS policy per table — ORs alongside self-read.
- "Buyer ≠ learner" — `purchases.user_id` is just an FK; the webhook already
  provisions a different identity than the interactive buyer (guest flow).
- Org progress rollups — a join+group-by over existing indexes and views.

---

## Axis 3 — Arena / cross-user

**Headline: addition, not rewrite — and server-verifiable grading is
adopt-not-build.** The single-player foundation contains no assumption that
blocks a competitive layer, and the certificate stack is already a general
public-share pattern.

### SOLID (reusable as-is)
- **A generic grader with a headless Node twin.** Verified: `parseAndRunTests`
  (`exercise-runner.ts`) is a pure function over `(userCode, testCode)`, and
  `exercise-runner-node.ts` + `scripts/validate-exercises.mjs` already run the
  same harness server-side (the "grader 83/83"). Server verification means
  *reusing an existing runner behind an endpoint*, not building one.
- **The cross-user read pattern already ships:** `get_shared_certificate` is a
  `SECURITY DEFINER` function granted to `anon` returning only public-safe
  columns while the table stays RLS-locked (`019:72-99`). A leaderboard read is
  the same shape.
- **Shareable results are nearly free:** public share page + RPC +
  unauthenticated GET (certificates), and a *generic* OG renderer that already
  branches on a `kind` param (`apps/web/app/api/og/route.tsx`). Adding an
  `arena`/`rank` card is a new branch.
- **Play-before-signup is supported:** grading needs no identity, and the
  guest-capture→claim-on-signup funnel (`guest-progress.ts` +
  `GuestProgressBridge`) is the exact "play anonymously, claim on signup"
  mechanic.
- **No realtime forced.** Verified: zero realtime subscriptions in the repo
  (a cost win). A leaderboard is read-heavy and staleness-tolerant; the existing
  ISR/edge caching applies directly.

### FOUNDATIONAL (decide before writing submission code)
- **A1. Route arena scores through server re-verification.** Verified: the API
  trusts client-reported `passed`/`score` (`exercise-attempts.ts:56-114`
  range-checks 0-100 but never re-runs) — forgeable with one `curl`. Fine for
  solo analytics, fatal for a competition. Cheap because the Node grader exists,
  but the `submissions` schema must assume a `verified_score` from day one.
- **A2. Commit to the `SECURITY DEFINER` RPC (or service-role matview) pattern
  for all cross-user reads.** The naive public view/matview is a *proven breach*
  here (migration 040). **This is the same decision as F5** — one convention
  serves seats and arena both.
- **A3. Give the arena its own `challenges`/`submissions`/`seasons` tables.**
  Don't overload `skill_events` (fixed domain enums) or `exercise_attempts`
  (lesson-keyed). Copy their *shape* and the `compute_user_skill_genome`
  aggregate-RPC *pattern*, not the tables.
- **A4. Decide the grader's determinism contract** — `tf.randomNormal` uses
  unseeded `Math.random()`; competitive scoring needs deterministic or seeded
  grading. Cheap to decide now.
- **A5. If referral virality is in scope, design that primitive deliberately.**
  Greenfield — only a `waitlist.source` marketing string exists; no
  `invite_code`, no attribution-on-signup. A code column on `profiles` from the
  start beats grafting attribution on later.

### ADDITIVE
- The `challenges`/`submissions`/`seasons` tables, the leaderboard RPC, the
  re-verify endpoint, ELO/percentile math, the arena share page + OG kind, and
  an anonymous-submission/claim endpoint. None conflict with existing tables.

---

## STATUS — Tier 0 + Tier 1 + the journey model SHIPPED (2026-07-21, uncommitted)

Built this session, in code, with tests. Operator must still apply the new
migrations (see `docs/migration-runbook.md`).

- **[DONE] Tier 0 migration process.** Convention
  (`packages/supabase/migrations/CONVENTIONS.md`: transaction-wrapped,
  idempotent, self-recording, paired down-migration), a `schema_migrations`
  ledger that backfills 001–041 (migration `042`), authoring templates
  (`_template.sql`/`.down.sql`), a drift/status script
  (`scripts/migration-status.mjs`, `pnpm migrate:status`), and a runbook
  (`docs/migration-runbook.md`). Every migration written after this (043, 044)
  follows it — proving the convention on real feature tables.
- **[DONE] Tier 1 F4 — entitlement centralized.** `apps/web/lib/entitlements.ts`
  `getEntitledThemes(userId)` / `canAccessTheme` is now the single source; the
  three hand-rolled Set-loaders (dashboard, themes, capstone) and
  `hasThemePurchase` all delegate. Swapping in seat-based access later changes
  one function. 5 tests.
- **[DONE] Tier 1 F5 / A2 / F7 — cross-user-read convention.** Documented as a
  hard rule in `CONVENTIONS.md` ("Cross-user reads"), citing `is_admin()`,
  `get_shared_certificate`, and the service-role-matview shapes. Seats and
  arena reuse it instead of re-deriving the leak fixed in migration 040.
- **[DONE] Tier 1 F6 — `stripe_customer_id`.** Migration `043` adds the
  nullable column + partial index; the webhook persists it best-effort. 2 tests.
- **[DONE] F2 — the cross-theme journey is now modeled as data.**
  `packages/shared/src/journey.ts`: the ordered ring (`arrivesFrom`/`leadsTo`
  with wraparound), named spines, and helpers (`recommendedNextTheme`,
  `getSpineStops`). `StrategyThread` and `DispatchTease` resolve from it
  instead of a hardcoded `THREAD` constant / per-capstone props — reordering
  or inserting a theme is now a data edit, not a hunt across five capstones.
  Hybrid canonical track: migration `044` (opt-in `journey_enrollment`, per-user
  RLS, position derived not stored) + `apps/web/lib/journey-progress.ts`
  `getJourneyState` composing ring + entitlements + completion. 12 journey tests.

**[DONE] Canonical-track UI.** `/journey` (server page): the five themes as one
ring with per-theme progress, a soft "recommended next", opt-in enrollment
(`EnrollButton` → `journey_enrollment` via RLS), and a ring-complete
acknowledgement. Logged-out visitors see the arc as an overview with a sign-in
CTA. Nav + mobile-nav + sitemap entries added. `getJourneyState` has 6 tests;
`next build` confirms the route. The richer surface (capstone-of-capstones) can
grow on this; the core hybrid (free play + opt-in canonical track) is live.

**[DONE] F1 — reader + capstone driven by `theme.terminology`.** The reader's
six hardcoded Deep Orbit words (MISSION / SECTOR / Mission Map / Mission
Complete / Next Mission / Mission Progress) and the capstone's five now resolve
from `themes[slug].terminology`. Deep Orbit renders identically; Neon Protocol
now says "PROTOCOL", Signal Ward "PROCEDURE", etc. — no more "MISSION 3" on a
theme whose word isn't Mission.

**[DONE] F3 — QA gates track the build from one constant.** New
`packages/content/src/built-themes.ts` (`BUILT_THEME_DIRS`) is the single
source; Velite's glob and all six gates (exercise-counts, epoch-traces,
metadata-consistency, end-of-lesson, interval-canon, structure-variety) read
it. Launch a theme by adding it there once and every gate covers it — no
per-test edits. interval-canon's canon and structure-variety's thresholds are
now per-theme (each launched theme independently held to the anti-lockstep
floor), so the consistency net stops seeing only 77 of 275 lessons.

**Still ADDITIVE / deferred:** the capstone-of-capstones finale for the
canonical track; per-theme live-demo components + model assets; multi-framework
bridge variants; branching narrative over the choice-capture layer; per-theme
character bibles. All sit on the foundations now in place. Verify each with a
real `next build` and `pnpm migrate:status` before trusting applied state.

## The convergent foundational list — what to actually do, and when

The striking result is how much the three axes overlap. Ordered by leverage:

### Tier 0 — gates every schema change (do first)
- **Fix the migration PROCESS** — tracking, transaction-wrapping, a real
  apply/rollback runbook. Seats need ~6 coordinated migrations, the arena needs
  ~3, the meta-arc and terminology need schema too, all against a live 100k-row
  DB — and today there is no migration tracking, 17 migrations are
  non-idempotent, none are transaction-wrapped, and rollback covers 3 of 41
  (`full-audit-2026-07-21.md §3`). This is a *process* property that determines
  whether every other change below can be applied safely. **It is already a
  launch-blocker item — your scaling future and your launch hygiene want the
  identical fix.**

### Tier 1 — one decision, serves multiple futures (cheap, do soon)
- **Establish the `SECURITY DEFINER` cross-user-read convention** (mirror
  `is_admin()`). Required by seats (F5) AND the arena (A2), and the naive
  alternative is a proven breach. Decide and document once.
- **Centralize entitlement** behind `getEntitledThemes(userId)` (F4). 13 files
  today; collapse before seats add a second source and the count fans out.
- **Add nullable `stripe_customer_id`** (F6). Needed by recurring billing (H1)
  and seats (H3); one line now.

### Tier 2 — before theme 2 ships (story spine, retrofit-exponential)
- **Drive the reader/capstone from `theme.terminology`** (F1).
- **Give the cross-theme meta-arc a data model** (F2) and decide sequence
  rewards.
- **Parameterize the QA gate harness per-theme** and externalize canon (F3).

### Tier 3 — before the respective feature (design-time decisions)
- Arena: server re-verification schema (A1), own tables (A3), grader determinism
  (A4), referral primitive if in scope (A5).
- Seats: org-report access path (F7).

**Everything else is genuinely additive** — orgs/seats/arena tables, second RLS
policies, org rollups, per-theme demos, multi-framework variants, branching
narrative. None is a rewrite; all sit on top of the substrate that already
exists.

### The one-sentence answer
The bones can carry the goal. The only things that get dramatically more
expensive by waiting are: the migration process (fix first), one cross-user-read
convention plus entitlement centralization (both already on your launch list),
and three story-spine items that should land before theme 2 — none of them a
rewrite, all of them "move a hardcoded thing into data that already exists next
to it."
