# V2 Polish Backlog

P2 / V2 items deferred from the A+ launch sprint (2026-04-25 → 2026-04-28). None block launch. All require either editorial taste, dataset curation, or are stylistic-not-substantive.

Items grouped by leverage. Highest leverage first.

## Game-theory + storytelling expansion candidates (2026-05-08 brainstorm)

Full design reference: `~/.claude/plans/do-you-think-game-reactive-hennessy.md`. Each entry below is implementation-ready (data model + UX + build estimate + ethics check) per that plan. Cohort split mirrors a launch-stage gate the user set: single-player ships now; multiplayer/teams gated to 1000-user milestone.

**Status (2026-05-08):** all NOW-cohort slices shipped at infra + Deep Orbit content level — 6 slices in one session: #11 Operator log, #1+#13+#15 DISPATCH bundle, #6 Boss beats, #3 Counterfactual playthrough, #20 NPC cameos, #19 Lore artifacts. Migrations 028–032 added. Vitest 772/772. Polish checklist (axe/Lighthouse/Playwright auth flows) lives at `docs/gt-narrative-polish-checklist.md`. Per-theme launch content for Neon/Signal/Nova/Terra deferred to each theme's launch sprint — outline below under "Per-theme launch content sprint."

### NOW (single-player, ship-now candidates)

Suggested ship order: #11 → (#1 + #13 + #15 bundle) → #6 → #3. NOW spine (those four) totals ~36–50 days. Optional gap-fillers: #20, #19, #17. Defer in NOW: #5 (high authoring tax), #12 (weak SP without social), #16 ($$$$), #18 (3–4× MDX cost).

- **#11 Operator log meta-screen** ⭐ — cross-theme regret summary, post-hoc strategy classification. Stands up DISPATCH narrator voice. Zero new tables. ~8–12d.
- **#1 Free-reveal cliffhangers + cross-theme tease** — finale teases of next-theme characters; always reveals (soft gate per scoping). ~4–6d.
- **#13 NPC DISPATCH inbox** — weekly intel push from DISPATCH; CTAs to /log, /review, /themes. ~3–5d.
- **#15 Recall-as-narrative** — rewrite RecallPrompts as in-canon micro-beats. Per-prompt rewrite, no infra.
- **#6 Time-pressure boss beats** — 30s 4-option strategy choice (cooperate/defect/random/dominant) at capstone moments. ~8–10d.
- **#3 Counterfactual playthrough** — 1 rewind per theme; alternate timeline shown. Regret minimization made literal. ~10–14d.
- **#5 Branching quizzes** — answer alters next 30s narrative. High authoring tax (~14–20d full curriculum).
- **#12 Reputation currency (SP cosmetic only)** — rep ledger + cosmetics shop, NO leaderboard surface. Re-evaluate when LATER cohort opens.
- **#17 Branching theme epilogues** — 3 variants per theme by trajectory band. ~6–8d.
- **#19 Lore artifacts** — random drop on completion, in-canon journal entries, /library/lore. ~3–4d.
- **#16 Voice-actor character cards** — $$$$ recurring per theme; defer.
- **#18 Character-perspective re-render** — 3–4× MDX authoring cost; defer.
- **#20 Inter-theme NPC cameos** — 10–20 single-line cameos. ~1–2d. Ship in any gap.

### LATER (1000-user gated, deferred)

Each idea is gated by a critical-mass dependency: teams, other-user data, or portfolio mass. Designs preserved verbatim in plan file.

- **#2 Team layer (opt-in)** — teams/team_members/leadership_log + invite codes + opt-in public boards. Foundation for #10. ~10–14d.
- **#10 Shared team bandit** — team_review_queue + federated forgetting score + TEAM RECALL section on /review. Hard dep on #2. ~5–7d.
- **#4 Adversarial pair mode** — Supabase Realtime split-screen Sandpack + critique rubric + minimax payoff. Adds realtime/MP infra Tensorcraft doesn't have today. ~14–20d.
- **#7 Mentor ghost mode** — anonymous overlay of other players' decision distributions. Needs decision_logs from #3/#5/#6. ~8–12d.
- **#14 Capstone auction (Vickrey)** — second-price auction over capstone submissions w/ token economy. Needs auction lesson shipped first (deferred Slice C item). ~14–18d.
- **#8 Trade-the-bridge gifting** — 24h preview gift to friend; rate-limited. ~3–5d.
- **#9 Public capstone gallery** — opt-in portfolio at /gallery (public, no auth). ~5–8d.

