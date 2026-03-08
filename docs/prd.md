# TensorCraft PRD v3.2

> **Product Requirements Document — Version 3.2**
> Last updated: 2026-03-08

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [Product Requirements](#3-product-requirements)
4. [Feature Requirements](#4-feature-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Design System](#6-design-system)
7. [Release Plan](#7-release-plan)
8. [Pricing](#8-pricing)
9. [Go-to-Market](#9-go-to-market)
10. [Risks](#10-risks)
11. [Appendix](#11-appendix)

---

## 1. Executive Summary

TensorCraft is an interactive, browser-based learning platform that teaches machine learning concepts to front-end developers through themed, hands-on coding lessons. By mapping ML concepts to familiar front-end paradigms (the "FE-to-ML bridge"), TensorCraft lowers the barrier to entry and accelerates comprehension for a population of developers who already possess strong JavaScript, CSS, and DOM-manipulation skills but lack exposure to data science, linear algebra, and model training.

### Vision

Every front-end developer should be able to build, train, and deploy ML models with the same confidence they ship React components.

### Mission

Deliver a gamified, project-based curriculum that meets FE developers where they are — in the browser, in JavaScript, with visual feedback — and guides them from zero ML knowledge to production-ready skills across five thematic learning tracks.

### Success Metrics

| Metric | V0.5 Target | V1.0 Target |
|---|---|---|
| Lesson completion rate | >= 60% | >= 75% |
| Theme enrollment (free) | 2,000 users | 10,000 users |
| Paid conversion rate | 3% | 6% |
| NPS score | >= 40 | >= 55 |
| Average lessons per week per active user | 2.5 | 3.5 |
| Time-to-first-model (minutes) | <= 30 | <= 20 |
| Monthly recurring revenue (MRR) | $5,000 | $30,000 |
| 30-day retention | 35% | 50% |

---

## 2. User Personas

### Persona 1: Career Pivoter — "Sam"

- **Age:** 29
- **Role:** Mid-level front-end developer (3 years React, 1 year Vue)
- **Goal:** Transition into an ML engineering or ML-adjacent role within 12 months
- **Frustration:** Traditional ML courses assume Python fluency and math backgrounds; Sam bounces off after Week 2
- **Jobs to be Done:**
  1. Learn ML fundamentals without abandoning JavaScript
  2. Build a portfolio of ML projects that complement existing FE work
  3. Gain enough vocabulary to pass ML screening interviews
- **Willingness to pay:** $20–$30/month for a clear career path

### Persona 2: Product Builder — "Priya"

- **Age:** 34
- **Role:** Senior front-end engineer / tech lead at a SaaS startup
- **Goal:** Add on-device ML features (e.g., smart search, recommendation widgets) to her team's product without hiring a dedicated ML engineer
- **Frustration:** TensorFlow.js docs are reference-heavy but lack guided, project-based learning; hard to know what is production-ready vs. experimental
- **Jobs to be Done:**
  1. Evaluate which ML models can run in-browser with acceptable latency
  2. Prototype an ML-powered feature and present it to stakeholders
  3. Understand trade-offs between on-device and server-side inference
- **Willingness to pay:** $40–$50/month or team license; expense-able through employer

### Persona 3: Curious Tinkerer — "Leo"

- **Age:** 22
- **Role:** Junior developer, recent bootcamp graduate, freelance side projects
- **Goal:** Explore ML out of curiosity; build cool demos to post on social media
- **Frustration:** Overwhelmed by the breadth of ML; wants a guided, playful experience rather than a textbook
- **Jobs to be Done:**
  1. Complete bite-sized lessons during commute or lunch break
  2. Share visually impressive results on Twitter/LinkedIn
  3. Decide whether ML is worth deeper investment before committing to a paid course
- **Willingness to pay:** Free tier initially; may convert to $15/month if hooked

---

## 3. Product Requirements

### 3.1 Themes

TensorCraft organizes its curriculum into five thematic worlds. Each theme wraps a core ML syllabus in a domain-specific narrative, dataset, and set of projects. Learners choose a theme at onboarding and can switch or run multiple themes in parallel.

| # | Theme | World | Specialization | Primary Model Types | V0.5 Status |
|---|---|---|---|---|---|
| 1 | Deep Orbit | Space exploration | Autonomous navigation & anomaly detection | CNN, Autoencoder, RL (DQN) | **Launch theme** |
| 2 | Pixel Alchemist | Generative art | Style transfer & image synthesis | GAN, VAE, Neural Style Transfer | Coming soon |
| 3 | Lingua Forge | Language & NLP | Text generation & sentiment analysis | RNN, LSTM, Transformer (small) | Coming soon |
| 4 | Synth Weaver | Audio & music | Sound classification & synthesis | WaveNet (lite), Spectrogram CNN | Coming soon |
| 5 | Data Nomad | Tabular / structured data | Prediction & recommendation | Decision Tree, XGBoost (JS), kNN | Coming soon |

### 3.2 Curriculum Structure

Each theme contains **11 modules** with **5 lessons per module**, totaling **55 lessons per theme** and **275 lessons across all five themes**.

#### Content Split per Lesson

| Segment | Duration | Description |
|---|---|---|
| Concept introduction | 3–5 min | Illustrated explainer with FE-to-ML bridge analogy |
| Guided coding | 8–12 min | Step-by-step editor exercise with inline hints |
| Free exploration | 5–8 min | Open sandbox to modify parameters and observe results |
| Checkpoint quiz | 2–3 min | 3–5 questions validating understanding |
| Debrief & bridge | 2–3 min | Recap + explicit link back to FE equivalent concept |

**Estimated total time per lesson:** 20–30 minutes
**Estimated total time per module:** 100–150 minutes
**Estimated total time per theme:** 1,100–1,650 minutes (~18–27 hours)

### 3.3 The 5C Lesson Loop

Every lesson follows the **5C pedagogical loop**, with five variations depending on lesson position within a module.

| Step | Name | Description | Variations by Position |
|---|---|---|---|
| 1 | **Context** | Set the scene within the theme narrative; state the learning objective | Lesson 1 of module: extended world-building intro; Lessons 2–4: brief recap + new objective; Lesson 5 (capstone): project brief |
| 2 | **Concept** | Teach the ML idea using the FE-to-ML bridge | Odd lessons: analogy-first; Even lessons: code-first |
| 3 | **Code** | Hands-on editor exercise | Lessons 1–3: scaffolded (fill-in-the-blank); Lesson 4: guided (fewer hints); Lesson 5: open (build from scratch) |
| 4 | **Check** | Assessment checkpoint | Lessons 1–4: inline quiz; Lesson 5: project rubric + automated tests |
| 5 | **Connect** | Tie ML concept back to FE world; preview next lesson | All lessons: bridge card + "What's next" teaser |

#### Variation Frequency

| Variation | Frequency | Description |
|---|---|---|
| Intro lesson | 1 per module (Lesson 1) | Heavy narrative context, maximum scaffolding |
| Standard odd | 2 per module (Lessons 3, 5*) | Analogy-first concept delivery |
| Standard even | 2 per module (Lessons 2, 4) | Code-first concept delivery |
| Guided lesson | 1 per module (Lesson 4) | Reduced hints to build independence |
| Capstone | 1 per module (Lesson 5) | Project-based, open-ended, rubric-assessed |

*Lesson 5 uses analogy-first framing but capstone structure for the Code and Check steps.

### 3.4 Assessment System

| # | Component | Description | Trigger |
|---|---|---|---|
| 1 | **Inline quiz** | 3–5 multiple-choice or short-answer questions embedded after the Concept step | End of every non-capstone lesson |
| 2 | **Code checkpoint** | Automated test suite that validates the learner's code output against expected results | End of the Code step in every lesson |
| 3 | **Capstone rubric** | Multi-criteria rubric (correctness, code quality, creativity) scored 0–3 per criterion | End of every module (Lesson 5) |
| 4 | **Progress diagram** | Visual map of all modules and lessons showing completion state (locked, available, in-progress, complete, capstone-complete) | Always visible on dashboard |
| 5 | **Streak tracker** | Consecutive-day and consecutive-week counters with badge rewards | Updated on each lesson completion |
| 6 | **Skill radar** | Radar chart showing proficiency across 6 axes: Data Prep, Model Architecture, Training, Evaluation, Deployment, FE Integration | Updated after each module completion |

### 3.5 FE-to-ML Bridges

The bridge system is TensorCraft's core differentiator. Each ML concept is paired with a familiar FE concept to accelerate understanding.

| # | ML Concept | FE Equivalent | Connection |
|---|---|---|---|
| 1 | Tensor | Multidimensional Array | "A tensor is just a nested array with shape metadata — like a typed array buffer you already use in WebGL." |
| 2 | Forward pass | Event propagation (capture phase) | "Data flows through layers the same way an event propagates down the DOM — parent to child, transformed at each node." |
| 3 | Backpropagation | Event bubbling | "Gradients flow backward through the network like an event bubbling up — each layer adjusts based on what it receives from below." |
| 4 | Loss function | Diff algorithm | "The loss function computes how far off your prediction is, just like React's diffing algorithm computes the minimal set of DOM changes." |
| 5 | Learning rate | CSS transition-duration | "Learning rate controls step size during optimization — too fast and you overshoot, too slow and you never converge. Same trade-off as tuning transition-duration." |
| 6 | Epoch | Re-render cycle | "One epoch is one full pass through the data, like one complete re-render cycle where every component updates." |
| 7 | Overfitting | Over-engineering a component | "Overfitting is when your model memorizes training data instead of generalizing — like building a hyper-specific component that only works for one page." |
| 8 | Regularization | Code linting / constraints | "Regularization penalizes complexity to prevent overfitting, just like lint rules constrain your code to prevent bad patterns." |
| 9 | Convolutional layer | CSS grid / filter | "A conv layer slides a small kernel over input data — same mental model as a CSS blur or sharpen filter sliding over pixels." |
| 10 | Activation function | CSS clamp() | "An activation function squashes values into a range, just like clamp() constrains a value between a min and max." |

---

## 4. Feature Requirements

### 4.1 Theme Selection Screen

The entry point where learners browse, preview, and enroll in themes.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | Launched theme cards | P0 | Display launched themes (V0.5: Deep Orbit only) as fully interactive cards with title, world illustration, specialization tagline, lesson count, estimated duration, and "Start Learning" CTA |
| 2 | Coming soon cards | P0 | Display upcoming themes (Pixel Alchemist, Lingua Forge, Synth Weaver, Data Nomad) as visually distinct cards with a blurred or dimmed preview illustration, "Coming Soon" badge, and "Notify Me" CTA |
| 3 | Email capture | P1 | Clicking "Notify Me" opens a minimal modal or inline form capturing email address; stored in mailing list segmented by theme interest |
| 4 | Responsive layout | P0 | Grid adapts from 3-column (desktop) to 2-column (tablet) to single-column stacked (mobile); cards maintain aspect ratio |
| 5 | Status-driven rendering | P1 | Card appearance (CTA text, illustration treatment, badge) is driven by a `status` field (`launched`, `coming_soon`, `beta`) in the theme config; no hard-coded conditionals per theme |

### 4.2 Lesson Experience

The core learning interface where users read, code, and interact.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | Desktop three-column layout | P0 | Left panel: lesson narrative (scrollable); Center panel: code editor; Right panel: live preview / model output canvas |
| 2 | Mobile tabbed layout | P0 | On viewports < 768px, collapse three columns into a tabbed interface: "Learn" / "Code" / "Preview" tabs |
| 3 | Code editor | P0 | Embedded Monaco-based editor with syntax highlighting, autocompletion, and theme-aware color scheme; supports JavaScript and TypeScript |
| 4 | FE bridge sidebar | P1 | Collapsible sidebar (or drawer on mobile) showing the current lesson's FE-to-ML bridge card with analogy, visual diagram, and link to the related FE concept |
| 5 | Checkpoint integration | P0 | At designated points in the lesson, the editor locks and a checkpoint panel slides in from the right, presenting the quiz or code test; learner must pass to proceed |
| 6 | Hint system | P1 | Progressive hints (up to 3 per exercise) revealed on demand; each hint reduces the maximum score for that exercise by 10% |
| 7 | Automated tests | P0 | Each coding exercise includes a test suite (Jest-compatible) that runs in a sandboxed iframe; results displayed inline with pass/fail indicators |
| 8 | Debrief panel | P1 | After completing all steps, a debrief panel summarizes: concepts learned, bridge takeaway, time spent, score, and a "Next Lesson" CTA |

### 4.3 Progress Diagram

A visual map of the learner's journey through a theme.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | Node-graph style | P0 | Render modules as nodes connected by directional edges; lessons within a module shown as sub-nodes or dots along the edge |
| 2 | State coloring | P0 | Nodes use four visual states: locked (grey, no interaction), available (theme accent, pulsing border), in-progress (theme accent, filled 50%), complete (theme accent, filled 100%, checkmark icon) |
| 3 | Click to navigate | P0 | Clicking an available or in-progress node navigates to that lesson; clicking a complete node opens a review/replay mode |
| 4 | Share snapshot | P2 | "Share Progress" button generates a branded PNG or SVG of the current diagram state for social sharing |
| 5 | Reduced motion | P1 | Respect `prefers-reduced-motion`; disable pulsing borders and animated transitions when set |

### 4.4 GitHub Integration

Allow learners to persist their project code in a GitHub repository.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | GitHub OAuth | P1 | Support "Sign in with GitHub" via OAuth 2.0 PKCE flow; request `repo` and `read:user` scopes |
| 2 | Auto-commit on checkpoint | P1 | After each successful checkpoint, auto-commit the learner's code to a branch named `tensorcraft/<theme>/<module>-<lesson>` in their connected repo |
| 3 | Opt-out toggle | P2 | Settings toggle to disable auto-commit; code is still saved server-side regardless |
| 4 | Repo creation | P2 | If no repo is connected, prompt to create a new repo named `tensorcraft-projects` under the user's GitHub account |

### 4.5 Payments

Monetization layer supporting free and paid tiers.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | Payment processor | P0 | Integrate Stripe for subscription billing; support credit card and Google Pay / Apple Pay |
| 2 | Tier definitions | P0 | Three tiers: **Free** ($0 — first 2 modules of one theme), **Pro** ($19/month or $149/year — all modules, all themes, GitHub integration), **Team** ($39/seat/month — Pro features + admin dashboard, seat management, progress reports) |
| 3 | Purchasing-power parity (PPP) | P1 | Apply automatic regional discounts (up to 60% off) based on IP geolocation using a PPP index table; display original and discounted price |
| 4 | Upgrade prompts | P1 | When a free-tier user reaches the paywall (end of Module 2), show an in-context upgrade modal with benefit comparison, testimonial, and a 7-day free trial CTA |
| 5 | Webhook handling | P0 | Listen for Stripe webhooks (`invoice.paid`, `customer.subscription.deleted`, `charge.failed`) to update user entitlements in real time |

### 4.6 Analytics

Track learning behavior, engagement, and conversion events.

#### Learning Events

| Event | Payload |
|---|---|
| `lesson_started` | `userId`, `themeId`, `moduleId`, `lessonId`, `timestamp` |
| `lesson_completed` | `userId`, `themeId`, `moduleId`, `lessonId`, `score`, `duration`, `hintsUsed`, `timestamp` |
| `checkpoint_passed` | `userId`, `lessonId`, `checkpointType` (`quiz` or `code`), `score`, `attempts`, `timestamp` |
| `capstone_submitted` | `userId`, `moduleId`, `rubricScores`, `totalScore`, `timestamp` |

#### Conversion Events

| Event | Payload |
|---|---|
| `paywall_hit` | `userId`, `themeId`, `moduleId`, `timestamp` |
| `upgrade_modal_shown` | `userId`, `themeId`, `source` (`paywall`, `settings`, `banner`), `timestamp` |
| `subscription_started` | `userId`, `tier`, `price`, `pppDiscount`, `timestamp` |
| `subscription_cancelled` | `userId`, `tier`, `reason`, `timestamp` |

#### Engagement Events

| Event | Payload |
|---|---|
| `theme_selected` | `userId`, `themeId`, `timestamp` |
| `progress_shared` | `userId`, `themeId`, `platform` (`twitter`, `linkedin`, `download`), `timestamp` |
| `streak_achieved` | `userId`, `streakType` (`daily`, `weekly`), `count`, `timestamp` |
| `hint_requested` | `userId`, `lessonId`, `hintNumber`, `timestamp` |

#### Derived Metrics (Computed Daily)

| Metric | Computation |
|---|---|
| Lesson completion rate | `lesson_completed` / `lesson_started` per cohort |
| Avg. time per lesson | Mean `duration` from `lesson_completed` |
| Hint dependency ratio | `hint_requested` count / `lesson_completed` count |
| Paywall conversion rate | `subscription_started` / `paywall_hit` |
| 7-day retention | Users with `lesson_started` on day 1 AND day 7+ |
| 30-day retention | Users with `lesson_started` on day 1 AND day 30+ |

---

## 5. Technical Architecture

### 5.1 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components by default; client components for interactive panels |
| Language | TypeScript 5.x | Strict mode enabled; no `any` types in production code |
| Styling | Tailwind CSS 4 + CSS Modules | Tailwind for utility-first layout; CSS Modules for theme-specific overrides |
| State management | Zustand | Lightweight; used for editor state, lesson progress, and UI toggles |
| ML runtime | TensorFlow.js (tfjs-core + tfjs-layers) | Runs models in-browser via WebGL backend; WASM fallback for unsupported GPUs |
| Code editor | Monaco Editor (via @monaco-editor/react) | Shared configuration across themes; custom tokenizer for ML-specific keywords |
| API layer | Next.js Route Handlers + tRPC | Type-safe API contracts between client and server |
| Database | PlanetScale (MySQL) via Prisma ORM | Serverless-friendly; row-level security for multi-tenant data |
| Auth | NextAuth.js v5 | Providers: GitHub OAuth, email magic link, Google OAuth |
| Hosting | Vercel | Edge functions for PPP lookup; ISR for lesson content pages |

### 5.2 Packages (Monorepo)

| Package | Path | Description |
|---|---|---|
| `@tensorcraft/web` | `apps/web` | Next.js application — all user-facing pages and API routes |
| `@tensorcraft/ui` | `packages/ui` | Shared component library (buttons, cards, modals, editor wrapper) |
| `@tensorcraft/ml-sandbox` | `packages/ml-sandbox` | Sandboxed iframe environment for running learner code + TensorFlow.js models |
| `@tensorcraft/content` | `packages/content` | MDX lesson files, theme configs, quiz data, and bridge cards |
| `@tensorcraft/db` | `packages/db` | Prisma schema, migrations, seed scripts, and database utilities |
| `@tensorcraft/analytics` | `packages/analytics` | Event tracking client (wraps Segment / PostHog) with typed event definitions |
| `@tensorcraft/config` | `packages/config` | Shared ESLint, TypeScript, Tailwind, and Prettier configurations |
| `@tensorcraft/tests` | `packages/tests` | End-to-end (Playwright) and integration test suites |

### 5.3 Content Pipeline

Lesson content is authored in **MDX** files stored in the `@tensorcraft/content` package. Each lesson file contains:

- Front matter (YAML): `themeId`, `moduleId`, `lessonId`, `title`, `objectives`, `bridgeConcept`, `estimatedMinutes`, `prerequisites`
- Body (MDX): narrative text, embedded code blocks (with `runnable` and `editable` flags), quiz components (`<Quiz>`, `<MultipleChoice>`, `<CodeChallenge>`), and bridge cards (`<BridgeCard>`)
- Assets: referenced images and diagrams stored in a co-located `assets/` directory, optimized at build time via `next/image`

A **build step** compiles MDX to serialized React components and generates a manifest file (`lesson-manifest.json`) used by the front end to render the progress diagram and handle lesson navigation.

### 5.4 Rendering Strategy

| Page Type | Strategy | Cache TTL | Notes |
|---|---|---|---|
| Marketing / landing | SSG (Static Site Generation) | Indefinite (rebuild on deploy) | Fastest possible TTFB |
| Theme selection | ISR (Incremental Static Regeneration) | 60 seconds | Reflects theme status changes (e.g., new launch) within 1 minute |
| Lesson page (narrative) | ISR | 300 seconds | Content changes are infrequent; 5-minute staleness is acceptable |
| Lesson page (editor + preview) | CSR (Client-Side Rendering) | N/A | Heavy interactivity; hydrated on mount |
| Dashboard / progress | SSR (Server-Side Rendering) | 0 (no cache) | Must reflect real-time progress |
| API routes | Edge Functions | N/A | Low-latency for PPP lookup and analytics ingestion |

### 5.5 Mobile Breakpoints

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, stacked cards, tabbed lesson view |
| Tablet | 640px – 1023px | Two-column grid, side-by-side editor + preview |
| Desktop | 1024px – 1439px | Three-column lesson layout |
| Wide | >= 1440px | Three-column with expanded sidebar |

#### Testing Devices

| Device | OS | Viewport |
|---|---|---|
| iPhone 14 Pro | iOS 17 | 393 x 852 |
| iPhone SE (3rd gen) | iOS 17 | 375 x 667 |
| Pixel 7 | Android 14 | 412 x 915 |
| Samsung Galaxy S23 | Android 14 | 360 x 780 |
| iPad Air (5th gen) | iPadOS 17 | 820 x 1180 |
| iPad Pro 12.9" | iPadOS 17 | 1024 x 1366 |
| MacBook Air 13" | macOS | 1440 x 900 |
| Dell XPS 15 | Windows 11 | 1920 x 1200 |

---

## 6. Design System

### 6.1 Theme Colors

Each theme has a distinct color palette. Colors are defined as CSS custom properties and toggled via a `data-theme` attribute on `<html>`.

| Theme | Primary | Secondary | Accent | Background | Surface |
|---|---|---|---|---|---|
| Deep Orbit | `#0B1E3F` (navy) | `#1A3A6B` (steel blue) | `#00E5A0` (aurora green) | `#060E1F` (void black) | `#0F2A4A` (deep panel) |
| Pixel Alchemist | `#3B0764` (royal purple) | `#7C3AED` (vivid violet) | `#F472B6` (hot pink) | `#1A0030` (ink black) | `#2D0555` (plum panel) |
| Lingua Forge | `#1E3A28` (forest green) | `#2D6A4F` (emerald) | `#FFD166` (amber) | `#0A1F12` (deep moss) | `#163020` (leaf panel) |
| Synth Weaver | `#1A1A2E` (midnight) | `#16213E` (dark slate) | `#E94560` (neon red) | `#0F0F1A` (abyss) | `#1F1F35` (synth panel) |
| Data Nomad | `#2B2D42` (charcoal) | `#8D99AE` (cool grey) | `#EF8354` (burnt orange) | `#1B1D2E` (slate black) | `#23253A` (data panel) |

### 6.2 Typography

| Element | Font | Weight | Size (desktop) | Size (mobile) | Line Height |
|---|---|---|---|---|---|
| H1 (page title) | Inter | 800 (Extra Bold) | 2.5rem (40px) | 1.75rem (28px) | 1.2 |
| H2 (section title) | Inter | 700 (Bold) | 2rem (32px) | 1.5rem (24px) | 1.25 |
| H3 (subsection) | Inter | 600 (Semi Bold) | 1.5rem (24px) | 1.25rem (20px) | 1.3 |
| Body | Inter | 400 (Regular) | 1rem (16px) | 1rem (16px) | 1.6 |
| Code | JetBrains Mono | 400 (Regular) | 0.875rem (14px) | 0.8125rem (13px) | 1.5 |
| Caption / label | Inter | 500 (Medium) | 0.75rem (12px) | 0.75rem (12px) | 1.4 |
| Button | Inter | 600 (Semi Bold) | 0.875rem (14px) | 0.875rem (14px) | 1.0 |

---

## 7. Release Plan

| Version | Codename | Scope | Target Date | Gate Criteria |
|---|---|---|---|---|
| V0.5 | Ignition | Deep Orbit theme (Modules 1–3, 15 lessons); free tier only; basic progress diagram; no payments | 2026-Q2 | 500 beta sign-ups; lesson completion rate >= 50% in internal testing |
| V1.0 | Liftoff | Deep Orbit full (all 11 modules, 55 lessons); Pro tier + Stripe payments; GitHub integration; skill radar | 2026-Q3 | 2,000 free users; 3% conversion to Pro; NPS >= 40 |
| V2.0 | Constellation | Add Pixel Alchemist + Lingua Forge themes; Team tier; admin dashboard; PPP pricing | 2027-Q1 | 10,000 free users; $30K MRR; 30-day retention >= 45% |
| V3.0 | Galaxy | Add Synth Weaver + Data Nomad themes; mobile app (React Native); offline lesson caching | 2027-Q3 | 25,000 free users; $80K MRR; 5 themes fully authored |
| V4.0 | Nebula | AI tutor (LLM-assisted hints); community features (forums, code reviews); advanced analytics dashboard | 2028-Q1 | 50,000 free users; $150K MRR; AI tutor beta positive feedback >= 70% |
| V5.0 | Universe | Certification program; employer partnerships; custom theme SDK for third-party content | 2028-Q3 | 100,000 free users; $250K MRR; at least 2 employer partnerships signed |
| i18n | Babel | Localization: Spanish, Portuguese, Japanese, Hindi; RTL support for future Arabic/Hebrew | 2028-Q4 | Community translation volunteers onboarded; i18n framework integrated by V3.0 |

### V0.5 Content Calendar

| Week | Milestone | Deliverable |
|---|---|---|
| Week 1–2 | Module 1 authoring | 5 lessons: Tensors, Shapes, Operations, Data Loading, Normalization |
| Week 3–4 | Module 2 authoring | 5 lessons: Layers, Activations, Forward Pass, Loss Functions, Gradient Descent |
| Week 5–6 | Module 3 authoring | 5 lessons: CNN Basics, Kernels, Pooling, Feature Maps, Image Classification Capstone |
| Week 7 | Integration testing | Full walkthrough of 15 lessons; fix content bugs; accessibility audit |
| Week 8 | Beta launch | Deploy to `beta.tensorcraft.dev`; invite 500 waitlist users |

---

## 8. Pricing

### Tier Comparison

| Feature | Free | Pro ($19/mo or $149/yr) | Team ($39/seat/mo) |
|---|---|---|---|
| Themes accessible | 1 | All 5 | All 5 |
| Modules per theme | 2 | 11 | 11 |
| Lessons accessible | 10 | 55 per theme | 55 per theme |
| Code editor | Yes | Yes | Yes |
| FE-to-ML bridge cards | Yes | Yes | Yes |
| GitHub integration | No | Yes | Yes |
| Skill radar | No | Yes | Yes |
| Progress sharing | No | Yes | Yes |
| Streak badges | Basic | Premium + custom | Premium + custom |
| Admin dashboard | No | No | Yes |
| Seat management | No | No | Yes |
| Team progress reports | No | No | Yes |
| Priority support | No | Email | Email + Slack |
| PPP discount eligible | N/A | Yes (up to 60%) | Yes (up to 40%) |

### Revenue Projections

| Period | Free Users | Pro Subscribers | Team Seats | MRR | ARR |
|---|---|---|---|---|---|
| Y1 (end) | 15,000 | 600 | 80 | $14,520 | $174,240 |
| Y2 (end) | 45,000 | 2,200 | 350 | $50,500 | $606,000 |
| Y3 (end) | 100,000 | 5,000 | 900 | $130,100 | $1,561,200 |

| Cumulative Revenue | Low Estimate | Mid Estimate | High Estimate |
|---|---|---|---|
| Year 1 | $500,000 | $700,000 | $900,000 |
| Year 2 | $1,500,000 | $2,100,000 | $2,800,000 |
| Year 3 | $3,200,000 | $4,500,000 | $6,000,000 |
| 3-Year Cumulative | $5,200,000 | $7,300,000 | $9,700,000 |

---

## 9. Go-to-Market

### 9.1 SEO Strategy

- **Primary keywords:** "learn machine learning JavaScript", "TensorFlow.js tutorial", "ML for front-end developers", "machine learning for web developers"
- **Content marketing:** Publish 2 blog posts per week on `tensorcraft.dev/blog` covering FE-to-ML bridge concepts, beginner ML guides, and project showcases
- **Technical SEO:** SSG landing pages with structured data (Course schema); optimized Core Web Vitals targeting LCP < 2.5s, CLS < 0.1, INP < 200ms
- **Backlink strategy:** Guest posts on Smashing Magazine, CSS-Tricks, Dev.to; open-source bridge card library on GitHub

### 9.2 Launch Strategy

- **Beta (V0.5):** Invite-only via waitlist; 500 users; collect feedback via in-app survey and Discord channel
- **Public launch (V1.0):** Product Hunt launch; Hacker News "Show HN" post; Twitter/X thread by founder; email blast to waitlist
- **Launch week events:** Daily live-coding sessions on YouTube/Twitch demonstrating one module per day; AMA on Reddit r/learnprogramming

### 9.3 Paid Acquisition

- **Channels:** Google Ads (search), Twitter/X Ads, Reddit Ads (r/javascript, r/machinelearning), YouTube pre-roll
- **Budget:** $5,000/month for V1.0 launch quarter; scale to $15,000/month if CAC < $30
- **Target CAC:** $20–$30 for Pro subscriber; $60–$80 for Team seat
- **LTV:CAC ratio target:** >= 3:1

### 9.4 Organic & Community

- **Discord community:** Free for all users; channels per theme; weekly office hours with curriculum authors
- **Social sharing:** Built-in "Share Progress" generates branded images; incentivize sharing with bonus streak days
- **Referral program:** Refer 3 friends who sign up => 1 month Pro free; tracked via unique referral codes
- **Conference presence:** Sponsor or present at JSConf, React Summit, and ML-adjacent meetups

---

## 10. Risks

| # | Risk | Severity | Likelihood | Impact | Mitigation |
|---|---|---|---|---|---|
| 1 | TensorFlow.js performance on low-end devices | High | Medium | Learners on budget hardware experience laggy model training, leading to drop-off | Implement WASM fallback; offer "lite" model variants with smaller architectures; add performance warning + recommended specs |
| 2 | Content authoring bottleneck | High | High | 275 lessons across 5 themes requires significant writing effort; delays entire roadmap | Hire 2 dedicated curriculum authors by V1.0; build authoring tooling (MDX templates, preview server); prioritize one theme at a time |
| 3 | Low free-to-paid conversion | High | Medium | Revenue targets missed if conversion stays below 3% | A/B test paywall placement (end of Module 2 vs. Module 3); offer 7-day free trial; implement upgrade nudges based on engagement signals |
| 4 | Monaco Editor bundle size | Medium | High | Monaco adds ~2MB to initial bundle, hurting LCP and mobile performance | Lazy-load Monaco only on lesson pages; use dynamic import with loading skeleton; explore lighter alternatives (CodeMirror 6) if size remains problematic |
| 5 | Stripe regional compliance | Medium | Medium | Tax calculation, invoicing requirements, and payment method support vary by country | Use Stripe Tax for automated tax calculation; enable local payment methods (iDEAL, Boleto) via Stripe; consult legal counsel for EU/India/Brazil compliance |
| 6 | GitHub OAuth scope changes | Low | Low | GitHub may deprecate or modify OAuth scopes, breaking integration | Abstract GitHub API behind an adapter layer; monitor GitHub changelog; implement graceful degradation if repo access is revoked |
| 7 | Curriculum staleness | Medium | Medium | ML ecosystem evolves rapidly; lessons may reference outdated APIs or deprecated model architectures | Schedule quarterly content reviews; version lessons with "last updated" date; community contribution pipeline for corrections |
| 8 | Accessibility compliance | Medium | Medium | Complex interactive components (editor, progress diagram, canvas) may not meet WCAG 2.2 AA | Conduct accessibility audit before each release; use `aria-live` regions for dynamic content; provide text-only alternatives for visual components |
| 9 | Competitor response | Medium | High | Established platforms (freeCodeCamp, Codecademy, Scrimba) launch similar FE-to-ML courses | Differentiate on bridge pedagogy and themed worlds; build community moat; move fast on content — first-mover advantage in this niche is significant |

---

## 11. Appendix

### A. Deep Orbit Module Map

The Deep Orbit theme comprises 11 modules, each containing 5 lessons. Modules 1–6 cover shared core ML concepts (common across all themes), while Modules 7–11 dive into the theme's specialization: autonomous navigation and anomaly detection in space.

#### Shared Core Modules (Modules 1–6)

| Module | Title | Lesson 1 | Lesson 2 | Lesson 3 | Lesson 4 | Lesson 5 (Capstone) |
|---|---|---|---|---|---|---|
| 1 | Tensors & Data | What is a Tensor? | Shapes & Ranks | Tensor Operations | Loading Space Datasets | Normalization & Preprocessing Capstone |
| 2 | Layers & Activations | Dense Layers | Activation Functions | Forward Pass Mechanics | Loss Functions | Gradient Descent Capstone |
| 3 | Convolutional Networks | CNN Architecture | Kernels & Filters | Pooling Strategies | Feature Map Visualization | Satellite Image Classifier Capstone |
| 4 | Training & Evaluation | Training Loops | Batch Size & Epochs | Validation & Test Splits | Metrics (Accuracy, F1, AUC) | Model Evaluation Dashboard Capstone |
| 5 | Optimization | SGD & Momentum | Adam & RMSProp | Learning Rate Scheduling | Early Stopping & Callbacks | Hyperparameter Tuning Capstone |
| 6 | Deployment | Model Export (SavedModel) | TF.js Conversion | Browser Inference Pipeline | Performance Profiling | Deploy a Model to Production Capstone |

#### Specialization Modules (Modules 7–11)

| Module | Title | Lesson 1 | Lesson 2 | Lesson 3 | Lesson 4 | Lesson 5 (Capstone) |
|---|---|---|---|---|---|---|
| 7 | Autoencoders | Encoder Architecture | Decoder Architecture | Latent Space Exploration | Denoising Autoencoders | Anomaly Detection in Telemetry Capstone |
| 8 | Anomaly Detection | Statistical Baselines | Isolation Forests (JS) | Autoencoder Anomalies | Threshold Tuning | Space Station Anomaly Alert System Capstone |
| 9 | Reinforcement Learning Basics | Agents & Environments | Rewards & Policies | Q-Learning Fundamentals | Epsilon-Greedy Exploration | Grid-World Navigation Capstone |
| 10 | Deep Q-Networks | DQN Architecture | Experience Replay | Target Networks | Double DQN | Asteroid Navigation Agent Capstone |
| 11 | Capstone Mission | Mission Briefing & Data Prep | Model Architecture Design | Training & Evaluation Pipeline | Real-Time Inference UI | Full Mission: Autonomous Space Probe Capstone |

---

*End of TensorCraft PRD v3.2*
