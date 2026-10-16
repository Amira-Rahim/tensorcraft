# Deep Orbit quality audit: runtime, signal and sequence lessons

Date: 2026-10-16. Scope: all 21 lessons, all five lesson sections, all 22 associated exercises, and the four module descriptions in `browser-runtimes`, `signal-processing`, `recurrent-networks`, and `advanced-time-series`.

This is a source and runtime audit against the binding lesson quality contract, writing rubric and story bible. It includes scene/context metadata, dialogue, objectives, bridges, code, optional references, exercise instructions/starters/solutions/grader predicates/hints, recall/recap, and epilogues. Exercise predicates were also inspected in a comment-free TypeScript rendering that preserves their inputs and assertions. No exercise identity, requirement, solution, assessment answer or saved-choice index changed in this pass.

## Coverage and findings

Each cell records what was checked in that section. “Retained” means the source already supports the stated task and no confirmed correction was needed. It does not claim a learner study or a screenshot review of every rendered page.

| Lesson | Briefing | Concept | Challenge | Takeaways | Epilogue | Finding or correction |
|---|---|---|---|---|---|---|
| why-the-browser | Nazari needs predictions during link failures; artwork and dialogue remain in the main flow. | Local/server tradeoffs include downloads, memory, availability and privacy limits. | Decision policy preserves hard local requirements and the inclusive 50 MB boundary. | Recall rejects automatic privacy/offline guarantees. | One-second live cadence is separated from 33-second archive rows. | Replaced abstract objectives with concrete decisions and simplified the MB/MiB comment. The 50 MB and 50 ms rules remain explicitly exercise policy, not universal device limits. |
| tensorflow-js-setup | Console timings are labeled story values. | Backend registration, initialization, fallback, benchmark warmup and readback are covered. | Simulated cold startup checks awaiting, refused preferences and total failure. | Active-backend and completed-work checks match the task. | Old station remains on the latency checklist. | Replaced a loose browser-rendering analogy with the actual backend contract: speed, precision and operation support can differ. Confirmed 4.22 backend registration priorities and `ready`/`setBackend` behavior from installed source. |
| model-loading | Missing-manifest cold open establishes the actual loading failure. | JSON manifest, shards, loaders, versioned IndexedDB and UI teardown distinguish real assets from integration sketches. | One load, copied shape metadata and model disposal. | Recall distinguishes runnable model from plain JSON. | A reused cache key costs three hours of stale predictions. | Clarified that this export uses two files; the format can have more weight shards. Cache write failure still keeps a usable downloaded model. |
| inference-pipeline | Cancellation leaves an output tensor without an owner. | Training feature contract, sync/async cleanup, readback and handler timing are explicit. | Real TFJS inference plus a separate tensor-growth estimate. | Recall distinguishes accumulation evidence from proof of a leak. | Review of 7741 remains uncertain at score 0.518. | Simplified circular-phase encoding and stated that changing feature count requires retraining. Retained class-score/calibration distinction and operational-budget qualification. |
| onnx-runtime-web | Nazari requests measurements from bridge consoles. | Actual graph compatibility, provider, output agreement and latency distribution precede speed conclusions. | Simulated ONNX and clock are explicitly separated from the downloadable real lab. | Recall rejects laptop-wide and parameter-count guarantees. | The differing benchmark scopes are acknowledged before interpreting runtime differences. | Retained. No new claim that conversion parity establishes classification accuracy. Real runtime/model download measurements were not rerun by this content audit. |
| transformers-js | Reports are an operational-text experiment, not a morale measurement. | Pinned model/revision/dtype/device, task fit, labels, caching and domain evaluation are explicit. | Load once, classify a batch, preserve input/output pairing and sort scores. | Recall asks for representative evaluation and model suitability. | Farah returns the story to the unknown signal. | Clarified that score ordering measures neither urgency nor correctness. The simulated pipeline exercise does not claim that the real model understood a report. |
| time-vs-frequency | Archive replay connects to the original tensor layout. | Same samples, complex transform, magnitude/phase distinction and off-bin leakage. | Compare corresponding samples and FFT magnitudes, including disappearing components and DC differences. | Recall preserves limits from noise, leakage and windowing. | Full-capture transform is queued; physical source remains unknown. | Restored recording-header provenance for the 64 columns, simplified Farah's explanation and objectives, removed an inapplicable implication that TFJS `irfft` accepts a length argument. |
| fourier-transform | Demir needs to turn a bin index into a frequency. | Bin spacing, Nyquist, aliasing, magnitudes and threshold limits. | Use the measured largest eligible bin; DC is excluded and ties are defined. | Recall correctly maps bin 20 and the 73.4 Hz alias at 128 Hz sampling. | Half-hertz then eighth-hertz grids explain the displayed 73.4 Hz measurement. | Made the FFT prediction activity visible in the concept flow. Retained background-catalog and false-alarm caveats; the toy peak finder is not an instrument-source detector. |
| spectrograms | Farah's steady-tone hypothesis consumes the lab slot. | Successive FFT frames, axes, defaults, window/hop tradeoff and magnitude/power conventions. | Rectangular frames are intentionally different from the built-in Hann default. | Recall tests frequency spacing and event-timing cost. | Intermittent bursts establish the approximate 73.4 s gap. | Simplified the construction explanation. Retained explicit four-second synthetic capture versus much longer mission pulse gaps. |
| fft-as-features | Fictional evaluation explicitly labels dataset/annotation changes. | Fixed bin identity, raw-feature definitions, training-only scaling and parameter counts. | Requested frequency band selects fixed centers in order; phase is deliberately omitted from this exercise. | Recall rejects new-information and guaranteed-accuracy claims. | Nine-point improvement is a provisional extrapolation, not a known full-archive reduction. | Explained 94%, 78% and 87% using their actual reference labels and evaluation rows. The two earlier scores cannot isolate one cause because both labels and rows changed. |
| windowing-and-overlap | Phantom contacts cost eighty minutes, and Nazari asks about changed peak magnitudes. | Leakage, symmetric versus periodic Hann, peak width, overlap and reconstruction conditions. | Symmetric formula is graded; the leakage metric is a summed magnitude, not energy. | Recall covers the tradeoff and splitting before overlapping windows. | Persistent peak rules out one explanation without proving a source. | Retained. Actual selected examples reproduce the leakage reduction and frame counts under TFJS 4.22 CPU. |
| sequences-matter | One-row classifier cannot compare the repeating sequence. | Order, dense-window baseline, recurrent reuse and tensor axes. | Windows need a following target, support stride, and return real tensors. | Recall separates reading order from feature order. | Shuffling changes no per-reading score in the stateless classifier. | Split the dense-versus-recurrent explanation into concrete steps. Longer sequences do not add recurrent parameters but still add computation. |
| simple-rnns | Demir's reducer comparison is corrected by the hand-picked cell example. | Hidden-state updates, weight order, derivative products and limits of diagnosing loss. | Plain-JS recurrence and derivative factors are compared with real layer states. | Recall does not diagnose vanishing gradients solely from 0.693 loss. | Failed overnight run establishes the cost and need for a different cell. | Simplified weight initialization wording. Kept the distinction between the one-state derivative and a full training gradient. |
| lstm-gates | The earlier failure motivates gates; no memory-duration guarantee is offered. | Gates, candidate, packed column order, explicit sigmoid versus default hardSigmoid, and GRU comparison. | Handwritten diagonal drill is distinguished from the full matrix layer; real one-unit outputs must match. | Recall distinguishes trained weights from recurrent state. | Later-day replay starts each window with fresh state. | Simplified the failure explanation and labeled 950,400 one-second feature rows correctly, instead of conflating them with 256 Hz raw samples. |
| sliding-windows | Inflated score leads to a small auditable experiment. | Nearest-neighbor leakage example, honest chronological split, target choice and live buffer. | Windows must stay entirely on one side of the cut; labels come from their last reading. | Recall correctly counts both endpoints for a distant dependency. | Live forecast leads into the next prediction task. | Corrected the off-by-one context claim: a 74-step separation needs 75 readings, leaving five extra readings in an 80-reading window. Shorter cues may still support a different prediction. |
| sequence-prediction | Farah asks for units and a baseline before trusting a longer forecast. | MSE/MAE, training-only scaling, physical limits in z-score units and horizon definitions. | Actual fit history, iterative feedback, clamping before reuse and failure cleanup. | Recall connects regression to continuous targets and tensor ownership. | Three-second macro-cycle miss remains a question, not proof of an external agent. | Split normalization and circular-phase notes into readable paragraphs. Preserved the explicit distinction between 47 one-second steps and the story's 47-minute macro-cycle. |
| beyond-lstm | An early ripple is a hypothesis to investigate, not a proven explanation for the miss. | Query/key/value, unscaled attention, encoder dependence, projection widths and cost. | Rank-1 query and differing key/value widths are explicit; pool values. | Recall preserves the roles of Q, K and V. | Timestamp checks begin the compression investigation; no cause is invented. | Removed overconfident claims that attention hotspots identify the true evidence or prove the LSTM failed to retain it. Made the query activity visible. |
| temporal-attention | The two hotspots motivate inspection without treating attention as causation. | Scoring, pooling, raw timing, clipped buffers, order invariance and a linear position feature. | Score the normalized position column but pool only the original features. | Recall distinguishes weight allocation from a causal explanation. | Narrow recording loses early data and leads to wider captures. | Simplified the scorer explanation, distinguished timestamp `77.4 s` from gap `73.4 s`, marked a buffer dependency as an integration sketch. Coordinated the shared activity's recency coefficient with the exercise convention. |
| forecasting | Mirza asks what observation would distinguish source explanations. | Same-horizon error comparison, feedback example and non-stationarity caveats. | Both arms use the same model; rollout reuses predictions while replay uses only observed history. | Recall rejects diagnosing drift from horizon growth alone. | Both measured pulse and macro-cycle gaps shrink; source remains unresolved. | Retained. Numerical feedback example and drift edge cases execute; a constructed rule is not presented as a trained-model benchmark. |
| kalman-filters | Noisy daily intervals motivate comparison with two EMAs. | One-state random-walk model, variances, gain, lag and conditional optimality. | Correct both estimate and carried variance; compare dynamic gains on fresh parameters. | Recall connects gain to relative uncertainty and missing velocity state. | Crew carries uncertainty assumptions to the bridge; 72.4 s remains the canonical rounded estimate. | Replaced an unsupported “clean, low-variance” conclusion with the actual smoothness and 0.43 s lag. Moved optimality conditions out of the overloaded dialogue and stated that this log does not verify them. |
| time-series-ensemble-methods | Crew weighs all-member compute against cancellation of errors. | Same target/time/units, inverse-squared-MAE heuristic, held-out weighting, stacking and correlation. | Equal and weighted blends are scored against the best member on the same current window. | Recall rejects guaranteed gains, shared-bias cancellation and inconsistent units. | Zero-interval lines remain explicit extrapolations from eight readings. | Retained. Tests include weaker members, ranking reversals, tiny positive errors and JavaScript property names. No scientific result changes to reward an option. |

