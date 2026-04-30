# V2 Polish Backlog

P2 / V2 items deferred from the A+ launch sprint (2026-04-25 → 2026-04-28). None block launch. All require either editorial taste, dataset curation, or are stylistic-not-substantive.

Items grouped by leverage. Highest leverage first.

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

## Out of scope (V3+)

- Video / audio narration (separate budgets, see memory `project_ai_video_scenes_deferred.md` and `project_audio_narration_deferred.md`)
- i18n
- Testimonials (no users yet)
- TFJS major upgrade
- Capstone v2 with multi-model ensembles
- npm-publishable bundling for `@tensorcraft/bridges` (currently `workspace:*` dep on `@tensorcraft/shared` blocks publication; would need tsup or rollup with `noExternal`)
