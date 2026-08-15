# Tensorcraft — Product Plan v3.3

> **⚠ V1 launch-scope revert (2026-05-05):** Only **Deep Orbit** ships at V1.
> The other 4 worlds (Neon Protocol, Signal Ward, Nova Canvas, Terra Grid)
> are gated to "coming soon" stub pages with email-capture waitlists. See
> [`launch-scope.md`](./launch-scope.md) for the authoritative spec. Where
> this document still says "five worlds," "275 lessons," "all worlds
> simultaneously," or describes pricing tiers for 2-/3-/all-bundle, treat
> those statements as describing the **post-V1 roadmap** rather than the V1
> product. The shipped V1 surface is **1 world / 11 modules / 55 lessons /
> 1 capstone / ~65 exercises / single-world purchase only**.

---

## Part 1: Product Overview

### 1.1 What Tensorcraft Is

Tensorcraft is an **interactive, story-driven machine learning education platform** designed specifically for frontend developers transitioning into ML/AI roles. Rather than offering a single monolithic course, Tensorcraft delivers focused learning through **per-model purchases at $59 each**, organized around five immersive worlds.

Each world places the learner inside a narrative world where they build a real ML model from scratch — not by copying tutorials, but by making decisions that shape both the story and the model. The platform combines cinematic storytelling, hands-on coding, and conceptual bridges from frontend development to make ML deeply intuitive for web developers.

**Core Principles:**

- **Story-driven**: Every lesson unfolds within a narrative arc. Learners don't just study ML — they experience it.
- **Interactive**: Concepts are taught through interactive animations, code challenges, and decision points — not passive video.
- **Per-model purchases**: Each world is purchased independently at **$59**, allowing learners to start with what excites them most.
- **Five worlds**: Each world teaches all ML fundamentals while specializing in a distinct area of machine learning.

### 1.2 The Five Worlds

| World | World | Specialization | Model Built | Relevant Career Paths | Salary Range |
|-------|-------|---------------|-------------|----------------------|--------------|
| **Deep Orbit** | Space exploration & celestial navigation | Time-series & signals | Multi-stage signal classifier for anomaly detection | ML-Enhanced Frontend Engineer, Time-Series Specialist | $120K–$160K |
| **Neon Protocol** | Cyberpunk city & digital underworld | Real-Time Computer Vision | Real-time surveillance detection system | ML-Enhanced Frontend Engineer, Computer Vision Specialist | $120K–$160K |
| **Signal Ward** | Medical research station & clinical NLP | NLP & Text Intelligence | Clinical text analysis and decision support system | ML-Enhanced Frontend Engineer, NLP Specialist | $120K–$160K |
| **Nova Canvas** | Art colony & generative design studio | Multimodal & Generative AI | Real-time multimodal creative installation | ML-Enhanced Frontend Engineer, Creative Technologist | $120K–$160K |
| **Terra Grid** | Industrial infrastructure & edge computing | Edge AI & production ML | Distributed edge anomaly detection system | ML-Enhanced Frontend Engineer, Edge ML Specialist | $120K–$160K |

**Every world teaches ALL ML fundamentals.** Regardless of which world a learner starts with, they will cover:

- Data preprocessing and feature engineering
- Model architecture and design decisions
- Training loops, loss functions, and optimization
- Evaluation metrics and validation strategies
- Overfitting, underfitting, and regularization
- Gradient descent and backpropagation
- Hyperparameter tuning
- Model deployment fundamentals

The specialization (roughly 40% of each curriculum) goes deeper into the world's domain, but the shared core (60%) ensures every learner gets a complete ML foundation.

### 1.3 Launch Strategy

**All 5 worlds launch simultaneously at V1.0.** There is no phased world rollout. Every world (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) ships with all 11 modules (55 lessons each, 275 lessons total) at V1.0.

| Version  | Content                                                  | Timing  | Status         |
|----------|----------------------------------------------------------|---------|----------------|
| **V0.5** | All 5 worlds — Modules 1–3 (15 lessons each, free tier)  | Q2 2026 | In development |
| **V1.0** | All 5 worlds — Full 11 modules each (275 lessons total)  | Q3 2026 | Planned        |

### 1.4 World Concept Disclaimers

Each world teaches all ML fundamentals plus its own specialization. Below is the full "What You'll Learn" breakdown for every world.

#### Deep Orbit — What You'll Learn

**Fundamentals (shared across all worlds):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Deep Orbit):**

- Signal processing fundamentals (FFT, frequency domain analysis)
- Time-series representation and preprocessing
- Spectrograms and temporal feature extraction
- Recurrent neural networks (RNN) for sequential data
- LSTM/GRU architectures for long-term dependencies
- Attention mechanisms applied to time-series
- Anomaly detection in signals (autoencoders, scoring)
- Browser ML runtimes (TensorFlow.js, ONNX Runtime Web, WebGPU)
- Model quantization, pruning, and distillation
- Real-time inference and signal classification pipelines
- Multi-stage classifier design (DEEP SCAN)
- Space telemetry domain knowledge and astronomical datasets

#### Neon Protocol — What You'll Learn

**Fundamentals (shared across all worlds):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Neon Protocol):**

- Image representation (pixels, channels, color spaces)
- Convolutional neural networks (kernels, pooling, feature maps)
- Object detection (anchor boxes, IoU, NMS, YOLO architecture)
- Image segmentation (semantic, instance, U-Net encoder-decoder)
- Feature extraction and embedding spaces
- Transfer learning from pre-trained vision models
- Real-time video processing and WebGL acceleration
- Generative adversarial networks (GANs) for counter-surveillance
- Adversarial robustness and ethical guardrails
- Model optimization for real-time video inference
- Edge deployment of computer vision systems
- Surveillance detection domain knowledge

#### Signal Ward — What You'll Learn

**Fundamentals (shared across all worlds):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Signal Ward):**

- Text tokenization (word, subword/BPE, medical-specific)
- Word embeddings (one-hot encoding, Word2Vec, domain-specific)
- Sequence models (RNNs, LSTMs, bidirectional)
- Attention mechanisms and self-attention
- Transformer architecture and BERT fine-tuning
- Named Entity Recognition (BIO tagging, relationship extraction)
- Text classification and clinical triage
- Retrieval-Augmented Generation (RAG) pipelines
- Negation detection and temporal reasoning in clinical text
- Production NLP deployment with privacy/fairness guardrails
- Medical ontologies and domain-specific NLP challenges
- Human-in-the-loop design for safety-critical AI

#### Nova Canvas — What You'll Learn

**Fundamentals (shared across all worlds):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Nova Canvas):**

- Generative models vs. discriminative models
- Probability distributions and sampling
- Latent spaces, dimensionality, and interpolation
- Generative adversarial networks (generator vs. discriminator)
- Variational autoencoders (VAE) and reparameterization trick
- Diffusion models (forward noise, reverse denoising)
- Classifier-free guidance for conditional generation
- Style transfer (content vs. style separation)
- Multimodal learning (vision-language alignment, CLIP)
- Audio generation and audio-visual synchronization
- Real-time generation optimization and model distillation
- Creative AI philosophy (authorship, artistic authenticity)

#### Terra Grid — What You'll Learn

**Fundamentals (shared across all worlds):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Terra Grid):**

- Edge AI fundamentals (latency, privacy, offline operation)
- Model profiling and optimization strategy
- Quantization (post-training, quantization-aware training, mixed precision)
- Pruning (weight, structured) and knowledge distillation
- Edge deployment targeting and over-the-air updates
- ML pipelines (data versioning, experiment tracking, model registry)
- Production monitoring and drift detection (data drift, model drift)
- Federated learning (federated averaging, privacy preservation, secure aggregation)
- A/B testing models (traffic splitting, statistical significance, canary deployments)
- Scale and reliability (failover, redundancy, load management)
- Adversarial robustness in production
- Global MLOps at scale across distributed infrastructure

### 1.5 Career Outcomes

Tensorcraft produces **ML-Enhanced Frontend Engineers** — developers who can build ML-powered features, deploy pre-trained models in the browser, evaluate ML solutions, and collaborate fluently with data science teams.

**Realistic career positioning:**

- **Target role:** ML-Enhanced Frontend Engineer / Frontend Engineer with ML Specialization ($120K-$160K)
- **57.7%** of frontend developers who complete a structured ML transition program report receiving a job offer or promotion within 6 months of completion.
- **23.9%** average salary increase reported by career-switchers who move from frontend-only roles to ML-integrated positions.

**Honest scope:** This course gives you the foundation to understand, build, and deploy ML models in the browser. For production ML engineering roles requiring Python fluency and deeper mathematics, Tensorcraft provides the conceptual foundation — and we bridge you toward those next steps (see Python Bridge module). We do not claim to replace a full ML engineering education, but we give frontend engineers a genuine, deep understanding of ML that no other resource provides in their own language and tools.

These statistics inform our marketing, pricing, and curriculum design — the $59 per-model price point is calibrated to feel trivially affordable relative to even a modest salary increase.

---

## Part 2: Pricing

### 2.1 Per-Model Pricing

| Tier | Description | Price |
|------|------------|-------|
| **Single Model** | One world, full 11 modules | $59 |
| **Two Models** | Any two worlds | $99 (save $19) |
| **Three Models** | Any three worlds | $129 (save $48) |
| **All 5 Models** | All five worlds | $159 (save $136) |

#### Upgrade Path

