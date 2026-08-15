# Terra Grid - Edge AI & MLOps

> Terra Grid is the fifth world in Tensorcraft. The script below contains the full narrative design, character profiles, and module outlines.

---

## SCRIPT GUIDE

**Tags:** `edge-AI` `MLOps` `quantization` `pruning` `distillation` `federated-learning` `drift-detection`
**World:** Global infrastructure monitoring with edge-deployed ML models
**Setting:** TERRA SYSTEMS - Terra Grid is a global industrial monitoring network managing critical infrastructure: power plants, water treatment facilities, transportation networks, and communication towers across 47 sites worldwide. The network processes petabytes of data from millions of sensors, and the AI models that analyze this data must run at the edge - on low-power devices in remote locations with intermittent connectivity. The team must build Terra Grid Intelligence, an edge AI system that monitors, predicts, and responds to infrastructure anomalies at global scale.
**Model being built:** Terra Grid Intelligence - an edge-deployed anomaly detection and prediction system
**GitHub repo deployed at end:** `terra-grid-intelligence`

### Characters

| Name | Role | Description |
|---|---|---|
| **Hassan Al-Rashid** | Infrastructure Lead / Mentor | Director of Terra Grid operations. 20 years in systems engineering. Steady, experienced, speaks from hard-won wisdom. Has survived every kind of infrastructure failure. Values reliability above all. Provides production reality and systems thinking. |
| **Cole Branson** | Field Engineer / Edge Specialist | Deploys and maintains edge devices in the field. Hands-on, practical, slightly rugged. Strong opinions about what works in the field vs the lab. Handles the "make it run on a Raspberry Pi in a desert" reality. |
| **Park Soo-Yeon** | Data Ops Manager / Pipeline Lead | Manages data pipelines, feature stores, and sensor-to-model data flow. Organized, systematic, sees everything as a pipeline. Strong opinions about data quality. Builds systems others can rely on. |
| **Jin Takahashi** | Security Analyst / Adversarial Expert | Handles security, adversarial robustness, and ML threat landscape. Cautious, detail-oriented, sees threats everywhere (because they are). The team's conscience on security and adversarial risks. |
| **GRID** | Grid Management AI | The network's management AI. Utilitarian, efficient, occasionally dry. Speaks in status updates and metrics. No time for sentimentality but occasionally reveals a sense of purpose. Tutorial guide and deployment assistant. |

### Career Paths & Salaries

> **Note:** Tensorcraft graduates are best positioned for "ML-Enhanced" frontend/fullstack roles. The pure ML engineering roles below typically also require Python fluency and deeper mathematics - Tensorcraft provides the conceptual foundation to pursue them.

| Path | Description | Avg Salary (US) |
|---|---|---|
| ML-Enhanced Frontend Engineer | Build edge-optimized ML features, model monitoring dashboards, deployment UIs | $120,000 - $160,000 |
| Frontend Engineer (ML Platform) | Frontend for MLOps platforms (experiment tracking, model registries, pipeline builders) | $125,000 - $165,000 |
| MLOps Engineer* | Build and maintain ML pipelines, deployment, monitoring | $145,000 - $195,000 |
| ML Infrastructure Engineer* | Build the platforms that ML teams depend on | $150,000 - $200,000 |
| Edge ML Engineer* | Optimize and deploy models to constrained devices | $140,000 - $190,000 |

*\*Requires additional Python fluency and deeper mathematics beyond this course.*

---

## WORLD PREVIEW

### Preview Art

A massive control room with walls of monitors showing a world map dotted with sensor locations - green for healthy, amber for warning, red for critical. In the center, Hassan stands before the main display, arms crossed, watching data streams flow in from 47 sites across six continents. To his right, a video call shows Cole in the field - dusty, sunlit, holding up a small edge device the size of a deck of cards. On a side monitor, GRID's utilitarian interface shows deployment status: model versions, inference latency, memory usage, drift scores. The aesthetic is industrial and operational - no glamour, just function.

