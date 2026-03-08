# Deep Orbit — Time-Series & Signals

---

## SCRIPT GUIDE

**Tags:** `time-series` `signals` `FFT` `LSTM` `anomaly-detection` `browser-ml`
**Theme:** Deep space signal analysis aboard the research vessel *Archimedes*
**Model being built:** DEEP SCAN — a multi-stage signal classification system
**GitHub repo deployed at end:** `deep-scan-signal-classifier`

### Characters

| Name | Role | Description |
|---|---|---|
| **Commander Adaeze Okafor** | Mentor / Mission Commander | Ship captain. Calm, authoritative, three prior deep-space missions. Sets context — she explains *why* the crew needs each capability but never dives into technical detail. Speaks in clear, deliberate sentences. |
| **Dr. Hana Sato** | Astrophysicist / Concept Explainer | Lead scientist. Puzzle-lover, deeply curious, sometimes lost in abstractions. Uses analogies liberally, lights up when a student grasps a concept. Introduces ML theory via holographic whiteboard diagrams. |
| **Chief Maria Torres** | Ship Engineer / Implementation Lead | Maintains all systems. Pragmatic skeptic — trusts things that work, distrusts "clever." Dry humor, no-nonsense. Handles TensorFlow.js, ONNX, quantization, performance. Backstory: 18 years in fleet engineering, refused two promotions to stay hands-on. On the ISS Vanguard, Torres trusted a rule-based navigation system through an asteroid field. It froze on an edge case — a tumbling fragment with irregular spin. Two crew members didn't make it to the escape pods. She carries that loss as armor against any system that promises more than it can deliver. Warms up once she sees results. |
| **Ensign Joon Park** | Comms Officer / Student Avatar | The player character. Skilled frontend engineer reassigned to the Archimedes to maintain comms. No ML background but strong JS/TS skills. Eager, occasionally overwhelmed, grows in confidence across 11 modules. Asks clarifying questions and makes FE analogies. |
| **ARIA** | Ship AI / Tutorial Guide | Onboard AI. Dry-witted, precise, occasionally sardonic. Voice of the code editor and terminal. Provides tutorials, documentation, hints, and commentary. |

#### Park — Dialogue Evolution

Park's voice changes across the course as his ML fluency grows. His dialogue should reflect this progression:

- **Early (M1–M3):** *"Wait, so training a neural network is basically like running a build step?"* — Analogy-seeking, uncertain. Every ML concept gets filtered through frontend metaphors because that is all he has.
- **Mid (M4–M6):** *"The sliding window approach reminds me of IntersectionObserver — we only process what's in view."* — Making connections independently. The analogies are sharper, more specific, and he volunteers them rather than needing Sato to supply them.
- **Late (M7–M9):** *"We need to check for data leakage in the validation set before we trust these anomaly scores."* — Using ML terminology natively. The frontend analogies drop away. He thinks in the domain now.
- **Capstone (M10–M11):** *"Int8 quantization on the signal processor — the inference budget is too tight for float32 on this band."* — ML practitioner. He no longer needs FE analogies. He speaks Torres's optimization language fluently.

### Career Paths & Salaries

| Path | Description | Avg Salary (US) |
|---|---|---|
| ML Engineer (Time-Series) | Build and deploy temporal models for IoT, finance, health monitoring | $145,000 - $195,000 |
| Signal Processing Engineer | DSP + ML hybrid roles in telecom, audio, defense | $130,000 - $180,000 |
| Data Scientist (Sensor/IoT) | Analyze streaming sensor data, build anomaly pipelines | $125,000 - $170,000 |
| Audio/Speech ML Engineer | Apply signal processing + ML to audio products | $140,000 - $190,000 |
| Edge ML Engineer | Optimize and deploy models to constrained devices | $135,000 - $185,000 |

---

## CONCEPT DISCLAIMER

> **This course teaches machine learning through interactive, narrative-driven lessons designed for frontend developers.**
>
> You will learn real ML — not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
>
> **Fundamentals you will master:**
> - Linear algebra (vectors, matrices, tensors, broadcasting)
> - Calculus (gradients, chain rule, backpropagation)
> - Probability & statistics (distributions, Bayes, likelihood)
> - Optimization (gradient descent, learning rates, convergence)
> - Information theory (entropy, cross-entropy, KL divergence)
>
> **Specialization topics (Deep Orbit):**
> - Signal processing (FFT, STFT, windowing, filtering)
> - Time-series modeling (RNNs, LSTMs, GRUs, temporal convolutions)
> - Anomaly detection (autoencoders, isolation forests, reconstruction error)
> - Sequence forecasting (attention, Kalman filters, DTW)
> - Browser ML runtimes (TensorFlow.js, ONNX Runtime Web, WebGPU)
> - LLM integration (prompt engineering, RAG, multi-model orchestration)
> - Model optimization (quantization, pruning, distillation, caching)

---

## MODULE 1: ML THROUGH SIGNALS (FREE)

*The crew arrives at Kepler-442. Park is introduced to the mission and begins learning ML basics through ship telemetry data.*

---

### LESSON 1.1 — Arrival: What Is ML?

**Format:** Standard | **5C Variation:** Standard

#### CONTEXT

The Archimedes drops out of FTL transit in the Kepler-442 system. Commander Okafor convenes the crew on the bridge. Long-range sensor arrays have detected structured electromagnetic signals that do not match any known natural phenomenon — not pulsars, not magnetars, not stellar noise. The signals are organized into frequency bands and repeat at irregular intervals.

Park is the newest crew member. He was assigned as comms officer based on his frontend engineering background — the ship's communication systems run on a browser-based dashboard built in TypeScript. He has no ML background. Okafor explains the mission: build a signal classification system (DEEP SCAN) that can categorize incoming signals in real time, so Dr. Sato can focus on analysis instead of manual sorting.

> **OKAFOR:** "Every signal is a question the universe is asking. Our job is to build a system that can hear the question clearly — and suggest an answer."

Torres, in the back of the bridge, mutters:

> **TORRES:** "Another frontend dev touching the compute cluster. Wonderful."

ARIA boots up Park's workstation.

> **ARIA:** "Welcome aboard, Ensign. I have prepared your development environment. I see you prefer tabs over spaces. We will need to discuss that."

#### CHALLENGE

Park must understand what machine learning is and how it differs from traditional programming. The lesson establishes the core mental model: in traditional programming, the developer writes rules; in ML, the developer provides data and the system learns the rules.

#### CONCEPT

**Machine learning** is a programming paradigm where instead of writing explicit rules (`if signal > threshold, classify as X`), you provide examples of inputs and desired outputs, and an algorithm learns the mapping between them.

Three components of every ML system:
1. **Data** — the examples the model learns from
2. **Model** — the function that maps inputs to outputs
3. **Objective** — the measure of how well the model is performing

