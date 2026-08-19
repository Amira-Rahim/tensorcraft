# Neon Protocol - Computer Vision

> Neon Protocol is the second world in Tensorcraft. The script below contains the full narrative design, character profiles, and module outlines.

---

## SCRIPT GUIDE

**Tags:** `computer-vision` `CNN` `object-detection` `segmentation` `transfer-learning` `real-time`
**World:** Cyberpunk surveillance resistance in Neon City, 2049
**Setting:** NeuralCore HQ - the resistance's underground base beneath Neon City. Above ground, Meridian Systems operates 200 cameras per city block. The resistance repurposes decommissioned server rooms, rooftop antenna arrays, and hidden safe houses as their operational network.
**Model being built:** Protocol Sentinel - an anomaly detection system for surveillance networks
**GitHub repo deployed at end:** `protocol-sentinel-vision`

### Characters

| Name | Role | Description |
|---|---|---|
| **Kira** | Hacker / Player Character / Student Avatar | The learner's proxy. Skilled JavaScript engineer who joined the resistance after Meridian flagged her as "non-compliant" for refusing their tracking SDK. Knows JS cold, no ML background. Built a real-time collaborative drawing app with Canvas API and WebRTC that served 50K users - her proudest project before everything changed. Resourceful, determined, occasionally reckless. Receives direction from Lin; learns from Zara, Ryo, and NEON. |
| **Zara** | Street Artist / Visual Expert | Resident expert on visual perception and image composition. Creative, observant, speaks in vivid imagery. Translates vision concepts into intuitive visual metaphors. |
| **Ryo** | Former Corp Engineer | Ex-Meridian engineer who defected. Quiet, precise, carries guilt about his past work. Knows the enemy's systems inside out. Handles architecture and optimization. |
| **Lin** | Resistance Leader | Strategic leader. Charismatic, intense, carries the weight of leadership. Sets mission objectives and provides the larger context. |
| **NEON** | Reprogrammed Surveillance AI | Fragment of the city's surveillance AI that Ryo extracted and reprogrammed. Glitchy, self-aware, darkly funny. Tutorial guide, code assistant, hint system. |

### Career Paths & Salaries

> **Note:** Tensorcraft graduates are best positioned for "ML-Enhanced" JavaScript roles. The pure ML engineering roles below typically also require Python fluency and deeper mathematics - Tensorcraft provides the conceptual foundation to pursue them.

| Path | Description | Avg Salary (US) |
|---|---|---|
| ML-Enhanced JavaScript Engineer | Build ML-powered visual features in the browser (canvas, WebGL, image processing) | $120,000 - $160,000 |
| Frontend Engineer (Vision Products) | Frontend for CV-heavy products (annotation tools, dashboards, AR/VR interfaces) | $125,000 - $165,000 |
| Computer Vision Engineer* | Build detection, segmentation, and tracking systems | $150,000 - $200,000 |
| ML Engineer (Vision)* | Train and deploy image/video models at scale | $145,000 - $195,000 |
| AR/VR ML Engineer* | Real-time vision for immersive experiences | $145,000 - $195,000 |

*\*Requires additional Python fluency and deeper mathematics beyond this course.*

---

## WORLD PREVIEW

### Preview Art

A rain-slicked street in Neon City. Holographic advertisements flicker on every surface. In the foreground, Kira crouches behind a dumpster, her laptop open, its screen casting cyan light across her face. Above her, a Meridian surveillance drone hovers - its camera lens glowing hot pink. On Kira's screen: a bounding box around the drone, labeled `MERIDIAN-SCOUT-7 | conf: 0.94`. In the bottom corner of the screen, NEON's glitchy avatar pulses with interference patterns.

### Story Summary

Five years ago, Neon City's centralized surveillance AI was built to protect citizens. Then Meridian Systems corrupted it. Now 200 cameras per city block track, profile, and control. An underground resistance has formed - and they need a JavaScript engineer who can build vision systems that fight back.

