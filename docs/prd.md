# TensorCraft PRD v3.4

> **Product Requirements Document — Version 3.4**
> Last updated: 2026-03-13 (audit fixes: accessibility hardening, user menu, checkout button, admin API + rate limiting + error tracking, new DB tables, CI/CD pipeline additions)

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

- **Demographics:** 5–15 years software engineering. Wants to add ML skills to expand into ML-enhanced frontend roles or ML-integrated product teams. May have some Python but prefers JavaScript.
- **Job to be done:** "Give me a structured path with a portfolio project that proves I understand ML, so I can build ML-powered features and collaborate with data science teams."
- **Realistic outcome:** ML-Enhanced Frontend Engineer / Frontend Engineer with ML Specialization ($120K-$160K). For full ML engineering roles, Tensorcraft provides the conceptual foundation; graduates will also need Python fluency and deeper mathematics.
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
| 1 | Deep Orbit | Space exploration | Time-Series & Signals | RNN, LSTM, Autoencoder, Anomaly Detection | **Launch theme** |
| 2 | Neon Protocol | Cyberpunk | Computer Vision | CNN, Object Detection, Segmentation, GAN | Coming soon |
| 3 | Signal Ward | Medical | NLP & Text | RNN, LSTM, Transformer, BERT, NER | Coming soon |
| 4 | Nova Canvas | Creative AI | Multimodal & Generative | GAN, VAE, Diffusion, CLIP | Coming soon |
| 5 | Terra Grid | Industrial | Edge AI & Production ML | Quantization, Pruning, Federated Learning | Coming soon |

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
| 2 | OAuth providers | P0 | GitHub OAuth (via Supabase Auth, PKCE flow) and Google OAuth. Request minimal scopes at signup; `repo` scope requested later if GitHub integration is enabled. |
| 3 | Email magic link | P0 | Passwordless email login via Supabase Auth email provider. Input field + "Send Magic Link" button. Link expires after 15 minutes. |
| 4 | Onboarding flow | P1 | 6-step post-signup flow: (1) Welcome screen with "Welcome Aboard the Archimedes" + 3 feature cards, (2) Your Background (5 options, saved to `fe_background`), (3) Your Goal (5 options, saved to `learning_goal`), (4) Your Framework — React/Vue/Angular/Svelte/Vanilla with live bridge preview (saved to `fe_framework`), (5) Theme selection with Deep Orbit pre-highlighted, (6) Ready — configuration summary + "Begin First Lesson" CTA. Stepper indicator shows progress through all 6 steps. |
| 5 | Onboarding persistence | P1 | Onboarding completion stored in user profile; completed users skip directly to dashboard on future logins. |
| 6 | Paywall / upgrade modal | P0 | Modal shown when a free-tier user attempts to access Module 2+. Displays feature comparison, price, and upgrade CTA. Dismissible — user returns to accessible content. |
| 7 | Bridge Explorer (V1.0) | P2 | Standalone browsable directory of all 50+ FE-to-ML bridges. Search by FE or ML concept. Filterable by theme and category. Links back to relevant lessons. Planned for V1.0 release. |
| 8 | Capstone completion screen | P1 | Celebratory screen shown after completing all 11 modules of a theme. Displays: completion stats (modules, lessons, bridges mastered, time invested), simplified journey map showing all modules complete, narrative conclusion with character appearances, "Download Certificate" and "Share Progress" CTAs, "Push to GitHub" link, and "What's Next" suggestions (explore another theme, browse bridges, view dashboard). |
| 9 | User menu component | P0 | Authenticated header dropdown with auth-state detection. Shows avatar (Supabase user metadata or fallback initials), display name, and a dropdown menu with links to Dashboard, Settings, and Sign Out. Unauthenticated state shows "Sign In" button. Sign-out calls Supabase `signOut()` and redirects to landing page. |

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
| 8 | Checkout button client component | P0 | Client component (`"use client"`) that initiates a Stripe Checkout session via the Hono API (`POST /api/checkout`), passing `themeId`, `tier`, and `userId`. On success, redirects the browser to the Stripe-hosted checkout URL. Displays loading spinner during session creation. Handles errors with inline toast notification. |

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
| Styling | Tailwind CSS 4 + CSS custom properties | Tailwind for utility-first layout; CSS custom properties for per-theme theming via `data-theme` attribute |
| ML runtime | TensorFlow.js (tfjs-core + tfjs-layers) | Runs models in-browser via WebGL backend; WASM fallback for unsupported GPUs |
| Code editor / exercises | Sandpack (@codesandbox/sandpack-react) | Browser-based sandbox for interactive exercises with Jest-style test runner |
| Syntax highlighting | Shiki 4.x | Lazy-loaded, cached singleton; `github-dark-default` theme; supports TS/JS/Python/JSON/Bash/YAML/MDX |
| API layer | Hono (separate service, port 3001) | REST API on `@hono/node-server`; independent deployment and scaling from Next.js frontend |
| Database | Supabase (PostgreSQL) | Serverless-friendly; row-level security for multi-tenant data. Additional tables: `streaks` (per-theme streak tracking with `current_streak`, `longest_streak`, `last_activity_date`), `achievements` (user achievement badges with `badge_type`, `earned_at`, `theme_id`), `exercise_attempts` (exercise submission history with `user_id`, `exercise_slug`, `submitted_code`, `passed`, `score`, `attempted_at`) |
| Auth | Supabase Auth via `@supabase/ssr` | Providers: GitHub OAuth (PKCE), Google OAuth, email magic link. Cookie-based session management via Next.js middleware. |
| Content pipeline | MDX 3 + Velite (Zod schemas) | Build-time validation; missing/invalid fields = build error. 3 collections: lessons, exercises, modules. |
| Hosting | Vercel (frontend) + Fly.io/Railway (API, planned) | Edge functions for PPP lookup; ISR for lesson content pages |
| Build orchestration | Turborepo + pnpm workspaces | `build:content` runs before `build` via task dependency graph |