> **Implemented (2026-04-14):** Credit from prior purchases is calculated automatically. Adjusted price charged via Stripe. Auto-grant when credit covers full price.

Learners who purchase a single world can upgrade to a bundle at any time. The price they already paid is credited toward the bundle price. For example, a learner who bought Deep Orbit for $59 can upgrade to the Two Models tier by paying $40 ($99 – $59). This removes purchase anxiety and encourages starting with one world.

#### Purchasing Power Parity (PPP)

Tensorcraft offers PPP-adjusted pricing for learners in lower-income countries. Discounts are applied automatically based on IP geolocation and range from 20% to 60% depending on the country. PPP pricing is available for individual purchases only (not team licenses). The PPP discount tiers are:

- **Tier A (20% off):** Countries with moderate purchasing power gaps (e.g., parts of Eastern Europe, Latin America)
- **Tier B (40% off):** Countries with significant purchasing power gaps (e.g., parts of Southeast Asia, North Africa)
- **Tier C (60% off):** Countries with large purchasing power gaps (e.g., parts of Sub-Saharan Africa, South Asia)

#### Team Pricing (Future Phase)

Team and enterprise pricing (5-seat, 10-seat, and site licenses) will be introduced after V1.0 launch when demand from engineering managers is validated. Pricing will be determined based on early enterprise inquiries and competitive analysis. Not included in V0.5 or V1.0 scope.

### 2.2 Revenue Projections

*Revenue projections removed — will be revisited with real data after launch.*
**Optimistic estimate (1.2x multiplier on units): $3,594,000**
**High-growth estimate (1.8x multiplier on units + Arena expansion + Team pricing): $5,400,000+**

Combined range: **$3.0M–$5.4M** over 3 years.

#### Year 4–5 Note

Years 4–5 projections are not included in this plan. Revenue growth in those years will depend on factors not yet determined: international expansion, corporate training partnerships, potential platform licensing, and whether a subscription model supplements or replaces per-model purchases. These decisions will be revisited after Year 2 data is available.

#### Arena

The **Tensorcraft Arena** is a competitive practice environment available for **$29/year** (subscription). Arena provides:

- Weekly ML challenges drawn from all five worlds
- Leaderboard rankings with ELO-style scoring
- Community solutions and discussion
- Seasonal tournaments with prizes
- Access requires owning at least one world

Arena is designed as a retention and engagement mechanism, not a primary revenue driver. It keeps learners active between world purchases and builds community.

---

## Part 3: Storytelling and Format

### 3.1 The 5C Loop

Every lesson in Tensorcraft follows the **5C Loop** — a repeating pedagogical structure that interleaves narrative and technical learning. The loop is:

1. **Context** — Set the narrative scene. What's happening in the story? What problem does the character face?
2. **Concept** — Introduce the ML concept. Use the FE-to-ML bridge to connect it to something the learner already knows.
3. **Code** — Hands-on coding exercise. The learner writes real code to implement the concept.
4. **Challenge** — A stretch problem that tests deeper understanding. Often involves a decision point in the story.
5. **Consequence** — Show the result of the learner's code/decisions in the narrative. The story progresses based on their work.

#### 5C Variations by World

| World | Context Style | Concept Bridge | Code Environment | Challenge Type | Consequence Style |
|-------|--------------|---------------|-----------------|---------------|------------------|
| **Deep Orbit** | Mission briefings, sensor readings, crew dialogue | Signal processing & event-loop analogies, streaming data metaphors | Sandpack editor with TensorFlow.js signal processing | Detect anomalies in deep-space signal data under time pressure | Ship navigation changes, crew reactions, mission outcomes |
| **Neon Protocol** | Surveillance footage, underground contacts, digital noir | Canvas/WebGL & visual processing analogies, pixel-level metaphors | Sandpack editor with TensorFlow.js image/video processing | Detect surveillance drones, identify threats in video feeds | Cover is maintained or blown, resistance succeeds or fails |
| **Signal Ward** | Patient cases, clinical notes, research briefings | URL parsing & i18n analogies, text processing metaphors | Sandpack editor with TensorFlow.js text classification | Classify clinical text, extract entities, answer medical queries | Patient outcomes, diagnostic accuracy, ethical dilemmas |
| **Nova Canvas** | Gallery exhibitions, art critiques, creative briefs | Math.random() & CSS transitions analogies, generative metaphors | Sandpack editor with TensorFlow.js generative models | Generate art that meets specific aesthetic criteria | Art is celebrated or criticized, installation succeeds or fails |
| **Terra Grid** | Field reports, sensor networks, infrastructure alerts | CDN & CI/CD analogies, deployment & monitoring metaphors | Sandpack editor with TensorFlow.js edge inference | Deploy reliable ML to edge devices across harsh conditions | Infrastructure holds or fails, communities protected or at risk |

### 3.2 Assessment and Feedback Loops

#### 3.2.1 In-Lesson Checks

Each lesson contains 2–3 lightweight knowledge checks embedded in the narrative. These are not graded but provide immediate feedback. Examples: multiple-choice questions phrased as story decisions, drag-and-drop concept matching, fill-in-the-blank code completion.

#### 3.2.2 Module Capstone Projects

Each module (containing ~5 lessons) ends with a capstone project. The capstone is a larger coding exercise that synthesizes everything from the module. It is graded automatically and provides detailed feedback on:

- Code correctness
- Model performance (metrics)
- Code quality and style
- Conceptual understanding (based on decision points)

#### 3.2.3 Progress Tracking

Learners see a visual progress map (see Section 3.4) showing:

- Completed modules and lessons
- Current position in the narrative arc
- Model performance metrics over time
- Concept mastery indicators (based on challenge scores)

#### 3.2.4 Spaced Repetition

Key concepts are revisited across modules using spaced repetition principles. A concept introduced in Module 2 may reappear as a story element in Module 6, requiring the learner to apply it in a new context. This is built into the narrative structure, not delivered as flashcards.

#### 3.2.5 Peer Comparison (Arena Only)

Arena participants see anonymized peer comparisons: how their solution compares to the community in terms of model performance, code efficiency, and approach diversity. This is opt-in and only available to Arena subscribers.

#### 3.2.6 Completion Certificates

Upon completing all 11 modules in a world, learners receive a verifiable completion certificate. The certificate is auto-generated on the capstone page via `POST /api/certificates` and publicly retrievable (no auth) via `GET /api/certificates/:id` for verification. It includes:

- World name and specialization
- Completion date
- Capstone project summary and final model metrics
- A unique verification URL
- GitHub repository link (if integrated)

### 3.3 The FE-to-ML Concept Bridge

The FE-to-ML Concept Bridge is Tensorcraft's signature pedagogical tool. It maps every core ML concept to a frontend development concept that the learner already deeply understands. This is not a loose analogy — each bridge identifies a **deep structural connection** between the two domains.

#### Bridge Quality Tiers

Every FE-to-ML bridge is classified into one of three quality tiers based on the depth of the structural mapping:

| Tier | Description | Example |
|---|---|---|
| **Identity** | Direct 1:1 mapping. The FE concept and ML concept are essentially the same operation. A developer who understands one already understands the other. | `Array.map()` → Tensor Operations, `CSS Grid` → Matrix Layout, `TypeScript Types` → Tensor Shapes |
| **Structural** | Same underlying pattern applied in a different domain. The shape of the problem is identical, but the context differs. Requires a small conceptual leap. | `useState()` → Model Parameters, `React Components` → Neural Network Layers, `useEffect()` → Training Loop, `fetch() API` → Data Pipeline |
| **Intuition** | Conceptual parallel that builds intuition rather than direct code equivalence. Helps learners develop mental models, but the code differs significantly. | `Event Listeners` → Loss Functions, `Redux State` → Gradient Descent, `CSS Transitions` → Learning Rate |

Bridge tiers are displayed as color-coded badges in the Bridge Explorer: Identity (cyan), Structural (purple), Intuition (amber).

#### Bridge Quality Tiers

Each bridge is classified into one of three quality tiers that indicate the strength of the FE→ML mapping:

| Tier | Description | Example |
|------|-------------|---------|
| **Identity** | The FE concept *is* the ML concept — same function, same math, different name | `Math.max(0, x)` = ReLU Activation |
| **Structural** | Same architectural pattern, different domain — deep parallel that holds under scrutiny | Overfitting = CSS that only works on your screen |
| **Intuition** | Useful starting mental model that gets refined during the lesson — accurate enough to build on | Lighthouse score → Loss Function |

The Bridge Explorer UI should display these tiers as badges on each bridge card, and allow filtering by tier.

#### Shared Bridges (All Worlds)