Kira, a skilled JavaScript engineer, is recruited after Meridian's AI flags her as non-compliant. Under the guidance of Zara (visual intuition), Ryo (architecture expertise), and Lin (strategic leadership), she builds Protocol Sentinel - a browser-based vision system that detects surveillance anomalies, identifies drones, and ultimately captures proof of Meridian's illegal profiling.

The journey takes Kira from basic image classification to real-time object detection, semantic segmentation, transfer learning, generative adversarial techniques, and edge deployment - all running in the browser, all mapped to JavaScript concepts she already knows.

### Model Preview

Protocol Sentinel evolves across 11 modules:

1. **M1-M2:** Basic image classifier (surveillance camera detection)
2. **M3:** CNN-based multi-class classifier for camera types
3. **M4:** Object detector for drones and surveillance hardware
4. **M5:** Semantic segmentation for urban scene understanding
5. **M6:** Feature extractor for surveillance pattern representations
6. **M7:** Transfer learning from Meridian's own pre-trained models
7. **M8:** Real-time detection pipeline in the browser
8. **M9:** Generative adversarial capabilities for counter-surveillance
9. **M10:** Optimized edge model for resistance devices
10. **M11:** Full production Protocol Sentinel with monitoring

---

## CONCEPT DISCLAIMER

> **This course teaches machine learning through interactive, narrative-driven lessons designed for JavaScript engineers.**
>
> You will learn real ML - not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
>
> **Fundamentals you will master:**
> - Linear algebra (vectors, matrices, tensors, broadcasting)
> - Calculus (gradients, chain rule, backpropagation)
> - Probability & statistics (distributions, Bayes, likelihood)
> - Optimization (gradient descent, learning rates, convergence)
> - Information theory (entropy, cross-entropy, KL divergence)
>
> **Specialization topics (Neon Protocol):**
> - Image representation (pixels, channels, color spaces)
> - Convolutional neural networks (kernels, pooling, feature maps)
> - Object detection (anchor boxes, IoU, NMS, YOLO)
> - Image segmentation (semantic, instance, U-Net)
> - Transfer learning (fine-tuning, feature freezing, domain adaptation)
> - Real-time vision (video streams, frame-by-frame inference, WebGL)
> - Generative vision (GANs, adversarial patches, style transfer)
> - Model optimization (quantization, pruning, edge deployment)

---

## MODULE 1: ML THROUGH VISION (FREE)

*Kira joins the resistance and learns the fundamentals of computer vision through surveillance analysis.*

### L1.1 - Seeing Like a Machine

**5C Variation:** Standard

Kira meets the resistance crew. Lin briefs her on the mission. Zara shows her a wall of surveillance camera feeds: "This is what Meridian sees. Now let us teach a machine to see differently." NEON boots up - glitchy, disoriented, but functional.

> **NEON:** "I used to track 14 million faces simultaneously. Now I am helping you debug a tensor shape mismatch. How the mighty have fallen."

**JS BRIDGE:** Images in a computer are just `<canvas>` pixel data - a 2D grid of RGBA values stored in a `Uint8ClampedArray`. Every `getImageData()` call returns a tensor. Kira's collaborative drawing app streamed exactly this data over WebRTC - she was already working with image tensors without knowing it.

**Hook:** NEON's diagnostic scan reveals something unexpected in the image data - patterns that shouldn't be there.

### L1.2 - Pixels & Tensors

**5C Variation:** Discovery

Images are multi-dimensional arrays. A grayscale image is a 2D tensor (height x width). A color image is a 3D tensor (height x width x channels). A batch of images is 4D.

**JS BRIDGE:** `Uint8ClampedArray` from `canvas.getContext('2d').getImageData()` - a canvas image is already a tensor, just flattened.

**Hook:** The pixel patterns are familiar - too familiar. NEON says: "I've seen this encoding before. At Meridian."

### L1.3 - Color Channels

**5C Variation:** Broken Code First

RGB, grayscale, alpha - understanding depth. Each pixel has 3 (or 4) values. Color spaces are just different coordinate systems for the same visual information.

