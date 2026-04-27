# Capstone Reference Models

The five theme capstones each illustrate loading + serving a pretrained TFJS model. Lesson code blocks reference URLs like `/models/<name>/model.json`. The exercises themselves do **not** require these artifacts — they grade pure systems logic in the worker. The URLs exist so learners can read the deployment shape without us shipping production-grade weights.

This doc documents the I/O contract per capstone. Treat it as the spec a learner can implement against if they want to build the actual artifact themselves (or if we ship pretrained artifacts in V2).

## Why no shipped artifacts (yet)

- Each capstone needs a labelled dataset — synthetic for DEEP SCAN signals, annotated images for sentinel detection, FHIR records for diagnostic-one, etc. Curating + licensing those is a separate effort.
- The 312 graded exercises run end-to-end without these artifacts.
- Learners targeting deployment can download MobileNet / Universal Sentence Encoder from `tfhub.dev` and adapt the deploy harness in the capstone directly.

V2 plan: ship one minimal pretrained artifact per theme, trained on synthetic data, sized < 1 MB so the page loads fast.

## Per-theme contract

### Deep Orbit — DEEP SCAN signal classifier

- **URL:** `/models/deep-scan-v1/model.json`
- **Architecture:** 3-layer MLP (3 → 32 → 16 → 1)
- **Input shape:** `[batch, 3]` — three normalized signal features (peak frequency, RMS amplitude, spectral entropy)
- **Output shape:** `[batch, 1]` — sigmoid probability of anomaly
- **Loss / metric:** `binaryCrossentropy` / `accuracy`
- **Training data:** synthetic signals — `tf.randomNormal([N, 3])` for noise + perturbed versions for anomalies
- **Approx params:** ~700

### Neon Protocol — SENTINEL classifier + detector

- **Detector URL:** `/models/detector/model.json` — small CNN, input `[1, 224, 224, 3]`, output `[1, k, 5]` (boxes + scores)
- **Classifier URL:** `/models/classifier/model.json` — MobileNet head, input `[1, 224, 224, 3]`, output `[1, 4]` softmax over `['civilian', 'meridian-agent', 'meridian-drone', 'surveillance-device']`
- **Suggested base:** `tf.loadLayersModel('https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1/model.json')` then fine-tune the last 2 layers
- **Approx params:** ~3.5M (with MobileNet backbone)

### Signal Ward — DIAGNOSTIC-ONE risk predictor

- **URL:** `/models/diagnostic-one-v1/model.json`
- **Architecture:** Embedding → BiLSTM → Dense
- **Input shape:** `[batch, seqLen]` — tokenized clinical note (vocab size ≈ 5000, seqLen 256)
- **Output shape:** `[batch, 3]` — softmax over `['low-risk', 'medium-risk', 'high-risk']`
- **Loss / metric:** `categoricalCrossentropy` / `accuracy` + recall on high-risk class
- **Training data:** would need de-identified clinical notes (MIMIC-III + ClinicalBERT pretraining) — not shipped
- **Approx params:** ~8M

### Nova Canvas — STUDIO-ONE generative

- **URL:** `/models/nova-canvas-optimized/model.json`
- **Architecture:** Small VAE (encoder: Conv → Conv → Dense → mean+logVar; decoder: Dense → ConvT → ConvT → sigmoid)
- **Input shape:** `[batch, 64, 64, 3]` — RGB image
- **Output shape:** `[batch, 64, 64, 3]` — reconstructed RGB
- **Latent dim:** 32
- **Loss:** reconstruction MSE + KL divergence (β-VAE, β=0.5)
- **Training data:** could ship trained on tiny CelebA-like 1k subset
- **Approx params:** ~500k

### Terra Grid — METEOR-FORECAST anomaly autoencoder

- **URL:** `/models/terra-grid/model.json` (also `/api/models/terra-grid/model.json` for API-mediated load)
- **Architecture:** 1D autoencoder (input → Dense 64 → Dense 16 → Dense 64 → output) + reconstruction error threshold
- **Input shape:** `[batch, 24]` — 24-hour rolling window of normalized power consumption
- **Output shape:** `[batch, 24]` — reconstructed window
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

await model.save('file:///path/to/apps/web/public/models/<theme>-v1');
// Outputs model.json + weights.bin under that directory
```

Drop those files at the path the lesson expects, restart the dev server, and the lesson code blocks become live-runnable.

## How exercises avoid this dependency

The capstone exercises grade things like:
- `validateModelAccuracy(predictions, minAccuracy)` — pure JS over a synthetic prediction array
- `verifyDeployment(checks)` — runs an array of async health checks, asserts shape of result
- `Pipeline.addStage(stage)` — registry / middleware patterns

None of these need a real model. The grader injects mock data into the test harness, so 312/312 pass without `/public/models` existing.