**FE BRIDGE:** Think of it like this. In traditional frontend dev, you write a function: `function classify(signal) { if (signal.amplitude > 50) return 'strong'; ... }`. You encode every rule by hand. In ML, you write a function that *learns* the rules from data: `const model = train(signals, labels)`. The model is like an app that writes its own business logic based on usage patterns.

#### CHECKPOINT

> **ARIA:** "Ensign, let me verify your understanding before we proceed. I would hate for you to build something on a shaky foundation. Well — I would find it entertaining, actually, but Commander Okafor would not."

Quiz:
1. In ML, what replaces hand-written rules? → **Data + training**
2. Name the three components of every ML system → **Data, Model, Objective**
3. True or false: ML models are always more accurate than hand-written rules → **False** — ML models are probabilistic; they excel when rules are too complex to write by hand, but simple rules can outperform models in simple domains.

#### CODE

```typescript
// Traditional programming: hand-written rules
function classifySignal(amplitude: number): string {
  if (amplitude > 80) return 'strong';
  if (amplitude > 40) return 'moderate';
  return 'weak';
}

// ML approach: learn from data
interface TrainingExample {
  amplitude: number;
  label: string;
}

const trainingData: TrainingExample[] = [
  { amplitude: 92, label: 'strong' },
  { amplitude: 67, label: 'moderate' },
  { amplitude: 23, label: 'weak' },
  { amplitude: 85, label: 'strong' },
  { amplitude: 44, label: 'moderate' },
  { amplitude: 11, label: 'weak' },
];

// The model learns the boundaries from data instead of us coding them
// We will build this "train" function over the coming lessons
```

#### HINTS

**Tier 1 — Nudge:**
> "Think about the difference between writing CSS by hand and using a design system that adapts based on usage data."

**Tier 2 — Concept:**
> "In traditional programming, the developer is the one who encodes the knowledge. In ML, the data encodes the knowledge, and the algorithm extracts it. The model is a compressed representation of patterns in the data."

**Tier 3 — Full walkthrough:**
> "Here is the core distinction. Traditional: `humanWritesRules(input) → output`. ML: `algorithmLearnsRules(data) → model`, then `model(input) → output`. The key insight is that the developer's role shifts from writing rules to curating data and choosing architectures."

#### COMMON MISTAKES

1. **Thinking ML replaces all programming** — ML is one tool. Many problems are better solved with explicit rules. Use ML when the rules are too complex, too numerous, or too fluid to write by hand.
2. **Conflating AI and ML** — AI is the broad field; ML is a subset. Deep learning is a subset of ML. This course focuses on ML and deep learning.
3. **Assuming more data always wins** — Data quality matters more than quantity. 1,000 clean, well-labeled examples can outperform 100,000 noisy ones.

#### CONSEQUENCE

Park stares at the telemetry feed scrolling across his monitor. Thousands of signals per minute. Each one a waveform — amplitude, frequency, duration, harmonic content.

> **PARK:** "There's no way I can write rules for all of these. There are too many patterns."

> **SATO:** (smiling) "Now you understand why we need machine learning."

ARIA overlays a visualization: the same signal data, but now color-coded by category. Some clusters are obvious — but between them, ambiguous regions where human rules would fail.

> **ARIA:** "The ship's previous classification system used 847 hand-written rules. It achieved 61% accuracy. I believe we can do better."

The scene ends with Park looking at the signal feed with new eyes. He does not see data anymore. He sees a training set.

---

### LESSON 1.2 — Three Kinds of Learning

**Format:** Discovery | **5C Variation:** Discovery

#### RECALL

> **ARIA:** "Before we proceed — what are the three components of every ML system?"
> Park: "Data, model, objective."
> **ARIA:** "Acceptable. You may continue."

#### CONTEXT

Dr. Sato pulls Park into the science lab. On the holographic display, she shows three different scenarios the crew will face, each requiring a different learning approach:

1. **Labeled signal data** — 5,000 signals that a previous mission already categorized (radiation burst, stellar wind, communication artifact, unknown). This is **supervised learning** — you have inputs and correct answers.

2. **Unlabeled signal data** — 200,000 signals from the long-range array with no categories. The crew needs to find natural groupings. This is **unsupervised learning** — you have inputs but no labels, and the model must discover structure.

3. **Real-time classification decisions** — as DEEP SCAN classifies signals, the crew confirms or corrects. The system improves with feedback. This is **reinforcement learning** — the model takes actions and receives rewards/penalties.

> **SATO:** "Ah, you already know these patterns! Think about how you learn as a developer. Supervised is like following a tutorial — someone shows you the right answer. Unsupervised is like exploring a new codebase — you find the structure yourself. Reinforcement is like debugging in production — you try something, see if it works, and adjust."

**FE BRIDGE:**
- **Supervised** = unit tests. You know the expected output for each input.
- **Unsupervised** = clustering your component library. No predefined categories — you group by similarity.
- **Reinforcement** = A/B testing. Deploy, measure, adjust based on user behavior.

#### CODE

```typescript
// Supervised: we have labels
const supervisedData = [
  { features: [0.8, 120, 0.3], label: 'radiation' },
  { features: [0.2, 340, 0.7], label: 'stellar' },
  { features: [0.5, 210, 0.5], label: 'artifact' },
];
// Goal: learn mapping from features → label

// Unsupervised: no labels
const unsupervisedData = [
  { features: [0.8, 120, 0.3] },
  { features: [0.2, 340, 0.7] },
  { features: [0.5, 210, 0.5] },
];
// Goal: discover clusters / structure

// Reinforcement: action → reward
interface RLStep {
  state: number[];       // current signal features
  action: string;        // classification decision
  reward: number;        // +1 correct, -1 incorrect
}
// Goal: maximize cumulative reward over time
```

#### CONSEQUENCE

> **SATO:** "For DEEP SCAN, we will primarily use supervised learning — we have Dr. Nakamura's labeled dataset from the previous mission. But Module 7 will need unsupervised learning for anomaly detection. And the real-time feedback loop? That is reinforcement thinking."

Park nods. Three paradigms, one system. The architecture is already more complex than he imagined.

> **PARK:** "So DEEP SCAN isn't just one model. It's multiple approaches combined."

> **SATO:** "Welcome to real-world ML, Ensign."

---

### LESSON 1.3 — Neural Networks

**Format:** Broken Code First | **5C Variation:** Broken Code First

Park arrives at his workstation to find ARIA has pre-loaded a broken neural network implementation. The code has intentional errors. Park must understand neural networks by fixing them.

#### RECALL

> **ARIA:** "Quick check, Ensign. Name one scenario where unsupervised learning is more appropriate than supervised."
> Park: "When you have data but no labels — like our unlabeled signal archive."
> **ARIA:** "Correct. Now let us break something."

#### CONTEXT

Dr. Sato introduces neural networks using the holographic whiteboard. She draws a diagram: layers of connected nodes, each receiving inputs, applying weights and biases, and passing results through an activation function.