**JS BRIDGE:** CSS color functions: `rgb(255, 0, 0)`, `hsl(0, 100%, 50%)`, `oklch(0.63, 0.26, 29)` - different representations of the same color, just as RGB/HSV/LAB are different representations of the same image data.

**Hook:** NEON isolates a hidden channel in Meridian's camera feeds - data encoded in color values the human eye can't distinguish.

### L1.4 - Image Operations

**5C Variation:** Standard

Resize, crop, rotate, flip - basic transforms that prepare images for model input. Every model expects a fixed input size.

**JS BRIDGE:** CSS `transform` and `object-fit` are the same two operations image pipelines run constantly: `object-fit: cover` is center-crop, `object-fit: contain` is resize-with-padding. Sharp names them the same way on the server (`fit: 'cover'`, `fit: 'contain'`).

**Hook:** The transforms reveal something: Meridian's cameras all output images at an unusual resolution - one optimized for a specific model architecture.

### L1.5 - Your First Classifier

**5C Variation:** Standard (with debrief elements)

A simple threshold-based image classifier: is this image bright or dark? Is there a red region (indicating a camera LED)? Simple rules on pixel values.

**JS BRIDGE:** `if/else` on pixel values - the simplest possible "model." This is where traditional programming ends and ML begins.

**Story beat:** NEON runs the simple classifier on a surveillance feed. It works - barely. 62% accuracy. Kira realizes she needs something more powerful.

**Cliffhanger:** NEON's diagnostic scan reveals something unexpected: its own facial recognition model is still running inside Meridian's network.

---

## MODULE 2: IMAGE DATA

*Understanding and preparing image datasets for training.*

### Narrative

The resistance needs training data. Zara leads a nighttime operation to photograph surveillance equipment across Neon City - every angle, every lighting condition, rain and dry, day and night.

> **ZARA:** "Data augmentation is like my art - same subject, different angles, different lighting, different moods. The more perspectives you show the model, the deeper it understands."

**Unique content:** Kira builds a data pipeline that ingests images from the resistance's distributed camera network, applies augmentation (random crops, rotations, color jitter, horizontal flips), normalizes pixel values, balances class distributions, and creates efficient batched data loaders.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Building Datasets | Collecting, labeling, organizing image data | Asset pipeline and folder structure |
| 2 | Data Augmentation | Creating training variety through transforms | CSS transform variations (`rotate`, `scale`, `skew`) |
| 3 | Normalization | Scaling pixel values for model consumption | Timestamps to epoch millis - one scale at ingest |
| 4 | Class Balance | Handling imbalanced datasets | Load balancing across servers |
| 5 | Data Loaders | Efficient batched data loading | Pagination and infinite scroll |

### GITHUB

**Commit:** `feat(m2): image data pipeline with augmentation and balanced loading`
**Branch:** `module-02/image-data`

**Cliffhanger:** While reviewing the augmented dataset, Zara notices something in the metadata: timestamps show that three of the resistance's own cameras have been repositioned - by someone outside the network.

---

## MODULE 3: CONVOLUTIONAL NEURAL NETWORKS

*Building the core vision architecture for surveillance equipment classification.*

### Narrative

Kira builds her first CNN. Zara walks her through feature visualization:

> **ZARA:** "Look - the first layer learned edges. The second found shapes. The third recognizes camera housings. Each layer builds on the last, like seeing with increasing understanding."

The model hits 89% accuracy on camera type classification.

**Unique content:** Kira implements convolution operations from scratch before using TensorFlow.js's built-in layers. She visualizes feature maps at each layer to understand what the network "sees" - edges in layer 1, textures in layer 2, object parts in layer 3, full objects in layer 4.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Convolution Operations | How kernels slide across images. Kira recognizes the pattern from her Canvas drawing app - she's applied blur filters to pixel buffers before. | CSS `filter: blur()` - a convolution kernel operation |
| 2 | Pooling Layers | Downsampling feature maps | Metric rollup: one peak per bucket |
| 3 | CNN Architecture | Stacking conv, pool, and dense layers | Component composition patterns |
| 4 | Training a CNN | End-to-end training on image data | Full build pipeline execution |
| 5 | Visualizing Features | Understanding what the network learned | DevTools element inspection |

