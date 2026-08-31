# Phrasing audit, 2026-08-31 (automated first pass)

> **STATUS: ALL 142 FINDINGS APPLIED, same day, on owner instruction.**
> The one-by-one review is now a review of the applied diffs; each
> checkbox below records a change that is live in the working tree.
> Also applied from the cross-cutting list: the Stripe checkout product
> description now maps slugs through `worldDisplayName`
> (`apps/api/src/lib/world-name.ts`, shared with the receipt email, with
> two new tests); the dashboard's lime left accent bar is removed (the
> active row keeps its background wash, bold title, and lime status
> box); and the capstone all-complete panel lost its roadmap tease
> ("V1.0 coming" is now "All worlds complete", with a test pinning the
> promise out). Test fallout updated alongside: one landing FAQ
> assertion, two legal-page snapshots, the capstone placeholder test,
> and the coming-soon stub test. Content rebuilt with velite; all unit
> suites green; visual baselines re-minted per the notes below.

Owner request: apply the editing model behind the M01 summary fix
("Tensors, shapes, and the operations that reshape them, starting from the
Float32Array you already use." became "Tensors, their shapes, and the
operations that change them, starting from the Float32Array you already
know.") to every user-visible line in the app, as an automated screen ahead
of a one-by-one manual review. Fifteen parallel auditors, one per Deep
Orbit module plus glossary/worlds metadata, marketing UI, product UI, and
emails/legal/API messages. NOTHING has been edited; every FIX below is a
candidate for the manual pass.

## The six categories (a finding must name one)

1. pronoun-ambiguity: "them / it / they / this" binding to the wrong noun
   on first parse, or with two live antecedents.
2. double-take: anything that forces a re-read: stem collisions
   (shapes/reshape), garden paths, terms of art used before they mean
   anything to the reader.
3. dangler: an "-ing" phrase whose implied subject is absent or wrong.
4. overclaim: a claim about the reader untrue for most working JavaScript
   engineers.
5. buried-hook: the concrete persuasive fact implied but never stated.
6. read-twice: 30+ words, stacked clauses, main point buried.

## Scope and protections

Scanned: 298 files. All 11 Deep Orbit modules (lesson bodies, dialogue,
hint ladders, takeaways, quiz text, exercise instructions, learner-visible
code comments, module.yaml fields), the glossary, worlds metadata, web UI
copy, emails, legal pages, and user-facing API messages. Excluded per
standing rulings: unlaunched worlds' lesson content (does not ship),
taglines, coming-soon story copy, the FAQ video tease. Dialogue register
was protected; dialogue findings (marked DIALOGUE) claim only genuine
ambiguity and stay subject to docs/story-style-bible.md.

Flagged: 142 findings. Confidence "high" means the auditor considers the
misread near-certain for a first-time reader; "medium" means a careful
editor could reasonably leave it.

## Review notes before editing

- Content edits require `npm run build:content` in packages/content
  (velite) before the app or any visual mint sees them; plain `build`
  there is tsc only.
- module.yaml `summary` fields render on the module map AND the pricing
  What's Inside list; editing one invalidates the world-deep-orbit and
  pricing visual baselines (four png files).
- faq-data.ts edits invalidate the LANDING baselines.
- Several findings sit in graded exercise text; where a FIX touches
  numbers or contracts, check the grader before rewording.

## Cross-cutting items verified by hand (not phrasing, but found in passing)

1. CONFIRMED, owner-directive violation: `dashboard-view.tsx:349-359`
   renders a 2px full-height LIME bar absolutely positioned at left 0 on
   the active module row, which is the banned left-accent-bar pattern on
   an active state (owner directive 2026-08-16). A sweep survivor.
2. CONFIRMED, owner ruling needed: `worlds/[slug]/capstone/page.tsx:650`
   world-complete state says "New V1.0 content is on the roadmap. Watch
   your inbox.", an unshipped-content promise outside the two ruled
   exceptions to the no-future-plans rule. It also says "every mission"
   where other surfaces use world terminology.
3. Checked and CORRECT as-is: "JavaScript developers" in
   `auth/layout.tsx` metadata and `course-jsonld.ts` audience fields is
   the query register the house vocabulary assigns to metadata and
   schema.org; no change.
4. Possible content-contract conflicts the auditors hit while reading
   (beyond phrasing, flagged for a separate look):
   - neural-networks lesson 3 body teaches a 32/16/1 stack at 673
     parameters while its hints and build-layer.yaml grade a 16/8/1 stack
     at 225, with no bridging sentence in the body.
   - browser-runtimes lesson 4 defines "confidence" as belonging to the
     verdict (its classify() inverts for noise) while
     exercises/inference-pipeline.yaml and its graded tests use
     "confidence" for the raw sigmoid, so copying the lesson's classify()
     fails the exercise.

Findings follow, grouped by surface, in course order then site order.
Tick a box when you have accepted, rewritten, or rejected the finding.

---
## foundations module (SCANNED: 11 files / FLAGGED: 8)

FILE: packages/content/content/deep-orbit/foundations/module.yaml
- [ ] L5: "Tensors, shapes, and the operations that reshape them are how a network sees that data, and underneath every one of them is a Float32Array with a shape attached."
  ISSUE: pronoun-ambiguity
  WHY: unfixed twin of the calibration example: first "them" binds to "shapes" (shapes/reshape collision), and "every one of them" sweeps in shapes and operations, which have no Float32Array underneath.
  FIX: "Tensors, their shapes, and the operations that change them are how a network sees that data, and underneath every tensor is a Float32Array with a shape attached."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx
- [ ] L139: "One more thing the archive files between lessons, starting now: DISPATCH intercepts, relay chatter from other crews working the same band on other missions."
  ISSUE: double-take
  WHY: "the archive files" first-parses as a noun phrase until "files" is re-read as the verb.
  FIX: "One more thing lands in the archive between lessons, starting now: DISPATCH intercepts, relay chatter from other crews working the same band on other missions."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx
- [ ] L22: "Reading shape is multi-dimensional; broadcasting rules depend on the full shape vector, not a single length."
  ISSUE: double-take
  WHY: "Reading" first-parses as this course's core data noun (a sensor reading's shape, also a coherent claim, so the misparse sticks), and "broadcasting" is never defined in the module.
  FIX: "A shape has one entry per axis; broadcasting rules depend on the full shape vector, not a single length."
  CONFIDENCE: medium
- [ ] L58: "Here's the question that actually trips people up: not what the new shape *is*, but which value ends up *where*. The answer: tensors fill **row by row** (row-major order)."
  ISSUE: double-take
  WHY: "the new shape" names a reshape not yet mentioned, and "tensors fill" lacks an object.
  FIX: "Here's the question that actually trips people up when you reshape: not what the new shape *is*, but which value ends up *where*. The answer: reshape fills the new shape **row by row** (row-major order)."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx
- [ ] L49: "You'll read the error, meet the two multiplication ops that line has confused, and repair the pipeline."
  ISSUE: double-take
  WHY: "ops that line has confused" garden-paths; "that" first reads as a relative pronoun.
  FIX: "You'll read the error, meet the two multiplication ops the broken line mixed up, and repair the pipeline."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/foundations/04-data-loading.mdx
- [ ] L151: "Just as a well-built infinite-scroll list renders only a visible window and fetches the next page on demand, a tf.data pipeline loads one batch at a time and pulls the next chunk only when the model is ready for it, the same backpressure a Node readable stream applies when the consumer sets the pace."
  ISSUE: read-twice
  WHY: 54 words stacking two analogies into one sentence.
  FIX: "Just as a well-built infinite-scroll list renders only a visible window and fetches the next page on demand, a tf.data pipeline loads one batch at a time and pulls the next chunk only when the model is ready for it. Node streams call that backpressure: the consumer sets the pace."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/foundations/05-normalization.mdx