> **SATO:** "Think of a neural network as a series of transformations. Each layer takes the data, warps it slightly, and passes it on. By the time data has passed through all the layers, it has been transformed from raw input into a useful representation."

#### CONCEPT

A **neural network** is a function composed of layers. Each layer applies a linear transformation (multiply by weights, add bias) followed by a non-linear activation function.

**Neuron:** `output = activation(input * weight + bias)`
**Layer:** Apply the neuron function to every input (or a subset)
**Network:** Stack multiple layers end to end

**FE BRIDGES:**

| Neural Network Concept | Frontend Equivalent |
|---|---|
| Layer applies function to all inputs | `Array.map()` — apply a transform to every element |
| Weights are tunable parameters | CSS custom properties (`--var`) — configurable values that change behavior |
| Activation function clips/transforms output | `Math.max(0, x)` — ReLU is literally this function |
| Training adjusts weights to reduce error | `npm run build` — iterative process that optimizes output |
| Inference runs data through trained network | `fetch()` — send input, get processed output |

> **PARK:** "Wait — so a neural network layer is basically `Array.map(x => activation(x * weight + bias))`? I have used `.map()` a thousand times."

> **SATO:** (beaming) "Now you are thinking like a network."

#### CODE

ARIA presents the broken code. Park must fix three bugs:

```typescript
// BROKEN CODE — 3 bugs to find and fix

class Neuron {
  weight: number;
  bias: number;

  constructor() {
    // Bug 1: weights should be random, not zero
    // Zero weights mean every neuron learns the same thing
    this.weight = 0;     // FIX: Math.random() * 2 - 1
    this.bias = 0;
  }

  // Bug 2: no activation function — output is purely linear
  // Stacking linear layers is equivalent to a single linear layer
  forward(input: number): number {
    return input * this.weight + this.bias;
    // FIX: return Math.max(0, input * this.weight + this.bias)  // ReLU
  }
}

class Layer {
  neurons: Neuron[];

  constructor(size: number) {
    this.neurons = Array.from({ length: size }, () => new Neuron());
  }

  forward(inputs: number[]): number[] {
    // Bug 3: should use all inputs per neuron, not one-to-one
    return this.neurons.map((n, i) => n.forward(inputs[i]));
    // FIX: each neuron should receive ALL inputs, not just one
    // return this.neurons.map(n =>
    //   inputs.reduce((sum, inp, i) => sum + n.weights[i] * inp, n.bias)
    // );
  }
}
```

#### COMMON MISTAKES

1. **Initializing all weights to zero** — the symmetry problem. All neurons learn the same function. Random initialization breaks symmetry.
2. **Forgetting activation functions** — without non-linearity, a 100-layer network is mathematically equivalent to a single-layer network.
3. **Confusing layers with neurons** — a layer contains multiple neurons. A network contains multiple layers. The hierarchy matters.

#### CONSEQUENCE

Park fixes all three bugs. ARIA runs the corrected network on a small subset of signal data.

> **ARIA:** "Three bugs, Ensign. You found them all. The corrected network achieves 72% accuracy on the test signal batch. Not impressive by any measure, but functional."

> **PARK:** "72% is better than the ship's old rule-based system at 61%."

> **ARIA:** "A low bar, but technically correct. We will improve it."

Torres passes by the lab, glances at the screen.

> **TORRES:** "72%? Wake me when it is above 90."

---

### LESSON 1.4 — Tensors + Model Zoo

**Format:** Standard | **5C Variation:** Standard

#### CONTEXT

Dr. Sato explains that real signal data is not a flat array of numbers — it has structure. A single signal reading might have amplitude, frequency, phase, and duration. A batch of signals adds another dimension. A time sequence of batches adds yet another. This multi-dimensional structure is called a **tensor**.

> **SATO:** "You have worked with arrays, yes? And arrays of arrays? A tensor is the generalization. A 0D tensor is a scalar. 1D is a vector. 2D is a matrix. 3D, 4D — those are the shapes of real-world data."

#### CONCEPT

**Tensors** are multi-dimensional arrays — the fundamental data structure of ML.

| Rank | Shape Example | Name | Data Example |
|---|---|---|---|
| 0 | `[]` | Scalar | Single amplitude reading: `42.7` |
| 1 | `[5]` | Vector | One signal: `[amp, freq, phase, dur, snr]` |
| 2 | `[100, 5]` | Matrix | 100 signals, 5 features each |
| 3 | `[32, 100, 5]` | 3D Tensor | 32 batches of 100 signals |
| 4 | `[32, 10, 100, 5]` | 4D Tensor | 32 batches, 10 time steps, 100 signals, 5 features |

**Broadcasting:** When tensors of different shapes interact, the smaller tensor is "broadcast" to match the larger one. Scalar `+ [1, 2, 3]` becomes `[scalar, scalar, scalar] + [1, 2, 3]`.

**FE BRIDGES:**

| Tensor Concept | Frontend Equivalent |
|---|---|
| Tensor | `TypedArray` (e.g., `Float32Array`) — fixed-type, fixed-size, GPU-friendly |
| Broadcasting | `flex-grow` — a single value expands to fill available space |
| Hugging Face Model Hub | npm registry — a package manager for pre-trained models |

> **SATO:** "Hugging Face is like npm for ML models. You can browse, download, and use pre-trained models the same way you install packages."

#### CODE

```typescript
import * as tf from '@tensorflow/tfjs';

// Scalar (rank 0)
const amplitude = tf.scalar(42.7);
console.log(amplitude.shape);  // []

// Vector (rank 1) — one signal
const signal = tf.tensor1d([0.8, 120, 0.3, 2.1, 0.95]);
console.log(signal.shape);  // [5]

// Matrix (rank 2) — batch of signals
const batch = tf.tensor2d([
  [0.8, 120, 0.3, 2.1, 0.95],
  [0.2, 340, 0.7, 1.4, 0.82],
  [0.5, 210, 0.5, 3.0, 0.91],
]);
console.log(batch.shape);  // [3, 5]

// Broadcasting example
const normalized = batch.div(batch.max());  // scalar broadcasts across matrix
console.log(normalized.shape);  // [3, 5]

// Loading a pre-trained model from Hugging Face / TF Hub
// Like `npm install` for ML models
const modelUrl = 'https://tfhub.dev/google/universal-sentence-encoder/4';
// const model = await tf.loadGraphModel(modelUrl);
```

#### CONSEQUENCE

Park explores the Hugging Face Model Zoo and TF Hub. He finds pre-trained signal classifiers, audio models, and general-purpose architectures.

> **PARK:** "This is like browsing npm. There are models for everything."

> **SATO:** "And like npm, you should not blindly install things. Understand the architecture, check the training data, verify the license. A model is only as trustworthy as its provenance."

> **ARIA:** "I have indexed 47 potentially relevant pre-trained models. Shall I rank them by relevance to our signal classification task?"

---

### LESSON 1.5 — First Browser ML

