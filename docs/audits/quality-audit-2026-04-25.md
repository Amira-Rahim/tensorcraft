# Tensorcraft Content Quality Audit — 2026-04-25

Comprehensive quality audit covering all 296 lessons, 315 exercises, 50 canonical bridges, 80 derivation drawers, and 47 quizzes.

Rubric: see [docs/quality-rubric.md](../quality-rubric.md). Audit run via 12 parallel Explore agents, each scoring against rubric criteria with severity tags (P0/P1/P2).

## Headline result

- **0 derivation drawer math errors** in 80 sampled. ELBO, reparameterization, Adam, attention scaling, LSTM gates, DDPM closed-form, KL Gaussian — all canonical.
- **1 critical lesson math error**: diffusion-process lesson code used linear blend instead of DDPM √ᾱ scaling. **FIXED**.
- **1 critical exercise bug**: build-transformer-block re-initialized weights every call. **FIXED** with closure pattern.
- **1 critical UI bug**: all 47 quizzes leaked the "— correct" marker in option text. **FIXED** by stripping in Quiz component.
- **3 bridges missing breaks** (#21, #45, #50). **FIXED**.
- **3 lesson-side bridge tier issues**. **FIXED**.

## P0 fixes executed this session (12)

| # | Fix | File |
|---|---|---|
| 1 | Quiz answer-leak strip in component | [packages/ui/src/mdx/quiz.tsx:121](../../packages/ui/src/mdx/quiz.tsx#L121) |
| 2 | Transformer block weights closure pattern | [build-transformer-block.yaml](../../packages/content/content/signal-ward/transformers-bert/exercises/build-transformer-block.yaml) |
| 3 | Tensor test value assertion | [create-a-tensor.yaml:7](../../packages/content/content/deep-orbit/foundations/exercises/create-a-tensor.yaml#L7) |
| 4 | DDPM √ᾱ math (exercise) | [add-noise.yaml](../../packages/content/content/nova-canvas/diffusion-models/exercises/add-noise.yaml) |
| 5 | DDPM √ᾱ math (lesson code) | [01-the-diffusion-process.mdx](../../packages/content/content/nova-canvas/diffusion-models/01-the-diffusion-process.mdx) |
| 6 | mlContent tag (systems not arithmetic) | [build-nlp-api.yaml:202](../../packages/content/content/signal-ward/production-privacy/exercises/build-nlp-api.yaml#L202) |
| 7 | Bridge #21 missing breaks | [bridges.ts:643-660](../../packages/shared/src/bridges.ts#L643) |
| 8 | Bridge #45 missing breaks | [bridges.ts:912-922](../../packages/shared/src/bridges.ts#L912) |
| 9 | Bridge #50 missing breaks | [bridges.ts:966-976](../../packages/shared/src/bridges.ts#L966) |
| 10 | Calculus drawer breaks | [02-calculus-of-neurons.mdx:20](../../packages/content/content/extras/math-deep-dive/02-calculus-of-neurons.mdx#L20) |
| 11 | Dataset-bias breaks | [01-dataset-bias.mdx:20](../../packages/content/content/extras/ethics-responsibility/01-dataset-bias.mdx#L20) |
| 12 | Pretrained-models tier (structural → intuition) + ImageNet bias | [01-pretrained-models.mdx:19](../../packages/content/content/neon-protocol/transfer-learning/01-pretrained-models.mdx#L19) |
| 13 | Video-stream tier (identity → structural) + preprocessing breaks | [01-video-stream-processing.mdx:19](../../packages/content/content/neon-protocol/real-time-detection/01-video-stream-processing.mdx#L19) |
| 14 | NMS strict inequality (>= → >) | [04-non-max-suppression.mdx:128](../../packages/content/content/neon-protocol/object-detection/04-non-max-suppression.mdx#L128) |
| 15 | Distillation softmax values (T=1, T=3) recomputed | [03-knowledge-distillation.mdx:69-72](../../packages/content/content/terra-grid/pruning-distillation/03-knowledge-distillation.mdx#L69-L72) |
| 16 | Post-norm vs pre-norm clarified | [02-transformer-architecture.mdx:87](../../packages/content/content/signal-ward/transformers-bert/02-transformer-architecture.mdx#L87) |
| 17 | DFT "learned-from-data" → "fixed mathematical basis" | [02-fourier-transform.mdx:20](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx#L20) |
| 18 | Early-stopping K (patience) defined | [04-training-loop.mdx:111](../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx#L111) |

## P0 false alarms (verified correct)

- **Terra Grid privacy labels (federated-learning/03-privacy-preservation.mdx):** Agent claimed labels were inverted. Verified math: ε=10 → small noise → weak privacy ("low") is correct. ε=0.1 → large noise → strong privacy ("high") is correct. No fix needed.

## P1 deferred (next sprint, ~6h)

### Lessons (8 items)

- [04-forward-pass.mdx:19](../../packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx#L19) — Bridge break "event handlers run independently" inaccurate; DOM events are sequential
- [03-forecasting.mdx:79](../../packages/content/content/deep-orbit/advanced-time-series/03-forecasting.mdx#L79) — Confidence-decay magic number 0.015 unjustified
- [01-convolution-operations.mdx:165](../../packages/content/content/neon-protocol/convolutional-neural-networks/01-convolution-operations.mdx#L165) — Output-size formula assumes "valid" padding; "same" padding asymmetric case missing
- [03-unet-architecture.mdx:152](../../packages/content/content/neon-protocol/segmentation/03-unet-architecture.mdx#L152) — NHWC vs NCHW concatenation axis note missing
- [03-performance-budgets.mdx:51](../../packages/content/content/neon-protocol/real-time-detection/03-performance-budgets.mdx#L51) — Mobile-CPU budget gap not documented
- [02-self-attention.mdx:102](../../packages/content/content/signal-ward/attention-mechanisms/02-self-attention.mdx#L102) — Clinical example (methotrexate causation) needs disclaimer tightening
- [02-post-training-quantization.mdx:71](../../packages/content/content/terra-grid/quantization/02-post-training-quantization.mdx#L71) — INT8 formula labeling inconsistent with derivation
- [03-bert-pretraining.mdx:206](../../packages/content/content/signal-ward/transformers-bert/03-bert-pretraining.mdx#L206) — MLM drawer placed after exercise instead of beside masked-token introduction

### Exercises (10 items)

- find-threshold.yaml, time-vs-frequency.yaml, visualize-features.yaml, apply-nms.yaml — instructions leak algorithm steps
- temporal-attention.yaml — beginner rated, requires 3+ concepts
- self-attention-scores.yaml — instructions assume Q·K^T/√d formula already known
- bag-of-words.yaml — punctuation edge case untested
- multiHeadAttention.yaml — tests verify shape only, no softmax-sums-to-1 assertion
- reparameterize.yaml — no zero-variance edge case
- build-lstm.yaml — "advanced" but only shape-tested; no train-step assertion
- kl-loss.yaml — magnitude not asserted
- build-decision-tree.yaml + compute-gradients.yaml — difficulty mis-rated

### Bridges (forced analogies, 4 items)

- Bridge #5 (LR ↔ easing curves): mechanisms unrelated; reframe or remove
- Bridge #17 (data augmentation ↔ media queries): random vs deterministic; consider downgrade
- Bridge #30 (NMS ↔ debounce): spatial vs temporal; consider downgrade or remove
- Bridge #44 (style transfer ↔ CSS theme): discrete vs continuous; downgrade to intuition

### Bridges missing mlCode (11 items)

Bridges #27, #28, #32, #33, #34, #35, #36, #37, #41, #42, #43 — all have feCode but lack matching mlCode example. Add concrete TFJS snippets.

### Quizzes (~3 weak)

- [01-introduction-to-tensors.mdx:88](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx#L88) — Recall-only ("what is rank?")
- Theme gaps: object-detection, segmentation, quantization, federated-learning have only 1 quiz each (recommend +1-2 each)

## P2 stylistic (batch later)

- 1 thematic-narrative term ("resistance tools") in feature-extraction code comment breaks immersion
- Some dialogue blocks could be tightened (Crisis lesson, LSTM lesson)
- Quiz tier distribution skews to deep-orbit (5/47 in training-loop alone)

## AI-slop check: CLEAN

All 296 lessons audited for: "Let's dive into", "It's important to note", "When it comes to", "Furthermore", "Moreover", listicles, recap paragraphs, em-dash overuse, filler praise. **Zero instances detected** in any audited file.

## Math correctness across 80 derivation drawers: CLEAN

Verified against canonical references (DDPM, attention paper, VAE, Adam, etc.):
- Backprop chain rule ✓
- LSTM/GRU gates ✓
- Multi-head attention split + concat ✓
- Sinusoidal positional encoding ✓
- ELBO decomposition ✓
- Reparameterization trick ✓
- DDPM forward closed form ✓
- DDPM reverse parametrization ✓
- KL between Gaussians (closed form) ✓
- Cosine schedule (Nichol & Dhariwal 2021) ✓
- Gram matrix (style transfer) ✓
- DFT ✓
- Cross-entropy / softmax ✓
- KL divergence ✓
- Bayes / entropy ✓

Zero math errors in derivation drawers. The lesson code error (linear blend in diffusion forward) was a code-vs-drawer inconsistency, not a drawer error.

## Quality benchmark established

The rubric ([docs/quality-rubric.md](../quality-rubric.md)) is the new floor. Future content additions ship-or-not against it. Re-run this audit (12 parallel agents, ~30 min) after any major content sprint to maintain the benchmark.

## Exemplar templates (use these as the bar)

**Lessons:**
- [Tensors as Linear Algebra](../../packages/content/content/extras/math-deep-dive/01-tensors-as-linear-algebra.mdx) — lean dialogue, executable code, strong bridge
- [Deep Orbit System Architecture (capstone)](../../packages/content/content/deep-orbit/capstone/01-system-architecture.mdx) — honest bridges, clear pacing
- [Neon Protocol Feature Vectors](../../packages/content/content/neon-protocol/feature-extraction/01-feature-vectors.mdx) — pseudocode + real code labeled
- [Nova Canvas Reparameterization](../../packages/content/content/nova-canvas/variational-autoencoders/03-reparameterization-trick.mdx) — model-level lesson design
- [Terra Grid Quantization](../../packages/content/content/terra-grid/quantization/02-post-training-quantization.mdx) — honest bridge, canonical math

**Exercises:**
- [apply-convolution.yaml](../../packages/content/content/neon-protocol/convolutional-neural-networks/exercises/apply-convolution.yaml)
- [bag-of-words.yaml](../../packages/content/content/signal-ward/ml-through-text/exercises/bag-of-words.yaml)
- [ci-cd-gate.yaml](../../packages/content/content/deep-orbit/capstone/exercises/ci-cd-gate.yaml)
- [compute-iou.yaml](../../packages/content/content/neon-protocol/object-detection/exercises/compute-iou.yaml)
- [implement-neuron.yaml](../../packages/content/content/deep-orbit/neural-networks/exercises/implement-neuron.yaml)
- [federated-average.yaml](../../packages/content/content/terra-grid/federated-learning/exercises/federated-average.yaml)
- [compute-entropy.yaml](../../packages/content/content/extras/math-deep-dive/exercises/compute-entropy.yaml)

**Bridges:**
- Bridge #3 (Loss ↔ expect().toBe())
- Bridge #14 (ReLU ↔ Math.max)
- Bridge #8 (Overfitting ↔ overspecialized component)
- Bridge #1 (Props ↔ training data)

## Next steps

1. Apply P1 fixes (estimated 6h) — defer to next sprint
2. Add missing mlCode to 11 bridges — ~1h
3. Add 8-10 quizzes to underrepresented themes — ~2h
4. Run audit re-check (12 parallel agents) after P1 — ~30 min
