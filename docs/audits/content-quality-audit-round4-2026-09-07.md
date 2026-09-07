# Deep Orbit content quality audit, round 4, 2026-09-07

Owner request: run the audit again with fresh eyes. Same four questions.
Is every module delivering the best content it can? Does every module
bring a JavaScript engineer closer to the basics of ML? Can a finisher
really explain the topics? Is there ambiguity, fuss, or text that acts
smart without delivering value?

This round grades genuinely different content. Since the last audit, all
twenty Tier 1 findings were fixed across four passes, touching about
thirty-four files. The first job of this pass was to find out whether
those fixes held and whether they broke anything.

## Method

Forty-nine readers, all on Opus, none shown any earlier audit and none
told what had been edited. Forty-four read one module through one lens
(ML correctness, cold reader, continuity, exercise fit). Five tracked
the whole world: story and technical threads, the ML concept spine,
chronology and pointers, and two claim-consistency sweeps that hunted
for any ML claim stated one way in one surface and differently in
another. They produced 701 raw findings.

Eleven merge agents cut those to 165, capped at 15 per module. Every
merged finding then faced independent skeptics: three for a high
finding, two for a medium, one for a low. Fourteen findings were
refuted. 151 stand.

Readers were told to verify by running code rather than by reasoning,
and they did: exercise graders were executed, cheating solutions were
written and run, and numbers were recomputed against TensorFlow.js
4.22.0. I ran my own checks separately, listed below.

**One change from last round, and it matters for reading the numbers.**
Last round's skeptics refuted 89% of what they saw, and 65 of those
kills had a dissenting skeptic who said the finding was real. That was
too strict, so this round they were told not to refute merely because a
finding is small, and to give a severity call instead. They refuted 8.5%.
The result is a longer and less filtered list than last round's. Do not
compare the two counts; compare the grades, which come from the readers
under identical conditions both times.

## Verdict in four answers

**1. Is every module delivering the best content it can? Not yet, and
the grade has not moved.** Ten modules sit at B+ as the median of four
independent readings. Training is now A-. Overall the world is still B+.

The fixes held. Not one of the twenty Tier 1 findings from the last
round came back, and no reader independently rediscovered aliasing as
vanishing, the overlap rule, the shuffle buffer, the drift detector, the
feedforward framing, the Kalman attribution, file size as memory, the
ONNX cross-runtime claim, or the finale's projection sentence. Two
graders that used to pass a solution doing nothing now reject one. That
layer is closed.

What this round found is a layer underneath it, and it is larger than I
expected: 32 high findings, most of them new.

**2. Does every module bring a JavaScript engineer closer to the basics
of ML? Yes, and the arithmetic is still trustworthy.** Readers recomputed
numbers across all eleven modules and reported them correct, including
every figure the last round of edits introduced. What fails, repeatedly,
is a specific surface: the retrieval layer. A body explains a mechanism
correctly and then the RecallPrompt, the recap bullet, the objective or
the hint states it wrongly. Module 1's recall answer gives a false
reason for shuffling before batching, which its own body gets right
forty-seven lines earlier. Module 3's nudge hint says weights update
once per epoch, which its own drawer contradicts. Those are the
surfaces a learner is most likely to remember, because they are built
for recall.

**3. Can a finisher explain the topics? Most of them, with three named
holes that no earlier audit caught.** They still could not say what a
feature or a label is, because neither word is defined in any lesson or
in the glossary despite appearing in code the learner writes. They could
not expand MAE, which is an objective, a recap bullet and a capability
line in module 6 and is never defined. And they would believe attention
is parameter-free, because module 8 teaches it with the raw hidden
states as query, key and value and never says a real head learns three
projection matrices.

**4. Is there ambiguity or fuss? The prose is not the problem.** Two of
the 151 findings are clarity complaints and none is a slop finding. The
problem is that the exercises do not grade what the lessons teach, and
this round put numbers on it. Six graders were beaten by solutions
written to demonstrate no understanding, each one executed to prove it.
The most uncomfortable of those is mine: I fixed the profiling grader
last night so it rejects a solution that measures nothing, and it still
passes a solution that calls predict the right number of times and
returns the numbers memorised from the lesson prose. I confirmed that
myself.

## Grades

Median of four independent readings per module. The four letters are
shown so the spread is visible.

| Module | Grade | Four readers |
|---|---|---|
| 1 Foundations | B+ | B+, B+, B+, B |
| 2 Neural Networks | B+ | B, B+, B+, B- |
| 3 Training | A- | A-, A-, B+, B- |
| 4 Browser Runtimes | B+ | B+, B, A-, C+ |
| 5 Signal Processing | B+ | B+, B+, B+, B |
| 6 Recurrent Networks | B+ | B+, B+, B+, B- |
| 7 Anomaly Detection | B+ | B, B+, B+, B- |
| 8 Advanced Time-Series | B+ | B+, B, B+, B |
| 9 LLM Integration | B+ | B, B+, B+, B- |
| 10 Optimization | B+ | B+, B+, B+, C+ |
| 11 Capstone | B+ | B+, B+, B+, B |

Overall: **B+**, unchanged from the last audit.

Read the spread rather than the median. In eight of the eleven modules
the lowest letter is the exercise reader, and it is the exercise reader
that produced both C grades. The prose is holding a B+ to A- line; the
exercises are dragging from below.

## What I checked by running it

Separately from the readers, and against the current files.

1. **The rewritten split generator leaks nothing.** Run over 1,000
   readings, one validation pass: zero leaked tensors, where the old
   code leaked 1,600. Each side now reads only the records it owns, 200
   of 1,000 rather than all 1,000.
2. **The shuffle figure on the page is right.** The lesson says roughly
   400 consecutive readings; measured mean span is 404 to 411 across
   three runs.
3. **The tensor count on the page is right.** The epilogue says 202 and
   explains it as a hundred buffered readings at two tensors each plus
   the batch in flight. Measured steady-state peak is exactly 202. It
   oscillates between 98 and 202 as the buffer drains and refills, so
   "hold steady at 202" is the ceiling rather than a constant.
4. **The ensemble grader now rejects the misconception its lesson exists
   to kill.** A solution that judges the ensemble against the mean of the
   member errors instead of against the best member fails the new test,
   4 of 5 passing.
5. **The profiling grader is still beatable.** A solution that calls
   predict the right number of times and returns memorised numbers
   passes 4 of 4. My fix last night closed the measures-nothing cheat
   and left this one.
6. **The initializer claim is correct as now written.** Measured kernels:
   the default is variance scaling in fan-average mode, biases are all
   zero, and 624 of the 673 parameters are actually drawn.

## Coverage and limits

- **What was read.** All 56 lessons and all 65 exercise files, each
  lesson by four independent readers, plus five whole-world trackers.
