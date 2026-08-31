# Cold-reader audit, 2026-08-31 (automated first pass)

> **STATUS: ALL 19 FINDINGS APPLIED, same day, on owner instruction.**
> Each checkbox below records a change live in the working tree. Two
> deviations from the suggested FIX text: (1) the FAQ topics line took
> candidate B (the one that pays for every list item); (2) four module
> summaries (signal-processing, advanced-time-series, optimization-edge,
> browser-runtimes) were tightened to fit the pre-lesson gate that caps
> summaries at 220 characters, keeping every gloss but in fewer words
> (the gate is `module-summary-prelesson.test.ts` and it fired on the
> longer versions). Verified: velite rebuild, content 413 + worlds 124 +
> web 681 suites green, tsc and eslint clean, landing/pricing/lesson-demo
> e2e green (the landing hero-demo test is flaky under parallel load and
> passed alone), and ten visual baselines re-minted and eyeballed
> (landing, pricing, paywall, learn, world-deep-orbit, both schemes).

Owner request: audit every pre-join surface assuming a cold reader, a
working JavaScript engineer who has never met ML terminology and must
not be scared off by it. Four parallel auditors over the surfaces a
person sees before buying or starting: module summaries and world
metadata, landing/learn/about, pricing/FAQ/compare/paywall/worlds, and
onboarding/auth/guest funnel. Lesson bodies were excluded on purpose:
teaching the terms is the product; the map and marketing must not test
the reader on them. NOTHING has been edited; every FIX is a candidate.

Calibration (the M01/M02 model): a term may appear only if the line
pays for it with an outcome, a plain gloss, or a JS-owned anchor.
"Build a classifier one piece at a time: a single neuron, the
activation that bends it..." became "Build a model that sorts signal
from noise, one piece at a time: a single neuron (a weighted sum you
have written with reduce), the bend that lets it learn curves, and
layers stacked into a network."

## Categories

1. unglossed-term: an ML term the line's meaning depends on, unpaid.
2. term-density: three or more unowned terms with no plain handhold;
   the line reads as a test.
3. missed-anchor: a plain outcome or JS anchor exists and is unused.
4. assumes-knowledge: copy that presumes prior ML experience.

Protected: module and lesson titles (curriculum signal: buyers want to
see real topic names), taglines, coming-soon story copy, the FAQ video
tease, dialogue, terms explained in the same line, and the fixed M01
and M02 summaries.

## The shape of what was found

Scanned: 128 files. Flagged: 19 findings (the FAQ topics line was
flagged independently by two auditors and is listed once with both
candidate fixes). The pattern is consistent: the funnel chrome, auth,
guest capture, stats, CTAs, and most of the landing are already clean;
what leaks is TOPIC LISTS: module summaries M03/M04/M05/M08/M10, the
paywall's modules 2-11 pitch, the FAQ topics answer, the compare page's
math row, and single bare uses of "inference" (landing hero, about) and
"classifier" (onboarding welcome card, the Deep Orbit world pitch).

## Review notes before applying

- module.yaml summary edits require `npm run build:content` (velite)
  and re-mint the world-deep-orbit AND pricing visual baselines.
- faq-data.ts renders on the landing AND pricing pages; both baseline
  pairs plus the landing FAQ unit assertions are affected.
- The paywall pitch edit re-mints the paywall baselines.
- Some suggested FIXes run longer than the current house one-liners;
  trimming while keeping the gloss is a fair owner move.

Findings follow, grouped by surface. Tick a box when you have
accepted, rewritten, or rejected the finding.

---
## course metadata (SCANNED: 73 files / FLAGGED: 7)

FILE: packages/content/content/deep-orbit/training-loop/module.yaml
- [ ] L6: "Loss functions, gradient descent, the training loop that ties them together, and the evaluation that decides whether a model is good enough to ship."
  ISSUE: unglossed-term
  WHY: opens with two never-met terms and pays for neither; only the shipping tail is reader-owned.
  FIX: "Loss functions (a score for how wrong each guess is), gradient descent (nudging the weights to shrink that score), the loop that ties them together, and the evaluation that decides whether a model is good enough to ship."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/browser-runtimes/module.yaml
- [ ] L13: "Run a trained model in the browser: TensorFlow.js setup, model loading and caching, real-time inference, and how TensorFlow.js, ONNX Runtime Web, and Transformers.js compare."
  ISSUE: unglossed-term
  WHY: everything is reader vocabulary except "inference", never cashed out.
  FIX: "Run a trained model in the browser: TensorFlow.js setup, model loading and caching, real-time inference (a prediction on screen as each reading arrives), and how TensorFlow.js, ONNX Runtime Web, and Transformers.js compare."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/signal-processing/module.yaml
