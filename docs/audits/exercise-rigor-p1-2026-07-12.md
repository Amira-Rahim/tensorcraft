# Exercise Rigor Sprint (P1): 2026-07-12

Follow-up to `content-trust-fixes-2026-07-12.md`. Goal: exercises must test the
concept the lesson teaches, and cannot be passed without doing the work.
Template discipline: `gradient-step` (anti-hardcode re-run) and
`create-a-tensor` (asserts the lifecycle, not just the value).

## Shipped

1. **compute-fft hardened** (was passable with `return 1;`): tests now assert
   the actual peak: 5 Hz tone found at 5 Hz, stronger-of-two components wins
   (20 Hz over a 0.3x 3 Hz), a +5.0 DC offset must not beat the 7 Hz tone
   (proves bin-0 exclusion), and a different length/rate signal tracks the
   input (12 Hz at 64 samples).
2. **build-autoencoder hardened** (no-bottleneck models used to pass): asserts
   the exact 8→4→2→4→8 unit ladder via `getConfig().units`, reconstruction
   shape on a batch, and that the model is compiled (mse + optimizer).
3. **backprop-chain wired into its lesson + hardened.** The exercise existed
   (and matched by lessonSlug) but `training-loop/03-backpropagation.mdx`
   never embedded `<Exercise>`, so the editor never rendered and the
   Challenge step's Continue gate could never be satisfied; learners were
   stuck unless they skipped. Now embedded (`## Challenge` before the
   drawer). Tests upgraded: loss 9, dL/dw = 6, gradient re-derived after
   `w.assign(5)` must be 10, and the grads object must be keyed by `w.name`
   (kills hand-built grads objects; found by running an actual cheat
   against the tests).
4. **batch-data wired into its lesson.** Already an excellent exercise (lazy
   generator + tf.data shuffle/batch + read-count assertion) but
   `foundations/04-data-loading.mdx` never embedded it. Now embedded.
5. **ensemble-detector rebuilt** (was a beginner boolean 2-of-3 vote on the
   module-7 climax): now computes the real ensemble from the module: z-score
   of the latest reading against a window via `tf.moments` (|z| > 3),
   autoencoder reconstruction-error threshold, LSTM prediction-error
   tolerance, then majority vote. Tests cover calm (0 votes), the computed
   z ≈ 26.8 spike, single-detector restraint, 2-of-3 firing, and the full
   73.4 Hz signature (3 votes). difficulty beginner→intermediate,
   mlContent arithmetic→evaluation.
6. **pipeline-architecture upgraded** (was `n * 2` toy stages): the grader now
   wires DEEP SCAN's real feature path through the learner's Pipeline class:
   8-sample window → z-normalize (tf.moments) → rfft magnitudes (5 bins) →
   [1,5] model-input tensor, with shape contracts between stages, including a
   mid-pipeline contract break (FFT emits 5, next stage demands 8).
   mlContent arithmetic→systems.
7. **verify-deployment upgraded** (was string-formatting checks): the grader
   now runs real TFJS inference probes through the learner's runner:
   output-range contract, anomaly-probe gate (sigmoid(3.1) ≈ 0.957 > 0.9),
   calm-probe gate (sigmoid(-0.5) ≈ 0.378 < 0.5), plus a failing strict gate
   and ordered-execution/collection checks. mlContent arithmetic→systems.
8. **incident-false-alarm-storm spec gap closed**: instructions now state the
   ordered logic incl. the default branch (anything outside known failure
   signatures escalates to real-event); new boundary test at ratio 30
   (between the drift band and the extreme case).

## Verification (as of the round-2 audit below)

- CI grader: **80/80 on real TFJS**, now including the `--starters` invariant.
- Shipped-runtime corpus: **80/80 through the actual `parseAndRunTests`
  path** (node worker transport, same buildFullCode/HARNESS as the browser).
- Anti-cheat runs: audit cheat solutions executed against the new tests, all
  rejected; two of my own hardenings were caught weak this way and fixed.
- vitest 1025 tests green; typecheck 9/9; velite clean; e2e lesson surfaces
  green (first-compile flakes pass solo; use PW_PORT while Ops Portal holds
  port 3000).

## Round 2: P1 audit (same day)

An exhaustive gameability sweep of ALL 80 shipped exercises + an adversarial
review of the sprint's own diff found and fixed the following:

**Grader-infrastructure bugs (the big ones):**
- **Split-brain TypeScript stripping.** The CI grader used a robust
  bracket-balancing stripper; the shipped runtime used a crude regex that
  mangled object literals (`label: i % 2` → `label % 2`) and never stripped
  testCode at all. Four exercises (ensemble-detector, batch-data,
  verify-deployment, build-autoencoder) threw Syntax/ReferenceErrors for
  real learners while the grader reported green. FIXED: single source of
  truth at `scripts/lib/strip-typescript.mjs`, mirrored in
  `packages/ui/src/mdx/strip-typescript.ts`, with
  `strip-typescript-parity.test.ts` asserting byte-identical output over
  the full corpus, and `buildFullCode` now strips testCode too.
- **`toContain` matcher was unsound** in both harnesses: silently passed
  when `actual` was neither array nor string, so `expect(null).toContain(x)`
  passed; two exercises (write-model-card, generate-report) were passable
  with untouched starter code. FIXED in both + `--starters` mode added to
  the validator (starter passing every test = hard fail) and wired into
  `pnpm test:exercises`.
