# Bridge-Tier Audit — 2026-04-25

Total lessons: **296**

Source data:
- Lessons: `packages/content/content/**/*.mdx`
- Canonical registry: `packages/shared/src/bridges.ts` — 50 bridges

## Tier distribution (overall)

| Tier | Count | % |
|---|---:|---:|
| identity | 15 | 5.1% |
| structural | 249 | 84.1% |
| intuition | 31 | 10.5% |
| missing | 1 | 0.3% |

## Tier distribution per theme

| Theme | identity | structural | intuition | missing | total |
|---|---:|---:|---:|---:|---:|
| deep-orbit | 2 | 42 | 11 | 1 | 56 |
| neon-protocol | 4 | 46 | 4 | 0 | 54 |
| nova-canvas | 1 | 45 | 9 | 0 | 55 |
| shared | 0 | 17 | 4 | 0 | 21 |
| signal-ward | 1 | 52 | 2 | 0 | 55 |
| terra-grid | 7 | 47 | 1 | 0 | 55 |

## Lessons missing bridge

- [packages/content/content/deep-orbit/foundations/04-data-loading.mdx](../../packages/content/content/deep-orbit/foundations/04-data-loading.mdx)

## Tier mismatches (lesson tier ≠ canonical registry) — 0

_None._

## Orphan bridges (not in canonical 50-bridge registry) — 293

Lesson-invented analogies. Each is a candidate to either (a) promote to the canonical registry if it's reusable across lessons, or (b) reword to align with an existing canonical entry.

### deep-orbit — 54 orphans

| Lesson | feTitle | mlTitle | tier |
|---|---|---|---|
| [packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx](../../packages/content/content/deep-orbit/advanced-time-series/01-beyond-lstm.mdx) | CSS :focus | Attention | intuition |
| [packages/content/content/deep-orbit/advanced-time-series/02-temporal-attention.mdx](../../packages/content/content/deep-orbit/advanced-time-series/02-temporal-attention.mdx) | scrollIntoView() | Temporal Attention | intuition |
| [packages/content/content/deep-orbit/advanced-time-series/03-forecasting.mdx](../../packages/content/content/deep-orbit/advanced-time-series/03-forecasting.mdx) | Prefetching | Forecasting | intuition |
| [packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx](../../packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx) | Exponential Moving Average | Kalman Update | structural |
| [packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx](../../packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx) | Micro-Frontends | Model Ensemble | structural |
| [packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx) | Performance Baseline | Anomaly Threshold | structural |
| [packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx) | Compression | Autoencoder | structural |
| [packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx](../../packages/content/content/deep-orbit/anomaly-detection/03-reconstruction-error.mdx) | git diff | Reconstruction Error | intuition |
| [packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx) | Alert Thresholds | Anomaly Threshold | structural |
| [packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx](../../packages/content/content/deep-orbit/anomaly-detection/05-the-anomaly.mdx) | Error Boundary | Anomaly Alert | intuition |
| [packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx](../../packages/content/content/deep-orbit/browser-runtimes/01-why-the-browser.mdx) | Client-Side Rendering | Client-Side Inference | structural |
| [packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx](../../packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx) | npm install | TF.js Install | identity |
| [packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx) | fetch() → JSON | Model Loading | structural |
| [packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx) | Event → Process → Render | Input → Predict → Display | structural |
| [packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx](../../packages/content/content/deep-orbit/browser-runtimes/05-onnx-runtime-web.mdx) | Cross-Browser Compat | Cross-Runtime Models | structural |
| [packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx](../../packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx) | npm install component-library | Transformers.js pipeline | structural |
| [packages/content/content/deep-orbit/capstone/01-system-architecture.mdx](../../packages/content/content/deep-orbit/capstone/01-system-architecture.mdx) | Package Dependencies | Pipeline Dependencies | structural |
| [packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx](../../packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx) | GitHub Actions CI | ML CI/CD | structural |
| [packages/content/content/deep-orbit/capstone/03-monitoring.mdx](../../packages/content/content/deep-orbit/capstone/03-monitoring.mdx) | App Monitoring | Model Monitoring | structural |
| [packages/content/content/deep-orbit/capstone/04-documentation.mdx](../../packages/content/content/deep-orbit/capstone/04-documentation.mdx) | README + JSDoc | Model Card | structural |
| [packages/content/content/deep-orbit/capstone/05-launch.mdx](../../packages/content/content/deep-orbit/capstone/05-launch.mdx) | Static Site Deploy | ML App Deploy | structural |
| [packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx) | TypedArray | Tensor | structural |
| [packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx](../../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx) | Array.length | Tensor.shape | structural |
| [packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx](../../packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx) | Array.map() | tf.add() | structural |
| [packages/content/content/deep-orbit/foundations/05-normalization.mdx](../../packages/content/content/deep-orbit/foundations/05-normalization.mdx) | CSS normalize/reset | Feature Normalization | intuition |
| [packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx](../../packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx) | AI Code Completion | LLM Analysis | structural |
| [packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx](../../packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx) | Search Queries | Prompt Design | structural |
| [packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx](../../packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx) | Server Components | RAG Pipeline | structural |
| [packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx](../../packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx) | Template Rendering | Report Generation | structural |
| [packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx](../../packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx) | Micro-Services | Model Orchestration | structural |
| [packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx](../../packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx) | Array.reduce() | Neuron | structural |
| [packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx](../../packages/content/content/deep-orbit/neural-networks/03-layers-and-architecture.mdx) | Component Composition | Layer Composition | structural |
| [packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx](../../packages/content/content/deep-orbit/neural-networks/04-forward-pass.mdx) | Event Propagation | Forward Pass | intuition |
| [packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx](../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx) | App Assembly | Model Compilation | structural |
| [packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx](../../packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx) | DevTools Performance | Model Profiling | structural |
| [packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx](../../packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx) | Image Compression | Quantization | structural |
| [packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx](../../packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx) | Tree-Shaking | Pruning | structural |
| [packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx](../../packages/content/content/deep-orbit/optimization-edge/04-caching-strategies.mdx) | Service Worker Cache | Inference Cache | structural |
| [packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx](../../packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx) | Canvas WebGL | WebGPU Compute | structural |
| [packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx](../../packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx) | React List Keys | Sequence Order | structural |
| [packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx) | useReducer | RNN Cell | structural |
| [packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx](../../packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx) | localStorage with TTL | LSTM Forget Gate | structural |
| [packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx](../../packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx) | IntersectionObserver | Sliding Window | structural |
| [packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx) | Autocomplete | Sequence Forecast | structural |
| [packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx](../../packages/content/content/deep-orbit/signal-processing/01-time-vs-frequency.mdx) | DOM vs CSSOM | Time vs Frequency | intuition |
| [packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx](../../packages/content/content/deep-orbit/signal-processing/02-fourier-transform.mdx) | @keyframes Decomposition | FFT Decomposition | structural |
| [packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx](../../packages/content/content/deep-orbit/signal-processing/03-spectrograms.mdx) | DevTools Waterfall | Spectrogram | intuition |
| [packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx) | Derived State | Feature Engineering | structural |
| [packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx) | Virtual Scrolling | Windowing | structural |
| [packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx](../../packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx) | expect().toBe() | Loss Function | structural |
| [packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx](../../packages/content/content/deep-orbit/training-loop/02-gradient-descent.mdx) | Scroll Direction | Gradient | intuition |
| [packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx](../../packages/content/content/deep-orbit/training-loop/03-backpropagation.mdx) | React Reconciliation | Backpropagation | intuition |
| [packages/content/content/deep-orbit/training-loop/04-training-loop.mdx](../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx) | requestAnimationFrame | Training Loop | structural |
| [packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx](../../packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx) | E2E Tests | Model Evaluation | structural |

### neon-protocol — 53 orphans