**Format:** Flashback | **5C Variation:** Standard (with debrief elements)

The lesson opens with a flashback: before Park boarded the Archimedes, he built a simple demo at a web conference — a browser-based ML classifier using TensorFlow.js. That experience is why he was assigned to this mission.

#### RECALL

> **ARIA:** "Before we deploy to the browser, Ensign — what is the shape of a 2D tensor representing 50 signals with 8 features each?"
> Park: "`[50, 8]`"
> **ARIA:** "Correct. Proceed."

#### CONTEXT

Torres walks Park through deploying their Module 1 neural network to the ship's browser-based dashboard. This is the first time DEEP SCAN runs in the browser.

> **TORRES:** "The bridge crew uses a web dashboard. If DEEP SCAN cannot run in the browser, it does not exist to them. No Python notebooks, no server dependencies. The model runs client-side or it does not run."

Park loads the trained model into TensorFlow.js. He builds a minimal inference pipeline: ingest signal data from the telemetry WebSocket, convert to tensor, run prediction, render classification result.

#### CODE

```typescript
import * as tf from '@tensorflow/tfjs';

// Load the trained model (exported from training pipeline)
const model = await tf.loadLayersModel('/models/deep-scan-v1/model.json');

// Simulate incoming signal data (in production, this comes from WebSocket)
const rawSignal = new Float32Array([0.72, 185, 0.45, 1.8, 0.88, 0.31, 44, 0.62]);

// Convert to tensor — shape [1, 8] (batch of 1, 8 features)
const inputTensor = tf.tensor2d(rawSignal, [1, 8]);

// Run inference
const prediction = model.predict(inputTensor) as tf.Tensor;
const probabilities = await prediction.data();
const classIndex = prediction.argMax(-1).dataSync()[0];

const labels = ['radiation', 'stellar', 'artifact', 'unknown'];
console.log(`Classification: ${labels[classIndex]}`);
console.log(`Confidence: ${(probabilities[classIndex] * 100).toFixed(1)}%`);

// Clean up tensors to prevent memory leaks
inputTensor.dispose();
prediction.dispose();

// Connect to ship telemetry stream
const ws = new WebSocket('ws://archimedes.local:8080/telemetry');
ws.onmessage = async (event) => {
  const signalData = JSON.parse(event.data);
  const tensor = tf.tensor2d(signalData.features, [1, 8]);
  const result = model.predict(tensor) as tf.Tensor;
  const idx = result.argMax(-1).dataSync()[0];

  renderClassification(labels[idx], signalData.timestamp);

  tensor.dispose();
  result.dispose();
};
```

#### CONSEQUENCE

Park deploys DEEP SCAN v0.1 to the bridge dashboard. The crew watches as signals are classified in real time. The first results:

- **67%** classified as radiation bursts (expected — normal background)
- **18%** classified as stellar wind patterns
- **12%** classified as communication artifacts (probably echoes from the Archimedes itself)
- **3%** classified as unknown

That 3% catches Sato's attention.

> **SATO:** "Three percent unknown. That is what we came here for."

> **OKAFOR:** "How confident is the model on those unknowns?"

> **ARIA:** "Confidence ranges from 34% to 51%. The model is uncertain. It has never seen signals like these in its training data."

> **OKAFOR:** "Then we need a better model. Park, Sato — get to work."

> **TORRES:** (examining the dashboard) "Inference time is 23 milliseconds per signal. Acceptable, for now."

#### DEBRIEF

Module 1 complete. Park has learned:
- What ML is and how it differs from traditional programming
- The three paradigms: supervised, unsupervised, reinforcement
- Neural network fundamentals: neurons, layers, weights, biases, activations
- Tensors: the data structure of ML
- Browser inference with TensorFlow.js

DEEP SCAN v0.1 is live. It is basic, but it works. The 3% unknown signals are the thread that will pull the crew through the remaining 10 modules.

#### GITHUB

**Commit:** `feat(m1): initial DEEP SCAN classifier — browser inference pipeline`
**Branch:** `module-01/ml-through-signals`
**Files:**
- `src/model/neuron.ts`
- `src/model/layer.ts`
- `src/model/network.ts`
- `src/inference/browser-pipeline.ts`
- `src/telemetry/signal-types.ts`
- `public/models/deep-scan-v1/model.json`
- `tests/model/neuron.test.ts`

#### ANIMATION

End-of-module animation: a spectrogram visualization fills the screen. Signal waveforms scroll from right to left. Most are colored blue (radiation) or green (stellar). A few pulse gold — the unknowns. The DEEP SCAN logo fades in: a stylized waveform inside a scanning reticle. Text appears: **"Module 1 Complete — DEEP SCAN v0.1 Online"**

**Cliffhanger:** As the crew celebrates their first successful classification, ARIA flags an anomaly: a faint signal that matches no known stellar pattern.

---

## MODULE 2: DATA & PREPROCESSING

*Cleaning and preparing sensor data for model consumption.*

### Narrative

The first batch of raw sensor data arrives from the long-range arrays — and it is a mess. Missing values where sensors dropped out. Noise spikes from the ship's own engines. Outliers that might be real anomalies or might be sensor errors. Park discovers that real-world data is nothing like the clean datasets in tutorials.

> **SATO:** "Welcome to the reality of data science, Ensign. 80% of the work is cleaning data. The remaining 20% is complaining about cleaning data."

> **TORRES:** "If I cannot rebuild it from source, it does not exist. Every transform must be logged, versioned, and reproducible."

**Unique content:** Park builds a full preprocessing pipeline for signal data — handling missing values via interpolation, removing engine noise through band-pass filtering, normalizing amplitude ranges, engineering time-domain features (zero-crossing rate, RMS energy, spectral centroid), and splitting data with stratification to preserve the rare "unknown" class.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Raw Data Reality | Missing values, noise, outliers in sensor feeds | Form validation and sanitization |
| 2 | Normalization | Scaling features to consistent ranges | CSS `normalize.css` / reset stylesheets |
| 3 | Feature Engineering | Creating meaningful features from raw signals | Data transformation before rendering |
| 4 | Train/Val/Test Splits | Partitioning data responsibly | Environment configs (dev/staging/prod) |
| 5 | Data Pipelines | Reproducible preprocessing workflows | Build pipelines (Webpack/Vite config) |

**FE BRIDGE (Module-Level):** A Web Audio API node graph is the perfect analogy for a data preprocessing pipeline. Each `AudioNode` transforms the signal — gain, filter, analyser — just like Express middleware transforms a request. Data flows through a chain of transforms, each one modifying the signal before passing it to the next node.

**Inter-Lesson Hook:** Park's preprocessing pipeline works — until Torres feeds it raw data from an uncharted frequency band.

### GITHUB