- [ ] L91: "Feed both in raw and temperature's numbers land roughly forty times larger, so the louder feature dominates what the model learns while the quiet one barely registers, even if the quiet one carries the signal you actually care about."
  ISSUE: read-twice
  WHY: 40 words, four stacked clauses, strongest point buried at the end.
  FIX: "Feed both in raw and temperature's numbers land roughly forty times larger. The louder feature dominates what the model learns; the quiet one barely registers, even when it carries the signal you actually care about."
  CONFIDENCE: medium
- [ ] L160: "Unnormalized scales bias gradient updates toward whichever feature has the largest raw values."
  ISSUE: double-take
  WHY: "scales bias gradient updates" forces a re-parse to find that "bias" is the verb.
  FIX: "Unnormalized scales skew gradient updates toward whichever feature has the largest raw values."
  CONFIDENCE: medium

## neural-networks module (SCANNED: 11 files / FLAGGED: 6)

FILE: packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx
- [ ] L10: "At the lab bench, Farah sketches a single-node diagram while two clean reference tones and one jagged stranger glow on telemetry."
  ISSUE: double-take
  WHY: "one jagged stranger glow" garden-paths as an adjective-noun phrase (a stranger glow) before the reader recovers "glow" as the verb.
  FIX: "At the lab bench, Farah sketches a single-node diagram while telemetry glows with two clean reference tones and one jagged stranger."
  CONFIDENCE: medium
- [ ] L109: "Farah routes the neuron's output to a spare monitor above the galley coffee machine and feeds it the two calibration tones on a loop."
  ISSUE: pronoun-ambiguity
  WHY: "it" has two plausible antecedents (the monitor, nearest, and the neuron, intended), and the monitor reading paints a wrong picture of where the tones go.
  FIX: "Farah routes the neuron's output to a spare monitor above the galley coffee machine and feeds in the two calibration tones on a loop."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx
- [ ] L29: "Return the activated tensor; the grader runs it on two different tensors, so no hardcoded values."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to the nearest noun "the activated tensor" on first parse (the grader runs the tensor on tensors, nonsense) when the intended antecedent is your function.
  FIX: "Return the activated tensor; the grader runs your function on two different tensors, so no hardcoded values."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx
- [ ] L88: "Demir's first stack quoted 2,369 parameters, on a 64-unit stage he picked because it looked like a real number."
  ISSUE: double-take
  WHY: in a numeric ML lesson "real number" collides with the math term of art, and "it" briefly binds to "stage" rather than 64.
  FIX: "Demir's first stack quoted 2,369 parameters, on a 64-unit stage he picked because 64 looked like a serious number."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx
- [ ] L24: "The 'propagation' word matches; the data direction and combinator do not."
  ISSUE: double-take
  WHY: "combinator" is a term of art that means nothing here to most JavaScript engineers (they know CSS combinators), so the closing clause lands only on a re-read.
  FIX: "The 'propagation' word matches; the direction of flow and the way results combine do not."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx
- [ ] L103: "One difference from the bridge build above, and it is deliberate: the demo wired to the feed tonight reads the 3 raw channels (673 parameters), but Farah has specced a wider front door, 8 features per reading, which puts it at 833 parameters."
  ISSUE: double-take
  WHY: "(673 parameters)" attaches to "the 3 raw channels" on first parse, momentarily equating channels with parameters.
  FIX: "One difference from the bridge build above, and it is deliberate: the demo wired to the feed tonight reads the 3 raw channels and totals 673 parameters. Farah has specced a wider front door, 8 features per reading, which puts her build at 833 parameters."
  CONFIDENCE: medium


## training-loop module (SCANNED: 11 files / FLAGGED: 16)

FILE: packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx
- [ ] L82: "MSE squares the residuals so positive and negative errors don't cancel, AND so large errors are penalized more than small ones (a 0.4 error counts 4× more than a 0.2 error)."
  ISSUE: double-take
  WHY: "residuals" is a term of art the lesson never introduces, and the sentence switches to "errors" for the same thing four words later.
  FIX: "MSE squares each error so positive and negative errors don't cancel, AND so large errors are penalized more than small ones (a 0.4 error counts 4× more than a 0.2 error)."
  CONFIDENCE: medium
- [ ] L125: "Demir asks why the number is so round. It isn't round, she tells him: it's ln(2) to four places, the exact cross-entropy of a coin flip, the score of a network that knows nothing at all."
  ISSUE: double-take
  WHY: 0.6931 is not a round number, so both the question and the denial stall the reader before the ln(2) payoff.
  FIX: "Demir asks whether the number means anything or is just where the random seed dropped them. It's ln(2) to four places, she tells him: the exact cross-entropy of a coin flip, the score of a network that knows nothing at all."
  CONFIDENCE: medium
- [ ] L128: DIALOGUE "We don't get to claim the network learned anything until it moves."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to "the network" on the nearest-noun parse; intended antecedent is "that number".
  FIX: "We don't get to claim the network learned anything until that number moves."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx
- [ ] L23: "Descent isn't a style choice; it's the only information you have."
  ISSUE: double-take
  WHY: descent is a procedure, not information (the slope is the information).
  FIX: "Descent isn't a style choice; it's the only move you have."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx
- [ ] L68: "On the engineering rig that's 27 seconds per step; a run the backward pass finishes in minutes stretches past thirty hours."
  ISSUE: double-take
  WHY: the reduced relative clause stacks "finishes" directly against "stretches".
  FIX: "On the engineering rig that's 27 seconds per step; a run that takes minutes with the backward pass stretches past thirty hours."
  CONFIDENCE: high
- [ ] L76: "The forward pass runs input to output computing the loss, then the backward pass returns output to input, each layer folding what it receives into the gradient it hands to the layer below."
  ISSUE: double-take
  WHY: "returns output to input" first parses as handing the output back to the input.
  FIX: "...then the backward pass runs output back to input, each layer folding what it receives into the gradient it hands to the layer below."
  CONFIDENCE: high
- [ ] L113: "Run the marquee algorithm yourself: one call to `tf.variableGrads()`, and prove the gradient tracks the variable instead of memorizing an answer."
  ISSUE: dangler
  WHY: "memorizing" has no workable subject; on first parse the gradient is doing the memorizing.
  FIX: "Run the marquee algorithm yourself: one call to `tf.variableGrads()`, and prove the gradient tracks the variable, not a memorized answer."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/training-loop/04-training-loop.mdx
- [ ] L26: "Trained longer stopped meaning trained better."
  ISSUE: double-take
  WHY: without quotation marks, "Trained longer stopped" parses as subject and verb.
  FIX: "\"Trained longer\" stopped meaning \"trained better.\""
  CONFIDENCE: medium
- [ ] L54: "Nothing hands it its last iteration."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to "a drain loop", the nearest noun; intended antecedent is training.
  FIX: "Nothing hands training its last iteration."
  CONFIDENCE: high
- [ ] L135: "It had stopped learning the pattern and started memorizing the dataset."
  ISSUE: pronoun-ambiguity
  WHY: "It" follows "the four-minute version", the nearest noun and the wrong model.
  FIX: "The 500-epoch model had stopped learning the pattern and started memorizing the dataset."
  CONFIDENCE: high
- [ ] L238: "Somewhere in that archive, he thinks, is at least one reading the network now knows something about that nobody on board does."
  ISSUE: double-take
  WHY: "about that nobody on board" briefly parses as a noun phrase; stacked relative clauses force a re-read.
  FIX: "Somewhere in that archive, he thinks, is at least one reading the network understands and nobody on board does."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx
- [ ] L24: "Model evaluation reports continuous metrics (accuracy, precision, recall) over a held-out set, and good aggregate metrics routinely hide failure modes on production-distribution subgroups."
  ISSUE: double-take
  WHY: "production-distribution subgroups" is a compressed coinage; the next sentence already explains slicing plainly.
  FIX: "...and good aggregate metrics routinely hide failure modes in subgroups of your production data."
  CONFIDENCE: medium
- [ ] L112: "The loss moves run to run; the story the gap tells must not."
  ISSUE: double-take
  WHY: "the gap" has no antecedent in this code comment; surrounding lines discuss accuracy spread.
  FIX: "The loss moves run to run; the story the numbers tell must not."
  CONFIDENCE: medium