| Lesson | feTitle | mlTitle | tier |
|---|---|---|---|
| [packages/content/content/neon-protocol/capstone/01-system-architecture.mdx](../../packages/content/content/neon-protocol/capstone/01-system-architecture.mdx) | Component Architecture Diagram | System Architecture Diagram | structural |
| [packages/content/content/neon-protocol/capstone/02-integration.mdx](../../packages/content/content/neon-protocol/capstone/02-integration.mdx) | Middleware Chain | Model Pipeline | structural |
| [packages/content/content/neon-protocol/capstone/03-testing-and-validation.mdx](../../packages/content/content/neon-protocol/capstone/03-testing-and-validation.mdx) | Frontend Testing Pyramid | ML Testing Pyramid | structural |
| [packages/content/content/neon-protocol/capstone/04-documentation.mdx](../../packages/content/content/neon-protocol/capstone/04-documentation.mdx) | README.md + API Docs | Model Card | structural |
| [packages/content/content/neon-protocol/capstone/05-launch.mdx](../../packages/content/content/neon-protocol/capstone/05-launch.mdx) | Production Deployment with Feature Flags | Model Launch with Feature Flags | structural |
| [packages/content/content/neon-protocol/convolutional-neural-networks/01-convolution-operations.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/01-convolution-operations.mdx) | CSS filter: blur() | Convolution Operation | structural |
| [packages/content/content/neon-protocol/convolutional-neural-networks/02-pooling-layers.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/02-pooling-layers.mdx) | srcset Responsive Images | Max Pooling | structural |
| [packages/content/content/neon-protocol/convolutional-neural-networks/03-cnn-architecture.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/03-cnn-architecture.mdx) | Component Composition | CNN Layer Stack | structural |
| [packages/content/content/neon-protocol/convolutional-neural-networks/04-training-a-cnn.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/04-training-a-cnn.mdx) | Build Pipeline Execution | Training Loop | structural |
| [packages/content/content/neon-protocol/convolutional-neural-networks/05-visualizing-features.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/05-visualizing-features.mdx) | DevTools Element Inspection | Feature Map Visualization | structural |
| [packages/content/content/neon-protocol/deployment/01-model-export.mdx](../../packages/content/content/neon-protocol/deployment/01-model-export.mdx) | JSON.stringify/parse | Model Serialization | structural |
| [packages/content/content/neon-protocol/deployment/02-optimization-for-browser.mdx](../../packages/content/content/neon-protocol/deployment/02-optimization-for-browser.mdx) | Webpack Tree-Shaking | Model Pruning | structural |
| [packages/content/content/neon-protocol/deployment/03-inference-api.mdx](../../packages/content/content/neon-protocol/deployment/03-inference-api.mdx) | REST API Endpoint | Inference Endpoint | identity |
| [packages/content/content/neon-protocol/deployment/04-monitoring-and-drift.mdx](../../packages/content/content/neon-protocol/deployment/04-monitoring-and-drift.mdx) | Error Tracking (Sentry/DataDog) | Model Monitoring | structural |
| [packages/content/content/neon-protocol/deployment/05-hardening-sentinel.mdx](../../packages/content/content/neon-protocol/deployment/05-hardening-sentinel.mdx) | Load Testing APIs (k6, Artillery) | Load Testing Models | structural |
| [packages/content/content/neon-protocol/feature-extraction/01-feature-vectors.mdx](../../packages/content/content/neon-protocol/feature-extraction/01-feature-vectors.mdx) | Hash functions | Feature Vector | structural |
| [packages/content/content/neon-protocol/feature-extraction/02-embedding-spaces.mdx](../../packages/content/content/neon-protocol/feature-extraction/02-embedding-spaces.mdx) | 2D scatter plot positioning | Embedding Space | structural |
| [packages/content/content/neon-protocol/feature-extraction/03-similarity-search.mdx](../../packages/content/content/neon-protocol/feature-extraction/03-similarity-search.mdx) | Fuzzy text search / autocomplete | Similarity Search | structural |
| [packages/content/content/neon-protocol/feature-extraction/04-backbone-networks.mdx](../../packages/content/content/neon-protocol/feature-extraction/04-backbone-networks.mdx) | Shared component libraries | Backbone Network | structural |
| [packages/content/content/neon-protocol/feature-extraction/05-feature-pipelines.mdx](../../packages/content/content/neon-protocol/feature-extraction/05-feature-pipelines.mdx) | Express middleware pipeline | Feature Pipeline | structural |
| [packages/content/content/neon-protocol/generative-vision/01-gans-primer.mdx](../../packages/content/content/neon-protocol/generative-vision/01-gans-primer.mdx) | Fuzzer vs Validator in Testing | Generator vs Discriminator | structural |
| [packages/content/content/neon-protocol/generative-vision/02-variational-autoencoders.mdx](../../packages/content/content/neon-protocol/generative-vision/02-variational-autoencoders.mdx) | URL Query Parameters | Latent Space Encoding | structural |
| [packages/content/content/neon-protocol/generative-vision/03-style-transfer.mdx](../../packages/content/content/neon-protocol/generative-vision/03-style-transfer.mdx) | CSS Themes | Neural Style Transfer | structural |
| [packages/content/content/neon-protocol/generative-vision/04-adversarial-patches.mdx](../../packages/content/content/neon-protocol/generative-vision/04-adversarial-patches.mdx) | XSS Attacks | Adversarial Examples | structural |
| [packages/content/content/neon-protocol/generative-vision/05-ethical-deployment.mdx](../../packages/content/content/neon-protocol/generative-vision/05-ethical-deployment.mdx) | Content Security Policy Headers | Model Governance Policy | structural |
| [packages/content/content/neon-protocol/image-data/01-building-datasets.mdx](../../packages/content/content/neon-protocol/image-data/01-building-datasets.mdx) | Asset Pipeline | Dataset Structure | structural |
| [packages/content/content/neon-protocol/image-data/02-data-augmentation.mdx](../../packages/content/content/neon-protocol/image-data/02-data-augmentation.mdx) | CSS Transforms | Image Augmentation | structural |
| [packages/content/content/neon-protocol/image-data/03-normalization.mdx](../../packages/content/content/neon-protocol/image-data/03-normalization.mdx) | CSS Normalize | Pixel Normalization | structural |
| [packages/content/content/neon-protocol/image-data/04-class-balance.mdx](../../packages/content/content/neon-protocol/image-data/04-class-balance.mdx) | Load Balancing | Class Balancing | structural |
| [packages/content/content/neon-protocol/ml-through-vision/01-seeing-like-a-machine.mdx](../../packages/content/content/neon-protocol/ml-through-vision/01-seeing-like-a-machine.mdx) | Canvas getImageData() | Image Tensor | structural |
| [packages/content/content/neon-protocol/ml-through-vision/02-pixels-and-tensors.mdx](../../packages/content/content/neon-protocol/ml-through-vision/02-pixels-and-tensors.mdx) | Uint8ClampedArray | Tensor Indexing | structural |
| [packages/content/content/neon-protocol/ml-through-vision/03-color-channels.mdx](../../packages/content/content/neon-protocol/ml-through-vision/03-color-channels.mdx) | CSS Color Functions | Color Spaces | structural |
| [packages/content/content/neon-protocol/ml-through-vision/04-image-operations.mdx](../../packages/content/content/neon-protocol/ml-through-vision/04-image-operations.mdx) | CSS object-fit | Image Preprocessing | structural |
| [packages/content/content/neon-protocol/ml-through-vision/05-your-first-classifier.mdx](../../packages/content/content/neon-protocol/ml-through-vision/05-your-first-classifier.mdx) | if/else Logic | Threshold Classifier | identity |
| [packages/content/content/neon-protocol/object-detection/02-anchor-boxes.mdx](../../packages/content/content/neon-protocol/object-detection/02-anchor-boxes.mdx) | CSS Grid Template Areas | Anchor Grid | structural |
| [packages/content/content/neon-protocol/object-detection/03-intersection-over-union.mdx](../../packages/content/content/neon-protocol/object-detection/03-intersection-over-union.mdx) | Drag-and-Drop Hit Testing | IoU Score | structural |
| [packages/content/content/neon-protocol/object-detection/04-non-max-suppression.mdx](../../packages/content/content/neon-protocol/object-detection/04-non-max-suppression.mdx) | debounce() | Non-Max Suppression | structural |
| [packages/content/content/neon-protocol/object-detection/05-yolo-architecture.mdx](../../packages/content/content/neon-protocol/object-detection/05-yolo-architecture.mdx) | Single-Pass Rendering | YOLO Single-Shot Detection | structural |
| [packages/content/content/neon-protocol/real-time-detection/01-video-stream-processing.mdx](../../packages/content/content/neon-protocol/real-time-detection/01-video-stream-processing.mdx) | getUserMedia() API | Video Frame Pipeline | structural |
| [packages/content/content/neon-protocol/real-time-detection/02-frame-by-frame-inference.mdx](../../packages/content/content/neon-protocol/real-time-detection/02-frame-by-frame-inference.mdx) | requestAnimationFrame() Render Loop | Inference Loop | identity |
| [packages/content/content/neon-protocol/real-time-detection/03-performance-budgets.mdx](../../packages/content/content/neon-protocol/real-time-detection/03-performance-budgets.mdx) | Lighthouse Performance Budgets | Inference Performance Budget | structural |
| [packages/content/content/neon-protocol/real-time-detection/04-webgl-acceleration.mdx](../../packages/content/content/neon-protocol/real-time-detection/04-webgl-acceleration.mdx) | WebGL Rendering Pipeline | WebGL Compute Backend | structural |
| [packages/content/content/neon-protocol/real-time-detection/05-streaming-architectures.mdx](../../packages/content/content/neon-protocol/real-time-detection/05-streaming-architectures.mdx) | WebSocket / Server-Sent Events | Inference Stream | structural |
| [packages/content/content/neon-protocol/segmentation/01-semantic-segmentation.mdx](../../packages/content/content/neon-protocol/segmentation/01-semantic-segmentation.mdx) | CSS clip-path | Segmentation Mask | structural |
| [packages/content/content/neon-protocol/segmentation/02-instance-segmentation.mdx](../../packages/content/content/neon-protocol/segmentation/02-instance-segmentation.mdx) | DOM element identity vs class | Instance Segmentation | structural |
| [packages/content/content/neon-protocol/segmentation/03-unet-architecture.mdx](../../packages/content/content/neon-protocol/segmentation/03-unet-architecture.mdx) | Layout flow: content down, styles up | U-Net: Encode down, decode up | structural |
| [packages/content/content/neon-protocol/segmentation/04-mask-generation.mdx](../../packages/content/content/neon-protocol/segmentation/04-mask-generation.mdx) | SVG mask and clipPath | Binary Mask Generation | structural |
| [packages/content/content/neon-protocol/segmentation/05-scene-understanding.mdx](../../packages/content/content/neon-protocol/segmentation/05-scene-understanding.mdx) | Semantic HTML | Scene Understanding | intuition |
| [packages/content/content/neon-protocol/transfer-learning/01-pretrained-models.mdx](../../packages/content/content/neon-protocol/transfer-learning/01-pretrained-models.mdx) | npm package | Pre-trained Model | intuition |
| [packages/content/content/neon-protocol/transfer-learning/02-feature-reuse.mdx](../../packages/content/content/neon-protocol/transfer-learning/02-feature-reuse.mdx) | Component libraries | Transfer Learning | structural |
| [packages/content/content/neon-protocol/transfer-learning/03-fine-tuning.mdx](../../packages/content/content/neon-protocol/transfer-learning/03-fine-tuning.mdx) | Object.freeze() | Layer Freezing | structural |
| [packages/content/content/neon-protocol/transfer-learning/04-domain-adaptation.mdx](../../packages/content/content/neon-protocol/transfer-learning/04-domain-adaptation.mdx) | i18n — adapting across locales | Domain Adaptation | intuition |
| [packages/content/content/neon-protocol/transfer-learning/05-the-heist.mdx](../../packages/content/content/neon-protocol/transfer-learning/05-the-heist.mdx) | Forking an open-source project | Model Repurposing | intuition |

### nova-canvas — 55 orphans

