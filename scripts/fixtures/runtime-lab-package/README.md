# Browser runtime lab

Run the same frozen TensorFlow.js classifier in real browser runtimes, test
caches and verify model deployment failures. You need Node 22 or later.
The model has 673 parameters trained on synthetic data. The probes check
numerical behavior; they do not measure real-world classification accuracy.

## Start

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run verify
npm run verify:deployment
```

The first browser run is partial until you add converter and pretrained
checks. See `test-results/runtime-lab.json` and
`test-results/model-deployment.json`. The scripts use an isolated browser
and a local server. They do not sign in, publish files or modify production.

For a visible browser with access to the machine's GPU:

```bash
RUNTIME_HEADFUL=1 npm run verify
```

Headless Chromium may use a software GPU or lack WebGPU. The report records
the mode, selected backend and renderer. Availability is checked; a fallback
is not silently reported as a GPU result.

## Run the full lab

The converter is a Python CLI used once to write the model files. Its
dependencies stay in a virtual environment. This pinned set was verified on
macOS arm64 with Python 3.9; other systems need compatible wheels.

```bash
python3 -m venv .venv-runtime
.venv-runtime/bin/python -m pip install -r scripts/runtime-lab/converter-requirements.txt
TFJS_CONVERTER="$PWD/.venv-runtime/bin/tensorflowjs_converter" npm run verify:full
```

On Windows, use the virtual environment's `Scripts` directory and your
shell's environment-variable syntax. Set `RUNTIME_HEADFUL=1` too if you want
the visible-browser GPU check.

The first full run downloads about 335 MB of pretrained model files plus
tokenizer/configuration assets. They are retained under
`test-results/runtime-model-cache/`. Files and hashes are pinned in
`scripts/runtime-lab/pretrained-files.json`. The model is
`Xenova/distilbert-base-uncased-finetuned-sst-2-english`, revision
`0b6928efcb76139cae2c6881d49cda67fe119f42`.
See its [model page](https://huggingface.co/Xenova/distilbert-base-uncased-finetuned-sst-2-english)
and [original model card](https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english)
for model details and license information. Downloaded weights are not included
in this archive.

## Read the results

- `runtime`: TFJS and ONNX Runtime execute the same weights on single-thread
  WASM. The exporter handles this exact dense architecture, not arbitrary
  models. Agreement across 261 probes checks the export's computation.
- `backends`: available TFJS backends run the same probes. A backend may be
  unavailable on your device. Software rendering is not a physical GPU test.
- `inferenceCache`: a repeat trace checks exact-score reuse, hit rate and
  lookup cost. Two inputs around a threshold demonstrate a wrong decision
  caused by rounding them onto one key.
- `indexedDb`: the model survives page reload and then loads with the network
  disabled. A cache miss while offline fails. An injected quota error checks
  that a failed cache write does not discard a usable downloaded model.
- `conversion`: the actual converter writes uint8/uint16 files, the browser
  reloads them, and the report compares scores. Disagreement with the original
  is not automatically a ground-truth error. These probes have no labels.
- `pretrained`: q8 and fp32 sentiment pipelines classify four operational
  reports. A subsequent q8 load uses cached model assets with the network
  disabled after runtime initialization. The initial assets are served
  locally, so load times are not internet-download measurements.

Timing includes output readback. Each run has 20 warmups, 200 individual
samples and ten groups of 100 sequential calls. Tiny calls can round to zero
on browser timers. Group totals improve mean-throughput resolution; they do
not give individual-call P95. Repeat with reversed run order before treating
a small difference as useful. Download time, cold application startup and
whole-page peak memory are separate experiments.

The deployment script rejects changed weights, a changed graph and missing
shards, then verifies a complete local restoration. This optional command
checks the public course fixture's exact files over HTTPS:

```bash
node scripts/check-model-deployment.mjs --origin https://tensorcraft.app
```

It does not rehearse production rollback. In your application, include app
code, preprocessing and label order in the release record, and test your
hosting provider's publication and restoration procedure.

## Extend the experiment

1. Record which backends your device supports and explain the fastest result.
2. Change the repeat trace and cache capacity. Report hit rate and total cost.
3. Find an input near a decision threshold and compare float32, uint16 and
   uint8 scores. Add labeled data before making an accuracy claim.
4. Choose a representative set of text reports before reading predictions.
   Explain why a high sentiment score is not an urgency label.
5. Explain why the deployment fingerprint must cover the graph as well as
   the weight bytes. Make one test fail and identify what it caught.

The fictional story console figures are not measurements from this lab.