- [ ] L181: "Zero observed false positives bounds the FPR loosely; it does not make it zero."
  ISSUE: pronoun-ambiguity
  WHY: the two "it"s in one clause take different referents.
  FIX: "Zero observed false positives bounds the FPR loosely; it does not make the FPR zero."
  CONFIDENCE: medium
- [ ] L206: "When both are high, you have ruled out those two failures and nothing else: an aggregate number cannot see the slice it is failing on, which is why sliced evaluation comes before deployment rather than after it."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to "an aggregate number"; the intended subject, the model, is a clause away.
  FIX: "...an aggregate number cannot see the slice the model is failing on, which is why sliced evaluation comes before deployment rather than after it."
  CONFIDENCE: high
- [ ] L215: "She traces the reading back through the archive index already half-certain of what she will find, and the index confirms it: sample 7741."
  ISSUE: double-take
  WHY: without the comma, "already half-certain" attaches to "the archive index".
  FIX: "She traces the reading back through the archive index, already half-certain of what she will find, and the index confirms it: sample 7741."
  CONFIDENCE: medium

## browser-runtimes module (SCANNED: 14 files / FLAGGED: 10)

FILE: packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx
- [ ] L51: "This module goes to the browser because that is where DEEP SCAN has to land: the bridge dashboard, on the consoles the watch already reads."
  ISSUE: double-take
  WHY: "the watch" reads as a timepiece on first parse; the nautical sense is not established until 45 lines later.
  FIX: "This module goes to the browser because that is where DEEP SCAN has to land: the bridge dashboard, on the consoles the crew already reads."
  CONFIDENCE: medium
- [ ] L92: "~50MB budget for this dashboard's cold load (lesson 6's commodity runtimes ship 50-500MB when the download IS the product)"
  ISSUE: double-take
  WHY: "commodity runtimes" is a term lesson 6 has not yet defined.
  FIX: "~50MB budget for this dashboard's cold load (lesson 6 ships 50-500MB models when the download itself is the product)"
  CONFIDENCE: medium
