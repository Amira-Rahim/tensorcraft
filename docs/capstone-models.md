# Capstone Reference Models

The five world capstones each illustrate loading + serving a pretrained TFJS model. Lesson code blocks reference URLs like `/models/<name>/model.json`. The exercises never fetch these artifacts: the grader runs in a Web Worker with no network reach, so `packages/ui/src/mdx/exercise-runner.ts` stubs `tf.loadLayersModel`, and `scripts/validate-exercises.mjs` stubs it the same way for CI. The artifacts exist so a learner who copies a lesson code block into a real page gets a real model back, and so the numbers a lesson prints can be checked against a file.

This doc documents the I/O contract per capstone. Treat it as the spec a learner can implement against if they want to build the actual artifact themselves (or if we ship pretrained artifacts in V2).

## Shipped artifacts (2026-04-25)

5 reference models trained on synthetic data + shipped at `apps/web/public/models/`. All under 400 KB per artifact. Trained via `/tmp/train-capstone-models.mjs`, which no longer exists, so the per-world contracts below are the record. The Deep Orbit artifact was retrained on 2026-09-08 and its recipe is written out in full under that heading.

| World | Path | Architecture | Train acc/loss |
|---|---|---|---:|
| Deep Orbit | `/models/deep-scan` | 3 → 32 → 16 → 1 sigmoid | 98.5% train / 100% held-out |
| Neon Protocol | `/models/sentinel-v1` | conv 8 → pool → conv 16 → flatten → 32 → 4 softmax | 100% acc |
| Signal Ward | `/models/diagnostic-one-v1` | embed 16 → globalAvgPool → 16 → 3 softmax | 100% acc |
| Nova Canvas | `/models/nova-canvas-full` | dense 64 → 16 (bottleneck) → 64 → 768 sigmoid → reshape | MSE 0.083 |
| Terra Grid | `/models/meteor-v1` | dense 16 → 8 (bottleneck) → 16 → 24 linear | MSE 0.009 |

**Aliases shipped:** lessons reference multiple paths (`/models/sentinel`, `/models/classifier`, `/models/detector`, `/models/terra-grid`, `/models/sentinel-q8`, `/models/sentinel-q16`, `/models/audio-synth`, `/models/nova-canvas-optimized`). All resolved to the appropriate v1 artifact via duplicated dirs so every lesson code block becomes runnable in-browser without dataset curation. Removed 2026-09-04: `/models/studio-one-v1` and `/models/tgi-2`. No lesson or code ever loaded either path, and their bytes were identical to `/models/nova-canvas-full` and `/models/terra-grid`, which now stand as the Nova Canvas and Terra Grid artifacts. `/models/deep-scan` was an alias copy of `deep-scan-v1` too, until 2026-09-08. It is now its own trained artifact, because the lessons print a `model.summary()` the v1 network does not have. See the Deep Orbit contract below.

**Note on synthetic data:** Models train on synthetic distributions for reproducibility, not labelled production data. They demonstrate the architecture + I/O contract end-to-end. Real deployment requires retraining on domain data - see "Building your own" below.

## Per-world contract

### Deep Orbit - DEEP SCAN signal classifier

Three directories ship under this name. They are not copies of each other, and each has exactly one consumer.

| Path | Architecture | Params | weights.bin | Who loads it |
|---|---|---:|---:|---|
| `/models/deep-scan` | 3 → 32 → 16 → 1 sigmoid | 673 | 2,692 B | lesson code blocks in `browser-runtimes` 01, 03 and 05 |
| `/models/deep-scan-v1` | 11 → 32 → 16 → 5 softmax | 997 | 3,988 B | nothing in this app; it is the path the capstone CI workflow and `docs/scripts/deep-orbit.md` name for the learner's own repo. Rebuilt 2026-09-12 by `scripts/build-deep-scan-v1.mjs` so the capstone's model card (`capstone/04`, 997 weights, 3,988 bytes, measured) describes the file that ships |
| `/models/deep-scan-preview` | 3 → 16 → 8 → 1 sigmoid | 209 | 836 B | `apps/web/app/components/mdx/deep-scan-demo.tsx:93`, the landing demo, probed by `scripts/probe-deep-scan-model.mjs` and fine-tuned by `scripts/finetune-deep-scan-preview.mjs` (2026-09-12) so sample 7741's canon triple `[0.5, 0.59, 0.54]` scores 0.513, which the demo rounds to the story's "fifty-one percent" |

