# Bridge triage for the JavaScript rebrand (DRAFT, 2026-08-18)

Status: DRAFT decision table, generated as the first step of the trailing
rebrand phase (see docs/post-launch-backlog.md, Horizon 1). No lesson prose
changes ship from this file until each row's decision column is filled and
reviewed.

Context: the audience widened from frontend engineers to JavaScript
engineers (owner decision 2026-08-18). Of the 274 lesson bridges, the rows
below anchor on a browser, CSS, DOM, or React concept. Each needs one of
three decisions:

- **keep-browser**: the anchor is near-universal JS literacy (DOM events,
  fetch, canvas pixels), the ML concept is perceptual, or the bridge is
  identity-tier. Identity bridges are never downgraded to a strained Node
  structural analogy.
- **swap-to-node**: the anchor is niche browser expertise AND a Node
  concept of equal or better mechanical fidelity exists (streams and
  backpressure for batch loading, the event loop for training-loop
  scheduling, worker_threads for parallelism, middleware for layer
  composition). Server-adjacent topics (data loading, file IO, batching,
  deployment) default to Node.
- **dual-frame**: both runtimes have first-class analogies and the cost is
  one clause. Cap at roughly 1 in 4 of the swapped set; dual-framing is
  the most expensive to read.

Invariants (from the approved rebrand plan):
- `tier` never changes silently; a fidelity-class change updates the tier
  field with a note in this table, approved by the content owner.
- Every swapped bridge gets freshly written `breaks` text for the NEW
  analogy; carrying the old breaks forward is an automatic reject.
- A Node-experienced reviewer checks every new Node analogy for mechanical
  accuracy.
- Rewrites land grouped by world/module so review chunks stay small.

Pre-filled recommendation heuristic (verify per row, do not trust blindly):
identity tier defaults to keep-browser; everything else is "review".

## Decision table

