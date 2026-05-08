export type BridgeTier = "identity" | "structural" | "intuition";

export type BridgeCategory =
  | "shared"
  | "deep-orbit"
  | "neon-protocol"
  | "signal-ward"
  | "nova-canvas"
  | "terra-grid";

export type Framework = "react" | "vue" | "angular" | "svelte" | "vanilla";

export interface BridgeVariant {
  feCode: string;
  feConcept?: string;
}

export interface Bridge {
  id: number;
  mlConcept: string;
  feConcept: string;
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
    breaks:
      "Props can change every render and the component re-renders pure; training data is consumed during training to mutate weights, then the weights are baked in and the data is not needed at inference. Changing props after the fact updates the UI; changing training data after the fact does nothing without retraining.",
    category: "shared",
    variants: {
      react: {
        feCode: `function Card({ title, image }) {\n  return <div>{title}</div>;\n}`,
      },
      vue: {
        feCode: `defineProps({\n  title: String,\n  image: String,\n})`,
      },
      angular: {
        feCode: `@Input() title: string;\n@Input() image: string;`,
        feConcept: "Input bindings",
      },
      svelte: {
        feCode: `export let title;\nexport let image;`,
      },
      vanilla: {
        feCode: `function Card(props) {\n  el.textContent = props.title;\n}`,
        feConcept: "Function parameters",
      },
    },
    mlCode:
      "const trainData = tf.tensor2d(features); model.fit(trainData, labels)",
  },
  {
    id: 2,
    mlConcept: "Model parameters (weights)",
    feConcept: "Component state",
    tier: "structural",
    connection:
      "Both are internal, learned-at-runtime values the system owns and mutates in response to inputs. State updates from user events; weights update from training data. Distinct from props (external config, see bridge #1) and from overfitting (generalization failure, see bridge #8) — this bridge is about where the mutable internal values live.",
    breaks:
      "State updates instantly on user events with deterministic transitions; weights update slowly via gradient descent over many iterations and the update rule is stochastic. State is small and hand-written; weights are millions of floats with no semantic meaning per index.",
    category: "shared",
    variants: {
      react: {
        feCode: `const [count, setCount] = useState(0);`,
      },
      vue: {
        feCode: `const count = ref(0);`,
        feConcept: "Reactive ref",
      },
      angular: {
        feCode: `count = signal(0);`,
        feConcept: "Signal",
      },
      svelte: {
        feCode: `let count = $state(0);`,
        feConcept: "Rune state",
      },
      vanilla: {
        feCode: `let count = 0;\nfunction setState(n) {\n  count = n;\n  render();\n}`,
        feConcept: "Mutable variable",
      },
    },
    mlCode: "model.getWeights().forEach(w => console.log(w.shape))",
  },
  {
    id: 3,
    mlConcept: "Loss function",
    feConcept: "expect().toBe() assertions",
    tier: "structural",
    connection:
      "Both measure the gap between actual and expected output. A test assertion checks actual === expected; a loss function computes the distance between predictions and labels. Both quantify \u201chow wrong\u201d and drive corrections.",
    breaks:
      "Test assertions return a binary pass/fail; loss returns a continuous, differentiable scalar. You cannot take the gradient of `toBe()` — that is why ML loss functions are smooth (MSE, cross-entropy) instead of strict equality.",
    category: "shared",
    variants: {
      react: {
        feCode: `expect(actual).toBe(expected);\n// gap = |actual - expected|`,
        feConcept: "Jest assertion",
      },
      vue: {
        feCode: `expect(actual).toBe(expected);\n// gap = |actual - expected|`,
        feConcept: "Vitest assertion",
      },
      angular: {
        feCode: `expect(actual).toBe(expected);\n// gap = |actual - expected|`,
        feConcept: "Jasmine assertion",
      },
      svelte: {
        feCode: `expect(actual).toBe(expected);\n// gap = |actual - expected|`,
        feConcept: "Vitest assertion",
      },
      vanilla: {
        feCode: `expect(actual).toBe(expected);\n// gap = |actual - expected|`,
      },
    },
    mlCode: "const loss = tf.losses.meanSquaredError(yTrue, yPred)",
  },
  {
    id: 4,
    mlConcept: "Gradient descent",
    feConcept: "Reconciliation",
    tier: "intuition",
    connection:
      "Both incrementally reduce a measured gap. Reconciliation patches the DOM toward the desired state; gradient descent adjusts weights toward lower loss.",
    breaks:
      "Reconciliation is deterministic and converges in one pass to the exact desired DOM. Gradient descent is stochastic, requires many iterations, and may overshoot or settle in a local minimum that is not the global optimum.",
    category: "shared",
    variants: {
      react: {
        feCode: `// React reconciles: diffing old vDOM vs new vDOM\nconst [value, setValue] = useState(initial);\n// Each setState triggers reconciliation toward target`,
      },
      vue: {
        feCode: `// Vue reactivity patches DOM toward desired state\nconst value = ref(initial);\n// Watchers propagate changes incrementally`,
      },
      angular: {
        feCode: `// Angular change detection walks component tree\nchangeDetectorRef.detectChanges();\n// Each cycle moves DOM closer to model`,
        feConcept: "Change detection",
      },
      svelte: {
        feCode: `// Svelte compiles reactivity at build time\nlet value = $state(initial);\n// Assignments trigger surgical DOM updates`,
        feConcept: "Compiled reactivity",
      },
      vanilla: {
        feCode: `// Manual DOM patching\nfunction reconcile(oldNode, newNode) {\n  if (oldNode.text !== newNode.text)\n    oldNode.el.textContent = newNode.text;\n}`,
        feConcept: "DOM patching",
      },
    },
    mlCode:
      "model.compile({ optimizer: tf.train.adam(0.001), loss: 'mse' });\nawait model.fit(x, y, { epochs: 50 }); // descend toward minimum",
  },
  {
    id: 5,
    mlConcept: "Learning rate",
    feConcept: "Bisection / binary-search step halving",
    tier: "intuition",
    connection:
      "Both shrink the step toward a target as you get closer. Binary search halves the search interval each iteration; learning-rate decay shrinks the gradient step as training approaches a minimum. Same intuition: take big steps when far, small steps when near.",
    breaks:
      "Binary search converges deterministically in log(n) steps because each step provably contains the answer. Gradient descent is stochastic — each step uses a noisy estimate of the gradient, so 'closer to the minimum' is never certain. LR too large: weights overshoot and training diverges. LR too small: weights settle in a local minimum or run out of budget before reaching it. Binary search has a guarantee; LR is a tuning problem with no closed-form right answer.",
    category: "shared",
    variants: {
      react: {
        feCode: `// Binary search converges by halving each step\nfunction bsearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n}`,
      },
      vue: {
        feCode: `// Same algorithm — runtime-agnostic\nfunction bsearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n}`,
      },
      angular: {
        feCode: `// Same algorithm\nbinarySearch(arr: number[], target: number): number {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n  return -1;\n}`,
      },
      svelte: {
        feCode: `// Same algorithm\nfunction bsearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] < target) lo = mid + 1; else hi = mid - 1;\n  }\n}`,
      },
      vanilla: {
        feCode: `// Halving step interval — bisection's core trick\nlet lo = 0, hi = n - 1;\nwhile (lo < hi) {\n  const mid = (lo + hi) >> 1;\n  if (test(mid)) hi = mid; else lo = mid + 1;\n}`,
      },
    },
    mlCode:
      "// Step decay: halve the LR every K epochs as training nears convergence\nlet lr = 0.01;\nfor (let epoch = 0; epoch < 50; epoch++) {\n  if (epoch > 0 && epoch % 10 === 0) lr *= 0.5;\n  optimizer.learningRate = lr;\n}",
  },
  {
    id: 6,
    mlConcept: "Epochs",
    feConcept: "requestAnimationFrame loop",
    tier: "structural",
    connection:
      "Both are repeated cycles where the system processes input and refines output. An rAF loop reruns render logic every frame; an epoch reruns training over the entire dataset. Both converge toward a target.",
    breaks:
      "rAF runs at 60Hz with deterministic frame timing on in-memory data. An epoch can take seconds to hours per iteration, runs as fast as the GPU allows, and reads batches from disk or network. The loop pattern matches; the timescale and determinism do not.",
    category: "shared",
    variants: {
      react: {
        feCode: `useEffect(() => {\n  let id = requestAnimationFrame(function loop() {\n    processEpoch(data);\n    if (!converged) id = requestAnimationFrame(loop);\n  });\n  return () => cancelAnimationFrame(id);\n}, []);`,
      },
      vue: {
        feCode: `onMounted(() => {\n  const loop = () => {\n    processEpoch(data);\n    if (!converged) requestAnimationFrame(loop);\n  };\n  requestAnimationFrame(loop);\n});\nonUnmounted(() => cancelAnimationFrame(id));`,
      },
      angular: {
        feCode: `ngOnInit() {\n  const loop = () => {\n    this.processEpoch(this.data);\n    if (!this.converged) requestAnimationFrame(loop);\n  };\n  requestAnimationFrame(loop);\n}`,
      },
      svelte: {
        feCode: `$effect(() => {\n  let id = requestAnimationFrame(function loop() {\n    processEpoch(data);\n    if (!converged) id = requestAnimationFrame(loop);\n  });\n  return () => cancelAnimationFrame(id);\n});`,
      },
      vanilla: {
        feCode: `function trainLoop() {\n  processEpoch(data);\n  if (!converged) requestAnimationFrame(trainLoop);\n}`,
      },
    },
    mlCode:
      "for (let epoch = 0; epoch < 50; epoch++) { await model.fit(x, y, { epochs: 1, batchSize: 32 }); }",
  },
  {
    id: 7,
    mlConcept: "Batch size",
    feConcept: "Chunk / page size",
    tier: "structural",
    connection:
      "Both control how much data is processed at once. Pagination loads N items per page; batch size feeds N samples per gradient update. Both balance memory and throughput.",
    breaks:
      "Page size is chosen for UX (what fits on screen); batch size is chosen for memory and gradient noise tradeoff. Larger pages are usually better for users; larger batches are not always better for training — small batches add useful noise that improves generalization.",
    category: "shared",
    variants: {
      react: {
        feCode: `const page = data.slice(offset, offset + PAGE_SIZE);`,
      },
      vue: {
        feCode: `const page = computed(() =>\n  data.value.slice(offset.value, offset.value + PAGE_SIZE)\n);`,
      },
      angular: {
        feCode: `this.page$ = this.data$.pipe(\n  map(d => d.slice(this.offset, this.offset + PAGE_SIZE))\n);`,
        feConcept: "RxJS page slice",
      },
      svelte: {
        feCode: `$: page = data.slice(offset, offset + PAGE_SIZE);`,
      },
      vanilla: {
        feCode: `const page = data.slice(offset, offset + PAGE_SIZE);`,
      },
    },
    mlCode: "model.fit(x, y, { batchSize: 32 })",
  },
  {
    id: 8,
    mlConcept: "Overfitting",
    feConcept: "Overspecialized component",
    tier: "intuition",
    connection:
      "Both are cases of being too tailored to specific inputs. An overspecialized component breaks with new data; an overfit model fails on new examples. Both need generalization.",
    breaks:
      "An overspecialized component breaks visibly with new data — you see the bug. An overfit model still runs and returns confident wrong answers; it can only be detected by holding out test data. The failure mode is silent.",
    category: "shared",
    variants: {
      react: {
        feCode: `// Too specific — breaks with new data shapes\nfunction UserCard({ user }) {\n  return <div>{user.name.first} {user.name.last}</div>;\n  // Crashes if user.name is a string\n}`,
      },
      vue: {
        feCode: `<!-- Overfitted to one data shape -->\n<template>\n  <div>{{ user.name.first }} {{ user.name.last }}</div>\n  <!-- Breaks if user.name is a string -->\n</template>`,
      },
      angular: {
        feCode: `// Tightly coupled to specific data shape\n@Component({ template: \`{{user.name.first}} {{user.name.last}}\` })\nexport class UserCard {\n  @Input() user!: { name: { first: string; last: string } };\n}`,
      },
      svelte: {
        feCode: `<!-- Overfitted: only works with nested name -->\n<div>{user.name.first} {user.name.last}</div>\n<!-- Crashes if user.name is a flat string -->`,
      },
      vanilla: {
        feCode: `// Hardcoded to specific data structure\nfunction UserCard(user) {\n  el.textContent = user.name.first + ' ' + user.name.last;\n  // Fails if user.name is a string\n}`,
        feConcept: "Overspecialized function",
      },
    },
    mlCode: "model.evaluate(testX, testY) // val loss diverges from train loss",
  },
  {
    id: 9,
    mlConcept: "Regularization",
    feConcept: "Code linting / constraints",
    tier: "intuition",
    connection:
      "Both impose rules that prevent overly specific or complex solutions. Linting constrains code style; regularization constrains model complexity. Both improve generalizability.",
    breaks:
      "Linting enforces hard rules at write time. Regularization adds a soft penalty during training that the optimizer trades off against loss. A linter never decides this rule is worth violating for a 5% accuracy gain; an optimizer does.",
    category: "shared",
    variants: {
      react: {
        feCode: `// eslint: no-unused-vars, max-depth: 3\n// Like L2 regularization: penalize complexity`,
      },
      vue: {
        feCode: `// eslint-plugin-vue: no-unused-vars\n// Constrains component complexity like regularization`,
      },
      angular: {
        feCode: `// @angular-eslint: max-lines-per-function\n// Penalizes overly complex components`,
      },
      svelte: {
        feCode: `// eslint-plugin-svelte: no-unused-svelte-ignore\n// Prevents overfitting to edge cases`,
      },
      vanilla: {
        feCode: `// eslint: no-unused-vars, max-depth: 3\n// Like L2 regularization: penalize complexity`,
      },
    },
    mlCode: "tf.layers.dropout({ rate: 0.2 })",
  },
  {
    id: 10,
    mlConcept: "Feature engineering",
    feConcept: "Data transformation / mapping",
    tier: "structural",
    connection:
      "Both transform raw inputs into more useful representations. Array.map transforms data for rendering; feature engineering transforms data for modeling. Both are about shaping inputs.",
    breaks:
      "Array.map applies a known transform you wrote. Feature engineering requires deciding which transforms to apply — a domain-knowledge problem, not a code problem. The wrong feature can hurt the model even if the transform code is correct.",
    category: "shared",
    variants: {
      react: {
        feCode: `const features = rawData.map(d => ({\n  normalized: (d.value - min) / (max - min),\n  category: d.type === 'A' ? 1 : 0,\n}));`,
      },
      vue: {
        feCode: `const features = computed(() =>\n  rawData.value.map(d => ({\n    normalized: (d.value - min) / (max - min),\n    category: d.type === 'A' ? 1 : 0,\n  }))\n);`,
      },
      angular: {
        feCode: `features$ = this.rawData$.pipe(\n  map(data => data.map(d => ({\n    normalized: (d.value - min) / (max - min),\n    category: d.type === 'A' ? 1 : 0,\n  })))\n);`,
      },
      svelte: {
        feCode: `$: features = rawData.map(d => ({\n  normalized: (d.value - min) / (max - min),\n  category: d.type === 'A' ? 1 : 0,\n}));`,
      },
      vanilla: {
        feCode: `const features = rawData.map(d => ({\n  normalized: (d.value - min) / (max - min),\n  category: d.type === 'A' ? 1 : 0,\n}));`,
      },
    },
    mlCode: "const x = rawTensor.div(255).sub(0.5) // normalize",
  },
  {
    id: 11,
    mlConcept: "Train/test split",
    feConcept: "Dev/prod environments",
    tier: "structural",
    connection:
      "Both separate the context for building from the context for evaluation. You develop in dev, test in prod; you train on training data, evaluate on test data. Mixing them gives false confidence.",
    breaks:
      "Dev and prod can both write — you push code to both. Train and test must be one-way: test data must never touch the model during training. Mixing them gives false performance numbers (data leakage) that look great until production.",
    category: "shared",
    variants: {
      react: {
        feCode: `const apiUrl = process.env.NODE_ENV === 'production'\n  ? 'https://api.prod.com'\n  : 'http://localhost:3001';`,
      },
      vue: {
        feCode: `const apiUrl = import.meta.env.PROD\n  ? 'https://api.prod.com'\n  : 'http://localhost:3001';`,
        feConcept: "Vite env modes",
      },
      angular: {
        feCode: `// environment.ts vs environment.prod.ts\nexport const environment = {\n  production: false,\n  apiUrl: 'http://localhost:3001',\n};`,
        feConcept: "Environment files",
      },
      svelte: {
        feCode: `const apiUrl = import.meta.env.PROD\n  ? 'https://api.prod.com'\n  : 'http://localhost:3001';`,
        feConcept: "Vite env modes",
      },
      vanilla: {
        feCode: `const apiUrl = location.hostname === 'localhost'\n  ? 'http://localhost:3001'\n  : 'https://api.prod.com';`,
      },
    },
    mlCode:
      "const split = Math.floor(data.length * 0.8); const train = data.slice(0, split)",
  },
  {
    id: 12,
    mlConcept: "Hyperparameters",
    feConcept: "Config / environment variables",
    tier: "structural",
    connection:
      "Both are settings that control behavior but aren\u2019t learned from data. Env vars configure an app without changing code; hyperparameters configure training without being part of the model.",
    breaks:
      "Env vars take effect on restart and you know exactly what each does. Hyperparameters interact non-linearly during training — changing learning rate may require also changing batch size and warmup. Effects are coupled and only visible after a full training run.",
    category: "shared",
    variants: {
      react: {
        feCode: `// next.config.js — not learned, just configured\nmodule.exports = {\n  images: { domains: ['cdn.example.com'] },\n};`,
      },
      vue: {
        feCode: `// vite.config.ts — tuned, not learned\nexport default defineConfig({\n  server: { port: 3000 },\n});`,
      },
      angular: {
        feCode: `// angular.json — project-level config\n"budgets": [{\n  "type": "initial",\n  "maximumWarning": "500kb"\n}]`,
      },
      svelte: {
        feCode: `// svelte.config.js — tuned, not learned\nexport default {\n  kit: { adapter: adapter() },\n};`,
      },
      vanilla: {
        feCode: `// webpack.config.js — not learned, just tuned\nmodule.exports = {\n  output: { filename: '[name].[hash].js' },\n};`,
      },
    },
    mlCode:
      "tf.layers.dense({ units: 64, kernelRegularizer: tf.regularizers.l2() })",
  },
  {
    id: 13,
    mlConcept: "Neural network layers",
    feConcept: "Express-style middleware chain",
    tier: "structural",
    connection:
      "Both are sequential processing steps where each transforms its input and passes the result forward: input \u2192 transform \u2192 output \u2192 next. The canonical FE anchor is Express/Koa/Next middleware; the same shape appears as React HOC composition, Vue/Angular plugin pipelines, Angular HTTP interceptors, and Redux middleware (see variants). Neural network layers fold over activations the way these fold over requests.",
    breaks:
      "Middleware composes deterministic transforms you control. Neural network layers compose learned transforms whose internal logic is opaque — you specify the layer type and shape, the model decides the weights. Reordering middleware is reversible; reordering layers in a trained model destroys it.",
    category: "shared",
    variants: {
      react: {
        feCode: `// HOC composition — each layer transforms data\nconst Enhanced = withAuth(withTheme(withLogger(BaseComponent)));`,
        feConcept: "HOC / Context provider chain",
      },
      vue: {
        feCode: `// Plugin pipeline — each transforms the app\napp.use(router);\napp.use(pinia);\napp.use(i18n);`,
        feConcept: "Plugin pipeline",
      },
      angular: {
        feCode: `// HTTP interceptor chain — each transforms request\nproviders: [\n  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },\n  { provide: HTTP_INTERCEPTORS, useClass: LogInterceptor, multi: true },\n]`,
        feConcept: "HTTP interceptors",
      },
      svelte: {
        feCode: `<!-- Layout composition — nested transforms -->\n<Layout>\n  <AuthGuard>\n    <slot />\n  </AuthGuard>\n</Layout>`,
        feConcept: "Layout composition",
      },
      vanilla: {
        feCode: `// Express-style middleware chain\napp.use(logger);\napp.use(auth);\napp.use(cors);\n// input → transform → next → transform → output`,
      },
    },
    mlCode:
      "const model = tf.sequential();\nmodel.add(tf.layers.dense({ units: 64, activation: 'relu' }));\nmodel.add(tf.layers.dense({ units: 1 })); // sequential layers",
  },
  {
    id: 14,
    mlConcept: "Activation functions (ReLU)",
    feConcept: "Math.max(0, x)",
    tier: "identity",
    connection:
      "ReLU is literally Math.max(0, x) \u2014 the same function, same math, different name. The strongest bridge in the system. Clip negative values to zero, pass positives through unchanged.",
    category: "shared",
    variants: {
      react: {
        feCode: `const relu = (x) => Math.max(0, x);`,
      },
      vue: {
        feCode: `const relu = (x) => Math.max(0, x);`,
      },
      angular: {
        feCode: `const relu = (x: number): number => Math.max(0, x);`,
      },
      svelte: {
        feCode: `const relu = (x) => Math.max(0, x);`,
      },
      vanilla: {
        feCode: `const relu = (x) => Math.max(0, x);`,
      },
    },
    mlCode: "tf.relu(x) // identical to Math.max(0, x), elementwise",
  },
  {
    id: 15,
    mlConcept: "Backpropagation",
    feConcept: "Reconciliation (tracing diffs backward)",
    tier: "intuition",
    connection:
      "Both propagate information backward through a structure to determine what needs updating. React traces from changed leaves back to root; backprop traces from loss back to input weights via the chain rule.",
    breaks:
      "Reconciliation moves data; backpropagation computes partial derivatives via the chain rule. There is no DOM equivalent of a gradient. The traversal direction matches; the operation at each node does not.",
    category: "shared",
    variants: {
      react: {
        feCode: `class ErrorBoundary extends React.Component {\n  componentDidCatch(error, info) {\n    // Error flows backward up the tree\n  }\n}`,
      },
      vue: {
        feCode: `export default {\n  errorCaptured(err, instance, info) {\n    // Propagates up component tree\n    return false;\n  },\n};`,
      },
      angular: {
        feCode: `@Injectable()\nexport class GlobalErrorHandler implements ErrorHandler {\n  handleError(error: Error) {\n    // Propagates from leaf to root\n  }\n}`,
      },
      svelte: {
        feCode: `<svelte:boundary onerror={handleError}>\n  <ChildComponent />\n</svelte:boundary>`,
      },
      vanilla: {
        feCode: `window.addEventListener('error', (e) => {\n  // Error bubbles up the DOM tree\n});`,
        feConcept: "Event bubbling (error propagation)",
      },
    },
    mlCode: "tf.layers.dense({ units: 10, activation: 'softmax' })",
  },
  {
    id: 16,
    mlConcept: "Model inference",
    feConcept: "Server-side rendering",
    tier: "structural",
    connection:
      "Both take an input and produce an output in a single forward pass, without iterative updating. SSR renders HTML from data; inference produces predictions from features. Both are \u201cone-shot.\u201d",
    breaks:
      "SSR is deterministic — same input, same HTML out. Inference is deterministic given fixed weights, but the weights themselves came from a stochastic training process, so two runs of the same training pipeline produce different models with different predictions. The forward pass repeats; the model behind it does not.",
    category: "shared",
    variants: {
      react: {
        feCode: `// Next.js SSR — one forward pass, no iteration\nexport async function getServerSideProps() {\n  const data = await fetchData();\n  return { props: { data } };\n}`,
      },
      vue: {
        feCode: `// Nuxt SSR — single forward pass\nexport default defineNuxtPlugin(async () => {\n  const data = await $fetch('/api/data');\n  return { provide: { data } };\n});`,
      },
      angular: {
        feCode: `// Angular Universal SSR\n@Injectable()\nexport class ServerDataResolver implements Resolve<Data> {\n  resolve() { return this.http.get<Data>('/api/data'); }\n}`,
      },
      svelte: {
        feCode: `// SvelteKit load — one forward pass\nexport async function load({ fetch }) {\n  const data = await fetch('/api/data');\n  return { data: await data.json() };\n}`,
      },
      vanilla: {
        feCode: `// Server renders HTML in one pass\nconst html = renderToString(data);`,
        feConcept: "Single-pass rendering",
      },
    },
    mlCode:
      "const prediction = model.predict(x); // single forward pass, no training",
  },
  {
    id: 17,
    mlConcept: "Data augmentation",
    feConcept:
      "Programmatic test fixture factories (Faker, factory-bot, fast-check generators)",
    tier: "intuition",
    connection:
      "Both generate a population of plausible variations from a single base example, drawn from a distribution. A user-factory emits 1000 different `{name, email, address}` records sampled from realistic distributions; data augmentation emits a different rotated / cropped / color-jittered version of every training image. Same intent: expose the consumer (test, model) to the variation it will see in production, not a single hand-picked example.",
    breaks:
      "Test fixtures are consumed once per test run and discarded — the test asserts a property and either passes or fails on that batch of generated data. Augmented training images participate in gradient descent: the model's weights shift toward minimizing loss across the augmented distribution, baking that variation into its learned representation. Fixtures are ephemeral inputs to a deterministic check; augmentations are persistent shapes the model's parameters absorb. Both sample from a distribution; only one updates state.",
    category: "shared",
    variants: {
      react: {
        feCode: `// Faker generates a population of users from a distribution\nimport { faker } from '@faker-js/faker';\nconst users = Array.from({ length: 100 }, () => ({\n  name: faker.person.fullName(),\n  email: faker.internet.email(),\n  age: faker.number.int({ min: 18, max: 80 }),\n}));`,
      },
      vue: {
        feCode: `// factory pattern: parameterize variation\nconst userFactory = (overrides = {}) => ({\n  id: faker.string.uuid(),\n  email: faker.internet.email(),\n  ...overrides,\n});\nconst users = Array.from({ length: 100 }, () => userFactory());`,
      },
      angular: {
        feCode: `// fixtures across a parameter matrix\nconst products = ['xs', 's', 'm', 'l', 'xl'].flatMap(size =>\n  ['red', 'blue', 'green'].map(color => ({\n    sku: faker.string.alphanumeric(8),\n    size, color,\n    stock: faker.number.int({ min: 0, max: 50 }),\n  }))\n);`,
      },
      svelte: {
        feCode: `// random fixture per render\nimport { faker } from '@faker-js/faker';\nconst fixtures = Array.from({ length: 50 }, () => ({\n  title: faker.commerce.productName(),\n  price: faker.commerce.price(),\n}));`,
      },
      vanilla: {
        feCode: `// generator yields a stream of variations\nfunction* userFactory() {\n  while (true) {\n    yield {\n      name: faker.person.fullName(),\n      city: faker.location.city(),\n    };\n  }\n}`,
      },
    },
    mlCode:
      "// Each epoch: emit a different transformation of every image, sampled from\n// a distribution of plausible variations the model will see at inference.\nconst augment = (img) => tf.tidy(() => {\n  const flipped = Math.random() > 0.5 ? tf.image.flipLeftRight(img) : img;\n  return flipped.add(tf.randomNormal(flipped.shape, 0, 0.03)).clipByValue(0, 1);\n});",
  },
  {
    id: 18,
    mlConcept: "Dropout",
    feConcept: "Randomly hiding team members during practice",
    tier: "intuition",
    connection:
      "Both temporarily remove participants to prevent over-reliance on any single one. If one neuron always fires, others co-adapt. Random removal forces resilience and independence.",
    breaks:
      "Team members deliberately practice without each other. Dropout zeroes activations randomly during training only — at inference, all neurons are active and outputs are scaled. The hiding is not a real architectural change; it is a regularization trick that vanishes when the model ships.",
    category: "shared",
    variants: {
      react: {
        feCode: `// Randomly disable 20% of features during training\nconst dropout = (arr, rate = 0.2) =>\n  arr.map(v => Math.random() > rate ? v : 0);`,
      },
      vue: {
        feCode: `// Randomly disable 20% of features during training\nconst dropout = (arr, rate = 0.2) =>\n  arr.map(v => Math.random() > rate ? v : 0);`,
      },
      angular: {
        feCode: `// Randomly disable 20% of features during training\nconst dropout = (arr: number[], rate = 0.2) =>\n  arr.map(v => Math.random() > rate ? v : 0);`,
      },
      svelte: {
        feCode: `// Randomly disable 20% of features during training\nconst dropout = (arr, rate = 0.2) =>\n  arr.map(v => Math.random() > rate ? v : 0);`,
      },
      vanilla: {
        feCode: `// Randomly disable 20% of features during training\nconst dropout = (arr, rate = 0.2) =>\n  arr.map(v => Math.random() > rate ? v : 0);`,
      },
    },
    mlCode:
      "model.add(tf.layers.dropout({ rate: 0.3 })); // ~30% units zeroed each forward pass during training",
  },
  {
    id: 19,
    mlConcept: "Confusion matrix",
    feConcept: "Error boundary report",
    tier: "structural",
    connection:
      "Both provide structured breakdowns of what went right and wrong. An error boundary catches and categorizes errors; a confusion matrix categorizes predictions vs. actuals. Both guide debugging.",
    breaks:
      "Error boundaries catch exceptions you did not anticipate. Confusion matrices show wrong predictions the model is fully confident about — there is no exception, just bad output. The errors are silent and require knowing ground truth to detect.",
    category: "shared",
    variants: {
      react: {
        feCode: `// Categorize render errors by type\nclass ErrorBoundary extends React.Component {\n  state = { errors: { render: 0, network: 0, auth: 0 } };\n}`,
      },
      vue: {
        feCode: `// Categorize errors by type\nconst errorMatrix = reactive({\n  render: 0, network: 0, auth: 0,\n});`,
      },
      angular: {
        feCode: `// Categorize errors by type\n@Injectable()\nexport class ErrorTracker {\n  matrix = { render: 0, network: 0, auth: 0 };\n}`,
      },
      svelte: {
        feCode: `// Categorize errors by type\nlet errorMatrix = $state({\n  render: 0, network: 0, auth: 0,\n});`,
      },
      vanilla: {
        feCode: `// Categorize errors by type\nconst errorMatrix = {\n  render: 0, network: 0, auth: 0,\n};`,
        feConcept: "Error categorization",
      },
    },
    mlCode: "model.compile({ metrics: ['accuracy'] })",
  },
  {
    id: 20,
    mlConcept: "Model deployment",
    feConcept: "CI/CD pipeline",
    tier: "structural",
    connection:
      "Both are the process of taking something from development to production. CI/CD deploys code; model deployment serves a model. Both involve versioning, testing, and monitoring.",
    breaks:
      "CI/CD ships immutable artifacts; rollback restores prior behavior exactly. Deployed models drift over time as input distribution shifts, even with no code change. Rollback restores weights but not the world the model was trained on. Monitoring requirements are different.",
    category: "shared",
    variants: {
      react: {
        feCode: `// GitHub Actions: test → build → deploy\n// Same as: data → train → evaluate → deploy`,
      },
      vue: {
        feCode: `// GitLab CI: lint → test → build → deploy\n// Same pipeline as ML model deployment`,
      },
      angular: {
        feCode: `// Angular CLI: ng build --prod → deploy\n// Same pipeline as ML model deployment`,
      },
      svelte: {
        feCode: `// Vercel auto-deploy: push → build → deploy\n// Same pipeline as ML model deployment`,
      },
      vanilla: {
        feCode: `// GitHub Actions: test → build → deploy\n// Same as: data → train → evaluate → deploy`,
      },
    },
    mlCode: "tf.callbacks.earlyStopping({ monitor: 'val_loss', patience: 5 })",
  },

  // ── Deep Orbit Bridges ───────────────────────────────────────────────
  {
    id: 21,
    mlConcept: "Weight initialization",
    feConcept: "CSS initial values",
    tier: "structural",
    connection:
      "Both set the starting point before any updates occur. Poor initial values lead to slow convergence or broken layouts. Both require deliberate defaults.",
    breaks:
      "CSS initial values are static defaults — `display: inline` for an unstyled `<span>` never changes by itself. Weight initialization controls the dynamics of training: He/Xavier init keeps activation variance stable across layers; bad init causes vanishing/exploding gradients or dead neurons that never recover. Init is a one-shot choice with multi-epoch consequences.",
    category: "deep-orbit",
    mlCode: "tf.initializers.heNormal() // weight init for ReLU layers",
  },
  {
    id: 22,
    mlConcept: "Batch normalization",
    feConcept: "CSS normalize / reset",
    tier: "structural",
    connection:
      "Both standardize inputs to a layer/component to prevent compounding inconsistencies. CSS resets remove browser defaults; batch norm removes distribution shift between layers.",
    breaks:
      "CSS reset runs once at page load. Batch normalization runs every forward pass and uses learned scale/shift parameters that update during training. It is an active learnable transform per layer, not a one-time normalization.",
    category: "deep-orbit",
    mlCode:
      "model.add(tf.layers.batchNormalization()); // normalize activations per mini-batch",
  },
  {
    id: 23,
    mlConcept: "Residual connections",
    feConcept: "Component composition via children",
    tier: "structural",
    connection:
      "Both allow information to skip intermediate processing and pass through directly. React children pass content through wrapper components; residual connections pass activations around layers.",
    breaks:
      "React children pass content unchanged through wrappers. Residual connections add the input to the output of a transformed block (`output = f(x) + x`) — the path is additive, not pass-through. The shortcut value is summed with the processed value; child rendering does not sum.",
    category: "deep-orbit",
    mlCode:
      "const out = layerNorm(input.add(attention(input))); // skip + transform",
  },
  {
    id: 24,
    mlConcept: "Vanishing gradients",
    feConcept: "Deeply nested callback hell",
    tier: "intuition",
    connection:
      "Both are problems caused by excessive depth. Deep callback nesting loses context; deep networks lose gradient signal. Both are solved by architectural shortcuts (async/await, skip connections).",
    breaks:
      "Callback hell is a code-organization problem visible at write time and fixed by refactoring (async/await). Vanishing gradients are a numerical problem during training — gradients shrink toward zero through depth and weights stop updating. The fix (residuals, normalization) is architectural, not stylistic.",
    category: "deep-orbit",
    mlCode: "const grad = tf.grad(loss)(weights)",
  },
  {
    id: 25,
    mlConcept: "Learning rate scheduling",
    feConcept: "Animation easing functions",
    tier: "structural",
    connection:
      "Both vary the rate of change over time. Easing functions start fast and slow down (or vice versa); LR schedulers reduce the learning rate as training progresses. Both optimize the trajectory.",
    breaks:
      "Easing interpolates a value over a fixed duration. LR schedulers vary learning rate over indefinite training time, often based on validation metrics (reduce-on-plateau) not step count. Time is bounded for animation; training time is unbounded until convergence.",
    category: "deep-orbit",
    mlCode:
      "const optimizer = tf.train.adam(0.001); // step decay via callback: lr *= 0.5 every 10 epochs",
  },
  {
    id: 26,
    mlConcept: "Multi-class classification",
    feConcept: "Router with multiple routes",
    tier: "structural",
    connection:
      "Both take a single input and determine which of many categories it belongs to. A router maps URLs to views; a classifier maps inputs to classes. Both are selection mechanisms.",
    breaks:
      "Routers map URLs to one route via exact-match rules. Classifiers output a probability distribution over all classes — softmax never returns zero confidence in any class. The selection is a confidence ranking, not a hard match.",
    category: "deep-orbit",
    mlCode:
      "const probs = model.predict(x).softmax(); // [batch, numClasses], rows sum to 1",
  },

  // ── Neon Protocol Bridges ────────────────────────────────────────────
  {
    id: 27,
    mlConcept: "Image tensors",
    feConcept: "canvas.getImageData()",
    tier: "structural",
    connection:
      "Both represent images as numeric arrays of pixel values. getImageData returns a flat Uint8ClampedArray (0-255 RGBA). An image tensor returns a shaped float32 tensor (often [h, w, 3]).",
    breaks:
      "getImageData ships uint8 (0-255) interleaved RGBA. Most models need float32 normalized to [0,1] (or per-channel mean/std). Skipping the cast and normalization gives an image whose pixels are 100x larger than training distribution, and the model returns nonsense.",
    category: "neon-protocol",
    mlCode: "tf.browser.fromPixels(canvas).toFloat().div(255)",
  },
  {
    id: 28,
    mlConcept: "Convolution kernels",
    feConcept: "CSS blur() / SVG filters",
    tier: "structural",
    connection:
      "Both apply a small sliding window that transforms local regions of an image. CSS blur applies a convolution kernel to pixels; CNNs apply learned kernels to feature maps.",
    breaks:
      "CSS blur uses a fixed Gaussian kernel hard-coded in the browser. CNN convolution uses learned kernels that update during training to detect features specific to the dataset. Same operation; one is hand-tuned, the other is data-tuned and changes per model.",
    category: "neon-protocol",
    mlCode:
      "model.add(tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' }));",
  },
  {
    id: 29,
    mlConcept: "Bounding boxes",
    feConcept: "getBoundingClientRect()",
    tier: "identity",
    connection:
      "Both define rectangular regions with x, y, width, height coordinates. DOM element bounds and object detection boxes use the same data structure.",
    category: "neon-protocol",
    mlCode: "{ x, y, width, height } // bbox tuple",
  },
  {
    id: 30,
    mlConcept: "Non-Max Suppression",
    feConcept: "Toast dedupe (suppressing overlapping notifications)",
    tier: "intuition",
    connection:
      "Both apply a 'one winner per region' rule to a redundant feed. A toast system suppresses a new alert if a similar one is already onscreen; NMS suppresses a detection if it overlaps a higher-confidence one above an IoU threshold. Same intuition: pick the strongest, hide the rest.",
    breaks:
      "Toast dedupe is single-axis (time + key match) — a boolean check on identifier. NMS is two-dimensional, runs IoU(boxA, boxB) over every kept pair, and the threshold is a tunable scalar that trades recall for precision (lower threshold → fewer kept boxes). Toasts dedupe by equality; NMS dedupes by geometric overlap.",
    category: "neon-protocol",
    mlCode: "tf.image.nonMaxSuppression(boxes, scores, 100, 0.5)",
  },
  {
    id: 31,
    mlConcept: "Segmentation masks",
    feConcept: "SVG clip-path / CSS masks",
    tier: "structural",
    connection:
      "Both create pixel-level boundaries that separate regions. CSS masks define visible/hidden areas; segmentation masks label each pixel\u2019s class. Same concept, different domain.",
    breaks:
      "CSS masks are author-defined geometry. Segmentation masks are model output — pixel-level predictions with confidence per pixel, often imperfect at boundaries. The mask must be thresholded and cleaned before use; CSS clip-paths do not need post-processing.",
    category: "neon-protocol",
    mlCode:
      "const mask = model.predict(image).argMax(-1) // [H, W] class per pixel",
  },
  {
    id: 32,
    mlConcept: "Backbone networks",
    feConcept: "Shared component libraries",
    tier: "structural",
    connection:
      "Both provide reusable feature extraction that multiple downstream tasks build on. A shared UI library serves multiple apps; a backbone CNN serves multiple vision tasks.",
    breaks:
      "UI libraries are versioned, stable, and you compose them deterministically. Backbones are trained on specific datasets (ImageNet) and carry that bias forward — fine-tuning on different data may erase or compete with the pre-trained features. Reuse is not free of side effects.",
    category: "neon-protocol",
    mlCode: "const backbone = await tf.loadLayersModel('mobilenet/model.json')",
  },

  // ── Signal Ward Bridges ──────────────────────────────────────────────
  {
    id: 33,
    mlConcept: "Tokenization",
    feConcept: "URL parsing / route splitting",
    tier: "structural",
    connection:
      "Both break continuous input into discrete structured parts. URL parsing splits at known delimiters with deterministic regex. Subword tokenizers split text using learned merge rules.",
    breaks:
      "URL parsing uses regex YOU control. Subword tokenizers (BPE, WordPiece, SentencePiece) learn merge rules from a training corpus and the same word can tokenize to 1 token in one model and 5 in another. Tokenization is part of the model artifact; you cannot regex your way out of a tokenizer mismatch at inference.",
    category: "signal-ward",
    mlCode:
      "const tokens = tokenizer.encode('clinical text') // [101, 4321, ...]",
  },
  {
    id: 34,
    mlConcept: "Word embeddings",
    feConcept: "i18n translation dictionaries",
    tier: "structural",
    connection:
      "Both map symbolic identifiers to meaningful representations. i18n maps keys to localized strings; embeddings map tokens to dense vectors in semantic space. Both enable meaning-aware processing.",
    breaks:
      "i18n maps key → exact translated string with no semantic relationship between keys. Embeddings place tokens in a continuous vector space where distance encodes meaning (`king - man + woman ≈ queen`). The mapping has structure i18n does not.",
    category: "signal-ward",
    mlCode:
      "const embed = tf.layers.embedding({ inputDim: vocab, outputDim: 128 });\nconst vec = embed.apply(tokenIds); // [batch, seqLen, 128]",
  },
  {
    id: 35,
    mlConcept: "RNN state accumulation",
    feConcept: "Array.reduce()",
    tier: "structural",
    connection:
      "Both fold a sequence element-by-element, carrying forward accumulated state. reduce() builds a result by folding with a function YOU define; an RNN folds with a learned cell.",
    breaks:
      "reduce folds with a pure function YOU define. An RNN cell folds with a LEARNED step function whose weights, gates, and activation come from training; the same input sequence can produce different hidden states across model versions. The fold shape transfers; the cell content is opaque and stochastic.",
    category: "signal-ward",
    mlCode: "tf.layers.simpleRNN({ units: 64, returnSequences: false })",
  },
  {
    id: 36,
    mlConcept: "LSTM cell memory",
    feConcept: "Session storage",
    tier: "structural",
    connection:
      "Both maintain persistent state across sequential processing steps that can be selectively read and updated. Session storage persists across page navigations; LSTM cells persist across timesteps.",
    breaks:
      "Session storage is a key-value store you write and read with explicit keys. LSTM cell state is a fixed-size vector with learned read/write gates — there is no key. The model decides what to remember; you do not address it.",
    category: "signal-ward",
    mlCode: "tf.layers.lstm({ units: 128, returnSequences: true })",
  },
  {
    id: 37,
    mlConcept: "Attention mechanism",
    feConcept: "Search engine ranking",
    tier: "structural",
    connection:
      "Both dynamically weight inputs by relevance to a query. Search ranks documents by query relevance; attention weights tokens by relevance to each other. Both are learned relevance scoring.",
    breaks:
      "Search ranking is a one-shot scoring of documents against one query. Attention runs at every layer for every token, with each token attending to every other token — quadratic cost in sequence length. Same scoring shape, very different scale and frequency.",
    category: "signal-ward",
    mlCode:
      "const scores = tf.softmax(Q.matMul(K.transpose()).div(Math.sqrt(dk)), -1)",
  },
  {
    id: 38,
    mlConcept: "Transformer architecture",
    feConcept: "React virtual DOM reconciliation",
    tier: "intuition",
    connection:
      "Both are reconciliation engines that compare current state to desired state. React\u2019s vDOM processes the component tree and computes diffs; transformers process input tokens and compute attention-weighted representations.",
    breaks:
      "vDOM diffs current vs target tree once per render and applies known patches. Transformers compute soft attention weights every forward pass and the 'patches' are learned matrix operations on continuous activations. The reconciliation framing rhymes; the math does not.",
    category: "signal-ward",
    mlCode:
      "const Wq = tf.layers.dense({ units: dModel });\nconst attn = tf.softmax(Wq.apply(x).matMul(K.transpose()).div(Math.sqrt(dk)));\nconst out = layerNorm(x.add(attn.matMul(V)));",
  },

  // ── Nova Canvas Bridges ──────────────────────────────────────────────
  {
    id: 39,
    mlConcept: "Sampling from distributions",
    feConcept: "Math.random()",
    tier: "structural",
    connection:
      "Both generate values from probability distributions. Math.random() samples uniformly from [0,1); generative models sample from a learned distribution.",
    breaks:
      "Math.random() samples uniformly from [0,1) with no parameters to learn. Generative models sample from a high-dimensional learned distribution that may have multiple modes, an unrepresentable tail, or unsafe regions. Sampling temperature, top-k, top-p — all knobs Math.random() does not have.",
    category: "nova-canvas",
    mlCode: "tf.randomNormal([latentDim]) // sample seed",
  },
  {
    id: 40,
    mlConcept: "Latent space interpolation",
    feConcept: "CSS transitions between states",
    tier: "structural",
    connection:
      "Both create smooth intermediate values between two defined points. CSS transitions interpolate between start and end styles; latent interpolation generates smooth blends between generated outputs.",
    breaks:
      "CSS transitions interpolate fixed properties along defined easing curves. Latent interpolation walks a path in a learned space where dimensions have no human meaning — in-between points may be coherent or garbage depending on whether the trajectory stays on the data manifold.",
    category: "nova-canvas",
    mlCode:
      "const z = z1.mul(t).add(z2.mul(1 - t)); // linear walk between latent vectors",
  },
  {
    id: 41,
    mlConcept: "GAN (generator vs. discriminator)",
    feConcept: "Fuzzer vs. validator",
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
    feConcept: "URL shortener",
    tier: "structural",
    connection:
      "Both compress complex data into a compact representation and reconstruct the original. A URL shortener encodes a long URL into a short code and decodes it back; a VAE encodes data into a latent vector and decodes it back.",
    breaks:
      "URL shorteners encode losslessly — decode reproduces the input exactly. VAEs encode lossy and probabilistic — the latent vector is a distribution, decoding samples from it. Reconstruction is approximate and nondeterministic.",
    category: "nova-canvas",
    mlCode:
      "const epsilon = tf.randomNormal(mu.shape);\nconst z = mu.add(tf.exp(logVar.mul(0.5)).mul(epsilon)); // reparameterization sample",
  },
  {
    id: 43,
    mlConcept: "Diffusion (noise \u2192 detail)",
    feConcept: "Progressive image loading",
    tier: "structural",
    connection:
      "Both start with a degraded version and iteratively refine toward full quality. Progressive JPEG loads blurry-to-sharp; diffusion denoises random noise into a coherent image. Same trajectory, different domain.",
    breaks:
      "Progressive JPEG decodes a fixed encoded payload from header to detail. Diffusion runs many denoising steps (50–1000), each a learned model call. Compute scales with quality, not file size. Same blurry-to-sharp visual, very different runtime cost.",
    category: "nova-canvas",
    mlCode:
      "const xT = sqrt(alphaBar).mul(x0).add(sqrt(1 - alphaBar).mul(noise))",
  },
  {
    id: 44,
    mlConcept: "Style transfer",
    feConcept:
      "Auto-formatter pipeline (Prettier / eslint --fix rewriting code until it matches a style config)",
    tier: "intuition",
    connection:
      "Both iteratively rewrite a target until it matches a reference style. Prettier walks the AST and emits whitespace, quote, and bracket choices that match the configured style — applied repeatedly until the output is stable. Style transfer walks pixel updates that minimize the difference between the target image's feature statistics (Gram matrices) and the reference style image's. Same shape: take an input that already has CONTENT, transform it iteratively until its STYLE matches an exemplar, preserve the content semantics throughout.",
    breaks:
      "Prettier's transformation is symbolic + deterministic: parse the AST, emit canonical formatting per rule, converge in one pass. Style transfer's transformation is numerical + stochastic: gradient descent against a perceptual-loss network, hundreds of forward + backward passes through frozen VGG, no closed-form rule. Prettier's 'style' is a config file you can read; style transfer's 'style' is a [C, C] Gram matrix per VGG layer that has no human-readable interpretation. Output of Prettier is deterministic; output of style transfer depends on initialization, learning rate, and step count.",
    category: "nova-canvas",
    mlCode:
      "// Style transfer: optimize pixels until Gram-matrix features match the style image\nlet x = tf.variable(content.clone());\nfor (let step = 0; step < 200; step++) {\n  const { value: loss, grads } = tf.variableGrads(() =>\n    contentLoss(vgg(x), vgg(content)).add(\n      styleLoss(gram(vgg(x)), gram(vgg(style))).mul(1e3)\n    ) as tf.Scalar\n  );\n  optimizer.applyGradients(grads);\n}",
  },

  // ── Terra Grid Bridges ───────────────────────────────────────────────
  {
    id: 45,
    mlConcept: "Edge inference",
    feConcept: "CDN edge locations",
    tier: "structural",
    connection:
      "Both move computation closer to the user/data source for lower latency. CDNs serve static assets from edge PoPs; edge ML runs inference on local devices. Same architecture, different payloads.",
    breaks:
      "CDN edge nodes serve immutable static assets with predictable per-region SLAs and centralized cache-purging. Edge inference runs on heterogeneous user devices — variable RAM, no GPU on most phones, intermittent connectivity, and OTA model updates that must succeed against possibly-stale runtimes. The same model can hit 30ms on desktop WebGL and 800ms on a budget Android in CPU mode.",
    category: "terra-grid",
    mlCode:
      "const model = await tf.loadLayersModel(indexedDBPath) // run inference on-device",
  },
  {
    id: 46,
    mlConcept: "Model quantization",
    feConcept: "Image format tradeoffs (PNG vs. WebP)",
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
    feConcept: "Tree-shaking",
    tier: "structural",
    connection:
      "Both remove components to reduce size. Tree-shaking eliminates statically unreferenced code via exact analysis. Pruning removes weights below a numeric threshold.",
    breaks:
      "Tree-shaking removes statically unreferenced code (analysis is exact, behavior unchanged). Weight pruning removes weights below a numeric threshold and the model usually requires fine-tuning to recover accuracy after pruning — sometimes accuracy never fully recovers. Tree-shaking is safe; pruning has a quality cost.",
    category: "terra-grid",
    mlCode:
      "tf.layers.dense({ units: 64, kernelRegularizer: tf.regularizers.l1({ l1: 0.01 }) })",
  },
  {
    id: 48,
    mlConcept: "Knowledge distillation",
    feConcept: "Code splitting",
    tier: "structural",
    connection:
      "Both decompose a large artifact into smaller, purpose-built pieces. Code splitting breaks a bundle into route-specific chunks; distillation transfers a large model\u2019s knowledge into a smaller, faster model.",
    breaks:
      "Code splitting decomposes one bundle into chunks of the same code. Distillation creates a different, smaller model that approximates the teacher — the student is not the teacher carved up; it is a separate model trained to mimic the teacher's outputs.",
    category: "terra-grid",
    mlCode:
      "const T = 4;\nconst pT = teacherLogits.div(T).softmax();\nconst pS = studentLogits.div(T).softmax();\nconst klLoss = pT.mul(pT.div(pS).log()).sum().mul(T * T); // T² scales gradient back",
  },
  {
    id: 49,
    mlConcept: "ML pipeline (data \u2192 train \u2192 deploy)",
    feConcept: "CI/CD pipeline",
    tier: "structural",
    connection:
      "Both are automated multi-stage pipelines that transform inputs into production artifacts. CI/CD: code \u2192 build \u2192 test \u2192 deploy. ML: data \u2192 train \u2192 evaluate \u2192 deploy. Same workflow pattern.",
    breaks:
      "CI/CD outputs are deterministic and identical given identical inputs. ML pipeline outputs (trained models) vary across runs even with fixed code due to random init, data shuffling, and GPU nondeterminism. Reproducibility requires extra effort (seeds, deterministic kernels).",
    category: "terra-grid",
    mlCode: "model.save('file://./artifacts/v1/model'); // versioned export",
  },
  {
    id: 50,
    mlConcept: "Drift detection",
    feConcept: "Lighthouse CI",
    tier: "structural",
    connection:
      "Both continuously monitor a production system for degradation against baselines. Lighthouse CI flags performance regressions; drift detection flags model accuracy regressions. Same monitoring pattern.",
    breaks:
      "Lighthouse runs a fixed test suite per PR and returns a deterministic pass/fail score. Drift detection compares incoming data distributions to a baseline using PSI/KL/KS — non-binary, threshold-tunable, and lagging because ground-truth labels arrive late or never. A drift alert is a hint that the model MAY be degrading; you still need a labelled holdout to confirm. Lighthouse failure is the bug; drift alert is a hypothesis.",
    category: "terra-grid",
    mlCode: "const psi = computePSI(baselineDistribution, currentDistribution)",
  },
  {
    id: 51,
    mlConcept: "Multi-armed bandit (ε-greedy / UCB1)",
    feConcept: "Dynamic ad rotation",
    tier: "structural",
    connection:
      "Both adaptively allocate traffic to whichever variant is performing best, while reserving a small fraction for exploration. Ad servers route impressions toward higher-CTR creatives; bandit schedulers route inference (or, in Tensorcraft's review queue, attention) toward higher-reward arms. Same explore-exploit tradeoff, same ε knob.",
    breaks:
      "Ad rotation has clear short-term reward signals and stationary arms over the test window. Production bandits face delayed rewards (long-term retention), non-stationary arms (model drift, new lessons appearing in the review queue), and exploration cost — Thompson sampling and UCB1 are not interchangeable knobs. Tensorcraft's review queue inherits the same failure modes: every new completed lesson adds an unpulled arm, and 'recall success' is a noisy proxy for 'remembered'.",
    category: "terra-grid",
    mlCode:
      "// ε-greedy: 15% random exploration, 85% exploit highest-reward arm\nconst pick = Math.random() < 0.15 ? randomArm() : argmaxReward(arms);",
  },
];
