# Internal content review, 2026-09-18

Scope: all 56 Deep Orbit lessons, 65 exercises and the supporting learner
surfaces. Reviewer: Codex. This is an internal review, not independent evidence.
The owner requested these stages in order. No reviewer recruitment is due yet.

## Acceptance

An internal A requires at least 9/10 for factual reliability, JavaScript
accessibility, learning design, readability, storytelling and player agency.
Use the five criteria per category in `docs/content-quality-plan.md` and
record evidence for each score. Every lesson/exercise must receive a full
in-context pass. Any consequential factual error, incorrect accepted solution
or unsupported advertised capability blocks A regardless of average.

Do not infer learner ROI, price validation or market demand from internal
review. Those remain ungraded until independent evidence is collected later.

## 1. Technical teaching gaps: implemented and verified

See [technical evidence](technical-teaching-verification-2026-09-18.md).
The downloadable lab passed from a clean archive install, including actual
CPU/WASM/WebGL/WebGPU execution on Apple M3, converter output, IndexedDB,
pretrained model caching and read-only hosted artifact verification.

- Real TFJS/ONNX execution on the same frozen weights, with output parity,
  warmup, readback, timing distribution and explicit environment.
- Genuine IndexedDB save/reload, offline access, cache miss and write failure.
- Actual converter output loaded in the browser; weight bytes and numerical
  error verified. Storage quantization must not imply integer execution.
- Real pretrained pipeline, pinned model revision, asset sizes and cache use.
- Hosted artifact checks, failure gates and rollback verification.
- Replace unsupported benchmark claims with reproducible observations or
  clearly identified fictional scene data. Device timings are observations,
  never cross-device pass/fail thresholds.

Initial defects repaired: the ONNX exercise incorrectly grades backend choice from
parameter count; the lesson has an unavailable ONNX URL and unsupported
timings. The model-loading example treats a failed cache write as failed
inference readiness. Quantization text treats approximate memory arithmetic
as measured peak memory and invents unrecorded holdout results. Pretrained
pipeline text promises instant cache reads and cold-start guarantees.

## 2. Full content review: read-through complete

Read frontmatter, lesson body, code, hints, quizzes, recall, recaps, exercise
contracts and feedback together. Record artifact hashes and evidence in the
review manifest. Mechanical lexicon checks support this work; they do not
replace reading. Review glossary/module copy and rendered learner screens.

### Foundations: read and revised

All five lessons, five exercise YAML files (including tests and feedback) and
module metadata were read in full. Fixes in this pass:

- Explain explicit tensor ownership on every backend; distinguish the tensor
  ledger from process memory. Explain that `tf.tidy` callbacks are synchronous.
- Release intermediates and returned examples consistently. The normalization
  and tensor-operation solutions now preserve outputs without retaining sums,
  transposes, variance tensors or temporary weight tensors.
- Remove unsupported CPU-versus-JavaScript speed ratios. Broadcasting needs
  compatible aligned dimensions; transpose is appropriate only when axis
  meaning calls for it, not as a universal shape-error repair.
- Mark the archive reader as an integration dependency and await it from an
  async generator. Remove the invented shuffle-buffer coverage span. Qualify
  shuffling by the task and keep chronology/group membership separate.
- Shorten dense shape recaps and introductory hints. Remove a slogan from
  the data-loading ending. Distinguish prediction changes from correctness.

`scripts/check-reviewed-examples.mjs` executes the actual reviewed MDX
blocks on TFJS CPU and verifies stable tensor counts. The archive example uses
a named asynchronous reader fixture, not a deployed archive service.
All six selected execution groups pass. Exercise regression, rendered checks and the season-wide story pass
are complete in the final verification below.

### Neural Networks: read and revised

All five lessons, five exercises and module metadata read in full. Removed
unsupported random-trial claims and the interpretation of untrained scores
as evidence about sample 7741. Corrected the installed Dense default to
Glorot-normal, separated prediction from compilation, qualified symmetry and
activation claims, shortened exercise contracts and cleaned temporary tensors.
Five actual MDX execution groups pass, including the manual forward pass.

### Training: read and revised

