# Run the browser runtime lab

This lab checks actual browser APIs and model files. The course editor uses
controlled substitutes for network/runtime APIs so it can grade your code;
passing those exercises does not establish external-runtime compatibility.

From a repository checkout with Node 22 or later and pnpm 10.12.4:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
node scripts/check-runtime-lab.mjs
node scripts/check-model-deployment.mjs
```

The first command records a **partial** result until conversion and pretrained
checks are also requested. Reports go to `test-results/`. The browser serves
local assets on a loopback address; it uses a fresh isolated browser context.

## Conversion

The converter is a separate Python tool. Keep its dependencies in a virtual
environment; they are not shipped to the learner's browser. The pinned set
was executed on macOS arm64 with Python 3.9. Other platforms need compatible
wheels; do not silently replace the converter with simulated quantization.

```bash
python3 -m venv .venv-runtime
.venv-runtime/bin/python -m pip install -r scripts/runtime-lab/converter-requirements.txt
TFJS_CONVERTER="$PWD/.venv-runtime/bin/tensorflowjs_converter" \
  node scripts/check-runtime-lab.mjs --pretrained
```

`--pretrained` downloads about 335 MB of pinned ONNX model weights plus
tokenizer/configuration files. Downloads are cached under
`test-results/runtime-model-cache/`. The lab records their SHA-256 hashes.
It tests Transformers.js 3.8.1 with model revision
`0b6928efcb76139cae2c6881d49cda67fe119f42` of
`Xenova/distilbert-base-uncased-finetuned-sst-2-english`.
It uses local copies to isolate runtime behavior from Hub availability.
The first-load duration therefore measures local serving, not an internet
download on a learner's connection.

For a manual converter invocation:

```bash
.venv-runtime/bin/tensorflowjs_converter \
  --input_format=tfjs_layers_model \
  --output_format=tfjs_layers_model \
  '--quantize_uint8=*' \
  apps/web/public/models/deep-scan/model.json /tmp/deep-scan-q8
```

The explicit quoted `=*` matters. A bare `--quantize_uint8` before the input
path can consume that path as its optional weight pattern and leave no output
argument. Use `uint16` for the other storage width, or a weight-name pattern
such as `*/kernel` to retain biases at full precision.

## What is checked

- TFJS 4.22.0 and ONNX Runtime Web 1.29.0 execute the same 673-parameter
  classifier on single-thread WASM. A small exporter preserves this exact
  Dense/ReLU/Dense/ReLU/Dense/Sigmoid graph; it is not a general converter.
- 261 fixed probes check numerical agreement. They include boundary and
  out-of-range inputs but have no labels, so they do not measure accuracy.
- Warm inference includes input creation and output readback. The report
  retains 200 individual samples after 20 warmups, plus ten groups of 100
  calls. Group totals improve timer resolution for mean throughput; they
  cannot supply individual-call tail latency. Zero-duration samples mean
  the clock did not resolve the call, not that inference took no time.
- CPU, WASM, WebGL and WebGPU are attempted. Unsupported backends are reported
  as unavailable. The report identifies the WebGL renderer. A software GPU
  in headless Chromium does not establish physical GPU performance.
- IndexedDB is saved, reloaded in a new page and used with network disabled.
  A missing cache plus unavailable network must fail. An injected storage
  quota error must leave the downloaded model usable. This checks the model
  cache; it does not make the application shell available offline.
- An exact inference cache preserves scores on a defined repeat trace.
  A separate threshold example shows two rounded inputs sharing a key even
  though their uncached decisions differ. Cache timing includes lookup work.
- The real converter writes uint8 and uint16 manifests/shards. Chromium
  reloads both and compares scores with the original. Changed labels are
  disagreements with the original, not ground-truth errors.
- A real sentiment pipeline runs q8 and fp32. Recreating the q8 pipeline with
  network disabled checks cached model assets after runtime initialization.
  It does not guarantee permanent storage or an offline first page load.
- The deployment check rejects changed weights, a changed graph and a
  missing shard, then verifies a complete local restoration. It loads the
  exact bytes whose fingerprint passed, avoiding a second mutable URL read.

To inspect the current hosted teaching model without deploying anything:

```bash
node scripts/check-model-deployment.mjs --origin https://tensorcraft.app
```

This verifies HTTPS responses, artifact identity and inference from those
bytes. Local rollback simulation is separate from production operation.
For a real release, include application code, preprocessing and labels in
the release record and verify your host's rollback procedure too.

## Interpreting results

Timing thresholds are not correctness assertions. Repeat with reversed run
order and the target browser/device/network before choosing a backend.
The tiny course model is especially sensitive to timer rounding and startup
noise. Compare the full workload, including model load and the surrounding
application, when setting product budgets.

Story console measurements remain fictional scenario data. They are not
benchmarks reproduced by this lab. The checked-in review report records
actual results and identifies which old claims were removed or qualified.