### Story Summary

Terra Grid monitors critical infrastructure that millions of people depend on - power grids, water systems, transportation networks. The AI models that keep this infrastructure safe must run at the edge, on devices with 512MB of RAM, ARM processors, and intermittent satellite connectivity. A model that works in a Jupyter notebook is a hypothesis. A model that works at 3 AM on a solar farm in the Atacama Desert with no internet connection is a product.

The challenge is not just building models - it is making them survive the real world. Models that were 99.9% accurate in the lab drop to 67% in the field when sensor firmware updates change the data distribution. A 500MB model must be compressed to fit a 512MB device while leaving room for the operating system. An 8-second inference time must be cut to under 100ms for real-time anomaly detection.

Under the guidance of Hassan (production wisdom), Cole (field reality), Park (data infrastructure), and Jin (security), the student builds Terra Grid Intelligence - from baseline anomaly detection through quantization, pruning, distillation, edge deployment, MLOps pipelines, monitoring, federated learning, A/B testing, and global-scale reliability.

### Model Preview

Terra Grid Intelligence evolves across 11 modules:

1. **M1-M2:** Baseline anomaly detection model for sensor data
2. **M3:** Quantized model (Float32 to Int8) that fits edge constraints
3. **M4:** Pruned and distilled model for maximum efficiency
4. **M5:** Edge-deployed model running on field hardware across 47 sites
5. **M6:** CI/CD pipeline for automated model training and deployment
6. **M7:** Monitoring system with drift detection and alerting
7. **M8:** Federated model trained across regions without data centralization
8. **M9:** A/B testing framework for model version comparison
9. **M10:** Globally scaled system with failover and redundancy
10. **M11:** Complete production system with full observability

---

## CONCEPT DISCLAIMER

> **This course teaches machine learning through interactive, narrative-driven lessons designed for frontend developers.**
>
> You will learn real ML - not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
>
> **Fundamentals you will master:**
>
> - Linear algebra (vectors, matrices, tensors, broadcasting)
> - Calculus (gradients, chain rule, backpropagation)
> - Probability & statistics (distributions, Bayes, likelihood)
> - Optimization (gradient descent, learning rates, convergence)
> - Information theory (entropy, cross-entropy, KL divergence)
>
> **Specialization topics (Terra Grid):**
>
> - Model optimization (quantization, pruning, distillation, mixed precision)
> - Edge deployment (constrained devices, offline operation, OTA updates)
> - MLOps pipelines (CI/CD for ML, experiment tracking, model registries)
> - Monitoring and drift detection (data drift, model drift, alerting)
> - Federated learning (distributed training, privacy preservation, secure aggregation)
> - A/B testing for models (traffic splitting, statistical significance, canary deployments)
> - Scale and reliability (sharding, failover, redundancy, global operations)
> - Security and adversarial robustness (adversarial attacks, model hardening)

---

## MODULE 1: EDGE AI BASICS (FREE)

*The student joins Terra Grid and learns why edge AI is fundamentally different from cloud AI.*

### Summary

The student arrives at Terra Grid HQ. Hassan gives the tour - walls of monitors showing sensor data from around the world. Cole video-calls from a wind farm, holding up a small edge device:

> **COLE:** "Your model needs to run on this. 512MB RAM, ARM processor, no internet until Thursday."

The student realizes this is not a typical dev environment. Hassan explains the mission: 2 million sensors generating data, models analyzing it, but models rot, data shifts, hardware fails. The student's job is to make the intelligence layer reliable.

> **HASSAN:** "A model that works in your notebook is a hypothesis. A model that works at 3 AM on a solar farm in the Atacama Desert with no internet connection - that is a product."

The 500MB model from the lab must be compressed to run on edge devices. The 8-second inference time must be cut to real-time. These constraints drive every module that follows.

> **GRID:** "Current system status: 47 sites monitored. 2,147,483 sensors active. Model version 2.8.3 deployed to 12,400 edge devices. Average inference latency: 8,234ms. Target latency: 89ms. We have work to do."