### 5.2 Packages (Monorepo)

| Package | Path | Description |
|---|---|---|
| `@tensorcraft/web` | `apps/web` | Next.js 15 application — all user-facing pages, server/client components, and Next.js API routes (OG image generation) |
| `@tensorcraft/api` | `apps/api` | Hono REST API service — health, waitlist, progress, payments (Stripe), profiles, and exercise-attempts endpoints. Includes admin API endpoints (`GET /api/admin/stats`, `GET /api/admin/waitlist`) protected by API key authentication (`X-API-Key` header). All endpoints are rate-limited via Upstash Redis (`@upstash/ratelimit`) with automatic in-memory fallback when Redis is unavailable. Structured JSON error logging via error-tracking utility (Sentry-compatible `captureException` interface). |
| `@tensorcraft/ui` | `packages/ui` | Shared React component library for MDX content rendering: CodeBlock (Shiki), Exercise (Sandpack), Dialogue, BridgeCallout, HintPanel, Quiz, LearningObjectives, KeyTakeaways |
| `@tensorcraft/content` | `packages/content` | MDX lesson files, exercise YAML files, module metadata, Velite config, Zod schemas, and content query API |
| `@tensorcraft/supabase` | `packages/supabase` | Supabase client/server instances, database type definitions, migrations (6 files), seed scripts, and admin operations |
| `@tensorcraft/themes` | `packages/themes` | 5 theme manifests (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) with TypeScript configs and CSS custom properties |
| `@tensorcraft/shared` | `packages/shared` | Shared constants (THEME_SLUGS, PRICING, ROUTES, V05_SCOPE, THEME_CONTENT), 50+ FE-to-ML bridge definitions, and shared TypeScript types |
| `@tensorcraft/config` | `packages/config` | Shared ESLint, TypeScript, and Tailwind configurations |

### 5.3 Content Pipeline

Lesson content is authored in **MDX** files stored in the `@tensorcraft/content` package and compiled at build time by **Velite** with **Zod schema validation**. Three collections are defined:

1. **Lessons** (`**/*.mdx`) — Front matter validated by Zod: `slug`, `title`, `moduleId`, `themeId`, `order`, `estimatedMinutes`, `difficulty` (beginner/intermediate/advanced), `context` (narrative + speaker), `concept` (explanation + optional bridge with tier), `consequence` (narrative + next-lesson teaser), `hints` (3-level: nudge/guidance/solution), `keywords`. Body is compiled MDX with embedded components.
2. **Exercises** (`**/exercises/*.yaml`) — `slug`, `lessonSlug`, `title`, `instructions`, `starterCode`, `solutionCode`, `testCode`, `estimatedMinutes`, `difficulty`.
3. **Modules** (`**/module.yaml`) — `slug`, `title`, `themeId`, `order`, `description`, `lessonCount` (always 5), `prerequisites`, `track` (foundations/specialization).

**Build step:** Velite compiles MDX to JavaScript and outputs to `.velite/` directory. Turbo task dependency ensures `build:content` runs before `build`. Strict mode fails the build on any invalid frontmatter. Content is queried at runtime via `packages/content/src/queries.ts` (getModules, getModuleLessons, getLesson, getExercise, getAdjacentLessons).

**MDX components** (8 in `packages/ui/src/mdx/`): `<Dialogue>`, `<BridgeCallout>`, `<CodeBlock>` (Shiki), `<HintPanel>` (3-level progressive), `<LearningObjectives>`, `<KeyTakeaways>`, `<Exercise>` (Sandpack), `<Quiz>` (multiple-choice with feedback).

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

### 6.1 Design Aesthetic — Brutalist Terminal

The UI follows a "Brutalist Terminal" aesthetic: sharp edges, offset shadows, monospace-first typography. Dark mode only. No glow effects, no glassmorphism.

**Shell tokens** (shared across all pages):

| Token | Value | Usage |
|---|---|---|
| Background | `#1C1C1C` | Page background |
| Surface (Panel) | `#252525` | Cards, panels |
| Surface (Overlay) | `#313131` | Elevated surfaces, dropdowns |
| Primary | `#6BAA8A` | Buttons, links, active states |
| Text | `#C8C8C8` | Body text |
| Muted | `#8A8A8A` | Secondary text (WCAG AA on `#1C1C1C`) |
| Border | `#2A2A2A` | Dividers, card borders |
| Code BG | `#161616` | Code block backgrounds |

**Key design rules:**

- Zero border-radius everywhere
- Offset box shadows: `4px 4px 0 rgba(107,170,138,0.25)`
- JetBrains Mono as primary font; Inter for body paragraphs
- Solid nav: 60px, no blur
- `// COMMENT` style section labels
- Buttons: square, offset shadow on hover with `translate(-2px,-2px)`

### 6.2 Theme Colors

Each theme has a distinct color palette within the lesson content area. Colors are defined as CSS custom properties (`--tc-*`) and toggled via a `data-theme` attribute on `<html>`.

**ThemePalette interface** (`packages/themes/src/types.ts`): `bg`, `primary`, `accent`, `surface`, `surfaceOverlay`, `text`, `muted`, `border`, `codeBg`.

| Theme | Primary | Accent | Background | Surface |
|---|---|---|---|---|
| Deep Orbit | `#7B68EE` | `#F0C75E` | `#0B0D1A` | `#16213E` |
| Neon Protocol | `#00D4FF` | `#FF2D7B` | `#0A0A0F` | `#151520` |
| Signal Ward | `#2ECC71` | `#5B8DEF` | `#0A1628` | `#132238` |
| Nova Canvas | `#FF6B6B` | `#A78BFA` | `#0D0D1A` | `#1A1A30` |
| Terra Grid | `#F59E0B` | `#10B981` | `#111827` | `#1F2937` |

### 6.3 Typography