**Commit:** `feat(m2): data preprocessing pipeline with normalization and feature engineering`
**Branch:** `module-02/data-preprocessing`
**Files:**
- `src/data/preprocessing.ts`
- `src/data/normalization.ts`
- `src/data/feature-engineering.ts`
- `src/data/split.ts`
- `src/data/pipeline.ts`
- `tests/data/preprocessing.test.ts`

**Cliffhanger:** During preprocessing, Sato notices a recurring amplitude spike buried in the noise floor — it appears exactly every 73.4 seconds. "That periodicity... that is not instrument error."

---

## MODULE 3: NEURAL NETWORKS DEEP DIVE

*Building the core signal classifier architecture with multi-layer networks.*

### Narrative

Park builds the first real DEEP SCAN classifier — a feedforward neural network with multiple hidden layers. Sato explains backpropagation using the ship's navigation correction system as an analogy: "When the ship drifts off course, the nav system measures the error, calculates how to adjust, and fires the thrusters in the right direction. Backpropagation does the same thing — it measures the error, calculates how each weight contributed to it, and adjusts accordingly."

The model reaches 78% accuracy. Okafor says: "Good enough to trust? Not yet. Keep going."

**Unique content:** Park implements 1D convolutions for signal pattern detection — applying convolutional kernels across time-series data rather than images. This is the "1D CNN" approach that excels at finding local patterns in sequential data, like detecting a specific waveform shape regardless of where it appears in the signal.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Network Architecture | Layers, widths, depths — designing a network | Component hierarchy in React |
| 2 | Loss Functions | Measuring how wrong the model is | Unit test assertions (`expect().toBe()`) |
| 3 | Backpropagation | How the network learns from errors | Hot module replacement feedback loop |
| 4 | Training Loop | Epochs, batches, convergence | `npm run build` — iterative compilation |
| 5 | Evaluation Metrics | Accuracy, precision, recall, F1 | Lighthouse performance scores |

**FE BRIDGE (Module-Level):** CSS animation keyframes are decomposition — breaking complex motion into discrete steps at specific percentages. A training loop does the same: at each epoch, the model evaluates its position, computes the error, and adjusts. The `@keyframes` analogy extends further — `ease-in-out` is like a learning rate schedule that starts slow, accelerates, then decelerates.

**Inter-Lesson Hook:** The network trains successfully, but ARIA notices the loss curve has an unusual plateau at epoch 47.

### Shared Core

This module covers foundational concepts shared across all themes: network architecture design, loss functions (MSE, cross-entropy), backpropagation algorithm, training loops (epochs, batches, learning rate), and evaluation metrics (accuracy, precision, recall, F1-score, confusion matrices).

### GITHUB

**Commit:** `feat(m3): multi-layer neural network with 1D convolutions for signal classification`
**Branch:** `module-03/neural-networks`
**Files:**
- `src/model/feedforward.ts`
- `src/model/conv1d.ts`
- `src/model/loss.ts`
- `src/model/backprop.ts`
- `src/training/loop.ts`
- `src/training/metrics.ts`
- `tests/model/feedforward.test.ts`

**Cliffhanger:** The neural network classifies the signal with 94% confidence — but ARIA discovers the signal's origin point is moving.

---

## MODULE 4: BROWSER ML RUNTIMES

*Running ML models in the browser with TensorFlow.js and ONNX Runtime.*

### Narrative

Torres takes the lead. She challenges Park to get the classifier running on the ship's browser-based dashboard with real performance requirements.

> **TORRES:** "The bridge crew needs this in their UI, not a Python notebook. Your model is 400 MB. The browser tab will crash before the first inference. We are fixing this."

Park discovers the joy and pain of browser ML — the freedom of client-side inference versus the constraints of browser memory, single-threaded JavaScript, and the cold-start problem of loading large models.

**Unique content:** Park compares TensorFlow.js, ONNX Runtime Web, and raw WebAssembly runtimes. Each has tradeoffs: TF.js has the best ecosystem, ONNX has the best interop with Python-trained models, and WASM offers the most control. Torres makes Park benchmark all three.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Why the Browser? | Advantages of client-side inference | Client-side rendering vs SSR tradeoffs |
| 2 | TensorFlow.js Setup | Loading and configuring TF.js | Adding a dependency with `npm install` |
| 3 | Model Loading | Fetching and initializing a pre-trained model | `fetch()` → `response.json()` pattern |
| 4 | Inference Pipeline | Running predictions in real time | Event handler → process → render cycle |
| 5 | ONNX Runtime Web | Alternative runtime, model interop | Polyfills and cross-browser compat |

**FE BRIDGE (Module-Level):** Browser ML runtimes are like frontend frameworks — React vs Vue vs Svelte. Each provides the same core capability (rendering UI / running inference) with different APIs, different performance profiles, and different ecosystems. TF.js is React (largest ecosystem, most resources). ONNX is Vue (pragmatic, great interop). Raw WASM is Svelte (most control, least abstraction).

**Inter-Lesson Hook:** The browser runtime handles real-time inference — then three signals arrive simultaneously.

### GITHUB

**Commit:** `feat(m4): browser runtime comparison — TF.js, ONNX, WASM benchmarks`
**Branch:** `module-04/browser-runtimes`
**Files:**
- `src/runtime/tfjs-adapter.ts`
- `src/runtime/onnx-adapter.ts`
- `src/runtime/wasm-adapter.ts`
- `src/runtime/benchmark.ts`
- `src/runtime/model-loader.ts`
- `tests/runtime/benchmark.test.ts`

**Cliffhanger:** DEEP SCAN, now running in the browser dashboard, misclassifies cosmic background noise as a signal pattern. Torres: "If it cannot tell noise from data, it is useless. Fix it."

---

## MODULE 5: SIGNAL PROCESSING

*Frequency-domain analysis for deeper signal understanding.*

### Narrative

Dr. Sato discovers hidden sub-bands in the signals. "There is structure here we are missing in the time domain." She introduces Park to signal processing: the Fourier Transform, spectrograms, and the idea that every signal has two representations — time and frequency.

> **SATO:** "Think of a chord on a piano. The FFT tells you which individual notes make up that chord. We need to decompose these signals the same way."

Park builds a spectrogram visualizer and feeds FFT features into the classifier. Accuracy jumps from 78% to 87%.

**Unique content:** Park implements FFT (Fast Fourier Transform), STFT (Short-Time Fourier Transform), windowing functions (Hamming, Hanning, Blackman), and digital filtering (low-pass, high-pass, band-pass). He learns that windowing prevents spectral leakage, and that the choice of window function is a tradeoff between frequency resolution and spectral leakage — just like responsive design is a tradeoff between fidelity and performance.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Time vs Frequency | Two views of the same signal | DOM vs CSSOM — two views of the page |
| 2 | Fourier Transform | Decomposing signals into frequencies | CSS animation decomposition (`@keyframes`) |
| 3 | Spectrograms | Visualizing frequency over time | DevTools waterfall / performance timeline |
| 4 | FFT as Features | Using frequency bins as model input | Computing derived state for components |
| 5 | Windowing & Overlap | Handling signal chunks | Virtual scrolling / windowed rendering |

