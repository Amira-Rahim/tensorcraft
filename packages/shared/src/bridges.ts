export type BridgeTier = "identity" | "structural" | "intuition";

export type BridgeCategory =
  | "shared"
  | "deep-orbit"
  | "neon-protocol"
  | "signal-ward"
  | "nova-canvas"
  | "terra-grid";

export interface Bridge {
  id: number;
  mlConcept: string;
  feConcept: string;
  tier: BridgeTier;
  connection: string;
  category: BridgeCategory;
}

export const BRIDGE_TIER_COLORS: Record<BridgeTier, string> = {
  identity: "#00D4FF",
  structural: "#7B68EE",
  intuition: "#F0C75E",
};

export const BRIDGE_TIER_LABELS: Record<BridgeTier, string> = {
  identity: "Identity",
  structural: "Structural",
  intuition: "Intuition",
};

export const BRIDGE_CATEGORY_LABELS: Record<BridgeCategory, string> = {
  shared: "All Themes",
  "deep-orbit": "Deep Orbit",
  "neon-protocol": "Neon Protocol",
  "signal-ward": "Signal Ward",
  "nova-canvas": "Nova Canvas",
  "terra-grid": "Terra Grid",
};

export const BRIDGES: Bridge[] = [
  // ── Shared Bridges (All Themes) ──────────────────────────────────────
  {
    id: 1,
    mlConcept: "Training data",
    feConcept: "Component props",
    tier: "structural",
    connection:
      "Both are external inputs that shape behavior. Props configure a component; training data configures a model. Change the props, the component renders differently. Change the data, the model learns differently.",
    category: "shared",
  },
  {
    id: 2,
    mlConcept: "Model parameters (weights)",
    feConcept: "Component state",
    tier: "structural",
    connection:
      "Both are internal values that change over time based on inputs. State updates in response to user events; weights update in response to training data. Both persist across render/training cycles.",
    category: "shared",
  },
  {
    id: 3,
    mlConcept: "Loss function",
    feConcept: "expect().toBe() assertions",
    tier: "structural",
    connection:
      "Both measure the gap between actual and expected output. A test assertion checks actual === expected; a loss function computes the distance between predictions and labels. Both quantify \u201chow wrong\u201d and drive corrections.",
    category: "shared",
  },
  {
    id: 4,
    mlConcept: "Gradient descent",
    feConcept: "Reconciliation",
    tier: "intuition",
    connection:
      "Both incrementally reduce a measured gap. Reconciliation patches the DOM toward the desired state; gradient descent adjusts weights toward lower loss. Caveat: Reconciliation is deterministic and complete; gradient descent is stochastic and incremental.",
    category: "shared",
  },
  {
    id: 5,
    mlConcept: "Learning rate",
    feConcept: "Animation easing / step size",
    tier: "intuition",
    connection:
      "Both control how aggressively a system moves toward its target per step. A large step overshoots; a small step converges slowly. Both require tuning. Caveat: The mechanisms are unrelated \u2014 learning rate scales gradient magnitudes, animation easing interpolates time curves.",
    category: "shared",
  },
  {
    id: 6,
    mlConcept: "Epochs",
    feConcept: "requestAnimationFrame loop",
    tier: "structural",
    connection:
      "Both are repeated cycles where the system processes input and refines output. An rAF loop reruns render logic every frame; an epoch reruns training over the entire dataset. Both converge toward a target.",
    category: "shared",
  },
  {
    id: 7,
    mlConcept: "Batch size",
    feConcept: "Chunk / page size",
    tier: "structural",
    connection:
      "Both control how much data is processed at once. Pagination loads N items per page; batch size feeds N samples per gradient update. Both balance memory and throughput.",
    category: "shared",
  },
  {
    id: 8,
    mlConcept: "Overfitting",
    feConcept: "Overspecialized component",
    tier: "intuition",
    connection:
      "Both are cases of being too tailored to specific inputs. An overspecialized component breaks with new data; an overfit model fails on new examples. Both need generalization.",
    category: "shared",
  },
  {
    id: 9,
    mlConcept: "Regularization",
    feConcept: "Code linting / constraints",
    tier: "intuition",
    connection:
      "Both impose rules that prevent overly specific or complex solutions. Linting constrains code style; regularization constrains model complexity. Both improve generalizability.",
    category: "shared",
  },
  {
    id: 10,
    mlConcept: "Feature engineering",
    feConcept: "Data transformation / mapping",
    tier: "structural",
    connection:
      "Both transform raw inputs into more useful representations. Array.map transforms data for rendering; feature engineering transforms data for modeling. Both are about shaping inputs.",
    category: "shared",
  },
  {
    id: 11,
    mlConcept: "Train/test split",
    feConcept: "Dev/prod environments",
    tier: "structural",
    connection:
      "Both separate the context for building from the context for evaluation. You develop in dev, test in prod; you train on training data, evaluate on test data. Mixing them gives false confidence.",
    category: "shared",
  },
  {
    id: 12,
    mlConcept: "Hyperparameters",
    feConcept: "Config / environment variables",
    tier: "structural",
    connection:
      "Both are settings that control behavior but aren\u2019t learned from data. Env vars configure an app without changing code; hyperparameters configure training without being part of the model.",
    category: "shared",
  },
  {
    id: 13,
    mlConcept: "Neural network layers",
    feConcept: "Middleware / pipeline stages",
    tier: "structural",
    connection:
      "Both are sequential processing steps where each transforms its input and passes the result forward. Express middleware and neural network layers are structurally identical: input \u2192 transform \u2192 output \u2192 next.",
    category: "shared",
  },
  {
    id: 14,
    mlConcept: "Activation functions (ReLU)",
    feConcept: "Math.max(0, x)",
    tier: "identity",
    connection:
      "ReLU is literally Math.max(0, x) \u2014 the same function, same math, different name. The strongest bridge in the system. Clip negative values to zero, pass positives through unchanged.",
    category: "shared",
  },
  {
    id: 15,
    mlConcept: "Backpropagation",
    feConcept: "Reconciliation (tracing diffs backward)",
    tier: "intuition",
    connection:
      "Both propagate information backward through a structure to determine what needs updating. React traces from changed leaves back to root; backprop traces from loss back to input weights via the chain rule. Caveat: Backprop is a mathematical operation (chain rule, partial derivatives) with no direct DOM equivalent.",
    category: "shared",
  },
  {
    id: 16,
    mlConcept: "Model inference",
    feConcept: "Server-side rendering",
    tier: "structural",
    connection:
      "Both take an input and produce an output in a single forward pass, without iterative updating. SSR renders HTML from data; inference produces predictions from features. Both are \u201cone-shot.\u201d",
    category: "shared",
  },
  {
    id: 17,
    mlConcept: "Data augmentation",
    feConcept: "Responsive design / media queries",
    tier: "intuition",
    connection:
      "Both create variations of the input to handle diverse conditions. Media queries adapt layouts to screen sizes; data augmentation creates training variations for robustness. Both prevent brittleness.",
    category: "shared",
  },
  {
    id: 18,
    mlConcept: "Dropout",
    feConcept: "Randomly hiding team members during practice",
    tier: "intuition",
    connection:
      "Both temporarily remove participants to prevent over-reliance on any single one. If one neuron always fires, others co-adapt. Random removal forces resilience and independence.",
    category: "shared",
  },
  {
    id: 19,
    mlConcept: "Confusion matrix",
    feConcept: "Error boundary report",
    tier: "structural",
    connection:
      "Both provide structured breakdowns of what went right and wrong. An error boundary catches and categorizes errors; a confusion matrix categorizes predictions vs. actuals. Both guide debugging.",
    category: "shared",
  },
  {
    id: 20,
    mlConcept: "Model deployment",
    feConcept: "CI/CD pipeline",
    tier: "structural",
    connection:
      "Both are the process of taking something from development to production. CI/CD deploys code; model deployment serves a model. Both involve versioning, testing, and monitoring.",
    category: "shared",
  },

  // ── Deep Orbit Bridges ───────────────────────────────────────────────
  {
    id: 21,
    mlConcept: "Weight initialization",
    feConcept: "CSS initial values",
    tier: "structural",
    connection:
      "Both set the starting point before any updates occur. Poor initial values lead to slow convergence or broken layouts. Both require deliberate defaults.",
    category: "deep-orbit",
  },
  {
    id: 22,
    mlConcept: "Batch normalization",
    feConcept: "CSS normalize / reset",
    tier: "structural",
    connection:
      "Both standardize inputs to a layer/component to prevent compounding inconsistencies. CSS resets remove browser defaults; batch norm removes distribution shift between layers.",
    category: "deep-orbit",
  },
  {
    id: 23,
    mlConcept: "Residual connections",
    feConcept: "Component composition via children",
    tier: "structural",
    connection:
      "Both allow information to skip intermediate processing and pass through directly. React children pass content through wrapper components; residual connections pass activations around layers.",
    category: "deep-orbit",
  },
  {
    id: 24,
    mlConcept: "Vanishing gradients",
    feConcept: "Deeply nested callback hell",
    tier: "intuition",
    connection:
      "Both are problems caused by excessive depth. Deep callback nesting loses context; deep networks lose gradient signal. Both are solved by architectural shortcuts (async/await, skip connections).",
    category: "deep-orbit",
  },
  {
    id: 25,
    mlConcept: "Learning rate scheduling",
    feConcept: "Animation easing functions",
    tier: "structural",
    connection:
      "Both vary the rate of change over time. Easing functions start fast and slow down (or vice versa); LR schedulers reduce the learning rate as training progresses. Both optimize the trajectory.",
    category: "deep-orbit",
  },
  {
    id: 26,
    mlConcept: "Multi-class classification",
    feConcept: "Router with multiple routes",
    tier: "structural",
    connection:
      "Both take a single input and determine which of many categories it belongs to. A router maps URLs to views; a classifier maps inputs to classes. Both are selection mechanisms.",
    category: "deep-orbit",
  },

  // ── Neon Protocol Bridges ────────────────────────────────────────────
  {
    id: 27,
    mlConcept: "Image tensors",
    feConcept: "canvas.getImageData()",
    tier: "identity",
    connection:
      "Both represent images as flat arrays of pixel values (RGBA channels). Uint8ClampedArray from getImageData() is literally an image tensor. Same data, same structure.",
    category: "neon-protocol",
  },
  {
    id: 28,
    mlConcept: "Convolution kernels",
    feConcept: "CSS blur() / SVG filters",
    tier: "structural",
    connection:
      "Both apply a small sliding window that transforms local regions of an image. CSS blur applies a convolution kernel to pixels; CNNs apply learned kernels to feature maps.",
    category: "neon-protocol",
  },
  {
    id: 29,
    mlConcept: "Bounding boxes",
    feConcept: "getBoundingClientRect()",
    tier: "identity",
    connection:
      "Both define rectangular regions with x, y, width, height coordinates. DOM element bounds and object detection boxes use the same data structure.",
    category: "neon-protocol",
  },
  {
    id: 30,
    mlConcept: "Non-Max Suppression",
    feConcept: "debounce()",
    tier: "structural",
    connection:
      "Both keep the highest-priority event and suppress redundant ones. Debounce keeps the last call; NMS keeps the highest-confidence box and removes overlapping detections.",
    category: "neon-protocol",
  },
  {
    id: 31,
    mlConcept: "Segmentation masks",
    feConcept: "SVG clip-path / CSS masks",
    tier: "structural",
    connection:
      "Both create pixel-level boundaries that separate regions. CSS masks define visible/hidden areas; segmentation masks label each pixel\u2019s class. Same concept, different domain.",
    category: "neon-protocol",
  },
  {
    id: 32,
    mlConcept: "Backbone networks",
    feConcept: "Shared component libraries",
    tier: "structural",
    connection:
      "Both provide reusable feature extraction that multiple downstream tasks build on. A shared UI library serves multiple apps; a backbone CNN serves multiple vision tasks.",
    category: "neon-protocol",
  },

  // ── Signal Ward Bridges ──────────────────────────────────────────────
  {
    id: 33,
    mlConcept: "Tokenization",
    feConcept: "URL parsing / route splitting",
    tier: "identity",
    connection:
      "Both break continuous input into discrete structured parts. A URL parser splits /path/:param/ into segments; a tokenizer splits text into tokens. Same operation, different input.",
    category: "signal-ward",
  },
  {
    id: 34,
    mlConcept: "Word embeddings",
    feConcept: "i18n translation dictionaries",
    tier: "structural",
    connection:
      "Both map symbolic identifiers to meaningful representations. i18n maps keys to localized strings; embeddings map tokens to dense vectors in semantic space. Both enable meaning-aware processing.",
    category: "signal-ward",
  },
  {
    id: 35,
    mlConcept: "RNN state accumulation",
    feConcept: "Array.reduce()",
    tier: "identity",
    connection:
      "Both process a sequence element-by-element, carrying forward an accumulated state. reduce() builds a result by folding over an array; RNNs build a hidden state by folding over a sequence. Identical pattern.",
    category: "signal-ward",
  },
  {
    id: 36,
    mlConcept: "LSTM cell memory",
    feConcept: "Session storage",
    tier: "structural",
    connection:
      "Both maintain persistent state across sequential processing steps that can be selectively read and updated. Session storage persists across page navigations; LSTM cells persist across timesteps.",
    category: "signal-ward",
  },
  {
    id: 37,
    mlConcept: "Attention mechanism",
    feConcept: "Search engine ranking",
    tier: "structural",
    connection:
      "Both dynamically weight inputs by relevance to a query. Search ranks documents by query relevance; attention weights tokens by relevance to each other. Both are learned relevance scoring.",
    category: "signal-ward",
  },
  {
    id: 38,
    mlConcept: "Transformer architecture",
    feConcept: "React virtual DOM reconciliation",
    tier: "intuition",
    connection:
      "Both are reconciliation engines that compare current state to desired state. React\u2019s vDOM processes the component tree and computes diffs; transformers process input tokens and compute attention-weighted representations.",
    category: "signal-ward",
  },

  // ── Nova Canvas Bridges ──────────────────────────────────────────────
  {
    id: 39,
    mlConcept: "Sampling from distributions",
    feConcept: "Math.random()",
    tier: "identity",
    connection:
      "Both generate values from probability distributions. Math.random() samples uniformly; generative models sample from learned distributions. Same operation with learned parameters.",
    category: "nova-canvas",
  },
  {
    id: 40,
    mlConcept: "Latent space interpolation",
    feConcept: "CSS transitions between states",
    tier: "structural",
    connection:
      "Both create smooth intermediate values between two defined points. CSS transitions interpolate between start and end styles; latent interpolation generates smooth blends between generated outputs.",
    category: "nova-canvas",
  },
  {
    id: 41,
    mlConcept: "GAN (generator vs. discriminator)",
    feConcept: "Fuzzer vs. validator",
    tier: "structural",
    connection:
      "Both are adversarial systems where one component generates and another judges. A fuzzer creates random inputs; a validator rejects bad ones. GANs formalize this into a training loop.",
    category: "nova-canvas",
  },
  {
    id: 42,
    mlConcept: "VAE (encode/decode)",
    feConcept: "URL shortener",
    tier: "structural",
    connection:
      "Both compress complex data into a compact representation and reconstruct the original. A URL shortener encodes a long URL into a short code and decodes it back; a VAE encodes data into a latent vector and decodes it back.",
    category: "nova-canvas",
  },
  {
    id: 43,
    mlConcept: "Diffusion (noise \u2192 detail)",
    feConcept: "Progressive image loading",
    tier: "structural",
    connection:
      "Both start with a degraded version and iteratively refine toward full quality. Progressive JPEG loads blurry-to-sharp; diffusion denoises random noise into a coherent image. Same trajectory, different domain.",
    category: "nova-canvas",
  },
  {
    id: 44,
    mlConcept: "Style transfer",
    feConcept: "CSS theme switching",
    tier: "structural",
    connection:
      "Both apply a different appearance to the same underlying content. CSS theme switching changes colors/fonts while keeping HTML structure; style transfer changes visual style while preserving content.",
    category: "nova-canvas",
  },

  // ── Terra Grid Bridges ───────────────────────────────────────────────
  {
    id: 45,
    mlConcept: "Edge inference",
    feConcept: "CDN edge locations",
    tier: "structural",
    connection:
      "Both move computation closer to the user/data source for lower latency. CDNs serve static assets from edge PoPs; edge ML runs inference on local devices. Same architecture, different payloads.",
    category: "terra-grid",
  },
  {
    id: 46,
    mlConcept: "Model quantization",
    feConcept: "Image format tradeoffs (PNG vs. WebP)",
    tier: "structural",
    connection:
      "Both trade precision for size/speed. PNG is lossless but large; WebP is lossy but small. Float32 is precise but heavy; Int8 is approximate but fast. Same optimization decision.",
    category: "terra-grid",
  },
  {
    id: 47,
    mlConcept: "Weight pruning",
    feConcept: "Tree-shaking",
    tier: "identity",
    connection:
      "Both remove unused parts to reduce size without changing behavior. Tree-shaking eliminates dead code; pruning eliminates near-zero weights. Same optimization, different artifact.",
    category: "terra-grid",
  },
  {
    id: 48,
    mlConcept: "Knowledge distillation",
    feConcept: "Code splitting",
    tier: "structural",
    connection:
      "Both decompose a large artifact into smaller, purpose-built pieces. Code splitting breaks a bundle into route-specific chunks; distillation transfers a large model\u2019s knowledge into a smaller, faster model.",
    category: "terra-grid",
  },
  {
    id: 49,
    mlConcept: "ML pipeline (data \u2192 train \u2192 deploy)",
    feConcept: "CI/CD pipeline",
    tier: "structural",
    connection:
      "Both are automated multi-stage pipelines that transform inputs into production artifacts. CI/CD: code \u2192 build \u2192 test \u2192 deploy. ML: data \u2192 train \u2192 evaluate \u2192 deploy. Same workflow pattern.",
    category: "terra-grid",
  },
  {
    id: 50,
    mlConcept: "Drift detection",
    feConcept: "Lighthouse CI",
    tier: "structural",
    connection:
      "Both continuously monitor a production system for degradation against baselines. Lighthouse CI flags performance regressions; drift detection flags model accuracy regressions. Same monitoring pattern.",
    category: "terra-grid",
  },
];