- [ ] L10: "Use the Fourier Transform, spectrograms, and windowing to turn raw time-series data into features."
  ISSUE: term-density
  WHY: five not-owned terms in one short line, no plain handhold.
  FIX: "Use the Fourier Transform (which frequencies a signal contains), spectrograms (those frequencies pictured over time), and windowing (slicing the stream into chunks) to turn raw time-series readings into inputs the model learns from far better."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/advanced-time-series/module.yaml
- [ ] L10: "Attention, multi-step forecasting, Kalman filters, and confidence-weighted ensembles, for data that does not repeat on a fixed schedule."
  ISSUE: term-density
  WHY: three bare terms; the only plain clause describes the data, not the tools.
  FIX: "Forecast data that will not keep a schedule: attention (the model learns which past readings matter most), forecasts more than one step ahead, Kalman filters (blending a noisy reading with a prediction), and ensembles (several models voting, weighted by confidence)."
  CONFIDENCE: high

FILE: packages/content/content/deep-orbit/optimization-edge/module.yaml
- [ ] L12: "Profiling, quantization, pruning, caching, and WebGPU acceleration, treated as a measured tradeoff between model size and accuracy."
  ISSUE: term-density
  WHY: quantization, pruning, and WebGPU-as-speed sit unglossed in a five-item list.
  FIX: "Shrink a model until it fits the hardware: profiling, quantization (storing weights in smaller numbers), pruning (cutting weights the model barely uses), caching, and WebGPU acceleration (running the math on the GPU), each a measured trade of size against accuracy."
  CONFIDENCE: high

FILE: packages/worlds/src/deep-orbit.ts
- [ ] L9: "Research vessel Archimedes has entered an uncharted nebula. The ship's AI is failing. Build DEEP SCAN, a deep-space signal classifier."
  ISSUE: unglossed-term
  WHY: the purchasable world's own pitch leaves "classifier" bare beside the fixed summaries.
  FIX: "Research vessel Archimedes has entered an uncharted nebula. The ship's AI is failing. Build DEEP SCAN, a deep-space signal classifier: a model that tells the crew what kind of signal just arrived."
  CONFIDENCE: medium
- [ ] L78: "DEEP SCAN: deep-space signal classifier"
  ISSUE: unglossed-term
  WHY: same bare "classifier" on the pricing What's Inside label.
  FIX: "DEEP SCAN: deep-space signal classifier (sorts signals by kind)"
  CONFIDENCE: medium

## landing + learn + about (SCANNED: 15 files / FLAGGED: 7)

FILE: apps/web/app/page.tsx
- [ ] L73: "Run real-time inference on your laptop via WebGL, 100% client-side."
  ISSUE: unglossed-term
  WHY: a cold reader does not know "inference", and "via WebGL" reads as a claim they are expected to already rate.
  FIX: "Run your model live on your laptop, GPU-accelerated through WebGL, 100% client-side."
  CONFIDENCE: high

FILE: apps/web/app/faq-data.ts
- [ ] L11: "The live world, Deep Orbit, covers topics like neural networks, recurrent networks (LSTMs), signal processing, and attention."
  ISSUE: term-density
  WHY: renders in BOTH the landing FAQ and the pricing FAQ; "(LSTMs)" glosses one unknown with another and bare "attention" reads as the everyday word. (Flagged independently by two auditors.)
  FIX (candidate A, landing auditor): "The live world, Deep Orbit, covers neural networks, networks with memory for data that arrives over time (LSTMs), signal processing, and attention, the mechanism behind today's LLMs."
  FIX (candidate B, pricing auditor): "The live world, Deep Orbit, covers topics like neural networks, recurrent networks (LSTMs, models that read data in sequence), signal processing (finding patterns in noisy data), and attention, the mechanism behind today's AI models."
  CONFIDENCE: high

FILE: apps/web/app/components/bridge-preview-section.tsx
- [ ] L146: "Write your first tensor, free →"
  ISSUE: unglossed-term
  WHY: the CTA asks the reader to write a thing whose name they don't know.
  FIX: "Write your first tensor (a nested array of numbers), free →"
  CONFIDENCE: medium

FILE: apps/web/app/components/mdx/deep-scan-demo.tsx
- [ ] L120: "DEEP SCAN · preview build · live inference"
  ISSUE: missed-anchor
  WHY: shows on the free module-1 lesson; the plain wording already exists (the landing hero overrides it with "running in your tab").
  FIX: "DEEP SCAN · preview build · running live in your tab"
  CONFIDENCE: medium

