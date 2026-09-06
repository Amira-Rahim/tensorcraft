# Capstone Reference Models

The five world capstones each illustrate loading + serving a pretrained TFJS model. Lesson code blocks reference URLs like `/models/<name>/model.json`. The exercises themselves do **not** require these artifacts - they grade pure systems logic in the worker. The URLs exist so learners can read the deployment shape without us shipping production-grade weights.

This doc documents the I/O contract per capstone. Treat it as the spec a learner can implement against if they want to build the actual artifact themselves (or if we ship pretrained artifacts in V2).

## Shipped artifacts (2026-04-25)

5 reference models trained on synthetic data + shipped at `apps/web/public/models/`. All under 400 KB per artifact. Trained via `/tmp/train-capstone-models.mjs` for reproducibility.

| World | Path | Architecture | Train acc/loss |
|---|---|---|---:|
| Deep Orbit | `/models/deep-scan-v1` | 3 → 16 → 8 → 1 sigmoid | 98.9% acc |
| Neon Protocol | `/models/sentinel-v1` | conv 8 → pool → conv 16 → flatten → 32 → 4 softmax | 100% acc |
| Signal Ward | `/models/diagnostic-one-v1` | embed 16 → globalAvgPool → 16 → 3 softmax | 100% acc |
| Nova Canvas | `/models/nova-canvas-full` | dense 64 → 16 (bottleneck) → 64 → 768 sigmoid → reshape | MSE 0.083 |
| Terra Grid | `/models/meteor-v1` | dense 16 → 8 (bottleneck) → 16 → 24 linear | MSE 0.009 |

**Aliases shipped:** lessons reference multiple paths (`/models/sentinel`, `/models/classifier`, `/models/detector`, `/models/terra-grid`, `/models/sentinel-q8`, `/models/sentinel-q16`, `/models/audio-synth`, `/models/nova-canvas-optimized`). All resolved to the appropriate v1 artifact via duplicated dirs so every lesson code block becomes runnable in-browser without dataset curation. Removed 2026-09-04: `/models/studio-one-v1` and `/models/tgi-2`. No lesson or code ever loaded either path, and their bytes were identical to `/models/nova-canvas-full` and `/models/terra-grid`, which now stand as the Nova Canvas and Terra Grid artifacts.

**Note on synthetic data:** Models train on synthetic distributions for reproducibility, not labelled production data. They demonstrate the architecture + I/O contract end-to-end. Real deployment requires retraining on domain data - see "Building your own" below.

## Per-world contract

### Deep Orbit - DEEP SCAN signal classifier

- **URL:** `/models/deep-scan-v1/model.json`
- **Architecture:** 3-layer MLP (3 → 32 → 16 → 1)
- **Input shape:** `[batch, 3]` - three normalized signal features (peak frequency, RMS amplitude, spectral entropy)
- **Output shape:** `[batch, 1]` - sigmoid probability of anomaly
- **Loss / metric:** `binaryCrossentropy` / `accuracy`
- **Training data:** synthetic signals - `tf.randomNormal([N, 3])` for noise + perturbed versions for anomalies
- **Approx params:** ~700

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

None of these need a real model. The grader injects mock data into the test harness, so 312/312 pass without `/public/models` existing.