These 20 bridges appear across all five worlds:

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Training data | Component props | Both are external inputs that shape behavior. Props configure a component; training data configures a model. Change the props, the component renders differently. Change the data, the model learns differently. |
| 2 | Model parameters (weights) | Component state | Both are internal values that change over time based on inputs. State updates in response to user events; weights update in response to training data. Both persist across render/training cycles. |
| 3 | Loss function | `expect().toBe()` assertions | Both measure the gap between actual and expected output. A test assertion checks `actual === expected`; a loss function computes the distance between predictions and labels. Both quantify "how wrong" and drive corrections. *Tier: Structural.* |
| 4 | Gradient descent | Reconciliation | Both incrementally reduce a measured gap. Reconciliation patches the DOM toward the desired state; gradient descent adjusts weights toward lower loss. *Tier: Intuition. Caveat: Reconciliation is deterministic and complete; gradient descent is stochastic and incremental. The "reducing the gap" intuition is correct, but the dynamics differ significantly.* |
| 5 | Learning rate | Animation easing / step size | Both control how aggressively a system moves toward its target per step. A large step overshoots; a small step converges slowly. Both require tuning. *Tier: Intuition. Caveat: The mechanisms are unrelated — learning rate scales gradient magnitudes, animation easing interpolates time curves — but the "tuning speed of convergence" intuition transfers.* |
| 6 | Epochs | `requestAnimationFrame` loop | Both are repeated cycles where the system processes input and refines output. An rAF loop reruns render logic every frame; an epoch reruns training over the entire dataset. Both converge toward a target. *Tier: Structural.* |
| 7 | Batch size | Chunk/page size | Both control how much data is processed at once. Pagination loads N items per page; batch size feeds N samples per gradient update. Both balance memory and throughput. |
| 8 | Overfitting | Overspecialized component | Both are cases of being too tailored to specific inputs. An overspecialized component breaks with new data; an overfit model fails on new examples. Both need generalization. |
| 9 | Regularization | Code linting/constraints | Both impose rules that prevent overly specific or complex solutions. Linting constrains code style; regularization constrains model complexity. Both improve generalizability. |
| 10 | Feature engineering | Data transformation/mapping | Both transform raw inputs into more useful representations. Array.map transforms data for rendering; feature engineering transforms data for modeling. Both are about shaping inputs. |
| 11 | Train/test split | Dev/prod environments | Both separate the context for building from the context for evaluation. You develop in dev, test in prod; you train on training data, evaluate on test data. Mixing them gives false confidence. |
| 12 | Hyperparameters | Config/environment variables | Both are settings that control behavior but aren't learned from data. Env vars configure an app without changing code; hyperparameters configure training without being part of the model. |
| 13 | Neural network layers | Middleware/pipeline stages | Both are sequential processing steps where each transforms its input and passes the result forward. Express middleware and neural network layers are structurally identical: input → transform → output → next. |
| 14 | Activation functions (ReLU) | `Math.max(0, x)` | **Identity bridge.** ReLU is literally `Math.max(0, x)` — the same function, same math, different name. The strongest bridge in the system. Clip negative values to zero, pass positives through unchanged. |
| 15 | Backpropagation | React reconciliation (tracing diffs backward) | Both propagate information backward through a structure to determine what needs updating. React traces from changed leaves back to root; backprop traces from loss back to input weights via the chain rule. *Tier: Intuition. Caveat: The "backward flow" visual is analogous, but backprop is a mathematical operation (chain rule, partial derivatives) with no direct DOM equivalent. Use this bridge as a starting point, then teach the real math.* |
| 16 | Model inference | Server-side rendering | Both take an input and produce an output in a single forward pass, without iterative updating. SSR renders HTML from data; inference produces predictions from features. Both are "one-shot." |
| 17 | Data augmentation | Responsive design/media queries | Both create variations of the input to handle diverse conditions. Media queries adapt layouts to screen sizes; data augmentation creates training variations for robustness. Both prevent brittleness. |
| 18 | Dropout | Randomly hiding team members during practice | Both temporarily remove participants to prevent over-reliance on any single one. If one team member is always present, others depend on them; if one neuron always fires, others co-adapt. Random removal forces resilience. *Tier: Intuition. Note: This is a non-code analogy. The FE equivalent is not perfect — feature flags are deliberate, dropout is random — but the "force independence through random removal" principle transfers.* |
| 19 | Confusion matrix | Error boundary report | Both provide structured breakdowns of what went right and wrong. An error boundary catches and categorizes errors; a confusion matrix categorizes predictions vs. actuals. Both guide debugging. |
| 20 | Model deployment | CI/CD pipeline | Both are the process of taking something from development to production. CI/CD deploys code; model deployment serves a model. Both involve versioning, testing, and monitoring. |

#### Deep Orbit Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Weight initialization | CSS initial values | Both set the starting point before any updates occur. Poor initial values lead to slow convergence or broken layouts. Both require deliberate defaults. |
| 2 | Batch normalization | CSS normalize/reset | Both standardize inputs to a layer/component to prevent compounding inconsistencies. CSS resets remove browser defaults; batch norm removes distribution shift between layers. |
| 3 | Residual connections | Component composition via children | Both allow information to skip intermediate processing and pass through directly. React children pass content through wrapper components; residual connections pass activations around layers. |
| 4 | Vanishing gradients | Deeply nested callback hell | Both are problems caused by excessive depth. Deep callback nesting loses context; deep networks lose gradient signal. Both are solved by architectural shortcuts (async/await, skip connections). |
| 5 | Learning rate scheduling | Animation easing functions | Both vary the rate of change over time. Easing functions start fast and slow down (or vice versa); LR schedulers reduce the learning rate as training progresses. Both optimize the trajectory. |
| 6 | Multi-class classification | Router with multiple routes | Both take a single input and determine which of many categories it belongs to. A router maps URLs to views; a classifier maps inputs to classes. Both are selection mechanisms. |

#### Neon Protocol Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Image tensors | `canvas.getImageData()` | Both represent images as flat arrays of pixel values (RGBA channels). `Uint8ClampedArray` from `getImageData()` is literally an image tensor. Identity bridge. |
| 2 | Convolution kernels | CSS `blur()` / SVG filters | Both apply a small sliding window that transforms local regions of an image. CSS blur applies a convolution kernel to pixels; CNNs apply learned kernels to feature maps. |
| 3 | Bounding boxes | `getBoundingClientRect()` | Both define rectangular regions with x, y, width, height coordinates. DOM element bounds and object detection boxes use the same data structure. |
| 4 | Non-Max Suppression | `debounce()` | Both keep the highest-priority event and suppress redundant ones. Debounce keeps the last call; NMS keeps the highest-confidence box and removes overlapping detections. |
| 5 | Segmentation masks | SVG clip-path / CSS masks | Both create pixel-level boundaries that separate regions. CSS masks define visible/hidden areas; segmentation masks label each pixel's class. Same concept, different domain. |
| 6 | Backbone networks | Shared component libraries | Both provide reusable feature extraction that multiple downstream tasks build on. A shared UI library serves multiple apps; a backbone CNN serves multiple vision tasks (detection, segmentation, classification). |

#### Signal Ward Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Tokenization | URL parsing / route splitting | Both break continuous input into discrete structured parts. A URL parser splits `/path/:param/` into segments; a tokenizer splits text into tokens. Same operation, different input. |
| 2 | Word embeddings | i18n translation dictionaries | Both map symbolic identifiers to meaningful representations. i18n maps keys to localized strings; embeddings map tokens to dense vectors in semantic space. Both enable meaning-aware processing. |
| 3 | RNN state accumulation | `Array.reduce()` | Both process a sequence element-by-element, carrying forward an accumulated state. `reduce()` builds a result by folding over an array; RNNs build a hidden state by folding over a sequence. Identical pattern. |
| 4 | LSTM cell memory | Session storage | Both maintain persistent state across sequential processing steps that can be selectively read and updated. Session storage persists across page navigations; LSTM cells persist across timesteps. |
| 5 | Attention mechanism | Search engine ranking | Both dynamically weight inputs by relevance to a query. Search ranks documents by query relevance; attention weights tokens by relevance to each other. Both are learned relevance scoring. |
| 6 | Transformer architecture | React virtual DOM reconciliation | Both are reconciliation engines that compare current state to desired state. React's vDOM processes the component tree and computes diffs; transformers process input tokens and compute attention-weighted representations. |

#### Nova Canvas Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Sampling from distributions | `Math.random()` | Both generate values from probability distributions. `Math.random()` samples uniformly; generative models sample from learned distributions. Same operation with learned parameters. |
| 2 | Latent space interpolation | CSS transitions between states | Both create smooth intermediate values between two defined points. CSS transitions interpolate between start and end styles; latent interpolation generates smooth blends between generated outputs. |
| 3 | GAN (generator vs. discriminator) | Fuzzer vs. validator | Both are adversarial systems where one component generates and another judges. A fuzzer creates random inputs; a validator rejects bad ones. GANs formalize this into a training loop. |
| 4 | VAE (encode/decode) | URL shortener | Both compress complex data into a compact representation and reconstruct the original. A URL shortener encodes a long URL into a short code and decodes it back; a VAE encodes data into a latent vector and decodes it back. |
| 5 | Diffusion (noise → detail) | Progressive image loading | Both start with a degraded version and iteratively refine toward full quality. Progressive JPEG loads blurry-to-sharp; diffusion denoises random noise into a coherent image. Same trajectory, different domain. |
| 6 | Style transfer | CSS world switching | Both apply a different appearance to the same underlying content. CSS world switching changes colors/fonts while keeping HTML structure; style transfer changes visual style while preserving content. Same content, different presentation. |