| Lesson | feTitle | mlTitle | tier |
|---|---|---|---|
| [packages/content/content/nova-canvas/audio-generation/01-audio-as-data.mdx](../../packages/content/content/nova-canvas/audio-generation/01-audio-as-data.mdx) | Web Audio API | Audio Tensor | structural |
| [packages/content/content/nova-canvas/audio-generation/02-audio-synthesis.mdx](../../packages/content/content/nova-canvas/audio-generation/02-audio-synthesis.mdx) | OscillatorNode | Neural Oscillator | structural |
| [packages/content/content/nova-canvas/audio-generation/03-music-generation.mdx](../../packages/content/content/nova-canvas/audio-generation/03-music-generation.mdx) | setTimeout Sequences | Sequence Prediction | structural |
| [packages/content/content/nova-canvas/audio-generation/04-audio-visual-sync.mdx](../../packages/content/content/nova-canvas/audio-generation/04-audio-visual-sync.mdx) | rAF + AudioContext Timing | Synchronized Generation | structural |
| [packages/content/content/nova-canvas/audio-generation/05-interactive-soundscapes.mdx](../../packages/content/content/nova-canvas/audio-generation/05-interactive-soundscapes.mdx) | Pointer Events | Input-Driven Generation | structural |
| [packages/content/content/nova-canvas/capstone/01-final-integration.mdx](../../packages/content/content/nova-canvas/capstone/01-final-integration.mdx) | Monorepo Integration | Multi-Modal Pipeline | structural |
| [packages/content/content/nova-canvas/capstone/02-user-experience-design.mdx](../../packages/content/content/nova-canvas/capstone/02-user-experience-design.mdx) | UX Design Principles | Installation UX | structural |
| [packages/content/content/nova-canvas/capstone/03-load-testing.mdx](../../packages/content/content/nova-canvas/capstone/03-load-testing.mdx) | Artillery / k6 Load Testing | Generation Load Test | structural |
| [packages/content/content/nova-canvas/capstone/04-monitoring-failover.mdx](../../packages/content/content/nova-canvas/capstone/04-monitoring-failover.mdx) | Uptime Monitoring | Model Monitoring | structural |
| [packages/content/content/nova-canvas/capstone/05-opening-night.mdx](../../packages/content/content/nova-canvas/capstone/05-opening-night.mdx) | Production Launch Day | Installation Launch | structural |
| [packages/content/content/nova-canvas/clip-alignment/01-contrastive-learning.mdx](../../packages/content/content/nova-canvas/clip-alignment/01-contrastive-learning.mdx) | A/B testing | Contrastive learning | intuition |
| [packages/content/content/nova-canvas/clip-alignment/02-clip-architecture.mdx](../../packages/content/content/nova-canvas/clip-alignment/02-clip-architecture.mdx) | Algolia multi-index search | CLIP dual encoder | structural |
| [packages/content/content/nova-canvas/clip-alignment/03-zero-shot-classification.mdx](../../packages/content/content/nova-canvas/clip-alignment/03-zero-shot-classification.mdx) | Dynamic routing — handling unknown paths | Zero-shot classification | structural |
| [packages/content/content/nova-canvas/clip-alignment/04-clip-guided-generation.mdx](../../packages/content/content/nova-canvas/clip-alignment/04-clip-guided-generation.mdx) | ESLint — guiding toward patterns | CLIP guidance | structural |
| [packages/content/content/nova-canvas/clip-alignment/05-prompt-engineering-for-images.mdx](../../packages/content/content/nova-canvas/clip-alignment/05-prompt-engineering-for-images.mdx) | Writing effective CSS selectors | Prompt engineering | structural |
| [packages/content/content/nova-canvas/creative-deployment/01-performance-profiling.mdx](../../packages/content/content/nova-canvas/creative-deployment/01-performance-profiling.mdx) | DevTools Performance Panel | Inference Profiling | structural |
| [packages/content/content/nova-canvas/creative-deployment/02-model-optimization.mdx](../../packages/content/content/nova-canvas/creative-deployment/02-model-optimization.mdx) | Webpack Production Build | Model Optimization | structural |
| [packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx](../../packages/content/content/nova-canvas/creative-deployment/03-caching-precomputation.mdx) | Service Worker Cache | Generation Cache | structural |
| [packages/content/content/nova-canvas/creative-deployment/04-concurrent-users.mdx](../../packages/content/content/nova-canvas/creative-deployment/04-concurrent-users.mdx) | WebSocket Connection Pooling | Generation Queue | structural |
| [packages/content/content/nova-canvas/creative-deployment/05-installation-architecture.mdx](../../packages/content/content/nova-canvas/creative-deployment/05-installation-architecture.mdx) | PWA Architecture | Installation Architecture | structural |
| [packages/content/content/nova-canvas/diffusion-models/01-the-diffusion-process.mdx](../../packages/content/content/nova-canvas/diffusion-models/01-the-diffusion-process.mdx) | Progressive image loading (blur-up) | Diffusion denoising steps | intuition |
| [packages/content/content/nova-canvas/diffusion-models/02-noise-schedules.mdx](../../packages/content/content/nova-canvas/diffusion-models/02-noise-schedules.mdx) | Animation easing curves | Noise schedule (beta schedule) | structural |
| [packages/content/content/nova-canvas/diffusion-models/03-unet-for-denoising.mdx](../../packages/content/content/nova-canvas/diffusion-models/03-unet-for-denoising.mdx) | Encoder-decoder layout patterns | U-Net architecture | structural |
| [packages/content/content/nova-canvas/diffusion-models/04-classifier-free-guidance.mdx](../../packages/content/content/nova-canvas/diffusion-models/04-classifier-free-guidance.mdx) | CSS custom property overrides | Classifier-free guidance | structural |
| [packages/content/content/nova-canvas/diffusion-models/05-high-resolution-generation.mdx](../../packages/content/content/nova-canvas/diffusion-models/05-high-resolution-generation.mdx) | srcset and responsive images | Cascaded diffusion (low-res + super-res) | structural |
| [packages/content/content/nova-canvas/generative-adversarial-networks/01-the-gan-game.mdx](../../packages/content/content/nova-canvas/generative-adversarial-networks/01-the-gan-game.mdx) | Fuzzer vs Validator | Generator vs Discriminator | structural |
| [packages/content/content/nova-canvas/generative-adversarial-networks/02-generator-architecture.mdx](../../packages/content/content/nova-canvas/generative-adversarial-networks/02-generator-architecture.mdx) | Template Engine | Generator Network | structural |
| [packages/content/content/nova-canvas/generative-adversarial-networks/03-discriminator-architecture.mdx](../../packages/content/content/nova-canvas/generative-adversarial-networks/03-discriminator-architecture.mdx) | Form Validation | Discriminator Network | structural |
| [packages/content/content/nova-canvas/generative-adversarial-networks/04-training-dynamics.mdx](../../packages/content/content/nova-canvas/generative-adversarial-networks/04-training-dynamics.mdx) | Load Balancing | GAN Training Balance | intuition |
| [packages/content/content/nova-canvas/generative-adversarial-networks/05-mode-collapse-and-fixes.mdx](../../packages/content/content/nova-canvas/generative-adversarial-networks/05-mode-collapse-and-fixes.mdx) | Non-Random Random | Mode Collapse | intuition |
| [packages/content/content/nova-canvas/generative-basics/01-what-is-generative-ai.mdx](../../packages/content/content/nova-canvas/generative-basics/01-what-is-generative-ai.mdx) | Math.random() | Generative Model | intuition |
| [packages/content/content/nova-canvas/generative-basics/02-probability-distributions.mdx](../../packages/content/content/nova-canvas/generative-basics/02-probability-distributions.mdx) | Random Color Generator | Probability Distribution | structural |
| [packages/content/content/nova-canvas/generative-basics/03-sampling.mdx](../../packages/content/content/nova-canvas/generative-basics/03-sampling.mdx) | Seeded Random | Sampling Strategy | structural |
| [packages/content/content/nova-canvas/generative-basics/04-noise-as-input.mdx](../../packages/content/content/nova-canvas/generative-basics/04-noise-as-input.mdx) | Perlin Noise | Latent Noise Vector | structural |
| [packages/content/content/nova-canvas/generative-basics/05-your-first-generator.mdx](../../packages/content/content/nova-canvas/generative-basics/05-your-first-generator.mdx) | Procedural Canvas Drawing | Generator Network | structural |
| [packages/content/content/nova-canvas/latent-spaces/01-what-is-a-latent-space.mdx](../../packages/content/content/nova-canvas/latent-spaces/01-what-is-a-latent-space.mdx) | URL Shortener | Latent Encoding | structural |
| [packages/content/content/nova-canvas/latent-spaces/02-dimensionality.mdx](../../packages/content/content/nova-canvas/latent-spaces/02-dimensionality.mdx) | CSS Custom Properties | Latent Dimensions | structural |
| [packages/content/content/nova-canvas/latent-spaces/03-interpolation.mdx](../../packages/content/content/nova-canvas/latent-spaces/03-interpolation.mdx) | CSS Transitions | Latent Interpolation | structural |
| [packages/content/content/nova-canvas/latent-spaces/04-disentanglement.mdx](../../packages/content/content/nova-canvas/latent-spaces/04-disentanglement.mdx) | Component Props | Disentangled Dimensions | structural |
| [packages/content/content/nova-canvas/latent-spaces/05-latent-space-exploration.mdx](../../packages/content/content/nova-canvas/latent-spaces/05-latent-space-exploration.mdx) | Slider UI with Live Preview | Interactive Latent Explorer | identity |
| [packages/content/content/nova-canvas/multimodal-learning/01-what-is-multimodal.mdx](../../packages/content/content/nova-canvas/multimodal-learning/01-what-is-multimodal.mdx) | Full-stack apps — frontend + backend + database | Multimodal pipeline | intuition |
| [packages/content/content/nova-canvas/multimodal-learning/02-vision-language-models.mdx](../../packages/content/content/nova-canvas/multimodal-learning/02-vision-language-models.mdx) | img alt='...' — text describing images | Vision-language model | intuition |
| [packages/content/content/nova-canvas/multimodal-learning/03-cross-modal-embeddings.mdx](../../packages/content/content/nova-canvas/multimodal-learning/03-cross-modal-embeddings.mdx) | Shared component props across platforms | Cross-modal embedding space | structural |
| [packages/content/content/nova-canvas/multimodal-learning/04-image-captioning.mdx](../../packages/content/content/nova-canvas/multimodal-learning/04-image-captioning.mdx) | Alt-text generation for accessibility | Image captioning pipeline | structural |
| [packages/content/content/nova-canvas/multimodal-learning/05-text-to-image.mdx](../../packages/content/content/nova-canvas/multimodal-learning/05-text-to-image.mdx) | Server-side rendering — text becomes visual | Text-to-image generation | structural |
| [packages/content/content/nova-canvas/style-transfer/01-content-vs-style.mdx](../../packages/content/content/nova-canvas/style-transfer/01-content-vs-style.mdx) | Content vs presentation (HTML vs CSS) | Content vs style representations | intuition |
| [packages/content/content/nova-canvas/style-transfer/02-neural-style-transfer.mdx](../../packages/content/content/nova-canvas/style-transfer/02-neural-style-transfer.mdx) | CSS theme switching | Neural style transfer | structural |
| [packages/content/content/nova-canvas/style-transfer/03-style-representations.mdx](../../packages/content/content/nova-canvas/style-transfer/03-style-representations.mdx) | Design tokens — encoded visual identity | Gram matrix style encoding | structural |
| [packages/content/content/nova-canvas/style-transfer/04-realtime-style-transfer.mdx](../../packages/content/content/nova-canvas/style-transfer/04-realtime-style-transfer.mdx) | CSS filter chains | Feedforward style network | structural |
| [packages/content/content/nova-canvas/style-transfer/05-artistic-control.mdx](../../packages/content/content/nova-canvas/style-transfer/05-artistic-control.mdx) | CSS mix-blend-mode | Style interpolation | structural |
| [packages/content/content/nova-canvas/variational-autoencoders/01-autoencoders-recap.mdx](../../packages/content/content/nova-canvas/variational-autoencoders/01-autoencoders-recap.mdx) | gzip / Brotli Compression | Autoencoder | structural |
| [packages/content/content/nova-canvas/variational-autoencoders/02-the-variational-part.mdx](../../packages/content/content/nova-canvas/variational-autoencoders/02-the-variational-part.mdx) | URL Encoding | Variational Encoding | structural |
| [packages/content/content/nova-canvas/variational-autoencoders/03-reparameterization-trick.mdx](../../packages/content/content/nova-canvas/variational-autoencoders/03-reparameterization-trick.mdx) | Seeded Random | Reparameterization | structural |
| [packages/content/content/nova-canvas/variational-autoencoders/04-kl-divergence.mdx](../../packages/content/content/nova-canvas/variational-autoencoders/04-kl-divergence.mdx) | CSS Specificity Balance | KL Divergence | intuition |
| [packages/content/content/nova-canvas/variational-autoencoders/05-creative-vae.mdx](../../packages/content/content/nova-canvas/variational-autoencoders/05-creative-vae.mdx) | Design System Tokens | VAE Latent Controls | structural |