| Lesson | jsTitle anchor | Tier | Recommendation | Decision | New anchor | Breaks rewritten |
|---|---|---|---|---|---|---|
| deep-orbit/advanced-time-series/01-beyond-lstm | CSS :focus | intuition | review |  |  |  |
| deep-orbit/advanced-time-series/02-temporal-attention | scrollIntoView() | intuition | review |  |  |  |
| deep-orbit/advanced-time-series/05-ensemble-methods | Micro-Frontends | structural | review |  |  |  |
| deep-orbit/anomaly-detection/05-the-anomaly | Error Boundary | intuition | review |  |  |  |
| deep-orbit/optimization-edge/01-model-profiling | DevTools Performance | structural | review |  |  |  |
| deep-orbit/optimization-edge/04-caching-strategies | Service Worker Cache | structural | review |  |  |  |
| deep-orbit/optimization-edge/05-webgpu-acceleration | Canvas WebGL | structural | review |  |  |  |
| deep-orbit/recurrent-networks/01-sequences-matter | React List Keys | structural | review |  |  |  |
| deep-orbit/recurrent-networks/02-simple-rnns | useReducer | structural | review |  |  |  |
| deep-orbit/recurrent-networks/04-sliding-windows | IntersectionObserver | structural | review |  |  |  |
| deep-orbit/signal-processing/01-time-vs-frequency | DOM vs CSSOM | intuition | review |  |  |  |
| deep-orbit/signal-processing/02-fourier-transform | @keyframes Decomposition | structural | review |  |  |  |
| deep-orbit/signal-processing/03-spectrograms | DevTools Waterfall | intuition | review |  |  |  |
| deep-orbit/signal-processing/05-windowing-and-overlap | Virtual Scrolling | structural | review |  |  |  |
| deep-orbit/training-loop/03-backpropagation | React Reconciliation | intuition | review |  |  |  |
| deep-orbit/training-loop/04-training-loop | requestAnimationFrame | structural | review |  |  |  |
| neon-protocol/convolutional-neural-networks/01-convolution-operations | CSS filter: blur() | structural | review |  |  |  |
| neon-protocol/convolutional-neural-networks/02-pooling-layers | srcset Responsive Images | structural | review |  |  |  |
| neon-protocol/convolutional-neural-networks/05-visualizing-features | DevTools Element Inspection | structural | review |  |  |  |
| neon-protocol/generative-vision/03-style-transfer | CSS Themes | structural | review |  |  |  |
| neon-protocol/image-data/02-data-augmentation | CSS Transforms | structural | review |  |  |  |
| neon-protocol/image-data/03-normalization | CSS Normalize | structural | review |  |  |  |
| neon-protocol/ml-through-vision/03-color-channels | CSS Color Functions | structural | review |  |  |  |
| neon-protocol/ml-through-vision/04-image-operations | CSS object-fit | structural | review |  |  |  |
| neon-protocol/object-detection/01-bounding-boxes | getBoundingClientRect() | identity | keep-browser |  |  |  |
| neon-protocol/object-detection/02-anchor-boxes | CSS Grid Template Areas | structural | review |  |  |  |
| neon-protocol/real-time-detection/02-frame-by-frame-inference | requestAnimationFrame() Render Loop | identity | keep-browser |  |  |  |
| neon-protocol/real-time-detection/03-performance-budgets | Lighthouse Performance Budgets | structural | review |  |  |  |
| neon-protocol/real-time-detection/04-webgl-acceleration | WebGL Rendering Pipeline | structural | review |  |  |  |
| neon-protocol/segmentation/01-semantic-segmentation | CSS clip-path | structural | review |  |  |  |
| neon-protocol/segmentation/02-instance-segmentation | DOM element identity vs class | structural | review |  |  |  |
| neon-protocol/segmentation/04-mask-generation | SVG mask and clipPath | structural | review |  |  |  |
| neon-protocol/segmentation/05-scene-understanding | Semantic HTML | intuition | review |  |  |  |
| nova-canvas/audio-generation/01-audio-as-data | Web Audio API | structural | review |  |  |  |
| nova-canvas/clip-alignment/05-prompt-engineering-for-images | Writing effective CSS selectors | structural | review |  |  |  |
| nova-canvas/creative-deployment/01-performance-profiling | DevTools Performance Panel | structural | review |  |  |  |
| nova-canvas/creative-deployment/03-caching-precomputation | Service Worker Cache | structural | review |  |  |  |
| nova-canvas/diffusion-models/04-classifier-free-guidance | CSS custom property overrides | structural | review |  |  |  |
| nova-canvas/diffusion-models/05-high-resolution-generation | srcset and responsive images | structural | review |  |  |  |
| nova-canvas/latent-spaces/02-dimensionality | CSS Custom Properties | structural | review |  |  |  |
| nova-canvas/latent-spaces/03-interpolation | CSS Transitions | structural | review |  |  |  |
| nova-canvas/multimodal-learning/05-text-to-image | Server-side rendering: text becomes visual | structural | review |  |  |  |
| nova-canvas/style-transfer/01-content-vs-style | Content vs presentation (HTML vs CSS) | intuition | review |  |  |  |
| nova-canvas/style-transfer/02-neural-style-transfer | CSS theme switching | structural | review |  |  |  |
| nova-canvas/style-transfer/04-realtime-style-transfer | CSS filter chains | structural | review |  |  |  |
| nova-canvas/style-transfer/05-artistic-control | CSS mix-blend-mode | structural | review |  |  |  |
| nova-canvas/variational-autoencoders/04-kl-divergence | CSS Specificity Balance | intuition | review |  |  |  |
| signal-ward/attention-mechanisms/01-the-attention-problem | CSS :focus + tabIndex | structural | review |  |  |  |
| signal-ward/attention-mechanisms/02-self-attention | scrollIntoView() | structural | review |  |  |  |
| signal-ward/attention-mechanisms/04-attention-visualization | DevTools Element Highlighting | structural | review |  |  |  |
| signal-ward/named-entity-recognition/02-bio-tagging | HTML Opening/Closing Tags | structural | review |  |  |  |
| signal-ward/named-entity-recognition/04-sequence-labeling | CSS Class Assignment Per Element | structural | review |  |  |  |
| signal-ward/production-privacy/03-bias-auditing | Accessibility Audit (Lighthouse) | structural | review |  |  |  |
| signal-ward/question-answering-rag/03-rag-architecture | React Server Components | structural | review |  |  |  |
| signal-ward/sequence-models/03-vanishing-gradients | Event Bubbling Fades in Deep DOM | structural | review |  |  |  |
| signal-ward/sequence-models/04-lstm-gru | React useMemo / useCallback | structural | review |  |  |  |
| signal-ward/transformers-bert/02-transformer-architecture | React Virtual DOM | structural | review |  |  |  |
| signal-ward/word-embeddings/02-dense-vectors | CSS Color Space | intuition | review |  |  |  |
| signal-ward/word-embeddings/03-medical-embeddings | Scoped CSS Variables | structural | review |  |  |  |
| terra-grid/edge-ai-basics/05-edge-vs-cloud-tradeoffs | CSR vs SSR | structural | review |  |  |  |
| terra-grid/edge-deployment/04-over-the-air-updates | Service Worker Update | structural | review |  |  |  |
| terra-grid/edge-deployment/05-offline-operation | IndexedDB + Service Worker | structural | review |  |  |  |
| terra-grid/monitoring-drift/02-data-drift | Lighthouse CI Regression | structural | review |  |  |  |
| terra-grid/optimization-fundamentals/02-architecture-efficiency | Avoiding Re-renders | structural | review |  |  |  |
| terra-grid/optimization-fundamentals/03-computational-budgets | Lighthouse Budget | structural | review |  |  |  |