#### Terra Grid Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Edge inference | CDN edge locations | Both move computation closer to the user/data source for lower latency. CDNs serve static assets from edge PoPs; edge ML runs inference on local devices. Same architecture, different payloads. |
| 2 | Model quantization | Image format tradeoffs (PNG vs. WebP) | Both trade precision for size/speed. PNG is lossless but large; WebP is lossy but small. Float32 is precise but heavy; Int8 is approximate but fast. Same optimization decision. |
| 3 | Weight pruning | Tree-shaking | Both remove unused parts to reduce size without changing behavior. Tree-shaking eliminates dead code; pruning eliminates near-zero weights. Same optimization, different artifact. |
| 4 | Knowledge distillation | Code splitting | Both decompose a large artifact into smaller, purpose-built pieces. Code splitting breaks a bundle into route-specific chunks; distillation transfers a large model's knowledge into a smaller, faster model. |
| 5 | ML pipeline (data → train → deploy) | CI/CD pipeline | Both are automated multi-stage pipelines that transform inputs into production artifacts. CI/CD: code → build → test → deploy. ML: data → train → evaluate → deploy. Same workflow pattern. |
| 6 | Drift detection | Lighthouse CI | Both continuously monitor a production system for degradation against baselines. Lighthouse CI flags performance regressions; drift detection flags model accuracy regressions. Same monitoring pattern. |

#### Teaching Principle

> Every FE-to-ML bridge follows the same principle: **find the structural isomorphism, not the surface similarity.** A good bridge isn't "this is kinda like that" — it's "these two things solve the same problem in the same way, in different domains." When a learner sees the bridge, they should feel recognition, not metaphor.

### 3.4 Interactive Animations — Progress Diagram

The **Progress Diagram** is a central visual element showing the learner's journey through a world's 11 modules.

#### Art Style

- **Low-poly, isometric environments** styled to each world
- Deep Orbit: starfield with orbital paths connecting stations
- Neon Protocol: cityscape with neon-lit pathways between buildings
- Signal Ward: medical facility with corridors between lab rooms
- Nova Canvas: gallery with hallways between exhibition halls
- Terra Grid: terrain map with trails between monitoring outposts

#### Active vs. Inactive States

- **Completed modules**: Fully lit, with particle effects. Color-saturated using the world's primary palette. Brutalist offset shadow on node.
- **Current module**: Pulsing border, slightly enlarged, with a beacon/marker animation. Draws the eye.
- **Upcoming modules (unlocked)**: Dimmed but visible. Silhouette/outline of the environment. Subtle idle animation (e.g., flickering light).
- **Locked modules**: Greyed out, no animation. Visible but clearly inaccessible. Silhouette only.

#### Animation Timing

- Transition between module states: 600ms ease-out
- Idle animations: 2–4 second loops, subtle (drifting particles)
- Completion celebration: 1.5 second burst animation (particles, confetti), then settles into completed state
- Page load: Modules animate in sequentially from first to current, 150ms stagger

#### Component Click Behavior

Clicking a module node in the progress diagram:

1. Zooms smoothly to that module (400ms ease-in-out)
2. Expands to show lesson list (5 lessons per module)
3. Each lesson shows: title, completion status, score (if completed)
4. Clicking a lesson navigates to it (or shows "locked" tooltip if inaccessible)
5. Clicking outside the expanded module zooms back to full map view

#### Screenshot

*[Design mockup to be produced by visual design team. The progress diagram should be the single most visually impressive element on the platform — it is the learner's constant companion and the primary navigation mechanism within a world.]*

### 3.5 GitHub Integration

Tensorcraft integrates with GitHub to give learners a real portfolio artifact from their learning:

- **Auto-repository creation**: When a learner starts a world, Tensorcraft creates a private GitHub repository (with learner permission) named `tensorcraft-{world-name}`.
- **Commit per lesson**: Each completed lesson auto-commits the learner's code with a descriptive commit message. The commit history becomes a readable learning log.
- **Branch per module**: Each module is developed on its own branch, merged to main upon module completion. This teaches Git workflow as a side effect.
- **README generation**: A README is auto-generated and updated as the learner progresses, summarizing what they've built and learned.
- **Portfolio-ready**: Upon world completion, the repository is optionally made public. It serves as a portfolio piece demonstrating ML skills.
- **No GitHub requirement**: GitHub integration is optional. Learners who prefer not to connect GitHub can still complete all content — code is saved on-platform.

### 3.6 Module Structure

Each module contains **5 lessons**, following a consistent structure:

- **Lesson 1 — Orientation**: Introduces the module's narrative arc and core ML concept. Heavy on story, lighter on code. Establishes the "why" before the "how." Includes the FE-to-ML bridge for the module's central concept.

- **Lesson 2 — Foundation**: Teaches the concept's theory and math (where applicable). Interactive visualizations demonstrate the concept. First hands-on code exercise — typically implementing a simplified version of the concept.

- **Lesson 3 — Implementation**: Full implementation of the concept. Longer coding exercise. The learner builds the real thing, not a toy version. Story progresses based on implementation choices.

- **Lesson 4 — Refinement**: Debugging, optimization, and edge cases. The learner improves their implementation based on feedback (from the story and from metrics). Introduces related concepts (e.g., regularization after overfitting).

- **Lesson 5 — Capstone**: Module capstone project. Synthesizes all concepts from the module into a single larger exercise. Story reaches a module-level climax. Graded automatically with detailed feedback.

### 3.7 UI/UX Design Notes: World Cards

All 5 worlds launch simultaneously. There are no "Coming Soon" cards — every world card is fully interactive and purchasable from V1.0.

#### Card Layout

On the main worlds page, all 5 world cards are arranged in a responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile. All cards are the same size with full color, interactive hover effects, "Start Learning" CTA button, and price displayed prominently.

### 3.8 UI/UX Design Notes: FE Bridge Visual Pedagogy

#### In-Lesson Bridge Display

When an FE-to-ML bridge is introduced in a lesson:

1. A split-screen animation appears: left side shows the frontend concept (with a small code snippet or visual), right side shows the ML concept (with a diagram or formula).
2. Animated connection lines draw between structurally equivalent parts.
3. A "Deep Connection" callout box appears below with the written explanation.
4. The learner can toggle between "Frontend View" and "ML View" to see the concept from each perspective.
5. An optional "I already know this" button lets experienced learners collapse the bridge and move on.

#### Bridge Explorer

A dedicated "Bridge Explorer" page (accessible from the main navigation) lets learners:

- Browse all bridges they've unlocked across all owned worlds
- Filter by category (shared, world-specific)
- Search by ML concept or FE concept
- Mark bridges as "mastered" or "need review"
- See which bridges are used in which modules

#### Shareable Bridge Graphics

Each bridge has a shareable graphic (Open Graph-optimized) that learners can share on social media or embed in blog posts. The graphic shows:

- The ML concept and FE concept side by side
- The one-sentence deep structural connection
- Tensorcraft branding and world color
- A URL to the full bridge explanation (public, no login required — serves as marketing)

### 3.9 UI/UX Design Notes: Brutalist Terminal Aesthetic

As of the Phase 11 redesign (2026-04-13 → 2026-04-20), Tensorcraft's UI/UX direction is **brutalist terminal**, replacing the earlier Zensman-DeFi-Neon direction. The redesign is load-bearing: marketing copy, onboarding, dashboard, world picker, lesson surfaces, paywall, and settings all share a single visual language.

**Core principles:**

- Sharp edges everywhere — `rounded-none`, no `rounded-md`/`rounded-lg`.
- Hard offset shadows (`4px 4px 0 var(--tc-border)`), never blurred or glow shadows.
- Monospace-first for code, data, numbers, and accent labels; Inter for body text.
- Comment-style section labels (`# skill_genome`, `// loss.hints`, `— 12wk`) in uppercase tracking-wider JetBrains Mono.
- No gradients. No glow effects. Neon CSS tokens (`--tc-glow`, `--tc-neon-glow`, `--tc-neon-line`) were removed from `worlds.css` during the redesign.
- Focus outlines are brutalist (`focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`), not `ring`-based.

**Onboarding (5 steps):**

1. **Welcome** — product introduction, anti-hype framing.
2. **Background** — captures `experience_level` (enum: `beginner`, `intermediate`, `advanced`, `expert`).
3. **Goal** — captures `learning_goal` (enum: `hobby`, `career`, `research`, `team`, `curiosity`).
4. **World** — world picker (see below).
5. **Ready** — confirmation and launch into the dashboard.

State is persisted via `PATCH /api/onboarding` per migration 018. The dual-robot ARIA narrator previously proposed as an onboarding companion was cut on 2026-04-20; narration is now handled inline by each world's in-lesson character.

**World Selection:**

- Responsive 5-card grid (1-col mobile → 2/3-col tablet → 3-col desktop) with every world **LIVE simultaneously** — no "Coming Soon" cards.
- Each card renders a per-world `ParticleField` atmosphere tinted to the world's primary color.
- Cards share a brutalist layout: offset shadow, sharp corners, monospace accent labels, world-specific primary and accent colors.

**Dashboard:**

- `SkillGenome` — hexagonal radar rendering the learner's skill distribution (lives at `apps/web/app/dashboard/skill-genome.tsx`; shares a `hexCorners` helper with the reusable `SkillRadar` visualization in `@tensorcraft/ui/visualizations`).
- `LossCurve` — animated SVG training-loss chart for the learner's capstone runs.
- Streak / activity strip driven by `GET /api/progress/activity/daily`.
- **Removed:** `LossLandscape` (deferred) and `ActivityHeatmap` (deferred per accessibility audit §5b). A full GitHub-style heatmap is post-V1.0.

**Lesson page (6-step Duolingo progression):**

- Each lesson is authored as a single MDX source but presented as a stepwise flow (intro → concept → bridge → code → quiz → summary). MDX is step-filtered at render time.
- Exercise surface pairs the Sandpack editor with a bridge-hint panel and a console/output panel alongside test results.

**Capstone completion:**

- Timeline summary of the 11 modules.
- Auto-generated **certificate card** (triggered by `POST /api/certificates` on completion) with unique id + public verification URL fetched via `GET /api/certificates/:id`.
- Summary stats (lessons, exercises, score, time) and a teaser for the next world.

**Paywall & Pricing:**

- Standalone `/paywall` route for gated content, complementing the `/pricing?locked=<world>` banner used on deep links.
- **PurchaseConfirmation** — brutalist "access card" showing the granted world(s) plus a receipt; confirms entitlement before routing back into content.

**Settings (5-tab layout):**

1. **Profile** — display name, avatar, preferred world.
2. **Notifications** — `email_alerts`, `weekly_digest`.
3. **GitHub** — connection state + `tensorcraft-{world}` repo link.
4. **World** — runtime world switch (persisted in `localStorage` as `tc-active-world`, FOUC-prevention script hydrates on load).
5. **Account** — email, password, sign-out, delete account.

---

## Part 4: Differentiated Curricula

### 4.1 Architecture

Each world's curriculum is structured as **foundations (modules 1-6) + specialization (modules 7-11)**.

- **Foundations track (modules 1-6)**: The ML fundamentals that every world teaches. These modules are included free or with any world purchase. Once a learner completes foundations through one world, they are permanently unlocked — purchasing a second world does NOT re-serve this content. In the content schema, these modules have `track: "foundations"`.
- **Specialization track (modules 7-11)**: Domain-specific concepts, techniques, and model architectures unique to the world's focus area. This is what each world purchase ($59) pays for — 25 lessons of unique, specialized content. In the content schema, these modules have `track: "specialization"`.

This structure eliminates redundancy across multi-world purchases and makes pricing honest: each $59 buys 25 new specialized lessons, not 55 lessons where 30 are content you already completed.

### 4.2 Module Map — Deep Orbit

> **Source of truth:** `docs/scripts/deep-orbit.md` contains the full narrative script with detailed lesson breakdowns, character dialogue, FE bridges, and exercises for every module. This section provides the structural overview.

#### Module 1: Foundations — Tensors & Data

**Shared Core:**
- What is machine learning? Supervised vs. unsupervised vs. reinforcement learning
- Tensors: shapes, ranks, operations, and the TypedArray connection
- Data loading, preprocessing, and normalization

**Unique Narrative:**
- Crew of the research vessel *Archimedes* encounters anomalous deep-space signals
- Commander Mirza introduces the mission; ARIA (AI assistant) guides initial concepts
- Bridge: TypedArray = Tensor (identity)

---

#### Module 2: Neural Networks — Layers & Architecture

**Shared Core:**
- Neurons, layers, weights, biases, activation functions
- Forward propagation: from input to prediction
- Building and composing network architectures

**Unique Narrative:**
- Dr. Farah proposes using neural networks to classify signal types
- Chief Nazari skeptical: "We have rules-based systems that work"
- Bridge: Express middleware chain = NN layers (structural)

---

#### Module 3: Training Loop — Loss, Gradients & Optimization

**Shared Core:**
- Loss functions (MSE, cross-entropy)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam) and training loops