### shared — 21 orphans

| Lesson | feTitle | mlTitle | tier |
|---|---|---|---|
| [packages/content/content/extras/classical-ml/01-logistic-regression.mdx](../../packages/content/content/extras/classical-ml/01-logistic-regression.mdx) | if/else with confidence | Binary classification | structural |
| [packages/content/content/extras/classical-ml/02-decision-trees.mdx](../../packages/content/content/extras/classical-ml/02-decision-trees.mdx) | Nested if/else | Decision tree | structural |
| [packages/content/content/extras/classical-ml/03-k-nearest-neighbors.mdx](../../packages/content/content/extras/classical-ml/03-k-nearest-neighbors.mdx) | Sort and slice | KNN | structural |
| [packages/content/content/extras/classical-ml/04-ensemble-methods.mdx](../../packages/content/content/extras/classical-ml/04-ensemble-methods.mdx) | Promise.allSettled + vote | Random forest | structural |
| [packages/content/content/extras/classical-ml/05-choosing-your-model.mdx](../../packages/content/content/extras/classical-ml/05-choosing-your-model.mdx) | Choosing npm packages | Model selection | structural |
| [packages/content/content/extras/ethics-responsibility/01-dataset-bias.mdx](../../packages/content/content/extras/ethics-responsibility/01-dataset-bias.mdx) | Browser-Only Testing | Biased Training Data | intuition |
| [packages/content/content/extras/ethics-responsibility/02-fairness-metrics.mdx](../../packages/content/content/extras/ethics-responsibility/02-fairness-metrics.mdx) | Lighthouse Accessibility Score | Fairness Metric | intuition |
| [packages/content/content/extras/ethics-responsibility/03-model-interpretability.mdx](../../packages/content/content/extras/ethics-responsibility/03-model-interpretability.mdx) | Chrome DevTools Performance Tab | Feature Importance (SHAP) | intuition |
| [packages/content/content/extras/ethics-responsibility/04-responsible-deployment.mdx](../../packages/content/content/extras/ethics-responsibility/04-responsible-deployment.mdx) | Accessibility Impact Assessment | Model Impact Assessment | intuition |
| [packages/content/content/extras/ethics-responsibility/05-ethics-capstone.mdx](../../packages/content/content/extras/ethics-responsibility/05-ethics-capstone.mdx) | Pull Request Review Checklist | ML Ethics Checklist | structural |
| [packages/content/content/extras/math-deep-dive/01-tensors-as-linear-algebra.mdx](../../packages/content/content/extras/math-deep-dive/01-tensors-as-linear-algebra.mdx) | CSS Transform | Linear Map | structural |
| [packages/content/content/extras/math-deep-dive/02-calculus-of-neurons.mdx](../../packages/content/content/extras/math-deep-dive/02-calculus-of-neurons.mdx) | requestAnimationFrame | Gradient | structural |
| [packages/content/content/extras/math-deep-dive/03-optimization-landscape.mdx](../../packages/content/content/extras/math-deep-dive/03-optimization-landscape.mdx) | 3D Game Terrain | SGD Momentum | structural |
| [packages/content/content/extras/math-deep-dive/04-convolution-as-matrix.mdx](../../packages/content/content/extras/math-deep-dive/04-convolution-as-matrix.mdx) | CSS Transform Matrix | Toeplitz Matrix | structural |
| [packages/content/content/extras/math-deep-dive/05-information-theory.mdx](../../packages/content/content/extras/math-deep-dive/05-information-theory.mdx) | Gzip Compression | Entropy | structural |
| [packages/content/content/extras/math-deep-dive/06-probability-and-bayes.mdx](../../packages/content/content/extras/math-deep-dive/06-probability-and-bayes.mdx) | State Management | Bayes Update | structural |
| [packages/content/content/extras/python-bridge/01-python-for-js-devs.mdx](../../packages/content/content/extras/python-bridge/01-python-for-js-devs.mdx) | JavaScript Syntax | Python Syntax | structural |
| [packages/content/content/extras/python-bridge/02-numpy-is-typed-arrays.mdx](../../packages/content/content/extras/python-bridge/02-numpy-is-typed-arrays.mdx) | Float32Array + Array methods | NumPy ndarray | structural |
| [packages/content/content/extras/python-bridge/03-pytorch-is-tfjs.mdx](../../packages/content/content/extras/python-bridge/03-pytorch-is-tfjs.mdx) | tf.sequential / tf.model | PyTorch nn.Module | structural |
| [packages/content/content/extras/python-bridge/04-pandas-data-wrangling.mdx](../../packages/content/content/extras/python-bridge/04-pandas-data-wrangling.mdx) | Array of objects + .map/.filter/.reduce | pandas DataFrame | structural |
| [packages/content/content/extras/python-bridge/05-reading-ml-papers.mdx](../../packages/content/content/extras/python-bridge/05-reading-ml-papers.mdx) | Technical blog post with code | ML paper | structural |

### signal-ward — 55 orphans

