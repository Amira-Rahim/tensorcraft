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
  },
  {
    id: 2,
    mlConcept: "Model parameters (weights)",
    feConcept: "Component state",
    tier: "structural",
    connection:
      "Both are internal values that change over time based on inputs. State updates in response to user events; weights update in response to training data. Both persist across render/training cycles.",
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
  },
  {
    id: 3,
    mlConcept: "Loss function",
    feConcept: "expect().toBe() assertions",
    tier: "structural",
    connection:
      "Both measure the gap between actual and expected output. A test assertion checks actual === expected; a loss function computes the distance between predictions and labels. Both quantify \u201chow wrong\u201d and drive corrections.",
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
  },
  {
    id: 4,
    mlConcept: "Gradient descent",
    feConcept: "Reconciliation",
    tier: "intuition",
    connection:
      "Both incrementally reduce a measured gap. Reconciliation patches the DOM toward the desired state; gradient descent adjusts weights toward lower loss. Caveat: Reconciliation is deterministic and complete; gradient descent is stochastic and incremental.",
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
  },
  {
    id: 5,
    mlConcept: "Learning rate",
    feConcept: "Animation easing / step size",
    tier: "intuition",
    connection:
      "Both control how aggressively a system moves toward its target per step. A large step overshoots; a small step converges slowly. Both require tuning. Caveat: The mechanisms are unrelated \u2014 learning rate scales gradient magnitudes, animation easing interpolates time curves.",
    category: "shared",
    variants: {
      react: {
        feCode: `// React Spring easing config\nuseSpring({\n  to: { x: 100 },\n  config: { tension: 170, friction: 26 },\n})`,
      },
      vue: {
        feCode: `<Transition name="fade" :duration="300">\n  <div v-if="show">content</div>\n</Transition>`,
      },
      angular: {
        feCode: `trigger('fadeIn', [\n  transition(':enter', [\n    style({ opacity: 0 }),\n    animate('300ms ease-in'),\n  ]),\n])`,
      },
      svelte: {
        feCode: `<div transition:fade={{ duration: 300, easing: cubicOut }}>`,
      },
      vanilla: {
        feCode: `el.style.transition = 'transform 0.3s ease-out';`,
      },
    },
  },
  {
    id: 6,
    mlConcept: "Epochs",
    feConcept: "requestAnimationFrame loop",
    tier: "structural",
    connection:
      "Both are repeated cycles where the system processes input and refines output. An rAF loop reruns render logic every frame; an epoch reruns training over the entire dataset. Both converge toward a target.",
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
  },
  {
    id: 7,
    mlConcept: "Batch size",
    feConcept: "Chunk / page size",
    tier: "structural",
    connection:
      "Both control how much data is processed at once. Pagination loads N items per page; batch size feeds N samples per gradient update. Both balance memory and throughput.",
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
  },
  {
    id: 8,
    mlConcept: "Overfitting",
    feConcept: "Overspecialized component",
    tier: "intuition",
    connection:
      "Both are cases of being too tailored to specific inputs. An overspecialized component breaks with new data; an overfit model fails on new examples. Both need generalization.",
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
  },
  {
    id: 9,
    mlConcept: "Regularization",
    feConcept: "Code linting / constraints",
    tier: "intuition",
    connection:
      "Both impose rules that prevent overly specific or complex solutions. Linting constrains code style; regularization constrains model complexity. Both improve generalizability.",
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
  },
  {
    id: 10,
    mlConcept: "Feature engineering",
    feConcept: "Data transformation / mapping",
    tier: "structural",
    connection:
      "Both transform raw inputs into more useful representations. Array.map transforms data for rendering; feature engineering transforms data for modeling. Both are about shaping inputs.",
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
  },
  {
    id: 11,
    mlConcept: "Train/test split",
    feConcept: "Dev/prod environments",
    tier: "structural",
    connection:
      "Both separate the context for building from the context for evaluation. You develop in dev, test in prod; you train on training data, evaluate on test data. Mixing them gives false confidence.",
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
  },
  {
    id: 12,
    mlConcept: "Hyperparameters",
    feConcept: "Config / environment variables",
    tier: "structural",
    connection:
      "Both are settings that control behavior but aren\u2019t learned from data. Env vars configure an app without changing code; hyperparameters configure training without being part of the model.",
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
  },
  {
    id: 13,
    mlConcept: "Neural network layers",
    feConcept: "Middleware / pipeline stages",
    tier: "structural",
    connection:
      "Both are sequential processing steps where each transforms its input and passes the result forward. Express middleware and neural network layers are structurally identical: input \u2192 transform \u2192 output \u2192 next.",
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
  },
  {
    id: 15,
    mlConcept: "Backpropagation",
    feConcept: "Reconciliation (tracing diffs backward)",
    tier: "intuition",
    connection:
      "Both propagate information backward through a structure to determine what needs updating. React traces from changed leaves back to root; backprop traces from loss back to input weights via the chain rule. Caveat: Backprop is a mathematical operation (chain rule, partial derivatives) with no direct DOM equivalent.",
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
  },
  {
    id: 16,
    mlConcept: "Model inference",
    feConcept: "Server-side rendering",
    tier: "structural",
    connection:
      "Both take an input and produce an output in a single forward pass, without iterative updating. SSR renders HTML from data; inference produces predictions from features. Both are \u201cone-shot.\u201d",
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
  },
  {
    id: 17,
    mlConcept: "Data augmentation",
    feConcept: "Responsive design / media queries",
    tier: "intuition",
    connection:
      "Both create variations of the input to handle diverse conditions. Media queries adapt layouts to screen sizes; data augmentation creates training variations for robustness. Both prevent brittleness.",
    category: "shared",
    variants: {
      react: {
        feCode: `<div className="w-full md:w-1/2 lg:w-1/3">`,
      },
      vue: {
        feCode: `<div :class="isMobile ? 'w-full' : 'w-1/2'">`,
      },
      angular: {
        feCode: `<div [ngClass]="{\n  'col-12': isMobile,\n  'col-6': !isMobile\n}">`,
      },
      svelte: {
        feCode: `<div class={isMobile ? 'w-full' : 'w-1/2'}>`,
      },
      vanilla: {
        feCode: `@media (min-width: 768px) {\n  .card { width: 50%; }\n}`,
      },
    },
  },
  {
    id: 18,
    mlConcept: "Dropout",
    feConcept: "Randomly hiding team members during practice",
    tier: "intuition",
    connection:
      "Both temporarily remove participants to prevent over-reliance on any single one. If one neuron always fires, others co-adapt. Random removal forces resilience and independence.",
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
  },
  {
    id: 19,
    mlConcept: "Confusion matrix",
    feConcept: "Error boundary report",
    tier: "structural",
    connection:
      "Both provide structured breakdowns of what went right and wrong. An error boundary catches and categorizes errors; a confusion matrix categorizes predictions vs. actuals. Both guide debugging.",
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
  },
  {
    id: 20,
    mlConcept: "Model deployment",
    feConcept: "CI/CD pipeline",
    tier: "structural",
    connection:
      "Both are the process of taking something from development to production. CI/CD deploys code; model deployment serves a model. Both involve versioning, testing, and monitoring.",
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