FILE: apps/web/app/learn/page.tsx
- [ ] L152: "it teaches neural networks, training and gradient descent, signal processing, and anomaly detection, and ends with a capstone model you ship."
  ISSUE: unglossed-term
  WHY: every other list item gives something to picture; "gradient descent" is a blank.
  FIX: "it teaches neural networks, training and gradient descent (how a model learns from its own errors), signal processing, and anomaly detection, and ends with a capstone model you ship."
  CONFIDENCE: medium

FILE: apps/web/app/about/page.tsx
- [ ] L146: "Browser ML lives within the inference budget the user's device gives you."
  ISSUE: unglossed-term
  WHY: the sentence's point hangs on "inference".
  FIX: "Browser ML lives within the compute budget the user's device gives you when the model runs."
  CONFIDENCE: high
- [ ] L153: "Chain rule, softmax, KL, cross-entropy. All derived."
  ISSUE: term-density
  WHY: four unknown terms in a row; reader cannot tell if they must know these before starting.
  FIX: "The math the course needs (chain rule, softmax, KL, cross-entropy) is all derived when it first appears."
  CONFIDENCE: medium

Clean per auditor: "the ramp into tensors" (anchored in-sentence), "Math.max(0, x) literally is ReLU" (the anchor IS the gloss), bridge #1 preview, landing "anomaly detection"/"neural networks layer by layer", FAQ video tease (exempt).

## pricing + paywall + worlds (SCANNED: 19 files / FLAGGED: 5)

FILE: apps/web/app/paywall/page.tsx
- [ ] L102: "Modules 2-11 are where you stop translating and start shipping: layers, backpropagation, signal processing, recurrent networks, and a capstone, a working browser-side ML system you assemble piece by piece."
  ISSUE: term-density
  WHY: three not-owned terms land bare in one list on a hard-sell surface; the only plain handle arrives after the test is over.
  FIX: "Modules 2-11 are where you stop translating and start shipping: layers stacked into a real network, backpropagation (how the model learns from its own errors), pulling patterns out of noisy signals, recurrent networks (models with memory), and a capstone, a working browser-side ML system you assemble piece by piece."
  CONFIDENCE: high

FILE: apps/web/app/compare/page.tsx
- [ ] L65: "Chain rule, DFT, cross-entropy derived in optional drawers"
  ISSUE: term-density
  WHY: the "Math depth" row a math-anxious reader checks first offers three bare terms, one an unexpanded acronym.
  FIX: "The heavy math (chain rule, Fourier transforms, cross-entropy) derived in optional drawers you can skip"
  CONFIDENCE: medium
- [ ] L139: "If you want paper-grade autograd internals, Karpathy's Zero-to-Hero is free and excellent."
  ISSUE: unglossed-term
  WHY: the reader self-selects in or out on "autograd internals" with no way to know what autograd is.
  FIX: "If you want to build the training machinery itself from raw math (paper-grade autograd internals), Karpathy's Zero-to-Hero is free and excellent."
  CONFIDENCE: medium

FILE: apps/web/app/worlds/page.tsx
- [ ] L19: "Deep Orbit, a time-series and signals course in JavaScript, is live."
  ISSUE: unglossed-term
  WHY: "time-series" names the entire product in a search snippet with no gloss.
  FIX: "Deep Orbit, a JavaScript course on reading signals and data that arrive over time (time series), is live. Four more story worlds (Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) are coming; join the waitlists."
  CONFIDENCE: medium

Clean per auditor: "JS-to-ML bridges" (self-describing), coming-soon chrome, paywall-notice, checkout-button, world-cards-grid, curriculum-preview chrome, pricing JSON-LD.

## onboarding + funnel (SCANNED: 21 files / FLAGGED: 1)

FILE: apps/web/app/onboarding/page.tsx
- [ ] L487: "Train a working classifier by module 3"
  ISSUE: missed-anchor
  WHY: "classifier" is the exact term the M02 fix pays for with "sorts signal from noise", yet this welcome-step card (the reader's first minute inside the product) uses it bare.
  FIX: "Train a model that sorts signal from noise by module 3"
  CONFIDENCE: high

Held-back near-flags (relayed for owner judgment):
- worlds/[slug]/page.tsx L45-46: "Time-Series & Signals" inside the metadata description acts as the course topic name in an otherwise plain sentence; treated as curriculum signal, not flagged.
- onboarding L558-561 math-derivations line: reassures rather than gates; not flagged.
- onboarding L809-811: introduces "tensor" anchored to Float32Array in the same sentence; the desired pattern.

Clean from the cold seat: auth pane, both guest funnel surfaces, world page header, stats strip, CTA labels, map chrome, not-found/error pages.