- **The merge cap bites harder this round.** Each module was capped at
  15 findings and every module hit the cap. The merge agents reported
  dropping between 16 and 25 real findings each, roughly 230 in total,
  all lower severity than what survived. They are recoverable from the
  run journal.
- **The filter was deliberately looser than last round.** 8.5% refuted
  against 89%. A finding on this list has survived a lower bar than a
  finding on the last list. Nine findings carry a dissenting skeptic and
  are marked.
- **What was not done.** No browser rendering and no visual check inside
  the audit, though I ran the full end-to-end suite and the visual
  baselines separately this morning and both are green.

## Recommended order

1. **The retrieval surfaces that teach the opposite of their bodies.**
   Module 1's shuffle recall answer and recap bullet, module 3's
   once-per-epoch hint, module 3's overfitting inequality, module 5's
   Hamming recap. Each is one or two sentences and each currently
   teaches something false on the surface a learner is most likely to
   remember.
2. **The six beatable graders**, starting with the profiling one, since
   I introduced its remaining hole. This is the exercise-mix project
   arriving with specific instances rather than a general complaint.
3. **The three undefined basics**: feature and label, MAE, and
   attention's learned projections.
4. **The rest by module**, using the per-module lists below.

## Tier 1: the 32 high findings

Each one teaches something false or leaves a named basic untaught. A
finding marked DISSENT had one skeptic who wanted it refuted.

### 1 Foundations

**H1. `foundations/04-data-loading.mdx:146`**

The RecallPrompt answer, and the matching recap bullet at line 152, give a
wrong mechanism for shuffle-before-batch: they blame frozen ordering
INSIDE each batch. A batch gradient is the mean over its rows, so
permuting rows inside a batch changes nothing.

