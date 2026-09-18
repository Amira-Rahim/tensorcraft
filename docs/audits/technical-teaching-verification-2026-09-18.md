# Technical teaching verification

Date: 2026-09-18. Reviewer: Codex, internal. Scope: the runtime, caching,
conversion, benchmark and deployment teaching gaps in A18-A19/A23.

## Evidence

The [browser results](runtime-lab-2026-09-18.json) come from the downloadable
archive unpacked into a clean directory, followed by `npm ci --ignore-scripts`
and the full lab. No workspace dependencies or installed browser sessions were
used. Node 24.12.0, macOS arm64, Apple M3, Chromium 153.0.8010.12, visible
browser. The renderer reports Apple M3 through ANGLE Metal. A separate
headless run used SwiftShader and reported WebGPU unavailable; those results
are not hardware-performance evidence.

- TFJS 4.22.0 and ONNX Runtime Web 1.29.0, single-thread WASM: maximum output
  difference `2.682209014892578e-7` across 261 probes. CPU, WASM, WebGL and
  WebGPU also ran the same probes on the visible browser and passed parity.
- Each runtime has 20 warmups and 200 saved samples. Ten groups of 100 calls
  provide a separate amortized mean. Individual tiny calls sometimes round
  to zero. The report supports this run, not a universal runtime ranking or
  a parameter-count crossover.
- A real IndexedDB save survives page reload and provides the same score
  with networking disabled. A missing entry while offline fails. Injecting
  an IndexedDB quota error exercises the real cache loader's write-failure
  branch while retaining the downloaded model.
- Exact inference caching preserves all scores over 520 calls, with 260
  hits and 260 misses. The controlled rounding counterexample maps 0.499
  and 0.501 to the same key even though their scores lie on opposite sides
  of 0.5. The trace's latency includes lookup and insertion work; its hit
  rate is a property of that trace.
- `tensorflowjs_converter` 4.22.0 actually writes the files. Float32 weight
  bytes are 2,692; uint16 is 1,346; uint8 is 673. Both quantized models load
  in Chromium. Maximum score errors on the probes are about 0.0000364 and
  0.00580 respectively. Neither changed a thresholded verdict in this probe
  set. Without labels this is parity evidence, not an accuracy result.
- Transformers.js 3.8.1 loads both q8 and fp32 from the pinned model revision.
  ONNX weight sizes are 67,581,197 and 267,955,711 bytes. The q8 pipeline
  reloads and returns identical results with network disabled after runtime
  initialization. Full file hashes and the four text predictions are saved.
- [Deployment results](model-deployment-2026-09-18.json): the live HTTPS
  fixture matches the local complete-artifact fingerprint and prediction.
  Local faults in graph, weights and shard availability are rejected; the
  restored complete artifact passes. Production rollback was not performed.

The download is `apps/web/public/assignments/browser-runtime-lab-v1.zip`.
Its package lock and explicit packaging list are included in this patch. Rebuild with
`python3 scripts/package-runtime-lab.py`. Maintainer instructions are in
[runtime-lab.md](../runtime-lab.md); the archive has its own learner README.

The final formatted archive was extracted and checked again on Node 22.14.0,
with the same pinned browser/runtime versions. Its SHA-256 is in the
[final runtime report](runtime-lab-final-2026-09-18.json). All checks pass,
including physical GPU execution. Pretrained downloads were reused and rehashed;
background development work means these timings should not rank runtimes.
The [final deployment check](model-deployment-final-2026-09-18.json) also passes.

## Corrections

| ID | Defect | Repair and check |
|---|---|---|
| T01 | ONNX grader chose a backend from a million-parameter cutoff | Remove that verdict from instructions, hints, solution and tests. Teach target-device measurements; real backend parity/timing recorded. |
| T02 | ONNX example referred to an absent export and omitted session cleanup | Ship an exact small-network exporter in the lab; release sessions, including after failure. Test returned outputs rather than recomputed answers. |
| T03 | Setup benchmark warmed a different shape and printed an assumed backend speed order | Warm and read back the exact workload; check initialization's boolean result; remove universal rankings. |
| T04 | A failed IndexedDB save rejected a successfully loaded model | Keep network loading mandatory and cache persistence optional. Exercise real offline and injected storage-failure branches. |
| T05 | LayersModel and GraphModel conversion paths were conflated | Name their distinct loaders and limit the supplied ONNX exporter to its supported architecture. |
| T06 | Bare converter flag consumed the input filename | Reproduced the `Missing output_path` failure. Use quoted `--quantize_uint8=*` / `--quantize_uint16=*`; run both real conversions. |
| T07 | Quantization promised a specific memory peak and unchanged inference speed | Separate stored weight bytes, decoded weights, runtime memory and latency. Remove the unsupported peak arithmetic and unrecorded holdout results. |
| T08 | Quantization's accepted solution leaked temporary tensors | Scope synchronous teaching arithmetic with `tf.tidy`. Isolated real-TFJS execution confirmed stable tensor count and retained caller model. |
| T09 | Sentiment scores, instant cache reads and cold-start guarantees were overclaimed | Pin model revision/dtype/device, record actual scores and assets, qualify storage and startup. Teach domain and label mismatch. |
| T10 | Cache timing omitted miss-path overhead; generic LRU rejected an empty-string key | Include miss overhead in the explanation, qualify the old estimate, validate limits and accept an empty key. Add a measured repeat trace and rounding counterexample. |
| T11 | Deployment pin covered weights alone and scoring fetched the URL again | Fingerprint manifest plus shards and load the verified bytes. Reject changed graph/weights/HTTP errors. Teach complete application/model rollback. |
| T12 | Scene figures were presented as reproduced benchmarks | Remove unsupported ONNX tables and quantitative rules. Identify optimization console tables as fictional scenario data. Actual measurements live in the reproducible report. |

Primary references checked: [TFJS save/load](https://www.tensorflow.org/js/guide/save_load)
for storage schemes, [conversion](https://www.tensorflow.org/js/guide/conversion)
for export/quantization, [ONNX environment and session options](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html)
for matching binaries/providers/threads, and the
[sentiment model card](https://huggingface.co/distilbert/distilbert-base-uncased-finetuned-sst-2-english)
for training domain and limitations. Executed code and captured artifacts
are the evidence for numerical results, not those documentation pages.

## Limits

One device is not a fleet benchmark. Local asset serving is not an internet
cold start. Synthetic probes are not independent accuracy data. The archive
does not certify every ONNX operator, browser, converter input format or
hosting provider. The exercises teach bounded contracts, and the lessons now
state those limits. The subsequent full editorial/factual and story pass is recorded in
[the internal review](internal-content-review-2026-09-18.md). No independent review, learner score or internal A is claimed
by these technical checks alone.