`browser-runtimes/exercises/load-model.yaml` names the `/models/deep-scan/model.json` URL in its test code as well, but the runner stubs the load, so the exercise never reaches the file.

The `indexeddb://deep-scan-v1` key in `browser-runtimes/03-model-loading.mdx` is a cache key in the lesson's own example, not a reference to the `deep-scan-v1` directory.

#### Contract for `/models/deep-scan`, the asset the lessons load

- **URL:** `/models/deep-scan/model.json`
- **Architecture:** 3-layer MLP, `Dense(32, relu) → Dense(16, relu) → Dense(1, sigmoid)`, `batch_input_shape [null, 3]`
- **Input shape:** `[batch, 3]` - `[amplitude, frequency, phase]`, each min-max normalized into [0, 1] against the range its own sensor can produce. amplitude is ADC counts over a 2048-count full scale, and the hull sensors saturate at 2048, so a normalized amplitude cannot exceed 1.00. frequency is a zero-crossing count over the 64-sample extraction window divided by 63, the most sign flips such a window can hold. phase is radians mapped from -pi..pi. A normalized feature above 1.00 further down the pipeline is a units bug, not a strong reading.
- **Output shape:** `[batch, 1]` - sigmoid P(anomaly)
- **Loss / metric:** `binaryCrossentropy` / `accuracy`
- **Total params:** 673, as 128 + 528 + 17. This is the count `browser-runtimes/03-model-loading.mdx:75` prints. The same number is quoted on 31 lines across 8 lesson files, in modules 2, 3, 4 and 5 (`grep -rn 673 packages/content/content/`), which is why the asset moved and the lessons did not.
- **Artifact size:** `weights.bin` exactly 2,692 bytes, which is 673 float32 values at 4 bytes each. That is the load-bearing number and the one to check with `ls -l`. `model.json` is 3,671 bytes as of 2026-09-12, but do not pin it: it is JSON that prettier reflows, so its byte count moves with formatting while the topology inside it does not (an earlier version of this line quoted 3,909, which was the pre-prettier size of the same file).
- **Calibration (2026-09-12):** the first 673-parameter build scored sample 7741's canon input `[0.5, 0.5, 0.5]` at 0.046, where the course fixes module 3's classifier at 0.518 on that reading (`training-loop/05`, `capstone/05`). The trainer now adds 400 rows centred on mid-scale carrying the soft label 0.585, because minimizing binary cross-entropy against a soft target drives the prediction to that target and the calm cluster pulls the exact centre slightly low (label 0.518 lands at 0.483; 0.585 lands at 0.5176). `model.fit` runs with `shuffle: false` on rows pre-shuffled by a seeded LCG, so the run is reproducible: two identical invocations print identical probes. Measured after install: 7741 0.518, calm baseline 0.006, anomalous 0.9996, held-out accuracy 0.95. Reproduce with `node scripts/train-deep-scan-model.mjs`.
- **Re-calibration to the exact triple (2026-09-12, later the same day):** sample 7741's canon reading is 1024 of 2048 counts, 37 zero crossings of 63 (the 73.4 Hz tone) and 0.23 rad, which normalizes to `[0.5, 0.59, 0.54]`, not `[0.5, 0.5, 0.5]`. Every surface that fed the rounded triple as sample 7741 (`neural-networks/02`, `training-loop/05`, the landing demo) now feeds the exact one. The trainer's 400 MID rows are centred on `[0.5, 0.59, 0.54]` with soft label 0.6222, which lands 0.5181 on the exact triple (0.585 landed 0.4814 there once the cluster moved; 0.623 landed 0.5189, which prints 0.519). The preview asset was fine-tuned in place with 4,000 seeded grid anchors carrying its own prior outputs plus 600 rows around the triple at target 0.511: exact triple 0.4966 to 0.5127 (the demo rounds to a whole percent and the story says "fifty-one percent", so the preview aims inside 0.505 to 0.515, not at 0.518), largest drift on the five calm stream rows 0.0040. Lesson-4 retrains at the exact triple, 1,200 of them: 21.0 to 76.3 percent, median 49.7, 517 inside 45 to 55 (the rounded triple gave median 54.4, 483 inside), so the fence-sitting narrative holds and the printed figures were updated. Untrained builds, 20,000 of them: 18,116 inside 0.45 to 0.55, 55 past 0.60.

**Rebuilt 2026-09-08.** Until then the asset at this path was a byte-level copy of the 209-parameter `deep-scan-v1` build, so `03-model-loading.mdx` printed a 673-parameter summary for a URL that served 209 parameters. 673 is the load-bearing number, so the asset was retrained to match the lessons rather than the other way round. The recipe:

- 1,200 rows, 600 per class, three min-max normalized features clipped into [0, 1].
- Calm rows: amplitude `N(0.52, 0.15)`, frequency `N(0.72, 0.16)`, phase `N(0.30, 0.16)`, column seeds 101/102/103. The amplitude mean and standard deviation are module 7's measured archive baseline from `anomaly-detection/01-normal-vs-anomalous.mdx:121`.
- Flagged rows: amplitude `N(0.80, 0.13)`, frequency `N(0.28, 0.16)`, phase `N(0.72, 0.16)`, column seeds 201/202/203. Flagged windows run hot on amplitude and phase and low on frequency, the direction `training-loop/04-training-loop.mdx` uses, because a clean tone crosses zero far less often than broadband noise.
- `glorotNormal` kernel initializers seeded 7741/7742/7743, `adam(0.005)`, `binaryCrossentropy`, 40 epochs, batch 32, `validationSplit: 0.2`. Shuffled once before splitting 1,000 / 200, so the 200-row tail stays out of `fit` entirely.
- Measured on tfjs 4.22.0, cpu backend: training accuracy 0.9850, validation accuracy 0.9750, held-out accuracy 1.0000 at held-out loss 0.0142. Held-out predictions run from 0.0001 to 1.0000 across 88 distinct values at four decimal places, so the model returns graded scores rather than a step.
- Response check, `[amplitude, frequency, phase]` to P(anomaly): a calm reading sitting on the module-7 amplitude baseline, `[0.52, 0.80, 0.24]`, scores 0.000510, and `[0.90, 0.15, 0.85]` scores 0.999997. Amplitude on its own stays the weak channel, which the lessons depend on: `[1.00, 0.80, 0.24]`, a channel pegged at full scale with calm frequency and phase, still scores 0.033662 and reads as noise.

There is no tfjs-node in this repo, so the artifacts were captured with `tf.io.withSaveHandler` and written to disk by hand, then loaded back off disk through a manual `IOHandler` (the same approach `scripts/probe-deep-scan-model.mjs` uses to read the preview build) to confirm by execution that `model.summary()` prints 128 / 528 / 17 and `Total params: 673`, that the layer units are 32/16/1 with relu/relu/sigmoid, and that `weights.bin` is 2,692 bytes.

#### Historical record: `/models/deep-scan-v1`

Trained 2026-04-25 as `3 → 16 → 8 → 1` sigmoid, 209 parameters, 836-byte `weights.bin`, reported at 98.9% training accuracy on synthetic signals (`tf.randomNormal([N, 3])` for noise plus perturbed versions for anomalies). Kept because the capstone lessons and `docs/scripts/deep-orbit.md` name this path in the workflow a learner builds in their own repo. Nothing in this app fetches it.