**JS BRIDGES (Module-Level):**

- **Convolution = CSS `blur()`:** A CSS blur filter slides a Gaussian kernel across every pixel of an image. A convolutional layer does the same thing - slides a learned kernel across the image. The difference: CSS uses a fixed kernel (Gaussian); CNNs learn the kernel from data.
- **Pooling = metric rollup:** a rollup collapses sixty samples a minute into one peak per bucket. Max pooling does the same reduction in two dimensions, keeping the maximum value from each window. The difference: the rollup's raw samples are still in storage, and the pooled activations are gone.

### GITHUB

**Commit:** `feat(m3): CNN classifier with feature visualization`
**Branch:** `module-03/cnn`

**Cliffhanger:** The pooled features reveal a pattern - Meridian is not just tracking faces. They are predicting where people will go next.

---

## MODULE 4: OBJECT DETECTION

*Finding and localizing Meridian's drones within images.*

### Narrative

The resistance needs to detect Meridian's drones in real-time street-level camera feeds. Ryo shares insider knowledge:

> **RYO:** "Meridian uses YOLOv5 for their drone detection. I know because I helped build it. Here is how we beat it: we build something faster and deploy it where they cannot reach - the browser."

**Unique content:** Kira implements the full object detection pipeline - anchor box generation, bounding box regression, intersection over union (IoU) calculation, non-maximum suppression (NMS), and the YOLO single-shot architecture. She learns to handle multiple object scales and aspect ratios.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Bounding Boxes | Representing object locations | `position: absolute` + `getBoundingClientRect()` |
| 2 | Anchor Boxes | Pre-defined detection regions | CSS Grid template areas / `getBoundingClientRect()` |
| 3 | IoU | Measuring detection overlap accuracy | Drag-and-drop hit testing / collision detection |
| 4 | Non-Max Suppression | Eliminating duplicate detections | `debounce()` - suppress redundant firing events |
| 5 | YOLO Architecture | Single-shot detection at speed | Single-pass rendering vs multi-pass layout |

**JS BRIDGES (Module-Level):**

- **Anchor boxes = `getBoundingClientRect()`:** Anchor boxes define pre-set regions where the model looks for objects. `getBoundingClientRect()` returns the exact bounding rectangle of a DOM element. Both describe rectangular regions in a 2D space using `{x, y, width, height}`.
- **IoU = drag-and-drop collision detection:** Intersection over Union measures how much two boxes overlap. In browser drag-and-drop, you calculate overlap between the dragged element and drop targets - same math, same purpose.
- **NMS = `debounce()`:** When you scroll rapidly, a scroll handler fires many redundant events. `debounce()` keeps only the final (strongest) event and suppresses the rest. NMS does the same - multiple overlapping detections for the same object are suppressed, keeping only the highest-confidence one.

### GITHUB

**Commit:** `feat(m4): YOLO-based drone detection with NMS`
**Branch:** `module-04/object-detection`

**Story beat:** The detector works. For the first time, the resistance can see drones before drones see them. Zara brings synthetic coffee to the server room. NEON displays a drone count on the wall: "47 tracked, 0 spotted us." Lin raises her mug. Kira laughs - actually laughs - for the first time since joining the resistance. The moment is brief, but real.

**Cliffhanger:** The drone detector flags a new model of drone - one not in any of Ryo's intel files. Ryo's jaw tightens. "That's Yates's signature - new hardware, no announcement, just deployment. Director Yates doesn't iterate. She replaces." Meridian is deploying hardware the resistance has never seen.

---

## MODULE 5: SEGMENTATION

*Understanding images at the pixel level for scene analysis.*

### Narrative

The resistance needs to understand full street scenes, not just detect individual objects.

