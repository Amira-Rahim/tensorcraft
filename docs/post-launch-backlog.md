# Post-Launch Backlog (canonical)

**This file is the single source of truth for every task deferred to after V1
launch.** Created 2026-07-21 by consolidating `v2-polish-backlog.md`,
`dev-plan.md` §9d/§10d/§10e/§10f, `v2-beat-expansion-plan.md`,
`email-retention-sequences.md`, the growth roadmap task lists
(`roadmap.md` Horizons 1-3), and Claude memory entries.

**Rule:** when postponing any work, add a checkbox line HERE (with its gate and
a link to the detail spec if one exists). Detail specs stay in their own files;
this doc is the index of record. Deferred mentions surviving elsewhere
(`dev-plan.md`, audit ledgers) are historical and non-authoritative.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

Everything in this file is V2 (post-launch). There is no V3 tier; former
"V3+" items are folded into the sections below like everything else.

Not tracked here (pre-launch, one document): ALL pre-launch work lives in
`docs/launch-blockers.md` — code defects (Tier 1/2), pending operator
migrations (037-040), and the operator + distribution setup moved there
2026-07-22 (Tier 1-OPS). Full findings register:
`docs/audits/full-audit-2026-07-21.md`. (The "91 Dependabot alerts" note in
memory was refuted by that audit: `pnpm audit` clean.)

---

## 1. Operator + external service setup

> **MOVED OUT 2026-07-22:** everything measurement/email/reach-shaped
> (PostHog + event verification, metrics dashboard + alerts, Kit lifecycle
> setup + retention automations, Sentry alerting, Plausible, Google Search
> Console, Product Hunt upcoming page, first blog batch + audience-track
> start; second pass same day: Twitter/X account creation + pricing
> FAQPage JSON-LD) is pre-launch work and now lives in
> `docs/launch-blockers.md` "Tier 1-OPS". Launch-traffic data is
> unrepeatable; those were mis-filed here. Remaining below = genuinely
> post-launch.

- [ ] PPP (Purchasing Power Parity) indicator on pricing page.
- [ ] Payment plans (installments): evaluate Klarna/Afterpay.
- [ ] Review prompt at certificate issuance + collect beta quotes: the
  build task that produces the third-party proof the two items below
  consume (`roadmap.md` §2 P3 kept this half when "name the teacher" was
  rejected).
- [ ] Social proof on landing page once real user counts exist.
- [ ] Pricing-page JSON-LD AggregateRating once reviews exist.
- [ ] Testimonials on landing/pricing once real users exist.
- [ ] Compliance polish (audit register §2 P2, triaged 2026-07-22): consent
  granularity/versioning/expiry (CNIL ~6mo); equalize Accept vs
  "Essential only" salience; banner names only PostHog (add Plausible +
  Vercel Analytics); gate Sentry session replay behind consent
  (`replaysOnErrorSampleRate: 1.0` exceeds strictly-necessary); disclose
  the `tc_theme` cookie; align the under-16s claim with reality or add an
  age gate.
- [x] ~~14-day refund guarantee badge on pricing cards~~ — already shipped
  (Horizon 0 P3, 2026-07-21: badge exists and was moved above the tier
  grid). Stale item caught 2026-07-22.
- Note: a second stale item ("Sentry integration", claimed console-stub) was
  dropped — Sentry capture is already wired (launch-blockers R2-5); the
  real remaining work is alert rules, tracked in Tier 1-OPS.

## 2. Ongoing operations cadence

- [ ] Weekly metrics review: completion rates, hint dependency, time-on-page,
  conversion.
- [ ] Cohort analysis: performance by difficulty, theme, learner background.
- [ ] Content maintenance cycle: monthly review analytics + optimize 2-3
  lessons; quarterly character/narrative consistency audit; biannually full
  curriculum technical-accuracy + bridge-consistency audit.