| Lesson | feTitle | mlTitle | tier |
|---|---|---|---|
| [packages/content/content/signal-ward/attention-mechanisms/01-the-attention-problem.mdx](../../packages/content/content/signal-ward/attention-mechanisms/01-the-attention-problem.mdx) | CSS :focus + tabIndex | Attention Weight | structural |
| [packages/content/content/signal-ward/attention-mechanisms/02-self-attention.mdx](../../packages/content/content/signal-ward/attention-mechanisms/02-self-attention.mdx) | scrollIntoView() | Self-Attention | structural |
| [packages/content/content/signal-ward/attention-mechanisms/03-multi-head-attention.mdx](../../packages/content/content/signal-ward/attention-mechanisms/03-multi-head-attention.mdx) | Multiple Event Listeners | Multiple Attention Heads | structural |
| [packages/content/content/signal-ward/attention-mechanisms/04-attention-visualization.mdx](../../packages/content/content/signal-ward/attention-mechanisms/04-attention-visualization.mdx) | DevTools Element Highlighting | Attention Heatmap | structural |
| [packages/content/content/signal-ward/attention-mechanisms/05-clinical-attention.mdx](../../packages/content/content/signal-ward/attention-mechanisms/05-clinical-attention.mdx) | Search Result Highlighting | Clinical Attention Bias | structural |
| [packages/content/content/signal-ward/capstone/01-system-design.mdx](../../packages/content/content/signal-ward/capstone/01-system-design.mdx) | Microservices Architecture | ML Pipeline Architecture | structural |
| [packages/content/content/signal-ward/capstone/02-hospital-integration.mdx](../../packages/content/content/signal-ward/capstone/02-hospital-integration.mdx) | Third-Party API Integration | EHR Integration | structural |
| [packages/content/content/signal-ward/capstone/03-validation.mdx](../../packages/content/content/signal-ward/capstone/03-validation.mdx) | End-to-End Testing | Clinical Validation | structural |
| [packages/content/content/signal-ward/capstone/04-clinical-documentation.mdx](../../packages/content/content/signal-ward/capstone/04-clinical-documentation.mdx) | API Documentation | Model Card | structural |
| [packages/content/content/signal-ward/capstone/05-launch-day.mdx](../../packages/content/content/signal-ward/capstone/05-launch-day.mdx) | Production Deployment | Clinical Deployment | structural |
| [packages/content/content/signal-ward/ml-through-text/01-the-crisis.mdx](../../packages/content/content/signal-ward/ml-through-text/01-the-crisis.mdx) | App Architecture | ML Pipeline | structural |
| [packages/content/content/signal-ward/ml-through-text/02-text-as-data.mdx](../../packages/content/content/signal-ward/ml-through-text/02-text-as-data.mdx) | JSON.parse() | Bag of Words | structural |
| [packages/content/content/signal-ward/ml-through-text/03-your-first-classifier.mdx](../../packages/content/content/signal-ward/ml-through-text/03-your-first-classifier.mdx) | Array.map() | Linear Classifier | structural |
| [packages/content/content/signal-ward/ml-through-text/04-tokens-and-vocabulary.mdx](../../packages/content/content/signal-ward/ml-through-text/04-tokens-and-vocabulary.mdx) | URL Parsing | Tokenization | structural |
| [packages/content/content/signal-ward/ml-through-text/05-forward-pass.mdx](../../packages/content/content/signal-ward/ml-through-text/05-forward-pass.mdx) | Promise Chain | Forward Pass | structural |
| [packages/content/content/signal-ward/named-entity-recognition/01-what-is-ner.mdx](../../packages/content/content/signal-ward/named-entity-recognition/01-what-is-ner.mdx) | document.querySelectorAll() | Named Entity Recognition | structural |
| [packages/content/content/signal-ward/named-entity-recognition/02-bio-tagging.mdx](../../packages/content/content/signal-ward/named-entity-recognition/02-bio-tagging.mdx) | HTML Opening/Closing Tags | BIO Tags | structural |
| [packages/content/content/signal-ward/named-entity-recognition/03-medical-entities.mdx](../../packages/content/content/signal-ward/named-entity-recognition/03-medical-entities.mdx) | TypeScript Union Types | Medical Entity Types | structural |
| [packages/content/content/signal-ward/named-entity-recognition/04-sequence-labeling.mdx](../../packages/content/content/signal-ward/named-entity-recognition/04-sequence-labeling.mdx) | CSS Class Assignment Per Element | Token Classification | structural |
| [packages/content/content/signal-ward/named-entity-recognition/05-the-interaction.mdx](../../packages/content/content/signal-ward/named-entity-recognition/05-the-interaction.mdx) | Dependency Resolution in package.json | Drug Interaction Detection | structural |
| [packages/content/content/signal-ward/production-privacy/01-production-apis.mdx](../../packages/content/content/signal-ward/production-privacy/01-production-apis.mdx) | REST API with SLA | ML API with SLA | identity |
| [packages/content/content/signal-ward/production-privacy/02-privacy-and-hipaa.mdx](../../packages/content/content/signal-ward/production-privacy/02-privacy-and-hipaa.mdx) | GDPR Cookie Consent | HIPAA Compliance | structural |
| [packages/content/content/signal-ward/production-privacy/03-bias-auditing.mdx](../../packages/content/content/signal-ward/production-privacy/03-bias-auditing.mdx) | Accessibility Audit (Lighthouse) | Bias Audit (Fairness) | structural |
| [packages/content/content/signal-ward/production-privacy/04-human-in-the-loop.mdx](../../packages/content/content/signal-ward/production-privacy/04-human-in-the-loop.mdx) | Code Review (PR Workflow) | Human-in-the-Loop | structural |
| [packages/content/content/signal-ward/production-privacy/05-the-disparity.mdx](../../packages/content/content/signal-ward/production-privacy/05-the-disparity.mdx) | Browser Compatibility Gaps | Performance Disparity | structural |
| [packages/content/content/signal-ward/question-answering-rag/01-extractive-qa.mdx](../../packages/content/content/signal-ward/question-answering-rag/01-extractive-qa.mdx) | Ctrl+F (text search) | Extractive QA | structural |
| [packages/content/content/signal-ward/question-answering-rag/02-reading-comprehension.mdx](../../packages/content/content/signal-ward/question-answering-rag/02-reading-comprehension.mdx) | GraphQL Resolver | Reading Comprehension | structural |
| [packages/content/content/signal-ward/question-answering-rag/03-rag-architecture.mdx](../../packages/content/content/signal-ward/question-answering-rag/03-rag-architecture.mdx) | React Server Components | RAG Pipeline | structural |
| [packages/content/content/signal-ward/question-answering-rag/04-knowledge-grounding.mdx](../../packages/content/content/signal-ward/question-answering-rag/04-knowledge-grounding.mdx) | Hyperlinks | Grounded Answer | structural |
| [packages/content/content/signal-ward/question-answering-rag/05-clinical-queries.mdx](../../packages/content/content/signal-ward/question-answering-rag/05-clinical-queries.mdx) | Search Bar with NLU | Clinical Query Parser | structural |
| [packages/content/content/signal-ward/sequence-models/01-why-order-matters.mdx](../../packages/content/content/signal-ward/sequence-models/01-why-order-matters.mdx) | Execution Order in Async Code | Token Order in Sequences | structural |
| [packages/content/content/signal-ward/sequence-models/02-simple-rnns.mdx](../../packages/content/content/signal-ward/sequence-models/02-simple-rnns.mdx) | Array.reduce() | RNN Step | structural |
| [packages/content/content/signal-ward/sequence-models/03-vanishing-gradients.mdx](../../packages/content/content/signal-ward/sequence-models/03-vanishing-gradients.mdx) | Event Bubbling Fades in Deep DOM | Gradient Vanishes Over Time | structural |
| [packages/content/content/signal-ward/sequence-models/04-lstm-gru.mdx](../../packages/content/content/signal-ward/sequence-models/04-lstm-gru.mdx) | React useMemo / useCallback | LSTM Gates | structural |
| [packages/content/content/signal-ward/sequence-models/05-bidirectional-models.mdx](../../packages/content/content/signal-ward/sequence-models/05-bidirectional-models.mdx) | reduce() + reduceRight() | Bidirectional RNN | structural |
| [packages/content/content/signal-ward/text-classification/01-binary-classification.mdx](../../packages/content/content/signal-ward/text-classification/01-binary-classification.mdx) | Form Validation (if/else with confidence) | Binary Classifier | structural |
| [packages/content/content/signal-ward/text-classification/02-multi-class.mdx](../../packages/content/content/signal-ward/text-classification/02-multi-class.mdx) | Express Router (switch/case routing) | Multi-Class Classifier | structural |
| [packages/content/content/signal-ward/text-classification/03-multi-label.mdx](../../packages/content/content/signal-ward/text-classification/03-multi-label.mdx) | Checkbox Groups (multiple selections) | Multi-Label Classifier | structural |
| [packages/content/content/signal-ward/text-classification/04-confidence-calibration.mdx](../../packages/content/content/signal-ward/text-classification/04-confidence-calibration.mdx) | TypeScript Strict Mode (flagging uncertainty) | Model Calibration | structural |
| [packages/content/content/signal-ward/text-classification/05-triage-system.mdx](../../packages/content/content/signal-ward/text-classification/05-triage-system.mdx) | Priority Queue (urgent items first) | Triage Pipeline | structural |
| [packages/content/content/signal-ward/tokenization-preprocessing/01-word-tokenization.mdx](../../packages/content/content/signal-ward/tokenization-preprocessing/01-word-tokenization.mdx) | String.split() | Word Tokenizer | structural |
| [packages/content/content/signal-ward/tokenization-preprocessing/02-subword-tokenization.mdx](../../packages/content/content/signal-ward/tokenization-preprocessing/02-subword-tokenization.mdx) | Route Parsing | Subword Tokenizer | structural |
| [packages/content/content/signal-ward/tokenization-preprocessing/03-medical-tokenization.mdx](../../packages/content/content/signal-ward/tokenization-preprocessing/03-medical-tokenization.mdx) | Domain Parsing Rules | Medical Normalization | structural |
| [packages/content/content/signal-ward/tokenization-preprocessing/04-text-cleaning.mdx](../../packages/content/content/signal-ward/tokenization-preprocessing/04-text-cleaning.mdx) | Input Sanitization | Text Normalization | structural |
| [packages/content/content/signal-ward/tokenization-preprocessing/05-preprocessing-pipelines.mdx](../../packages/content/content/signal-ward/tokenization-preprocessing/05-preprocessing-pipelines.mdx) | Express Middleware | Text Pipeline | structural |
| [packages/content/content/signal-ward/transformers-bert/01-from-rnn-to-transformer.mdx](../../packages/content/content/signal-ward/transformers-bert/01-from-rnn-to-transformer.mdx) | Class Components to Hooks | RNN to Transformer | structural |
| [packages/content/content/signal-ward/transformers-bert/02-transformer-architecture.mdx](../../packages/content/content/signal-ward/transformers-bert/02-transformer-architecture.mdx) | React Virtual DOM | Residual Connections | structural |
| [packages/content/content/signal-ward/transformers-bert/03-bert-pretraining.mdx](../../packages/content/content/signal-ward/transformers-bert/03-bert-pretraining.mdx) | MLM → VS Code IntelliSense | Masked Language Modeling | structural |
| [packages/content/content/signal-ward/transformers-bert/04-fine-tuning-bert.mdx](../../packages/content/content/signal-ward/transformers-bert/04-fine-tuning-bert.mdx) | Extending a Base Class | Fine-Tuning BERT | structural |
| [packages/content/content/signal-ward/transformers-bert/05-medis-mistake.mdx](../../packages/content/content/signal-ward/transformers-bert/05-medis-mistake.mdx) | Stale Cache Serving Wrong Data | Model Hallucination | structural |
| [packages/content/content/signal-ward/word-embeddings/01-one-hot-encoding.mdx](../../packages/content/content/signal-ward/word-embeddings/01-one-hot-encoding.mdx) | Enum Values | One-Hot Vector | structural |
| [packages/content/content/signal-ward/word-embeddings/02-dense-vectors.mdx](../../packages/content/content/signal-ward/word-embeddings/02-dense-vectors.mdx) | CSS Color Space | Word Embedding Space | intuition |
| [packages/content/content/signal-ward/word-embeddings/03-medical-embeddings.mdx](../../packages/content/content/signal-ward/word-embeddings/03-medical-embeddings.mdx) | Scoped CSS Variables | Domain Embeddings | structural |
| [packages/content/content/signal-ward/word-embeddings/04-similarity-and-analogy.mdx](../../packages/content/content/signal-ward/word-embeddings/04-similarity-and-analogy.mdx) | String Similarity | Vector Similarity | intuition |
| [packages/content/content/signal-ward/word-embeddings/05-embedding-layers.mdx](../../packages/content/content/signal-ward/word-embeddings/05-embedding-layers.mdx) | Lookup Table / Map | Embedding Layer | structural |

### terra-grid — 55 orphans

