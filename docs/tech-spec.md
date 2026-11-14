# Tensorcraft Technical Specification v3.4

**Version:** 3.4
**Last Updated:** 2026-04-21
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
7. [UI Components, Visualizations, and Accessibility](#7-ui-components-visualizations-and-accessibility)
8. [Internationalization [DESCOPED TO POST-V1.0]](#8-internationalization-descoped-to-post-v10)

---

## 1. Platform Architecture

### 1.1 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | SSR/SSG hybrid rendering, file-based routing, React Server Components |
| Backend API | Hono (standalone service) | Lightweight, high-performance HTTP server for API endpoints (auth callbacks, progress CRUD, payment webhooks) |
| Language | TypeScript 5.4 | End-to-end type safety across monorepo packages |
| Styling | Tailwind CSS 4 | Utility-first CSS with `@world` directive for CSS-native theming; no CSS Modules needed |
| Content | MDX 3 + Velite (Zod schemas) | Type-safe lesson content with build-time frontmatter validation. Missing fields cause build errors, not runtime errors. |
| Code Highlighting | Code Hike (Shiki-based) | Scrollytelling code walkthroughs, annotations, step-based tutorials, JS-to-ML bridge side-by-side code comparisons |
| Code Exercises | Sandpack (CodeSandbox) | In-browser code editor and runtime for hands-on ML exercises |
| Email | Kit (ConvertKit) | Waitlist capture, per-world segmented lists, 11-email nurture sequence, launch emails |
| Database | Supabase (PostgreSQL) | User data, progress tracking, authentication, row-level security |
| Auth | Supabase Auth + GitHub OAuth | Passwordless and social login; GitHub token acquisition for repo integration |
| Payments | Stripe Checkout + Webhooks | Subscription billing, one-time purchases, webhook-driven fulfillment |
| Hosting | Vercel (web) + Fly.io / Railway (api) | Edge-optimized frontend delivery; independently deployed backend |
| Monorepo | Turborepo + pnpm workspaces | Parallel builds, dependency caching, shared package management |
| CI/CD | GitHub Actions | Automated testing, linting, preview deployments, content validation. Playwright E2E tests run after unit tests. ESLint added to lint-staged pre-commit hooks alongside Prettier. |

> **Note:** The current implementation uses Hono as a separate backend service (`apps/api` on port 3001) rather than Next.js API routes, enabling independent deployment and scaling. The Hono backend handles auth callbacks, progress CRUD, and payment webhooks. This architectural decision allows the frontend and backend to be deployed, versioned, and scaled independently --- the Next.js app on Vercel's edge network and the Hono API on a long-running process host such as Fly.io or Railway.
>
> **Admin API Endpoints:**
>
> - `GET /api/admin/stats` --- Dashboard stats (waitlist, users, purchases, revenue). Requires `x-admin-key` header.
> - `GET /api/admin/waitlist` --- Paginated waitlist entries. Requires `x-admin-key` header. Query params: `page`, `limit`.
>
> **Product API Endpoints (landed Phase 11):**
>
> - `POST /api/certificates` --- Generate a completion certificate for a user + world (called automatically from the capstone page on completion). Returns the certificate id + verification URL.
> - `GET /api/certificates/:id` --- Public, unauthenticated fetch of a certificate payload for verification rendering.
> - `GET /api/progress/activity/daily` --- Daily lesson/exercise activity buckets for dashboard and streak display.
> - `PATCH /api/onboarding` --- Persists the 5-step onboarding state. Accepts `experience_level` (enum: `beginner` | `intermediate` | `advanced` | `expert`) and `learning_goal` (enum: `hobby` | `career` | `research` | `team` | `curiosity`) per migration 018, in addition to the existing `display_name`, `github_username`, and `preferred_world_id` fields.
>
> **Note:** Tailwind CSS 4 (not Tailwind + CSS Modules) is used with the `@world` directive for CSS-native theming. World tokens are defined in CSS custom properties and consumed via `@world` blocks, eliminating the need for JavaScript-based world switching or CSS Modules. Each world package exports a CSS file with its `@world` overrides.

### 1.2 Monorepo Structure

| Package | Purpose | Key Contents |
|---------|---------|-------------|
| `apps/web` | Next.js 15 frontend application | Pages, layouts, route groups, client components, MDX rendering |
| `apps/api` | Hono backend service | REST endpoints, middleware, auth callbacks, Stripe webhooks, Supabase client |
| `packages/ui` | Shared UI component library (`@tensorcraft/ui`) | Design system primitives (Button, Card, Modal, CodeBlock, ProgressBar) plus subpath exports: `./visualizations` (SkillRadar, LossCurve), `./effects` (ParticleField, BridgeTicker), `./a11y` (FocusTrap). See §7 for component inventory. |
| `packages/config` | Shared configuration | TypeScript configs, ESLint presets, Tailwind world tokens, shared constants |
| `packages/supabase` | Database layer | Schema migrations, seed data, typed client, RLS policies, Edge Functions |
| `packages/worlds` | World asset packages | Per-world CSS (`@world` overrides), illustrations, mascot SVGs, copy variants |
| `packages/content` | Content source files | MDX lessons, exercise definitions, frontmatter schemas, validation scripts |
| `packages/analytics` | Analytics abstraction | Event definitions, PostHog client wrapper, type-safe tracking functions |

### 1.3 Environment Variables

Required env vars for the API service (`apps/api`):

| Variable | Description | Required |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes |
| `PORT` | API server port (default: 3001) | Yes |
| `APP_URL` | Application URL for Stripe checkout redirects (fallback: `NEXT_PUBLIC_APP_URL`) | No |
| `CORS_ORIGINS` | Comma-separated allowed origins | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST API URL (for distributed rate limiting) | No |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST API token | No |
| `ADMIN_API_KEY` | Admin API key for admin endpoints | Yes |

---

## 2. Content Pipeline Definition

### 2.1 Content Architecture

Tensorcraft uses a **Core + World Layer** architecture. All pedagogical content is authored once in a core layer, and world-specific wrappers provide narrative context, visual styling, and flavor text.

#### Core Layer

The core layer contains the canonical lesson content: explanations, code exercises, recall prompts, and learning objectives. It is world-agnostic and uses neutral language.

#### World Layer

Each world provides overrides and extensions:

- **Narrative wrappers:** Story context that introduces and frames each lesson.
- **Visual assets:** Illustrations, mascots, background patterns, color palettes.
- **Flavor copy:** World-specific tooltips, encouragement messages, error messages.
- **CSS overrides:** `@world` directive blocks that re-skin the UI.

#### Directory Structure

| Directory | Purpose | Example Path |
|-----------|---------|-------------|
| `packages/content/core/` | Core curriculum (world-agnostic MDX) | `core/module-01/lesson-01.mdx` |
| `packages/content/worlds/` | World narrative wrappers and flavor text | `worlds/cyberpunk/module-01/lesson-01-wrapper.mdx` |
| `packages/worlds/{name}/assets/` | World illustrations, SVGs, images | `worlds/cyberpunk/assets/mascot.svg` |
| `packages/worlds/{name}/css/` | World CSS with `@world` directive | `worlds/cyberpunk/css/world.css` |
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

### 2.4 World Manifest Specification

Each world is defined as a TypeScript `WorldManifest` object in `packages/worlds/src/<world>.ts`. The manifest drives the world selection UI, asset loading, and content resolution.

All worlds are available. No status field - world manifests contain only content and visual identity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique world identifier (e.g., `space`, `cyberpunk`) |
| `slug` | `string` | Yes | URL-friendly slug (e.g., `deep-orbit`) |
| `displayName` | `string` | Yes | Display name shown in the world picker |
| `tagline` | `string` | Yes | One-line description for the world selection card |
| `description` | `string` | Yes | Full description (narrative hook) |
| `palette` | `WorldPalette` | Yes | 9-key color palette: `bg`, `primary`, `accent`, `surface`, `surfaceOverlay`, `text`, `muted`, `border`, `codeBg`. Nova Canvas `primary` is `#D07070` (bumped from `#C06060` on 2026-04-20 to satisfy WCAG AA against `#232323` surface). Neon tokens (`--tc-glow`, `--tc-neon-glow`, `--tc-neon-line`) were removed from `worlds.css` during the brutalist redesign; world styling is driven entirely by the 9 palette keys plus shared brutalist utilities. |
| `terminology` | `WorldTerminology` | Yes | UI label overrides (`lesson`, `module`, `exercise`) |
| `protagonist` | `string` | Yes | Learner's role in the narrative |
| `characters` | `WorldCharacter[]` | Yes | Characters in the story (5 per world) |
| `specialization` | `string` | Yes | ML specialization area |
| `modelBuilt` | `string` | Yes | Model the learner builds |
| `careerPaths` | `string[]` | Yes | Relevant career paths with salary ranges |

#### World Selection UI Behavior

1. **First Visit:** Users are presented with the world picker as a full-screen modal during onboarding. All available worlds are shown as cards with preview image, name, tagline, and primary color accent.
2. **Selection:** Navigating to a world route (`/worlds/[slug]`) applies it immediately via CSS custom property injection on `<html data-world>` and stores the preference in `localStorage` (`tc-active-world`).
3. **Switching:** Users can switch worlds at any time from Settings. The switch is instant (CSS-only, no page reload) and persists across sessions.
4. **Fallback:** If a world does not yet have content for a specific lesson, the core (world-agnostic) version is rendered with a subtle banner: "This lesson is not yet available in your selected world. Showing the standard version."
5. **All Users:** World preference is stored in `localStorage` and applied via a FOUC-prevention script in `<head>`. The world persists across navigation until the user views a different world.

### Database Schema (Supabase / PostgreSQL)

Tables use Supabase Auth for user management. Row-Level Security (RLS) enforced on all tables.

#### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | References `auth.users.id` |
| email | text | Not null |
| display_name | text | Nullable |
| avatar_url | text | Nullable |
| preferred_world_id | text | Nullable (added in migration 002). Runtime world switching uses `localStorage` (`tc-active-world`) via client-side `WorldProvider`. This column is retained for potential server-side personalization but is not used for real-time world application. |
| github_connected | boolean | Default: `false` |
| github_username | text | Nullable |
| onboarding_completed | boolean | Default: `false` |
| role | user_role enum | `'user'` or `'admin'`, default: `'user'` (added in migration 006) |
| email_alerts | boolean | Default: `true` (added in migration 009) |
| weekly_digest | boolean | Default: `true` (added in migration 009) |
| experience_level | experience_level enum | `'beginner'` \| `'intermediate'` \| `'advanced'` \| `'expert'`, nullable (added in migration 018, captured in onboarding Step 2 - Background) |
| learning_goal | learning_goal enum | `'hobby'` \| `'career'` \| `'research'` \| `'team'` \| `'curiosity'`, nullable (added in migration 018, captured in onboarding Step 3 - Goal) |
| created_at | timestamptz | Default: `now()` |
| updated_at | timestamptz | Default: `now()` |

#### `purchases`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| plan_id | text | Not null |
| world_ids | text[] | Array of purchased world slugs, default: `'{}'` |
| amount | numeric(10,2) | Not null, must be > 0 |
| currency | text | Default: `'USD'` |
| stripe_session_id | text | Unique |
| status | purchase_status enum | `'pending'`, `'completed'`, `'failed'`, `'refunded'`; default: `'pending'` |
| created_at | timestamptz | Default: `now()` |

#### `world_progress`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| world_id | text | Not null |
| module_id | text | Not null |
| lesson_id | text | Not null |
| status | progress_status enum | `'not_started'`, `'in_progress'`, `'completed'`; default: `'not_started'` |
| score | numeric(5,2) | 0--100, nullable |
| hints_used | integer | Default: `0`, must be >= 0 |
| attempts | integer | Default: `0`, must be >= 0 |
| started_at | timestamptz | Nullable |
| completed_at | timestamptz | Nullable |
| created_at | timestamptz | Default: `now()` |
| updated_at | timestamptz | Default: `now()` |

**Unique constraint:** `(user_id, world_id, lesson_id)`

#### `waitlist`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| email | text | Not null |
| world_id | text | Nullable |
| source | text | Nullable |
| created_at | timestamptz | Default: `now()` |

**Unique constraint:** `(email, world_id)`

#### `streaks`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| world_id | text | Not null |
| current_streak | integer | Default: `0` |
| longest_streak | integer | Default: `0` |
| last_activity_date | date | Nullable |
| updated_at | timestamptz | Default: `now()` |

**Unique constraint:** `(user_id, world_id)`

#### `achievements`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| achievement_type | text | Not null |
| world_id | text | Nullable |
| unlocked_at | timestamptz | Default: `now()` |

**Unique constraint:** `(user_id, achievement_type, world_id)`

#### `exercise_attempts`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| exercise_slug | text | Not null |
| lesson_id | text | Not null |
| world_id | text | Not null |
| passed | boolean | Default: `false` |
| score | integer | 0--100, default: `0` |
| hints_used | integer | Default: `0`, must be >= 0 |
| solution_viewed | boolean | Default: `false` |
| submitted_code | text | Nullable |
| duration_ms | integer | Nullable, must be >= 0 |
| attempted_at | timestamptz | Default: `now()` |

#### `world_progress_summary` (view)

Aggregated completion stats per user per world for fast dashboard reads.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | uuid | Grouped key |
| world_id | text | Grouped key |
| total_lessons | bigint | Count of all progress records |
| completed_lessons | bigint | Count where status = `'completed'` |
| in_progress_lessons | bigint | Count where status = `'in_progress'` |
| first_started_at | timestamptz | Earliest `started_at` |
| last_completed_at | timestamptz | Latest `completed_at` |
| completion_percent | numeric | Rounded to 1 decimal place |

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
- World decorations (mascot, background patterns) are simplified or hidden on mobile to reduce visual clutter.

#### Device Testing

- Exercises are tested on iOS Safari 17+, Chrome Android 120+, and Samsung Internet 24+.
- Minimum supported screen width is 320px (iPhone SE).
- Touch event handling is validated on both iOS and Android to ensure code editing works smoothly.

---

## 4. Analytics Layer (Day One)

Product analytics capture consented pageviews and selected learning actions. Capture coverage, event delivery and independent learning evidence are separate checks. The current reporting definitions below supersede the earlier event proposals in this section.

### 4.1 Tool Selection

| Tool | Role | Justification |
|------|------|--------------|
| PostHog | Product analytics + feature flags | Open-source, self-hostable, generous free tier (1M events/mo), built-in session replay, feature flags, and A/B testing. Avoids vendor lock-in. |
| Supabase Analytics (pg_analytics) | Database-level reporting | Direct SQL queries on user progress data for content team dashboards. No additional tooling needed. |
| Vercel Analytics | Web Vitals + performance | Automatic Core Web Vitals tracking (LCP, FID, CLS) per route. Zero-config with Vercel hosting. |
| Sentry | Error tracking + performance | Real-time error monitoring with source maps. Sandpack errors are tagged separately from platform errors. |

### 4.2 Current event contract

The browser registry is `apps/web/lib/analytics-events.ts`. The server registry
is `apps/api/src/lib/posthog.ts`. `docs/analytics-verification.md` records
verification procedures and delivery limits. A registry entry alone does not
establish that its producer or deployed capture has been verified.

#### Learning and engagement signals

| Event | Current properties | Meaning and limits |
| --- | --- | --- |
| `lesson_started` | `worldId`, `moduleId`, `lessonId` | The current lesson visit reaches analytics after consent is ready. Late consent observes the current visit without replaying earlier visits. |
| `lesson_step_viewed` | Context IDs, `step`, `stepName`, `stepsVersion`, `revisit`, optional `prevStep` and `prevStepMs` | A reader step becomes active. Separate first visits, revisits and reader versions. |
| `lesson_completed` | Context IDs, optional `durationMs` and `hintsUsed` | The reader enters the Epilogue during this session. This records navigation/completion, not independent mastery. |
| `experiment_started` | `worldId`, `lessonId`, `experimentId`, `contentVersion` | A learner starts an interactive concept activity. |
| `experiment_submitted` | Experiment context, `phase`, `attempt`, `correct`, `assisted` | A prediction or changed-case submission. Keep assisted and unassisted results separate. |
| `exercise_attempted` | `worldId`, `lessonId`, `exerciseSlug`, `passed`, `score`, optional `durationMs`, `hintsUsed` and `errored` | A graded run, including failed, crashed or timed-out runs. This is the attempt denominator. |
| `exercise_completed` | Exercise context, `score`, optional `hintsUsed` | A passing graded run. Repeated passes can emit this event, so it is not a unique first-completion count. |
| `hint_requested` | Optional exercise/lesson/world context, `hintLevel` | A hint reveal. Solution-view evidence also needs the relevant progress records. |
| `checkpoint_submitted` | Optional context, `checkpointId`, `passed`, `attempts` | An in-lesson checkpoint submission. |
| `recall_answered` | Optional context and `action` | A recall interaction. Self-reported recall is separate from graded exercise performance. |
| `module_completed` | `worldId`, `moduleId`, `lessonsCount` | Entering the Epilogue completes the observed module. Restored mounts do not invent new completions. Deployed delivery remains a verification task. |
| `learning_route_selected` | `worldId`, `route`, `source`, `persistence` | A choice of guided or Challenge route. |
| `session_started`, `session_ended` | Custom `sessionId`, optional `userId`; end includes `durationMs` | One consented visible interval. This custom identifier differs from the SDK's session identifier. |
| `script_skipped`, `script_finished` | Context, timing, `via` or `run`, optional `briefingVariant` | Narrative playback observations. Reduced-motion visits need their own interpretation. |
| `scene_clip_played`, `scene_clip_completed` | Context, `trigger` or `watchedMs` | Scene-video playback observations, separate from lesson completion. |

#### Acquisition and payment signals

| Event | Current properties | Meaning and limits |
| --- | --- | --- |
| `free_lesson_cta_clicked` | `source`, optional `guideSlug`, `targetLesson`, `placement` | A free-lesson handoff. Page/placement context does not establish external acquisition. |
| `pricing_page_viewed` | `entryContext`, optional legacy `source` and `lockedWorldId` | Pricing context such as a locked-lesson redirect. Legacy `source=direct` is not direct acquisition. |
| `paywall_hit` | `worldId`, `moduleId`, optional `lessonId` | The pricing redirect records a restricted lesson visit. |
| `checkout_started` | `planId`, optional `worldIds` and `price` | Paid intent. It does not establish payment settlement. |
| `signup_started`, `magic_link_sent`, `signup_failed` | Authentication `method` | Authentication intent and delivery/failure observations. |
| `signup_completed` | Reserved `method` contract | No authoritative account-creation producer is implemented. Generic `SIGNED_IN` callbacks no longer emit registrations. Signup-cohort metrics remain unavailable. |
| `payment_completed` | `planId`, `worldIds`, checkout `sessionId`, `eventSource`, `analyticsVersion`, Stripe IDs, `amountMinor`, `currency`, `livemode`, `paymentKind`, legacy `amount` | The consent-gated Stripe webhook captures settlement evidence. Browser receipt-page events are historical and do not establish transactions. |
| `purchase_access_granted` | `planId`, `worldIds`, `grantId`, `reason` | An upgrade covered entirely by credit, separate from a cash charge. |
| `payment_refunded` | Checkout and charge linkage, `eventSource`, `analyticsVersion`, `livemode`, `currency`, cumulative `amountRefundedMinor` | A refund snapshot. Deduplicate by charge and retain the latest cumulative value rather than summing snapshots. |
| `payment_failed`, `payment_disputed` | Relevant checkout/payment linkage | Server-side failure or dispute evidence. |
| `code_pushed` | World, lesson, exercise and commit context | A successful solution-code push, separate from learning quality. |

There are no current `exercise_started`, `exercise_submitted`,
`checkout_completed`, `checkout_abandoned`, `paywall_shown`, `world_switched`,
`session_duration` or `github_commit_pushed` events in these registries. Use the
implemented contracts above and verify producers before creating a report.

### Lesson phase telemetry (reader version 2, October 6)

`lesson_step_viewed.stepsVersion = 2` identifies the five-phase reader:
Briefing 0, Concept 1, Challenge 2, Takeaways 3, Epilogue 4. Analytics retains
`stepName: "Consequence"` for Epilogue. Events without `stepsVersion` use the
legacy six-phase numbering, including Code at 2 and Consequence at 5.

For first-view funnels, count `revisit=false` per `(stepsVersion, step)`.
For dwell, group `prevStepMs` by `(stepsVersion, prevStep)`. Never combine
numeric phase indices across versions. Use semantic names for comparisons,
while accounting for the new Concept containing both teaching and code.
Restoring saved progress does not emit a new completion or invent visits to
skipped phases. The baseline script separates versions in both queries.

### 4.3 Reporting definitions and coverage

Earlier draft thresholds were design proposals, not validated decision rules.
These definitions describe available signals and the evidence needed to use
them. Deployed event checks and sufficient observed cohorts remain necessary.

| Measure | Current definition | Coverage and interpretation |
| --- | --- | --- |
| Lesson completion | Unique observed lesson journeys that complete divided by matching starts in a defined cohort/window. | Raw completion/start counts alone do not match journeys. Resumed visits, consent and missing capture affect coverage. |
| Graded-run pass proportion | `exercise_attempted` rows with `passed=true` divided by all observed `exercise_attempted` rows for the same exercise/window. | Include failed/crashed attempts. Report assisted attempts separately where help records support the join. This is not an earned-pass or mastery rate. |
| Attempts to first observed pass | Order `exercise_attempted` by person/exercise and time, then count runs through the first observed `passed=true`. | No `attemptNumber` is emitted. A window that omits earlier attempts is censored and cannot establish lifetime attempts to pass. |
| Hint use on passing runs | Passing exercise runs with known `hintsUsed>0` divided by passing runs with known `hintsUsed`. | Missing hint properties remain unknown. Solution-view/earned-pass analysis also uses Supabase evidence. |
| Guide-to-attempt | Consented guide SDK sessions with a matching handoff and submitted activity divided by eligible consented guide sessions. | Keep the matching lesson and SDK session. `experiment_submitted.correct` differs from `exercise_attempted.passed`. |
| Free-module completion | Verified `module_completed` for Deep Orbit foundations in the declared observed population. | Check guest/account delivery and deduplication before interpreting a completion rate. |
| Consented cash evidence | Version 2 Stripe-webhook `payment_completed` with `livemode=true`, `paymentKind=cash`, valid checkout ID, known positive minor-unit amount and currency, deduplicated by checkout. | Group currencies separately. Exclude known internal/test activity. This analytics subset is not total settled revenue or a browser conversion denominator. |
| Authoritative purchases and refunds | Reconciled Stripe/purchase records, with refund charge linkage and latest cumulative refund amount. | Report all settlements, no-charge/credit grants, tests and unknown acquisition separately. Never sum currencies or cumulative refund snapshots. |
| Signup conversion and signup retention | Unavailable until an authoritative deduplicated account-creation signal exists. | Do not substitute returning sign-ins for registrations or publish a signup denominator from the reserved event. |

The Module 1 script requires explicit UTC date bounds and offers a key-free
query preview:

```bash
node scripts/analytics/module1-baseline.mjs --since 2026-11-11 --until 2026-11-15 --dry-run
```

`--since` includes midnight UTC and `--until` excludes midnight UTC. Execution
requires `POSTHOG_PERSONAL_API_KEY` and numeric `POSTHOG_PROJECT_ID`. The dry run
makes no requests and prints no credential. Browser reports require an explicit
`tc_internal=false` marker, an exact production host and no positive test/person
or verification flag. Unmarked historical events remain unclassified. Server
payment reports retain missing browser host/marker properties while excluding
positive internal/test evidence. Inspect the population-coverage tables before
interpreting a change.

The script reports raw observations and deduplicated consented cash evidence.
It does not calculate a purchase funnel by dividing server payments by browser
starts. It excludes conflicting checkout amount/currency snapshots pending
reconciliation. A false internal marker cannot prove that the owner remembered
to mark every testing browser. The optional checkout-source question remains
disabled by owner choice.

Recrawl assessment: this reporting-script and internal-spec update changes no
public website URL. No indexing request is needed for these files.

### 4.4 Data Pipeline

#### PostHog Setup

- **Instance:** PostHog Cloud in the EU region. Hosting region alone does not establish that collection and consent behavior meet the project policy.
- **Client SDK:** `posthog-js` initialized in `apps/web/lib/posthog.ts`, called from the consent-gated `apps/web/app/components/analytics-provider.tsx`. `apps/web/lib/analytics-events.ts` (`track()`) ensures all events pass through a single typed interface.
- **Server-side:** The Hono API (`apps/api`) uses `posthog-node` for consent-gated server events, including Stripe `payment_completed` and solution `code_pushed`. The current server contract owns settlement fields.
- **Feature Flags:** PostHog feature flags gate new content and UI experiments. Flags are evaluated server-side in Next.js middleware for instant page-level gating.
- **Session Replay:** Off since 2026-11-12. `apps/web/lib/posthog.ts` passes `disable_session_recording: true`, `enable_heatmaps: false` and `enable_recording_console_log: false`, so the web SDK records no replays whatever the project setting says. The privacy policy covers pageviews and product events only. Turning replay on requires a policy disclosure and a new consent version first (`docs/post-launch-backlog.md` B0).
- **Data Retention:** Raw events retained for 12 months. Aggregated metrics retained indefinitely.
- **Data minimization:** Product events should omit names and email addresses. Identified users use their Supabase UUID. `ph-no-capture` protects relevant rendered elements, but it does not remove names from page-title properties. Certificate-title and geolocation behavior remain explicit verification/minimization tasks. Replay, heatmaps and console recording stay disabled. Keep contact-based analysis separate from product events.

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

**Retroactive push:** When a user connects GitHub after completing lessons, the system queues all completed lesson artifacts for push in chronological order. Each lesson is committed as a separate commit with the original completion timestamp in the commit message (e.g., "M1L3: Pattern Recognition - completed 2026-03-08"). The push runs as a background job, with a progress indicator shown in Settings. If the repository already contains conflicting files, the system creates a new branch `tensorcraft/retroactive-sync` and opens a PR.

### 5.4 Repo Structure

When a user connects GitHub, Tensorcraft creates (or uses) a repository with the following structure:

| Path | Content | Creation Timing |
|------|---------|----------------|
| `README.md` | Auto-generated repo overview with learning progress badge and module list | Created on first commit; updated on each subsequent commit |
| `.tensorcraft/config.json` | Repo metadata: `userId`, `worldId`, `createdAt`, platform version | Created on first commit |
| `module-01/` | Directory for Module 1 exercises | Created when first Module 1 exercise is committed |
| `module-01/exercise-01.py` | Completed exercise code | Created when exercise is completed and saved |
| `module-01/exercise-01.test.py` | Test file that validates the exercise (read-only reference) | Created alongside exercise code |
| `module-01/README.md` | Module overview: title, objectives, completion status | Created with first exercise in the module; updated on each commit |
| `PROGRESS.md` | Markdown table of all completed exercises with dates and attempt counts | Created on first commit; appended on each subsequent commit |

**Repository naming:** `tensorcraft-{world-slug}` (e.g., `tensorcraft-deep-orbit`). The internal project folder within the repo uses the world-specific project name from the curriculum (e.g., `deep-scan-signal-classifier` for Deep Orbit).

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
| World system (CSS `@world` + manifest) | Weeks 2--3 | Tailwind CSS 4 setup, design tokens | World-specific content wrappers |
| GitHub commit flow | Weeks 4--5 | GitHub App registration, GraphQL client | Mod 04 Lesson 15 (capstone) |
| Progress tracking API | Weeks 2--3 | Supabase schema, Hono API routes | Lesson/exercise completion tracking |

---

## 7. UI Components, Visualizations, and Accessibility

This section documents the shared UI surface landed during the Phase 11 brutalist redesign (2026-04-13 → 2026-04-20). It is the canonical component inventory and import reference for engineers working on `apps/web`.

### 7.1 `@tensorcraft/ui` Subpath Exports

The shared UI package ships three subpath entry points in addition to the root. Import the narrowest path that serves the use case - tree-shaking works per-entry.

| Import | Purpose | Contents |
| --- | --- | --- |
| `@tensorcraft/ui` | Core primitives | `Button`, `Card`, `Modal`, `CodeBlock`, `ProgressBar`, and other world-aware building blocks |
| `@tensorcraft/ui/visualizations` | SVG data visualizations | `SkillRadar`, `LossCurve` |
| `@tensorcraft/ui/effects` | Background / ambient effects | `ParticleField`, `BridgeTicker` |
| `@tensorcraft/ui/a11y` | Accessibility primitives | `FocusTrap` |

Example:

```ts
import { Button } from '@tensorcraft/ui'
import { SkillRadar, LossCurve } from '@tensorcraft/ui/visualizations'
import { ParticleField, BridgeTicker } from '@tensorcraft/ui/effects'
import { FocusTrap } from '@tensorcraft/ui/a11y'
```

### 7.2 Visualization Components

| Component | Location | Purpose |
| --- | --- | --- |
| `SkillRadar` | `@tensorcraft/ui/visualizations` | Reusable hexagonal skill radar SVG. Consumers pass an array of `{ label, value }` and palette colors. |
| `SkillGenome` | `apps/web/app/dashboard/skill-genome.tsx` | Dashboard-specific wrapper around `SkillRadar` that renders the learner's live skill distribution. Shares a `hexCorners` helper with `SkillRadar` to keep geometry identical across surfaces. |
| `LossCurve` | `@tensorcraft/ui/visualizations` | Animated SVG line chart for training-loss visualization on the dashboard and capstone pages. |
| `ParticleField` | `@tensorcraft/ui/effects` | Canvas particle atmosphere used on the landing hero, auth pages, and per-world selection cards. Respects `prefers-reduced-motion`. |
| `BridgeTicker` | `@tensorcraft/ui/effects` | Horizontal scrolling ticker of JS-to-ML bridge statements used as ambient marketing flavor. |
| `SceneCanvas` | `@tensorcraft/ui/effects` | Shared chrome for time-parameterized scene renderers: own clock, eased 0..1 hover amount with an `intensity` resting floor (page backdrops have no hover, so they'd otherwise idle at their faintest), IntersectionObserver + reduced-motion gating (static frame when reduced). `OrbitCanvas` is `drawOrbit` on this chrome. |
| World scenes (`drawNeonProtocol`, `drawSignalWard`, `drawNovaCanvas`, `drawTerraGrid`) | `@tensorcraft/ui/effects` | Signature per-world animations on the landing five-worlds strip and the `/worlds` card grid, siblings of `drawOrbit`: city scanned by a vision HUD, token rows with attention arcs over an EKG, a diffusion loop condensing noise into a nova bloom, a perspective edge-mesh grid with node pings. Ambient-faint at rest; hover/focus ignites them. Geometry is a pure function of `t` (hover styles only) - enforced by `world-scenes.test.ts`. |

**Removed / deferred:**

- `LossLandscape` - deferred after Phase 11 (complexity vs. pedagogical value). Replaced on auth pages by `ParticleField`.
- `ActivityHeatmap` - deferred per §5b audit. Daily activity is now surfaced via the `GET /api/progress/activity/daily` endpoint and a simpler streak strip on the dashboard; full GitHub-style heatmap is post-V1.0.
- ARIA dual-robot narrator - cut 2026-04-20. Narrative assistance now relies on inline world-specific character copy (MEDI, NEON, MUSE, GRID, ARIA-as-in-lesson-character) rather than a persistent dual-robot narrator widget.

### 7.3 Accessibility Conventions

**SVG visualizations** (`SkillRadar`, `LossCurve`, `SkillGenome`, progress diagrams):

- Root `<svg>` carries `role="img"` plus both `aria-labelledby` and `aria-describedby` pointing at id'd `<title>` and `<desc>` children (first two children of the SVG).
- `<title>` gives a short name ("Skill genome for ML fundamentals"). `<desc>` gives a one-sentence summary of the data being displayed.
- Decorative particle backgrounds use `aria-hidden="true"`.

**Dialogs / modals / paywall sheets:**

- Wrap with `FocusTrap` from `@tensorcraft/ui/a11y`. It captures Tab/Shift+Tab cycling, restores focus on close, and pairs with `aria-modal="true"` + `role="dialog"`.
- The trigger element must receive focus on dismiss; `FocusTrap` exposes a `restoreFocus` prop for the origin element.

**Focus styling (universal):**

- Every interactive element uses the pattern `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`. No `focus:ring-*` - brutalist outlines only.

### 7.4 Brutalist CSS Conventions

The Phase 11 redesign replaced the prior "Zensman DeFi Neon" direction (glows, gradients, rounded corners) with a brutalist terminal aesthetic.

| Rule | Convention |
| --- | --- |
| Corners | `rounded-none` everywhere. No `rounded-md`, `rounded-lg`, etc. |
| Shadows | Hard offset shadows only, never `shadow-lg` or blurred shadows. The utility `.brutalist-shadow` is `4px 4px 0 var(--tc-primary)`. On the lesson page it marks only containers the learner acts in (the exercise pane, the recall and warm-up cards, the hint ladder, the decision boxes, the quiz, the interactive demo); presenting blocks sit on their hairline border (spec 2026-09-24, section 7). |
| Hover | `.brutalist-hover` - a combined translate + shadow shift on hover to preserve the offset-shadow effect. |
| Comment labels | `.comment-label` - uppercase, tracking-wider, JetBrains Mono, muted color. Used for section headers like `# skill_genome`, `// loss.hints`, ` - 12wk`. |
| Focus | `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (see §7.3). |
| Glow effects | Removed. Tokens `--tc-glow`, `--tc-neon-glow`, `--tc-neon-line` were deleted from `worlds.css` 2026-04-13 → 2026-04-20. |

### 7.5 Settings & Onboarding Routes

- **Onboarding** (`/onboarding`) - 5 steps: Welcome → Background → Goal → World → Ready. Persisted via `PATCH /api/onboarding` with `experience_level` and `learning_goal` enum fields (see §1.3 API notes and the `profiles` schema).
- **Paywall** (`/paywall`) - standalone locked-content route; complements the `/pricing?locked=<world>` banner used for deep-links.
- **Settings** (`/settings`) - 5-tab layout: Profile / Notifications / GitHub / World / Account.
- **Capstone completion** - triggers `POST /api/certificates` to generate the learner's verifiable certificate; the returned id is rendered on the capstone page and is publicly retrievable via `GET /api/certificates/:id`.

---

## 8. Internationalization [DESCOPED TO POST-V1.0]

> **Status: Descoped** - Internationalization is deferred to post-V1.0. The platform will launch as English-only. The architectural notes below are retained for future reference when i18n work begins.

### 7.1 Architecture (English Only at Launch)

Tensorcraft launches with English-only content. However, the architecture is designed from day one to support multiple languages without refactoring.

**Principles:**

- **No hardcoded strings:** All UI strings (buttons, labels, error messages, tooltips) are externalized to locale files using `next-intl` (or a similar i18n library compatible with Next.js App Router).
- **Locale-aware routing:** URL structure supports locale prefixes: `/{locale}/learn/{world}/{module}/{lesson}`. English uses the default (no prefix) for SEO continuity.
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

### 7.3 Per-World, Per-Language Publishing

Content availability is a matrix of `world x locale`. Not all worlds will be available in all languages simultaneously.

- **Publishing matrix:** A configuration file (`packages/content/publishing-matrix.json`) defines which `(world, locale)` pairs are published.
- **Fallback chain:** If a lesson is not available in the user's selected `(world, locale)` pair, the system falls back in this order:
  1. Same world, English locale.
  2. Core (no world), user's locale.
  3. Core (no world), English locale.
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

*End of Technical Specification v3.3*
