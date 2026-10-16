export type BridgeTier = "identity" | "structural" | "intuition";

export type BridgeCategory =
  | "shared"
  | "deep-orbit"
  | "neon-protocol"
  | "signal-ward"
  | "nova-canvas"
  | "terra-grid";

export type Framework = "react";

export interface BridgeVariant {
  jsCode: string;
  jsConcept?: string;
}

export interface Bridge {
  id: number;
  mlConcept: string;
  jsConcept: string;
  tier: BridgeTier;
  connection: string;
  category: BridgeCategory;
  variants?: Partial<Record<Framework, BridgeVariant>>;
  /**
   * One- to three-sentence statement of the concrete failure mode if a learner
   * pushes this analogy too far. Required by content guidelines for `structural`
   * and `intuition` tiers; optional for `identity`. See
   * docs/patterns/analogy-breaks-pattern.md.
   */
  breaks?: string;
  /**
   * Concrete TFJS snippet illustrating the ML side of the bridge. Rendered on
   * the /bridges page next to the per-framework JS variants so readers see
   * both sides in real code, not prose. Optional but strongly preferred.
   */
  mlCode?: string;
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
  shared: "All Worlds",
  "deep-orbit": "Deep Orbit",
  "neon-protocol": "Neon Protocol",
  "signal-ward": "Signal Ward",
  "nova-canvas": "Nova Canvas",
  "terra-grid": "Terra Grid",
};