| Lesson | feTitle | mlTitle | tier |
|---|---|---|---|
| [packages/content/content/terra-grid/ab-testing/01-why-ab-test-models.mdx](../../packages/content/content/terra-grid/ab-testing/01-why-ab-test-models.mdx) | Feature Flags | Model Flags | identity |
| [packages/content/content/terra-grid/ab-testing/02-traffic-splitting.mdx](../../packages/content/content/terra-grid/ab-testing/02-traffic-splitting.mdx) | Canary Deployments | Model Traffic Split | structural |
| [packages/content/content/terra-grid/ab-testing/03-statistical-significance.mdx](../../packages/content/content/terra-grid/ab-testing/03-statistical-significance.mdx) | Analytics Confidence | Model Comparison | identity |
| [packages/content/content/terra-grid/ab-testing/04-canary-deployments.mdx](../../packages/content/content/terra-grid/ab-testing/04-canary-deployments.mdx) | Canary Releases | Model Canary | identity |
| [packages/content/content/terra-grid/ab-testing/05-multi-armed-bandits.mdx](../../packages/content/content/terra-grid/ab-testing/05-multi-armed-bandits.mdx) | Dynamic Ad Rotation | Adaptive Model Selection | structural |
| [packages/content/content/terra-grid/capstone/01-system-architecture-review.mdx](../../packages/content/content/terra-grid/capstone/01-system-architecture-review.mdx) | Architecture Decision Records | ML Architecture Records | structural |
| [packages/content/content/terra-grid/capstone/02-security-hardening.mdx](../../packages/content/content/terra-grid/capstone/02-security-hardening.mdx) | OWASP Security Checklist | ML Security Checklist | structural |
| [packages/content/content/terra-grid/capstone/03-disaster-recovery.mdx](../../packages/content/content/terra-grid/capstone/03-disaster-recovery.mdx) | Backup & Restore | Model Recovery | structural |
| [packages/content/content/terra-grid/capstone/04-documentation-runbooks.mdx](../../packages/content/content/terra-grid/capstone/04-documentation-runbooks.mdx) | Runbook Creation | ML Runbook | structural |
| [packages/content/content/terra-grid/capstone/05-global-launch.mdx](../../packages/content/content/terra-grid/capstone/05-global-launch.mdx) | Production Launch | ML Production Launch | structural |
| [packages/content/content/terra-grid/edge-ai-basics/01-welcome-to-the-grid.mdx](../../packages/content/content/terra-grid/edge-ai-basics/01-welcome-to-the-grid.mdx) | CDN Edge Location | Edge Inference | structural |
| [packages/content/content/terra-grid/edge-ai-basics/02-why-the-edge.mdx](../../packages/content/content/terra-grid/edge-ai-basics/02-why-the-edge.mdx) | Offline-First PWA | Offline Edge Model | structural |
| [packages/content/content/terra-grid/edge-ai-basics/03-edge-devices.mdx](../../packages/content/content/terra-grid/edge-ai-basics/03-edge-devices.mdx) | Device Testing Matrix | Edge Device Specs | structural |
| [packages/content/content/terra-grid/edge-ai-basics/04-your-first-edge-model.mdx](../../packages/content/content/terra-grid/edge-ai-basics/04-your-first-edge-model.mdx) | Client-Side Validation | Anomaly Detection | structural |
| [packages/content/content/terra-grid/edge-ai-basics/05-edge-vs-cloud-tradeoffs.mdx](../../packages/content/content/terra-grid/edge-ai-basics/05-edge-vs-cloud-tradeoffs.mdx) | CSR vs SSR | Edge vs Cloud | structural |
| [packages/content/content/terra-grid/edge-deployment/01-deployment-targets.mdx](../../packages/content/content/terra-grid/edge-deployment/01-deployment-targets.mdx) | Cross-Browser Testing | Edge Hardware Detection | structural |
| [packages/content/content/terra-grid/edge-deployment/02-model-packaging.mdx](../../packages/content/content/terra-grid/edge-deployment/02-model-packaging.mdx) | npm pack | Model Package | structural |
| [packages/content/content/terra-grid/edge-deployment/03-runtime-environments.mdx](../../packages/content/content/terra-grid/edge-deployment/03-runtime-environments.mdx) | Browser Engines | ML Runtimes | structural |
| [packages/content/content/terra-grid/edge-deployment/04-over-the-air-updates.mdx](../../packages/content/content/terra-grid/edge-deployment/04-over-the-air-updates.mdx) | Service Worker Update | OTA Model Update | structural |
| [packages/content/content/terra-grid/edge-deployment/05-offline-operation.mdx](../../packages/content/content/terra-grid/edge-deployment/05-offline-operation.mdx) | IndexedDB + Service Worker | Offline Model Cache | structural |
| [packages/content/content/terra-grid/federated-learning/01-data-silo-problem.mdx](../../packages/content/content/terra-grid/federated-learning/01-data-silo-problem.mdx) | CORS Boundaries | Data Silos | structural |
| [packages/content/content/terra-grid/federated-learning/02-federated-averaging.mdx](../../packages/content/content/terra-grid/federated-learning/02-federated-averaging.mdx) | State Sync Across Tabs | Federated Averaging | structural |
| [packages/content/content/terra-grid/federated-learning/03-privacy-preservation.mdx](../../packages/content/content/terra-grid/federated-learning/03-privacy-preservation.mdx) | Cookie Isolation | Differential Privacy | structural |
| [packages/content/content/terra-grid/federated-learning/04-communication-efficiency.mdx](../../packages/content/content/terra-grid/federated-learning/04-communication-efficiency.mdx) | GraphQL Selective Queries | Gradient Compression | structural |
| [packages/content/content/terra-grid/federated-learning/05-secure-aggregation.mdx](../../packages/content/content/terra-grid/federated-learning/05-secure-aggregation.mdx) | End-to-End Encryption | Secure Aggregation | structural |
| [packages/content/content/terra-grid/mlops-pipelines/01-ml-pipeline-anatomy.mdx](../../packages/content/content/terra-grid/mlops-pipelines/01-ml-pipeline-anatomy.mdx) | CI/CD Pipeline | ML Pipeline | structural |
| [packages/content/content/terra-grid/mlops-pipelines/02-data-versioning.mdx](../../packages/content/content/terra-grid/mlops-pipelines/02-data-versioning.mdx) | Git Version Control | Data Versioning | structural |
| [packages/content/content/terra-grid/mlops-pipelines/03-experiment-tracking.mdx](../../packages/content/content/terra-grid/mlops-pipelines/03-experiment-tracking.mdx) | Test Result Dashboard | Experiment Log | structural |
| [packages/content/content/terra-grid/mlops-pipelines/04-model-registry.mdx](../../packages/content/content/terra-grid/mlops-pipelines/04-model-registry.mdx) | npm Registry | Model Registry | structural |
| [packages/content/content/terra-grid/mlops-pipelines/05-automated-retraining.mdx](../../packages/content/content/terra-grid/mlops-pipelines/05-automated-retraining.mdx) | GitHub Actions | Retraining Trigger | structural |
| [packages/content/content/terra-grid/monitoring-drift/01-production-monitoring.mdx](../../packages/content/content/terra-grid/monitoring-drift/01-production-monitoring.mdx) | App Monitoring (Sentry) | Model Monitoring | structural |
| [packages/content/content/terra-grid/monitoring-drift/02-data-drift.mdx](../../packages/content/content/terra-grid/monitoring-drift/02-data-drift.mdx) | Lighthouse CI Regression | Data Drift Detection | structural |
| [packages/content/content/terra-grid/monitoring-drift/03-model-drift.mdx](../../packages/content/content/terra-grid/monitoring-drift/03-model-drift.mdx) | Visual Regression Testing | Model Drift Detection | structural |
| [packages/content/content/terra-grid/monitoring-drift/04-alert-systems.mdx](../../packages/content/content/terra-grid/monitoring-drift/04-alert-systems.mdx) | Monitoring Thresholds | Drift Alert Thresholds | identity |
| [packages/content/content/terra-grid/monitoring-drift/05-drift-response.mdx](../../packages/content/content/terra-grid/monitoring-drift/05-drift-response.mdx) | Incident Response | Drift Response | structural |
| [packages/content/content/terra-grid/optimization-fundamentals/01-model-profiling.mdx](../../packages/content/content/terra-grid/optimization-fundamentals/01-model-profiling.mdx) | Bundle Analyzer | Model Profiler | structural |
| [packages/content/content/terra-grid/optimization-fundamentals/02-architecture-efficiency.mdx](../../packages/content/content/terra-grid/optimization-fundamentals/02-architecture-efficiency.mdx) | Avoiding Re-renders | Efficient Layers | structural |
| [packages/content/content/terra-grid/optimization-fundamentals/03-computational-budgets.mdx](../../packages/content/content/terra-grid/optimization-fundamentals/03-computational-budgets.mdx) | Lighthouse Budget | Model Budget | structural |
| [packages/content/content/terra-grid/optimization-fundamentals/04-benchmarking.mdx](../../packages/content/content/terra-grid/optimization-fundamentals/04-benchmarking.mdx) | Performance API | Model Benchmark | identity |
| [packages/content/content/terra-grid/optimization-fundamentals/05-optimization-strategy.mdx](../../packages/content/content/terra-grid/optimization-fundamentals/05-optimization-strategy.mdx) | Build Optimization Checklist | Model Optimization Checklist | structural |
| [packages/content/content/terra-grid/pruning-distillation/01-weight-pruning.mdx](../../packages/content/content/terra-grid/pruning-distillation/01-weight-pruning.mdx) | Tree-Shaking | Weight Pruning | structural |
| [packages/content/content/terra-grid/pruning-distillation/02-structured-pruning.mdx](../../packages/content/content/terra-grid/pruning-distillation/02-structured-pruning.mdx) | Dead Code Elimination | Structured Pruning | structural |
| [packages/content/content/terra-grid/pruning-distillation/03-knowledge-distillation.mdx](../../packages/content/content/terra-grid/pruning-distillation/03-knowledge-distillation.mdx) | Code Splitting | Knowledge Distillation | structural |
| [packages/content/content/terra-grid/pruning-distillation/04-teacher-student-training.mdx](../../packages/content/content/terra-grid/pruning-distillation/04-teacher-student-training.mdx) | Mentor Pair Programming | Teacher-Student Training | intuition |
| [packages/content/content/terra-grid/pruning-distillation/05-combined-optimization.mdx](../../packages/content/content/terra-grid/pruning-distillation/05-combined-optimization.mdx) | Full Webpack Production Config | Full Model Optimization | structural |
| [packages/content/content/terra-grid/quantization/01-number-formats.mdx](../../packages/content/content/terra-grid/quantization/01-number-formats.mdx) | Image Formats | Number Formats | structural |
| [packages/content/content/terra-grid/quantization/02-post-training-quantization.mdx](../../packages/content/content/terra-grid/quantization/02-post-training-quantization.mdx) | Webpack Minification | Post-Training Quantization | structural |
| [packages/content/content/terra-grid/quantization/03-quantization-aware-training.mdx](../../packages/content/content/terra-grid/quantization/03-quantization-aware-training.mdx) | Mobile-First Development | Quantization-Aware Training | structural |
| [packages/content/content/terra-grid/quantization/04-mixed-precision.mdx](../../packages/content/content/terra-grid/quantization/04-mixed-precision.mdx) | Responsive Images | Mixed Precision | structural |
| [packages/content/content/terra-grid/quantization/05-accuracy-vs-size.mdx](../../packages/content/content/terra-grid/quantization/05-accuracy-vs-size.mdx) | Lossy Compression | Quantization Quality | structural |
| [packages/content/content/terra-grid/scale-reliability/01-scaling-strategies.mdx](../../packages/content/content/terra-grid/scale-reliability/01-scaling-strategies.mdx) | Auto-Scaling Servers | Auto-Scaling Inference | identity |
| [packages/content/content/terra-grid/scale-reliability/02-model-sharding.mdx](../../packages/content/content/terra-grid/scale-reliability/02-model-sharding.mdx) | Dynamic Imports | Model Sharding | structural |
| [packages/content/content/terra-grid/scale-reliability/03-failover-redundancy.mdx](../../packages/content/content/terra-grid/scale-reliability/03-failover-redundancy.mdx) | Error Boundaries | Model Failover | structural |
| [packages/content/content/terra-grid/scale-reliability/04-load-management.mdx](../../packages/content/content/terra-grid/scale-reliability/04-load-management.mdx) | Rate Limiting | Inference Throttling | identity |
| [packages/content/content/terra-grid/scale-reliability/05-global-operations.mdx](../../packages/content/content/terra-grid/scale-reliability/05-global-operations.mdx) | CDN Multi-Region | Model Multi-Region | structural |