## Game-theory spine — items deferred from Slice C (2026-05-08)

Slice C shipped: bandit-driven `/review` queue, bandit lesson rewrite (regret/minimax framing + live `<BanditState />`), GAN ↔ bandit `<StrategyThread>` cross-link, streak polish (on-fire ≥7d, gentle at-risk nudge), reviews-due dashboard pill. Migration `027_review_queue.sql` adds `review_queue` table + four RPCs; algorithm lives in `packages/shared/src/bandit.ts` (mirrored in SQL).

**Post-audit follow-up (2026-05-08):** verification sweep caught three drift items, all fixed in same session — bandit FE↔ML bridge added to central `BRIDGES` registry (`packages/shared/src/bridges.ts` id 51) so it surfaces in the landing-bridge-ticker / glossary / onboarding / sitemap (was lesson-frontmatter-only); ARIA + `data-testid` added to review-queue cards + ε-explore badge; `nav.test.tsx` extended with auth-gated Review-link visibility tests. Vitest 759/759 + web tsc clean.

Deferred from that slice:

- **SHAP cross-link in `<StrategyThread>`** — the SHAP lesson at `packages/content/content/extras/ethics-responsibility/03-model-interpretability.mdx` has no `/themes/extras/...` route, so linking from the bandit / GAN lessons would 404. Two paths forward: (a) add a public route for `extras/*` content; (b) move SHAP into a launched theme. (a) is cheaper.
- **Auction lesson (Terra Grid)** — second-price (Vickrey) auction; FE bridge `ad-bid auction = CSS specificity wars`. New lesson under `terra-grid/ab-testing/`.
- **Stackelberg reframe of adversarial patches (Neon Protocol)** — currently framed as security; reframe as attacker→defender game w/ FE bridge `XSS sanitizer co-evolution`.
- **RLHF preference-learning reframe (Signal Ward)** — Bradley–Terry pairwise / social choice; FE bridge `preference vote = thumbs-up A/B ranking`.
- **Kalman / Bayesian-game reframe (Deep Orbit)** — Kalman filter as Bayesian game vs noise; FE bridge `optimistic UI w/ rollback`.
- **Email nudge for streak-at-risk** — Resend transactional template + cron (Supabase scheduled function or external) to fire at `last_lesson_completed_at + 24h` when `current_streak >= 3` AND `email_alerts = true`. Slice C ships in-app toast only.
- **PWA / push notifications** — currently web-only, no `manifest.json` / service worker. Push for review-due reminders is its own slice.
- **Capstone leaderboard (opt-in)** — Kaggle-style scored holdout per capstone; top-N public. Needs hosting + cheating mitigations.
- **Commitment device at checkout** — user picks finish-by date at purchase; opt-in nudges only.
- **Cohort starts** — synchronized start dates, theme-mate pairing.
- **Thompson-sampling scheduler upgrade** — current scheduler is ε-greedy (matches the lesson). Once a Bayesian intuition lesson exists, switch the production scheduler to Thompson sampling for tighter regret bounds and self-reference parity with the new lesson.

## ~~High leverage (~8h) — ship next post-launch sprint~~ → **Forced bridges + a11y polish DONE 2026-04-28**

### ~~Forced bridges still partially-forced (3)~~ — ✓ DONE 2026-04-28

Replaced all 3 forced analogies with stronger pairs in `packages/shared/src/bridges.ts`:

- **#5 LR ↔ ~~Animation easing~~ Bisection / binary-search step halving** — same intuition (big steps far, small steps near). Breaks specify deterministic-vs-stochastic divergence. mlCode shows step-decay schedule.
- **#17 Data augmentation ↔ ~~Media queries → fuzz testing~~ Programmatic test fixture factories (Faker / factory-bot / fast-check generators)** — fuzz testing analogy was inverted-goals (fuzz finds failures, augmentation prevents memorization). Replaced 2026-04-28 with fixture factories: same intent (population coverage, not failure-finding), same primitive (sample variations from distribution). Breaks specify ephemeral-fixtures vs gradient-baked-augmentations.
- **#44 Style transfer ↔ ~~CSS theme switch → Photoshop filter stack~~ Auto-formatter pipeline (Prettier / eslint --fix)** — filter-stack analogy was vague "compose transforms" hiding the optimization chasm. Replaced 2026-04-28 with Prettier: same shape (iteratively rewrite target until it matches a reference style, preserve content semantics throughout). Breaks specify symbolic-deterministic AST rewrite vs numerical-stochastic gradient descent.

Bridge audit re-run after fix: 0 mismatches, 50 bridges with breaks coverage 100% on non-identity.

### Story-voice Phase 4 spot-check editorial pass — ~3.5h

Phase 1 (voice cards) + Phase 2 (naming consolidation) shipped. Phase 4 is the spot-check edit pass:

- Run `/tmp/extract-dialogue.mjs` to dump all 702 dialogue blocks grouped by speaker
- Spot-check top 5 speakers (Noor, Vikram, Hassan, Amir, Imran — covers 27% of blocks)
- Edit ~20 outliers per character against voice cards in `docs/voice-guide.md`
- Known outliers: ~2 Amir blocks in feature-pipelines/05 + backbone-networks/04 are too pedagogical (should be clipped-urgent)

Re-run velite + web build to confirm no parse breakage.

### ~~Studio-one VAE retraining (architecture)~~ — ✓ DONE 2026-04-28

Replaced shipped AE artifact with proper β-VAE in `apps/web/public/models/studio-one-v1/` and 3 alias dirs (`nova-canvas-full`, `nova-canvas-optimized`, `audio-synth`).

- Encoder: `Conv2D(8) → Conv2D(16) → Flatten → μ-head Dense(8) + logVar-head Dense(8)`
- Reparameterization: registered `ReparamLayer` class via `tf.serialization.registerClass` so save/load round-trips
- Decoder: `Dense(256) → Reshape([4,4,16]) → Conv2DTranspose(8) → Conv2DTranspose(3, sigmoid)`
- Loss: reconstruction MSE + 0.5 · KL(N(μ,σ) ∥ N(0,I)) via custom training loop with `optimizer.minimize`
- 9,187 params, ~53 KB shipped artifact (model.json + weights.bin)
- Verified via `tf.loadLayersModel`: all expected layers present (`vae_encoder`, `reparameterize`, `vae_decoder`); weights include `mu_head/kernel`, `logvar_head/kernel`, conv + convT kernels

`docs/capstone-models.md` Nova Canvas section rewritten to match shipped artifact.

### Studio-one VAE — real-data training (V2 task)

Architecture stays as above; only training data changes. Retrain on tiny CelebA subset (~500 images, 16×16 RGB) so reconstructions become face-shaped. Currently uniform-noise inputs cause posterior collapse (KL → 0) — architecture is honest but reconstructions are noise-shaped. Real data fixes the reconstructions without changing the layer structure. ~3h training + dataset prep.

## Medium leverage (~2h) — accessibility + SEO polish

### ~~/compare table accessibility~~ — ✓ DONE 2026-04-28

Added `<caption className="sr-only">` describing comparison scope, plus `scope="col"` on header cells and `scope="row"` on the feature column. Screen readers now announce table structure correctly.

### ~~/bridges colorblind-safe tier indicators~~ — ✓ DONE 2026-04-28

Added `TIER_GLYPH` map in `apps/web/app/bridges/page.tsx`:
- Identity → `≡` (literal equality)
- Structural → `≅` (structural similarity)
- Intuition → `≈` (approximation)

Glyph prefix renders before tier label with `aria-hidden="true"` so screen readers don't double-read; the parent `<span>` carries `aria-label="<Tier> tier"` for clarity. Wired in both the explainer `<ul>` and the per-bridge card header.