### Lessons

| # | Title | Description | FE Bridge | 5C Variation |
|---|---|---|---|---|
| 1 | Welcome to the Grid | Introduction to Terra Grid and edge computing | CDN edge locations - serving closer to users | Standard |
| 2 | Why the Edge? | Latency, privacy, connectivity constraints | Offline-first PWAs - working without a server | Discovery |
| 3 | Edge Devices | Understanding hardware constraints | Device testing matrix (mobile, tablet, desktop) | Broken Code First |
| 4 | Your First Edge Model | A simple anomaly detector for sensor data | Client-side form validation - logic at the edge | Standard |
| 5 | Edge vs Cloud Tradeoffs | When to compute locally vs remotely | CSR vs SSR - client vs server rendering | Standard (with debrief elements) |

### GITHUB

**Commit:** `feat(m1): baseline anomaly detection model for edge deployment`
**Branch:** `module-01/edge-ai-basics`

**Cliffhanger:** The optimized model loads in 2.1 seconds on Jin's tablet. The target was 2.0. Hassan says: "Close doesn't count when turbines are spinning."

---

## MODULE 2: MODEL OPTIMIZATION FUNDAMENTALS

*Making models small and fast enough for the edge.*

### Narrative

Park shows the current models' resource profiles:

> **PARK:** "This model uses 1.8GB RAM. Our edge devices have 512MB. Your first job is to make it fit."

The student learns to profile and benchmark, discovering that model size and speed are as important as accuracy in edge environments. This module establishes the optimization mindset that drives the rest of the world.

**Unique content:** The student implements model profiling (measuring size, speed, memory), architecture efficiency analysis (choosing designs that are inherently efficient), computational budgets (working within hardware limits), benchmarking (standardized performance testing), and optimization strategy planning.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Model Profiling | Measuring size, speed, and memory usage | Bundle analysis with `webpack-bundle-analyzer` |
| 2 | Architecture Efficiency | Choosing efficient model designs | Component optimization - avoiding re-renders |
| 3 | Computational Budgets | Working within hardware limits | Performance budgets in Lighthouse |
| 4 | Benchmarking | Standardized model performance testing | `performance.mark()` and `performance.measure()` |
| 5 | Optimization Strategy | Creating a plan for model compression | Build optimization checklist |

### GITHUB

**Commit:** `feat(m2): model profiling and optimization strategy`
**Branch:** `module-02/optimization-fundamentals`

**Cliffhanger:** The profiler reveals that the largest model on the Grid - the wind turbine failure predictor - is also the most critical. And it is 3x over budget.

---

## MODULE 3: QUANTIZATION

*Reducing numerical precision for dramatic efficiency gains.*

### Narrative

Cole sends a challenge:

> **COLE:** "I need this model running on a sensor gateway that costs $35. Make it work."

The student quantizes from Float32 to Int8, reducing the model size by 4x with only 1.2% accuracy loss.

> **HASSAN:** "That is the kind of tradeoff we live with every day. 4x smaller, 1.2% less accurate. In most domains, that is unacceptable. In edge AI, that is a victory."

**Unique content:** The student implements post-training quantization (PTQ), quantization-aware training (QAT), mixed precision (different precision for different layers), and learns to manage the accuracy-size tradeoff systematically.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Number Formats | Float32, Float16, Int8 - precision tradeoffs | Image formats (PNG vs WebP vs AVIF) - quality vs size |
| 2 | Post-Training Quantization | Converting a trained model to lower precision | Webpack minification - same logic, smaller size |
| 3 | Quantization-Aware Training | Training with quantization in mind | Mobile-first development - designing for constraints |
| 4 | Mixed Precision | Different precision for different layers | Responsive images - different res for different contexts |
| 5 | Accuracy vs Size | Managing the quality-efficiency tradeoff | Lossy compression - acceptable quality loss for size |