**Unique Narrative:**
- First model training reveals overfitting — Nazari vindicated temporarily
- ARIA introduces evaluation metrics; Demir begins speaking ML natively
- Bridge: Component state updates = weight updates (structural)

---

#### Module 4: CNNs & Feature Extraction

**Shared Core:**
- Convolutional layers, kernels, pooling, feature maps
- Data augmentation and feature visualization
- Transfer learning concepts

**Unique Narrative:**
- Signal spectrograms require visual pattern detection
- Nazari grudgingly admits CNN detects patterns rules missed
- Bridge: CSS blur() = convolution kernel (structural)

---

#### Module 5: Optimization & Regularization

**Shared Core:**
- Overfitting/underfitting diagnosis
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning, learning rate scheduling

**Unique Narrative:**
- Model becomes overfit to Archimedes-specific noise patterns
- Team learns to generalize across different sensor configurations
- Bridge: npm audit = regularization (intuition)

---

#### Module 6: Browser ML Runtimes

**Shared Core:**
- Model serialization and export
- Browser ML runtimes: TensorFlow.js, ONNX Runtime Web, WebGPU
- Inference optimization and profiling

**Unique Narrative:**
- Nazari demands the system run on constrained shipboard hardware
- Benchmarking runtimes under real conditions
- Bridge: React vs Vue vs Svelte = TF.js vs ONNX vs WASM (structural)

---

#### Module 7: Signal Processing

**Unique Specialization:**
- Signal processing fundamentals (FFT, frequency domain)
- Spectrograms and temporal feature extraction
- Time-series preprocessing and sliding windows
- **AI-Wrong Moment:** Noise misclassified as signal pattern

---

#### Module 8: Sequence Models

**Unique Specialization:**
- RNN fundamentals for sequential data
- LSTM/GRU architectures for long-term dependencies
- Temporal dependency modeling in sensor readings
- **AI-Wrong Moment:** LSTM "forgets" critical long-range dependency

---

#### Module 9: Attention & Anomaly Detection

**Unique Specialization:**
- Attention mechanisms applied to time-series
- Autoencoders for anomaly detection
- Anomaly scoring and threshold tuning
- **AI-Wrong Moment:** High-confidence detection on a normal signal (false positive)

---

#### Module 10: Model Optimization

**Unique Specialization:**
- Quantization (post-training, QAT, mixed precision)
- Pruning (weight, structured) and knowledge distillation
- WebGPU acceleration for browser inference
- **AI-Wrong Moment:** Quantized model misses failure mode invisible at reduced precision

---

#### Module 11: Capstone — DEEP SCAN

**Unique Specialization:**
- Full multi-stage signal classification pipeline
- End-to-end deployment, monitoring, and evaluation
- Real-time inference UI for anomaly alerting
- **AI-Wrong Moment:** System deployed — what about the edge cases it hasn't seen?
- Portfolio presentation of the complete DEEP SCAN project

---

#### Content Status (Deep Orbit, as of March 2026)

| Module | Status | Lessons | Exercises |
|--------|--------|---------|-----------|
| 1. Foundations | Written | 5 | 4 |
| 2. Neural Networks | Written | 5 | 5 |
| 3. Training Loop | Written | 5 | 5 |
| 4. CNNs & Feature Extraction | Not started | 0 | 0 |
| 5. Optimization & Regularization | Not started | 0 | 0 |
| 6. Browser ML Runtimes | Written | 5 | 5 |
| 7. Signal Processing | Written | 5 | 5 |
| 8. Sequence Models | Not started | 0 | 0 |
| 9. Attention & Anomaly Detection | Not started | 0 | 0 |
| 10. Model Optimization | Not started | 0 | 0 |
| 11. Capstone: DEEP SCAN | Not started | 0 | 0 |

**Total:** 25/55 lessons written (45%), 24 exercises. Remaining: 6 modules (30 lessons).

> **Updated (2026-04-14):** All 11 modules for all 5 worlds are now fully authored with complete lesson content.

---

#### Module Order Rationale (Deep Orbit)

The module order follows a deliberate pedagogical arc:

1. **Modules 1–3** (Foundations → Neural Networks → Training Loop): Build core ML literacy using signal data as context. The learner gains confidence with fundamentals before encountering domain-specific challenges.
2. **Modules 4–6** (CNNs → Optimization → Browser Runtimes): Deepen the toolkit and introduce browser-native ML execution. Nazari's skepticism drives rigor in evaluation and runtime selection.
3. **Modules 7–8** (Signal Processing → Sequence Models): Enter the Deep Orbit specialization — time-series and sequential data. The learner applies core knowledge to domain-specific architectures.
4. **Modules 9–10** (Attention & Anomaly Detection → Model Optimization): Advanced techniques for real-world deployment. Each module includes an "AI-Wrong Moment" that teaches edge case awareness.
5. **Module 11** (DEEP SCAN Capstone): Full pipeline synthesis and deployment. The learner builds, deploys, and evaluates a complete system.

### 4.3 Module Map — Neon Protocol

> **Source of truth:** `docs/scripts/neon-protocol.md` contains the full narrative script. This section provides the structural overview.

**Specialization:** Computer Vision | **Model Built:** Protocol Sentinel (surveillance anomaly detection) | **GitHub repo:** `protocol-sentinel-vision`

**Characters:** Kira (player/hacker), Zara (street artist/visual expert), Ryo (former corp engineer), Lin (resistance leader), NEON (reprogrammed surveillance AI guide)

#### Foundations (Modules 1-6)

| Module | Title | Shared Core | Unique Narrative Context |
|--------|-------|-------------|--------------------------|
| 1 | ML Through Vision (FREE) | ML fundamentals, data, workflow | Kira joins the resistance; NEON introduces surveillance data |
| 2 | Image Data | Data preprocessing, feature engineering | Pixel tensors, channels, getImageData() as tensor extraction |
| 3 | Convolutional Neural Networks | Neural networks, layers, architecture | Kernels, pooling, feature maps; Bridge: CSS blur() = convolution |
| 4 | Object Detection | CNNs, feature extraction, transfer learning | Anchor boxes, NMS, bounding boxes; Bridge: debounce() = NMS |
| 5 | Segmentation | Optimization, regularization | Pixel-level classification, segmentation masks; Bridge: clip-path = masks |
| 6 | Feature Extraction | Browser ML runtimes, model export | Backbone networks, feature visualization |

#### Specialization (Modules 7-11)

