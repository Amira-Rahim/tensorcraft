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
   * the /bridges page next to the per-framework FE variants so readers see
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
      "Props configure a component from the outside; training data configures a model the same way. Swap the props and you get a different render. Swap the data and you get a different model, but only after retraining.",
    breaks:
      "Props can change every render and the component re-renders pure; training data is consumed during training to mutate weights, then the weights are baked in and the data is not needed at inference. Changing props after the fact updates the UI; changing training data after the fact does nothing without retraining.",
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
      "Component state and model weights are the internal values the system owns and mutates in response to inputs. State updates from user events; weights update from training data. Distinct from props (external config, see bridge #1) and from overfitting (generalization failure, see bridge #8); this bridge is about where the mutable internal values live.",
    breaks:
      "State updates instantly on user events with deterministic transitions; weights update slowly via gradient descent over many iterations and the update rule is stochastic. State is small and hand-written; weights are millions of floats with no semantic meaning per index.",
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
      "A test assertion checks actual === expected; a loss function computes the distance between predictions and labels. Each one measures the gap between actual and expected output, quantifies \u201chow wrong,\u201d and drives corrections.",
    breaks:
      "Test assertions return a binary pass/fail; loss returns a continuous, differentiable scalar. You cannot take the gradient of `toBe()`; that is why ML loss functions are smooth (MSE, cross-entropy) instead of strict equality.",
    category: "shared",
    variants: {
      react: {
        jsCode: `expect(actual).toBe(expected);\n// gap = |actual - expected|`,
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
      "Call setState and React patches the DOM a little closer to the desired tree. Call fit and gradient descent nudges weights a little closer to minimum loss. One measured gap, shrunk one step at a time.",
    breaks:
      "Reconciliation is deterministic and converges in one pass to the exact desired DOM. Gradient descent is stochastic, requires many iterations, and may overshoot or settle in a local minimum that is not the global optimum.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// React reconciles: diffing old vDOM vs new vDOM\nconst [value, setValue] = useState(initial);\n// Each setState triggers reconciliation toward target`,
      },
    },
    mlCode:
      "model.compile({ optimizer: tf.train.adam(0.001), loss: 'mse' });\nawait model.fit(x, y, { epochs: 50 }); // descend toward minimum",
  },
  {
    id: 5,
    mlConcept: "Learning rate",
    jsConcept: "Bisection / binary-search step halving",
    tier: "intuition",
    connection:
      "Binary search halves the search interval each iteration; learning-rate decay shrinks the gradient step as training approaches a minimum. Take big steps while you are far from the target, small ones once you are close.",
    breaks:
      "Binary search comes with a proof: every halving still contains the answer, so it converges in log(n) steps. A gradient step carries no such guarantee. Each one follows a noisy gradient estimate, too large a rate overshoots and diverges, too small stalls short of the minimum, and no formula hands you the right value.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Binary search converges by halving each step\nfunction bsearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n}`,
      },
    },
    mlCode:
      "// Step decay: halve the LR every K epochs as training nears convergence\nlet lr = 0.01;\nfor (let epoch = 0; epoch < 50; epoch++) {\n  if (epoch > 0 && epoch % 10 === 0) lr *= 0.5;\n  optimizer.learningRate = lr;\n}",
  },
  {
    id: 6,
    mlConcept: "Epochs",
    jsConcept: "requestAnimationFrame loop",
    tier: "structural",
    connection:
      "requestAnimationFrame(loop) reruns the render logic as soon as the last frame finishes, and the animation creeps toward its target. Training does this with the whole dataset: one epoch ends, the next begins, and the loss creeps down.",
    breaks:
      "rAF runs at 60Hz with deterministic frame timing on in-memory data. An epoch can take seconds to hours per iteration, runs as fast as the GPU allows, and reads batches from disk or network. What carries over is the loop, not the clock.",
    category: "shared",
    variants: {
      react: {
        jsCode: `useEffect(() => {\n  let id = requestAnimationFrame(function loop() {\n    processEpoch(data);\n    if (!converged) id = requestAnimationFrame(loop);\n  });\n  return () => cancelAnimationFrame(id);\n}, []);`,
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
      "Page size is chosen for UX (what fits on screen); batch size is chosen for memory and gradient noise tradeoff. Larger pages are usually better for users; larger batches are not always better for training; small batches add useful noise that improves generalization.",
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
      "An overspecialized component breaks with new data; an overfit model fails on new examples. The disease is the same (too tailored to the specific inputs it grew up with) and the cure is generalization.",
    breaks:
      "An overspecialized component breaks visibly with new data; you see the bug. An overfit model still runs and returns confident wrong answers; it can only be detected by holding out test data. The failure mode is silent.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Too specific: breaks with new data shapes\nfunction UserCard({ user }) {\n  return <div>{user.name.first} {user.name.last}</div>;\n  // Crashes if user.name is a string\n}`,
      },
    },
    mlCode: "model.evaluate(testX, testY) // val loss diverges from train loss",
  },
  {
    id: 9,
    mlConcept: "Regularization",
    jsConcept: "Code linting / constraints",
    tier: "intuition",
    connection:
      "Why does a model need a complexity penalty at all? For the reason a codebase needs a linter: left alone, each drifts toward solutions that are too specific and too convoluted. Linting constrains style, regularization constrains model complexity, and the payoff in either case is something that generalizes.",
    breaks:
      "Linting enforces hard rules at write time. Regularization adds a soft penalty during training that the optimizer trades off against loss. A linter never decides this rule is worth violating for a 5% accuracy gain; an optimizer does.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// eslint: no-unused-vars, max-depth: 3\n// Like L2 regularization: penalize complexity`,
      },
    },
    mlCode: "tf.layers.dropout({ rate: 0.2 })",
  },
  {
    id: 10,
    mlConcept: "Feature engineering",
    jsConcept: "Data transformation / mapping",
    tier: "structural",
    connection:
      "Array.map transforms data for rendering; feature engineering transforms data for modeling. The shared move is shaping raw inputs into more useful representations before anything consumes them.",
    breaks:
      "Array.map applies a known transform you wrote. Feature engineering requires deciding which transforms to apply: a domain-knowledge problem, not a code problem. The wrong feature can hurt the model even if the transform code is correct.",
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
      "Both separate the context for building from the context for evaluation. You develop in dev, test in prod; you train on training data, evaluate on test data. Mixing them gives false confidence.",
    breaks:
      "Dev and prod can both write; you push code to both. Train and test must be one-way: test data must never touch the model during training. Mixing them gives false performance numbers (data leakage) that look great until production.",
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
      "Nobody learns NODE_ENV from data; you set it. Hyperparameters are that kind of value for training: learning rate, batch size, and layer width all steer the run from outside, and none of them are ever learned by the model itself.",
    breaks:
      "Env vars take effect on restart and you know exactly what each does. Hyperparameters interact non-linearly during training: changing learning rate may require also changing batch size and warmup. Effects are coupled and only visible after a full training run.",
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
      "Sequential processing steps, each transforming its input and passing the result forward: input \u2192 transform \u2192 output \u2192 next. Express middleware is the canonical anchor (the variants below show the shape in other frameworks), and neural network layers fold over activations the way middleware folds over requests.",
    breaks:
      "Middleware composes deterministic transforms you control. Neural network layers compose learned transforms whose internal logic is opaque: you specify the layer type and shape, the model decides the weights. Reordering middleware is reversible; reordering layers in a trained model destroys it.",
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
      "ReLU is literally Math.max(0, x) \u2014 the same function, same math, different name. The strongest bridge in the system. Clip negative values to zero, pass positives through unchanged.",
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
    jsConcept: "Reconciliation (tracing diffs backward)",
    tier: "intuition",
    connection:
      "Backprop traces from loss back to input weights via the chain rule; React traces from changed leaves back to root. In each case, information propagates backward through a structure to determine what needs updating.",
    breaks:
      "Reconciliation moves data; backpropagation computes partial derivatives via the chain rule. There is no DOM equivalent of a gradient. The traversal direction matches; the operation at each node does not.",
    category: "shared",
    variants: {
      react: {
        jsCode: `class ErrorBoundary extends React.Component {\n  componentDidCatch(error, info) {\n    // Error flows backward up the tree\n  }\n}`,
      },
    },
    mlCode:
      "// One backward pass: trace the loss back to every trainable weight\nconst { value, grads } = tf.variableGrads(() => lossFn(model.predict(x), y));\n// grads holds one gradient tensor per weight, chain-ruled from the loss",
  },
  {
    id: 16,
    mlConcept: "Model inference",
    jsConcept: "Server-side rendering",
    tier: "structural",
    connection:
      "model.predict(x) is getServerSideProps for tensors: data in, one forward pass, output out, nothing updated along the way. SSR renders HTML from data with exactly that contract. No loop, no learning, one shot.",
    breaks:
      "SSR is deterministic: same input, same HTML out. Inference is deterministic given fixed weights, but the weights themselves came from a stochastic training process, so two runs of the same training pipeline produce different models with different predictions. The forward pass repeats; the model behind it does not.",
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
      "A user-factory emits 1000 different `{name, email, address}` records sampled from realistic distributions; data augmentation emits a different rotated / cropped / color-jittered version of every training image. Each generates a population of plausible variations from a single base example, so the consumer (test, model) meets the variation it will see in production instead of one hand-picked case.",
    breaks:
      "A generated fixture lives for one test run: the test checks a property, passes or fails, and the data is thrown away. An augmented image leaves a mark. It takes part in gradient descent, so its variation gets baked into the weights themselves. Each samples from a distribution; only the model keeps what it saw.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Faker generates a population of users from a distribution\nimport { faker } from '@faker-js/faker';\nconst users = Array.from({ length: 100 }, () => ({\n  name: faker.person.fullName(),\n  email: faker.internet.email(),\n  age: faker.number.int({ min: 18, max: 80 }),\n}));`,
      },
    },
    mlCode:
      "// Each epoch: emit a different transformation of every image, sampled from\n// a distribution of plausible variations the model will see at inference.\nconst augment = (img) => tf.tidy(() => {\n  const flipped = Math.random() > 0.5 ? tf.image.flipLeftRight(img) : img;\n  return flipped.add(tf.randomNormal(flipped.shape, 0, 0.03)).clipByValue(0, 1);\n});",
  },
  {
    id: 18,
    mlConcept: "Dropout",
    jsConcept: "Randomly hiding team members during practice",
    tier: "intuition",
    connection:
      "If one neuron always fires, others co-adapt, so dropout benches neurons at random, the way a coach hides team members during practice. Forced to perform without any single participant, the rest learn resilience and independence.",
    breaks:
      "Team members deliberately practice without each other. Dropout zeroes activations randomly during training only; at inference, all neurons are active and outputs are scaled. The hiding is not a real architectural change; it is a regularization trick that vanishes when the model ships.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Randomly disable 20% of features during training\nconst dropout = (arr, rate = 0.2) =>\n  arr.map(v => Math.random() > rate ? v : 0);`,
      },
    },
    mlCode:
      "model.add(tf.layers.dropout({ rate: 0.3 })); // ~30% units zeroed each forward pass during training",
  },
  {
    id: 19,
    mlConcept: "Confusion matrix",
    jsConcept: "Error boundary report",
    tier: "structural",
    connection:
      "An error boundary catches and categorizes errors; a confusion matrix categorizes predictions vs. actuals. Structured breakdowns of what went right and what went wrong, and either one tells you where to start debugging.",
    breaks:
      "Error boundaries catch exceptions you did not anticipate. Confusion matrices show wrong predictions the model is fully confident about; there is no exception, just bad output. The errors are silent and require knowing ground truth to detect.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// Categorize render errors by type\nclass ErrorBoundary extends React.Component {\n  state = { errors: { render: 0, network: 0, auth: 0 } };\n}`,
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
      "CI/CD ships immutable artifacts; rollback restores prior behavior exactly. Deployed models drift over time as input distribution shifts, even with no code change. Rollback restores weights but not the world the model was trained on. Monitoring requirements are different.",
    category: "shared",
    variants: {
      react: {
        jsCode: `// GitHub Actions: test → build → deploy\n// Same as: data → train → evaluate → deploy`,
      },
    },
    mlCode:
      "await model.save('indexeddb://fraud-model-v3'); // version and ship\nconst live = await tf.loadLayersModel('indexeddb://fraud-model-v3');",
  },

  // ── Deep Orbit Bridges ───────────────────────────────────────────────
  {
    id: 21,
    mlConcept: "Weight initialization",
    jsConcept: "CSS initial values",
    tier: "structural",
    connection:
      "Before any updates occur, something has to set the starting point: CSS initial values for layout, weight initialization for training. Poor initial values lead to broken layouts or slow convergence; deliberate defaults matter in each world.",
    breaks:
      "CSS initial values are static defaults: `display: inline` for an unstyled `<span>` never changes by itself. Weight initialization controls the dynamics of training: He/Xavier init keeps activation variance stable across layers; bad init causes vanishing/exploding gradients or dead neurons that never recover. Init is a one-shot choice with multi-epoch consequences.",
    category: "deep-orbit",
    mlCode: "tf.initializers.heNormal() // weight init for ReLU layers",
  },
  {
    id: 22,
    mlConcept: "Batch normalization",
    jsConcept: "CSS normalize / reset",
    tier: "structural",
    connection:
      "Why does every stylesheet start with a reset? Because downstream rules are easier to write when inputs are predictable. Batch norm applies that logic between layers: standardize what each layer receives, and distribution shift stops compounding through the network.",
    breaks:
      "CSS reset runs once at page load. Batch normalization runs every forward pass and uses learned scale/shift parameters that update during training. It is an active learnable transform per layer, not a one-time normalization.",
    category: "deep-orbit",
    mlCode:
      "model.add(tf.layers.batchNormalization()); // normalize activations per mini-batch",
  },
  {
    id: 23,
    mlConcept: "Residual connections",
    jsConcept: "Component composition via children",
    tier: "structural",
    connection:
      "React children pass content through wrapper components; residual connections pass activations around layers. Each gives information a direct path that skips the intermediate processing.",
    breaks:
      "React children pass content unchanged through wrappers. Residual connections add the input to the output of a transformed block (`output = f(x) + x`); the path is additive, not pass-through. The shortcut value is summed with the processed value; child rendering does not sum.",
    category: "deep-orbit",
    mlCode:
      "const out = layerNorm(input.add(attention(input))); // skip + transform",
  },
  {
    id: 24,
    mlConcept: "Vanishing gradients",
    jsConcept: "Deeply nested callback hell",
    tier: "intuition",
    connection:
      "Both are problems caused by excessive depth. Deep callback nesting loses context; deep networks lose gradient signal. Both are solved by architectural shortcuts (async/await, skip connections).",
    breaks:
      "Callback hell is a code-organization problem visible at write time and fixed by refactoring (async/await). Vanishing gradients are a numerical problem during training: gradients shrink toward zero through depth and weights stop updating. The fix (residuals, normalization) is architectural, not stylistic.",
    category: "deep-orbit",
    mlCode: "const grad = tf.grad(loss)(weights)",
  },
  {
    id: 25,
    mlConcept: "Learning rate scheduling",
    jsConcept: "Animation easing functions",
    tier: "structural",
    connection:
      "ease-out exists because slamming into the endpoint at full speed looks wrong. Training has the same instinct: LR schedulers shrink the learning rate as the model closes in on a minimum, so it settles instead of overshooting.",
    breaks:
      "Easing interpolates a value over a fixed duration. LR schedulers vary learning rate over indefinite training time, often based on validation metrics (reduce-on-plateau) not step count. Time is bounded for animation; training time is unbounded until convergence.",
    category: "deep-orbit",
    mlCode:
      "const optimizer = tf.train.adam(0.001); // step decay via callback: lr *= 0.5 every 10 epochs",
  },
  {
    id: 26,
    mlConcept: "Multi-class classification",
    jsConcept: "Router with multiple routes",
    tier: "structural",
    connection:
      "A classifier maps inputs to classes the way a router maps URLs to views: one input goes in, one of many categories comes out.",
    breaks:
      "Routers map URLs to one route via exact-match rules. Classifiers output a probability distribution over all classes; softmax never returns zero confidence in any class. The selection is a confidence ranking, not a hard match.",
    category: "deep-orbit",
    mlCode:
      "const probs = model.predict(x).softmax(); // [batch, numClasses], rows sum to 1",
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
      "reduce folds with a pure function YOU define. An RNN cell folds with a LEARNED step function whose weights, gates, and activation come from training; the same input sequence can produce different hidden states across model versions. You can read a reducer. A cell, you can only train.",
    category: "signal-ward",
    mlCode: "tf.layers.simpleRNN({ units: 64, returnSequences: false })",
  },
  {
    id: 36,
    mlConcept: "LSTM cell memory",
    jsConcept: "Session storage",
    tier: "structural",
    connection:
      "State that has to survive navigation goes in session storage. An LSTM threads the same need through time: its cell state persists across timesteps, selectively read and updated at each one.",
    breaks:
      "Session storage is a key-value store you write and read with explicit keys. LSTM cell state is a fixed-size vector with learned read/write gates; there is no key. The model decides what to remember; you do not address it.",
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
      "Every call to Math.random() is a draw from the one distribution the browser hands you. A generative model spends its entire training learning a distribution of its own to draw from.",
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
      "Both trade precision for size/speed. PNG is lossless but large; WebP is lossy but small. Float32 is precise but heavy; Int8 is approximate but fast. Same optimization decision.",
    breaks:
      "Image format choice is per-file at save time. Model quantization changes the numeric type of every weight and activation, requires calibration data, and may need quantization-aware training to recover accuracy. Far heavier than swapping a file extension.",
    category: "terra-grid",
    mlCode:
      "// Quantize via Python tfjs-converter at convert time:\n//   tensorflowjs_converter --quantize_uint8 saved_model/ web_model/\n// Then in browser: const m = await tf.loadGraphModel('web_model/model.json');",
  },
  {
    id: 47,
    mlConcept: "Weight pruning",
    jsConcept: "Tree-shaking",
    tier: "structural",
    connection:
      "Tree-shaking eliminates statically unreferenced code via exact analysis; pruning removes weights below a numeric threshold. Each shrinks the artifact by cutting out components.",
    breaks:
      "Tree-shaking removes statically unreferenced code (analysis is exact, behavior unchanged). Weight pruning removes weights below a numeric threshold and the model usually requires fine-tuning to recover accuracy after pruning; sometimes accuracy never fully recovers. Tree-shaking is safe; pruning has a quality cost.",
    category: "terra-grid",
    mlCode:
      "tf.layers.dense({ units: 64, kernelRegularizer: tf.regularizers.l1({ l1: 0.01 }) })",
  },
  {
    id: 48,
    mlConcept: "Knowledge distillation",
    jsConcept: "Code splitting",
    tier: "structural",
    connection:
      "Your bundle got too big, so you split it. Your model got too big, so you distill it: train a small student to mimic the large teacher's outputs, then ship only the student.",
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
      "CI/CD: code \u2192 build \u2192 test \u2192 deploy. ML: data \u2192 train \u2192 evaluate \u2192 deploy. Same workflow pattern \u2014 an automated multi-stage pipeline that transforms inputs into production artifacts.",
    breaks:
      "CI/CD outputs are deterministic and identical given identical inputs. ML pipeline outputs (trained models) vary across runs even with fixed code due to random init, data shuffling, and GPU nondeterminism. Reproducibility requires extra effort (seeds, deterministic kernels).",
    category: "terra-grid",
    mlCode: "model.save('file://./artifacts/v1/model'); // versioned export",
  },
  {
    id: 50,
    mlConcept: "Drift detection",
    jsConcept: "Lighthouse CI",
    tier: "structural",
    connection:
      "A Lighthouse CI gate asks every PR: did performance regress against the baseline? Drift detection asks production the same question about your model: has the incoming data wandered away from what it was trained on?",
    breaks:
      "Lighthouse runs a fixed test suite per PR and returns a deterministic pass/fail score. Drift detection compares incoming data distributions to a baseline using PSI/KL/KS: non-binary, threshold-tunable, and lagging because ground-truth labels arrive late or never. A drift alert is a hint that the model MAY be degrading; you still need a labelled holdout to confirm. Lighthouse failure is the bug; drift alert is a hypothesis.",
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