- **Runtime harness lacked beforeAll/beforeEach/afterEach/afterAll** — any
  suite using them silently registered zero tests. Ported from the grader
  harness. `toThrow(message)` now actually checks the message in both.
- **`exercise-corpus.test.ts`** (EXERCISE_CORPUS=1): every exercise runs
  through the shipped runtime; solution must pass, starter must not.

**Content: 11 high-severity gameable exercises hardened** (a constant that
ignored the input used to pass): forward-pass, deep-scan-eval,
training-loop-exercise, reconstruction-error, fft-features,
build-spectrogram, inference-pipeline, onnx-comparison, tfjs-setup,
load-model, find-threshold. Pattern: exact-value assertions against
deterministic models/signals (zero-weight + identity autoencoders, known
FFT peaks 64/32, computed F1 optima), recompute-against-the-model equality,
normalization probes, tensor-leak checks, and spy/self-referential checks
for loader/session APIs (kept env-portable across the differing
loadLayersModel stubs).

**3 SOFT exercises where hardcoding beat solving, fixed:** batch-data
(dataset must re-drain: readCount 16→32), kalman-filter (exact
predict-correct sequence 5.238/7.067/var 0.384; EMA fails), simple-attention
(softmax([1,0]) → 0.731/0.269 blend; mean-pooling and argmax both fail).
Plus: recurrent exercises now assert the layer class (LSTM/SimpleRNN, so
Flatten+Dense stacks fail), write-model-card/generate-report got
second-input cases, extras' compute-gradients autoGradient must equal the
hand-derived 1.56 (and 0 when ReLU gates), toeplitz convolveViaMatrix must
produce the actual convolution values, ci-cd-gate gained an empty-batch
NaN guard (difficulty beginner→intermediate).

**Wiring verified clean by the sweep:** 0 orphaned exercises, 0 broken
`<Exercise>` references, 0 zero-exercise lessons across all 77 built
lessons.

**Accepted floor (documented, not bugs):** 6 fixed-input beginner exercises
where hardcoding the literal answer equals the effort of the one-line real
solution (implement-neuron, relu-activation, mse-loss, add-tensors,
reshape-tensor, create-a-tensor); gradient-step's hardcode path is not
easier than the 3-line solution; `## Challenge` prose sections render on
earlier steps too (global prose visibility model, tracked as P2 renderer
work).

## Round 3: final launch gate (same day)

Adversarial re-review of round-2's own diff + browser-parity audit + the
first-ever browser exercise e2e. Results:

**Adversarial diff review: 0 confirmed errors** (second consecutive clean
pass). Every round-2 number was re-derived from first principles
independently of the solutions (Kalman gain sequence, attention softmax,
FFT closed forms incl. the phase-invariance of on-bin magnitudes across
STFT windows, F1 optima, z-scores, chain-rule gradients) — all correct.
Six latent (non-shipping-impact) suspects; the two real ones fixed:
runtime describe now saves/restores hook stacks (describe-scoped
beforeEach/afterEach, matching grader + vitest), and the grader's beforeAll
double-fire removed so both harnesses fire setup exactly once at
registration. Async beforeAll remains unsupported in the runtime (no
shipped exercise uses it). batch-data/backprop-chain rely on registration-
order sequencing of their own tests (deterministic in this harness).

**THE LAUNCH BLOCKER: CSP killed every exercise run in the product.**
The new `e2e/exercise-run.spec.ts` (the first test ever to click
"Run Tests" in a real browser) timed out — root cause in
`apps/web/next.config.ts`: no `worker-src` directive, so worker creation
from a Blob URL fell back to `script-src` (no `blob:`) and was silently
blocked; the CDN importScripts host was not allowlisted either. Every
learner's Run Tests would have timed out in any CSP-enforced environment,
and no test had ever caught it because none executed an exercise. FIXED:
`worker-src 'self' blob:` added; TFJS 4.22 vendored same-origin at
`apps/web/public/vendor/tfjs-4.22.0.min.js` (worker loads it first, CDN as
fallback — also removes the jsdelivr single point of failure);
`cdn.jsdelivr.net` allowlisted for the fallback; per-run timeout raised
10s → 30s (cold TFJS load + training exercises). E2e now green: starter
fails red, solution passes green, in real Chromium against the real app.

**Browser-parity audit** (vs the node worker the corpus test uses): code-
identical except the TF load line; every API the rewritten tests use is
supported on the browser path; the ONNX `ort` global is provided by the
shared shim (pre-existing, works); `tf.spectral.rfft` has a registered
WebGL kernel in 4.22. Also surfaced: velite already transpiles exercise
code with the real TypeScript compiler at build time, so the runtime
stripper is a second pass over near-clean JS (defense in depth).

**Residual, documented:** the 80/80 corpus run exercises the CPU backend
(node); browsers pick WebGL. All ops used have registered WebGL kernels
and assertions use toBeCloseTo, so risk is precision-only; bulk WebGL
verification needs seeded-auth e2e (paywalled lessons) — tracked with the
existing seeded-auth gap in `docs/gt-narrative-polish-checklist.md`.

## Deliberately not in this slice

- Graded quizzes: needs renderer step-set + UX work (Quiz component is
  deprecated and unmapped); its own slice.
- Remaining `mlContent: arithmetic` exercises (16): verified factually correct
  in the round-3 audit; several are legitimately non-tensor (model cards,
  prompt templates, Kalman math in plain JS). Revisit opportunistically.
- Exercise difficulty labels beyond ensemble-detector: current labels match
  content post-upgrade.