#### Module 7: Transfer Learning

**Unique Specialization:**
- Pre-trained models and fine-tuning strategies
- Feature freezing and selective layer retraining
- Domain adaptation across data distributions
- Repurposing Meridian's $2M model against itself
- **AI-Wrong Moment:** Accuracy suggests Meridian anticipated the transfer attack (poisoned weights)

---

#### Module 8: Real-Time Detection

**Unique Specialization:**
- Video stream processing with `getUserMedia()` API
- Frame-by-frame inference via `requestAnimationFrame()` loop
- WebGL acceleration for GPU-powered browser inference
- Performance budgets and streaming architectures (WebSocket/SSE)
- Hybrid client/server architecture with graceful degradation
- **AI-Wrong Moment:** False gait analysis identification — person limping from injury, not a surveillance officer

---

#### Module 9: Generative Vision

**Unique Specialization:**
- GANs: generator vs discriminator in adversarial training
- Adversarial patches that fool classifiers
- Style transfer across images
- Counter-surveillance: using generative AI defensively
- Ethical constraints: patches cryptographically bound to Meridian's specific model
- **AI-Wrong Moment:** Adversarial patch designed for Meridian also fools the resistance's own system

---

#### Module 10: Deployment

**Unique Specialization:**
- Model optimization: quantization, pruning, distillation for edge devices
- Model serving via API-based inference architecture
- A/B testing model versions in production
- Monitoring model performance over time

---

#### Module 11: Capstone — Protocol Sentinel

**Unique Specialization:**
- Full system architecture design and integration testing (Cypress/Playwright)
- Security and privacy: CORS, CSP, security headers, ethical deployment
- CI/CD pipeline to production
- Evidence broadcast: 847 devices across 12 districts, 96.2% detection confidence
- Cryptographically signed evidence distributed to 14 independent media organizations
- Portfolio deployment at `https://<username>.github.io/protocol-sentinel-vision`

### 4.4 Module Map — Signal Ward

> **Source of truth:** `docs/scripts/signal-ward.md` contains the full narrative script. This section provides the structural overview.

**Specialization:** NLP & Text (Clinical) | **Model Built:** Diagnostic One (clinical NLP assistant) | **GitHub repo:** `diagnostic-one-clinical-nlp`

**Characters:** Khalil (player/bioethicist & frontend dev), Dr. Vasquez (head researcher/mentor), Obi (computational linguist), Santos (nurse/data curator), MEDI (clinical decision support AI guide)

#### Foundations (Modules 1-6)

| Module | Title | Shared Core | Unique Narrative Context |
|--------|-------|-------------|--------------------------|
| 1 | ML Through Text (FREE) | ML fundamentals, data, workflow | Khalil arrives at Signal Ward; clinical text as ML input |
| 2 | Tokenization & Preprocessing | Data preprocessing, feature engineering | Text normalization, medical vocabulary, tokenization strategies |
| 3 | Word Embeddings | Neural networks, layers, architecture | Dense vectors, Word2Vec, medical embeddings; Bridge: i18n dictionaries = embeddings |
| 4 | Sequence Models | Training loop, loss, gradients | RNNs, LSTMs, bidirectional models; Bridge: Array.reduce() = RNN |
| 5 | Attention Mechanisms | Optimization, regularization | Self-attention, multi-head attention; Bridge: search ranking = attention |
| 6 | Transformers & BERT | Browser ML runtimes, model export | Transformer encoder, BERT fine-tuning, temporal reasoning |

#### Specialization (Modules 7-11)

#### Module 7: Named Entity Recognition

**Unique Specialization:**
- BIO tagging (Beginning, Inside, Outside labels) for medical entities
- Medication, condition, and procedure extraction
- Relationship extraction between entities
- Subgroup performance analysis across patient demographics
- **AI-Wrong Moment:** Model update improves aggregate accuracy by 3.1% but degrades medication extraction by 8% for elderly patients. Santos blocks deployment.

---

#### Module 8: Text Classification & Triage

**Unique Specialization:**
- Multi-label text classification for clinical documents
- Urgency/priority scoring for record triage
- Confidence calibration (knowing when uncertain)
- Hallucination detection: generated text vs source documents
- Grounding mechanisms for factual accuracy
- **AI-Wrong Moment:** MEDI generates linguistically perfect but factually incorrect clinical summary — hallucinates a medication dosage

---

#### Module 9: Question Answering & RAG

**Unique Specialization:**
- Extractive QA and reading comprehension
- Vector search for document retrieval
- Knowledge grounding with citation linking
- Cross-system retrieval across heterogeneous EHR formats
- Multilingual handling (Spanish-language clinical notes)
- Bridge: React Server Components = RAG (server fetches data, renders with grounded content)

---

#### Module 10: Production NLP & Privacy

**Unique Specialization:**
- Model serving APIs for real-time clinical inference
- HIPAA-compliant data handling and encryption
- Bias auditing across patient demographics (12% accuracy gap on non-standard English)
- Human-in-the-loop confirmation workflows
- Liability and ethics review before go-live

---

#### Module 11: Capstone — Diagnostic One

**Unique Specialization:**
- Full system integration with hospital information systems
- Clinical validation against expert annotations
- End-to-end testing and documentation
- Production deployment with safety guardrails and monitoring loops
- Results: note categorization 94%, medication extraction 91%, 40% reduction in physician search time
- **AI-Wrong Moment:** Day 9 false positive — drug interaction flagged at 87% confidence that's clinically negligible. Teaches acceptable imperfection in human-AI collaboration.
- Portfolio deployment at `https://<username>.github.io/diagnostic-one-clinical-nlp`

### 4.5 Module Map — Nova Canvas

> **Source of truth:** `docs/scripts/nova-canvas.md` contains the full narrative script. This section provides the structural overview.

**Specialization:** Multimodal & Generative | **Model Built:** Nova Canvas (multimodal creative installation) | **GitHub repo:** `nova-canvas-creative-ai`

**Characters:** Ren (player/creative coder), Yara (lead artist/creative director), Kai (audio engineer/creative coder), Petrov (gallery curator/deployment lead), MUSE (creative AI assistant guide)

#### Foundations (Modules 1-6)

| Module | Title | Shared Core | Unique Narrative Context |
|--------|-------|-------------|--------------------------|
| 1 | Generative Basics (FREE) | ML fundamentals, data, workflow | Ren joins the team; generation vs classification framing |
| 2 | Latent Spaces | Data preprocessing, feature engineering | Compressed representations, interpolation, latent exploration |
| 3 | GANs | Neural networks, layers, architecture | Generator vs discriminator; Bridge: fuzzer/validator = GAN |
| 4 | Variational Autoencoders | Training loop, loss, gradients | VAE, reparameterization trick; Bridge: URL shortener = VAE encoder |
| 5 | Diffusion Models | Optimization, regularization | Noise-to-image denoising; Bridge: progressive loading = diffusion |
| 6 | Style Transfer | Browser ML runtimes, model export | Content/style separation; Bridge: CSS worlds = style transfer |

#### Specialization (Modules 7-11)

#### Module 7: Multimodal Learning

**Unique Specialization:**
- Vision-language models connecting images and text
- Cross-modal embeddings (shared representation spaces)
- Image captioning and text-to-image generation
- Bridge: full-stack apps (FE + BE + DB) = multimodal systems; `<img alt="...">` = text describing images
- **AI-Wrong Moment:** Fine-tuned model produces work indistinguishable from human art — "If no one can tell the difference, does the difference matter?"

---

#### Module 8: CLIP & Alignment

**Unique Specialization:**
- Contrastive learning (learning by comparison)
- CLIP architecture for joint text-image understanding
- Zero-shot classification without training examples
- CLIP-guided generation and prompt engineering
- Vector space understanding (adjectives and mood as directions in 512D space)
- **AI-Wrong Moment:** "Visual equivalent" of music is identical to the song's album cover — synesthesia or data leakage?

---

#### Module 9: Audio Generation

**Unique Specialization:**
- Audio as data: waveforms, spectrograms, audio tensors
- Neural audio synthesis from latent representations
- Audio-visual synchronization via shared latent spaces
- Interactive soundscapes responding to audience input
- Core insight: switching modalities = applying existing knowledge to new data types
- Bridge: Web Audio API (`OscillatorNode`, `AudioContext`) = audio generation primitives

---

#### Module 10: Creative Deployment

**Unique Specialization:**
- Performance profiling for generation bottlenecks
- Progressive distillation: 4-step model achieves 90% quality at 8% compute (43s → 3.4s)
- Caching and precomputation for popular outputs
- Concurrent user handling: WebSocket connection pooling for 200+ simultaneous generators
- Installation architecture for 40 gallery kiosks

---

#### Module 11: Capstone — The Biennale

**Unique Specialization:**
- Full integration of visual, audio, and text modalities
- Load testing for opening night (247 concurrent users at peak)
- Monitoring, failover, and graceful degradation
- Sub-2-second generation time, zero crashes on opening night
- Climactic moment: a child whispers "a dragon made of stars" — CLIP aligns, diffusion generates, audio responds
- Portfolio deployment at `https://<username>.github.io/nova-canvas-creative-ai`

### 4.6 Module Map — Terra Grid

> **Source of truth:** `docs/scripts/terra-grid.md` contains the full narrative script. This section provides the structural overview.

**Specialization:** Edge AI & MLOps | **Model Built:** Terra Grid Intelligence (edge-deployed infrastructure monitoring) | **GitHub repo:** `terra-grid-intelligence`