**FE BRIDGES (Module-Level):**
- **CSS animation decomposition:** A `@keyframes` rule decomposes motion into discrete steps. FFT decomposes a waveform into discrete frequency components. Both take something continuous and express it as a sum of simpler parts.
- **DevTools waterfall:** The Chrome DevTools performance waterfall shows events distributed across time — exactly what a spectrogram shows for frequency content. Time on the x-axis, frequency (or event type) on the y-axis, intensity as color.

**Inter-Lesson Hook:** The FFT decomposition reveals the expected stellar harmonics... plus one frequency that shouldn't be there.

### Shared Core

Covers signal processing fundamentals shared with audio/signal themes: sampling theorem, Nyquist frequency, aliasing, spectral analysis, filter design.

### GITHUB

**Commit:** `feat(m5): FFT pipeline with spectrogram visualization and frequency-domain features`
**Branch:** `module-05/signal-processing`
**Files:**
- `src/signal/fft.ts`
- `src/signal/stft.ts`
- `src/signal/windowing.ts`
- `src/signal/filters.ts`
- `src/visualization/spectrogram.ts`
- `tests/signal/fft.test.ts`

**Cliffhanger:** The frequency analysis reveals a pattern too regular to be natural. Dr. Sato whispers: "That's not noise. That's structure."

---

## MODULE 6: RECURRENT NETWORKS

*Modeling sequences and temporal dependencies in signal data.*

### Narrative

Signals start showing temporal patterns — a rhythm. Sato is excited:

> **SATO:** "This is not random noise. Something is repeating. The pattern spans dozens of time steps — our feedforward network only sees one snapshot at a time. We need a model with memory."

Park builds an LSTM (Long Short-Term Memory) network to predict the next signal values. The predictions are eerily accurate.

**Unique content:** Park implements three recurrent architectures — vanilla RNNs, LSTMs, and GRUs (Gated Recurrent Units). He learns the vanishing gradient problem firsthand when his simple RNN fails on long sequences, motivating the LSTM's gate mechanism. GRUs are introduced as the "lighter" alternative — fewer parameters, often comparable performance.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Sequences Matter | Why order matters in signal data | Array order in rendering lists (React keys) |
| 2 | Simple RNNs | Recurrent connections and hidden state | `useReducer` — state depending on previous state |
| 3 | LSTM Gates | Long Short-Term Memory architecture | `localStorage` with TTL — selective persistence |
| 4 | Sliding Windows | Preparing sequential input batches | `IntersectionObserver` viewport sliding |
| 5 | Sequence Prediction | Predicting next signal values | Autocomplete / typeahead suggestions |

**FE BRIDGES (Module-Level):**
- **Redux state management:** A Redux reducer is a recurrent function — it takes previous state and a new action, and produces updated state. RNNs do exactly this: `newState = f(prevState, newInput)`. The hidden state of an RNN is the Redux store.
- **localStorage with TTL:** LSTMs have a forget gate that decides what to keep and what to discard — like a cache with time-to-live. Some memories are worth keeping (long-term patterns); others should expire (short-term noise).

**Inter-Lesson Hook:** The LSTM remembers the anomalous pattern from 72 hours ago. It's happening again.

### Shared Core

Covers sequence modeling fundamentals shared across themes: vanishing/exploding gradients, gate mechanisms (forget, input, output), bidirectional RNNs, sequence-to-sequence architectures.

### GITHUB

**Commit:** `feat(m6): LSTM/GRU temporal models for sequence prediction`
**Branch:** `module-06/recurrent-networks`
**Files:**
- `src/model/rnn.ts`
- `src/model/lstm.ts`
- `src/model/gru.ts`
- `src/data/sliding-window.ts`
- `src/prediction/sequence.ts`
- `tests/model/lstm.test.ts`

**Cliffhanger:** The LSTM predicts the anomalous signal will repeat in exactly 47 minutes. The crew waits in silence. At 47 minutes and 3 seconds — it arrives.

---

## MODULE 7: ANOMALY DETECTION

*Finding the signal that does not belong.*

### Narrative

The midpoint twist. DEEP SCAN's anomaly detector fires on a signal that does not match any known category. The reconstruction error is off the charts.

> **TORRES:** "Either our model is broken, or..."
> **SATO:** (finishing the sentence) "...or we found something new."

Okafor convenes the crew. The unknown signal has a structure that is unlike anything in the training data — it is too regular to be natural but does not match any known artificial pattern.

**Unique content:** Park builds an autoencoder — a neural network that learns to compress and reconstruct "normal" signals. When a new signal has high reconstruction error, it is flagged as anomalous. Park also implements an isolation forest as a complementary approach — instead of modeling normality, it directly isolates outliers by randomly partitioning the feature space.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Normal vs Anomalous | Defining what "normal" looks like | Baseline performance metrics |
| 2 | Autoencoders | Learning to compress and reconstruct | `gzip` compression — lossy reconstruction |
| 3 | Reconstruction Error | Measuring deviation from normal | `git diff` — what changed from the baseline? |
| 4 | Threshold Tuning | Setting sensitivity for alerts | Alert thresholds in monitoring dashboards |
| 5 | The Anomaly | DEEP SCAN flags an unclassifiable signal | Error boundary catching an unexpected throw |

**FE BRIDGE (Module-Level):** `git diff` is the perfect analogy for reconstruction error. An autoencoder learns to encode and decode "normal" data. When it encounters something anomalous, the decode (reconstruction) does not match the original — just like `git diff` shows you what changed from the expected baseline. Large diffs = large reconstruction error = anomaly.

### Shared Core

Covers anomaly detection fundamentals shared across themes: autoencoders (vanilla, variational), isolation forests, one-class SVM, reconstruction error thresholding, precision-recall tradeoffs for anomaly systems.

### GITHUB

**Commit:** `feat(m7): autoencoder + isolation forest anomaly detection pipeline`
**Branch:** `module-07/anomaly-detection`
**Files:**
- `src/model/autoencoder.ts`
- `src/model/isolation-forest.ts`
- `src/anomaly/detector.ts`
- `src/anomaly/threshold.ts`
- `src/visualization/reconstruction.ts`
- `tests/anomaly/detector.test.ts`

**Cliffhanger:** The mathematical structure embedded in the anomaly mirrors the Fibonacci sequence — the same sequence used in the Archimedes' own sensor calibration algorithm. Sato's hands are shaking. "It's not just structured. It's structured like *us*."

---

## MODULE 8: ADVANCED TIME-SERIES

*Forecasting and advanced temporal modeling.*

### Narrative

The crew attempts to predict the anomalous signal's next occurrence. Park builds increasingly sophisticated forecasting models. When the signal repeats exactly when predicted — the crew confirms it is structured, not random.

> **SATO:** "If we can predict it, it has structure. If it has structure, it is not noise. And if it is not noise..."