**FE BRIDGE (Module-Level):** Quantization is Webpack minification. Webpack takes your source code (verbose, readable, Float32-equivalent) and minifies it (compact, optimized, Int8-equivalent). The logic is preserved but the representation is smaller. Variable names shrink from `userAuthenticationToken` to `a`. Whitespace disappears. The output does the same thing in less space - just like a quantized model.

### GITHUB

**Commit:** `feat(m3): quantization pipeline - Float32 to Int8 with 1.2% accuracy loss`
**Branch:** `module-03/quantization`

**Cliffhanger:** The quantized model hits 97.2% accuracy - acceptable. Then Jin reports from Site 23: "Your model just missed a bearing failure. The turbine seized."

---

## MODULE 4: PRUNING & DISTILLATION

*Removing what is unnecessary and teaching smaller models to be smart.*

### Narrative

Hassan introduces distillation through analogy:

> **HASSAN:** "We have a massive model that knows everything. We need a tiny model that knows just enough. The big model teaches the small one - like a senior engineer mentoring a junior."

The student builds a distilled model that is 10x smaller and 95% as accurate.

**Unique content:** The student implements weight pruning (removing unnecessary connections), structured pruning (removing entire neurons or channels), knowledge distillation (training a small student model to mimic a large teacher model), and combined optimization (pruning + quantization + distillation together for maximum compression).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Weight Pruning | Removing unnecessary connections | Tree-shaking - removing unused code |
| 2 | Structured Pruning | Removing entire neurons or channels | Dead code elimination in bundlers |
| 3 | Knowledge Distillation | Training a small model to mimic a large one | Code splitting - smaller chunks, same experience |
| 4 | Teacher-Student Training | The distillation training process | Mentor pair programming - transferring knowledge |
| 5 | Combined Optimization | Pruning + quantization + distillation together | Full Webpack production config - all optimizations |

**FE BRIDGES (Module-Level):**

- **Pruning = tree-shaking:** Webpack's tree-shaking removes unused exports from your bundle. Pruning removes unused weights from your model. Both analyze what is actually needed and eliminate the rest. A typical JavaScript bundle has 30-60% unused code. A typical neural network has 40-90% prunable weights. The principle is identical.
- **Distillation = code splitting:** Code splitting breaks a large bundle into smaller chunks that load on demand, delivering the essential experience first. Knowledge distillation breaks a large model's knowledge into a smaller model that delivers the essential predictions. Both reduce size while preserving the critical functionality.

### GITHUB

**Commit:** `feat(m4): pruning + distillation - 10x smaller, 95% accuracy`
**Branch:** `module-04/pruning-distillation`

**Cliffhanger:** The distilled model passes all lab benchmarks. Cole deploys it to Site 12 - a desert installation with 50-degree heat. The ARM processor throttles, and inference time doubles.

---

## MODULE 5: EDGE DEPLOYMENT

*Getting models onto real hardware in real environments across 47 sites.*

### Narrative

Cole takes the student on a virtual field trip to a remote sensor station:

> **COLE:** "Once I deploy a model here, I cannot just SSH in and fix it. The update has to work perfectly, every time, over a satellite link that costs $0.50 per MB."

Park builds the deployment pipeline. The first edge deployment succeeds on 847 devices.

> **GRID:** "Deployment to Sector 7 complete. Model version 3.2.1 running on 847 edge devices. Average inference latency: 12ms. Memory usage: 43% of budget. All green."

**Unique content:** The student implements deployment target analysis (understanding edge hardware diversity), model packaging (bundling models for deployment), runtime environments (TFLite, ONNX Runtime, WebAssembly), over-the-air updates (updating models on remote devices safely), and offline operation (models that work without connectivity for 72+ hours).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Deployment Targets | Understanding edge hardware diversity | Cross-browser compatibility testing |
| 2 | Model Packaging | Bundling models for deployment | npm package publishing |
| 3 | Runtime Environments | TFLite, ONNX Runtime, WebAssembly | Browser engines (V8, SpiderMonkey, JSC) |
| 4 | Over-the-Air Updates | Updating models on remote devices | Service Worker update lifecycle |
| 5 | Offline Operation | Models that work without connectivity | Offline-first architecture with IndexedDB |

