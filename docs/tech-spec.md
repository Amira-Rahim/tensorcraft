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
> - `POST /api/certificates` --- Generate a completion certificate for a user + theme (called automatically from the capstone page on completion). Returns the certificate id + verification URL.
> - `GET /api/certificates/:id` --- Public, unauthenticated fetch of a certificate payload for verification rendering.
> - `GET /api/progress/activity/daily` --- Daily lesson/exercise activity buckets for dashboard and streak display.
> - `PATCH /api/onboarding` --- Persists the 5-step onboarding state. Accepts `experience_level` (enum: `beginner` | `intermediate` | `advanced` | `expert`) and `learning_goal` (enum: `hobby` | `career` | `research` | `team` | `curiosity`) per migration 018, in addition to the existing `display_name`, `github_username`, and `preferred_theme_id` fields.
>
> **Note:** Tailwind CSS 4 (not Tailwind + CSS Modules) is used with the `@theme` directive for CSS-native theming. Theme tokens are defined in CSS custom properties and consumed via `@theme` blocks, eliminating the need for JavaScript-based theme switching or CSS Modules. Each theme package exports a CSS file with its `@theme` overrides.

### 1.2 Monorepo Structure

| Package | Purpose | Key Contents |
|---------|---------|-------------|
| `apps/web` | Next.js 15 frontend application | Pages, layouts, route groups, client components, MDX rendering |
| `apps/api` | Hono backend service | REST endpoints, middleware, auth callbacks, Stripe webhooks, Supabase client |
| `packages/ui` | Shared UI component library (`@tensorcraft/ui`) | Design system primitives (Button, Card, Modal, CodeBlock, ProgressBar) plus subpath exports: `./visualizations` (SkillRadar, LossCurve), `./effects` (ParticleField, BridgeTicker), `./a11y` (FocusTrap). See §7 for component inventory. |
| `packages/config` | Shared configuration | TypeScript configs, ESLint presets, Tailwind theme tokens, shared constants |
| `packages/supabase` | Database layer | Schema migrations, seed data, typed client, RLS policies, Edge Functions |
| `packages/themes` | Theme asset packages | Per-theme CSS (`@theme` overrides), illustrations, mascot SVGs, copy variants |
| `packages/content` | Content source files | MDX lessons, exercise definitions, frontmatter schemas, validation scripts |
| `packages/analytics` | Analytics abstraction | Event definitions, PostHog client wrapper, type-safe tracking functions |
| `packages/github` | GitHub integration module | GitHub App client, GraphQL mutations, commit builders, repo scaffolding |

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

Tensorcraft uses a **Core + Theme Layer** architecture. All pedagogical content is authored once in a core layer, and theme-specific wrappers provide narrative context, visual styling, and flavor text.

#### Core Layer

The core layer contains the canonical lesson content: explanations, code exercises, recall prompts, and learning objectives. It is theme-agnostic and uses neutral language.

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

Each theme is defined as a TypeScript `ThemeManifest` object in `packages/themes/src/<theme>.ts`. The manifest drives the theme selection UI, asset loading, and content resolution.

All themes are available. No status field — theme manifests contain only content and visual identity.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` | Yes | Unique theme identifier (e.g., `space`, `cyberpunk`) |
| `slug` | `string` | Yes | URL-friendly slug (e.g., `deep-orbit`) |
| `displayName` | `string` | Yes | Display name shown in the theme picker |
| `tagline` | `string` | Yes | One-line description for the theme selection card |
| `description` | `string` | Yes | Full description (narrative hook) |
| `palette` | `ThemePalette` | Yes | 9-key color palette: `bg`, `primary`, `accent`, `surface`, `surfaceOverlay`, `text`, `muted`, `border`, `codeBg`. Nova Canvas `primary` is `#D07070` (bumped from `#C06060` on 2026-04-20 to satisfy WCAG AA against `#232323` surface). Neon tokens (`--tc-glow`, `--tc-neon-glow`, `--tc-neon-line`) were removed from `themes.css` during the brutalist redesign; theme styling is driven entirely by the 9 palette keys plus shared brutalist utilities. |
| `terminology` | `ThemeTerminology` | Yes | UI label overrides (`lesson`, `module`, `exercise`) |
| `protagonist` | `string` | Yes | Learner's role in the narrative |
| `sandpackTheme` | `string` | Yes | Sandpack editor color theme |
| `characters` | `ThemeCharacter[]` | Yes | Characters in the story (5 per theme) |
| `specialization` | `string` | Yes | ML specialization area |
| `modelBuilt` | `string` | Yes | Model the learner builds |
| `careerPaths` | `string[]` | Yes | Relevant career paths with salary ranges |

#### Theme Selection UI Behavior