export const BRIDGES: Bridge[] = [
  // ── Shared Bridges (All Worlds) ──────────────────────────────────────
  {
    id: 1,
    mlConcept: "Training data",
    jsConcept: "Component props",
    tier: "structural",
    connection:
      "Props supply inputs to a component. Training examples supply inputs and targets for fitting a model. Changing the examples can change the learned weights, but only when training uses those examples.",
    breaks:
      "A component can render again with new props. The neural network here predicts with its current weights; replacing the training dataset does not update them automatically. Other systems, such as nearest-neighbor models and retrieval, may still use stored examples at inference.",
    category: "shared",
    variants: {
      react: {
        jsCode: `function Card({ title, image }) {\n  return <div>{title}</div>;\n}`,
      },
    },
    mlCode:
      "const trainData = tf.tensor2d(features); model.fit(trainData, labels)",
  },
  {
    id: 2,
    mlConcept: "Model parameters (weights)",
    jsConcept: "Component state",
    tier: "structural",
    connection:
      "Component state and model weights are stored values that can change. Application logic updates state; a training optimizer updates model weights. A prediction normally reads the weights without training them.",
    breaks:
      "You choose what each state field means and how it changes. Training fits parameters within the chosen model; their interpretation depends on that model. Updates can be reproducible under a controlled setup, so learned does not mean random at inference.",
    category: "shared",
    variants: {
      react: {
        jsCode: `const [count, setCount] = useState(0);`,
      },
    },
    mlCode: "model.getWeights().forEach(w => console.log(w.shape))",
  },
  {
    id: 3,
    mlConcept: "Loss function",
    jsConcept: "expect().toBe() assertions",
    tier: "structural",
    connection:
      "A test assertion checks whether a result matches an expectation. A loss scores prediction errors using a chosen rule, such as averaging squared differences. Both compare results with targets, but they report different kinds of evidence.",
    breaks:
      "Jest toBe passes or throws using Object.is equality. A training loss supplies a numerical objective; MSE and the stable logits loss provide gradients for the examples here. A loss need not be a mathematical distance or be smooth everywhere. For example, absolute-error loss has a corner at zero.",
    category: "shared",
    variants: {
      react: {
        jsCode: `expect(actual).toBe(expected);\n// Pass, or throw when Object.is equality fails.`,
        jsConcept: "Jest assertion",
      },
    },
    mlCode: "const loss = tf.losses.meanSquaredError(yTrue, yPred)",
  },
  {
    id: 4,
    mlConcept: "Gradient descent",
    jsConcept: "Reconciliation",
    tier: "intuition",
    connection:
      "A state change asks React to update the UI. A gradient step updates model weights using the loss's local derivatives. Both update stored values, but React reconciliation does not minimize a training loss.",
    breaks:
      "React compares UI trees and applies rendering rules; it does not follow a loss gradient. Gradient descent may use the whole dataset or a sampled batch, and a step can increase loss. Neither this analogy nor a falling training loss guarantees convergence or useful predictions on new data.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// React reconciles: diffing old vDOM vs new vDOM\nconst [value, setValue] = useState(initial);\n// Each setState triggers reconciliation toward target`,
      },
    },
    mlCode:
      "model.compile({ optimizer: tf.train.adam(0.001), loss: 'mse' });\nawait model.fit(x, y, { epochs: 50 }); // inspect the measured loss history",
  },
  {
    id: 5,
    mlConcept: "Learning rate",
    jsConcept: "Bisection / binary-search step halving",
    tier: "intuition",
    connection:
      "Binary search halves a sorted search interval. A learning-rate schedule can also reduce a number over successive steps, but it changes the size of optimizer updates rather than narrowing a known interval around an answer.",
    breaks:
      "Binary search preserves a valid interval when its ordering assumptions hold. A smaller learning rate does not prove that weights are closer to a minimum, and the gradient need not be noisy. Choose and evaluate a schedule; an excessive rate can diverge, while a very small one can make progress slow.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Binary search converges by halving each step\nfunction bsearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n}`,
      },
    },
    mlCode:
      "// Example schedule, not a guarantee of convergence.\nconst optimizer = tf.train.sgd(0.01);\nmodel.compile({ optimizer, loss: 'meanSquaredError' });\nfor (let epoch = 0; epoch < 50; epoch++) {\n  optimizer.setLearningRate(0.01 * 0.5 ** Math.floor(epoch / 10));\n  await model.fit(x, y, { epochs: 1 });\n}",
  },
  {
    id: 6,
    mlConcept: "Epochs",
    jsConcept: "setImmediate() self-scheduling loop",
    tier: "structural",
    connection:
      "A self-scheduling Node callback queues another turn with setImmediate(). A training loop also repeats work, but its unit is an epoch: one pass over the training dataset. Repetition alone does not guarantee that loss falls.",
    breaks:
      "Scheduling another callback does not make expensive work inside it nonblocking. Training stops at a configured epoch limit or another explicit rule, such as early stopping on validation loss. In TensorFlow.js 4.22, save and restore the best weights yourself; its early-stopping callback does not restore them.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Integration sketch: processEpoch returns a Promise; reportError handles failures.\nuseEffect(() => {\n  let cancelled = false;\n  async function run() {\n    for (let epoch = 0; epoch < 50 && !cancelled; epoch++) {\n      await processEpoch(data);\n    }\n  }\n  run().catch(reportError);\n  return () => { cancelled = true; }; // stops subsequent epochs\n}, []);`,
        jsConcept: "Bounded async loop",
      },
    },
    mlCode:
      "for (let epoch = 0; epoch < 50; epoch++) { await model.fit(x, y, { epochs: 1, batchSize: 32 }); }",
  },
  {
    id: 7,
    mlConcept: "Batch size",
    jsConcept: "Chunk / page size",
    tier: "structural",
    connection:
      "How much do you process at once? Pagination answers that for UX: whatever fits on a screen. Batch size answers it for training: however many samples per gradient update the memory budget and the throughput target allow.",
    breaks:
      "Page size affects a UI's loading and reading experience. Training batch size affects memory, throughput and the gradient estimate. Smaller batches can add gradient variation, but neither small nor large batches guarantee better generalization.",
    category: "shared",
    variants: {
      react: {
        jsCode: `const page = data.slice(offset, offset + PAGE_SIZE);`,
      },
    },
    mlCode: "model.fit(x, y, { batchSize: 32 })",
  },
  {
    id: 8,
    mlConcept: "Overfitting",
    jsConcept: "Overspecialized component",
    tier: "intuition",
    connection:
      "A component written for a few examples can fail on other inputs. An overfit model also performs much better on its training examples than on new ones. Check both with inputs that were not used to build them.",
    breaks:
      "A model can return a plausible score even when it is wrong. Compare training and validation results to investigate overfitting, and reserve an untouched test set for the final evaluation. A performance gap can also reflect different data distributions, so inspect the examples and split.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Too specific: breaks with new data shapes\nfunction UserCard({ user }) {\n  return <div>{user.name.first} {user.name.last}</div>;\n  // Crashes if user.name is a string\n}`,
      },
    },
    mlCode:
      "model.evaluate(validationX, validationY) // compare with training; reserve test data for final evaluation",
  },
  {
    id: 9,
    mlConcept: "Regularization",
    jsConcept: "Code linting / constraints",
    tier: "intuition",
    connection:
      "A linter constrains how code is written. L2 regularization also discourages a choice, large weight values, by adding a penalty to the training objective. Check whether that improves results on separate data.",
    breaks:
      "A lint rule can pass or fail. L2 adds a soft penalty that the optimizer balances against prediction loss; it does not guarantee better generalization. Dropout is another regularizer, but it uses random activation masks rather than an added weight penalty.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// eslint: no-unused-vars, max-depth: 3\n// Like L2 regularization: penalize complexity`,
      },
    },
    mlCode:
      "tf.layers.dense({ units: 64, kernelRegularizer: tf.regularizers.l2({ l2: 0.01 }) })",
  },
  {
    id: 10,
    mlConcept: "Feature engineering",
    jsConcept: "Data transformation / mapping",
    tier: "structural",
    connection:
      "Array.map transforms data for rendering; feature engineering transforms data for modeling. The shared move is shaping raw inputs into more useful representations before anything consumes them.",
    breaks:
      "Feature engineering needs both a useful measurement and a correct implementation. A correctly calculated feature can still hurt predictions. Fit any learned scaling on training data and test the selected features on separate examples.",
    category: "shared",
    variants: {
      react: {
        jsCode: `const features = rawData.map(d => ({\n  normalized: (d.value - min) / (max - min),\n  category: d.type === 'A' ? 1 : 0,\n}));`,
      },
    },
    mlCode: "const x = rawTensor.div(255).sub(0.5) // normalize",
  },
  {
    id: 11,
    mlConcept: "Train/test split",
    jsConcept: "Dev/prod environments",
    tier: "structural",
    connection:
      "Separate the examples used to build a model from those used to check it. Training data fits weights, validation data helps choose settings, and an untouched test set checks the selected system.",
    breaks:
      "Development and production are running environments; a data split separates evidence for different decisions. Test examples can leak into a model through preprocessing or setting choices as well as weight updates. Keep related or overlapping observations together and choose a split that matches the intended use.",
    category: "shared",
    variants: {
      react: {
        jsCode: `const apiUrl = process.env.NODE_ENV === 'production'\n  ? 'https://api.prod.com'\n  : 'http://localhost:3001';`,
      },
    },
    mlCode:
      "const split = Math.floor(data.length * 0.8); const train = data.slice(0, split)",
  },
  {
    id: 12,
    mlConcept: "Hyperparameters",
    jsConcept: "Config / environment variables",
    tier: "structural",
    connection:
      "You configure values such as learning rate, batch size and layer width. Training then fits the model's weights within that setup. You can compare configurations manually or with an automated search.",
    breaks:
      "A configuration value can interact with other settings and data. Some effects appear during training, and some need evaluation on separate examples. Use validation results to choose settings while keeping the final test set out of that search.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// next.config.js: not learned, just configured\nmodule.exports = {\n  images: { domains: ['cdn.example.com'] },\n};`,
      },
    },
    mlCode:
      "tf.layers.dense({ units: 64, kernelRegularizer: tf.regularizers.l2() })",
  },
  {
    id: 13,
    mlConcept: "Neural network layers",
    jsConcept: "Express-style middleware chain",
    tier: "structural",
    connection:
      "A middleware chain passes a result from one step to the next. A sequential network also composes transformations: each layer receives the previous layer's output. Some layers have learned parameters; others apply fixed operations.",
    breaks:
      "A neural layer has defined mathematics and inspectable parameters; learned does not mean uninspectable or random on each call. Both middleware and layers depend on order and input/output contracts. Reordering them can change behavior or cause a shape error, so it requires checking rather than a blanket rule.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// HOC composition: each layer transforms data\nconst Enhanced = withAuth(withWorld(withLogger(BaseComponent)));`,
        jsConcept: "HOC / Context provider chain",
      },
    },
    mlCode:
      "const model = tf.sequential();\nmodel.add(tf.layers.dense({ units: 64, activation: 'relu' }));\nmodel.add(tf.layers.dense({ units: 1 })); // sequential layers",
  },
  {
    id: 14,
    mlConcept: "Activation functions (ReLU)",
    jsConcept: "Math.max(0, x)",
    tier: "identity",
    connection:
      "ReLU applies the same mathematical rule as Math.max(0, x) to each tensor element: negative values become zero and positive values pass through.",
    breaks:
      "JavaScript numbers and float32 tensors can round differently. This compares the mathematical operation, not bit-for-bit storage.",
    category: "shared",
    variants: {
      react: {
        jsCode: `const relu = (x) => Math.max(0, x);`,
      },
    },
    mlCode: "tf.relu(x) // identical to Math.max(0, x), elementwise",
  },
  {
    id: 15,
    mlConcept: "Backpropagation",
    jsConcept: "Error propagation up the call stack",
    tier: "intuition",
    connection:
      "A stack trace follows a failed call back through its callers. Backpropagation also works backward through a computation, using the chain rule to calculate how small changes to parameters affect the loss.",
    breaks:
      "A stack trace reports a call path, not a numerical contribution. Backpropagation calculates local derivatives along connected paths; some derivatives can be zero. The optimizer and learning rate choose the update, so a derivative alone does not tell you how far to move a weight.",
    category: "shared",
    variants: {
      react: {
        jsCode: `class ErrorBoundary extends React.Component {\n  componentDidCatch(error, info) {\n    // Error flows backward up the tree\n  }\n}`,
        jsConcept: "Error boundary",
      },
    },
    mlCode:
      "// Backward pass: differentiate this loss with respect to connected variables.\nconst { value, grads } = tf.variableGrads(() => lossFn(model.predict(x), y));\n// The optimizer uses these gradients to choose parameter updates.",
  },
  {
    id: 16,
    mlConcept: "Model inference",
    jsConcept: "Server-side rendering",
    tier: "structural",
    connection:
      "A server-rendered page uses data to produce an output. Model inference also takes prepared input and produces an output through a forward pass, without fitting the model's weights.",
    breaks:
      "Rendering may depend on time, requests and other application state. Model inference depends on its weights, inputs, preprocessing and any carried state; a stateful recurrent model can update that state without training its weights. Control the runtime and those inputs when checking reproducibility.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Next.js SSR: one forward pass, no iteration\nexport async function getServerSideProps() {\n  const data = await fetchData();\n  return { props: { data } };\n}`,
      },
    },
    mlCode:
      "const prediction = model.predict(x); // single forward pass, no training",
  },
  {
    id: 17,
    mlConcept: "Data augmentation",
    jsConcept:
      "Programmatic test fixture factories (Faker, factory-bot, fast-check generators)",
    tier: "intuition",
    connection:
      "A fixture factory creates variations of test inputs. Data augmentation also creates variations, such as flips or noise in training images. Choose transformations that keep the target valid and resemble changes the application should handle.",
    breaks:
      "A test checks a defined behavior, while an augmented example can change learned weights. A flip, crop or noise level can invalidate a label or create unrealistic data. Keep augmentation inside the training split and evaluate on separate representative examples.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Faker generates a population of users from a distribution\nimport { faker } from '@faker-js/faker';\nconst users = Array.from({ length: 100 }, () => ({\n  name: faker.person.fullName(),\n  email: faker.internet.email(),\n  age: faker.number.int({ min: 18, max: 80 }),\n}));`,
      },
    },
    mlCode:
      "// img: [batch, height, width, channels], values in [0, 1].\n// Use these transforms only when they preserve the task's labels.\nconst augment = (img) => tf.tidy(() => {\n  const flipped = Math.random() > 0.5 ? tf.image.flipLeftRight(img) : img;\n  return flipped.add(tf.randomNormal(flipped.shape, 0, 0.03)).clipByValue(0, 1);\n});",
  },
  {
    id: 18,
    mlConcept: "Dropout",
    jsConcept: "Randomly hiding team members during practice",
    tier: "intuition",
    connection:
      "Dropout randomly masks activations during training, so a unit cannot always rely on the same other units being present. Practicing with missing team members is a loose comparison, not a guarantee that units become independent.",
    breaks:
      "TensorFlow.js uses inverted dropout: during training, kept activations are divided by 1 minus the dropout rate. At inference, the dropout layer passes its inputs through unchanged. It masks activations rather than removing units or guaranteeing better evaluation results.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Training-only inverted dropout; 0 <= rate < 1.\nconst dropout = (arr, rate = 0.2) =>\n  arr.map(v => Math.random() < rate ? 0 : v / (1 - rate));\n// Inference: return arr unchanged.`,
      },
    },
    mlCode:
      "model.add(tf.layers.dropout({ rate: 0.3 })); // ~30% units zeroed each forward pass during training",
  },
  {
    id: 19,
    mlConcept: "Confusion matrix",
    jsConcept: "Access-log tally by route and status",
    tier: "structural",
    connection:
      "An access-log tally groups requests by route and status. A confusion matrix groups labeled examples by actual and predicted class. Off-diagonal cells count mistakes; their importance also depends on the cost of each kind of error.",
    breaks:
      "A classifier can return a result without knowing whether it is correct. A confusion matrix needs reference labels, which may be delayed or missing in production. Its counts do not describe confidence or calibration, and the largest error count need not be the most costly one.",
    category: "shared",
    variants: {
      react: {
        jsCode: `const counts = Object.create(null);\nfor (const { route, status } of accessLogs) {\n  const key = route + ':' + Math.floor(status / 100) + 'xx';\n  counts[key] = (counts[key] ?? 0) + 1;\n}`,
        jsConcept: "Access-log tally",
      },
    },
    mlCode:
      "const cm = tf.math.confusionMatrix(yTrue, yPred.argMax(-1), numClasses);\ncm.print(); // rows = actual class, columns = predicted class",
  },
  {
    id: 20,
    mlConcept: "Model deployment",
    jsConcept: "CI/CD pipeline",
    tier: "structural",
    connection:
      "CI/CD deploys code; model deployment serves a model. The road from development to production runs through the same stations either way: versioning, testing, and monitoring.",
    breaks:
      "Rolling back an artifact does not restore changed inputs, dependencies or operating conditions. Model performance can change while its weights stay fixed. Version preprocessing and runtime assets with the model, then monitor both system behavior and labeled prediction quality.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// GitHub Actions: test → build → deploy\n// Same as: data → train → evaluate → deploy`,
      },
    },
    mlCode:
      "// A local model copy, not a hosted deployment or a complete offline app.\nawait model.save('indexeddb://deep-scan-v3');\nconst cached = await tf.loadLayersModel('indexeddb://deep-scan-v3');",
  },

  // ── Deep Orbit Bridges ───────────────────────────────────────────────
  {
    id: 21,
    mlConcept: "Weight initialization",
    jsConcept: "Randomized retry backoff (jitter)",
    tier: "structural",
    connection:
      "Retry jitter varies delays so clients do not all retry together. Random kernel initialization also breaks a symmetry: identical hidden units can otherwise receive identical updates. Biases often start at zero; not every parameter needs a random value.",
    breaks:
      "He initialization chooses its scale from fan-in, the number of inputs per unit; Glorot/Xavier also uses fan-out, the number of outputs. These choices aim to control activation and gradient scale, but do not guarantee stable training. Initialization sets the starting parameters; retry jitter is drawn for each retry.",
    category: "deep-orbit",
    mlCode: "tf.initializers.heNormal() // weight init for ReLU layers",
  },
  {
    id: 22,
    mlConcept: "Batch normalization",
    jsConcept: "Z-scoring a batch of samples",
    tier: "structural",
    connection:
      "Z-scoring subtracts a mean and divides by a standard deviation. Batch normalization uses a related calculation on activations during training: `(x - mean) / sqrt(variance + epsilon)`, followed by a learned scale and shift.",
    breaks:
      "Batch normalization calculates training statistics over its configured axes and updates moving statistics. At inference, the layer uses those moving statistics, even when you predict several examples together. Batch size, axes and learned scale/shift affect the result; normalization does not guarantee a fixed output scale or good predictions.",
    category: "deep-orbit",
    mlCode:
      "model.add(tf.layers.batchNormalization()); // normalize activations per mini-batch",
  },
  {
    id: 23,
    mlConcept: "Residual connections",
    jsConcept: "Object spread: { ...state, ...patch }",
    tier: "structural",
    connection:
      "A reducer returning `{ ...state, ...patch }` gives every field two ways to reach the next state: through the patch if the update touched it, straight from the old object if it did not. A residual block wires that second path into a network with `output = f(x) + x`, so the input still reaches the next layer when the block in between learns to contribute almost nothing.",
    breaks:
      "Object spread replaces a value when the patch has the same key. A residual connection adds compatible tensors instead, so both paths contribute and can cancel or reinforce each other. A changed shape needs a compatible shortcut, such as a learned projection; a 1x1 convolution is one option, not a requirement for every model.",
    category: "deep-orbit",
    mlCode:
      "// Integration sketch: attention and layerNorm are supplied functions.\nconst out = layerNorm(input.add(attention(input))); // compatible shapes",
  },
  {
    id: 24,
    mlConcept: "Vanishing gradients",
    jsConcept: "Deeply nested callback hell",
    tier: "intuition",
    connection:
      "Deeply nested callbacks can make a program hard to follow. Repeated small derivative factors can make a network's gradients tiny. The shared idea is a long chain; the actual problems and remedies differ.",
    breaks:
      "Async/await changes code structure, not gradient arithmetic. Vanishing gradients depend on weights, activations, inputs and repeated derivatives, rather than depth alone. Inspect gradients and compare suitable initialization, activations or shorter gradient paths; no one architectural change guarantees a cure.",
    category: "deep-orbit",
    mlCode: "const grad = tf.grad(loss)(weights)",
  },
  {
    id: 25,
    mlConcept: "Learning rate scheduling",
    jsConcept: "Animation easing functions",
    tier: "structural",
    connection:
      "An easing curve changes how an animation moves over time. A learning-rate schedule changes the optimizer's step-size setting over training. Decay is one option; warmup and cyclic schedules can also increase it.",
    breaks:
      "An animation has a chosen endpoint; training does not know the best weights in advance. Schedules can use epoch counts or measured metrics within a finite training budget. A smaller learning rate does not prove convergence, and early stopping is a separate decision.",
    category: "deep-orbit",
    mlCode:
      "const optimizer = tf.train.sgd(0.01);\nmodel.compile({ optimizer, loss: 'meanSquaredError' });\nawait model.fit(x, y, { epochs: 30, callbacks: {\n  onEpochBegin: epoch => optimizer.setLearningRate(0.01 * 0.5 ** Math.floor(epoch / 10)),\n} });",
  },
  {
    id: 26,
    mlConcept: "Multi-class classification",
    jsConcept: "Router with multiple routes",
    tier: "structural",
    connection:
      "A classifier maps inputs to classes the way a router maps URLs to views: one input goes in, one of many categories comes out.",
    breaks:
      "A router follows application matching rules. A softmax classifier returns normalized class scores; those are not automatically calibrated probabilities of correctness. Masking or floating-point underflow can produce zero scores, and a high score does not prove the chosen class is right.",
    category: "deep-orbit",
    mlCode:
      "// Apply once to logits; skip this if the model already outputs softmax.\nconst scores = tf.softmax(logits); // rows sum to approximately 1",
  },

  // ── Neon Protocol Bridges ────────────────────────────────────────────
  {
    id: 27,
    mlConcept: "Image tensors",
    jsConcept: "canvas.getImageData()",
    tier: "structural",
    connection:
      "An image is a numeric array of pixel values in either world. getImageData returns a flat Uint8ClampedArray (0-255 RGBA); an image tensor returns a shaped float32 tensor (often [h, w, 3]).",
    breaks:
      "getImageData ships uint8 (0-255) interleaved RGBA. Most models need float32 normalized to [0,1] (or per-channel mean/std). Skipping the cast and normalization gives an image whose pixels are 100x larger than training distribution, and the model returns nonsense.",
    category: "neon-protocol",
    mlCode: "tf.browser.fromPixels(canvas).toFloat().div(255)",
  },
  {
    id: 28,
    mlConcept: "Convolution kernels",
    jsConcept: "CSS blur() / SVG filters",
    tier: "structural",
    connection:
      "filter: blur(4px) already runs a convolution: a small kernel slides over the pixels and transforms each local region. A CNN layer is that operation with one twist that changes everything: its kernels are learned from data rather than fixed by the browser.",
    breaks:
      "CSS blur uses a fixed Gaussian kernel hard-coded in the browser. CNN convolution uses learned kernels that update during training to detect features specific to the dataset. Same operation; one is hand-tuned, the other is data-tuned and changes per model.",
    category: "neon-protocol",
    mlCode:
      "model.add(tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' }));",
  },
  {
    id: 29,
    mlConcept: "Bounding boxes",
    jsConcept: "getBoundingClientRect()",
    tier: "identity",
    connection:
      "DOM element bounds and object detection boxes use the same data structure: a rectangular region defined by x, y, width, height coordinates.",
    category: "neon-protocol",
    mlCode: "{ x, y, width, height } // bbox tuple",
  },
  {
    id: 30,
    mlConcept: "Non-Max Suppression",
    jsConcept: "Toast dedupe (suppressing overlapping notifications)",
    tier: "intuition",
    connection:
      "Both apply a 'one winner per region' rule to a redundant feed. A toast system suppresses a new alert if a similar one is already onscreen; NMS suppresses a detection if it overlaps a higher-confidence one above an IoU threshold. Same intuition: pick the strongest, hide the rest.",
    breaks:
      "Toast dedupe is single-axis (time + key match), a boolean check on identifier. NMS is two-dimensional, runs IoU(boxA, boxB) over every kept pair, and the threshold is a tunable scalar that trades recall for precision (lower threshold → fewer kept boxes). Toasts dedupe by equality; NMS dedupes by geometric overlap.",
    category: "neon-protocol",
    mlCode: "tf.image.nonMaxSuppression(boxes, scores, 100, 0.5)",
  },
  {
    id: 31,
    mlConcept: "Segmentation masks",
    jsConcept: "SVG clip-path / CSS masks",
    tier: "structural",
    connection:
      "Pixel-level boundaries, twice over: a clip-path\u2019s are drawn by an author to decide which pixels show, while a segmentation mask\u2019s are predicted by a model deciding which class each pixel belongs to.",
    breaks:
      "CSS masks are author-defined geometry. Segmentation masks are model output: pixel-level predictions with confidence per pixel, often imperfect at boundaries. The mask must be thresholded and cleaned before use; CSS clip-paths do not need post-processing.",
    category: "neon-protocol",
    mlCode:
      "const mask = model.predict(image).argMax(-1) // [H, W] class per pixel",
  },
  {
    id: 32,
    mlConcept: "Backbone networks",
    jsConcept: "Shared component libraries",
    tier: "structural",
    connection:
      "A shared UI library serves multiple apps; a backbone CNN serves multiple vision tasks. Reusable feature extraction that downstream consumers build on instead of starting from scratch.",
    breaks:
      "UI libraries are versioned, stable, and you compose them deterministically. Backbones are trained on specific datasets (ImageNet) and carry that bias forward; fine-tuning on different data may erase or compete with the pre-trained features. Reuse is not free of side effects.",
    category: "neon-protocol",
    mlCode: "const backbone = await tf.loadLayersModel('mobilenet/model.json')",
  },

  // ── Signal Ward Bridges ──────────────────────────────────────────────
  {
    id: 33,
    mlConcept: "Tokenization",
    jsConcept: "URL parsing / route splitting",
    tier: "structural",
    connection:
      "URL parsing splits at known delimiters with deterministic regex; subword tokenizers split text using learned merge rules. Either way, continuous input becomes discrete structured parts.",
    breaks:
      "URL parsing uses regex YOU control. Subword tokenizers (BPE, WordPiece, SentencePiece) learn merge rules from a training corpus and the same word can tokenize to 1 token in one model and 5 in another. Tokenization is part of the model artifact; you cannot regex your way out of a tokenizer mismatch at inference.",
    category: "signal-ward",
    mlCode:
      "const tokens = tokenizer.encode('clinical text') // [101, 4321, ...]",
  },
  {
    id: 34,
    mlConcept: "Word embeddings",
    jsConcept: "i18n translation dictionaries",
    tier: "structural",
    connection:
      "What if a translation dictionary knew that 'king' and 'queen' were related? i18n maps keys to strings with no such structure. Embeddings map tokens to vectors in a space where distance is meaning, and that structure is what makes meaning-aware processing possible.",
    breaks:
      "i18n maps key → exact translated string with no semantic relationship between keys. Embeddings place tokens in a continuous vector space where distance encodes meaning (`king - man + woman ≈ queen`). The mapping has structure i18n does not.",
    category: "signal-ward",
    mlCode:
      "const embed = tf.layers.embedding({ inputDim: vocab, outputDim: 128 });\nconst vec = embed.apply(tokenIds); // [batch, seqLen, 128]",
  },
  {
    id: 35,
    mlConcept: "RNN state accumulation",
    jsConcept: "Array.reduce()",
    tier: "structural",
    connection:
      "reduce() folds a sequence element-by-element with a function YOU define, carrying forward accumulated state; an RNN does the same fold with a learned cell. Same walk over the sequence, same running accumulator.",
    breaks:
      "You write the reducer's update rule; training adjusts an RNN's weights within its configured cell and activations. You can inspect those weights and trace each state update. The initial state and model version also matter: stateless recurrent layers reset state between windows while keeping their trained weights.",
    category: "signal-ward",
    mlCode: "tf.layers.simpleRNN({ units: 64, returnSequences: false })",
  },
  {
    id: 36,
    mlConcept: "LSTM cell memory",
    jsConcept: "sessionStorage, or per-connection state on a socket",
    tier: "structural",
    connection:
      "State that has to survive navigation goes in sessionStorage, the per-tab store a browser keeps until the tab closes; on a Node socket server the same job goes to an object you hang off the connection and read again on the next message. Either way something persists between turns and you decide what to write each turn. An LSTM threads that need through time: cell state carries forward across timesteps, and learned gates decide at each step what to keep, what to overwrite, and what to hand on.",
    breaks:
      "Both of those stores are addressed by keys you picked, and you can read any key whenever you want. LSTM cell state is one fixed-size vector of floats with no keys at all: the gates are learned functions that decide per timestep how much of each slot to erase and how much to add. Nothing guarantees a slot means one thing, so there is no entry to look up and no value you can set by hand.",
    category: "signal-ward",
    mlCode: "tf.layers.lstm({ units: 128, returnSequences: true })",
  },
  {
    id: 37,
    mlConcept: "Attention mechanism",
    jsConcept: "Search engine ranking",
    tier: "structural",
    connection:
      "Search ranks documents by relevance to a query; attention weights tokens by relevance to each other. Learned relevance scoring in each case: inputs get dynamically reweighted by how much they matter to the question being asked.",
    breaks:
      "Search ranking is a one-shot scoring of documents against one query. Attention runs at every layer for every token, with each token attending to every other token: quadratic cost in sequence length. Same scoring shape, very different scale and frequency.",
    category: "signal-ward",
    mlCode:
      "const scores = tf.softmax(Q.matMul(K.transpose()).div(Math.sqrt(dk)), -1)",
  },
  {
    id: 38,
    mlConcept: "Transformer architecture",
    jsConcept: "React virtual DOM reconciliation",
    tier: "intuition",
    connection:
      "React\u2019s vDOM processes the component tree and computes diffs; transformers process input tokens and compute attention-weighted representations. Each is a reconciliation engine comparing current state to desired state.",
    breaks:
      "vDOM diffs current vs target tree once per render and applies known patches. Transformers compute soft attention weights every forward pass and the 'patches' are learned matrix operations on continuous activations. Treat the reconciliation framing as a mnemonic, not as math.",
    category: "signal-ward",
    mlCode:
      "const Wq = tf.layers.dense({ units: dModel });\nconst attn = tf.softmax(Wq.apply(x).matMul(K.transpose()).div(Math.sqrt(dk)));\nconst out = layerNorm(x.add(attn.matMul(V)));",
  },

  // ── Nova Canvas Bridges ──────────────────────────────────────────────
  {
    id: 39,
    mlConcept: "Sampling from distributions",
    jsConcept: "Math.random()",
    tier: "structural",
    connection:
      "Every call to Math.random() is a draw from the one distribution the JS runtime hands you. A generative model spends its entire training learning a distribution of its own to draw from.",
    breaks:
      "Math.random() samples uniformly from [0,1) with no parameters to learn. Generative models sample from a high-dimensional learned distribution that may have multiple modes, an unrepresentable tail, or unsafe regions. Sampling temperature, top-k, top-p: all knobs Math.random() does not have.",
    category: "nova-canvas",
    mlCode: "tf.randomNormal([latentDim]) // sample seed",
  },
  {
    id: 40,
    mlConcept: "Latent space interpolation",
    jsConcept: "CSS transitions between states",
    tier: "structural",
    connection:
      "CSS transitions interpolate between start and end styles; latent interpolation generates smooth blends between generated outputs. Smooth intermediate values between two defined points, in stylesheets or in latent space.",
    breaks:
      "CSS transitions interpolate fixed properties along defined easing curves. Latent interpolation walks a path in a learned space where dimensions have no human meaning; in-between points may be coherent or garbage depending on whether the trajectory stays on the data manifold.",
    category: "nova-canvas",
    mlCode:
      "const z = z1.mul(t).add(z2.mul(1 - t)); // linear walk between latent vectors",
  },
  {
    id: 41,
    mlConcept: "GAN (generator vs. discriminator)",
    jsConcept: "Fuzzer vs. validator",
    tier: "structural",
    connection:
      "Both are adversarial systems where one component generates and another judges. A fuzzer creates random inputs; a validator rejects bad ones. GANs formalize this into a training loop.",
    breaks:
      "Fuzzers and validators have separate, hand-written goals. GAN generator and discriminator co-evolve and can collapse: generator finds one output that fools the discriminator and stops exploring (mode collapse). The adversarial loop is unstable in ways a fuzzer/validator pair is not.",
    category: "nova-canvas",
    mlCode:
      "const fakes = generator.predict(noise); const dLoss = bceLoss(disc(fakes), tf.zeros([batch]))",
  },
  {
    id: 42,
    mlConcept: "VAE (encode/decode)",
    jsConcept: "URL shortener",
    tier: "structural",
    connection:
      "Encode, store small, decode back. A URL shortener does that round trip with links; a VAE does it with data, compressing into a latent vector and reconstructing the original from it.",
    breaks:
      "URL shorteners encode losslessly: decode reproduces the input exactly. VAEs encode lossy and probabilistic: the latent vector is a distribution, decoding samples from it. Reconstruction is approximate and nondeterministic.",
    category: "nova-canvas",
    mlCode:
      "const epsilon = tf.randomNormal(mu.shape);\nconst z = mu.add(tf.exp(logVar.mul(0.5)).mul(epsilon)); // reparameterization sample",
  },
  {
    id: 43,
    mlConcept: "Diffusion (noise \u2192 detail)",
    jsConcept: "Progressive image loading",
    tier: "structural",
    connection:
      "Progressive JPEG loads blurry-to-sharp; diffusion denoises random noise into a coherent image. Start degraded, refine step by step toward full quality.",
    breaks:
      "Progressive JPEG decodes a fixed encoded payload from header to detail. Diffusion runs many denoising steps (50-1000), each a learned model call. Compute scales with quality, not file size. Same blurry-to-sharp visual, very different runtime cost.",
    category: "nova-canvas",
    mlCode:
      "const xT = sqrt(alphaBar).mul(x0).add(sqrt(1 - alphaBar).mul(noise))",
  },
  {
    id: 44,
    mlConcept: "Style transfer",
    jsConcept:
      "Auto-formatter pipeline (Prettier / eslint --fix rewriting code until it matches a style config)",
    tier: "intuition",
    connection:
      "Prettier takes code that already works and rewrites its surface until it matches a style config, leaving the meaning alone. Style transfer does that to an image: keep the content, nudge the pixels step by step until their texture statistics match the reference painting's.",
    breaks:
      "Prettier is deterministic: parse, apply rules, done in one pass, and the style itself is a config file you can read. Style transfer is gradient descent against a frozen network over hundreds of passes, and its 'style' is a grid of feature correlations (the Gram matrix) no human can read; the output shifts with initialization, learning rate, and step count.",
    category: "nova-canvas",
    mlCode:
      "// Style transfer: optimize pixels until Gram-matrix features match the style image\nlet x = tf.variable(content.clone());\nfor (let step = 0; step < 200; step++) {\n  const { value: loss, grads } = tf.variableGrads(() =>\n    contentLoss(vgg(x), vgg(content)).add(\n      styleLoss(gram(vgg(x)), gram(vgg(style))).mul(1e3)\n    ) as tf.Scalar\n  );\n  optimizer.applyGradients(grads);\n}",
  },

  // ── Terra Grid Bridges ───────────────────────────────────────────────
  {
    id: 45,
    mlConcept: "Edge inference",
    jsConcept: "CDN edge locations",
    tier: "structural",
    connection:
      "CDNs answered 'the server is too far away' by moving assets to edge PoPs. Edge ML answers the same complaint for inference: run the model on the device, next to the data, and the round trip disappears.",
    breaks:
      "CDN edge nodes serve immutable static assets with predictable per-region SLAs and centralized cache-purging. Edge inference runs on heterogeneous user devices: variable RAM, no GPU on most phones, intermittent connectivity, and OTA model updates that must succeed against possibly-stale runtimes. The same model can hit 30ms on desktop WebGL and 800ms on a budget Android in CPU mode.",
    category: "terra-grid",
    mlCode:
      "const model = await tf.loadLayersModel(indexedDBPath) // run inference on-device",
  },
  {
    id: 46,
    mlConcept: "Model quantization",
    jsConcept: "Image format tradeoffs (PNG vs. WebP)",
    tier: "structural",
    connection:
      "Image compression can reduce the bytes you download. Weight quantization can also reduce stored bytes by representing weights with fewer bits, at the cost of rounding error. Neither file format nor numeric precision alone establishes runtime speed.",
    breaks:
      "WebP supports both lossy and lossless encoding. TensorFlow.js converter weight quantization reduces stored weight bytes but loads them into floating-point tensors; it does not by itself give integer inference. Other quantization methods can include activations and calibration, so inspect the export and backend, then measure size, quality and speed separately.",
    category: "terra-grid",
    mlCode:
      "// Converter option: --quantize_uint8 (weight storage quantization).\n// It is not a switch to integer inference kernels.\nconst model = await tf.loadGraphModel('web_model/model.json');",
  },
  {
    id: 47,
    mlConcept: "Weight pruning",
    jsConcept: "Tree-shaking",
    tier: "structural",
    connection:
      "Tree-shaking removes code that a bundler can establish is unused. Magnitude pruning instead sets small weights to zero, then checks whether the model still performs well.",
    breaks:
      "An unused export has no consumer; a small weight can still affect a prediction. Setting weights to zero leaves a dense tensor the same size and may not speed up dense kernels. Measure quality and performance, and use a sparse format or smaller architecture when actual size or compute reduction is required.",
    category: "terra-grid",
    mlCode:
      "// Magnitude pruning, not an L1 training penalty.\nconst pruned = tf.tidy(() => weights.mul(weights.abs().greaterEqual(threshold).cast(weights.dtype)));\n// Same dense shape and storage size. Dispose pruned when finished.",
  },
  {
    id: 48,
    mlConcept: "Knowledge distillation",
    jsConcept: "Code splitting",
    tier: "structural",
    connection:
      "When a bundle gets too big, you split it. When a model gets too big, you distill it: train a small student to mimic the large teacher's outputs, then ship only the student.",
    breaks:
      "Code splitting decomposes one bundle into chunks of the same code. Distillation creates a different, smaller model that approximates the teacher: the student is not the teacher carved up; it is a separate model trained to mimic the teacher's outputs.",
    category: "terra-grid",
    mlCode:
      "const T = 4;\nconst pT = teacherLogits.div(T).softmax();\nconst pS = studentLogits.div(T).softmax();\nconst klLoss = pT.mul(pT.div(pS).log()).sum().mul(T * T); // T² scales gradient back",
  },
  {
    id: 49,
    mlConcept: "ML pipeline (data \u2192 train \u2192 deploy)",
    jsConcept: "CI/CD pipeline",
    tier: "structural",
    connection:
      "CI/CD: code \u2192 build \u2192 test \u2192 deploy. ML: data \u2192 train \u2192 evaluate \u2192 deploy. Same workflow pattern: an automated multi-stage pipeline that transforms inputs into production artifacts.",
    breaks:
      "CI/CD outputs are deterministic and identical given identical inputs. ML pipeline outputs (trained models) vary across runs even with fixed code due to random init, data shuffling, and GPU nondeterminism. Reproducibility requires extra effort (seeds, deterministic kernels).",
    category: "terra-grid",
    mlCode: "model.save('file://./artifacts/v1/model'); // versioned export",
  },
  {
    id: 50,
    mlConcept: "Drift detection",
    jsConcept: "p95 latency alert against a stored baseline",
    tier: "structural",
    connection:
      "Your service records p95 latency, the value 95 percent of requests come in under, and an alert fires when this week's traffic sits far enough above the stored baseline. Drift detection asks production the same question about model inputs: has the distribution arriving now moved away from the distribution the model trained on?",
    breaks:
      "The latency alert measures the thing you care about. Requests really did get slower, and the number is the problem. Drift measures the inputs and only suggests something about accuracy: it scores distributions with PSI, KL, or a KS test against a threshold you tune, it can fire on a harmless shift such as a new market or a renamed category, and a model can rot with no drift signal at all. Confirming a drift alert takes labeled holdout data, which arrives late or never.",
    category: "terra-grid",
    mlCode: "const psi = computePSI(baselineDistribution, currentDistribution)",
  },
  {
    id: 51,
    mlConcept: "Multi-armed bandit (ε-greedy / UCB1)",
    jsConcept: "Dynamic ad rotation",
    tier: "structural",
    connection:
      "An ad server splits traffic the way a careful gambler splits bets: most impressions go to the best-known creative, and a small share goes to the others in case one of them is secretly better. That is the bandit loop. Exploit the strongest arm, keep exploring the rest, and let the reward estimates update as the clicks come in.",
    breaks:
      "Ad rotation enjoys fast, clear reward signals and arms that stay put over the test window. Production bandits rarely get any of that: rewards arrive late (retention takes weeks to observe), arms are non-stationary (the model behind a variant drifts), every new variant starts as an unpulled arm, and a click is a noisy proxy for the outcome you actually care about. Thompson sampling and UCB1 are not interchangeable knobs.",
    category: "terra-grid",
    mlCode:
      "// ε-greedy: 15% random exploration, 85% exploit highest-reward arm\nconst pick = Math.random() < 0.15 ? randomArm() : argmaxReward(arms);",
  },
];