**FE BRIDGE (Module-Level):** Model sharding is dynamic `import()`. In frontend code, `dynamic import()` splits your application into chunks that load on demand - the user gets the critical path first, and additional chunks load as needed. Model sharding does the same: a large model is split across devices or loaded in parts, with the critical inference path available first and additional capabilities loading as resources permit.

### GITHUB

**Commit:** `feat(m5): edge deployment pipeline across 847 devices`
**Branch:** `module-05/edge-deployment`

**Cliffhanger:** GRID's monitoring dashboard lights up: three sites simultaneously reporting anomalous readings. The model has never seen this pattern.

---

## MODULE 6: MLOPS PIPELINES

*Automating the ML lifecycle from data to deployment.*

### Narrative

Park builds the full pipeline:

> **PARK:** "Manual retraining does not scale. When sensor data drifts, the pipeline should detect it, retrain automatically, validate, and deploy - all without human intervention."

> **HASSAN:** "With human oversight at the gates. Automated does not mean unsupervised."

**Unique content:** The student implements the full ML pipeline - data versioning (tracking dataset changes over time), experiment tracking (logging training runs and results), model registry (versioning and storing trained models), and automated retraining (triggering retraining on data changes or schedule).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | ML Pipeline Anatomy | The stages of an ML pipeline | CI/CD pipeline stages (build, test, deploy) |
| 2 | Data Versioning | Tracking dataset changes over time | Git version control for data |
| 3 | Experiment Tracking | Logging training runs and results | Test result dashboards |
| 4 | Model Registry | Versioning and storing trained models | npm registry for packages |
| 5 | Automated Retraining | Triggering retraining on data changes | GitHub Actions - event-triggered workflows |

### GITHUB

**Commit:** `feat(m6): automated MLOps pipeline with data versioning and model registry`
**Branch:** `module-06/mlops-pipelines`

**Cliffhanger:** The automated pipeline retrains and deploys a model update overnight. By morning, three sites have degraded accuracy. The pipeline worked perfectly - but the new training data was contaminated.

---

## MODULE 7: MONITORING & DRIFT DETECTION

*Watching models in production and catching silent degradation.*

### Narrative

The midpoint crisis. GRID alerts:

> **GRID:** "Alert: Region 4 wind turbine cluster. Prediction accuracy degraded from 96.2% to 89.1% over 14 days. Drift score exceeding threshold. Recommended action: investigate data pipeline and retrain."

The team scrambles. Park investigates - the sensor firmware was updated two weeks ago, changing the data distribution. The models were trained on the old distribution and are now seeing data they do not understand.

> **HASSAN:** "This is why we monitor. Without drift detection, we would not have caught this for months. Equipment could have failed. People could have been hurt."

The team retrains and redeploys within hours.

**Unique content:** The student implements production monitoring (tracking model health in real time), data drift detection (statistical tests for distribution shift), model drift detection (tracking prediction quality degradation), alert systems (configuring meaningful thresholds), and drift response procedures (diagnosis, retraining, redeployment).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Production Monitoring | Tracking model health in real time | Application monitoring (Sentry, DataDog) |
| 2 | Data Drift | When input data changes over time | Lighthouse CI regression - detecting performance changes |
| 3 | Model Drift | When predictions degrade silently | Visual regression testing |
| 4 | Alert Systems | Configuring meaningful alerts | Alerting thresholds in monitoring tools |
| 5 | Drift Response | Diagnosing and fixing drift incidents | Incident response and rollback procedures |

**FE BRIDGE (Module-Level):** Drift detection is Lighthouse CI. Lighthouse CI runs on every commit and compares performance metrics against a baseline - if Time to Interactive regresses by more than 10%, the build fails. Drift detection does the same for ML models: it continuously compares model performance against a baseline, and if accuracy degrades beyond a threshold, it triggers an alert. Both are automated regression detection systems that catch silent degradation before users notice.