**Characters:** Hassan (infrastructure lead/mentor), Cole (field engineer/edge specialist), Park Soo-Yeon (data ops manager), Jin (security analyst/adversarial expert), GRID (network management AI guide)

#### Foundations (Modules 1-6)

| Module | Title | Shared Core | Unique Narrative Context |
|--------|-------|-------------|--------------------------|
| 1 | Edge AI Basics (FREE) | ML fundamentals, data, workflow | Infrastructure monitoring intro; sensor data as ML input |
| 2 | Model Optimization Fundamentals | Data preprocessing, feature engineering | Baseline anomaly detection for sensor data |
| 3 | Quantization | Neural networks, layers, architecture | Float32→Int8, post-training quantization, QAT, mixed precision |
| 4 | Pruning & Distillation | Training loop, loss, gradients | Weight/structured pruning, knowledge distillation (10x smaller, 95% accuracy) |
| 5 | Edge Deployment | Optimization, regularization | Deploying across 847 edge devices; Bridge: CDN = edge inference |
| 6 | MLOps Pipelines | Browser ML runtimes, model export | Automated pipelines, data versioning; Bridge: CI/CD = ML pipeline |

#### Specialization (Modules 7-11)

#### Module 7: Monitoring & Drift Detection

**Unique Specialization:**
- Production monitoring for model health in real time
- Data drift detection via statistical tests for distribution shift
- Model drift tracking (prediction quality degradation)
- Alert systems with configurable thresholds
- Drift response procedures: diagnosis, retraining, redeployment
- Bridge: Lighthouse CI = drift detection (continuous regression detection against baseline)
- **AI-Wrong Moment:** A/B test shows Model B 12% better, but it was trained on decommissioned site data. "The model is not better. The benchmark is wrong."

---

#### Module 8: Federated Learning

**Unique Specialization:**
- Federated averaging (combining model updates from distributed training)
- Privacy preservation: keeping data local while improving models globally
- Communication efficiency (minimizing data transfer)
- Secure aggregation against gradient inversion attacks
- The data silo problem (regulatory constraints preventing centralization)
- Bridge: state sync across browser tabs = federated averaging; CORS = data silos

---

#### Module 9: A/B Testing Models

**Unique Specialization:**
- Traffic splitting and routing to different model versions
- Statistical significance testing for meaningful improvements
- Canary deployments with automatic rollback
- Multi-armed bandits for adaptive traffic allocation
- Bridge: feature flags = A/B testing (deploy to subset, measure, promote if better)
- Real-world validation: 2.3% improvement confirmed, catches bearing failure 6 hours earlier

---

#### Module 10: Scale & Reliability

**Unique Specialization:**
- Horizontal and vertical scaling for ML systems
- Model sharding across devices; Bridge: dynamic `import()` = model sharding
- Failover and graceful degradation when components fail
- Stress testing: simultaneous anomalies across 3 regions, 12,400 devices
- **AI-Wrong Moment:** Adversarial sensor readings trick model into ignoring equipment failures. Jin: "I can make the model ignore a cooling failure by adding noise."

---

#### Module 11: Capstone — Terra Grid Intelligence

**Unique Specialization:**
- System architecture review and security hardening
- Disaster recovery and operational runbooks
- Global launch across all 47 sites, 12,400 edge devices
- Real-world validation: cascading temperature anomaly caught at source, preventing residential grid cascade
- Model size: 4.2MB, inference latency: 89ms
- Dispatch in 47 minutes vs 2-3 hours manually
- Portfolio deployment and documentation

---

## Part 4.7: Curriculum Gap Modules (REMOVED 2026-08-15)

These cross-world modules addressed gaps identified in the content audit. They were built out fully (4 modules, 23 lessons + exercises, served at /extras), then removed on 2026-08-15 by owner decision along with the /extras surface. Restore pointer and consequences: `docs/post-launch-backlog.md` §"/extras removal". The outlines below are kept as the design record.

### Classical ML: When Neural Networks Aren't the Answer

**Track:** foundations | **Lessons:** 5 | **Prerequisite:** Modules 1-3

Fills the biggest curriculum gap: students must understand when *not* to use deep learning. Covers logistic regression, decision trees, k-nearest neighbors, ensemble methods (random forests, XGBoost), and a decision framework for model selection. Key bridge: "Classical ML models are like vanilla JS — no framework, full control, sometimes the right choice."

### Ethics & Responsible AI

**Track:** foundations | **Lessons:** 5 | **Prerequisite:** Modules 1-3

Every ML interview asks about bias and fairness. Covers dataset bias detection, fairness metrics (demographic parity, equalized odds), model interpretability (LIME, SHAP), responsible deployment, and building a reusable ethics checklist. Key bridge: "Data bias is like testing only in Chrome — works great for you, broken for half your users."

### Python Bridge

**Track:** bonus (unlocked after completing any world) | **Lessons:** 5

Eliminates the biggest career gap. Not "learn Python" — instead, "you know ML in JavaScript, here's how the same concepts look in Python/PyTorch." Covers Python syntax for JS devs, NumPy as TypedArrays, PyTorch as TF.js, pandas as Array methods, and reading ML papers/repos. Comprehension-focused, not implementation. Key bridge: "Python's ML ecosystem is like jQuery — it was there first, everything builds on it."

### Math Deep Dive (Companion Track)

**Track:** companion (optional, parallel to core modules) | **Lessons:** 6

For students who want deeper foundations. Each lesson companions a core module: tensors as linear algebra, calculus of neurons (chain rule worked through), optimization landscape (convexity, saddle points), convolution as matrix multiplication, information theory, and Bayesian probability. Not required to complete the course, but essential for advancing beyond it. Key bridge: "Math is like TypeScript — you can ship without it, but it catches bugs in your thinking."

---

## Part 5: Visual Design

### 5.1 Deep Orbit

- **Primary Color:** #6BAA8A
- **Accent Color:** #A89060
- **Background:** #181818 (shared)
- **Surface:** #232323 (shared)
- **Text:** #E0E0E0 (shared)
- **Muted:** #A0A0A0 (shared)
- **Mood:** Vast, awe-inspiring, scientifically precise. The feeling of staring through a telescope at something impossibly far away. Clean interfaces with data-heavy readouts, reminiscent of mission control. Typography is monospaced for data, clean sans-serif for narrative.

### 5.2 Neon Protocol

- **Primary Color:** #4A90D9
- **Accent Color:** #A07090
- **Background:** #181818 (shared)
- **Surface:** #232323 (shared)
- **Text:** #E0E0E0 (shared)
- **Muted:** #A0A0A0 (shared)
- **Mood:** Tense, cyberpunk noir, digitally charged. Rain-slicked streets reflected in neon. Interfaces feel like hacking terminals — monospaced text, blinking cursors, matrix-style data cascades. Typography mixes monospaced (code/data) with compressed sans-serif (headlines).

### 5.3 Signal Ward

- **Primary Color:** #65C07D
- **Accent Color:** #7096B0
- **Background:** #181818 (shared)
- **Surface:** #232323 (shared)
- **Text:** #E0E0E0 (shared)
- **Muted:** #A0A0A0 (shared)
- **Mood:** Focused, clinical, high-stakes calm. The quiet tension of a monitoring station at 3 AM. Interfaces are clean and medical — waveform displays, vital sign readouts, clean grid layouts. Typography is highly legible sans-serif throughout, prioritizing readability.

### 5.4 Nova Canvas

- **Primary Color:** #D07070 (bumped from `#C06060` on 2026-04-20 to meet WCAG AA contrast against the shared `#232323` surface)
- **Accent Color:** #7868A8
- **Background:** #181818 (shared)
- **Surface:** #232323 (shared)
- **Text:** #E0E0E0 (shared)
- **Muted:** #A0A0A0 (shared)
- **Mood:** Creative, expressive, visually rich. The feeling of walking through an interactive art exhibition at night. Interfaces are gallery-like — generous whitespace, large image displays, elegant typography. Mixed typography: serif for narrative, sans-serif for UI, display fonts for headings.

### 5.5 Terra Grid

- **Primary Color:** #C49535
- **Accent Color:** #6BAA8A
- **Background:** #181818 (shared)
- **Surface:** #232323 (shared)
- **Text:** #E0E0E0 (shared)
- **Muted:** #A0A0A0 (shared)
- **Mood:** Grounded, earthy, purposeful. The feeling of standing at a monitoring outpost overlooking a vast landscape. Interfaces incorporate map elements — contour lines, coordinate grids, terrain indicators. Typography is rugged sans-serif, with data displayed in clean monospaced fonts.

### 5.6 Shared Constraints

All five worlds share these visual design constraints to maintain platform coherence:

- **Both dark and light color schemes are supported** (added 2026-07-22). Dark remains the brand-default aesthetic; light mode follows the OS `prefers-color-scheme` by default with a manual override toggle. Every world palette has a light variant with WCAG AA-verified contrast. OG images and favicons intentionally stay dark. See `docs/audits/light-mode-readiness-2026-07-22.md` for the design rationale. Shipped 2026-07-23 and verified end to end (axe matrix both schemes, runtime sweep of every route); see `docs/dev-plan.md`'s 2026-07-23 entry.
- **Minimum contrast ratio:** 4.5:1 for body text, 3:1 for large text (WCAG AA).
- **Animation budget:** No more than 3 simultaneous animations per viewport. All animations respect `prefers-reduced-motion`.
- **Font loading:** Maximum 2 font families per world. All fonts self-hosted (no Google Fonts CDN).
- **Responsive breakpoints:** 320px (mobile min), 768px (tablet), 1024px (desktop), 1440px (wide). All worlds use identical breakpoints.
- **Icon system:** Shared icon set across all worlds, tinted to world colors. Lucide icons as the base set.
- **Code blocks:** All worlds use the same code syntax highlighting world (custom, dark-on-dark) with world-colored accents for keywords.
- **Component library:** All worlds built from the same base component library. World differences are achieved through CSS custom properties (colors, spacing, typography), not structural changes.