All five lessons, five exercises and module metadata read in full. Corrected
output-logit versus weight gradients, finite differences, residual Jacobians,
learning-rate claims and mini-batch accounting. Marked mission scores as
fiction and synthetic rows as synthetic; removed unsupported multi-run
statistics. Min-max scaling can exceed a fitted range. Noisy labels do not
prove a hard loss floor. Fixed tensor ownership in lessons and accepted
solutions, including restoring a nudged variable on error. Actual displayed
training, early stopping and held-out evaluation run together with stable
tensor counts. All 65 exercise solutions pass and starters/registered wrong
solutions are rejected after these changes.

### Browser runtimes: read and revised

All six lessons, seven exercises and module metadata read in full. Qualified
privacy, offline, download and timing claims; distinguished model scores from
calibrated probabilities; repaired asynchronous cleanup and a benchmark syntax
error. Model inspection disposes its loaded model; React integration now shows
unmount cleanup. The real runtime lab provides stage 1 evidence. A syntax check
now parses all 122 displayed JS/TS blocks, without claiming that parsing proves
their behavior or resolves integration dependencies.

### Signal Processing and Recurrent Networks: read and revised

All ten lessons, ten exercises and both module descriptions read in full.
Corrected train-only normalization, FFT bin interpretation, magnitude versus
energy, windowing claims, recurrent derivative explanations and LSTM gate
terminology. Removed unsupported repeated-run performance claims. Forecasting
now uses explicit validation data and guards invalid scaling and predictions.
Displayed FFT, STFT, feature training, RNN, LSTM and 47-step rollout examples
execute with separate named fixtures and stable tensor counts.

### Anomaly Detection: read and revised

All five lessons, eight exercises and module metadata read in full. Corrected
Gaussian assumptions, dependent-channel expectations, zero-spread policies,
selection bias, threshold uncertainty and unsupported contamination claims.
The ensemble now requires LSTM targets in its own training scale rather than
reusing autoencoder normalization. ARIA's replay scores sensor windows beside
her decisions, not incompatible decision records. Five displayed execution
groups pass, including a distinct-scaler regression and zero-baseline handling.
A nested-model disposal check exposed retained weights; the displayed training
example now uses one Sequential with explicit lifetime ownership. Fitting
failure cleanup and invalid ensemble inputs receive exercise checks.

### Advanced Time Series: read and revised

All five lessons, five exercises and module metadata read in full. Qualified
attention's distance, timing and explanation claims. Fixed temporary tensor
ownership. Replaced the unsupported trained-LSTM forecast table with an
executable deterministic feedback example. A matched-horizon error increase is
a review signal, not proof of drift. Kalman noise parameters are variances;
optimality depends on the model assumptions. Initialization no longer counts
the first observation twice. Stacking distinguishes fitting and final evaluation,
and ensemble weights are not confidence probabilities. All five displayed code
groups pass with named integration fixtures and stable tensor counts.

### Optimization and Edge: read and revised

All five lessons, six exercises and module metadata read in full. Corrected
profiling cleanup, percentile indexing, failure paths and the distinction between
logical tensor growth and process memory. Removed contradictory pruning,
curvature, low-rank and LoRA claims. Clearly marked mission compression and
latency tables as fiction. Cache results do not establish source uniqueness;
backend exhaustion can fail instead of guaranteeing a working fallback.
All selected displayed examples execute with stable tensor counts. Final regression passes after the story patch.