## Confirmed fixes

The changes address specific rubric categories rather than applying a mechanical rewrite:

- Technical/metadata errors: 74-step endpoint counting, raw samples versus feature rows, and a timestamp that could be mistaken for the pulse interval.
- Unsupported substance: attention hotspots as verified evidence, unproven LSTM retention failure, and low-variance wording without a known true trajectory.
- Wordy or indirect language: backend comparison, label-set changes, normalization, phase wrapping, hidden-state initialization and scorer descriptions.
- Interaction placement: the FFT and attention prediction activities now appear in the main concept flow. Optional derivations remain optional. The scene, dialogue and task stay visible.

No one-off page layout was introduced. The shared workbench, dialogue, artwork, captions, section shell and navigation continue to determine layout. The root audit owns rendered width, typography, phone behavior, keyboard use and reduced-motion verification.

## Runtime evidence

All four focused reviewed-example commands passed with the pinned `@tensorflow/tfjs` 4.22.0 CPU backend:

```sh
REVIEW_MODULE=browser-runtimes node scripts/check-reviewed-examples.mjs
REVIEW_MODULE=signal-processing node scripts/check-reviewed-examples.mjs
REVIEW_MODULE=recurrent-networks node scripts/check-reviewed-examples.mjs
REVIEW_MODULE=advanced-time-series node scripts/check-reviewed-examples.mjs
```