### ~~/bridges JSON-LD coverage extension~~ — ✓ DONE 2026-04-28

`itemListElement` now maps all 50 bridges (was `slice(0, 25)`). Full SEO coverage.

### Capstone real-data training — V2 task

Each theme's capstone currently uses synthetic-data-trained reference artifacts. Replacing with real-data versions requires:

- Deep Orbit DEEP SCAN: synthetic signals → real signal datasets (e.g., LIGO public data, Kaggle audio anomaly)
- Neon Protocol SENTINEL: synthetic 24×24 → CIFAR-10 fine-tuned
- Signal Ward DIAGNOSTIC-ONE: synthetic tokens → MIMIC-III + ClinicalBERT (de-identified)
- Nova Canvas STUDIO-ONE: synthetic noise → tiny CelebA subset
- Terra Grid METEOR: synthetic load → ERCOT public data

Per-theme cost: ~2h training + dataset curation. Total ~10h. Defer until V2.

## Low leverage (~1h) — nice-to-have

### Pricing-page JSON-LD AggregateRating

Could add an `AggregateRating` once the course has reviews. Currently no users so skip.

### Bridge variants extension

Some bridges have only `feCode` for vanilla; could add per-framework variants for Vue, Angular, Svelte where applicable. Cost: ~30 min per bridge × ~10 bridges = ~5h. Skip unless growth metrics show framework-specific traffic.

### Quiz coverage expansion

71 quizzes across 297 lessons = 24% coverage. Could add 1 quiz per lesson for ~226 more quizzes (~30h). Diminishing returns past current 71 — skip.

## Process improvements

### Re-audit cadence

Run the 12-agent quality audit after each major content sprint. The audit caught real issues twice in the A+ sprint that the implementation pass missed. The pattern is reliable — trust it.

### Quality rubric maintenance

When new content patterns emerge (e.g., a new MDX component type, a new exercise format, a new bridge tier), extend `docs/quality-rubric.md` with criteria for it before shipping. The rubric is the contract.

### Audit doc rotation

`docs/audits/` accumulates a per-sprint audit. Don't delete prior audits — they show how the bar moved. Use the dated filename as the audit's identity. Index in `docs/audits/README.md` (TODO: write this index when next audit runs).

## Future / V2 — Tensorcraft Pulse (content freshness via scraping)

Daily-refreshed signal layer to keep Tensorcraft competitive against blogs/X/creators. Three surfaces: auto-published `/pulse` feed, in-lesson `<Currents>` block (editor-approved), `/admin/signals` for stale-lesson detection driven by GitHub release scans.

- **Spec:** `~/.claude/plans/brainstorm-how-to-keep-giggly-lightning.md` (move to `docs/superpowers/specs/` on activation)
- **Plan:** [`docs/superpowers/plans/2026-05-03-tensorcraft-pulse.md`](superpowers/plans/2026-05-03-tensorcraft-pulse.md) — 8 phases, ~40 bite-sized tasks
- **Stack:** separate Fly.io worker (`tc-pulse`) + existing Supabase Postgres + pgvector + OpenAI embeddings + Claude Haiku
- **Cost:** ~$5/mo all-in, hard daily budget cap
- **Effort:** ~3–5 days end-to-end if executed sequentially
- **Risk flags:** X/Nitter best-effort only (Nitter mostly dead post-2024), threshold tuning needed week 1, RLS policies must be reviewed before going live

Reactivation: change plan header status from DEFERRED → ACTIVE, run `plan-document-reviewer`, then begin Task 0.1.

## Out of scope (V3+)

- Video / audio narration (separate budgets, see memory `project_ai_video_scenes_deferred.md` and `project_audio_narration_deferred.md`)
- i18n
- Testimonials (no users yet)
- TFJS major upgrade
- Capstone v2 with multi-model ensembles
- npm-publishable bundling for `@tensorcraft/bridges` (currently `workspace:*` dep on `@tensorcraft/shared` blocks publication; would need tsup or rollup with `noExternal`)