## Identity-tier sanity check — 15 bridges claim literal equivalence

Identity tier means the FE concept **literally is** the ML concept (e.g. `Math.max(0,x) === ReLU`). Each entry below should pass: "swap the names and the code is identical". Manual review recommended for any where the codes are NOT trivially interchangeable.

| Lesson | feTitle | mlTitle | matched canonical |
|---|---|---|---|
| [packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx](../../packages/content/content/deep-orbit/browser-runtimes/02-tensorflow-js-setup.mdx) | npm install | TF.js Install | ORPHAN |
| [packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx](../../packages/content/content/deep-orbit/neural-networks/02-activation-functions.mdx) | Math.max(0, x) | ReLU Activation | #14 |
| [packages/content/content/neon-protocol/deployment/03-inference-api.mdx](../../packages/content/content/neon-protocol/deployment/03-inference-api.mdx) | REST API Endpoint | Inference Endpoint | ORPHAN |
| [packages/content/content/neon-protocol/ml-through-vision/05-your-first-classifier.mdx](../../packages/content/content/neon-protocol/ml-through-vision/05-your-first-classifier.mdx) | if/else Logic | Threshold Classifier | ORPHAN |
| [packages/content/content/neon-protocol/object-detection/01-bounding-boxes.mdx](../../packages/content/content/neon-protocol/object-detection/01-bounding-boxes.mdx) | getBoundingClientRect() | Bounding Box | #29 |
| [packages/content/content/neon-protocol/real-time-detection/02-frame-by-frame-inference.mdx](../../packages/content/content/neon-protocol/real-time-detection/02-frame-by-frame-inference.mdx) | requestAnimationFrame() Render Loop | Inference Loop | ORPHAN |
| [packages/content/content/nova-canvas/latent-spaces/05-latent-space-exploration.mdx](../../packages/content/content/nova-canvas/latent-spaces/05-latent-space-exploration.mdx) | Slider UI with Live Preview | Interactive Latent Explorer | ORPHAN |
| [packages/content/content/signal-ward/production-privacy/01-production-apis.mdx](../../packages/content/content/signal-ward/production-privacy/01-production-apis.mdx) | REST API with SLA | ML API with SLA | ORPHAN |
| [packages/content/content/terra-grid/ab-testing/01-why-ab-test-models.mdx](../../packages/content/content/terra-grid/ab-testing/01-why-ab-test-models.mdx) | Feature Flags | Model Flags | ORPHAN |
| [packages/content/content/terra-grid/ab-testing/03-statistical-significance.mdx](../../packages/content/content/terra-grid/ab-testing/03-statistical-significance.mdx) | Analytics Confidence | Model Comparison | ORPHAN |
| [packages/content/content/terra-grid/ab-testing/04-canary-deployments.mdx](../../packages/content/content/terra-grid/ab-testing/04-canary-deployments.mdx) | Canary Releases | Model Canary | ORPHAN |
| [packages/content/content/terra-grid/monitoring-drift/04-alert-systems.mdx](../../packages/content/content/terra-grid/monitoring-drift/04-alert-systems.mdx) | Monitoring Thresholds | Drift Alert Thresholds | ORPHAN |
| [packages/content/content/terra-grid/optimization-fundamentals/04-benchmarking.mdx](../../packages/content/content/terra-grid/optimization-fundamentals/04-benchmarking.mdx) | Performance API | Model Benchmark | ORPHAN |
| [packages/content/content/terra-grid/scale-reliability/01-scaling-strategies.mdx](../../packages/content/content/terra-grid/scale-reliability/01-scaling-strategies.mdx) | Auto-Scaling Servers | Auto-Scaling Inference | ORPHAN |
| [packages/content/content/terra-grid/scale-reliability/04-load-management.mdx](../../packages/content/content/terra-grid/scale-reliability/04-load-management.mdx) | Rate Limiting | Inference Throttling | ORPHAN |

## Suspect structural bridges (heuristic)

Heuristic: tier=`structural` AND zero shared significant words between `feTitle` and `mlTitle`. These have the largest surface gap → highest risk that learners memorize the analogy instead of the ML concept. Highest-priority candidates for the `breaks:` field (Deliverable C).

Total suspects: **189** of 249 structural bridges (75.9%).