- [ ] L122: "await output.data();  // GPU kernels are queued; read one back or you time the queue"
  ISSUE: pronoun-ambiguity
  WHY: "one" binds to "kernels", but you read a result back, not a kernel (lesson 2's version says "read a result back").
  FIX: "await output.data();  // GPU kernels are queued; read a result back or you time the queue"
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx
- [ ] L31: hint calling the raw sigmoid "confidence" right after the lesson's callout teaches the raw sigmoid is NOT the confidence
  ISSUE: double-take
  WHY: a learner who absorbed the callout must re-read to work out which meaning the grader wants.
  FIX: "...return class 'anomaly' when that number exceeds 0.5, else 'noise', with the same number as the confidence."
  CONFIDENCE: medium
- [ ] L210: "The patched pipeline clears a full hour after the 03:10 page: `numTensors` flat, latency holding at 3.4 ms."
  ISSUE: double-take
  WHY: "clears a full hour" garden-paths; ambiguous between "clean one hour later" and "runs clean for an hour".
  FIX: "For a full hour after the 03:10 page the patched pipeline runs clean: `numTensors` flat, latency holding at 3.4 ms."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx
- [ ] L185: "Lin's retraction memo was benchmarked correctly. Nobody reads retraction memos."
  ISSUE: double-take
  WHY: a memo cannot be benchmarked; compressed zeugma forces a re-read.
  FIX: "Lin's retraction memo had the numbers right. Nobody reads retraction memos."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx
- [ ] L125: "Build a sentiment classifier for field reports using Transformers.js."
  ISSUE: double-take
  WHY: the lesson twice calls the inputs "crew status reports"; "field reports" reads as a different artifact.
  FIX: "Build a sentiment classifier for the crew's status reports using Transformers.js."
  CONFIDENCE: medium
- [ ] L135: "The feedback classifier runs in twelve lines, and Demir spends a full minute being quietly insulted by that."
  ISSUE: double-take
  WHY: nothing in the lesson is called a "feedback classifier".
  FIX: "The sentiment classifier runs in twelve lines, and Demir spends a full minute being quietly insulted by that."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/browser-runtimes/exercises/browser-ml-tradeoffs.yaml
- [ ] L4: "Complete the function that evaluates whether a given ML use case should use client-side (browser) or server-side inference."
  ISSUE: double-take
  WHY: "use case should use" stem collision.
  FIX: "Complete the function that decides whether a given ML use case should run inference in the browser or on the server."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/browser-runtimes/exercises/inference-pipeline.yaml
- [ ] L4: "Return the classification ('anomaly' if confidence > 0.5, else 'noise') along with the confidence value."
  ISSUE: double-take
  WHY: lesson 4's callout defines confidence as belonging to the verdict, and the lesson's classify() inverts accordingly, yet this spec and its graded tests use "confidence" for the raw sigmoid: a learner who copies the lesson's classify() fails the tests.
  FIX: "Return the classification ('anomaly' if the model's output exceeds 0.5, else 'noise') along with that raw output as the confidence value."
  CONFIDENCE: medium


## signal-processing module (SCANNED: 11 files / FLAGGED: 5)

FILE: packages/content/content/deep-orbit/signal-processing/module.yaml
- [ ] L10: "Turn raw time-series data into features the Fourier Transform, spectrograms, and windowing can expose."
  ISSUE: double-take
  WHY: missing "that" makes "features the Fourier Transform" read as a noun pile on first parse, and the agency is inverted: the tools do the turning.
  FIX: "Use the Fourier Transform, spectrograms, and windowing to turn raw time-series data into features."
  CONFIDENCE: high
  NOTE: this summary renders on the module map AND the pricing What's Inside list (visual baselines affected if changed).

FILE: packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx
- [ ] L50: "Read enough of them and a DevTools waterfall starts looking like a spectrogram of a page load."
  ISSUE: pronoun-ambiguity
  WHY: "them" binds to the nearest plural, the empty-reading cells from the previous sentence, not spectrograms.
  FIX: "Read enough spectrograms and a DevTools waterfall starts looking like a spectrogram of a page load."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx
- [ ] L115: "FFT magnitudes can be orders of magnitude larger than raw signal values."
  ISSUE: double-take
  WHY: "magnitudes ... orders of magnitude" collides the technical sense with the idiomatic one (same stem-collision as shapes/reshape).
  FIX: "FFT magnitudes can be far larger than raw signal values."
  CONFIDENCE: medium
- [ ] L229: "Most of them fall within a minute of a 73.4-second pulse, and the pulses they crowd around are not scattered either: laid on a timeline, the re-entries bunch on a rough 47-minute macro-cycle."
  ISSUE: double-take
  WHY: "re-entries" is used nowhere else in the module; reader cannot tell if it means the pulses or the unplaced readings.
  FIX: "Most of them fall within a minute of a 73.4-second pulse, and the pulses they crowd around are not scattered either: laid on a timeline, those pulses bunch on a rough 47-minute macro-cycle."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/signal-processing/exercises/apply-window.yaml
- [ ] L3: "Vectorized Hann Window with tf"
  ISSUE: double-take
  WHY: title mandates a vectorized tf solution, then the instructions say "Plain JS ... or tensors, your choice"; the reader re-reads to learn which requirement is real.
  FIX: "Build and Apply a Hann Window"
  CONFIDENCE: medium

## recurrent-networks module (SCANNED: 11 files / FLAGGED: 6)

FILE: packages/content/content/deep-orbit/recurrent-networks/module.yaml
- [ ] L12: "Recurrent networks that carry state across time: RNNs, LSTMs, and GRUs, mapped onto the reducers and cache expiry you already write."
  ISSUE: double-take
  WHY: "you already write" distributes over both nouns, and "write cache expiry" is not something anyone says.
  FIX: "Recurrent networks that carry state across time: RNNs, LSTMs, and GRUs, mapped onto the reducer and cache-expiry code you already write."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx
- [ ] L154: "A stream preserves chunk order because reassembling the bytes out of order corrupts the file; a sequence model goes one step further and reads the order as meaning, so the same values in a different arrangement are a different signal, and `model.predict` on `[timeSteps, features]` tensors depends on it."
  ISSUE: read-twice
  WHY: 46 words, four stacked clauses; closing "depends on it" points at an antecedent twenty words back.
  FIX: "A stream preserves chunk order because reassembling the bytes out of order corrupts the file; a sequence model goes one step further and reads the order as meaning, so the same values in a different arrangement are a different signal to `model.predict`."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx
- [ ] L59: "And there is no clock in it anywhere."
  ISSUE: DIALOGUE pronoun-ambiguity
  WHY: nearest noun is "the simple RNN" from Farah's previous sentence, so "it" binds to the wrong network; she means the LSTM.
  FIX: "And there is no clock in an LSTM anywhere."
  CONFIDENCE: high
- [ ] L176: "GRUs use two gates instead of three (roughly 25% fewer parameters) and often match LSTM accuracy: training both and comparing is a standard first step."
  ISSUE: double-take
  WHY: two-vs-three implies a one-third cut; the 25% figure (three weight sets versus four) stops a numerate reader.
  FIX: "GRUs use two gates instead of three, dropping one of the LSTM's four weight sets (roughly 25% fewer parameters), and often match LSTM accuracy: training both and comparing is a standard first step."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx
- [ ] L184: "Framing a byte stream consumes each byte into exactly one fixed-size chunk; a sliding window advances by a stride smaller than the window, so each reading turns up in many samples and the pipeline emits sequence length divided by stride windows rather than one chunk per reading."
  ISSUE: double-take
  WHY: "emits sequence length divided by stride windows" garden-paths into "stride windows".
  FIX: "Framing a byte stream consumes each byte into exactly one fixed-size chunk; a sliding window advances by a stride smaller than the window, so each reading turns up in many samples and the pipeline emits far more windows than a framer would emit chunks."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx
- [ ] L144: "Autocomplete picks from a finite pre-indexed list you control; sequence forecasting generates novel continuations from a learned distribution, so predictions are unbounded and confidence drops sharply with horizon, requiring domain-level output clipping."
  ISSUE: dangler
  WHY: "requiring domain-level output clipping" hangs off "confidence drops"; the implied subject (you) is absent.
  FIX: "Autocomplete picks from a finite pre-indexed list you control; sequence forecasting generates novel continuations from a learned distribution, so predictions are unbounded and confidence drops sharply with horizon. Clip the outputs to physical limits yourself."
  CONFIDENCE: high

## anomaly-detection module (SCANNED: 14 files / FLAGGED: 8)

FILE: packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx
- [ ] L59: "The filter halts on Sample 7741, which has no label to remove it."
  ISSUE: double-take
  WHY: "no label to remove it" makes the reader stop to work out whether "it" is the label or the sample, and how a label would do any removing.
  FIX: "The filter halts on Sample 7741, which has no event label, so nothing removes it."
  CONFIDENCE: medium
- [ ] L134: "Across 64 channels, a fully dark board then has probability 0.95⁶⁴ ≈ 0.0375: some channels lit is the calm state."
  ISSUE: double-take
  WHY: "some channels lit" first parses with "lit" as a past-tense verb, then "is" forces a reparse.
  FIX: "Across 64 channels, a fully dark board then has probability 0.95⁶⁴ ≈ 0.0375: the calm state has a few channels lit."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx
- [ ] L55: "Hold Farah's question while you build it; the score will turn out to answer everything except what she asked."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds first to "Farah's question" (you cannot build a question); the intended "the error score" sits two clauses back.
  FIX: "Hold Farah's question while you build the score; it will turn out to answer everything except what she asked."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx
- [ ] L51: "An error tracker that fires on every minor exception teaches the team to ignore it; Nazari just described the bridge-crew version."
  ISSUE: pronoun-ambiguity
  WHY: "it" has two plausible antecedents (tracker, exception) and the readings differ in what the team learns to ignore, which is the lesson's point.
  FIX: "An error tracker that fires on every minor exception teaches the team to ignore the tracker; Nazari just described the bridge-crew version."
  CONFIDENCE: high
- [ ] L51: "The threshold must balance sensitivity against specificity."
  ISSUE: double-take
  WHY: terms of art never defined in the module, which teaches precision and recall instead; the pair never gets mapped.
  FIX: "The threshold must balance missed anomalies against false alarms."
  CONFIDENCE: high
- [ ] L142: "Before anyone silences anything, run the triage: sensor change, threshold drift, stale model, and if it fits none of those signatures, it goes to a human, loud."
  ISSUE: pronoun-ambiguity
  WHY: neither "it" has an antecedent in the sentence; the intended referent (the alert storm) is two sentences back.
  FIX: "Before anyone silences anything, run the triage: sensor change, threshold drift, stale model. If the storm fits none of those signatures, it goes to a human, loud."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx
- [ ] L96: "A max over the whole 11-dim vector would mix the FFT magnitudes' scale into an \"amplitude\" it isn't."
  ISSUE: double-take
  WHY: tangled construction in a learner-visible code comment; two passes to unpack what "it" is and what isn't an amplitude.
  FIX: "A max over the whole 11-dim vector would fold in the FFT bins' scale and stop measuring amplitude."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/anomaly-detection/exercises/ensemble-detector.yaml
- [ ] L4: "Given a window of recent amplitudes plus the other two detectors' raw outputs, compute each verdict yourself"
  ISSUE: double-take
  WHY: "the other two" arrives before any first detector has been singled out.
  FIX: "Given a window of recent amplitudes for the statistical check, plus the autoencoder's and the LSTM's raw outputs, compute each verdict yourself"
  CONFIDENCE: medium

## advanced-time-series module (SCANNED: 11 files / FLAGGED: 13)

FILE: packages/content/content/deep-orbit/advanced-time-series/module.yaml
- [ ] L7: "Attention, multi-step forecasts, Kalman filters, and confidence-weighted ensembles are what the crew builds to chase that miss, and what finally shows the interval is shrinking."
  ISSUE: double-take
  WHY: "shows the interval" parses as a complete verb phrase until "is shrinking" forces a reparse.
  FIX: append "that": "...and what finally shows that the interval is shrinking."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx
- [ ] L53: "Hold that picture against the mechanism's own arithmetic below, three numbers wide, and see how much of it survives."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to "arithmetic"; the thing tested for survival is the picture.
  FIX: "...and see how much of the picture survives."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/advanced-time-series/02-temporal-attention.mdx
- [ ] L166: "Build a temporal attention layer, extract its weights, and identify the time steps a model focused on to explain its prediction."
  ISSUE: double-take
  WHY: "to explain" attaches ambiguously and restates the exact claim the lesson's recap just disowned (weights map where, not why).
  FIX: "Build a temporal attention layer, extract its weights, and identify the time steps a model relied on for a prediction."
  CONFIDENCE: medium
- [ ] L171: "He sets the capture buffer to record around each predicted re-entry, the 47-minute clock, and discards the rest."
  ISSUE: double-take
  WHY: appositive reads as a second object of "record around".
  FIX: "He sets the capture buffer to record around each predicted re-entry (the 47-minute clock) and discards the rest."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx
- [ ] L14: "...the smoothing trick every JavaScript engineer owns..."
  ISSUE: overclaim
  WHY: many JavaScript engineers have never knowingly written an EMA.
  FIX: "...a smoothing trick most JavaScript engineers know..."
  CONFIDENCE: medium
- [ ] L44: "Before this lesson names its subject, try to track that drift with a tool you already own."
  ISSUE: overclaim
  WHY: same claim; "own" asserts working possession of EMA.
  FIX: "...with a tool you already know."
  CONFIDENCE: medium
- [ ] L46: "Demir's first move is the one every JavaScript engineer makes when a value jitters..."
  ISSUE: overclaim
  WHY: untrue for the many who reach for debounce or throttle; claim repeats three times in this file.
  FIX: "Demir's first move is the usual one when a value jitters..."
  CONFIDENCE: medium
- [ ] L151: "One honesty note the bridge has earned..."
  ISSUE: double-take
  WHY: on a starship, "the bridge" first parses as the ship's bridge, not the EMA-to-Kalman analogy.
  FIX: "One honesty note the EMA bridge has earned..."
  CONFIDENCE: medium
- [ ] L151: "What the adaptive gain buys is the burn-in and principled noise handling; it buys no immunity to trends."
  ISSUE: double-take
  WHY: "buys the burn-in" names a time period rather than the benefit.
  FIX: "What the adaptive gain buys is a clean burn-in and principled noise handling; it buys no immunity to trends."
  CONFIDENCE: medium
- [ ] L165: "The gain is computed dynamically from the current estimate variance and measurement noise, making it the optimal linear blend at every step."
  ISSUE: pronoun-ambiguity
  WHY: "it" points at "the gain", but the gain is a weight, not a blend.
  FIX: "The gain is computed dynamically from the current estimate variance and measurement noise, so each update is the optimal linear blend of prediction and measurement."
  CONFIDENCE: high
- [ ] L168: "Like a smoothed = `alpha * newValue + (1 - alpha) * smoothed` exponential moving average..."
  ISSUE: double-take
  WHY: the article lands on the code fragment instead of the noun it modifies.
  FIX: "Like the exponential moving average `smoothed = alpha * newValue + (1 - alpha) * smoothed`, a Kalman update blends `gain * measurement + (1 - gain) * prediction`, but computes `gain` dynamically from current uncertainty rather than holding it fixed."
  CONFIDENCE: high
- [ ] L169: "Implement a 1D Kalman filter that tracks a drifting signal value under noise and report the smoothed estimate at each step."
  ISSUE: double-take
  WHY: "report" first tries to coordinate with "tracks" and fails on number agreement.
  FIX: "...that tracks a drifting signal value under noise and reports the smoothed estimate at each step."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx
- [ ] L50: "Three models hand back the same answer three times, and the only thing that makes the third one worth paying for is that it is wrong in places the other two are right."
  ISSUE: double-take
  WHY: "the same answer three times" is contradicted by the clause that follows.
  FIX: "Three models hand back three answers to the same question, and the only thing that makes the third one worth paying for is that it is wrong in places the other two are right."
  CONFIDENCE: medium

## llm-integration module (SCANNED: 12 files / FLAGGED: 8)

FILE: packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx
- [ ] L42: "The ensemble Farah left extrapolating runs every night of it, the interval log shortens by seconds while nobody sleeps enough, and a long-baseline triangulation job she queued against the relay network grinds through its first pass, still refusing to commit to a bearing."
  ISSUE: read-twice
  WHY: 44 words, three stacked clauses, a reduced-relative garden path, and "the interval log shortens" says the log shrinks when the interval does.
  FIX: "The ensemble Farah left running extrapolates every night of those weeks. The logged pulse interval shortens by seconds while nobody sleeps enough. The long-baseline triangulation job she queued against the relay network grinds through its first pass, still refusing to commit to a bearing."
  CONFIDENCE: high
- [ ] L194: "It generates language without rules."
  ISSUE: DIALOGUE pronoun-ambiguity
  WHY: previous sentence's "it" is the fabricated claim, so this "It" binds to the claim before the reader recovers the unnamed model.
  FIX: "The model generates language without rules."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx
- [ ] L25: "Prompts steer a probabilistic generator and tiny wording changes can change output drastically (prompt sensitivity)."
  ISSUE: double-take
  WHY: stem collision "changes can change", the exact calibration pattern.
  FIX: "Prompts steer a probabilistic generator, and tiny wording changes can swing the output drastically (prompt sensitivity)."
  CONFIDENCE: medium
- [ ] L156: "Farah's commit message does the explaining for her: the model has read more physics than anyone aboard and still had no idea what normal looks like in Sector 7-G, because nothing out here does."
  ISSUE: double-take
  WHY: the elided verb in "nothing out here does" must be rebuilt as "looks normal", forcing a re-read.
  FIX: "Farah's commit message does the explaining for her: the model has read more physics than anyone aboard and still had no idea what normal looks like in Sector 7-G, because nothing out here is normal."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx
- [ ] L16: "Farah builds a RAG pipeline: retrieving relevant signal data from the database and injecting it into the prompt."
  ISSUE: pronoun-ambiguity
  WHY: "it" sits nearest to "the database"; "injecting the database into the prompt" is the beginner misreading RAG exists to prevent.
  FIX: "Farah builds a RAG pipeline: retrieving relevant signal rows from the database and injecting them into the prompt."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx
- [ ] L24: "Generated reports invent facts, omit caveats, and round-trip uncertainty into confident prose."
  ISSUE: double-take
  WHY: "round-trip X into Y" means convert and convert back; the verb fights the intended one-way meaning.
  FIX: "Generated reports invent facts, omit caveats, and flatten uncertainty into confident prose."
  CONFIDENCE: medium
- [ ] L158: "Somewhere in the cut section one hypothesis might even be right; the next two relay windows will come and go before anyone could tell them which."
  ISSUE: pronoun-ambiguity
  WHY: "them" has no available antecedent; nearest plural is "relay windows".
  FIX: "Somewhere in the cut section one hypothesis might even be right; the next two relay windows will come and go before anyone could find out which."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/llm-integration/exercises/rag-pipeline.yaml
- [ ] L4: "Demir's checker from the epilogue, for real: verifyClaims(answerText, retrievedRows) extracts every number from the generated answer and checks it against the retrieved data."
  ISSUE: double-take
  WHY: the Challenge step precedes the epilogue, so "the epilogue" points at a scene the learner has not read yet.
  FIX: "Demir's checker, for real: verifyClaims(answerText, retrievedRows) extracts every number from the generated answer and checks it against the retrieved data."
  CONFIDENCE: medium

## optimization-edge module (SCANNED: 12 files / FLAGGED: 12)

FILE: packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx
- [ ] L15: "Two nights after the report went out, the 0247 pulse window came, and at 0249 the 340 MB model killed the bridge dashboard under it."
  ISSUE: pronoun-ambiguity
  WHY: "under it" binds nearest to "the bridge dashboard" (impossible), then leaves two live antecedents.
  FIX: "Two nights after the report went out, the 0247 pulse window came, and at 0249, mid-window, the 340 MB model killed the bridge dashboard."
  CONFIDENCE: high
- [ ] L180: "Just as `performance.mark`/`performance.measure` locates slow code in a JS app, `tf.memory()` and `performance.now()` around `model.predict()` locates the memory and latency cost in an ML model."
  ISSUE: double-take
  WHY: "A and B" subject followed by singular "locates" forces a re-read.
  FIX: same sentence with "locate"
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx
- [ ] L46: "Quantize the whole bundle, and the scoreboard reports what the knife cost where cost can be measured."
  ISSUE: double-take
  WHY: "cost" as verb then noun five words apart; the bare "where cost can be measured" clause needs a second pass.
  FIX: "Quantize the whole bundle, and the scoreboard reports what the knife took in the one place the loss can be measured."
  CONFIDENCE: medium
- [ ] L160: "After the others leave, Farah runs the class-by-class breakdown she asked for, reads it through, and doesn't post the result; she flags it for the pruning review instead."
  ISSUE: pronoun-ambiguity
  WHY: "she asked for" binds first to Farah; the asker on record is Nazari (L51).
  FIX: "After the others leave, Farah runs the class-by-class breakdown Nazari asked for, reads it through, and doesn't post the result; she flags it for the pruning review instead."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx
- [ ] L23: "An inference cache wants the opposite: near-identical inputs have to collide on purpose, so the key is a rounded hash and how hard you round is a tuning knob that trades hit rate against serving a close-but-stale verdict."
  ISSUE: double-take
  WHY: "a rounded hash and how hard you round" first parses as one compound object; "stale" names the TTL failure, not the rounding one.
  FIX: "An inference cache wants the opposite: near-identical inputs have to collide on purpose, so the key is a rounded hash, and how hard you round is a tuning knob that trades hit rate against serving a close-but-wrong verdict."
  CONFIDENCE: medium
- [ ] L146: "Quantizing inputs before hashing groups near-identical inputs under the same key, raising hit rate by trading away exactness: everything inside one quantization bucket is served the same stored verdict, so bucket width is a precision decision, not a free win."
  ISSUE: double-take
  WHY: "before hashing groups" garden-paths as the noun phrase "hashing groups".
  FIX: "Quantizing inputs before hashing means near-identical inputs land on the same key, raising hit rate by trading away exactness: everything inside one quantization bucket is served the same stored verdict, so bucket width is a precision decision, not a free win."
  CONFIDENCE: medium
- [ ] L155: "She reads her own reconstruction error at 0341 and files no report."
  ISSUE: pronoun-ambiguity
  WHY: "She" binds first to Farah (subject of the parallel sentence two back); the intended reader is ARIA.
  FIX: "ARIA reads her own reconstruction error at 0341 and files no report."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx
- [ ] L9: "At the bridge holo table triangle wireframes dissolve into a clean compute grid while a console latency trace steps down."
  ISSUE: double-take
  WHY: five-noun run "bridge holo table triangle wireframes" mis-chunks.
  FIX: "At the bridge holo table, triangle wireframes dissolve into a clean compute grid while a console latency trace steps down."
  CONFIDENCE: medium
- [ ] L16: "Most of inference is matrix math, and now it runs as exactly that."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds nearest to "matrix math", making the clause circular until re-parsed as "inference".
  FIX: "Most of inference is matrix math, and that is exactly what WebGPU runs."
  CONFIDENCE: medium
- [ ] L109: "Demir's opening timing run at the bridge console put WebGPU at 0.4 milliseconds, a figure that would make it nearly forty times faster than WebGL's 15 instead of three."
  ISSUE: double-take
  WHY: trailing "instead of three" first attaches to "WebGL's 15".
  FIX: "Demir's opening timing run at the bridge console put WebGPU at 0.4 milliseconds, a figure that would make it nearly forty times faster than WebGL's 15, not the 3x the table above reports."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/optimization-edge/exercises/inference-cache.yaml
- [ ] L5: "`makeInferenceCache(model, decimals = 2)` returns `{ predict(input), stats }` where predict returns model.predict result + caches by hash of decimals-rounded values."
  ISSUE: double-take
  WHY: "+ caches" first parses as a noun ("result plus caches").
  FIX: "`makeInferenceCache(model, decimals = 2)` returns `{ predict(input), stats }`; predict runs `model.predict` on a miss and caches the result under a hash of the input values rounded to `decimals` places."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/optimization-edge/exercises/profile-model.yaml
- [ ] L4: "Write a function that profiles a model by measuring its parameter count, memory size in MB (assuming float32 = 4 bytes per param; divide by 1e6 for MB, per the lesson's units rule, not 1024*1024 which gives MiB), and average inference time over N runs."
  ISSUE: read-twice
  WHY: a 24-word parenthetical splits the three-item list.
  FIX: "Write a function that profiles a model: parameter count, memory size in MB, and average inference time over N runs. For memory, assume float32 (4 bytes per param) and divide by 1e6, per the lesson's units rule; 1024*1024 would give MiB."
  CONFIDENCE: medium

## capstone module (SCANNED: 14 files / FLAGGED: 15)

FILE: packages/content/content/deep-orbit/capstone/01-system-architecture.mdx
- [ ] L26: "Mirza looks at the number, then at the five boxes that have fourteen days to be ready for it, and says nothing at all."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to "the number", but boxes cannot be ready for a number.
  FIX: "Mirza looks at the number, then at the five boxes that have fourteen days to be ready, and says nothing at all."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx
- [ ] L46: "The pipeline's own log settles it before the lesson ends."
  ISSUE: pronoun-ambiguity
  WHY: "it" has no noun antecedent and collides with the earlier "it" meaning the workflow.
  FIX: "The pipeline's own log settles the question before the lesson ends."
  CONFIDENCE: medium
- [ ] L163: "A rollback that quietly succeeds is how a bad model stays shipped."
  ISSUE: double-take
  WHY: a successful rollback removes the bad model, so the sentence contradicts itself; the point is the silenced page.
  FIX: "A rollback that goes green in silence tells nobody a bad model ever shipped."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/capstone/03-monitoring.mdx
- [ ] L226: "Under both alerts, the triangulation job posts its overnight fix, the third in a row to agree with itself: bearing 127.3, stable for a week now, distance estimate settling toward 4.2 light-years."
  ISSUE: pronoun-ambiguity
  WHY: "itself" binds to the singular fix; a single fix cannot agree with itself.
  FIX: "...the third in a row to land on the same answer: bearing 127.3, stable for a week now, distance estimate settling toward 4.2 light-years."
  CONFIDENCE: medium
- [ ] L229: DIALOGUE "I no longer trust either one of them to stay still."
  ISSUE: pronoun-ambiguity
  WHY: "them" binds to "both alerts" (alerts staying still reads as staying quiet, a coherent wrong meaning); intended pair is the model and the signal.
  FIX: "I no longer trust the model or the signal to stay still."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/capstone/04-documentation.mdx
- [ ] L13: "Demir writes docs like writing a good README."
  ISSUE: double-take
  WHY: "like writing" compares a verb phrase to a gerund with no matching subject.
  FIX: "Demir writes docs the way he would write a good README."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/capstone/05-launch.mdx
- [ ] L107: "Telemetry shows the anomalous signal pulses every 30 seconds."
  ISSUE: double-take
  WHY: "the anomalous signal pulses" first parses as a noun phrase.
  FIX: "Telemetry shows the anomalous signal pulsing every 30 seconds."
  CONFIDENCE: medium
- [ ] L112: "A held door costs exactly what it saves; tonight it saved nothing, and nobody knew that in advance."
  ISSUE: double-take
  WHY: the aphorism does not resolve into a concrete trade even on re-read.
  FIX: "Tonight the hold bought nothing, and nobody knew that in advance."
  CONFIDENCE: medium
- [ ] L117: "Mirza will sign off, but the trust ledger now carries a debt: you treated the team as a constraint rather than a teammate."
  ISSUE: double-take
  WHY: "team...teammate" stem collision; the person overridden was Demir.
  FIX: "Mirza will sign off, but the trust ledger now carries a debt: you treated Demir as a constraint rather than a teammate."
  CONFIDENCE: medium
- [ ] L127: "Say the cost out loud: the canary spent thirty seconds of a window that had none to spare, and had it tripped, tonight lost both the pulse and the rerun."
  ISSUE: double-take
  WHY: the counterfactual needs "would have lost"; the plain past reads as something that actually happened.
  FIX: "...and had it tripped, tonight would have lost both the pulse and the rerun."
  CONFIDENCE: high
- [ ] L188: "Production teams run both, in that order."
  ISSUE: pronoun-ambiguity
  WHY: the two preceding sentences list the shapes in opposite orders, so "that order" is undecidable.
  FIX: "Production teams run both: the suite first, then the canary."
  CONFIDENCE: high
- [ ] L310: "If any stage fails, including a single leaked tensor, the answer is hold."
  ISSUE: double-take
  WHY: "including" makes a leaked tensor a member of the set of failing stages, which it is not.
  FIX: "If any stage fails, the answer is hold; a single leaked tensor counts as a failure."
  CONFIDENCE: medium
- [ ] L385: "Kira, at a partner cell, has escalated a CV anomaly: ..."
  ISSUE: double-take
  WHY: "CV" is used before it means anything to this reader (course covered signals, not vision) and collides with curriculum vitae.
  FIX: "Kira, at a partner cell, has escalated a computer-vision anomaly: ..."
  CONFIDENCE: medium

FILE: packages/content/content/deep-orbit/capstone/exercises/classify-anomaly.yaml
- [ ] L5: "Implement isFibonacciTrain(ratios): true when every ratio matches the Fibonacci-succession ratios (2, 1.5, 1.667, 1.6, 1.625, converging on the golden ratio) within 2%."
  ISSUE: double-take
  WHY: the parenthetical omits the 1:1 opener the grader tests and never mentions the tail alignment the starter and solution depend on; a learner working from the instructions alone fails the first test.
  FIX: "Implement isFibonacciTrain(ratios): true when every ratio matches the Fibonacci-succession ratios ([1, 2, 1.5, 1.667, 1.6, 1.625], aligned from the tail because a train may omit the 1:1 opener) within 2%."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/capstone/exercises/export-model-artifact.yaml
- [ ] L6: "The 42 MB artifact CI restores from cache had to come from somewhere: model.save()."
  ISSUE: double-take
  WHY: "artifact CI" first parses as a compound noun.
  FIX: "The 42 MB artifact that CI restores from cache had to come from somewhere: model.save()."
  CONFIDENCE: medium

## glossary + worlds metadata (SCANNED: 9 files / FLAGGED: 7)

FILE: packages/content/src/glossary.ts
- [ ] L36: "The number of dimensions (axes) a tensor has: a scalar is rank 0, a vector rank 1, a matrix rank 2."
  ISSUE: double-take
  WHY: With the verb elided, "a matrix rank 2" reads as "a matrix-rank of 2", and the very next sentence introduces "matrix rank" as a distinct term, inviting the misparse.
  FIX: "The number of dimensions (axes) a tensor has: a scalar is rank 0, a vector is rank 1, a matrix is rank 2."
  CONFIDENCE: medium

FILE: packages/content/src/glossary.ts
- [ ] L123: "A named stage in a model that transforms its input and passes the result on."
  ISSUE: double-take
  WHY: "that transforms its input" attaches to the nearest noun "model" on first parse (models do transform input), so the reader must re-parse when the next sentence says "that stage".
  FIX: "A named stage in a model. It transforms its input and passes the result on."
  CONFIDENCE: medium

FILE: packages/content/src/glossary.ts
- [ ] L137: "Training adjusts them to reduce error."
  ISSUE: pronoun-ambiguity
  WHY: The nearest noun to "them" is "inputs" (from "multiplies its inputs by"), and a newcomer cannot yet rule out training adjusting inputs.
  FIX: "Training adjusts the weights to reduce error."
  CONFIDENCE: medium

FILE: packages/content/src/glossary.ts
- [ ] L248: "A loss for two-class problems that penalizes confident wrong predictions of a yes or no label."
  ISSUE: double-take
  WHY: "problems that penalizes" clashes in number on first parse; the reader must back up to reattach "that penalizes" to "a loss".
  FIX: "A loss for two-class problems. It penalizes confident wrong predictions of a yes or no label."
  CONFIDENCE: high

FILE: packages/content/src/glossary.ts
- [ ] L581: "Multiplying a signal segment by a tapering function before an FFT to reduce leakage from its edges."
  ISSUE: pronoun-ambiguity
  WHY: "its" has three candidate antecedents (FFT, function, segment), and the nearest noun "FFT" gives a nonsense reading before the intended "segment" lands.
  FIX: "Multiplying a signal segment by a tapering function before an FFT to reduce leakage from the segment's edges."
  CONFIDENCE: medium

FILE: packages/worlds/src/signal-ward.ts
- [ ] L9: "Build Diagnostic One, a clinical text intelligence assistant."
  ISSUE: double-take
  WHY: The four-noun stack "clinical text intelligence assistant" parses two ways ("clinical-text intelligence" vs "text-intelligence assistant"), and the same manifest's modelBuilt already uses the cleaner "clinical text assistant".
  FIX: "Build Diagnostic One, a clinical text assistant."
  CONFIDENCE: medium

FILE: packages/worlds/src/terra-grid.ts
- [ ] L9: "TERRA SYSTEMS' ML models achieve 99.9% in the lab and 67% in the field."
  ISSUE: buried-hook
  WHY: The hook is a concrete accuracy gap, but the metric is never named and "accuracy" fits in the same space (the world's own status board says "FIELD ACCURACY 67%").
  FIX: "TERRA SYSTEMS' ML models achieve 99.9% accuracy in the lab and 67% in the field."
  CONFIDENCE: high

Notes: blog dir is an empty .gitkeep; taglines/statusBoard/coming-soon fragments skipped per exemptions.

## marketing UI copy (SCANNED: 66 files / FLAGGED: 10)

FILE: apps/web/app/faq-data.ts
- [ ] L31: "Each module's time estimates are listed on the pricing page and the Deep Orbit course page."
  ISSUE: buried-hook
  WHY: the question is "How long does Deep Orbit take?" and the answer never says how long (the total already ships in JSON-LD, ~29 hours).
  FIX: "Deep Orbit is 56 lessons across 11 modules, about 29 hours of lessons and exercises. Since it's story-based, it's meant to be tackled in order. Per-module estimates are on the pricing page and the Deep Orbit course page."
  CONFIDENCE: medium
  NOTE: faq-data.ts edits invalidate LANDING visual baselines (known gotcha).

FILE: apps/web/app/components/commit-trail.tsx
- [ ] L59: "+{n} more commits by the capstone, one per solved exercise, generated in the exact format we push to your repo."
  ISSUE: double-take
  WHY: in a git-log-styled panel, "commits by the capstone" first parses as authorship.
  FIX: "+{n} more commits by the time you reach the capstone, one per solved exercise, generated in the exact format we push to your repo."
  CONFIDENCE: high

FILE: apps/web/app/learn/page.tsx
- [ ] L112: "Tensorcraft maps them with {bridges} JavaScript-to-ML bridges and teaches them through one story: {n} modules aboard a station in deep orbit, written in TypeScript, run in your browser."
  ISSUE: dangler
  WHY: "written in TypeScript, run in your browser" attaches to the station; "them" also grabs "names" before "patterns".
  FIX: "Tensorcraft maps those patterns with {bridges} JavaScript-to-ML bridges and teaches them through one story: {n} modules aboard a station in deep orbit. Every lesson is TypeScript that runs in your browser."
  CONFIDENCE: high
- [ ] L148: "...a research station is tracking a sensor reading its model cannot classify, and you are the engineer they bring in."
  ISSUE: double-take
  WHY: "a sensor reading its model" garden-paths as a sensor that is reading its model.
  FIX: "...a research station is tracking a sensor reading that its model cannot classify, and you are the engineer they bring in."
  CONFIDENCE: high
- [ ] L163: "Module 1 is free. After that, each course is a one-time purchase: see pricing for what each plan includes."
  ISSUE: double-take
  WHY: sells "each course" then switches to "each plan"; there are no plans.
  FIX: "Module 1 is free. After that, each course is a one-time purchase: see pricing for what's included."
  CONFIDENCE: medium

FILE: apps/web/app/about/page.tsx
- [ ] L114: "Roughly half of the live exercises drive tensor and model APIs directly, and there a failing test means the model behavior is actually wrong."
  ISSUE: double-take
  WHY: "and there a failing test" reads as the start of "there is/are" (sibling sentence at L116 repeats the pattern).
  FIX: same sentence with a comma: "and there, a failing test means..." (both sentences)
  CONFIDENCE: medium
- [ ] L124: "Deep Orbit is the one open today: a working browser-side ML system, assembled piece by piece across the modules."
  ISSUE: double-take
  WHY: the colon equates a course with the ML system its capstone builds.
  FIX: "Deep Orbit is the one open today. Across its modules you assemble a working browser-side ML system, piece by piece."
  CONFIDENCE: high
- [ ] L194: "The people who wrote it shipped ML in production, in browsers and on Node servers, before writing the curriculum."
  ISSUE: pronoun-ambiguity
  WHY: "it" opens a new section with no antecedent in reach.
  FIX: "Before writing the curriculum, we shipped ML in production, in browsers and on Node servers."
  CONFIDENCE: medium
- [ ] L196: "We built the course we wanted when we started."
  ISSUE: double-take
  WHY: "when we started" can attach to "built"; "started" has no object.
  FIX: "We built the course we wish we'd had when we started."
  CONFIDENCE: medium

FILE: apps/web/app/worlds/[slug]/coming-soon-stub.tsx
- [ ] L204: "{n} {lessonPlural} per {module} · {total} in the full rebuild"
  ISSUE: double-take
  WHY: "the full rebuild" appears exactly once with no support; a first-time visitor cannot tell what the count counts. This is stats chrome, not the exempt story copy.
  FIX: "...· {total} in the full course"
  CONFIDENCE: medium

Protected copy honored: landing headline (iterated baseline), taglines, coming-soon story copy, pricing noun-fragment cards, nav/footer/toasts/error boundaries clean.

## product UI copy (SCANNED: 71 files / FLAGGED: 11)

FILE: apps/web/app/onboarding/page.tsx
- [ ] L559: "Advanced and expert levels get the math derivations opened by default inside lessons; everyone else keeps them one click away."
  ISSUE: pronoun-ambiguity
  WHY: "them" binds to the nearest noun "lessons"; intended antecedent is "derivations".
  FIX: "Advanced and expert levels get the math derivations opened by default inside lessons; everyone else keeps the derivations one click away."
  CONFIDENCE: medium
- [ ] L809: "Your first lesson: understand what a tensor is, and why it behaves so much like a Float32Array you have already shipped."
  ISSUE: overclaim
  WHY: most JavaScript engineers have never shipped a Float32Array; stronger than the "use" the calibration example corrected.
  FIX: "Your first lesson: what a tensor is, and why it behaves so much like the Float32Array you already know."
  CONFIDENCE: high

FILE: apps/web/app/dashboard/purchase-success/page.tsx
- [ ] L16: "Your world is yours: every module is open."
  ISSUE: double-take
  WHY: "Your world is yours" is circular and reads as a stutter.
  FIX: "The world is yours: every module is open."
  CONFIDENCE: medium
- [ ] L197: "We're confirming your payment with Stripe. This usually takes a few seconds; this page updates itself the moment it clears."
  ISSUE: pronoun-ambiguity
  WHY: "it" first parses as "the page clears".
  FIX: "...this page updates itself the moment the payment clears."
  CONFIDENCE: medium

FILE: apps/web/app/dashboard/purchase-success/pending-poller.tsx
- [ ] L70: "Your access unlocks automatically the moment it clears, and nothing is lost by waiting."
  ISSUE: pronoun-ambiguity
  WHY: "it clears" first binds to "Your access" on the page's most anxious copy.
  FIX: "Your access unlocks automatically the moment the payment clears, and nothing is lost by waiting."
  CONFIDENCE: medium
- [ ] L71: "If this page still shows \"Almost There\" after that, tell us and we'll sort it out directly."
  ISSUE: pronoun-ambiguity
  WHY: "after that" points at "a few minutes" two sentences back with a competing referent between.
  FIX: "If this page still shows \"Almost There\" after a few minutes, tell us and we'll sort it out directly."
  CONFIDENCE: medium

FILE: apps/web/app/settings/settings-form.tsx
- [ ] L698: "Connect GitHub so each completed lesson commits to your own repository."
  ISSUE: double-take
  WHY: "lesson commits" garden-paths as a noun phrase.
  FIX: "Connect GitHub and each lesson you complete lands as a commit in your own repository."
  CONFIDENCE: medium

FILE: apps/web/app/unsubscribe/page.tsx
- [ ] L52: "You won't get The Bridge, the weekly digest, anymore."
  ISSUE: double-take
  WHY: appositive strands "anymore" two commas after the verb.
  FIX: "You won't get The Bridge (the weekly digest) anymore."
  CONFIDENCE: medium

FILE: apps/web/app/worlds/[slug]/guest-module-banner.tsx
- [ ] L62: "Create a free account and we'll transfer it, so module 2 opens where you left off."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to "a free account" (accounts do get transferred, so the wrong reading is plausible).
  FIX: "Create a free account and we'll transfer your progress, so module 2 opens where you left off." (keep moduleTerm interpolation)
  CONFIDENCE: high

FILE: apps/web/app/worlds/[slug]/[module]/[lesson]/page.tsx
- [ ] L310: "Reading as a guest: progress is saved in this browser. Create a free account and we'll carry it over."
  ISSUE: pronoun-ambiguity
  WHY: "it" binds to "a free account".
  FIX: "...Create a free account and we'll carry your progress over."
  CONFIDENCE: medium

FILE: apps/web/app/worlds/[slug]/[module]/[lesson]/guest-email-capture.tsx
- [ ] L55: JSX line break inside "we&rsquo;ll" renders as "we 'll" with a stray space.
  ISSUE: double-take (rendering defect)
  FIX: keep `we&rsquo;ll` on one line; wording unchanged.
  CONFIDENCE: high


## emails + legal + API messages (SCANNED: 20 files / FLAGGED: 7)

FILE: apps/api/src/routes/github.ts
- [ ] L70: "GitHub repository access revoked or repo not found. Your integration is still active; retry once you reinstall the GitHub App."
  ISSUE: double-take
  WHY: "revoked" followed by "still active" reads as a contradiction on first parse, and "once you reinstall" presumes an uninstall the user may not know happened.
  FIX: "GitHub can no longer reach your repository. Your connection is intact. Reinstall the GitHub App on your account, then retry."
  CONFIDENCE: high

FILE: apps/api/src/routes/payments.ts
- [ ] L316: "Access to ${body.worldIds.join(", ")}"
  ISSUE: double-take
  WHY: Renders on the Stripe checkout page as "Access to deep-orbit", a raw internal slug shown to a buyer at the moment of payment, the exact problem email.ts's worldDisplayName comment documents.
  FIX: "Access to Deep Orbit" (map slugs through a display-name helper like email.ts's worldDisplayName before joining)
  CONFIDENCE: high
- [ ] L445: "Access to ${body.worldIds.join(", ")}"
  ISSUE: double-take
  WHY: Same raw-slug rendering on the guest checkout's Stripe page.
  FIX: same display-name mapping as L316
  CONFIDENCE: high

FILE: apps/web/app/privacy/page.tsx
- [ ] L80: "your email address, display name, and avatar, from GitHub, Google, or the email address you sign up with."
  ISSUE: double-take
  WHY: The three sources do not distribute across the three items; "avatar ... from the email address you sign up with" forces a re-read.
  FIX: "your email address, display name, and avatar. GitHub or Google provides these when you sign in with one; with email sign-up we collect only your email address."
  CONFIDENCE: medium
- [ ] L247: "That data stays in your browser until a feature you use sends it to us, like finishing a lesson while signed in."
  ISSUE: pronoun-ambiguity
  WHY: "That data" and "it" bind to all four stored items, but the sending claim plausibly applies only to some, so the reader cannot tell what ever leaves the browser.
  FIX: "This data stays in your browser; we receive a copy only when a feature you use sends one, like finishing a lesson while signed in."
  CONFIDENCE: medium
- [ ] L331: "We keep them until you unsubscribe, or for 24 months without engagement, whichever comes first."
  ISSUE: pronoun-ambiguity
  WHY: "them" binds to "emails", which first parses as the messages we send rather than the stored addresses; retention only makes sense for addresses.
  FIX: "We keep your email address until you unsubscribe, or for 24 months without engagement, whichever comes first." (prior sentence: "Waitlist and newsletter email addresses are separate from your account.")
  CONFIDENCE: medium

FILE: apps/web/app/terms/page.tsx
- [ ] L128: "Your GitHub access token is stored so pushes work across sessions and is removed when you disconnect GitHub in Settings."
  ISSUE: double-take
  WHY: "is removed" sits after the purpose clause, so first parse attaches it to "pushes" or "sessions" before recovering the token as subject.
  FIX: "Your GitHub access token is stored so pushes work across sessions; it is removed when you disconnect GitHub in Settings."
  CONFIDENCE: medium

Passed on review: receipt email copy, issue-notification email, field-validation errors, certificate machine codes, privacy noun lists, legal boilerplate.