**Rebuilt 2026-09-12** as the eleven-feature, five-class network the capstone documents (`11 → 32 → 16 → 5` softmax, 997 parameters, 3,988-byte `weights.bin`, 3,402-byte `model.json` once prettier has formatted it, which CI's `prettier --check .` requires), because blind verification found the capstone quoting the module-3 build's 673 parameters and 2,692 bytes on a card that lists eleven features and five classes. `scripts/build-deep-scan-v1.mjs` trains it on seeded synthetic clusters (0.997 train, 0.995 held-out) so the file is a working classifier; nothing in this app loads it.

### Neon Protocol - SENTINEL classifier + detector

- **Detector URL:** `/models/detector/model.json` - small CNN, input `[1, 224, 224, 3]`, output `[1, k, 5]` (boxes + scores)
- **Classifier URL:** `/models/classifier/model.json` - MobileNet head, input `[1, 224, 224, 3]`, output `[1, 4]` softmax over `['civilian', 'meridian-agent', 'meridian-drone', 'surveillance-device']`
- **Suggested base:** `tf.loadLayersModel('https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1/model.json')` then fine-tune the last 2 layers
- **Approx params:** ~3.5M (with MobileNet backbone)

### Signal Ward - DIAGNOSTIC-ONE risk predictor

- **URL:** `/models/diagnostic-one-v1/model.json`
- **Architecture:** Embedding → BiLSTM → Dense
- **Input shape:** `[batch, seqLen]` - tokenized clinical note (vocab size ≈ 5000, seqLen 256)
- **Output shape:** `[batch, 3]` - softmax over `['low-risk', 'medium-risk', 'high-risk']`
- **Loss / metric:** `categoricalCrossentropy` / `accuracy` + recall on high-risk class
- **Training data:** would need de-identified clinical notes (MIMIC-III + ClinicalBERT pretraining) - not shipped
- **Approx params:** ~8M

### Nova Canvas - STUDIO-ONE generative (β-VAE)

- **URL:** `/models/nova-canvas-full/model.json` (alias: `/models/nova-canvas-optimized/model.json`, `/models/audio-synth/model.json`)
- **Shipped architecture (v1):** convolutional β-VAE
  - **Encoder** (`vae_encoder`): `Conv2D(8, 3×3, stride 2, relu) → Conv2D(16, 3×3, stride 2, relu) → Flatten → [μ-head Dense(8), logVar-head Dense(8)]`
  - **Reparameterization layer** (`ReparamLayer`, registered with `tf.serialization`): `z = μ + exp(0.5·logVar) · ε`, `ε ~ N(0, I)`
  - **Decoder** (`vae_decoder`): `Dense(256, relu) → Reshape([4, 4, 16]) → Conv2DTranspose(8, 3×3, stride 2, relu) → Conv2DTranspose(3, 3×3, stride 2, sigmoid)`
- **Input shape:** `[batch, 16, 16, 3]` - RGB image
- **Outputs:** `[reconstruction [batch, 16, 16, 3], μ [batch, 8], logVar [batch, 8]]`
- **Latent dim:** 8
- **Loss:** reconstruction MSE + 0.5 · KL(N(μ, σ) ∥ N(0, I)), closed-form KL `0.5 · Σ(μ² + σ² − log σ² − 1)`
- **Training data:** synthetic uniform-noise images, 256 samples, 30 epochs, batch 32
- **Total params:** 9 187
- **Artifact size:** ~53 KB (model.json 17 KB + weights.bin 36 KB)

**Honest note: synthetic data → posterior collapse.** The training loop runs the proper β-VAE math (KL term, reparameterization sample, conv encoder/decoder) but uniform-noise inputs have no structure to learn, so KL collapses near 0 and reconstructions are noise-shaped. The **architecture is correct and matches the lessons exactly** - `model.layers` shows `vae_encoder`, `reparameterize`, `vae_decoder`; weights include `mu_head/kernel`, `logvar_head/kernel`, conv + convT kernels. Learners who load `tf.loadLayersModel('/models/nova-canvas-optimized/model.json')` see every layer the lessons teach.

**Future task (V2):** retrain on a tiny CelebA subset (~500 images, 16×16 RGB) so reconstructions become face-shaped. Architecture stays the same; only training data + epoch count changes. Target ~500 KB shipped.

### Terra Grid - METEOR-FORECAST anomaly autoencoder

- **URL:** `/models/terra-grid/model.json` (also `/api/models/terra-grid/model.json` for API-mediated load)
- **Architecture:** 1D autoencoder (input → Dense 64 → Dense 16 → Dense 64 → output) + reconstruction error threshold
- **Input shape:** `[batch, 24]` - 24-hour rolling window of normalized power consumption
- **Output shape:** `[batch, 24]` - reconstructed window
- **Loss / metric:** `meanSquaredError` / 95th-percentile error threshold for anomaly flag
- **Training data:** ERCOT or REE public load data, rolling 24-hour windows, normalized
- **Approx params:** ~3000

## Building your own

If a learner wants a real artifact for any capstone, the pattern:

```ts
import * as tf from '@tensorflow/tfjs-node';

const model = tf.sequential();
// ... add layers per the contract above
model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
await model.fit(trainX, trainY, { epochs: 50, batchSize: 32 });

await model.save('file:///path/to/apps/web/public/models/<world>-v1');
// Outputs model.json + weights.bin under that directory
```

Drop those files at the path the lesson expects, restart the dev server, and the lesson code blocks become live-runnable.

## How exercises avoid this dependency

The capstone exercises grade things like:
- `validateModelAccuracy(predictions, minAccuracy)` - pure JS over a synthetic prediction array
- `verifyDeployment(checks)` - runs an array of async health checks, asserts shape of result
- `Pipeline.addStage(stage)` - registry / middleware patterns

None of these need a real model. The grader injects mock data into the test harness and stubs `tf.loadLayersModel`, so every exercise passes with `/public/models` absent. Measured 2026-09-08 with `node scripts/validate-exercises.mjs --starters --cheats`: 65 passed, 0 failed, 367 assertions in total.