### GITHUB

**Commit:** `feat(m7): monitoring and drift detection with automated alerting`
**Branch:** `module-07/monitoring-drift`

**Cliffhanger:** The A/B test results are in. Model B outperforms Model A by 12% - but Model B was trained on data from a site that no longer exists.

---

## MODULE 8: FEDERATED LEARNING

*Training models across distributed data without centralizing it.*

### Narrative

Jin raises the issue:

> **JIN:** "Power companies will not share their sensor data with each other. Regulatory and competitive reasons. But each company's data alone is not enough to train a robust model."

> **HASSAN:** "Then we bring the training to the data, not the data to the training."

The student builds a federated learning system that improves models across regions without any raw data leaving its source. Each site trains locally and shares only model updates (gradients), which are aggregated centrally.

**Unique content:** The student implements federated averaging (combining model updates from distributed training), privacy preservation (keeping data local while improving models), communication efficiency (minimizing data transfer during training), and secure aggregation (protecting individual updates during aggregation against gradient inversion attacks).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | The Data Silo Problem | When data cannot be centralized | CORS - data boundaries between origins |
| 2 | Federated Averaging | Combining model updates from distributed training | State sync across browser tabs |
| 3 | Privacy Preservation | Keeping data local while improving models | Cookie isolation and third-party restrictions |
| 4 | Communication Efficiency | Minimizing data transfer during training | GraphQL - requesting only needed data |
| 5 | Secure Aggregation | Protecting individual updates during aggregation | End-to-end encryption in messaging |

### GITHUB

**Commit:** `feat(m8): federated learning across distributed sites`
**Branch:** `module-08/federated-learning`

**Cliffhanger:** The federated model converges faster than expected - but one region's weight updates are statistically anomalous. Jin: "Either that region has genuinely different data, or someone is poisoning the training."

---

## MODULE 9: A/B TESTING MODELS

*Safely comparing model versions in production before full rollout.*

### Narrative

Hassan insists:

> **HASSAN:** "No model goes to 100% of devices without proof it is better than what is running now. We had a model drift incident in 2024. Power grid predictions were 15% off for three weeks before anyone noticed. That cost $4.2 million. Never again."

The student builds an A/B testing framework. A new model version shows 2.3% improvement in a canary test across 50 devices. After statistical validation, it rolls out globally.

> **COLE:** (from the field) "The new model caught a bearing failure 6 hours earlier than the old one. That is real impact."

**Unique content:** The student implements traffic splitting (routing requests to different model versions), statistical significance testing (knowing when results are meaningful), canary deployments (gradual rollout with automatic rollback), and multi-armed bandits (adaptive traffic allocation that automatically favors the better-performing model).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Why A/B Test Models? | Validating improvements before full rollout | Feature flags - toggling for subsets of users |
| 2 | Traffic Splitting | Routing requests to different model versions | Canary deployments with load balancer routing |
| 3 | Statistical Significance | Knowing when results are meaningful | Analytics confidence intervals |
| 4 | Canary Deployments | Gradual rollout with automatic rollback | Canary releases for frontend apps |
| 5 | Multi-Armed Bandits | Adaptive traffic allocation | Dynamic ad rotation - allocating to best performers |

**FE BRIDGE (Module-Level):** A/B testing models is feature flags. In frontend development, feature flags let you deploy new code but only enable it for a subset of users - you measure the impact, and if the new version is better, you roll it out to everyone. If it is worse, you kill the flag and no one notices. A/B testing models works identically: deploy a new model version to a subset of edge devices, measure performance, and only promote to full rollout after statistical validation.

### GITHUB

**Commit:** `feat(m9): A/B testing framework with canary deployments`
**Branch:** `module-09/ab-testing`

**Cliffhanger:** The AutoML pipeline generates a model architecture nobody on the team understands. It outperforms everything they have built by hand.

---

## MODULE 10: SCALE & RELIABILITY