| Lesson | feTitle | mlTitle | matched |
|---|---|---|---|
| [packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx](../../packages/content/content/deep-orbit/advanced-time-series/04-kalman-filters.mdx) | Exponential Moving Average | Kalman Update | ORPHAN |
| [packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx](../../packages/content/content/deep-orbit/advanced-time-series/05-ensemble-methods.mdx) | Micro-Frontends | Model Ensemble | ORPHAN |
| [packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx](../../packages/content/content/deep-orbit/anomaly-detection/01-normal-vs-anomalous.mdx) | Performance Baseline | Anomaly Threshold | ORPHAN |
| [packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx](../../packages/content/content/deep-orbit/anomaly-detection/02-autoencoders.mdx) | Compression | Autoencoder | ORPHAN |
| [packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx](../../packages/content/content/deep-orbit/anomaly-detection/04-threshold-tuning.mdx) | Alert Thresholds | Anomaly Threshold | ORPHAN |
| [packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx](../../packages/content/content/deep-orbit/browser-runtimes/03-model-loading.mdx) | fetch() → JSON | Model Loading | ORPHAN |
| [packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx](../../packages/content/content/deep-orbit/browser-runtimes/04-inference-pipeline.mdx) | Event → Process → Render | Input → Predict → Display | ORPHAN |
| [packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx](../../packages/content/content/deep-orbit/browser-runtimes/06-transformers-js.mdx) | npm install component-library | Transformers.js pipeline | ORPHAN |
| [packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx](../../packages/content/content/deep-orbit/capstone/02-ci-cd-pipeline.mdx) | GitHub Actions CI | ML CI/CD | ORPHAN |
| [packages/content/content/deep-orbit/capstone/04-documentation.mdx](../../packages/content/content/deep-orbit/capstone/04-documentation.mdx) | README + JSDoc | Model Card | ORPHAN |
| [packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx) | TypedArray | Tensor | ORPHAN |
| [packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx](../../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx) | Array.length | Tensor.shape | ORPHAN |
| [packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx](../../packages/content/content/deep-orbit/foundations/03-tensor-operations.mdx) | Array.map() | tf.add() | ORPHAN |
| [packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx](../../packages/content/content/deep-orbit/llm-integration/01-llms-for-science.mdx) | AI Code Completion | LLM Analysis | ORPHAN |
| [packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx](../../packages/content/content/deep-orbit/llm-integration/02-prompt-engineering.mdx) | Search Queries | Prompt Design | ORPHAN |
| [packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx](../../packages/content/content/deep-orbit/llm-integration/03-rag-for-signals.mdx) | Server Components | RAG Pipeline | ORPHAN |
| [packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx](../../packages/content/content/deep-orbit/llm-integration/04-report-generation.mdx) | Template Rendering | Report Generation | ORPHAN |
| [packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx](../../packages/content/content/deep-orbit/llm-integration/05-multi-model-systems.mdx) | Micro-Services | Model Orchestration | ORPHAN |
| [packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx](../../packages/content/content/deep-orbit/neural-networks/01-first-neuron.mdx) | Array.reduce() | Neuron | ORPHAN |
| [packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx](../../packages/content/content/deep-orbit/neural-networks/05-building-a-network.mdx) | App Assembly | Model Compilation | ORPHAN |
| [packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx](../../packages/content/content/deep-orbit/optimization-edge/01-model-profiling.mdx) | DevTools Performance | Model Profiling | ORPHAN |
| [packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx](../../packages/content/content/deep-orbit/optimization-edge/02-quantization.mdx) | Image Compression | Quantization | ORPHAN |
| [packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx](../../packages/content/content/deep-orbit/optimization-edge/03-pruning.mdx) | Tree-Shaking | Pruning | ORPHAN |
| [packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx](../../packages/content/content/deep-orbit/optimization-edge/05-webgpu-acceleration.mdx) | Canvas WebGL | WebGPU Compute | ORPHAN |
| [packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx](../../packages/content/content/deep-orbit/recurrent-networks/01-sequences-matter.mdx) | React List Keys | Sequence Order | ORPHAN |
| [packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx](../../packages/content/content/deep-orbit/recurrent-networks/02-simple-rnns.mdx) | useReducer | RNN Cell | ORPHAN |
| [packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx](../../packages/content/content/deep-orbit/recurrent-networks/03-lstm-gates.mdx) | localStorage with TTL | LSTM Forget Gate | ORPHAN |
| [packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx](../../packages/content/content/deep-orbit/recurrent-networks/04-sliding-windows.mdx) | IntersectionObserver | Sliding Window | ORPHAN |
| [packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx](../../packages/content/content/deep-orbit/recurrent-networks/05-sequence-prediction.mdx) | Autocomplete | Sequence Forecast | ORPHAN |
| [packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx](../../packages/content/content/deep-orbit/signal-processing/04-fft-as-features.mdx) | Derived State | Feature Engineering | ORPHAN |
| [packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx](../../packages/content/content/deep-orbit/signal-processing/05-windowing-and-overlap.mdx) | Virtual Scrolling | Windowing | ORPHAN |
| [packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx](../../packages/content/content/deep-orbit/training-loop/01-loss-functions.mdx) | expect().toBe() | Loss Function | ORPHAN |
| [packages/content/content/deep-orbit/training-loop/04-training-loop.mdx](../../packages/content/content/deep-orbit/training-loop/04-training-loop.mdx) | requestAnimationFrame | Training Loop | ORPHAN |
| [packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx](../../packages/content/content/deep-orbit/training-loop/05-evaluating-deep-scan.mdx) | E2E Tests | Model Evaluation | ORPHAN |
| [packages/content/content/extras/classical-ml/01-logistic-regression.mdx](../../packages/content/content/extras/classical-ml/01-logistic-regression.mdx) | if/else with confidence | Binary classification | ORPHAN |
| [packages/content/content/extras/classical-ml/02-decision-trees.mdx](../../packages/content/content/extras/classical-ml/02-decision-trees.mdx) | Nested if/else | Decision tree | ORPHAN |
| [packages/content/content/extras/classical-ml/03-k-nearest-neighbors.mdx](../../packages/content/content/extras/classical-ml/03-k-nearest-neighbors.mdx) | Sort and slice | KNN | ORPHAN |
| [packages/content/content/extras/classical-ml/04-ensemble-methods.mdx](../../packages/content/content/extras/classical-ml/04-ensemble-methods.mdx) | Promise.allSettled + vote | Random forest | ORPHAN |
| [packages/content/content/extras/classical-ml/05-choosing-your-model.mdx](../../packages/content/content/extras/classical-ml/05-choosing-your-model.mdx) | Choosing npm packages | Model selection | ORPHAN |
| [packages/content/content/extras/math-deep-dive/01-tensors-as-linear-algebra.mdx](../../packages/content/content/extras/math-deep-dive/01-tensors-as-linear-algebra.mdx) | CSS Transform | Linear Map | ORPHAN |
| [packages/content/content/extras/math-deep-dive/02-calculus-of-neurons.mdx](../../packages/content/content/extras/math-deep-dive/02-calculus-of-neurons.mdx) | requestAnimationFrame | Gradient | ORPHAN |
| [packages/content/content/extras/math-deep-dive/03-optimization-landscape.mdx](../../packages/content/content/extras/math-deep-dive/03-optimization-landscape.mdx) | 3D Game Terrain | SGD Momentum | ORPHAN |
| [packages/content/content/extras/math-deep-dive/05-information-theory.mdx](../../packages/content/content/extras/math-deep-dive/05-information-theory.mdx) | Gzip Compression | Entropy | ORPHAN |
| [packages/content/content/extras/math-deep-dive/06-probability-and-bayes.mdx](../../packages/content/content/extras/math-deep-dive/06-probability-and-bayes.mdx) | State Management | Bayes Update | ORPHAN |
| [packages/content/content/extras/python-bridge/02-numpy-is-typed-arrays.mdx](../../packages/content/content/extras/python-bridge/02-numpy-is-typed-arrays.mdx) | Float32Array + Array methods | NumPy ndarray | ORPHAN |
| [packages/content/content/extras/python-bridge/03-pytorch-is-tfjs.mdx](../../packages/content/content/extras/python-bridge/03-pytorch-is-tfjs.mdx) | tf.sequential / tf.model | PyTorch nn.Module | ORPHAN |
| [packages/content/content/extras/python-bridge/04-pandas-data-wrangling.mdx](../../packages/content/content/extras/python-bridge/04-pandas-data-wrangling.mdx) | Array of objects + .map/.filter/.reduce | pandas DataFrame | ORPHAN |
| [packages/content/content/extras/python-bridge/05-reading-ml-papers.mdx](../../packages/content/content/extras/python-bridge/05-reading-ml-papers.mdx) | Technical blog post with code | ML paper | ORPHAN |
| [packages/content/content/neon-protocol/capstone/02-integration.mdx](../../packages/content/content/neon-protocol/capstone/02-integration.mdx) | Middleware Chain | Model Pipeline | ORPHAN |
| [packages/content/content/neon-protocol/capstone/04-documentation.mdx](../../packages/content/content/neon-protocol/capstone/04-documentation.mdx) | README.md + API Docs | Model Card | ORPHAN |
| [packages/content/content/neon-protocol/convolutional-neural-networks/01-convolution-operations.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/01-convolution-operations.mdx) | CSS filter: blur() | Convolution Operation | ORPHAN |
| [packages/content/content/neon-protocol/convolutional-neural-networks/02-pooling-layers.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/02-pooling-layers.mdx) | srcset Responsive Images | Max Pooling | ORPHAN |
| [packages/content/content/neon-protocol/convolutional-neural-networks/03-cnn-architecture.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/03-cnn-architecture.mdx) | Component Composition | CNN Layer Stack | ORPHAN |
| [packages/content/content/neon-protocol/convolutional-neural-networks/04-training-a-cnn.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/04-training-a-cnn.mdx) | Build Pipeline Execution | Training Loop | ORPHAN |
| [packages/content/content/neon-protocol/convolutional-neural-networks/05-visualizing-features.mdx](../../packages/content/content/neon-protocol/convolutional-neural-networks/05-visualizing-features.mdx) | DevTools Element Inspection | Feature Map Visualization | ORPHAN |
| [packages/content/content/neon-protocol/deployment/01-model-export.mdx](../../packages/content/content/neon-protocol/deployment/01-model-export.mdx) | JSON.stringify/parse | Model Serialization | ORPHAN |
| [packages/content/content/neon-protocol/deployment/02-optimization-for-browser.mdx](../../packages/content/content/neon-protocol/deployment/02-optimization-for-browser.mdx) | Webpack Tree-Shaking | Model Pruning | ORPHAN |
| [packages/content/content/neon-protocol/deployment/04-monitoring-and-drift.mdx](../../packages/content/content/neon-protocol/deployment/04-monitoring-and-drift.mdx) | Error Tracking (Sentry/DataDog) | Model Monitoring | ORPHAN |
| [packages/content/content/neon-protocol/feature-extraction/01-feature-vectors.mdx](../../packages/content/content/neon-protocol/feature-extraction/01-feature-vectors.mdx) | Hash functions | Feature Vector | ORPHAN |
| [packages/content/content/neon-protocol/feature-extraction/02-embedding-spaces.mdx](../../packages/content/content/neon-protocol/feature-extraction/02-embedding-spaces.mdx) | 2D scatter plot positioning | Embedding Space | ORPHAN |
| [packages/content/content/neon-protocol/feature-extraction/04-backbone-networks.mdx](../../packages/content/content/neon-protocol/feature-extraction/04-backbone-networks.mdx) | Shared component libraries | Backbone Network | ORPHAN |
| [packages/content/content/neon-protocol/generative-vision/01-gans-primer.mdx](../../packages/content/content/neon-protocol/generative-vision/01-gans-primer.mdx) | Fuzzer vs Validator in Testing | Generator vs Discriminator | ORPHAN |
| [packages/content/content/neon-protocol/generative-vision/02-variational-autoencoders.mdx](../../packages/content/content/neon-protocol/generative-vision/02-variational-autoencoders.mdx) | URL Query Parameters | Latent Space Encoding | ORPHAN |
| [packages/content/content/neon-protocol/generative-vision/03-style-transfer.mdx](../../packages/content/content/neon-protocol/generative-vision/03-style-transfer.mdx) | CSS Themes | Neural Style Transfer | ORPHAN |
| [packages/content/content/neon-protocol/generative-vision/04-adversarial-patches.mdx](../../packages/content/content/neon-protocol/generative-vision/04-adversarial-patches.mdx) | XSS Attacks | Adversarial Examples | ORPHAN |
| [packages/content/content/neon-protocol/image-data/01-building-datasets.mdx](../../packages/content/content/neon-protocol/image-data/01-building-datasets.mdx) | Asset Pipeline | Dataset Structure | ORPHAN |
| [packages/content/content/neon-protocol/image-data/02-data-augmentation.mdx](../../packages/content/content/neon-protocol/image-data/02-data-augmentation.mdx) | CSS Transforms | Image Augmentation | ORPHAN |
| [packages/content/content/neon-protocol/image-data/03-normalization.mdx](../../packages/content/content/neon-protocol/image-data/03-normalization.mdx) | CSS Normalize | Pixel Normalization | ORPHAN |
| [packages/content/content/neon-protocol/ml-through-vision/01-seeing-like-a-machine.mdx](../../packages/content/content/neon-protocol/ml-through-vision/01-seeing-like-a-machine.mdx) | Canvas getImageData() | Image Tensor | ORPHAN |
| [packages/content/content/neon-protocol/ml-through-vision/02-pixels-and-tensors.mdx](../../packages/content/content/neon-protocol/ml-through-vision/02-pixels-and-tensors.mdx) | Uint8ClampedArray | Tensor Indexing | ORPHAN |
| [packages/content/content/neon-protocol/ml-through-vision/04-image-operations.mdx](../../packages/content/content/neon-protocol/ml-through-vision/04-image-operations.mdx) | CSS object-fit | Image Preprocessing | ORPHAN |
| [packages/content/content/neon-protocol/object-detection/03-intersection-over-union.mdx](../../packages/content/content/neon-protocol/object-detection/03-intersection-over-union.mdx) | Drag-and-Drop Hit Testing | IoU Score | ORPHAN |
| [packages/content/content/neon-protocol/object-detection/04-non-max-suppression.mdx](../../packages/content/content/neon-protocol/object-detection/04-non-max-suppression.mdx) | debounce() | Non-Max Suppression | ORPHAN |
| [packages/content/content/neon-protocol/real-time-detection/01-video-stream-processing.mdx](../../packages/content/content/neon-protocol/real-time-detection/01-video-stream-processing.mdx) | getUserMedia() API | Video Frame Pipeline | ORPHAN |
| [packages/content/content/neon-protocol/real-time-detection/05-streaming-architectures.mdx](../../packages/content/content/neon-protocol/real-time-detection/05-streaming-architectures.mdx) | WebSocket / Server-Sent Events | Inference Stream | ORPHAN |
| [packages/content/content/neon-protocol/segmentation/01-semantic-segmentation.mdx](../../packages/content/content/neon-protocol/segmentation/01-semantic-segmentation.mdx) | CSS clip-path | Segmentation Mask | ORPHAN |
| [packages/content/content/neon-protocol/segmentation/02-instance-segmentation.mdx](../../packages/content/content/neon-protocol/segmentation/02-instance-segmentation.mdx) | DOM element identity vs class | Instance Segmentation | ORPHAN |
| [packages/content/content/neon-protocol/transfer-learning/02-feature-reuse.mdx](../../packages/content/content/neon-protocol/transfer-learning/02-feature-reuse.mdx) | Component libraries | Transfer Learning | ORPHAN |
| [packages/content/content/neon-protocol/transfer-learning/03-fine-tuning.mdx](../../packages/content/content/neon-protocol/transfer-learning/03-fine-tuning.mdx) | Object.freeze() | Layer Freezing | ORPHAN |
| [packages/content/content/nova-canvas/audio-generation/02-audio-synthesis.mdx](../../packages/content/content/nova-canvas/audio-generation/02-audio-synthesis.mdx) | OscillatorNode | Neural Oscillator | ORPHAN |

_Showing first 80 of 189. Full list available by re-running audit script._

---

## Recommendations

1. **Fix missing bridge** in lesson(s) listed above.
2. **Reconcile tier mismatches** — single source of truth must be the canonical registry. Either update the lesson tier or update the registry tier — pick one and make them match.
3. **Promote vs prune orphans** — for each orphan, decide: reusable bridge → add to registry, lesson-specific → leave inline but require `breaks:` field per pattern (Deliverable C).
4. **Identity-tier audit pass** — manually verify every identity claim. Any that aren't literal code-level equivalence → demote to structural.
5. **Prioritize `breaks:` retrofit** by suspect list above. These have the largest gap between FE word and ML word and are most likely to mislead.