> **ZARA:** "A drone detector tells you *what*. Segmentation tells you *where*. And *where* tells you *why* - why is that drone hovering over that specific intersection?"

**Unique content:** Kira implements semantic segmentation (classify every pixel), instance segmentation (distinguish individual objects), and the U-Net encoder-decoder architecture. She builds mask generation for pixel-precise boundaries around surveillance equipment.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Semantic Segmentation | Classifying every pixel | `map()` vs `find()` - one label out per pixel in |
| 2 | Instance Segmentation | Distinguishing individual objects | DOM element identity vs class |
| 3 | U-Net Architecture | Encoder-decoder for dense prediction | Layout flow: content down, sizes up |
| 4 | Mask Generation | Pixel-precise boundaries. Kira realizes this is the same concept as her drawing app's selection tool - isolating pixel regions with a binary mask. | SVG `<mask>` and `<clipPath>` elements |
| 5 | Scene Understanding | Combining segmentation with context | Semantic HTML - structure implies meaning |

### GITHUB

**Commit:** `feat(m5): U-Net segmentation for urban scene understanding`
**Branch:** `module-05/segmentation`

**Cliffhanger:** Ryo's old access credentials still work. Inside Meridian's model registry, they find a model trained on data from their own resistance network.

---

## MODULE 6: FEATURE EXTRACTION

*Learning meaningful representations from surveillance imagery.*

### Narrative

Ryo introduces features as the "DNA" of an image:

> **RYO:** "Meridian's network does not store images - it stores features. Compact, searchable, and terrifyingly powerful. We will build the same capability, but use it to find their patterns instead of ours."

**Unique content:** Kira builds feature extractors, embedding spaces, and similarity search. She learns to use pre-trained backbone networks as feature extractors and applies dimensionality reduction (t-SNE, PCA) to visualize how the model organizes surveillance imagery.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Feature Vectors | Compact image representations | Hash functions - compact data representation |
| 2 | Embedding Spaces | Similar images cluster together | 2D scatter plots of related data |
| 3 | Similarity Search | Finding visually similar images | Fuzzy text search / autocomplete |
| 4 | Backbone Networks | Pre-trained feature extractors | Shared component libraries |
| 5 | Dimensionality Reduction | t-SNE and PCA for visualization | Responsive design - same content, fewer dimensions |

### GITHUB

**Commit:** `feat(m6): feature extraction pipeline with embedding visualization`
**Branch:** `module-06/feature-extraction`

**Cliffhanger:** The embedding space reveals a cluster of images the resistance never uploaded. Someone else is using their feature extractor - and feeding data back to Meridian. NEON traces the metadata: "These images were ingested by a pipeline registered to Director Yates's personal project allocation. She knows about us."

---

## MODULE 7: TRANSFER LEARNING

*Standing on the shoulders of giants - and enemies.*

### Narrative

The midpoint revelation. Ryo downloads weights from a Meridian model he helped build.

> **RYO:** "They spent $2 million training this on every surveillance feed in the city. We fine-tune it on 500 images and turn it against them."

> **LIN:** "Poetic justice."

**Story beat (Flashback):** While the fine-tuning job runs overnight, Ryo and Kira sit on the server room floor, watching progress bars crawl. Ryo talks - really talks - for the first time.

> **RYO:** "I thought we were building safety. I told myself that every camera was protecting someone. It took two years to see what we'd actually built. By then my code was in 40,000 cameras across the city. You don't just quit something like that - you have to find the courage to actively undo it."

Kira doesn't respond right away. She watches the loss curve descend on her screen - Meridian's own model learning to fight Meridian. Finally: "So that's what we're doing. Undoing it." Ryo nods. The progress bar hits 12%.

**Unique content:** Kira learns to load pre-trained models, freeze early layers (which capture universal visual features like edges and textures), and fine-tune later layers on the resistance's specific task. She also implements domain adaptation to bridge the gap between Meridian's training distribution and the resistance's field data.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Pre-trained Models | Using models trained on massive datasets | npm packages - using others' work |
| 2 | Fine-tuning | Adapting a model to your task | Customizing a UI framework's world |
| 3 | Feature Freezing | Which layers to retrain | `Object.freeze()` - selective immutability |
| 4 | Domain Adaptation | Bridging data distributions | i18n - adapting content across locales |
| 5 | Meridian's Models | Repurposing the enemy's weights | Forking an open-source project |