## Companion surfaces that follow each row's decision

- The matching `LessonRecap bridge="..."` one-liner in the same lesson.
- The canonical entry in `packages/shared/src/bridges.ts` (connection and
  breaks text), where one exists.
- The world script doc (`docs/scripts/<world>.md`) JS BRIDGE section.

## Appendix: in-dialogue and architectural mentions held for this pass

The 2026-08-18 noun pass deliberately left these (character voice is
governed by docs/story-style-bible.md; architectural uses pass the
client-layer litmus). Revisit each while triaging its world:

- neon-protocol/feature-extraction/04-backbone-networks.mdx:38 (narrative:
  "start a new frontend project ... import a component library")
- neon-protocol/generative-vision/03-style-transfer.mdx:46 (dialogue:
  "separation we use in frontend architecture")
- neon-protocol/object-detection/04-non-max-suppression.mdx:38 (dialogue:
  "In frontend, you debounce")
- neon-protocol/capstone/03-testing-and-validation.mdx:46 and :208
  (dialogue: "a fourth layer that frontend doesn't have")
- neon-protocol/image-data/01-building-datasets.mdx:39 (dialogue: "ship a
  frontend app with broken image paths")
- signal-ward/transformers-bert/05-medis-mistake.mdx:261 (dialogue: "In
  frontend terms, you never trust client input alone")
- signal-ward/ml-through-text/01-the-crisis.mdx:51 (dialogue: "you built
  the patient portal frontend": architectural, likely keep)
- signal-ward/production-privacy/02-privacy-and-hipaa.mdx:41 (dialogue:
  "Every frontend application I have built")
- signal-ward/tokenization-preprocessing/01-word-tokenization.mdx:42
  (dialogue: "every frontend developer's nightmare with user input")
- signal-ward/capstone/02-hospital-integration.mdx:39 (dialogue: "I've
  integrated frontend apps with Stripe": biography, likely keep)
- nova-canvas/style-transfer/01-content-vs-style.mdx:43 (narrative:
  "Frontend developers understand it too. HTML is content. CSS is style.")
- nova-canvas/creative-deployment/01-performance-profiling.mdx:42,
  02-model-optimization.mdx:38, 04-concurrent-users.mdx:42 (dialogue)
- nova-canvas/multimodal-learning/01-what-is-multimodal.mdx:10, :15, :47,
  :62 (full-stack layers analogy: frontend as the client layer,
  architectural, likely keep)
- deep-orbit/advanced-time-series/05-ensemble-methods.mdx:18 (jsTitle
  "Micro-Frontends": proper noun of a real pattern; swapping it is an
  analogy redesign, exactly this table's row)
- docs/scripts career tables list "Frontend Engineer (ML Products)" rows:
  real job-market role names, kept.