---

## Part 6: MVP Scope and Risk Log

### 6.1 V0.5 Ships

#### In Scope

- All 5 worlds — Modules 1–3 (15 lessons each, 75 lessons total)
- Full 5C Loop for all lessons
- Interactive animations for core ML concepts (at least 10)
- FE-to-ML bridges: all 20 shared bridges + per-world bridges
- Progress diagram (all worlds, modules 1–3)
- GitHub integration (auto-repo, auto-commit)
- Module capstone projects (modules 1–3 per world)
- User authentication and payment (Stripe)
- Single-model and bundle purchases
- Basic analytics (completion rates, lesson time, capstone scores)
- Responsive design (mobile, tablet, desktop)
- 5-step onboarding with `experience_level` + `learning_goal` capture (migration 018)
- 5-tab Settings (Profile / Notifications / GitHub / World / Account)
- Standalone `/paywall` route + PurchaseConfirmation access card
- Dashboard: `SkillGenome` radar, `LossCurve`, daily activity strip (via `GET /api/progress/activity/daily`)
- Auto-generated completion certificates on capstone completion (via `POST /api/certificates`, publicly verifiable via `GET /api/certificates/:id`)

#### Not in Scope

- Modules 4–11 for any world
- Team licenses
- Arena
- PPP pricing (added in V1.0)
- Bridge Explorer page (added in V1.0)
- Shareable bridge graphics (added in V1.0)
- Peer comparison features
- `ActivityHeatmap` (deferred per a11y audit §5b — replaced by a simpler daily-activity strip for V0.5/V1.0)
- `LossLandscape` visualization (deferred after Phase 11 — replaced by `ParticleField` on auth pages)
- ARIA dual-robot narrator (cut 2026-04-20 — narration handled inline by per-world characters)
- ~~Light mode~~ (reversed 2026-07-22): both schemes are now supported; see §5.6 above and `docs/audits/light-mode-readiness-2026-07-22.md`
- Localization / i18n
- Native mobile app

### 6.2 Beta Testing

**Beta timeline:** 4 weeks before V0.5 public launch.

**Beta cohort:** 50–100 frontend developers recruited from:

- Twitter/X ML learning communities
- Frontend-focused Discord servers
- Dev.to and Hashnode communities
- Personal network referrals

**Beta structure:**

- Week 1: Modules 1–2. Focus on onboarding flow, first impressions, bridge clarity.
- Week 2: Modules 3–4. Focus on difficulty curve, code exercise quality, narrative engagement.
- Week 3: Module 5. Focus on capstone quality, progress diagram usability, GitHub integration.
- Week 4: Full play-through. Focus on overall experience, pacing, willingness-to-pay validation.

**Beta feedback channels:**

- In-app feedback button on every lesson (emoji reaction + optional text)
- Weekly 30-minute group calls (5–8 participants per call)
- Exit survey with NPS, willingness-to-pay, and open-ended questions
- Private Discord channel for async discussion

**Beta success criteria:**

- NPS >= 40
- >= 70% module completion rate across beta cohort
- >= 80% of respondents say they would pay $59 (or already consider it a good value)
- < 5% of lessons flagged as "confusing" or "too hard" by more than 20% of testers

### 6.3 Risk Log

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Story fatigue**: Learners skip narrative to get to code, rendering the 5C Loop's Context and Consequence phases wasted effort. | Medium | High | Make narrative optional but defaulted to "on." Track skip rates in analytics. If >40% skip, redesign narrative to be shorter and more decision-driven. |
| 2 | **Bridge confusion**: FE-to-ML bridges feel forced or inaccurate, undermining trust in the teaching method. | Low | High | Extensive beta testing of bridges specifically. Each bridge reviewed by at least 2 frontend developers and 1 ML engineer. Remove or rewrite any bridge that beta testers rate below 3/5 clarity. |
| 3 | **Pricing resistance**: $59 per model feels too high for the perceived value, especially with All 5 worlds available at launch. | Medium | High | Validate willingness-to-pay in beta. If resistance is high, consider $49 launch promo with planned return to $59 once social proof accumulates. PPP pricing helps for international markets. |
| 4 | **Scope creep on V0.5**: The MVP takes longer than planned because of feature additions or quality bar escalation. | High | Medium | Strict scope document (Section 6.1). Weekly scope review meetings. Any addition to V0.5 must remove something of equal effort. "Not in scope" list is a commitment. |
| 5 | **Technical complexity of interactive animations**: Building high-quality interactive ML concept visualizations takes longer and costs more than estimated. | Medium | Medium | Prototype the 3 most complex animations first (neural network forward pass, backpropagation, gradient descent). If any takes more than 2x estimated time, simplify or use pre-rendered alternatives. |
| 6 | **GitHub integration reliability**: GitHub API rate limits, authentication edge cases, or merge conflicts break the auto-commit flow. | Medium | Low | Implement robust error handling and retry logic. GitHub integration is optional — if it breaks, the learner's progress is unaffected. Queue commits and retry on failure. |
| 7 | **Content quality at scale**: Maintaining writing quality across 55 lessons (V0.5) and eventually 275 lessons (all worlds) is challenging. | Medium | High | Establish a style guide and content templates. First 10 lessons set the quality bar. All subsequent lessons reviewed against the first 10. Consider hiring a narrative writer for story content. |
| 8 | **Low free-to-paid conversion across worlds**: Learners try free modules but don't purchase any world. | Medium | Medium | Nurture email list with monthly content (free bridge cards, concept previews, story teasers). Offer launch-week pricing (10% off) for first 48 hours. A/B test paywall placement. |
| 9 | **Platform performance under load**: Interactive animations and code execution environments strain client/server resources at scale. | Low | High | Load test before launch. Code execution uses client-side WASM (Pyodide) — no server-side compute for exercises. Animations are CSS/Canvas — GPU-accelerated. CDN for all static assets. |

---

## Part 7: Name Candidates

The product is currently called **Tensorcraft**. The following alternative names were considered and remain on file for potential rebranding discussions:

| # | Name | Notes |
|---|------|-------|
| 1 | **Tensorcraft** | Current working name. Evokes craftsmanship and tensor operations. Clear ML association. Available as a domain. Risk: may sound too technical for frontend developers approaching ML for the first time. |
| 2 | **Neuralpath** | Evokes neural networks and a learning journey/path. Friendly and approachable. Risk: "neural" may narrow the perception to only neural network content (we also cover trees, linear models, etc.). |
| 3 | **Gradient** | Clean, minimal, one-word. Core ML concept. Risk: very common word, SEO difficulty. Multiple existing products use variations. |
| 4 | **Modelforge** | Evokes building/crafting models. Strong, active verb. Risk: sounds more like a deployment tool than a learning platform. |
| 5 | **Synapse** | Evokes neural connections and learning. Short, memorable. Risk: several existing products use this name. Medical/neuroscience connotation may confuse positioning. |

---

## Appendix: Founder Decisions

The following questions are unresolved and require founder decisions before or during V0.5 development:

1. **Code execution environment**: Should we use Pyodide (client-side Python via WASM) or a server-side sandbox (e.g., Docker containers)? Pyodide has no server cost but limited library support. Server-side has full Python support but adds cost and latency. **Decision needed by:** V0.5 development start.

2. **Narrative branching depth**: Should story decisions create genuinely different paths (increasing content production cost) or should they converge back to the same outcome (simpler but potentially less meaningful)? The current plan assumes convergent branching — decisions affect flavor text and minor details but not the core curriculum path. **Decision needed by:** Module 1 content finalization.

3. **Community features at launch**: Should V0.5 include any community features (discussion forums, comment sections on lessons) or should community wait until Arena? Community increases engagement but also requires moderation. **Decision needed by:** V0.5 scope lock.

4. **AI assistant integration**: Should Tensorcraft include an AI coding assistant (LLM-powered) that learners can ask for hints? This could reduce frustration but risks enabling learners to bypass genuine understanding. If yes, how do we gate it (e.g., available only after N minutes stuck, limited hints per lesson)? **Decision needed by:** V1.0 planning.

5. **Content licensing**: Should completed Tensorcraft projects (the models learners build) be licensed in any specific way? Can learners use their capstone projects commercially? The current assumption is yes — learners own their code. But we should make this explicit. **Decision needed by:** Terms of service drafting.

6. **Accessibility beyond WCAG AA**: Should we target WCAG AAA for any elements? The interactive animations and progress diagram are the highest-risk elements for accessibility. Full AAA compliance may conflict with the visual design goals. **Decision needed by:** V0.5 design finalization.

7. **Pricing currency**: Should we price in USD only, or should we offer localized currencies (EUR, GBP, etc.)? Stripe supports multi-currency. Localized pricing may increase conversion in non-US markets but adds complexity to revenue reporting and bundle pricing. **Decision needed by:** Payment integration implementation.
