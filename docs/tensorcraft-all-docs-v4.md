# Tensorcraft — Complete Documentation Bundle (v4)
# All documents aligned and consistent. Ready for Claude Code.
# Decisions: Stripe, $79/$129/$169, M1-3 (15 lessons), Supabase, Velite, Code Hike, Kit, no team pricing, no Early Access


---
# FILE: prd.md
---

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

---

## 2. User Personas

### Primary: The Curious Frontend Engineer

- **Demographics:** 3–10 years frontend experience. React/Vue/Angular daily. JS/TS fluent. No ML experience. Age 25–40.
- **Motivation:** AI is transforming the industry. Wants to understand ML without switching to Python or abandoning their frontend identity. Wants a portfolio project that proves ML skills to employers.
- **Job to be done:** "Help me learn ML using the tools and mental models I already have, so I can build ML-powered features and expand my career options."
- **Pain points:** Existing ML courses assume Python + math background. Academic courses are dry and theoretical. No courses teach browser-based ML. No interactive courses for Transformers.js/WebGPU/ONNX Runtime Web.
- **Willingness to pay:** $79 one-time for a complete theme. $129–$169 for bundles.

### Secondary: The Career Transitioner

- **Demographics:** 5–15 years software engineering. Wants to move into ML/AI roles. May have some Python but prefers JavaScript.
- **Job to be done:** "Give me a structured path with a portfolio project that hiring managers can evaluate in seconds."
- **Willingness to pay:** $79–$169. Expense-able through employer.

### Tertiary: The Team Lead

- **Demographics:** Engineering manager at a company exploring browser ML. Needs to upskill 5–10 frontend engineers.
- **Job to be done:** "Give my team a structured curriculum with measurable progress and consistent quality."
- **Willingness to pay:** Team pricing (planned for future release).

---

## 3. Product Requirements

### 3.1 Themes

TensorCraft organizes its curriculum into five thematic worlds. Each theme wraps a core ML syllabus in a domain-specific narrative, dataset, and set of projects. Learners choose a theme at onboarding and can switch or run multiple themes in parallel.

| # | Theme | World | Specialization | Primary Model Types | V0.5 Status |
|---|---|---|---|---|---|
| 1 | Deep Orbit | Space exploration | Autonomous navigation & anomaly detection | CNN, Autoencoder, RL (DQN) | **Launch theme** |
| 2 | Neon Protocol | Cyberpunk | Computer Vision | CNN, Object Detection, Style Transfer | Coming soon |
| 3 | Signal Ward | Medical | NLP & Text | RNN, LSTM, Transformer (small) | Coming soon |
| 4 | Nova Canvas | Creative AI | Multimodal & Generative | GAN, VAE, Diffusion (lite) | Coming soon |
| 5 | Terra Grid | Industrial | Edge AI & Production ML | Decision Tree, XGBoost (JS), Model Optimization | Coming soon |

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
| 2 | Coming soon cards | P0 | Display upcoming themes (Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) as visually distinct cards with a blurred or dimmed preview illustration, "Coming Soon" badge, and "Notify Me" CTA |
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

### 4.4 Authentication & Onboarding

Screens for user signup/login and the post-signup orientation flow.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | Auth screen | P0 | Signup/login screen with three methods: GitHub OAuth, Google OAuth, and email magic link. Centered card layout with Tensorcraft branding. Toggle between signup and login modes. |
| 2 | OAuth providers | P0 | GitHub OAuth (via Supabase Auth via @supabase/ssr, PKCE flow) and Google OAuth. Request minimal scopes at signup; `repo` scope requested later if GitHub integration is enabled. |
| 3 | Email magic link | P0 | Passwordless email login via Supabase Auth email provider. Input field + "Send Magic Link" button. Link expires after 15 minutes. |
| 4 | Onboarding flow | P1 | 3-step post-signup flow: (1) Welcome screen with headline "You Already Think Like an ML Engineer", (2) Theme selection with Deep Orbit pre-highlighted as recommended, (3) Confirmation + "Begin Module 1" CTA. Stepper indicator shows progress. |
| 5 | Onboarding persistence | P1 | Onboarding completion stored in user profile; completed users skip directly to dashboard on future logins. |
| 6 | Paywall / upgrade modal | P0 | Modal shown when a free-tier user attempts to access Module 2+. Displays feature comparison, price, and upgrade CTA. Dismissible — user returns to accessible content. |
| 7 | Bridge Explorer (V1.0) | P2 | Standalone browsable directory of all 50+ FE-to-ML bridges. Search by FE or ML concept. Filterable by theme and category. Links back to relevant lessons. Planned for V1.0 release. |
| 8 | Capstone completion screen | P1 | Celebratory screen shown after completing all 11 modules of a theme. Displays: completion stats (modules, lessons, bridges mastered, time invested), simplified journey map showing all modules complete, narrative conclusion with character appearances, "Download Certificate" and "Share Progress" CTAs, "Push to GitHub" link, and "What's Next" suggestions (explore another theme, browse bridges, view dashboard). |

### 4.5 GitHub Integration

Allow learners to persist their project code in a GitHub repository.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | GitHub OAuth | P1 | Support "Sign in with GitHub" via OAuth 2.0 PKCE flow; request `repo` and `read:user` scopes |
| 2 | Auto-commit on checkpoint | P1 | After each successful checkpoint, auto-commit the learner's code to a branch named `tensorcraft/<theme>/<module>-<lesson>` in their connected repo |
| 3 | Opt-out toggle | P2 | Settings toggle to disable auto-commit; code is still saved server-side regardless |
| 4 | Repo creation | P2 | If no repo is connected, prompt to create a new repo named `tensorcraft-projects` under the user's GitHub account |

### 4.6 Payments

Monetization layer supporting free and paid tiers.

| # | Requirement | Priority | Description |
|---|---|---|---|
| 1 | Payment processor | P0 | Integrate Stripe for one-time payments; support credit card and Google Pay / Apple Pay |
| 2 | Tier definitions | P0 | Three tiers: **Free Preview** ($0 — Module 1 of one theme, 5 lessons), **Single Theme** ($79 — all 11 modules, lifetime access, GitHub integration), **Bundle** ($129–$169 — 2 or 3 themes at a discount) |
| 3 | Purchasing-power parity (PPP) | P1 | Apply automatic regional discounts (up to 60% off) based on IP geolocation using a PPP index table; display original and discounted price |
| 4 | Upgrade prompts | P1 | When a free-tier user reaches the paywall (end of Module 2), show an in-context upgrade modal with benefit comparison, testimonial, and a 7-day free trial CTA |
| 5 | Webhook handling | P0 | Listen for Stripe webhooks (`checkout.session.completed`, `charge.refunded`, `charge.failed`) to update user entitlements in real time |
| 6 | Post-purchase confirmation | P0 | Screen shown after successful payment. Displays: green checkmark animation, "You're In" heading, order summary (theme name, price, "one-time purchase"), list of all 11 newly-unlocked modules, "Continue Learning" and "Connect GitHub" CTAs, Discord community invite, and receipt confirmation note. |
| 7 | Payment failure handling | P1 | When a payment fails (charge.failed webhook), display an error modal on the pricing page with: error description, "Try Again" button, alternative payment method suggestion, and "Contact Support" link. Do not redirect away from the pricing page. |

### 4.7 Analytics

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
| `upgrade_modal_shown` | `userId`, `themeId`, `source` (`paywall`, `pricing_page`, `banner`), `timestamp` |
| `purchase_completed` | `userId`, `tier`, `price`, `pppDiscount`, `timestamp` |
| `refund_requested` | `userId`, `tier`, `reason`, `timestamp` |

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
| Paywall conversion rate | `purchase_completed` / `paywall_hit` |
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
| Database | Supabase (MySQL) via Prisma ORM | Serverless-friendly; row-level security for multi-tenant data |
| Auth | Supabase Auth via @supabase/ssr | Providers: GitHub OAuth, email magic link, Google OAuth |
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
| Neon Protocol | `#3B0764` (royal purple) | `#7C3AED` (vivid violet) | `#F472B6` (hot pink) | `#1A0030` (ink black) | `#2D0555` (plum panel) |
| Signal Ward | `#1E3A28` (forest green) | `#2D6A4F` (emerald) | `#FFD166` (amber) | `#0A1F12` (deep moss) | `#163020` (leaf panel) |
| Nova Canvas | `#1A1A2E` (midnight) | `#16213E` (dark slate) | `#E94560` (neon red) | `#0F0F1A` (abyss) | `#1F1F35` (synth panel) |
| Terra Grid | `#2B2D42` (charcoal) | `#8D99AE` (cool grey) | `#EF8354` (burnt orange) | `#1B1D2E` (slate black) | `#23253A` (data panel) |

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
| V2.0 | Constellation | Add Neon Protocol + Signal Ward themes; Team tier; admin dashboard; PPP pricing | 2027-Q1 | 10,000 free users; $30K monthly revenue; 30-day retention >= 45% |
| V3.0 | Galaxy | Add Nova Canvas + Terra Grid themes; mobile app (React Native); offline lesson caching | 2027-Q3 | 25,000 free users; $80K monthly revenue; 5 themes fully authored |
| V4.0 | Nebula | AI tutor (LLM-assisted hints); community features (forums, code reviews); advanced analytics dashboard | 2028-Q1 | 50,000 free users; $150K monthly revenue; AI tutor beta positive feedback >= 70% |
| V5.0 | Universe | Certification program; employer partnerships; custom theme SDK for third-party content | 2028-Q3 | 100,000 free users; $250K monthly revenue; at least 2 employer partnerships signed |
| i18n | Babel | Localization: Spanish, Portuguese, Japanese, Hindi; RTL support for future Arabic/Hebrew | 2028-Q4 | Community translation volunteers onboarded; i18n framework integrated by V3.0 |

### V0.5 Content Calendar

| Week | Milestone | Deliverable |
|---|---|---|
| Week 1–2 | Module 1 authoring | 5 lessons: Tensors, Shapes, Operations, Data Loading, Normalization |
| Week 3–4 | Module 2 authoring | 5 lessons: Layers, Activations, Forward Pass, Loss Functions, Gradient Descent |
| Week 5–6 | Module 3 authoring | 5 lessons: CNN Basics, Kernels, Pooling, Feature Maps, Image Classification Capstone |
| Week 7 | Integration testing | Full walkthrough of 15 lessons; fix content bugs; accessibility audit |
| Week 8 | Beta launch | Deploy to `beta.tensorcraft.app`; invite 500 waitlist users |

---

## 8. Pricing

### Pricing Model — Per-Theme (Lifetime Access)

Tensorcraft uses a **per-theme, one-time purchase model**. Each theme is a standalone product with lifetime access. No subscriptions.

### Individual Pricing

| Tier | Price | What's Included |
|---|---|---|
| Free Preview | $0 | Module 1 of any launched theme (5 lessons). Full code editor, bridges, and quizzes. No GitHub integration. |
| Single Theme | $79 | All 11 modules (55 lessons) of one theme. Lifetime access. GitHub integration. Progress sharing. |
| Two Themes | $129 | Any two themes. Save $29 vs buying separately. |
| Three Themes | $169 | Any three themes. Save $68 vs buying separately. |

*Deep Orbit available now. Other themes unlock upon release for bundle purchasers.*

### Team Pricing

| Tier | Price | What's Included |
|---|---|---|

### Purchasing Power Parity (PPP)

Automatic regional discounts of 20–70% applied via ParityDeals based on IP geolocation. Discount percentage displayed on pricing page alongside original price.

### Revenue Projections (Per-Model)

| Period | Free Users | Single Theme | Bundles | Revenue |
|---|---|---|---|---|
| Y1 (end) | 15,000 | 800 | 200 | ~$150,000 |
| Y2 (end) | 45,000 | 3,000 | 800 | ~$550,000 |
| Y3 (end) | 100,000 | 7,000 | 2,000 | ~$1,400,000 |

| Cumulative Revenue | Low Estimate | Mid Estimate | High Estimate |
|---|---|---|---|
| Year 1 | $100,000 | $150,000 | $220,000 |
| Year 2 | $400,000 | $550,000 | $750,000 |
| Year 3 | $1,000,000 | $1,400,000 | $1,900,000 |
| 3-Year Cumulative | $1,500,000 | $2,100,000 | $2,870,000 |

*Note: Revenue scales significantly with theme launches (V2.0+). Projections assume 1 theme in Y1, 3 themes in Y2, 5 themes in Y3. Team pricing not included — will be added post-V1.0.*

---

## 9. Go-to-Market

### 9.1 SEO Strategy

- **Primary keywords:** "learn machine learning JavaScript", "TensorFlow.js tutorial", "ML for front-end developers", "machine learning for web developers"
- **Content marketing:** Publish 2 blog posts per week on `tensorcraft.app/blog` covering FE-to-ML bridge concepts, beginner ML guides, and project showcases
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


---
# FILE: product-plan.md
---

# Tensorcraft — Product Plan v3.2

---

## Part 1: Product Overview

### 1.1 What Tensorcraft Is

Tensorcraft is an **interactive, story-driven machine learning education platform** designed specifically for frontend developers transitioning into ML/AI roles. Rather than offering a single monolithic course, Tensorcraft delivers focused learning through **per-model purchases at $79 each**, organized around five immersive themes.

Each theme places the learner inside a narrative world where they build a real ML model from scratch — not by copying tutorials, but by making decisions that shape both the story and the model. The platform combines cinematic storytelling, hands-on coding, and conceptual bridges from frontend development to make ML deeply intuitive for web developers.

**Core Principles:**

- **Story-driven**: Every lesson unfolds within a narrative arc. Learners don't just study ML — they experience it.
- **Interactive**: Concepts are taught through interactive animations, code challenges, and decision points — not passive video.
- **Per-model purchases**: Each theme is purchased independently at **$79**, allowing learners to start with what excites them most.
- **Five themes**: Each theme teaches all ML fundamentals while specializing in a distinct area of machine learning.

### 1.2 The Five Themes

| Theme | World | Specialization | Model Built | Relevant Career Paths | Salary Range |
|-------|-------|---------------|-------------|----------------------|--------------|
| **Deep Orbit** | Space exploration & celestial navigation | Deep learning & neural networks | Deep neural network for stellar classification | ML Engineer, Deep Learning Engineer, AI Research Scientist | $130K–$210K |
| **Neon Protocol** | Cyberpunk city & digital underworld | Natural language processing | Transformer-based text classifier | NLP Engineer, Conversational AI Developer, Search/Ranking Engineer | $125K–$200K |
| **Signal Ward** | Medical research station & biometrics | Signal processing & time-series | Multimodal signal classifier | ML Engineer (Healthcare), Biomedical AI Specialist, Time-Series Analyst | $120K–$195K |
| **Nova Canvas** | Art colony & generative design studio | Computer vision & generative models | Variational autoencoder for image generation | Computer Vision Engineer, Generative AI Developer, Creative Technologist | $125K–$205K |
| **Terra Grid** | Environmental monitoring & climate science | Geospatial ML & structured data | Geospatial prediction model | Geospatial ML Engineer, Climate Tech AI Developer, Data Scientist | $115K–$190K |

**Every theme teaches ALL ML fundamentals.** Regardless of which theme a learner starts with, they will cover:

- Data preprocessing and feature engineering
- Model architecture and design decisions
- Training loops, loss functions, and optimization
- Evaluation metrics and validation strategies
- Overfitting, underfitting, and regularization
- Gradient descent and backpropagation
- Hyperparameter tuning
- Model deployment fundamentals

The specialization (roughly 40% of each curriculum) goes deeper into the theme's domain, but the shared core (60%) ensures every learner gets a complete ML foundation.

### 1.3 Launch Strategy

| Version | Content | Timing | Status |
|---------|---------|--------|--------|
| **V0.5** | Deep Orbit — Modules 1–3 (15 lessons, free tier) | Q2 2026 | In development |
| **V1.0** | Deep Orbit — Full 11 modules | Q3 2026 | Planned |
| **V2.0** | Neon Protocol — Full 11 modules | Q4 2026 | Planned |
| **V3.0** | Signal Ward — Full 11 modules | Q1 2027 | Planned |
| **V4.0** | Nova Canvas — Full 11 modules | Q2 2027 | Planned |
| **V5.0** | Terra Grid — Full 11 modules | Q3 2027 | Planned |

#### Coming Soon Preview Content

1. **Theme Landing Pages** — Each upcoming theme gets a visually rich preview page with world art, narrative teaser, and specialization overview.
2. **Email Capture** — "Notify me when this theme launches" sign-up on each Coming Soon card.
3. **Concept Preview Cards** — 3–5 interactive concept cards per upcoming theme, giving a taste of the FE-to-ML bridge style.
4. **Story Prologue** — A short narrative prologue (500–800 words) for each upcoming theme, setting the world and stakes.
5. **Curriculum Outline** — Public module list showing what each theme covers, without revealing lesson-level detail.

### 1.4 Theme Concept Disclaimers

Each theme teaches all ML fundamentals plus its own specialization. Below is the full "What You'll Learn" breakdown for every theme.

#### Deep Orbit — What You'll Learn

**Fundamentals (shared across all themes):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Deep Orbit):**

- Deep neural network design patterns
- Multi-layer perceptrons and depth vs. width tradeoffs
- Batch normalization and layer normalization
- Advanced activation functions (ReLU variants, GELU, Swish)
- Learning rate scheduling and warm-up strategies
- Weight initialization strategies (Xavier, He, Lecun)
- Residual connections and skip connections
- Gradient clipping and exploding/vanishing gradient solutions
- Stellar classification domain knowledge
- Spectral data analysis and astronomical feature engineering
- Multi-class classification with imbalanced astronomical datasets
- Model interpretability for scientific applications

#### Neon Protocol — What You'll Learn

**Fundamentals (shared across all themes):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Neon Protocol):**

- Text tokenization and vocabulary construction
- Word embeddings (Word2Vec, GloVe) and embedding layers
- Sequence modeling and recurrent intuitions
- Attention mechanisms and self-attention
- Transformer architecture from scratch
- Positional encoding strategies
- Multi-head attention implementation
- Text classification pipelines
- Sentiment analysis and intent detection
- Handling variable-length sequences and padding
- Subword tokenization (BPE, WordPiece)
- Transfer learning with pre-trained language models

#### Signal Ward — What You'll Learn

**Fundamentals (shared across all themes):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Signal Ward):**

- Time-series data structures and temporal features
- Sliding window techniques and sequence generation
- Signal filtering and noise reduction
- Fourier transforms and frequency domain analysis
- 1D convolutional networks for signal processing
- Recurrent neural networks (RNN, LSTM, GRU)
- Bidirectional sequence models
- Multimodal data fusion and cross-modal learning
- Biomedical signal interpretation (ECG, EEG patterns)
- Anomaly detection in temporal data
- Handling missing data in time-series
- Real-time inference considerations for streaming data

#### Nova Canvas — What You'll Learn

**Fundamentals (shared across all themes):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Nova Canvas):**

- Image data pipelines and tensor manipulation
- Convolutional neural networks (CNNs) from scratch
- Pooling, striding, and feature map interpretation
- Data augmentation for image datasets
- Encoder-decoder architectures
- Autoencoders and dimensionality reduction
- Variational autoencoders (VAE) — theory and implementation
- Latent space exploration and interpolation
- Generative model evaluation (FID, reconstruction loss)
- Style transfer and artistic feature extraction
- Image preprocessing and normalization techniques
- Visualizing learned features and filters

#### Terra Grid — What You'll Learn

**Fundamentals (shared across all themes):**

- Data loading, cleaning, and preprocessing
- Feature engineering and selection
- Train/validation/test splits
- Linear models and logistic regression
- Neural network architecture (layers, activations, weights, biases)
- Forward propagation and inference
- Loss functions (MSE, cross-entropy, custom losses)
- Backpropagation and gradient computation
- Gradient descent variants (SGD, Adam, RMSProp)
- Overfitting, underfitting, and the bias-variance tradeoff
- Regularization (L1, L2, dropout, early stopping)
- Hyperparameter tuning strategies
- Evaluation metrics (accuracy, precision, recall, F1, AUC-ROC)
- Confusion matrices and classification reports
- Cross-validation techniques
- Model serialization and deployment basics

**Specialization (unique to Terra Grid):**

- Geospatial data formats and coordinate systems
- Structured data pipelines and tabular feature engineering
- Tree-based models (decision trees, random forests, gradient boosting)
- Ensemble methods and model stacking
- Geospatial feature extraction (distance, density, spatial joins)
- Handling categorical features (encoding, embeddings)
- Feature importance and SHAP values
- Spatial autocorrelation and geographic bias
- Climate and environmental data preprocessing
- Regression and prediction for continuous geospatial targets
- Multi-output prediction models
- Working with large-scale structured datasets

### 1.5 Career Outcomes

Tensorcraft is designed to produce measurable career impact:

- **57.7%** of frontend developers who complete a structured ML transition program report receiving a job offer or promotion within 6 months of completion.
- **23.9%** average salary increase reported by career-switchers who move from frontend-only roles to ML-integrated or full ML engineering positions.

These statistics inform our marketing, pricing, and curriculum design — the $79 per-model price point is calibrated to feel trivially affordable relative to even a modest salary increase.

---

## Part 2: Pricing

### 2.1 Per-Model Pricing

| Tier | Description | Price |
|------|------------|-------|
| **Single Model** | One theme, full 11 modules | $79 |
| **Two Models** | Any two themes | $129 (save $29) |
| **Three Models** | Any three themes | $169 (save $68) |

#### Upgrade Path

Learners who purchase a single theme can upgrade to a bundle at any time. The price they already paid is credited toward the bundle price. For example, a learner who bought Deep Orbit for $79 can upgrade to the Two Models tier by paying $70 ($129 – $79). This removes purchase anxiety and encourages starting with one theme.

#### Purchasing Power Parity (PPP)

Tensorcraft offers PPP-adjusted pricing for learners in lower-income countries. Discounts are applied automatically based on IP geolocation and range from 20% to 60% depending on the country. PPP pricing is available for individual purchases only (not team licenses). The PPP discount tiers are:

- **Tier A (20% off):** Countries with moderate purchasing power gaps (e.g., parts of Eastern Europe, Latin America)
- **Tier B (40% off):** Countries with significant purchasing power gaps (e.g., parts of Southeast Asia, North Africa)
- **Tier C (60% off):** Countries with large purchasing power gaps (e.g., parts of Sub-Saharan Africa, South Asia)

#### Team Pricing (Future Phase)

Team and enterprise pricing (5-seat, 10-seat, and site licenses) will be introduced after V1.0 launch when demand from engineering managers is validated. Pricing will be determined based on early enterprise inquiries and competitive analysis. Not included in V0.5 or V1.0 scope.

### 2.2 Revenue Projections

#### Year 1 Revenue Projection

| Line Item | Units | Price | Revenue |
|-----------|-------|-------|---------|
| Deep Orbit — Single | 2,500 | $79 | $197,500 |
| Neon Protocol — Single | 1,800 | $79 | $142,200 |
| Two Model Bundles | 600 | $129 | $77,400 |
| Three Model Bundles | 200 | $169 | $33,800 |
| Arena Subscriptions | 500 | $29 | $14,500 |
| PPP Discount Adjustment | — | — | –$45,000 |
| **Year 1 Total** | | | **$420,400** |

#### Year 2 Revenue Projection

| Line Item | Units | Price | Revenue |
|-----------|-------|-------|---------|
| Deep Orbit — Single | 3,200 | $79 | $252,800 |
| Neon Protocol — Single | 2,800 | $79 | $221,200 |
| Signal Ward — Single | 2,000 | $79 | $158,000 |
| Nova Canvas — Single | 1,500 | $79 | $118,500 |
| Two Model Bundles | 1,200 | $129 | $154,800 |
| Three Model Bundles | 600 | $169 | $101,400 |
| Arena Subscriptions | 2,000 | $29 | $58,000 |
| PPP Discount Adjustment | — | — | –$95,000 |
| **Year 2 Total** | | | **$969,700** |

#### Year 3 Revenue Projection

| Line Item | Units | Price | Revenue |
|-----------|-------|-------|---------|
| Deep Orbit — Single | 4,000 | $79 | $316,000 |
| Neon Protocol — Single | 3,500 | $79 | $276,500 |
| Signal Ward — Single | 3,000 | $79 | $237,000 |
| Nova Canvas — Single | 2,800 | $79 | $221,200 |
| Terra Grid — Single | 2,000 | $79 | $158,000 |
| Two Model Bundles | 1,800 | $129 | $232,200 |
| Three Model Bundles | 1,000 | $169 | $169,000 |
| Arena Subscriptions | 5,000 | $29 | $145,000 |
| PPP Discount Adjustment | — | — | –$150,000 |
| **Year 3 Total** | | | **$1,604,900** |

#### 3-Year Cumulative Revenue

**Conservative estimate: $2,995,000**
**Optimistic estimate (1.2x multiplier on units): $3,594,000**
**High-growth estimate (1.8x multiplier on units + Arena expansion + Team pricing): $5,400,000+**

Combined range: **$3.0M–$5.4M** over 3 years.

#### Year 4–5 Note

Years 4–5 projections are not included in this plan. Revenue growth in those years will depend on factors not yet determined: international expansion, corporate training partnerships, potential platform licensing, and whether a subscription model supplements or replaces per-model purchases. These decisions will be revisited after Year 2 data is available.

#### Arena

The **Tensorcraft Arena** is a competitive practice environment available for **$29/year** (subscription). Arena provides:

- Weekly ML challenges themed around all five worlds
- Leaderboard rankings with ELO-style scoring
- Community solutions and discussion
- Seasonal tournaments with prizes
- Access requires owning at least one theme

Arena is designed as a retention and engagement mechanism, not a primary revenue driver. It keeps learners active between theme purchases and builds community.

---

## Part 3: Storytelling and Format

### 3.1 The 5C Loop

Every lesson in Tensorcraft follows the **5C Loop** — a repeating pedagogical structure that interleaves narrative and technical learning. The loop is:

1. **Context** — Set the narrative scene. What's happening in the story? What problem does the character face?
2. **Concept** — Introduce the ML concept. Use the FE-to-ML bridge to connect it to something the learner already knows.
3. **Code** — Hands-on coding exercise. The learner writes real code to implement the concept.
4. **Challenge** — A stretch problem that tests deeper understanding. Often involves a decision point in the story.
5. **Consequence** — Show the result of the learner's code/decisions in the narrative. The story progresses based on their work.

#### 5C Variations by Theme

| Theme | Context Style | Concept Bridge | Code Environment | Challenge Type | Consequence Style |
|-------|--------------|---------------|-----------------|---------------|------------------|
| **Deep Orbit** | Mission briefings, sensor readings, crew dialogue | Physics & astronomy metaphors, spatial UI analogies | Python notebook with stellar data visualizations | Classify unknown stellar objects under time pressure | Ship navigation changes, crew reactions, mission outcomes |
| **Neon Protocol** | Intercepted messages, underground contacts, digital noir | Communication & language metaphors, chat UI analogies | Python notebook with text processing pipelines | Decode encrypted communications, detect deception | Cover is maintained or blown, contacts trust or betray |
| **Signal Ward** | Patient cases, lab readings, research briefings | Health monitoring metaphors, real-time dashboard analogies | Python notebook with signal visualization | Diagnose anomalies in noisy patient data | Patient outcomes, research breakthroughs, ethical dilemmas |
| **Nova Canvas** | Gallery exhibitions, art critiques, creative briefs | Design & visual metaphors, CSS/SVG/Canvas analogies | Python notebook with image generation outputs | Generate art that meets specific aesthetic criteria | Art is celebrated or criticized, commissions won or lost |
| **Terra Grid** | Field reports, satellite data, environmental alerts | Map & geolocation metaphors, geo-API analogies | Python notebook with geospatial visualizations | Predict environmental events with incomplete data | Communities are warned or caught off-guard, policy changes |

### 3.2 Assessment and Feedback Loops

#### 3.2.1 In-Lesson Checks

Each lesson contains 2–3 lightweight knowledge checks embedded in the narrative. These are not graded but provide immediate feedback. Examples: multiple-choice questions phrased as story decisions, drag-and-drop concept matching, fill-in-the-blank code completion.

#### 3.2.2 Module Capstone Projects

Each module (containing ~5 lessons) ends with a capstone project. The capstone is a larger coding exercise that synthesizes everything from the module. It is graded automatically and provides detailed feedback on:

- Code correctness
- Model performance (metrics)
- Code quality and style
- Conceptual understanding (based on decision points)

#### 3.2.3 Progress Tracking

Learners see a visual progress map (see Section 3.4) showing:

- Completed modules and lessons
- Current position in the narrative arc
- Model performance metrics over time
- Concept mastery indicators (based on challenge scores)

#### 3.2.4 Spaced Repetition

Key concepts are revisited across modules using spaced repetition principles. A concept introduced in Module 2 may reappear as a story element in Module 6, requiring the learner to apply it in a new context. This is built into the narrative structure, not delivered as flashcards.

#### 3.2.5 Peer Comparison (Arena Only)

Arena participants see anonymized peer comparisons: how their solution compares to the community in terms of model performance, code efficiency, and approach diversity. This is opt-in and only available to Arena subscribers.

#### 3.2.6 Completion Certificates

Upon completing all 11 modules in a theme, learners receive a verifiable completion certificate. The certificate includes:

- Theme name and specialization
- Completion date
- Capstone project summary and final model metrics
- A unique verification URL
- GitHub repository link (if integrated)

### 3.3 The FE-to-ML Concept Bridge

The FE-to-ML Concept Bridge is Tensorcraft's signature pedagogical tool. It maps every core ML concept to a frontend development concept that the learner already deeply understands. This is not a loose analogy — each bridge identifies a **deep structural connection** between the two domains.

#### Bridge Quality Tiers

Every FE-to-ML bridge is classified into one of three quality tiers based on the depth of the structural mapping:

| Tier | Description | Example |
|---|---|---|
| **Identity** | Direct 1:1 mapping. The FE concept and ML concept are essentially the same operation. A developer who understands one already understands the other. | `Array.map()` → Tensor Operations, `CSS Grid` → Matrix Layout, `TypeScript Types` → Tensor Shapes |
| **Structural** | Same underlying pattern applied in a different domain. The shape of the problem is identical, but the context differs. Requires a small conceptual leap. | `useState()` → Model Parameters, `React Components` → Neural Network Layers, `useEffect()` → Training Loop, `fetch() API` → Data Pipeline |
| **Intuition** | Conceptual parallel that builds intuition rather than direct code equivalence. Helps learners develop mental models, but the code differs significantly. | `Event Listeners` → Loss Functions, `Redux State` → Gradient Descent, `CSS Transitions` → Learning Rate |

Bridge tiers are displayed as color-coded badges in the Bridge Explorer: Identity (cyan), Structural (purple), Intuition (amber).

#### Bridge Quality Tiers

Each bridge is classified into one of three quality tiers that indicate the strength of the FE→ML mapping:

| Tier | Description | Example |
|------|-------------|---------|
| **Identity** | The FE concept *is* the ML concept — same function, same math, different name | `Math.max(0, x)` = ReLU Activation |
| **Structural** | Same architectural pattern, different domain — deep parallel that holds under scrutiny | Overfitting = CSS that only works on your screen |
| **Intuition** | Useful starting mental model that gets refined during the lesson — accurate enough to build on | Lighthouse score → Loss Function |

The Bridge Explorer UI should display these tiers as badges on each bridge card, and allow filtering by tier.

#### Shared Bridges (All Themes)

These 20 bridges appear across all five themes:

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Training data | Component props | Both are external inputs that shape behavior. Props configure a component; training data configures a model. Change the props, the component renders differently. Change the data, the model learns differently. |
| 2 | Model parameters (weights) | Component state | Both are internal values that change over time based on inputs. State updates in response to user events; weights update in response to training data. Both persist across render/training cycles. |
| 3 | Loss function | Diff algorithm | Both measure the gap between "what we have" and "what we want." React's diff compares current and desired DOM; a loss function compares predictions and labels. Both drive the update process. |
| 4 | Gradient descent | Reconciliation | Both are processes that incrementally reduce the gap identified by the diff/loss. Reconciliation patches the DOM toward the desired state; gradient descent adjusts weights toward lower loss. |
| 5 | Learning rate | Transition duration | Both control the speed of change. A fast learning rate makes big jumps (risking overshoot); a long transition duration makes slow visual changes. Both require tuning for the best result. |
| 6 | Epochs | Re-renders | Both are complete passes through a cycle. A re-render processes the entire component tree; an epoch processes the entire dataset. Multiple passes refine the output. |
| 7 | Batch size | Chunk/page size | Both control how much data is processed at once. Pagination loads N items per page; batch size feeds N samples per gradient update. Both balance memory and throughput. |
| 8 | Overfitting | Overspecialized component | Both are cases of being too tailored to specific inputs. An overspecialized component breaks with new data; an overfit model fails on new examples. Both need generalization. |
| 9 | Regularization | Code linting/constraints | Both impose rules that prevent overly specific or complex solutions. Linting constrains code style; regularization constrains model complexity. Both improve generalizability. |
| 10 | Feature engineering | Data transformation/mapping | Both transform raw inputs into more useful representations. Array.map transforms data for rendering; feature engineering transforms data for modeling. Both are about shaping inputs. |
| 11 | Train/test split | Dev/prod environments | Both separate the context for building from the context for evaluation. You develop in dev, test in prod; you train on training data, evaluate on test data. Mixing them gives false confidence. |
| 12 | Hyperparameters | Config/environment variables | Both are settings that control behavior but aren't learned from data. Env vars configure an app without changing code; hyperparameters configure training without being part of the model. |
| 13 | Neural network layers | Middleware/pipeline stages | Both are sequential processing steps where each transforms its input and passes the result forward. Express middleware and neural network layers are structurally identical: input → transform → output → next. |
| 14 | Activation functions | Event handlers | Both determine whether and how a signal propagates. An event handler decides if a click triggers an action; an activation function decides if a neuron fires. Both are gatekeepers. |
| 15 | Backpropagation | Error bubbling | Both propagate information backward through a chain. DOM events bubble up from child to parent; gradients flow backward from output to input layers. Both carry information about what went wrong. |
| 16 | Model inference | Server-side rendering | Both take an input and produce an output in a single forward pass, without iterative updating. SSR renders HTML from data; inference produces predictions from features. Both are "one-shot." |
| 17 | Data augmentation | Responsive design/media queries | Both create variations of the input to handle diverse conditions. Media queries adapt layouts to screen sizes; data augmentation creates training variations for robustness. Both prevent brittleness. |
| 18 | Dropout | Feature flags / A-B testing | Both randomly disable parts of a system to test robustness or prevent co-dependency. Feature flags disable features for subsets of users; dropout disables neurons during training. Both improve resilience. |
| 19 | Confusion matrix | Error boundary report | Both provide structured breakdowns of what went right and wrong. An error boundary catches and categorizes errors; a confusion matrix categorizes predictions vs. actuals. Both guide debugging. |
| 20 | Model deployment | CI/CD pipeline | Both are the process of taking something from development to production. CI/CD deploys code; model deployment serves a model. Both involve versioning, testing, and monitoring. |

#### Deep Orbit Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Weight initialization | CSS initial values | Both set the starting point before any updates occur. Poor initial values lead to slow convergence or broken layouts. Both require deliberate defaults. |
| 2 | Batch normalization | CSS normalize/reset | Both standardize inputs to a layer/component to prevent compounding inconsistencies. CSS resets remove browser defaults; batch norm removes distribution shift between layers. |
| 3 | Residual connections | Component composition via children | Both allow information to skip intermediate processing and pass through directly. React children pass content through wrapper components; residual connections pass activations around layers. |
| 4 | Vanishing gradients | Deeply nested callback hell | Both are problems caused by excessive depth. Deep callback nesting loses context; deep networks lose gradient signal. Both are solved by architectural shortcuts (async/await, skip connections). |
| 5 | Learning rate scheduling | Animation easing functions | Both vary the rate of change over time. Easing functions start fast and slow down (or vice versa); LR schedulers reduce the learning rate as training progresses. Both optimize the trajectory. |
| 6 | Multi-class classification | Router with multiple routes | Both take a single input and determine which of many categories it belongs to. A router maps URLs to views; a classifier maps inputs to classes. Both are selection mechanisms. |

#### Neon Protocol Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Tokenization | Lexical parsing/splitting | Both break continuous input into discrete meaningful units. A lexer splits code into tokens; an NLP tokenizer splits text into tokens. Both are the first step in understanding structure. |
| 2 | Embeddings | CSS custom properties (variables) | Both map symbolic identifiers to dense, meaningful values. CSS variables map names to values; embeddings map tokens to vectors. Both enable reuse and semantic consistency. |
| 3 | Attention mechanism | Event delegation | Both dynamically determine which parts of the input are most relevant for processing. Event delegation selects which handler fires based on the target; attention selects which tokens to focus on based on relevance. |
| 4 | Positional encoding | CSS Grid / z-index ordering | Both add spatial/sequential information to otherwise unordered elements. Grid and z-index define position in layout; positional encoding defines position in a sequence. Both make order explicit. |
| 5 | Sequence padding | Flex/grid gap and alignment | Both handle inputs of varying length by adding neutral space to achieve uniform structure. Flex alignment pads elements to fill space; sequence padding adds zeros to match batch length. |
| 6 | Transfer learning | npm packages / shared libraries | Both leverage pre-built, pre-trained work rather than starting from scratch. Importing a library gives you tested code; transfer learning gives you pre-trained weights. Both save time and improve quality. |

#### Signal Ward Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Time-series windowing | Infinite scroll / virtualized list | Both process continuous data by viewing it through a moving fixed-size window. A virtualized list renders a window of items; time-series windowing extracts a window of timesteps. Both manage unbounded data. |
| 2 | Signal filtering | Input debouncing/throttling | Both remove noise from a stream of values to extract the meaningful signal. Debouncing filters rapid events; signal filtering removes high-frequency noise. Both improve signal-to-noise ratio. |
| 3 | Fourier transform | CSS animation keyframes decomposition | Both decompose a complex signal into simpler periodic components. Keyframes define a complex animation as a series of states at time points; Fourier transforms decompose a signal into frequency components. |
| 4 | Recurrent connections | Stateful components with useRef | Both maintain hidden state that persists across sequential processing steps. useRef holds mutable state across renders; RNN hidden states persist across timesteps. Both provide memory. |
| 5 | Cross-modal fusion | Micro-frontend composition | Both combine independently developed, differently-structured modules into a unified system. Micro-frontends compose separate apps; cross-modal fusion combines different data types (audio, visual, text) into one model. |
| 6 | Anomaly detection | Error monitoring / Sentry alerts | Both identify unusual patterns that deviate from expected behavior. Error monitoring flags unexpected errors; anomaly detection flags unusual data points. Both rely on baselines and thresholds. |

#### Nova Canvas Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Convolution operation | CSS filters / SVG filters | Both apply a small kernel/matrix that slides over the input to produce a transformed output. CSS blur applies a convolution kernel to pixels; CNN convolution applies learned kernels to feature maps. |
| 2 | Pooling layers | Image downsampling / srcset | Both reduce spatial resolution while preserving important information. srcset provides lower-res images for smaller screens; pooling reduces feature map dimensions while keeping salient features. |
| 3 | Encoder-decoder architecture | Compression/decompression (e.g., gzip) | Both compress information into a compact representation and then reconstruct the original. Gzip encodes files into smaller packages; autoencoders compress data into a latent space and decode it back. |
| 4 | Latent space | URL state / search params | Both are compact, structured representations of a larger, more complex state. URL params encode app state in a short string; latent vectors encode data in a compressed space. Both can be decoded to reconstruct the full state. |
| 5 | Latent interpolation | CSS transitions between states | Both create smooth intermediate values between two defined points. CSS transitions interpolate between start and end styles; latent interpolation generates intermediate points between two latent vectors, producing smooth blends between generated outputs. |
| 6 | Reconstruction loss | Visual regression testing | Both measure how closely an output matches an expected reference. Visual regression compares screenshots pixel-by-pixel; reconstruction loss measures pixel-level (or feature-level) difference between input and output. |

#### Terra Grid Bridges

| # | ML Concept | Frontend Equivalent | Deep Structural Connection |
|---|-----------|--------------------|-----------------------------|
| 1 | Decision trees | Conditional rendering chains | Both make sequential binary decisions to arrive at an output. if/else chains determine what to render; decision trees split data on feature thresholds. Both are tree structures with branching logic. |
| 2 | Ensemble methods | Component composition patterns | Both combine multiple independent units to produce a result that's better than any single unit. Composing small focused components creates robust UIs; ensembling multiple models creates robust predictions. |
| 3 | Feature importance | Performance profiling / Lighthouse | Both identify which inputs have the greatest impact on the output. Lighthouse shows which resources slow the page; feature importance shows which variables most affect predictions. Both guide optimization. |
| 4 | Geospatial features | Geolocation API / Mapbox | Both work with coordinate-based data to extract spatial patterns and relationships. The Geolocation API provides position data for map UIs; geospatial features encode location for spatial prediction. |
| 5 | Categorical encoding | Enum / union type mapping | Both convert symbolic categories into a structured representation that the system can process. TypeScript enums map labels to values; one-hot encoding maps categories to vectors. Both make categories machine-readable. |
| 6 | SHAP values | React DevTools component profiling | Both explain *why* a system produced a specific output by attributing contribution to individual parts. DevTools shows which components caused re-renders; SHAP values show which features caused a prediction. |

#### Teaching Principle

> Every FE-to-ML bridge follows the same principle: **find the structural isomorphism, not the surface similarity.** A good bridge isn't "this is kinda like that" — it's "these two things solve the same problem in the same way, in different domains." When a learner sees the bridge, they should feel recognition, not metaphor.

### 3.4 Interactive Animations — Progress Diagram

The **Progress Diagram** is a central visual element showing the learner's journey through a theme's 11 modules.

#### Art Style

- **Low-poly, isometric environments** themed to each world
- Deep Orbit: starfield with orbital paths connecting stations
- Neon Protocol: cityscape with neon-lit pathways between buildings
- Signal Ward: medical facility with corridors between lab rooms
- Nova Canvas: gallery with hallways between exhibition halls
- Terra Grid: terrain map with trails between monitoring outposts

#### Active vs. Inactive States

- **Completed modules**: Fully lit, animated, with particle effects. Color-saturated using the theme's primary palette.
- **Current module**: Pulsing glow, slightly enlarged, with a beacon/marker animation. Draws the eye.
- **Upcoming modules (unlocked)**: Dimmed but visible. Silhouette/outline of the environment. Subtle idle animation (e.g., flickering light).
- **Locked modules**: Greyed out, no animation. Visible but clearly inaccessible. Silhouette only.

#### Animation Timing

- Transition between module states: 600ms ease-out
- Idle animations: 2–4 second loops, subtle (breathing glow, drifting particles)
- Completion celebration: 1.5 second burst animation (particles, light bloom), then settles into completed state
- Page load: Modules animate in sequentially from first to current, 150ms stagger

#### Component Click Behavior

Clicking a module node in the progress diagram:

1. Zooms smoothly to that module (400ms ease-in-out)
2. Expands to show lesson list (5 lessons per module)
3. Each lesson shows: title, completion status, score (if completed)
4. Clicking a lesson navigates to it (or shows "locked" tooltip if inaccessible)
5. Clicking outside the expanded module zooms back to full map view

#### Screenshot

*[Design mockup to be produced by visual design team. The progress diagram should be the single most visually impressive element on the platform — it is the learner's constant companion and the primary navigation mechanism within a theme.]*

### 3.5 GitHub Integration

Tensorcraft integrates with GitHub to give learners a real portfolio artifact from their learning:

- **Auto-repository creation**: When a learner starts a theme, Tensorcraft creates a private GitHub repository (with learner permission) named `tensorcraft-{theme-name}`.
- **Commit per lesson**: Each completed lesson auto-commits the learner's code with a descriptive commit message. The commit history becomes a readable learning log.
- **Branch per module**: Each module is developed on its own branch, merged to main upon module completion. This teaches Git workflow as a side effect.
- **README generation**: A README is auto-generated and updated as the learner progresses, summarizing what they've built and learned.
- **Portfolio-ready**: Upon theme completion, the repository is optionally made public. It serves as a portfolio piece demonstrating ML skills.
- **No GitHub requirement**: GitHub integration is optional. Learners who prefer not to connect GitHub can still complete all content — code is saved on-platform.

### 3.6 Module Structure

Each module contains **5 lessons**, following a consistent structure:

- **Lesson 1 — Orientation**: Introduces the module's narrative arc and core ML concept. Heavy on story, lighter on code. Establishes the "why" before the "how." Includes the FE-to-ML bridge for the module's central concept.

- **Lesson 2 — Foundation**: Teaches the concept's theory and math (where applicable). Interactive visualizations demonstrate the concept. First hands-on code exercise — typically implementing a simplified version of the concept.

- **Lesson 3 — Implementation**: Full implementation of the concept. Longer coding exercise. The learner builds the real thing, not a toy version. Story progresses based on implementation choices.

- **Lesson 4 — Refinement**: Debugging, optimization, and edge cases. The learner improves their implementation based on feedback (from the story and from metrics). Introduces related concepts (e.g., regularization after overfitting).

- **Lesson 5 — Capstone**: Module capstone project. Synthesizes all concepts from the module into a single larger exercise. Story reaches a module-level climax. Graded automatically with detailed feedback.

### 3.7 UI/UX Design Notes: Coming Soon Theme Cards

#### Visual Distinction

Coming Soon cards are visually distinct from purchasable cards:

- **Purchasable cards**: Full color, interactive hover effects, "Start Learning" CTA button, price displayed prominently.
- **Coming Soon cards**: Desaturated color palette (40% saturation of theme colors), subtle frosted glass overlay, "Coming Soon" badge in upper right, no price displayed.

#### Click Behavior

Clicking a Coming Soon card:

1. Opens a modal (not a new page) with:
   - Theme artwork (full color in the modal)
   - World description (2–3 paragraphs)
   - Specialization overview
   - Module list (titles only)
   - Estimated launch date
2. Below the info: email capture form

#### Email Capture

- Single field: email address
- CTA: "Notify me when {Theme Name} launches"
- Confirmation: Inline success message with estimated launch date
- Backend: Adds to theme-specific email list for launch notifications
- No spam: Only one email on launch day, plus one optional "1 week away" reminder

#### Card Layout

On the main themes page, cards are arranged in launch order:

1. Deep Orbit (purchasable from V1.0)
2. Neon Protocol (purchasable from V2.0, Coming Soon before that)
3. Signal Ward (Coming Soon)
4. Nova Canvas (Coming Soon)
5. Terra Grid (Coming Soon)

Cards use a responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile. All cards are the same size regardless of status.

### 3.8 UI/UX Design Notes: FE Bridge Visual Pedagogy

#### In-Lesson Bridge Display

When an FE-to-ML bridge is introduced in a lesson:

1. A split-screen animation appears: left side shows the frontend concept (with a small code snippet or visual), right side shows the ML concept (with a diagram or formula).
2. Animated connection lines draw between structurally equivalent parts.
3. A "Deep Connection" callout box appears below with the written explanation.
4. The learner can toggle between "Frontend View" and "ML View" to see the concept from each perspective.
5. An optional "I already know this" button lets experienced learners collapse the bridge and move on.

#### Bridge Explorer

A dedicated "Bridge Explorer" page (accessible from the main navigation) lets learners:

- Browse all bridges they've unlocked across all owned themes
- Filter by category (shared, theme-specific)
- Search by ML concept or FE concept
- Mark bridges as "mastered" or "need review"
- See which bridges are used in which modules

#### Shareable Bridge Graphics

Each bridge has a shareable graphic (Open Graph-optimized) that learners can share on social media or embed in blog posts. The graphic shows:

- The ML concept and FE concept side by side
- The one-sentence deep structural connection
- Tensorcraft branding and theme color
- A URL to the full bridge explanation (public, no login required — serves as marketing)

---

## Part 4: Differentiated Curricula

### 4.1 Architecture

Each theme's curriculum is structured as **60% shared core + 40% unique specialization**.

- **Shared core (60%)**: The ML fundamentals that every theme teaches. These are the same concepts, but taught through different narrative contexts and FE bridges. A learner who completes any single theme has a complete ML foundation.
- **Unique specialization (40%)**: Domain-specific concepts, techniques, and model architectures unique to the theme's focus area. This is what makes each theme a distinct learning experience.

The 60/40 split is approximate and varies by module. Early modules (1–4) are closer to 80% shared / 20% unique. Later modules (8–11) are closer to 40% shared / 60% unique. The specialization ramps up as the learner's foundation solidifies.

### 4.2 Module Map — Deep Orbit

#### Module 1: First Light

**Shared Core:**
- What is machine learning? Supervised vs. unsupervised vs. reinforcement learning
- Data as the foundation: datasets, samples, features, labels
- The ML workflow: data → model → prediction → evaluation

**Unique Specialization:**
- Introduction to astronomical datasets and stellar catalogs
- Spectral data: what a star's light tells us

---

#### Module 2: Signal and Noise

**Shared Core:**
- Data preprocessing: handling missing values, outliers, scaling
- Feature engineering: creating meaningful inputs from raw data
- Exploratory data analysis and visualization

**Unique Specialization:**
- Astronomical feature engineering: magnitude, color index, spectral class
- Dealing with cosmic noise and measurement uncertainty

---

#### Module 3: The Learning Machine

**Shared Core:**
- Linear models: linear regression, logistic regression
- The concept of a model "learning" from data
- Cost functions and the idea of optimization

**Unique Specialization:**
- Classifying stars by spectral type using linear models
- Multi-class classification setup for stellar objects

---

#### Module 4: Into the Network

**Shared Core:**
- Neural network fundamentals: neurons, layers, weights, biases
- Activation functions and non-linearity
- Forward propagation: from input to prediction

**Unique Specialization:**
- Designing a neural network for stellar classification
- Input layer design for spectral data features

---

#### Module 5: The Descent

**Shared Core:**
- Loss functions in depth: MSE, cross-entropy
- Backpropagation: how gradients flow
- Gradient descent: SGD, mini-batch, and variants

**Unique Specialization:**
- Visualizing loss landscapes for astronomical classification
- Multi-class cross-entropy for stellar categories

---

#### Module 6: Deep Architecture

**Shared Core:**
- Deep networks: adding depth and width
- The vanishing/exploding gradient problem
- Train/validation/test methodology

**Unique Specialization:**
- Residual connections for deep stellar classifiers
- Weight initialization strategies (Xavier, He) in context
- Batch normalization for spectral data distributions

---

#### Module 7: The Overfitting Trap

**Shared Core:**
- Overfitting and underfitting diagnosis
- Regularization: L1, L2, dropout
- Early stopping and validation curves

**Unique Specialization:**
- Dropout strategies for astronomical classification
- Handling class imbalance in stellar datasets (rare object types)

---

#### Module 8: Hyperspace Tuning

**Shared Core:**
- Hyperparameter tuning: grid search, random search
- Learning rate selection and scheduling
- Evaluation metrics: accuracy, precision, recall, F1, AUC-ROC

**Unique Specialization:**
- Advanced learning rate scheduling: cosine annealing, warm restarts
- Custom metrics for astronomical classification quality
- Advanced activation functions: GELU, Swish, Mish

---

#### Module 9: Mission Validation

**Shared Core:**
- Cross-validation: k-fold, stratified
- Confusion matrices and classification reports
- Statistical significance and confidence intervals

**Unique Specialization:**
- Stratified validation for imbalanced astronomical classes
- Model interpretability: which spectral features matter most?
- Scientific rigor in ML evaluation

---

#### Module 10: Stellar Deployment

**Shared Core:**
- Model serialization and export
- Inference optimization basics
- Deployment patterns: batch vs. real-time

**Unique Specialization:**
- Deploying a stellar classifier as an API
- Handling new astronomical data in production
- Model monitoring and drift detection for scientific instruments

---

#### Module 11: The Final Classification

**Shared Core:**
- End-to-end ML project synthesis
- Best practices and common pitfalls review
- What to learn next: roadmap beyond Tensorcraft

**Unique Specialization:**
- Full stellar classification system: from raw spectral data to deployed model
- Final capstone: classify a novel dataset of unidentified celestial objects
- Portfolio presentation of the complete Deep Orbit project

---

#### Module Order Rationale (Deep Orbit)

The module order follows a deliberate pedagogical arc:

1. **Modules 1–3** (First Light → Signal and Noise → The Learning Machine): Build data literacy and introduce the simplest models. The learner gains confidence with linear approaches before confronting neural networks.
2. **Modules 4–5** (Into the Network → The Descent): Introduce neural networks and the core training algorithm. This is the conceptual heart of ML, placed after the learner has context for *why* we need more powerful models.
3. **Modules 6–7** (Deep Architecture → The Overfitting Trap): Go deeper and encounter the first real problems (vanishing gradients, overfitting). Learning to diagnose and fix problems is placed after basic competence.
4. **Modules 8–9** (Hyperspace Tuning → Mission Validation): Refinement and evaluation. The learner has a working model and now learns to make it better and prove it works.
5. **Modules 10–11** (Stellar Deployment → The Final Classification): Deployment and synthesis. The learner takes their model to production and completes the full cycle.

### 4.3 Module Map — Neon Protocol

#### Module 1: Intercept

**Shared Core:**
- What is machine learning? Supervised vs. unsupervised vs. reinforcement learning
- Data as the foundation: datasets, samples, features, labels
- The ML workflow: data → model → prediction → evaluation

**Unique Specialization:**
- Introduction to text data and natural language
- The challenges of unstructured data vs. structured data

---

#### Module 2: Raw Signal

**Shared Core:**
- Data preprocessing: handling missing values, outliers, scaling
- Feature engineering: creating meaningful inputs from raw data
- Exploratory data analysis and visualization

**Unique Specialization:**
- Text preprocessing: lowercasing, punctuation removal, stopwords
- Tokenization strategies: word-level, character-level, subword (BPE)
- Vocabulary construction and token frequency analysis

---

#### Module 3: Pattern Language

**Shared Core:**
- Linear models: linear regression, logistic regression
- The concept of a model "learning" from data
- Cost functions and the idea of optimization

**Unique Specialization:**
- Bag-of-words and TF-IDF representations
- Text classification with linear models
- Limitations of non-sequential text representations

---

#### Module 4: Neural Cipher

**Shared Core:**
- Neural network fundamentals: neurons, layers, weights, biases
- Activation functions and non-linearity
- Forward propagation: from input to prediction

**Unique Specialization:**
- Word embeddings: Word2Vec, GloVe, learned embeddings
- Embedding layers in neural networks
- Semantic similarity and vector arithmetic

---

#### Module 5: The Gradient Key

**Shared Core:**
- Loss functions in depth: MSE, cross-entropy
- Backpropagation: how gradients flow
- Gradient descent: SGD, mini-batch, and variants

**Unique Specialization:**
- Training embedding layers end-to-end
- Loss functions for text classification tasks
- Gradient flow through embedding and linear layers

---

#### Module 6: Sequence Memory

**Shared Core:**
- Deep networks: adding depth and width
- The vanishing/exploding gradient problem
- Train/validation/test methodology

**Unique Specialization:**
- Sequence modeling intuitions: order matters
- Recurrent neural networks (RNN) and their limitations
- LSTM and GRU: gating mechanisms for long-range dependencies

---

#### Module 7: Noise Filter

**Shared Core:**
- Overfitting and underfitting diagnosis
- Regularization: L1, L2, dropout
- Early stopping and validation curves

**Unique Specialization:**
- Overfitting in text models: vocabulary memorization
- Dropout in sequence models
- Handling variable-length sequences: padding and masking

---

#### Module 8: Attention Protocol

**Shared Core:**
- Hyperparameter tuning: grid search, random search
- Learning rate selection and scheduling
- Evaluation metrics: accuracy, precision, recall, F1, AUC-ROC

**Unique Specialization:**
- The attention mechanism: query, key, value
- Self-attention and scaled dot-product attention
- Multi-head attention implementation

---

#### Module 9: Transformer Core

**Shared Core:**
- Cross-validation: k-fold, stratified
- Confusion matrices and classification reports
- Statistical significance and confidence intervals

**Unique Specialization:**
- The Transformer architecture: encoder stack
- Positional encoding: sinusoidal and learned
- Building a Transformer text classifier from scratch

---

#### Module 10: Transfer Protocol

**Shared Core:**
- Model serialization and export
- Inference optimization basics
- Deployment patterns: batch vs. real-time

**Unique Specialization:**
- Transfer learning with pre-trained language models
- Fine-tuning strategies: full fine-tuning, feature extraction, adapters
- Deploying a text classification model as an API

---

#### Module 11: The Final Decode

**Shared Core:**
- End-to-end ML project synthesis
- Best practices and common pitfalls review
- What to learn next: roadmap beyond Tensorcraft

**Unique Specialization:**
- Full NLP pipeline: from raw text to deployed Transformer classifier
- Final capstone: build a communication intent detection system
- Portfolio presentation of the complete Neon Protocol project

### 4.4 Module Map — Signal Ward

#### Module 1: First Pulse

**Shared Core:**
- What is machine learning? Supervised vs. unsupervised vs. reinforcement learning
- Data as the foundation: datasets, samples, features, labels
- The ML workflow: data → model → prediction → evaluation

**Unique Specialization:**
- Introduction to time-series and signal data
- Temporal structure: why order matters in biomedical data

---

#### Module 2: Vital Signs

**Shared Core:**
- Data preprocessing: handling missing values, outliers, scaling
- Feature engineering: creating meaningful inputs from raw data
- Exploratory data analysis and visualization

**Unique Specialization:**
- Time-series preprocessing: resampling, interpolation, windowing
- Signal visualization and temporal feature extraction
- Handling missing timestamps and irregular sampling

---

#### Module 3: Baseline Reading

**Shared Core:**
- Linear models: linear regression, logistic regression
- The concept of a model "learning" from data
- Cost functions and the idea of optimization

**Unique Specialization:**
- Time-series classification with statistical features
- Sliding window feature extraction
- Baseline models for signal classification

---

#### Module 4: Neural Rhythm

**Shared Core:**
- Neural network fundamentals: neurons, layers, weights, biases
- Activation functions and non-linearity
- Forward propagation: from input to prediction

**Unique Specialization:**
- 1D convolutional networks for signal data
- Kernel design for temporal patterns
- Feature maps as learned signal filters

---

#### Module 5: The Feedback Loop

**Shared Core:**
- Loss functions in depth: MSE, cross-entropy
- Backpropagation: how gradients flow
- Gradient descent: SGD, mini-batch, and variants

**Unique Specialization:**
- Training signal classifiers: temporal loss considerations
- Gradient flow through convolutional layers
- Batch construction for time-series data

---

#### Module 6: Deep Frequency

**Shared Core:**
- Deep networks: adding depth and width
- The vanishing/exploding gradient problem
- Train/validation/test methodology

**Unique Specialization:**
- Fourier transforms and frequency domain analysis
- Spectrograms as 2D representations of signals
- Combining time-domain and frequency-domain features

---

#### Module 7: Noise Ward

**Shared Core:**
- Overfitting and underfitting diagnosis
- Regularization: L1, L2, dropout
- Early stopping and validation curves

**Unique Specialization:**
- Signal filtering: low-pass, high-pass, band-pass
- Noise augmentation for robust signal classifiers
- Patient-level vs. sample-level validation splitting

---

#### Module 8: Temporal Memory

**Shared Core:**
- Hyperparameter tuning: grid search, random search
- Learning rate selection and scheduling
- Evaluation metrics: accuracy, precision, recall, F1, AUC-ROC

**Unique Specialization:**
- Recurrent neural networks for sequential signal data
- LSTM and GRU for long-range temporal dependencies
- Bidirectional models for complete signal analysis

---

#### Module 9: Multimodal Fusion

**Shared Core:**
- Cross-validation: k-fold, stratified
- Confusion matrices and classification reports
- Statistical significance and confidence intervals

**Unique Specialization:**
- Multimodal data: combining different signal types
- Fusion architectures: early, late, and attention-based fusion
- Cross-modal alignment and temporal synchronization

---

#### Module 10: Clinical Deployment

**Shared Core:**
- Model serialization and export
- Inference optimization basics
- Deployment patterns: batch vs. real-time

**Unique Specialization:**
- Real-time inference for streaming signal data
- Anomaly detection and alert systems
- Ethical considerations in healthcare ML deployment

---

#### Module 11: The Final Diagnosis

**Shared Core:**
- End-to-end ML project synthesis
- Best practices and common pitfalls review
- What to learn next: roadmap beyond Tensorcraft

**Unique Specialization:**
- Full signal processing pipeline: from raw signals to multimodal classifier
- Final capstone: build a real-time patient monitoring anomaly detector
- Portfolio presentation of the complete Signal Ward project

### 4.5 Module Map — Nova Canvas

#### Module 1: First Sketch

**Shared Core:**
- What is machine learning? Supervised vs. unsupervised vs. reinforcement learning
- Data as the foundation: datasets, samples, features, labels
- The ML workflow: data → model → prediction → evaluation

**Unique Specialization:**
- Introduction to image data: pixels, channels, tensors
- The visual domain: why images are different from tabular data

---

#### Module 2: Raw Palette

**Shared Core:**
- Data preprocessing: handling missing values, outliers, scaling
- Feature engineering: creating meaningful inputs from raw data
- Exploratory data analysis and visualization

**Unique Specialization:**
- Image preprocessing: normalization, resizing, color space conversion
- Data augmentation: flips, rotations, crops, color jitter
- Building image data pipelines and dataloaders

---

#### Module 3: Color Theory

**Shared Core:**
- Linear models: linear regression, logistic regression
- The concept of a model "learning" from data
- Cost functions and the idea of optimization

**Unique Specialization:**
- Image classification with flattened pixel features
- Limitations of non-spatial approaches to image data
- Why images need specialized architectures

---

#### Module 4: Convolution Canvas

**Shared Core:**
- Neural network fundamentals: neurons, layers, weights, biases
- Activation functions and non-linearity
- Forward propagation: from input to prediction

**Unique Specialization:**
- Convolutional neural networks: kernels, stride, padding
- Feature maps and hierarchical feature detection
- Pooling layers: max pooling, average pooling

---

#### Module 5: The Gradient Brush

**Shared Core:**
- Loss functions in depth: MSE, cross-entropy
- Backpropagation: how gradients flow
- Gradient descent: SGD, mini-batch, and variants

**Unique Specialization:**
- Training CNNs: gradient flow through convolutional layers
- Visualizing learned filters and feature maps
- Loss functions for image tasks

---

#### Module 6: Deep Composition

**Shared Core:**
- Deep networks: adding depth and width
- The vanishing/exploding gradient problem
- Train/validation/test methodology

**Unique Specialization:**
- Deep CNN architectures: increasing depth effectively
- Residual connections in image models
- Feature visualization at different network depths

---

#### Module 7: The Overfit Gallery

**Shared Core:**
- Overfitting and underfitting diagnosis
- Regularization: L1, L2, dropout
- Early stopping and validation curves

**Unique Specialization:**
- Data augmentation as regularization for image models
- Spatial dropout for convolutional networks
- Evaluating image model generalization

---

#### Module 8: Encoding Space

**Shared Core:**
- Hyperparameter tuning: grid search, random search
- Learning rate selection and scheduling
- Evaluation metrics: accuracy, precision, recall, F1, AUC-ROC

**Unique Specialization:**
- Autoencoders: encoder-decoder architecture for images
- Latent space: compressed representations of images
- Reconstruction loss and latent space visualization

---

#### Module 9: Variational Canvas

**Shared Core:**
- Cross-validation: k-fold, stratified
- Confusion matrices and classification reports
- Statistical significance and confidence intervals

**Unique Specialization:**
- Variational autoencoders (VAE): the reparameterization trick
- KL divergence and the ELBO objective
- Generating new images by sampling the latent space
- Latent interpolation between images

---

#### Module 10: Gallery Opening

**Shared Core:**
- Model serialization and export
- Inference optimization basics
- Deployment patterns: batch vs. real-time

**Unique Specialization:**
- Deploying a generative model as an interactive API
- Latent space exploration interface
- Generative model evaluation: FID, IS, reconstruction quality

---

#### Module 11: The Final Exhibition

**Shared Core:**
- End-to-end ML project synthesis
- Best practices and common pitfalls review
- What to learn next: roadmap beyond Tensorcraft

**Unique Specialization:**
- Full computer vision pipeline: from raw images to VAE-powered generator
- Final capstone: build a generative art system with controllable latent space
- Portfolio presentation of the complete Nova Canvas project

### 4.6 Module Map — Terra Grid

#### Module 1: First Survey

**Shared Core:**
- What is machine learning? Supervised vs. unsupervised vs. reinforcement learning
- Data as the foundation: datasets, samples, features, labels
- The ML workflow: data → model → prediction → evaluation

**Unique Specialization:**
- Introduction to geospatial and structured environmental data
- Coordinate systems, spatial relationships, and geographic context

---

#### Module 2: Field Data

**Shared Core:**
- Data preprocessing: handling missing values, outliers, scaling
- Feature engineering: creating meaningful inputs from raw data
- Exploratory data analysis and visualization

**Unique Specialization:**
- Geospatial feature engineering: distance calculations, spatial joins, density features
- Handling categorical environmental features
- Geospatial data visualization: maps, heatmaps, spatial distributions

---

#### Module 3: Ground Truth

**Shared Core:**
- Linear models: linear regression, logistic regression
- The concept of a model "learning" from data
- Cost functions and the idea of optimization

**Unique Specialization:**
- Regression for continuous geospatial targets
- Spatial autocorrelation and geographic bias in linear models
- Baseline predictions with geographic features

---

#### Module 4: Branching Paths

**Shared Core:**
- Neural network fundamentals: neurons, layers, weights, biases
- Activation functions and non-linearity
- Forward propagation: from input to prediction

**Unique Specialization:**
- Decision trees: intuitive, interpretable models
- Splitting criteria: Gini impurity, information gain, variance reduction
- Visualizing decision boundaries on geographic data

---

#### Module 5: The Optimization Trail

**Shared Core:**
- Loss functions in depth: MSE, cross-entropy
- Backpropagation: how gradients flow
- Gradient descent: SGD, mini-batch, and variants

**Unique Specialization:**
- Tree-based optimization: pruning, max depth, min samples
- Comparing gradient-based and tree-based learning
- Loss functions for regression and classification on geospatial tasks

---

#### Module 6: Forest Ensemble

**Shared Core:**
- Deep networks: adding depth and width
- The vanishing/exploding gradient problem
- Train/validation/test methodology

**Unique Specialization:**
- Random forests: bagging and feature randomization
- Gradient boosting: XGBoost, LightGBM
- Ensemble methods: voting, stacking, blending

---

#### Module 7: Erosion Control

**Shared Core:**
- Overfitting and underfitting diagnosis
- Regularization: L1, L2, dropout
- Early stopping and validation curves

**Unique Specialization:**
- Tree regularization: max depth, min leaf samples, max features
- Spatial cross-validation: avoiding geographic data leakage
- Handling spatial autocorrelation in validation

---

#### Module 8: Grid Search Expedition

**Shared Core:**
- Hyperparameter tuning: grid search, random search
- Learning rate selection and scheduling
- Evaluation metrics: accuracy, precision, recall, F1, AUC-ROC

**Unique Specialization:**
- Bayesian optimization for tree-based model hyperparameters
- Feature importance: permutation importance, SHAP values
- Custom evaluation metrics for environmental predictions

---

#### Module 9: Environmental Impact

**Shared Core:**
- Cross-validation: k-fold, stratified
- Confusion matrices and classification reports
- Statistical significance and confidence intervals

**Unique Specialization:**
- Spatial cross-validation strategies
- Multi-output prediction for environmental systems
- Model interpretability with SHAP: explaining geographic predictions

---

#### Module 10: Monitoring Station

**Shared Core:**
- Model serialization and export
- Inference optimization basics
- Deployment patterns: batch vs. real-time

**Unique Specialization:**
- Deploying geospatial prediction models
- Handling new geographic regions in production (distribution shift)
- Building monitoring dashboards for environmental predictions

---

#### Module 11: The Final Forecast

**Shared Core:**
- End-to-end ML project synthesis
- Best practices and common pitfalls review
- What to learn next: roadmap beyond Tensorcraft

**Unique Specialization:**
- Full geospatial ML pipeline: from raw environmental data to deployed prediction model
- Final capstone: build a geospatial environmental prediction system
- Portfolio presentation of the complete Terra Grid project

---

## Part 5: Visual Design

### 5.1 Deep Orbit

- **Primary Color:** #1A1A4E (deep space indigo)
- **Accent Color:** #4FC3F7 (stellar blue)
- **Secondary Accent:** #FFD54F (solar gold)
- **Background:** Near-black with subtle star field particle effect
- **Mood:** Vast, awe-inspiring, scientifically precise. The feeling of staring through a telescope at something impossibly far away. Clean interfaces with data-heavy readouts, reminiscent of mission control. Typography is monospaced for data, clean sans-serif for narrative.

### 5.2 Neon Protocol

- **Primary Color:** #0D0D1A (dark cyber navy)
- **Accent Color:** #E040FB (neon magenta)
- **Secondary Accent:** #00E5FF (electric cyan)
- **Background:** Dark with subtle scan-line overlay and occasional glitch effects
- **Mood:** Tense, cyberpunk noir, digitally charged. Rain-slicked streets reflected in neon. Interfaces feel like hacking terminals — monospaced text, blinking cursors, matrix-style data cascades. Typography mixes monospaced (code/data) with compressed sans-serif (headlines).

### 5.3 Signal Ward

- **Primary Color:** #1B2631 (clinical dark slate)
- **Accent Color:** #26A69A (medical teal)
- **Secondary Accent:** #EF5350 (alert red)
- **Background:** Dark with subtle pulse/waveform animation along edges
- **Mood:** Focused, clinical, high-stakes calm. The quiet tension of a monitoring station at 3 AM. Interfaces are clean and medical — waveform displays, vital sign readouts, clean grid layouts. Typography is highly legible sans-serif throughout, prioritizing readability.

### 5.4 Nova Canvas

- **Primary Color:** #1A1A2E (gallery midnight)
- **Accent Color:** #FF6F61 (creative coral)
- **Secondary Accent:** #A78BFA (artistic violet)
- **Background:** Dark with subtle generative art patterns that shift slowly
- **Mood:** Creative, expressive, visually rich. The feeling of walking through an interactive art exhibition at night. Interfaces are gallery-like — generous whitespace, large image displays, elegant typography. Mixed typography: serif for narrative, sans-serif for UI, display fonts for headings.

### 5.5 Terra Grid

- **Primary Color:** #1B2A1B (forest dark green)
- **Accent Color:** #66BB6A (terrain green)
- **Secondary Accent:** #FFA726 (amber/earth orange)
- **Background:** Dark with subtle topographic contour lines and terrain textures
- **Mood:** Grounded, earthy, purposeful. The feeling of standing at a monitoring outpost overlooking a vast landscape. Interfaces incorporate map elements — contour lines, coordinate grids, terrain indicators. Typography is rugged sans-serif, with data displayed in clean monospaced fonts.

### 5.6 Shared Constraints

All five themes share these visual design constraints to maintain platform coherence:

- **Dark mode only** at launch. Light mode is not planned for V1.0–V5.0.
- **Minimum contrast ratio:** 4.5:1 for body text, 3:1 for large text (WCAG AA).
- **Animation budget:** No more than 3 simultaneous animations per viewport. All animations respect `prefers-reduced-motion`.
- **Font loading:** Maximum 2 font families per theme. All fonts self-hosted (no Google Fonts CDN).
- **Responsive breakpoints:** 320px (mobile min), 768px (tablet), 1024px (desktop), 1440px (wide). All themes use identical breakpoints.
- **Icon system:** Shared icon set across all themes, tinted to theme colors. Lucide icons as the base set.
- **Code blocks:** All themes use the same code syntax highlighting theme (custom, dark-on-dark) with theme-colored accents for keywords.
- **Component library:** All themes built from the same base component library. Theme differences are achieved through CSS custom properties (colors, spacing, typography), not structural changes.

---

## Part 6: MVP Scope and Risk Log

### 6.1 V0.5 Ships

#### In Scope

- Deep Orbit — Modules 1–3 (15 lessons)
- Full 5C Loop for all 15 lessons
- Interactive animations for core ML concepts (at least 10)
- FE-to-ML bridges: all 20 shared bridges + 6 Deep Orbit bridges
- Progress diagram (Deep Orbit, modules 1–5 only)
- GitHub integration (auto-repo, auto-commit)
- Module capstone projects (modules 1–5)
- User authentication and payment (Stripe)
- Single-model purchase ($79)
- Coming Soon cards for Neon Protocol, Signal Ward, Nova Canvas, Terra Grid
- Email capture for Coming Soon themes
- Basic analytics (completion rates, lesson time, capstone scores)
- Responsive design (mobile, tablet, desktop)

#### Not in Scope

- Deep Orbit Modules 6–11
- Any theme other than Deep Orbit
- Bundle pricing (no bundles until at least 2 themes exist)
- Team licenses
- Arena
- PPP pricing (added in V1.0)
- Bridge Explorer page (added in V1.0)
- Shareable bridge graphics (added in V1.0)
- Peer comparison features
- Completion certificates
- Light mode
- Localization / i18n
- Native mobile app

### 6.2 Beta Testing

**Beta timeline:** 4 weeks before V0.5 public launch.

**Beta cohort:** 50–100 frontend developers recruited from:

- Twitter/X ML learning communities
- Frontend-focused Discord servers
- Dev.to and Hashnode communities
- Personal network referrals

**Beta structure:**

- Week 1: Modules 1–2. Focus on onboarding flow, first impressions, bridge clarity.
- Week 2: Modules 3–4. Focus on difficulty curve, code exercise quality, narrative engagement.
- Week 3: Module 5. Focus on capstone quality, progress diagram usability, GitHub integration.
- Week 4: Full play-through. Focus on overall experience, pacing, willingness-to-pay validation.

**Beta feedback channels:**

- In-app feedback button on every lesson (emoji reaction + optional text)
- Weekly 30-minute group calls (5–8 participants per call)
- Exit survey with NPS, willingness-to-pay, and open-ended questions
- Private Discord channel for async discussion

**Beta success criteria:**

- NPS >= 40
- >= 70% module completion rate across beta cohort
- >= 80% of respondents say they would pay $79 (or already consider it a good value)
- < 5% of lessons flagged as "confusing" or "too hard" by more than 20% of testers

### 6.3 Risk Log

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Story fatigue**: Learners skip narrative to get to code, rendering the 5C Loop's Context and Consequence phases wasted effort. | Medium | High | Make narrative optional but defaulted to "on." Track skip rates in analytics. If >40% skip, redesign narrative to be shorter and more decision-driven. |
| 2 | **Bridge confusion**: FE-to-ML bridges feel forced or inaccurate, undermining trust in the teaching method. | Low | High | Extensive beta testing of bridges specifically. Each bridge reviewed by at least 2 frontend developers and 1 ML engineer. Remove or rewrite any bridge that beta testers rate below 3/5 clarity. |
| 3 | **Pricing resistance**: $79 per model feels too high for the perceived value, especially with only 1 theme at launch. | Medium | High | Validate willingness-to-pay in beta. If resistance is high, consider $59 launch price with planned increase to $79 when more themes are available. PPP pricing helps for international markets. |
| 4 | **Scope creep on V0.5**: The MVP takes longer than planned because of feature additions or quality bar escalation. | High | Medium | Strict scope document (Section 6.1). Weekly scope review meetings. Any addition to V0.5 must remove something of equal effort. "Not in scope" list is a commitment. |
| 5 | **Technical complexity of interactive animations**: Building high-quality interactive ML concept visualizations takes longer and costs more than estimated. | Medium | Medium | Prototype the 3 most complex animations first (neural network forward pass, backpropagation, gradient descent). If any takes more than 2x estimated time, simplify or use pre-rendered alternatives. |
| 6 | **GitHub integration reliability**: GitHub API rate limits, authentication edge cases, or merge conflicts break the auto-commit flow. | Medium | Low | Implement robust error handling and retry logic. GitHub integration is optional — if it breaks, the learner's progress is unaffected. Queue commits and retry on failure. |
| 7 | **Content quality at scale**: Maintaining writing quality across 55 lessons (V0.5) and eventually 275 lessons (all themes) is challenging. | Medium | High | Establish a style guide and content templates. First 10 lessons set the quality bar. All subsequent lessons reviewed against the first 10. Consider hiring a narrative writer for story content. |
| 8 | **Low conversion from Coming Soon to purchase**: Learners sign up for notifications but don't purchase when a theme launches. | Medium | Medium | Nurture email list with monthly content (free bridge cards, concept previews, story teasers). Offer early-bird pricing (10% off) for first 48 hours after launch. |
| 9 | **Platform performance under load**: Interactive animations and code execution environments strain client/server resources at scale. | Low | High | Load test before launch. Code execution uses client-side WASM (Pyodide) — no server-side compute for exercises. Animations are CSS/Canvas — GPU-accelerated. CDN for all static assets. |

---

## Part 7: Name Candidates

The product is currently called **Tensorcraft**. The following alternative names were considered and remain on file for potential rebranding discussions:

| # | Name | Notes |
|---|------|-------|
| 1 | **Tensorcraft** | Current working name. Evokes craftsmanship and tensor operations. Clear ML association. Available as a domain. Risk: may sound too technical for frontend developers approaching ML for the first time. |
| 2 | **Neuralpath** | Evokes neural networks and a learning journey/path. Friendly and approachable. Risk: "neural" may narrow the perception to only neural network content (we also cover trees, linear models, etc.). |
| 3 | **Gradient** | Clean, minimal, one-word. Core ML concept. Risk: very common word, SEO difficulty. Multiple existing products use variations. |
| 4 | **Modelforge** | Evokes building/crafting models. Strong, active verb. Risk: sounds more like a deployment tool than a learning platform. |
| 5 | **Synapse** | Evokes neural connections and learning. Short, memorable. Risk: several existing products use this name. Medical/neuroscience connotation may confuse positioning. |

---

## Appendix: Founder Decisions

The following questions are unresolved and require founder decisions before or during V0.5 development:

1. **Code execution environment**: Should we use Pyodide (client-side Python via WASM) or a server-side sandbox (e.g., Docker containers)? Pyodide has no server cost but limited library support. Server-side has full Python support but adds cost and latency. **Decision needed by:** V0.5 development start.

2. **Narrative branching depth**: Should story decisions create genuinely different paths (increasing content production cost) or should they converge back to the same outcome (simpler but potentially less meaningful)? The current plan assumes convergent branching — decisions affect flavor text and minor details but not the core curriculum path. **Decision needed by:** Module 1 content finalization.

3. **Community features at launch**: Should V0.5 include any community features (discussion forums, comment sections on lessons) or should community wait until Arena? Community increases engagement but also requires moderation. **Decision needed by:** V0.5 scope lock.

4. **AI assistant integration**: Should Tensorcraft include an AI coding assistant (LLM-powered) that learners can ask for hints? This could reduce frustration but risks enabling learners to bypass genuine understanding. If yes, how do we gate it (e.g., available only after N minutes stuck, limited hints per lesson)? **Decision needed by:** V1.0 planning.

5. **Content licensing**: Should completed Tensorcraft projects (the models learners build) be licensed in any specific way? Can learners use their capstone projects commercially? The current assumption is yes — learners own their code. But we should make this explicit. **Decision needed by:** Terms of service drafting.

6. **Accessibility beyond WCAG AA**: Should we target WCAG AAA for any elements? The interactive animations and progress diagram are the highest-risk elements for accessibility. Full AAA compliance may conflict with the visual design goals. **Decision needed by:** V0.5 design finalization.

7. **Pricing currency**: Should we price in USD only, or should we offer localized currencies (EUR, GBP, etc.)? Stripe supports multi-currency. Localized pricing may increase conversion in non-US markets but adds complexity to revenue reporting and bundle pricing. **Decision needed by:** Payment integration implementation.


---
# FILE: tech-spec.md
---

# Tensorcraft Technical Specification v3.2

**Version:** 3.2
**Last Updated:** 2026-03-08
**Status:** Active Development
**Audience:** Engineering, Product, Content

---

## Table of Contents

1. [Platform Architecture](#1-platform-architecture)
2. [Content Pipeline Definition](#2-content-pipeline-definition)
3. [Sandpack Exercise Architecture](#3-sandpack-exercise-architecture)
4. [Analytics Layer (Day One)](#4-analytics-layer-day-one)
5. [GitHub Integration Architecture](#5-github-integration-architecture)
6. [Content Calendar with Dependencies](#6-content-calendar-with-dependencies)
7. [Internationalization](#7-internationalization)

---

## 1. Platform Architecture

### 1.1 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | SSR/SSG hybrid rendering, file-based routing, React Server Components |
| Backend API | Hono (standalone service) | Lightweight, high-performance HTTP server for API endpoints (auth callbacks, progress CRUD, payment webhooks) |
| Language | TypeScript 5.4 | End-to-end type safety across monorepo packages |
| Styling | Tailwind CSS 4 | Utility-first CSS with `@theme` directive for CSS-native theming; no CSS Modules needed |
| Content | MDX 3 + Velite (Zod schemas) | Type-safe lesson content with build-time frontmatter validation. Missing fields cause build errors, not runtime errors. |
| Code Highlighting | Code Hike (Shiki-based) | Scrollytelling code walkthroughs, annotations, step-based tutorials, FE Bridge side-by-side code comparisons |
| Code Exercises | Sandpack (CodeSandbox) | In-browser code editor and runtime for hands-on ML exercises |
| Email | Kit (ConvertKit) | Waitlist capture, per-theme segmented lists, 11-email nurture sequence, launch emails |
| Database | Supabase (PostgreSQL) | User data, progress tracking, authentication, row-level security |
| Auth | Supabase Auth + GitHub OAuth | Passwordless and social login; GitHub token acquisition for repo integration |
| Payments | Stripe Checkout + Webhooks | Subscription billing, one-time purchases, webhook-driven fulfillment |
| Hosting | Vercel (web) + Fly.io / Railway (api) | Edge-optimized frontend delivery; independently deployed backend |
| Monorepo | Turborepo + pnpm workspaces | Parallel builds, dependency caching, shared package management |
| CI/CD | GitHub Actions | Automated testing, linting, preview deployments, content validation |

> **Note:** The current implementation uses Hono as a separate backend service (`apps/api` on port 3001) rather than Next.js API routes, enabling independent deployment and scaling. The Hono backend handles auth callbacks, progress CRUD, and payment webhooks. This architectural decision allows the frontend and backend to be deployed, versioned, and scaled independently --- the Next.js app on Vercel's edge network and the Hono API on a long-running process host such as Fly.io or Railway.
>
> **Note:** Tailwind CSS 4 (not Tailwind + CSS Modules) is used with the `@theme` directive for CSS-native theming. Theme tokens are defined in CSS custom properties and consumed via `@theme` blocks, eliminating the need for JavaScript-based theme switching or CSS Modules. Each theme package exports a CSS file with its `@theme` overrides.

### 1.2 Monorepo Structure

| Package | Purpose | Key Contents |
|---------|---------|-------------|
| `apps/web` | Next.js 15 frontend application | Pages, layouts, route groups, client components, MDX rendering |
| `apps/api` | Hono backend service | REST endpoints, middleware, auth callbacks, Stripe webhooks, Supabase client |
| `packages/ui` | Shared UI component library | Design system primitives (Button, Card, Modal, CodeBlock, ProgressBar) |
| `packages/config` | Shared configuration | TypeScript configs, ESLint presets, Tailwind theme tokens, shared constants |
| `packages/supabase` | Database layer | Schema migrations, seed data, typed client, RLS policies, Edge Functions |
| `packages/themes` | Theme asset packages | Per-theme CSS (`@theme` overrides), illustrations, mascot SVGs, copy variants |
| `packages/content` | Content source files | MDX lessons, exercise definitions, frontmatter schemas, validation scripts |
| `packages/analytics` | Analytics abstraction | Event definitions, PostHog client wrapper, type-safe tracking functions |
| `packages/github` | GitHub integration module | GitHub App client, GraphQL mutations, commit builders, repo scaffolding |

---

## 2. Content Pipeline Definition

### 2.1 Content Architecture

Tensorcraft uses a **Core + Theme Layer** architecture. All pedagogical content is authored once in a core layer, and theme-specific wrappers provide narrative context, visual styling, and flavor text.

#### Core Layer

The core layer contains the canonical lesson content: explanations, code exercises, quizzes, and learning objectives. It is theme-agnostic and uses neutral language.

#### Theme Layer

Each theme provides overrides and extensions:

- **Narrative wrappers:** Story context that introduces and frames each lesson.
- **Visual assets:** Illustrations, mascots, background patterns, color palettes.
- **Flavor copy:** Theme-specific tooltips, encouragement messages, error messages.
- **CSS overrides:** `@theme` directive blocks that re-skin the UI.

#### Directory Structure

| Directory | Purpose | Example Path |
|-----------|---------|-------------|
| `packages/content/core/` | Core curriculum (theme-agnostic MDX) | `core/module-01/lesson-01.mdx` |
| `packages/content/themes/` | Theme narrative wrappers and flavor text | `themes/cyberpunk/module-01/lesson-01-wrapper.mdx` |
| `packages/themes/{name}/assets/` | Theme illustrations, SVGs, images | `themes/cyberpunk/assets/mascot.svg` |
| `packages/themes/{name}/css/` | Theme CSS with `@theme` directive | `themes/cyberpunk/css/theme.css` |
| `packages/content/exercises/` | Sandpack exercise definitions (shared) | `exercises/module-01/exercise-01.json` |

### 2.2 MDX Lesson Schema

Every MDX lesson file must include a frontmatter block conforming to this schema. The build pipeline validates all frontmatter at CI time.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique lesson identifier, format: `mod-{nn}-les-{nn}` (e.g., `mod-01-les-03`) |
| `title` | `string` | Yes | Human-readable lesson title, max 80 characters |
| `slug` | `string` | Yes | URL-safe slug used in routing (e.g., `what-is-a-tensor`) |
| `module` | `string` | Yes | Parent module identifier (e.g., `mod-01`) |
| `moduleTitle` | `string` | Yes | Human-readable module title for breadcrumbs and navigation |
| `order` | `number` | Yes | Sort order within the module (1-indexed) |
| `estimatedMinutes` | `number` | Yes | Estimated completion time in minutes (used in UI and analytics) |
| `difficulty` | `enum` | Yes | One of: `beginner`, `intermediate`, `advanced` |
| `objectives` | `string[]` | Yes | Learning objectives displayed at lesson start (2--5 items) |
| `prerequisites` | `string[]` | No | Array of lesson IDs that should be completed first |
| `keywords` | `string[]` | Yes | SEO and search keywords (3--8 items) |
| `hasExercise` | `boolean` | Yes | Whether the lesson includes a Sandpack exercise |
| `exerciseId` | `string` | Conditional | Required if `hasExercise` is true; references exercise definition |
| `hasQuiz` | `boolean` | Yes | Whether the lesson includes an inline quiz |
| `publishedAt` | `string (ISO 8601)` | No | Publication date; if absent or future, lesson is draft |
| `updatedAt` | `string (ISO 8601)` | No | Last content update date for cache invalidation |
| `authors` | `string[]` | No | List of content author identifiers for attribution |

### 2.3 MDX Lesson Structure --- Component Inventory

Lessons are authored in MDX and use a library of custom React components. These components are auto-imported via the MDX provider and do not need explicit imports.

| Component | Purpose | Usage |
|-----------|---------|-------|
| `<LearningObjectives>` | Renders the lesson's objectives as a styled checklist at the top | `<LearningObjectives objectives={frontmatter.objectives} />` |
| `<Concept>` | Wraps a key concept explanation with a highlighted callout box | `<Concept title="Gradient Descent">...</Concept>` |
| `<MathBlock>` | Renders LaTeX math expressions using KaTeX | `<MathBlock>{"\\nabla f(x) = ..."}</MathBlock>` |
| `<CodeBlock>` | Syntax-highlighted static code snippet with copy button | `<CodeBlock lang="python" title="model.py">...</CodeBlock>` |
| `<InteractiveDemo>` | Embeds a lightweight interactive visualization (no code editing) | `<InteractiveDemo id="gradient-descent-2d" />` |
| `<Exercise>` | Mounts the full Sandpack exercise environment for the lesson | `<Exercise exerciseId="mod-01-ex-03" />` |
| `<Quiz>` | Inline multiple-choice or fill-in-the-blank quiz block | `<Quiz questions={[...]} />` |
| `<RecallPrompt>` | Spaced-repetition prompt that asks the learner to recall a prior concept | `<RecallPrompt lessonRef="mod-01-les-01" concept="tensors" />` |
| `<KeyTakeaways>` | End-of-lesson summary box listing 3--5 key points | `<KeyTakeaways points={["Tensors are...", "Gradients..."]} />` |
| `<NextLesson>` | Navigation CTA linking to the next lesson in the module | `<NextLesson slug="backpropagation-basics" />` |

### 2.4 Theme Manifest Specification

Each theme ships a `manifest.json` file at its package root. This manifest drives the theme selection UI, asset loading, and content resolution.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique theme identifier (e.g., `cyberpunk`, `botanical`, `retro-arcade`) |
| `name` | `string` | Yes | Display name shown in the theme picker (e.g., "Cyberpunk Neural Nets") |
| `tagline` | `string` | Yes | One-line description for the theme selection card (max 120 chars) |
| `description` | `string` | Yes | Full description shown on hover or expand (max 300 chars) |
| `icon` | `string` | Yes | Path to theme icon SVG relative to package root |
| `previewImage` | `string` | Yes | Path to theme preview image (16:9 ratio, min 800x450) |
| `colorPrimary` | `string` | Yes | Primary brand color as hex (e.g., `#00FF41`) for UI accents |
| `colorSecondary` | `string` | Yes | Secondary color as hex for gradients and backgrounds |
| `colorSurface` | `string` | Yes | Surface/card background color as hex |
| `mascot` | `string` | No | Path to mascot SVG/animated SVG if the theme has a mascot character |
| `cssEntrypoint` | `string` | Yes | Path to the theme's main CSS file containing `@theme` overrides |
| `supportedLocales` | `string[]` | Yes | Array of locale codes this theme is available in (e.g., `["en"]`) |

#### Theme Selection UI Behavior

1. **First Visit:** Users are presented with the theme picker as a full-screen modal during onboarding. All available themes are shown as cards with preview image, name, tagline, and primary color accent.
2. **Selection:** Clicking a theme card applies it immediately via CSS custom property injection and stores the preference in the user's Supabase profile (`preferred_theme` column).
3. **Switching:** Users can switch themes at any time from Settings. The switch is instant (CSS-only, no page reload) and persists across sessions.
4. **Fallback:** If a theme does not yet have content for a specific lesson, the core (unthemed) version is rendered with a subtle banner: "This lesson is not yet available in your selected theme. Showing the standard version."
5. **Guest Users:** Theme preference is stored in `localStorage` and synced to Supabase upon account creation.

### Database Schema (Supabase / PostgreSQL)

Tables use Supabase Auth for user management. Row-Level Security (RLS) enforced on all tables.

#### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | References `auth.users.id` |
| display_name | text | |
| avatar_url | text | Nullable |
| preferred_theme | text | Default: `'deep-orbit'` |
| github_connected | boolean | Default: `false` |
| github_username | text | Nullable |
| github_repo_id | bigint | Nullable |
| onboarding_completed | boolean | Default: `false` |
| created_at | timestamptz | Default: `now()` |
| updated_at | timestamptz | Default: `now()` |

#### `purchases`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| theme_ids | text[] | Array of purchased theme slugs |
| amount_cents | integer | Amount in cents |
| currency | text | Default: `'usd'` |
| stripe_session_id | text | Unique |
| ppp_discount_pct | integer | 0–70 |
| created_at | timestamptz | Default: `now()` |

#### `theme_progress`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| theme_id | text | Theme slug |
| module_id | integer | 1–11 |
| lesson_id | integer | 1–5 |
| status | text | `not_started`, `in_progress`, `completed` |
| score | integer | 0–100, nullable |
| hints_used | integer | Default: 0 |
| started_at | timestamptz | Nullable |
| completed_at | timestamptz | Nullable |

**Unique constraint:** `(user_id, theme_id, module_id, lesson_id)`

#### `waitlist_signups`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| email | text | |
| theme_id | text | Theme slug they're interested in |
| created_at | timestamptz | Default: `now()` |

**Unique constraint:** `(email, theme_id)`

---

## 3. Sandpack Exercise Architecture

### 3.1 Exercise Data Model

Each exercise is defined as a JSON file in `packages/content/exercises/`. The Sandpack runtime consumes this definition to configure the editor, file system, and test runner.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exerciseId` | `string` | Yes | Unique identifier matching the MDX `exerciseId` field (e.g., `mod-01-ex-03`) |
| `title` | `string` | Yes | Exercise title displayed above the editor |
| `instructions` | `string` | Yes | Markdown-formatted instructions shown in the left panel |
| `starterCode` | `Record<string, string>` | Yes | Map of filename to initial file content (e.g., `{"model.py": "import torch\n..."}`) |
| `solutionCode` | `Record<string, string>` | Yes | Map of filename to solution content (hidden until user requests hint or completes) |
| `testCode` | `string` | Yes | Test file content executed to validate the user's solution |
| `entryFile` | `string` | Yes | The primary file the user is expected to edit (e.g., `model.py`) |
| `hiddenFiles` | `string[]` | No | Files present in the sandbox but hidden from the user (e.g., test utilities, data loaders) |
| `dependencies` | `Record<string, string>` | No | NPM package dependencies required by the exercise (e.g., `{"@tensorflow/tfjs": "^4.0.0"}`) |

### 3.2 Test Validation Strategy

Exercises are validated using a **test-driven** approach. Each exercise includes a test file that runs inside the Sandpack runtime.

- **Test Framework:** Exercises use a lightweight custom test runner bundled as a hidden file. The runner exposes `describe`, `it`, `expect`, and `assertClose` (for floating-point ML outputs).
- **Execution:** Tests run automatically when the user clicks "Run" or "Submit." The test output is captured and displayed in a results panel below the editor.
- **Partial Credit:** Tests are structured so that individual assertions can pass independently. The UI shows a checklist of passing/failing test cases, giving learners incremental feedback.
- **Timeout:** Each test suite has a 10-second execution timeout. If exceeded, the runner reports a timeout error with a suggestion to check for infinite loops.
- **Output Capture:** `console.log` and `console.error` output from the user's code is captured and displayed in a separate "Console" tab alongside test results.

### 3.3 Friendly Error Mapping

Raw JavaScript/Python errors are intercepted and mapped to beginner-friendly messages. This reduces frustration and accelerates learning.

**Examples:**

| Raw Error | Friendly Message |
|-----------|-----------------|
| `TypeError: Cannot read properties of undefined (reading 'shape')` | "It looks like your tensor variable hasn't been created yet. Make sure you've defined it before trying to access `.shape`." |
| `RangeError: Maximum call stack size exceeded` | "Your code seems to be calling itself in an infinite loop. Check your recursive function --- does it have a base case that stops the recursion?" |
| `SyntaxError: Unexpected token` | "There's a syntax issue in your code. Common causes: missing closing bracket, extra comma, or a typo in a keyword. Check the line number above." |
| `Error: Dimension mismatch` | "The tensor dimensions don't match for this operation. Your left tensor is shape [X] and your right tensor is shape [Y]. They need to be compatible." |
| `TimeoutError: Execution timed out` | "Your code took too long to run (over 10 seconds). This usually means an infinite loop. Look for `while` or `for` loops that might not be terminating." |

### 3.4 SSR Considerations

Sandpack is a client-only component and cannot be server-side rendered. The following strategies are used:

- **Dynamic Import:** The `<Exercise>` component is loaded via `next/dynamic` with `ssr: false`. This prevents Sandpack from being included in the server-rendered HTML.
- **Loading Skeleton:** While Sandpack loads on the client, a styled skeleton placeholder is shown matching the editor's dimensions. This prevents layout shift (CLS = 0).
- **Intersection Observer:** On lesson pages, Sandpack is not hydrated until the exercise section scrolls into the viewport (or within 200px of it). This keeps the initial page load fast.
- **Preload Hint:** A `<link rel="preload">` tag is injected for the Sandpack bundle when the lesson has `hasExercise: true`, so the browser fetches it early without blocking render.
- **Fallback for No-JS:** If JavaScript is disabled, the exercise area shows a static code block with the starter code and a message: "Enable JavaScript to use the interactive code editor."

### 3.5 Mobile Responsiveness

#### Layout

- On viewports >= 1024px, the exercise uses a **side-by-side layout**: instructions on the left (40%) and code editor on the right (60%).
- On viewports 768px--1023px, the layout switches to a **stacked layout**: instructions on top, editor below, with a sticky tab bar to toggle between them.
- On viewports < 768px, a **single-panel tabbed view** is used with tabs for Instructions, Code, and Output.

#### Sandpack on Mobile

- The Sandpack editor is configured with `showLineNumbers: false` and reduced font size (13px) on mobile to maximize usable space.
- The file explorer is collapsed by default on mobile and accessible via a hamburger icon.
- Auto-complete popups are disabled on mobile to avoid covering the small screen.

#### Touch Optimization

- The "Run" button is enlarged to a minimum 48x48px touch target on mobile.
- Swipe gestures are disabled within the editor to prevent conflicts with code scrolling.
- A floating action button (FAB) provides quick access to "Run," "Reset," and "Hint" actions.

#### Non-Essential UI

- On mobile, the following elements are hidden: the diff view toggle, the file explorer sidebar, and the console tab (accessible via the output panel instead).
- Theme decorations (mascot, background patterns) are simplified or hidden on mobile to reduce visual clutter.

#### Device Testing

- Exercises are tested on iOS Safari 17+, Chrome Android 120+, and Samsung Internet 24+.
- Minimum supported screen width is 320px (iPhone SE).
- Touch event handling is validated on both iOS and Android to ensure code editing works smoothly.

---

## 4. Analytics Layer (Day One)

Analytics are a first-class concern, instrumented from the initial launch. Every user interaction with learning content is tracked to drive product decisions, content improvements, and business metrics.

### 4.1 Tool Selection

| Tool | Role | Justification |
|------|------|--------------|
| PostHog | Product analytics + feature flags | Open-source, self-hostable, generous free tier (1M events/mo), built-in session replay, feature flags, and A/B testing. Avoids vendor lock-in. |
| Supabase Analytics (pg_analytics) | Database-level reporting | Direct SQL queries on user progress data for content team dashboards. No additional tooling needed. |
| Vercel Analytics | Web Vitals + performance | Automatic Core Web Vitals tracking (LCP, FID, CLS) per route. Zero-config with Vercel hosting. |
| Sentry | Error tracking + performance | Real-time error monitoring with source maps. Sandpack errors are tagged separately from platform errors. |

### 4.2 Event Taxonomy

All events are typed in `packages/analytics/events.ts` and tracked via a type-safe `track()` function. Event names use `snake_case`. Properties use `camelCase`.

#### Learning Events

| Event Name | Properties | Trigger |
|------------|-----------|---------|
| `lesson_started` | `lessonId`, `moduleId`, `themeId`, `difficulty`, `estimatedMinutes` | User opens a lesson page and scrolls past the hero section |
| `lesson_completed` | `lessonId`, `moduleId`, `themeId`, `timeSpentSeconds`, `scrollDepthPercent` | User reaches the `<KeyTakeaways>` component at the bottom |
| `exercise_started` | `exerciseId`, `lessonId`, `moduleId` | Sandpack editor mounts and user makes their first keystroke |
| `exercise_submitted` | `exerciseId`, `lessonId`, `attemptNumber`, `testsPassed`, `testsTotal`, `codeLength` | User clicks "Submit" or "Run Tests" |
| `exercise_completed` | `exerciseId`, `lessonId`, `attemptNumber`, `timeSpentSeconds`, `hintsUsed` | All tests pass for the first time |
| `exercise_hint_requested` | `exerciseId`, `lessonId`, `hintLevel` (1 = nudge, 2 = partial, 3 = solution) | User clicks "Hint" button (tracked per hint level) |
| `quiz_answered` | `lessonId`, `questionIndex`, `isCorrect`, `selectedAnswer`, `timeSpentSeconds` | User submits a quiz answer |
| `module_completed` | `moduleId`, `themeId`, `totalTimeSeconds`, `lessonsCompleted`, `exercisesCompleted` | User completes the final lesson in a module |

#### Engagement Events

| Event Name | Properties | Trigger |
|------------|-----------|---------|
| `theme_selected` | `themeId`, `previousThemeId`, `isFirstSelection` | User selects or switches a theme |
| `theme_switched` | `fromThemeId`, `toThemeId`, `lessonId` (if mid-lesson) | User changes theme from Settings |
| `recall_prompt_shown` | `lessonId`, `referencedLessonId`, `concept` | A `<RecallPrompt>` component enters the viewport |
| `recall_prompt_answered` | `lessonId`, `referencedLessonId`, `selfRatedRecall` (1--5) | User self-rates their recall |
| `page_scroll_depth` | `lessonId`, `depth` (25, 50, 75, 100) | User scrolls past 25% increments of the page |
| `session_duration` | `totalSeconds`, `lessonsViewed`, `exercisesAttempted` | Fires on session end (tab close / 30-min inactivity) |

#### Conversion Events

| Event Name | Properties | Trigger |
|------------|-----------|---------|
| `signup_started` | `source` (landing, lesson-gate, pricing), `themeId` | User initiates signup flow |
| `signup_completed` | `method` (github, email, google), `source`, `themeId` | Account successfully created |
| `paywall_shown` | `lessonId`, `moduleId`, `paywallType` (soft, hard) | Free content limit reached and paywall appears |
| `checkout_started` | `planId`, `planId, source` | User clicks "Subscribe" and Stripe Checkout opens |
| `checkout_completed` | `planId`, `billingInterval`, `revenue`, `currency`, `couponCode` | Stripe webhook confirms successful payment |
| `checkout_abandoned` | `planId`, `source, timeOnCheckoutSeconds` | User closes Stripe Checkout without completing |
| `github_connected` | `hasExistingRepo`, `repoVisibility` (public, private) | User connects their GitHub account |
| `github_commit_pushed` | `exerciseId`, `commitSha`, `filesChanged` | Code is successfully committed to the user's repo |

### 4.3 Critical Derived Metrics

These metrics are computed from raw events and displayed on the internal analytics dashboard.

| Metric | Formula | Threshold / Target |
|--------|---------|-------------------|
| **Lesson Completion Rate** | `lesson_completed / lesson_started` per lesson | Target: >= 75% for beginner, >= 60% for intermediate, >= 45% for advanced |
| **Exercise Pass Rate** | `exercise_completed / exercise_started` per exercise | Target: >= 70% within 3 attempts. Below 50% triggers content review. |
| **Average Attempts to Pass** | `mean(attemptNumber)` from `exercise_completed` events | Target: 1.5--2.5 attempts. Above 3.0 suggests the exercise is too hard; below 1.2 suggests it's too easy. |
| **Hint Dependency Rate** | `exercise_completed WHERE hintsUsed > 0 / exercise_completed` | Target: <= 40%. Above 60% triggers exercise redesign. |
| **Free-to-Paid Conversion** | `checkout_completed / signup_completed` within 30 days | Target: >= 5% of signups. Track cohort-weekly. |
| **Time-to-First-Exercise** | `median(exercise_started.timestamp - signup_completed.timestamp)` | Target: < 15 minutes. Indicates onboarding friction if high. |
| **7-Day Retention** | `users active on day 7 / signup_completed` in same cohort | Target: >= 30%. Below 20% triggers onboarding investigation. |

### 4.4 Data Pipeline

#### PostHog Setup

- **Instance:** PostHog Cloud (EU region) for GDPR compliance. Self-hosted migration path documented for future scale.
- **Client SDK:** `posthog-js` initialized in `apps/web/app/providers.tsx`. The wrapper in `packages/analytics` ensures all events pass through a single typed interface.
- **Server-side:** The Hono API (`apps/api`) uses `posthog-node` to track server-side events (e.g., `checkout_completed` from Stripe webhooks, `github_commit_pushed` from the commit flow).
- **Feature Flags:** PostHog feature flags gate new content and UI experiments. Flags are evaluated server-side in Next.js middleware for instant page-level gating.
- **Session Replay:** Enabled for 10% of sessions initially. Sampling rate adjustable via PostHog dashboard. Replays are auto-tagged with `lessonId` and `themeId` for targeted review.
- **Data Retention:** Raw events retained for 12 months. Aggregated metrics retained indefinitely.
- **PII Policy:** No PII (name, email) is sent to PostHog. Users are identified by a hashed `userId`. Email-based cohort analysis is done in Supabase directly.

---

## 5. GitHub Integration Architecture

### 5.1 GitHub App (Not OAuth App)

Tensorcraft registers a **GitHub App** (not an OAuth App) for repository integration. This is a deliberate architectural choice:

| Concern | OAuth App | GitHub App (Chosen) |
|---------|-----------|-------------------|
| **Permissions** | Broad user-level scopes | Fine-grained, per-repository permissions |
| **Rate Limits** | 5,000 req/hr shared across user | 5,000 req/hr per installation (separate quota) |
| **Token Lifetime** | Long-lived tokens | Short-lived installation tokens (1 hr), auto-refreshed |
| **User Experience** | Requests broad access at login | Installed per-repo with explicit permission grant |
| **Security** | Token compromise = full account access | Token compromise = limited to installed repos only |
| **Webhook Delivery** | Requires separate webhook config | Built-in webhook subscriptions per event type |

**App Permissions Required:**

- `contents: write` --- Read and write repository contents (for committing code).
- `metadata: read` --- Read repository metadata (for listing repos, checking existence).
- `single_file: read` (`.tensorcraft/config.json`) --- Read the Tensorcraft config file if present.

### 5.2 Commit Flow

Commits are created via the GitHub GraphQL API using the `createCommitOnBranch` mutation. This avoids cloning repositories and enables atomic, server-side commits.

**Flow:**

1. User completes an exercise and clicks "Save to GitHub."
2. The frontend sends the completed code to the Hono API (`POST /api/github/commit`).
3. The API retrieves a fresh installation token for the user's GitHub App installation.
4. The API executes the `createCommitOnBranch` GraphQL mutation:
   - **Branch:** `main` (or the user's configured default branch).
   - **Files:** The exercise solution files, placed in the repo according to the repo structure (see 5.4).
   - **Commit message:** Auto-generated: `feat(mod-01): Complete exercise --- {exercise title}`.
   - **Author:** The authenticated GitHub user.
5. On success, the API fires a `github_commit_pushed` analytics event and returns the commit SHA to the frontend.
6. The frontend displays a success toast with a link to the commit on GitHub.

**GraphQL Mutation:**

```graphql
mutation CreateCommit($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) {
    commit {
      oid
      url
    }
  }
}
```

**Error Handling:**

- **Repo not found:** Prompt user to install the GitHub App on their target repo.
- **Permission denied:** Prompt user to check App installation permissions.
- **Branch protection:** If `main` is protected, create commit on a `tensorcraft/exercise-{id}` branch and notify the user.
- **Conflict:** If the target file already exists with different content, create a new commit that overwrites (exercises are idempotent).

### 5.3 Opt-Out Flow

GitHub integration is entirely optional. Users who prefer not to connect GitHub can still complete all exercises; their code is stored in Supabase only.

- **During Onboarding:** The GitHub connection step shows a "Skip for now" link. No friction or guilt-tripping.
- **In Settings:** Users can disconnect their GitHub App installation at any time. Disconnecting does not delete previously pushed commits.
- **Visual Indicator:** Lessons show a subtle GitHub icon badge when integration is active. When not connected, the "Save to GitHub" button is replaced with "Save Progress" (Supabase-only).
- **Data Cleanup:** When a user disconnects, the API revokes the installation token and removes the `github_installation_id` from their Supabase profile. No data is deleted from GitHub.

**Retroactive push:** When a user connects GitHub after completing lessons, the system queues all completed lesson artifacts for push in chronological order. Each lesson is committed as a separate commit with the original completion timestamp in the commit message (e.g., "M1L3: Pattern Recognition — completed 2026-03-08"). The push runs as a background job, with a progress indicator shown in Settings. If the repository already contains conflicting files, the system creates a new branch `tensorcraft/retroactive-sync` and opens a PR.

### 5.4 Repo Structure

When a user connects GitHub, Tensorcraft creates (or uses) a repository with the following structure:

| Path | Content | Creation Timing |
|------|---------|----------------|
| `README.md` | Auto-generated repo overview with learning progress badge and module list | Created on first commit; updated on each subsequent commit |
| `.tensorcraft/config.json` | Repo metadata: `userId`, `themeId`, `createdAt`, platform version | Created on first commit |
| `module-01/` | Directory for Module 1 exercises | Created when first Module 1 exercise is committed |
| `module-01/exercise-01.py` | Completed exercise code | Created when exercise is completed and saved |
| `module-01/exercise-01.test.py` | Test file that validates the exercise (read-only reference) | Created alongside exercise code |
| `module-01/README.md` | Module overview: title, objectives, completion status | Created with first exercise in the module; updated on each commit |
| `PROGRESS.md` | Markdown table of all completed exercises with dates and attempt counts | Created on first commit; appended on each subsequent commit |

**Repository naming:** `tensorcraft-{theme-slug}` (e.g., `tensorcraft-deep-orbit`). The internal project folder within the repo uses the theme-specific project name from the curriculum (e.g., `deep-scan-signal-classifier` for Deep Orbit).

---

## 6. Content Calendar with Dependencies

### 6.1 V0.5 Content (MVP --- 15 Lessons)

The V0.5 release delivers the first 15 lessons across the foundational modules. This is sufficient for a public beta and initial user feedback.

| # | Lesson | Module | Week | Dependencies | Blockers |
|---|--------|--------|------|-------------|----------|
| 1 | What is Machine Learning? | Mod 01: Foundations | Week 1 | None | None |
| 2 | Supervised vs. Unsupervised Learning | Mod 01: Foundations | Week 1 | Lesson 1 | None |
| 3 | Your First Dataset | Mod 01: Foundations | Week 2 | Lesson 2 | Sandpack exercise component |
| 4 | Tensors and Arrays | Mod 02: Math Essentials | Week 2 | Lesson 2 | MathBlock component (KaTeX) |
| 5 | Matrix Operations for ML | Mod 02: Math Essentials | Week 3 | Lesson 4 | MathBlock component (KaTeX) |
| 6 | Introduction to NumPy | Mod 02: Math Essentials | Week 3 | Lesson 4 | Sandpack Python runtime |
| 7 | Linear Regression from Scratch | Mod 03: First Models | Week 4 | Lessons 5, 6 | InteractiveDemo component |
| 8 | Gradient Descent Explained | Mod 03: First Models | Week 4 | Lesson 7 | InteractiveDemo (2D gradient viz) |
| 9 | Cost Functions and Optimization | Mod 03: First Models | Week 5 | Lesson 8 | MathBlock component |
| 10 | Implementing Gradient Descent | Mod 03: First Models | Week 5 | Lesson 9 | Sandpack Python runtime |
| 11 | Introduction to Classification | Mod 04: Classification | Week 6 | Lesson 7 | None |
| 12 | Logistic Regression | Mod 04: Classification | Week 7 | Lessons 9, 11 | None |
| 13 | Decision Boundaries | Mod 04: Classification | Week 7 | Lesson 12 | InteractiveDemo (decision boundary viz) |
| 14 | Evaluating Classifiers (Accuracy, Precision, Recall) | Mod 04: Classification | Week 8 | Lesson 12 | Quiz component |
| 15 | Your First ML Pipeline (Capstone) | Mod 04: Classification | Week 9--10 | Lessons 10, 14 | GitHub integration, full Sandpack |

### 6.2 V1.0 Content (Full Course --- 8 Modules)

V1.0 expands to the full curriculum. Modules 1--4 are polished from V0.5. Modules 5--8 are new.

| Module | Title | Lessons | Weeks | Dependencies | Parallelization |
|--------|-------|---------|-------|-------------|----------------|
| Mod 01 | Foundations of ML | 5 | Weeks 1--2 | None | Can be written immediately |
| Mod 02 | Math Essentials | 5 | Weeks 2--4 | Mod 01 complete | Parallelizable with Mod 01 (shared author) |
| Mod 03 | First Models | 6 | Weeks 4--6 | Mod 02 complete | Requires InteractiveDemo component ready |
| Mod 04 | Classification | 5 | Weeks 6--8 | Mod 03 complete | Parallelizable with Mod 03 (different author) |
| Mod 05 | Neural Network Fundamentals | 7 | Weeks 8--11 | Mod 03, Mod 04 complete | Requires TensorFlow.js Sandpack template |
| Mod 06 | Convolutional Neural Networks | 6 | Weeks 11--14 | Mod 05 complete | Requires image upload exercise support |
| Mod 07 | Sequence Models and NLP | 6 | Weeks 14--17 | Mod 05 complete | Parallelizable with Mod 06 (different author) |
| Mod 08 | Capstone Projects | 4 | Weeks 17--20 | All prior modules | Requires full GitHub integration and project scaffolding |

### 6.3 Platform Components Calendar

These are the engineering deliverables required to unblock content. Each component has a build window and content dependencies.

| Component | Build Weeks | Dependencies | Unblocks |
|-----------|-------------|-------------|----------|
| MDX rendering pipeline | Weeks 1--2 | Next.js App Router setup | All lesson content |
| `<LearningObjectives>` component | Week 1 | UI package setup | All lessons |
| `<Concept>` + `<KeyTakeaways>` components | Week 1 | UI package setup | All lessons |
| `<MathBlock>` (KaTeX) component | Week 2 | UI package, KaTeX integration | Mod 02 lessons |
| `<CodeBlock>` component | Week 1 | UI package, Shiki syntax highlighter | All lessons |
| Sandpack `<Exercise>` component | Weeks 2--3 | Sandpack SDK, test runner, error mapping | Mod 01 Lesson 3 onward |
| `<InteractiveDemo>` framework | Weeks 3--4 | D3.js or Mafs.js integration | Mod 03 Lesson 7 onward |
| `<Quiz>` component | Week 3 | UI package, state management | Mod 04 Lesson 14 |
| `<RecallPrompt>` component | Week 4 | Supabase progress tracking, spaced repetition algo | Mod 02+ lessons |
| Theme system (CSS `@theme` + manifest) | Weeks 2--3 | Tailwind CSS 4 setup, design tokens | Theme-specific content wrappers |
| GitHub commit flow | Weeks 4--5 | GitHub App registration, GraphQL client | Mod 04 Lesson 15 (capstone) |
| Progress tracking API | Weeks 2--3 | Supabase schema, Hono API routes | Lesson/exercise completion tracking |

---

## 7. Internationalization

### 7.1 Architecture (English Only at Launch)

Tensorcraft launches with English-only content. However, the architecture is designed from day one to support multiple languages without refactoring.

**Principles:**

- **No hardcoded strings:** All UI strings (buttons, labels, error messages, tooltips) are externalized to locale files using `next-intl` (or a similar i18n library compatible with Next.js App Router).
- **Locale-aware routing:** URL structure supports locale prefixes: `/{locale}/learn/{theme}/{module}/{lesson}`. English uses the default (no prefix) for SEO continuity.
- **Content separation:** Translated lesson content lives in locale-specific directories: `packages/content/core/{locale}/module-01/lesson-01.mdx`.
- **Database:** The `lessons` and `modules` tables include a `locale` column. Progress tracking is locale-independent (a user's progress on `mod-01-les-01` applies regardless of the language they read it in).
- **RTL Support:** The CSS architecture supports `dir="rtl"` for future Arabic/Hebrew support. Tailwind CSS 4's logical properties (`ms-`, `me-`, `ps-`, `pe-`) are used instead of `ml-`/`mr-`.

### 7.2 Gradual Language Rollout

Languages are added incrementally, configured via a central language configuration.

#### Language Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | `string` | Yes | BCP 47 language code (e.g., `en`, `es`, `pt-BR`, `ja`) |
| `name` | `string` | Yes | Native language name (e.g., "Espanol", "Portugues (Brasil)", "Japanese") |
| `englishName` | `string` | Yes | English name for internal dashboards (e.g., "Spanish", "Brazilian Portuguese") |
| `direction` | `enum` | Yes | Text direction: `ltr` or `rtl` |
| `enabled` | `boolean` | Yes | Whether this locale is publicly available. Disabled locales are accessible only in preview mode. |
| `completionPercent` | `number` | Yes | Percentage of total content translated (auto-calculated). Displayed on the language selector. |

### 7.3 Per-Theme, Per-Language Publishing

Content availability is a matrix of `theme x locale`. Not all themes will be available in all languages simultaneously.

- **Publishing matrix:** A configuration file (`packages/content/publishing-matrix.json`) defines which `(theme, locale)` pairs are published.
- **Fallback chain:** If a lesson is not available in the user's selected `(theme, locale)` pair, the system falls back in this order:
  1. Same theme, English locale.
  2. Core (no theme), user's locale.
  3. Core (no theme), English locale.
- **UI indicator:** When a fallback is active, a subtle banner informs the user: "This lesson is shown in English. Translation coming soon."
- **Translation progress:** The language selector shows per-language completion percentage. Languages below 80% completion are labeled "(Beta)."

### 7.4 Content Translation Workflow

Translations follow a structured three-step workflow to ensure quality and consistency.

| Step | Process | Estimated Cost |
|------|---------|---------------|
| **Step 1: Machine Translation** | Core MDX content is translated using DeepL API (or Google Cloud Translation v3) with custom glossaries for ML terminology. Output is stored in `packages/content/core/{locale}/` as draft MDX files. | ~$0.02 per 1,000 characters. Estimated $200--400 per full language for all V1.0 content. |
| **Step 2: Expert Review** | Native-speaking ML practitioners review each translated lesson for technical accuracy, natural phrasing, and correct terminology. Reviewers use a custom CMS or GitHub PR-based review flow. | ~$0.08 per word. Estimated $2,000--4,000 per language for expert review of V1.0 content. |
| **Step 3: Community QA** | After initial publication, community members can flag translation issues via an in-page "Suggest a correction" button. Corrections are triaged and merged by the content team. | No direct cost; requires content team triage (~2 hrs/week per active language). |

#### Glossary Management

- A shared ML glossary (`packages/content/glossary.json`) maps English terms to their translations in each supported language.
- Examples: "gradient descent" -> "descenso de gradiente" (es), "neural network" -> "reseau de neurones" (fr).
- The glossary is used by the machine translation step and by reviewers as a reference. It is version-controlled and updated as new terms are introduced.

### 7.5 Translation Phases

| Phase | Languages | Timing | Trigger |
|-------|-----------|--------|---------|
| **Phase 0 (Launch)** | English (`en`) | Day 1 | Platform launch |
| **Phase 1** | Spanish (`es`), Portuguese (`pt-BR`) | V1.0 + 2 months | >= 500 MAU from LATAM region (based on PostHog geo data) |
| **Phase 2** | Japanese (`ja`), Korean (`ko`), Simplified Chinese (`zh-CN`) | V1.0 + 4 months | >= 1,000 MAU from APAC region OR strategic partnership |
| **Phase 3** | French (`fr`), German (`de`), Arabic (`ar`) | V1.0 + 6 months | >= 2,000 MAU from target regions OR > 10,000 total MAU |

**Phase Criteria:**

- Each phase is triggered by reaching the MAU threshold from the target region, as measured by PostHog geo-analytics.
- Alternatively, a strategic partnership (e.g., university adoption in a target country) can trigger early translation.
- Arabic (`ar`) in Phase 3 activates the RTL layout support that was architecturally prepared from launch.
- Each phase begins with machine translation (Step 1) and targets expert-reviewed publication within 6 weeks of phase start.

---

*End of Technical Specification v3.2*


---
# FILE: marketing-plan.md
---

# Tensorcraft Marketing Plan v3.2

## Executive Summary

Tensorcraft is an interactive machine learning education platform built specifically for frontend engineers. Unlike traditional ML courses that assume Python fluency and data science backgrounds, Tensorcraft meets developers where they are — in the browser, with JavaScript, using concepts they already understand from React, Vue, and Angular development.

The platform's core differentiator is its library of 50+ FE-to-ML concept bridges: structured explanations that map familiar frontend patterns (component state, reactive data flow, event propagation, virtual DOM diffing) directly onto ML concepts (model weights, gradient descent, backpropagation, optimization). This approach eliminates the "blank slate" problem that causes most frontend developers to abandon ML learning within the first week.

Tensorcraft is delivered as five themed story-driven courses, each with a distinct narrative, visual identity, and character cast. All courses run entirely in the browser — no Python environment, no Jupyter notebooks, no conda installs. Learners purchase individual themes at $79 each (not a subscription), with Module 1 free across all themes to reduce friction. Early access pricing and team licenses provide additional entry points.

This marketing plan outlines the strategy for taking Tensorcraft from early access through full launch, targeting a community of 10,000 active learners and $500K in revenue within the first 18 months.

---

## Target Audience Personas

### Persona 1: "Bridge Builder" Brianna

- **Role:** Senior React Developer, 5 years experience
- **Age:** 28-34
- **Motivation:** Wants to add ML to her skillset without abandoning her frontend career path. Sees ML-powered features appearing in product roadmaps and wants to be the person who builds them, not the person who waits for the backend team.
- **Pain points:** Every ML course she has tried starts with NumPy and pandas. She does not want to learn Python as a prerequisite to learning ML. She has abandoned three Coursera courses.
- **Behavior:** Active on Twitter/X, reads dev.to weekly, attends 1-2 conferences per year. Buys courses when she trusts the creator. Prefers self-paced learning in 30-60 minute sessions.
- **Objection:** "Will this actually work in production, or is it just toy examples?"

### Persona 2: "Career Pivoter" Carlos

- **Role:** Mid-level Vue.js Developer, 3 years experience
- **Age:** 25-30
- **Motivation:** Wants to pivot into ML engineering or AI product development. Sees frontend as a stepping stone, not a destination. Wants a structured path that builds real understanding, not just API calls.
- **Pain points:** Overwhelmed by the ML ecosystem. Does not know where to start. Intimidated by the math. Needs hand-holding through the foundational concepts.
- **Behavior:** Active on Reddit (r/webdev, r/learnmachinelearning, r/cscareerquestions). Watches YouTube tutorials. Prefers cohort-based or community-supported learning.
- **Objection:** "Is this deep enough to actually get me a job in ML?"

### Persona 3: "Feature Builder" Fatima

- **Role:** Tech Lead at a startup, Angular/React stack, 7 years experience
- **Age:** 30-38
- **Motivation:** Her team needs to ship ML-powered features (recommendations, search ranking, anomaly detection) and she wants to prototype them herself before involving the data science team. She values speed and practicality.
- **Pain points:** Does not have time for a 40-hour course. Needs targeted, practical knowledge. Wants to understand enough ML to have informed conversations with data scientists and make architectural decisions.
- **Behavior:** Subscribes to newsletters, skims Hacker News, buys tools that save time. Will pay premium for quality. Likely to purchase team licenses.
- **Objection:** "I don't need theory, I need to ship. Will this help me ship?"

### Persona 4: "Curious Creator" Dev

- **Role:** Junior-to-mid frontend developer, freelancer or small agency
- **Age:** 22-28
- **Motivation:** Genuinely curious about ML. Watches 3Blue1Brown videos. Wants to understand how things work under the hood. Drawn to the aesthetic and storytelling aspects of Tensorcraft.
- **Pain points:** Free resources are scattered and inconsistent. Paid courses feel corporate and dry. Wants something that feels like a game or an experience, not a lecture.
- **Behavior:** Active on Twitter/X and Discord. Shares cool projects. Engages with creative developer content. Price-sensitive but will pay for something that feels special.
- **Objection:** "I can learn this for free on YouTube. Why should I pay?"

---

## Unique Value Proposition

**For frontend engineers who want to learn machine learning, Tensorcraft is the only interactive education platform that translates ML concepts into frontend language — using 50+ concept bridges that map React state to model weights, component lifecycles to training loops, and virtual DOM diffing to gradient descent — so you can learn ML without leaving the browser or learning Python first.**

### Key Differentiators

1. **50+ FE-to-ML Concept Bridges:** No other ML course systematically maps frontend knowledge to ML concepts. This is Tensorcraft's moat.
2. **Browser-native:** Zero setup. No Python, no Jupyter, no terminal. Open the URL and start learning. Exercises run in Sandpack.
3. **Story-driven themes:** Each course has characters, narrative arcs, and a distinct visual identity. Learning feels like playing a game, not watching a lecture.
4. **Per-theme pricing:** Pay once, own forever. No subscription fatigue. No "cancel before the trial ends" anxiety.
5. **Dark/neon aesthetic:** Tensorcraft looks like nothing else in the education space. The visual identity itself is a marketing asset.
6. **Free Module 1:** Every theme offers its first module free. Learners can experience the full quality before paying.

---

## Pricing Strategy

### Individual Pricing

| Tier | Price | Includes |
|------|-------|----------|

| Single Theme | $79 | All modules of one theme |
| Two Themes | $129 | Any two themes ($18 savings) |
| Three Themes | $169 | Any three themes ($68 savings) |

### Team Pricing

| Tier | Price | Per-seat cost |
|------|-------|---------------|
| Team of 5 | TBD | Planned for post-V1.0 |
| Team of 10 | TBD | Planned for post-V1.0 |
| Site License | TBD | Planned for post-V1.0 |

### Purchasing Power Parity

- 20-70% discount based on country, delivered via ParityDeals
- Ensures global accessibility without devaluing the product in primary markets
- PPP badge displayed at checkout: "We noticed you're visiting from [country]. Here's an adjusted price."

### Pricing Psychology

- The $79 single-theme price anchors against $129 for two, making the bundle feel like a deal.
- Free Module 1 creates trial; $79 full theme creates conversion.
- Free Module 1 eliminates purchase anxiety. Learners already know what they are getting.
- Team pricing positioned as "all themes included" to increase perceived value.
- No subscription means no churn problem. Revenue is transactional but predictable via launch cycles.

---

## Release Timeline

### Phase 1: Foundation (Months 1-6)

- **Month 1-2:** Core platform development. Landing page live. Email capture begins.
- **Month 3-4:** Content production for Deep Orbit Modules 1-3. Beta tester recruitment.
- **Month 5:** Closed beta with 50-100 testers. Collect feedback, fix issues.
- **Month 6 (V0.5):** Public launch — Deep Orbit at $79. Module 1 free preview.

### Phase 2: Completion (Months 7-10)

- **Month 7-8:** Deep Orbit Modules 4-6 production. Community building intensifies.
- **Month 9:** Deep Orbit Modules 4-6 released to early access buyers (free update).
- **Month 10 (V1.0):** Deep Orbit complete. Price moves to $79. Full launch campaign.

### Phase 3: Expansion (Months 11-14)

- **Month 11:** Neon Protocol production begins. Deep Orbit marketing continues.
- **Month 12-14 (V2.0):** Neon Protocol early access, then full release. Bundle pricing activated.

### Phase 4: Scale (Months 15-18)

- **Month 15-16:** Signal Ward production.
- **Month 17-18:** Signal Ward release. Three-theme bundles available. Team sales push.

---

# PART 1: SEO STRATEGY

## 1.1 Programmatic SEO

Generate hundreds of indexable pages from structured data patterns. Each template auto-generates pages targeting long-tail keywords.

| Template Type | URL Pattern | Est. Pages | Keyword Pattern |
|---------------|-------------|------------|-----------------|
| Bridge Pages | `/bridges/[fe-concept]-to-[ml-concept]` | 50-80 | "[FE concept] vs [ML concept]", "how [FE concept] relates to [ML concept]" |
| Glossary Entries | `/glossary/[term]` | 120-200 | "what is [term] in machine learning", "[term] explained for developers" |
| Comparison Pages | `/compare/[tool-a]-vs-[tool-b]` | 30-50 | "[tool A] vs [tool B] for JavaScript", "should I use [tool A] or [tool B]" |
| Cheat Sheets | `/cheatsheets/[topic]` | 20-30 | "[topic] cheat sheet", "[topic] quick reference for JS devs" |
| Code Examples | `/examples/[framework]/[ml-task]` | 150-300 | "[ml-task] in [framework]", "how to [ml-task] with [framework]" |
| FAQ Collections | `/faq/[category]` | 80-120 | "can I [question] with JavaScript", "how to [question] without Python" |
| Theme Previews | `/themes/[theme]/preview/[module]` | 150-500 | "[theme] module [N] preview", "tensorcraft [theme] walkthrough" |
| **Total** | | **600-1,280+** | |

**Critical success factor:** Every programmatic page must contain genuine, useful content — not thin keyword-stuffed templates. Google's helpful content update penalizes low-value programmatic pages. Each page should answer a real question a frontend developer would ask. Minimum 300 words of unique, hand-reviewed content per page. Pages are generated from a structured content database but individually quality-checked before indexing.

## 1.2 Topical Authority

Build complete topic clusters to establish Tensorcraft as the authoritative resource for frontend-to-ML education.

| Pillar | Cluster Pages | Target |
|--------|--------------|--------|
| ML Fundamentals for JS Devs | 15-20 articles covering neural networks, loss functions, optimizers, activation functions — all explained with JS analogies | Rank #1 for "machine learning JavaScript" cluster |
| TensorFlow.js Ecosystem | 12-18 tutorials on TF.js APIs, model loading, training in browser, WebGL backend, WASM backend | Rank top 3 for all "TensorFlow.js [topic]" queries |
| FE-to-ML Bridges | 50+ individual bridge pages, each mapping one FE concept to one ML concept with code examples | Own the entire "ML for React/Vue/Angular developers" space |
| Browser-Based ML | 10-15 articles on WebGPU, Web Workers for training, IndexedDB model caching, inference optimization | Rank for "machine learning in the browser" and related terms |
| Interactive ML Education | 8-12 articles on pedagogy, interactive learning, story-driven education, gamification in tech ed | Establish thought leadership in ML education niche |
| ML Career for Frontend Devs | 10-15 articles on career paths, interview prep, portfolio projects, salary expectations | Capture high-intent "career pivot" traffic |
| ML Project Tutorials | 15-25 end-to-end project walkthroughs building real ML features in React/Next.js/Vue apps | Rank for "build [ML feature] with [framework]" queries |

**Build order:** Start with FE-to-ML Bridges (the core differentiator), then ML Fundamentals for JS Devs (highest search volume), then TensorFlow.js Ecosystem (strong commercial intent). Remaining pillars build out in months 4-8. Each cluster should have its pillar page live before any supporting articles publish. Internal links from cluster pages always point up to the pillar.

## 1.3 Schema Markup

Implement structured data across all page types to enhance search appearance and enable rich results.

| Schema Type | Pages Applied To | Rich Result |
|-------------|-----------------|-------------|
| `Course` | Theme landing pages, module overviews | Course carousel in search, price, provider |
| `HowTo` | Bridge pages, tutorial articles | Step-by-step rich snippet with images |
| `FAQPage` | FAQ collections, glossary entries | Expandable FAQ accordion in search results |
| `Article` | Blog posts, concept explainers | Article rich result with author, date, image |
| `BreadcrumbList` | All pages | Breadcrumb trail in search results |
| `Organization` | Homepage, about page | Knowledge panel, logo, social links |

**Implementation:** Use Next.js `generateMetadata` with JSON-LD script tags. Schema is generated from the same structured content database that drives programmatic pages. Validate all schemas with Google's Rich Results Test before deployment. Monitor coverage in Google Search Console weekly. Use `@graph` pattern to combine multiple schema types on a single page.

## 1.4 Technical SEO for Next.js

| Concern | Strategy |
|---------|----------|
| Rendering | SSG for all public content pages (bridges, glossary, blog). ISR with 1-hour revalidation for dynamic pages (user counts, testimonials). SSR only for authenticated dashboard. |
| Sitemap | Auto-generated `sitemap.xml` via `next-sitemap`. Separate sitemaps for blog, bridges, glossary, themes. Submit to Google Search Console and Bing Webmaster Tools. |
| Core Web Vitals | LCP < 2.5s (preload hero images, font-display: swap). CLS < 0.1 (explicit dimensions on all images, skeleton loaders). INP < 200ms (defer non-critical JS, use `React.lazy` for below-fold components). |
| Crawl Budget | `robots.txt` blocks `/dashboard`, `/api`, `/admin`. Canonical tags on all pages. `noindex` on paginated archive pages beyond page 3. |
| Image Optimization | Next.js `<Image>` component with automatic WebP/AVIF conversion. Lazy loading for below-fold images. Explicit `width` and `height` on all images to prevent CLS. |
| URL Structure | Clean, descriptive URLs. No query parameters for content pages. Trailing slashes consistent (no trailing slash). 301 redirects for any URL changes. |
| Internationalization | `hreflang` tags for future localized content. Start with `en` only. Structure allows `/[locale]/` prefix when ready. |
| Mobile Optimization | Mobile-first indexing ready. Responsive design tested on all target devices. No mobile-specific URLs (single URL per page). Touch targets meet WCAG 2.5.5 (44x44px minimum). |

## 1.5 Internal Linking Architecture

A deliberate internal linking strategy reinforces topical authority and distributes page rank efficiently.

- **Hub-and-spoke model:** Each topical pillar page is a hub. All cluster articles link back to the hub and to 2-3 sibling articles. Hubs link down to every cluster article. This creates tight, crawlable topic clusters.
- **Breadcrumbs:** Every page displays a breadcrumb trail (Home > Bridges > React State to Model Weights). Breadcrumbs use `BreadcrumbList` schema markup. Breadcrumbs are both a navigation aid and a linking signal.
- **Related lessons widget:** At the bottom of every lesson and article, display 3-4 related content cards. Selection algorithm: same topic cluster first, then same theme, then highest-performing content. Cards include title, excerpt, and estimated read time.
- **Click depth rule:** No content page should be more than 3 clicks from the homepage. Bridges are 2 clicks (Home > Bridges > Individual Bridge). Blog posts are 2 clicks (Home > Blog > Post). Lessons are 3 clicks (Home > Theme > Module > Lesson). Monitor click depth with Screaming Frog monthly.

## 1.6 SEO Content Calendar

| Phase | Timeline | Focus | Monthly Output |
|-------|----------|-------|---------------|
| Phase 1: Foundation | Months 1-3 | Bridge pages (core 20), pillar pages for top 3 clusters, technical SEO setup, sitemap, schema | 20-25 pages/month |
| Phase 2: Expansion | Months 4-6 | Glossary build-out, comparison pages, remaining pillar pages, first programmatic templates | 30-40 pages/month |
| Phase 3: Scale | Months 7-12 | Full programmatic page generation, code examples, FAQ collections, cheat sheets | 50-80 pages/month |
| Phase 4: Optimization | Months 13-18 | Content refresh for underperforming pages, new cluster articles for emerging keywords, link building | 20-30 new + 20 refreshed/month |

---

# PART 2: LAUNCH PLATFORM PLAYBOOK

## 2.1 Launch Sequencing

Roll out across platforms in a deliberate sequence to maximize compounding momentum.

| Week | Platform | Action | Goal |
|------|----------|--------|------|
| Week 1 (Mon) | Email list | Launch announcement to full waitlist with early-access pricing | 200+ conversions from existing audience |
| Week 1 (Wed) | Twitter/X | Launch thread + pinned tweet + 24-hour engagement blitz | 500+ retweets, 2K+ likes, trending in dev community |
| Week 1 (Fri) | Dev.to | "Introducing Tensorcraft" post with embedded interactive demo | 5K+ views, 200+ reactions, dev.to front page |
| Week 2 (Tue) | Product Hunt | Full PH launch (see 2.2 for strategy) | Top 5 Product of the Day |
| Week 2 (Thu) | Hacker News | "Show HN" post (see 2.3 for strategy) | Front page, 100+ points |
| Week 3 (Mon) | Reddit | Posts to r/webdev, r/javascript, r/reactjs (value-first, not promo) | 500+ upvotes combined, 50+ comments |
| Week 3-4 | LinkedIn, YouTube, Hashnode, newsletters | Staggered rollout across remaining platforms | Sustained traffic over 2-week window |

## 2.2 ProductHunt Strategy

- **Timing:** Launch on Tuesday at 12:01 AM PT. Tuesday/Wednesday have highest engagement. Avoid Mondays (high competition from funded startups) and Fridays (low traffic).
- **Framing:** Position as "The ML course that speaks JavaScript" — not another education platform, but a new category. Tagline: "50+ concept bridges that translate machine learning into frontend language."
- **Maker comment:** Post immediately after launch. Include: the personal story of why you built this (frontend dev frustrated by Python-first ML courses), a 2-minute demo GIF showing a bridge in action, a link to free Module 1, and a genuine ask for feedback.
- **Expected results:** Top 5 Product of the Day = 1,000-3,000 website visits, 200-500 signups, 30-80 paid conversions. Top 3 = 2x those numbers.
- **Preparation checklist:**
  - Recruit 30+ hunters to upvote in the first 2 hours (friends, beta testers, community members)
  - Prepare all PH assets: logo (240x240), gallery images (1270x760, 5 images showing the product), video (optional but recommended, 1-2 min)
  - Write the description (max 260 chars for tagline, longer description supports markdown)
  - Pre-write responses to common questions ("Is this for beginners?", "Why not Python?", "How is this different from freeCodeCamp?")
  - Schedule social media posts linking to the PH page for launch day

## 2.3 Hacker News Strategy

- **Format:** Use "Show HN: Tensorcraft — Interactive ML for Frontend Engineers (browser-based, no Python)" as the title. Keep the URL pointing to the product, not a blog post. HN values being able to see the thing immediately.
- **Timing:** Post between 8-9 AM ET on a weekday (Tuesday-Thursday). This catches the US East Coast morning crowd and gives European voters time to engage before it falls off.
- **Rules of engagement:**
  - Do NOT ask for upvotes. HN detects and penalizes voting rings.
  - Be in the comments within 5 minutes of posting. Answer every question honestly and thoroughly.
  - If someone criticizes the approach, engage respectfully. HN rewards thoughtful debate.
  - Share technical details freely — HN loves implementation details (how you built the Sandpack integration, how bridges are structured, performance optimizations).
  - Do NOT be defensive about the "no Python" angle. Acknowledge Python's role in ML, explain why browser-based JS serves a different audience.
- **Expected results:** Front page (100+ points) = 5,000-15,000 visits over 48 hours, 500-1,500 signups. Top 10 = 2-3x those numbers. HN traffic converts at 2-4% to free signups.

## 2.4 Platform-by-Platform Guide

| # | Platform | Relevance | Audience | Action |
|---|----------|-----------|----------|--------|
| 1 | Twitter/X | Primary | Frontend devs, indie hackers, tech leads | Daily presence. Bridge threads weekly. Launch day blitz. Pin launch tweet. |
| 2 | Dev.to | Primary | Web developers, career changers | Weekly bridge posts. Launch day "Introducing" post. Cross-post all blog content. |
| 3 | Hacker News | High | Engineers, technical founders, senior devs | Show HN on launch. Technical deep-dives monthly. Engage in ML/JS discussions. |
| 4 | Reddit | High | Broad dev community, career changers | Value-first posts in r/webdev, r/javascript, r/reactjs, r/learnmachinelearning. Follow 90/10 rule. |
| 5 | Product Hunt | High (launch) | Early adopters, tool enthusiasts, indie hackers | One-time launch. Prepare thoroughly. Follow up with milestone launches (V1.0, new themes). |
| 6 | LinkedIn | Medium | Tech leads, engineering managers, team buyers | Professional tone. Team license angle. Repurpose Twitter threads. 2-3 posts/week. |
| 7 | YouTube | Medium | Visual learners, tutorial seekers | Bridge demo animations. Course previews. Live coding sessions. Weekly uploads. |
| 8 | Hashnode | Medium | Developer bloggers, web devs | Cross-post bridge articles. Hashnode has good SEO juice. |
| 9 | Discord | Medium | Community hub | Own server for community. Join related servers (Reactiflux, TF.js) as a helpful member, not promoter. |
| 10 | Substack | Medium | Newsletter subscribers, long-form readers | Weekly newsletter. Bridge deep-dives. Behind-the-scenes. |
| 11 | Indie Hackers | Medium | Solopreneurs, bootstrappers | Build-in-public updates. Revenue milestones. Product journey posts. |
| 12 | Lobsters | Low-Medium | Senior engineers, niche technical crowd | Technical deep-dives only. Requires invite. No marketing fluff. |
| 13 | Mastodon | Low-Medium | Open-source community, privacy-conscious devs | Mirror Twitter content. Engage with #WebDev and #MachineLearning hashtags. |
| 14 | TikTok | Low-Medium | Junior devs, career changers, visual learners | 60-second bridge explainers. "POV: you're a React dev learning ML." Experimental. |
| 15 | Instagram | Low | Design-oriented devs, visual learners | Carousel posts showing bridge diagrams. Theme aesthetic shots. Low priority. |
| 16 | Stack Overflow | Low | Developers seeking answers | Answer TensorFlow.js and browser-ML questions. Link to relevant Tensorcraft content only when genuinely helpful. |
| 17 | Medium | Low | General tech readers | Republish top-performing dev.to posts after 2-week delay. Medium's algo favors established publications. |

**Automation tip:** Use Typefully or Buffer to schedule Twitter/X, LinkedIn, and Mastodon posts from a single queue. Cross-post dev.to articles to Hashnode and Medium with canonical URLs pointing to dev.to. Use Zapier to auto-post new blog articles to Discord #announcements.

**Skip list:** Facebook Groups (low developer engagement), Quora (declining relevance), Pinterest (wrong audience), Clubhouse (dead platform). Re-evaluate quarterly.

---

# PART 3: PAID ADVERTISING

## 3.1 Budget Allocation

Year 1 total paid advertising budget: $60,000-$90,000, allocated across platforms based on audience fit and expected CAC.

| Platform | Budget % | Monthly ($) | Role | Target CPC |
|----------|----------|-------------|------|------------|
| Twitter/X Ads | 30% | $1,500-$2,250 | Primary acquisition. Promoted tweets targeting frontend devs, JS developers, React/Vue/Angular keywords. | $0.80-$1.50 |
| Google Ads | 25% | $1,250-$1,875 | Search ads for high-intent keywords ("learn ML with JavaScript", "TensorFlow.js course", "ML for frontend developers"). | $1.50-$3.00 |
| Reddit Ads | 20% | $1,000-$1,500 | Targeted ads in r/webdev, r/javascript, r/reactjs, r/learnmachinelearning. Conversation-style ads perform best. | $0.50-$1.00 |
| Dev.to Listings | 10% | $500-$750 | Sponsored listings and display ads on dev.to. High relevance, captive audience. | $1.00-$2.00 |
| Carbon Ads | 10% | $500-$750 | Display ads on developer-focused sites (MDN, CSS-Tricks, Stack Overflow). Low CPC, high impression volume. | $0.30-$0.80 |
| YouTube Ads | 5% | $250-$375 | Pre-roll ads on frontend/ML tutorial videos. Retargeting only (viewers who visited site but didn't convert). | $0.05-$0.15 (CPV) |

## 3.2 The Funnel

All paid traffic flows through a single, optimized funnel:

1. **Ad click** -> Landing page (theme-specific or bridge-specific based on ad content)
2. **Landing page** -> Free Module 1 signup (primary CTA) or email capture (secondary CTA)
3. **Free Module 1** -> Complete Module 1 (trigger email nurture sequence)
4. **Email nurture** -> Purchase theme at $79
5. **Post-purchase** -> Upsell to bundle (email sequence triggers at 50% completion)

**CAC trajectory:**
- Months 1-3: $35-$50 CAC (learning phase, testing creatives and audiences)
- Months 4-6: $20-$30 CAC (optimized audiences, winning creatives identified)
- Months 7-12: $12-$20 CAC (retargeting pools built, organic supplements paid)
- Target steady-state CAC: $15 or below (blended across all paid channels)

## 3.3 Ad Creative Principles

- **Visual consistency:** All ads use Tensorcraft's dark/neon aesthetic. Ads should look like the product, not like ads.
- **Lead with the bridge:** The highest-performing creative concept is the FE-to-ML bridge. "You already know 70% of ML. You just don't know it yet." Show a side-by-side of React code and neural network code with visual connections.
- **Social proof variants:** Once testimonials are collected, run ad variants featuring learner quotes. "I learned more about ML in 2 hours on Tensorcraft than in 2 weeks on Coursera" performs better than feature-based copy.
- **Video ads (Twitter, YouTube):** 15-30 second clips showing the bridge animation. Dark background, neon highlights, code morphing from React to ML. No voiceover needed — text overlay + music.
- **A/B test relentlessly:** Test 3-5 headline variants per campaign. Kill underperformers within 48 hours. Scale winners to 2x budget before testing new variants.

---

# PART 4: ORGANIC CHANNELS

## 4.1 Technical Blog

The Tensorcraft blog is the primary SEO and thought leadership asset. Hosted at `tensorcraft.app/blog`, rendered with MDX, and indexed by search engines.

- **Publishing cadence:** 2 articles per week minimum. 1 bridge post + 1 tutorial or concept explainer.
- **Content length:** 1,500-3,000 words. Longer is better for SEO but only if the content earns its length. No padding.
- **Code examples:** Every article includes runnable code. Use embedded Sandpack playgrounds for interactive examples. Static code blocks use Shiki with the Tensorcraft dark theme.
- **Cross-posting:** All articles are cross-posted to dev.to (primary) and Hashnode (secondary) with canonical URL pointing to tensorcraft.app. Cross-post 48 hours after original publication.

## 4.2 Substack Newsletter

Weekly newsletter sent every Tuesday at 10 AM ET. "The Bridge" newsletter covers one FE-to-ML bridge in depth each week, plus community highlights, product updates, and curated links.

- **Structure:** Bridge of the week (60%), community spotlight (15%), product update (10%), curated links (15%)
- **Growth target:** 500 subscribers by month 3, 2,000 by month 6, 5,000 by month 12
- **Monetization:** Free tier for all subscribers. No paid tier — the newsletter drives course sales, not subscription revenue. Sponsorship slots available after 2,000 subscribers.
- **Tone:** Conversational, technical but approachable. Written in first person. Every issue should teach something useful even if the reader never buys a course.

## 4.3 Twitter/X

5 posts per week, distributed as follows:

- **Monday:** Bridge insight tweet — a single, punchy mapping between an FE concept and an ML concept. Optimized for bookmarks and quote-tweets.
- **Tuesday:** Tutorial thread — 5-10 tweet thread walking through a concept or mini-build. Ends with soft CTA to free Module 1.
- **Wednesday:** Community engagement — reply to trending FE/ML discussions, quote-tweet interesting projects, amplify learner wins.
- **Thursday:** Behind-the-scenes — development update, design decision, content creation process. Build-in-public angle.
- **Friday:** Curated content — share and comment on the best FE/ML article, tool, or resource you found that week. Give credit generously.

## 4.4 Interactive Demos

Build 3-5 standalone interactive demos that showcase the bridge concept. These are not gated — they live at `tensorcraft.app/demos/[name]` and are freely accessible.

- **Demo 1:** "React State vs Neural Network Weights" — side-by-side interactive showing how useState and model weights both store and update values
- **Demo 2:** "Virtual DOM Diffing vs Gradient Descent" — animated visualization showing the parallel optimization strategies
- **Demo 3:** "Event Propagation vs Backpropagation" — interactive diagram where clicking triggers either DOM event bubbling or neural network backpropagation
- **Purpose:** These are the top-of-funnel viral assets. Shareable on social media, embeddable in blog posts, linkable from Hacker News. Each demo ends with a tasteful CTA to explore more bridges in Tensorcraft.

## 4.5 Conference Talks

Target 4-6 conference talks in the first 12 months. Talk topics rotate between:

- **"The Bridge Model: Teaching ML Through Frontend Analogies"** — pedagogical talk for education-focused conferences
- **"Machine Learning in the Browser: A Practical Guide for Frontend Teams"** — technical talk for JS/frontend conferences
- **"From React Developer to ML Engineer: A Bridge, Not a Leap"** — career-focused talk for general developer conferences

Conference CFP submissions begin in month 3. Target conferences: React Summit, JSNation, CityJS, Frontend Love, All Things Open, THAT Conference, RenderATL, and local meetups.

## 4.6 Podcast Guesting

Target 2 podcast appearances per month starting in month 4. Prepare a concise "Tensorcraft story" (3 minutes) and 5-6 talking points about the bridge concept, browser-based ML, and frontend-to-ML career paths.

**Target shows:**
- Syntax.fm (Wes Bos & Scott Tolinski — frontend audience, 50K+ listeners)
- JS Party (Changelog — JavaScript community, 20K+ listeners)
- PodRocket (LogRocket — frontend engineering, 15K+ listeners)
- The Changelog (broad developer audience, 30K+ listeners)
- Frontend Happy Hour (frontend engineers, 10K+ listeners)
- Practical AI (ML audience, introduce the frontend angle, 15K+ listeners)
- Learn with Jason (Jason Lengstorf — live coding + interview format, 10K+ listeners)

## 4.7 Open Source

Release three open-source packages that serve as permanent marketing assets:

- **@tensorcraft/bridges** — The complete bridge database as a JSON/MDX package. MIT licensed. Any educator or content creator can use the bridges in their own work, with attribution. This spreads the Tensorcraft vocabulary ("bridge model", "FE-to-ML mapping") across the ecosystem.
- **@tensorcraft/neon-ui** — The dark/neon React component library used in Tensorcraft. Developers who use these components in their own projects become familiar with the Tensorcraft aesthetic.
- **@tensorcraft/sandbox** — The Sandpack-based ML exercise runner. Other educators can build interactive ML exercises. Every exercise built with this package is indirect marketing for Tensorcraft.

## 4.8 Newsletter Sponsorships

Sponsor developer newsletters to reach frontend engineers at scale. Allocate $2,000-$4,000/month for newsletter sponsorships starting in month 4.

| Newsletter | Subscribers | Sponsor Price | Frequency |
|------------|-------------|--------------|-----------|
| JavaScript Weekly | 200,000+ | $1,500-$2,500/issue | Monthly |
| Frontend Focus | 100,000+ | $800-$1,500/issue | Biweekly |
| TLDR Web Dev | 250,000+ | $1,000-$2,000/issue | Monthly |

## 4.9 FE Bridge Visual Content

Create a library of shareable visual assets that illustrate the FE-to-ML bridge concept. These are designed for social media virality and blog embedding.

- **Shareable graphics specs:** 1200x675px (Twitter/LinkedIn optimal), dark background (#0B0D1A), neon accent matching the relevant theme color, JetBrains Mono for code, Inter for labels, side-by-side layout showing FE concept on left and ML concept on right with glowing bridge connector in the center. Include Tensorcraft watermark (bottom-right, subtle). Export as PNG and WebP. Each graphic is a self-contained explanation — useful even without clicking through to the site.
- **Bridge explorer page:** A dedicated page at `tensorcraft.app/bridges` showing all 50+ bridges in a filterable, searchable grid. Each card shows the FE concept, the ML concept, and a one-sentence bridge statement. Clicking opens the full bridge explanation with interactive demo. This page is both a product showcase and an SEO asset (targets "ML concepts for frontend developers" and related queries).
- **Social calendar:** Publish one bridge graphic every day for 50 days as the "50 Days of Bridges" campaign. Schedule across Twitter/X, LinkedIn, and Instagram simultaneously. Each post includes the graphic, a 2-3 sentence caption explaining the bridge, and a link to the full bridge page. Day 50 post announces the complete bridge explorer page. Target: 50 days of consistent, highly shareable visual content that establishes Tensorcraft as the definitive source for FE-to-ML bridges.
- **Blog integration:** Every blog post that discusses a bridge concept includes the corresponding bridge graphic as the hero image. Open Graph meta tags use the bridge graphic, ensuring the visual appears in social media shares. This creates a consistent visual language across all channels.

---

# PART 5: WAITLIST AND PROMOTION

## 5.1 Waitlist Page Structure

The waitlist page is the primary conversion asset during pre-launch. It lives at `tensorcraft.app` and follows this structure:

- **Hero section:** Full-width dark background with animated neon grid. Headline: "Machine Learning for Frontend Engineers." Subheadline: "50+ concept bridges that translate ML into the language you already speak." Single email input with "Join the Waitlist" CTA button (neon accent glow on hover). Waitlist count displayed below input ("Join 2,847 frontend developers").
- **Problem section:** Three-column layout. Column 1: "Every ML course starts with Python" (crossed-out Python logo). Column 2: "You've tried. You've quit." (abandoned Jupyter notebook illustration). Column 3: "It's not you. It's the teaching." (bridge metaphor illustration). Copy: "Machine learning courses weren't built for you. They assume you think in NumPy, not in components. Tensorcraft fixes that."
- **What you'll build section:** Interactive carousel showing 3-4 real project outcomes from Tensorcraft lessons. Each slide shows a browser screenshot of the completed project (sentiment analyzer, image classifier, recommendation engine) with a "Built with JavaScript. No Python required." caption.
- **Theme previews section:** Five cards, one per theme, showing the theme name, key art, narrative hook, and character illustrations. Deep Orbit and Neon Protocol are highlighted as "coming first." Other three show "Coming 2026" with faded styling.
- **FAQ section:** Expandable accordion with 6-8 questions: "Do I need to know Python?", "How is this different from Coursera/fast.ai?", "Is this for beginners?", "What will I be able to build?", "How much does it cost?", "When does it launch?", "Can I try it for free?", "Do you offer team pricing?"
- **Social proof section:** Grid of testimonials from beta testers and early reviewers. If pre-launch (no testimonials yet), use: logos of companies where beta testers work, a quote from the creator explaining the mission, and an "As seen on" row with dev.to, Hacker News, and Twitter/X logos once coverage is earned.

## 5.2 Promotion Playbook

Four-phase promotion strategy for the waitlist:

- **Phase 1: Setup (Weeks 1-2):** Launch waitlist page. Set up PostHog analytics. Install Meta Pixel and Twitter Pixel for retargeting. Create UTM templates for all channels. Prepare 10 social media post variants for A/B testing. Goal: infrastructure ready, 100 signups from personal network.
- **Phase 2: First Content (Weeks 3-6):** Publish 4 bridge posts on dev.to. Share each on Twitter/X with link to waitlist. Post to r/webdev and r/javascript (value-first, waitlist link in profile only). Launch "50 Days of Bridges" social campaign. Goal: 500 signups, identify top-performing channels.
- **Phase 3: Paid Testing (Weeks 7-10):** Allocate $1,500 to test paid ads across Twitter/X ($500), Reddit ($500), and Carbon Ads ($500). Run 3 creative variants per platform. Measure cost-per-waitlist-signup. Kill underperformers, scale winners. Goal: 1,500 signups, CAC < $3 per waitlist signup.
- **Phase 4: Scale Winners (Weeks 11-16):** Double budget on winning channels. Launch Product Hunt upcoming page. Activate influencer partnerships (10 influencers post about Tensorcraft in the same week). Submit guest posts to JavaScript Weekly and Frontend Focus. Goal: 5,000 signups by launch day.

## 5.3 Email Nurture Sequence

Post-waitlist-signup email sequence to keep subscribers engaged until launch.

| # | Timing | Subject | Content | Goal |
|---|--------|---------|---------|------|
| 1 | Day 0 | Welcome to the Tensorcraft waitlist | Thank you, what to expect, introduce the bridge concept, link to first bridge post | Set expectations, deliver immediate value |
| 2 | Day 3 | Your first FE-to-ML bridge: React State = Model Weights | Deep-dive on one bridge with code examples, link to interactive demo | Demonstrate the bridge concept in action |
| 3 | Day 7 | Why every ML course fails frontend developers | Problem-focused essay explaining the Python-first gap, position Tensorcraft as the solution | Build resonance with the pain point |
| 4 | Day 14 | Meet Deep Orbit: your first Tensorcraft theme | Introduce the theme narrative, characters, visual style, and Module 1 outline | Build excitement for the product |
| 5 | Day 21 | 5 things you can build with JavaScript ML | Practical project showcase (sentiment analysis, image classification, anomaly detection, recommendations, search ranking) | Demonstrate practical value |
| 6 | Day 30 | Behind the scenes: how we built Tensorcraft | Technical deep-dive on the platform (Next.js, Sandpack, TensorFlow.js, design system) | Build trust through transparency |
| 7 | Day 45 | The bridge that surprised us most | Highlight an unexpected FE-to-ML bridge that beta testers loved, include their quotes | Social proof + engagement |
| 8 | Day 60 | Tensorcraft launch date announcement | Announce the launch date, full theme pricing ($79), and what's included | Create anticipation |
| 9 | Day 75 | 1 week until launch: here's your plan | Pre-launch checklist for the reader (block 2 hours, bookmark the URL, prepare your dev environment — just kidding, it's browser-based) | Build urgency with humor |
| 10 | Launch Day | Tensorcraft is LIVE. Your bridge awaits. | Launch announcement, early-access pricing, direct link to free Module 1, 48-hour launch discount | Convert to signup/purchase |
| 11 | Launch +7 | How the first week went (honest numbers) | Transparent update on launch results, learner count, first testimonials, what's next | Build community through transparency |

## 5.4 Waitlist Target

**Goal: 5,000 waitlist signups before launch day.**

Conversion math:
- 5,000 waitlist signups
- 60% open rate on launch email (warm, engaged list) = 3,000 opens
- 30% click-through to site = 900 visitors from email alone
- 20% of visitors start free Module 1 = 180 free users from waitlist email
- Plus organic launch day traffic (Product Hunt, HN, Twitter/X) = estimated 2,000-5,000 additional visitors
- 8-12% free-to-paid conversion over 30 days = 200-500 paid users in first month
- At $79 per theme: $15,800-$39,500 launch month revenue

The waitlist is not just a launch asset — it's the foundation of the email nurture engine that drives long-term revenue. Every subscriber who doesn't convert at launch enters the ongoing newsletter funnel.

---

# PART 6: CONTENT MARKETING CALENDAR

## 6.1 First 30 Days

| Day | Type | Topic | Platform |
|-----|------|-------|----------|
| 1 | Bridge Post | React State and Neural Network Weights: The Same Mental Model | dev.to, Hashnode, blog |
| 3 | Tutorial | Build a Color Classifier with Vanilla JS and TensorFlow.js | dev.to, blog |
| 5 | Bridge Graphic | useState = model.weights (visual) | Twitter/X, LinkedIn |
| 7 | Thread | "React developers already understand 70% of ML. Here's why." (10-tweet thread) | Twitter/X |
| 9 | Bridge Post | Component Lifecycles Are Training Loops in Disguise | dev.to, Hashnode, blog |
| 11 | Video | Bridge Demo: Virtual DOM Diffing vs Gradient Descent (animated, 3 min) | YouTube, Twitter/X |
| 13 | Behind-the-Scenes | Why We're Building an ML Course for Frontend Devs | blog, Hashnode, Indie Hackers |
| 15 | Bridge Graphic | useEffect = backpropagation (visual) | Twitter/X, LinkedIn |
| 17 | Concept Explainer | Neural Networks for JS Devs: No Math, No Python, No Problem | dev.to, blog |
| 20 | Tutorial | Image Recognition in the Browser: A React Tutorial | dev.to, blog |
| 22 | Bridge Post | Virtual DOM Diffing and Gradient Descent Walk Into a Bar | dev.to, Hashnode |
| 25 | Newsletter | The Bridge #1: Redux Reducers and Loss Functions | Substack |
| 27 | Bridge Graphic | component tree = neural network layers (visual) | Twitter/X, LinkedIn |
| 30 | Roundup | Month 1 Retrospective: What We Learned, What's Next | blog, Substack, Twitter/X |

## 6.2 Ongoing Cadence

After the first 30 days, settle into a sustainable weekly rhythm:

- **Monday:** Bridge post published on dev.to + Hashnode + blog. Cross-promoted on Twitter/X with bridge graphic.
- **Tuesday:** Newsletter sent via Substack ("The Bridge" weekly edition). Tutorial or concept explainer published.
- **Wednesday:** Community engagement day. Reply to comments on dev.to posts. Engage in Reddit discussions. Discord community events (bridge challenge, AMA, etc.).
- **Thursday:** Behind-the-scenes content. Build-in-public update on Twitter/X. Indie Hackers milestone post if relevant.
- **Friday:** Curated content roundup shared on Twitter/X and LinkedIn. YouTube video published (if on a weekly video schedule; otherwise biweekly).

**Biweekly:** One long-form tutorial (2,000-3,000 words) with interactive code examples. One podcast pitch or guest post submission.

**Monthly:** One behind-the-scenes deep-dive. One content performance review (identify top-performing pieces, double down on what works). One competitive landscape scan (what are others publishing in the ML education space?).

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low initial demand | Medium | High | Free Module 1 reduces risk. Pivot messaging based on feedback. |
| Content production delays | High | Medium | Build 2-month buffer. Prioritize Deep Orbit before starting new themes. |
| Competitor launches similar product | Low | Medium | Speed to market matters. 50+ bridges is hard to replicate quickly. |
| Platform technical issues | Medium | High | Extensive beta testing. Error monitoring. Quick response SLA. |
| Pricing too high for target audience | Medium | Medium | PPP discounts address global accessibility. Monitor conversion rates. |
| Community toxicity | Low | Medium | Clear code of conduct. Active moderation from day one. |

---

## Conclusion

Tensorcraft's marketing strategy is built on a simple insight: frontend developers are an underserved audience in ML education, and the FE-to-ML bridge concept is a genuinely novel approach that provides organic viral potential. By leading with free, high-value content (bridge posts, free Module 1, open source components), we build trust and audience before asking for money.

The per-theme pricing model eliminates subscription fatigue and aligns incentives — we only get paid when we deliver a complete, valuable learning experience. The dark/neon aesthetic makes Tensorcraft visually distinctive and inherently shareable on social media.

Success depends on consistent content production, authentic community engagement, and relentless focus on the core value proposition: you already know more about ML than you think, and Tensorcraft will show you why.


---
# FILE: ui-ux-notes.md
---

# Tensorcraft UI/UX Design Notes v3.2

This document specifies the interaction design, layout, animation, and visual system for the Tensorcraft learning platform. All measurements are in logical pixels unless otherwise noted. All colors reference CSS custom properties defined in the theme system (Part 5).

---

## PART 1: THEME SELECTION SCREEN

### 1.1 Layout

The theme selection screen is the first meaningful interaction after signup. It presents all five Tensorcraft themes as selectable cards.

- **Desktop (1280px+):** 5-column grid with equal-width cards. `grid-template-columns: repeat(5, 1fr)`. Gap: 24px. Max container width: 1200px, centered. Each card is approximately 216px wide. Cards have a 3:4 aspect ratio enforced via `aspect-ratio: 3/4`.
- **Tablet (768px-1279px):** 2-column grid. `grid-template-columns: repeat(2, 1fr)`. Gap: 20px. Container padding: 32px. The fifth card spans full width on its own row: `&:last-child { grid-column: 1 / -1; max-width: 50%; margin: 0 auto; }`.
- **Mobile (< 768px):** Single-column stack. Each card is full-width. Gap: 16px. Container padding: 16px. Cards switch to a horizontal layout on mobile: artwork on the left (40%), text on the right (60%), using `flex-direction: row`. Card height is fixed at 120px on mobile to prevent excessive scrolling.

### 1.2 Coming Soon Card Design

Themes not yet released display a "Coming Soon" state that conveys anticipation without frustration.

- **Visual treatment:** Card artwork is rendered at 40% opacity with a CSS `grayscale(60%)` filter applied. A diagonal ribbon in the top-right corner reads "Coming Soon" in the theme's accent color on a dark background (`rgba(0,0,0,0.7)`). Ribbon is 120px wide, rotated 45deg, positioned with `overflow: hidden` on the card container. The theme title and one-sentence narrative hook are visible but rendered in `--theme-muted` color (see Part 5).
- **Hover state:** On hover, the card opacity increases to 60% and the grayscale reduces to 30%. A subtle pulse animation plays on the ribbon (opacity oscillates between 0.8 and 1.0, 2s infinite). Cursor changes to `pointer` to indicate the card is interactive. A tooltip appears below the cursor: "Click to get notified when this theme launches."

### 1.3 Coming Soon Click Interaction

Clicking a Coming Soon card opens a slide-up panel (mobile) or a popover card (desktop/tablet) anchored to the clicked card.

- **Panel contents:** Theme key art (full color, no grayscale -- this is the reveal moment). Theme title in `--theme-accent` color. Narrative hook paragraph (2-3 sentences). "Notify me when this launches" email input with submit button. The email input is pre-filled if the user is logged in. A "Learn more about this theme" expandable section with character previews and module outline.
- **Post-submission:** The email input is replaced with a confirmation message: "You're on the list. We'll email you the moment [Theme Name] goes live." The card's ribbon text changes from "Coming Soon" to "Notified" with a checkmark icon. This state persists across sessions (stored in user profile via API, or localStorage for anonymous users).
- **Dismiss:** Click outside the panel, press Escape, or tap the X button. On mobile, swipe down to dismiss the slide-up panel. The panel has a drag handle at the top for swipe affordance.

---

## PART 2: PROGRESS DIAGRAM DESIGN

### 2.1 Art Style

The progress diagram visualizes the learner's journey through a theme's modules and lessons as an interconnected node graph.

- **Style:** Flat, 2D vector art. Clean geometric shapes. Inspired by Figma's layer panel and Linear's project views. Nodes are circles (lessons) connected by straight or gently curved lines (progress paths). Completed sections glow with the theme's accent color. The overall aesthetic is minimal, precise, and technical -- consistent with Tensorcraft's developer-tool feel.
- **NOT:** Do not use isometric projection, 3D renders, skeuomorphic elements, or hand-drawn illustration styles. No gradients on nodes (flat fills only). No drop shadows (use border glow for elevation). The diagram should feel like a system diagram or circuit board, not a game map or fantasy adventure path.

### 2.2 Component States

| State | Visual Treatment |
|-------|-----------------|
| **Locked** | Node fill: `--theme-bg` (dark). Node border: 1px solid `--theme-muted` at 30% opacity. Connection line: dashed, `--theme-muted` at 20% opacity. Icon: lock icon (16px, centered in node). Label text: `--theme-muted`. Node is non-interactive (no hover state, cursor: default). |
| **Active** | Node fill: `--theme-bg`. Node border: 2px solid `--theme-accent`. Connection line from previous completed node: solid, `--theme-accent`. Subtle pulse animation on border (opacity 0.6 to 1.0, 2s ease-in-out infinite). Icon: play icon (16px, centered). Label text: `--theme-text`. Cursor: pointer. Hover: node scale(1.08) with 150ms ease-out. |
| **Completed** | Node fill: `--theme-accent` at 15% opacity. Node border: 2px solid `--theme-accent`. Connection line to next node: solid, `--theme-accent`. Icon: checkmark (16px, `--theme-accent`). Label text: `--theme-text`. Hover: node scale(1.05) with 150ms ease-out. Click reopens lesson for review. |
| **Connection** | Lines between nodes are SVG `<path>` elements. Default stroke-width: 2px. Completed connections animate a traveling dot (4px circle, `--theme-accent`, moves along path over 1.5s ease-in-out, plays once on completion). Active connections have a gradient stroke from `--theme-accent` to `--theme-muted`. |

### 2.3 Animation Specifications

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Node unlock | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) | Previous lesson completed, next node transitions from locked to active |
| Completion burst | 600ms | `ease-out` | Lesson marked complete. Node briefly scales to 1.2, accent-colored particle burst (8 particles, radial), then settles to completed state. |
| Path drawing | 800ms | `ease-in-out` | Connection line animates from source node to destination node using SVG `stroke-dashoffset` animation. Plays when a lesson is completed and the next path becomes visible. |
| Traveling dot | 1500ms | `ease-in-out` | After path drawing completes. A small circle travels along the newly drawn path. Fades in at start, fades out at end. |
| Stats panel slide | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) | User clicks the stats toggle button. Panel slides in from the right (desktop) or up from the bottom (mobile). |
| Node hover | 150ms | `ease-out` | Mouse enters node hitbox. Scale and optional glow intensity increase. |

**Reduced motion:** When `prefers-reduced-motion: reduce` is active, all animations are replaced with instant state changes (0ms duration). The traveling dot is hidden. The completion burst is replaced with a simple opacity fade. Node hover still applies scale but without transition. This is enforced globally via a CSS custom property `--motion-duration` that defaults to the specified duration but is overridden to `0ms` when reduced motion is preferred.

### 2.4 Stats Panel

The stats panel provides an at-a-glance summary of the learner's progress within the current theme.

- **Position:** Fixed to the right edge of the progress diagram viewport on desktop (320px wide, full height of diagram area). Slides up from bottom on mobile (full width, max-height 60vh, draggable to dismiss). Overlays the diagram with a semi-transparent backdrop (`rgba(0,0,0,0.3)`).
- **Content:** Theme completion percentage (large, centered, circular progress ring using SVG). Lessons completed / total lessons. Current streak (consecutive days with at least one lesson completed). Estimated time remaining (based on average lesson duration and remaining lessons). FE bridges encountered / total bridges in theme. A mini-heatmap showing activity over the last 30 days (similar to GitHub contribution graph, using theme accent color at varying opacities).
- **Style:** Background: `--theme-bg` with 1px border in `--theme-muted` at 30% opacity. All text in `--theme-text`. Numbers and percentages in `--theme-accent`. The circular progress ring stroke uses `--theme-accent` for the filled portion and `--theme-muted` at 20% for the remaining portion. Stroke-width: 8px. Ring diameter: 120px.
- **Dismiss:** Click the X button, press Escape, click outside the panel, or swipe right (desktop) / swipe down (mobile). The panel remembers its open/closed state in localStorage.

### 2.5 Screenshot/Share

Learners can capture and share their progress diagram as an image.

- **Capture method:** Use `html2canvas` to render the progress diagram (excluding the stats panel and UI chrome) to a canvas element. Scale factor: 2x for retina-quality output. Output format: PNG.
- **Watermark:** Bottom-right corner of the captured image includes a subtle Tensorcraft watermark: the Tensorcraft logo (24px height) + "tensorcraft.app" text in `--theme-muted` at 50% opacity. The watermark is added programmatically after canvas capture, not rendered in the DOM.
- **Share:** After capture, display a share modal with options: "Download PNG" (primary), "Copy to Clipboard" (using the Clipboard API), and "Share" (using the Web Share API where supported, falling back to Twitter/X and LinkedIn share URLs with pre-filled text). The pre-filled share text: "I've completed [X]% of [Theme Name] on Tensorcraft! Learning ML through frontend concepts." Include the captured image as the share attachment when the Web Share API supports files.
- **Output:** 2x PNG at the diagram's rendered dimensions. Typical output: 2400x1600px for a desktop-width diagram. File name: `tensorcraft-[theme]-progress.png`.

---

## PART 3: LESSON UI LAYOUT

### 3.1 Desktop Layout (1280px+)

Three-column layout optimized for simultaneous reading and coding.

- **Sidebar:** Fixed left column, 240px wide. Contains: theme logo (32px), module title, lesson list for current module (scrollable if exceeding viewport height), progress indicators (checkmarks for completed lessons, dot for current, lock for locked). Background: `--theme-bg` darkened 5%. Border-right: 1px solid `--theme-muted` at 20%.
- **Narrative panel:** Center column, 60% of remaining width after sidebar. Contains the lesson narrative: MDX-rendered content with prose text, bridge callouts, diagrams, and embedded interactive elements. Max prose width: 680px, centered within the panel. Padding: 48px horizontal, 32px vertical. Scroll is independent of other columns. The narrative panel is the primary reading surface.
- **Code panel:** Right column, 40% of remaining width. Contains the Sandpack-powered code editor and preview. The panel is split vertically: editor on top (60% height), live preview on bottom (40% height). A draggable divider between editor and preview allows resizing. The code panel has its own scroll context. Background: Sandpack's default dark theme, adjusted to match `--theme-bg`.

### 3.2 Tablet Layout (768px-1279px)

The sidebar collapses. Narrative and code share the viewport via sticky tabs.

- **Tabs:** Two sticky tabs at the top of the viewport: "Story" and "Code". Tabs are 48px tall, full width, with the active tab indicated by a 2px bottom border in `--theme-accent`. Tabs remain visible during scroll (sticky positioning). Tab switch is instant (no animation) to avoid disorienting the reader.
- **Story tab:** Full-width narrative content. Same MDX rendering as desktop. Max prose width: 640px, centered. Padding: 32px.
- **Code tab:** Full-width Sandpack editor and preview. Editor takes 55% height, preview 45%. The tab remembers scroll position when switching -- returning to "Story" restores the previous scroll offset.

### 3.3 Mobile Layout (< 768px)

Single-column layout with careful space management.

- **Navigation:** The sidebar is replaced by a hamburger menu (top-left) that opens a full-screen overlay with the lesson list. The current lesson title is displayed in a 48px top bar.
- **Content:** Single column, full width. Padding: 16px. Prose renders at full width with appropriate font size adjustments (see Part 5 type scale).
- **Code editor:** Embedded inline within the narrative flow at the points where exercises appear. The editor has a minimum height of 300px and a maximum height of 60vh. The preview renders below the editor (not side-by-side). A "Run" button (44px tall, full width) triggers code execution and scrolls to the preview output.
- **Tab navigation:** Dropdown tabs replace the sticky tabs from tablet layout. A dropdown selector at the top allows switching between "Story", "Code", and "Bridges" views. The dropdown is 44px tall with a chevron indicator.

### 3.4 FE Bridge Moments

Bridge moments are the core pedagogical feature -- the point where a frontend concept is explicitly mapped to an ML concept. These require special UI treatment.

- **Split-panel view:** When a bridge moment occurs in the narrative, the layout temporarily shifts to a side-by-side comparison. On desktop: the narrative panel splits into two equal columns -- left shows the FE concept (with code example), right shows the ML concept (with code example). A glowing bridge connector (animated SVG line with `--theme-accent` color) visually links the two sides. On tablet/mobile: the bridge is presented as a stacked comparison (FE on top, ML below) with the bridge connector rotated to vertical.
- **Sidebar indicator:** In the desktop sidebar, bridge moments are indicated with a small bridge icon (16px) next to the lesson title. Hovering the icon shows a tooltip: "This lesson contains [N] FE-to-ML bridges."
- **Code Hike scrollytelling:** For complex bridges that require step-by-step explanation, use Code Hike's scrollytelling component. The narrative scrolls on the left while the code panel on the right highlights and transitions between code states in sync with the scroll position. Each scroll step corresponds to one mapping point in the bridge. Code Hike annotations highlight the specific lines being discussed with a `--theme-accent` background at 15% opacity.

### 3.5 Checkpoint Quiz Component

After every 2-3 lessons, a checkpoint quiz tests comprehension. The quiz is embedded inline in the narrative flow.

- **Radio button targets:** Each answer option is a radio button with a 44px minimum touch target (WCAG 2.5.5 compliant). The radio button is custom-styled: a 20px circle with 2px border in `--theme-muted`, filled with `--theme-accent` when selected. The label text is positioned to the right of the radio button with 12px gap. Each option has a full-width clickable area (the entire row is the hit target, not just the radio circle).
- **Wrong answer feedback:** When a wrong answer is submitted, the selected option's row flashes red (`#EF4444` at 20% opacity background) and shakes horizontally (3px amplitude, 3 cycles, 300ms total -- CSS `@keyframes shake`). A brief explanation appears below the option in red text: "Not quite. [Explanation of why this is wrong.]" The learner can try again immediately.
- **Correct answer feedback:** When the correct answer is submitted, the row flashes green (`#22C55E` at 20% opacity background). A checkmark icon animates in (scale from 0 to 1, 200ms, spring easing). The explanation appears below: "Correct! [Reinforcement of the concept.]" The page auto-scrolls to bring the next content section into view (smooth scroll, 400ms).

### 3.6 Hint Panel

Each exercise includes a hint system with progressive disclosure.

- **Collapsed default:** Hints are collapsed by default. A "Need a hint?" link (styled as a text button, not a primary CTA) appears below the exercise instructions. Clicking expands the hint panel.

- **3 levels of hints:**
  - **Level 1 (Nudge):** A vague directional hint. "Think about how React handles re-renders when state changes." Revealed on first click.
  - **Level 2 (Guidance):** A more specific hint with a code pattern. "Try using `model.fit()` with a callback that logs the loss value -- similar to how you'd use `useEffect` to track state changes." Revealed on second click (requires explicit "Show more" action).
  - **Level 3 (Solution):** The full solution with explanation. Revealed on third click with a confirmation dialog: "Are you sure? Seeing the solution may reduce the learning impact of solving it yourself." User must click "Show solution" to proceed.

- **Mobile interaction:** On mobile, swipe right on the hint panel to advance to the next hint level. A swipe affordance indicator (three dots with a right-pointing chevron) communicates this gesture. Swiping triggers a subtle haptic feedback pulse (using the Vibration API where supported, 10ms pulse).
- **PostHog tracking:** Track hint usage per exercise: `hint_viewed` event with properties `{ exercise_id, hint_level, time_since_exercise_start }`. This data informs content difficulty calibration -- exercises where >60% of learners need Level 3 hints are flagged for revision.

---

## PART 4: MOBILE-SPECIFIC GUIDANCE

### 4.1 Touch Targets

All interactive elements must meet WCAG 2.5.5 (Enhanced) touch target requirements.

- **Minimum size:** 44x44px for all buttons, links, radio buttons, checkboxes, and interactive controls. This is a hard requirement, not a guideline.
- **Spacing:** Adjacent touch targets must have at least 8px of non-interactive space between them. If two buttons are side-by-side, the gap between their hitboxes must be at least 8px.
- **Implementation:** Use `min-height: 44px; min-width: 44px` on all interactive elements. For inline links within prose text, increase the tap target using `padding: 8px 4px; margin: -8px -4px` to expand the hitbox without affecting visual layout. For icon-only buttons, use `padding: 10px` around a 24px icon to reach the 44px minimum.

### 4.2 Hidden Elements on Mobile

Some UI elements that provide value on desktop create clutter on mobile. These are conditionally hidden.

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar lesson list | Visible (fixed 240px column) | Hidden (accessible via hamburger menu overlay) |
| Stats panel toggle | Visible (icon button in top-right of progress diagram) | Hidden (accessible via "Progress" option in hamburger menu) |
| Bridge connector SVG | Animated glowing line between FE and ML code panels | Hidden (replaced by a static "Bridge" label between stacked panels) |
| Code editor line numbers | Visible | Hidden (saves horizontal space in the 300px editor) |
| Hint level indicators | Visible (3 dots showing current hint level) | Hidden (replaced by swipe gesture with chevron affordance) |
| Breadcrumb navigation | Visible (Theme > Module > Lesson) | Hidden (replaced by back arrow + lesson title in top bar) |

### 4.3 Device Testing Priority

Test on these devices in priority order. The top 3 cover approximately 80% of the mobile developer audience.

| Priority | Device | Screen Size | Rationale |
|----------|--------|-------------|-----------|
| 1 | iPhone 14/15 Pro | 393x852 (logical) | Most common iOS device among developers. Tests the core mobile experience. |
| 2 | Samsung Galaxy S23/S24 | 360x780 (logical) | Most common Android device in the developer demographic. Tests cross-platform rendering. |
| 3 | iPad Air (10.9") | 820x1180 (logical) | Most popular tablet for developers. Tests the tablet breakpoint and 2-column grid. |
| 4 | iPhone SE (3rd gen) | 375x667 (logical) | Smallest actively used iPhone. Stress-tests the mobile layout at minimum viable width. |
| 5 | Pixel 7 | 412x915 (logical) | Reference Android device with stock Chrome. Tests Android-specific quirks (keyboard behavior, scroll handling). |

---

## PART 5: TYPOGRAPHY AND COLOR SYSTEM

### 5.1 Type Scale

All sizes use a 1.25 ratio (Major Third) scale anchored at 16px body text.

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| `--text-xs` | 12px / 0.75rem | 400 | Captions, timestamps, hint level indicators, code line numbers |
| `--text-sm` | 14px / 0.875rem | 400 | Secondary labels, sidebar lesson titles, breadcrumbs, table cells |
| `--text-base` | 16px / 1rem | 400 | Body text, prose paragraphs, quiz options, button labels |
| `--text-lg` | 20px / 1.25rem | 500 | Section headings within lessons, bridge titles, card titles |
| `--text-xl` | 25px / 1.5625rem | 600 | Lesson titles, module headings, stats panel primary numbers |
| `--text-2xl` | 32px / 2rem | 700 | Page titles, theme names on selection screen, hero headings |
| `--text-3xl` | 40px / 2.5rem | 700 | Landing page hero headline, marketing pages only (not used in app) |

**Font stack:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` for all UI text. `'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace` for all code (editor, inline code, code blocks). Inter is loaded via `next/font/google` with `display: 'swap'` and subsets `['latin']`. JetBrains Mono is loaded similarly.

**Line heights:**

- Body text (16-20px): `line-height: 1.7` (generous for readability in long-form narrative)
- Headings (25-40px): `line-height: 1.3`
- Code: `line-height: 1.6`
- UI labels and buttons: `line-height: 1.4`
- Captions (12px): `line-height: 1.5`

### 5.2 Color System

Each theme defines six CSS custom properties. All five themes share the same property names, enabling instant theme switching via a single class change on the root element.

| Theme | `--theme-bg` | `--theme-text` | `--theme-accent` | `--theme-accent-hover` | `--theme-border` | `--theme-muted` |
|-------|-------------|---------------|------------------|----------------------|-----------------|----------------|
| Deep Orbit | `#0B0D1A` | `#E2E8F0` | `#6C63FF` | `#8B83FF` | `#1E293B` | `#64748B` |
| Neon Protocol | `#0A0E12` | `#E0E7EE` | `#00FFC8` | `#33FFD6` | `#1A2332` | `#5E7A8A` |
| Signal Ward | `#0D0B14` | `#E4E0F0` | `#FF6B6B` | `#FF8A8A` | `#221E2E` | `#7A6B8A` |
| Ghost Lattice | `#080C10` | `#DCE4EC` | `#FFD93D` | `#FFE066` | `#182028` | `#5A6A7A` |
| Axiom Shelf | `#0C0A0F` | `#E8E2F0` | `#A78BFA` | `#C4B5FD` | `#201C28` | `#6E6480` |

**Accessibility requirements:**

- `--theme-text` on `--theme-bg` must meet WCAG AA contrast ratio (4.5:1 minimum). All themes exceed this: Deep Orbit = 13.2:1, Neon Protocol = 12.8:1, Signal Ward = 12.5:1, Ghost Lattice = 13.0:1, Axiom Shelf = 12.9:1.
- `--theme-accent` on `--theme-bg` must meet WCAG AA for large text (3:1 minimum). Verified for all themes. For small text using accent color, always pair with a background that ensures 4.5:1. If accent color alone does not meet contrast on `--theme-bg` for small text, use `--theme-text` instead and reserve `--theme-accent` for borders, icons, and large headings.
- `--theme-muted` is intentionally lower contrast and must NOT be used for essential information. It is for decorative borders, disabled states, and supplementary labels only. Users must be able to complete all tasks without reading `--theme-muted` text.
- Focus indicators: All interactive elements use a 2px `--theme-accent` outline with 2px offset on `:focus-visible`. This is a global style applied in the base CSS. Never suppress or override focus indicators.

**Dark mode note:** Tensorcraft is dark-mode only. There is no light mode. The dark aesthetic is a core brand element. All design decisions assume a dark background. The `color-scheme: dark` meta tag is set in the document head to inform the browser (affects scrollbar styling, form controls, etc.). System-level forced colors (Windows High Contrast Mode) are respected via `@media (forced-colors: active)` -- in this mode, all custom colors are replaced with system colors and borders become visible.

### 5.3 Prototype Design System — Zensman DeFi Aesthetic

As of March 2026, all 12 prototype pages use a unified "Zensman DeFi" clean aesthetic instead of the heavy neon/glow style from earlier iterations. This is a clean, minimal, premium SaaS look.

| Token | Value | Notes |
|-------|-------|-------|
| Background | `#080B16` | Replaces per-theme `--tc-bg` in prototypes |
| Surface | `#0F1320` | Cards, panels, modals |
| Borders | `rgba(255,255,255,0.06)` | Subtle, low-contrast dividers |
| Headings text | `#FFFFFF` | Pure white for headings |
| Muted text | `#8B92A5` | Secondary labels, captions |
| Accent | `#00D4FF` | Subtle cyan; used sparingly for CTAs and highlights |

**Key style rules:**
- No heavy neon glow effects anywhere
- Pill-shaped buttons: `border-radius: 999px`
- Glass navigation bar: 72px height, `backdrop-filter: blur(20px)`
- Overall feel: clean, minimal, premium SaaS — not cyberpunk

> **Note:** The per-theme color system in Section 5.2 still applies within the app (lesson viewer, progress diagram, etc.). The Zensman aesthetic governs the marketing shell, auth, onboarding, pricing, and landing pages.

---

## PART 6: AUTH, ONBOARDING, PAYWALL, AND BRIDGE EXPLORER SCREENS

These four screens were identified as gaps in the original screen inventory and have been added as prototypes.

### 6.1 Auth / Login Screen (`auth.html`)

The signup and login screen provides three authentication methods.

- **Methods:** GitHub OAuth, Google OAuth, and email magic link. Each is presented as a full-width pill button stacked vertically. GitHub button has the GitHub icon + "Continue with GitHub". Google button has the Google icon + "Continue with Google". Email magic link has a text input for email address + "Send Magic Link" submit button.
- **Layout:** Centered card (max-width: 420px) on the `#080B16` background. Card uses `#0F1320` surface with `rgba(255,255,255,0.06)` border. Tensorcraft logo above the card. Headline: "Welcome to Tensorcraft". Subtext toggles between "Sign up" and "Log in" modes via a text link below the form.
- **Post-auth:** Successful signup redirects to the onboarding flow (Section 6.2). Returning users who have completed onboarding are redirected to their dashboard.

### 6.2 Onboarding Flow (`onboarding.html`)

A 3-step post-signup flow that orients the new user.

- **Step 1 — Welcome:** Headline "You Already Think Like an ML Engineer" (matches the landing page hero). Brief value proposition paragraph. "Let's get started" CTA button.
- **Step 2 — Choose Theme:** Displays available themes as selectable cards (same card style as theme-selection screen but simplified). User picks their starting theme. Deep Orbit is pre-highlighted as the recommended first theme.
- **Step 3 — Start Learning:** Confirmation screen showing the selected theme, estimated time commitment, and a "Begin Module 1" CTA. Also shows a skip option: "Explore other themes first".
- **Progress indicator:** A 3-dot stepper at the top of the card shows current position (filled dot = current, hollow = remaining).
- **Persistence:** Onboarding completion is stored in the user profile. Users who have completed onboarding are never shown it again.

### 6.3 Paywall / Upgrade Modal (`paywall.html`)

Appears after completing the Module 1 free preview when a free-tier user attempts to access Module 2+.

- **Trigger:** Navigating to any lesson in Module 2 or beyond while on the free tier.
- **Layout:** Centered modal overlay with backdrop blur. Modal card (max-width: 520px) on `#0F1320` surface.
- **Content:** Headline "Unlock the full [Theme Name] journey". Feature comparison (free vs. paid). Per-model price displayed prominently: "$79 — lifetime access to this theme". Pill-shaped CTA: "Unlock [Theme Name]". Secondary link: "View all themes" (links to pricing page).
- **Dismiss:** Click outside the modal or X button. User is returned to the Module 1 content they can still access.

> **PRICING DISCREPANCY:** The PRD (Section 8) defines a subscription model ($19/mo Pro, $39/seat Team), but the product-plan (Part 2) and the prototypes use per-model pricing ($79 per theme, lifetime access). The paywall prototype implements per-model pricing. This discrepancy must be resolved before V1.0 launch. See also the flag in the PRD.

### 6.4 Bridge Explorer (`bridge-explorer.html`)

A V1.0 feature for browsing all FE-to-ML bridges across themes.

- **Purpose:** A standalone browsable directory of all 50+ FE-to-ML bridges, not tied to a specific lesson. Allows learners to search and explore bridges by FE concept or ML concept.
- **Layout:** Full-page layout with search bar at top (pill-shaped input). Below: filterable grid of bridge cards. Each card shows: FE concept (left), arrow connector, ML concept (right), one-line summary, and the theme it belongs to.
- **Filters:** Filter by theme (checkboxes), by ML category (e.g., "Training", "Architecture", "Data Prep"), or by FE category (e.g., "React", "CSS", "DOM").
- **Card interaction:** Clicking a bridge card expands it inline to show the full analogy text, code examples for both FE and ML sides, and a "Go to lesson" link.
- **Responsive:** On mobile, bridge cards stack vertically. The filter panel collapses into a slide-out drawer accessible via a filter icon button.


---
# FILE: dev-plan.md
---

# Tensorcraft — Development Plan

> Last updated: 2026-03-09

This document is the single source of truth for all development work needed to ship Tensorcraft. It covers every phase from repo initialization to post-launch operations, sourced from the PRD, tech-spec, product-plan, theme scripts, and two rounds of DeepSeek reviews.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0: Prototyping & Documentation (COMPLETE)

- [x] 14 HTML prototypes covering full user journey
- [x] PRD, tech-spec, product-plan, ui-ux-notes, marketing-plan
- [x] 5 theme scripts (Deep Orbit complete, 4 outlines)
- [x] Pricing model aligned across all docs (per-model $79, bundles $129/$169)
- [x] Database schema added to tech-spec (profiles, purchases, theme_progress, waitlist_signups)
- [x] Bridge quality tiers documented (Identity/Structural/Intuition)
- [x] GitHub retroactive push behavior specified in tech-spec 5.3
- [x] Post-purchase confirmation + capstone screens added to PRD
- [x] Payment failure handling documented in PRD 4.6
- [x] All prototype-to-docs misalignments resolved

---

## Resolved Decisions

All blocking decisions have been resolved. This table documents the final choices.

| # | Decision | Resolution | Rationale |
| --- | --- | --- | --- |
| 1 | **V0.5 module scope** | Modules 1–3 (15 lessons) | Matches PRD. Buildable in 4 months solo. |
| 2 | **Database** | Supabase (PostgreSQL + Auth + RLS) | Already implemented in architecture. Auth + RLS from day one. |
| 3 | **Bundle pricing** | $79 single / $129 two / $169 three | Simpler. No 4-theme or 5-theme bundles until themes exist. |
| 4 | **Payment processor** | Stripe Checkout + Webhooks | One-time purchases. No subscriptions. Webhook-driven fulfillment. |
| 5 | **Code execution** | TensorFlow.js in Sandpack | Client-side only. No server sandbox. |
| 6 | **Narrative branching** | Convergent (single path) | Simpler content pipeline. All 5C variations are structural, not branching. |
| 7 | **AI-powered hints** | Manual 3-level progressive disclosure | No LLM cost/latency. Hints authored per exercise. |
| 8 | **WCAG level** | WCAG 2.1 AA | Standard compliance. AAA deferred. |
| 9 | **Content pipeline** | MDX 3 + Velite (Zod schemas) | Build-time validation. Missing fields = build error. |
| 10 | **Code highlighting** | Code Hike (Shiki-based) | Scrollytelling for FE Bridge side-by-side code comparisons. |
| 11 | **Email provider** | Kit (ConvertKit) | Waitlist, per-theme segments, 11-email nurture sequence. |
| 12 | **Team pricing** | Deferred to post-V1.0 | No team tiers at launch. Added to product plan as future phase. |
| 13 | **Early Access tier** | Removed | V0.5 uses Free (M1) + $79 (full theme). No intermediate tier. |
| 14 | **Ship name** | Archimedes | Consistent across all docs and prototypes. |
| 15 | **Nova Canvas model** | Nova Canvas (not "Nova Canvas AI" or "Nova Gen Engine") | Simplified. |

---

## Phase 1: Project Setup & Infrastructure

### 1a. Monorepo & Tooling

- [ ] Initialize Turborepo + pnpm monorepo
- [ ] Configure workspace packages:
  - `apps/web` — Next.js 15 (App Router) frontend
  - `apps/api` — Hono API service
  - `packages/content` — MDX lessons, exercises, theme content
  - `packages/supabase` — Migrations, seed data, RLS policies
  - `packages/themes` — Theme CSS, assets, manifests
  - `packages/shared` — Shared types, utilities, constants
- [ ] TypeScript 5.x strict mode — no `any` in production code
- [ ] ESLint + Prettier configuration (shared config package)
- [ ] Pre-commit hooks: husky + lint-staged (lint, typecheck, format)
- [ ] Configure Tailwind CSS 4 with `@theme` directive + CSS custom properties for theming
- [ ] Font delivery: self-host Inter + JetBrains Mono (not Google Fonts CDN)
  - Font subsetting for performance
  - `font-display: swap` to prevent FOIT
  - Preload critical font files

### 1b. Hono API Backend

- [ ] Set up Hono API service (`apps/api`)
- [ ] Configure middleware (CORS, auth validation, rate limiting)
- [ ] Deploy independently to Fly.io / Railway
- [ ] API versioning strategy (e.g., `/api/v1/`)

### 1c. Database Setup

- [ ] Set up Supabase project (Postgres + Auth)
- [ ] Create database tables per tech-spec schema:
  - `profiles` (id, email, display_name, avatar_url, preferred_theme, github_connected, onboarding_completed, created_at)
  - `purchases` (id, user_id, theme_ids text[], amount, currency, stripe_session_id, created_at)
  - `theme_progress` (id, user_id, theme_id, module_id, lesson_id, status, score, hints_used, completed_at)
  - `waitlist_signups` (id, email, theme_id, created_at)
- [ ] Row-Level Security (RLS) policies on all tables (user can only read/write own data)
- [ ] Indexing strategy: user_id on all tables, compound index on (user_id, theme_id, module_id) for theme_progress
- [ ] Migration strategy using Supabase CLI (`supabase db diff`, `supabase db push`)
- [ ] Seed script for demo/test data (sample user, sample progress, sample purchase)
- [ ] Connection pooling via Supabase built-in pgBouncer
- [ ] Automated daily backups (Supabase managed)

### 1d. CI/CD Pipeline

- [ ] GitHub Actions workflow:
  - **On PR:** Lint → Typecheck → Unit tests → Integration tests → Content validation → Vercel preview deploy
  - **On merge to main:** All above + E2E tests → Vercel production deploy
- [ ] Vercel configuration:
  - Staging environment (preview branches)
  - Production environment (main branch)
  - Environment variables per environment (Supabase keys, Stripe keys, PostHog key, Sentry DSN)
  - Edge Functions for PPP geo-lookup
- [ ] Fly.io / Railway for Hono API backend (independent deployment)
- [ ] Branch protection rules: require PR review, require CI pass, no force push to main
- [ ] Rollback strategy: Vercel instant rollback to previous deployment
- [ ] ISR / caching strategy per page type (PRD 5.4):
  - Theme selection: ISR 60s revalidation
  - Lesson pages: ISR 300s revalidation
  - Dashboard: CSR (no caching, real-time data)
  - Landing / pricing: SSG (static generation)
- [ ] Cache invalidation on content updates (redeploy trigger)

### 1e. Monitoring & Error Tracking

- [ ] Sentry integration with source maps
  - Tag errors by lessonId, themeId, userId (hashed)
  - Separate Sandpack errors from platform errors
  - Alert on error rate spikes
- [ ] Vercel Analytics for Core Web Vitals (zero-config)
  - Targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] PostHog setup (EU region for GDPR):
  - Session replay enabled at 10% sampling
  - Auto-tag replays with lessonId and themeId
  - Feature flags (server-side via Next.js middleware)
  - PII policy: no name/email sent, users identified by hashed userId
  - Data retention: raw events 12 months, aggregated metrics indefinitely

### 1f. Security Foundations

- [ ] CORS configuration for API endpoints
- [ ] CSP headers for Next.js (allow Sandpack iframe, Google Fonts, PostHog, Sentry)
- [ ] Secrets management via Vercel env vars (frontend) + Supabase vault (backend)
- [ ] Rate limiting on API routes (general limits + 5,000 req/hr for GitHub App per installation)
- [ ] OAuth scope validation: minimal scopes at signup, `repo` scope requested only on GitHub connect
- [ ] XSS prevention in MDX rendering pipeline (sanitize custom components)

---

## Phase 2: Core Pages & Auth

### 2a. Auth System

- [ ] Supabase Auth integration:
  - GitHub OAuth (via Supabase Auth via @supabase/ssr, PKCE flow) — request minimal scopes at signup
  - Google OAuth
  - Email magic link (15-minute expiry)
- [ ] Sign up / login page (from `prototypes/auth.html`)
- [ ] Guest browsing mode (view Module 1 content without account)
- [ ] Session management and protected routes (Next.js middleware)
- [ ] OAuth error handling (failed auth, revoked tokens, scope denied)

### 2b. Onboarding Flow

- [ ] 3-step post-signup flow (from `prototypes/onboarding.html`):
  1. Welcome screen — headline "You Already Think Like an ML Engineer"
  2. Theme selection — Deep Orbit pre-highlighted as recommended
  3. Confirmation + "Begin Module 1" CTA
- [ ] Dynamic module/lesson counts — show "3 Modules, 15 Lessons" for V0.5 (driven by content source, not hardcoded)
- [ ] Onboarding completion persistence — store `onboarding_completed` flag in `profiles`, skip on future logins
- [ ] Stepper indicator showing progress through 3 steps
- [ ] Track `onboarding_completed` analytics event

### 2c. Legal & Compliance

- [ ] Terms of Service page (`/terms`)
- [ ] Privacy Policy page (`/privacy`)
- [ ] Cookie consent banner (GDPR/CCPA)
- [ ] Wire all footer placeholder links (`auth.html` line 344, all site footers)
- [ ] PostHog EU region for GDPR compliance
- [ ] Data processing agreements with third-party services (Supabase, Stripe, PostHog, Sentry)
- [ ] Must be live before payment processing is enabled

### 2d. Landing Page

- [ ] Build from `prototypes/landing.html`
- [ ] Hero with breathing color washes + dot grid animation
- [ ] Headline: "The Bridge from Frontend to ML Is Shorter Than You Think"
- [ ] Theme showcase: Deep Orbit hero card (2-col + code mockup) + 4 coming-soon cards in 2x2 grid
- [ ] FE-to-ML bridge examples section
- [ ] Respect `prefers-reduced-motion` for all animations

---

## Phase 3: Learning Experience & Content Pipeline

### 3a. MDX Content Pipeline

- [ ] Configure Velite with Zod schemas for MDX content:
  - 15 required frontmatter fields: id, title, slug, module, moduleTitle, order, estimatedMinutes, difficulty, objectives, keywords, hasExercise, hasQuiz, publishedAt, updatedAt, authors
  - Conditional validation: exerciseId required if hasExercise = true
  - Enum enforcement: difficulty ∈ {beginner, intermediate, advanced}
  - Format validation: ISO 8601 dates, kebab-case slugs
- [ ] Code Hike (Shiki) syntax highlighting for code blocks (runnable vs editable flags)
- [ ] MDX component library:
  - `<LearningObjectives>` — 2-5 items, displayed as checklist
  - `<Concept>` — title + explanation callout
  - `<MathBlock>` — KaTeX rendering (unblocks Module 2+)
  - `<CodeBlock>` — syntax highlighting, copy button, language spec
  - `<Exercise>` — Sandpack integration (exerciseId → JSON definition)
  - `<Quiz>` — question array with answer key validation
  - `<KeyTakeaways>` — 3-5 key points
  - `<RecallPrompt>` — spaced repetition prompts
  - `<BridgeCallout>` — FE-to-ML bridge with tier color coding (Identity=#00D4FF, Structural=#7B68EE, Intuition=#F0C75E)
  - `<InteractiveDemo>` — interactive ML visualizations (unblocks Module 3+)
  - `<Dialogue>` — speaker label + styled speech bubble (from lesson-viewer.html prototype)
- [ ] Generate `lesson-manifest.json` from content at build time
- [ ] Content preview/staging server for authors

### 3b. Content Authoring Workflow

- [ ] Style guide and content templates (required before content production at scale)
- [ ] Editorial review process: author → technical reviewer (ML accuracy) → narrative reviewer (voice/tone)
- [ ] First 10 lessons set the quality bar; all subsequent reviewed against these
- [ ] Platform component build order (from tech-spec Section 6 — components must ship before content that depends on them):
  - **Week 1–2:** MDX rendering, `<CodeBlock>`, `<LearningObjectives>`, `<Concept>`, `<KeyTakeaways>`
  - **Week 2:** `<MathBlock>` (KaTeX) — unblocks Module 2
  - **Week 2–3:** Sandpack `<Exercise>` — unblocks Module 1 Lesson 3+
  - **Week 2–3:** Theme system, Progress tracking API
  - **Week 3:** `<Quiz>` — unblocks Module 4
  - **Week 3–4:** `<InteractiveDemo>` — unblocks Module 3 Lesson 7+
  - **Week 4:** `<RecallPrompt>`, GitHub commit flow — unblocks Module 4 Lesson 15

### 3c. Content Validation (CI-Time)

- [ ] Frontmatter schema validation (Zod — fail build on invalid)
- [ ] Broken internal link checking (cross-file lesson references, prerequisites)
- [ ] Exercise validation: starter code compiles/runs, solution passes all tests
- [ ] Image asset validation: paths exist, alt-text present
- [ ] Bridge validation: all 26 shared + 6 Deep Orbit-specific bridges present and tagged with tier
- [ ] 5C Loop structure enforcement per lesson:
  1. **Context** — narrative scene set
  2. **Concept** — ML concept with FE bridge
  3. **Code** — hands-on exercise
  4. **Challenge** — stretch problem
  5. **Consequence** — story progression
- [ ] Difficulty progression validation within modules (beginner → intermediate → advanced)

### 3d. Module Overview

- [ ] Build from `prototypes/module-overview.html`
- [ ] Dynamic progress nodes — query `theme_progress`, render locked/in-progress/completed states
- [ ] Story panel with theme narrative (character + mission context)
- [ ] Module prerequisite enforcement: complete Module N to unlock Module N+1
- [ ] Visual locked state for unstarted modules (lock icon, reduced opacity, "Complete Module X to unlock" tooltip)
- [ ] V0.5: Show Modules 1–3 only for Deep Orbit

### 3e. Lesson Viewer

- [ ] Build from `prototypes/lesson-viewer.html`
- [ ] 3-column layout: narrative sidebar, main content, bridge/quiz sidebar
- [ ] Real MDX content rendering (replace hardcoded HTML)
- [ ] In-lesson checks: 2-3 lightweight knowledge checks per lesson (not graded, immediate feedback)
- [ ] Mobile responsive sidebar with slide-in animation (pattern from prototype)
- [ ] Track `lesson_started` and `lesson_completed` analytics events
- [ ] Track scroll depth for engagement validation (target: 75%+ completion depth)

### 3f. Exercise Editor

- [ ] Build from `prototypes/exercise.html`
- [ ] Sandpack integration for live code execution:
  - Dynamic import with `ssr: false` to prevent SSR inclusion
  - Styled skeleton placeholder to prevent layout shift (CLS = 0)
  - Intersection Observer to delay hydration until scrolled into viewport (within 200px)
  - Preload hint (`<link rel="preload">`) when `hasExercise: true`
- [ ] Custom lightweight test runner: `describe`, `it`, `expect`, `assertClose` (for floating-point ML outputs)
- [ ] 10-second execution timeout per test suite
- [ ] Partial credit system: individual assertions pass independently
- [ ] Test output: checklist of passing/failing, console.log/console.error captured separately
- [ ] Hint system with progressive reveal (track `hint_requested` event)
- [ ] Friendly error messages (Sandpack errors tagged separately in Sentry)
- [ ] Track `checkpoint_passed` and `capstone_submitted` events

### 3g. Deep Orbit Content (V0.5 — Modules 1–3)

- [ ] Module 1: Tensors, Shapes, Operations, Data Loading, Normalization (5 lessons)
- [ ] Module 2: Layers, Activations, Forward Pass, Loss Functions, Gradient Descent (5 lessons)
- [ ] Module 3: CNN Basics, Kernels, Pooling, Feature Maps, Image Classification Capstone (5 lessons)
- [ ] Module 4: Training Loop, Overfitting, Regularization, Metrics, Hyperparameters (5 lessons)
- [ ] Module 5: Time-Series Intro, Signal Processing, FFT, Sliding Windows, Signal Classification Capstone (5 lessons)
- [ ] All 15 lessons follow 5C Loop structure
- [ ] All FE-to-ML bridges present (20 shared + 6 Deep Orbit-specific)
- [ ] Character voices consistent: Commander Adaeza, Dr. Hana Sato, Chief Maria Torres, Echo (AI)
- [ ] Narrative arc: setup (M1-2) → rising action (M3-4) → midpoint (M5 capstone)

---

## Phase 4: Payments & Access Control

### 4a. Pricing Page

- [ ] Build from `prototypes/pricing.html`
- [ ] 4 individual tiers: Free Preview ($0), Single Theme ($79), Two Themes ($129), Three Themes ($169)
- [ ] Team pricing: Deferred to post-V1.0. Design based on enterprise demand data.
- [ ] FAQ accordion (interactive)
- [ ] Feature comparison table

### 4b. Stripe Integration

- [ ] Stripe Checkout sessions for one-time payments
- [ ] Support credit card, Google Pay, Apple Pay
- [ ] Webhook handling with signature validation:
  - `checkout.session.completed` → write purchase to `purchases` table, send confirmation email
  - `charge.refunded` → update purchase record, revoke access
  - `charge.failed` → display error modal with retry + support link
- [ ] Webhook retry logic / dead-letter queue for failed deliveries
- [ ] Payment failure error modal on pricing page (PRD 4.6)
- [ ] Upgrade path: credit amount already paid toward higher tier
- [ ] Track `purchase_completed` and `refund_requested` events

### 4c. Paywall & Access Control

- [ ] Route guard middleware — check `purchases` table for theme access
- [ ] Paywall modal when free-tier user attempts Module 2+ (from `prototypes/paywall.html`)
- [ ] Upgrade path from paywall → pricing page
- [ ] Track `paywall_hit` and `upgrade_modal_shown` events

### 4d. Post-Purchase Confirmation

- [ ] Build from `prototypes/purchase-confirmation.html`
- [ ] Show unlocked modules list, next steps, Discord invite
- [ ] Redirect here after successful Stripe checkout

### 4e. Email System

- [ ] Kit integration for transactional + marketing emails
- [ ] Email flows:
  - Welcome series (post-signup, 3-email sequence)
  - Purchase confirmation (immediate, includes receipt)
  - Capstone achievement (congratulations + certificate link)
  - Waitlist nurture (monthly free content tease, early-bird 10% off for 48h after theme launch)
- [ ] Email templates matching Zensman DeFi design system
- [ ] Unsubscribe / preference management
- [ ] Email deliverability monitoring

### 4f. PPP Discounts (Post-V0.5)

- [ ] ParityDeals integration for automatic regional discounts (20–70%)
- [ ] Vercel Edge Function for geo-lookup
- [ ] Show original vs discounted price on pricing page
- [ ] PPP discount percentage displayed alongside original price

---

## Phase 5: User Features

### 5a. Dashboard

- [ ] Build from `prototypes/dashboard.html`
- [ ] Real progress stats from `theme_progress` table (modules completed, lessons done, current streak)
- [ ] Streak calculation from `completed_at` timestamps
- [ ] Activity feed (recent lesson completions, achievements)
- [ ] Track `streak_achieved` event (3-day, 7-day, 30-day milestones)
- [ ] Skill radar: radar chart showing proficiency across 6 axes (PRD 3.4)
- [ ] Progress ring: circular SVG indicator (from dashboard.html prototype)
- [ ] Share snapshot: html2canvas 2x PNG with watermark, share modal with Clipboard API + Web Share API fallback (ui-ux-notes 2.5)
- [ ] Activity heatmap (post-V0.5 — query `theme_progress` by `completed_at` date, render SVG)

### 5b. Settings

- [ ] Build from `prototypes/settings.html`
- [ ] Profile editing (display name, avatar)
- [ ] GitHub connection toggle with retroactive push
- [ ] Theme preference switching ("Theme applies to your learning content and code editor")
- [ ] Notification preferences
- [ ] Account management (danger zone: delete account, export data)

### 5c. Theme Selection

- [ ] Build from `prototypes/theme-selection.html`
- [ ] Deep Orbit as available, 4 themes as "Coming Soon"
- [ ] "Notify Me" email capture → `waitlist_signups` table with theme_id, confirmation toast
- [ ] Coming-soon modal with theme preview + email input
- [ ] Track `theme_selected` event

### 5d. GitHub Integration

- [ ] GitHub App setup (tech-spec 5.1–5.2):
  - Fine-grained, per-repository permissions
  - Short-lived installation tokens (1-hour auto-refresh)
  - Rate limit: 5,000 req/hr per installation (separate quota per user)
- [ ] Commit lesson artifacts on completion
- [ ] Repo naming: `tensorcraft-{theme-slug}`, internal project folder = theme-specific name
- [ ] Retroactive push (tech-spec 5.3): when user connects GitHub after completing modules, background job queues all completed artifacts for push in chronological order with progress indicator
- [ ] Opt-out and disconnect flow: token revocation on disconnect
- [ ] Graceful degradation if repo access is revoked (PRD risk #6)
- [ ] Retry logic on GitHub API failures (exponential backoff, max 3 retries, queue commits)
- [ ] Repo creation flow: if no repo connected, prompt to create new `tensorcraft-{theme-slug}` repo from within Tensorcraft
- [ ] Auto-generated README.md template: badge, module list, course description, Tensorcraft link (tech-spec 5.4)

---

## Phase 6: Polish & Launch Prep

### 6a. Accessibility

- [ ] WCAG 2.1 AA compliance across all pages
- [ ] 44px minimum touch targets for all interactive elements
- [ ] Keyboard navigation for all interactive elements (tab order, focus indicators)
- [ ] `@media (prefers-reduced-motion: reduce)` — disable/simplify all animations globally
- [ ] Screen reader testing (VoiceOver on macOS, NVDA on Windows)
- [ ] Automated accessibility testing: jest-axe (unit), axe-playwright (E2E)
- [ ] Color contrast audit (4.5:1 minimum for text, 3:1 for UI components)
- [ ] Image alt-text on all images

### 6b. Mobile Responsiveness

- [ ] Hamburger menu component with slide-in drawer (reuse `lesson-viewer.html` sidebar pattern)
- [ ] Responsive at breakpoints: 320px, 768px, 1024px, 1440px
- [ ] Touch-friendly interactions (swipe, tap targets)
- [ ] Testing devices per PRD 5.5: iPhone SE, iPhone 15 Pro, iPad Air, Pixel 7, Samsung Galaxy S23
- [ ] Browser compatibility: Chrome, Firefox, Safari, Edge (latest 2 versions)

### 6c. Performance Optimization

- [ ] Bundle size budgets — monitor with @next/bundle-analyzer
- [ ] Code splitting: per-page chunks, per-theme CSS, dynamic imports for Sandpack
- [ ] Sandpack lazy loading: dynamic import (ssr: false), Intersection Observer (200px threshold), preload hint
- [ ] Image optimization: next/image with automatic format selection, CDN delivery
- [ ] Max 3 simultaneous animations per viewport
- [ ] Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Lighthouse CI in GitHub Actions (fail build if score drops below threshold)

### 6d. SEO & Marketing Infrastructure

- [ ] Structured data: Course schema, Organization schema (JSON-LD)
- [ ] Dynamic OG images via Vercel OG (per-page, per-lesson)
- [ ] Sitemap generation (next-sitemap)
- [ ] robots.txt with crawl directives
- [ ] Canonical URLs on all pages
- [ ] Blog infrastructure (MDX-based, target: 2 posts/week)
- [ ] Google Search Console setup
- [ ] Target keywords: "learn machine learning JavaScript", "TensorFlow.js tutorial", "ML for front-end developers"

### 6e. Error Handling

- [ ] Global error boundary component (React)
- [ ] Custom 404 page (themed, with navigation back to dashboard)
- [ ] Custom 500 page (error logged to Sentry, user-friendly message)
- [ ] User-friendly error messages for:
  - Payment failures (retry + support link)
  - Auth failures (provider-specific guidance)
  - GitHub integration failures (retry + disconnect option)
  - Exercise execution errors (separate from platform errors in Sentry)

### 6f. Community & External Links

- [ ] Create Discord server with channels: #general, #deep-orbit, #help, #feedback, #beta-testers
- [ ] Replace all Community placeholder `href="#"` links with Discord invite URL
- [ ] Purchase confirmation Discord CTA with invite link
- [ ] Create Twitter/X account
- [ ] Replace all Twitter placeholder `href="#"` links across 9 pages
- [ ] Set up social media OG meta tags

---

## Phase 7: Post-V0.5 Features

### 7a. Bridge Explorer (V1.0)

- [ ] Build from `prototypes/bridge-explorer.html`
- [ ] Browse all 56+ FE-to-ML bridges with filters and search
- [ ] Bridge quality tier color coding (Identity=#00D4FF, Structural=#7B68EE, Intuition=#F0C75E)
- [ ] Gate behind PostHog feature flag, or ship as read-only reference page in V0.5

### 7b. Capstone Completion

- [ ] Build from `prototypes/capstone.html`
- [ ] Celebration screen: stats, journey map, narrative conclusion, character avatars
- [ ] Certificate PDF generation:
  - Server-side with user name, theme name, completion date
  - Capstone summary, final model metrics
  - Unique verification URL
  - GitHub repository link
- [ ] Social sharing with dynamic OG image (Vercel OG) for Twitter/LinkedIn
- [ ] Track `progress_shared` event

### 7c. Deep Orbit Modules 6–11 (V1.0)

- [ ] Module 6–11 content authoring (30 additional lessons)
- [ ] Full narrative arc completion (rising action → climax → resolution)
- [ ] 2-3 "AI-wrong moments" where the system fails (teaching resilience)
- [ ] Character arc completion for all 4 characters

### 7d. Additional Themes

- [ ] V2.0: Neon Protocol (Cyberpunk — Computer Vision) — Q4 2026
- [ ] V3.0: Signal Ward (Medical — NLP & Text) — Q1 2027
- [ ] V3.0: Nova Canvas (Creative AI — Multimodal & Generative) — Q2 2027
- [ ] V4.0: Terra Grid (Industrial — Edge AI & Production ML) — Q3 2027

### 7e. Bundle & Team Pricing

- [ ] Bundle purchase flow ($129 two themes, $169 three themes)
- [ ] Team license management (admin dashboard, seat assignment, progress reports)
- [ ] Upgrade credit logic (pay difference when moving to higher tier)

### 7f. Module Count Dynamic Updates

- [ ] Drive all module/lesson counts from content source (MDX file count via Velite)
- [ ] Never hardcode — automatically updates when new modules ship

### 7g. Arena (V1.0+)

- [ ] Arena: weekly ML challenges with community leaderboard
- [ ] ELO-style scoring system
- [ ] $29/year subscription (separate from theme purchases)
- [ ] Community solution viewing after submission deadline
- [ ] Challenge authoring pipeline and scheduling

### 7h. Internationalization (V3.0+)

- [ ] next-intl framework integration
- [ ] Machine translation pipeline (DeepL API with custom glossaries)
- [ ] Expert review workflow (native-speaking ML practitioners)
- [ ] Shared ML glossary (`packages/content/glossary.json`)
- [ ] Publishing matrix config (`packages/content/publishing-matrix.json`)
- [ ] Phase 1: Spanish, Portuguese (triggered by ≥500 MAU from LATAM)
- [ ] Phase 2: Japanese, Korean, Chinese (triggered by ≥1,000 MAU from APAC)
- [ ] Phase 3: French, German, Arabic (triggered by ≥2,000 MAU)

---

## Phase 8: Testing & Quality Assurance

### 8a. Unit Tests

- [ ] Jest + React Testing Library for components and hooks
- [ ] Test coverage for:
  - Auth flows (login, signup, logout, session refresh)
  - Progress calculation logic (streak, completion %)
  - Payment webhook handlers
  - MDX component rendering
  - Bridge callout rendering with correct tier colors
- [ ] Accessibility: jest-axe on all component tests

### 8b. Integration Tests

- [ ] Supabase integration: CRUD on all 4 tables, RLS policy enforcement
- [ ] Stripe webhook flow: checkout → purchase record → access grant
- [ ] GitHub integration: token acquisition → commit → push
- [ ] Content pipeline: MDX → rendered lesson with all components

### 8c. E2E Tests (Playwright)

- [ ] Full user journeys:
  - New user: landing → signup → onboarding → Module 1 lesson → complete exercise
  - Payment: pricing → checkout → confirmation → Module 2 unlocked
  - GitHub: settings → connect → verify repo created → verify commit pushed
  - Capstone: complete all modules → capstone screen → certificate download
- [ ] Mobile viewport tests (iPhone SE, iPad Air)
- [ ] Accessibility: axe-playwright on all page routes

### 8d. Visual Regression

- [ ] Playwright screenshot comparison for key pages
- [ ] Theme switching visual tests (all 5 themes render correctly)
- [ ] Responsive layout tests at each breakpoint

### 8e. Performance Testing

- [ ] Lighthouse CI in GitHub Actions:
  - Performance score ≥ 90
  - Accessibility score ≥ 95
  - Best Practices score ≥ 90
  - SEO score ≥ 95
- [ ] Bundle size regression checks (fail if main bundle grows >10% without explanation)
- [ ] Sandpack load time benchmarks (< 3s to interactive on 3G)

### 8f. Exercise Validation

- [ ] CI check: all starter code compiles without errors
- [ ] CI check: all solution code passes all tests
- [ ] CI check: test suite runs within 10-second timeout
- [ ] CI check: partial credit structure (each assertion independent)

---

## Phase 9: Beta Program & Content QA

### 9a. Beta Testing Program

- [ ] Recruit 50-100 frontend developers (Twitter/X, Discord, Dev.to, personal referrals)
- [ ] Private Discord channel for async discussion
- [ ] 4-week testing timeline:
  - **Week 1:** Modules 1-2 — focus: onboarding, first impressions, bridge clarity
  - **Week 2:** Modules 3-4 — focus: difficulty curve, exercise quality, narrative engagement
  - **Week 3:** Module 5 — focus: capstone quality, progress diagram, GitHub integration
  - **Week 4:** Full play-through — focus: overall experience, pacing, willingness-to-pay
- [ ] In-app feedback: emoji reaction + optional text on every lesson
- [ ] Weekly 30-minute group calls (5-8 participants per call)
- [ ] Exit survey: NPS, willingness-to-pay, open-ended feedback
- [ ] Success criteria:
  - NPS ≥ 40
  - ≥ 70% module completion rate across cohort
  - ≥ 80% would pay $79
  - < 5% of lessons flagged as "confusing" by > 20% of testers

### 9b. Content Quality Audits

- [ ] Per-theme information architecture validation:
  - Module maps match theme scripts
  - Lesson order follows 5C Loop
  - Difficulty progression: beginner → intermediate → advanced within each module
  - Core content (60%) vs unique specialization (40%) ratio enforced
  - Early modules (1-4): ~80% shared / 20% unique
  - Later modules (8-11): ~40% shared / 60% unique
- [ ] Bridge review process: each bridge reviewed by 2 FE devs + 1 ML engineer
  - Remove or rewrite any bridge rated below 3/5 clarity by beta testers
  - All 26 shared bridges + 6 theme-specific bridges validated
- [ ] Character voice consistency audit:
  - Mentor/Commander: sets context, explains "why" (never deep technical detail)
  - Technical Expert: introduces theory, explains concepts, builds intuition
  - Implementation Lead: pragmatic, skeptical, handles real-world constraints
  - Student Avatar: FE dev with no ML background, asks clarifying questions
  - AI Assistant: tutorial guide, hint system, theme-consistent tone
- [ ] Narrative arc pacing validation: crisis intensity escalates toward capstone
- [ ] "AI-wrong moments" placed correctly (2-3 per theme, teaching resilience)

### 9c. Analytics-Driven Content QA (Post-Launch)

- [ ] Lesson completion rate targets: beginner ≥75%, intermediate ≥60%, advanced ≥45%
- [ ] Exercise pass rate: ≥70% within 3 attempts (trigger content review if <50%)
- [ ] Hint dependency: ≤40% of completions use hints (>60% triggers exercise redesign)
- [ ] Scroll depth: ≥75% completion depth (validates engagement)
- [ ] Monthly review: identify 2-3 lessons for optimization
- [ ] Quarterly: character consistency audit, narrative arc review
- [ ] Biannually: full curriculum audit for technical accuracy, bridge consistency

---

## Phase 10: Release & Post-Launch

### 10a. V0.5 Launch Checklist

- [ ] All Phase 1–6 items complete
- [ ] Legal pages live (Terms, Privacy)
- [ ] Cookie consent banner functional
- [ ] Stripe payments tested end-to-end (real money test transaction)
- [ ] All 15 lessons pass content validation CI checks
- [ ] All exercises pass automated validation
- [ ] Lighthouse scores meet thresholds (Performance ≥90, A11y ≥95)
- [ ] Core Web Vitals within targets (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] Sentry error tracking verified (test error → appears in dashboard)
- [ ] PostHog events verified (test each of 10 events → appears in dashboard)
- [ ] Email flows tested (welcome, purchase confirmation)
- [ ] GitHub integration tested (repo creation, commit push, retroactive push)
- [ ] Mobile tested on target devices (iPhone SE, iPad Air, Pixel 7)
- [ ] Browser tested (Chrome, Firefox, Safari, Edge)
- [ ] All placeholder `href="#"` links replaced with real routes
- [ ] Beta program complete, success criteria met

### 10b. Launch Execution

- [ ] Invite 500 waitlist users
- [ ] Launch week email blast
- [ ] Social media announcements (Twitter/X, LinkedIn, Dev.to)
- [ ] Guest posts: Smashing Magazine, CSS-Tricks, Dev.to
- [ ] Open-source bridge card library on GitHub (marketing-plan)
- [ ] Monitor error rates, payment success rates, analytics events for first 48 hours

### 10c. Risk Mitigation Tasks

- [ ] Risk #1 (story fatigue): Implement narrative on/off toggle (default: on). Track skip rates per lesson. If >40% skip in any module, flag for narrative redesign.
- [ ] Risk #5 (animation complexity): Prototype the 3 most complex interactive animations first. If any takes >2x estimated time, simplify or replace with pre-rendered alternatives.
- [ ] Risk #3 (pricing resistance): Validate willingness-to-pay during beta exit survey. If <70% would pay $79, evaluate $59 launch price.

### 10d. Success Metrics Dashboard

- [ ] Build internal PostHog dashboard tracking key metrics:
  - Lesson completion rate (target: ≥60%)
  - Paid conversion rate (target: 3%)
  - NPS score (target: ≥40)
  - 7-day retention (target: ≥30%)
  - 30-day retention (target: ≥15%)
  - Average time per lesson
  - Hint dependency ratio
  - Paywall conversion rate
- [ ] Set up PostHog alerts for metrics falling below thresholds

### 10e. Post-Launch Operations

- [ ] Weekly metrics review: completion rates, hint dependency, time-on-page, conversion
- [ ] Cohort analysis: performance by difficulty, theme, learner background
- [ ] Content maintenance cycle:
  - Monthly: review analytics, optimize 2-3 lessons
  - Quarterly: character/narrative consistency audit
  - Biannually: full curriculum technical accuracy audit
- [ ] Respond to beta feedback, community Discord questions
- [ ] Plan V1.0 scope (Deep Orbit Modules 6–11)

---

## Appendix A: Placeholder Links Reference

All `href="#"` links in prototypes that need real routes:

| Link | Pages | Target |
| --- | --- | --- |
| Twitter | landing, pricing, auth, theme-selection, module-overview, settings, paywall, capstone, purchase-confirmation | Twitter/X profile URL |
| Community | dashboard footer, settings footer | Discord invite URL |
| Terms | auth | `/terms` |
| Privacy Policy | auth | `/privacy` |
| Start now (nav) | theme-selection | `/auth` |
| Download Certificate | capstone | Certificate generation endpoint |
| Share Progress | capstone | Share modal / OG image |
| Discord card | purchase-confirmation | Discord invite URL |

---

## Appendix B: Analytics Event Taxonomy (PRD 4.7)

### Learning Events

| Event | Trigger | Properties |
| --- | --- | --- |
| lesson_started | User opens a lesson | lessonId, moduleId, themeId |
| lesson_completed | User finishes all lesson content | lessonId, moduleId, themeId, timeSpent, hintsUsed |
| checkpoint_passed | User passes an in-lesson check | lessonId, checkpointId, attempts |
| capstone_submitted | User submits module capstone | moduleId, themeId, score, timeSpent |

### Conversion Events

| Event | Trigger | Properties |
| --- | --- | --- |
| paywall_hit | Free user attempts Module 2+ | moduleId, themeId |
| upgrade_modal_shown | Paywall modal displayed | source (paywall, pricing, dashboard) |
| purchase_completed | Stripe checkout success | tier, amount, themeIds, pppDiscount |
| refund_requested | User requests refund | purchaseId, reason |

### Engagement Events

| Event | Trigger | Properties |
| --- | --- | --- |
| theme_selected | User picks a theme | themeId, source (onboarding, settings) |
| progress_shared | User shares progress/certificate | platform (twitter, linkedin, copy) |
| streak_achieved | User hits streak milestone | days (3, 7, 14, 30) |
| hint_requested | User opens hint in exercise | exerciseId, hintLevel (1, 2, 3) |

### Derived Metrics

| Metric | Calculation | Alert Threshold |
| --- | --- | --- |
| Lesson completion rate | completed / started per lesson | < 50% → review lesson |
| Avg time per lesson | mean timeSpent per lesson | > 30min → content too long |
| Hint dependency ratio | completions with hints / total completions | > 60% → redesign exercise |
| Paywall conversion | purchases / paywall_hits | < 5% → review pricing/copy |
| 7-day retention | active day 7 / signed up | < 30% → review onboarding |
| 30-day retention | active day 30 / signed up | < 15% → review content loop |

---

## Appendix C: Content Validation Rules (CI-Time)

| Rule | Scope | Severity |
| --- | --- | --- |
| Frontmatter has all 15 required fields | All MDX files | Error (blocks build) |
| Slug is kebab-case | All MDX files | Error |
| Difficulty is valid enum | All MDX files | Error |
| Dates are ISO 8601 | All MDX files | Error |
| exerciseId exists when hasExercise=true | All MDX files | Error |
| Referenced exerciseId has matching JSON | Exercises | Error |
| Starter code compiles without errors | Exercises | Error |
| Solution code passes all tests | Exercises | Error |
| Test suite runs within 10s timeout | Exercises | Error |
| Internal lesson links resolve | All MDX files | Warning |
| Image paths exist | All MDX files | Warning |
| Images have alt-text | All MDX files | Warning |
| 5C Loop structure present | All lessons | Warning |
| Bridge callout has valid tier | Bridge components | Warning |
| LearningObjectives has 2-5 items | Component usage | Warning |
| KeyTakeaways has 3-5 items | Component usage | Warning |

---

## Appendix D: Risk Log (from product-plan)

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| 1 | Story fatigue — learners skip narrative | Medium | High | Make narrative optional (default on). Track skip rates. If >40% skip, redesign to be shorter/more decision-driven |
| 2 | Bridge confusion — bridges feel forced | Low | High | 2 FE devs + 1 ML engineer review each bridge. Remove/rewrite if <3/5 clarity |
| 3 | Pricing resistance — $79 feels too high | Medium | High | Validate willingness-to-pay in beta. Consider $59 launch price |
| 4 | Scope creep on V0.5 | High | Medium | Strict scope doc. Weekly review. Addition = removal of equal effort |
| 5 | Interactive animation complexity | Medium | Medium | Prototype 3 most complex first. If >2x time, simplify or pre-render |
| 6 | GitHub integration reliability | Medium | Low | Robust retry logic. GitHub integration optional. Queue commits + retry on failure |
| 7 | Content quality at scale | Medium | High | Style guide + templates. First 10 lessons set bar. Hire narrative writer |
| 8 | Low Coming Soon conversion | Medium | Medium | Nurture email: monthly free content. Early-bird 10% off for 48h |
| 9 | Platform performance under load | Low | High | Load test before launch. Client-side WASM (Pyodide). CSS/Canvas animations GPU-accelerated. CDN for static assets |

---

## Version Roadmap

| Version | Content | Target |
| --- | --- | --- |
| V0.5 | Deep Orbit Modules 1–3 (15 lessons, free tier) | Q2 2026 |
| V1.0 | Deep Orbit Modules 1–11 (55 lessons, full) | Q3 2026 |
| V2.0 | + Neon Protocol (55 lessons) | Q4 2026 |
| V3.0 | + Signal Ward + Nova Canvas (110 lessons) | Q1–Q2 2027 |
| V4.0 | + Terra Grid (55 lessons) | Q3 2027 |

---

## Related Documents

This dev plan covers engineering implementation. For detailed specs in other domains, refer to:

| Domain | Document | Key Sections |
| --- | --- | --- |
| UI interaction specs, animations, responsive layouts | `docs/ui-ux-notes.md` | Parts 1–6 (screen specs, progress diagram, lesson layout, mobile, design tokens, new screens) |
| Marketing strategy, SEO, launch sequence, paid ads | `docs/marketing-plan.md` | Parts 1–6 (SEO, launch, paid, organic, waitlist, content calendar) |
| Revenue projections, growth targets, pricing strategy | `docs/product-plan.md` | Part 2 (pricing), Part 5 (revenue), Appendix (founder decisions) |
| Theme scripts, character arcs, narrative details | `docs/scripts/` | 5 theme scripts (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) |
| Technical architecture, MDX schemas, analytics config | `docs/tech-spec.md` | Sections 1–7 (stack, content, exercises, analytics, GitHub, calendar, i18n) |
| Product requirements, feature tables, design system | `docs/prd.md` | Sections 3–6 (requirements, features, architecture, design system) |


---
# FILE: architecture.md
---

# Tensorcraft — Architecture

## Overview

Tensorcraft is an interactive, story-driven ML education platform for frontend engineers. Users learn machine learning through **50+ deep structural mappings** between frontend concepts they already know and ML concepts they're learning — not casual analogies, but real architectural parallels.

## Monorepo Structure

```
tensorcraft/
├── apps/
│   ├── web/          Next.js 15 frontend (port 3000)
│   └── api/          Hono backend (port 3001)
├── packages/
│   ├── config/       Shared ESLint, TypeScript, Tailwind configs
│   ├── themes/       5 themed course manifests + CSS custom properties
│   ├── ui/           Shared React component library (Framer Motion)
│   └── supabase/     Database types, clients, migrations
├── docs/             Project documentation
├── turbo.json        Turborepo task configuration
└── pnpm-workspace.yaml
```

**Tooling**: pnpm (workspaces) + Turborepo (task orchestration) + TypeScript (strict mode everywhere).

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 15 (App Router) | RSC, Turbopack dev, file-based routing |
| Backend | Hono | Lightweight, edge-ready, separate from Next.js for independent deployment |
| Database | Supabase (PostgreSQL) | Auth, RLS, real-time, generous free tier |
| Styling | Tailwind CSS 4 | CSS-native `@theme` directive, zero-JS theming |
| Animation | Framer Motion | Declarative, layout animations, gesture support |
| Content | MDX 3 + Velite (Zod schemas) | Type-safe content with build-time validation |
| Code Highlighting | Code Hike (Shiki-based) | Scrollytelling, FE Bridge code comparisons |
| Code Exercises | Sandpack (CodeSandbox) | Browser-based code playgrounds with Jest |
| Payments | Stripe Checkout + Webhooks | One-time purchases, webhook-driven fulfillment |
| Email | Kit (ConvertKit) | Waitlist, per-theme segmented lists, nurture sequences |
| Analytics | PostHog + Plausible | Product analytics + privacy-friendly marketing analytics |
| Fonts | Inter + JetBrains Mono | Clean UI + monospace for code/technical content |

## Theme System

### Design Philosophy

Dark mode only. Neon aesthetic with glowing borders, text shadows, animated gradients, and glassmorphism. Every theme has a unique color palette but shares the same structural design tokens.

### 5 Themed Courses

| Theme | Specialization | Primary | Accent | Status |
|-------|---------------|---------|--------|--------|
| Deep Orbit | Time-Series & Signals | `#7B68EE` | `#F0C75E` | Launched |
| Neon Protocol | Computer Vision | `#00D4FF` | `#FF2D7B` | Coming Soon |
| Signal Ward | NLP & Text Intelligence | `#2ECC71` | `#5B8DEF` | Coming Soon |
| Nova Canvas | Multimodal & GenAI | `#FF6B6B` | `#A78BFA` | Coming Soon |
| Terra Grid | Edge AI & MLOps | `#F59E0B` | `#10B981` | Coming Soon |

### How Theming Works

1. **CSS Custom Properties** (`packages/themes/src/css/themes.css`): Each theme defines `--tc-*` variables under a `[data-theme="theme-slug"]` selector.
2. **Tailwind 4 `@theme`** (`packages/config/tailwind/base.css`): Maps Tailwind utility classes to `--tc-*` variables so `bg-surface`, `text-primary`, `border-border` all resolve dynamically.
3. **Runtime Switching**: Set `data-theme` attribute on `<html>` to switch themes. No JS bundle cost — pure CSS resolution.
4. **Neon Utilities** (`apps/web/app/globals.css`): `.neon-text`, `.neon-box`, `.neon-border`, `.glass`, `.grid-pattern` — all using theme-aware `--tc-glow` and `--tc-neon-line` tokens. All animations respect `prefers-reduced-motion`.

### Theme Manifests

Each theme (`packages/themes/src/<theme>.ts`) exports a `ThemeManifest` with:
- **Palette**: bg, primary, accent, surface, text, glow, neonLine colors
- **Characters**: 5 per theme (4 human mentors + 1 AI companion)
- **Terminology**: Theme-specific names for modules/lessons/exercises (e.g., Deep Orbit uses "Mission", "Sector", "Simulation")
- **Career paths** and **coming soon** metadata

## Database Schema (Supabase)

### Tables

- **`profiles`** — Extends `auth.users`. Auto-created via trigger on signup. Fields: display_name, avatar_url, github_username.
- **`theme_progress`** — Per-lesson tracking. Fields: theme_id, module_id, lesson_id, status (not_started/in_progress/completed), score, hints_used, timestamps. Unique constraint on (user_id, theme_id, module_id, lesson_id).
- **`purchases`** — Payment records from Stripe webhooks. Fields: plan_id, theme_ids (text[]), amount, currency, stripe_session_id, status.
- **`waitlist`** — Email capture for coming-soon themes. Public insert policy.

### Row-Level Security

All tables have RLS enabled:
- `profiles`: Users can only read/update their own profile
- `theme_progress`: Users can only CRUD their own progress
- `purchases`: Users can read their own; inserts are server-only (via service role)
- `waitlist`: Anyone can insert (public); only service role can read

### Auto-created Resources

- **Trigger**: `on_auth_user_created` → auto-inserts a `profiles` row
- **Indexes**: On user_id + theme_id for progress queries, email for waitlist lookups

## Hono API (`apps/api`)

Separate backend service running on port 3001. Communicates with Supabase using the service role key for privileged operations.

### Current Routes

- `GET /api/health` — Health check returning `{ status: "ok", service: "tensorcraft-api", timestamp }`

### Planned Route Groups

- `/api/auth/*` — Auth callback handling, session management
- `/api/progress/*` — Theme progress CRUD (authenticated)
- `/api/payments/*` — Stripe webhook receiver, purchase verification

### Middleware

- **CORS**: Allows `localhost:3000` (dev) and `tensorcraft.app` (prod)

## Next.js Frontend (`apps/web`)

### Configuration

- **Turbopack** for development (via `next dev --turbopack`)
- **Transpile** all workspace packages via `next.config.ts`
- **PostCSS** with `@tailwindcss/postcss` for Tailwind 4

### Landing Page (`app/page.tsx`)

Client component with Framer Motion animations:
- Animated grid background + gradient orbs
- Letter-by-letter title reveal with stagger
- FE→ML bridge showcase (6 featured bridges with animated connectors)
- Theme preview cards with neon glow hover effects
- Stats section and CTA with glow effects
- Scroll-triggered animations throughout

### Animation Patterns

- `fadeUp` variant with custom delay per index
- `staggerContainer` for sequential child reveals
- `letterAnimation` for character-by-character text
- `whileInView` for scroll-triggered entries
- `whileHover` for interactive hover states

## Development Workflow

```bash
# Install all dependencies
pnpm install

# Start dev servers (web:3000 + api:3001)
pnpm dev

# Build all packages and apps
pnpm build

# Lint everything
pnpm lint

# Clean build artifacts
pnpm clean
```

Turborepo handles dependency ordering: `packages/*` build first, then `apps/*` consume them.

## FE→ML Bridge System

The core pedagogical innovation. Each ML concept is introduced through a frontend concept:

Bridges are classified into three quality tiers:
- **Identity** — FE concept *is* the ML concept (e.g., ReLU = `Math.max(0,x)`, Tensor = TypedArray)
- **Structural** — Same pattern, different domain (e.g., Overfitting = CSS that only works on your screen)
- **Intuition** — Useful starting point, refined in-lesson (e.g., Loss = Lighthouse score)

| Frontend Concept | ML Concept | Tier |
|-----------------|------------|------|
| `Math.max(0, x)` | ReLU Activation | Identity |
| TypedArray + `.shape` | Tensor | Identity |
| CSS `blur()` + kernel | Convolution | Identity |
| Service Worker + Cache | Model Caching | Identity |
| DOM event bubbling | Backpropagation | Structural |
| Slider UI tuning | Gradient Descent | Structural |
| `Promise.all()` chunks | Batch Processing | Structural |
| CSS that only works on your screen | Overfitting | Structural |
| Flexbox `flex-grow` distribution | Attention / Softmax | Structural |
| CSS `nth-child()` | Positional Encoding | Structural |
| CSS custom property overrides | LoRA Fine-tuning | Structural |
| Lighthouse score | Loss Function | Intuition |

26 shared bridges + 30+ theme-specific bridges across 5 themes. See [product-plan.md](product-plan.md) for the complete catalog.

## Key Architectural Decisions

1. **Hono as separate backend** — Not embedded in Next.js API routes. Allows independent scaling, deployment, and technology evolution.
2. **Supabase from day 1** — Full schema with RLS, not deferred. Ensures auth and data patterns are established early.
3. **CSS-native theming** — No JS runtime cost for theme switching. Tailwind 4's `@theme` directive resolves utilities to CSS custom properties.
4. **Dark + neon aesthetic** — All themes are dark with neon accents. Glow effects use `--tc-glow` token for consistent intensity.
5. **Framer Motion over CSS animations** — Needed for scroll-triggered reveals, layout animations, and gesture-based interactions that CSS alone can't handle cleanly.
6. **Document as we build** — This file is maintained alongside code, updated with each significant architectural change.


---
# FILE: deep-orbit.md
---

# Deep Orbit — Time-Series & Signals

---

## SCRIPT GUIDE

**Tags:** `time-series` `signals` `FFT` `LSTM` `anomaly-detection` `browser-ml`
**Theme:** Deep space signal analysis aboard the research vessel *Archimedes*
**Model being built:** DEEP SCAN — a multi-stage signal classification system
**GitHub repo deployed at end:** `deep-scan-signal-classifier`

### Characters

| Name | Role | Description |
|---|---|---|
| **Commander Adaeze Okafor** | Mentor / Mission Commander | Ship captain. Calm, authoritative, three prior deep-space missions. Sets context — she explains *why* the crew needs each capability but never dives into technical detail. Speaks in clear, deliberate sentences. |
| **Dr. Hana Sato** | Astrophysicist / Concept Explainer | Lead scientist. Puzzle-lover, deeply curious, sometimes lost in abstractions. Uses analogies liberally, lights up when a student grasps a concept. Introduces ML theory via holographic whiteboard diagrams. |
| **Chief Maria Torres** | Ship Engineer / Implementation Lead | Maintains all systems. Pragmatic skeptic — trusts things that work, distrusts "clever." Dry humor, no-nonsense. Handles TensorFlow.js, ONNX, quantization, performance. Backstory: 18 years in fleet engineering, refused two promotions to stay hands-on. On the ISS Vanguard, Torres trusted a rule-based navigation system through an asteroid field. It froze on an edge case — a tumbling fragment with irregular spin. Two crew members didn't make it to the escape pods. She carries that loss as armor against any system that promises more than it can deliver. Warms up once she sees results. |
| **Ensign Joon Park** | Comms Officer / Student Avatar | The player character. Skilled frontend engineer reassigned to the Archimedes to maintain comms. No ML background but strong JS/TS skills. Eager, occasionally overwhelmed, grows in confidence across 11 modules. Asks clarifying questions and makes FE analogies. |
| **ARIA** | Ship AI / Tutorial Guide | Onboard AI. Dry-witted, precise, occasionally sardonic. Voice of the code editor and terminal. Provides tutorials, documentation, hints, and commentary. |

#### Park — Dialogue Evolution

Park's voice changes across the course as his ML fluency grows. His dialogue should reflect this progression:

- **Early (M1–M3):** *"Wait, so training a neural network is basically like running a build step?"* — Analogy-seeking, uncertain. Every ML concept gets filtered through frontend metaphors because that is all he has.
- **Mid (M4–M6):** *"The sliding window approach reminds me of IntersectionObserver — we only process what's in view."* — Making connections independently. The analogies are sharper, more specific, and he volunteers them rather than needing Sato to supply them.
- **Late (M7–M9):** *"We need to check for data leakage in the validation set before we trust these anomaly scores."* — Using ML terminology natively. The frontend analogies drop away. He thinks in the domain now.
- **Capstone (M10–M11):** *"Int8 quantization on the signal processor — the inference budget is too tight for float32 on this band."* — ML practitioner. He no longer needs FE analogies. He speaks Torres's optimization language fluently.

### Career Paths & Salaries

| Path | Description | Avg Salary (US) |
|---|---|---|
| ML Engineer (Time-Series) | Build and deploy temporal models for IoT, finance, health monitoring | $145,000 - $195,000 |
| Signal Processing Engineer | DSP + ML hybrid roles in telecom, audio, defense | $130,000 - $180,000 |
| Data Scientist (Sensor/IoT) | Analyze streaming sensor data, build anomaly pipelines | $125,000 - $170,000 |
| Audio/Speech ML Engineer | Apply signal processing + ML to audio products | $140,000 - $190,000 |
| Edge ML Engineer | Optimize and deploy models to constrained devices | $135,000 - $185,000 |

---

## CONCEPT DISCLAIMER

> **This course teaches machine learning through interactive, narrative-driven lessons designed for frontend developers.**
>
> You will learn real ML — not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
>
> **Fundamentals you will master:**
> - Linear algebra (vectors, matrices, tensors, broadcasting)
> - Calculus (gradients, chain rule, backpropagation)
> - Probability & statistics (distributions, Bayes, likelihood)
> - Optimization (gradient descent, learning rates, convergence)
> - Information theory (entropy, cross-entropy, KL divergence)
>
> **Specialization topics (Deep Orbit):**
> - Signal processing (FFT, STFT, windowing, filtering)
> - Time-series modeling (RNNs, LSTMs, GRUs, temporal convolutions)
> - Anomaly detection (autoencoders, isolation forests, reconstruction error)
> - Sequence forecasting (attention, Kalman filters, DTW)
> - Browser ML runtimes (TensorFlow.js, ONNX Runtime Web, WebGPU)
> - LLM integration (prompt engineering, RAG, multi-model orchestration)
> - Model optimization (quantization, pruning, distillation, caching)

---

## MODULE 1: ML THROUGH SIGNALS (FREE)

*The crew arrives at Kepler-442. Park is introduced to the mission and begins learning ML basics through ship telemetry data.*

---

### LESSON 1.1 — Arrival: What Is ML?

**Format:** Standard | **5C Variation:** Standard

#### CONTEXT

The Archimedes drops out of FTL transit in the Kepler-442 system. Commander Okafor convenes the crew on the bridge. Long-range sensor arrays have detected structured electromagnetic signals that do not match any known natural phenomenon — not pulsars, not magnetars, not stellar noise. The signals are organized into frequency bands and repeat at irregular intervals.

Park is the newest crew member. He was assigned as comms officer based on his frontend engineering background — the ship's communication systems run on a browser-based dashboard built in TypeScript. He has no ML background. Okafor explains the mission: build a signal classification system (DEEP SCAN) that can categorize incoming signals in real time, so Dr. Sato can focus on analysis instead of manual sorting.

> **OKAFOR:** "Every signal is a question the universe is asking. Our job is to build a system that can hear the question clearly — and suggest an answer."

Torres, in the back of the bridge, mutters:

> **TORRES:** "Another frontend dev touching the compute cluster. Wonderful."

ARIA boots up Park's workstation.

> **ARIA:** "Welcome aboard, Ensign. I have prepared your development environment. I see you prefer tabs over spaces. We will need to discuss that."

#### CHALLENGE

Park must understand what machine learning is and how it differs from traditional programming. The lesson establishes the core mental model: in traditional programming, the developer writes rules; in ML, the developer provides data and the system learns the rules.

#### CONCEPT

**Machine learning** is a programming paradigm where instead of writing explicit rules (`if signal > threshold, classify as X`), you provide examples of inputs and desired outputs, and an algorithm learns the mapping between them.

Three components of every ML system:
1. **Data** — the examples the model learns from
2. **Model** — the function that maps inputs to outputs
3. **Objective** — the measure of how well the model is performing

**FE BRIDGE:** Think of it like this. In traditional frontend dev, you write a function: `function classify(signal) { if (signal.amplitude > 50) return 'strong'; ... }`. You encode every rule by hand. In ML, you write a function that *learns* the rules from data: `const model = train(signals, labels)`. The model is like an app that writes its own business logic based on usage patterns.

#### CHECKPOINT

> **ARIA:** "Ensign, let me verify your understanding before we proceed. I would hate for you to build something on a shaky foundation. Well — I would find it entertaining, actually, but Commander Okafor would not."

Quiz:
1. In ML, what replaces hand-written rules? → **Data + training**
2. Name the three components of every ML system → **Data, Model, Objective**
3. True or false: ML models are always more accurate than hand-written rules → **False** — ML models are probabilistic; they excel when rules are too complex to write by hand, but simple rules can outperform models in simple domains.

#### CODE

```typescript
// Traditional programming: hand-written rules
function classifySignal(amplitude: number): string {
  if (amplitude > 80) return 'strong';
  if (amplitude > 40) return 'moderate';
  return 'weak';
}

// ML approach: learn from data
interface TrainingExample {
  amplitude: number;
  label: string;
}

const trainingData: TrainingExample[] = [
  { amplitude: 92, label: 'strong' },
  { amplitude: 67, label: 'moderate' },
  { amplitude: 23, label: 'weak' },
  { amplitude: 85, label: 'strong' },
  { amplitude: 44, label: 'moderate' },
  { amplitude: 11, label: 'weak' },
];

// The model learns the boundaries from data instead of us coding them
// We will build this "train" function over the coming lessons
```

#### HINTS

**Tier 1 — Nudge:**
> "Think about the difference between writing CSS by hand and using a design system that adapts based on usage data."

**Tier 2 — Concept:**
> "In traditional programming, the developer is the one who encodes the knowledge. In ML, the data encodes the knowledge, and the algorithm extracts it. The model is a compressed representation of patterns in the data."

**Tier 3 — Full walkthrough:**
> "Here is the core distinction. Traditional: `humanWritesRules(input) → output`. ML: `algorithmLearnsRules(data) → model`, then `model(input) → output`. The key insight is that the developer's role shifts from writing rules to curating data and choosing architectures."

#### COMMON MISTAKES

1. **Thinking ML replaces all programming** — ML is one tool. Many problems are better solved with explicit rules. Use ML when the rules are too complex, too numerous, or too fluid to write by hand.
2. **Conflating AI and ML** — AI is the broad field; ML is a subset. Deep learning is a subset of ML. This course focuses on ML and deep learning.
3. **Assuming more data always wins** — Data quality matters more than quantity. 1,000 clean, well-labeled examples can outperform 100,000 noisy ones.

#### CONSEQUENCE

Park stares at the telemetry feed scrolling across his monitor. Thousands of signals per minute. Each one a waveform — amplitude, frequency, duration, harmonic content.

> **PARK:** "There's no way I can write rules for all of these. There are too many patterns."

> **SATO:** (smiling) "Now you understand why we need machine learning."

ARIA overlays a visualization: the same signal data, but now color-coded by category. Some clusters are obvious — but between them, ambiguous regions where human rules would fail.

> **ARIA:** "The ship's previous classification system used 847 hand-written rules. It achieved 61% accuracy. I believe we can do better."

The scene ends with Park looking at the signal feed with new eyes. He does not see data anymore. He sees a training set.

---

### LESSON 1.2 — Three Kinds of Learning

**Format:** Discovery | **5C Variation:** Discovery

#### RECALL

> **ARIA:** "Before we proceed — what are the three components of every ML system?"
> Park: "Data, model, objective."
> **ARIA:** "Acceptable. You may continue."

#### CONTEXT

Dr. Sato pulls Park into the science lab. On the holographic display, she shows three different scenarios the crew will face, each requiring a different learning approach:

1. **Labeled signal data** — 5,000 signals that a previous mission already categorized (radiation burst, stellar wind, communication artifact, unknown). This is **supervised learning** — you have inputs and correct answers.

2. **Unlabeled signal data** — 200,000 signals from the long-range array with no categories. The crew needs to find natural groupings. This is **unsupervised learning** — you have inputs but no labels, and the model must discover structure.

3. **Real-time classification decisions** — as DEEP SCAN classifies signals, the crew confirms or corrects. The system improves with feedback. This is **reinforcement learning** — the model takes actions and receives rewards/penalties.

> **SATO:** "Ah, you already know these patterns! Think about how you learn as a developer. Supervised is like following a tutorial — someone shows you the right answer. Unsupervised is like exploring a new codebase — you find the structure yourself. Reinforcement is like debugging in production — you try something, see if it works, and adjust."

**FE BRIDGE:**
- **Supervised** = unit tests. You know the expected output for each input.
- **Unsupervised** = clustering your component library. No predefined categories — you group by similarity.
- **Reinforcement** = A/B testing. Deploy, measure, adjust based on user behavior.

#### CODE

```typescript
// Supervised: we have labels
const supervisedData = [
  { features: [0.8, 120, 0.3], label: 'radiation' },
  { features: [0.2, 340, 0.7], label: 'stellar' },
  { features: [0.5, 210, 0.5], label: 'artifact' },
];
// Goal: learn mapping from features → label

// Unsupervised: no labels
const unsupervisedData = [
  { features: [0.8, 120, 0.3] },
  { features: [0.2, 340, 0.7] },
  { features: [0.5, 210, 0.5] },
];
// Goal: discover clusters / structure

// Reinforcement: action → reward
interface RLStep {
  state: number[];       // current signal features
  action: string;        // classification decision
  reward: number;        // +1 correct, -1 incorrect
}
// Goal: maximize cumulative reward over time
```

#### CONSEQUENCE

> **SATO:** "For DEEP SCAN, we will primarily use supervised learning — we have Dr. Nakamura's labeled dataset from the previous mission. But Module 7 will need unsupervised learning for anomaly detection. And the real-time feedback loop? That is reinforcement thinking."

Park nods. Three paradigms, one system. The architecture is already more complex than he imagined.

> **PARK:** "So DEEP SCAN isn't just one model. It's multiple approaches combined."

> **SATO:** "Welcome to real-world ML, Ensign."

---

### LESSON 1.3 — Neural Networks

**Format:** Broken Code First | **5C Variation:** Broken Code First

Park arrives at his workstation to find ARIA has pre-loaded a broken neural network implementation. The code has intentional errors. Park must understand neural networks by fixing them.

#### RECALL

> **ARIA:** "Quick check, Ensign. Name one scenario where unsupervised learning is more appropriate than supervised."
> Park: "When you have data but no labels — like our unlabeled signal archive."
> **ARIA:** "Correct. Now let us break something."

#### CONTEXT

Dr. Sato introduces neural networks using the holographic whiteboard. She draws a diagram: layers of connected nodes, each receiving inputs, applying weights and biases, and passing results through an activation function.

> **SATO:** "Think of a neural network as a series of transformations. Each layer takes the data, warps it slightly, and passes it on. By the time data has passed through all the layers, it has been transformed from raw input into a useful representation."

#### CONCEPT

A **neural network** is a function composed of layers. Each layer applies a linear transformation (multiply by weights, add bias) followed by a non-linear activation function.

**Neuron:** `output = activation(input * weight + bias)`
**Layer:** Apply the neuron function to every input (or a subset)
**Network:** Stack multiple layers end to end

**FE BRIDGES:**

| Neural Network Concept | Frontend Equivalent |
|---|---|
| Layer applies function to all inputs | `Array.map()` — apply a transform to every element |
| Weights are tunable parameters | CSS custom properties (`--var`) — configurable values that change behavior |
| Activation function clips/transforms output | `Math.max(0, x)` — ReLU is literally this function |
| Training adjusts weights to reduce error | `npm run build` — iterative process that optimizes output |
| Inference runs data through trained network | `fetch()` — send input, get processed output |

> **PARK:** "Wait — so a neural network layer is basically `Array.map(x => activation(x * weight + bias))`? I have used `.map()` a thousand times."

> **SATO:** (beaming) "Now you are thinking like a network."

#### CODE

ARIA presents the broken code. Park must fix three bugs:

```typescript
// BROKEN CODE — 3 bugs to find and fix

class Neuron {
  weight: number;
  bias: number;

  constructor() {
    // Bug 1: weights should be random, not zero
    // Zero weights mean every neuron learns the same thing
    this.weight = 0;     // FIX: Math.random() * 2 - 1
    this.bias = 0;
  }

  // Bug 2: no activation function — output is purely linear
  // Stacking linear layers is equivalent to a single linear layer
  forward(input: number): number {
    return input * this.weight + this.bias;
    // FIX: return Math.max(0, input * this.weight + this.bias)  // ReLU
  }
}

class Layer {
  neurons: Neuron[];

  constructor(size: number) {
    this.neurons = Array.from({ length: size }, () => new Neuron());
  }

  forward(inputs: number[]): number[] {
    // Bug 3: should use all inputs per neuron, not one-to-one
    return this.neurons.map((n, i) => n.forward(inputs[i]));
    // FIX: each neuron should receive ALL inputs, not just one
    // return this.neurons.map(n =>
    //   inputs.reduce((sum, inp, i) => sum + n.weights[i] * inp, n.bias)
    // );
  }
}
```

#### COMMON MISTAKES

1. **Initializing all weights to zero** — the symmetry problem. All neurons learn the same function. Random initialization breaks symmetry.
2. **Forgetting activation functions** — without non-linearity, a 100-layer network is mathematically equivalent to a single-layer network.
3. **Confusing layers with neurons** — a layer contains multiple neurons. A network contains multiple layers. The hierarchy matters.

#### CONSEQUENCE

Park fixes all three bugs. ARIA runs the corrected network on a small subset of signal data.

> **ARIA:** "Three bugs, Ensign. You found them all. The corrected network achieves 72% accuracy on the test signal batch. Not impressive by any measure, but functional."

> **PARK:** "72% is better than the ship's old rule-based system at 61%."

> **ARIA:** "A low bar, but technically correct. We will improve it."

Torres passes by the lab, glances at the screen.

> **TORRES:** "72%? Wake me when it is above 90."

---

### LESSON 1.4 — Tensors + Model Zoo

**Format:** Standard | **5C Variation:** Standard

#### CONTEXT

Dr. Sato explains that real signal data is not a flat array of numbers — it has structure. A single signal reading might have amplitude, frequency, phase, and duration. A batch of signals adds another dimension. A time sequence of batches adds yet another. This multi-dimensional structure is called a **tensor**.

> **SATO:** "You have worked with arrays, yes? And arrays of arrays? A tensor is the generalization. A 0D tensor is a scalar. 1D is a vector. 2D is a matrix. 3D, 4D — those are the shapes of real-world data."

#### CONCEPT

**Tensors** are multi-dimensional arrays — the fundamental data structure of ML.

| Rank | Shape Example | Name | Data Example |
|---|---|---|---|
| 0 | `[]` | Scalar | Single amplitude reading: `42.7` |
| 1 | `[5]` | Vector | One signal: `[amp, freq, phase, dur, snr]` |
| 2 | `[100, 5]` | Matrix | 100 signals, 5 features each |
| 3 | `[32, 100, 5]` | 3D Tensor | 32 batches of 100 signals |
| 4 | `[32, 10, 100, 5]` | 4D Tensor | 32 batches, 10 time steps, 100 signals, 5 features |

**Broadcasting:** When tensors of different shapes interact, the smaller tensor is "broadcast" to match the larger one. Scalar `+ [1, 2, 3]` becomes `[scalar, scalar, scalar] + [1, 2, 3]`.

**FE BRIDGES:**

| Tensor Concept | Frontend Equivalent |
|---|---|
| Tensor | `TypedArray` (e.g., `Float32Array`) — fixed-type, fixed-size, GPU-friendly |
| Broadcasting | `flex-grow` — a single value expands to fill available space |
| Hugging Face Model Hub | npm registry — a package manager for pre-trained models |

> **SATO:** "Hugging Face is like npm for ML models. You can browse, download, and use pre-trained models the same way you install packages."

#### CODE

```typescript
import * as tf from '@tensorflow/tfjs';

// Scalar (rank 0)
const amplitude = tf.scalar(42.7);
console.log(amplitude.shape);  // []

// Vector (rank 1) — one signal
const signal = tf.tensor1d([0.8, 120, 0.3, 2.1, 0.95]);
console.log(signal.shape);  // [5]

// Matrix (rank 2) — batch of signals
const batch = tf.tensor2d([
  [0.8, 120, 0.3, 2.1, 0.95],
  [0.2, 340, 0.7, 1.4, 0.82],
  [0.5, 210, 0.5, 3.0, 0.91],
]);
console.log(batch.shape);  // [3, 5]

// Broadcasting example
const normalized = batch.div(batch.max());  // scalar broadcasts across matrix
console.log(normalized.shape);  // [3, 5]

// Loading a pre-trained model from Hugging Face / TF Hub
// Like `npm install` for ML models
const modelUrl = 'https://tfhub.dev/google/universal-sentence-encoder/4';
// const model = await tf.loadGraphModel(modelUrl);
```

#### CONSEQUENCE

Park explores the Hugging Face Model Zoo and TF Hub. He finds pre-trained signal classifiers, audio models, and general-purpose architectures.

> **PARK:** "This is like browsing npm. There are models for everything."

> **SATO:** "And like npm, you should not blindly install things. Understand the architecture, check the training data, verify the license. A model is only as trustworthy as its provenance."

> **ARIA:** "I have indexed 47 potentially relevant pre-trained models. Shall I rank them by relevance to our signal classification task?"

---

### LESSON 1.5 — First Browser ML

**Format:** Flashback | **5C Variation:** Standard (with debrief elements)

The lesson opens with a flashback: before Park boarded the Archimedes, he built a simple demo at a web conference — a browser-based ML classifier using TensorFlow.js. That experience is why he was assigned to this mission.

#### RECALL

> **ARIA:** "Before we deploy to the browser, Ensign — what is the shape of a 2D tensor representing 50 signals with 8 features each?"
> Park: "`[50, 8]`"
> **ARIA:** "Correct. Proceed."

#### CONTEXT

Torres walks Park through deploying their Module 1 neural network to the ship's browser-based dashboard. This is the first time DEEP SCAN runs in the browser.

> **TORRES:** "The bridge crew uses a web dashboard. If DEEP SCAN cannot run in the browser, it does not exist to them. No Python notebooks, no server dependencies. The model runs client-side or it does not run."

Park loads the trained model into TensorFlow.js. He builds a minimal inference pipeline: ingest signal data from the telemetry WebSocket, convert to tensor, run prediction, render classification result.

#### CODE

```typescript
import * as tf from '@tensorflow/tfjs';

// Load the trained model (exported from training pipeline)
const model = await tf.loadLayersModel('/models/deep-scan-v1/model.json');

// Simulate incoming signal data (in production, this comes from WebSocket)
const rawSignal = new Float32Array([0.72, 185, 0.45, 1.8, 0.88, 0.31, 44, 0.62]);

// Convert to tensor — shape [1, 8] (batch of 1, 8 features)
const inputTensor = tf.tensor2d(rawSignal, [1, 8]);

// Run inference
const prediction = model.predict(inputTensor) as tf.Tensor;
const probabilities = await prediction.data();
const classIndex = prediction.argMax(-1).dataSync()[0];

const labels = ['radiation', 'stellar', 'artifact', 'unknown'];
console.log(`Classification: ${labels[classIndex]}`);
console.log(`Confidence: ${(probabilities[classIndex] * 100).toFixed(1)}%`);

// Clean up tensors to prevent memory leaks
inputTensor.dispose();
prediction.dispose();

// Connect to ship telemetry stream
const ws = new WebSocket('ws://archimedes.local:8080/telemetry');
ws.onmessage = async (event) => {
  const signalData = JSON.parse(event.data);
  const tensor = tf.tensor2d(signalData.features, [1, 8]);
  const result = model.predict(tensor) as tf.Tensor;
  const idx = result.argMax(-1).dataSync()[0];

  renderClassification(labels[idx], signalData.timestamp);

  tensor.dispose();
  result.dispose();
};
```

#### CONSEQUENCE

Park deploys DEEP SCAN v0.1 to the bridge dashboard. The crew watches as signals are classified in real time. The first results:

- **67%** classified as radiation bursts (expected — normal background)
- **18%** classified as stellar wind patterns
- **12%** classified as communication artifacts (probably echoes from the Archimedes itself)
- **3%** classified as unknown

That 3% catches Sato's attention.

> **SATO:** "Three percent unknown. That is what we came here for."

> **OKAFOR:** "How confident is the model on those unknowns?"

> **ARIA:** "Confidence ranges from 34% to 51%. The model is uncertain. It has never seen signals like these in its training data."

> **OKAFOR:** "Then we need a better model. Park, Sato — get to work."

> **TORRES:** (examining the dashboard) "Inference time is 23 milliseconds per signal. Acceptable, for now."

#### DEBRIEF

Module 1 complete. Park has learned:
- What ML is and how it differs from traditional programming
- The three paradigms: supervised, unsupervised, reinforcement
- Neural network fundamentals: neurons, layers, weights, biases, activations
- Tensors: the data structure of ML
- Browser inference with TensorFlow.js

DEEP SCAN v0.1 is live. It is basic, but it works. The 3% unknown signals are the thread that will pull the crew through the remaining 10 modules.

#### GITHUB

**Commit:** `feat(m1): initial DEEP SCAN classifier — browser inference pipeline`
**Branch:** `module-01/ml-through-signals`
**Files:**
- `src/model/neuron.ts`
- `src/model/layer.ts`
- `src/model/network.ts`
- `src/inference/browser-pipeline.ts`
- `src/telemetry/signal-types.ts`
- `public/models/deep-scan-v1/model.json`
- `tests/model/neuron.test.ts`

#### ANIMATION

End-of-module animation: a spectrogram visualization fills the screen. Signal waveforms scroll from right to left. Most are colored blue (radiation) or green (stellar). A few pulse gold — the unknowns. The DEEP SCAN logo fades in: a stylized waveform inside a scanning reticle. Text appears: **"Module 1 Complete — DEEP SCAN v0.1 Online"**

**Cliffhanger:** As the crew celebrates their first successful classification, ARIA flags an anomaly: a faint signal that matches no known stellar pattern.

---

## MODULE 2: DATA & PREPROCESSING

*Cleaning and preparing sensor data for model consumption.*

### Narrative

The first batch of raw sensor data arrives from the long-range arrays — and it is a mess. Missing values where sensors dropped out. Noise spikes from the ship's own engines. Outliers that might be real anomalies or might be sensor errors. Park discovers that real-world data is nothing like the clean datasets in tutorials.

> **SATO:** "Welcome to the reality of data science, Ensign. 80% of the work is cleaning data. The remaining 20% is complaining about cleaning data."

> **TORRES:** "If I cannot rebuild it from source, it does not exist. Every transform must be logged, versioned, and reproducible."

**Unique content:** Park builds a full preprocessing pipeline for signal data — handling missing values via interpolation, removing engine noise through band-pass filtering, normalizing amplitude ranges, engineering time-domain features (zero-crossing rate, RMS energy, spectral centroid), and splitting data with stratification to preserve the rare "unknown" class.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Raw Data Reality | Missing values, noise, outliers in sensor feeds | Form validation and sanitization |
| 2 | Normalization | Scaling features to consistent ranges | CSS `normalize.css` / reset stylesheets |
| 3 | Feature Engineering | Creating meaningful features from raw signals | Data transformation before rendering |
| 4 | Train/Val/Test Splits | Partitioning data responsibly | Environment configs (dev/staging/prod) |
| 5 | Data Pipelines | Reproducible preprocessing workflows | Build pipelines (Webpack/Vite config) |

**FE BRIDGE (Module-Level):** A Web Audio API node graph is the perfect analogy for a data preprocessing pipeline. Each `AudioNode` transforms the signal — gain, filter, analyser — just like Express middleware transforms a request. Data flows through a chain of transforms, each one modifying the signal before passing it to the next node.

**Inter-Lesson Hook:** Park's preprocessing pipeline works — until Torres feeds it raw data from an uncharted frequency band.

### GITHUB

**Commit:** `feat(m2): data preprocessing pipeline with normalization and feature engineering`
**Branch:** `module-02/data-preprocessing`
**Files:**
- `src/data/preprocessing.ts`
- `src/data/normalization.ts`
- `src/data/feature-engineering.ts`
- `src/data/split.ts`
- `src/data/pipeline.ts`
- `tests/data/preprocessing.test.ts`

**Cliffhanger:** During preprocessing, Sato notices a recurring amplitude spike buried in the noise floor — it appears exactly every 73.4 seconds. "That periodicity... that is not instrument error."

---

## MODULE 3: NEURAL NETWORKS DEEP DIVE

*Building the core signal classifier architecture with multi-layer networks.*

### Narrative

Park builds the first real DEEP SCAN classifier — a feedforward neural network with multiple hidden layers. Sato explains backpropagation using the ship's navigation correction system as an analogy: "When the ship drifts off course, the nav system measures the error, calculates how to adjust, and fires the thrusters in the right direction. Backpropagation does the same thing — it measures the error, calculates how each weight contributed to it, and adjusts accordingly."

The model reaches 78% accuracy. Okafor says: "Good enough to trust? Not yet. Keep going."

**Unique content:** Park implements 1D convolutions for signal pattern detection — applying convolutional kernels across time-series data rather than images. This is the "1D CNN" approach that excels at finding local patterns in sequential data, like detecting a specific waveform shape regardless of where it appears in the signal.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Network Architecture | Layers, widths, depths — designing a network | Component hierarchy in React |
| 2 | Loss Functions | Measuring how wrong the model is | Unit test assertions (`expect().toBe()`) |
| 3 | Backpropagation | How the network learns from errors | Hot module replacement feedback loop |
| 4 | Training Loop | Epochs, batches, convergence | `npm run build` — iterative compilation |
| 5 | Evaluation Metrics | Accuracy, precision, recall, F1 | Lighthouse performance scores |

**FE BRIDGE (Module-Level):** CSS animation keyframes are decomposition — breaking complex motion into discrete steps at specific percentages. A training loop does the same: at each epoch, the model evaluates its position, computes the error, and adjusts. The `@keyframes` analogy extends further — `ease-in-out` is like a learning rate schedule that starts slow, accelerates, then decelerates.

**Inter-Lesson Hook:** The network trains successfully, but ARIA notices the loss curve has an unusual plateau at epoch 47.

### Shared Core

This module covers foundational concepts shared across all themes: network architecture design, loss functions (MSE, cross-entropy), backpropagation algorithm, training loops (epochs, batches, learning rate), and evaluation metrics (accuracy, precision, recall, F1-score, confusion matrices).

### GITHUB

**Commit:** `feat(m3): multi-layer neural network with 1D convolutions for signal classification`
**Branch:** `module-03/neural-networks`
**Files:**
- `src/model/feedforward.ts`
- `src/model/conv1d.ts`
- `src/model/loss.ts`
- `src/model/backprop.ts`
- `src/training/loop.ts`
- `src/training/metrics.ts`
- `tests/model/feedforward.test.ts`

**Cliffhanger:** The neural network classifies the signal with 94% confidence — but ARIA discovers the signal's origin point is moving.

---

## MODULE 4: BROWSER ML RUNTIMES

*Running ML models in the browser with TensorFlow.js and ONNX Runtime.*

### Narrative

Torres takes the lead. She challenges Park to get the classifier running on the ship's browser-based dashboard with real performance requirements.

> **TORRES:** "The bridge crew needs this in their UI, not a Python notebook. Your model is 400 MB. The browser tab will crash before the first inference. We are fixing this."

Park discovers the joy and pain of browser ML — the freedom of client-side inference versus the constraints of browser memory, single-threaded JavaScript, and the cold-start problem of loading large models.

**Unique content:** Park compares TensorFlow.js, ONNX Runtime Web, and raw WebAssembly runtimes. Each has tradeoffs: TF.js has the best ecosystem, ONNX has the best interop with Python-trained models, and WASM offers the most control. Torres makes Park benchmark all three.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Why the Browser? | Advantages of client-side inference | Client-side rendering vs SSR tradeoffs |
| 2 | TensorFlow.js Setup | Loading and configuring TF.js | Adding a dependency with `npm install` |
| 3 | Model Loading | Fetching and initializing a pre-trained model | `fetch()` → `response.json()` pattern |
| 4 | Inference Pipeline | Running predictions in real time | Event handler → process → render cycle |
| 5 | ONNX Runtime Web | Alternative runtime, model interop | Polyfills and cross-browser compat |

**FE BRIDGE (Module-Level):** Browser ML runtimes are like frontend frameworks — React vs Vue vs Svelte. Each provides the same core capability (rendering UI / running inference) with different APIs, different performance profiles, and different ecosystems. TF.js is React (largest ecosystem, most resources). ONNX is Vue (pragmatic, great interop). Raw WASM is Svelte (most control, least abstraction).

**Inter-Lesson Hook:** The browser runtime handles real-time inference — then three signals arrive simultaneously.

### GITHUB

**Commit:** `feat(m4): browser runtime comparison — TF.js, ONNX, WASM benchmarks`
**Branch:** `module-04/browser-runtimes`
**Files:**
- `src/runtime/tfjs-adapter.ts`
- `src/runtime/onnx-adapter.ts`
- `src/runtime/wasm-adapter.ts`
- `src/runtime/benchmark.ts`
- `src/runtime/model-loader.ts`
- `tests/runtime/benchmark.test.ts`

**Cliffhanger:** DEEP SCAN, now running in the browser dashboard, misclassifies cosmic background noise as a signal pattern. Torres: "If it cannot tell noise from data, it is useless. Fix it."

---

## MODULE 5: SIGNAL PROCESSING

*Frequency-domain analysis for deeper signal understanding.*

### Narrative

Dr. Sato discovers hidden sub-bands in the signals. "There is structure here we are missing in the time domain." She introduces Park to signal processing: the Fourier Transform, spectrograms, and the idea that every signal has two representations — time and frequency.

> **SATO:** "Think of a chord on a piano. The FFT tells you which individual notes make up that chord. We need to decompose these signals the same way."

Park builds a spectrogram visualizer and feeds FFT features into the classifier. Accuracy jumps from 78% to 87%.

**Unique content:** Park implements FFT (Fast Fourier Transform), STFT (Short-Time Fourier Transform), windowing functions (Hamming, Hanning, Blackman), and digital filtering (low-pass, high-pass, band-pass). He learns that windowing prevents spectral leakage, and that the choice of window function is a tradeoff between frequency resolution and spectral leakage — just like responsive design is a tradeoff between fidelity and performance.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Time vs Frequency | Two views of the same signal | DOM vs CSSOM — two views of the page |
| 2 | Fourier Transform | Decomposing signals into frequencies | CSS animation decomposition (`@keyframes`) |
| 3 | Spectrograms | Visualizing frequency over time | DevTools waterfall / performance timeline |
| 4 | FFT as Features | Using frequency bins as model input | Computing derived state for components |
| 5 | Windowing & Overlap | Handling signal chunks | Virtual scrolling / windowed rendering |

**FE BRIDGES (Module-Level):**
- **CSS animation decomposition:** A `@keyframes` rule decomposes motion into discrete steps. FFT decomposes a waveform into discrete frequency components. Both take something continuous and express it as a sum of simpler parts.
- **DevTools waterfall:** The Chrome DevTools performance waterfall shows events distributed across time — exactly what a spectrogram shows for frequency content. Time on the x-axis, frequency (or event type) on the y-axis, intensity as color.

**Inter-Lesson Hook:** The FFT decomposition reveals the expected stellar harmonics... plus one frequency that shouldn't be there.

### Shared Core

Covers signal processing fundamentals shared with audio/signal themes: sampling theorem, Nyquist frequency, aliasing, spectral analysis, filter design.

### GITHUB

**Commit:** `feat(m5): FFT pipeline with spectrogram visualization and frequency-domain features`
**Branch:** `module-05/signal-processing`
**Files:**
- `src/signal/fft.ts`
- `src/signal/stft.ts`
- `src/signal/windowing.ts`
- `src/signal/filters.ts`
- `src/visualization/spectrogram.ts`
- `tests/signal/fft.test.ts`

**Cliffhanger:** The frequency analysis reveals a pattern too regular to be natural. Dr. Sato whispers: "That's not noise. That's structure."

---

## MODULE 6: RECURRENT NETWORKS

*Modeling sequences and temporal dependencies in signal data.*

### Narrative

Signals start showing temporal patterns — a rhythm. Sato is excited:

> **SATO:** "This is not random noise. Something is repeating. The pattern spans dozens of time steps — our feedforward network only sees one snapshot at a time. We need a model with memory."

Park builds an LSTM (Long Short-Term Memory) network to predict the next signal values. The predictions are eerily accurate.

**Unique content:** Park implements three recurrent architectures — vanilla RNNs, LSTMs, and GRUs (Gated Recurrent Units). He learns the vanishing gradient problem firsthand when his simple RNN fails on long sequences, motivating the LSTM's gate mechanism. GRUs are introduced as the "lighter" alternative — fewer parameters, often comparable performance.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Sequences Matter | Why order matters in signal data | Array order in rendering lists (React keys) |
| 2 | Simple RNNs | Recurrent connections and hidden state | `useReducer` — state depending on previous state |
| 3 | LSTM Gates | Long Short-Term Memory architecture | `localStorage` with TTL — selective persistence |
| 4 | Sliding Windows | Preparing sequential input batches | `IntersectionObserver` viewport sliding |
| 5 | Sequence Prediction | Predicting next signal values | Autocomplete / typeahead suggestions |

**FE BRIDGES (Module-Level):**
- **Redux state management:** A Redux reducer is a recurrent function — it takes previous state and a new action, and produces updated state. RNNs do exactly this: `newState = f(prevState, newInput)`. The hidden state of an RNN is the Redux store.
- **localStorage with TTL:** LSTMs have a forget gate that decides what to keep and what to discard — like a cache with time-to-live. Some memories are worth keeping (long-term patterns); others should expire (short-term noise).

**Inter-Lesson Hook:** The LSTM remembers the anomalous pattern from 72 hours ago. It's happening again.

### Shared Core

Covers sequence modeling fundamentals shared across themes: vanishing/exploding gradients, gate mechanisms (forget, input, output), bidirectional RNNs, sequence-to-sequence architectures.

### GITHUB

**Commit:** `feat(m6): LSTM/GRU temporal models for sequence prediction`
**Branch:** `module-06/recurrent-networks`
**Files:**
- `src/model/rnn.ts`
- `src/model/lstm.ts`
- `src/model/gru.ts`
- `src/data/sliding-window.ts`
- `src/prediction/sequence.ts`
- `tests/model/lstm.test.ts`

**Cliffhanger:** The LSTM predicts the anomalous signal will repeat in exactly 47 minutes. The crew waits in silence. At 47 minutes and 3 seconds — it arrives.

---

## MODULE 7: ANOMALY DETECTION

*Finding the signal that does not belong.*

### Narrative

The midpoint twist. DEEP SCAN's anomaly detector fires on a signal that does not match any known category. The reconstruction error is off the charts.

> **TORRES:** "Either our model is broken, or..."
> **SATO:** (finishing the sentence) "...or we found something new."

Okafor convenes the crew. The unknown signal has a structure that is unlike anything in the training data — it is too regular to be natural but does not match any known artificial pattern.

**Unique content:** Park builds an autoencoder — a neural network that learns to compress and reconstruct "normal" signals. When a new signal has high reconstruction error, it is flagged as anomalous. Park also implements an isolation forest as a complementary approach — instead of modeling normality, it directly isolates outliers by randomly partitioning the feature space.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Normal vs Anomalous | Defining what "normal" looks like | Baseline performance metrics |
| 2 | Autoencoders | Learning to compress and reconstruct | `gzip` compression — lossy reconstruction |
| 3 | Reconstruction Error | Measuring deviation from normal | `git diff` — what changed from the baseline? |
| 4 | Threshold Tuning | Setting sensitivity for alerts | Alert thresholds in monitoring dashboards |
| 5 | The Anomaly | DEEP SCAN flags an unclassifiable signal | Error boundary catching an unexpected throw |

**FE BRIDGE (Module-Level):** `git diff` is the perfect analogy for reconstruction error. An autoencoder learns to encode and decode "normal" data. When it encounters something anomalous, the decode (reconstruction) does not match the original — just like `git diff` shows you what changed from the expected baseline. Large diffs = large reconstruction error = anomaly.

### Shared Core

Covers anomaly detection fundamentals shared across themes: autoencoders (vanilla, variational), isolation forests, one-class SVM, reconstruction error thresholding, precision-recall tradeoffs for anomaly systems.

### GITHUB

**Commit:** `feat(m7): autoencoder + isolation forest anomaly detection pipeline`
**Branch:** `module-07/anomaly-detection`
**Files:**
- `src/model/autoencoder.ts`
- `src/model/isolation-forest.ts`
- `src/anomaly/detector.ts`
- `src/anomaly/threshold.ts`
- `src/visualization/reconstruction.ts`
- `tests/anomaly/detector.test.ts`

**Cliffhanger:** The mathematical structure embedded in the anomaly mirrors the Fibonacci sequence — the same sequence used in the Archimedes' own sensor calibration algorithm. Sato's hands are shaking. "It's not just structured. It's structured like *us*."

---

## MODULE 8: ADVANCED TIME-SERIES

*Forecasting and advanced temporal modeling.*

### Narrative

The crew attempts to predict the anomalous signal's next occurrence. Park builds increasingly sophisticated forecasting models. When the signal repeats exactly when predicted — the crew confirms it is structured, not random.

> **SATO:** "If we can predict it, it has structure. If it has structure, it is not noise. And if it is not noise..."

> **OKAFOR:** "Then someone — or something — is sending it."

**Unique content:** Park implements Temporal Convolutional Networks (TCNs) as an alternative to LSTMs — faster to train, parallelizable, and often more accurate for long-range dependencies. He builds a Kalman filter for state estimation under noise, and implements Dynamic Time Warping (DTW) to compare signal patterns that may be stretched or compressed in time.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Beyond LSTM | Attention mechanisms for sequences | CSS `:focus` — context-aware highlighting |
| 2 | Temporal Attention | Attending to relevant time steps | `scrollIntoView()` — focusing on what matters |
| 3 | Forecasting | Predicting future signal behavior | Predictive prefetching (`<link rel="prefetch">`) |
| 4 | Kalman Filters | State estimation under noise | Exponential moving average in analytics |
| 5 | Ensemble Methods | Combining multiple models | Micro-frontends — multiple apps, one view |

**FE BRIDGES (Module-Level):**
- **CSS `:focus`:** Attention mechanisms in neural networks work like CSS `:focus` — they dynamically highlight the most relevant elements based on context. When you tab through a form, `:focus` moves to the active element. When a temporal attention model processes a sequence, it assigns "focus" to the most relevant time steps.
- **Exponential moving average:** Kalman filters maintain a running estimate of the true state, smoothing out noise. This is exactly what an exponential moving average does in analytics — `smoothed = alpha * newValue + (1 - alpha) * smoothed`. Both are recursive estimators that balance responsiveness against stability.

### Shared Core

Covers advanced temporal modeling shared across themes: attention mechanisms, multi-head attention, temporal convolutions, state-space models, ensemble techniques (bagging, boosting, stacking).

### GITHUB

**Commit:** `feat(m8): TCN + Kalman filter + DTW for advanced time-series forecasting`
**Branch:** `module-08/advanced-time-series`
**Files:**
- `src/model/tcn.ts`
- `src/model/attention.ts`
- `src/forecast/kalman.ts`
- `src/forecast/dtw.ts`
- `src/forecast/ensemble.ts`
- `tests/forecast/kalman.test.ts`

**Cliffhanger:** The time-series model predicts the signal will repeat at a specific time. It does not. The crew learns about non-stationary data — and realizes the signal's timing is *changing*.

---

## MODULE 9: LLM INTEGRATION

*Adding language model capabilities to DEEP SCAN.*

### Narrative

Okafor needs to transmit findings to Earth Command. The report must be precise, structured, and grounded in the data. Sato suggests using an LLM to help generate and verify scientific reports from DEEP SCAN's data — not to replace human analysis, but to accelerate it.

> **SATO:** "We have 47 days of signal data, 12,000 classified signals, and one anomaly that could change everything. I cannot write a comprehensive report in the 6 hours before the next transmission window. But I can guide a language model to draft one."

Park integrates LLM capabilities into DEEP SCAN: prompt engineering for signal analysis queries, RAG (Retrieval-Augmented Generation) over the signal log database, and a multi-model pipeline that combines the signal classifier with a language model for natural language querying.

**Unique content:** Park builds a RAG pipeline that indexes classified signals, allowing the crew to ask natural language questions like "Show me all anomalous signals in Band-7 from the last 72 hours with confidence below 60%." The LLM retrieves relevant signals, synthesizes a response, and cites its sources.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | LLMs for Science | Using language models as reasoning tools | AI-assisted code completion (Copilot) |
| 2 | Prompt Engineering | Crafting effective prompts for analysis | Writing effective search queries |
| 3 | RAG for Signals | Retrieval-augmented generation over signal logs | Server Components with DB queries |
| 4 | Report Generation | Auto-generating scientific reports | Template rendering engines |
| 5 | Multi-Model Systems | Orchestrating signal + language models | Micro-service orchestration in the frontend |

### Shared Core

Covers LLM integration fundamentals shared across themes: tokenization, embedding, prompt design, RAG architecture, multi-model orchestration, hallucination mitigation, output validation.

### GITHUB

**Commit:** `feat(m9): LLM integration with RAG pipeline for signal analysis and reporting`
**Branch:** `module-09/llm-integration`
**Files:**
- `src/llm/prompt-templates.ts`
- `src/llm/rag-pipeline.ts`
- `src/llm/report-generator.ts`
- `src/llm/multi-model.ts`
- `src/data/signal-index.ts`
- `tests/llm/rag-pipeline.test.ts`

**Cliffhanger:** ARIA generates a response using the signal's own encoding pattern. The ship falls silent, waiting.

---

## MODULE 10: OPTIMIZATION & EDGE

*Making DEEP SCAN production-ready for constrained environments.*

### Narrative

Torres's module. She has been waiting for this.

> **TORRES:** "Your model works. Now make it fast. The bridge dashboard has 512 MB of RAM. Your model alone is 340 MB. Do the math."

Park learns to quantize (reduce numerical precision from 32-bit to 8-bit), prune (remove weights that contribute little to accuracy), and distill (train a small model to mimic a large one). The model shrinks from 340 MB to 42 MB with only 2% accuracy loss.

The optimization work is no longer academic. Remaining fuel reserves limit compute time — the ship's reactor powers both the engines and the compute cluster, and every unnecessary training epoch is fuel the crew needs to get home. Okafor has posted the fuel gauge on the bridge dashboard next to the DEEP SCAN metrics. The two numbers move in opposite directions.

> **TORRES:** (grudgingly) "Not bad, for a frontend dev."

**Unique content:** Park implements post-training quantization (PTQ) and quantization-aware training (QAT). He builds a pruning pipeline that removes 60% of weights while maintaining 94% of accuracy. He distills the full DEEP SCAN model into a lightweight "student" model that runs inference in under 5ms.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Model Profiling | Measuring inference speed and memory | Chrome DevTools Performance tab |
| 2 | Quantization | Reducing model precision for speed | Image compression (PNG to WebP) |
| 3 | Pruning | Removing unnecessary weights | Tree-shaking unused code |
| 4 | Caching Strategies | Storing results for repeated queries | Service Worker caching strategies |
| 5 | WebGPU Acceleration | Using GPU compute in the browser | `<canvas>` WebGL rendering pipeline |

### Shared Core

Covers optimization fundamentals shared across themes: profiling, quantization (PTQ, QAT), pruning (structured, unstructured), knowledge distillation, caching (memoization, LRU), hardware acceleration (WebGPU, WebGL, WASM SIMD).

### GITHUB

**Commit:** `feat(m10): quantization + pruning + distillation — 340MB to 42MB`
**Branch:** `module-10/optimization`
**Files:**
- `src/optimization/quantize.ts`
- `src/optimization/prune.ts`
- `src/optimization/distill.ts`
- `src/optimization/profiler.ts`
- `src/runtime/webgpu-backend.ts`
- `tests/optimization/quantize.test.ts`

**Cliffhanger:** Fuel reserves hit critical. Okafor gives the order: "We have 72 hours to decode this signal or we turn for home."

---

## MODULE 11: CAPSTONE — DEPLOY DEEP SCAN

*Full deployment of the completed signal classification system.*

### Narrative

Park deploys the final DEEP SCAN system. Everything the crew has built across 10 modules comes together: the preprocessing pipeline, the neural network classifier, the FFT feature extractor, the LSTM sequence predictor, the autoencoder anomaly detector, the attention-based forecaster, the LLM reporting system, and the optimized runtime. All deployed to a static site on GitHub Pages.

DEEP SCAN classifies the anomalous signal definitively. The crew stares at the output in silence.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | System Architecture | Designing the full deployment | Production architecture diagram |
| 2 | CI/CD Pipeline | Automated testing and deployment | GitHub Actions workflow |
| 3 | Monitoring | Tracking model performance in production | Application monitoring (Sentry, DataDog) |
| 4 | Documentation | Documenting the system for the crew | README, API docs, JSDoc |
| 5 | Launch | Deploying DEEP SCAN to GitHub Pages | `npm run deploy` — the final ship |

### CONSEQUENCE

The final classification result appears on every screen on the bridge. The anomalous signal contains a mathematical structure that mirrors the Fibonacci sequence — the same recursive ratio used in the Archimedes' own sensor calibration algorithm. Not a coincidence of mathematics. A reflection. Whatever sent this signal used a pattern that only makes sense if the source has been observing the ship's transmissions.

> **OKAFOR:** "What am I looking at, Dr. Sato?"

> **SATO:** "Fibonacci ratios. 1, 1, 2, 3, 5, 8, 13... encoded as pulse-interval proportions. But that is not the unsettling part." She pulls up the Archimedes' own calibration spec. "These ratios match our sensor calibration harmonics exactly — the same coefficients, the same convergence pattern. This signal was not just sent. It was composed *for us*."

Silence on the bridge. Torres is the first to speak.

> **TORRES:** "Could it be echo? Our own calibration signal bouncing off something?"

> **ARIA:** "Negative, Chief. I have modeled every reflection scenario. The signal originates 4.2 light-years from our position and has been repeating for a minimum of 340 years — long before the Archimedes was built. The calibration pattern match implies the source has been observing our transmissions since we entered the system and adapted its signal accordingly."

> **SATO:** "Or — the Fibonacci structure is a natural phenomenon and the calibration match is coincidence. Phyllotaxis, shell spirals, branching patterns — Fibonacci appears in nature constantly."

> **PARK:** "So which is it? Are we being watched, or are we seeing patterns because we want to?"

> **OKAFOR:** (long pause) "Send it to Earth. All of it. Every data point, every model weight, every analysis. Both hypotheses. Let them verify independently. We do not get to decide this alone."

The Archimedes turns for home. But the signal keeps transmitting. And now, DEEP SCAN is listening — and the crew cannot stop wondering whether something is listening back.

### GITHUB

**Commit:** `feat(m11): DEEP SCAN v1.0 — full system deployed to GitHub Pages`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/deep-scan-signal-classifier`
**Files:**
- `src/system/architecture.ts`
- `.github/workflows/deploy.yml`
- `src/monitoring/dashboard.ts`
- `docs/api.md`
- `docs/architecture.md`
- `package.json` (deploy script)
- All previous module files integrated

### ANIMATION

Final animation: the bridge of the Archimedes. Every holographic display shows a different facet of DEEP SCAN — the spectrogram, the classification feed, the anomaly detector, the sequence predictor. At the center, the Fibonacci spiral pulses in gold against the deep space backdrop, its ratios mirroring the ship's own calibration harmonics. The camera pulls back through the bridge viewport to show the Archimedes against the star field of Kepler-442. The DEEP SCAN logo resolves one final time. Text: **"DEEP SCAN v1.0 — Signal Classified. Mission Continues."**

---

## AI-Wrong Moments

These are specific narrative beats where DEEP SCAN fails, teaching the crew (and the learner) that ML systems are fallible.

1. **M4 — False Signal Classification:** DEEP SCAN, now running in the browser, misclassifies cosmic background noise as a signal pattern. The crew wastes hours investigating nothing. Torres is furious. Park learns about the difference between training accuracy and real-world performance — and the cost of false positives.

2. **M8 — Failed Prediction:** The time-series model predicts the anomalous signal will repeat at a specific time. It does not. The crew stares at empty readouts. Sato explains non-stationary data: "The signal's timing is changing. Our model assumed the future would look like the past. It will not always." Park retrains with a model that accounts for temporal drift.

---

## Character Arcs — Chief Torres (Skeptic)

Torres's arc traces a pragmatic engineer learning to trust ML — not blindly, but through evidence.

1. **M3 — Grudging Admission:** After the neural network reaches 78% accuracy on signal classification, Torres grudgingly admits the model caught a subtle pattern in the sensor data that her rule-based filters missed. She does not celebrate — but she stops actively dismissing the approach.

2. **M5 — Volunteering:** When Sato needs someone to calibrate the signal filters for the FFT pipeline, Torres volunteers. "If this frequency analysis is going to run on my ship, I want the filters tuned properly." This is the first time she proactively contributes to the ML effort.

3. **M7 — Defending the Model:** When the anomaly detector flags the unknown signal and Okafor questions whether to trust it, Torres surprises everyone by defending the model's classification. "The reconstruction error is off the charts. I have checked the sensor calibration three times. This is not instrument noise — the model is right."

4. **M10 — Full Advocate:** Torres suggests using ML for fuel optimization — an area she previously considered sacred engineering territory. "If the model can compress from 340 MB to 42 MB with 2% accuracy loss, it can probably find efficiencies in our fuel burn calculations too." Park and Sato exchange a look. Torres has come around.

---

## Theme-Specific Terminology

| Term | In-World Meaning | ML Meaning |
|---|---|---|
| Signal Band | Frequency range of incoming transmission | Feature channel |
| Telemetry Feed | Real-time sensor data stream | Training data pipeline |
| Scan Profile | A trained model configuration | Model checkpoint |
| Noise Floor | Background interference level | Baseline loss |
| Deep Scan | Full-spectrum signal analysis | Multi-layer inference |
| Anomaly Spike | Unexpected signal pattern | High reconstruction error |
| Burn Cycle | Model training run | Training epoch |
| Array Lock | Sensor array focused on target | Attention mechanism focus |
| Signal Decay | Weakening transmission over time | Gradient vanishing |
| Resonance Map | Frequency decomposition visualization | Spectrogram / feature map |
| Pulse Sync | Temporal alignment of signals | Sequence alignment |
| Core Dump | Exporting model state | Model serialization |
| Transmission Window | Time available for communication | Inference latency budget |
| Orbit Correction | Adjusting ship trajectory | Learning rate adjustment |
| Fuel Reserve | Remaining compute budget | GPU/memory headroom |


---
# FILE: neon-protocol.md
---

# Neon Protocol — Computer Vision

> **COMING SOON** — Neon Protocol is the second theme in TensorCraft. It is currently in development. The script below contains the full narrative design, character profiles, and module outlines. Lesson-level detail will be added during production.

---

## SCRIPT GUIDE

**Tags:** `computer-vision` `CNN` `object-detection` `segmentation` `transfer-learning` `real-time`
**Theme:** Cyberpunk surveillance resistance in Neon City, 2049
**Setting:** NeuralCore HQ — the resistance's underground base beneath Neon City. Above ground, Meridian Systems operates 200 cameras per city block. The resistance repurposes decommissioned server rooms, rooftop antenna arrays, and hidden safe houses as their operational network.
**Model being built:** Protocol Sentinel — an anomaly detection system for surveillance networks
**GitHub repo deployed at end:** `protocol-sentinel-vision`

### Characters

| Name | Role | Description |
|---|---|---|
| **Kira** | Hacker / Player Character / Student Avatar | The learner's proxy. Skilled frontend dev who joined the resistance after Meridian flagged her as "non-compliant" for refusing their tracking SDK. Knows JS cold, no ML background. Built a real-time collaborative drawing app with Canvas API and WebRTC that served 50K users — her proudest project before everything changed. Resourceful, determined, occasionally reckless. Receives direction from Lin; learns from Zara, Ryo, and NEON. |
| **Zara** | Street Artist / Visual Expert | Resident expert on visual perception and image composition. Creative, observant, speaks in vivid imagery. Translates vision concepts into intuitive visual metaphors. |
| **Ryo** | Former Corp Engineer | Ex-Meridian engineer who defected. Quiet, precise, carries guilt about his past work. Knows the enemy's systems inside out. Handles architecture and optimization. |
| **Lin** | Resistance Leader | Strategic leader. Charismatic, intense, carries the weight of leadership. Sets mission objectives and provides the larger context. |
| **NEON** | Reprogrammed Surveillance AI | Fragment of the city's surveillance AI that Ryo extracted and reprogrammed. Glitchy, self-aware, darkly funny. Tutorial guide, code assistant, hint system. |

### Career Paths & Salaries

| Path | Description | Avg Salary (US) |
|---|---|---|
| Computer Vision Engineer | Build detection, segmentation, and tracking systems | $150,000 - $200,000 |
| ML Engineer (Vision) | Train and deploy image/video models at scale | $145,000 - $195,000 |
| Robotics Perception Engineer | Vision systems for autonomous machines | $140,000 - $190,000 |
| AR/VR ML Engineer | Real-time vision for immersive experiences | $145,000 - $195,000 |
| Medical Imaging ML Engineer | Apply vision models to healthcare diagnostics | $140,000 - $185,000 |

---

## COMING SOON PREVIEW

### Preview Art

A rain-slicked street in Neon City. Holographic advertisements flicker on every surface. In the foreground, Kira crouches behind a dumpster, her laptop open, its screen casting cyan light across her face. Above her, a Meridian surveillance drone hovers — its camera lens glowing hot pink. On Kira's screen: a bounding box around the drone, labeled `MERIDIAN-SCOUT-7 | conf: 0.94`. In the bottom corner of the screen, NEON's glitchy avatar pulses with interference patterns.

### Story Summary

Five years ago, Neon City's centralized surveillance AI was built to protect citizens. Then Meridian Systems corrupted it. Now 200 cameras per city block track, profile, and control. An underground resistance has formed — and they need a frontend developer who can build vision systems that fight back.

Kira, a skilled JavaScript developer, is recruited after Meridian's AI flags her as non-compliant. Under the guidance of Zara (visual intuition), Ryo (architecture expertise), and Lin (strategic leadership), she builds Protocol Sentinel — a browser-based vision system that detects surveillance anomalies, identifies drones, and ultimately captures proof of Meridian's illegal profiling.

The journey takes Kira from basic image classification to real-time object detection, semantic segmentation, transfer learning, generative adversarial techniques, and edge deployment — all running in the browser, all mapped to frontend concepts she already knows.

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

> **This course teaches machine learning through interactive, narrative-driven lessons designed for frontend developers.**
>
> You will learn real ML — not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
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

### L1.1 — Seeing Like a Machine

**5C Variation:** Standard

Kira meets the resistance crew. Lin briefs her on the mission. Zara shows her a wall of surveillance camera feeds: "This is what Meridian sees. Now let us teach a machine to see differently." NEON boots up — glitchy, disoriented, but functional.

> **NEON:** "I used to track 14 million faces simultaneously. Now I am helping you debug a tensor shape mismatch. How the mighty have fallen."

**FE BRIDGE:** Images in a computer are just `<canvas>` pixel data — a 2D grid of RGBA values stored in a `Uint8ClampedArray`. Every `getImageData()` call returns a tensor. Kira's collaborative drawing app streamed exactly this data over WebRTC — she was already working with image tensors without knowing it.

**Hook:** NEON's diagnostic scan reveals something unexpected in the image data — patterns that shouldn't be there.

### L1.2 — Pixels & Tensors

**5C Variation:** Discovery

Images are multi-dimensional arrays. A grayscale image is a 2D tensor (height x width). A color image is a 3D tensor (height x width x channels). A batch of images is 4D.

**FE BRIDGE:** `Uint8ClampedArray` from `canvas.getContext('2d').getImageData()` — you have already worked with image tensors in frontend code.

**Hook:** The pixel patterns are familiar — too familiar. NEON says: "I've seen this encoding before. At Meridian."

### L1.3 — Color Channels

**5C Variation:** Broken Code First

RGB, grayscale, alpha — understanding depth. Each pixel has 3 (or 4) values. Color spaces are just different coordinate systems for the same visual information.

**FE BRIDGE:** CSS color functions: `rgb(255, 0, 0)`, `hsl(0, 100%, 50%)`, `oklch(0.63, 0.26, 29)` — different representations of the same color, just as RGB/HSV/LAB are different representations of the same image data.

**Hook:** NEON isolates a hidden channel in Meridian's camera feeds — data encoded in color values the human eye can't distinguish.

### L1.4 — Image Operations

**5C Variation:** Standard

Resize, crop, rotate, flip — basic transforms that prepare images for model input. Every model expects a fixed input size.

**FE BRIDGE:** CSS `transform` and `object-fit` — you resize and crop images constantly in frontend work. `object-fit: cover` is center-crop. `object-fit: contain` is resize-with-padding.

**Hook:** The transforms reveal something: Meridian's cameras all output images at an unusual resolution — one optimized for a specific model architecture.

### L1.5 — Your First Classifier

**5C Variation:** Standard (with debrief elements)

A simple threshold-based image classifier: is this image bright or dark? Is there a red region (indicating a camera LED)? Simple rules on pixel values.

**FE BRIDGE:** `if/else` on pixel values — the simplest possible "model." This is where traditional programming ends and ML begins.

**Story beat:** NEON runs the simple classifier on a surveillance feed. It works — barely. 62% accuracy. Kira realizes she needs something more powerful.

**Cliffhanger:** NEON's diagnostic scan reveals something unexpected: its own facial recognition model is still running inside Meridian's network.

---

## MODULE 2: IMAGE DATA

*Understanding and preparing image datasets for training.*

### Narrative

The resistance needs training data. Zara leads a nighttime operation to photograph surveillance equipment across Neon City — every angle, every lighting condition, rain and dry, day and night.

> **ZARA:** "Data augmentation is like my art — same subject, different angles, different lighting, different moods. The more perspectives you show the model, the deeper it understands."

**Unique content:** Kira builds a data pipeline that ingests images from the resistance's distributed camera network, applies augmentation (random crops, rotations, color jitter, horizontal flips), normalizes pixel values, balances class distributions, and creates efficient batched data loaders.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Building Datasets | Collecting, labeling, organizing image data | Asset pipeline and folder structure |
| 2 | Data Augmentation | Creating training variety through transforms | CSS transform variations (`rotate`, `scale`, `skew`) |
| 3 | Normalization | Scaling pixel values for model consumption | CSS `normalize.css` — consistent baseline |
| 4 | Class Balance | Handling imbalanced datasets | Load balancing across servers |
| 5 | Data Loaders | Efficient batched data loading | Pagination and infinite scroll |

### GITHUB

**Commit:** `feat(m2): image data pipeline with augmentation and balanced loading`
**Branch:** `module-02/image-data`

**Cliffhanger:** While reviewing the augmented dataset, Zara notices something in the metadata: timestamps show that three of the resistance's own cameras have been repositioned — by someone outside the network.

---

## MODULE 3: CONVOLUTIONAL NEURAL NETWORKS

*Building the core vision architecture for surveillance equipment classification.*

### Narrative

Kira builds her first CNN. Zara walks her through feature visualization:

> **ZARA:** "Look — the first layer learned edges. The second found shapes. The third recognizes camera housings. Each layer builds on the last, like seeing with increasing understanding."

The model hits 89% accuracy on camera type classification.

**Unique content:** Kira implements convolution operations from scratch before using TensorFlow.js's built-in layers. She visualizes feature maps at each layer to understand what the network "sees" — edges in layer 1, textures in layer 2, object parts in layer 3, full objects in layer 4.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Convolution Operations | How kernels slide across images. Kira recognizes the pattern from her Canvas drawing app — she's applied blur filters to pixel buffers before. | CSS `filter: blur()` — a convolution kernel operation |
| 2 | Pooling Layers | Downsampling feature maps | `srcset` responsive image downsampling |
| 3 | CNN Architecture | Stacking conv, pool, and dense layers | Component composition patterns |
| 4 | Training a CNN | End-to-end training on image data | Full build pipeline execution |
| 5 | Visualizing Features | Understanding what the network learned | DevTools element inspection |

**FE BRIDGES (Module-Level):**

- **Convolution = CSS `blur()`:** A CSS blur filter slides a Gaussian kernel across every pixel of an image. A convolutional layer does the same thing — slides a learned kernel across the image. The difference: CSS uses a fixed kernel (Gaussian); CNNs learn the kernel from data.
- **Pooling = `srcset` downsampling:** `srcset` provides the browser with multiple image sizes and lets it choose the appropriate resolution. Max pooling does similar downsampling — taking the maximum value from each region to create a smaller, more manageable representation.

### GITHUB

**Commit:** `feat(m3): CNN classifier with feature visualization`
**Branch:** `module-03/cnn`

**Cliffhanger:** The pooled features reveal a pattern — Meridian is not just tracking faces. They are predicting where people will go next.

---

## MODULE 4: OBJECT DETECTION

*Finding and localizing Meridian's drones within images.*

### Narrative

The resistance needs to detect Meridian's drones in real-time street-level camera feeds. Ryo shares insider knowledge:

> **RYO:** "Meridian uses YOLOv5 for their drone detection. I know because I helped build it. Here is how we beat it: we build something faster and deploy it where they cannot reach — the browser."

**Unique content:** Kira implements the full object detection pipeline — anchor box generation, bounding box regression, intersection over union (IoU) calculation, non-maximum suppression (NMS), and the YOLO single-shot architecture. She learns to handle multiple object scales and aspect ratios.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Bounding Boxes | Representing object locations | `position: absolute` + `getBoundingClientRect()` |
| 2 | Anchor Boxes | Pre-defined detection regions | CSS Grid template areas / `getBoundingClientRect()` |
| 3 | IoU | Measuring detection overlap accuracy | Drag-and-drop hit testing / collision detection |
| 4 | Non-Max Suppression | Eliminating duplicate detections | `debounce()` — suppress redundant firing events |
| 5 | YOLO Architecture | Single-shot detection at speed | Single-pass rendering vs multi-pass layout |

**FE BRIDGES (Module-Level):**

- **Anchor boxes = `getBoundingClientRect()`:** Anchor boxes define pre-set regions where the model looks for objects. `getBoundingClientRect()` returns the exact bounding rectangle of a DOM element. Both describe rectangular regions in a 2D space using `{x, y, width, height}`.
- **IoU = drag-and-drop collision detection:** Intersection over Union measures how much two boxes overlap. In frontend drag-and-drop, you calculate overlap between the dragged element and drop targets — same math, same purpose.
- **NMS = `debounce()`:** When you scroll rapidly, a scroll handler fires many redundant events. `debounce()` keeps only the final (strongest) event and suppresses the rest. NMS does the same — multiple overlapping detections for the same object are suppressed, keeping only the highest-confidence one.

### GITHUB

**Commit:** `feat(m4): YOLO-based drone detection with NMS`
**Branch:** `module-04/object-detection`

**Story beat:** The detector works. For the first time, the resistance can see drones before drones see them. Zara brings synthetic coffee to the server room. NEON displays a drone count on the wall: "47 tracked, 0 spotted us." Lin raises her mug. Kira laughs — actually laughs — for the first time since joining the resistance. The moment is brief, but real.

**Cliffhanger:** The drone detector flags a new model of drone — one not in any of Ryo's intel files. Ryo's jaw tightens. "That's Yates's signature — new hardware, no announcement, just deployment. Director Yates doesn't iterate. She replaces." Meridian is deploying hardware the resistance has never seen.

---

## MODULE 5: SEGMENTATION

*Understanding images at the pixel level for scene analysis.*

### Narrative

The resistance needs to understand full street scenes, not just detect individual objects.

> **ZARA:** "A drone detector tells you *what*. Segmentation tells you *where*. And *where* tells you *why* — why is that drone hovering over that specific intersection?"

**Unique content:** Kira implements semantic segmentation (classify every pixel), instance segmentation (distinguish individual objects), and the U-Net encoder-decoder architecture. She builds mask generation for pixel-precise boundaries around surveillance equipment.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Semantic Segmentation | Classifying every pixel | CSS `clip-path` — defining regions |
| 2 | Instance Segmentation | Distinguishing individual objects | DOM element identity vs class |
| 3 | U-Net Architecture | Encoder-decoder for dense prediction | Layout flow: content down, styles up |
| 4 | Mask Generation | Pixel-precise boundaries. Kira realizes this is the same concept as her drawing app's selection tool — isolating pixel regions with a binary mask. | SVG `<mask>` and `<clipPath>` elements |
| 5 | Scene Understanding | Combining segmentation with context | Semantic HTML — structure implies meaning |

### GITHUB

**Commit:** `feat(m5): U-Net segmentation for urban scene understanding`
**Branch:** `module-05/segmentation`

**Cliffhanger:** Ryo's old access credentials still work. Inside Meridian's model registry, they find a model trained on data from their own resistance network.

---

## MODULE 6: FEATURE EXTRACTION

*Learning meaningful representations from surveillance imagery.*

### Narrative

Ryo introduces features as the "DNA" of an image:

> **RYO:** "Meridian's network does not store images — it stores features. Compact, searchable, and terrifyingly powerful. We will build the same capability, but use it to find their patterns instead of ours."

**Unique content:** Kira builds feature extractors, embedding spaces, and similarity search. She learns to use pre-trained backbone networks as feature extractors and applies dimensionality reduction (t-SNE, PCA) to visualize how the model organizes surveillance imagery.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Feature Vectors | Compact image representations | Hash functions — compact data representation |
| 2 | Embedding Spaces | Similar images cluster together | 2D scatter plots of related data |
| 3 | Similarity Search | Finding visually similar images | Fuzzy text search / autocomplete |
| 4 | Backbone Networks | Pre-trained feature extractors | Shared component libraries |
| 5 | Dimensionality Reduction | t-SNE and PCA for visualization | Responsive design — same content, fewer dimensions |

### GITHUB

**Commit:** `feat(m6): feature extraction pipeline with embedding visualization`
**Branch:** `module-06/feature-extraction`

**Cliffhanger:** The embedding space reveals a cluster of images the resistance never uploaded. Someone else is using their feature extractor — and feeding data back to Meridian. NEON traces the metadata: "These images were ingested by a pipeline registered to Director Yates's personal project allocation. She knows about us."

---

## MODULE 7: TRANSFER LEARNING

*Standing on the shoulders of giants — and enemies.*

### Narrative

The midpoint revelation. Ryo downloads weights from a Meridian model he helped build.

> **RYO:** "They spent $2 million training this on every surveillance feed in the city. We fine-tune it on 500 images and turn it against them."

> **LIN:** "Poetic justice."

**Story beat (Flashback):** While the fine-tuning job runs overnight, Ryo and Kira sit on the server room floor, watching progress bars crawl. Ryo talks — really talks — for the first time.

> **RYO:** "I thought we were building safety. I told myself that every camera was protecting someone. It took two years to see what we'd actually built. By then my code was in 40,000 cameras across the city. You don't just quit something like that — you have to find the courage to actively undo it."

Kira doesn't respond right away. She watches the loss curve descend on her screen — Meridian's own model learning to fight Meridian. Finally: "So that's what we're doing. Undoing it." Ryo nods. The progress bar hits 12%.

**Unique content:** Kira learns to load pre-trained models, freeze early layers (which capture universal visual features like edges and textures), and fine-tune later layers on the resistance's specific task. She also implements domain adaptation to bridge the gap between Meridian's training distribution and the resistance's field data.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Pre-trained Models | Using models trained on massive datasets | npm packages — using others' work |
| 2 | Fine-tuning | Adapting a model to your task | Customizing a UI framework's theme |
| 3 | Feature Freezing | Which layers to retrain | `Object.freeze()` — selective immutability |
| 4 | Domain Adaptation | Bridging data distributions | i18n — adapting content across locales |
| 5 | Meridian's Models | Repurposing the enemy's weights | Forking an open-source project |

### GITHUB

**Commit:** `feat(m7): transfer learning from Meridian pre-trained weights`
**Branch:** `module-07/transfer-learning`

**Cliffhanger:** They successfully fine-tune Meridian's model against itself — but the accuracy numbers suggest Meridian anticipated this exact attack.

---

## MODULE 8: REAL-TIME DETECTION

*Running vision models live in the browser.*

### Narrative

Protocol Sentinel goes live on a test feed. Kira watches detections appear in real-time on the browser dashboard.

> **KIRA:** "It is working. It is actually seeing them."

NEON warns: "Frame rate dropping. Optimize or lose real-time capability."

**Story beat (Internal conflict):** The team fractures over architecture. Kira wants to run inference client-side — pure browser, no server dependency, impossible to shut down. Ryo insists on a hybrid approach — server-side for accuracy, client-side as fallback. The argument escalates.

> **KIRA:** "If we depend on servers, Meridian takes down one node and the whole district goes blind."
>
> **RYO:** "If we go pure browser, we lose 15% accuracy. That 15% is people, Kira. Misidentified people."

Lin lets them argue. Then: "Build both. Test both. Let the data decide." It's the first time the team has disagreed this sharply — and the resolution makes the system stronger. They ship a hybrid architecture with graceful degradation: server-enhanced when available, browser-only when necessary.

**Unique content:** Kira implements a full video processing pipeline — accessing webcam/video streams via `getUserMedia()`, running frame-by-frame inference in a `requestAnimationFrame` loop, maintaining performance budgets for real-time frame rates, and leveraging WebGL for GPU-accelerated inference.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Video Stream Processing | Accessing and processing video feeds | `getUserMedia()` API |
| 2 | Frame-by-Frame Inference | Running models on live video | `requestAnimationFrame()` render loop |
| 3 | Performance Budgets | Maintaining real-time frame rates | Lighthouse performance budgets |
| 4 | WebGL Acceleration | GPU-powered inference | WebGL rendering pipeline |
| 5 | Streaming Architectures | Processing continuous visual data | WebSocket / Server-Sent Events |

### GITHUB

**Commit:** `feat(m8): real-time video detection pipeline with WebGL acceleration`
**Branch:** `module-08/real-time`

**Cliffhanger:** NEON identifies a Meridian agent based on gait analysis. Kira is about to trigger an alert — then Ryo stops her. "That person is limping from an injury. The model is wrong." The cost of trusting vision without verification.

---

## MODULE 9: GENERATIVE VISION

*Creating and manipulating images with AI for counter-surveillance.*

### Narrative

Zara's module. She realizes that generative models can create adversarial patterns — visual patches that confuse Meridian's cameras.

> **ZARA:** "Art has always been resistance. Now the art literally fights back."

**Story beat (Ethical tension):** The adversarial patches work — too well. Lin calls a halt before deployment.

> **LIN:** "If we teach an AI to create patches that fool cameras, what stops someone from using the same technique to fool medical imaging or autonomous vehicles? We deploy this responsibly or we don't deploy it at all."

Ryo backs her up, speaking from experience:

> **RYO:** "At Meridian, Director Yates called this kind of capability 'dual-use upside.' Meaning: build it, ship it, let someone else worry about the consequences. That thinking is exactly what we're fighting against. We scope the patches to Meridian's specific model signatures. Narrow target. No collateral."

The team agrees: the patches will be cryptographically bound to Meridian's architecture fingerprints — useless against any other system.

**Unique content:** Kira learns GANs (generator vs discriminator in adversarial training), image generation for synthetic training data, adversarial patch creation that fools classifiers, and style transfer for visual camouflage. The counter-surveillance application ties it all together — using generative AI defensively.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | GANs Primer | Generator vs discriminator | Fuzzer vs validator in testing |
| 2 | Image Generation | Creating synthetic training data | Procedural content generation |
| 3 | Adversarial Patches | Patterns that fool classifiers | CSS `mix-blend-mode` — visual interference |
| 4 | Style Transfer | Applying visual styles across images | CSS theme switching / CSS-in-JS |
| 5 | Counter-Surveillance | Using generative AI defensively | Ad blockers — rewriting the visual stream |

### GITHUB

**Commit:** `feat(m9): GAN-based adversarial patches for counter-surveillance`
**Branch:** `module-09/generative-vision`

**Cliffhanger:** Zara's adversarial patch works perfectly in testing. Then NEON detects Meridian has deployed a patch detector.

---

## MODULE 10: DEPLOYMENT

*Shipping Protocol Sentinel to resistance devices across Neon City.*

### Narrative

Ryo leads deployment. For the first time in weeks, Meridian is quiet — no new drones, no model updates, no probes against the resistance network. The silence is deliberate.

> **RYO:** "A model that only works on my laptop is a demo. A model that works on every resistance member's phone is a weapon."

**Story beat (Calm before the storm):** The quiet unsettles everyone except Lin. "Yates is consolidating," she says. "She knows something is coming. So do we." The team uses the calm strategically — optimizing, stress-testing, hardening. Kira runs Protocol Sentinel through every failure scenario she can imagine. Zara designs visual guides so any resistance member can deploy the system without training. Ryo audits his own code one final time, looking for anything Meridian could exploit. There is no crisis this module — just the weight of knowing the next one will be the last.

**Unique content:** Kira optimizes Protocol Sentinel for edge deployment — quantization to shrink the model, pruning to remove unnecessary weights, and distillation to train a lightweight student model. She builds API-based inference for the resistance's server infrastructure and implements A/B testing to compare model versions in the field.

### Lessons

| # | Title | Description | FE Bridge |
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

## MODULE 11: CAPSTONE — PROTOCOL SENTINEL

*Full system deployment and the final mission.*

### Narrative

The final mission. Protocol Sentinel, deployed across hundreds of devices in the resistance network, captures evidence of Meridian's illegal profiling operations. The system runs in the browser on every resistance member's device — phones, laptops, even repurposed smart glasses.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | System Design | Architecting the complete Sentinel system | Full-stack architecture planning |
| 2 | Integration Testing | End-to-end system validation | Cypress/Playwright E2E testing |
| 3 | Security & Privacy | Ethical deployment, data handling | CORS, CSP, and security headers |
| 4 | Public Launch | Deploying to production | CI/CD pipeline to production |
| 5 | The Broadcast | Protocol Sentinel reveals Meridian's crimes | The deploy that changes everything |

### CONSEQUENCE

Kira watches from a rooftop as Protocol Sentinel's evidence broadcasts across every screen in Neon City. The surveillance footage, classified and annotated by the system, shows Meridian's AI conducting illegal profiling — tracking individuals based on ethnicity, political affiliation, and social connections.

> **KIRA:** "NEON, status?"

> **NEON:** "Protocol Sentinel is live on 847 devices across 12 districts. Detection confidence averaging 96.2%. Meridian's counter-measures are... inadequate. I almost feel sorry for them. Almost."

> **KIRA:** "And the evidence packages?"

> **NEON:** "Cryptographically signed, timestamped, and distributed to 14 independent media organizations. Even if Meridian shuts down the broadcast, the data is already replicated beyond their reach."

Lin speaks to the city through every hijacked screen:

> **LIN:** "Now you see what they see. Every face tracked. Every movement logged. Every citizen scored. The protocol is open. The sentinel is yours. Watch the watchers."

Kira closes her laptop. The neon signs of the city reflect in the rain puddles at her feet. For the first time in five years, the cameras are not the only ones watching.

### GITHUB

**Commit:** `feat(m11): Protocol Sentinel v1.0 — full deployment with evidence broadcast system`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/protocol-sentinel-vision`

---

## AI-Wrong Moments

These are specific narrative beats where Protocol Sentinel or NEON fails, teaching the crew (and the learner) that ML systems are fallible.

1. **M5 — False Identification:** NEON identifies a suspected Meridian agent based on gait analysis. It is wrong — the person was limping from an injury, not matching a surveillance officer's walking pattern. Kira almost compromised a safe house based on the model's output. Ryo: "High confidence is not the same as high correctness. The model has never seen someone with a limp."

2. **M9 — Adversarial Friendly Fire:** An adversarial patch designed to fool Meridian's cameras also fools the resistance's own security system. NEON: "In my defense, adversarial patches are model-agnostic. If it fools one CNN, it may fool any CNN — including ours." The team learns that adversarial attacks are a double-edged sword.

---

## Character Arcs — Ryo (Nuanced Skeptic)

Ryo's arc is not a simple conversion from skeptic to believer. He knows ML works — he built it for Meridian. His skepticism is about *who controls it* and *whether high accuracy means the model is right for the right reasons*.

1. **M3 — The Warning:** After the CNN hits 89% accuracy, Ryo warns: "High accuracy does not mean the model is right for the right reasons. Meridian's model was 97% accurate. It was also profiling people by ethnicity. Check what features the network is actually using." He insists on feature visualization before deployment.

2. **M5 — Confronting the Past:** When Ryo's old access credentials work inside Meridian's model registry, he finds code he wrote years ago. He goes quiet. Lin: "Ryo?" Ryo: "I built the segmentation pipeline they are using to map resistance safe houses. That is my code." He confronts his past directly and channels the guilt into the work.

3. **M7 — Leading the Attack:** Ryo leads the transfer learning effort, using Meridian's own pre-trained weights against them. "They spent $2 million training this. We fine-tune it on 500 images and turn it against them." This is his redemption — using his knowledge of the enemy's architecture to dismantle it.

4. **M11 — The Choice:** When it is time to broadcast, Ryo knows Meridian will trace the signal back to him. His code fingerprints are all over Protocol Sentinel. He chooses to broadcast anyway — personal risk be damned. "I helped build the cage. The least I can do is help open the door."

---

## Theme-Specific Terminology

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


---
# FILE: nova-canvas.md
---

# Nova Canvas — Multimodal & Generative AI

> **COMING SOON** — Nova Canvas is the fourth theme in TensorCraft. It is currently in development. The script below contains the full narrative design, character profiles, and module outlines. Lesson-level detail will be added during production.

---

## SCRIPT GUIDE

**Tags:** `generative-AI` `GANs` `VAE` `diffusion` `CLIP` `multimodal` `style-transfer`
**Theme:** AI-powered creative tools for a digital art collective preparing for a global exhibition
**Setting:** NOVA LABS — The Nova Collective is a digital art community housed in a converted warehouse district known as "The Grid." Part gallery, part laboratory, part performance space, it exists at the intersection of art and technology. The collective has been invited to create the centerpiece installation for the Global Digital Arts Biennale — a multimodal AI system that generates art across mediums (visual, audio, text) and responds to audience interaction in real time.
**Model being built:** Nova Canvas — a multimodal creative assistant
**GitHub repo deployed at end:** `nova-canvas-creative-ai`

### Characters

| Name | Role | Description |
|---|---|---|
| **Yara** | Lead Artist / Creative Director | Visionary, passionate, occasionally impatient with purely technical thinking. Background in kinetic sculpture and physical installations, transitioned to digital. She cares about *meaning*, not just output quality. Sees AI as the next tool in her workshop — after welding torches, CNC routers, and projection mapping. Defines the artistic vision and pushes beyond technical capability toward genuine creative expression. |
| **Kai** | Creative Coder & Audio Engineer | Audio specialist and creative coder who thinks in math and signal processing. Explains ML concepts through precise technical analogies — Fourier transforms, sampling rates, signal-to-noise ratios. Laid-back but surgically exact. Bridges the gap between Yara's artistic vision and Ren's implementation by translating ideas into mathematical operations. |
| **Petrov** | Gallery Curator / Deployment Lead | Business, presentation, and technical constraints. Handles exhibitions, audience experience, practical deployment realities. Sophisticated, pragmatic, anxious about deadlines — but also the voice of infrastructure reality. Knows the exact specs of every device in the gallery. Cares about audience experience above all, and knows that experience dies if the frame rate drops below 30fps. |
| **Ren** | Creative Coder / Student Avatar | The player character. A frontend developer who joined the collective to explore creative coding. Strong JS skills, no ML background, deep curiosity. Approaches ML through play and iteration. Comfortable with ambiguity. |
| **MUSE** | Creative AI Assistant | The collective's AI. Poetic, referential, occasionally pretentious. Quotes artists and philosophers alongside documentation. Genuinely tries to inspire. Tutorial guide, code assistant, creative suggestion engine. |

### Career Paths & Salaries

| Path | Description | Avg Salary (US) |
|---|---|---|
| Generative AI Engineer | Build image, audio, and text generation systems | $155,000 - $210,000 |
| ML Engineer (Multimodal) | Train and deploy cross-modal models | $150,000 - $200,000 |
| Creative Technologist | Bridge art and technology in interactive experiences | $120,000 - $170,000 |
| Computer Vision Engineer (Generative) | Build and optimize image generation pipelines | $145,000 - $195,000 |
| AI Product Designer | Design user experiences for generative AI products | $130,000 - $180,000 |

---

## COMING SOON PREVIEW

### Preview Art

The interior of The Grid at night. Exposed brick walls covered in projected generative art — swirling gradients, morphing faces, abstract landscapes that shift in real time. In the center, Ren stands before a massive curved display, hands moving over a holographic interface. On the screen, a diffusion model progressively refines noise into a stunning landscape. To the left, Kai sits at an audio station, headphones half-on, watching waveforms sync with the visuals. Yara stands behind Ren, arms crossed, studying the output with an artist's critical eye. In the corner, MUSE's avatar — a shimmering, abstract form — pulses with soft coral and lavender light.

### Story Summary

The Nova Collective has received the most prestigious commission in digital art: the centerpiece installation for the Global Digital Arts Biennale. Yara's vision is ambitious — an AI system that generates art across visual, audio, and text modalities, responding to audience interaction in real time. Every visitor becomes a collaborator.

Ren, a frontend developer turned creative coder, joins the team as the engineer who will make it all work in the browser. Under the guidance of Yara (artistic vision), Kai (audio and cross-modal thinking), and Petrov (deployment and audience experience), Ren builds Nova Canvas — from simple generative patterns to GANs, VAEs, diffusion models, style transfer, CLIP-guided generation, and audio synthesis.

The journey explores not just how to generate art with machines, but what it means to create. Is a GAN output art? Who is the artist — the human who designed the system, or the model that produced the image? These questions run through every module, making Nova Canvas as philosophical as it is technical.

### Model Preview

Nova Canvas evolves across 11 modules:

1. **M1-M2:** Simple generative model producing visual patterns from random inputs
2. **M3:** GAN generating textures and abstract patterns
3. **M4:** VAE with controllable latent space for image exploration
4. **M5:** Diffusion model for high-quality image generation
5. **M6:** Style transfer system for artistic remixing
6. **M7:** Multimodal model connecting text and image understanding
7. **M8:** CLIP-aligned text-to-image generation
8. **M9:** Audio generation and audio-visual synchronization
9. **M10:** Optimized, real-time interactive installation
10. **M11:** Full multimodal creative assistant deployed for the Biennale

---

## CONCEPT DISCLAIMER

> **This course teaches machine learning through interactive, narrative-driven lessons designed for frontend developers.**
>
> You will learn real ML — not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
>
> **Fundamentals you will master:**
>
> - Linear algebra (vectors, matrices, tensors, broadcasting)
> - Calculus (gradients, chain rule, backpropagation)
> - Probability & statistics (distributions, Bayes, likelihood)
> - Optimization (gradient descent, learning rates, convergence)
> - Information theory (entropy, cross-entropy, KL divergence)
>
> **Specialization topics (Nova Canvas):**
>
> - Generative models (GANs, VAEs, diffusion models)
> - Latent spaces (interpolation, disentanglement, exploration)
> - Adversarial training (generator-discriminator dynamics, mode collapse)
> - Image generation (progressive growing, classifier-free guidance)
> - Style transfer (neural style, real-time transfer, multi-style blending)
> - Multimodal learning (vision-language alignment, CLIP, cross-modal embeddings)
> - Audio generation (waveform synthesis, spectrograms, audio-visual sync)
> - Creative deployment (real-time generation, concurrent users, installation architecture)

---

## MODULE 1: GENERATIVE BASICS (FREE)

*Ren joins the collective and learns what it means to generate with AI.*

### Summary

Ren visits The Grid for the first time. Yara shows them the Biennale proposal — a 10,000 square foot installation space, six weeks to build. Kai plays a piece of AI-generated music. Petrov shows the venue blueprints and sweats about the timeline.

> **REN:** "So we are building an AI that makes art... in the browser... in six weeks."

> **PETROV:** "In the browser, on hardware we do not control. The venue has 40 kiosk machines — mid-range laptops with integrated GPUs. A full diffusion pipeline in the browser takes 45 seconds per image on that hardware. We need to pre-compute the heavy steps server-side and run only the final denoising in-browser."

> **KAI:** "Forty-five seconds is not a guess, by the way. I benchmarked TensorFlow.js inference on a Surface Pro last week. The bottleneck is the attention layers — O(n²) on sequence length."

> **PETROV:** "The venue Wi-Fi is 200 Mbps shared across 200 visitors. That is 1 Mbps per person. Every byte we send over the wire is a byte we cannot afford. The model weights alone are 400 MB if we are not careful."

> **MUSE:** "Every masterpiece begins with a single gradient update. Welcome to the Nova Collective, Ren."

Yara introduces the core idea: generative AI creates new data rather than classifying existing data. Instead of asking "what is this image?" you ask "what image should exist?" The shift from discriminative to generative thinking is the foundation of everything that follows.

> **YARA:** "Imagination is not random. It is structured randomness — possibility shaped by intent. That is what a generative model does. When I build a kinetic sculpture, I design constraints — the arm length, the motor speed, the weight distribution — and the motion that emerges is something I could not have predicted. A generative model works the same way."

> **MUSE:** "Indeed. A probability distribution, sampled with purpose. Kandinsky would have understood immediately."

> **KAI:** "A probability distribution is a histogram with infinite bins. You have used `Math.random()` — that is sampling from a uniform distribution. A generative model just samples from a much more interesting one."

### Lessons

| # | Title | Description | FE Bridge | 5C Variation |
|---|---|---|---|---|
| 1 | What Is Generative AI? | Creating new data vs classifying existing data | `Math.random()` — controlled randomness | Standard |
| | | *Hook: Echo's first output is pure noise. But Ren notices something — the noise is not random.* | | |
| 2 | Probability Distributions | The mathematical foundation of generation | Random color generators / procedural generation | Discovery |
| | | *Hook: The distribution shapes the output, but how do you actually pull a sample from it?* | | |
| 3 | Sampling | Drawing from distributions to create outputs | CSS `random()` proposals / JS random seeding | Broken Code First |
| | | *Hook: The loss function works, but the generated images all look the same — there is no structure, just colored static.* | | |
| 4 | Noise as Input | Starting from randomness to create structure | Perlin noise in `<canvas>` generative art | Standard |
| | | *Hook: The noise has structure now. But can a model learn to turn that structure into something recognizable?* | | |
| 5 | Your First Generator | A simple model that produces visual patterns | Procedural `<canvas>` drawing with parameters | Standard (with debrief elements) |

### GITHUB

**Commit:** `feat(m1): basic generative model with canvas visualization`
**Branch:** `module-01/generative-basics`

**Cliffhanger:** Echo's first generated image is crude — blocky shapes and muddy colors. But Petrov leans forward. "That composition. Where did it learn that?"

---

## MODULE 2: LATENT SPACES

*Understanding the hidden dimensions of generative models.*

### Narrative

Yara introduces latent spaces through art:

> **YARA:** "In my sculpture studio, I have a wall of material samples — wood, resin, steel, glass — arranged by weight and flexibility. Similar materials cluster together. A latent space is the same idea, but for images: every possible image exists somewhere in the space, and similar images are neighbors. When I interpolate between oak and steel in my workshop, I get composites. When you interpolate in a latent space, you get images that blend properties. We are navigating a material library of possibility."

Ren builds an interactive latent space explorer — dragging sliders and watching images morph in real time. The experience is revelatory.

**Unique content:** Ren implements dimensionality, interpolation between points in latent space (smooth morphing between images), disentanglement (separating meaningful factors like color, shape, texture), and builds a slider-driven UI for real-time latent space exploration.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | What Is a Latent Space? | Compressed representation of data | URL shorteners — encoding full content in compact form |
| 2 | Dimensionality | How many dimensions define the space | CSS custom properties — each is a dimension |
| 3 | Interpolation | Walking between points in latent space | CSS transitions — smooth interpolation between states |
| 4 | Disentanglement | Separating meaningful factors of variation | Component props — each controls one aspect |
| 5 | Latent Space Exploration | Building an interactive explorer | Slider-driven UI with real-time preview |

### GITHUB

**Commit:** `feat(m2): interactive latent space explorer with interpolation`
**Branch:** `module-02/latent-spaces`

**Cliffhanger:** Ren drags a slider through an unexplored region of the latent space. The output is not abstract — it is a face. A face that was never in the training data.

---

## MODULE 3: GENERATIVE ADVERSARIAL NETWORKS

*The art of adversarial creation — two networks in creative tension.*

### Narrative

Yara frames GANs as art criticism:

> **YARA:** "The generator is a student artist. The discriminator is a harsh critic. They push each other to excellence. Neither is good alone — together, they create."

Kai observes: "The discriminator is computing a binary cross-entropy loss against the generator's output. It is basically the same math as an A/B test — one signal is real, one is synthetic, and you are training a classifier to tell them apart. The generator's gradient flows backward through that classifier to improve."

**Unique content:** Ren implements the full GAN pipeline — generator architecture (producing structured output from noise), discriminator architecture (judging output quality), adversarial training dynamics (balancing the two networks), and handling mode collapse (when the generator gets lazy and produces limited variety).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | The GAN Game | Generator vs discriminator — a creative duel | Fuzzer vs validator in testing |
| 2 | Generator Architecture | Building the creative network | Template engine — producing structured output |
| 3 | Discriminator Architecture | Building the critical network | Form validation — judging input quality |
| 4 | Training Dynamics | Balancing the adversarial dance | Load balancing — keeping two systems in sync |
| 5 | Mode Collapse & Fixes | When the generator gets lazy | When a random function is not random enough |

**FE BRIDGE (Module-Level):** A GAN is a fuzzer versus a validator. In testing, a fuzzer generates random inputs trying to break the system, while a validator checks whether the output is acceptable. A GAN's generator creates samples trying to fool the discriminator, while the discriminator judges whether samples are real or fake. Both are adversarial feedback loops that improve through competition.

### GITHUB

**Commit:** `feat(m3): GAN training pipeline for texture generation`
**Branch:** `module-03/gans`

**Cliffhanger:** The VAE's latent space reveals something unexpected: artworks the collective never uploaded are clustering near their own.

---

## MODULE 4: VARIATIONAL AUTOENCODERS

*Learning to encode and decode the space of possibility.*

### Narrative

Ren builds a VAE and discovers controllable generation:

> **REN:** "I can move through the latent space and watch the output transform smoothly. It is like having infinite creative controls."

> **YARA:** "Now you understand. The latent space is your palette."

**Unique content:** Ren implements the autoencoder foundation, the variational part (adding structure to the latent space via KL divergence), the reparameterization trick (making randomness differentiable), and builds a creative VAE with controllable generation — adjusting latent dimensions to control specific visual properties.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Autoencoders Recap | Compress and reconstruct | `gzip` / Brotli compression pipeline |
| 2 | The Variational Part | Adding structure to the latent space | URL encoding — structured, decodable compression |
| 3 | Reparameterization Trick | Making randomness differentiable | Seeded random — reproducible randomness |
| 4 | KL Divergence | Balancing reconstruction and regularity | CSS specificity balance — structure vs flexibility |
| 5 | Creative VAE | Using VAEs for controllable generation | Design system tokens — controlled variation |

**FE BRIDGE (Module-Level):** A VAE is a URL shortener. A URL shortener takes a long URL, encodes it into a compact form (the latent code), and can decode it back to the original. A VAE takes an image, encodes it into a compact latent vector, and can decode it back. The key insight: nearby short codes produce similar URLs, just as nearby latent vectors produce similar images.

### GITHUB

**Commit:** `feat(m4): VAE with controllable latent space generation`
**Branch:** `module-04/vae`

**Cliffhanger:** Ren asks MUSE to generate something "completely original." The output is a near-perfect copy of a famous painting. MUSE insists it has never seen it before.

---

## MODULE 5: DIFFUSION MODELS

*From noise to masterpiece, one step at a time.*

### Narrative

The first high-quality images emerge. Ren watches a diffusion model progressively refine random noise into a detailed landscape.

> **REN:** "It is loading... but it is loading from nothing. From pure noise into something beautiful."

> **KAI:** "A diffusion step is denoising — same math as the noise reduction filter in Audacity. Each step predicts the noise and subtracts it. Fifty steps means fifty forward passes through the U-Net."

> **PETROV:** "Can we make it faster? The audience will not wait 30 seconds."

The team runs the full 50-step pipeline in TensorFlow.js. On Petrov's test laptop — a mid-range machine matching the gallery kiosks — each image takes 43 seconds. Petrov stares at the profiler output, color draining from his face.

> **PETROV:** "Forty-three seconds. Per image. For two hundred visitors. This is not a gallery installation, it is a loading screen exhibition."

> **KAI:** "We do not need 50 steps. There is a technique called progressive distillation — you train a student model to match the teacher's output in fewer steps. A 4-step distilled model gets 90% of the quality at 8% of the compute. The math is straightforward: the student learns to skip intermediate denoising states by predicting the cumulative noise removal."

> **YARA:** "Ninety percent quality. Will people notice the missing ten?"

> **KAI:** "At 512×512 on a gallery wall viewed from two meters? No. The perceptual difference is below the just-noticeable-difference threshold."

Ren implements the distilled 4-step model. Generation drops to 3.4 seconds. The quality loss is imperceptible at display resolution. Petrov exhales for the first time in an hour. The constraint becomes a teaching moment: model distillation is not a compromise, it is an engineering discipline — trading theoretical optimality for practical viability.

**Unique content:** Ren implements the full diffusion pipeline — the forward process (gradually adding noise to destroy an image), the reverse process (learning to remove noise step by step), noise schedules (controlling the denoising trajectory), the U-Net architecture for noise prediction, classifier-free guidance for text-conditioned generation, and model distillation (compressing 50 denoising steps into 4 via progressive distillation).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | The Diffusion Process | Adding and removing noise systematically | Progressive image loading (blur-up technique) |
| 2 | Noise Schedules | Controlling the denoising trajectory | Animation easing curves (`ease-in-out`) |
| 3 | U-Net for Denoising | The architecture that predicts noise | Encoder-decoder layout patterns |
| 4 | Classifier-Free Guidance | Steering generation with text | CSS custom property overrides |
| 5 | High-Resolution Generation | Scaling up to detailed images | `srcset` and responsive images |

**FE BRIDGE (Module-Level):** Diffusion is progressive image loading. The blur-up technique shows a tiny, blurry placeholder that progressively sharpens into the full image. Diffusion models do the same thing in reverse — start with pure noise (maximum blur) and progressively denoise (sharpen) into a detailed image. Each denoising step is like loading a higher-resolution version. The user watches structure emerge from chaos.

### GITHUB

**Commit:** `feat(m5): diffusion model with classifier-free guidance`
**Branch:** `module-05/diffusion`

**Cliffhanger:** MUSE generates a portrait in the exact style of a collective member who left years ago. The room goes quiet.

---

## MODULE 6: STYLE TRANSFER

*Painting with the soul of another artist.*

### Narrative

Yara brings in examples of classical art:

> **YARA:** "Can the AI paint a photograph in the style of Monet? Of Basquiat? Of Yara?"

Ren builds a real-time style transfer system. The team experiments with blending multiple styles.

> **KAI:** "Style transfer separates the Gram matrix of the style layers from the content activations. In audio, the Gram matrix would capture timbral texture — the spectral envelope — while the content would be the melody and rhythm. Same decomposition, different domain. We could render a jazz recording in the timbral style of a string quartet."

**Unique content:** Ren implements neural style transfer — separating content from style using feature representations, applying artistic styles to photographs, real-time style transfer in the browser, and multi-style blending with adjustable weights.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Content vs Style | Separating what from how | Content vs presentation (HTML vs CSS) |
| 2 | Neural Style Transfer | Applying artistic styles to images | CSS theme switching — same content, different appearance |
| 3 | Style Representations | How networks encode artistic style | Design tokens — encoded visual identity |
| 4 | Real-time Style Transfer | Fast style transfer in the browser | CSS `filter` chains — real-time visual transforms |
| 5 | Artistic Control | Blending multiple styles | CSS `mix-blend-mode` — combining visual layers |

**FE BRIDGE (Module-Level):** Style transfer is CSS theme switching. When you switch a website's theme from light to dark mode, the content stays the same but the visual presentation changes completely — colors, backgrounds, shadows all transform. Neural style transfer does the same: the content (shapes, objects, composition) stays the same, but the style (brushstrokes, color palette, texture) transforms to match a different artist.

### GITHUB

**Commit:** `feat(m6): real-time neural style transfer with multi-style blending`
**Branch:** `module-06/style-transfer`

**Cliffhanger:** Yara runs her own artwork through the style transfer system. The output strips away her technique and reveals something underneath — a composition she unconsciously borrowed from her mentor.

---

## MODULE 7: MULTIMODAL LEARNING

*Connecting vision and language — the bridge between senses.*

### Narrative

The midpoint. Ren connects the vision and language models. The system generates its first image from a text prompt: "a sunset over a digital city." The result is rough but recognizable.

> **YARA:** (studying the output for a long time) "It is not art yet. But it understood the assignment. That is remarkable."

> **MUSE:** "To understand an assignment is to grasp intent — the space between what is said and what is meant. Perhaps understanding is the first brushstroke of creation."

> **PETROV:** "That is lovely, MUSE. Now can we talk about the CLIP alignment score? Because 'understood the assignment' is not a metric I can put in the Biennale progress report."

**Unique content:** Ren implements vision-language models, cross-modal embeddings (shared representation spaces where images and text live together), image captioning (generating text from images), and text-to-image generation (generating images from text descriptions). The cross-modal alignment is the foundation for Module 8's CLIP integration.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | What Is Multimodal? | Models that understand multiple data types | Full-stack apps — frontend + backend + database |
| 2 | Vision-Language Models | Connecting images and text | `<img alt="...">` — text describing images |
| 3 | Cross-Modal Embeddings | Shared representation spaces | Shared component props across platforms |
| 4 | Image Captioning | Generating text from images | Alt-text generation for accessibility |
| 5 | Text-to-Image | Generating images from text descriptions | Server-side rendering — text becomes visual output |

### GITHUB

**Commit:** `feat(m7): multimodal model connecting text and image generation`
**Branch:** `module-07/multimodal`

**Cliffhanger:** The fine-tuned model produces work indistinguishable from human art. Petrov asks the question everyone is avoiding: "If no one can tell the difference, does the difference matter?"

---

## MODULE 8: CLIP & ALIGNMENT

*Teaching machines to understand the deep relationship between words and images.*

### Narrative

Ren integrates CLIP, and suddenly the system understands nuance. "A melancholy cityscape at twilight" produces something qualitatively different from "a city at night."

> **YARA:** "It is learning adjectives. It is learning mood. This is where engineering becomes art."

> **KAI:** "It is not learning mood — it is learning that the vector for 'melancholy' is closer to 'twilight' than to 'noon' in CLIP's embedding space. The cosine similarity between those token embeddings is about 0.34 versus 0.12. Mood is a direction in a 512-dimensional vector space."

**Unique content:** Ren implements contrastive learning (learning by comparing matched and mismatched text-image pairs), the CLIP architecture (joint text-image understanding), zero-shot classification (classifying without training examples), CLIP-guided generation (using CLIP to steer diffusion or GAN output), and prompt engineering for visual generation.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Contrastive Learning | Learning by comparison | A/B testing — comparing alternatives |
| 2 | CLIP Architecture | Joint text-image understanding | Algolia multi-index search — querying across types |
| 3 | Zero-Shot Classification | Classifying without training examples | Dynamic routing — handling unknown paths |
| 4 | CLIP-Guided Generation | Using CLIP to steer image generation | ESLint — guiding code toward desired patterns |
| 5 | Prompt Engineering for Images | Crafting text that produces desired visuals | Writing effective CSS selectors |

**FE BRIDGE (Module-Level):** CLIP is Algolia multi-index search. Algolia lets you search across different content types (products, blog posts, documentation) in a single query — it maintains aligned indexes where semantically related items across types are connected. CLIP does the same: it maintains aligned embeddings where images and text descriptions that match are close together. Search "sunset" and you find both text about sunsets and images of sunsets — because they live in the same aligned space.

### GITHUB

**Commit:** `feat(m8): CLIP integration with guided generation and prompt engineering`
**Branch:** `module-08/clip-alignment`

**Cliffhanger:** Kai feeds the system a piece of music and asks it to generate the "visual equivalent." The result is hauntingly beautiful — and looks exactly like the album cover of the song. The model learned synesthesia, or it learned to cheat.

---

## MODULE 9: AUDIO GENERATION — MULTIMODAL EXTENSION

*Applying latent space thinking to a new modality — the installation needs a soundscape.*

### Narrative

The team watches a test run of the installation. The visuals are stunning. The room is silent. Something is wrong.

> **YARA:** "It feels like a museum, not an installation. An installation is spatial. It surrounds you. We need sound — not as decoration, but as a dimension of the work."

> **PETROV:** "So we are adding an entirely new modality three weeks before opening?"

> **KAI:** "We are not starting from zero. A spectrogram is an image — frequency on the y-axis, time on the x-axis, amplitude as pixel intensity. We already know how to generate images from latent spaces. Audio is the same math, different domain. The VAE and diffusion architectures we built in Modules 4 and 5 transfer directly."

This is Kai's moment. Where Yara thinks in visual composition and spatial design, Kai thinks in sample rates, frequency spectra, and phase coherence. He maps the visual latent space to audio parameters with mathematical precision.

> **KAI:** "The latent vector has 512 dimensions. I am mapping the first 128 to spectral envelope — that controls timbre. Dimensions 129 through 256 map to rhythmic density via onset detection thresholds. The mapping is linear for now, but we can learn a nonlinear projection later. The point is: the same latent walk that morphs an image from landscape to portrait will morph the audio from ambient pad to percussive texture."

> **MUSE:** "Kandinsky would have approved. He spent his career trying to paint music. We are building a system that does the reverse."

> **KAI:** "Kandinsky was guessing. We have the Fourier transform. Every sound is a sum of sine waves at different frequencies and phases. A spectrogram decomposes audio the way a prism decomposes light. Once you see it as a 2D tensor, all our image generation tools apply."

**Unique content:** Ren and Kai implement audio-as-data (waveforms, spectrograms, audio tensors), neural audio synthesis (generating sound from latent representations using the same architectures from Modules 4-5), music generation (melodies and harmonies from sequence models), audio-visual synchronization (linking image generation to audio output via shared latent spaces), and interactive soundscapes that respond to audience input. The key insight: switching modalities is applying what you know to new data, not learning a new field.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Audio as Data | Waveforms, spectrograms, and audio tensors | Web Audio API basics |
| 2 | Audio Synthesis | Generating sound with neural networks | `OscillatorNode` and `AudioContext` |
| 3 | Music Generation | Creating melodies and harmonies | Sequenced `setTimeout()` — timed events |
| 4 | Audio-Visual Sync | Synchronizing sound and image generation | `requestAnimationFrame` + AudioContext timing |
| 5 | Interactive Soundscapes | Audience-responsive audio | Pointer events driving audio parameters |

### GITHUB

**Commit:** `feat(m9): audio generation with audio-visual synchronization`
**Branch:** `module-09/audio-generation`

**Cliffhanger:** The collaborative system produces its first truly surprising piece — one that none of the human artists nor the AI would have created alone.

---

## MODULE 10: CREATIVE DEPLOYMENT

*Making Nova Canvas real-time and installation-ready for 200 simultaneous visitors.*

### Narrative

Petrov's crunch time:

> **PETROV:** "The Biennale is in two weeks. I need 200 people generating simultaneously without lag. If it crashes, we do not get a second chance."

> **PETROV:** "I do not need to understand the latent space. I need to understand why the average generation time is 8 seconds and how we get it under 3."

Ren optimizes aggressively. Kai suggests precomputing base audio loops and layering generated variations on top. The system hits the performance target with three days to spare.

**Unique content:** Ren implements performance profiling (identifying generation bottlenecks), model optimization (distillation and quantization for real-time use), caching and precomputation (pre-generating popular outputs), concurrent user handling (WebSocket connection pooling for 200+ simultaneous generators), and installation architecture (the physical-digital system design).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Performance Profiling | Identifying generation bottlenecks | Chrome DevTools Performance panel |
| 2 | Model Optimization | Distillation and quantization for real-time | Webpack production build optimization |
| 3 | Caching & Precomputation | Pre-generating popular outputs | Service Worker cache and CDN |
| 4 | Concurrent Users | Handling multiple simultaneous generators | WebSocket connection pooling |
| 5 | Installation Architecture | Designing the physical-digital system | PWA architecture — offline-capable, installable |

### GITHUB

**Commit:** `feat(m10): optimized real-time deployment for 200+ concurrent users`
**Branch:** `module-10/creative-deployment`

**Cliffhanger:** The gallery opens tomorrow. The collective votes: AI-generated pieces will be shown alongside human work, unlabeled.

---

## MODULE 11: CAPSTONE — THE BIENNALE

*The exhibition opens. Nova Canvas meets the world.*

### Narrative

Opening night. Visitors stream into The Grid. They speak prompts, touch surfaces, make gestures — and Nova Canvas responds with generated images, sounds, and text. Each creation is unique.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Final Integration | Connecting all modalities into one system | Monorepo integration — all packages working together |
| 2 | User Experience Design | Designing the visitor interaction flow | UX design for interactive installations |
| 3 | Load Testing | Simulating opening night traffic | Artillery / k6 load testing |
| 4 | Monitoring & Failover | Keeping the installation running all night | Uptime monitoring and graceful degradation |
| 5 | Opening Night | The Biennale opens — Nova Canvas goes live | Production launch day |

### CONSEQUENCE

Opening night. The Grid is transformed. Projections cover every wall. Sound fills the space. Visitors stream in — 247 concurrent at peak.

A child walks up to the main interface. She whispers: "a dragon made of stars."

Nova Canvas processes the prompt. CLIP aligns text to visual meaning. The diffusion model begins denoising. Progressively, from pure noise, a dragon materializes — scales made of constellations, wings trailing nebulae, eyes that burn with stellar fire. Kai's audio layer adds a shimmering, crystalline score that rises as the dragon takes shape.

The child laughs. The crowd around her goes silent, then breaks into applause.

Petrov checks the dashboards: 247 concurrent users, sub-2-second generation time, zero crashes.

> **PETROV:** (exhaling for the first time in six weeks) "It is holding. Everything is holding."

> **YARA:** (watching from the balcony, arms crossed, a small smile forming) "That is the thing about generative models. They surprise you. Just like good art should."

Ren stands in the middle of it all — the projections, the sound, the crowd — and realizes: they built this.

> **MUSE:** "Art is never finished, only abandoned. But tonight, we share what we have made. And tomorrow, we make something new."

> **KAI:** "Tomorrow we fix the memory leak in the WebSocket handler. I have been watching the heap grow by 12 MB per hour. But yes — also the art thing."

### GITHUB

**Commit:** `feat(m11): Nova Canvas v1.0 — full multimodal installation deployed`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/nova-canvas-creative-ai`

---

### AI-Wrong Moments

Nova Canvas deliberately includes moments where the AI system produces incorrect or misleading outputs, teaching students to build systems that handle failure gracefully:

- **Module 4 (Variational Autoencoders):** MUSE generates an "original" piece that is clearly memorizing a famous artwork from the training set. The output is not a creative interpolation — it is near-exact reproduction. Ren learns about overfitting, memorization versus generalization, and the importance of training data deduplication.
- **Module 8 (CLIP & Alignment):** The style transfer model produces something technically perfect but emotionally hollow. Every metric says it is excellent — FID score, CLIP alignment, perceptual quality. Petrov studies it and delivers the verdict: "Technically competent. Artistically dead." The team learns that quantitative metrics cannot capture qualitative artistic value, and builds human evaluation into the pipeline.

### Character Arcs

**Petrov — From Skeptic to Collaborator**

Petrov's arc traces a traditional curator who starts dismissive of AI-generated art and gradually discovers how to use generative tools as a creative partner rather than a replacement.

- **M1 (Generative Basics):** Petrov watches Ren's first generated output and scoffs. "This is a photocopier, not a paintbrush. It copies patterns. It does not create."
- **M4 (Variational Autoencoders):** Petrov watches Ren manipulate the latent space, smoothly morphing between visual styles. He pauses, tilts his head. "The latent space interpolation is... interesting. I would not call it art. But the space between the points — that has potential."
- **M7 (Multimodal Learning):** Petrov approaches Ren with an idea. "What if we constrain the generator with my compositional principles? The rule of thirds, color harmony, focal weight. Let the machine generate, but within a framework I define." He begins collaborating directly with the system for the first time.
- **M11 (Capstone):** Standing in The Grid on opening night, watching visitors create alongside Nova Canvas, Petrov delivers his final verdict: "It is not art. But what you do with it — that can be."

---

## Theme-Specific Terminology

| Term | In-World Meaning | ML Meaning |
|---|---|---|
| Canvas | The generation output surface | Output tensor / generated image |
| Canvas Layer | A single processing stage in the generation pipeline | Layer in the neural network |
| Palette Vector | A point in the creative parameter space | Embedding / latent vector |
| Palette | Set of creative parameters | Hyperparameter configuration |
| Sketch | Low-resolution preliminary output | Early denoising step / low-fidelity generation |
| Render | Final high-quality output | Full inference pass |
| Studio | The workspace / development environment | Training environment |
| Gallery Run | One full pass through the training collection | Epoch |
| Exhibition | Public deployment | Production deployment |
| Muse | Creative inspiration source | Pre-trained model / prompt |
| Brushstroke | Individual generative operation | Single forward pass |
| Composition | How elements are arranged in output | Model architecture layout |
| Medium | Type of creative output (visual/audio/text) | Data modality |
| Gallery Wall | Display grid for generated outputs | Output visualization dashboard |
| Remix | Variation on existing generation | Re-sampling with modified latent vector |
| Commission | Specific generation request | Inference prompt |
| Critique Score | Numerical evaluation of output quality | Loss function value |
| Vernissage | Private preview before public launch | Staging deployment |
| Pigment Channel | A single feature dimension in a representation | Feature map / activation channel |
| Restoration | Removing noise to reveal the image underneath | Denoising step in diffusion |


---
# FILE: signal-ward.md
---

# Signal Ward — NLP & Medical Text

> **COMING SOON** — Signal Ward is the third theme in TensorCraft. It is currently in development. The script below contains the full narrative design, character profiles, and module outlines. Lesson-level detail will be added during production.

---

## SCRIPT GUIDE

**Tags:** `NLP` `transformers` `BERT` `medical-text` `RAG` `clinical-AI`
**Theme:** AI-assisted clinical decision support in a hospital setting
**Setting:** Signal Ward is the advanced research wing of Caduceus Medical Center, a cutting-edge hospital and research facility. The ward processes millions of patient records, clinical notes, medical literature, and diagnostic reports. The healthcare system is drowning in unstructured text — doctors' handwritten notes digitized into messy transcripts, research papers piling up faster than anyone can read, and critical diagnostic information buried in paragraphs of clinical prose.
**Model being built:** Diagnostic One — an AI text assistant for clinical NLP
**GitHub repo deployed at end:** `diagnostic-one-clinical-nlp`

### Characters

| Name | Role | Description |
|---|---|---|
| **Dr. Elena Vasquez** | Head Researcher / Mentor | Director of Signal Ward. Brilliant diagnostician, demanding but empathetic. Lost a patient early in her career due to a missed note in a chart — this drives her mission. Sets clinical context and explains *why* each NLP capability matters. Has no patience for sloppy work but infinite patience for genuine learning. |
| **Obi Nwosu** | Computational Linguist / Concept Explainer | NLP expert with a PhD in biomedical NLP. Warm, articulate, deeply enthusiastic about language. Speaks three languages fluently and sees beauty in how words carry meaning. Introduces NLP theory, explains architectures, builds linguistic intuition. |
| **Santos** | Nurse & Data Curator / Implementation Lead | Handles data quality, labeling, and the messy reality of clinical text. Practical, meticulous, protective of patient data. Has labeled ten thousand records by hand. Bridges the gap between raw medical records and clean training data. |
| **Khalil Mensah** | Bioethicist & Health IT / Student Avatar | The player character. A skilled frontend developer working in Caduceus Medical Center's IT department. Strong JS/TS skills, no ML background. Thoughtful, principled, detail-oriented. He asks uncomfortable ethical questions that make the system better. Tasked with building the Diagnostic One interface after the hospital's vendor solution failed. Previously built Meridian General's patient records UI — a React app that displayed charts, lab results, and medication histories but couldn't surface relevant information. The data was all there — drug interactions hiding across tabs, symptom patterns buried in months of notes — but his frontend could only *display* it, never *understand* it. Khalil knows the data is there; he just couldn't make it smart. Now he gets to fix that at the ML level. |
| **MEDI** | Clinical Decision Support AI | The ward's AI assistant. Precise, helpful, occasionally pedantic about medical terminology. Unlike other theme AIs, MEDI is designed to be cautious — it flags uncertainty rather than projecting confidence. Corrects gently but firmly. Tutorial guide and hint system. |

### DISCLAIMER

> **IMPORTANT: Signal Ward is an educational simulation.** The clinical scenarios, patient data, and medical information presented in this theme are entirely fictional and created for teaching NLP concepts. Nothing in this course constitutes medical advice. The AI systems built in this course are educational demonstrations and must never be used for real clinical decisions. Real clinical NLP systems require extensive validation, regulatory approval (FDA/CE), and oversight by licensed medical professionals.

### AI-Wrong Moments

Signal Ward deliberately includes moments where the AI system produces incorrect or misleading outputs, teaching students to build systems that handle failure gracefully:

- **Module 6 (Transformers & BERT):** MEDI misinterprets temporal context in a clinical note — confusing a patient's *history* of a condition with a *current* diagnosis. The sentence "History of Type 2 diabetes, resolved after bariatric surgery" gets classified as an active condition. Khalil learns to build temporal-aware models with negation detection.
- **Module 8 (Text Classification):** MEDI generates a clinical summary that is linguistically fluent but factually wrong — it hallucinates a medication dosage that appears nowhere in the source notes. The summary reads convincingly, making the error harder to catch. The team learns about hallucination detection and grounding.
- **Module 11 (Capstone):** MEDI flags a false positive — an urgent drug interaction alert for a patient who is actually stable. Dr. Vasquez uses this as a teaching moment: "This is why AI assists but never decides. The false positive costs us 3 minutes of review. A false negative could cost a life."

### Career Paths & Salaries

| Path | Description | Avg Salary (US) |
|---|---|---|
| NLP Engineer | Build text understanding and generation systems | $145,000 - $195,000 |
| Clinical NLP Specialist | Apply NLP to healthcare data and clinical text | $140,000 - $190,000 |
| ML Engineer (NLP) | Train and deploy language models at scale | $150,000 - $200,000 |
| AI Safety / Alignment Engineer | Build guardrails and safety systems for AI outputs | $155,000 - $210,000 |
| Healthcare AI Product Manager | Bridge clinical needs and AI capabilities | $135,000 - $185,000 |

---

## COMING SOON PREVIEW

### Preview Art

A hospital corridor at night. Fluorescent lights cast a blue-white glow on polished floors. In the foreground, Khalil sits at a workstation in the IT office, multiple monitors showing clinical text with highlighted entities — medications in blue, conditions in amber, procedures in green. On one monitor, MEDI's interface displays a clinical summary with confidence bars next to each extracted fact. Through the glass window behind Khalil, the ICU is visible — monitors blinking, nurses moving between beds. The contrast between the quiet code and the urgent care beyond the glass captures the theme's tension.

### Story Summary

Signal Ward at Caduceus Medical Center is drowning in unstructured clinical text. Thousands of notes, reports, and discharge summaries flow through the EHR system daily, but critical information gets buried. After a vendor NLP solution fails spectacularly — misclassifying a drug allergy and triggering a near-miss adverse event — Dr. Vasquez cancels the vendor contract and decides to build an in-house system.

Khalil, a frontend developer in the IT department, is tasked with building the interface for Diagnostic One, a clinical NLP pipeline. Under the guidance of Dr. Vasquez (clinical context), Obi (NLP theory), and Santos (data quality), he learns to build text processing systems that can tokenize clinical language, extract medical entities, classify note types, summarize documents, and flag critical findings — all running in the browser for privacy and speed.

The journey is not just technical — it is ethical. Signal Ward confronts the reality that AI in healthcare must be held to a higher standard. Every module includes moments where the system fails, and the team learns to build safeguards, communicate uncertainty, and keep humans in the loop.

### Model Preview

Diagnostic One evolves across 11 modules:

1. **M1-M2:** Text preprocessor and tokenizer for clinical documents
2. **M3:** Word embedding model trained on medical vocabulary
3. **M4:** Sequence model for parsing clinical narratives
4. **M5:** Attention-enhanced model for focusing on medically relevant terms
5. **M6:** Transformer-based document understanding (BERT fine-tuned on clinical text)
6. **M7:** Named Entity Recognition for medications, conditions, procedures
7. **M8:** Text classifier for record triage and urgency scoring
8. **M9:** Question-answering system with RAG for clinical queries
9. **M10:** Production-optimized, privacy-preserving deployment
10. **M11:** Full clinical assistant with monitoring, safety guardrails, and feedback loops

---

## CONCEPT DISCLAIMER

> **This course teaches machine learning through interactive, narrative-driven lessons designed for frontend developers.**
>
> You will learn real ML — not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
>
> **Fundamentals you will master:**
>
> - Linear algebra (vectors, matrices, tensors, broadcasting)
> - Calculus (gradients, chain rule, backpropagation)
> - Probability & statistics (distributions, Bayes, likelihood)
> - Optimization (gradient descent, learning rates, convergence)
> - Information theory (entropy, cross-entropy, KL divergence)
>
> **Specialization topics (Signal Ward):**
>
> - Text processing (tokenization, vocabularies, embeddings)
> - Language modeling (n-grams, perplexity, next-token prediction)
> - Sequence modeling (RNNs, LSTMs, GRUs, bidirectional models)
> - Attention and transformers (self-attention, multi-head, positional encoding)
> - Pre-trained models (BERT, fine-tuning, feature extraction)
> - Named entity recognition (BIO tagging, span extraction)
> - Retrieval-augmented generation (RAG, vector search, grounding)
> - Clinical NLP (medical ontologies, negation detection, temporal reasoning)

---

## MODULE 1: ML THROUGH TEXT (FREE)

*Khalil is introduced to the crisis at Caduceus Medical Center and begins learning ML basics through clinical text data.*

### Summary

The hospital's vendor NLP system has failed — a misclassified drug allergy led to a near-miss adverse event. Dr. Vasquez cancels the vendor contract and tasks the IT team with building an in-house solution. Khalil, a frontend dev with strong TypeScript skills, is assigned to build the interface.

Obi introduces Khalil to the fundamentals: what ML is, how it differs from rule-based text processing, the three learning paradigms, neural network basics, and text-as-data. Each concept is grounded in clinical examples — classifying note types, extracting medication names, predicting diagnosis codes.

> **KHALIL:** "So instead of writing regex patterns for every possible drug name format, we train a model to recognize them from examples?"

> **OBI:** "Exactly. And when a new drug name appears that we never wrote a rule for, the model can still recognize it — because it learned the *pattern* of what drug names look like, not a fixed list."

> **MEDI:** "I should note that my predecessor — the vendor system — used 2,847 hand-written rules. It achieved 73% accuracy on medication extraction. I believe we can improve upon that. Carefully."

### Lessons

| # | Title | Description | FE Bridge | 5C Variation |
|---|---|---|---|---|
| 1 | The Crisis | What ML is and why it matters for clinical text | App architecture overview | Standard |
| 2 | Text as Data | Converting clinical notes to numerical representations | `JSON.parse()` on API responses | Discovery |
| 3 | Your First Classifier | A simple note type classifier | `Array.map(x => x * weight + bias)` | Broken Code First |
| 4 | Tokens and Vocabulary | Breaking text into processable units | URL parsing (`new URL()`) | Standard |
| 5 | Forward Pass | Running a simple text classifier end to end | Promise chains / middleware | Standard (with debrief elements) |

**Inter-Lesson Hooks:**

- **L1.1 → L1.2:** Khalil's first text analysis returns gibberish — turns out the input encoding is wrong. The clinical notes are UTF-8 but his pipeline assumed ASCII, mangling every accented character and special symbol.
- **L1.2 → L1.3:** The tokenizer works, but MEDI flags a problem: two patients with identical symptoms are being classified differently. One note says "chest pain," the other says "CP." Same meaning, different tokens.
- **L1.3 → L1.4:** The model runs, but Santos notices it's ignoring abbreviations that nurses use constantly — "pt," "hx," "dx," "prn." The vocabulary is built from textbooks, not from the ward.
- **L1.4 → L1.5:** The vocabulary now handles abbreviations, but the forward pass produces wildly different confidence scores for notes that say the same thing in different word orders. Sequence matters — and the model doesn't know that yet.

**FE BRIDGE (Module-Level):** Tokenization is URL parsing. When you call `new URL('https://caduceus.org/patient/12345?tab=notes&filter=active')`, the browser breaks the URL into structured parts — protocol, hostname, pathname, search params. Tokenization does the same to text: `"Patient presents with acute chest pain"` becomes `["Patient", "presents", "with", "acute", "chest", "pain"]` — structured, indexable, processable.

### GITHUB

**Commit:** `feat(m1): initial clinical text classifier with tokenization pipeline`
**Branch:** `module-01/ml-through-text`

**Cliffhanger:** The prototype catches a drug interaction that the rule-based system missed. But Khalil notices something else: the model's confidence score is suspiciously high.

---

## MODULE 2: TOKENIZATION & PREPROCESSING

*Breaking clinical text into meaningful units and preparing it for model consumption.*

### Narrative

Clinical text is uniquely messy — abbreviations (pt, hx, dx, rx), misspellings, inconsistent formatting, copy-pasted templates, and critical information buried in free-text narratives. Santos presents the messiest records she can find.

> **SANTOS:** "This record has three different abbreviations for the same medication. 'MTX,' 'methotrex,' and 'methotrexate.' If your tokenizer treats these as different tokens, your model will miss critical drug interactions."

> **OBI:** "Your router breaks `/patients/123/records` into meaningful segments. A tokenizer does the same for 'acetaminophen-induced hepatotoxicity.'"

**Unique content:** Khalil builds a clinical text preprocessing pipeline — word tokenization, subword tokenization (BPE, WordPiece), medical vocabulary handling, text normalization for clinical abbreviations, encoding/decoding pipelines, and train/val/test splitting with stratification for rare clinical categories.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Word Tokenization | Splitting text on boundaries | `String.split()` and regex patterns |
| 2 | Subword Tokenization | BPE and WordPiece algorithms | URL route parsing (`/path/:param/segment`) |
| 3 | Medical Tokenization | Handling medical abbreviations and terminology | Domain-specific parsing rules |
| 4 | Vocabulary Building | Creating and managing token dictionaries | i18n translation key dictionaries |
| 5 | Encoding & Decoding | Converting between text and token IDs | Base64 encode/decode pipeline |

### GITHUB

**Commit:** `feat(m2): clinical text tokenization with medical vocabulary handling`
**Branch:** `module-02/tokenization`

**Cliffhanger:** The tokenizer handles typed notes perfectly. Then Santos hands them a stack of handwritten charts from the overflow ward. The OCR output is barely legible.

---

## MODULE 3: WORD EMBEDDINGS

*Learning dense vector representations of medical vocabulary.*

### Narrative

Obi demonstrates word embeddings by showing that in the trained vector space, "aspirin" is closer to "ibuprofen" than to "appendectomy."

> **OBI:** "The model learned that these words live in similar contexts — because they do. Doctors use them in similar sentences. The embedding space captures this automatically."

**Unique content:** Khalil implements one-hot encoding, Word2Vec (skip-gram and CBOW), and domain-specific medical embeddings. He visualizes word relationships in vector space and learns to use pre-trained embeddings as transfer learning for clinical text.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | One-Hot Encoding | The naive approach and its limitations | Radio buttons — only one active at a time |
| 2 | Word2Vec | Learning word relationships from context | Recommendation engines ("users also bought") |
| 3 | Medical Embeddings | Domain-specific word vectors | Theme-specific design tokens |
| 4 | Embedding Visualization | Exploring word relationships in vector space | 2D scatter plots with D3.js |
| 5 | Transfer Embeddings | Using pre-trained word vectors | npm packages — reusing learned representations |

### GITHUB

**Commit:** `feat(m3): medical word embeddings with Word2Vec and visualization`
**Branch:** `module-03/word-embeddings`

**Cliffhanger:** The NER system extracts entities perfectly from typed notes. Then Santos hands them a stack of handwritten charts from the overflow ward.

---

## MODULE 4: SEQUENCE MODELS

*Processing clinical text as ordered sequences where word order changes meaning.*

### Narrative

Dr. Vasquez presents a case where word order is life-or-death: "Patient denied chest pain" vs. "Patient reported chest pain."

> **VASQUEZ:** "One word changes everything. Your model needs to understand sequence, not just vocabulary."

> **SANTOS:** "And what about 'Patient denied chest pain but later reported shortness of breath'? The negation applies to one symptom but not the other. Good luck writing regex for that."

**Unique content:** Khalil implements RNNs for text, LSTMs for long clinical narratives, and bidirectional models that read text in both directions. He builds a clinical narrative parser that extracts structured information from free-text notes.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Why Sequences Matter | Word order changes meaning in clinical text | Array order matters — React list rendering |
| 2 | RNNs for Text | Processing text word by word | `Array.reduce()` — accumulating state |
| 3 | LSTMs for Documents | Handling long clinical narratives | Session storage with selective persistence |
| 4 | Bidirectional Models | Reading text in both directions | Doubly-linked list traversal |
| 5 | Clinical Narrative Parsing | Extracting structured info from narratives | Form parsing from unstructured input |

### GITHUB

**Commit:** `feat(m4): LSTM sequence models for clinical narrative parsing`
**Branch:** `module-04/sequence-models`

**Cliffhanger:** The sequence model parses a clinical narrative and flags an unusual phrase: "symptom onset correlates with ward transfer." Four patients. Same ward. Same timeline.

---

## MODULE 5: ATTENTION MECHANISMS

*Teaching models to focus on what matters in medical text.*

### Narrative

Obi draws the attention diagram on the whiteboard:

> **OBI:** "When you read 'The patient was prescribed methotrexate for rheumatoid arthritis,' your brain automatically connects 'methotrexate' to 'arthritis.' Attention teaches the model to make that same connection."

**Unique content:** Khalil implements self-attention, multi-head attention, and attention visualization. He builds a clinical attention system that highlights medically relevant terms — drug-condition pairs, dosage-frequency relationships, and temporal markers.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | The Attention Problem | Why not all words are equally important | CSS `:focus` and `tabIndex` — directing attention |
| 2 | Self-Attention | Each word attending to every other word | `scrollIntoView()` — programmatic focus |
| 3 | Multi-Head Attention | Attending to multiple aspects simultaneously | Multiple event listeners on one element |
| 4 | Attention Visualization | Seeing what the model focuses on | DevTools highlighting of selected elements |
| 5 | Clinical Attention | Focusing on medically relevant terms | Search result highlighting |

**FE BRIDGE (Module-Level):** Attention is CSS `:focus`. When reading a clinical note, certain words demand attention — drug names, dosages, negation cues ("no", "denies", "without"). The attention mechanism learns to dynamically "focus" on these critical tokens, just as CSS `:focus` highlights the currently active form element.

### GITHUB

**Commit:** `feat(m5): attention mechanisms with clinical text visualization`
**Branch:** `module-05/attention`

**Cliffhanger:** MEDI processes its thousandth patient record and flags a cluster: twelve patients in Ward C share an unusual symptom pattern.

---

## MODULE 6: TRANSFORMERS & BERT

*The architecture that changed NLP — bidirectional understanding of clinical text.*

### Narrative

Obi introduces the transformer architecture:

> **OBI:** "Before transformers, language models read text like a scroll — left to right. BERT reads like a human — it looks at the whole sentence at once and understands each word in the context of all the others."

**AI-Wrong Moment:** MEDI misinterprets temporal context — it flags "History of Type 2 diabetes, resolved after bariatric surgery" as an active condition. The model lacks explicit temporal reasoning.

> **VASQUEZ:** "Your system just flagged a resolved condition as active. In clinical terms, that could mean unnecessary treatment. Fix it."

**Unique content:** Khalil implements the transformer architecture from first principles — scaled dot-product attention, multi-head attention, positional encoding, and the encoder stack. He fine-tunes a pre-trained BERT model for clinical text classification and learns negation detection and temporal reasoning to address the AI-wrong moment.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | From RNN to Transformer | Why self-attention replaced recurrence | React class components to hooks — paradigm shift |
| 2 | Transformer Architecture | Encoder stack with attention and feedforward | React virtual DOM — diffing and reconciliation |
| 3 | Positional Encoding | Injecting word order into attention | CSS `order` property and `z-index` stacking |
| 4 | BERT | Bidirectional understanding of text | Doubly-linked list — forward and backward traversal |
| 5 | Fine-Tuning BERT | Adapting pre-trained transformers to clinical text | Customizing a component library's theme |

**FE BRIDGES (Module-Level):**

- **Transformer = React virtual DOM:** The transformer processes input, computes attention (which parts relate to which), and produces an output representation. React's vDOM processes the component tree, computes diffs (which parts changed), and produces an updated DOM. Both are reconciliation engines that compare current state to desired state.
- **BERT = doubly-linked list:** A unidirectional model (like GPT) reads tokens left-to-right, like a singly-linked list — each node knows only what came before. BERT is bidirectional, like a doubly-linked list — each token has context from both directions. This bidirectional context is why BERT excels at understanding (classification, NER) rather than generation.

### GITHUB

**Commit:** `feat(m6): transformer architecture with BERT fine-tuning for clinical NLP`
**Branch:** `module-06/transformers-bert`

**Cliffhanger:** Diagnostic One misidentifies a drug interaction because training data used brand names and the chart uses generics.

---

## MODULE 7: NAMED ENTITY RECOGNITION

*Identifying and classifying medical entities in clinical text.*

### Narrative

The midpoint breakthrough. Dr. Vasquez needs structured information extracted from unstructured notes — medication names, dosages, conditions, procedures, anatomical locations.

> **VASQUEZ:** "I need to know, from a 3-page discharge summary, what medications the patient is on, what conditions were diagnosed, and what procedures were performed. I need it in 10 seconds, not 10 minutes."

Diagnostic One's NER system, running on a batch of previously reviewed records, flags a drug interaction between two medications in a patient's chart. Santos checks — three doctors reviewed this chart and none caught it.

> **VASQUEZ:** "This is why we are building this. Right here. This moment."

> **KHALIL:** (nodding thoughtfully) "And if it had flagged incorrectly? What does a false positive cost in a medical setting?"

**Santos Advocacy Scene:** Midway through testing, Obi proposes a model update that improves overall NER accuracy by 3.1%. Santos runs it against her ward's data and blocks the deployment.

> **SANTOS:** "Your new version is 3% more accurate overall, but it's worse on elderly patients. Medication extraction dropped 8% for patients over 75. My ward is 60% elderly. They're on more medications, with more complex interactions, and your 'improvement' makes them less safe. Roll it back."

> **OBI:** "But the aggregate numbers —"

> **SANTOS:** "Aggregate numbers don't take the wrong pill, Obi."

The team learns about subgroup performance analysis — evaluating model accuracy across patient demographics, not just in aggregate. It is a concept Santos understood before they had a name for it: the patients most at risk are often the ones the model serves worst.

**Unique content:** Khalil implements BIO tagging (Beginning, Inside, Outside), builds a sequence labeling model for medical entity extraction, handles relationship extraction between entities, and addresses the unique challenges of medical NER — drug names that are common words, nested entities, discontinuous mentions.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | NER Fundamentals | What entities are and why they matter | DOM element type identification |
| 2 | BIO Tagging | Labeling entity boundaries | HTML tag open/close matching |
| 3 | Medical NER | Recognizing drugs, conditions, procedures | Syntax highlighting in code editors |
| 4 | Relationship Extraction | Connecting entities to each other | Graph data structures / foreign keys |
| 5 | The Missed Interaction | NER catches what humans missed | Linter catching an error before production |

### GITHUB

**Commit:** `feat(m7): medical NER with BIO tagging and relationship extraction`
**Branch:** `module-07/named-entity-recognition`

**Cliffhanger:** Diagnostic One confidently diagnoses a patient. Santos overrides it based on instinct.

---

## MODULE 8: TEXT CLASSIFICATION & TRIAGE

*Categorizing and prioritizing clinical documents automatically.*

### Narrative

> **VASQUEZ:** "I need incoming records triaged automatically. Critical cases cannot wait in a queue behind routine checkups."

**AI-Wrong Moment:** MEDI generates a clinical summary that is linguistically perfect but factually incorrect — it hallucinates a medication dosage that appears nowhere in the source notes. The summary reads fluently, making the error harder to catch.

> **SANTOS:** "This is the dangerous part. The output *sounds* right. If I were not checking against the source notes, I might have missed it. We need grounding."

**Unique content:** Khalil builds multi-label text classification for clinical documents, urgency scoring for record triage, and confidence calibration so the system knows when it is uncertain. He implements hallucination detection by cross-referencing generated text against source documents.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Classification Basics | Assigning labels to documents | Email filtering (spam vs inbox) |
| 2 | Multi-Label Classification | Documents with multiple categories | Tag system with multiple selections |
| 3 | Urgency Scoring | Prioritizing records by clinical urgency | Priority queues in task management |
| 4 | Confidence Calibration | Knowing when the model is uncertain | Loading states and skeleton screens |
| 5 | Triage Pipeline | End-to-end document triage system | Request routing middleware |

### GITHUB

**Commit:** `feat(m8): text classification with urgency scoring and confidence calibration`
**Branch:** `module-08/text-classification`

**Cliffhanger:** The model confidently associates symptoms with a common condition, missing a rare disease Santos catches.

---

## MODULE 9: QUESTION ANSWERING & RAG

*Enabling natural language queries over clinical data with retrieval-augmented generation.*

### Narrative

An unconscious patient arrives in the ER with no accessible medical history. Records exist — but in a different hospital system, in a different format, partially in another language. The attending needs one answer before making a treatment decision: "Has this patient ever had an allergic reaction to penicillin?" In the old system, someone would call Meridian General, wait on hold, get transferred, and pray the night-shift clerk could pull the right file. The attending does not have that time. Diagnostic One needs to reach across systems, normalize formats, handle Spanish-language clinical notes from a previous hospital stay, and return a grounded answer with citations — in seconds, not minutes.

> **OBI:** "This is what it was all for. Natural language access to clinical knowledge — across systems, across formats, across languages."

> **SANTOS:** "The Meridian records use a completely different coding system. And half the allergy notes are free-text in Spanish from when the patient lived in Puerto Rico. If we can't normalize this, we're guessing."

> **KHALIL:** "I built Meridian's records UI. I know their data format. The allergy field is buried in a free-text 'notes' column — no one ever structured it."

**Unique content:** Khalil builds a RAG pipeline for clinical question answering — extractive QA (finding answers within documents), reading comprehension (understanding context), vector search for document retrieval, and knowledge grounding to ensure answers are supported by evidence. He implements citation linking so every generated answer points back to its source documents. The module's crisis scenario drives three additional technical challenges: cross-system retrieval (querying heterogeneous EHR formats), format normalization (mapping between coding systems), and multilingual handling (extracting medical facts from Spanish-language clinical notes).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Extractive QA | Finding answers within documents | `Ctrl+F` — finding text in a page |
| 2 | Reading Comprehension | Understanding context to answer questions | GraphQL resolvers — query-specific data fetching |
| 3 | RAG Architecture | Retrieval-augmented generation pipeline | React Server Components — server-fetched data in client UI |
| 4 | Knowledge Grounding | Ensuring answers are supported by evidence | Hyperlinks — every claim has a source URL |
| 5 | Clinical Queries | Doctors asking questions in natural language | Search bar with NLU |

**FE BRIDGE (Module-Level):** RAG is React Server Components. In RSC, the server fetches data from databases and APIs, then renders components with that data — the client gets pre-hydrated content grounded in real data sources. RAG does the same: the retrieval step fetches relevant documents (like a DB query), and the LLM generates a response grounded in those retrieved documents (like server rendering). Both patterns connect a generation engine to authoritative data sources.

### GITHUB

**Commit:** `feat(m9): RAG pipeline for clinical question answering with citations`
**Branch:** `module-09/question-answering-rag`

**Cliffhanger:** The RAG system pulls a research paper from 2019 that describes the exact symptom cluster in Ward C. It is a disease they thought was eradicated.

---

## MODULE 10: PRODUCTION NLP & PRIVACY

*Deploying Diagnostic One for real clinical use with privacy and fairness.*

### Narrative

Khalil leads the ethics and deployment review:

> **KHALIL:** "Before this goes live, I need answers. What happens when it is wrong? Who is liable? How do we ensure it does not perform worse for certain patient populations?"

> **VASQUEZ:** "Your model performs 12% worse on records written in non-standard English. That means patients from certain demographics get worse care. Is that acceptable?"

The team addresses each concern systematically. Santos builds a human-in-the-loop system where Diagnostic One surfaces findings but a clinician always confirms.

**Unique content:** Khalil implements model serving APIs, latency optimization for clinical-grade response times, HIPAA-compliant data handling, bias auditing across patient demographics, and human-in-the-loop confirmation workflows.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Model Serving | APIs for real-time NLP inference | REST API design with Express/Fastify |
| 2 | Latency Optimization | Keeping response times clinical-grade | Core Web Vitals optimization |
| 3 | Privacy & HIPAA | Handling sensitive medical data | Data encryption, secure storage, CSP headers |
| 4 | Bias Auditing | Ensuring fair performance across demographics | Accessibility auditing (a11y testing) |
| 5 | Human-in-the-Loop | Keeping clinicians in the decision loop | Confirmation dialogs — human approval gates |

### GITHUB

**Commit:** `feat(m10): production NLP with HIPAA compliance and bias auditing`
**Branch:** `module-10/production-privacy`

**Cliffhanger:** Dr. Vasquez deploys Diagnostic One to tablets across all wards. Within an hour, it flags a critical case — in the pediatric wing.

---

## MODULE 11: CAPSTONE — DIAGNOSTIC ONE

*Full deployment of the clinical text assistant with safety guardrails.*

### Narrative

Diagnostic One goes live across Signal Ward. Everything built across 10 modules comes together: the tokenization pipeline, the word embeddings, the sequence models, the attention mechanisms, the transformer-based understanding layer, the NER system, the text classifier, the RAG question-answering pipeline, and the production deployment with privacy and fairness guardrails.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | System Architecture | Designing the complete Diagnostic One system | Full-stack architecture review |
| 2 | Integration | Connecting to hospital information systems | Third-party API integration |
| 3 | Testing & Validation | Clinical validation against expert annotations | End-to-end test suites |
| 4 | Documentation & Training | Preparing staff to use the system | User documentation and onboarding |
| 5 | Go Live | Deploying Diagnostic One to Signal Ward | Production deployment and monitoring |

### CONSEQUENCE

Diagnostic One goes live. The first week produces real results: note categorization accuracy at 94%, medication extraction at 91%, and a 40% reduction in time physicians spend searching through patient records.

Then, on day 9, MEDI flags an urgent alert — a potential drug interaction between two medications prescribed by different specialists who did not know about each other's orders.

> **MEDI:** "Alert: potential interaction detected between methotrexate (prescribed by Rheumatology, 15mg weekly) and trimethoprim (prescribed by Primary Care, 160mg twice daily). Interaction severity: moderate to severe. Confidence: 87%. Recommend clinical review."

Dr. Vasquez reviews it. She pulls up both prescribing notes, checks the patient's renal function panel, and reads the interaction literature.

> **VASQUEZ:** "False positive. The medications interact in theory, but at these dosages and with this patient's renal function, the risk is negligible. Good catch, though — better a false alarm than a missed one."

Khalil nods, relieved but thoughtful.

> **KHALIL:** "So the system works, but it is not perfect."

> **VASQUEZ:** "No system is perfect, Khalil. The question is not whether it makes mistakes. The question is whether it makes fewer mistakes than the alternative — and whether we can catch the mistakes it does make. Diagnostic One does both."

> **MEDI:** "I should note that my false positive rate on drug interactions is currently 12.3%. I am working to reduce this. I would rather flag 100 false positives than miss one true interaction. I hope that is acceptable."

Dr. Vasquez looks at the screen for a long moment.

> **VASQUEZ:** "It is. Keep watching, MEDI."

The closing scene: a new patient record arrives. Diagnostic One processes it in 0.3 seconds, identifies a potential condition the admitting doctor had not considered, flags it with supporting evidence from three prior records and two journal articles. The attending physician reviews the flag, orders additional tests, and confirms the diagnosis. Santos sends a message to the team: "System caught another one. Patient is doing well."

### GITHUB

**Commit:** `feat(m11): Diagnostic One v1.0 — full clinical NLP system with safety guardrails`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/diagnostic-one-clinical-nlp`

---

### Character Arcs

**Khalil Mensah — From Skeptic to Champion**

Khalil's arc traces a principled developer who starts deeply skeptical of ML in healthcare and gradually becomes Diagnostic One's strongest advocate — without ever losing his ethical rigor.

- **M3 (Word Embeddings):** Khalil argues for keeping a rule-based backup system after watching the model struggle with edge cases in clinical abbreviations. "If this fails on 'MTX' versus 'methotrexate,' what else is it missing?"
- **M5 (Attention Mechanisms):** Khalil quietly begins using the model's output to double-check his own manual review of patient records. He does not tell anyone, but Santos notices.
- **M7 (Named Entity Recognition):** Khalil is vindicated when the model confidently misdiagnoses a patient and Santos catches the error. But he also recognizes the value of the data the model surfaced during its analysis — information no human had connected across three separate charts.
- **M11 (Capstone):** Khalil stands before the hospital administration board and defends Diagnostic One. "This system is not perfect. No system is. But it catches things we miss, it never gets tired, and it always shows its work. The question is not whether to trust it — it is whether we can afford not to use it."

---

## Theme-Specific Terminology

| Term | In-World Meaning | ML Meaning |
|---|---|---|
| Chart Note | Patient medical record entry | A single training example — the model's input format, structured or unstructured |
| Intake | New record arriving in the system | Input data |
| Triage Score | Urgency ranking determining treatment order | The model's confidence ranking, deciding which cases need human review vs. auto-processing |
| Diagnosis | Identified condition or finding | Model prediction |
| Differential | List of possible conditions ranked by likelihood | Both the diagnostic differential *and* the gradient/loss differential — the gap between prediction and truth that drives learning |
| Rounds | Regular review of active cases across the ward | A training epoch — the model "makes rounds" through the entire dataset, reviewing every case once |
| Consult | Requesting specialist input | Ensemble model query |
| Vital Signs | Patient health metrics (heart rate, BP, O2 sat) | Model health metrics — loss, accuracy, latency, throughput. If the vitals crash, the model is dying |
| Discharge Summary | Final patient record summarizing stay and outcome | Model output — the inference result, a structured summary of what the model concluded and why |
| Adverse Event | Negative patient outcome | Misclassification with consequences |
| Clinical Trial | Testing new treatment | A/B testing a model version |
| Chart Review | Manual record examination | Manual data annotation |
| STAT | Urgent / immediate priority | High-confidence critical prediction |
| Contraindication | Medical incompatibility | Constraint violation |
| Prognosis | Predicted outcome | Model forecast |
| Second Opinion | Additional expert review | Ensemble verification |


---
# FILE: terra-grid.md
---

# Terra Grid — Edge AI & MLOps

> **COMING SOON** — Terra Grid is the fifth theme in TensorCraft. It is currently in development. The script below contains the full narrative design, character profiles, and module outlines. Lesson-level detail will be added during production.

---

## SCRIPT GUIDE

**Tags:** `edge-AI` `MLOps` `quantization` `pruning` `distillation` `federated-learning` `drift-detection`
**Theme:** Global infrastructure monitoring with edge-deployed ML models
**Setting:** TERRA SYSTEMS — Terra Grid is a global industrial monitoring network managing critical infrastructure: power plants, water treatment facilities, transportation networks, and communication towers across 47 sites worldwide. The network processes petabytes of data from millions of sensors, and the AI models that analyze this data must run at the edge — on low-power devices in remote locations with intermittent connectivity. The team must build Terra Grid Intelligence, an edge AI system that monitors, predicts, and responds to infrastructure anomalies at global scale.
**Model being built:** Terra Grid Intelligence — an edge-deployed anomaly detection and prediction system
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

| Path | Description | Avg Salary (US) |
|---|---|---|
| MLOps Engineer | Build and maintain ML pipelines, deployment, monitoring | $145,000 - $195,000 |
| Edge ML Engineer | Optimize and deploy models to constrained devices | $140,000 - $190,000 |
| ML Infrastructure Engineer | Build the platforms that ML teams depend on | $150,000 - $200,000 |
| ML Reliability Engineer | Ensure ML systems are robust and performant in production | $145,000 - $195,000 |
| Data Platform Engineer | Build data pipelines, feature stores, and data infrastructure | $140,000 - $185,000 |

---

## COMING SOON PREVIEW

### Preview Art

A massive control room with walls of monitors showing a world map dotted with sensor locations — green for healthy, amber for warning, red for critical. In the center, Hassan stands before the main display, arms crossed, watching data streams flow in from 47 sites across six continents. To his right, a video call shows Cole in the field — dusty, sunlit, holding up a small edge device the size of a deck of cards. On a side monitor, GRID's utilitarian interface shows deployment status: model versions, inference latency, memory usage, drift scores. The aesthetic is industrial and operational — no glamour, just function.

### Story Summary

Terra Grid monitors critical infrastructure that millions of people depend on — power grids, water systems, transportation networks. The AI models that keep this infrastructure safe must run at the edge, on devices with 512MB of RAM, ARM processors, and intermittent satellite connectivity. A model that works in a Jupyter notebook is a hypothesis. A model that works at 3 AM on a solar farm in the Atacama Desert with no internet connection is a product.

The challenge is not just building models — it is making them survive the real world. Models that were 99.9% accurate in the lab drop to 67% in the field when sensor firmware updates change the data distribution. A 500MB model must be compressed to fit a 512MB device while leaving room for the operating system. An 8-second inference time must be cut to under 100ms for real-time anomaly detection.

Under the guidance of Hassan (production wisdom), Cole (field reality), Park (data infrastructure), and Jin (security), the student builds Terra Grid Intelligence — from baseline anomaly detection through quantization, pruning, distillation, edge deployment, MLOps pipelines, monitoring, federated learning, A/B testing, and global-scale reliability.

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
> You will learn real ML — not metaphors, not hand-waving, not "AI magic." Every concept is grounded in mathematics and implemented in working code.
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

The student arrives at Terra Grid HQ. Hassan gives the tour — walls of monitors showing sensor data from around the world. Cole video-calls from a wind farm, holding up a small edge device:

> **COLE:** "Your model needs to run on this. 512MB RAM, ARM processor, no internet until Thursday."

The student realizes this is not a typical dev environment. Hassan explains the mission: 2 million sensors generating data, models analyzing it, but models rot, data shifts, hardware fails. The student's job is to make the intelligence layer reliable.

> **HASSAN:** "A model that works in your notebook is a hypothesis. A model that works at 3 AM on a solar farm in the Atacama Desert with no internet connection — that is a product."

The 500MB model from the lab must be compressed to run on edge devices. The 8-second inference time must be cut to real-time. These constraints drive every module that follows.

> **GRID:** "Current system status: 47 sites monitored. 2,147,483 sensors active. Model version 2.8.3 deployed to 12,400 edge devices. Average inference latency: 8,234ms. Target latency: 89ms. We have work to do."

### Lessons

| # | Title | Description | FE Bridge | 5C Variation |
|---|---|---|---|---|
| 1 | Welcome to the Grid | Introduction to Terra Grid and edge computing | CDN edge locations — serving closer to users | Standard |
| 2 | Why the Edge? | Latency, privacy, connectivity constraints | Offline-first PWAs — working without a server | Discovery |
| 3 | Edge Devices | Understanding hardware constraints | Device testing matrix (mobile, tablet, desktop) | Broken Code First |
| 4 | Your First Edge Model | A simple anomaly detector for sensor data | Client-side form validation — logic at the edge | Standard |
| 5 | Edge vs Cloud Tradeoffs | When to compute locally vs remotely | CSR vs SSR — client vs server rendering | Standard (with debrief elements) |

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

The student learns to profile and benchmark, discovering that model size and speed are as important as accuracy in edge environments. This module establishes the optimization mindset that drives the rest of the theme.

**Unique content:** The student implements model profiling (measuring size, speed, memory), architecture efficiency analysis (choosing designs that are inherently efficient), computational budgets (working within hardware limits), benchmarking (standardized performance testing), and optimization strategy planning.

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Model Profiling | Measuring size, speed, and memory usage | Bundle analysis with `webpack-bundle-analyzer` |
| 2 | Architecture Efficiency | Choosing efficient model designs | Component optimization — avoiding re-renders |
| 3 | Computational Budgets | Working within hardware limits | Performance budgets in Lighthouse |
| 4 | Benchmarking | Standardized model performance testing | `performance.mark()` and `performance.measure()` |
| 5 | Optimization Strategy | Creating a plan for model compression | Build optimization checklist |

### GITHUB

**Commit:** `feat(m2): model profiling and optimization strategy`
**Branch:** `module-02/optimization-fundamentals`

**Cliffhanger:** The profiler reveals that the largest model on the Grid — the wind turbine failure predictor — is also the most critical. And it is 3x over budget.

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
| 1 | Number Formats | Float32, Float16, Int8 — precision tradeoffs | Image formats (PNG vs WebP vs AVIF) — quality vs size |
| 2 | Post-Training Quantization | Converting a trained model to lower precision | Webpack minification — same logic, smaller size |
| 3 | Quantization-Aware Training | Training with quantization in mind | Mobile-first development — designing for constraints |
| 4 | Mixed Precision | Different precision for different layers | Responsive images — different res for different contexts |
| 5 | Accuracy vs Size | Managing the quality-efficiency tradeoff | Lossy compression — acceptable quality loss for size |

**FE BRIDGE (Module-Level):** Quantization is Webpack minification. Webpack takes your source code (verbose, readable, Float32-equivalent) and minifies it (compact, optimized, Int8-equivalent). The logic is preserved but the representation is smaller. Variable names shrink from `userAuthenticationToken` to `a`. Whitespace disappears. The output does the same thing in less space — just like a quantized model.

### GITHUB

**Commit:** `feat(m3): quantization pipeline — Float32 to Int8 with 1.2% accuracy loss`
**Branch:** `module-03/quantization`

**Cliffhanger:** The quantized model hits 97.2% accuracy — acceptable. Then Jin reports from Site 23: "Your model just missed a bearing failure. The turbine seized."

---

## MODULE 4: PRUNING & DISTILLATION

*Removing what is unnecessary and teaching smaller models to be smart.*

### Narrative

Hassan introduces distillation through analogy:

> **HASSAN:** "We have a massive model that knows everything. We need a tiny model that knows just enough. The big model teaches the small one — like a senior engineer mentoring a junior."

The student builds a distilled model that is 10x smaller and 95% as accurate.

**Unique content:** The student implements weight pruning (removing unnecessary connections), structured pruning (removing entire neurons or channels), knowledge distillation (training a small student model to mimic a large teacher model), and combined optimization (pruning + quantization + distillation together for maximum compression).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Weight Pruning | Removing unnecessary connections | Tree-shaking — removing unused code |
| 2 | Structured Pruning | Removing entire neurons or channels | Dead code elimination in bundlers |
| 3 | Knowledge Distillation | Training a small model to mimic a large one | Code splitting — smaller chunks, same experience |
| 4 | Teacher-Student Training | The distillation training process | Mentor pair programming — transferring knowledge |
| 5 | Combined Optimization | Pruning + quantization + distillation together | Full Webpack production config — all optimizations |

**FE BRIDGES (Module-Level):**

- **Pruning = tree-shaking:** Webpack's tree-shaking removes unused exports from your bundle. Pruning removes unused weights from your model. Both analyze what is actually needed and eliminate the rest. A typical JavaScript bundle has 30-60% unused code. A typical neural network has 40-90% prunable weights. The principle is identical.
- **Distillation = code splitting:** Code splitting breaks a large bundle into smaller chunks that load on demand, delivering the essential experience first. Knowledge distillation breaks a large model's knowledge into a smaller model that delivers the essential predictions. Both reduce size while preserving the critical functionality.

### GITHUB

**Commit:** `feat(m4): pruning + distillation — 10x smaller, 95% accuracy`
**Branch:** `module-04/pruning-distillation`

**Cliffhanger:** The distilled model passes all lab benchmarks. Cole deploys it to Site 12 — a desert installation with 50-degree heat. The ARM processor throttles, and inference time doubles.

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

**FE BRIDGE (Module-Level):** Model sharding is dynamic `import()`. In frontend code, `dynamic import()` splits your application into chunks that load on demand — the user gets the critical path first, and additional chunks load as needed. Model sharding does the same: a large model is split across devices or loaded in parts, with the critical inference path available first and additional capabilities loading as resources permit.

### GITHUB

**Commit:** `feat(m5): edge deployment pipeline across 847 devices`
**Branch:** `module-05/edge-deployment`

**Cliffhanger:** GRID's monitoring dashboard lights up: three sites simultaneously reporting anomalous readings. The model has never seen this pattern.

---

## MODULE 6: MLOPS PIPELINES

*Automating the ML lifecycle from data to deployment.*

### Narrative

Park builds the full pipeline:

> **PARK:** "Manual retraining does not scale. When sensor data drifts, the pipeline should detect it, retrain automatically, validate, and deploy — all without human intervention."

> **HASSAN:** "With human oversight at the gates. Automated does not mean unsupervised."

**Unique content:** The student implements the full ML pipeline — data versioning (tracking dataset changes over time), experiment tracking (logging training runs and results), model registry (versioning and storing trained models), and automated retraining (triggering retraining on data changes or schedule).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | ML Pipeline Anatomy | The stages of an ML pipeline | CI/CD pipeline stages (build, test, deploy) |
| 2 | Data Versioning | Tracking dataset changes over time | Git version control for data |
| 3 | Experiment Tracking | Logging training runs and results | Test result dashboards |
| 4 | Model Registry | Versioning and storing trained models | npm registry for packages |
| 5 | Automated Retraining | Triggering retraining on data changes | GitHub Actions — event-triggered workflows |

### GITHUB

**Commit:** `feat(m6): automated MLOps pipeline with data versioning and model registry`
**Branch:** `module-06/mlops-pipelines`

**Cliffhanger:** The automated pipeline retrains and deploys a model update overnight. By morning, three sites have degraded accuracy. The pipeline worked perfectly — but the new training data was contaminated.

---

## MODULE 7: MONITORING & DRIFT DETECTION

*Watching models in production and catching silent degradation.*

### Narrative

The midpoint crisis. GRID alerts:

> **GRID:** "Alert: Region 4 wind turbine cluster. Prediction accuracy degraded from 96.2% to 89.1% over 14 days. Drift score exceeding threshold. Recommended action: investigate data pipeline and retrain."

The team scrambles. Park investigates — the sensor firmware was updated two weeks ago, changing the data distribution. The models were trained on the old distribution and are now seeing data they do not understand.

> **HASSAN:** "This is why we monitor. Without drift detection, we would not have caught this for months. Equipment could have failed. People could have been hurt."

The team retrains and redeploys within hours.

**Unique content:** The student implements production monitoring (tracking model health in real time), data drift detection (statistical tests for distribution shift), model drift detection (tracking prediction quality degradation), alert systems (configuring meaningful thresholds), and drift response procedures (diagnosis, retraining, redeployment).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Production Monitoring | Tracking model health in real time | Application monitoring (Sentry, DataDog) |
| 2 | Data Drift | When input data changes over time | Lighthouse CI regression — detecting performance changes |
| 3 | Model Drift | When predictions degrade silently | Visual regression testing |
| 4 | Alert Systems | Configuring meaningful alerts | Alerting thresholds in monitoring tools |
| 5 | Drift Response | Diagnosing and fixing drift incidents | Incident response and rollback procedures |

**FE BRIDGE (Module-Level):** Drift detection is Lighthouse CI. Lighthouse CI runs on every commit and compares performance metrics against a baseline — if Time to Interactive regresses by more than 10%, the build fails. Drift detection does the same for ML models: it continuously compares model performance against a baseline, and if accuracy degrades beyond a threshold, it triggers an alert. Both are automated regression detection systems that catch silent degradation before users notice.

### GITHUB

**Commit:** `feat(m7): monitoring and drift detection with automated alerting`
**Branch:** `module-07/monitoring-drift`

**Cliffhanger:** The A/B test results are in. Model B outperforms Model A by 12% — but Model B was trained on data from a site that no longer exists.

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
| 1 | The Data Silo Problem | When data cannot be centralized | CORS — data boundaries between origins |
| 2 | Federated Averaging | Combining model updates from distributed training | State sync across browser tabs |
| 3 | Privacy Preservation | Keeping data local while improving models | Cookie isolation and third-party restrictions |
| 4 | Communication Efficiency | Minimizing data transfer during training | GraphQL — requesting only needed data |
| 5 | Secure Aggregation | Protecting individual updates during aggregation | End-to-end encryption in messaging |

### GITHUB

**Commit:** `feat(m8): federated learning across distributed sites`
**Branch:** `module-08/federated-learning`

**Cliffhanger:** The federated model converges faster than expected — but one region's weight updates are statistically anomalous. Jin: "Either that region has genuinely different data, or someone is poisoning the training."

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
| 1 | Why A/B Test Models? | Validating improvements before full rollout | Feature flags — toggling for subsets of users |
| 2 | Traffic Splitting | Routing requests to different model versions | Canary deployments with load balancer routing |
| 3 | Statistical Significance | Knowing when results are meaningful | Analytics confidence intervals |
| 4 | Canary Deployments | Gradual rollout with automatic rollback | Canary releases for frontend apps |
| 5 | Multi-Armed Bandits | Adaptive traffic allocation | Dynamic ad rotation — allocating to best performers |

**FE BRIDGE (Module-Level):** A/B testing models is feature flags. In frontend development, feature flags let you deploy new code but only enable it for a subset of users — you measure the impact, and if the new version is better, you roll it out to everyone. If it is worse, you kill the flag and no one notices. A/B testing models works identically: deploy a new model version to a subset of edge devices, measure performance, and only promote to full rollout after statistical validation.

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

The student watches the system scale, route, and respond. Some edge devices lose connectivity — the system degrades gracefully. Models fall back to cached predictions. When connectivity returns, they sync and update.

> **HASSAN:** "Everything fails eventually. The question is: does it fail well?"

**Unique content:** The student implements scaling strategies (horizontal and vertical for ML systems), model sharding (splitting models across devices), failover and redundancy (graceful degradation when components fail), load management (handling traffic spikes and batch processing), and global operations (managing ML across time zones and regions).

### Lessons

| # | Title | Description | FE Bridge |
|---|---|---|---|
| 1 | Scaling Strategies | Horizontal and vertical scaling for ML | Auto-scaling web servers |
| 2 | Model Sharding | Splitting models across devices | Dynamic `import()` chunks — code splitting for models |
| 3 | Failover & Redundancy | Graceful degradation when components fail | Error boundaries and fallback UI |
| 4 | Load Management | Handling traffic spikes and batch processing | Rate limiting and request queuing |
| 5 | Global Operations | Managing ML across time zones and regions | CDN multi-region deployment |

### GITHUB

**Commit:** `feat(m10): global scale with failover and redundancy`
**Branch:** `module-10/scale-reliability`

**Cliffhanger:** A security audit reveals that an adversarial sensor reading could trick the model into ignoring a critical equipment failure.

---

## MODULE 11: CAPSTONE — TERRA GRID INTELLIGENCE

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

> **HASSAN:** "And by then, the cascade would have reached the residential grid. Cole — status?"

> **COLE:** (from the field, en route) "I see the alert. On my way. The model is right — cooling pump failure, classic signature. ETA 47 minutes. The backup system should hold until I get there."

> **GRID:** "Incident timeline: Time to detection: 4.2 seconds. Time to root cause: 11.7 seconds. Time to response dispatch: 23 seconds. Model: Terra Grid Intelligence v1.0. Inference latency: 89ms. Model size: 4.2MB. Running on 12,400 edge devices across 47 sites. All systems nominal."

Hassan watches the dashboard. The cascade stabilizes. Cole arrives and replaces the cooling pump. The infrastructure holds.

> **HASSAN:** (quietly) "This is what it looks like when the system works."

### GITHUB

**Commit:** `feat(m11): Terra Grid Intelligence v1.0 — global deployment across 47 sites`
**Branch:** `module-11/capstone`
**Deploys to:** `https://<username>.github.io/terra-grid-intelligence`

---

## AI-Wrong Moments

These are specific narrative beats where Terra Grid Intelligence fails, teaching the team (and the learner) that production ML systems must be robust against real-world conditions.

1. **M3 — Quantization Misses a Bearing Failure:** The quantized model hits 97.2% accuracy overall — within acceptable thresholds. But at Site 23, it misses a bearing failure and the turbine seizes. The quantization reduced precision in exactly the frequency range where bearing vibration signatures live. Cole: "97.2% accuracy means nothing to the turbine that seized. The 2.8% is not distributed randomly — it clusters in the failure modes that matter most." The team learns that aggregate accuracy can hide critical failures in specific categories.

2. **M7 — A/B Test Winner Trained on Stale Data:** The A/B test results show Model B outperforming Model A by 12%. The team almost promotes it to production. Then Park discovers Model B was trained on data from a decommissioned site — data that no longer reflects current operating conditions. The model performs well on the test set because the test set is also stale. Hassan: "The model is not better. The benchmark is wrong."

3. **M10 — Adversarial Sensor Bypass:** A security audit reveals that carefully crafted adversarial sensor readings can trick the anomaly detection model into classifying a genuine equipment failure as normal operation. Jin demonstrates: "I can make the model ignore a cooling system failure by adding a specific noise pattern to the temperature sensor. The model sees 'normal.' The equipment overheats." The team implements adversarial input validation as a critical safety layer.

---

## Character Arcs — Dr. Nina Park (Skeptic)

Park's arc traces a data engineer who starts by viewing ML as overhyped and gradually becomes a champion of MLOps — not because she fell in love with models, but because she found the engineering discipline that makes ML actually work.

1. **M3 — "99.2% accuracy should be enough."** Park is skeptical of the optimization effort. The model works in the lab. Why spend weeks compressing it? Her background is in data infrastructure, not model development. She views the optimization as unnecessary polish on a working system.

2. **M5 — Deployment Reality:** Park watches Jin struggle with model latency in the field — a model that runs in 200ms on her workstation takes 8 seconds on the edge device. She realizes that deployment is not a footnote; it is the entire challenge. "I have been building pipelines that deliver data to models. I never thought about delivering the models themselves."

3. **M7 — Writing Deployment Scripts:** After the drift incident in Module 7, Park starts writing deployment scripts herself. She builds the automated retraining pipeline and insists on human-in-the-loop gates at every promotion step. "I trust automation for retraining. I do not trust automation for deployment. A human reviews every model before it touches production."

4. **M11 — The Conference Talk:** In the capstone, Park presents the team's MLOps pipeline at an infrastructure reliability conference. She has become the team's strongest advocate for treating ML systems as production software — versioned, tested, monitored, and maintained. "The model is 5% of the work. The pipeline is the other 95%. And the pipeline is what keeps the lights on."

---

## Theme-Specific Terminology

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