Primary references consulted alongside installed TFJS 4.22 source and executable
checks: [TFJS ownership and models](https://www.tensorflow.org/js/guide/models_and_layers),
[NIST normal-distribution assumptions](https://www.itl.nist.gov/div898/handbook/pmc/section5/pmc51.htm),
[autoencoder reconstruction limitations](https://arxiv.org/abs/1904.02639),
[original Transformer](https://arxiv.org/abs/1706.03762), and
[LoRA's frozen-base update](https://arxiv.org/abs/2106.09685).

### LLM Integration: read and revised

All five lessons, six exercises and module metadata read in full. Clarified
prefill, cached decoding and causal attention; separated token prediction from
truth verification. Added explicit server-only API integration, timeouts and
response validation. Prompt examples are valid JSON with field checks. RAG
bounds exclude future records and treat retrieved text as untrusted evidence.
Regeneration clears prior approvals. The composed pipeline validates model
outputs, labels its reduced-coverage fallback and preserves measured alerts
when language generation fails. Five actual MDX execution groups pass; HTTP
and retrieval services use named fixtures, not paid live API calls.

### Capstone: read and revised

All five lessons, eight exercises and module metadata read in full. Distinguished
chain runners from DAG schedulers and dependency names from schema checks.
Monitoring now has bounded logs, consistent nearest-rank percentiles and
validated inputs. Drift does not establish accuracy loss. Hosted verification
uses the pipeline loaded by its verified loader, tests labeled probes and enforces
latency budgets. Cleanup runs on errors. The launch rehearsal rejects malformed
configuration and preserves borrowed models. Exported intermediate weights are
disposed. Mission model sizes and calibration records are identified as fiction;
correlation and ensemble agreement cannot establish the signal's origin.

### Supporting learner surfaces and rendering

Read all glossary definitions, the world description, independent project brief,
rubric, report and data-license material, and the early transfer assignment.
Corrected glossary claims about temporal splits, statistical assumptions, causal
attention, cache behavior, drift, runtime guarantees and low-rank adaptation.
Removed unsupported career salary estimates. Shortened dense recaps and removed
unqualified fictional benchmark results from summaries.

All 56 lessons render in the production LessonContent component at 1100px and
375px without page errors or page-wide horizontal overflow. Fixed long inline
code and raw code-fence overflow. This local browser fixture stubs authentication,
external APIs and the exercise editor; it does not establish paid-route behavior.
Exercise grading and actual MDX execution are separate checks. Selected scene screenshots were inspected after the story patch.

This pass covers Deep Orbit, not the four unreleased worlds. Historical audit
and infrastructure entries in the manifest are not newly approved merely because
they appear beside the reviewed learner material.

## 3. Story consequences: implemented and piloted locally

Six decisions now read and write the account's existing saved-choice record.
The four original IDs and option indices are retained. No schema migration or
invented production learner choice is required. Wording and follow-up scenes
have changed; saved historical choices map to the same positions.

| Decision | Later scene | What changes |
| --- | --- | --- |
| First handling of 7741 | First Neuron | Investigation packet, restored archive row, reconstructed context or scheduled replay |
| 7741 in the training set | Autoencoders | Label audit, sensitivity run, separate fit or diagnostic-probe review |
| Report section release | Multi-Model Systems | Review slots, refusal record, citation repair or research queue |
| Cache policy, new pilot | WebGPU Acceleration | Uncached queue watch, collision replay, version-isolation repair or separate miss budget |
| Drift response, new pilot | Documentation | Calibration handoff, blocked release, muted-interval replay or shadow-run review |
| Deployment rehearsal | Launch, before 0213 | Verification deadline, override handoff, complete rollback rehearsal or canary stop conditions |

The deploy-night canary remains canon. The deployment choice is explicitly a
rehearsal and affects follow-up work, rather than claiming to change that fixed
record. Scientific results do not change because a reader selected a different
button. Report release still requires review. Raw archives remain available;
removing a working-list row creates recovery work rather than erasing later canon.
ARIA's unanswered final operator note remains the season's last beat.

Fixed a persistence defect: an RPC error or signed-out write returned false,
which the component treated as a saved choice. Errors now remain visible and
retryable. A false insertion result reads the server's first saved choice,
including a competing-tab submission. Stale read/write completions cannot put
one lesson's choice into another lesson. An unanswered countdown records nothing.

The [local pilot record](story-pilot-2026-09-18.json) covers every option in all
six decisions: 24 branches, later-scene text, reload and locked revisit, failure
recovery, competing tabs and keyboard activation. Both new pilots pass axe checks
at 1100px and 375px. This is a developer browser pilot with a mocked Supabase
transport and real production MDX/components/client. It is not a live database
write, an independent reviewer result or a learner usability study.

## Final verification

- All 65 accepted exercise solutions pass; all starters and registered wrong
  solutions are rejected. This is bounded grader coverage, not a proof that
  every valid implementation passes or every possible cheat fails.
- All 122 displayed JS/TS code blocks parse. Selected actual MDX examples run
  across every module, with named integration fixtures and tensor cleanup checks.
- Full repository Vitest: 250 suites pass, 2,784 tests pass, 65 tests skipped in
  the existing environment. Follow-up targeted tests cover the navigation race fix and guest-session
  handling (19 story tests pass); conditional live RLS checks are not claimed from these skips.
- Type checks and production build pass. Web lint has no errors and 16 existing
  warnings. Standalone assignment globals now declare their Node/browser context.
- [Rendered record](content-render-2026-09-18.json): all 56 lessons at two widths;
  screenshots inspected for lesson scenes and both new decisions. No page-wide
  horizontal overflow or uncaught browser errors in the local renderer.
- The final downloadable runtime archive was extracted again, installed with
  `npm ci --ignore-scripts`, and passed all full lab checks in visible Chromium,
  including real CPU/WASM/WebGL/WebGPU, conversion and pretrained pipelines.
  Pinned downloaded model files were reused and rehashed. See the
  [final runtime run](runtime-lab-final-2026-09-18.json) and
  [final hosted-artifact check](model-deployment-final-2026-09-18.json).
- No deployment or production rollback is performed by this patch. The existing
  historical reviewer packet predates these revisions and must be regenerated
  before any later external handoff.

Reproduce from the repository:

```bash
pnpm install --frozen-lockfile
pnpm turbo build:content
node scripts/check-lesson-code.mjs
node scripts/check-reviewed-examples.mjs
node scripts/validate-exercises.mjs --starters --cheats
node scripts/check-content-browser.mjs --story
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @tensorcraft/web lint
node scripts/check-content-review.mjs
```

See [runtime instructions](../runtime-lab.md) for the separate converter and
pretrained download requirements. Timings vary by device and background load.

## Internal grade: A, with explicit scope

These are my judgments against the five content criteria in the approved plan,
in their listed order, after the complete internal read-through and repairs.
They are not independent scores, measured comprehension or a promise of perfect
content. A 1 marks a remaining limitation, not a known consequential defect.
Every listed factual, grading and rendering defect found in this pass is repaired.

| Category | Criterion scores | Internal score | Evidence and remaining limitation |
| --- | --- | --- | --- |
| Fit for JavaScript engineers | 2, 1, 2, 2, 2 | 9/10 | JS-to-ML bridges, explicit ownership and runnable examples span the sequence. Advanced attention and statistical sections remain dense even with their prerequisites and drawers. |
| Learning design | 2, 1, 2, 2, 2 | 9/10 | Objectives, task contracts, hints, feedback and retrieval were read together; early transfer and the final project reduce scaffolding. Much of the in-course practice is still guided. |
| Factual reliability | 2, 2, 2, 1, 2 | 9/10 | Claims, assumptions, units and assessment surfaces agree after repair. Actual runtime evidence replaces universal benchmark claims; reproduction covers named fixtures and one hardware configuration, not every deployment. |
| Readability and voice | 2, 2, 1, 2, 2 | 9/10 | Full text/glossary pass, shorter recaps, less inflated prose and inspected screens. Advanced lessons still demand slow reading; fresh-reader comprehension remains unobserved. |
| Storytelling | 2, 2, 2, 1, 2 | 9/10 | The mystery, crew roles, technical failures and ending remain coherent. Six saved decisions now affect later work; consequences are localized and the season still has one canonical ending. |
| Player agency | 2, 1, 2, 2, 2 | 9/10 | Evidence informs calls; saved branches persist and change later scenes without changing scientific truth. Some options deliberately expose obvious engineering mistakes rather than equally attractive strategies. |

Internal source/design gate: passed for Deep Orbit. Independent application
outcomes, learner ROI, value at $70 and acquisition potential remain ungraded.
The project exists and runs; that is not evidence that a learner can complete it
unaided. Other worlds have not received this full review. Recruitment and learner
study remain a later owner-directed step; nobody was contacted in this work.