### GITHUB

**Commit:** `feat(m7): transfer learning from Meridian pre-trained weights`
**Branch:** `module-07/transfer-learning`

**Cliffhanger:** They successfully fine-tune Meridian's model against itself - but the accuracy numbers suggest Meridian anticipated this exact attack.

---

## MODULE 8: REAL-TIME DETECTION

*Running vision models live in the browser.*

### Narrative

Protocol Sentinel goes live on a test feed. Kira watches detections appear in real-time on the browser dashboard.

> **KIRA:** "It is working. It is actually seeing them."

NEON warns: "Frame rate dropping. Optimize or lose real-time capability."

**Story beat (Internal conflict):** The team fractures over architecture. Kira wants to run inference client-side - pure browser, no server dependency, impossible to shut down. Ryo insists on a hybrid approach - server-side for accuracy, client-side as fallback. The argument escalates.

> **KIRA:** "If we depend on servers, Meridian takes down one node and the whole district goes blind."
>
> **RYO:** "If we go pure browser, we lose 15% accuracy. That 15% is people, Kira. Misidentified people."

Lin lets them argue. Then: "Build both. Test both. Let the data decide." It's the first time the team has disagreed this sharply - and the resolution makes the system stronger. They ship a hybrid architecture with graceful degradation: server-enhanced when available, browser-only when necessary.

**Unique content:** Kira implements a full video processing pipeline - accessing webcam/video streams via `getUserMedia()`, running frame-by-frame inference in a `requestAnimationFrame` loop, maintaining performance budgets for real-time frame rates, and leveraging WebGL for GPU-accelerated inference.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Video Stream Processing | Accessing and processing video feeds | `getUserMedia()` API |
| 2 | Frame-by-Frame Inference | Running models on live video | `requestAnimationFrame()` render loop |
| 3 | Performance Budgets | Maintaining real-time frame rates | Per-request latency budget split across stages |
| 4 | WebGL Acceleration | GPU-powered inference | WebGL rendering pipeline |
| 5 | Streaming Architectures | Processing continuous visual data | WebSocket / Server-Sent Events |

### GITHUB

**Commit:** `feat(m8): real-time video detection pipeline with WebGL acceleration`
**Branch:** `module-08/real-time`

**Cliffhanger:** NEON identifies a Meridian agent based on gait analysis. Kira is about to trigger an alert - then Ryo stops her. "That person is limping from an injury. The model is wrong." The cost of trusting vision without verification.

---

## MODULE 9: GENERATIVE VISION

*Creating and manipulating images with AI for counter-surveillance.*

### Narrative

Zara's module. She realizes that generative models can create adversarial patterns - visual patches that confuse Meridian's cameras.

> **ZARA:** "Art has always been resistance. Now the art literally fights back."

**Story beat (Ethical tension):** The adversarial patches work - too well. Lin calls a halt before deployment.

> **LIN:** "If we teach an AI to create patches that fool cameras, what stops someone from using the same technique to fool medical imaging or autonomous vehicles? We deploy this responsibly or we don't deploy it at all."

Ryo backs her up, speaking from experience:

> **RYO:** "At Meridian, Director Yates called this kind of capability 'dual-use upside.' Meaning: build it, ship it, let someone else worry about the consequences. That thinking is exactly what we're fighting against. We scope the patches to Meridian's specific model signatures. Narrow target. No collateral."

The team agrees: the patches will be cryptographically bound to Meridian's architecture fingerprints - useless against any other system.