| Element | Font | Weight | Size (desktop) | Size (mobile) | Line Height |
|---|---|---|---|---|---|
| H1 (page title) | JetBrains Mono | 800 (Extra Bold) | 2.5rem (40px) | 1.75rem (28px) | 1.2 |
| H2 (section title) | JetBrains Mono | 700 (Bold) | 2rem (32px) | 1.5rem (24px) | 1.25 |
| H3 (subsection) | JetBrains Mono | 600 (Semi Bold) | 1.5rem (24px) | 1.25rem (20px) | 1.3 |
| Body | Inter | 400 (Regular) | 1rem (16px) | 1rem (16px) | 1.6 |
| Code | JetBrains Mono | 400 (Regular) | 0.875rem (14px) | 0.8125rem (13px) | 1.5 |
| Caption / label | JetBrains Mono | 500 (Medium) | 0.75rem (12px) | 0.75rem (12px) | 1.4 |
| Button | JetBrains Mono | 600 (Semi Bold) | 0.875rem (14px) | 0.875rem (14px) | 1.0 |

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
| Week 7 | Integration testing | Full walkthrough of 15 lessons; fix content bugs; accessibility audit. **CI pipeline includes:** Playwright E2E tests (auth flows, lesson navigation, checkout) run on every PR; content completeness validation tests (verify all modules have 5 lessons, required frontmatter fields present, exercise files exist); ESLint enforced via pre-commit hooks (Husky + lint-staged). |
| Week 8 | Beta launch | Deploy to `beta.tensorcraft.dev`; invite 500 waitlist users |

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

Team pricing (5-seat, 10-seat, and site licenses) planned for post-V1.0. See product-plan.md for future pricing strategy.

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
| 8 | Accessibility compliance | Medium | Medium | Complex interactive components (editor, progress diagram, canvas) may not meet WCAG 2.2 AA | Conduct accessibility audit before each release; use `aria-live` regions for dynamic content; provide text-only alternatives for visual components. **Audit fixes completed:** skip-to-content link on all pages; `sr-only` or visible labels on all form inputs; `aria-pressed` on filter toggle buttons; `aria-label` on OAuth buttons and SVG icons; focus trap and focus restore on modals; `role="progressbar"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax` on progress bars; color-only indicators supplemented with text labels. |
| 9 | Competitor response | Medium | High | Established platforms (freeCodeCamp, Codecademy, Scrimba) launch similar FE-to-ML courses | Differentiate on bridge pedagogy and themed worlds; build community moat; move fast on content — first-mover advantage in this niche is significant |

---

## 11. Appendix

### A. Deep Orbit Module Map

The Deep Orbit theme comprises 11 modules, each containing 5 lessons. Modules 1–3 and 6 cover shared core ML concepts (foundations track), while Modules 4–5 and 7–10 dive into the theme's specialization (signal processing, recurrent networks, anomaly detection, LLM integration, optimization). Module 11 is the capstone.

All 11 modules are fully authored with 55 lessons and 56 exercises.

#### Foundations Track (Modules 1–3, 6)

| Order | Slug | Title | Description |
|---|---|---|---|
| 1 | `foundations` | Tensors & Data | Board the Archimedes and master tensors, shapes, and operations — the building blocks of every ML model |
| 2 | `neural-networks` | Neural Networks: Layers & Architecture | Build your first neural network from scratch — neurons, layers, and activations |
| 3 | `training-loop` | Training: Loss, Gradients & Optimization | Train the DEEP SCAN classifier — loss functions, gradient descent, and the training loop |
| 6 | `browser-runtimes` | Browser ML Runtimes | Deploy models in the browser with TensorFlow.js, ONNX Runtime Web, and WebGPU |

#### Specialization Track (Modules 4–5, 7–10)

| Order | Slug | Title | Description |
|---|---|---|---|
| 4 | `signal-processing` | Signal Processing | FFT, spectrograms, and windowing — transforming raw time-series into rich features |
| 5 | `recurrent-networks` | Recurrent Networks | RNNs, LSTMs, and GRUs — networks that remember past inputs and predict sequences |
| 7 | `anomaly-detection` | Anomaly Detection | Autoencoders, reconstruction error, and anomaly scoring — flagging what deviates from normal |
| 8 | `advanced-time-series` | Advanced Time-Series | Attention mechanisms, temporal CNNs, Kalman filters, and model ensembles |
| 9 | `llm-integration` | LLM Integration | Prompt engineering, RAG over signal logs, and multi-model orchestration |
| 10 | `optimization-edge` | Optimization & Edge | Quantization, pruning, caching, and WebGPU acceleration — shrink and speed up models |

#### Capstone (Module 11)

| Order | Slug | Title | Description |
|---|---|---|---|
| 11 | `capstone` | Capstone: Deploy DEEP SCAN | System architecture, CI/CD pipeline, monitoring, documentation, and production launch |

---

*End of TensorCraft PRD v3.2*
