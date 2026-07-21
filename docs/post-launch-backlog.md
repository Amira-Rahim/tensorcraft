# Post-Launch Backlog (canonical)

**This file is the single source of truth for every task deferred to after V1
launch.** Created 2026-07-21 by consolidating `v2-polish-backlog.md`,
`dev-plan.md` §9d/§10d/§10e/§10f, `v2-beat-expansion-plan.md`,
`email-retention-sequences.md`, and Claude memory entries.

**Rule:** when postponing any work, add a checkbox line HERE (with its gate and
a link to the detail spec if one exists). Detail specs stay in their own files;
this doc is the index of record. Deferred mentions surviving elsewhere
(`dev-plan.md`, audit ledgers) are historical and non-authoritative.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

Everything in this file is V2 (post-launch). There is no V3 tier; former
"V3+" items are folded into the sections below like everything else.

Not tracked here (pre-launch / separate): operator migrations 037+038,
91 Dependabot alerts, the uncommitted working tree, and the general growth
roadmap at `docs/roadmap.md`.

---

## 1. Operator + external service setup (first days after launch)

- [ ] **Kit (ConvertKit) lifecycle setup.** Manually create the Form + the
  seven lifecycle Tags in the Kit dashboard (`signed_up`, `onboarded`,
  `first_lesson`, `capstone`, `purchased`, `email_alerts`, `weekly_digest`),
  then set `KIT_FORM_ID` + `KIT_TAG_SIGNED_UP` / `KIT_TAG_ONBOARDED` /
  `KIT_TAG_FIRST_LESSON` / `KIT_TAG_CAPSTONE` / `KIT_TAG_PURCHASED` /
  `KIT_TAG_EMAIL_ALERTS` / `KIT_TAG_WEEKLY_DIGEST` env vars (numeric tag IDs).
  API keys already configured. Also set `KIT_WEBHOOK_SECRET` and register the
  bounce webhook per `docs/email-setup.md` §3. Purchase is a **single**
  theme-agnostic tag in V1 (per-theme sequences deferred, see §6). Without
  this, purchases succeed but subscribers are never tagged and no lifecycle
  email fires. Templates in Kit must follow `docs/email-templates.md`.
- [ ] **Kit retention automations.** Copy drafted, code side live; build the
  Kit-dashboard automations per `docs/email-retention-sequences.md`.
- [ ] **PostHog:** create project, add `NEXT_PUBLIC_POSTHOG_KEY` to web
  `.env.local` and Vercel env. Free tier = 1M events/month.
- [ ] **PostHog event verification:** test each of the 10 events appears in
  the dashboard (checklist: `docs/analytics-verification.md`).
- [ ] **Success-metrics dashboard** in PostHog: lesson completion (target
  ≥60%), paid conversion (3%), NPS (≥40), 7-day retention (≥30%), 30-day
  retention (≥15%), avg time per lesson, hint dependency, paywall conversion.
  Plus alerts for metrics falling below thresholds.
- [ ] **Plausible:** add site `tensorcraft.app`, set
  `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`. ~EUR 9/mo.
- [ ] **Sentry integration** (error tracking currently console-logging stub).
- [ ] **Google Search Console** (needs production domain verification).
- [ ] Blog posts: write and publish first batch.
- [ ] Product Hunt upcoming page.
- [ ] Twitter/X account @tensorcraft (deferred to V1.0).
- [ ] 14-day refund guarantee badge on pricing cards.
- [ ] PPP (Purchasing Power Parity) indicator on pricing page.
- [ ] Payment plans (installments): evaluate Klarna/Afterpay.
- [ ] Social proof on landing page once real user counts exist.
- [ ] JSON-LD FAQPage schema on pricing page.
- [ ] Pricing-page JSON-LD AggregateRating once reviews exist.
- [ ] Testimonials on landing/pricing once real users exist.

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
- [ ] Quality-rubric maintenance: extend `docs/quality-rubric.md` before
  shipping any new content pattern.

## 3. Data-gated content work

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
- [ ] Code Hike scrollytelling (§7c, post-V0.5; Shiki shipped instead).
- [ ] `LossLandscape` component (atmospheric-only; revisit post-V1).
- [ ] `ActivityHeatmap` component (post-V0.5).
- [ ] Remove deprecated `<Quiz>` + `<KeyTakeaways>` MDX components once all
  themes are migrated off them.
- [ ] i18n.
- [ ] TFJS major upgrade.
- [ ] npm-publishable `@tensorcraft/bridges` (blocked by `workspace:*` dep;
  needs tsup/rollup `noExternal`).