**Unique content:** Kira learns GANs (generator vs discriminator in adversarial training), image generation for synthetic training data, adversarial patch creation that fools classifiers, and style transfer for visual camouflage. The counter-surveillance application ties it all together - using generative AI defensively.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | GANs Primer | Generator vs discriminator | Fuzzer vs validator in testing |
| 2 | Image Generation | Creating synthetic training data | Procedural content generation |
| 3 | Adversarial Patches | Patterns that fool classifiers | CSS `mix-blend-mode` - visual interference |
| 4 | Style Transfer | Applying visual styles across images | CSS world switching / CSS-in-JS |
| 5 | Counter-Surveillance | Using generative AI defensively | Ad blockers - rewriting the visual stream |

### GITHUB

**Commit:** `feat(m9): GAN-based adversarial patches for counter-surveillance`
**Branch:** `module-09/generative-vision`

**Cliffhanger:** Zara's adversarial patch works perfectly in testing. Then NEON detects Meridian has deployed a patch detector.

---

## MODULE 10: DEPLOYMENT

*Shipping Protocol Sentinel to resistance devices across Neon City.*

### Narrative

Ryo leads deployment. For the first time in weeks, Meridian is quiet - no new drones, no model updates, no probes against the resistance network. The silence is deliberate.

> **RYO:** "A model that only works on my laptop is a demo. A model that works on every resistance member's phone is a weapon."

**Story beat (Calm before the storm):** The quiet unsettles everyone except Lin. "Yates is consolidating," she says. "She knows something is coming. So do we." The team uses the calm strategically - optimizing, stress-testing, hardening. Kira runs Protocol Sentinel through every failure scenario she can imagine. Zara designs visual guides so any resistance member can deploy the system without training. Ryo audits his own code one final time, looking for anything Meridian could exploit. There is no crisis this module - just the weight of knowing the next one will be the last.

**Unique content:** Kira optimizes Protocol Sentinel for edge deployment - quantization to shrink the model, pruning to remove unnecessary weights, and distillation to train a lightweight student model. She builds API-based inference for the resistance's server infrastructure and implements A/B testing to compare model versions in the field.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | Model Optimization | Quantization, pruning, distillation | Webpack optimization and minification |
| 2 | Edge Deployment | Running on constrained devices | Progressive Web App (offline-first) |
| 3 | Model Serving | API-based inference architecture | REST API design patterns |
| 4 | A/B Testing Models | Comparing model versions in production | Feature flags and canary deployments |
| 5 | Monitoring | Tracking model performance over time | Application performance monitoring |

### GITHUB

**Commit:** `feat(m10): optimized edge deployment for resistance devices`
**Branch:** `module-10/deployment`

**Cliffhanger:** The evidence is compiled. Lin opens the broadcast channel. Then the power cuts out.

---

## MODULE 11: CAPSTONE - PROTOCOL SENTINEL

*Full system deployment and the final mission.*

### Narrative

The final mission. Protocol Sentinel, deployed across hundreds of devices in the resistance network, captures evidence of Meridian's illegal profiling operations. The system runs in the browser on every resistance member's device - phones, laptops, even repurposed smart glasses.

### Lessons

| # | Title | Description | JS Bridge |
|---|---|---|---|
| 1 | System Design | Architecting the complete Sentinel system | Full-stack architecture planning |
| 2 | Integration Testing | End-to-end system validation | Cypress/Playwright E2E testing |
| 3 | Security & Privacy | Ethical deployment, data handling | CORS, CSP, and security headers |
| 4 | Public Launch | Deploying to production | CI/CD pipeline to production |
| 5 | The Broadcast | Protocol Sentinel reveals Meridian's crimes | The deploy that changes everything |

### CONSEQUENCE

Kira watches from a rooftop as Protocol Sentinel's evidence broadcasts across every screen in Neon City. The surveillance footage, classified and annotated by the system, shows Meridian's AI conducting illegal profiling - tracking individuals based on ethnicity, political affiliation, and social connections.

> **KIRA:** "NEON, status?"

> **NEON:** "Protocol Sentinel is live on 847 devices across 12 districts. Detection confidence averaging 96.2%. Meridian's counter-measures are... inadequate. I almost feel sorry for them. Almost."