1. **First Visit:** Users are presented with the theme picker as a full-screen modal during onboarding. All available themes are shown as cards with preview image, name, tagline, and primary color accent.
2. **Selection:** Navigating to a theme route (`/themes/[slug]`) applies it immediately via CSS custom property injection on `<html data-theme>` and stores the preference in `localStorage` (`tc-active-theme`).
3. **Switching:** Users can switch themes at any time from Settings. The switch is instant (CSS-only, no page reload) and persists across sessions.
4. **Fallback:** If a theme does not yet have content for a specific lesson, the core (unthemed) version is rendered with a subtle banner: "This lesson is not yet available in your selected theme. Showing the standard version."
5. **All Users:** Theme preference is stored in `localStorage` and applied via a FOUC-prevention script in `<head>`. The theme persists across navigation until the user views a different theme.

### Database Schema (Supabase / PostgreSQL)

Tables use Supabase Auth for user management. Row-Level Security (RLS) enforced on all tables.

#### `profiles`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | References `auth.users.id` |
| email | text | Not null |
| display_name | text | Nullable |
| avatar_url | text | Nullable |
| preferred_theme_id | text | Nullable (added in migration 002). Runtime theme switching uses `localStorage` (`tc-active-theme`) via client-side `ThemeProvider`. This column is retained for potential server-side personalization but is not used for real-time theme application. |
| github_connected | boolean | Default: `false` |
| github_username | text | Nullable |
| onboarding_completed | boolean | Default: `false` |
| role | user_role enum | `'user'` or `'admin'`, default: `'user'` (added in migration 006) |
| email_alerts | boolean | Default: `true` (added in migration 009) |
| weekly_digest | boolean | Default: `true` (added in migration 009) |
| experience_level | experience_level enum | `'beginner'` \| `'intermediate'` \| `'advanced'` \| `'expert'`, nullable (added in migration 018, captured in onboarding Step 2 — Background) |
| learning_goal | learning_goal enum | `'hobby'` \| `'career'` \| `'research'` \| `'team'` \| `'curiosity'`, nullable (added in migration 018, captured in onboarding Step 3 — Goal) |
| created_at | timestamptz | Default: `now()` |
| updated_at | timestamptz | Default: `now()` |

#### `purchases`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| plan_id | text | Not null |
| theme_ids | text[] | Array of purchased theme slugs, default: `'{}'` |
| amount | numeric(10,2) | Not null, must be > 0 |
| currency | text | Default: `'USD'` |
| stripe_session_id | text | Unique |
| status | purchase_status enum | `'pending'`, `'completed'`, `'failed'`, `'refunded'`; default: `'pending'` |
| created_at | timestamptz | Default: `now()` |

#### `theme_progress`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| theme_id | text | Not null |
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

**Unique constraint:** `(user_id, theme_id, lesson_id)`

#### `waitlist`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| email | text | Not null |
| theme_id | text | Nullable |
| source | text | Nullable |
| created_at | timestamptz | Default: `now()` |

**Unique constraint:** `(email, theme_id)`

#### `streaks`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| theme_id | text | Not null |
| current_streak | integer | Default: `0` |
| longest_streak | integer | Default: `0` |
| last_activity_date | date | Nullable |
| updated_at | timestamptz | Default: `now()` |

**Unique constraint:** `(user_id, theme_id)`

#### `achievements`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| achievement_type | text | Not null |
| theme_id | text | Nullable |
| unlocked_at | timestamptz | Default: `now()` |

**Unique constraint:** `(user_id, achievement_type, theme_id)`

#### `exercise_attempts`

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid (PK) | |
| user_id | uuid (FK) | References `profiles.id` |
| exercise_slug | text | Not null |
| lesson_id | text | Not null |
| theme_id | text | Not null |
| passed | boolean | Default: `false` |
| score | integer | 0--100, default: `0` |
| hints_used | integer | Default: `0`, must be >= 0 |
| solution_viewed | boolean | Default: `false` |
| submitted_code | text | Nullable |
| duration_ms | integer | Nullable, must be >= 0 |
| attempted_at | timestamptz | Default: `now()` |

#### `theme_progress_summary` (view)

Aggregated completion stats per user per theme for fast dashboard reads.

| Column | Type | Notes |
| --- | --- | --- |
| user_id | uuid | Grouped key |
| theme_id | text | Grouped key |
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
| `checkout_started` | `planId`, `source` | User clicks "Purchase" and Stripe Checkout opens |
| `checkout_completed` | `planId`, `revenue`, `currency`, `couponCode` | Stripe webhook confirms successful payment |
| `checkout_abandoned` | `planId`, `source`, `timeOnCheckoutSeconds` | User closes Stripe Checkout without completing |
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

## 7. UI Components, Visualizations, and Accessibility

This section documents the shared UI surface landed during the Phase 11 brutalist redesign (2026-04-13 → 2026-04-20). It is the canonical component inventory and import reference for engineers working on `apps/web`.

### 7.1 `@tensorcraft/ui` Subpath Exports

The shared UI package ships three subpath entry points in addition to the root. Import the narrowest path that serves the use case — tree-shaking works per-entry.

