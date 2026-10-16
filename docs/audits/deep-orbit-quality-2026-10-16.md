# Deep Orbit quality audit, 2026-10-16

Completed local review of **56 lessons, all 280 main sections, and all 65 exercise contracts**. The review includes frontmatter, scene metadata, dialogue, objectives, code and comments, optional references, hints, secondary exercises, recall, recaps, terms, epilogues, saved decisions, and later story consequences.

The [lesson quality contract](../../CLAUDE.md#lesson-quality-contract-binding-2026-10-16) remains binding. The original requirements are saved there, and the audit requirement now explicitly covers every section and distinguishes source review, executed examples, and browser evidence.

## What was checked

- Every authored lesson and exercise was read in full across three module reviews. The tables below and linked reports account for every lesson.
- Every main section was rendered in the actual development app at **1512px and 320px**: 560 width observations. The final records show no horizontal page overflow, no unlabelled visible native inputs, correct lesson titles, and story scenes before the primary experiment where that shared scene is used.
- Every lesson's primary activity was exercised in the browser. All 54 shared investigations ran both cases, preserved the first run when inputs changed, compared two runs, and reset. Introduction ran actual TensorFlow.js tensors for five and three readings. Tensor Shapes checked the second row, compared reshape and transpose, and checked the fresh example.
- All 54 optional reference instruments were opened and operated at both widths. All six secondary practices were exercised through their worked case, help, changed case and reset. Neither set introduced page overflow or unlabelled visible native controls.
- Primary API references and installed pinned-runtime source were checked where needed. Selected authored runnable examples were executed, with integration sketches and mocked service boundaries identified rather than presented as live services.
- The actual exercise validator ran all 65 canonical solutions, untouched starters, and registered wrong-answer fixtures. Existing worker regression tests check the browser/CLI grading path.
- Twenty-nine relevant shared bridge entries were reviewed, including reference-only catalog entries. Runnable schedules, backpropagation, dropout, softmax, pruning, decoding and early-stopping behavior received targeted checks.

The shared full-width vertical shell, typography, speech treatment, centered captions and navigation remain the course layout. No separate lesson template was introduced.

## Confirmed defects corrected

### Technical and teaching alignment

- Negative sigmoid inputs produced invalid displayed JavaScript. Generated expressions now execute correctly, and recurrent examples retain enough precision to reproduce their stated state.
- Batch and sliding-window controls could not reach later valid rows/windows. Their bounds now depend on the selected size and clamp safely when that size changes.
- Temporal Attention repeated the earlier query-only calculation. It now includes the lesson's normalized positional term before softmax, without changing the values being averaged.
- The Anomaly's activity used three overlapping cutoffs on one variable. It now displays amplitude, reconstruction and forecast checks separately and computes the actual two-of-three vote.
- Prompt Engineering repeated response validation. It now builds and visibly displays the role/task, supplied catalogue, identified reading with units, and JSON request. It makes no model call or accuracy promise.
- Exact-threshold comparisons now follow the authored strict greater-than policy. A raw score is distinguished from a calibrated probability and from unbounded reconstruction MSE.
- Monitoring no longer invents a 200% ratio when the limit is zero. Its missing-input chart compares the observed percentage and limit directly.
- Partial report assembly retains approved sections and lists withheld sections. A stale cache entry establishes a version mismatch, not necessarily a changed numerical prediction.
- Backpropagation grading now enforces its existing single-forward-call requirement and checks restoration of a perturbed variable after an exception.
- TensorFlow.js early stopping is distinguished from manual best-checkpoint saving and restoration. Bridge text no longer promises convergence, generalization, independent detector evidence, sparse dense storage, bounded rounding effects, or calibrated softmax scores.
- FFT feature columns remain fixed at 4, 12 and 20 Hz as the signal changes. The optional references now match the main activities' strict threshold, positional attention and three-detector vote, and their generated calculations retain intermediate precision.

### Story and clear wording

- Removed an unsupported percentage over all possible readings and an incorrect ten-times-compute comparison.
- Corrected the 74-step endpoint count, distinguished raw samples from feature rows, and identified how sensor/timing metadata is known.
- A short FFT capture no longer appears to measure 73.4 Hz exactly. Earlier estimates, bin resolution and timestamps are distinguished.
- Fictional mission findings, constructed demonstrations and small practice models are identified. Optimization probes are separate from the earlier binary classifier, and eight-feature practice data is separate from the eleven-feature mission example.
- Attention and uncertainty scenes describe observations without claiming a proved cause. Early prototype testing is distinct from the canonical final deployment.
- Model-card label coverage is explicitly missing rather than invented. The final story row and earned outcomes remain intact.
- Dense or indirect explanations were simplified without deleting API requirements, technical conditions or the crew's task.

### Shared UI and saved work

- The Loss Functions slider and answer field shared an ID. Controls now have their own ID namespace and independent accessible labels.
- An experiment could submit as a native browser form before its JavaScript handlers were ready. Server-rendered controls now wait for readiness, with a regression check and successful rapid browser runs.
- Scrollable reading cells and value tables have keyboard focus affordances. All authored mission location captions now explain screenplay shorthand in plain language.
- Reference controls and teaching text use the shared reading scale. The extra FFT practice has readable frequency labels and a labelled magnitude axis. Saved practice drafts reject contradictory results or frozen-policy records while retaining valid attempts and help history.
- Bridge association now requires an exact JS/ML pair or an explicit known alias. A Neuron bridge cannot inherit RNN metadata merely because both mention `Array.reduce()`.
- Loss Functions, Training Loop and The Anomaly now recall their core practical tasks. Their recall revision is 2, preserving earlier completion/history while requiring fresh answers for the changed tasks.

## Per-lesson section coverage

Each `R` means the complete section received source/teaching review and rendered desktop/phone checks. Concept activity behavior was also exercised for every row. Detailed findings and runtime scope are in the module reports below. This is coverage evidence, not a claim that a usability study has measured learner understanding.

| Module | Lesson | Briefing | Concept | Challenge | Takeaways | Epilogue |
| --- | --- | --- | --- | --- | --- | --- |
| foundations | From JavaScript Arrays to Tensors | R | R | R | R | R |
| foundations | Understanding Tensor Shapes | R | R | R | R | R |
| foundations | Basic Tensor Operations | R | R | R | R | R |
| foundations | Loading and Preparing Data | R | R | R | R | R |
| foundations | Data Normalization | R | R | R | R | R |
| neural-networks | Your First Neuron | R | R | R | R | R |
| neural-networks | Activation Functions | R | R | R | R | R |
| neural-networks | Layers and Architecture | R | R | R | R | R |
| neural-networks | The Forward Pass | R | R | R | R | R |
| neural-networks | Building a Complete Network | R | R | R | R | R |
| training-loop | Loss Functions | R | R | R | R | R |
| training-loop | Gradient Descent | R | R | R | R | R |
| training-loop | Backpropagation | R | R | R | R | R |
| training-loop | The Training Loop | R | R | R | R | R |
| training-loop | Evaluating DEEP SCAN | R | R | R | R | R |
| browser-runtimes | Why the Browser? | R | R | R | R | R |
| browser-runtimes | TensorFlow.js Setup | R | R | R | R | R |
| browser-runtimes | Model Loading | R | R | R | R | R |
| browser-runtimes | Inference Pipeline | R | R | R | R | R |
| browser-runtimes | ONNX Runtime Web | R | R | R | R | R |
| browser-runtimes | Transformers.js for Pretrained Models | R | R | R | R | R |
| signal-processing | Time vs Frequency | R | R | R | R | R |
| signal-processing | Fourier Transform | R | R | R | R | R |
| signal-processing | Spectrograms | R | R | R | R | R |
| signal-processing | FFT as Features | R | R | R | R | R |
| signal-processing | Windowing & Overlap | R | R | R | R | R |
| recurrent-networks | Sequences Matter | R | R | R | R | R |
| recurrent-networks | Simple RNNs | R | R | R | R | R |
| recurrent-networks | LSTM Gates | R | R | R | R | R |
| recurrent-networks | Sliding Windows | R | R | R | R | R |
| recurrent-networks | Sequence Prediction | R | R | R | R | R |
| anomaly-detection | Normal vs Anomalous | R | R | R | R | R |
| anomaly-detection | Autoencoders | R | R | R | R | R |
| anomaly-detection | Reconstruction Error | R | R | R | R | R |
| anomaly-detection | Threshold Tuning | R | R | R | R | R |
| anomaly-detection | The Anomaly | R | R | R | R | R |
| advanced-time-series | Beyond LSTM | R | R | R | R | R |
| advanced-time-series | Temporal Attention | R | R | R | R | R |
| advanced-time-series | Forecasting | R | R | R | R | R |
| advanced-time-series | Kalman Filters | R | R | R | R | R |
| advanced-time-series | Ensemble Methods | R | R | R | R | R |
| llm-integration | LLMs for Science | R | R | R | R | R |
| llm-integration | Prompt Engineering | R | R | R | R | R |
| llm-integration | RAG for Signals | R | R | R | R | R |
| llm-integration | Report Generation | R | R | R | R | R |
| llm-integration | Multi-Model Systems | R | R | R | R | R |
| optimization-edge | Model Profiling | R | R | R | R | R |
| optimization-edge | Quantization | R | R | R | R | R |
| optimization-edge | Pruning | R | R | R | R | R |
| optimization-edge | Caching Strategies | R | R | R | R | R |
| optimization-edge | WebGPU Acceleration | R | R | R | R | R |
| capstone | System Architecture | R | R | R | R | R |
| capstone | CI/CD Pipeline | R | R | R | R | R |
| capstone | Monitoring | R | R | R | R | R |
| capstone | Documentation | R | R | R | R | R |
| capstone | Launch | R | R | R | R | R |

## Evidence and reproducible checks

- [Core review: 20 lessons and 23 exercises](deep-orbit-quality-2026-10-16-core.md).
- [Sequences and runtimes: 21 lessons and 22 exercises, plus bridge catalog](deep-orbit-quality-2026-10-16-sequences.md).
- [Applied review: 15 lessons and 20 exercises](deep-orbit-quality-2026-10-16-applied.md).
- [Rendered measurements, all 56 primary activity records, 54 optional references and six secondary practices](deep-orbit-quality-2026-10-16-rendered.json).
- Full DOM snapshots and command logs are retained locally in `.superpowers/deep-orbit-quality-*-2026-10-16.*`.

```sh
pnpm --filter @tensorcraft/content build:content
node scripts/check-reviewed-examples.mjs
node scripts/validate-exercises.mjs --starters --cheats
pnpm exec vitest run --maxWorkers=2
pnpm --filter @tensorcraft/web typecheck
pnpm --filter @tensorcraft/web build
```

Final integrated results:

| Check | Result |
| --- | --- |
| Content compilation | Passed |
| Selected authored examples | 48 grouped runs passed, including numerical assertions and documented mocks |
| Exercise validator | All 65 solutions passed; untouched starters and registered wrong answers rejected; zero failures or warnings |
| Full regression suite | 3,558 tests passed across 307 files; one file with 65 worker exercise tests skipped by default, independently covered by the validator above |
| TypeScript | Web typecheck and production build passed |
| ESLint | Changed web TypeScript files passed |
| Rendered sections | All 280 at 1512px and 320px; zero horizontal page overflow or unlabelled visible native controls |
| Browser interaction | All 56 primary activities, 54 optional reference instruments and six secondary practices operated successfully |
| Deferred scene check | All nine scenes previously unloaded at both widths loaded after being brought into view |
| Diff whitespace | Passed |

The local development server was restarted after the successful production build. [Open the lesson review gallery](http://localhost:3000/design/deep-orbit?lesson=fft-as-features&viewport=full&phase=concept) to select any lesson and section. [Visual evidence of the corrected FFT activity](../../.superpowers/deep-orbit-quality-2026-10-16-fft.jpg) is retained locally.

## Evidence limits

The selected runnable examples and all exercise grading checks are verified against pinned TensorFlow.js 4.22.0 and documented APIs. The browser walkthrough uses the development preview, so locked sections can be reviewed without changing production progress. The preview displays the recap for design review; the real lesson's recall and earned-ending gates are separately covered by regression tests.

The numeric investigations disclose when they simulate a calculation rather than train a model. Fictional mission measurements do not become scientific evidence because an exercise passes. Mocked external services are not live-provider tests. This audit does not establish forecasting accuracy on unseen real data, speed on every GPU/browser backend, or learner outcomes from a usability study.

Some scenes were not loaded at initial measurement time; fast navigation may explain some observations. These were recorded as unloaded, not assumed broken. All nine scenes initially unloaded at both widths were rechecked in view and loaded successfully; their follow-up records are included in the rendered evidence. Asset coverage gates also check the authored files. Body text checks found only the editor's auxiliary save note at 15px; teaching paragraphs retain the shared reading scale.

All changes are local. No commit, production deployment, remote account mutation or live inference-provider request was made by the audit workflow.