*Running ML at global scale without breaking.*

### Narrative

A simulated stress test. GRID reports:

> **GRID:** "Simulating simultaneous sensor anomalies across 3 regions. Total affected devices: 12,400. Initiating cascade response protocol."

The student watches the system scale, route, and respond. Some edge devices lose connectivity - the system degrades gracefully. Models fall back to cached predictions. When connectivity returns, they sync and update.

> **HASSAN:** "Everything fails eventually. The question is: does it fail well?"

**Unique content:** The student implements scaling strategies (horizontal and vertical for ML systems), model sharding (splitting models across devices), failover and redundancy (graceful degradation when components fail), load management (handling traffic spikes and batch processing), and global operations (managing ML across time zones and regions).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Scaling Strategies | Horizontal and vertical scaling for ML | Auto-scaling web servers |
| 2 | Model Sharding | Splitting models across devices | Dynamic `import()` chunks - code splitting for models |
| 3 | Failover & Redundancy | Graceful degradation when components fail | Error boundaries and fallback UI |
| 4 | Load Management | Handling traffic spikes and batch processing | Rate limiting and request queuing |
| 5 | Global Operations | Managing ML across time zones and regions | CDN multi-region deployment |

### GITHUB

**Commit:** `feat(m10): global scale with failover and redundancy`
**Branch:** `module-10/scale-reliability`

**Cliffhanger:** A security audit reveals that an adversarial sensor reading could trick the model into ignoring a critical equipment failure.

---

## MODULE 11: CAPSTONE - TERRA GRID INTELLIGENCE

*Full global deployment of the edge AI system across 47 sites.*

### Narrative

The final deployment. Terra Grid Intelligence goes live across all 47 sites, all regions, all 12,400 edge devices. The system represents everything built across 10 modules: the optimized model (quantized, pruned, distilled), the edge deployment pipeline, the MLOps automation, the monitoring and drift detection, the federated learning, the A/B testing, and the global reliability layer.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | System Architecture Review | Reviewing the complete design | Architecture decision records |
| 2 | Security Hardening | Final security review and hardening | Security audit checklist (OWASP) |
| 3 | Disaster Recovery | Planning for the worst case | Backup and restore procedures |
| 4 | Documentation & Runbooks | Operational documentation for the team | Runbook and playbook creation |
| 5 | Global Launch | Deploying Terra Grid Intelligence worldwide | Production launch with monitoring |

### CONSEQUENCE

Two days after full deployment, the system proves its worth. A cascading anomaly: a temperature spike at a power substation triggers a chain of sensor alerts across three connected regions. The old system would have generated thousands of individual alerts, each requiring manual investigation.

Terra Grid Intelligence correlates them in seconds.

> **GRID:** "Cascade event detected. Origin: Substation 7-Alpha, Region 3. Temperature anomaly propagating to connected infrastructure in Regions 3, 4, and 7. Root cause analysis: cooling system failure at primary substation. Affected devices: 2,847. Nearest field team: Cole Branson, 47 minutes out. Dispatching."

> **JIN:** "The model identified the root cause in 11.7 seconds. Manual analysis of the same event would have taken 2-3 hours and generated 4,000+ individual alerts."

> **HASSAN:** "And by then, the cascade would have reached the residential grid. Cole - status?"

> **COLE:** (from the field, en route) "I see the alert. On my way. The model is right - cooling pump failure, classic signature. ETA 47 minutes. The backup system should hold until I get there."

> **GRID:** "Incident timeline: Time to detection: 4.2 seconds. Time to root cause: 11.7 seconds. Time to response dispatch: 23 seconds. Model: Terra Grid Intelligence v1.0. Inference latency: 89ms. Model size: 4.2MB. Running on 12,400 edge devices across 47 sites. All systems nominal."

Hassan watches the dashboard. The cascade stabilizes. Cole arrives and replaces the cooling pump. The infrastructure holds.

> **HASSAN:** (quietly) "This is what it looks like when the system works."

### GITHUB