| Import | Purpose | Contents |
| --- | --- | --- |
| `@tensorcraft/ui` | Core primitives | `Button`, `Card`, `Modal`, `CodeBlock`, `ProgressBar`, and other theme-aware building blocks |
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
| `ParticleField` | `@tensorcraft/ui/effects` | Canvas particle atmosphere used on the landing hero, auth pages, and per-theme selection cards. Respects `prefers-reduced-motion`. |
| `BridgeTicker` | `@tensorcraft/ui/effects` | Horizontal scrolling ticker of FE→ML bridge statements used as ambient marketing flavor. |
| `SceneCanvas` | `@tensorcraft/ui/effects` | Shared chrome for time-parameterized scene renderers: own clock, eased 0..1 hover amount, IntersectionObserver + reduced-motion gating (static frame when reduced). `OrbitCanvas` is `drawOrbit` on this chrome. |
| Theme scenes (`drawNeonProtocol`, `drawSignalWard`, `drawNovaCanvas`, `drawTerraGrid`) | `@tensorcraft/ui/effects` | Signature per-world animations on the landing five-worlds strip, siblings of `drawOrbit`: city scanned by a vision HUD, token rows with attention arcs over an EKG, a diffusion loop condensing noise into a nova bloom, a perspective edge-mesh grid with node pings. Ambient-faint at rest; hover/focus ignites them. Geometry is a pure function of `t` (hover styles only) — enforced by `theme-scenes.test.ts`. |

**Removed / deferred:**

- `LossLandscape` — deferred after Phase 11 (complexity vs. pedagogical value). Replaced on auth pages by `ParticleField`.
- `ActivityHeatmap` — deferred per §5b audit. Daily activity is now surfaced via the `GET /api/progress/activity/daily` endpoint and a simpler streak strip on the dashboard; full GitHub-style heatmap is post-V1.0.
- ARIA dual-robot narrator — cut 2026-04-20. Narrative assistance now relies on inline theme-specific character copy (MEDI, NEON, MUSE, GRID, ARIA-as-in-lesson-character) rather than a persistent dual-robot narrator widget.

### 7.3 Accessibility Conventions

**SVG visualizations** (`SkillRadar`, `LossCurve`, `SkillGenome`, progress diagrams):

- Root `<svg>` carries `role="img"` plus both `aria-labelledby` and `aria-describedby` pointing at id'd `<title>` and `<desc>` children (first two children of the SVG).
- `<title>` gives a short name ("Skill genome for ML fundamentals"). `<desc>` gives a one-sentence summary of the data being displayed.
- Decorative particle backgrounds use `aria-hidden="true"`.

**Dialogs / modals / paywall sheets:**

- Wrap with `FocusTrap` from `@tensorcraft/ui/a11y`. It captures Tab/Shift+Tab cycling, restores focus on close, and pairs with `aria-modal="true"` + `role="dialog"`.
- The trigger element must receive focus on dismiss; `FocusTrap` exposes a `restoreFocus` prop for the origin element.

**Focus styling (universal):**

- Every interactive element uses the pattern `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`. No `focus:ring-*` — brutalist outlines only.

### 7.4 Brutalist CSS Conventions

The Phase 11 redesign replaced the prior "Zensman DeFi Neon" direction (glows, gradients, rounded corners) with a brutalist terminal aesthetic.

| Rule | Convention |
| --- | --- |
| Corners | `rounded-none` everywhere. No `rounded-md`, `rounded-lg`, etc. |
| Shadows | Hard offset shadows only. Use utility `.brutalist-shadow` (e.g., `4px 4px 0 var(--tc-border)`), never `shadow-lg` / blurred shadows. |
| Hover | `.brutalist-hover` — a combined translate + shadow shift on hover to preserve the offset-shadow effect. |
| Comment labels | `.comment-label` — uppercase, tracking-wider, JetBrains Mono, muted color. Used for section headers like `# skill_genome`, `// loss.hints`, `— 12wk`. |
| Focus | `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` (see §7.3). |
| Glow effects | Removed. Tokens `--tc-glow`, `--tc-neon-glow`, `--tc-neon-line` were deleted from `themes.css` 2026-04-13 → 2026-04-20. |

### 7.5 Settings & Onboarding Routes

- **Onboarding** (`/onboarding`) — 5 steps: Welcome → Background → Goal → Theme → Ready. Persisted via `PATCH /api/onboarding` with `experience_level` and `learning_goal` enum fields (see §1.3 API notes and the `profiles` schema).
- **Paywall** (`/paywall`) — standalone locked-content route; complements the `/pricing?locked=<theme>` banner used for deep-links.
- **Settings** (`/settings`) — 5-tab layout: Profile / Notifications / GitHub / Theme / Account.
- **Capstone completion** — triggers `POST /api/certificates` to generate the learner's verifiable certificate; the returned id is rendered on the capstone page and is publicly retrievable via `GET /api/certificates/:id`.

---

## 8. Internationalization [DESCOPED TO POST-V1.0]

> **Status: Descoped** — Internationalization is deferred to post-V1.0. The platform will launch as English-only. The architectural notes below are retained for future reference when i18n work begins.

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

*End of Technical Specification v3.3*