Fix: State the real harm, which the body already states correctly at line
99 ("Without a shuffle each batch is one stretch of one day, so
consecutive adjustments all pull the same way"): batching first freezes
batch MEMBERSHIP, so every batch stays a block of consecutive, correlated
readings and every weight update is computed from one narrow slice of one
day.

**H2. `foundations/01-introduction-to-tensors.mdx:24`**

The module's first BridgeCallout, which is the learner's first definition
of a tensor, says a tf.Tensor tracks gradient information. It does not:
TensorFlow.js has no per-tensor autograd state.

Fix: Verified against @tensorflow/tfjs 4.22.0 resolved with createRequire
from packages/ui/package.json: a tensor's own properties are kept,
isDisposedInternal, shape, dtype, size, strides, dataId, id, rankType;
t.grad, t.gradient and t.requiresGrad are all undefined, and
tf.Tensor.prototype has no grad or backward member.

**H3. `foundations/04-data-loading.mdx:83`**

"Features" and "label" are the module's first supervised-learning terms
and appear in code the learner must write, but neither is defined in any
lesson body, hint, recap, or the glossary. Neither is the xs/ys
convention.

Fix: Verified: grep across all five lesson files shows feature/label only
inside code, hints and BossBeat option keys, never defined in prose; and
packages/content/src/glossary.ts (121 terms) has feature-engineering but
no feature and no label entry.


### 2 Neural Networks

**H4. DISSENT. `neural-networks/01-first-neuron.mdx:84`**

The "Reading the Weights" section teaches that the largest-magnitude
weight is the input that matters most, and the page's own numbers disprove
it. The misconception is also promoted to objective 4 (line 49, "magnitude
for how much the input matters") and to the recap (line 100, "Weights
encode how much each input matters").

Fix: A weight is sensitivity per unit of input; the contribution is weight
times input.

**H5. `neural-networks/03-layers-and-architecture.mdx:88`**

The parameter-counting rule is stated falsely: inputShape is part of the
layer config and it moves the parameter count, as the module's own lesson
5 proves by holding the units fixed and moving inputShape from [3] to [8]
for 673 to 833.

Fix: Verified on tfjs 4.22.0: the same stack with useBias: false on the
first layer counts 96 instead of 128, and inputShape [8] instead of [3]
gives 833 instead of 673.


### 3 Training

**H6. `training-loop/04-training-loop.mdx:171`**

The early-stopping block's two capture claims are false: the validation
loss never turns upward, and nothing in the run is memorization. The halt
is a patience-5 trip on a flat plateau, which is the artifact the block's
own closing warning names.

Fix: Either build a setup that actually overfits (more flipped labels, or
far more capacity on far fewer rows) and re-capture the halt epochs and
losses from a real run, or rewrite lines 156 and 171 to describe what the
code does: the validation curve flattens rather than climbing, and
patience trips on the plateau.

**H7. `training-loop/04-training-loop.mdx:29`**

The nudge hint says the weight update happens once per epoch. Weights
update once per mini-batch, many times per epoch, and the lesson's own
drawer says so 156 lines later.

Fix: Rewrite as "model.fit() runs the whole loop for you: forward pass,
loss, backprop, and weight update, once per batch, with the whole dataset
swept once per epoch.".

**H8. `training-loop/05-evaluating-deep-scan.mdx:143`**

The diagnosis bullet states overfitting as a bare inequality. Training
accuracy is essentially always at least slightly above test accuracy, so
as written the rule calls every healthy model overfit, and it contradicts
the same lesson's hint, recap, third bullet and grader, all of which use a
0.15 gap.

Fix: State the bullet as a gap: "Training accuracy far above test accuracy
(this course draws the line at a gap of 0.15) means the model is
memorizing", and say in one clause that a small gap is normal because the
model saw those rows..

**H9. DISSENT. `training-loop/04-training-loop.mdx:185`**

The only drawer that opens up model.fit() says it is plain SGD with the
update w := w - lr*grad, but every model in this module and both graded
classifiers compile with optimizer: 'adam', whose step is not that rule.
Adam is used five times across a module titled Training: Loss, Gradients &
Optimization and never given a mechanism.

Fix: Say step 4 is the plain-SGD update, then add one sentence that
`optimizer: 'adam'` replaces only that line with a per-parameter step
built from running averages of the gradient and its square, which is why
no learning rate appears in the fit() call even though lesson 2 called it
the knob that matters most.

**H10. DISSENT. `training-loop/exercises/training-loop-exercise.yaml:5`**

Lesson 4's exercise practises none of lesson 4's new material and does not
train the model the challenge line promises. It is one fit() call on a
4-row linear regressor with sgd and meanSquaredError: no classifier, no
validationSplit, no callbacks, no early stopping, yet the lesson certifies
all of those.

Fix: Rebuild the exercise on the lesson's own seeded calm/flagged clusters
(32/16/1 sigmoid, binaryCrossentropy) and make the learner add
validationSplit and tf.callbacks.earlyStopping, then grade that
history.history.val_loss exists and that the run halted before the epoch
upper bound.


### 5 Signal Processing

**H11. `signal-processing/05-windowing-and-overlap.mdx:214`**

The recap teaches as a transferable point that Hamming tapers signal edges
to zero. It does not: hammingWindow(n)[0] = 0.54 - 0.46 = 0.08, and that
nonzero endpoint is exactly why the same lesson gives Hamming a -6
dB/octave far-sidelobe rolloff.

Fix: Reword to "taper signal edges down before the FFT" and change the
code comment at line 94 ("A window function smoothly tapers the signal to
zero at the edges") to say Hann reaches zero while Hamming stops at 0.08,
which is why its far sidelobes fall off more slowly (line 106's -6 vs -18
dB/octave)..

**H12. `signal-processing/exercises/build-spectrogram.yaml:36`**

The build-spectrogram grader cannot tell an STFT from a single FFT copied
N times, so a solution that never advances in time passes all five tests.
The lesson's stated core claim (a single FFT "cannot say when they
appear") is the exact property the grader is blind to.

Fix: Make the fixture non-stationary and assert the time axis: a 10 Hz
tone for samples 0-127 and a 30 Hz tone (or silence) for 128-255, then
assert result[0][5] is close to 32 while result[6][5] is below 1, and that
the peak bin moves from 5 to 15 across rows.

**H13. `signal-processing/exercises/apply-window.yaml:29`**

The apply-window grader checks only the two endpoints and the centre, so a
boxcar with its first and last samples zeroed passes every test. That
window does not taper and does not reduce leakage, which is the entire
point of lesson 5, and nothing in the exercise ever computes an FFT so the
learner never sees leakage collapse.

Fix: Assert interior shape too: hannWindow(64)[8] is 0.1509 and [16] is
0.5125 (both recomputed).


### 6 Recurrent Networks

**H14. `recurrent-networks/exercises/predict-next.yaml:39`**

The one conceptual point of predict-next (a regression head must be
linear, not the sigmoid habit from the two preceding exercises) is graded
nowhere. The same activation hole exists in build-lstm.yaml and build-
rnn.yaml in the other direction.

Fix: Assert the output activation.

**H15. DISSENT. `recurrent-networks/03-lstm-gates.mdx:27`**

The lesson's whole payoff rests on the anomaly pattern being absent for 72
hours, which contradicts the 47-minute macro-cycle established one module
earlier and reaffirmed inside this same module. On a 47-minute cycle the
pattern returns roughly 92 times inside any 72-hour stretch, so a three-
day absence is ruled out by canon.

Fix: signal-processing/04-fft-as-features.mdx:243 reads "those pulses
bunch on a rough 47-minute macro-cycle.

**H16. `recurrent-networks/05-sequence-prediction.mdx:53`**

MAE is named in the objectives, the recap and the youCanNow line, but the
lesson never expands the acronym, never defines it, never computes it, and
never contrasts it with MSE. It is not in the glossary and this is its
first appearance anywhere in the course.

Fix: `grep -rniE '\bmae\b|mean absolute'` over deep-orbit returns hits
only in this file (lines 53, 76, 86, 140, 145) and in advanced-time-
series, two modules later; `grep -i mae packages/content/src/glossary.ts`
returns nothing.


### 7 Anomaly Detection

**H17. DISSENT. `anomaly-detection/04-threshold-tuning.mdx:26`**

The locked cutoff is arithmetically incompatible with the alert count the
lesson credits it with, and the error runs against the module's own alert-
fatigue thesis. A 99th-percentile cutoff flags 1% of calm readings by
construction. The canonical archive is 28,800 readings over eleven days
(01-normal-vs-anomalous.mdx:59), about 2,618 a day and 18,327 a week, so
1% is roughly 183 false flags a week. The lesson opens on Nazari's
fourteen alerts in a week (line 44) and its epilogue closes with two. The
chosen cutoff is about thirteen times noisier than the status quo it is
sold as fixing.

Fix: Carry the volume multiplication through, or move the locked cutoff.

**H18. DISSENT. `anomaly-detection/05-the-anomaly.mdx:127`**

The ensemble's three detectors are called independent and the whole
majority-vote argument rests on that word, but they are not independent:
all three score the same reading, the z-score detector's input (amplitude,
signal[0], line 98) is one of the 11 features the autoencoder
reconstructs, and the autoencoder and LSTM were fitted on the same normal
archive. A learner comes away believing 2-of-3 agreement multiplies
confidence. Lesson 1's own drawer makes exactly the opposite (correlation)
argument about hull channels.

Fix: Say "separately computed" or "methodologically different" rather than
"independent", here and at the two other places using the word (line 67
objective "more independent evidence", line 180 recap "a count of
independent evidence"), and add one sentence naming what breaks the vote:
the detectors share an input vector and two of them share a training set,
so a contaminated archive (this module's own lesson 2 epilogue) makes two
of the three fail the same way..

**H19. `anomaly-detection/02-autoencoders.mdx:118`**

The lesson promises the learner can train an autoencoder on normal-only
data, but no exercise in the module ever calls .fit(). build-
autoencoder.yaml builds a model and never sees data; the recap's youCanNow
at line 134 repeats the claim.

Fix: Either extend build-autoencoder to fit on a supplied normal-only
array and assert that the trained model's error on a held-out anomalous
row exceeds its error on normal rows, or drop "train" from line 118 and
from the youCanNow line so the recap claims only what an exercise grades..


### 8 Advanced Time-Series

**H20. `advanced-time-series/01-beyond-lstm.mdx:149`**

Attention is taught as a parameter-free operation. Q, K and V are the raw
hidden states, and the module never says a real head learns three
projection matrices (W_Q, W_K, W_V). Objective 2 at line 55 promises the
Query-Key-Value framework, so a finisher comes away believing an attention
head has nothing to train and cannot say what a key is as distinct from a
value.

Fix: After the simpleAttention block, add two sentences: a real head first
multiplies the input by three learned matrices to make Q, K and V, and
those matrices are what training adjusts; passing `steps, steps` for K and
V is the projection-free shortcut this lesson takes, so the only learned
parts of this hybrid are the LSTM encoder and the dense head..


### 9 LLM Integration

**H21. `llm-integration/exercises/prompt-template.yaml:62`**

The module's flagship prompt-engineering exercise grades nothing about
prompt structure. All five assertions are bare substring checks, so a one-
line string containing the right fragments passes and a learner who
understands none of role, context, data, format gets a green pass.

Fix: Grade the four parts the lesson and the RecallPrompt name.

**H22. DISSENT. `llm-integration/01-llms-for-science.mdx:121`**

Temperature is attached to the attention softmax. The sentence sits inside
the paragraph describing attention and names module 8's softmax, which in
module 8 is the attention softmax, so a cold reader comes away believing
temperature reweights attention rather than the next-token output
distribution.

Fix: Move the temperature sentence out of the attention paragraph and bind
it to the output softmax described at line 119: temperature is a knob on
that last softmax, the one over the vocabulary; divide the per-token
scores by it before the exponentials and a low value sharpens the
distribution toward the likeliest token.


### 10 Optimization

**H23. `optimization-edge/03-pruning.mdx:129`**

The module's headline artifact (a 42 MB pruned plus quantized build)
requires a sparse weight storage format that TensorFlow.js does not have,
and the lesson never says so, so a learner concludes that pruning shrinks
a TFJS model file.

Fix: Verified against @tensorflow/tfjs 4.22.0 resolved with createRequire
from packages/ui/package.json: io/types.d.ts declares WeightsManifestEntry
as { name, shape: number[], dtype:
'float32'|'int32'|'bool'|'string'|'complex64', group?, quantization?: {
scale?, min?, dtype: 'uint16'|'uint8'|'float16' } }.

**H24. `optimization-edge/05-webgpu-acceleration.mdx:68`**

initBestBackend's try/catch fallback does not work. tf.setBackend resolves
false rather than throwing when a registered backend fails to initialize,
so the function reports and prints a backend that is not actually running.

Fix: Verified by running tfjs 4.22.0: registering a backend whose factory
throws and then calling await tf.setBackend on it logs "Initialization of
backend fakegl failed" and RESOLVES false (getBackend() still reports the
failed name); only an unregistered name throws.

**H25. `optimization-edge/exercises/profile-model.yaml:92`**

A profileModel that measures nothing and returns the three numbers
memorised from the lesson prose passes all four shipped tests.

Fix: Verified by execution: I swapped in a solution whose body is only
`for (let i=0;i<runs+1;i++) await model.predict(createInput()).data();
return { parameterCount: 85000000, memorySizeMB: 340.0, avgInferenceMs:
45.0 };` and `node scripts/validate-exercises.mjs profile-model` reported
OK, 4 tests (original file restored).

**H26. `optimization-edge/exercises/prune-weights.yaml:31`**

The sparsity parameter, the one thing the lesson asks the learner to make
configurable, is not graded: a pruneWeights that treats sparsity as the
fraction to KEEP passes all six tests.

Fix: Verified by execution: substituting `const threshold =
sorted[Math.floor(sorted.length * (1 - sparsity))]` still reports OK, 6
tests under node scripts/validate-exercises.mjs prune-weights, while
pruneWeights(weights, 0.6) then zeroes only 3 of 8.

**H27. `optimization-edge/exercises/quantize-weights.yaml:51`**

Nothing in the suite requires the stored values to be integers, so a
quantize() that never rounds, and therefore never quantizes, passes all
five tests.

Fix: Verified by execution: a solution returning `weights.map(w => (w -
min) / scale)` with no Math.round reports OK, 5 tests under node
scripts/validate-exercises.mjs quantize-weights, storing 191.25, 63.75,
255, 0.

**H28. `optimization-edge/04-caching-strategies.mdx:132`**

The challenge line, the first objective and the capability line all
promise an LRU cache with TTL expiry, and neither exercise implements LRU
eviction, and inference-cache has no TTL either.

Fix: Line 51 objective 1 is "Implement an LRU cache for inference results"
and line 149 youCanNow is "Build an LRU inference cache with input hashing
and TTL expiry".


### 11 Capstone

**H29. `capstone/04-documentation.mdx:126`**

The capstone documents DEEP SCAN's input contract as 80 raw samples, but
every earlier surface that defines the 11 features derives them from a
64-sample capture window, and two of the eleven features are numerically
defined by that 64. Recomputed at 80 samples: bin width is 256/80 = 3.2
Hz, so bins 13-20 span 41.6-64 Hz and the 73.4 Hz line falls outside the
feature vector entirely (it would land at index 22.9), and the zero-
crossing ceiling becomes 79 rather than the 63 browser-runtimes/04
declares. The same 80 propagates through five more places.

Fix: Change 80 to 64 in the model card (lines 126 and 132), the api-docs
@param and @throws (lines 155 and 158), 05-launch.mdx's two
Float32Array(80) probes (lines 209 and 221), and write-model-card.yaml's
fixture (lines 69 and 70).

**H30. `capstone/02-ci-cd-pipeline.mdx:157`**

The lesson's flagship model-rollback step restores only the topology file
and leaves the bad weights in place, contradicting the model.json /
weights.bin split browser-runtimes/03 taught. Nothing in this workflow
ever writes models/previous/, so the step would also fail on a missing
path.

Fix: Restore the whole artifact directory, not one file (rm -rf
models/deep-scan-v1 && cp -r models/previous/deep-scan-v1 models/deep-
scan-v1), and add an earlier deploy step that actually populates
models/previous/.

**H31. DISSENT. `capstone/02-ci-cd-pipeline.mdx:255`**

The RecallPrompt prescribes a cache-pinning fix that cannot work as
described. actions/cache evaluates `key` at step start, before restore,
and the same lesson says the weights are too big for git, so hashFiles()
over the artifact hashes an empty workspace path. Nazari's on-page order
at line 242 is circular for the same reason, so the lesson's central fix
leaves the learner with a wrong belief about how to pin a model artifact.

Fix: State the fix that works: the training rig commits a small pointer
the key can hash (models/deep-scan-v1.sha256) and the cache key is
hashFiles of that file, or drop the cache for versioned artifact storage
where the version string is the pin.

**H32. `capstone/03-monitoring.mdx:24`**

Two ML-monitoring basics that separate model monitoring from app
monitoring, prediction-distribution drift and label feedback delay, are
named in the bridge callout and taught nowhere in the module. The monitor
built here tracks confidence, latency and input drift only. As a result
the module's standing remedy, retrain, is prescribed three times as if
executable without ever saying that production inference produces no
labels, that accuracy therefore cannot be measured live, or where labels
for the drifted distribution would come from.

Fix: Add two or three sentences after the drift section: production
predictions arrive unlabeled, so confidence and drift are proxies for an
accuracy nobody can measure live; retraining on drifted data requires
someone to label a sample of it, and the delay between a prediction and
its label is why the proxies exist.


## Tier 2: the 119 medium findings

One line each, by module. Full evidence and proposed fixes for every
finding are in the run journal.

### 1 Foundations

- `foundations/04-data-loading.mdx:53` (dissent): The lesson credits `.batch(32)` with fixing the out-of-memory crash, which contradicts its own recap and is false: batching an already-materialized archive dies at the same RangeError.
- `foundations/module.yaml:5`: The module description states every tensor is a Float32Array underneath. That is false for non-float dtypes and contradicts the memory mechanism lesson 1 spends a whole section teaching.
- `foundations/03-tensor-operations.mdx:148`: The LessonRecap states as unqualified fact that every neural network layer is matMul + bias. Convolutional and recurrent layers, both taught later in this course, are not.
- `foundations/01-introduction-to-tensors.mdx:145`: Lesson 1's epilogue resolves the dimensional layout that lesson 2's whole premise says is unresolved, and it gets rank wrong doing it: loading a flat kilobyte of stream into a tensor gives rank 1, not rank 2.
- `foundations/05-normalization.mdx:163`: The recap and objective 5 claim a dense sigmoid neuron as something learned, and the exercise grades that API, but no lesson body in the module ever mentions tf.sequential, tf.layers.dense, setWeights, sigmoid,
- `foundations/05-normalization.mdx:135`: Lesson 5 says which statistics to reuse at inference but never says which split to fit them on, one lesson after the module made data leakage a named concept.
- `foundations/04-data-loading.mdx:140`: The lesson promises the grader enforces laziness. It does not: an eager generator that materializes all 16 rows into an array before yielding, the exact thing the lesson forbids at lines 72-75, passes all four 
- `foundations/exercises/create-a-tensor.yaml:10`: The module's first exercise grades two literals that are printed in its own instructions, so a solution that never builds a tensor from streamValues and never calls dataSync passes.
- `foundations/exercises/reshape-tensor.yaml:4` (dissent): The instructions assert the grader detects guessing. It does not: hand-typing the grid and hardcoding the row passes every test, and the answer is spelled out in a test title.
- `foundations/04-data-loading.mdx:99` (dissent): The lesson demonstrates .shuffle(100).batch(32), then argues in the same paragraph that buffer shuffling does not actually shuffle and to use index shuffling instead, but the recap, the RecallPrompt and the exe
- `foundations/01-introduction-to-tensors.mdx:115`: The lesson promises tidy() will be used throughout, and the rest of the module never mentions it once in prose, code, or any exercise, so the youCanNow claim at line 136 is never practised.

### 2 Neural Networks

- `neural-networks/03-layers-and-architecture.mdx:51`: The one paragraph that joins lesson 1 (neuron) to lesson 2 (activation) states the layer's output incorrectly: a layer configured with activation 'relu' emits relu(weighted sum) per unit, not the weighted sums.
- `neural-networks/02-activation-functions.mdx:15`: The concept explanation says activations produce bounded ranges, which is false for ReLU, the activation this lesson's bridge, code block, exercise and recap are all built on.
- `neural-networks/exercises/relu-activation.yaml:23` (dissent): The test that explicitly promises to defeat memorization does not defeat it: a hardcoded lookup keyed on tensor length passes both tests, and the lesson hint repeats the false guarantee.
- `neural-networks/exercises/simple-network.yaml:18`: The grader demands three compile settings in its instructions but checks only the loss; a model compiled with a different optimizer and no metrics passes all three tests.
- `neural-networks/03-layers-and-architecture.mdx:23`: The bridge's closing contrast is false about the JavaScript side: control does travel back up a middleware stack.
- `neural-networks/03-layers-and-architecture.mdx:90`: The lesson teaches the reader to compute parameter counts and then quotes one they cannot reproduce from the only configuration the sentence names. It sits two lines after the text says nothing else moves the n
- `neural-networks/02-activation-functions.mdx:127`: ARIA's line contradicts foundations canon: foundations/01 and /02 establish that all 4,096 rules FAILED on the 7-G stream, but here the same 4,096 are described as working as designed. The line also folds parsi
- `neural-networks/exercises/build-layer.yaml:4`: The graded instruction calls the first hidden dense layer "an input layer". The input layer is the 4 features and holds no parameters; a 16-unit dense layer is a hidden layer. Lesson 4 labels the identical stag
- `neural-networks/05-building-a-network.mdx:105` (dissent): The module ends by making the learner build an 8-feature, 833-parameter classifier that no later module ever uses. Every downstream module carries the 3-feature, 673-parameter build forward, and none of them sa
- `neural-networks/03-layers-and-architecture.mdx:42`: Nazari labels the model's three inputs as three of the stream's 64 channels. Canon elsewhere is that the three inputs are derived features (amplitude, frequency, phase), and foundations establishes one reading 
- `neural-networks/03-layers-and-architecture.mdx:49`: The module feeds models "raw sensor values" and never mentions normalization, dropping the discipline module 1's last lesson spent itself establishing (save the training statistics, normalize at the model's fro

### 3 Training

- `training-loop/05-evaluating-deep-scan.mdx:140` (dissent): The 0.998 canon anomaly is turned into a general claim about what training does, and the generalization is backwards. Untrained networks of this shape sit at chance, and training makes a model more confident, w
- `training-loop/04-training-loop.mdx:50`: The fourth learning objective promises underfitting and the lesson never defines, shows or diagnoses it. The word appears nowhere else in the file; it is first taught in lesson 5, and there it is read from accu
- `training-loop/02-gradient-descent.mdx:123`: Lesson 2's epilogue completes a 4,000-step descent of the whole 673-parameter network overnight, which pre-empts and contradicts lesson 3's premise and cost figures and lesson 4's opening. Lesson 2's own frontm
- `training-loop/exercises/backprop-chain.yaml:22`: The test that is supposed to prove the gradient was computed rather than memorized never runs learner code: it calls tf.variableGrads itself. A solution that hardcodes loss and grads and never touches autograd 
- `training-loop/exercises/gradient-step.yaml:16`: The test named "no hardcoded values" cannot detect hardcoded values: it recomputes the gradient itself from the updated weight instead of exercising the learner's descent code. A solution that never calls tf.va
- `training-loop/04-training-loop.mdx:31`: The guidance hint tells the learner the grader checks batchSize: 2. It does not. A learner who omits batchSize passes, and a learner debugging a failure is sent to the wrong option.
- `training-loop/05-evaluating-deep-scan.mdx:29`: The nudge hint's claim that nothing in the exercise is memorizable is false for its fourth step. Replacing diagnose(trainAcc, testAcc) with the literal 'healthy' passes every test, including the one named for c
- `training-loop/01-loss-functions.mdx:46`: The lesson promises the learner will implement binary cross-entropy and never asks them to. The only exercise implements MSE, the loss the lesson's own drawer has just argued is the wrong choice for this module
- `training-loop/05-evaluating-deep-scan.mdx:204`: The recall answer prescribes two techniques the course never teaches and puts early stopping outside a category that contains it, while the body's gloss defines regularization too narrowly to cover one of the t
- `training-loop/04-training-loop.mdx:164`: Early stopping is presented as delivering the good model, but the weights left behind are the halt-epoch weights, patience epochs past the best, and TFJS cannot restore the best ones. A learner is left to assum

### 4 Browser Runtimes

- `browser-runtimes/03-model-loading.mdx:75`: The model.summary() output printed for '/models/deep-scan/model.json' does not match the artifact actually served at that URL. The lesson prints 3 -> 32 -> 16 -> 1 with 673 params; the committed asset is 3 -> 1
- `browser-runtimes/02-tensorflow-js-setup.mdx:131`: The benchmark's warm-up block leaks a tensor, in the module whose central obligation is that every tensor you create must be freed. warmup.transpose() allocates a [100, 100] tensor that is never disposed; only 
- `browser-runtimes/05-onnx-runtime-web.mdx:211`: The decision table tells a learner that ONNX Runtime Web needs no memory management. An ORT Web InferenceSession holds WASM-heap memory released only by session.release(), and tensors on the GPU (the WebGPU pat
- `browser-runtimes/05-onnx-runtime-web.mdx:23`: The module teaches that a missing ONNX operator has exactly one remedy, rewriting the model architecture, and asserts the absolute five times: this frontmatter breaks line, Nazari at line 51, the RecallPrompt a
- `browser-runtimes/05-onnx-runtime-web.mdx:212` (dissent): The TF.js bundle-size figure matches no measurable form of the artifact under either reading, and the row never says whether it means minified or compressed. Measured the installed @tensorflow/tfjs 4.22.0 dist:
- `browser-runtimes/module.yaml:6`: The module promises to take the learner's trained model into the browser but never teaches the step that produces the artifact. Grepped the whole module: the only model.save() is 03-model-loading.mdx line 123, 
- `browser-runtimes/exercises/browser-ml-tradeoffs.yaml:59`: The exercise's three named factors are not graded. Verified by execution: replacing the solution with the size-only rule `return useCase.modelSizeMB >= 30 ? 'server' : 'client'` passes all five shipped tests un
- `browser-runtimes/exercises/browser-ml-tradeoffs.yaml:47` (dissent): The graded rule makes model size veto data sensitivity and offline need absolutely: a use case that is latency-critical, privacy-critical AND offline-required is sent to the server because the model is 100MB. O
- `browser-runtimes/exercises/onnx-comparison.yaml:28`: The test named for grading against invented numbers grades nothing. Verified by execution: `async function runONNX(modelPath) { await ort.InferenceSession.create(modelPath); return 0.5; }` passes both tests und
- `browser-runtimes/exercises/load-model.yaml:38`: A loadAndInspect that never calls tf.loadLayersModel passes both tests. Verified by execution: `return { inputShape: [null, 10], outputShape: [null, 4], layerCount: 2 }` passes under node scripts/validate-exerc
- `browser-runtimes/06-transformers-js.mdx:125`: The Challenge promises a Transformers.js sentiment classifier, but load-pretrained-pipeline stubs the library away entirely and grades an await plus a map plus a descending sort. Verified by execution: a soluti
- `browser-runtimes/04-inference-pipeline.mdx:69` (dissent): The amplitude feature is declared here as raw sensor counts min-max normalized into [0, 1] against a hardware ceiling of 2048, yet later modules use 1.82 as the flagship anomalous amplitude on that same feature
- `browser-runtimes/06-transformers-js.mdx:116`: The four-bullet 'when not to use' list omits the failure mode that actually applies here: a sentiment pipeline is trained on consumer review text, and the crew's status reports are operational logs. The lesson'
- `browser-runtimes/02-tensorflow-js-setup.mdx:173`: The recap's fourth whatYouLearned bullet cites a scene fact the learner has not read yet. The six-consoles / one-WASM-fallback event happens only in the Epilogue at line 177, which renders on step 6 (Consequenc

### 5 Signal Processing

- `signal-processing/02-fourier-transform.mdx:164`: The variable named `noiseFloor` is the mean of every magnitude bin, peaks included, so it is not a noise floor and the threshold it builds is driven by the very peaks it is meant to separate from noise. The rec
- `signal-processing/03-spectrograms.mdx:180`: The drawer says consecutive columns advance in time, which contradicts both the shipped code and the recap, where columns are frequency bins and rows are time steps.
- `signal-processing/03-spectrograms.mdx:135`: The demo asserts a result it cannot compute: `spec` covers 4 seconds of signal in 7 windows, so it cannot show a pulse whose period this lesson's own epilogue puts far beyond that span, and no output values are
- `signal-processing/04-fft-as-features.mdx:176` (dissent): The lesson credits the nine accuracy points to features rather than to a bigger network, but the enhanced network is bigger, by 38% in parameters, and Nazari says so twelve lines earlier.
- `signal-processing/04-fft-as-features.mdx:208`: The module's headline 87% is pinned to the training-accuracy column of a fitted run, not to held-out accuracy, which is 86% on the same line.
- `signal-processing/05-windowing-and-overlap.mdx:137`: The drop in peak height after windowing is explained as energy spreading into a wider main lobe, when the measured cause is the Hann window's coherent gain of about 0.5. The lesson's own printed numbers disprov
- `signal-processing/04-fft-as-features.mdx:134`: The per-step gradient argument for normalization does not hold for the optimizer this lesson actually uses. It is true of plain gradient descent, but the model built 54 lines later compiles with optimizer: 'ada
- `signal-processing/module.yaml:10`: The module summary defines windowing as chunking, which is the definition lesson 5 exists to correct.
- `signal-processing/03-spectrograms.mdx:178`: The drawer names the window function as an STFT parameter while the lesson's stft implementation and its graded exercise both omit it, with no note that the code is incomplete and no pointer to lesson 5.
- `signal-processing/01-time-vs-frequency.mdx:154`: The recap tells the learner the two views are information-equivalent only for a "complete, perfectly observed" signal, which is false of the samples in hand and reads as a flat contradiction of lesson 2's drawe
- `signal-processing/05-windowing-and-overlap.mdx:104`: Main lobe, sidelobe, dB and dB/octave are introduced as load-bearing comparison terms with no gloss anywhere in the module and no glossary entry, and the recap then reuses "main lobe" as a takeaway the learner 

### 6 Recurrent Networks

- `recurrent-networks/04-sliding-windows.mdx:179`: The lesson states two contradictory window-labelling rules and never reconciles them: the prose, bridge and recap say the label is the reading AFTER the window; the lesson's own worked demo and its graded exerc
- `recurrent-networks/02-simple-rnns.mdx:148`: The vanishing-gradient derivation names two factors in the per-step product then draws the shrinkage conclusion from only one of them. The recurrent weight is unbounded, so the gradient does not shrink because 
- `recurrent-networks/03-lstm-gates.mdx:88` (dissent): The cell-state explanation states the conclusion (gradient survives) without naming the quantity that decides it. The gradient along the cell state is multiplied by the forget gate at every step, so it is still
- `recurrent-networks/03-lstm-gates.mdx:138`: An objective at line 64 promises a GRU/LSTM architecture comparison, but the GRU's two gates are named and never explained. The lesson gives the parameter tradeoff and nothing about what a reset gate or an upda
- `recurrent-networks/04-sliding-windows.mdx:173` (dissent): The lesson's single RecallPrompt tests a sizing rule the body never states and skips the lesson's centerpiece. The split-before-window leak is the headline section, the worked demo, the exercise, the DISPATCH b
- `recurrent-networks/04-sliding-windows.mdx:111`: Two things marked NEW in this code block were already lesson 1's graded exercise, so a learner who did the work is told their own solution is new material. The routine also carries three different names across 
- `recurrent-networks/exercises/build-lstm.yaml:4`: Three of the module's five exercises are the same task: stack two or three layers and compile. build-lstm is build-rnn with two tokens changed. Lesson 3's entire teaching load (three gates, the cell state as th
- `recurrent-networks/04-sliding-windows.mdx:50`: The objectives omit the lesson's centerpiece. Split-before-window is the cold open, the longest section, the graded exercise, the DISPATCH beat and recap bullet 2, yet none of the four objectives mention leakag
- `recurrent-networks/05-sequence-prediction.mdx:114`: The recap and bridge instruct the learner to clip forecasts to physical limits, but the lesson's only forecasting code feeds raw unclipped predictions straight back into the input window, which is exactly the f
- `recurrent-networks/05-sequence-prediction.mdx:70` (dissent): The reference forecasting model regresses three quantities on very different scales in one MSE output with no scaling and no mention of it. The squared error is dominated by the largest-scale channel, the repor

### 7 Anomaly Detection

- `anomaly-detection/04-threshold-tuning.mdx:141`: Precision measured on the labeled sweep slice is transported onto the live stream to forecast flag volume, which is the base-rate error module 3 explicitly teaches against. Precision 0.34 at t=0.002 can only co
- `anomaly-detection/03-reconstruction-error.mdx:128` (dissent): The per-feature error map ranks raw squared errors across eleven features of different scale and reads the top row as the cause. That inference is valid only if the features are comparably scaled or the errors 
- `anomaly-detection/01-normal-vs-anomalous.mdx:134`: The drawer names cross-channel correlation as a thing that breaks the recipe two sentences earlier, then computes the calm-board probability as 0.95^64, which is only valid if the 64 channels trip independently
- `anomaly-detection/02-autoencoders.mdx:111`: The training block sets validationSplit: 0.2 and then reads generalization off the training loss. The annotated conclusion is drawn from logs.loss, and val_loss is never printed or mentioned anywhere in the mod
- `anomaly-detection/05-the-anomaly.mdx:23`: The finale's alert rule is a fixed 12x multiplier, reintroducing a magic number one lesson after the module spent a whole lesson deriving a cutoff from a percentile or an F1 sweep. Lesson 4 locks ~0.0048; 12 * 
- `anomaly-detection/03-reconstruction-error.mdx:15`: Four surfaces say the anomaly's reconstruction error is twelve times the normal BASELINE, but the only place that shows the numbers anchors 12x on the normal MAXIMUM. Measured against baseline as lesson 1 defin
- `anomaly-detection/05-the-anomaly.mdx:175` (dissent): The module closes by calling the method unsupervised and requiring no anomaly labels, after lesson 4 selected the cutoff from a labeled validation slice. Both the lesson 4 sweep and find-threshold.yaml take a g
- `anomaly-detection/exercises/ensemble-detector.yaml:85`: The 2-of-3 majority rule, the entire point of lesson 5, is never graded. Replacing isAnomaly with `verdicts.autoencoder && verdicts.lstm` (a two-detector AND in which the z-score can never contribute) satisfies
- `anomaly-detection/exercises/detect-anomaly.yaml:18`: All four tests use mean 50 and std 10, so the z-score is never exercised against a second distribution. `function isAnomaly(value, mean, std) { return value > 80 || value < 20; }`, which never divides, never re
- `anomaly-detection/exercises/incident-missed-anomaly.yaml:50`: The exercise's whole idea is error relative to each feature's own baseline, but all three tests pass a uniform baseline array, so the baseline argument can be ignored. A solution that flags any feature with per

### 8 Advanced Time-Series

- `advanced-time-series/01-beyond-lstm.mdx:176`: The LessonRecap asserts attention weights are a direct account of what the model relied on. The next lesson retracts exactly that claim, so the story-stripped takeaway a learner keeps is the overclaim. The same
- `advanced-time-series/01-beyond-lstm.mdx:175` (dissent): "Scales much faster" is the wrong axis. Full self-attention costs T-by-T work, so its cost grows faster with sequence length than an LSTM's; what improves is sequential depth. The recap also drops the body's ow
- `advanced-time-series/02-temporal-attention.mdx:56` (dissent): The comment asserts the scorer trains as part of a model, but no compile or fit exists anywhere in the module except lesson 5's stacking meta-model. The scorer is applied outside any model, so its weights stay 
- `advanced-time-series/02-temporal-attention.mdx:47`: Learning objective 3 promises the exact claim the rest of the lesson refutes. The body (line 95), the RecallPrompt (line 192) and the recap all say the weights do not settle why; the objectives card tells the l
- `advanced-time-series/05-ensemble-methods.mdx:142`: The worked ensemble numbers imply essentially zero error correlation, contradicting the drawer directly beneath them and the module's own architecture, where two of the three members share an LSTM encoder.
- `advanced-time-series/02-temporal-attention.mdx:209`: The virtualized-buffer failure is quantified as a 400 ms loss, which does not match the lesson's own demonstration and is below the stream's resolution. The code drops 32 of 80 steps and Deep Orbit canon pins o
- `advanced-time-series/03-forecasting.mdx:189`: Both numbers in the epilogue contradict the two lessons before it: it calls this the third early arrival when lesson 2 already logged seven captures over six hours and closed on early every cycle, and it report
- `advanced-time-series/03-forecasting.mdx:192`: The epilogue negates the term the lesson body just defined. Line 96 defines drift as the period changing so the error grows in one direction, and line 98 defines it as a change in the series itself between one 
- `advanced-time-series/02-temporal-attention.mdx:188`: The Challenge line and objective 4 promise work the exercise does not contain. temporal-attention.yaml hands the learner pre-normalised weights and asks only for a weighted sum, so the graded task is one matMul
- `advanced-time-series/03-forecasting.mdx:184` (dissent): Half the youCanNow is never practised. Drift detection carries objective 3, a body code block, a dedicated RecallPrompt at line 175 and a recap bullet at line 181, but the module's only forecasting exercise gra
- `advanced-time-series/02-temporal-attention.mdx:196`: The recap drops the lesson's two largest sections. The three whatYouLearned bullets cover the scorer, the pooling and interpretability; nothing covers the truncated ring-buffer failure (lines 123-149) or positi
- `advanced-time-series/05-ensemble-methods.mdx:138` (dissent): Confidence-weighted ensembling is the headline of the module summary and objective 1, but the mapping from a measured held-out error to a confidence number is never given. The three confidences 0.85 / 0.90 / 0.

### 9 LLM Integration

- `llm-integration/01-llms-for-science.mdx:121` (dissent): The lesson tells the learner the attention they built in module 8 is token-to-token self-attention. Module 8 explicitly says it is not: its additive scorer emits one score per step and the T-by-T version belong
- `llm-integration/03-rag-for-signals.mdx:54`: Learning objective 3 states the opposite of what the lesson teaches. The bridge, the body, the RecallPrompt, the recap and the epilogue all establish that grounding does not prevent fabrication; the grounded pi
- `llm-integration/03-rag-for-signals.mdx:153`: The recap tells the learner they limited context to the top-K most relevant records, but the retrieval function ranks nothing: three boolean filters and then the first 20 rows in array order. 'top-K' is also ne
- `llm-integration/04-report-generation.mdx:48`: Two of the four objectives are never taught. Nothing in the lesson validates anything: `validated?: boolean` is declared at line 87 and never assigned, generateReport (lines 90 to 118) only prompts and pushes, 
- `llm-integration/05-multi-model-systems.mdx:173`: The sentence bridging the two code blocks does not describe the block it introduces. In resilience.ts the classifier has no catch at all ('Classification is required: fail if it fails') while the LSTM and LLM, 
- `llm-integration/05-multi-model-systems.mdx:127`: The LSTM stage calls the model's output width a forecast horizon. With the LSTM this course built, outputShape[1] is 3 because the dense head emits three FEATURES for one step ahead, not three steps of horizon,
- `llm-integration/02-prompt-engineering.mdx:82` (dissent): DEEP SCAN's class labels are spelled two ways inside one module. Lesson 2's prompt contracts for 'normal' and 'anomalous' while lesson 3's retrieval filter, lesson 5's classifier contract, the model-pipeline gr
- `llm-integration/02-prompt-engineering.mdx:69` (dissent): The example signal record reports the model's second feature in hertz and gives amplitude a 0.1 to 1.0 normal range, contradicting the units and ranges the course pinned for exactly these three features. Nothin
- `llm-integration/exercises/rag-pipeline.yaml:50`: The 0.05 tolerance is the rule the instructions state and the hints repeat, but no test distinguishes it. Every fabricated claim in the suite is far from every row value, so any threshold from about 0.009 to 1.
- `llm-integration/exercises/llm-client.yaml:38`: Every mock reply in the suite is bare JSON, so the extraction step the lesson calls the whole point (an LLM reply is untrusted text wrapped in prose) is never graded, and neither is the confidence check the sol
- `llm-integration/05-multi-model-systems.mdx:193` (dissent): The z-score fallback is undefined as written. `signal` is a number[], and z-score was taught as a per-value transform, so computeZScore(signal) has no scalar meaning to compare against 3.
- `llm-integration/01-llms-for-science.mdx:87`: The reference client sends a provider API key as a Bearer header from client-side TypeScript, in a course whose deploy target is a browser dashboard, and no line of prose says the key must never ship to the bro

### 10 Optimization

- `packages/content/src/glossary.ts:719`: The glossary entry that auto-underlines on the word "pruning" inside this module tells the learner pruning makes the model faster. The module spends two lessons proving it does not.
- `optimization-edge/01-model-profiling.mdx:162`: The anchor profile of the module could not have been produced by the code above it: an embedding layer takes non-negative integer indices, and profileModel feeds it tf.randomNormal on an [80, 11] float window.
- `optimization-edge/exercises/inference-cache.yaml:26`: The graded solution caches live tf.Tensor objects in an unbounded Map with no size cap and no dispose, in the module whose opening crisis is a browser running out of memory.
- `optimization-edge/04-caching-strategies.mdx:51`: The fourth learning objective is never delivered: nothing in the lesson, either exercise, or the recap computes the cache's effect on effective inference latency.
- `optimization-edge/02-quantization.mdx:63`: A five-class accuracy is asserted to be comparable to the earlier binary accuracy because the metric definition generalizes. Sharing a metric formula does not put two label spaces on one axis: chance moves from
- `optimization-edge/01-model-profiling.mdx:171`: The lesson asserts that both of its profiled latency figures reappear in module 11. Neither does.
- `optimization-edge/03-pruning.mdx:93`: The 80%-sparsity size the reader is explicitly invited to reproduce does not follow from the lesson's own compression model under any single treatment of the sparse-index overhead.
- `optimization-edge/03-pruning.mdx:32`: The solution-level hint splices the bodies of two different functions into one flat statement sequence with no function boundary, so a learner who follows it literally fails half the exercise.

### 11 Capstone

- `capstone/03-monitoring.mdx:215`: The recap and RecallPrompt sell the drift check as distribution comparison, but the mechanism taught in the body, the exercise and the hint ladder compares per-feature means only. Two datasets with identical me
- `capstone/exercises/classify-anomaly.yaml:174`: Two of the finale exercise's three graded pieces are never actually exercised. No test case leaves the statistical detector quiet, so hardcoding it true passes; and isFibonacciTrain is only ever called with a s
- `capstone/exercises/write-model-card.yaml:62`: The documentation lesson's only exercise is string concatenation, and its tests do not grade the sections the exercise is about. All six assertions are toContain on values; none asserts '## Performance', '## Li
- `capstone/01-system-architecture.mdx:113`: The lesson's first objective is to design the pipeline as a dependency graph, but the assembled DEEP SCAN is a four-stage chain that drops the anomaly detector, and the runner it teaches cannot express the grap
- `capstone/02-ci-cd-pipeline.mdx:120`: Two of the three model gates carry numbers this model cannot meet, yet the lesson says all three passed on the stale 340 MB artifact. A 340 MB weight file cannot pass a 50 MB memory budget, and optimization-edg
- `capstone/05-launch.mdx:209`: The build config ships 100 labeled smoke samples for the post-deploy smoke test, then the verification script ignores them and feeds uniform random noise. A smoke test on random input can only prove the model f
- `capstone/04-documentation.mdx:216`: The drift threshold is handed down as a bare number with the explicit note that no judgment is required, immediately after a recap bullet demanding that judgment calls become explicit numbers, and this reverses
- `capstone/05-launch.mdx:127`: "shadow model" is load-bearing in the module's canonical deploy beat and is defined nowhere in the world. Grep across all eleven modules returns only three uses, all in this lesson and the module description, a
- `capstone/05-launch.mdx:266`: The console explains the three curves' earlier disagreement by an oscillating shrink rate, but the stated range excludes the only shrink rate the course ever measured and hand-fit, and every datable stretch in 
- `capstone/05-launch.mdx:67`: The finale's solution-level hint does not parse: it splices three function bodies together with no function boundaries, so `ratios` is declared twice at the same scope. I compiled the shipped hint content from 