> **OKAFOR:** "Then someone — or something — is sending it."

**Unique content:** Park implements Temporal Convolutional Networks (TCNs) as an alternative to LSTMs — faster to train, parallelizable, and often more accurate for long-range dependencies. He builds a Kalman filter for state estimation under noise, and implements Dynamic Time Warping (DTW) to compare signal patterns that may be stretched or compressed in time.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Beyond LSTM | Attention mechanisms for sequences | CSS `:focus` — context-aware highlighting |
| 2 | Temporal Attention | Attending to relevant time steps | `scrollIntoView()` — focusing on what matters |
| 3 | Forecasting | Predicting future signal behavior | Predictive prefetching (`<link rel="prefetch">`) |
| 4 | Kalman Filters | State estimation under noise | Exponential moving average in analytics |
| 5 | Ensemble Methods | Combining multiple models | Micro-frontends — multiple apps, one view |

**FE BRIDGES (Module-Level):**
- **CSS `:focus`:** Attention mechanisms in neural networks work like CSS `:focus` — they dynamically highlight the most relevant elements based on context. When you tab through a form, `:focus` moves to the active element. When a temporal attention model processes a sequence, it assigns "focus" to the most relevant time steps.
- **Exponential moving average:** Kalman filters maintain a running estimate of the true state, smoothing out noise. This is exactly what an exponential moving average does in analytics — `smoothed = alpha * newValue + (1 - alpha) * smoothed`. Both are recursive estimators that balance responsiveness against stability.

### Shared Core

Covers advanced temporal modeling shared across themes: attention mechanisms, multi-head attention, temporal convolutions, state-space models, ensemble techniques (bagging, boosting, stacking).

### GITHUB

**Commit:** `feat(m8): TCN + Kalman filter + DTW for advanced time-series forecasting`
**Branch:** `module-08/advanced-time-series`
**Files:**
- `src/model/tcn.ts`
- `src/model/attention.ts`
- `src/forecast/kalman.ts`
- `src/forecast/dtw.ts`
- `src/forecast/ensemble.ts`
- `tests/forecast/kalman.test.ts`

**Cliffhanger:** The time-series model predicts the signal will repeat at a specific time. It does not. The crew learns about non-stationary data — and realizes the signal's timing is *changing*.

---

## MODULE 9: LLM INTEGRATION

*Adding language model capabilities to DEEP SCAN.*

### Narrative

Okafor needs to transmit findings to Earth Command. The report must be precise, structured, and grounded in the data. Sato suggests using an LLM to help generate and verify scientific reports from DEEP SCAN's data — not to replace human analysis, but to accelerate it.

> **SATO:** "We have 47 days of signal data, 12,000 classified signals, and one anomaly that could change everything. I cannot write a comprehensive report in the 6 hours before the next transmission window. But I can guide a language model to draft one."

Park integrates LLM capabilities into DEEP SCAN: prompt engineering for signal analysis queries, RAG (Retrieval-Augmented Generation) over the signal log database, and a multi-model pipeline that combines the signal classifier with a language model for natural language querying.

**Unique content:** Park builds a RAG pipeline that indexes classified signals, allowing the crew to ask natural language questions like "Show me all anomalous signals in Band-7 from the last 72 hours with confidence below 60%." The LLM retrieves relevant signals, synthesizes a response, and cites its sources.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | LLMs for Science | Using language models as reasoning tools | AI-assisted code completion (Copilot) |
| 2 | Prompt Engineering | Crafting effective prompts for analysis | Writing effective search queries |
| 3 | RAG for Signals | Retrieval-augmented generation over signal logs | Server Components with DB queries |
| 4 | Report Generation | Auto-generating scientific reports | Template rendering engines |
| 5 | Multi-Model Systems | Orchestrating signal + language models | Micro-service orchestration in the frontend |

### Shared Core

Covers LLM integration fundamentals shared across themes: tokenization, embedding, prompt design, RAG architecture, multi-model orchestration, hallucination mitigation, output validation.

### GITHUB

**Commit:** `feat(m9): LLM integration with RAG pipeline for signal analysis and reporting`
**Branch:** `module-09/llm-integration`
**Files:**
- `src/llm/prompt-templates.ts`
- `src/llm/rag-pipeline.ts`
- `src/llm/report-generator.ts`
- `src/llm/multi-model.ts`
- `src/data/signal-index.ts`
- `tests/llm/rag-pipeline.test.ts`

**Cliffhanger:** ARIA generates a response using the signal's own encoding pattern. The ship falls silent, waiting.

---

## MODULE 10: OPTIMIZATION & EDGE

*Making DEEP SCAN production-ready for constrained environments.*

### Narrative

Torres's module. She has been waiting for this.

> **TORRES:** "Your model works. Now make it fast. The bridge dashboard has 512 MB of RAM. Your model alone is 340 MB. Do the math."

Park learns to quantize (reduce numerical precision from 32-bit to 8-bit), prune (remove weights that contribute little to accuracy), and distill (train a small model to mimic a large one). The model shrinks from 340 MB to 42 MB with only 2% accuracy loss.

The optimization work is no longer academic. Remaining fuel reserves limit compute time — the ship's reactor powers both the engines and the compute cluster, and every unnecessary training epoch is fuel the crew needs to get home. Okafor has posted the fuel gauge on the bridge dashboard next to the DEEP SCAN metrics. The two numbers move in opposite directions.

> **TORRES:** (grudgingly) "Not bad, for a frontend dev."

**Unique content:** Park implements post-training quantization (PTQ) and quantization-aware training (QAT). He builds a pruning pipeline that removes 60% of weights while maintaining 94% of accuracy. He distills the full DEEP SCAN model into a lightweight "student" model that runs inference in under 5ms.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Model Profiling | Measuring inference speed and memory | Chrome DevTools Performance tab |
| 2 | Quantization | Reducing model precision for speed | Image compression (PNG to WebP) |
| 3 | Pruning | Removing unnecessary weights | Tree-shaking unused code |
| 4 | Caching Strategies | Storing results for repeated queries | Service Worker caching strategies |
| 5 | WebGPU Acceleration | Using GPU compute in the browser | `<canvas>` WebGL rendering pipeline |

### Shared Core

Covers optimization fundamentals shared across themes: profiling, quantization (PTQ, QAT), pruning (structured, unstructured), knowledge distillation, caching (memoization, LRU), hardware acceleration (WebGPU, WebGL, WASM SIMD).

### GITHUB

**Commit:** `feat(m10): quantization + pruning + distillation — 340MB to 42MB`
**Branch:** `module-10/optimization`
**Files:**
- `src/optimization/quantize.ts`
- `src/optimization/prune.ts`
- `src/optimization/distill.ts`
- `src/optimization/profiler.ts`
- `src/runtime/webgpu-backend.ts`
- `tests/optimization/quantize.test.ts`