- [ ] Analytics-driven content QA thresholds: lesson completion beginner ≥75%
  / intermediate ≥60% / advanced ≥45%; exercise pass ≥70% within 3 attempts
  (content review if <50%); hint dependency ≤40% of completions (>60%
  triggers exercise redesign); scroll depth ≥75%; story-skip >40% in any
  module flags narrative redesign.
- [ ] Respond to beta feedback + community Discord questions.
- [ ] Plan V1.0 scope (Deep Orbit Modules 6-11).
- [ ] Re-audit cadence: run the multi-agent quality audit after each major
  content sprint; index audits in `docs/audits/README.md` (index still TODO).
- [ ] Priority/effort pass over this backlog: sections (§4 especially) have
  grown into unordered mixes of 1-line fixes and 20-day features; rank
  within each section (impact × effort) so the index stays navigable
  (added 2026-07-22).
- [ ] Quality-rubric maintenance: extend `docs/quality-rubric.md` before
  shipping any new content pattern.

## 3. Data-gated content work

- [ ] **Re-test `PRICING.single` at $79** (gate: 200 paying users, the same
  threshold as the theme-2 gate). Deliberately NOT raised on 2026-08-09 when
  63 scene plates and 16 portraits shipped: art is a quality signal, not a
  scope signal, marginal cost was ~$5, and nobody had paid anything yet, so a
  raise would have stacked a second unvalidated guess on the 2026-06-20 raise
  from $49. Distribution is the binding constraint; a raise tightens it.
  Revisit only on real conversion data. Reasoning:
  `docs/superpowers/specs/2026-08-09-pricing-reevaluation-design.md`.
- [ ] **Restore the bundle surfaces when theme 2 launches.** Three things
  self-heal off `LAUNCHED_THEMES` with no edit (the tier cards, the JSON-LD
  `availabilityFor`, and `BundleRoadmap`, which returns `null` once nothing is
  gated). Two do NOT and must be done by hand: the `metadata` descriptions in
  `apps/web/app/pricing/page.tsx` dropped their "bundles up to $N" clause, and
  the hero paragraph dropped "bundle a few, or all five themes".
- [ ] **BossBeat expansion** (6 ranked beats, one per dormant module).
  Gate: ~100 real lesson completions so placement follows observed drop-off.
  Detail spec + non-negotiable quality gates:
  `docs/v2-beat-expansion-plan.md`.
- **GT LATER cohort** (gate: 1000 users; designs preserved in
  `~/.claude/plans/do-you-think-game-reactive-hennessy.md`):
  - [ ] #2 Team layer (opt-in): teams/team_members/leadership_log + invite
    codes + opt-in public boards (~10-14d).
  - [ ] #10 Shared team bandit (hard dep on #2, ~5-7d).
  - [ ] #4 Adversarial pair mode: Realtime split-screen Sandpack (~14-20d).
  - [ ] #7 Mentor ghost mode: anonymous decision-distribution overlay
    (~8-12d).
  - [ ] #14 Capstone auction (Vickrey; needs auction lesson first, ~14-18d).
  - [ ] #8 Trade-the-bridge gifting (~3-5d).
  - [ ] #9 Public capstone gallery at /gallery (~5-8d).
- **GT items deferred within the NOW cohort:**
  - [ ] #5 Branching quizzes (high authoring tax, ~14-20d full curriculum).
  - [ ] #12 Reputation currency (SP cosmetic only; re-evaluate when LATER
    opens).
  - [ ] #17 Branching theme epilogues (~6-8d).
  - [ ] #16 Voice-actor character cards ($$$$ recurring; defer).
  - [ ] #18 Character-perspective re-render (3-4x MDX cost; defer).

## 4. Polish (editorial, models, features)