> **KIRA:** "And the evidence packages?"

> **NEON:** "Cryptographically signed, timestamped, and distributed to 14 independent media organizations. Even if Meridian shuts down the broadcast, the data is already replicated beyond their reach."

Lin speaks to the city through every hijacked screen:

> **LIN:** "Now you see what they see. Every face tracked. Every movement logged. Every citizen scored. The protocol is open. The sentinel is yours. Watch the watchers."

Kira closes her laptop. The neon signs of the city reflect in the rain puddles at her feet. For the first time in five years, the cameras are not the only ones watching.

### GITHUB

**Commit:** `feat(m11): Protocol Sentinel v1.0 - full deployment with evidence broadcast system`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/protocol-sentinel-vision`

---

## AI-Wrong Moments

These are specific narrative beats where Protocol Sentinel or NEON fails, teaching the crew (and the learner) that ML systems are fallible.

1. **M5 - False Identification:** NEON identifies a suspected Meridian agent based on gait analysis. It is wrong - the person was limping from an injury, not matching a surveillance officer's walking pattern. Kira almost compromised a safe house based on the model's output. Ryo: "High confidence is not the same as high correctness. The model has never seen someone with a limp."

2. **M9 - Adversarial Friendly Fire:** An adversarial patch designed to fool Meridian's cameras also fools the resistance's own security system. NEON: "In my defense, adversarial patches are model-agnostic. If it fools one CNN, it may fool any CNN - including ours." The team learns that adversarial attacks are a double-edged sword.

---

## Character Arcs - Ryo (Nuanced Skeptic)

Ryo's arc is not a simple conversion from skeptic to believer. He knows ML works - he built it for Meridian. His skepticism is about *who controls it* and *whether high accuracy means the model is right for the right reasons*.

1. **M3 - The Warning:** After the CNN hits 89% accuracy, Ryo warns: "High accuracy does not mean the model is right for the right reasons. Meridian's model was 97% accurate. It was also profiling people by ethnicity. Check what features the network is actually using." He insists on feature visualization before deployment.

2. **M5 - Confronting the Past:** When Ryo's old access credentials work inside Meridian's model registry, he finds code he wrote years ago. He goes quiet. Lin: "Ryo?" Ryo: "I built the segmentation pipeline they are using to map resistance safe houses. That is my code." He confronts his past directly and channels the guilt into the work.

3. **M7 - Leading the Attack:** Ryo leads the transfer learning effort, using Meridian's own pre-trained weights against them. "They spent $2 million training this. We fine-tune it on 500 images and turn it against them." This is his redemption - using his knowledge of the enemy's architecture to dismantle it.

4. **M11 - The Choice:** When it is time to broadcast, Ryo knows Meridian will trace the signal back to him. His code fingerprints are all over Protocol Sentinel. He chooses to broadcast anyway - personal risk be damned. "I helped build the cage. The least I can do is help open the door."

---

## World-Specific Terminology

| Term | In-World Meaning | ML Meaning |
|---|---|---|
| Feed | Surveillance camera stream | Input data stream |
| Scan Grid | Detection region overlay | Anchor box grid |
| Ghost Patch | Adversarial visual pattern | Adversarial perturbation |
| Lens Profile | Camera-specific detection config | Model hyperparameters |
| Signal Lock | Confident detection | High-confidence prediction |
| Noise Mask | Visual interference pattern | Data augmentation noise |
| Pixel Map | Segmentation output | Semantic segmentation mask |
| Core Lens | Pre-trained feature extractor | Backbone network |
| Burn Pass | Training iteration | Training epoch |
| Flash Detection | Real-time single-frame inference | Single-shot detection |
| Shadow Network | Underground compute cluster | Distributed training setup |
| Meridian Eye | Surveillance camera unit | Sensor / input device |
| Clean Room | Secure, unmonitored space | Validation environment |
| Protocol Layer | Sentinel system component | Model module / layer |
| Dark Frame | Image with no detections | True negative sample |