// Authored lesson names may be shorter than the catalog names. Keep aliases
// explicit: a familiar JS API alone does not identify the ML concept it teaches.
const LESSON_BRIDGE_ALIASES = [
  { id: 3, jsTitle: "expect().toBe()", mlTitle: "Loss Function" },
  { id: 10, jsTitle: "Data Transformation", mlTitle: "Feature Engineering" },
  { id: 14, jsTitle: "Math.max(0, x)", mlTitle: "ReLU Activation" },
  { id: 15, jsTitle: "Error up the call stack", mlTitle: "Backpropagation" },
  { id: 47, jsTitle: "Tree-Shaking", mlTitle: "Pruning" },
] as const;

const normalizeBridgeTitle = (title: string) => title.trim().toLowerCase();

export function resolveLessonBridge(
  jsTitle: string,
  mlTitle: string,
): Bridge | undefined {
  const js = normalizeBridgeTitle(jsTitle);
  const ml = normalizeBridgeTitle(mlTitle);
  const exact = BRIDGES.find(
    (bridge) =>
      normalizeBridgeTitle(bridge.jsConcept) === js &&
      normalizeBridgeTitle(bridge.mlConcept) === ml,
  );
  if (exact) return exact;
  const alias = LESSON_BRIDGE_ALIASES.find(
    (pair) =>
      normalizeBridgeTitle(pair.jsTitle) === js &&
      normalizeBridgeTitle(pair.mlTitle) === ml,
  );
  return alias ? BRIDGES.find((bridge) => bridge.id === alias.id) : undefined;
}