- [ ] **Light-mode follow-ups** (deferred from the 2026-07-23 rollout; context
  in `docs/dev-plan.md` 2026-07-23 entry + `docs/superpowers/plans/2026-07-22-light-mode.md`):
  - [ ] Scheme toggle inside the lesson viewer (lesson pages are chromeless —
    no site nav — so today learners flip scheme from other pages or the OS;
    candidate spot: the lesson ChromeBar).
  - [ ] Scheme toggle inside the open mobile-nav drawer (overlay covers the
    top bar while open; duplicate the toggle next to the drawer's close button).
  - [ ] One-time Windows/Linux visual check of the nav toggle glyphs
    (◐ U+25D0 has no production precedent and sits outside the latin font
    subset; tofu risk on non-mac platforms).
  - [ ] `Ticker`/`TickerCanvas` appears to be dead code (no live importer,
    only a stale layout.test mock) — confirm and delete or re-mount.
  - [ ] Tighten `SceneCanvas`'s `rgbLight` from optional-with-fallback to a
    required dark/light tuple once all call sites are stable (a new consumer
    can currently omit it and silently render dark-only hues in light).
  - [ ] Optional: scope `transition-colors`/`transition-all` utilities to
    hover/focus states so the scheme flip is perfectly uniform (today ~186
    small chrome elements ease 150ms while surfaces snap — assessed fine).
  - [ ] Optional: client-sync `meta[name=theme-color]` when the user's manual
    override disagrees with the OS (browser chrome color mismatch, cosmetic).

- [ ] **Story-voice Phase 4 spot-check editorial pass** (~3.5h): dump 702
  dialogue blocks, spot-check top 5 speakers against `docs/voice-guide.md`,
  edit ~20 outliers per character, re-run velite + build.
- [ ] **Studio-one VAE real-data retraining** (~3h): tiny CelebA subset fixes
  posterior collapse; architecture unchanged.
- [ ] **Capstone real-data retraining, all 5 themes** (~10h total): Deep
  Orbit DEEP SCAN (LIGO / Kaggle audio anomaly), Neon SENTINEL (CIFAR-10),
  Signal DIAGNOSTIC-ONE (MIMIC-III + ClinicalBERT), Nova STUDIO-ONE (CelebA),
  Terra METEOR (ERCOT).
- **Slice C leftovers (game-theory spine):**
  - [ ] SHAP cross-link in `<StrategyThread>`: needs a public route for
    `extras/*` content (cheaper) or moving SHAP into a launched theme.
  - [ ] Auction lesson (Terra Grid, Vickrey; FE bridge: CSS specificity wars).
  - [ ] Stackelberg reframe of adversarial patches (Neon Protocol).
  - [ ] RLHF preference-learning reframe (Signal Ward).
  - [ ] Email nudge for streak-at-risk (Resend template + cron at
    `last_lesson_completed_at + 24h` when streak ≥3 and `email_alerts`).
  - [ ] PWA / push notifications (no manifest.json / service worker today).
  - [ ] Capstone leaderboard (opt-in, Kaggle-style holdout; needs hosting +
    cheating mitigations).
  - [ ] Commitment device at checkout (finish-by date, opt-in nudges).
  - [ ] Cohort starts (synchronized start dates, theme-mate pairing).
  - [ ] Thompson-sampling scheduler upgrade (after a Bayesian intuition
    lesson exists; keeps self-reference parity).
- [ ] **Tensorcraft Pulse** (content freshness via scraping): /pulse feed +
  in-lesson `<Currents>` + /admin/signals. ~$5/mo, ~3-5d. Plan:
  `docs/superpowers/plans/2026-05-03-tensorcraft-pulse.md` (status DEFERRED;
  reactivate by flipping plan header + plan-document-reviewer + Task 0.1).
- [ ] Capstone v2 with multi-model ensembles.
- **Character personas follow-ups** (avatars shipped 2026-06-15 as monogram /
  AI-glyph placeholders via `CharacterAvatar`; bible + prompts:
  `docs/character-bible.md`):
  - [x] **Character animation stream** (SHIPPED 2026-08-05): expression
    crossfade + entrance + talking scanline via `AnimatedAvatar`, ARIA as a
    live procedural waveform (`AriaWaveformAvatar` on SceneCanvas, 4 states),
    `expression="..."` Dialogue annotations gated by
    `packages/content/src/expressions.test.ts` against the manifest
    `expressions` field. Motion rules recorded in `docs/ui-ux-notes.md` 5.3.
    Also shipped art-agnostic **scene portrait slots** (`ScenePortrait`,
    Briefing establishing shot as a playback beat + the 7 epilogue variants;
    paths `public/scenes/<theme>/<module>/<lesson>[-epilogue].webp`, alt from
    `scene.portraitAlt` / `scene.epiloguePortraitAlt` frontmatter).
  - [x] **Real cel-shaded art, Deep Orbit** (SHIPPED 2026-08-09): all 20
    portraits (5 characters x neutral + 3 expressions, ARIA included as an
    abstract voice-orb glyph)
    live at `apps/web/public/characters/deep-orbit/`, 22-31 KB each. Made
    with FLUX.2 [pro] via fal.ai through `scripts/art/generate.mjs` +
    `scripts/art/ingest.mjs`; approved canons kept as regeneration anchors
    in `docs/art-refs/deep-orbit/`. Gates 0/A/B cleared; production log and
    the prompt rules the gates taught (age markers, framing, no-text) are in
    `docs/character-bible.md`. Other themes remain gated on theme launch.
  - [x] **Scene portrait art** (SHIPPED 2026-08-09): all 63 scenes (56
    briefings + 7 epilogues) live at `apps/web/public/scenes/deep-orbit/`,
    median 116 KB webp. Four approved location master plates at
    `docs/art-refs/deep-orbit/masters/` are the reference for every scene, so
    each set stays itself across the corpus. Alt text is in lesson
    frontmatter. Gates C and D cleared; `docs/scene-bible.md` holds the
    entries, the production log and the prompt rules the gates taught.
  - [ ] Content pass annotating `expression="..."` on high-value Dialogue
    blocks (the gate and all 16 assets are live, so annotations take effect
    the moment they are authored).
  - [ ] The other 20 character sheets (Neon / Signal / Nova / Terra) +
    theme wiring + their scene art: gated on those themes launching (see §5).
- **Audit-parked UX + a11y** (flagged "parked on post-launch backlog" in
  `pre-launch-checklist.md` Rounds 11-12 but never filed until 2026-07-22;
  a third item, "HintPanel coverage 3/56", was dropped as stale — Run #7
  regenerated 77 hint ladders on 2026-07-16):
  - [ ] Sandpack offline fallback for the exercise editor.
  - [ ] Arrow-key support in exercises.
  - [ ] Touch-target sweep to ≥44×44 (per `docs/audits/accessibility-audit-2026-04-20.md`;
    verify current state first — the 2026-07-15 per-step axe gates do not
    check target size).
  - [ ] User-menu focus trap + focus restoration.
  - [ ] A11y medium/low sweep (audit register §5, triaged 2026-07-22):
    tell keyboard users Escape exits the editor (Tab indents); make the
    screenshot dropzone keyboard-operable; `tabIndex={0}` on overflowing
    code blocks; announce step *completion* in the step bar (visited state
    is colour-only, `title` swallowed by `aria-label`); `role="alert"` +
    `aria-invalid`/`aria-describedby` on auth errors (`aria-invalid`
    appears zero times in the codebase); onboarding `<main>`; fix
    `role="tabpanel"` placed on `<main>` in settings; label the second
    `<nav>`s; real arrow-key/Escape handling for `role="menu"` in
    user-menu; stop hiding "Best Value"/"Available Now" behind
    `aria-hidden`; enlarge the 15.5s-scene Skip control; 15px/12px inputs
    to ≥16px (iOS zoom); report-issue panel clips at `left:-60px` @320px.
- [ ] DISPATCH milestone producer uses strict `=== count` and silently
  stops firing when orphan/renamed lesson rows overshoot the count —
  the board-clear payoff never arrives. Use `>=` like
  `certificates.ts:137`.
- [ ] DISPATCH weekly-intel cron: the milestone producer shipped 2026-07-13
  but the *weekly* push (#13's premise) has no scheduler — pick pg_cron or
  a Vercel Scheduled Function (explicitly deferred in
  `docs/gt-narrative-polish-checklist.md`, never filed until 2026-07-22).
  Same for the dispatch-messages email mirror via Resend.
- [ ] Counterfactual data layer: migration 031 + `counterfactual-client.ts`
  still collect choices but the `/log/rewind` surface was cut 2026-06-01 —
  data accrues that nothing reads. Build a surface (#3's payoff) or stop
  collecting; GDPR minimization argues against hoarding it
  (added 2026-07-22).
- [ ] Reconcile `docs/gt-narrative-polish-checklist.md` open items against
  Runs 6-8 — verify what's done, fold survivors here, mark the checklist
  historical.
- [ ] Verify R0-R4 structural-variety closure: the
  copy-humanization-reaudit plan (2026-06-10) was likely absorbed by Run 7
  cadence work + Run 8 endorsement, but never formally ticked off. Check
  `docs/audits/copy-humanization-reaudit-2026-06-10.md`; fold any
  survivors here.
- **Low leverage, skip-flagged unless metrics argue otherwise:**
  - [ ] Bridge per-framework variants (Vue/Angular/Svelte, ~5h).
  - [ ] Quiz coverage expansion past current 24% (diminishing returns).

## 5. Theme launch sprints (V1 = Deep Orbit only)

- [ ] Neon Protocol, Signal Ward, Nova Canvas, Terra Grid: full curriculum
  content per theme (each its own launch sprint; scope doc:
  `docs/launch-scope.md`).
- [ ] Per-theme GT narrative launch content (DISPATCH, boss beats, cameos)
  for each new theme, outlined in the GT plan file.
- [ ] Theme-specific glossary terms for unlaunched themes.
- [ ] Per-theme Kit purchase sequences (5x `KIT_TAG_PURCHASED_{THEME}` + 5
  sequences) if per-theme email marketing becomes worth it.
- **Theme-2 launch prerequisites** (dormant until a second theme sells):
  - [ ] Purchase credit survives refund/dispute: upgrade pricing sums
    `partially_refunded` rows, so a disputed purchase still funds the
    bundle discount. Unreachable with one theme; live the day theme #2
    launches.
  - [ ] neon-protocol has 54 MDX files vs the 55 that
    `THEME_CONTENT.comingSoonLessonsPerTheme` promises (`image-data` has
    4); add a test pinning coming-soon counts.
  - [x] ~~PCA/SVD deep-dive~~ SHIPPED EARLY (2026-07-27) as shared
    `extras/math-deep-dive/08-eigenvectors-svd-compression` (companion to
    optimization-edge, drawer entry in 03-pruning), since extras are
    cross-theme and Deep Orbit had its own hook. Remaining theme-2 slice:
    when neon-protocol's feature-extraction module launches, add a
    DerivationDrawer entry point from its embeddings lessons to the same
    deep-dive (no new authoring).

## 6. Big deferred bets

- [ ] **AI video scenes** (post-V1, one-time ~$540-1,140 via Runway Gen-3/4 +
  ElevenLabs). Full design spec: `docs/future-ai-video-scenes.md`. Key
  decisions made: stylized/animated, 5-15s clips, R2 CDN, `<VideoScene>`
  swap, build-time generation. Revisit when theme sales can fund it or AI
  video drops below ~$0.25/clip. Subsumes audio narration (video includes
  voice acting).
- [ ] **Audio narration fallback** (only if video stays too expensive):
  AI TTS, narrative steps only (Briefing + Consequence), one theme first,
  auto-regeneration from MDX. Standalone narration was rejected for V1:
  interactive-first lesson model conflicts with passive audio, ~1,650
  segments to maintain, re-record on every MDX edit, >40% story-skip risk.
- [ ] **Team pricing** (design from enterprise demand data).
- [ ] **Team license management** (admin dashboard, seat assignment, progress
  reports).

## 7. Platform + infra deferrals

- [ ] Real background job queue (Upstash QStash / Fly Machines cron) for
  large digest backlogs; deferred until job-queue infra is chosen.
- [ ] Integration / visual-regression / perf test suites against real
  Supabase + Stripe prod + GitHub API (deferred to beta;
  `docs/visual-regression.md`).
- [ ] Exercise-runner timeout vs TFJS download: the 1.47 MB TFJS bundle
  downloads inside the runner's 10s timeout, so a slow-connection
  learner's first "Run Tests" fails as "Timed out after 10 seconds",
  misattributed to their own code. Preload before arming the timer, or
  exclude download time from it.
- [ ] Test-infra debt (2026-07-21 audit structural notes): e2e `webServer`
  allowance is 30s against measured 19-154s cold compiles, so the a11y
  gate fails open and Themes / Pricing / all six lesson steps can skip
  verification silently; Firefox has zero automated coverage; the three
  WebKit projects run the mobile smoke suite only; no `browserslist`
  (floors in `docs/browser-support.md` unenforced); `metadata.test.ts`
  reads exported objects in isolation with zero `generateMetadata`
  coverage. Also fix e2e viewport truth: `mobile.spec.ts` claims iPhone SE
  is 375×667 but Playwright's device is 320×568, leaving 375px — the most
  common real iPhone width — covered by no project; `reflow.spec.ts`
  passes while the report panel is clipped (its own `overflowX:hidden`
  masks it). Register's structural close: make gates fail **closed** and
  test resolved behaviour at real viewports.
- [ ] CI/CD gating debt (audit §4): no branch protection or required
  checks — Vercel deploys on push regardless of failing tests/e2e/lint
  (`eslint.ignoreDuringBuilds: true`); the only real gate is bypassable
  husky pre-push; `pnpm audit`, `format:check`, and migration drift absent
  from CI; no Dependabot/Renovate config to surface the next CVE; no API
  deploy workflow (`fly deploy` manual, web/API version skew unmonitored).
- [ ] Security hardening, low tier (audit §1, grouped): `achievements`
  self-insert of any badge; 30s JWT-cache life for revoked tokens;
  auth-callback `allowedHosts` falls through to `origin` instead of
  rejecting; validate `module_id`/`exercise_slug` before the GitHub path;
  webhook amount mismatch logs but still grants; logger redact list misses
  `github_token` and only reaches depth 1; unsubscribe token in query
  string; `avatar_url` validation is dead code (settings writes via
  PostgREST; add a DB CHECK or route through the API).
- [ ] Data-integrity P2 cluster (audit §3, grouped): client-supplied
  `completed_at` corrupts the heatmap on skewed clocks; guest replay
  collapses multi-day study into one streak call; DISPATCH dedup TOCTOU
  (duplicate inbox message, cosmetic); `/certificates/[id]` still 404s on
  non-ok HTTP during outages; delete `lesson-progress.tsx` dead code
  (carries two live bugs); frontend bypasses `POST /api/progress` and all
  its validation; `cache.ts` has bare Redis calls and zero callers; stop
  describing `cert_hash` as verifiable (no verification endpoint).
- [ ] Migration hygiene retrofit (audit §3): 17 of 40 migrations
  non-idempotent, none wrapped in BEGIN/COMMIT, rollback SQL covers 3 of
  40, no down-migrations. Retrofit as part of adopting real migration
  tooling.
- [ ] Code Hike scrollytelling (§7c, post-V0.5; Shiki shipped instead).
- [ ] `LossLandscape` component (atmospheric-only; revisit post-V1).
- [ ] `ActivityHeatmap` component (post-V0.5).
- [ ] Remove deprecated `<Quiz>` + `<KeyTakeaways>` MDX components once all
  themes are migrated off them.
- **Audit-parked email + pipeline resilience** (pre-launch-checklist Rounds
  11-12, filed here 2026-07-22):
  - [ ] Refund-comms email (transactional template when a refund is issued).
  - [ ] News-scrape failure alerts.
  - [ ] Newsletter retry queue.
  - [ ] Fix post-unsubscribe re-signup being blocked by the unique
    constraint.
  - [ ] Plausible + PostHog consolidation (both ship today; pick one once
    launch data shows which earns its keep).
- [ ] i18n.
- [ ] TFJS major upgrade.
- [ ] npm-publishable `@tensorcraft/bridges` (blocked by `workspace:*` dep;
  needs tsup/rollup `noExternal`).

## 8. Growth roadmap (100k paying users)

Strategy, arithmetic, and gating rationale live in `docs/roadmap.md` (detail
doc); the work items are indexed here. Gate order is a hard precondition
chain: Gate 1 denominator (widen ICP + more themes) → Gate 2 LTV (recurring
revenue) → Gate 3 proof (funnel data, produced by Horizon 0) → Gate 4
catalog breadth (enterprise procurement). Horizon 0 shipped 2026-07-21; its
still-open defects are launch blockers (`docs/launch-blockers.md`), not
post-launch work.

### Horizon 1: fix the economics (0-9 months)

- [ ] Widen ICP to web/JS developers: reframe copy, relabel the
  React-specific bridge subset (bridge content already ~75% general JS;
  `Framework` union already typed for `variants`).
- [ ] Launch more of the 4 built-but-gated themes (overlaps §5 theme
  sprints; this is the Gate 1 dependency).
- [ ] Authoring scaffold `scripts/new-lesson.mjs` (no generator exists;
  authoring velocity is the volume bottleneck).
- [ ] All-access subscription (~$15-25/mo) alongside one-time:
  `subscriptions` table + persisted `stripe_customer_id`, real
  `entitlements` table replacing ad-hoc `purchases.theme_ids` derivation,
  `mode:"subscription"` checkout, `customer.subscription.*` /
  `invoice.paid` / `invoice.payment_failed` webhooks + dunning, billing
  management UI. Money-touching: full TDD + Stripe test-mode e2e before any
  live charge.
- [ ] Subscription content cadence: decide + publish the release rhythm
  before selling all-access — a static catalog churns a $15-25/mo sub
  immediately; the cadence decision re-orders §5 theme sprints
  (added 2026-07-22).
- [ ] Subscription grandfathering: define the migration story for existing
  one-time buyers (credit / discount / grandfather) before the plan page
  ships — getting this wrong publicly is a trust incident
  (added 2026-07-22).
- [ ] Re-enable guest checkout behind the full hardening list: guest-safe
  success page, ownership + upgrade-credit checks (email field, no inbox
  round-trip), guest fallback in both `async_payment_*` webhook handlers,
  unique index on `lower(profiles.email)`, anon (not service-role) client
  for the OTP send, real unmocked `guest-account.ts` tests. The endpoint
  exists but nothing routes to it — disabled 2026-07-21 after review found
  3 post-charge defects (defect record: `roadmap.md` §2 P2). Money-touching:
  same TDD bar as the subscription work.
- [ ] Re-evaluate merchant-of-record at subscription launch, or when EU /
  international mix makes OSS VAT filing a real operating cost: compare
  Paddle (5% + 50¢, B2B invoicing) and Polar (~4% + 40¢) against Stripe
  Managed Payments (6.4% + 30¢) — not Lemon Squeezy (maintenance mode
  since the 2024 Stripe acquisition). Decision + fee analysis:
  `docs/roadmap.md` §4.
- [ ] Growth instrumentation: activation metric, referral/virality events,
  cohort-LTV dashboards (current taxonomy has zero virality events).
- Exit: LTV > 3x CAC provable; ads viable on warm traffic; ≥3 themes live.

### Horizon 2: build reach (9-24 months)

- [ ] Viral competition arena (FREE, monetize via funnel, not arena
  paywall): public no-auth weekly challenge, `challenges` /
  `arena_submissions` / `leaderboard` tables, ranking service, arena result
  cards, referral loop, public profiles.
  **Write-model bone LAID (2026-07-24, migration 048):** `arena_submissions`
  exists, **service-role-write-only** (self-read RLS, no client write policy),
  so scores cannot be forged. **Correction (scalability re-audit 2026-07-24):**
  it is NOT true that "scoring infra already exists" — today's grading is
  CLIENT-authoritative and forgeable, and the cert stack proves payment not
  skill. The real remaining bones + the exact design are in
  `docs/arena-scoring-contract.md`: server-authoritative re-scoring against a
  hidden hold-out (A-F1), a hardened sandbox for the exec path (A-F2, do NOT
  reuse `WORKER_BODY_STRING`), an RNG-seeding/determinism convention (A-F3),
  plus the public top-N leaderboard `SECURITY DEFINER` RPC.
  Ships WITH: moderation + report flow + anti-cheat + ToS update — public
  no-auth UGC (usernames, code, leaderboards) griefs on day one without
  them; also update `product-plan.md`'s stale $29/yr arena pricing (free
  arena decided in roadmap) when this starts (added 2026-07-22).
- [ ] Rebuild the public `/bridges` catalog (51-bridge dataset lives in
  `packages/shared/src/bridges.ts`, rendered nowhere public since the
  2026-05-05 revert).
- [ ] Flip sitemap from throttled "core" to "full"; scale blog from single
  post via the existing news→lesson matching pipeline.
- Exit: viral coefficient K measurable and trending > 0.5; arena → signup →
  paid instrumented.

### Horizon 3: enterprise seats (24-48 months; ~60% of the target count)

- [ ] Orgs + members + invitations; org-scoped roles
  (`billing_owner | manager | learner`) replacing flat `user | admin`.
- [ ] Seat-quantity Stripe billing with proration.
- [ ] Team progress dashboard.
- [ ] SSO/SCIM + procurement table stakes (SOC2, invoicing, DPA).
- Sequenced last deliberately: behind Gate 3 (buyers demand completion
  data) and Gate 4 (single narrow path fails procurement).

**Parallel track, starts immediately (not code):** audience building /
distribution. Longest lead time in the whole plan; do not sequence it after
platform work.

## 9. Scale debt (before ~10k users)

Moved from `launch-blockers.md` Tier 3 on 2026-07-22: that tier is
post-launch by its own definition ("not before launch"), user-count-gated
like §3. Last two items were prose-only findings (launch-blockers R2-5)
with no checkbox anywhere until now.

- [ ] `skill_events` partitions end **2027-04-01**;
  `ensure_skill_events_partitions()` has zero callers and inserts are
  fire-and-forget, so expiry fails silently and the skill genome dies
  unnoticed. Wire a scheduled caller + alert.
- [ ] Six `auth.getUser()` round-trips per authenticated page view; no
  `React.cache()` anywhere in the repo.
- [ ] All 22 RLS policies use unwrapped `auth.uid()` (Supabase's documented
  #1 RLS performance anti-pattern; wrap as `(select auth.uid())`).
- [ ] Missing `(user_id, attempted_at DESC)` index on `exercise_attempts`;
  re-add the `skill_axis` index silently dropped in the `013` partition
  swap.
- [ ] Landing ships ~249 kB gzipped of TFJS eagerly.
- [ ] Co-locate API + DB: Fly runs `iad`, Supabase `eu-west-1` (contrary to
  `infrastructure.md`); every API→DB query crosses the Atlantic.
- [ ] Health check gates Fly liveness on a DB query, so a Supabase blip
  kills the whole API fleet; separate readiness from liveness / fail open
  (its `count: exact` is also a permanent ~20 seq scans/min on profiles).
- [ ] Lesson route is SSR, not SSG: `cookies()` opts every lesson view out
  of static generation (0 of 56 prerendered; the "edge cache" comment in
  `page.tsx:28-32` is false), so each view pays full SSR + auth
  round-trips. Audit calls it the largest single infra item at 5-10k
  users.
- [ ] `exercise_attempts` unbounded: 100KB `submitted_code`, no dedup, no
  retention policy; ~6MB/min achievable per user. Add retention + size
  caps.