These cover 15 grouped runs over 42 authored code blocks, including the three earlier signal blocks supplied to the Fourier example, with integration fixtures for external dependencies and tensor-count cleanup assertions. Coverage includes sync/async inference, FFT magnitudes, spectrogram timing, Hann leakage, extracted features, the 97.4/60.6 leakage comparison, RNN/LSTM execution, iterative forecasting, attention, one-step replay, Kalman arithmetic, ensemble weighting and tiny-error handling. The script executes the actual selected MDX code strings. It does not execute every browser-only setup/loading example, contact a live model service, or establish accuracy on real labeled data.

Focused source gates passed: `slop-lexicon`, `structure-variety`, `interval-canon`, 11 tests total. Exercise YAML and recall checks remain unchanged; the root audit runs the shared compiled-content exercise and assessment gates after integration.

## Primary references checked

- [TensorFlow.js 4.22 API](https://js.tensorflow.org/api/4.22.0/): spectral operations, STFT arguments, recurrent configuration, tensor ownership and model loading. Installed 4.22 source was also inspected for backend initialization and registration priorities.
- [TensorFlow.js tensor guide](https://www.tensorflow.org/js/guide/tensors_operations): execution and explicit tensor resource management.
- [ONNX Runtime environment and session options](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html): execution-provider setup and matching WASM assets.
- [Transformers.js pipeline documentation](https://huggingface.co/docs/transformers.js/en/pipelines): task factory, revision and dtype options.
- [SciPy Hann window documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.windows.hann.html): symmetric and periodic conventions. The actual TFJS even-length outputs were executed separately.
- [Stanford optimal-estimation notes](https://web.stanford.edu/class/cs231a/course_notes/10-optimal-estimation.pdf): linear-Gaussian filtering assumptions and predict-correct equations.

## Limits and follow-through

Source/API agreement and passing runtime fixtures are concrete evidence, not a universal guarantee of forecast quality, device speed, physical-source identification or learner understanding. The numerical code and the fictional mission results are deliberately separate. The real ONNX/Transformers.js downloadable lab, every supported hardware backend, and every rendered route were not rerun by this content sub-audit.

Two shared activity issues were passed to the core audit and corrected there: temporal attention now includes the lesson's normalized position coefficient rather than repeating the earlier query-only calculation, and the sliding-window start control reaches every valid input-plus-next-target window. The core agent added TFJS comparison tests for both. Browser proof, the full exercise validator and course-wide continuity checks belong to the integrated root audit.

## Shared bridge catalog and rendered fallback audit

The second pass read the full 51-entry `packages/shared/src/bridges.ts` catalog and traced the actual `BridgeCallout` resolver. The relevant scope was IDs 1 through 26 (shared and Deep Orbit references), plus 35 (matched by a Deep Orbit title), 46 (quantization reference) and 47 (pruning reference). The other 22 world-specific entries stayed outside this change. The earlier core correction to ID 3 was preserved.

### Actual lesson associations

The previous resolver matched either the JavaScript title or the ML title. Only these six course entries matched it; the rest of the catalog audit concerns reference content rather than injected lesson footers.

| Lesson | Authored JS title | Authored ML title | Catalog ID | Result after correction |
|---|---|---|---|---|
| loss-functions | expect().toBe() | Loss Function | 3 | Explicit alias retained. React variant, connection and fallback limits remain available. |
| fft-as-features | Data Transformation | Feature Engineering | 10 | Explicit alias retained. Lesson's inline limits still take precedence. |
| activation-functions | Math.max(0, x) | ReLU Activation | 14 | Explicit alias retained. Identity refers to the mathematical rule, with numeric precision qualified. |
| backpropagation | Error up the call stack | Backpropagation | 15 | Explicit alias retained. Catalog footer no longer says loss travels backward or a derivative specifies the exact weight update. |
| pruning | Tree-Shaking | Pruning | 47 | Explicit alias retained. Generic layout continues to use authored lesson code and inline limits. |
| first-neuron | Array.reduce() | Neuron | 35 | Accidental association removed. The shared JS API does not make a neuron bridge an RNN bridge. |

ID 35 had no React variant, so its connection and code were not appearing in the first-neuron page. The lesson's inline limits also overrode its limits. That avoided incorrect visible copy in the current version, but an absent inline limit or a future React variant could have injected unrelated RNN content.

`resolveLessonBridge()` now requires both normalized canonical titles, or one of the five explicit alias pairs above. A match on only one side returns no catalog entry. `BridgeCallout` and the corpus coverage gate use that same resolver. This preserves intentional aliases without adding an inferred association for every occurrence of `Array.reduce()` or another familiar API.

### Catalog corrections

| IDs | Confirmed issue corrected |
|---|---|
| 1, 2, 16, 35 | Distinguished training examples, learned parameters, inference inputs and carried recurrent state. Learned cells remain inspectable; inference need not train weights or be random. |
| 3 | Core's loss correction retained: assertions use Object.is, loss need not be a mathematical distance, and absolute error is not smooth everywhere. |
| 4, 5, 6, 7, 8, 12, 24, 25 | Removed claims of guaranteed descent, convergence, nonblocking scheduling or generalization. Training can stop on a finite budget; scheduling and early stopping are separate. TFJS 4.22 best weights require manual restoration. |
| 9, 10, 11, 13 | Separated L2 penalties from dropout, feature design from implementation, validation from final testing, and inspectable layer math from arbitrary opacity. Leakage can happen through preprocessing or model selection. |
| 14, 15 | ReLU shares a mathematical rule rather than bit-identical storage. Backpropagation computes local derivatives; the optimizer chooses update size. |
| 17, 18 | Augmentation must preserve valid targets. Inverted dropout scales kept activations during training, then passes values through unchanged at inference. |
| 19, 20 | Confusion counts require labels but do not measure confidence or error cost. Rollback and local IndexedDB storage do not restore changed conditions or create a complete hosted/offline application. |
| 21, 22, 23 | Biases can initialize at zero; Glorot also considers fan-out. Batch normalization uses variance plus epsilon and stored inference statistics. A residual shortcut need not be a 1x1 convolution. |
| 26 | Softmax scores can reach zero through underflow or masking and are not automatically calibrated. The snippet applies softmax once to logits. |
| 46, 47 | Weight storage quantization is different from integer execution. Zeroing dense weights does not remove dense storage, and L1 regularization is not the pruning operation itself. |

The scheduling examples now call the real SGD `setLearningRate()` method and perform training under that schedule. The pruning example now performs a tensor mask rather than declaring an L1 penalty. The React dropout example includes the required training-time rescaling.

### Regression evidence for catalog changes

`packages/shared/src/bridges-runtime.test.ts` executes the actual catalog snippets for both learning-rate schedules, backpropagation, the JS dropout example, softmax and pruning. Additional real-runtime checks verify inverted dropout, multi-example batch-normalization inference using stored statistics, uint8 storage decoding to float32, and unsupported automatic best-weight restoration.

The numerical fixtures establish these concrete boundaries: the SGD schedules produce the expected final fitted weight, a local derivative of 8 produces a 0.08 update at learning rate 0.01, logits `[-1000, 0]` produce scores `[0, 1]`, pruning leaves four float32 slots allocated, and three uint8 stored weights decode into twelve logical float32 bytes. These are pinned CPU-runtime observations, not device-speed claims.

Focused catalog runtime, rendered resolver and corpus coverage checks passed: 33 tests in three files. Including the source slop and em-dash gates, the final focused run passed 37 tests in five files. Shared package typecheck and UI `tsc --noEmit` passed. The resolver UI tests retain all five aliases, preserve inline limits and reject unrelated JS-only and ML-only matches.

Primary evidence for the added corrections includes the installed 4.22 callback, SGD and dropout source; the [pinned dropout implementation](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/tfjs-core/src/ops/dropout.ts), [pinned callback implementation](https://github.com/tensorflow/tfjs/blob/tfjs-v4.22.0/tfjs-layers/src/callbacks.ts), [TensorFlow.js quantization examples](https://github.com/tensorflow/tfjs-examples/blob/master/quantization/README.md), and [WebP compression documentation](https://developers.google.com/speed/webp/docs/compression). The decode and allocation claims are also verified directly by the new runtime tests.