**Commit:** `feat(m11): Terra Grid Intelligence v1.0 - global deployment across 47 sites`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/terra-grid-intelligence`

---

## AI-Wrong Moments

These are specific narrative beats where Terra Grid Intelligence fails, teaching the team (and the learner) that production ML systems must be robust against real-world conditions.

1. **M3 - Quantization Misses a Bearing Failure:** The quantized model hits 97.2% accuracy overall - within acceptable thresholds. But at Site 23, it misses a bearing failure and the turbine seizes. The quantization reduced precision in exactly the frequency range where bearing vibration signatures live. Cole: "97.2% accuracy means nothing to the turbine that seized. The 2.8% is not distributed randomly - it clusters in the failure modes that matter most." The team learns that aggregate accuracy can hide critical failures in specific categories.

2. **M7 - A/B Test Winner Trained on Stale Data:** The A/B test results show Model B outperforming Model A by 12%. The team almost promotes it to production. Then Park discovers Model B was trained on data from a decommissioned site - data that no longer reflects current operating conditions. The model performs well on the test set because the test set is also stale. Hassan: "The model is not better. The benchmark is wrong."

3. **M10 - Adversarial Sensor Bypass:** A security audit reveals that carefully crafted adversarial sensor readings can trick the anomaly detection model into classifying a genuine equipment failure as normal operation. Jin demonstrates: "I can make the model ignore a cooling system failure by adding a specific noise pattern to the temperature sensor. The model sees 'normal.' The equipment overheats." The team implements adversarial input validation as a critical safety layer.

---

## Character Arcs - Dr. Nina Park (Skeptic)

Park's arc traces a data engineer who starts by viewing ML as overhyped and gradually becomes a champion of MLOps - not because she fell in love with models, but because she found the engineering discipline that makes ML actually work.

1. **M3 - "99.2% accuracy should be enough."** Park is skeptical of the optimization effort. The model works in the lab. Why spend weeks compressing it? Her background is in data infrastructure, not model development. She views the optimization as unnecessary polish on a working system.

2. **M5 - Deployment Reality:** Park watches Jin struggle with model latency in the field - a model that runs in 200ms on her workstation takes 8 seconds on the edge device. She realizes that deployment is not a footnote; it is the entire challenge. "I have been building pipelines that deliver data to models. I never thought about delivering the models themselves."

3. **M7 - Writing Deployment Scripts:** After the drift incident in Module 7, Park starts writing deployment scripts herself. She builds the automated retraining pipeline and insists on human-in-the-loop gates at every promotion step. "I trust automation for retraining. I do not trust automation for deployment. A human reviews every model before it touches production."

4. **M11 - The Conference Talk:** In the capstone, Park presents the team's MLOps pipeline at an infrastructure reliability conference. She has become the team's strongest advocate for treating ML systems as production software - versioned, tested, monitored, and maintained. "The model is 5% of the work. The pipeline is the other 95%. And the pipeline is what keeps the lights on."

---

## World-Specific Terminology

| Term | In-World Meaning | ML Meaning |
|---|---|---|
| Sector | Geographic region of the grid | Data partition / deployment region |
| Node | Edge device or sensor station | Edge compute device |
| Feed | Sensor data stream | Input data pipeline |
| Heartbeat | Regular device health check | Model health ping / liveness probe |
| Grid Load | System utilization level | Inference throughput |
| Brownout | Partial system degradation | Model performance degradation |
| Blackout | Complete system failure | Model failure / outage |
| Dispatch | Sending response team or command | Model deployment push |
| Firmware | Edge device software | Model runtime environment |
| Telemetry | Operational data from devices | Model metrics and logging |
| Baseline | Normal operating parameters | Reference model performance |
| Threshold | Alert trigger level | Decision boundary / confidence cutoff |
| Cycle | Regular maintenance period | Retraining schedule |
| Cascade | Chain of connected failures | Error propagation across systems |
| Hardening | Improving system resilience | Adversarial robustness improvements |