**Cliffhanger:** Fuel reserves hit critical. Okafor gives the order: "We have 72 hours to decode this signal or we turn for home."

---

## MODULE 11: CAPSTONE — DEPLOY DEEP SCAN

*Full deployment of the completed signal classification system.*

### Narrative

Park deploys the final DEEP SCAN system. Everything the crew has built across 10 modules comes together: the preprocessing pipeline, the neural network classifier, the FFT feature extractor, the LSTM sequence predictor, the autoencoder anomaly detector, the attention-based forecaster, the LLM reporting system, and the optimized runtime. All deployed to a static site on GitHub Pages.

DEEP SCAN classifies the anomalous signal definitively. The crew stares at the output in silence.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | System Architecture | Designing the full deployment | Production architecture diagram |
| 2 | CI/CD Pipeline | Automated testing and deployment | GitHub Actions workflow |
| 3 | Monitoring | Tracking model performance in production | Application monitoring (Sentry, DataDog) |
| 4 | Documentation | Documenting the system for the crew | README, API docs, JSDoc |
| 5 | Launch | Deploying DEEP SCAN to GitHub Pages | `npm run deploy` — the final ship |

### CONSEQUENCE

The final classification result appears on every screen on the bridge. The anomalous signal contains a mathematical structure that mirrors the Fibonacci sequence — the same recursive ratio used in the Archimedes' own sensor calibration algorithm. Not a coincidence of mathematics. A reflection. Whatever sent this signal used a pattern that only makes sense if the source has been observing the ship's transmissions.

> **OKAFOR:** "What am I looking at, Dr. Sato?"

> **SATO:** "Fibonacci ratios. 1, 1, 2, 3, 5, 8, 13... encoded as pulse-interval proportions. But that is not the unsettling part." She pulls up the Archimedes' own calibration spec. "These ratios match our sensor calibration harmonics exactly — the same coefficients, the same convergence pattern. This signal was not just sent. It was composed *for us*."

Silence on the bridge. Torres is the first to speak.

> **TORRES:** "Could it be echo? Our own calibration signal bouncing off something?"

> **ARIA:** "Negative, Chief. I have modeled every reflection scenario. The signal originates 4.2 light-years from our position and has been repeating for a minimum of 340 years — long before the Archimedes was built. The calibration pattern match implies the source has been observing our transmissions since we entered the system and adapted its signal accordingly."

> **SATO:** "Or — the Fibonacci structure is a natural phenomenon and the calibration match is coincidence. Phyllotaxis, shell spirals, branching patterns — Fibonacci appears in nature constantly."

> **PARK:** "So which is it? Are we being watched, or are we seeing patterns because we want to?"

> **OKAFOR:** (long pause) "Send it to Earth. All of it. Every data point, every model weight, every analysis. Both hypotheses. Let them verify independently. We do not get to decide this alone."

The Archimedes turns for home. But the signal keeps transmitting. And now, DEEP SCAN is listening — and the crew cannot stop wondering whether something is listening back.

### GITHUB

**Commit:** `feat(m11): DEEP SCAN v1.0 — full system deployed to GitHub Pages`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/deep-scan-signal-classifier`
**Files:**
- `src/system/architecture.ts`
- `.github/workflows/deploy.yml`
- `src/monitoring/dashboard.ts`
- `docs/api.md`
- `docs/architecture.md`
- `package.json` (deploy script)
- All previous module files integrated

### ANIMATION

Final animation: the bridge of the Archimedes. Every holographic display shows a different facet of DEEP SCAN — the spectrogram, the classification feed, the anomaly detector, the sequence predictor. At the center, the Fibonacci spiral pulses in gold against the deep space backdrop, its ratios mirroring the ship's own calibration harmonics. The camera pulls back through the bridge viewport to show the Archimedes against the star field of Kepler-442. The DEEP SCAN logo resolves one final time. Text: **"DEEP SCAN v1.0 — Signal Classified. Mission Continues."**

---

## AI-Wrong Moments

These are specific narrative beats where DEEP SCAN fails, teaching the crew (and the learner) that ML systems are fallible.

1. **M4 — False Signal Classification:** DEEP SCAN, now running in the browser, misclassifies cosmic background noise as a signal pattern. The crew wastes hours investigating nothing. Torres is furious. Park learns about the difference between training accuracy and real-world performance — and the cost of false positives.

2. **M8 — Failed Prediction:** The time-series model predicts the anomalous signal will repeat at a specific time. It does not. The crew stares at empty readouts. Sato explains non-stationary data: "The signal's timing is changing. Our model assumed the future would look like the past. It will not always." Park retrains with a model that accounts for temporal drift.

---

## Character Arcs — Chief Torres (Skeptic)

Torres's arc traces a pragmatic engineer learning to trust ML — not blindly, but through evidence.

1. **M3 — Grudging Admission:** After the neural network reaches 78% accuracy on signal classification, Torres grudgingly admits the model caught a subtle pattern in the sensor data that her rule-based filters missed. She does not celebrate — but she stops actively dismissing the approach.

2. **M5 — Volunteering:** When Sato needs someone to calibrate the signal filters for the FFT pipeline, Torres volunteers. "If this frequency analysis is going to run on my ship, I want the filters tuned properly." This is the first time she proactively contributes to the ML effort.

3. **M7 — Defending the Model:** When the anomaly detector flags the unknown signal and Okafor questions whether to trust it, Torres surprises everyone by defending the model's classification. "The reconstruction error is off the charts. I have checked the sensor calibration three times. This is not instrument noise — the model is right."

4. **M10 — Full Advocate:** Torres suggests using ML for fuel optimization — an area she previously considered sacred engineering territory. "If the model can compress from 340 MB to 42 MB with 2% accuracy loss, it can probably find efficiencies in our fuel burn calculations too." Park and Sato exchange a look. Torres has come around.

---

## Theme-Specific Terminology

| Term | In-World Meaning | ML Meaning |
|---|---|---|
| Signal Band | Frequency range of incoming transmission | Feature channel |
| Telemetry Feed | Real-time sensor data stream | Training data pipeline |
| Scan Profile | A trained model configuration | Model checkpoint |
| Noise Floor | Background interference level | Baseline loss |
| Deep Scan | Full-spectrum signal analysis | Multi-layer inference |
| Anomaly Spike | Unexpected signal pattern | High reconstruction error |
| Burn Cycle | Model training run | Training epoch |
| Array Lock | Sensor array focused on target | Attention mechanism focus |
| Signal Decay | Weakening transmission over time | Gradient vanishing |
| Resonance Map | Frequency decomposition visualization | Spectrogram / feature map |
| Pulse Sync | Temporal alignment of signals | Sequence alignment |
| Core Dump | Exporting model state | Model serialization |
| Transmission Window | Time available for communication | Inference latency budget |
| Orbit Correction | Adjusting ship trajectory | Learning rate adjustment |
| Fuel Reserve | Remaining compute budget | GPU/memory headroom |
